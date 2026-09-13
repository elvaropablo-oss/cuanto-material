const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
const source = fs.readFileSync('assets/commerce-math.js', 'utf8');
function at(instant, intl = Intl) {
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [instant])); } }
  const context = { window: {}, Date: Clock, Intl: intl, URL };
  vm.runInNewContext(source, context);
  return context.window.CMCommerceMath;
}
test('promociones caducan a medianoche Madrid en verano e invierno, no a medianoche UTC', () => {
  for (const [end, before, after] of [
    ['2026-09-13', '2026-09-13T21:59:59Z', '2026-09-13T22:00:00Z'],
    ['2026-01-15', '2026-01-15T22:59:59Z', '2026-01-15T23:00:00Z'],
    ['2026-03-29', '2026-03-29T21:59:59Z', '2026-03-29T22:00:00Z'],
    ['2026-10-25', '2026-10-25T22:59:59Z', '2026-10-25T23:00:00Z']
  ]) {
    const p = { price: 26.5, verifiedAt: end, priceValidUntil: end };
    assert.equal(at(before).price(p), 26.5, before);
    assert.equal(at(after).price(p), null, after);
  }
});
test('antigüedad, fechas futuras y fecha explícita mantienen protecciones originales', () => {
  const p = { price: 10, verifiedAt: '2026-01-08' };
  assert.equal(at('2026-01-15T22:59:59Z').price(p), 10);
  assert.equal(at('2026-01-15T23:00:00Z').price(p), null);
  assert.equal(at('2026-01-07T22:30:00Z').price(p), null);
  assert.equal(at('2026-01-15T23:00:00Z').price(p, '2026-01-15'), 10);
});
test('calendario no disponible oculta precio sin romper cantidades', () => {
  const math = at('2026-09-13T21:30:00Z', { DateTimeFormat() { throw new Error('unsupported zone'); } });
  const p = { price: 26.5, verifiedAt: '2026-09-13', coverage: 2.67, unit: 'm²' };
  const result = math.estimate('floor', { area: 20, waste: 8 }, p);
  assert.equal(result.units, 9);
  assert.equal(result.total, null);
  assert.equal(math.price(p), null);
});
