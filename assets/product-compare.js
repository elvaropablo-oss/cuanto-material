(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const money = value => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
  const fmt = (value, digits = 1) => new Intl.NumberFormat('es-ES', { maximumFractionDigits: digits }).format(value);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const criteria = [{ key: 'yield', source: 'root', min: 0, max: 14, weight: 30 }, { key: 'washable', type: 'boolean', weight: 20 }, { key: 'highCover', type: 'boolean', weight: 15 }, { key: 'antimold', type: 'boolean', weight: 10 }, { key: 'antibacterial', type: 'boolean', weight: 10 }, { key: 'eco', type: 'boolean', weight: 10 }, { key: 'lowOdor', type: 'boolean', weight: 5 }];
  function render() {
    const engine = window.CommerceEngine, math = window.CMCommerceMath;
    const box = $('productResults');
    if (!engine || !math || !window.CMCommerceCatalog) { box.textContent = 'No se ha podido cargar el catálogo. Recarga la página.'; return; }
    if (!$('compareForm').checkValidity()) { box.textContent = 'Introduce una superficie y un margen válidos.'; $('compareHighlights').replaceChildren(); return; }
    const area = Number($('compareArea').value), coats = Number($('compareCoats').value), margin = Number($('compareWaste').value) / 100;
    const required = area * coats * (1 + margin);
    const products = window.CMCommerceCatalog.paint.map(p => ({ ...p, price: math.price(p) }));
    const pack = p => { const purchase = math.pack(required / p.yield, p.size); return purchase ? { ...purchase, waste: purchase.surplus, projectCost: p.price === null ? null : Math.round(purchase.units * p.price * 100) / 100, unitCost: p.price === null ? null : p.price / p.size } : null; };
    const priced = engine.rank(products.filter(p => p.price !== null), { required, technicalCriteria: criteria, calculate: pack });
    const unpriced = products.filter(p => p.price === null).map(p => ({ ...p, purchase: pack(p), technical: engine.technicalScore(p, criteria), valueScore: null }));
    const validTech = row => row.technical.coverage >= .6 && row.technical.score !== null;
    const field = $('compareSort').value;
    const score = row => field === 'tech' ? (validTech(row) ? row.technical.score : null) : field === 'area' ? (row.price === null ? null : row.price / row.size / row.yield) : field.startsWith('cost') ? row.purchase.projectCost : row.valueScore;
    const descending = ['value', 'tech', 'cost_desc'].includes(field);
    const rows = [...priced, ...unpriced].filter(p => p.purchase).sort((a, b) => {
      const x = score(a), y = score(b);
      if (x === null) return y === null ? 0 : 1;
      if (y === null) return -1;
      return descending ? y - x : x - y;
    });
    const wins = engine.winners(priced.filter(validTech)), cheapest = [...priced].sort((a, b) => a.purchase.projectCost - b.purchase.projectCost)[0], best = wins.bestValue;
    $('compareHighlights').innerHTML = [cheapest ? ['Menor coste con precio verificado', cheapest.name, money(cheapest.purchase.projectCost)] : null, best ? ['Mejor índice calidad-precio calculable', best.name, fmt(best.valueScore, 0) + '/100'] : null, wins.bestTechnical ? ['Mayor índice técnico comparable', wins.bestTechnical.name, fmt(wins.bestTechnical.technical.score, 0) + '/100'] : null].filter(Boolean).map(([label, name, value]) => '<div class="compare-highlight"><span>' + esc(label) + '</span><b>' + esc(name) + '</b><strong>' + value + '</strong></div>').join('');
    box.replaceChildren();
    rows.forEach(row => {
      const card = document.createElement('article'); card.className = 'product-card' + (row.id === best?.id ? ' recommended' : ''); card.dataset.productId = row.id;
      const badges = (row.id === best?.id ? '<span class="badge">Mejor calidad-precio calculable</span>' : '') + (row.id === cheapest?.id ? '<span class="badge">Menor coste verificado</span>' : '');
      const need = required / row.yield, cost = row.purchase.projectCost;
      card.innerHTML = '<div class="product-card-head"><div><div class="product-badges">' + badges + '</div><small>' + esc(row.retailer) + ' · ficha consultada ' + esc(row.verifiedAt) + '</small><h2>' + esc(row.name) + '</h2></div><div class="product-score"><b>' + (row.valueScore === null ? '—' : fmt(row.valueScore, 0)) + '</b><span>' + (row.valueScore === null ? 'Sin índice comparable' : 'calidad-precio') + '</span></div></div><div class="product-price"><strong>' + (cost === null ? 'Consultar precio' : money(cost)) + '</strong><span>para ' + fmt(area) + ' m² · ' + coats + ' manos · ' + fmt(margin * 100, 0) + ' % de margen</span></div><div class="product-metrics"><div><b>' + row.purchase.units + ' × ' + fmt(row.size) + ' L</b><span>Compra</span></div><div><b>' + fmt(need) + ' L</b><span>Necesidad</span></div><div><b>' + fmt(row.purchase.purchased) + ' L</b><span>Compra total</span></div><div><b>' + fmt(row.purchase.waste) + ' L</b><span>Sobrante</span></div><div><b>' + (validTech(row) ? fmt(row.technical.score, 0) + '/100' : 'Datos insuficientes') + '</b><span>Índice técnico</span></div><div><b>' + (row.price === null ? 'Sin precio vigente verificado' : money(row.price)) + '</b><span>Precio por bote</span></div><div><b>' + esc(row.yieldLabel) + ' m²/L</b><span>Rendimiento declarado</span></div></div><div class="product-features">' + row.notes.map(n => '<span>' + esc(n) + '</span>').join('') + '</div><div class="product-actions"><a class="btn" target="_blank" rel="noopener noreferrer">Ver producto y precio actual ↗</a><button class="btn accent" type="button">Añadir a Mi proyecto</button></div>';
      const link = card.querySelector('a'); link.href = math.productUrl(row); link.dataset.affiliate = 'false';
      link.addEventListener('click', () => window.cmTrack?.('product_click', { product_id: row.id, retailer: row.retailer, category: 'paint' }));
      card.querySelector('button').addEventListener('click', () => { window.CMProject?.add({ title: 'Pintura: ' + row.name, source: 'comparador-pinturas.html', main: cost === null ? 'Precio por consultar' : money(cost), sub: row.purchase.units + ' envases de ' + fmt(row.size) + ' L.', metrics: [['Tienda', row.retailer], ['Necesitas', fmt(need) + ' L'], ['Compras', fmt(row.purchase.purchased) + ' L'], ['Sobrante', fmt(row.purchase.waste) + ' L'], ['Ficha consultada', row.verifiedAt]], cost }); window.cmToast?.('Producto añadido a Mi proyecto'); });
      box.append(card);
    });
  }
  function init() {
    const q = new URLSearchParams(location.search), area = Number(q.get('m2')), coats = Number(q.get('capas')), margin = Number(q.get('margen'));
    if (area > 0) $('compareArea').value = String(area);
    if (Number.isFinite(coats) && coats > 0) {
      const count = Math.max(1, Math.round(coats));
      if (count > 3) { const option = document.createElement('option'); option.value = String(count); option.textContent = count + ' manos (importadas)'; $('compareCoats').append(option); }
      $('compareCoats').value = String(count);
    }
    if (margin >= 0 && q.has('margen')) $('compareWaste').value = String(margin);
    ['compareArea', 'compareCoats', 'compareWaste'].forEach(id => $(id).addEventListener('input', render));
    $('compareSort').addEventListener('change', render);
    $('compareForm').addEventListener('submit', e => { e.preventDefault(); render(); });
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
