import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  public isConnected = false;

  async onModuleInit() {
    try {
      await this.$connect();
      // Neon connection warmup: run a quick query to establish PostgreSQL connection pool and TLS handshake
      await Promise.race([
        this.$queryRawUnsafe('SELECT 1'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Warmup timeout')), 2500)),
      ]).catch((err) => this.logger.warn(`Prisma warmup ping warning: ${err.message}`));
      this.isConnected = true;
      this.logger.log('Successfully connected and warmed up PostgreSQL connection via Prisma');
    } catch (error) {
      this.isConnected = false;
      this.logger.warn(
        'Could not connect to PostgreSQL database. DatabaseService will operate in local high-performance store mode.',
      );
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.$disconnect();
    }
  }
}

