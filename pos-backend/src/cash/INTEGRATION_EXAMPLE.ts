/**
 * INTEGRATION EXAMPLE: Sales Module with Cash Module
 *
 * This file demonstrates how to integrate the Cash module with the existing
 * Sales module to automatically register SALE movements when sales are created.
 *
 * KEY CHANGES:
 * 1. Import CashModule in SalesModule
 * 2. Inject CashService in SalesService
 * 3. Call cashService.registerSaleMovement() after creating a sale
 * 4. Handle cases where no cash register is open (grace degradation)
 */

// ============================================================================
// 1. UPDATE SALES MODULE (sales.module.ts)
// ============================================================================

/*
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/tenant-middleware';
import { CashModule } from '../cash'; // NEW: Import CashModule
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';

@Module({
  imports: [
    PrismaModule,
    CashModule,  // NEW: Add to imports so CashService is available
  ],
  providers: [SalesService],
  controllers: [SalesController],
})
export class SalesModule {}
*/

// ============================================================================
// 2. UPDATE SALES SERVICE (sales.service.ts)
// ============================================================================

/*
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/tenant-middleware';
import { TenantContextService } from '../prisma/tenant-middleware';
import { CashService } from '../cash'; // NEW: Import CashService
import { CreateSaleDto } from './dto/create-sale.dto';

@Injectable()
export class SalesService {
  constructor(
    private prisma: PrismaService,
    private tenantContext: TenantContextService,
    private cashService: CashService, // NEW: Inject CashService
  ) {}

  /**
   * Create a new sale
   *
   * NEW: After creating the sale, automatically register a SALE movement
   * in the cash register (if one is open)
   */
  async create(createSaleDto: CreateSaleDto) {
    const tenantId = this.tenantContext.getTenantId();

    // Existing sale creation logic
    const sale = await this.prisma.sale.create({
      data: {
        tenantId,
        clientId: createSaleDto.clientId,
        sellerId: createSaleDto.sellerId,
        total: createSaleDto.total,
        taxAmount: createSaleDto.taxAmount || 0,
        items: {
          create: createSaleDto.items,
        },
      },
      include: {
        items: true,
        payments: true,
      },
    });

    // NEW: Register SALE movement in cash register
    // This is automatic and doesn't fail the sale if no register is open
    try {
      // Determine payment method from sale payments
      const paymentMethod = createSaleDto.paymentMethod || 'CASH';

      await this.cashService.registerSaleMovement(
        sale.id,
        sale.total,
        paymentMethod,
      );
    } catch (error) {
      // Log but don't fail - sale is already created
      console.error(
        `[SalesService] Failed to register cash movement for sale ${sale.id}:`,
        error,
      );
    }

    return sale;
  }

  // ... rest of SalesService methods
}
*/

// ============================================================================
// 3. USAGE EXAMPLE IN CONTROLLER
// ============================================================================

/*
@Controller('sales')
@UseGuards(AuthGuard('jwt'))
export class SalesController {
  constructor(private salesService: SalesService) {}

  @Post()
  async createSale(@Body() createSaleDto: CreateSaleDto) {
    const sale = await this.salesService.create(createSaleDto);

    return {
      status: 'SUCCESS',
      message: 'Sale created successfully',
      data: sale,
      // If cash register was open, a movement has been registered automatically
    };
  }
}
*/

// ============================================================================
// 4. COMPLETE EXECUTION FLOW
// ============================================================================

/*
CLIENT REQUEST:
POST /sales
{
  "clientId": "client-123",
  "sellerId": "seller-456",
  "total": 1000.00,
  "taxAmount": 210.00,
  "paymentMethod": "CASH",
  "items": [
    {
      "productId": "prod-1",
      "quantity": 2,
      "price": 250.00
    }
  ]
}

FLOW:
1. SalesController.createSale() receives request
2. SalesService.create() creates sale in database
3. After sale creation:
   a. If no cash register open → Warning logged, sale unaffected
   b. If cash register open → CashService.registerSaleMovement() called
   c. SALE movement recorded automatically with:
      - type: 'SALE'
      - amount: 1000.00
      - referenceId: sale.id
      - paymentMethod: 'CASH'
      - description: 'Sale {saleId}'
4. Movement appears in cash register reconciliation
5. Expected value updated automatically

RESPONSE:
{
  "status": "SUCCESS",
  "message": "Sale created successfully",
  "data": {
    "id": "sale-789",
    "tenantId": "tenant-1",
    "total": 1000.00,
    "status": "completed",
    "items": [...]
  }
}

CASH REGISTER STATE (after):
{
  "id": "register-123",
  "status": "OPEN",
  "openingAmount": 5000.00,
  "movements": [
    {
      "type": "SALE",
      "amount": 1000.00,
      "referenceId": "sale-789"
    }
  ],
  "expectedAmount": 6000.00  // 5000 + 1000
}
*/

// ============================================================================
// 5. HANDLING MULTIPLE PAYMENT METHODS
// ============================================================================

/*
When a sale has multiple payment methods (e.g., 600 cash + 400 card):

// For CARD payments, might want to use different movement logic:
if (paymentMethod === 'CARD') {
  await this.cashService.registerMovement({
    type: 'INCOME',  // Not SALE, since cash didn't enter
    paymentMethod: 'CARD',
    amount: 400,
    referenceId: sale.id,
    description: `Sale ${sale.id} - Card Payment`,
  });
} else if (paymentMethod === 'CASH') {
  await this.cashService.registerSaleMovement(sale.id, 600, 'CASH');
}

// Or handle split payments:
const cashAmount = sale.payments
  .filter(p => p.method === 'CASH')
  .reduce((sum, p) => sum + p.amount, 0);

if (cashAmount > 0) {
  await this.cashService.registerSaleMovement(sale.id, cashAmount, 'CASH');
}
*/

// ============================================================================
// 6. ERROR HANDLING
// ============================================================================

/*
SCENARIO 1: No cash register open
- registerSaleMovement() logs warning but doesn't fail
- Sale is still created
- Movement registered when register opens later (manual intervention or batch process)

SCENARIO 2: Network error during movement registration
- Sale is already created (committed to DB)
- Movement creation fails
- Log error for auditing
- Admin can manually reconcile

SCENARIO 3: Concurrent sales during closing
- Middleware ensures tenant isolation
- Each sale has own transaction
- No data corruption

BEST PRACTICE: Wrap in try-catch for graceful degradation
try {
  await this.cashService.registerSaleMovement(...);
} catch (error) {
  console.error('Movement registration failed:', error);
  // Continue - sale already created
}
*/

// ============================================================================
// 7. TESTING THE INTEGRATION
// ============================================================================

/*
describe('Sales Integration with Cash', () => {
  it('should register a SALE movement when creating a sale', async () => {
    // Arrange
    const openCash = await cashService.openCash(
      { openingAmount: 5000 },
      userId,
    );

    // Act
    const sale = await salesService.create({
      clientId: 'client-1',
      sellerId: 'seller-1',
      total: 1000,
      paymentMethod: 'CASH',
      items: [...],
    });

    // Assert - Check movement was registered
    const current = await cashService.getCurrentRegister();
    const saleMovement = current.movements.find(m => m.referenceId === sale.id);
    expect(saleMovement).toBeDefined();
    expect(saleMovement.type).toBe('SALE');
    expect(saleMovement.amount).toBe(1000);
  });

  it('should handle missing cash register gracefully', async () => {
    // Arrange: No opened cash register
    // Act
    expect(async () => {
      await salesService.create({...});
    }).not.toThrow(); // Should NOT throw

    // Assert: Sale created despite no cash register
    const sales = await prisma.sale.findMany();
    expect(sales.length).toBe(1);
  });
});
*/

export const CashIntegrationExample = {
  description:
    'Integration of Cash Module with Sales Module for automatic movement tracking',
  updated_files: [
    'src/sales/sales.module.ts - Add CashModule import',
    'src/sales/sales.service.ts - Add CashService injection and registerSaleMovement call',
  ],
  key_points: [
    'CashService.registerSaleMovement() called after sale creation',
    'Grace degradation: no error if no cash register open',
    'Automatic movement recording with SALE type',
    'Payment method captured in movement',
    'Sale unaffected if movement registration fails',
    'All movements respect tenant isolation (middleware)',
  ],
};
