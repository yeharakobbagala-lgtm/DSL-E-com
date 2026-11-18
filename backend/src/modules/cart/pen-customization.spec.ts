import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { CartService } from './cart.service';

describe('Pen Customization & Engraving Suite (authoritative backend tests)', () => {
  let service: CartService;
  let mockPrisma: any;

  const mockProductCustomizable = {
    id: 'prod-pen-speed-1',
    name: 'SPEED RIM Ball Pen Blue',
    slug: 'speed-rim-ball-pen-blue',
    sku: 'DSL-SPEED-RIM-BLUE',
    priceCents: 2500, // Rs. 25.00
    stockQuantity: 100,
    isActive: true,
    variants: [],
    customizationConfig: {
      id: 'cfg-1',
      productId: 'prod-pen-speed-1',
      isCustomizable: true,
      maxCharacters: 20,
      baseFeeCents: 35000, // Rs. 350.00
      allowedPositions: ['CAP', 'BARREL', 'CLIP'],
      allowedFonts: ['Arial', 'Times New Roman', 'Italic', 'Calibri', 'Script'],
      bulkRules: [
        { minQuantity: 1, feeCents: 35000 },
        { minQuantity: 10, feeCents: 25000 },
        { minQuantity: 50, feeCents: 15000 },
      ],
    },
  };

  const mockProductNonCustomizable = {
    id: 'prod-notebook-1',
    name: 'CR Single Rule 120 Pages',
    slug: 'cr-single-rule-120-pages',
    sku: 'DSL-NOTEBOOK-120',
    priceCents: 22000,
    stockQuantity: 50,
    isActive: true,
    variants: [],
    customizationConfig: null,
  };

  const mockCart = {
    id: 'cart-1',
    userId: 'user-1',
    sessionId: null,
    items: [],
  };

  beforeEach(() => {
    mockPrisma = {
      cart: {
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
      cartItem: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      product: {
        findUnique: vi.fn(),
      },
      storeSettings: {
        findFirst: vi.fn().mockResolvedValue({
          flatDeliveryFeeCents: 35000,
          freeDeliveryThresholdCents: 500000,
        }),
      },
    };

    service = new CartService(mockPrisma);
  });

  describe('Validation & Eligibility', () => {
    it('should reject customization on a non-customizable product', async () => {
      vi.spyOn(service as any, 'getOrCreateCartRecord').mockResolvedValue({ cart: mockCart });
      mockPrisma.product.findUnique.mockResolvedValue(mockProductNonCustomizable);

      await expect(
        service.addItem(
          {
            productId: 'prod-notebook-1',
            quantity: 1,
            customization: {
              engravingText: 'Kasun Perera',
              font: 'Script',
              position: 'BARREL',
            },
          },
          'user-1'
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject empty or whitespace-only engraving text', async () => {
      vi.spyOn(service as any, 'getOrCreateCartRecord').mockResolvedValue({ cart: mockCart });
      mockPrisma.product.findUnique.mockResolvedValue(mockProductCustomizable);

      await expect(
        service.addItem(
          {
            productId: 'prod-pen-speed-1',
            quantity: 1,
            customization: {
              engravingText: '   ',
              font: 'Script',
              position: 'BARREL',
            },
          },
          'user-1'
        )
      ).rejects.toThrow('Engraving text cannot be empty');
    });

    it('should enforce max character limits configured per product', async () => {
      vi.spyOn(service as any, 'getOrCreateCartRecord').mockResolvedValue({ cart: mockCart });
      mockPrisma.product.findUnique.mockResolvedValue(mockProductCustomizable);

      // maxCharacters is 20 for this product, this string is 28 chars
      const overlyLongText = 'Alexander Christopher Perera';
      await expect(
        service.addItem(
          {
            productId: 'prod-pen-speed-1',
            quantity: 1,
            customization: {
              engravingText: overlyLongText,
              font: 'Script',
              position: 'BARREL',
            },
          },
          'user-1'
        )
      ).rejects.toThrow('exceeds maximum limit of 20 characters');
    });

    it('should reject unsupported font styles', async () => {
      vi.spyOn(service as any, 'getOrCreateCartRecord').mockResolvedValue({ cart: mockCart });
      mockPrisma.product.findUnique.mockResolvedValue(mockProductCustomizable);

      await expect(
        service.addItem(
          {
            productId: 'prod-pen-speed-1',
            quantity: 1,
            customization: {
              engravingText: 'Kasun',
              font: 'Comic Sans MS',
              position: 'BARREL',
            },
          },
          'user-1'
        )
      ).rejects.toThrow("Font 'Comic Sans MS' is not supported");
    });

    it('should reject unsupported engraving positions', async () => {
      vi.spyOn(service as any, 'getOrCreateCartRecord').mockResolvedValue({ cart: mockCart });
      mockPrisma.product.findUnique.mockResolvedValue(mockProductCustomizable);

      await expect(
        service.addItem(
          {
            productId: 'prod-pen-speed-1',
            quantity: 1,
            customization: {
              engravingText: 'Kasun',
              font: 'Arial',
              position: 'REAR_NIB',
            },
          },
          'user-1'
        )
      ).rejects.toThrow("Position 'REAR_NIB' is not supported");
    });
  });

  describe('Pricing & Bulk Tier Calculations', () => {
    it('should calculate base fee for single or small quantities (< 10)', () => {
      const fee = service.calculateCustomizationFee(1, mockProductCustomizable.customizationConfig);
      expect(fee).toBe(35000); // Rs. 350
    });

    it('should apply tiered bulk discount when quantity reaches 10', () => {
      const fee = service.calculateCustomizationFee(10, mockProductCustomizable.customizationConfig);
      expect(fee).toBe(25000); // Rs. 250
    });

    it('should apply maximum bulk discount when quantity reaches 50', () => {
      const fee = service.calculateCustomizationFee(50, mockProductCustomizable.customizationConfig);
      expect(fee).toBe(15000); // Rs. 150
    });
  });

  describe('Cart Item Separation & Merging', () => {
    it('should maintain distinct cart lines for pens with different engraving text', async () => {
      vi.spyOn(service as any, 'getOrCreateCartRecord').mockResolvedValue({ cart: mockCart });
      mockPrisma.product.findUnique.mockResolvedValue(mockProductCustomizable);

      const existingCustomItem = {
        id: 'item-1',
        cartId: 'cart-1',
        productId: 'prod-pen-speed-1',
        variantId: null,
        quantity: 1,
        customization: {
          engravingText: 'Kasun',
          font: 'Script',
          position: 'BARREL',
        },
      };

      mockPrisma.cartItem.findMany.mockResolvedValue([existingCustomItem]);
      mockPrisma.cartItem.create.mockResolvedValue({ id: 'item-2' });
      vi.spyOn(service as any, 'buildCartResponse').mockResolvedValue({ items: [] });

      // Add pen with different engraving text: "Amara"
      await service.addItem(
        {
          productId: 'prod-pen-speed-1',
          quantity: 1,
          customization: {
            engravingText: 'Amara',
            font: 'Script',
            position: 'BARREL',
          },
        },
        'user-1'
      );

      // Must call create (separate cart line), not update
      expect(mockPrisma.cartItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            productId: 'prod-pen-speed-1',
            customization: expect.objectContaining({ engravingText: 'Amara' }),
          }),
        })
      );
    });

    it('should merge quantity when adding the exact same customization', async () => {
      vi.spyOn(service as any, 'getOrCreateCartRecord').mockResolvedValue({ cart: mockCart });
      mockPrisma.product.findUnique.mockResolvedValue(mockProductCustomizable);

      const existingCustomItem = {
        id: 'item-1',
        cartId: 'cart-1',
        productId: 'prod-pen-speed-1',
        variantId: null,
        quantity: 2,
        customization: {
          engravingText: 'Kasun',
          font: 'Script',
          position: 'BARREL',
        },
      };

      mockPrisma.cartItem.findMany.mockResolvedValue([existingCustomItem]);
      mockPrisma.cartItem.update.mockResolvedValue({ id: 'item-1' });
      vi.spyOn(service as any, 'buildCartResponse').mockResolvedValue({ items: [] });

      // Add identical customization
      await service.addItem(
        {
          productId: 'prod-pen-speed-1',
          quantity: 3,
          customization: {
            engravingText: 'Kasun',
            font: 'Script',
            position: 'BARREL',
          },
        },
        'user-1'
      );

      // Must update quantity (2 + 3 = 5), not create a new item
      expect(mockPrisma.cartItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'item-1' },
          data: expect.objectContaining({ quantity: 5 }),
        })
      );
    });
  });
});
