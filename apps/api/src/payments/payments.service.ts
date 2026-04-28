import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import { UsersService } from "../users/users.service";

@Injectable()
export class PaymentsService {
  private readonly stripe: StripeClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService
  ) {
    this.stripe = createStripeClient(this.configService.getOrThrow<string>("STRIPE_SECRET_KEY"));
  }

  async createCheckoutSession(userId: string): Promise<{ url: string }> {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: this.configService.getOrThrow<string>("STRIPE_PRO_PRICE_ID"),
          quantity: 1
        }
      ],
      client_reference_id: user._id.toString(),
      customer_email: user.email,
      metadata: {
        userId: user._id.toString()
      },
      subscription_data: {
        metadata: {
          userId: user._id.toString()
        }
      },
      success_url: `${this.webOrigin}/profile?checkout=success`,
      cancel_url: `${this.webOrigin}/profile?checkout=cancelled`
    });

    if (!session.url) {
      throw new BadRequestException("Checkout session URL was not created");
    }

    return { url: session.url };
  }

  async getSubscription(userId: string): Promise<{ subscription: SubscriptionSummary | null; nextBillingDate: string | null }> {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const customer = await this.findOrCreateCustomer(user.email, userId);

    const subscriptions = await this.stripe.subscriptions.list({
      customer: customer.id,
      limit: 1,
      status: "active"
    });

    if (subscriptions.data.length === 0) {
      return { subscription: null, nextBillingDate: null };
    }

    const subscription = subscriptions.data[0] as StripeSubscription;
    const nextBillingDate = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null;

    return {
      subscription: {
        id: subscription.id,
        status: subscription.status,
        priceId: subscription.items.data[0]?.price.id ?? null
      },
      nextBillingDate
    };
  }

  async cancelSubscription(userId: string): Promise<void> {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const customer = await this.findOrCreateCustomer(user.email, userId);

    const subscriptions = await this.stripe.subscriptions.list({
      customer: customer.id,
      limit: 1,
      status: "active"
    });

    if (subscriptions.data.length === 0) {
      throw new BadRequestException("No active subscription found");
    }

    const subscription = subscriptions.data[0];

    await this.stripe.subscriptions.cancel(subscription.id);

    await this.usersService.updatePlanById(userId, "free");
  }

  private async findOrCreateCustomer(email: string, userId: string): Promise<StripeCustomer> {
    const customers = await this.stripe.customers.list({
      email,
      limit: 1
    });

    if (customers.data.length > 0) {
      return customers.data[0];
    }

    return this.stripe.customers.create({
      email,
      metadata: { userId }
    });
  }

  async handleWebhook(rawBody: Buffer | undefined, signature: string | undefined): Promise<void> {
    if (!rawBody || !signature) {
      throw new BadRequestException("Missing Stripe webhook payload or signature");
    }

    let event: StripeEvent;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.configService.getOrThrow<string>("STRIPE_WEBHOOK_SECRET")
      );
    } catch {
      throw new BadRequestException("Invalid Stripe webhook signature");
    }

    if (event.type === "checkout.session.completed") {
      await this.handleCheckoutCompleted(event.data.object as StripeCheckoutSession);
    }

    if (event.type === "customer.subscription.deleted") {
      await this.handleSubscriptionDeleted(event.data.object as StripeSubscription);
    }
  }

  private async handleCheckoutCompleted(session: StripeCheckoutSession): Promise<void> {
    const userId = session.metadata?.userId ?? session.client_reference_id;

    if (!userId) {
      throw new BadRequestException("Stripe checkout session is missing user metadata");
    }

    const user = await this.usersService.updatePlanById(userId, "pro");

    if (!user) {
      throw new NotFoundException("User not found");
    }
  }

  private async handleSubscriptionDeleted(subscription: StripeSubscription): Promise<void> {
    const userId = subscription.metadata?.userId;

    if (!userId) {
      return;
    }

    const user = await this.usersService.findById(userId);

    if (!user) {
      return;
    }

    await this.usersService.updatePlanById(userId, "free");
  }

  private get webOrigin(): string {
    return this.configService.get<string>("WEB_ORIGIN") ?? "http://localhost:3000";
  }
}

function createStripeClient(secretKey: string) {
  return new Stripe(secretKey, {
    typescript: true
  });
}

type StripeClient = ReturnType<typeof createStripeClient>;
type StripeEvent = ReturnType<StripeClient["webhooks"]["constructEvent"]>;
type StripeCheckoutSession = Awaited<ReturnType<StripeClient["checkout"]["sessions"]["create"]>>;
type StripeCustomer = Stripe.Customer;
type StripeSubscription = Awaited<ReturnType<StripeClient["subscriptions"]["list"]>>["data"][number] & {
  current_period_end?: number | null;
};

type SubscriptionSummary = {
  id: string;
  status: string;
  priceId: string | null;
};
