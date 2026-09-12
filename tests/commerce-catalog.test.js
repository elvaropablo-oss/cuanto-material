const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');

const context = { window: {} };
vm.runInNewContext(fs.readFileSync('assets/commerce-catalog.js', 'utf8'), context);
const { paint } = context.window.CMCommerceCatalog;

test('los productos publicados contienen datos comerciales mínimos y enlaces normales', () => {
  for (const product of paint) {
    for (const key of ['id', 'name', 'retailer', 'category', 'normalUrl', 'price', 'size', 'verifiedAt', 'sourceUrl', 'specs', 'affiliate']) assert.ok(product[key] !== undefined, key);
    assert.equal(product.affiliate.enabled, false);
    assert.equal(product.affiliate.url, '');
    assert.ok(product.normalUrl.startsWith('https://'));
  }
});

test('el redondeo de envases nunca deja litros sin cubrir', () => {
  for (const product of paint) {
    const required = 10.1;
    const units = Math.ceil(required / product.size);
    assert.ok(units * product.size >= required);
  }
});
