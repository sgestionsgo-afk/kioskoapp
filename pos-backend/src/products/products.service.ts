import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, ProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  private async getDefaultTaxId(): Promise<number> {
    // Get the 21% IVA tax (default)
    const defaultTax = await this.prisma.tax.findFirst({
      where: { percentage: 21, type: 'IVA' },
    });
    return defaultTax?.id || 1; // Fallback to id 1 if exists
  }

  private async ensureDefaultTaxForProducts(): Promise<void> {
    // Auto-assign default tax to products that don't have one
    const taxId = await this.getDefaultTaxId();
    await this.prisma.product.updateMany({
      where: { taxId: null },
      data: { taxId },
    });
  }

  async onModuleInit() {
    // Precargar productos si no existen
    const count = await this.prisma.product.count();
    if (count === 0) {
      await this.seedProducts();
    }
    // Ensure all products have a default tax assigned
    await this.ensureDefaultTaxForProducts();
  }

  private async seedProducts() {
    const products = [
      {
        name: 'Alimento Perro',
        isWeighable: true,
        pricePerKg: 150,
        description: 'Alimento balanceado para perros',
        stock: 50
      },
      {
        name: 'Alimento Gato',
        isWeighable: true,
        pricePerKg: 200,
        description: 'Alimento balanceado para gatos',
        stock: 30
      }
    ];

    for (const product of products) {
      await this.prisma.product.create({ data: product });
    }
  }

  async create(createProductDto: CreateProductDto): Promise<ProductDto> {
    return this.prisma.product.create({
      data: createProductDto,
      include: { tax: true },
    });
  }

  async findAll(): Promise<ProductDto[]> {
    return this.prisma.product.findMany({
      include: { tax: true },
    });
  }

  async findOne(id: number): Promise<ProductDto | null> {
    return this.prisma.product.findUnique({
      where: { id },
      include: { tax: true },
    });
  }

  async update(id: number, updateData: Partial<CreateProductDto>) {
    return this.prisma.product.update({
      where: { id },
      data: updateData,
      include: { tax: true },
    });
  }

  async updateStock(id: number, quantity: number) {
    return this.prisma.product.update({
      where: { id },
      data: { stock: quantity },
    });
  }

  async delete(id: number) {
    return this.prisma.product.delete({
      where: { id },
    });
  }
}
