const fs = require('fs');
let code = fs.readFileSync('web/app/shop/page.tsx','utf8');
code = code.replace(
  'onChange={(event) => setReferralCode(event.target.value)}',
  "onChange={(event) => setReferralCode(event.target.value)}\n                      onBlur={() => { try { window.localStorage.setItem('pendingReferralCode', referralCode.trim()); } catch {} }}"
);
fs.writeFileSync('web/app/shop/page.tsx', code);
console.log('added referral onBlur save');
