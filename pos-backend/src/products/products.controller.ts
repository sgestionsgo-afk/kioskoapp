import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: Partial<CreateProductDto>) {
    return this.productsService.update(+id, updateProductDto);
  }

  @Patch(':id/stock')
  updateStock(@Param('id') id: string, @Body() body: { stock: number }) {
    return this.productsService.updateStock(+id, body.stock);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.delete(+id);
  }
}
