import { z } from 'zod';

export const CuidSchema = z.string().cuid();
export const SlugSchema = z.string().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Must be lowercase alphanumeric with dashes');
export const EmailSchema = z.string().email().toLowerCase();
export const DiscordIdSchema = z.string().min(17).max(20).regex(/^\d+$/);
export const DiscordUsernameSchema = z.string().min(2).max(32);

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const PaginationMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: z.array(dataSchema),
    meta: PaginationMetaSchema,
  });

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
