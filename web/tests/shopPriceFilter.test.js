/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const shopPageSource = fs.readFileSync(path.join(__dirname, '..', 'app', 'shop', 'page.tsx'), 'utf8');

test('shop page renders a single price sort control group', () => {
  const priceSortButtonHandlers = shopPageSource.match(/onClick=\{\(\) => setPriceSort\(value\)\}/g) || [];
  assert.equal(priceSortButtonHandlers.length, 1);
});
