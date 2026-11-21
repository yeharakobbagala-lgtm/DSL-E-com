import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationsService } from './notifications.service';
import { buildOrderConfirmationEmail } from './templates/order-confirmation.template';

describe('Order Confirmation HTML Email System', () => {
  let service: NotificationsService;
  let configServiceMock: any;

  beforeEach(() => {
    configServiceMock = {
      get: vi.fn().mockImplementation((key: string, defaultVal: any) => {
        if (key === 'FRONTEND_URL') return 'https://dslstationery.lk';
        if (key === 'SMTP_HOST') return ''; // Empty string disables real SMTP transporter during unit tests
        return defaultVal;
      }),
    };
    service = new NotificationsService(configServiceMock);
  });

  describe('buildOrderConfirmationEmail Template Builder', () => {
    it('generates fully populated table-based HTML email with all required brand sections', () => {
      const email = buildOrderConfirmationEmail({
        orderId: 'ord-test-100',
        orderNumber: 'DSL-2026-9901',
        orderDate: new Date('2026-11-19T10:00:00Z'),
        customerName: 'Yehara Kobbagala',
        customerEmail: 'yehara.kobbagala@gmail.com',
        customerPhone: '+94 77 123 4567',
        subtotalCents: 500000,
        deliveryFeeCents: 35000,
        discountCents: 50000,
        totalCents: 485000,
        promoCode: 'WELCOME10',
        paymentMethod: 'CASH_ON_DELIVERY',
        paymentStatus: 'CONFIRMED',
        deliveryAddress: {
          fullName: 'Yehara Kobbagala',
          phone: '+94 77 123 4567',
          addressLine1: 'No. 123, Galle Road',
          city: 'Colombo',
          district: 'Colombo',
          postalCode: '00300',
          deliveryNotes: 'Leave at security front desk',
        },
        orderUrl: 'https://dslstationery.lk/orders/DSL-2026-9901?token=test-token-123',
        frontendUrl: 'https://dslstationery.lk',
        items: [
          {
            productId: 'prod-speed-rim-blue',
            productName: 'SPEED RIM Ball Pen Blue',
            variantName: 'Blue Box of 10',
            sku: 'SP-RIM-BLU-10',
            quantity: 2,
            unitPriceCents: 150000,
            totalPriceCents: 300000,
            imageUrl: '/products/speed-rim-blue.png',
          },
          {
            productId: 'prod-doms-colour-12',
            productName: 'Doms 12 Colour Pencils Set',
            quantity: 1,
            unitPriceCents: 200000,
            totalPriceCents: 200000,
            imageUrl: '/products/doms-colour-12.png',
          },
        ],
      });

      // 1. Structure & Compatibility checks
      expect(email.html).toContain('<!DOCTYPE html');
      expect(email.html).toContain('Thank You for Your Order!');
      expect(email.html).toContain('DSL-2026-9901');
      expect(email.html).toContain('Yehara Kobbagala');
      expect(email.html).toContain('Cash on Delivery');

      // 2. Visual assets & CIDs
      expect(email.html).toContain('cid:dsl-logo@dslstationery.lk');
      expect(email.html).toContain('cid:order-success-bag@dslstationery.lk');
      expect(email.html).toContain('cid:stationery-header@dslstationery.lk');
      expect(email.html).toContain('cid:decorative-waves@dslstationery.lk');

      // 3. Product items
      expect(email.html).toContain('SPEED RIM Ball Pen Blue');
      expect(email.html).toContain('Blue Box of 10');
      expect(email.html).toContain('Doms 12 Colour Pencils Set');

      // 4. Financial totals
      expect(email.html).toContain('WELCOME10');
      expect(email.html).toContain('Rs. 4,850.00');

      // 5. Button and CTA link
      expect(email.html).toContain('View Your Order');
      expect(email.html).toContain('https://dslstationery.lk/orders/DSL-2026-9901?token=test-token-123');

      // 6. Plain text version
      expect(email.text).toContain('DSL-2026-9901');
      expect(email.text).toContain('SPEED RIM Ball Pen Blue');
      expect(email.text).toContain('Total: Rs. 4,850.00');

      // 7. Attachments generated
      expect(email.attachments.length).toBeGreaterThanOrEqual(4);
      expect(email.attachments.some((a) => a.cid === 'order-success-bag@dslstationery.lk')).toBe(true);
      expect(email.attachments.some((a) => a.cid === 'dsl-logo@dslstationery.lk')).toBe(true);
    });

    it('renders robustly when product name is extremely long without breaking layout', () => {
      const email = buildOrderConfirmationEmail({
        orderId: 'ord-long-1',
        orderNumber: 'DSL-2026-LONG-01',
        customerName: 'Test Customer',
        customerEmail: 'customer@example.com',
        subtotalCents: 100000,
        deliveryFeeCents: 0,
        discountCents: 0,
        totalCents: 100000,
        paymentMethod: 'CARD_PAYHERE',
        paymentStatus: 'PAID',
        deliveryAddress: 'Flat 4B, Colombo',
        orderUrl: 'https://dslstationery.lk/orders/DSL-2026-LONG-01',
        items: [
          {
            productId: 'prod-long',
            productName:
              'Super High Grade Ergonomic Retractable Executive Gel Pen With Luxury Metallic Barrel And Diamond Polished Tungsten Carbide Fine Nib 0.5mm Waterproof Blue Ink',
            quantity: 1,
            unitPriceCents: 100000,
            totalPriceCents: 100000,
          },
        ],
      });

      expect(email.html).toContain('Super High Grade Ergonomic Retractable Executive');
      expect(email.html).toContain('PAID');
      expect(email.html).toContain('FREE'); // 0 delivery fee shows as FREE
    });
  });

  describe('NotificationsService.sendOrderConfirmation & Idempotency', () => {
    it('dispatches confirmation email and prevents duplicate sends for the same order', async () => {
      const payload = {
        orderId: 'ord-idem-01',
        orderNumber: 'DSL-2026-IDEM-01',
        customerName: 'Nimal Perera',
        customerEmail: 'nimal@example.com',
        customerPhone: '+94 71 999 8888',
        totalCents: 350000,
        paymentMethod: 'CASH_ON_DELIVERY',
        paymentStatus: 'CONFIRMED',
        deliveryAddress: 'No 5, Kandy Road, Colombo',
        items: [
          {
            productName: 'Exercise Book 120 Pages',
            quantity: 5,
            unitPriceCents: 70000,
            totalPriceCents: 350000,
          },
        ],
      };

      // First dispatch
      const res1 = await service.sendOrderConfirmation(payload);
      expect(res1.success).toBe(true);
      expect(res1.messageId).toContain('msg-order-DSL-2026-IDEM-01');

      // Second dispatch (immediate retry or webhook duplicate)
      const res2 = await service.sendOrderConfirmation(payload);
      expect(res2.success).toBe(true);
      expect(res2.messageId).toBe('msg-order-dup-DSL-2026-IDEM-01');
    });
  });
});
