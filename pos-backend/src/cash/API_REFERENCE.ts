/**
 * CASH REGISTER MODULE - COMPLETE IMPLEMENTATION GUIDE
 *
 * A production-ready, multi-tenant cash register system for POS
 * with automatic tenant isolation, movement tracking, and reconciliation.
 *
 * Version: 1.0
 * Status: Production Ready
 * Security: Enterprise Level (Multi-Tenant)
 */

// ============================================================================
// 1. SETUP & CONFIGURATION
// ============================================================================

/**
 * Step 1: Update app.module.ts to include CashModule
 */

/*
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/tenant-middleware';
import { AuthModule } from './auth/auth.module';
import { SalesModule } from './sales/sales.module';
import { ProductsModule } from './products/products.module';
import { ClientsModule } from './clients/clients.module';
import { CashModule } from './cash'; // NEW

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    SalesModule,
    ProductsModule,
    ClientsModule,
    CashModule,  // NEW: Add CashModule
  ],
})
export class AppModule {}
*/

/**
 * Step 2: Run Prisma migrations to create new tables
 */

/*
$ npx prisma migrate dev --name add_cash_register_module
$ npx prisma generate
*/

// ============================================================================
// 2. API ENDPOINTS - COMPLETE REFERENCE
// ============================================================================

/**
 * ENDPOINT: POST /cash/open
 * PURPOSE: Open a new cash register session
 * REQUIRES: JWT token, CASHIER role or higher
 *
 * REQUEST BODY:
 * {
 *   "openingAmount": 5000
 * }
 *
 * RESPONSE (201 Created):
 * {
 *   "id": "cljxyz123abc",
 *   "tenantId": "tenant-1",
 *   "status": "OPEN",
 *   "openingAmount": 5000,
 *   "openedAt": "2026-04-16T10:00:00Z",
 *   "openedByUserId": "user-456",
 *   "message": "Cash register opened with ARS 5000"
 * }
 *
 * ERROR CASES:
 * - 400: Register already open (only one per tenant)
 * - 400: Invalid openingAmount (must be positive)
 * - 401: Unauthorized (no JWT token)
 * - 403: Forbidden (insufficient role)
 */

/**
 * ENDPOINT: POST /cash/close
 * PURPOSE: Close current cash register and reconcile
 * REQUIRES: JWT token, CASHIER role or higher
 *
 * REQUEST BODY:
 * {
 *   "closingAmount": 6250.50,
 *   "notes": "Cash matches perfectly"
 * }
 *
 * RESPONSE (200 OK):
 * {
 *   "id": "cljxyz123abc",
 *   "tenantId": "tenant-1",
 *   "status": "CLOSED",
 *   "openingAmount": 5000,
 *   "closingAmount": 6250.50,
 *   "expectedAmount": 6250.50,
 *   "difference": 0,
 *   "closedAt": "2026-04-16T18:00:00Z",
 *   "closedByUserId": "user-456",
 *   "totalSales": 1250,
 *   "totalIncomes": 100,
 *   "totalExpenses": 50,
 *   "isBalanced": true,
 *   "message": "Cash register balanced perfectly!"
 * }
 *
 * ERROR CASES:
 * - 404: No open register found
 * - 400: Invalid closingAmount
 */

/**
 * ENDPOINT: POST /cash/movement
 * PURPOSE: Register manual movement (INCOME or EXPENSE)
 * REQUIRES: JWT token, CASHIER role or higher
 *
 * REQUEST BODY:
 * {
 *   "type": "EXPENSE",
 *   "amount": 100,
 *   "paymentMethod": "CASH",
 *   "description": "Stock purchase",
 *   "referenceId": "purchase-order-123",
 *   "referenceType": "PURCHASE_ORDER"
 * }
 *
 * RESPONSE (201 Created):
 * {
 *   "id": "clk123xyz456",
 *   "tenantId": "tenant-1",
 *   "cashRegisterId": "cljxyz123abc",
 *   "type": "EXPENSE",
 *   "paymentMethod": "CASH",
 *   "amount": 100,
 *   "referenceId": "purchase-order-123",
 *   "description": "Stock purchase",
 *   "createdAt": "2026-04-16T14:30:00Z"
 * }
 *
 * ERROR CASES:
 * - 400: No open cash register
 * - 400: Invalid movement data
 */

/**
 * ENDPOINT: GET /cash/current
 * PURPOSE: Get current open cash register with stats
 * REQUIRES: JWT token (any authenticated user)
 *
 * QUERY PARAMS: None
 *
 * RESPONSE (200 OK):
 * {
 *   "status": "OK",
 *   "data": {
 *     "id": "cljxyz123abc",
 *     "tenantId": "tenant-1",
 *     "status": "OPEN",
 *     "openingAmount": 5000,
 *     "openedAt": "2026-04-16T10:00:00Z",
 *     "openedByUserId": "user-456",
 *     "openedByUserName": "Maria García",
 *     "stats": {
 *       "sales": 1250,
 *       "incomes": 100,
 *       "expenses": 50,
 *       "netAmount": 1300
 *     }
 *   }
 * }
 *
 * RESPONSE if no register open (200 OK):
 * {
 *   "status": "NO_OPEN_REGISTER",
 *   "message": "No cash register is currently open",
 *   "data": null
 * }
 */

/**
 * ENDPOINT: GET /cash/movements
 * PURPOSE: Get movements from current open register (with filtering)
 * REQUIRES: JWT token (any authenticated user)
 *
 * QUERY PARAMS:
 * - type: Filter by type (SALE, INCOME, EXPENSE) - optional
 * - paymentMethod: Filter by payment method (CASH, CARD, etc) - optional
 *
 * EXAMPLE: GET /cash/movements?type=SALE&paymentMethod=CASH
 *
 * RESPONSE (200 OK):
 * {
 *   "status": "OK",
 *   "count": 15,
 *   "data": [
 *     {
 *       "id": "clk123xyz456",
 *       "type": "SALE",
 *       "amount": 500,
 *       "paymentMethod": "CASH",
 *       "referenceId": "sale-789",
 *       "description": "Sale sale-789",
 *       "createdAt": "2026-04-16T14:30:00Z"
 *     },
 *     ...
 *   ]
 * }
 */

/**
 * ENDPOINT: GET /cash/history
 * PURPOSE: Get closed cash registers (paginated history)
 * REQUIRES: JWT token, ADMIN role or higher
 *
 * QUERY PARAMS:
 * - limit: Number of records (default: 30, max: 100)
 * - offset: Pagination offset (default: 0)
 *
 * EXAMPLE: GET /cash/history?limit=50&offset=0
 *
 * RESPONSE (200 OK):
 * {
 *   "status": "OK",
 *   "data": {
 *     "total": 42,
 *     "limit": 50,
 *     "offset": 0,
 *     "data": [
 *       {
 *         "id": "cljxyz123abc",
 *         "status": "CLOSED",
 *         "openingAmount": 5000,
 *         "closingAmount": 6250.50,
 *         "expectedAmount": 6250.50,
 *         "difference": 0,
 *         "isBalanced": true,
 *         "closedAt": "2026-04-16T18:00:00Z",
 *         "openedByUserName": "Maria García",
 *         "closedByUserName": "Maria García"
 *       },
 *       ...
 *     ]
 *   }
 * }
 */

// ============================================================================
// 3. BUSINESS LOGIC EXAMPLES
// ============================================================================

/**
 * EXAMPLE 1: Morning routine - Open register with initial float
 */

/*
REQUEST:
POST /cash/open
{
  "openingAmount": 5000
}

RESULT:
- CashRegister created with status='OPEN'
- openingAmount = 5000
- Expected amount initially = 5000 (no movements yet)
- Ready to register sales and movements
*/

/**
 * EXAMPLE 2: Throughout the day - Sales and movements tracked
 */

/*
Time 10:05 - Sale 1: $250 in cash
{
  "type": "SALE",
  "amount": 250,
  "paymentMethod": "CASH",
  "referenceId": "sale-001",
  "description": "Sale sale-001"
}
Expected = 5000 + 250 = 5250

Time 11:30 - Income: $100 cash (supplier credit)
{
  "type": "INCOME",
  "amount": 100,
  "paymentMethod": "CASH",
  "description": "Supplier credit for damaged goods"
}
Expected = 5250 + 100 = 5350

Time 13:00 - Expense: $50 cash (purchase)
{
  "type": "EXPENSE",
  "amount": 50,
  "paymentMethod": "CASH",
  "description": "Purchase packaging materials"
}
Expected = 5350 - 50 = 5300

Time 17:00 - Close register
closingAmount = 5300 (actual cash counted)
Difference = 5300 - 5300 = 0 (perfect balance)
*/

/**
 * EXAMPLE 3: Closing with discrepancy
 */

/*
Expected = 5300 (calculated from movements)
Actual counted = 5295 (shortage of $5)

POST /cash/close
{
  "closingAmount": 5295,
  "notes": "Small shortage found - needs investigation"
}

RESPONSE:
{
  "isBalanced": false,
  "difference": -5,
  "message": "Difference detected: ARS -5.00",
  "details": "Shortage of 5 pesos detected"
}

FOLLOW-UP:
- Admin reviews the register history
- Investigates which transactions caused shortage
- Adjusts inventory or clarifies discrepancy
*/

// ============================================================================
// 4. SECURITY FEATURES
// ============================================================================

/**
 * Multi-Tenant Isolation
 * - Every query automatically filtered by tenantId (via middleware)
 * - Impossible to access other tenants' cash data
 * - All movements linked to correct tenant
 * - Cross-tenant access prevented at database level
 */

/**
 * Role-Based Access Control
 * - OWNER: Full access (audit, configure)
 * - ADMIN: Full access (audit, configure)
 * - CASHIER: Can open/close and register movements
 * - WAREHOUSE: Denied (no cash register access)
 */

/**
 * Audit Trail
 * - Every register opening/closing logged
 * - User who performed action recorded
 * - All movements timestamped
 * - Immutable history (movements cannot be deleted)
 */

/**
 * Data Integrity
 * - Only one OPEN register per tenant (DB constraint)
 * - Movements attached to registers (referential integrity)
 * - Amounts validated (positive, numeric)
 * - Status transitions enforced (OPEN → CLOSED only)
 */

// ============================================================================
// 5. ERROR HANDLING & EDGE CASES
// ============================================================================

/**
 * CASE 1: User tries to open register when one is already open
 * STATUS: 400 Bad Request
 * MESSAGE: "Cash register already open since 2026-04-16T10:00:00Z. Please close it first."
 * SOLUTION: Must close existing register before opening new one
 */

/**
 * CASE 2: User tries to register movement without open register
 * STATUS: 400 Bad Request
 * MESSAGE: "No open cash register. Please open one before registering movements."
 * SOLUTION: Call POST /cash/open first
 */

/**
 * CASE 3: User tries to close non-existent register
 * STATUS: 404 Not Found
 * MESSAGE: "No open cash register found"
 * SOLUTION: Verify register is open with GET /cash/current
 */

/**
 * CASE 4: User with insufficient role tries to open register
 * STATUS: 403 Forbidden
 * MESSAGE: "Role WAREHOUSE is not permitted to perform cash operations. Allowed roles: OWNER, ADMIN, CASHIER"
 * SOLUTION: Request CASHIER or higher role
 */

/**
 * CASE 5: Negative or zero amount in movement
 * STATUS: 400 Bad Request
 * MESSAGE: "Amount must be positive"
 * SOLUTION: Enter positive amounts; type (EXPENSE/INCOME) determines sign
 */

/**
 * CASE 6: Invalid payment method
 * STATUS: 400 Bad Request
 * MESSAGE: "Invalid payment method"
 * OPTIONS: CASH, CARD, TRANSFER, CHECK, CRYPTO, OTHER
 */

// ============================================================================
// 6. DATABASE SCHEMA REFERENCE
// ============================================================================

/**
 * TABLE: CashRegister
 *
 * Columns:
 * - id (String, PK): Unique identifier (cuid)
 * - tenantId (String, FK): Multi-tenant key
 * - status (String): OPEN or CLOSED
 * - openingAmount (Float): Initial cash
 * - closingAmount (Float, nullable): Final counted cash
 * - expectedAmount (Float, nullable): Calculated expected
 * - difference (Float, nullable): closingAmount - expectedAmount
 * - openedByUserId (String, FK): User who opened
 * - closedByUserId (String, FK, nullable): User who closed
 * - openedAt (DateTime): When opened
 * - closedAt (DateTime, nullable): When closed
 *
 * CONSTRAINTS:
 * - UNIQUE (tenantId, status) - Only one OPEN per tenant
 * - INDEX (tenantId, status) - Fast lookups
 * - INDEX (openedAt) - For history queries
 */

/**
 * TABLE: CashMovement
 *
 * Columns:
 * - id (String, PK): Unique identifier (cuid)
 * - tenantId (String, FK): Multi-tenant key
 * - cashRegisterId (String, FK): Links to CashRegister
 * - type (CashMovementType): SALE, INCOME, or EXPENSE
 * - paymentMethod (PaymentMethod): CASH, CARD, TRANSFER, etc
 * - amount (Float): Always positive; type determines sign
 * - referenceId (String, nullable): Link to source (saleId, etc)
 * - referenceType (String, nullable): Type of reference
 * - description (String, nullable): Human-readable notes
 * - createdAt (DateTime): When recorded
 *
 * CONSTRAINTS:
 * - INDEX (tenantId, cashRegisterId) - Fast filtering
 * - INDEX (type, paymentMethod) - For aggregation queries
 * - INDEX (referenceId) - Link to source entities
 */

// ============================================================================
// 7. ADVANCED USAGE
// ============================================================================

/**
 * Get register stats for analytics
 *
 * GET /cash/current
 * Response includes:
 * {
 *   "stats": {
 *     "sales": 5000,
 *     "incomes": 500,
 *     "expenses": 200,
 *     "netAmount": 5300
 *   }
 * }
 *
 * Use for:
 * - Daily sales reporting
 * - Cash flow analysis
 * - Movement trend analysis
 */

/**
 * Filter movements by type and payment method
 *
 * GET /cash/movements?type=SALE&paymentMethod=CASH
 * GET /cash/movements?type=EXPENSE&paymentMethod=TRANSFER
 *
 * Use for:
 * - Reconciling specific payment channels
 * - Auditing payment methods
 * - Generating method-specific reports
 */

/**
 * Pagination through history
 *
 * GET /cash/history?limit=30&offset=0  // First 30
 * GET /cash/history?limit=30&offset=30 // Next 30
 * GET /cash/history?limit=30&offset=60 // Last 30
 *
 * Use for:
 * - Efficient history viewing
 * - Monthly/yearly reports
 * - Trend analysis
 */

// ============================================================================
// 8. TESTING CHECKLIST
// ============================================================================

/*
[ ] Test opening cash register with valid amount
[ ] Test opening when register already open (expect error)
[ ] Test registering SALE movement
[ ] Test registering INCOME movement
[ ] Test registering EXPENSE movement
[ ] Test getting current register
[ ] Test getting movements with filters
[ ] Test closing register with perfect balance
[ ] Test closing register with overage
[ ] Test closing register with shortage
[ ] Test multi-tenant isolation
[ ] Test role-based access (CASHIER, ADMIN, WAREHOUSE)
[ ] Test audit trail accuracy
[ ] Test concurrent sales during day
[ ] Test movements persist after close
[ ] Test history pagination
*/

// ============================================================================
// 9. DEPLOYMENT CONSIDERATIONS
// ============================================================================

/**
 * DATABASE MIGRATION
 * Run: npx prisma migrate deploy
 * Creates: CashRegister, CashMovement tables with indexes
 *
 * BACKUPS
 * - Cash register data is critical (audit trail)
 * - Include in daily backups
 * - Test restore procedure
 *
 * MONITORING
 * - Monitor register reconciliation issues
 * - Alert on discrepancies > threshold
 * - Track average difference per cashier
 *
 * SCALING
 * - Use DB transactions for concurrent closes
 * - Index optimization for history queries
 * - Archive old registers to separate table (optional)
 */

export const CashRegisterAPIGuide = {
  version: '1.0',
  status: 'Production-Ready',
  endpoints: 5,
  models: 2,
  roles_supported: 4,
  multi_tenant: true,
  audit_trail: true,
};
