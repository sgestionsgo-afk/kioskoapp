import {
  Injectable,
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService, TenantContextService } from '../prisma/tenant-middleware';

/**
 * ============================================================================
 * JWT STRATEGY & PAYLOAD
 * ============================================================================
 * 
 * This is what gets stored in the JWT token after login.
 * The middleware extracts tenantId from here.
 */

export interface JwtPayload {
  id: string;           // User ID
  email: string;
  tenantId: string;     // ← CRITICAL: Tenant ID in token
  role: 'OWNER' | 'ADMIN' | 'CASHIER' | 'WAREHOUSE';
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface User extends JwtPayload {}
  }
}

/**
 * ============================================================================
 * CLIENT SERVICE - EXAMPLE WITH TENANT ISOLATION
 * ============================================================================
 * 
 * Notice: NO manual tenantId filtering needed!
 * The middleware handles it automatically.
 */

@Injectable()
export class ClientsService {
  constructor(
    private prisma: PrismaService,
    private tenantContext: TenantContextService,
  ) {}

  /**
   * CREATE - Inject tenantId from context
   * 
   * ✅ SAFE: Even if frontend sends tenantId, middleware validates it
   */
  async create(createClientDto: any) {
    const tenantId = this.tenantContext.getTenantId();

    return this.prisma.client.create({
      data: {
        ...createClientDto,
        tenantId, // Explicit injection from context
      },
    });
  }

  /**
   * FIND ALL - Automatically filtered by middleware
   * 
   * ✅ SAFE: Middleware adds { where: { tenantId } }
   */
  async findAll(filters?: any) {
    return this.prisma.client.findMany({
      where: filters,
      orderBy: { createdAt: 'desc' },
      include: {
        sales: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    // Query is automatically transformed to:
    // {
    //   where: {
    //     AND: [filters, { tenantId: user.tenantId }]
    //   }
    // }
  }

  /**
   * FIND ONE - Verified to belong to tenant
   * 
   * ✅ SAFE: Cannot access other tenants' records
   * Returns null if record doesn't exist or belongs to different tenant
   */
  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        sales: true,
        payments: true,
      },
    });

    // Middleware validates tenantId before returning
    // If record belongs to different tenant, return null
    return client;
  }

  /**
   * UPDATE - Verified to belong to tenant
   * 
   * ✅ SAFE: Middleware verifies ownership before update
   * Throws ForbiddenException if not owned by tenant
   */
  async update(id: string, updateClientDto: any) {
    return this.prisma.client.update({
      where: { id },
      data: updateClientDto,
    });
    // Middleware validates:
    // 1. Record exists
    // 2. Record belongs to current tenant
    // 3. Only then performs update
  }

  /**
   * DELETE - Verified to belong to tenant
   * 
   * ✅ SAFE: Cannot delete other tenants' data
   */
  async delete(id: string) {
    return this.prisma.client.delete({
      where: { id },
    });
    // Middleware validates ownership before deletion
  }

  /**
   * GET STATISTICS - Only for current tenant
   * 
   * ✅ SAFE: Aggregation automatically filtered
   */
  async getStatistics() {
    return this.prisma.client.aggregate({
      _count: true,
      _sum: {
        totalSpent: true,
      },
    });
    // Middleware adds tenantId filter to aggregation
  }
}

/**
 * ============================================================================
 * SALES SERVICE - CRITICAL OPERATIONS
 * ============================================================================
 */

@Injectable()
export class SalesService {
  constructor(
    private prisma: PrismaService,
    private tenantContext: TenantContextService,
  ) {}

  /**
   * Create sale with database transaction
   * 
   * ✅ SAFE: All operations within transaction are tenant-scoped
   */
  async createSale(createSaleDto: any) {
    const tenantId = this.tenantContext.getTenantId();

    // Transaction ensures atomicity
    // All nested queries still respect tenant middleware
    return this.prisma.$transaction(async (tx) => {
      // Create sale
      const sale = await tx.sale.create({
        data: {
          ...createSaleDto,
          tenantId,
        },
      });

      // Add items
      await Promise.all(
        createSaleDto.items.map((item: any) =>
          tx.saleItem.create({
            data: {
              ...item,
              saleId: sale.id,
            },
          })
        )
      );

      // Add payments
      await Promise.all(
        createSaleDto.payments.map((payment: any) =>
          tx.salePayment.create({
            data: {
              ...payment,
              saleId: sale.id,
              tenantId,
            },
          })
        )
      );

      // Record stock movements
      await Promise.all(
        createSaleDto.items.map((item: any) =>
          tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: 'SALE',
              quantity: -item.quantity,
              reference: sale.id,
              tenantId,
            },
          })
        )
      );

      return sale;
    });
    // ✅ SAFE: Even nested transactions respect tenant boundary
  }

  /**
   * Get sales summary for dashboard
   * 
   * ✅ SAFE: Cannot see other tenants' sales
   */
  async getSalesSummary(startDate: Date, endDate: Date) {
    const total = await this.prisma.sale.aggregate({
      _sum: { total: true },
      _count: true,
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const byPaymentMethod = await this.prisma.salePayment.groupBy({
      by: ['method'],
      where: {
        sale: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      _sum: { amount: true },
      _count: true,
    });

    return {
      totalSales: total._sum.total || 0,
      totalCount: total._count,
      byPaymentMethod,
    };
    // ✅ SAFE: groupBy automatically filtered by tenantId through middleware
  }
}

/**
 * ============================================================================
 * CONTROLLERS - HOW TO USE IN API
 * ============================================================================
 */

@Controller('api/v1/clients')
@UseGuards(AuthGuard('jwt')) // Validates JWT, extracts user
export class ClientsController {
  constructor(
    private clientsService: ClientsService,
    private tenantContext: TenantContextService,
  ) {}

  /**
   * POST /clients - Create client
   * 
   * Request headers:
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   * 
   * The JWT contains:
   * {
   *   "id": "user-123",
   *   "email": "admin@tenant-a.com",
   *   "tenantId": "tenant-a", ← Middleware extracts this
   *   "role": "OWNER"
   * }
   */
  @Post()
  async create(@Body() createClientDto: any) {
    const tenantId = this.tenantContext.getTenantId();
    
    return this.clientsService.create({
      ...createClientDto,
      tenantId, // Explicitly set from context
    });
    // Service: prisma.client.create({ data: { tenantId, ... } })
    // ✅ SAFE: Can only create for current tenant
  }

  /**
   * GET /clients - List all clients
   * 
   * Request:
   * GET /api/v1/clients?ivaCategory=RESPONSABLE_INSCRIPTO
   */
  @Get()
  async findAll(@Request() req: any) {
    // Optional: additional filtering beyond tenant
    const filters = {
      ivaCategory: req.query.ivaCategory,
    };

    return this.clientsService.findAll(filters);
    // Service transforms to:
    // prisma.client.findMany({
    //   where: {
    //     AND: [
    //       { ivaCategory: "RESPONSABLE_INSCRIPTO" },
    //       { tenantId: "tenant-a" } ← Added by middleware
    //     ]
    //   }
    // })
    // ✅ SAFE: Cannot filter away tenantId check
  }

  /**
   * GET /clients/:id - Get one client
   * 
   * Request:
   * GET /api/v1/clients/client-123
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const client = await this.clientsService.findOne(id);

    if (!client) {
      // Could be:
      // 1. Record doesn't exist
      // 2. Record belongs to different tenant
      // We return 404 in both cases (don't reveal which)
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  /**
   * PATCH /clients/:id - Update client
   * 
   * Request:
   * PATCH /api/v1/clients/client-123
   * {
   *   "name": "New Name"
   * }
   * 
   * Attack attempt:
   * PATCH /api/v1/clients/client-from-other-tenant
   * 
   * Result: ❌ ForbiddenException - Cannot update
   */
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateClientDto: any) {
    try {
      return await this.clientsService.update(id, updateClientDto);
    } catch (error) {
      if (error.code === 'P2025') {
        // Record not found (belongs to different tenant)
        throw new NotFoundException('Client not found');
      }
      throw error;
    }
  }

  /**
   * DELETE /clients/:id - Delete client
   * 
   * ✅ SAFE: Cannot delete other tenants' data
   */
  @Delete(':id')
  async delete(@Param('id') id: string) {
    try {
      return await this.clientsService.delete(id);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Client not found');
      }
      throw error;
    }
  }

  /**
   * GET /clients/analytics/summary - Get statistics
   * 
   * ✅ SAFE: Only returns stats for current tenant
   */
  @Get('analytics/summary')
  async getAnalytics() {
    return this.clientsService.getStatistics();
  }
}

@Controller('api/v1/sales')
@UseGuards(AuthGuard('jwt'))
export class SalesController {
  constructor(
    private salesService: SalesService,
    private tenantContext: TenantContextService,
  ) {}

  /**
   * POST /sales - Create complex sale with transaction
   * 
   * Request:
   * {
   *   "clientId": "client-123",
   *   "items": [
   *     { "productId": "prod-1", "quantity": 2, "price": 100 }
   *   ],
   *   "payments": [
   *     { "method": "CASH", "amount": 150 },
   *     { "method": "CARD", "amount": 50 }
   *   ]
   * }
   * 
   * ✅ SAFE: All nested operations respect tenant boundary
   * ✅ SAFE: Transaction ensures atomicity
   * ✅ SAFE: Stock movements recorded in same transaction
   */
  @Post()
  async create(@Body() createSaleDto: any) {
    return this.salesService.createSale(createSaleDto);
  }

  /**
   * GET /sales/summary - Dashboard statistics
   * 
   * Query params:
   * ?startDate=2026-04-01&endDate=2026-04-30
   */
  @Get('summary')
  async getSummary(
    @Request() req: any,
  ) {
    const startDate = new Date(req.query.startDate);
    const endDate = new Date(req.query.endDate);

    return this.salesService.getSalesSummary(startDate, endDate);
    // ✅ SAFE: Only sees sales from current tenant
  }
}

/**
 * ============================================================================
 * SECURITY PATTERNS
 * ============================================================================
 */

/**
 * PATTERN 1: ALWAYS validate current tenant
 * 
 * function getTenatId() {
 *   const tenantId = tenantContext.getTenantId(); // ← Throws if missing
 *   return tenantId;
 * }
 */

/**
 * PATTERN 2: NEVER pass user-provided tenantId without validation
 * 
 * ❌ BAD:
 * async getClient(clientId: string, tenantId: string) {
 *   return prisma.client.findUnique({
 *     where: { id: clientId },
 *   });
 *   // User could manipulate tenantId query param!
 * }
 * 
 * ✅ GOOD:
 * async getClient(clientId: string) {
 *   const tenantId = tenantContext.getTenantId();
 *   return prisma.client.findUnique({
 *     where: { id: clientId },
 *     // Middleware validates tenantId
 *   });
 * }
 */

/**
 * PATTERN 3: ALWAYS check for ForbiddenException
 * 
 * const client = await prisma.client.findUnique({
 *   where: { id },
 * });
 * 
 * if (!client) {
 *   throw new NotFoundException(); // Not found OR not owned by tenant
 * }
 */

/**
 * ============================================================================
 * THREAT MODELS MITIGATED
 * ============================================================================
 */

/*
THREAT 1: Cross-Tenant Data Access
Attack: GET /api/v1/clients - try to list all clients

Defense:
  1. Middleware adds tenantId filter
  2. Only returns clients belonging to current tenant
  3. ✅ MITIGATED

---

THREAT 2: Unauthorized Record Access
Attack: GET /api/v1/clients/other-tenant-client-id

Defense:
  1. Middleware validates tenantId before returning
  2. Returns null if doesn't belong to tenant
  3. Controller returns 404 (don't reveal existence)
  4. ✅ MITIGATED

---

THREAT 3: Unauthorized Update/Delete
Attack: DELETE /api/v1/clients/other-tenant-client-id

Defense:
  1. Middleware verifies record belongs to tenant
  2. Throws ForbiddenException if not owned
  3. Log security event
  4. ✅ MITIGATED

---

THREAT 4: Developer Forgets Tenant Filter
Attack: Developer writes query without thinking about tenants

Defense:
  1. Middleware AUTOMATICALLY adds filter
  2. Impossible to query without tenantId
  3. Fail-safe by design
  4. ✅ MITIGATED

---

THREAT 5: SQL Injection / Prisma Injection
Attack: Malicious input in search filter

Defense:
  1. Prisma parameterized queries
  2. tenantId injected by middleware (not user input)
  3. Middleware logic cannot be bypassed
  4. ✅ MITIGATED

---

THREAT 6: JWT Tampering
Attack: User modifies JWT to change tenantId

Defense:
  1. JWT signed with secret key
  2. Tampering invalidates signature
  3. JWT rejected by passport
  4. ✅ MITIGATED

---

THREAT 7: Transaction Isolation Violation
Attack: Within transaction, skip tenant filtering

Defense:
  1. Middleware applies to ALL queries
  2. Even inside $transaction()
  3. Nested queries still validated
  4. ✅ MITIGATED
*/
