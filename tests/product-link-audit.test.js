const assert = require('node:assert/strict');
const test = require('node:test');
const { checkLinks, exitCode } = require('./check-product-links.cjs');
const products = [{ id: 'example', normalUrl: 'https://example.com/product' }];
const response = status => ({ status, ok: status >= 200 && status < 300, url: 'https://example.com/final', text: async () => '<title>Producto</title>' });
test('auditoría HTTP distingue éxito, enlace roto y acceso inconcluso', async () => {
  for (const status of [200, 404, 410, 403, 429, 500]) {
    const results = await checkLinks(products, async () => response(status));
    assert.equal(results[0].status, status);
    assert.equal(results[0].finalUrl, 'https://example.com/final');
    assert.equal(exitCode(results), status === 200 ? 0 : [404, 410].includes(status) ? 1 : 2);
  }
});
test('fallos de red y catálogo vacío no son auditorías verdes', async () => {
  const results = await checkLinks(products, async () => { throw new Error('network unavailable'); });
  assert.equal(results[0].status, null);
  assert.equal(results[0].inconclusive, true);
  assert.equal(exitCode(results), 2);
  assert.equal(exitCode([]), 2);
  assert.equal(exitCode([{ broken: true }, { inconclusive: true }]), 1);
});
