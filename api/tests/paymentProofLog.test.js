const test = require('node:test');
const assert = require('node:assert/strict');

const {
    buildPaymentProofLogPayload,
    formatDiscordTimestamp,
    getTicketUrl,
    isPaymentLogConfigured
} = require('../utils/paymentProofLog');

test('isPaymentLogConfigured requires guild and channel ids', () => {
    assert.equal(isPaymentLogConfigured({ guildId: '1234567890', channelId: '4567890123' }), true);
    assert.equal(isPaymentLogConfigured({ guildId: '', channelId: '4567890123' }), false);
});

test('getTicketUrl builds Discord channel URL', () => {
    assert.equal(getTicketUrl('111', '222'), 'https://discord.com/channels/111/222');
});

test('buildPaymentProofLogPayload includes order summary and not done status', () => {
    const payload = buildPaymentProofLogPayload({
        order: {
            orderId: 'nm_1',
            robloxUsername: 'PlayerOne',
            discordUsername: 'buyer',
            discordId: '999',
            totalAmount: 12.5,
            items: [{ name: 'Cid V2+F', quantity: 2, packQuantity: 1, price: 4 }]
        },
        method: 'paypal_ff',
        ticketGuildId: '111',
        ticketChannelId: '222',
        status: 'not_done'
    });

    assert.equal(payload.embeds[0].data.title, 'Payment proof - NM_1');
    assert.match(payload.embeds[0].data.fields.find((field) => field.name === 'Status').value, /Not done/);
    assert.match(payload.embeds[0].data.fields.find((field) => field.name === 'Ticket').value, /discord.com\/channels\/111\/222/);
});

test('buildPaymentProofLogPayload formats done time with Discord date and clock timestamps', () => {
    const payload = buildPaymentProofLogPayload({
        order: {
            orderId: 'nm_2',
            robloxUsername: 'PlayerTwo',
            discordUsername: 'staff',
            discordId: '999',
            totalAmount: 2,
            items: [{ name: 'Item', quantity: 1, packQuantity: 1, price: 2 }]
        },
        method: 'ltc',
        ticketGuildId: '111',
        ticketChannelId: '222',
        status: 'done',
        doneBy: '1234567890',
        doneAt: new Date('2026-05-25T03:20:33.000Z')
    });

    const status = payload.embeds[0].data.fields.find((field) => field.name === 'Status').value;
    assert.match(status, /Done by <@1234567890> at <t:1779679233:f> \(<t:1779679233:T>\)/);
});

test('formatDiscordTimestamp returns date and time precision', () => {
    assert.equal(formatDiscordTimestamp(new Date('2026-05-25T03:20:33.000Z')), '<t:1779679233:f> (<t:1779679233:T>)');
});
