import { Injectable, BadRequestException } from '@nestjs/common';
import { OfferStatus, Prisma } from '@toori/database';
import { PrismaService } from '../../prisma/prisma.service';
import { RabbitService } from '../rabbitmq/rabbitmq.service';

export type OfferEvent = 'PUBLISH' | 'ADD_QUOTE' | 'SELECT_QUOTE' | 'CONFIRM_PAYMENT' | 'RATE_SERVICE' | 'CANCEL';

@Injectable()
export class OffersStateMachineService {
    constructor(
        private prisma: PrismaService,
        private rabbit: RabbitService,
    ) { }

    private readonly transitions: Record<OfferStatus, Partial<Record<OfferEvent, OfferStatus>>> = {
        [OfferStatus.DRAFT]: {
            PUBLISH: OfferStatus.PUBLISHED,
            CANCEL: OfferStatus.CANCELLED,
        },
        [OfferStatus.PUBLISHED]: {
            ADD_QUOTE: OfferStatus.IN_QUOTES,
            CANCEL: OfferStatus.CANCELLED,
        },
        [OfferStatus.IN_QUOTES]: {
            ADD_QUOTE: OfferStatus.IN_QUOTES,
            CANCEL: OfferStatus.CANCELLED,
        },
        [OfferStatus.TOP3_SENT]: {
            SELECT_QUOTE: OfferStatus.SELECTED,
            CANCEL: OfferStatus.CANCELLED,
        },
        [OfferStatus.SELECTED]: {
            CONFIRM_PAYMENT: OfferStatus.PAID,
            CANCEL: OfferStatus.CANCELLED,
        },
        [OfferStatus.PAID]: {
            RATE_SERVICE: OfferStatus.CLOSED,
            CANCEL: OfferStatus.CANCELLED,
        },
        [OfferStatus.CLOSED]: {},
        [OfferStatus.CANCELLED]: {},
    };

    async transition(
        offerId: string,
        event: OfferEvent,
        actorId?: string,
        metadata?: any,
        tx?: Prisma.TransactionClient,
    ) {
        const client = tx || this.prisma;
        const offer = await client.offer.findUnique({ where: { id: offerId } });
        if (!offer) throw new BadRequestException('Offer not found');

        const nextState = this.transitions[offer.estado][event];
        if (!nextState) throw new BadRequestException(`Transition ${event} not allowed from ${offer.estado}`);

        let finalNextState = nextState;
        if (event === 'ADD_QUOTE') {
            const quoteCount = await client.quote.count({ where: { offer_id: offerId } });
            if (quoteCount >= 3) finalNextState = OfferStatus.TOP3_SENT;
        }

        const updatedOffer = await client.offer.update({
            where: { id: offerId },
            data: { estado: finalNextState },
        });

        await client.auditEvent.create({
            data: {
                tenant_id: offer.tenant_id,
                action: `STATE_CHANGE_${event}`,
                entity: 'Offer',
                entity_id: offerId,
                actor_user_id: actorId,
                metadata: { previousState: offer.estado, nextState: finalNextState, ...metadata } as any,
            },
        });

        await this.rabbit.publish(`offer.state.${finalNextState.toLowerCase()}`, {
            offerId, event, previousState: offer.estado, nextState: finalNextState, actorId, timestamp: new Date(),
        });

        return updatedOffer;
    }
}
