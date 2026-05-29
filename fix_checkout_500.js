const fs = require('fs');
const file = 'api/routes/shopRoutes.js';
let code = fs.readFileSync(file, 'utf8');

// Add referral raw parsing after couponCodeRaw
if (!code.includes("const referralCodeRaw = req.body?.referralCode")) {
  code = code.replace(
    "const couponCodeRaw = req.body?.couponCode;",
    "const couponCodeRaw = req.body?.couponCode;\n        const referralCodeRaw = req.body?.referralCode;\n        const normalizedReferralCode = normalizeReferralCode(referralCodeRaw);"
  );
}

// Add referral resolver block before order creation vars
if (!code.includes("let referredByDiscordId = ''")) {
  code = code.replace(
    "let newOrder = null;\n        let orderId = '';\n        let products = [];",
    "let referredByDiscordId = '';\n        if (normalizedReferralCode) {\n            const suffix = String(normalizedReferralCode).replace(/^REF-/, '');\n            const candidates = await User.find({ discordId: { $exists: true, $ne: '' } }).select('discordId').limit(5000).lean();\n            const match = candidates.find((u) => String(u?.discordId || '').slice(-6) === suffix);\n            if (match && String(match.discordId) !== discordId) {\n                referredByDiscordId = String(match.discordId);\n            }\n        }\n\n        let newOrder = null;\n        let orderId = '';\n        let products = [];"
  );
}

// Persist referral fields into Order
if (!code.includes("referralCode: normalizedReferralCode")) {
  code = code.replace(
    "couponCode,\n                        total: totalAmount,",
    "couponCode,\n                        referralCode: normalizedReferralCode || '',\n                        referredByDiscordId,\n                        total: totalAmount,"
  );
}

fs.writeFileSync(file, code);
console.log('checkout referral crash fix applied');
