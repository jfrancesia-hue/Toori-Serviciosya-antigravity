import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { QuoteStatus, PaymentStatus } from '@toori/database';
import { AppLogger } from '../common/logger/logger.service';
import { OffersStateMachineService } from '../common/state-machine/offers-state-machine.service';
import { IdempotencyService } from '../common/idempotency/idempotency.service';

@Injectable()
export class PaymentsService {
    private mpClient: MercadoPagoConfig;

    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
        private logger: AppLogger,
        private stateMachine: OffersStateMachineService,
        private idempotency: IdempotencyService,
    ) {
        this.mpClient = new MercadoPagoConfig({
            accessToken: this.configService.get('MERCADOPAGO_ACCESS_TOKEN') || 'TEST-TOKEN',
        });
    }

    async createPreference(quoteId: string) {
        const quote = await this.prisma.quote.findUnique({ where: { id: quoteId }, include: { offer: true } });
        if (!quote) throw new Error('Quote not found');

        const amountTotal = quote.precio * 1.15;
        const preference = new Preference(this.mpClient);
        const response = await preference.create({
            body: {
                items: [{ id: quote.id, title: `Servicio Toori: ${quote.offer.categoria}`, quantity: 1, unit_price: amountTotal, currency_id: 'ARS' }],
                external_reference: quote.id,
                notification_url: `${this.configService.get('BASE_URL')}/payments/webhook`,
            },
        });

        await this.prisma.payment.create({
            data: {
                tenant_id: quote.offer.tenant_id,
                offer_id: quote.offer_id,
                quote_id: quote.id,
                provider: 'mercadopago',
                amount_total: amountTotal,
                amount_base: quote.precio,
                commission_amount: quote.precio * 0.15,
                status: PaymentStatus.PENDING,
            },
        });

        return { id: response.id, init_point: response.init_point };
    }

    async handleWebhook(headers: any, payload: any) {
        const paymentId = payload.data?.id || payload.id;
        const idempotencyKey = `webhook:mp:${paymentId}`;
        if (await this.idempotency.isProcessed(idempotencyKey)) return;

        const quoteId = payload.external_reference;
        if (quoteId) {
            await this.confirmPayment(quoteId, paymentId, payload);
            await this.idempotency.saveResource(idempotencyKey, { success: true });
        }
    }

    async confirmPayment(quoteId: string, providerPaymentId: string, payload: any) {
        return this.prisma.$transaction(async (tx) => {
            await tx.payment.updateMany({
                where: { quote_id: quoteId, status: PaymentStatus.PENDING },
                data: { status: PaymentStatus.PAID, provider_payment_id: providerPaymentId, provider_payload: payload, paid_at: new Date() },
            });

            await tx.quote.update({ where: { id: quoteId }, data: { estado: QuoteStatus.PAID } });
            const quote = await tx.quote.findUnique({ where: { id: quoteId } });
            if (quote) {
                await this.stateMachine.transition(quote.offer_id, 'CONFIRM_PAYMENT', undefined, { quoteId, providerPaymentId }, tx as any);
            }
        });
    }
}
