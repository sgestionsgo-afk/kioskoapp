import {
  IsNumber,
  IsNotEmpty,
  IsPositive,
  IsOptional,
  IsString,
  IsEnum,
} from 'class-validator';

export enum MovementType {
  SALE = 'SALE',
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  TRANSFER = 'TRANSFER',
  CHECK = 'CHECK',
  CRYPTO = 'CRYPTO',
  OTHER = 'OTHER',
}

export class CreateMovementDto {
  @IsNotEmpty()
  @IsString()
  tenantId: string;

  @IsNotEmpty()
  @IsEnum(MovementType)
  type: MovementType;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  referenceId?: string;

  @IsOptional()
  @IsString()
  referenceType?: string;
}

/**
 * Response DTO for created movement
 */
export class MovementResponseDto {
  id: string;
  tenantId: string;
  cashRegisterId: string;
  type: string;
  paymentMethod: string;
  amount: number;
  referenceId?: string;
  description?: string;
  createdAt: Date;
}
