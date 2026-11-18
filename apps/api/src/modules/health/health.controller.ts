import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../../common/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getHealth(@Res() res: Response) {
    let dbStatus: 'ok' | 'down' = 'down';

    if (this.prisma.isConnected) {
      try {
        await Promise.race([
          this.prisma.$queryRawUnsafe('SELECT 1'),
          new Promise((_, reject) => setTimeout(() => reject(new Error('DB ping timeout')), 2000)),
        ]);
        dbStatus = 'ok';
      } catch {
        dbStatus = 'down';
      }
    } else {
      // In-memory DatabaseService fallback active
      dbStatus = 'ok';
    }

    return res.status(HttpStatus.OK).json({
      status: 'ok',
      service: 'boi-hat-api',
      timestamp: new Date().toISOString(),
      db: dbStatus,
    });
  }
}
