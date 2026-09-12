(() => {
  const load = src => new Promise((resolve, reject) => { const script = document.createElement('script'); script.src = src; script.onload = resolve; script.onerror = reject; document.head.append(script); });
  const boot = async () => {
    try {
      if (!window.CommerceEngine) await load('https://elvaropablo-oss.github.io/assets/commerce-engine.js');
      if (!window.CMCommerceCatalog) await load('assets/commerce-catalog.js?v=20260912-2');
    } catch { return; }
    const $ = id => document.getElementById(id);
    const money = value => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(value);
    const fmt = (value, digits = 1) => new Intl.NumberFormat('es-ES', { maximumFractionDigits: digits }).format(value);
    const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const engine = window.CommerceEngine, products = window.CMCommerceCatalog?.paint || [];
    const criteria = [{ key: 'yield', source: 'root', min: 0, max: 14, weight: 30 }, { key: 'washable', type: 'boolean', weight: 20 }, { key: 'highCover', type: 'boolean', weight: 15 }, { key: 'antimold', type: 'boolean', weight: 10 }, { key: 'antibacterial', type: 'boolean', weight: 10 }, { key: 'eco', type: 'boolean', weight: 10 }, { key: 'lowOdor', type: 'boolean', weight: 5 }];
    const track = (name, row, required, cost) => window.cmTrack?.(name, { site: 'cuantomaterial', calculator: 'paint_compare', product_id: row?.id, retailer: row?.retailer, category: 'paint', required_quantity: Math.round(required * 100) / 100, units: row?.purchase?.units, project_cost: cost, affiliate_enabled: row?.affiliate?.enabled === true });
    function render() {
      if (!engine || !products.length) return;
      const area = Math.max(.1, Number($('compareArea').value) || 0), coats = Math.max(1, Number($('compareCoats').value) || 1), required = area * coats;
      let rows = engine.rank(products, { required, technicalCriteria: criteria, calculate: p => engine.pack(required / p.yield, p, { sizeKey: 'size', priceKey: 'price' }) }).map(r => ({ ...r, requiredLiters: required / r.yield }));
      const sorter = { cost: (a, b) => a.purchase.projectCost - b.purchase.projectCost, cost_desc: (a, b) => b.purchase.projectCost - a.purchase.projectCost, tech: (a, b) => b.technical.score - a.technical.score, area: (a, b) => a.purchase.unitCost / a.yield - b.purchase.unitCost / b.yield }[$('compareSort').value];
      if (sorter) rows = [...rows].sort(sorter);
      const wins = engine.winners(rows), best = [...rows].sort((a, b) => (b.valueScore ?? -1) - (a.valueScore ?? -1))[0];
      $('compareHighlights').innerHTML = `<div class="compare-highlight"><span>Menor coste de la selección</span><b>${esc(wins.cheapest.name)}</b><strong>${money(wins.cheapest.purchase.projectCost)}</strong></div><div class="compare-highlight"><span>Mejor índice calidad-precio</span><b>${esc(best.name)}</b><strong>${fmt(best.valueScore,0)}/100</strong></div><div class="compare-highlight"><span>Mayor índice técnico declarado</span><b>${esc(wins.bestTechnical.name)}</b><strong>${fmt(wins.bestTechnical.technical.score,0)}/100</strong></div>`;
      const box = $('productResults'); box.innerHTML = '';
      rows.forEach(row => { const card = document.createElement('article'); card.className = `product-card${row.id === best.id ? ' recommended' : ''}`; const badges = `${row.id === best.id ? '<span class="badge">Mejor calidad-precio</span>' : ''}${row.id === wins.cheapest.id ? '<span class="badge">Menor coste</span>' : ''}`; card.innerHTML = `<div class="product-card-head"><div><div class="product-badges">${badges}</div><small>${esc(row.retailer)} · comprobado ${esc(row.verifiedAt)}</small><h2>${esc(row.name)}</h2></div><div class="product-score"><b>${fmt(row.valueScore,0)}</b><span>calidad-precio</span></div></div><div class="product-price"><strong>${money(row.purchase.projectCost)}</strong><span>para ${fmt(area)} m² · ${coats} mano${coats === 1 ? '' : 's'}</span></div><div class="product-metrics"><div><b>${row.purchase.units} × ${fmt(row.size)} L</b><span>Compra</span></div><div><b>${fmt(row.requiredLiters)} L</b><span>Necesidad</span></div><div><b>${fmt(row.purchase.purchased)} L</b><span>Compra total</span></div><div><b>${fmt(row.purchase.waste)} L</b><span>Sobrante</span></div><div><b>${fmt(row.technical.score,0)}/100</b><span>Índice técnico</span></div></div><div class="product-features">${row.notes.map(n => `<span>${esc(n)}</span>`).join('')}</div><div class="product-actions"><a class="btn" target="_blank">Ver ficha y precio actual ↗</a><button class="btn accent" type="button">Añadir a Mi proyecto</button></div>`; const link = card.querySelector('a'); engine.decorateLink(link, row); link.addEventListener('click', () => { track('affiliate_product_click', row, required, row.purchase.projectCost); track('affiliate_retailer_click', row, required, row.purchase.projectCost); }); card.querySelector('button').addEventListener('click', () => { window.CMProject?.add({ title: `Pintura: ${row.name}`, source: 'comparador-pinturas.html', main: money(row.purchase.projectCost), sub: `${row.purchase.units} envase${row.purchase.units === 1 ? '' : 's'} de ${fmt(row.size)} L.`, metrics: [['Tienda', row.retailer], ['Necesitas', `${fmt(row.requiredLiters)} L`], ['Compras', `${fmt(row.purchase.purchased)} L`], ['Sobrante', `${fmt(row.purchase.waste)} L`], ['Verificado', row.verifiedAt]], cost: row.purchase.projectCost }); window.cmToast?.('Producto añadido a Mi proyecto'); }); box.append(card); });
      const note = document.querySelector('.source-note'); if (note) note.innerHTML = '<b>Precios comprobados el 10/09/2026.</b> Los enlaces llevan a la ficha oficial del producto. AWIN permanece desactivado hasta disponer de aprobación y enlace de seguimiento real.';
      track('affiliate_module_view', null, required, wins.cheapest.purchase.projectCost);
    }
    document.addEventListener('DOMContentLoaded', () => { const q = new URLSearchParams(location.search), area = Number(q.get('m2')), coats = Number(q.get('capas')); if (area > 0) $('compareArea').value = String(area); if (coats > 0) $('compareCoats').value = String(Math.min(3, coats)); ['compareArea','compareCoats'].forEach(id => $(id)?.addEventListener('input', render)); $('compareSort')?.addEventListener('change', render); $('compareForm')?.addEventListener('submit', e => { e.preventDefault(); render(); }); render(); });
    if (document.readyState !== 'loading') {
      ['compareArea','compareCoats'].forEach(id => $(id)?.addEventListener('input', render));
      $('compareSort')?.addEventListener('change', render);
      $('compareForm')?.addEventListener('submit', e => { e.preventDefault(); render(); });
      render();
    }
  };
  boot();
})();
