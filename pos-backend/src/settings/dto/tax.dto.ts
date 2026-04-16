export class CreateTaxDto {
  name: string;
  percentage: number;
  type?: string;
  active?: boolean;
}

export class UpdateTaxDto {
  name?: string;
  percentage?: number;
  type?: string;
  active?: boolean;
}
