(() => {
  'use strict';
  const finite = value => typeof value === 'number' && Number.isFinite(value);
  const positive = value => finite(value) && value > 0;
  const nonnegative = value => finite(value) && value >= 0;
  const ceil = value => Math.ceil(value - 1e-10 * Math.max(1, Math.abs(value)));
  const paintArea = input => Math.max(0, 2 * (input.length + input.width) * input.height - input.openings + (input.ceiling ? input.length * input.width : 0));
  function pack(required, capacity) {
    if (!nonnegative(required) || !positive(capacity)) return null;
    const units = ceil(required / capacity);
    return { required, units, purchased: units * capacity, surplus: Math.max(0, units * capacity - required) };
  }
  function price(product, today = new Date().toISOString().slice(0, 10)) {
    if (!nonnegative(product.price)) return null;
    const age = (Date.parse(today) - Date.parse(product.verifiedAt)) / 86400000;
    // Expire snapshots rather than silently keeping old prices forever.
    if (!finite(age) || age < 0 || age > 7 || (product.priceValidUntil && today > product.priceValidUntil)) return null;
    return product.price;
  }
  function estimate(type, input, product, today) {
    const v = key => input[key];
    const reserve = type === 'wallpaper' ? v('margin') : v('waste');
    if (!nonnegative(reserve) && input.requiredQuantity === undefined) return null;
    const factor = 1 + reserve / 100;
    let result;
    if (input.requiredQuantity !== undefined) {
      if (!['paint', 'tile', 'floor', 'drywall', 'insulation', 'skirting'].includes(type) || input.requiredUnit !== product.unit) return null;
      result = pack(input.requiredQuantity, type === 'paint' ? product.size : product.coverage);
    } else if (type === 'paint') {
      if (![v('coats'), product.yield, product.size].every(positive)) return null;
      if (v('paintArea') === undefined && (![v('length'), v('width'), v('height')].every(positive) || !nonnegative(v('openings')))) return null;
      const area = v('paintArea') === undefined ? paintArea(input) : v('paintArea');
      result = pack(area * v('coats') / product.yield * factor, product.size);
    } else if (['tile', 'floor', 'insulation'].includes(type)) {
      if (!positive(v('area'))) return null;
      result = pack(v('area') * factor, product.coverage);
    } else if (type === 'drywall') {
      if (![v('wallL'), v('wallH'), v('sides')].every(positive)) return null;
      result = pack(v('wallL') * v('wallH') * v('sides') * factor, product.coverage);
    } else if (type === 'skirting') {
      if (v('netPerimeter') === undefined && (![v('roomL'), v('roomW')].every(positive) || !nonnegative(v('doors')))) return null;
      const perimeter = v('netPerimeter') === undefined ? Math.max(0, 2 * (v('roomL') + v('roomW')) - v('doors')) : v('netPerimeter');
      result = pack(perimeter * factor, product.coverage);
    } else if (type === 'concrete' || type === 'mortar') {
      if (!positive(v('thickness')) || !positive(product.dryKgPerM3) || !positive(product.weight)) return null;
      let volume;
      if (type === 'mortar') {
        if (!positive(v('area'))) return null;
        volume = v('area') * v('thickness') / 1000 * factor;
      } else {
        if (![v('length'), v('width')].every(positive)) return null;
        volume = v('length') * v('width') * v('thickness') / 100 * factor;
      }
      result = pack(volume * product.dryKgPerM3, product.weight);
      if (result) { result.volume = volume; result.unit = 'kg'; }
    } else if (type === 'bricks') {
      if (![v('wallL'), v('wallH'), product.length, product.height].every(positive) || ![v('openings'), v('joint')].every(nonnegative)) return null;
      const area = Math.max(0, v('wallL') * v('wallH') - v('openings'));
      result = pack(area / ((product.length + v('joint') / 100) * (product.height + v('joint') / 100)) * factor, 1);
      if (result) result.unit = 'piezas';
    } else if (type === 'wallpaper') {
      if (![v('perimeter'), v('height'), product.rollWidth, product.rollLength].every(positive) || !nonnegative(product.repeat)) return null;
      const cut = v('height') + .1;
      const stripLength = product.repeat > 0 ? ceil(cut / product.repeat) * product.repeat : cut;
      const stripsPerRoll = Math.floor(product.rollLength / stripLength + 1e-10);
      if (!stripsPerRoll) return null;
      const strips = ceil(ceil(v('perimeter') / product.rollWidth) * factor);
      result = { ...pack(strips, stripsPerRoll), stripLength, stripsPerRoll };
    }
    if (!result || !Object.values(result).filter(x => typeof x === 'number').every(finite) || !Number.isSafeInteger(result.units)) return null;
    const unitPrice = price(product, today);
    return { ...result, unit: result.unit || product.unit, unitPrice, total: unitPrice === null ? null : Math.round(result.units * unitPrice * 100) / 100 };
  }
  // All links stay direct. This single boundary can use verified AWIN links in a future change.
  function productUrl(product) {
    try { const url = new URL(product.normalUrl); return url.protocol === 'https:' ? url.href : null; } catch { return null; }
  }
  window.CMCommerceMath = Object.freeze({ pack, price, estimate, productUrl, paintArea });
})();
