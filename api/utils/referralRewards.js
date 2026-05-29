const crypto = require('crypto');

const normalizeReferralCode = (value) => String(value || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');

const buildReferralCode = (discordId) => {
    const raw = String(discordId || '').trim();
    const suffix = raw.slice(-6).padStart(6, '0');
    return `REF-${suffix}`;
};

const hashFingerprint = (value) => crypto.createHash('sha256').update(String(value || '')).digest('hex');

const hasSuspiciousDeviceFlag = (fingerprint) => Array.isArray(fingerprint?.flags)
    && fingerprint.flags.map((flag) => String(flag || '').trim()).includes('suspicious_device');

const shouldGrantFirstOrderReward = (fingerprint) => {
    if (!fingerprint) return true;
    if (Number(fingerprint.orderCount || 0) > 0) return false;
    if (hasSuspiciousDeviceFlag(fingerprint)) return false;
    return true;
};

module.exports = {
    buildReferralCode,
    hashFingerprint,
    hasSuspiciousDeviceFlag,
    normalizeReferralCode,
    shouldGrantFirstOrderReward
};
