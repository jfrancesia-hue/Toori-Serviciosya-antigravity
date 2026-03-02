// idempotency.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class IdempotencyService {
    constructor(private prisma: PrismaService) { }
    async isProcessed(key: string): Promise<boolean> {
        const record = await (this.prisma as any).idempotencyKey.findUnique({ where: { key } });
        return !!record;
    }
    async saveResource(key: string, response: any) {
        return (this.prisma as any).idempotencyKey.create({ data: { key, response } });
    }
}
