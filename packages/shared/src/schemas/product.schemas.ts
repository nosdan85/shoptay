import { z } from 'zod';
import { CuidSchema, SlugSchema } from './base.schemas';

export const ProductImageResponseSchema = z.object({
  id: CuidSchema,
  filename: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  size: z.number(),
  url: z.string(),
  isPrimary: z.boolean(),
  createdAt: z.date(),
  deletedAt: z.date().nullable(),
});

export const ProductResponseSchema = z.object({
  id: CuidSchema,
  gameId: CuidSchema,
  categoryId: CuidSchema,
  name: z.string(),
  slug: SlugSchema,
  description: z.string().nullable(),
  shortDescription: z.string().nullable(),
  price: z.string(), // Decimal as string
  originalPriceString: z.string().nullable(),
  bulkPriceCents: z.number().nullable(),
  bulkPriceString: z.string().nullable(),
  stock: z.number(),
  maxPerOrder: z.number(),
  image: z.string(),
  imageUrls: z.array(z.string()),
  images: z.array(ProductImageResponseSchema),
  isActive: z.boolean(),
  isDigital: z.boolean(),
  deliveryInfo: z.string().nullable(),
  metadata: z.record(z.unknown()).nullable(),
  sortOrder: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export const ProductListQuerySchema = z.object({
  gameId: CuidSchema.optional(),
  categoryId: CuidSchema.optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['name', 'price', 'sortOrder', 'createdAt', 'stock']).default('sortOrder'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  includeInactive: z.boolean().default(false),
  inStock: z.boolean().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
});

export const ProductCreateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  shortDescription: z.string().max(300).optional(),
  price: z.number().positive(),
  originalPriceString: z.string().optional(),
  bulkPriceCents: z.number().int().min(0).optional(),
  bulkPriceString: z.string().optional(),
  image: z.string().min(1).default(''),
  imageUrls: z.array(z.string()).optional(),
  stock: z.number().int().min(0).default(0),
  maxPerOrder: z.number().int().min(1).default(99),
  categoryId: CuidSchema,
  gameId: CuidSchema.optional(),
  isActive: z.boolean().default(true),
  isDigital: z.boolean().default(false),
  deliveryInfo: z.string().max(500).optional(),
  metadata: z.record(z.unknown()).optional(),
  sortOrder: z.number().int().min(0).default(0),
});

export const ProductUpdateSchema = ProductCreateSchema.partial();

export const ProductStockUpdateSchema = z.object({
  delta: z.number().int(),
});

export const ProductBulkStockUpdateSchema = z.object({
  updates: z.array(z.object({
    id: CuidSchema,
    delta: z.number().int(),
  })),
});

export const ProductSearchSchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

export type ProductResponse = z.infer<typeof ProductResponseSchema>;
export type ProductListQuery = z.infer<typeof ProductListQuerySchema>;
export type ProductCreate = z.infer<typeof ProductCreateSchema>;
export type ProductUpdate = z.infer<typeof ProductUpdateSchema>;
