# POS SaaS Refactor Guide

## Overview

This document outlines the comprehensive refactor of the POS system from a single-tenant SQLite application to a **production-ready multi-tenant SaaS platform** with PostgreSQL support, user authentication, and billing.

---

## 🎯 Key Changes

### 1. Multi-Tenant Architecture

#### New: Tenant Model
```prisma
model Tenant {
  id       String   @id @default(cuid())
  name     String
  plan     String   @default("starter")
  status   String   @default("active")
  
  // All business entities are now scoped to a tenant
  users    User[]
  products Product[]
  clients  Client[]
  // ... etc
}
```

**Every business entity now includes:**
```prisma
tenantId String
tenant   Tenant @relation(...)
@@index([tenantId])
```

**Benefits:**
- Complete data isolation per tenant
- Ability to serve multiple customers
- Scalable billing model
- Compliance with data residency requirements

---

### 2. User Authentication & Authorization

#### New: User Model with Roles
```prisma
model User {
  id        String  @id @default(cuid())
  email     String  @unique
  password  String  // Must be hashed!
  role      Role    // OWNER, ADMIN, CASHIER, WAREHOUSE
  tenantId  String
  active    Boolean @default(true)
  lastLogin DateTime?
  
  @@unique([email, tenantId]) // One email per tenant
}

enum Role {
  OWNER      // Full access
  ADMIN      // Administrative access
  CASHIER    // POS operations only
  WAREHOUSE  // Stock management only
}
```

**Implementation Notes:**
- Each user belongs to exactly one tenant
- Roles determine API/UI access
- Email is unique per tenant (same person can be user in multiple tenants)
- Password should be hashed using bcrypt/argon2

**Migration Strategy:**
```typescript
// After schema migration:
1. Create Tenant record
2. Create User with OWNER role
3. Associate existing data with tenantId
4. Create local admin user
```

---

### 3. Relational Payment Model (Replacing JSON)

#### Before (SQLite - JSON-based)
```prisma
model Sale {
  paymentMethod    String     // Single method
  paymentBreakdown String?    // JSON string
}
```

#### After (PostgreSQL - Relational)
```prisma
model Sale {
  id       String   @id @default(cuid())
  total    Float
  payments SalePayment[]  // Multiple payment methods
}

model SalePayment {
  id       String   @id @default(cuid())
  saleId   String
  method   String   // CASH, CARD, CHECK, TRANSFER, OTHER
  amount   Float
  reference String?  // Transaction ID, check number, etc
}
```

**Benefits:**
- Type-safe queries (no JSON parsing)
- Better performance with indexes
- Easier reporting and analytics
- Audit trail support

**Query Example:**
```typescript
// Get total by payment method
const stats = await prisma.salePayment.groupBy({
  by: ['method'],
  where: { tenantId: 'tenant-1' },
  _sum: { amount: true },
});
```

---

### 4. Stock Movement History

#### New: StockMovement Model
```prisma
model StockMovement {
  id         String   @id @default(cuid())
  productId  String
  type       String   // SALE, PURCHASE, ADJUSTMENT, RETURN
  quantity   Float    // Can be negative
  reference  String?  // Sale ID, PO number, etc
  reason     String?  // Why was stock adjusted?
  createdAt  DateTime @default(now())
}
```

**This enables:**
- Complete audit trail of stock changes
- Real-time inventory tracking
- Historical analysis
- Variance investigation

**Usage in Sale Flow:**
```typescript
// When creating a sale:
await prisma.stockMovement.create({
  data: {
    productId: item.productId,
    type: 'SALE',
    quantity: -item.quantity,
    reference: sale.id,
    tenantId: sale.tenantId,
  }
});
```

---

### 5. SaaS Subscription Model

#### New: Subscription Model
```prisma
model Subscription {
  id                String   @id @default(cuid())
  tenantId          String   @unique
  plan              String   // starter, pro, enterprise
  status            String   // active, past_due, canceled
  currentPeriodEnd  DateTime // Renewal date
  canceledAt        DateTime?
}
```

**Billing Plans (Example):**
```
Starter:   $0     - 1 user, 1000 sales/month, basic features
Pro:       $29    - 5 users, 10000 sales/month, advanced reports
Enterprise: Custom - unlimited, dedicated support
```

**Billing Middleware:**
```typescript
// Protect endpoints based on subscription
@UseGuards(ActiveSubscriptionGuard)
@Post('/sales')
createSale() { ... }
```

---

### 6. Enhanced Data Models

#### Improved Product Model
```prisma
model Product {
  id          String  @id @default(cuid())
  tenantId    String
  
  name        String
  sku         String?          // Stock Keeping Unit - better for barcodes
  description String?
  isWeighable Boolean
  pricePerKg  Float?
  price       Float?
  stock       Float            // Changed from Int to support partial quantities
  
  stockMovements StockMovement[]
  
  @@unique([tenantId, sku])  // SKU unique per tenant
}
```

#### Improved Seller Model
```prisma
model Seller {
  id         String  @id @default(cuid())
  tenantId   String
  name       String
  email      String?
  phone      String?
  commission Float   // Commission percentage for analytics
  active     Boolean
  
  @@unique([tenantId, name])
}
```

#### Enhanced Sale Model
```prisma
model Sale {
  id        String  @id @default(cuid())
  tenantId  String  // CRITICAL - All queries must filter by tenantId
  
  clientId  String?  // Optional - can have anonymous sales
  sellerId  String?  // Link to seller, not just name
  status    String  // completed, pending, canceled - new!
  
  items     SaleItem[]
  payments  SalePayment[]  // Replaces JSON
  
  @@index([tenantId])   // CRITICAL for performance
  @@index([status])
  @@index([createdAt])  // For reports
}
```

#### Client Model with Full Address
```prisma
model Client {
  id          String @id @default(cuid())
  tenantId    String
  
  name        String
  email       String?
  phone       String?
  
  // Complete address
  address     String?
  city        String?
  province    String?
  postalCode  String?
  country     String @default("Argentina")
  
  cuit        String?
  ivaCategory String
  
  @@unique([tenantId, cuit])
}
```

---

### 7. ID Strategy - cuid() over autoincrement()

#### SQLite (Old)
```prisma
model Product {
  id Int @id @default(autoincrement())
}
// Problem: Sequential IDs not suitable for distributed systems
```

#### PostgreSQL (New)
```prisma
model Product {
  id String @id @default(cuid())
}
```

**Benefits:**
- Database-agnostic (works with PostgreSQL, MySQL, MongoDB)
- Not sequential (better privacy)
- URL-safe
- Collision-resistant
- Ready for distributed/microservices architecture

**Comparison:**
| Feature | autoincrement | cuid |
|---------|--------------|------|
| Distributed | ❌ | ✅ |
| Sequential | ✅ | ❌ |
| URL-safe | ⚠️ (queryable) | ✅ |
| Performance | ✅ | ✅ |
| Privacy | ❌ | ✅ |

---

## 🗄️ Database Migration Guide

### Step 1: Prepare PostgreSQL

```bash
# 1. Create new PostgreSQL database
createdb kioscoapp_saas

# 2. Update .env
DATABASE_URL="postgresql://user:password@localhost:5432/kioscoapp_saas"
```

### Step 2: Data Migration Script

```typescript
// scripts/migrate-to-saas.ts
import { PrismaClient as OldPrisma } from '@prisma/client-old';
import { PrismaClient as NewPrisma } from '@prisma/client';
import { v4 as uuid } from 'uuid';

const oldDb = new OldPrisma(); // SQLite
const newDb = new NewPrisma(); // PostgreSQL

async function migrateToSaaS() {
  try {
    // 1. Create default tenant
    const tenant = await newDb.tenant.create({
      data: {
        id: uuid(),
        name: 'Default Tenant',
        plan: 'pro',
      },
    });

    // 2. Migrate products
    const oldProducts = await oldDb.product.findMany();
    for (const prod of oldProducts) {
      await newDb.product.create({
        data: {
          id: uuid(),
          tenantId: tenant.id,
          name: prod.name,
          isWeighable: prod.isWeighable,
          pricePerKg: prod.pricePerKg,
          price: prod.price,
          stock: prod.stock,
          description: prod.description,
        },
      });
    }

    // 3. Migrate clients
    const oldClients = await oldDb.client.findMany();
    for (const client of oldClients) {
      await newDb.client.create({
        data: {
          id: uuid(),
          tenantId: tenant.id,
          name: client.name,
          email: client.email,
          phone: client.phone,
          address: client.address,
          cuit: client.cuit,
          ivaCategory: client.ivaCategory,
          totalSpent: client.totalSpent,
          purchaseCount: client.purchaseCount,
          lastPurchaseDate: client.lastPurchaseDate,
        },
      });
    }

    // 4. Migrate sales with new payment structure
    const oldSales = await oldDb.sale.findMany({
      include: { items: true },
    });
    for (const sale of oldSales) {
      const newSale = await newDb.sale.create({
        data: {
          id: uuid(),
          tenantId: tenant.id,
          total: sale.total,
          clientId: sale.clientId ? mapClientId(sale.clientId) : null,
          taxAmount: sale.taxAmount,
          items: {
            create: sale.items.map(item => ({
              id: uuid(),
              productId: mapProductId(item.productId),
              productName: item.productName,
              quantity: item.quantity,
              weight: item.weight,
              price: item.price,
            })),
          },
        },
      });

      // Parse old JSON and create SalePayment records
      if (sale.paymentBreakdown) {
        const payments = JSON.parse(sale.paymentBreakdown);
        for (const payment of payments) {
          await newDb.salePayment.create({
            data: {
              id: uuid(),
              tenantId: tenant.id,
              saleId: newSale.id,
              method: payment.method,
              amount: payment.amount,
            },
          });
        }
      } else {
        // Single payment
        await newDb.salePayment.create({
          data: {
            id: uuid(),
            tenantId: tenant.id,
            saleId: newSale.id,
            method: sale.paymentMethod || 'CASH',
            amount: sale.total,
          },
        });
      }
    }

    // 5. Create subscription
    await newDb.subscription.create({
      data: {
        id: uuid(),
        tenantId: tenant.id,
        plan: 'pro',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // 6. Create owner user
    await newDb.user.create({
      data: {
        id: uuid(),
        email: 'admin@example.com',
        password: 'hashed-password', // Hash in production!
        name: 'Admin',
        role: 'OWNER',
        tenantId: tenant.id,
      },
    });

    console.log('✅ Migration completed successfully!');
    console.log(`Tenant ID: ${tenant.id}`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await oldDb.$disconnect();
    await newDb.$disconnect();
  }
}

migrateToSaaS();
```

### Step 3: Run Prisma Migrations

```bash
# Create migration
npx prisma migrate dev --name init_saas_schema

# Deploy to production
npx prisma migrate deploy
```

---

## 🔐 Tenant Isolation (CRITICAL)

**Every query must filter by tenantId to prevent data leakage:**

### ✅ CORRECT - Tenant-scoped query
```typescript
@UseGuards(AuthGuard)
async getSales(@Req() req) {
  const { tenantId } = req.user; // From JWT token
  
  return this.prisma.sale.findMany({
    where: { tenantId }, // CRITICAL!
  });
}
```

### ❌ WRONG - Data leakage
```typescript
async getSales() {
  return this.prisma.sale.findMany(); // Returns ALL tenants' data!
}
```

### Use Middleware to Enforce It
```typescript
// middleware/tenant.middleware.ts
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const user = req.user as any;
    
    if (!user?.tenantId) {
      throw new UnauthorizedException('Tenant not identified');
    }
    
    res.locals.tenantId = user.tenantId;
    next();
  }
}
```

---

## 🚀 NestJS Service Updates

### Clients Service Example

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createClientDto: CreateClientDto) {
    return this.prisma.client.create({
      data: {
        ...createClientDto,
        tenantId, // ALWAYS include tenantId
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.client.findMany({
      where: { tenantId }, // ALWAYS filter by tenantId
    });
  }

  async findOne(tenantId: string, id: string) {
    return this.prisma.client.findUnique({
      where: { id },
    });
    
    // Validate the client belongs to the tenant!
    if (result?.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }
    
    return result;
  }

  async update(tenantId: string, id: string, updateClientDto: UpdateClientDto) {
    // First verify ownership
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (client?.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.client.update({
      where: { id },
      data: updateClientDto,
    });
  }

  async getCreditAccount(tenantId: string, id: string) {
    const client = await this.findOne(tenantId, id);
    
    const payments = await this.prisma.clientPayment.aggregate({
      where: { clientId: id, tenantId },
      _sum: { amount: true },
    });

    return {
      totalPurchases: client.totalSpent,
      totalPayments: payments._sum.amount || 0,
      balance: client.totalSpent - (payments._sum.amount || 0),
    };
  }
}
```

### Sales Service with New Payment Model

```typescript
@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createSaleDto: CreateSaleDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Create sale
      const sale = await tx.sale.create({
        data: {
          tenantId,
          clientId: createSaleDto.clientId,
          sellerId: createSaleDto.sellerId,
          total: createSaleDto.total,
          taxAmount: createSaleDto.taxAmount,
          items: {
            create: createSaleDto.items.map(item => ({
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              price: item.price,
              weight: item.weight,
            })),
          },
        },
        include: { items: true },
      });

      // 2. Create payment records (replaces JSON)
      await Promise.all(
        createSaleDto.payments.map(payment =>
          tx.salePayment.create({
            data: {
              tenantId,
              saleId: sale.id,
              method: payment.method,
              amount: payment.amount,
              reference: payment.reference,
            },
          })
        )
      );

      // 3. Record stock movements
      await Promise.all(
        createSaleDto.items.map(item =>
          tx.stockMovement.create({
            data: {
              tenantId,
              productId: item.productId,
              type: 'SALE',
              quantity: -item.quantity,
              reference: sale.id,
            },
          })
        )
      );

      // 4. Update client stats
      if (createSaleDto.clientId) {
        await tx.client.update({
          where: { id: createSaleDto.clientId },
          data: {
            totalSpent: { increment: createSaleDto.total },
            purchaseCount: { increment: 1 },
            lastPurchaseDate: new Date(),
          },
        });
      }

      return sale;
    });
  }

  async getAnalytics(tenantId: string) {
    const stats = await this.prisma.sale.aggregate({
      where: { tenantId },
      _sum: { total: true },
      _count: true,
    });

    const paymentStats = await this.prisma.salePayment.groupBy({
      by: ['method'],
      where: { tenantId },
      _sum: { amount: true },
      _count: true,
    });

    return {
      totalSales: stats._sum.total || 0,
      transactionCount: stats._count,
      byPaymentMethod: paymentStats,
    };
  }
}
```

---

## 📊 Entity Relationship Diagram

```
┌─────────────┐
│   Tenant    │ (Root entity)
└─────────────┘
       │
       ├─── User (Authentication)
       ├─── Product
       ├─── Client
       ├─── Sale ←────┐
       │  ├─ SaleItem │
       │  └─ SalePayment (Replaces JSON)
       │  └─ StockMovement (New)
       │
       ├─── Seller
       ├─── Tax
       ├─── ClientPayment
       ├─── Branch
       ├─── Promotion
       ├─── StoreSettings
       └─── Subscription (Billing)
```

---

## 🔄 Key API Changes

### Before: Single-Tenant
```bash
POST   /clients
GET    /clients
GET    /clients/:id
```

### After: Multi-Tenant
```bash
# Tenant extracted from JWT token
POST   /clients              # tenantId injected automatically
GET    /clients              # All results filtered by tenantId
GET    /clients/:id          # Verified to belong to tenant
```

**Controller Pattern:**
```typescript
@Controller('api/v1/clients')
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @GetUser('tenantId') tenantId: string,
    @Body() createClientDto: CreateClientDto,
  ) {
    return this.clientsService.create(tenantId, createClientDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@GetUser('tenantId') tenantId: string) {
    return this.clientsService.findAll(tenantId);
  }
}
```

---

## 🛡️ Security Checklist

- [ ] All endpoints have `@UseGuards(JwtAuthGuard)`
- [ ] All queries filter by `tenantId`
- [ ] Verify `tenantId` matches JWT token's tenant
- [ ] Hash passwords with bcrypt/argon2
- [ ] Validate email format and uniqueness per tenant
- [ ] Add rate limiting to auth endpoints
- [ ] Use HTTPS in production
- [ ] Add CORS policy restrictions
- [ ] Implement audit logging for sensitive operations
- [ ] Add pagination to prevent data dumps

---

## 📈 Performance Optimizations

### Indexes Applied
```prisma
// Tenant isolation
@@index([tenantId])

// Unique constraints
@@unique([tenantId, cuit])
@@unique([tenantId, sku])
@@unique([tenantId, name])

// Query optimization
@@index([status])
@@index([createdAt])
@@index([role])
@@index([plan])
```

### N+1 Query Prevention
```typescript
// ❌ BAD - N+1 queries
const clients = await prisma.client.findMany({});
for (const client of clients) {
  const sales = await prisma.sale.findMany({
    where: { clientId: client.id }
  }); // Query per client!
}

// ✅ GOOD - Single query with relation
const clients = await prisma.client.findMany({
  include: {
    sales: true, // Loaded in one batch
  },
});
```

---

## 📋 Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/kioscoapp_saas"

# JWT
JWT_SECRET="your-super-secret-key"
JWT_EXPIRY="24h"

# Stripe (for billing)
STRIPE_SECRET_KEY="sk_test_..."

# Email (for notifications)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Environment
NODE_ENV="production"
```

---

## 🧪 Testing Strategy

### Unit Tests - Service Layer
```typescript
describe('ClientsService', () => {
  let service: ClientsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    // Setup with mock tenant
    const tenant = await prisma.tenant.create({
      data: { name: 'Test Tenant' },
    });
  });

  it('should create client scoped to tenant', async () => {
    const client = await service.create(tenantId, {
      name: 'Test Client',
    });

    expect(client.tenantId).toBe(tenantId);
  });

  it('should not access other tenant data', async () => {
    const other = await service.findAll('other-tenant-id');
    expect(other).toHaveLength(0);
  });
});
```

### Integration Tests - API Layer
```typescript
describe('Clients API', () => {
  it('should require authentication', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/clients');

    expect(res.status).toBe(401);
  });

  it('should filter by tenant from JWT', async () => {
    const token = generateToken({ tenantId: 'tenant-1' });
    
    const res = await request(app.getHttpServer())
      .get('/api/v1/clients')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body).toHaveLength(0); // Only tenant-1 data
  });
});
```

---

## 🚀 Deployment Checklist

- [ ] PostgreSQL database provisioned
- [ ] Database migrations run: `npx prisma migrate deploy`
- [ ] Environment variables set
- [ ] Authentication service deployed
- [ ] Email service configured
- [ ] Stripe integration complete
- [ ] CDN configured for frontend
- [ ] Monitoring/logging setup
- [ ] Backups configured
- [ ] SSL certificates installed
- [ ] Rate limiting enabled
- [ ] CORS policies configured

---

## 📚 Next Steps

1. **Complete Migration**: Run data migration script
2. **Update Services**: Apply tenant scoping to all services
3. **Update Controllers**: Add tenant extraction from JWT
4. **Auth Service**: Implement user registration, login, JWT
5. **Billing**: Integrate Stripe for subscription management
6. **Frontend**: Update API calls to work with JWT tokens
7. **Testing**: Add comprehensive test suite
8. **Deployment**: Deploy to production infrastructure

---

## 🔗 Related Files

- Database Schema: [schema.prisma](./schema.prisma)
- Migration Script: `scripts/migrate-to-saas.ts` (To be created)
- Auth Service: `src/auth/` (To be created)
- Billing Service: `src/billing/` (To be created)

---

**Version:** 1.0.0  
**Date:** April 16, 2026  
**Status:** Ready for Implementation
