const fs = require('fs');
let code = fs.readFileSync('api/bot.js','utf8');

// 1) Ensure !done calls maybeGrantNewUserReward + maybeGrantReferralReward
if (!code.includes('await maybeGrantNewUserReward(order)')) {
  code = code.replace(
    "await updatePaymentProofLogDone({ order, doneBy: message.author.id }).catch((error) => {\n                console.error('Payment proof log update failed:', error?.message || error);\n            });",
    "await maybeGrantNewUserReward(order);\n\n            // Mark referral status on completion (coupon may already be issued at checkout)\n            await maybeGrantReferralReward(order);\n\n            await updatePaymentProofLogDone({ order, doneBy: message.author.id }).catch((error) => {\n                console.error('Payment proof log update failed:', error?.message || error);\n            });"
  );
}

// 2) Adjust maybeGrantReferralReward to NOT issue a coupon (checkout does it) and just mark rewarded.
// Replace the function body by pattern if it still contains createRewardCoupon.
if (code.includes('const maybeGrantReferralReward = async (order) => {') && code.includes('createRewardCoupon({ discountPercent: 20')) {
  // already modified; keep
} else if (code.includes('const maybeGrantReferralReward = async (order) => {') && code.includes('createRewardCoupon({ discountPercent: 30')) {
  // legacy; we'll rewrite function completely.
}

// rewrite maybeGrantReferralReward via regex range
code = code.replace(/const maybeGrantReferralReward = async \(order\) => \{[\s\S]*?^\};\n/m, (match) => {
  if (!match.includes('const maybeGrantReferralReward')) return match;
  return `const maybeGrantReferralReward = async (order) => {\n    const referrerId = String(order?.referredByDiscordId || '').trim();\n    const refereeId = String(order?.discordId || '').trim();\n    if (!referrerId || !refereeId) return;\n\n    // If referee device is suspicious, keep referral flagged.\n    const fp = await DeviceFingerprint.findOne({ discordId: refereeId }).sort({ updatedAt: -1 }).lean();\n    if (hasSuspiciousDeviceFlag(fp)) {\n        await Referral.updateOne(\n            { referrerDiscordId: referrerId, refereeDiscordId: refereeId },\n            { $set: { status: 'flagged' } }\n        ).catch(() => {});\n        return;\n    }\n\n    // Mark referral as rewarded after first completed order.\n    await Referral.updateOne(\n        { referrerDiscordId: referrerId, refereeDiscordId: refereeId },\n        { $set: { status: 'rewarded', refereeFirstOrderId: String(order?.orderId || '') } }\n    ).catch(() => {});\n};\n`;
});

fs.writeFileSync('api/bot.js', code);
console.log('Patched bot.js done handler + referral completion marking');
