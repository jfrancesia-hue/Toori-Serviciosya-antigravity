// logger.service.ts
import { Injectable, LoggerService, Scope } from '@nestjs/common';
import * as winston from 'winston';

@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger implements LoggerService {
    private readonly logger: winston.Logger;
    constructor() {
        this.logger = winston.createLogger({
            format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
            transports: [new winston.transports.Console()],
        });
    }
    log(message: any) { this.logger.info(message); }
    error(message: any, stack?: string) { this.logger.error(message, { stack }); }
}
