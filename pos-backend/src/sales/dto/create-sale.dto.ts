export class CreateSaleItemDto {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  weight?: number;
}

export class PaymentDto {
  method: 'CASH' | 'TRANSFER';
  amount: number;
}

export class CreateSaleDto {
  total: number;
  tenantId: number;
  clientId?: number; // Optional client reference
  sellerId?: number; // ID del vendedor
  sellerName?: string; // Retrocompatibilidad: nombre del vendedor si no se proporciona sellerId
  ivaTaxId?: number; // Tax rule used for this sale
  taxAmount?: number; // IVA calculado
  paymentMethod?: 'CASH' | 'TRANSFER'; // Compatibility - fallback
  payments?: PaymentDto[]; // Multiple payments
  items: CreateSaleItemDto[];
}
