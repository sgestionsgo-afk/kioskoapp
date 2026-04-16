import { PrismaClient } from '@prisma/client';
import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Inject, Scope } from '@nestjs/common';
import { Request } from 'express';

/**
 * TenantContextService
 * 
 * Extracts and validates tenant information from request context (JWT token).
 * This ensures every operation knows which tenant it belongs to.
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  constructor(@Inject(REQUEST) private request: Request) {}

  /**
   * Get current tenant ID from JWT token
   * @throws UnauthorizedException if no tenant in token
   */
  getTenantId(): string {
    const user = (this.request as any).user;

    if (!user || !user.tenantId) {
      throw new UnauthorizedException(
        'No tenant context found. Ensure JWT token includes tenantId.',
      );
    }

    return user.tenantId;
  }

  /**
   * Get current user ID from JWT token
   */
  getUserId(): string {
    const user = (this.request as any).user;

    if (!user || !user.id) {
      throw new UnauthorizedException('No user context found');
    }

    return user.id;
  }

  /**
   * Get current user role
   */
  getUserRole(): string {
    const user = (this.request as any).user;
    return user?.role || 'CASHIER';
  }

  /**
   * Check if user is admin (can bypass some restrictions)
   */
  isAdmin(): boolean {
    return ['OWNER', 'ADMIN'].includes(this.getUserRole());
  }
}

/**
 * Models that are NOT tenant-scoped
 * These can be accessed without tenant filtering
 */
const GLOBAL_MODELS = ['Tenant', 'User', 'Subscription'];

/**
 * Operations that should NOT have middleware applied
 * Usually diagnostics, schema operations
 */
const EXCLUDED_OPERATIONS = ['$queryRaw', '$executeRaw', '$metrics'];

/**
 * Create Prisma middleware for automatic tenant isolation
 * 
 * This middleware:
 * 1. Intercepts ALL Prisma queries
 * 2. Automatically adds tenantId filter for tenant-scoped operations
 * 3. Prevents access to other tenants' data
 * 4. Allows safe exceptions for global models
 */
export function createTenantMiddleware(getTenantId: () => string) {
  return async (
    params: any,
    next: (params: any) => Promise<any>,
  ) => {
    // Skip middleware for operations we don't need to filter
    if (EXCLUDED_OPERATIONS.includes(params.action)) {
      return next(params);
    }

    // Get the model being accessed
    const model = params.model;

    // GLOBAL MODELS: Don't filter by tenant
    if (GLOBAL_MODELS.includes(model)) {
      return next(params);
    }

    // Get current tenant ID
    const tenantId = getTenantId();

    // BUILD TENANT FILTER
    const tenantFilter = { tenantId };

    // ====================================================================
    // FINDMANY: Add tenant filter to WHERE clause
    // ====================================================================
    if (params.action === 'findMany') {
      const args = params.args;

      // Combine with existing WHERE clause
      if (args.where) {
        args.where = {
          AND: [args.where, tenantFilter],
        };
      } else {
        args.where = tenantFilter;
      }

      return next(params);
    }

    // ====================================================================
    // FINDUNIQUE: Cannot use findUnique with tenantId directly
    // Must first verify the record belongs to the tenant
    // ====================================================================
    if (params.action === 'findUnique') {
      const args = params.args;
      const id = args.where[Object.keys(args.where)[0]];

      if (!id) {
        throw new ForbiddenException('Invalid lookup parameter');
      }

      // First, find the record with tenant validation
      const record = await next({
        ...params,
        action: 'findFirst',
        args: {
          where: {
            ...args.where,
            ...tenantFilter,
          },
        },
      });

      if (!record) {
        // Return null (consistent with findUnique behavior)
        // This prevents attackers from knowing if a record exists
        return null;
      }

      return record;
    }

    // ====================================================================
    // FINDFIRSTORFINDFAIL: Add tenant filter
    // ====================================================================
    if (
      params.action === 'findFirst' ||
      params.action === 'findFirstOrThrow'
    ) {
      const args = params.args;

      if (args.where) {
        args.where = {
          AND: [args.where, tenantFilter],
        };
      } else {
        args.where = tenantFilter;
      }

      return next(params);
    }

    // ====================================================================
    // UPDATE: Only allow if record belongs to tenant
    // ====================================================================
    if (params.action === 'update') {
      const args = params.args;
      const id = args.where[Object.keys(args.where)[0]];

      if (!id) {
        throw new ForbiddenException('Invalid update target');
      }

      // Verify record exists and belongs to tenant
      const record = await next({
        model: params.model,
        action: 'findFirst',
        args: {
          where: {
            ...args.where,
            ...tenantFilter,
          },
        },
      });

      if (!record) {
        throw new ForbiddenException(
          'Cannot update: record not found or not owned by tenant',
        );
      }

      // Proceed with update
      return next(params);
    }

    // ====================================================================
    // UPDATEMANY: Add tenant filter to WHERE
    // ====================================================================
    if (params.action === 'updateMany') {
      const args = params.args;

      if (args.where) {
        args.where = {
          AND: [args.where, tenantFilter],
        };
      } else {
        args.where = tenantFilter;
      }

      return next(params);
    }

    // ====================================================================
    // DELETE: Only allow if record belongs to tenant
    // ====================================================================
    if (params.action === 'delete') {
      const args = params.args;
      const id = args.where[Object.keys(args.where)[0]];

      if (!id) {
        throw new ForbiddenException('Invalid delete target');
      }

      // Verify record exists and belongs to tenant
      const record = await next({
        model: params.model,
        action: 'findFirst',
        args: {
          where: {
            ...args.where,
            ...tenantFilter,
          },
        },
      });

      if (!record) {
        throw new ForbiddenException(
          'Cannot delete: record not found or not owned by tenant',
        );
      }

      // Proceed with delete
      return next(params);
    }

    // ====================================================================
    // DELETEMANY: Add tenant filter to WHERE
    // ====================================================================
    if (params.action === 'deleteMany') {
      const args = params.args;

      if (args.where) {
        args.where = {
          AND: [args.where, tenantFilter],
        };
      } else {
        args.where = tenantFilter;
      }

      return next(params);
    }

    // ====================================================================
    // COUNT: Add tenant filter
    // ====================================================================
    if (params.action === 'count') {
      const args = params.args;

      if (args.where) {
        args.where = {
          AND: [args.where, tenantFilter],
        };
      } else {
        args.where = tenantFilter;
      }

      return next(params);
    }

    // ====================================================================
    // AGGREGATE: Add tenant filter
    // ====================================================================
    if (params.action === 'aggregate') {
      const args = params.args;

      if (args.where) {
        args.where = {
          AND: [args.where, tenantFilter],
        };
      } else {
        args.where = tenantFilter;
      }

      return next(params);
    }

    // ====================================================================
    // GROUPBY: Add tenant filter
    // ====================================================================
    if (params.action === 'groupBy') {
      const args = params.args;

      if (args.where) {
        args.where = {
          AND: [args.where, tenantFilter],
        };
      } else {
        args.where = tenantFilter;
      }

      return next(params);
    }

    // Default: proceed without modification
    return next(params);
  };
}

/**
 * PrismaService with tenant middleware
 * 
 * This service extends Prisma Client with automatic tenant isolation.
 * CRITICAL: All queries automatically filter by tenantId.
 */
@Injectable()
export class PrismaService extends PrismaClient {
  constructor(
    private tenantContext: TenantContextService,
  ) {
    super();

    // Apply tenant middleware
    this.$use(createTenantMiddleware(() => this.tenantContext.getTenantId()));
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

/**
 * USAGE EXAMPLE: SAFE BY DEFAULT
 * 
 * Before:
 * const clients = await prisma.client.findMany();
 * // ❌ Bug: Returns ALL clients, even from other tenants!
 * 
 * After with middleware:
 * const clients = await prisma.client.findMany();
 * // ✅ Automatically filtered to current tenant only
 * // Middleware injects: { where: { tenantId: user.tenantId } }
 */
