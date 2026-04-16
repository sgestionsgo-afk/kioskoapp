export class CreatePromotionDto {
  name: string;
  type?: string;
  discountValue: number;
  conditions?: string;
  startDate: Date;
  endDate: Date;
  active?: boolean;
}

export class UpdatePromotionDto {
  name?: string;
  type?: string;
  discountValue?: number;
  conditions?: string;
  startDate?: Date;
  endDate?: Date;
  active?: boolean;
}
