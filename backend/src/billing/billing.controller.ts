import {
  Controller, Get, Post, Body, UseGuards, Request,
  RawBodyRequest, Req, Headers, HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(private billingService: BillingService) {}

  @Get('plan')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getCurrentPlan(@Request() req) {
    return this.billingService.getCurrentPlan(req.user.workspaceId);
  }

  @Post('checkout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  createCheckout(
    @Request() req,
    @Body() body: { plan: 'STARTER' | 'PRO'; successUrl: string; cancelUrl: string },
  ) {
    return this.billingService.createCheckoutSession(
      req.user.workspaceId,
      body.plan,
      body.successUrl,
      body.cancelUrl,
    );
  }

  @Post('portal')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  createPortal(@Request() req, @Body() body: { returnUrl: string }) {
    return this.billingService.createPortalSession(req.user.workspaceId, body.returnUrl);
  }

  @Get('invoices')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getInvoices(@Request() req) {
    return this.billingService.getInvoices(req.user.workspaceId);
  }

  @Post('webhook')
  @HttpCode(200)
  stripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig: string,
  ) {
    return this.billingService.handleWebhook(req.rawBody, sig);
  }
}
