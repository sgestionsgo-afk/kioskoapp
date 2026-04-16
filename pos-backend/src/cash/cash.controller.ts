import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CashService } from './cash.service';
import {
  OpenCashDto,
  CloseCashDto,
  CreateMovementDto,
  OpenCashResponseDto,
  CloseCashResponseDto,
  MovementResponseDto,
} from './dto';

/**
 * CashController
 *
 * POST /cash/open       — Open a new register (tenantId + openedByUserId in body)
 * POST /cash/close      — Close current register (tenantId + closedByUserId in body)
 * POST /cash/movement   — Register manual income/expense
 * GET  /cash/current    — Get current open register (tenantId as query param)
 * GET  /cash/history    — Paginated list of closed registers
 * GET  /cash/movements  — Movements from current register (with optional filters)
 *
 * Auth note: Guards and JWT decorators will be added once the Auth module is in place.
 * tenantId is supplied in the request body/query, consistent with the rest of the project.
 */
@Controller('cash')
export class CashController {
  constructor(private cashService: CashService) {}

  // GET /cash/current?tenantId=xxx
  @Get('current')
  async getCurrentRegister(@Query('tenantId') tenantId: string) {
    const current = await this.cashService.getCurrentRegister(tenantId);

    if (!current) {
      return {
        status: 'NO_OPEN_REGISTER',
        message: 'No cash register is currently open',
        data: null,
      };
    }

    return { status: 'OK', data: current };
  }

  // GET /cash/history?tenantId=xxx&limit=30&offset=0
  @Get('history')
  async getHistory(
    @Query('tenantId') tenantId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const history = await this.cashService.getHistory(
      tenantId,
      limit ? parseInt(limit, 10) : 30,
      offset ? parseInt(offset, 10) : 0,
    );

    return { status: 'OK', data: history };
  }

  // GET /cash/movements?tenantId=xxx&type=SALE&paymentMethod=CASH
  @Get('movements')
  async getMovements(
    @Query('tenantId') tenantId: string,
    @Query('type') type?: string,
    @Query('paymentMethod') paymentMethod?: string,
  ) {
    const movements = await this.cashService.getMovements(tenantId, { type, paymentMethod });

    return { status: 'OK', count: movements.length, data: movements };
  }

  // POST /cash/open
  @Post('open')
  @HttpCode(HttpStatus.CREATED)
  openCash(@Body() dto: OpenCashDto): Promise<OpenCashResponseDto> {
    return this.cashService.openCash(dto);
  }

  // POST /cash/close
  @Post('close')
  @HttpCode(HttpStatus.OK)
  closeCash(@Body() dto: CloseCashDto): Promise<CloseCashResponseDto> {
    return this.cashService.closeCash(dto);
  }

  // POST /cash/movement
  @Post('movement')
  @HttpCode(HttpStatus.CREATED)
  registerMovement(@Body() dto: CreateMovementDto): Promise<MovementResponseDto> {
    return this.cashService.registerMovement(dto);
  }
}

  registerMovement(@Body() dto: CreateMovementDto): Promise<MovementResponseDto> {
    return this.cashService.registerMovement(dto);
  }
}
