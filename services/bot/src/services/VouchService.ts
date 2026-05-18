import axios from 'axios';
import { Logger } from 'pino';
import { MessageAttachment, TextChannel } from 'discord.js';
import { config } from '../config';
import {
  IMAGE_DOWNLOAD_TIMEOUT_MS,
  IMAGE_MAX_SIZE_BYTES,
  MAX_IMAGES_PER_BATCH,
  MAX_VOUCH_CONTENT_LENGTH,
} from '../config/constants';

export class VouchService {
  constructor(private readonly log: Logger) {}

  async downloadImages(
    attachments: MessageAttachment[]
  ): Promise<Array<{ buffer: Buffer; name: string; contentType: string }>> {
    const imageAttachments = attachments.filter(att =>
      att.contentType?.startsWith('image/') ||
      /\.(jpg|jpeg|png|gif|webp)$/i.test(att.name || '')
    );

    const results: Array<{ buffer: Buffer; name: string; contentType: string }> = [];

    // Process in batches
    for (let i = 0; i < imageAttachments.length; i += MAX_IMAGES_PER_BATCH) {
      const batch = imageAttachments.slice(i, i + MAX_IMAGES_PER_BATCH);

      const batchPromises = batch.map(async (attachment) => {
        try {
          const response = await axios.get(attachment.url, {
            responseType: 'arraybuffer',
            timeout: IMAGE_DOWNLOAD_TIMEOUT_MS,
            maxContentLength: IMAGE_MAX_SIZE_BYTES,
            headers: {
              'User-Agent': 'NosMarketBot/1.0',
            },
          });

          return {
            buffer: Buffer.from(response.data),
            name: attachment.name || `image-${Date.now()}.png`,
            contentType: attachment.contentType || 'image/png',
          };
        } catch (error: any) {
          this.log.warn({ error, attachmentId: attachment.id }, '[Vouch] Failed to download image');
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter((r): r is NonNullable<typeof r> => r !== null));
    }

    return results;
  }

  async postVouch(
    channel: TextChannel,
    discordId: string,
    discordUsername: string,
    items: string[],
    orderTotal: number
  ): Promise<string[]> {
    const content = this.buildVouchContent(discordId, discordUsername, items, orderTotal);
    const uploadedUrls: string[] = [];

    // Post vouch message
    const vouchMessage = await channel.send(content);
    uploadedUrls.push(vouchMessage.id);

    return uploadedUrls;
  }

  buildVouchContent(
    discordId: string,
    discordUsername: string,
    items: string[],
    orderTotal: number
  ): string {
    const itemLines = items.map(item => `**${item.toUpperCase()}**`).join('\n');

    let content = `<@${discordId}>\n`;
    content += `${itemLines}\n`;
    content += `Enjoy your ${items.join(', ')}\n`;
    content += `Please leave us a vouch ❤️\n`;
    content += `---\n`;
    content += `**Total: $${orderTotal.toFixed(2)}**`;

    // Truncate if too long
    if (content.length > MAX_VOUCH_CONTENT_LENGTH) {
      content = content.slice(0, MAX_VOUCH_CONTENT_LENGTH - 3) + '...';
    }

    return content;
  }

  buildThankYouDM(items: string[]): string {
    const itemList = items.map(item => `• ${item}`).join('\n');

    return `
✨ **Thank You for Your Purchase** ✨

We sincerely appreciate your order and the trust you've placed in us!

📦 **Purchased Items:**
${itemList}

If you require any additional items or have any questions about your order, please don't hesitate to reach out to us.

💎 Thank you once again for your support and trust.

— **Nos Team**
    `.trim();
  }
}
