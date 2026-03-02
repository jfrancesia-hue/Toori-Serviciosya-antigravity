import { Injectable } from '@nestjs/common';
import { AppLogger } from '../common/logger/logger.service';

export interface RankingData {
    price: number;
    minPrice: number;
    maxPrice: number;
    workerRating: number; // 0-5
    deliveryTimeDays: number;
    minTime: number;
    maxTime: number;
    cancellationsCount?: number;
    badRatingsCount?: number;
}

export interface RankingResult {
    totalScore: number;
    details: {
        priceScore: number;
        ratingScore: number;
        timeScore: number;
        penalties: {
            cancellations: number;
            badRatings: number;
        };
    };
}

@Injectable()
export class RankingService {
    constructor(private logger: AppLogger) {
        this.logger.setContext(RankingService.name);
    }

    calculateScore(data: RankingData): RankingResult {
        const {
            price,
            minPrice,
            maxPrice,
            workerRating,
            deliveryTimeDays,
            minTime,
            maxTime,
            cancellationsCount = 0,
            badRatingsCount = 0,
        } = data;

        const priceRange = maxPrice - minPrice;
        const priceScore = priceRange === 0 ? 1 : 1 - (price - minPrice) / priceRange;

        const ratingScore = workerRating / 5;

        const timeRange = maxTime - minTime;
        const timeScore = timeRange === 0 ? 1 : 1 - (deliveryTimeDays - minTime) / timeRange;

        let totalScore = 0.45 * priceScore + 0.35 * ratingScore + 0.2 * timeScore;

        const cancelPenalty = Math.min(cancellationsCount * 0.05, 0.2);
        const badRatingPenalty = Math.min(badRatingsCount * 0.1, 0.3);

        totalScore = Math.max(0, totalScore - cancelPenalty - badRatingPenalty);

        const result: RankingResult = {
            totalScore: parseFloat(totalScore.toFixed(4)),
            details: {
                priceScore: parseFloat(priceScore.toFixed(4)),
                ratingScore: parseFloat(ratingScore.toFixed(4)),
                timeScore: parseFloat(timeScore.toFixed(4)),
                penalties: {
                    cancellations: cancelPenalty,
                    badRatings: badRatingPenalty,
                },
            },
        };

        this.logger.log(`Ranking result for worker: ${result.totalScore}`);
        this.logger.debug(result.details);

        return result;
    }
}
