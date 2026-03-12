import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import Stripe from 'stripe';

export const PLANS = {
  FREE: { price: 0, credits: 20, name: 'Free' },
  STARTER: { priceId: process.env.STRIPE_PRICE_STARTER, price: 4900, credits: 100, name: 'Starter' },
  PRO: { priceId: process.env.STRIPE_PRICE_PRO, price: 14900, credits: 500, name: 'Pro' },
  ENTERPRISE: { priceId: process.env.STRIPE_PRICE_ENTERPRISE, price: null, credits: 9999, name: 'Enterprise' },
};

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private workspacesService: WorkspacesService,
  ) {
    this.stripe = new Stripe(this.config.get<string>('STRIPE_SECRET_KEY'), { apiVersion: '2023-10-16' });
  }

  async getOrCreateCustomer(workspaceId: string) {
    const workspace = await this.prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (workspace.stripeCustomerId) {
      return this.stripe.customers.retrieve(workspace.stripeCustomerId);
    }

    const users = await this.prisma.workspaceUser.findMany({
      where: { workspaceId, role: 'OWNER' },
      include: { user: true },
    });
    const owner = users[0]?.user;

    const customer = await this.stripe.customers.create({
      email: owner?.email,
      name: workspace.name,
      metadata: { workspaceId },
    });

    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { stripeCustomerId: customer.id },
    });

    return customer;
  }

  async createCheckoutSession(workspaceId: string, plan: 'STARTER' | 'PRO', successUrl: string, cancelUrl: string) {
    const planData = PLANS[plan];
    if (!planData?.priceId) throw new NotFoundException('Plan not found');

    const customer = await this.getOrCreateCustomer(workspaceId);

    const session = await this.stripe.checkout.sessions.create({
      customer: (customer as any).id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: planData.priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { workspaceId, plan },
    });

    return { url: session.url };
  }

  async createPortalSession(workspaceId: string, returnUrl: string) {
    const workspace = await this.prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace.stripeCustomerId) throw new NotFoundException('No billing profile found');

    const session = await this.stripe.billingPortal.sessions.create({
      customer: workspace.stripeCustomerId,
      return_url: returnUrl,
    });
    return { url: session.url };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch (err) {
      this.logger.error(`Stripe webhook error: ${err.message}`);
      throw err;
    }

    this.logger.log(`Processing Stripe event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { workspaceId, plan } = session.metadata;
        const planData = PLANS[plan];
        await this.prisma.workspace.update({
          where: { id: workspaceId },
          data: { plan: plan as any, stripeSubId: session.subscription as string },
        });
        await this.workspacesService.addCredits(workspaceId, planData.credits, 'plan_renewal');
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customer = await this.stripe.customers.retrieve(invoice.customer as string);
        const workspaceId = (customer as any).metadata?.workspaceId;
        if (!workspaceId) break;

        const workspace = await this.prisma.workspace.findUnique({ where: { id: workspaceId } });
        const planData = PLANS[workspace?.plan];
        if (planData?.credits) {
          await this.workspacesService.addCredits(workspaceId, planData.credits, 'plan_renewal');
        }

        await this.prisma.invoice.upsert({
          where: { stripeInvoiceId: invoice.id },
          create: {
            stripeInvoiceId: invoice.id,
            workspaceId,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            status: invoice.status,
            pdfUrl: invoice.invoice_pdf,
            hostedUrl: invoice.hosted_invoice_url,
            periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
            periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
          },
          update: { status: invoice.status, pdfUrl: invoice.invoice_pdf },
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await this.prisma.workspace.updateMany({
          where: { stripeSubId: sub.id },
          data: { plan: 'FREE', stripeSubId: null },
        });
        break;
      }
    }

    return { received: true };
  }

  async getInvoices(workspaceId: string) {
    return this.prisma.invoice.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCurrentPlan(workspaceId: string) {
    return this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { plan: true, credits: true, stripeCustomerId: true },
    });
  }
}
