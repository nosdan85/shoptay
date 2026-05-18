import { z } from 'zod';
import { CuidSchema, SlugSchema } from './base.schemas';

export const CategoryResponseSchema = z.object({
  id: CuidSchema,
  gameId: CuidSchema,
  name: z.string(),
  slug: SlugSchema,
  description: z.string().nullable(),
  iconUrl: z.string().nullable(),
  isActive: z.boolean(),
  sortOrder: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CategoryCreateSchema = z.object({
  name: z.string().min(1).max(100),
  slug: SlugSchema.optional(),
  description: z.string().max(500).optional(),
  iconUrl: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

export const CategoryUpdateSchema = CategoryCreateSchema.partial();

export const CategoryReorderSchema = z.object({
  newSortOrder: z.number().int().min(0),
});

export type CategoryResponse = z.infer<typeof CategoryResponseSchema>;
export type CategoryCreate = z.infer<typeof CategoryCreateSchema>;
export type CategoryUpdate = z.infer<typeof CategoryUpdateSchema>;
