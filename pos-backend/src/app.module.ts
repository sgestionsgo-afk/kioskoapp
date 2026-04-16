import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SalesModule } from './sales/sales.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { ClientsModule } from './clients/clients.module';
import { SettingsModule } from './settings/settings.module';
import { CashModule } from './cash/cash.module';

@Module({
  imports: [SalesModule, PrismaModule, ProductsModule, ClientsModule, SettingsModule, CashModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
