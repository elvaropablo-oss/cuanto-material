const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
const context = { window: {}, URL };
for (const file of ['commerce-catalog.js', 'commerce-math.js', 'commerce-engine.js']) vm.runInNewContext(fs.readFileSync('assets/' + file, 'utf8'), context);
const math = context.window.CMCommerceMath, catalog = context.window.CMCommerceCatalog;
const today = '2026-09-12';
const estimate = (type, input, product = catalog[type][0]) => math.estimate(type, input, product, today);
test('28 litros requieren dos botes de 15 L y el coste de dos botes', () => {
  const p = catalog.paint.find(p => p.id === 'swingcolor-plus15');
  const r = estimate('paint', { requiredQuantity: 28, requiredUnit: 'L' }, p);
  assert.equal(r.units, 2); assert.equal(r.purchased, 30); assert.equal(r.total, 91.98);
});
test('pintura usa superficie, techo, manos, rendimiento propio y margen', () => {
  const p = catalog.paint.find(p => p.id === 'edm15');
  const r = estimate('paint', { length: 5, width: 4, height: 2.5, openings: 4, ceiling: true, coats: 2, waste: 10 }, p);
  assert.equal(r.required, 33.550000000000004); assert.equal(r.units, 3); assert.equal(r.total, null);
});
test('suelo y azulejo redondean cajas, incluyendo margen', () => {
  assert.equal(estimate('floor', { area: 20, waste: 10 }).units, 9);
  assert.equal(estimate('floor', { area: 20, waste: 10 }).total, 238.5);
  assert.equal(estimate('tile', { area: 10, waste: 10 }).units, 19);
  assert.equal(estimate('tile', { area: 10, waste: 10 }).total, 125.21);
  assert.equal(estimate('tile', { area: .6, waste: 0 }).units, 1);
});
test('placas cuentan ambas caras e aislamiento usa m² por paquete', () => {
  assert.equal(estimate('drywall', { wallL: 5, wallH: 2.5, sides: 2, waste: 10 }).units, 10);
  assert.equal(estimate('drywall', { wallL: 5, wallH: 2.5, sides: 2, waste: 10 }).total, 137.7);
  assert.equal(estimate('insulation', { area: 20, waste: 10 }).units, 5);
});
test('hormigón cm y mortero mm usan consumo seco, no agua de amasado', () => {
  const c = estimate('concrete', { length: 2, width: 1, thickness: 10, waste: 0 });
  assert.equal(c.required, 480); assert.equal(c.units, 20); assert.equal(c.total, 85.8);
  const m = estimate('mortar', { area: 10, thickness: 10, waste: 0 });
  assert.equal(m.required, 240); assert.equal(m.units, 10); assert.equal(m.total, 27.8);
});
test('ladrillo usa medidas reales, junta y huecos; rodapié descuenta puertas', () => {
  const r = estimate('bricks', { wallL: 5, wallH: 2, openings: 1, joint: 1, waste: 10 });
  assert.equal(r.units, 440); assert.equal(r.total, 105.6);
  assert.equal(estimate('skirting', { roomL: 5, roomW: 4, doors: 2, waste: 10 }).units, 8);
});
test('papel pintado calcula tiras y case en vez de dividir m²', () => {
  const r = estimate('wallpaper', { perimeter: 18, height: 2.5, margin: 10 });
  assert.equal(r.required, 38); assert.equal(r.stripsPerRoll, 3); assert.equal(r.units, 13);
  const repeat = estimate('wallpaper', { perimeter: 18, height: 2.5, margin: 0 }, { ...catalog.wallpaper[0], repeat: .64 });
  assert.equal(repeat.stripLength, 3.2); assert.equal(repeat.units, 12);
  assert.equal(estimate('wallpaper', { perimeter: 18, height: 11, margin: 0 }), null);
});
test('datos inválidos y unidades incompatibles no producen compras', () => {
  for (const required of [-1, NaN, Infinity]) assert.equal(math.pack(required, 15), null);
  assert.equal(math.pack(28, 0), null);
  assert.equal(estimate('floor', { requiredQuantity: 20, requiredUnit: 'L' }), null);
  assert.equal(estimate('floor', { area: NaN, waste: 10 }), null);
  assert.equal(estimate('floor', { area: 20, waste: -10 }), null);
});
test('precio desconocido o caducado no se transforma en cero', () => {
  const p = catalog.floor[0];
  assert.equal(math.price(p, '2026-09-14'), null);
  assert.equal(math.price(catalog.skirting[0], '2026-09-20'), null);
  assert.equal(math.price({ ...p, price: null }, today), null);
  assert.equal(context.window.CommerceEngine.pack(28, { size: 15, price: null }), null);
});
test('todos los productos tienen trazabilidad y mantienen URLs normales', () => {
  const ids = new Set();
  for (const category of Object.keys(catalog).filter(k => k !== 'merchants')) for (const p of catalog[category]) {
    assert.ok(!ids.has(p.id), 'ID duplicado'); ids.add(p.id);
    assert.ok(p.name && p.retailer && p.verifiedAt && p.sourceUrl);
    assert.equal(math.productUrl(p), new URL(p.normalUrl).href);
    assert.equal(p.affiliate.enabled, false); assert.equal(p.affiliate.url, '');
    assert.ok(!p.normalUrl.includes('awinaffid') && !p.normalUrl.includes('awinmid'));
  }
});
test('formatos exactos no añaden una caja por errores de coma flotante', () => {
  assert.equal(math.pack(2.13 * 10, 2.13).units, 10);
  for (const p of catalog.floor) for (let area = .1; area <= 80; area += .37) {
    const r = estimate('floor', { area, waste: 10 }, p);
    assert.ok(r.purchased + 1e-8 >= r.required);
    assert.ok((r.units - 1) * p.coverage < r.required + 1e-8);
  }
});
