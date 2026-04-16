import { IsNumber, IsPositive, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class OpenCashDto {
  @IsNotEmpty()
  @IsString()
  tenantId: string;

  @IsNotEmpty()
  @IsString()
  openedByUserId: string;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  openingAmount: number;
}

export class OpenCashResponseDto {
  id: string;
  tenantId: string;
  status: string;
  openingAmount: number;
  openedAt: Date;
  openedByUserId: string;
  message: string;
}
