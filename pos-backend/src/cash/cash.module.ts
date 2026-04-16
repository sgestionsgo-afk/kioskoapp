import { Module } from '@nestjs/common';
import { CashService } from './cash.service';
import { CashController } from './cash.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CashService],
  controllers: [CashController],
  exports: [CashService], // Export so SalesModule can inject CashService
})
export class CashModule {}
