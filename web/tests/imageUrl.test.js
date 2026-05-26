/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');

const { resolveImageUrl } = require('../lib/imageUrl');

test('resolveImageUrl keeps absolute image URLs after trimming pasted input', () => {
  assert.equal(resolveImageUrl('  https://i.ibb.co/icon.png  '), 'https://i.ibb.co/icon.png');
  assert.equal(resolveImageUrl('\nHTTPS://cdn.example.com/game.webp\t'), 'HTTPS://cdn.example.com/game.webp');
});

test('resolveImageUrl supports protocol-relative and bare CDN URLs', () => {
  assert.equal(resolveImageUrl('//cdn.example.com/game.png'), 'https://cdn.example.com/game.png');
  assert.equal(resolveImageUrl('i.ibb.co/game/icon.png'), 'https://i.ibb.co/game/icon.png');
});

test('resolveImageUrl keeps local public image paths on the current web origin', () => {
  assert.equal(resolveImageUrl('/products/icon.png', 'http://localhost:5000'), '/products/icon.png');
  assert.equal(resolveImageUrl('products/icon.png', 'http://localhost:5000'), '/products/icon.png');
  assert.equal(resolveImageUrl('/pictures/site-logo.png', 'https://api.example.com/api/'), '/pictures/site-logo.png');
});

test('resolveImageUrl treats legacy product filenames as public product assets', () => {
  assert.equal(resolveImageUrl('aura-chest.png', 'http://localhost:5000'), '/products/aura-chest.png');
  assert.equal(resolveImageUrl('Cid V2+F.png', 'http://localhost:5000'), '/products/Cid%20V2%2BF.png');
});

test('resolveImageUrl rewrites localhost product URLs so phones use the web origin', () => {
  assert.equal(resolveImageUrl('http://localhost:5000/products/icon.png'), '/products/icon.png');
  assert.equal(resolveImageUrl('http://127.0.0.1:5000/products/Cid V2+F.png'), '/products/Cid%20V2%2BF.png');
});
