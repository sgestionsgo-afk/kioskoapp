import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  OpenCashDto,
  CloseCashDto,
  CreateMovementDto,
  OpenCashResponseDto,
  CloseCashResponseDto,
  MovementResponseDto,
} from './dto';
import { CashRegisterDetail, CashRegisterStats } from './entities';

/**
 * CashService
 *
 * Business rules:
 * - Only ONE OPEN register per tenant at any time
 * - expectedAmount = openingAmount + sales + incomes - expenses
 * - difference = closingAmount - expectedAmount (+ surplus / - shortage)
 *
 * tenantId is supplied via DTOs (consistent with the rest of the project).
 * When JWT auth is added, replace dto.tenantId with tenantContext.getTenantId().
 * Call registerSaleMovement() from SalesService to auto-track sales.
 */
@Injectable()
export class CashService {
  constructor(private prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // OPEN
  // ---------------------------------------------------------------------------

  async openCash(dto: OpenCashDto): Promise<OpenCashResponseDto> {
    const existing = await this.prisma.cashRegister.findFirst({
      where: { tenantId: dto.tenantId, status: 'OPEN' },
    });

    if (existing) {
      throw new BadRequestException(
        `A cash register is already open since ${existing.openedAt.toISOString()}. Close it first.`,
      );
    }

    const register = await this.prisma.cashRegister.create({
      data: {
        tenantId: dto.tenantId,
        openedByUserId: dto.openedByUserId,
        status: 'OPEN',
        openingAmount: dto.openingAmount,
        openedAt: new Date(),
      },
    });

    return {
      id: register.id,
      tenantId: register.tenantId,
      status: register.status,
      openingAmount: register.openingAmount,
      openedAt: register.openedAt,
      openedByUserId: register.openedByUserId,
      message: `Cash register opened with $${dto.openingAmount.toFixed(2)}`,
    };
  }

  // ---------------------------------------------------------------------------
  // CLOSE
  // ---------------------------------------------------------------------------

  async closeCash(dto: CloseCashDto): Promise<CloseCashResponseDto> {
    const register = await this.prisma.cashRegister.findFirst({
      where: { tenantId: dto.tenantId, status: 'OPEN' },
    });

    if (!register) {
      throw new NotFoundException('No open cash register found for this tenant.');
    }

    const movements = await this.prisma.cashMovement.findMany({
      where: { tenantId: dto.tenantId, cashRegisterId: register.id },
    });

    const stats = this.calcStats(movements);
    const expectedAmount = register.openingAmount + stats.netAmount;
    const difference = dto.closingAmount - expectedAmount;

    const closed = await this.prisma.cashRegister.update({
      where: { id: register.id },
      data: {
        status: 'CLOSED',
        closingAmount: dto.closingAmount,
        expectedAmount,
        difference,
        closedByUserId: dto.closedByUserId,
        closedAt: new Date(),
      },
    });

    const isBalanced = Math.abs(difference) < 0.01;

    return {
      id: closed.id,
      tenantId: closed.tenantId,
      status: closed.status,
      openingAmount: closed.openingAmount,
      closingAmount: closed.closingAmount!,
      expectedAmount,
      difference,
      closedAt: closed.closedAt!,
      closedByUserId: closed.closedByUserId!,
      totalSales: stats.sales,
      totalIncomes: stats.incomes,
      totalExpenses: stats.expenses,
      isBalanced,
      message: isBalanced
        ? 'Cash register balanced perfectly!'
        : `Difference: $${difference > 0 ? '+' : ''}${difference.toFixed(2)}`,
    };
  }

  // ---------------------------------------------------------------------------
  // MOVEMENT (manual)
  // ---------------------------------------------------------------------------

  async registerMovement(dto: CreateMovementDto): Promise<MovementResponseDto> {
    const register = await this.prisma.cashRegister.findFirst({
      where: { tenantId: dto.tenantId, status: 'OPEN' },
    });

    if (!register) {
      throw new BadRequestException(
        'No open cash register. Open one before registering movements.',
      );
    }

    const movement = await this.prisma.cashMovement.create({
      data: {
        tenantId: dto.tenantId,
        cashRegisterId: register.id,
        type: dto.type,
        paymentMethod: dto.paymentMethod,
        amount: dto.amount,
        referenceId: dto.referenceId,
        referenceType: dto.referenceType,
        description: dto.description,
      },
    });

    return {
      id: movement.id,
      tenantId: movement.tenantId,
      cashRegisterId: movement.cashRegisterId,
      type: movement.type,
      paymentMethod: movement.paymentMethod,
      amount: movement.amount,
      referenceId: movement.referenceId ?? undefined,
      description: movement.description ?? undefined,
      createdAt: movement.createdAt,
    };
  }

  // ---------------------------------------------------------------------------
  // SALE MOVEMENT (auto, called by SalesService)
  // ---------------------------------------------------------------------------

  /**
   * Automatically record a SALE movement when a sale is created.
   * Silently skips if no register is open (non‑blocking for the sale flow).
   */
  async registerSaleMovement(
    tenantId: string,
    saleId: string,
    amount: number,
    paymentMethod: string = 'CASH',
  ): Promise<void> {
    const register = await this.prisma.cashRegister.findFirst({
      where: { tenantId, status: 'OPEN' },
    });

    if (!register) {
      console.warn(
        `[CashService] No open register for tenant ${tenantId} — sale ${saleId} not recorded in cash.`,
      );
      return;
    }

    await this.prisma.cashMovement.create({
      data: {
        tenantId,
        cashRegisterId: register.id,
        type: 'SALE',
        paymentMethod,
        amount,
        referenceId: saleId,
        referenceType: 'SALE',
        description: `Sale ${saleId}`,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // QUERIES
  // ---------------------------------------------------------------------------

  async getCurrentRegister(tenantId: string): Promise<CashRegisterDetail | null> {
    const register = await this.prisma.cashRegister.findFirst({
      where: { tenantId, status: 'OPEN' },
      include: {
        movements: true,
        openedByUser: { select: { id: true, name: true, email: true } },
        closedByUser: { select: { id: true, name: true, email: true } },
      },
    });

    if (!register) return null;

    const stats = this.calcStats(register.movements);

    return {
      id: register.id,
      tenantId: register.tenantId,
      openedByUserId: register.openedByUserId,
      closedByUserId: register.closedByUserId ?? undefined,
      status: register.status as 'OPEN' | 'CLOSED',
      openingAmount: register.openingAmount,
      closingAmount: register.closingAmount ?? undefined,
      expectedAmount: register.expectedAmount ?? undefined,
      difference: register.difference ?? undefined,
      openedAt: register.openedAt,
      closedAt: register.closedAt ?? undefined,
      createdAt: register.createdAt,
      updatedAt: register.updatedAt,
      openedByUserName: register.openedByUser?.name ?? undefined,
      closedByUserName: register.closedByUser?.name ?? undefined,
      stats,
    };
  }

  async getHistory(tenantId: string, limit = 30, offset = 0) {
    const [data, total] = await Promise.all([
      this.prisma.cashRegister.findMany({
        where: { tenantId, status: 'CLOSED' },
        include: {
          openedByUser: { select: { name: true } },
          closedByUser: { select: { name: true } },
        },
        orderBy: { closedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.cashRegister.count({ where: { tenantId, status: 'CLOSED' } }),
    ]);

    return { data, total, limit, offset };
  }

  async getMovements(
    tenantId: string,
    filter?: { type?: string; paymentMethod?: string },
  ) {
    const register = await this.prisma.cashRegister.findFirst({
      where: { tenantId, status: 'OPEN' },
    });

    if (!register) {
      throw new NotFoundException('No open cash register found.');
    }

    const where: any = { tenantId, cashRegisterId: register.id };
    if (filter?.type) where.type = filter.type;
    if (filter?.paymentMethod) where.paymentMethod = filter.paymentMethod;

    return this.prisma.cashMovement.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  // ---------------------------------------------------------------------------
  // HELPER
  // ---------------------------------------------------------------------------

  private calcStats(movements: any[]): CashRegisterStats {
    const s: CashRegisterStats = { sales: 0, incomes: 0, expenses: 0, netAmount: 0 };
    for (const m of movements) {
      if (m.type === 'SALE') s.sales += m.amount;
      else if (m.type === 'INCOME') s.incomes += m.amount;
      else if (m.type === 'EXPENSE') s.expenses += m.amount;
    }
    s.netAmount = s.sales + s.incomes - s.expenses;
    return s;
  }
}
