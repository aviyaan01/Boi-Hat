import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  public isConnected = false;

  async onModuleInit() {
    const isProduction = process.env.NODE_ENV === 'production';
    const databaseUrl = process.env.DATABASE_URL;

    if (isProduction && (!databaseUrl || databaseUrl.trim().length === 0)) {
      this.logger.error('CRITICAL: DATABASE_URL is missing in production! Refusing to boot.');
      throw new Error('FATAL: DATABASE_URL is required in production mode. Refusing to boot without PostgreSQL.');
    }

    const maxRetries = isProduction ? 5 : 2;
    let attempt = 0;
    let delayMs = 1000;

    while (attempt < maxRetries) {
      attempt++;
      try {
        this.logger.log(`Connecting to PostgreSQL via Prisma (attempt ${attempt}/${maxRetries})...`);
        await this.$connect();

        // Neon connection warmup: run a fast ping query to warm up connection pool & TLS handshake
        await Promise.race([
          this.$queryRawUnsafe('SELECT 1'),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Warmup ping timeout')), 3000)),
        ]).catch((err) => this.logger.warn(`Prisma warmup ping warning: ${err.message}`));

        this.isConnected = true;
        this.logger.log('✓ Successfully connected and warmed up PostgreSQL connection via Prisma');
        return;
      } catch (error: any) {
        this.isConnected = false;
        this.logger.warn(`Prisma connection attempt ${attempt} failed: ${error.message}`);

        if (attempt >= maxRetries) {
          if (isProduction) {
            this.logger.error('CRITICAL: Failed to connect to PostgreSQL in production mode after retries!');
            throw new Error(`FATAL: Could not establish PostgreSQL connection in production mode: ${error.message}`);
          } else {
            this.logger.warn(
              'Development mode fallback: DatabaseService will operate in local high-performance in-memory store mode.',
            );
            return;
          }
        }

        await new Promise((r) => setTimeout(r, delayMs));
        delayMs *= 2; // Exponential backoff
      }
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.$disconnect();
    }
  }
}
