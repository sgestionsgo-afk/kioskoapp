import { IsNumber, IsNotEmpty, IsPositive, IsOptional, IsString } from 'class-validator';

export class CloseCashDto {
  @IsNotEmpty()
  @IsString()
  tenantId: string;

  @IsNotEmpty()
  @IsString()
  closedByUserId: string;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  closingAmount: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CloseCashResponseDto {
  id: string;
  tenantId: string;
  status: string;
  openingAmount: number;
  closingAmount: number;
  expectedAmount: number;
  difference: number;
  closedAt: Date;
  closedByUserId: string;
  totalSales: number;
  totalIncomes: number;
  totalExpenses: number;
  isBalanced: boolean;
  message: string;
}
