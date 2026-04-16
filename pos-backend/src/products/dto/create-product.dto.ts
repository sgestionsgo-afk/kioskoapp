export class CreateProductDto {
  name: string;
  isWeighable: boolean;
  pricePerKg?: number;
  price?: number;
  description?: string;
  stock?: number;
}

export class ProductDto {
  id: number;
  name: string;
  isWeighable: boolean;
  pricePerKg?: number | null;
  price?: number | null;
  description?: string | null;
  stock: number;
}
