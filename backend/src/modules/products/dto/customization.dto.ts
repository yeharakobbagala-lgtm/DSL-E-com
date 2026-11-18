import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const bulkPricingRuleSchema = z.object({
  minQuantity: z.number().int().min(1),
  feeCents: z.number().int().min(0),
});

export const updateCustomizationConfigSchema = z.object({
  isCustomizable: z.boolean().default(true),
  maxCharacters: z.number().int().min(1).max(100).default(25),
  baseFeeCents: z.number().int().min(0).default(35000),
  allowedPositions: z.array(z.string()).min(1).default(['CAP', 'BARREL', 'CLIP']),
  allowedFonts: z.array(z.string()).min(1).default(['Arial', 'Times New Roman', 'Italic', 'Calibri', 'Script']),
  bulkRules: z.array(bulkPricingRuleSchema).default([]),
  previewConfig: z.record(z.any()).optional().default({}),
});

export type UpdateCustomizationConfigInput = z.infer<typeof updateCustomizationConfigSchema>;

export class BulkPricingRuleDto {
  @ApiProperty({ description: 'Minimum quantity to trigger discount tier', example: 10 })
  minQuantity!: number;

  @ApiProperty({ description: 'Fee per unit in cents (e.g. 25000 = Rs. 250)', example: 25000 })
  feeCents!: number;
}

export class UpdateCustomizationConfigDto {
  @ApiPropertyOptional({ description: 'Whether this product supports pen customization', default: true })
  isCustomizable?: boolean;

  @ApiPropertyOptional({ description: 'Maximum allowed character count for engraving', default: 25 })
  maxCharacters?: number;

  @ApiPropertyOptional({ description: 'Base engraving fee in minor integer cents', default: 35000 })
  baseFeeCents?: number;

  @ApiPropertyOptional({ description: 'Supported engraving positions', example: ['CAP', 'BARREL', 'CLIP'] })
  allowedPositions?: string[];

  @ApiPropertyOptional({ description: 'Supported font styles', example: ['Arial', 'Times New Roman', 'Script'] })
  allowedFonts?: string[];

  @ApiPropertyOptional({ description: 'Tiered bulk engraving pricing rules', type: [BulkPricingRuleDto] })
  bulkRules?: BulkPricingRuleDto[];

  @ApiPropertyOptional({ description: 'Preview overlay positioning coordinates', type: Object })
  previewConfig?: Record<string, any>;
}
