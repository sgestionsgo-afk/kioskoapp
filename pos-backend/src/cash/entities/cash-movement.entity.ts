/**
 * CashMovementEntity
 *
 * Represents a single money movement through the cash register.
 * All movements are associated with an open CashRegister.
 *
 * Types:
 * - SALE: Money from a completed sale (auto-created)
 * - INCOME: Manual income entry (e.g., loan, supplier credit)
 * - EXPENSE: Manual expense entry (e.g., purchase, withdrawal)
 *
 * Payment Methods:
 * - CASH, CARD, TRANSFER, CHECK, CRYPTO, OTHER
 *
 * Fields:
 * - referenceId: Links to source transaction (e.g., saleId)
 * - referenceType: Type of reference (SALE, EXPENSE_VOUCHER, etc.)
 * - description: Human-readable description of the movement
 */
export class CashMovementEntity {
  id: string;
  tenantId: string;
  cashRegisterId: string;
  type: 'SALE' | 'INCOME' | 'EXPENSE';
  paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'CHECK' | 'CRYPTO' | 'OTHER';
  amount: number; // Always positive; type field determines sign
  referenceId?: string;
  referenceType?: string;
  description?: string;
  createdAt: Date;
}

/**
 * CashMovementAggregate
 *
 * Aggregated view of movements
 */
export interface CashMovementAggregate {
  type: string;
  count: number;
  totalAmount: number;
}

/**
 * CashMovementFilter
 *
 * Filter options for querying movements
 */
export interface CashMovementFilter {
  type?: 'SALE' | 'INCOME' | 'EXPENSE';
  paymentMethod?: string;
  startDate?: Date;
  endDate?: Date;
  referenceType?: string;
}
