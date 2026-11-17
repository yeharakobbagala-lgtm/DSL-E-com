import { Injectable, Inject, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private pool: Pool;

  constructor(@Inject(ConfigService) configService: ConfigService) {
    const isE2E = process.env.APP_ENV === 'e2e';
    const connectionString = isE2E
      ? configService.get<string>('E2E_DATABASE_URL')
      : configService.get<string>('DATABASE_URL');

    if (!connectionString) {
      throw new Error(`${isE2E ? 'E2E_DATABASE_URL' : 'DATABASE_URL'} environment variable is not defined.`);
    }

    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    super({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });

    this.pool = pool;
  }

  async onModuleInit() {
    try {
      await this.$connect();
      const res = await this.pool.query('SELECT current_user, current_database();');
      const { current_user, current_database } = res.rows[0];
      const isE2E = process.env.APP_ENV === 'e2e';
      this.logger.log(`Connected to PostgreSQL via Prisma 7 Driver Adapter. Database: "${current_database}", Runtime Role: "${current_user}" (${isE2E ? 'DEDICATED E2E' : 'STANDARD'})`);

      // Runtime safety check: warn or enforce least-privilege database user
      if (current_user === 'postgres') {
        const enforceSuperuserBlock = process.env.ENFORCE_LEAST_PRIVILEGE_DB === 'true';
        const msg = 'Application runtime is connected as "postgres" superuser. For optimal least-privilege security, connect as "dsl_app".';
        if (enforceSuperuserBlock) {
          throw new Error(`CRITICAL SECURITY VIOLATION: ${msg}`);
        } else {
          this.logger.warn(`SECURITY NOTICE: ${msg}`);
        }
      }
      if (isE2E && current_database !== 'dsl_stationery_e2e') {
        throw new Error(`CRITICAL ISOLATION VIOLATION: APP_ENV=e2e must connect to "dsl_stationery_e2e", but current database is "${current_database}".`);
      }
    } catch (error) {
      this.logger.error('Failed to connect to PostgreSQL during onModuleInit', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      await this.pool.end();
      this.logger.log('Disconnected from PostgreSQL and closed connection pool');
    } catch (error) {
      this.logger.error('Error during database disconnect', error);
    }
  }

  async isHealthy(): Promise<{ connected: boolean; latencyMs?: number; error?: string }> {
    const start = Date.now();
    try {
      await this.$queryRaw`SELECT 1`;
      return {
        connected: true,
        latencyMs: Date.now() - start,
      };
    } catch (err) {
      return {
        connected: false,
        error: err instanceof Error ? err.message : 'Database ping query failed',
      };
    }
  }
}
