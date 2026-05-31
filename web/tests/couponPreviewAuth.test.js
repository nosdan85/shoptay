/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const readWebFile = (...parts) => fs.readFileSync(path.join(__dirname, '..', ...parts), 'utf8');

test('coupon preview proxy forwards Authorization so user-specific discounts are previewed', () => {
  const source = readWebFile('app', 'api', 'shop', 'coupon', 'preview', 'route.ts');

  assert.match(source, /request\.headers\.get\(["']authorization["']\)/);
  assert.match(source, /\.\.\.\(token \? \{ Authorization: token \} : \{\}\)/);
});

test('shop coupon preview sends the bearer token when a user is logged in', () => {
  const source = readWebFile('app', 'shop', 'page.tsx');
  const previewStart = source.indexOf('const previewCouponFor = async');
  const previewEnd = source.indexOf('const previewReferralCode = async');
  const previewSource = source.slice(previewStart, previewEnd);

  assert.notEqual(previewStart, -1);
  assert.notEqual(previewEnd, -1);
  assert.match(previewSource, /fetch\(["']\/api\/shop\/coupon\/preview["']/);
  assert.match(previewSource, /Authorization: `Bearer \$\{token\}`/);
});
