/**
 * CashRegisterEntity
 *
 * Represents an open/closed cash register session.
 * Only one OPEN register per tenant at any given time.
 *
 * Fields:
 * - openingAmount: Initial cash amount when register was opened
 * - closingAmount: Real cash counted during closing
 * - expectedAmount: Calculated as openingAmount + incomes + sales - expenses
 * - difference: closingAmount - expectedAmount (can be positive or negative)
 *
 * Status:
 * - OPEN: Register is operational
 * - CLOSED: Register session ended
 */
export class CashRegisterEntity {
  id: string;
  tenantId: string;
  openedByUserId: string;
  closedByUserId?: string;
  status: 'OPEN' | 'CLOSED';
  openingAmount: number;
  closingAmount?: number;
  expectedAmount?: number;
  difference?: number;
  openedAt: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * CashRegisterStats
 *
 * Statistics for cash register session
 */
export interface CashRegisterStats {
  totalSales: number;
  totalIncomes: number;
  totalExpenses: number;
  netAmount: number; // incomes + sales - expenses
}

/**
 * CashRegisterDetail
 *
 * Extended view including related data
 */
export interface CashRegisterDetail extends CashRegisterEntity {
  openedByUserName?: string;
  closedByUserName?: string;
  stats?: CashRegisterStats;
}
