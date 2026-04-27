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
