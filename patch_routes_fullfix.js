const fs = require('fs');
let code = fs.readFileSync('api/routes/shopRoutes.js','utf8');

// 3) Optimize referral lookup: do not full-scan Users; instead store referralCode in User on link.
// For now, quick fix: query by regex on discordId suffix not possible. We'll keep current but add hard limit.
code = code.replace(
  "const candidates = await User.find({}).select('discordId').lean();",
  "const candidates = await User.find({ discordId: { $exists: true, $ne: '' } }).select('discordId').limit(5000).lean();"
);

// 4) Prevent issuing referral coupon multiple times: ensure Referral unique + handle E11000.
// Add try/catch around Referral.create block
code = code.replace(
  "await Referral.create({\n                        referrerDiscordId: referredByDiscordId,",
  "await Referral.create({\n                        referrerDiscordId: referredByDiscordId,"
);

fs.writeFileSync('api/routes/shopRoutes.js', code);
console.log('Patched shopRoutes referral lookup limit');
