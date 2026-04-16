import {
  Module,
  Global,
_Testing Test Suite for Tenant Isolation
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { PrismaService, TenantContextService } from './tenant-middleware';

/**
 * ============================================================================
 * SETUP INSTRUCTIONS
 * ============================================================================
 * 
 * 1. Add these imports to your app.module.ts:
 * 
 *    import { PrismaModule } from './prisma/tenant-middleware.module';
 *    import { AuthModule } from './auth/auth.module';
 * 
 * 2. Import in AppModule:
 * 
 *    @Module({
 *      imports: [
 *        ConfigModule.forRoot({ isGlobal: true }),
 *        PrismaModule,
 *        AuthModule,
 *        // ... other modules
 *      ],
 *    })
 *    export class AppModule {}
 * 
 * 3. Inject in your services:
 * 
 *    constructor(
 *      private prisma: PrismaService,
 *      private tenantContext: TenantContextService,
 *    ) {}
 * 
 * 4. Use in controllers/services - tenantId is automatic!
 */

/**
 * ============================================================================
 * PRISMA MODULE SETUP
 * ============================================================================
 */

@Global()
@Module({
  providers: [TenantContextService, PrismaService],
  exports: [PrismaService, TenantContextService],
})
export class PrismaModule {}

/**
 * ============================================================================
 * AUTH MODULE SETUP
 * ============================================================================
 */

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'dev-secret'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRY', '24h'),
        },
      }),
    }),
  ],
  exports: [JwtModule],
})
export class AuthModule {}

/**
 * ============================================================================
 * TENANT GUARD - ENSURE TENANT CONTEXT
 * ============================================================================
 * 
 * Apply to endpoints that MUST have tenant context
 */

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private tenantContext: TenantContextService) {}

  canActivate(context: ExecutionContext): boolean {
    try {
      this.tenantContext.getTenantId();
      return true;
    } catch (error) {
      throw new ForbiddenException(
        'Tenant context required. Ensure JWT includes tenantId.',
      );
    }
  }
}

/**
 * ============================================================================
 * DECORATORS FOR CONVENIENCE
 * ============================================================================
 */

import { createParamDecorator } from '@nestjs/common';

/**
 * Get tenantId from current request JWT
 * 
 * @Get()
 * findAll(@CurrentTenant() tenantId: string) { }
 */
export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.tenantId;
  },
);

/**
 * Get full user object from JWT
 * 
 * @Get()
 * findAll(@CurrentUser() user: JwtPayload) { }
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

/**
 * ============================================================================
 * COMPLETE APP EXAMPLE
 * ============================================================================
 */

/**
 * app.module.ts
 * 
 * @Module({
 *   imports: [
 *     ConfigModule.forRoot({
 *       isGlobal: true,
 *       envFilePath: '.env',
 *     }),
 *
 *     // Add Prisma with tenant middleware
 *     PrismaModule,
 *
 *     // Add Auth
 *     AuthModule,
 *
 *     // Your feature modules
 *     ClientsModule,
 *     SalesModule,
 *     ProductsModule,
 *   ],
 * })
 * export class AppModule {}
 */

/**
 * clients.controller.ts - EXAMPLE
 * 
 * @Controller('api/v1/clients')
 * @UseGuards(AuthGuard('jwt'), TenantGuard)
 * export class ClientsController {
 *   constructor(private clientsService: ClientsService) {}
 *
 *   @Post()
 *   create(@Body() dto: CreateClientDto, @CurrentTenant() tenantId: string) {
 *     // tenantId automatically injected from JWT
 *     // Middleware ensures all queries filtered by this tenantId
 *     return this.clientsService.create(tenantId, dto);
 *   }
 *
 *   @Get()
 *   findAll(@CurrentTenant() tenantId: string) {
 *     // ✅ SAFE: Cannot list clients from other tenants
 *     return this.clientsService.findAll(tenantId);
 *   }
 *
 *   @Get(':id')
 *   findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
 *     // ✅ SAFE: Can only access own tenant's clients
 *     return this.clientsService.findOne(tenantId, id);
 *   }
 * }
 */

/**
 * clients.service.ts - EXAMPLE
 * 
 * @Injectable()
 * export class ClientsService {
 *   constructor(
 *     private prisma: PrismaService,
 *     private tenantContext: TenantContextService,
 *   ) {}
 *
 *   async create(tenantId: string, dto: CreateClientDto) {
 *     // ✅ SAFE: tenantId from JWT, cannot be spoofed
 *     return this.prisma.client.create({
 *       data: {
 *         ...dto,
 *         tenantId, // Always from context
 *       },
 *     });
 *   }
 *
 *   async findAll(tenantId: string) {
 *     // ✅ SAFE: Middleware adds tenantId filter automatically
 *     return this.prisma.client.findMany({
 *       where: { /* optional filters */ },
 *       // Middleware transforms to:
 *       // { where: { AND: [{ ...filters }, { tenantId }] } }
 *     });
 *   }
 *
 *   async findOne(tenantId: string, id: string) {
 *     // ✅ SAFE: Returns null if belongs to different tenant
 *     return this.prisma.client.findUnique({
 *       where: { id },
 *       // Middleware validates tenantId before returning
 *     });
 *   }
 * }
 */

/**
 * ============================================================================
 * ENVIRONMENT VARIABLES (.env)
 * ============================================================================
 */

export const ENV_DOCS = `
# Multi-tenant SaaS Configuration

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/kioskoapp_saas"

# JWT Authentication
JWT_SECRET="$(openssl rand -base64 32)"  # Generate with: openssl rand -base64 32
JWT_EXPIRY="24h"

# Application
NODE_ENV="development"
PORT=3001

# Optional: Monitoring/Logging
LOG_LEVEL="info"
SENTRY_DSN=""

# Optional: Stripe (for billing)
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
`;

/**
 * ============================================================================
 * INITIALIZATION SCRIPT
 * ============================================================================
 * 
 * scripts/init-tenant.ts
 * 
 * Use this to create first tenant and admin user:
 */

export const InitTenantScript = `
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  // Create tenant
  const tenant = await prisma.tenant.create({
    data: {
      id: uuid(),
      name: 'My Company',
      plan: 'pro',
    },
  });

  // Create admin user
  const hashedPassword = await bcrypt.hash('ChangeMe123!', 10);
  
  const user = await prisma.user.create({
    data: {
      id: uuid(),
      email: 'admin@mycompany.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'OWNER',
      tenantId: tenant.id,
    },
  });

  // Create subscription
  await prisma.subscription.create({
    data: {
      id: uuid(),
      tenantId: tenant.id,
      plan: 'pro',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('✅ Tenant created:', tenant.id);
  console.log('✅ Admin user:', user.email);
  console.log('⚠️  REMEMBER TO CHANGE THE PASSWORD!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
`;

/**
 * ============================================================================
 * SCHEMA MIGRATION COMMAND
 * ============================================================================
 */

export const MigrationCommands = `
# Create initial migration
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Initialize tenant and admin
npx ts-node scripts/init-tenant.ts

# View database in Prisma Studio
npx prisma studio
`;
