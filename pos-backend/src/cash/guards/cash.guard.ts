import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * CashGuard
 *
 * Verifies that the user has appropriate role for cash operations
 * Allowed roles: OWNER, ADMIN, CASHIER
 * Denied roles: WAREHOUSE (read-only inventory)
 *
 * Security Model:
 * - OWNER: Full access (can audit)
 * - ADMIN: Full access (can audit)
 * - CASHIER: Can open/close and register movements
 * - WAREHOUSE: Cannot access cash operations
 */
@Injectable()
export class CashGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as any;

    if (!user) {
      throw new ForbiddenException('No user context found');
    }

    // Allowed roles for cash operations
    const allowedRoles = ['OWNER', 'ADMIN', 'CASHIER'];

    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenException(
        `Role ${user.role} is not permitted to perform cash operations. Allowed roles: ${allowedRoles.join(', ')}`,
      );
    }

    return true;
  }
}
