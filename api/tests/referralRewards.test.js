const test = require('node:test');
const assert = require('node:assert/strict');

const {
    buildReferralCode,
    buildReferralPreviewPayload,
    normalizeReferralCode,
    hashFingerprint,
    hasSuspiciousDeviceFlag,
    REFERRER_REWARD_PERCENT,
    REFEREE_DISCOUNT_PERCENT,
    shouldGrantFirstOrderReward
} = require('../utils/referralRewards');

test('buildReferralCode creates a short stable referral code from a Discord id', () => {
    assert.equal(buildReferralCode('123456789012345678'), 'REF-345678');
});

test('normalizeReferralCode accepts lowercase and strips unsafe characters', () => {
    assert.equal(normalizeReferralCode(' ref-abc123 '), 'REF-ABC123');
});

test('referral preview payload returns null when referral code has no matching user', () => {
    assert.equal(buildReferralPreviewPayload(null, 'REF-000001'), null);
});

test('referral preview payload matches checkout and reward discount percentages', () => {
    assert.equal(REFEREE_DISCOUNT_PERCENT, 5);
    assert.equal(REFERRER_REWARD_PERCENT, 50);

    assert.deepEqual(
        buildReferralPreviewPayload(
            { discordId: '1234567890', discordUsername: 'owner' },
            'ref-567890'
        ),
        {
            valid: true,
            referralCode: 'REF-567890',
            referrerDiscordId: '1234567890',
            referrerUsername: 'owner',
            refereeDiscountPercent: 5,
            referrerRewardPercent: 50,
            note: 'Referrer gets 50% after your first completed order. You get 5% discount on this order.'
        }
    );
});

test('hashFingerprint returns a deterministic sha256 hex digest', () => {
    const first = hashFingerprint('visitor-123');
    const second = hashFingerprint('visitor-123');

    assert.equal(first, second);
    assert.match(first, /^[a-f0-9]{64}$/);
});

test('shouldGrantFirstOrderReward blocks users with prior completed fingerprint orders', () => {
    assert.equal(shouldGrantFirstOrderReward({ orderCount: 1, flags: [] }), false);
});

test('shouldGrantFirstOrderReward blocks suspicious devices', () => {
    assert.equal(shouldGrantFirstOrderReward({ orderCount: 0, flags: ['suspicious_device'] }), false);
    assert.equal(hasSuspiciousDeviceFlag({ flags: ['suspicious_device'] }), true);
});

test('shouldGrantFirstOrderReward allows clean first-order fingerprints', () => {
    assert.equal(shouldGrantFirstOrderReward({ orderCount: 0, flags: [] }), true);
});
