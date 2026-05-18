import { COLORS, MAX_VOUCH_CONTENT_LENGTH } from '../config/constants';

/**
 * Build vouch content for posting to vouch channel
 */
export function buildVouchContent(params: {
  discordId: string;
  discordUsername: string;
  items: string[];
  total: number;
}): string {
  const { discordId, discordUsername, items, total } = params;

  const itemLines = items.map((item) => `**${item.toUpperCase()}**`).join('\n');

  let content = `<@${discordId}>\n`;
  content += `${itemLines}\n`;
  content += `Enjoy your ${items.join(', ')}\n`;
  content += `Please leave us a vouch ❤️\n`;
  content += `---\n`;
  content += `**Total: $${total.toFixed(2)}**`;

  // Truncate if too long
  if (content.length > MAX_VOUCH_CONTENT_LENGTH) {
    content = content.slice(0, MAX_VOUCH_CONTENT_LENGTH - 3) + '...';
  }

  return content;
}

/**
 * Build thank you DM content
 */
export function buildThankYouDM(params: {
  items: string[];
}): string {
  const { items } = params;

  const itemList = items.map((item) => `• ${item}`).join('\n');

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

/**
 * Build vouch success message
 */
export function buildVouchSuccessMessage(params: {
  imageCount: number;
  discordUsername: string;
}): string {
  const { imageCount, discordUsername } = params;

  return `Vouch posted successfully for ${discordUsername} (${imageCount} image${imageCount > 1 ? 's' : ''}).`;
}

/**
 * Build proof gallery card content
 */
export function buildProofCardContent(params: {
  orderId: string;
  discordUsername: string;
  items: string[];
  total: number;
  imageCount: number;
  postedAt: Date;
}): string {
  const { orderId, discordUsername, items, total, imageCount, postedAt } = params;

  const itemList = items.slice(0, 3).join(', ');
  const moreItems = items.length > 3 ? ` +${items.length - 3} more` : '';

  return `
**Order:** \`${orderId}\`
**User:** ${discordUsername}
**Items:** ${itemList}${moreItems}
**Total:** $${total.toFixed(2)}
**Images:** ${imageCount}
**Posted:** <t:${Math.floor(postedAt.getTime() / 1000)}:R>
  `.trim();
}
