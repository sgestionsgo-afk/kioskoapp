import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CashModule } from '../cash/cash.module';

@Module({
  imports: [PrismaModule, CashModule],
  controllers: [SalesController],
  providers: [SalesService],
})
export class SalesModule {}
