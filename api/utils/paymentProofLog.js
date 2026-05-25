const { EmbedBuilder } = require('discord.js');

const SNOWFLAKE_PATTERN = /^\d{10,25}$/;

const isSnowflake = (value) => SNOWFLAKE_PATTERN.test(String(value || '').trim());

const isPaymentLogConfigured = ({ guildId, channelId } = {}) => (
    isSnowflake(guildId) && isSnowflake(channelId)
);

const getPaymentLogConfig = (env = process.env) => ({
    guildId: String(env.DISCORD_PAYMENT_LOG_GUILD_ID || '').trim(),
    channelId: String(env.DISCORD_PAYMENT_LOG_CHANNEL_ID || '').trim()
});

const getTicketUrl = (guildId, channelId) => {
    const safeGuildId = String(guildId || '').trim();
    const safeChannelId = String(channelId || '').trim();
    if (!safeGuildId || !safeChannelId) return '';
    return `https://discord.com/channels/${safeGuildId}/${safeChannelId}`;
};

const formatUsd = (value) => `$${Number(value || 0).toFixed(2)}`;

const formatItems = (items) => {
    if (!Array.isArray(items) || items.length === 0) return 'Unknown item';
    return items.map((item) => {
        const packQty = Math.max(1, Number(item?.packQuantity) || 1);
        const qty = Math.max(1, Number(item?.quantity) || 1);
        return `${item?.name || 'Item'} (x${packQty * qty})`;
    }).join('\n').slice(0, 1024);
};

const getMethodLabel = (method) => {
    if (method === 'ltc') return 'Litecoin (LTC)';
    return 'PayPal Friends & Family';
};

const formatDiscordTimestamp = (value) => {
    const ms = new Date(value || Date.now()).getTime();
    if (!Number.isFinite(ms)) return '';
    const seconds = Math.floor(ms / 1000);
    return `<t:${seconds}:f> (<t:${seconds}:T>)`;
};

const buildPaymentProofLogPayload = ({
    order,
    method,
    ticketGuildId,
    ticketChannelId,
    status = 'not_done',
    doneBy = '',
    doneAt = null
}) => {
    const ticketUrl = getTicketUrl(ticketGuildId, ticketChannelId);
    const statusText = status === 'done'
        ? `Done${doneBy ? ` by <@${doneBy}>` : ''}${doneAt ? ` at ${formatDiscordTimestamp(doneAt)}` : ''}`
        : 'Not done';

    const embed = new EmbedBuilder()
        .setColor(status === 'done' ? 0x3DDC84 : 0xF5A623)
        .setTitle(`Payment proof - ${String(order?.orderId || '').toUpperCase()}`)
        .addFields([
            { name: 'Status', value: statusText, inline: true },
            { name: 'Payment', value: getMethodLabel(method), inline: true },
            { name: 'Total', value: formatUsd(order?.totalAmount), inline: true },
            { name: 'Roblox', value: String(order?.robloxUsername || order?.robloxDisplayName || 'Unknown'), inline: true },
            { name: 'Discord', value: `${order?.discordUsername || 'Unknown'}\n<@${order?.discordId || ''}>`, inline: true },
            { name: 'Ticket', value: ticketUrl || 'Ticket URL unavailable', inline: false },
            { name: 'Items', value: formatItems(order?.items), inline: false }
        ])
        .setTimestamp(new Date());

    return { embeds: [embed] };
};

module.exports = {
    buildPaymentProofLogPayload,
    formatDiscordTimestamp,
    getPaymentLogConfig,
    getTicketUrl,
    isPaymentLogConfigured
};
