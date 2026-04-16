import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: process.env.NODE_ENV === 'production' ? 
        [{ emit: 'event', level: 'error' }] : 
        [{ emit: 'stdout', level: 'query' }],
      errorFormat: 'colorless',
    });
  }

  async onModuleInit() {
    try {
      // Add event listener for slow queries in dev
      this.$on('query' as never, (e: any) => {
        if (e.duration > 100) {
          this.logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
        }
      });

      await this.$connect();
      this.logger.log('✅ Prisma connected (SQLite optimized)');
    } catch (error) {
      this.logger.error('❌ Prisma connection error:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
