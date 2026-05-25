const test = require('node:test');
const assert = require('node:assert/strict');

const {
    buildPaymentProofLogPayload,
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
