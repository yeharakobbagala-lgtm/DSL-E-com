import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;
  let mockPrisma: Partial<Record<keyof PrismaService | 'product' | 'category', any>>;

  beforeEach(() => {
    mockPrisma = {
      isHealthy: vi.fn(),
      product: {
        count: vi.fn(),
      },
      category: {
        count: vi.fn(),
      },
    };

    controller = new HealthController(mockPrisma as unknown as PrismaService);
  });

  it('returns status healthy and database connected when DB is reachable', async () => {
    (mockPrisma.isHealthy as any).mockResolvedValue({
      connected: true,
      latencyMs: 12,
    });
    (mockPrisma.product.count as any).mockResolvedValue(8);
    (mockPrisma.category.count as any).mockResolvedValue(15);

    const result = await controller.checkHealth();

    expect(result.status).toBe('healthy');
    expect(result.service).toBe('dsl-stationery-backend');
    expect(result.database.status).toBe('connected');
    expect(result.database.latencyMs).toBe(12);
    expect(result.database.counts.products).toBe(8);
    expect(result.database.counts.categories).toBe(15);
  });

  it('throws ServiceUnavailableException when database ping fails with generic masked error', async () => {
    (mockPrisma.isHealthy as any).mockResolvedValue({
      connected: false,
      error: 'Connection refused at 10.0.1.25:5432',
    });

    await expect(controller.checkHealth()).rejects.toThrow(ServiceUnavailableException);

    try {
      await controller.checkHealth();
    } catch (err) {
      expect(err).toBeInstanceOf(ServiceUnavailableException);
      const res = (err as ServiceUnavailableException).getResponse() as any;
      expect(res.status).toBe('degraded');
      expect(res.database.status).toBe('disconnected');
      expect(res.database.error).toBe('Database connectivity check failed');
      expect(res.database.error).not.toContain('Connection refused');
      expect(res.database.error).not.toContain('10.0.1.25');
    }
  });

  it('throws ServiceUnavailableException when table counting fails with generic masked error', async () => {
    (mockPrisma.isHealthy as any).mockResolvedValue({
      connected: true,
      latencyMs: 5,
    });
    (mockPrisma.product.count as any).mockRejectedValue(new Error('Table lock timeout on Product'));

    await expect(controller.checkHealth()).rejects.toThrow(ServiceUnavailableException);

    try {
      await controller.checkHealth();
    } catch (err) {
      expect(err).toBeInstanceOf(ServiceUnavailableException);
      const res = (err as ServiceUnavailableException).getResponse() as any;
      expect(res.status).toBe('degraded');
      expect(res.database.status).toBe('disconnected');
      expect(res.database.error).toBe('Database connectivity check failed');
      expect(res.database.error).not.toContain('Table lock timeout');
      expect(res.database.error).not.toContain('Product');
    }
  });

  it('never leaks raw database error strings, credentials, or internal topology to clients', async () => {
    (mockPrisma.isHealthy as any).mockResolvedValue({
      connected: false,
      error: 'FATAL: password authentication failed for user "dsl_app" dbname "dsl_stationery" host 192.168.1.100 port 5432',
    });

    try {
      await controller.checkHealth();
      expect.unreachable('Should have thrown ServiceUnavailableException');
    } catch (err) {
      expect(err).toBeInstanceOf(ServiceUnavailableException);
      const res = (err as ServiceUnavailableException).getResponse() as any;
      expect(res.database.error).toBe('Database connectivity check failed');

      // Strict assertions verifying sensitive tokens are absent
      const stringifiedResponse = JSON.stringify(res);
      expect(stringifiedResponse).not.toContain('dsl_app');
      expect(stringifiedResponse).not.toContain('dsl_stationery');
      expect(stringifiedResponse).not.toContain('192.168.1.100');
      expect(stringifiedResponse).not.toContain('5432');
      expect(stringifiedResponse).not.toContain('password');
      expect(stringifiedResponse).not.toContain('FATAL');
    }
  });
});
