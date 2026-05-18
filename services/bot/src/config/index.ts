import { z } from 'zod';

const ConfigSchema = z.object({
  discordToken: z.string(),
  discordClientId: z.string(),
  discordGuildId: z.string(),
  ownerRoleId: z.string().optional(),
  ownerIds: z.array(z.string()),
  vouchChannelId: z.string(),
  ticketCategoryId: z.string(),
  ownerTimezone: z.string().default('UTC'),
  apiBaseUrl: z.string(),
  encryptionKey: z.string(),
  minTicketCreateGapMs: z.number().default(3500),
  addAllConcurrency: z.number().default(4),
  logLevel: z.string().default('info'),
});

export const config = ConfigSchema.parse(process.env);

export type Config = z.infer<typeof ConfigSchema>;
