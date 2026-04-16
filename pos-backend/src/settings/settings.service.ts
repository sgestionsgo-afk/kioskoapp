import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  UpdateStoreSettingsDto,
  CreateTaxDto,
  UpdateTaxDto,
  CreateBranchDto,
  UpdateBranchDto,
  CreatePromotionDto,
  UpdatePromotionDto,
} from './dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  // STORE SETTINGS
  async getStoreSettings() {
    let settings = await this.prisma.storeSettings.findFirst();
    if (!settings) {
      settings = await this.prisma.storeSettings.create({
        data: {},
      });
    }

    await this.ensureDefaultSeller(settings);
    await this.ensureDefaultIva(settings);

    return this.prisma.storeSettings.findUniqueOrThrow({
      where: { id: settings.id },
    });
  }

  private async ensureDefaultSeller(settings: any) {
    if (settings.defaultSellerId) return;

    const sellers = await this.prisma.seller.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });

    if (sellers.length === 0) {
      const defaultSeller = await this.prisma.seller.create({
        data: { name: 'Vendedor Principal' },
      });
      await this.prisma.storeSettings.update({
        where: { id: settings.id },
        data: { defaultSellerId: defaultSeller.id },
      });
      return;
    }

    await this.prisma.storeSettings.update({
      where: { id: settings.id },
      data: { defaultSellerId: sellers[0].id },
    });
  }

  private async ensureDefaultIva(settings: any) {
    const ivaTaxes = await this.prisma.tax.findMany({
      where: { type: 'IVA' },
      orderBy: { percentage: 'desc' },
    });

    if (ivaTaxes.length === 0) {
      const defaultIvas = [
        { name: 'IVA 21%', percentage: 21, type: 'IVA' },
        { name: 'IVA 10.5%', percentage: 10.5, type: 'IVA' },
        { name: 'IVA 27%', percentage: 27, type: 'IVA' },
        { name: 'IVA 0%', percentage: 0, type: 'IVA' },
      ];
      await this.prisma.tax.createMany({ data: defaultIvas });
      const createdTaxes = await this.prisma.tax.findMany({
        where: { type: 'IVA' },
        orderBy: { percentage: 'desc' },
      });
      await this.prisma.storeSettings.update({
        where: { id: settings.id },
        data: { defaultIvaTaxId: createdTaxes[0].id },
      });
      return;
    }

    if (!settings.defaultIvaTaxId) {
      await this.prisma.storeSettings.update({
        where: { id: settings.id },
        data: { defaultIvaTaxId: ivaTaxes[0].id },
      });
    }
  }




  async updateStoreSettings(updateStoreSettingsDto: UpdateStoreSettingsDto) {
    const settings = await this.getStoreSettings();
    return this.prisma.storeSettings.update({
      where: { id: settings.id },
      data: updateStoreSettingsDto,
    });
  }

  // TAX MANAGEMENT
  async createTax(createTaxDto: CreateTaxDto) {
    return this.prisma.tax.create({
      data: createTaxDto,
    });
  }

  async getTaxes() {
    return this.prisma.tax.findMany({
      orderBy: { percentage: 'desc' },
    });
  }

  async getTaxById(id: number) {
    return this.prisma.tax.findUnique({
      where: { id },
    });
  }

  async updateTax(id: number, updateTaxDto: UpdateTaxDto) {
    return this.prisma.tax.update({
      where: { id },
      data: updateTaxDto,
    });
  }

  async deleteTax(id: number) {
    return this.prisma.tax.delete({
      where: { id },
    });
  }

  // BRANCH MANAGEMENT
  async createBranch(createBranchDto: CreateBranchDto) {
    return this.prisma.branchSettings.create({
      data: createBranchDto,
    });
  }

  async getBranches() {
    return this.prisma.branchSettings.findMany({
      orderBy: [{ isMainBranch: 'desc' }, { name: 'asc' }],
    });
  }

  async getBranchById(id: number) {
    return this.prisma.branchSettings.findUnique({
      where: { id },
    });
  }

  async updateBranch(id: number, updateBranchDto: UpdateBranchDto) {
    return this.prisma.branchSettings.update({
      where: { id },
      data: updateBranchDto,
    });
  }

  async deleteBranch(id: number) {
    return this.prisma.branchSettings.delete({
      where: { id },
    });
  }

  // PROMOTION MANAGEMENT
  async createPromotion(createPromotionDto: CreatePromotionDto) {
    return this.prisma.promotionSettings.create({
      data: createPromotionDto,
    });
  }

  async getPromotions() {
    return this.prisma.promotionSettings.findMany({
      orderBy: { startDate: 'desc' },
    });
  }

  async getActivePromotions() {
    const now = new Date();
    return this.prisma.promotionSettings.findMany({
      where: {
        active: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });
  }

  async getPromotionById(id: number) {
    return this.prisma.promotionSettings.findUnique({
      where: { id },
    });
  }

  async updatePromotion(
    id: number,
    updatePromotionDto: UpdatePromotionDto,
  ) {
    return this.prisma.promotionSettings.update({
      where: { id },
      data: updatePromotionDto,
    });
  }

  async deletePromotion(id: number) {
    return this.prisma.promotionSettings.delete({
      where: { id },
    });
  }

  // SELLER MANAGEMENT
  async createSeller(name: string) {
    const seller = await this.prisma.seller.create({
      data: { name },
    });

    // If this is the first seller, set it as default
    const settings = await this.getStoreSettings();
    if (!settings.defaultSellerId) {
      await this.prisma.storeSettings.update({
        where: { id: settings.id },
        data: { defaultSellerId: seller.id },
      });
    }

    return seller;
  }

  async getSellers() {
    return this.prisma.seller.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }

  async getSellerById(id: number) {
    return this.prisma.seller.findUnique({
      where: { id },
    });
  }

  async updateSeller(id: number, name: string, active: boolean) {
    return this.prisma.seller.update({
      where: { id },
      data: { name, active },
    });
  }

  async deleteSeller(id: number) {
    const settings = await this.getStoreSettings();
    // If deleting the default seller, reset it
    if (settings.defaultSellerId === id) {
      const firstSeller = await this.prisma.seller.findFirst({
        where: { id: { not: id }, active: true },
        orderBy: { name: 'asc' },
      });
      await this.prisma.storeSettings.update({
        where: { id: settings.id },
        data: { defaultSellerId: firstSeller?.id || null },
      });
    }

    return this.prisma.seller.delete({
      where: { id },
    });
  }

  async setDefaultSeller(sellerId: number) {
    const settings = await this.getStoreSettings();
    return this.prisma.storeSettings.update({
      where: { id: settings.id },
      data: { defaultSellerId: sellerId },
    });
  }
}
