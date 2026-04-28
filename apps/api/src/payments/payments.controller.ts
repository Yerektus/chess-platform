import { Controller, Get, Headers, HttpCode, Post, Req, UnauthorizedException, UseGuards } from "@nestjs/common";
import { type RawBodyRequest } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PaymentsService } from "./payments.service";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post("checkout")
  @UseGuards(JwtAuthGuard)
  async createCheckoutSession(@Req() request: AuthenticatedRequest): Promise<{ url: string }> {
    return this.paymentsService.createCheckoutSession(getAuthenticatedUserId(request));
  }

  @Get("subscription")
  @UseGuards(JwtAuthGuard)
  async getSubscription(@Req() request: AuthenticatedRequest): Promise<{ subscription: any; nextBillingDate: string | null }> {
    return this.paymentsService.getSubscription(getAuthenticatedUserId(request));
  }

  @Post("cancel-subscription")
  @UseGuards(JwtAuthGuard)
  async cancelSubscription(@Req() request: AuthenticatedRequest): Promise<{ success: boolean }> {
    await this.paymentsService.cancelSubscription(getAuthenticatedUserId(request));
    return { success: true };
  }

  @Post("webhook")
  @HttpCode(200)
  async handleWebhook(
    @Req() request: RawBodyRequest<Record<string, unknown>>,
    @Headers("stripe-signature") signature: string | undefined
  ): Promise<{ received: true }> {
    await this.paymentsService.handleWebhook(request.rawBody, signature);

    return { received: true };
  }
}

type AuthenticatedRequest = {
  user?: {
    sub?: string;
    userId?: string;
    id?: string;
    _id?: string;
  };
};

function getAuthenticatedUserId(request: AuthenticatedRequest): string {
  const userId = request.user?.sub ?? request.user?.userId ?? request.user?.id ?? request.user?._id;

  if (!userId) {
    throw new UnauthorizedException("Authenticated user id is missing");
  }

  return userId;
}
