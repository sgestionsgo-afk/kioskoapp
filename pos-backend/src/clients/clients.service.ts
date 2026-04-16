import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto, UpdateClientDto, CreatePaymentDto } from './dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  // CRUD CLIENTES
  async create(createClientDto: CreateClientDto) {
    return this.prisma.client.create({
      data: createClientDto,
    });
  }

  async findAll() {
    return this.prisma.client.findMany({
      include: {
        _count: {
          select: { sales: true },
        },
      },
      orderBy: { totalSpent: 'desc' },
    });
  }

  async findById(id: number) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        sales: {
          select: { id: true, total: true, createdAt: true, paymentMethod: true },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!client) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }
    return client;
  }

  async update(id: number, updateClientDto: UpdateClientDto) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }

    return this.prisma.client.update({
      where: { id },
      data: updateClientDto,
    });
  }

  async delete(id: number) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }

    return this.prisma.client.delete({ where: { id } });
  }

  // CUENTA CORRIENTE - Obtener saldo
  async getCreditAccount(clientId: number) {
    const client = await this.findById(clientId);
    
    const totalDebits = client.sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalCredits = client.payments.reduce((sum, payment) => {
      return payment.type === 'DEBT_PAYMENT' ? sum + payment.amount : sum;
    }, 0);
    
    const balance = totalDebits - totalCredits;

    return {
      clientId,
      clientName: client.name,
      totalPurchases: totalDebits,
      totalPayments: totalCredits,
      balance: balance > 0 ? balance : 0, // Cliente debe
      paid: balance <= 0 ? Math.abs(balance) : 0, // Cliente pagó más
    };
  }

  // HISTORIAL DE COMPRAS
  async getPurchaseHistory(clientId: number) {
    const client = await this.findById(clientId);
    
    return {
      clientId,
      clientName: client.name,
      totalPurchases: client.purchaseCount,
      totalSpent: client.totalSpent,
      purchaseHistory: client.sales.map(sale => ({
        id: sale.id,
        date: sale.createdAt,
        amount: sale.total,
        paymentMethod: sale.paymentMethod,
      })),
    };
  }

  // PAGOS DE DEUDA
  async recordPayment(createPaymentDto: CreatePaymentDto) {
    const client = await this.prisma.client.findUnique({
      where: { id: createPaymentDto.clientId },
    });

    if (!client) {
      throw new NotFoundException(`Cliente con ID ${createPaymentDto.clientId} no encontrado`);
    }

    return this.prisma.clientPayment.create({
      data: {
        clientId: createPaymentDto.clientId,
        amount: createPaymentDto.amount,
        description: createPaymentDto.description,
        type: createPaymentDto.type || 'DEBT_PAYMENT',
      },
    });
  }

  async getPaymentHistory(clientId: number) {
    const client = await this.findById(clientId);
    
    return {
      clientId,
      clientName: client.name,
      payments: client.payments,
    };
  }

  // LISTA DE PRECIOS (por ahora retorna los productos disponibles)
  async getPriceList() {
    return this.prisma.product.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        pricePerKg: true,
        isWeighable: true,
        description: true,
      },
    });
  }

  // RANKING DE CLIENTES
  async getClientRanking() {
    const clients = await this.prisma.client.findMany({
      select: {
        id: true,
        name: true,
        totalSpent: true,
        purchaseCount: true,
        lastPurchaseDate: true,
      },
      orderBy: [{ totalSpent: 'desc' }],
      take: 20,
    });

    return clients.map((client, index) => ({
      rank: index + 1,
      ...client,
    }));
  }

  // ANÁLISIS DE COMPRAS POR CLIENTE
  async getPurchaseAnalytics(clientId: number) {
    const client = await this.findById(clientId);
    
    const totalPurchases = client.purchaseCount;
    const totalSpent = client.totalSpent;
    const averagePurchase = totalPurchases > 0 ? totalSpent / totalPurchases : 0;
    const daysSinceLastPurchase = client.lastPurchaseDate 
      ? Math.floor((Date.now() - new Date(client.lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      clientId,
      clientName: client.name,
      totalPurchases,
      totalSpent,
      averagePurchase,
      lastPurchaseDate: client.lastPurchaseDate,
      daysSinceLastPurchase,
      ivaCategory: client.ivaCategory,
      createdAt: client.createdAt,
    };
  }

  // SUGERENCIAS DE VENTA
  async getSalesRecommendations(clientId: number) {
    const client = await this.findById(clientId);
    
    // Si el cliente no tiene compras recientes (más de 30 días)
    const daysSinceLastPurchase = client.lastPurchaseDate 
      ? Math.floor((Date.now() - new Date(client.lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const recommendations: Array<{ type: string; message: string; priority: string }> = [];

    if (!client.lastPurchaseDate) {
      recommendations.push({
        type: 'FIRST_PURCHASE',
        message: 'Este es un cliente nuevo. Ofrece descuento de bienvenida.',
        priority: 'HIGH',
      });
    } else if (daysSinceLastPurchase && daysSinceLastPurchase > 30) {
      recommendations.push({
        type: 'INACTIVE',
        message: `Cliente inactivo hace ${daysSinceLastPurchase} días. Contactar para promoción especial.`,
        priority: 'HIGH',
      });
    }

    if ((client.ivaCategory === 'RESPONSABLE_INSCRIPTO' || client.ivaCategory === 'MONOTRIBUTISTA') && client.totalSpent > 1000) {
      recommendations.push({
        type: 'HIGH_VALUE_CLIENT',
        message: 'Cliente empresarial de alto valor. Ofrece condiciones especiales.',
        priority: 'MEDIUM',
      });
    }

    if (client.purchaseCount > 10) {
      recommendations.push({
        type: 'FREQUENT_BUYER',
        message: 'Cliente frecuente. Considerarlo para programa de puntos.',
        priority: 'MEDIUM',
      });
    }

    if (daysSinceLastPurchase && daysSinceLastPurchase < 7) {
      recommendations.push({
        type: 'RECENT_BUYER',
        message: 'Cliente activo recientemente. Seguir ofertando regularmente.',
        priority: 'LOW',
      });
    }

    return {
      clientId,
      clientName: client.name,
      totalSpent: client.totalSpent,
      lastPurchaseDate: client.lastPurchaseDate,
      recommendations,
    };
  }
}
