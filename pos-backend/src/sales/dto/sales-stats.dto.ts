export class SaleItemDto {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  price: number;
}

export class SaleDetailDto {
  id: number;
  total: number;
  paymentMethod: string;
  sellerName?: string;
  taxAmount?: number;
  createdAt: Date;
  items: SaleItemDto[];
}

export class PaymentMethodStatsDto {
  method: string;
  total: number;
  count: number;
  percentage: number;
}

export class SalesStatsDto {
  totalSales: number;
  totalAmount: number;
  averageAmount: number;
  sales: SaleDetailDto[];
  paymentMethods: PaymentMethodStatsDto[];
}
