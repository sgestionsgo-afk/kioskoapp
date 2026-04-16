import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto, UpdateClientDto, CreatePaymentDto } from './dto';

@Controller('clients')
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  // CRUD - Crear
  @Post()
  async create(@Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(createClientDto);
  }

  // CRUD - Listar todos
  @Get()
  async findAll() {
    return this.clientsService.findAll();
  }

  // CRUD - Obtener por ID
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.clientsService.findById(Number(id));
  }

  // CRUD - Actualizar
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto) {
    return this.clientsService.update(Number(id), updateClientDto);
  }

  // CRUD - Eliminar
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.clientsService.delete(Number(id));
  }

  // CUENTA CORRIENTE
  @Get(':id/account')
  async getCreditAccount(@Param('id') id: string) {
    return this.clientsService.getCreditAccount(Number(id));
  }

  // HISTORIAL DE COMPRAS
  @Get(':id/purchase-history')
  async getPurchaseHistory(@Param('id') id: string) {
    return this.clientsService.getPurchaseHistory(Number(id));
  }

  // PAGOS DE DEUDA
  @Post(':id/payments')
  async recordPayment(@Body() createPaymentDto: CreatePaymentDto) {
    return this.clientsService.recordPayment(createPaymentDto);
  }

  @Get(':id/payment-history')
  async getPaymentHistory(@Param('id') id: string) {
    return this.clientsService.getPaymentHistory(Number(id));
  }

  // LISTA DE PRECIOS
  @Get('lists/prices')
  async getPriceList() {
    return this.clientsService.getPriceList();
  }

  // RANKING DE CLIENTES
  @Get('analytics/ranking')
  async getClientRanking() {
    return this.clientsService.getClientRanking();
  }

  // ANÁLISIS DE COMPRAS
  @Get(':id/analytics')
  async getPurchaseAnalytics(@Param('id') id: string) {
    return this.clientsService.getPurchaseAnalytics(Number(id));
  }

  // SUGERENCIAS DE VENTA
  @Get(':id/recommendations')
  async getSalesRecommendations(@Param('id') id: string) {
    return this.clientsService.getSalesRecommendations(Number(id));
  }
}
