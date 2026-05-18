import { z } from 'zod';
import { CuidSchema, SlugSchema } from './base.schemas';

export const GameResponseSchema = z.object({
  id: CuidSchema,
  name: z.string(),
  slug: SlugSchema,
  description: z.string().nullable(),
  iconUrl: z.string().nullable(),
  bannerUrl: z.string().nullable(),
  isActive: z.boolean(),
  sortOrder: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const GameCreateSchema = z.object({
  name: z.string().min(1).max(100),
  slug: SlugSchema.optional(),
  description: z.string().max(1000).optional(),
  iconUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

export const GameUpdateSchema = GameCreateSchema.partial();

export const GameReorderSchema = z.object({
  newSortOrder: z.number().int().min(0),
});

export const GameListQuerySchema = z.object({
  includeInactive: z.boolean().default(false),
});

export type GameResponse = z.infer<typeof GameResponseSchema>;
export type GameCreate = z.infer<typeof GameCreateSchema>;
export type GameUpdate = z.infer<typeof GameUpdateSchema>;
