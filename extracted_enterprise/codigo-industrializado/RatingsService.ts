import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OfferStatus, Rating } from '@toori/database';
import { OffersStateMachineService } from '../common/state-machine/offers-state-machine.service';

@Injectable()
export class RatingsService {
    constructor(private prisma: PrismaService, private stateMachine: OffersStateMachineService) { }

    async createRating(data: any): Promise<Rating> {
        const offer = await this.prisma.offer.findUnique({ where: { id: data.offer_id } });
        if (!offer || offer.estado !== OfferStatus.PAID) throw new Error('Solo se pueden calificar servicios pagados.');

        return this.prisma.$transaction(async (tx) => {
            const rating = await tx.rating.create({ data });
            await this.stateMachine.transition(data.offer_id, 'RATE_SERVICE', data.client_user_id, { ratingId: rating.id }, tx as any);
            return rating;
        });
    }

    async getWorkerReputation(workerId: string) {
        const stats = await this.prisma.rating.aggregate({ where: { worker_user_id: workerId }, _avg: { estrellas: true }, _count: { id: true } });
        const [totalJobs, completedJobs] = await Promise.all([
            this.prisma.quote.count({ where: { worker_user_id: workerId, estado: { in: ['SELECTED', 'PAID', 'CLOSED'] as any } } }),
            this.prisma.quote.count({ where: { worker_user_id: workerId, estado: 'CLOSED' as any } }),
        ]);

        const averageRating = stats._avg.estrellas || 0;
        const completionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;
        const reliabilityScore = Math.min(100, averageRating * 10 + completionRate * 0.5);

        return {
            workerId, averageRating, totalRatings: stats._count.id, completedJobs, completionRate, reliabilityScore,
            isTopWorker: reliabilityScore >= 90 && stats._count.id >= 3,
        };
    }
}
