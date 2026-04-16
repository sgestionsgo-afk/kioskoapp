export class CreatePaymentDto {
  clientId: number;
  amount: number;
  description?: string;
  type?: 'DEBT_PAYMENT' | 'CREDIT' | 'DEBIT';
}
