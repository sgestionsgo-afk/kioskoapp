import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { SettingsService } from './settings.service';
import {
  UpdateStoreSettingsDto,
  CreateTaxDto,
  UpdateTaxDto,
  CreateBranchDto,
  UpdateBranchDto,
  CreatePromotionDto,
  UpdatePromotionDto,
} from './dto';

@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  // STORE SETTINGS
  @Get('store')
  async getStoreSettings() {
    return this.settingsService.getStoreSettings();
  }

  @Put('store')
  async updateStoreSettings(
    @Body() updateStoreSettingsDto: UpdateStoreSettingsDto,
  ) {
    return this.settingsService.updateStoreSettings(updateStoreSettingsDto);
  }

  // TAX MANAGEMENT
  @Post('taxes')
  async createTax(@Body() createTaxDto: CreateTaxDto) {
    return this.settingsService.createTax(createTaxDto);
  }

  @Get('taxes')
  async getTaxes() {
    return this.settingsService.getTaxes();
  }

  @Get('taxes/:id')
  async getTaxById(@Param('id') id: string) {
    return this.settingsService.getTaxById(Number(id));
  }

  @Put('taxes/:id')
  async updateTax(
    @Param('id') id: string,
    @Body() updateTaxDto: UpdateTaxDto,
  ) {
    return this.settingsService.updateTax(Number(id), updateTaxDto);
  }

  @Delete('taxes/:id')
  async deleteTax(@Param('id') id: string) {
    return this.settingsService.deleteTax(Number(id));
  }

  // BRANCH MANAGEMENT
  @Post('branches')
  async createBranch(@Body() createBranchDto: CreateBranchDto) {
    return this.settingsService.createBranch(createBranchDto);
  }

  @Get('branches')
  async getBranches() {
    return this.settingsService.getBranches();
  }

  @Get('branches/:id')
  async getBranchById(@Param('id') id: string) {
    return this.settingsService.getBranchById(Number(id));
  }

  @Put('branches/:id')
  async updateBranch(
    @Param('id') id: string,
    @Body() updateBranchDto: UpdateBranchDto,
  ) {
    return this.settingsService.updateBranch(Number(id), updateBranchDto);
  }

  @Delete('branches/:id')
  async deleteBranch(@Param('id') id: string) {
    return this.settingsService.deleteBranch(Number(id));
  }

  // PROMOTION MANAGEMENT
  @Post('promotions')
  async createPromotion(@Body() createPromotionDto: CreatePromotionDto) {
    return this.settingsService.createPromotion(createPromotionDto);
  }

  @Get('promotions')
  async getPromotions() {
    return this.settingsService.getPromotions();
  }

  @Get('promotions/active')
  async getActivePromotions() {
    return this.settingsService.getActivePromotions();
  }

  @Get('promotions/:id')
  async getPromotionById(@Param('id') id: string) {
    return this.settingsService.getPromotionById(Number(id));
  }

  @Put('promotions/:id')
  async updatePromotion(
    @Param('id') id: string,
    @Body() updatePromotionDto: UpdatePromotionDto,
  ) {
    return this.settingsService.updatePromotion(
      Number(id),
      updatePromotionDto,
    );
  }

  @Delete('promotions/:id')
  async deletePromotion(@Param('id') id: string) {
    return this.settingsService.deletePromotion(Number(id));
  }

  // SELLER MANAGEMENT
  @Post('sellers')
  async createSeller(@Body() createSellerDto: { name: string }) {
    return this.settingsService.createSeller(createSellerDto.name);
  }

  @Get('sellers')
  async getSellers() {
    return this.settingsService.getSellers();
  }

  @Get('sellers/:id')
  async getSellerById(@Param('id') id: string) {
    return this.settingsService.getSellerById(Number(id));
  }

  @Put('sellers/:id')
  async updateSeller(
    @Param('id') id: string,
    @Body() updateSellerDto: { name: string; active: boolean },
  ) {
    return this.settingsService.updateSeller(
      Number(id),
      updateSellerDto.name,
      updateSellerDto.active,
    );
  }

  @Delete('sellers/:id')
  async deleteSeller(@Param('id') id: string) {
    return this.settingsService.deleteSeller(Number(id));
  }

  @Put('sellers/:id/set-default')
  async setDefaultSeller(@Param('id') id: string) {
    return this.settingsService.setDefaultSeller(Number(id));
  }
}
