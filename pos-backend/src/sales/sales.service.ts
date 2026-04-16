import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { SalesStatsDto, SaleDetailDto, PaymentMethodStatsDto } from './dto/sales-stats.dto';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async create(createSaleDto: CreateSaleDto) {
    // Determinar método de pago principal
    let primaryPaymentMethod = createSaleDto.paymentMethod || 'CASH';
    let paymentBreakdown: string | null = null;
    
    // Obtener nombre del vendedor
    let sellerName = createSaleDto.sellerName || '';
    if (createSaleDto.sellerId) {
      const seller = await this.prisma.seller.findUnique({
        where: { id: createSaleDto.sellerId },
      });
      if (seller) {
        sellerName = seller.name;
      }
    }

    // Si hay múltiples pagos, crear el desglose
    if (createSaleDto.payments && createSaleDto.payments.length > 0) {
      // Validar que la suma de pagos sea igual al total
      const totalPayments = createSaleDto.payments.reduce((sum, p) => sum + p.amount, 0);
      if (Math.abs(totalPayments - createSaleDto.total) > 0.01) {
        throw new Error(`Payment amounts don't match total. Total: ${createSaleDto.total}, Payments sum: ${totalPayments}`);
      }

      // Usar el primer método como principal
      primaryPaymentMethod = createSaleDto.payments[0].method;
      
      // Guardar desglose como JSON
      paymentBreakdown = JSON.stringify(
        createSaleDto.payments.map(p => ({
          method: p.method,
          amount: parseFloat(p.amount.toFixed(2)),
        }))
      );
    }

    const sale = await this.prisma.sale.create({
      data: {
        total: createSaleDto.total,
        tenantId: createSaleDto.tenantId,
        clientId: createSaleDto.clientId,
        sellerName: sellerName,
        ivaTaxId: createSaleDto.ivaTaxId,
        taxAmount: createSaleDto.taxAmount || 0,
        paymentMethod: primaryPaymentMethod,
        paymentBreakdown: paymentBreakdown,
        items: {
          create: createSaleDto.items.map(item => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            price: item.price,
            weight: item.weight || 0,
          })),
        },
      },
      include: { items: true },
    });

    // Actualizar estadísticas del cliente si está asociado
    if (createSaleDto.clientId) {
      await this.prisma.client.update({
        where: { id: createSaleDto.clientId },
        data: {
          totalSpent: {
            increment: createSaleDto.total,
          },
          purchaseCount: {
            increment: 1,
          },
          lastPurchaseDate: new Date(),
        },
      });
    }

    return sale;
  }

  async findAll() {
    return this.prisma.sale.findMany();
  }

  async findOne(id: number) {
    return this.prisma.sale.findUnique({
      where: { id },
    });
  }

  async update(id: number, updateSaleDto: UpdateSaleDto) {
    return this.prisma.sale.update({
      where: { id },
      data: updateSaleDto,
    });
  }

  async remove(id: number) {
    return this.prisma.sale.delete({
      where: { id },
    });
  }

  async getStatistics(): Promise<SalesStatsDto> {
    const sales = await this.prisma.sale.findMany({
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });

    const totalSales = sales.length;
    const totalAmount = sales.reduce((sum, sale) => sum + sale.total, 0);
    const averageAmount = totalSales > 0 ? totalAmount / totalSales : 0;

    // Mapear ventas a SaleDetailDto
    const salesDetails: SaleDetailDto[] = sales.map(sale => {
      const total = typeof sale.total === 'number' ? sale.total : Number(sale.total);
      const taxAmount = sale.taxAmount ? 
        (typeof sale.taxAmount === 'number' ? sale.taxAmount : Number(sale.taxAmount)) : 0;
      
      return {
        id: sale.id,
        total: parseFloat(total.toFixed(2)),
        paymentMethod: sale.paymentMethod,
        sellerName: sale.sellerName || '',
        taxAmount: parseFloat(taxAmount.toFixed(2)),
        createdAt: sale.createdAt,
        items: sale.items.map(item => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: parseFloat(item.price.toFixed(2)),
        })),
      };
    });

    // Agrupar por método de pago
    const paymentMethodMap = new Map<string, { total: number; count: number }>();
    
    sales.forEach((sale) => {
      const method = sale.paymentMethod || 'CASH';
      if (!paymentMethodMap.has(method)) {
        paymentMethodMap.set(method, { total: 0, count: 0 });
      }
      const current = paymentMethodMap.get(method)!;
      current.total += sale.total;
      current.count += 1;
    });

    // Convertir a array
    const paymentMethods: PaymentMethodStatsDto[] = Array.from(paymentMethodMap.entries()).map(
      ([method, data]) => ({
        method,
        total: parseFloat(data.total.toFixed(2)),
        count: data.count,
        percentage: parseFloat(((data.count / totalSales) * 100).toFixed(2)),
      })
    );

    return {
      totalSales,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      averageAmount: parseFloat(averageAmount.toFixed(2)),
      sales: salesDetails,
      paymentMethods,
    };
  }
}