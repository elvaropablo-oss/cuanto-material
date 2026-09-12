(() => {
  'use strict';
  const labels = { paint: 'Pinturas para esta superficie', floor: 'Suelo para estos m²', tile: 'Azulejos para estos m²', drywall: 'Placas para este tabique', insulation: 'Aislamiento para estos m²', skirting: 'Rodapié para este perímetro', concrete: 'Hormigón para este volumen', mortar: 'Mortero para este espesor', bricks: 'Ladrillos para esta pared', wallpaper: 'Rollos para estas paredes' };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (value, digits = 2) => new Intl.NumberFormat('es-ES', { maximumFractionDigits: digits }).format(value);
  const money = value => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
  let section, current, usage = 'wall', insulationUsage = 'wall';
  function createSection() {
    const layout = document.querySelector('.tool-layout');
    if (!layout) return null;
    section = document.createElement('section');
    section.className = 'wrap calculator-products';
    section.setAttribute('aria-labelledby', 'calculatorProductsTitle');
    section.innerHTML = '<h2 id="calculatorProductsTitle"></h2><p class="commerce-explanation"></p><div class="commerce-filter"></div><p class="commerce-status" role="status"></p><div class="commerce-grid"></div><p class="commerce-disclaimer">Precios consultados en la fecha de cada ficha, con IVA y sin envío, instalación ni accesorios. No son precios en directo: se ocultan a los 7 días o al acabar la promoción. Comprueba precio, lote y disponibilidad en la tienda antes de comprar. Enlaces directos, sin afiliación.</p>';
    layout.insertAdjacentElement('afterend', section);
    return section;
  }
  function readInputs(form) {
    return Object.fromEntries([...form.querySelectorAll('input[id],select[id]')].map(el => [el.id, el.type === 'checkbox' ? el.checked : Number.isFinite(el.valueAsNumber) ? el.valueAsNumber : (el.value.trim() === '' ? NaN : Number(el.value))]));
  }
  function render(detail) {
    current = detail;
    const { type, inputs, valid = true } = detail;
    if (!labels[type] || !window.CMCommerceCatalog || !window.CMCommerceMath) return;
    if (!section && !createSection()) return;
    section.querySelector('h2').textContent = labels[type];
    const explanation = type === 'paint' ? 'Usamos tu superficie, manos y margen, con el rendimiento de cada pintura. Las unidades pueden cambiar respecto al rendimiento que has introducido.' : type === 'wallpaper' ? 'Calculamos tiras completas por rollo, con 10 cm para recortes y tu margen. No dividimos simplemente los m² entre los m² del rollo.' : ['concrete', 'mortar'].includes(type) ? 'Convertimos tu volumen a producto seco con el consumo declarado de este producto. El agua de amasado no es el rendimiento del saco.' : type === 'bricks' ? 'Usamos la cara y medidas de cada ladrillo, tus huecos, junta y margen. Las piezas pueden cambiar respecto al formato introducido.' : 'Usamos tus medidas y margen, redondeando a formatos completos de cada producto. El coste corresponde al material mostrado.';
    section.querySelector('.commerce-explanation').textContent = inputs.requiredQuantity !== undefined ? 'Comparamos formatos completos para la cantidad que has indicado, sin añadir otro margen. Cada opción es un producto independiente; comprueba que sea el material que necesitas.' : explanation;
    const filter = section.querySelector('.commerce-filter');
    if (!roomDetail && filter.dataset.type !== type) { filter.replaceChildren(); filter.dataset.type = type; }
    if (type === 'tile' && !filter.children.length) {
      filter.innerHTML = '<label for="productTileUse">Superficie que vas a revestir</label><select id="productTileUse"><option value="wall">Pared interior</option><option value="floor">Suelo interior</option></select>';
      filter.querySelector('select').addEventListener('change', e => { usage = e.target.value; render(current); });
    } else if (type === 'insulation' && !filter.children.length) {
      filter.innerHTML = '<label for="productInsulationUse">Dónde vas a colocar el aislamiento</label><select id="productInsulationUse"><option value="wall">Pared o tabique</option><option value="other">Suelo, cubierta u otro uso</option></select>';
      filter.querySelector('select').addEventListener('change', e => { insulationUsage = e.target.value; render(current); });
    }
    let products = window.CMCommerceCatalog[type] || [];
    if (type === 'paint') products = products.filter(p => ['Leroy Merlin', 'BAUHAUS', 'ManoMano'].includes(p.retailer));
    if (type === 'tile') products = products.filter(p => p.usage === usage);
    if (type === 'insulation') products = products.filter(p => p.usage === insulationUsage);
    const grid = section.querySelector('.commerce-grid');
    grid.replaceChildren();
    let count = 0;
    if (valid) products.forEach(product => {
      const p = type === 'paint' ? { ...product, pack: 'bote', format: `${fmt(product.size)} L/bote · ${product.yieldLabel} m²/L` } : product;
      const result = window.CMCommerceMath.estimate(type, inputs, p);
      const url = window.CMCommerceMath.productUrl(p);
      if (!result || result.units <= 0 || !url) return;
      count++;
      const card = document.createElement('article');
      card.className = 'commerce-card'; card.dataset.productId = p.id;
      const extra = type === 'wallpaper' ? `<p class="commerce-detail">Tiras de ${fmt(result.stripLength)} m · ${result.stripsPerRoll} tiras/rollo</p>` : result.volume !== undefined ? `<p class="commerce-detail">${fmt(result.volume, 3)} m³ con margen · ${fmt(result.required)} kg de producto seco</p>` : '';
      card.innerHTML = `<small>${esc(p.retailer)} · ficha consultada ${esc(p.verifiedAt)}</small><h3>${esc(p.name)}</h3><p class="commerce-format">${esc(p.format)}</p><dl><div><dt>Para tu proyecto</dt><dd>${result.units} ${esc(p.pack)}${result.units === 1 ? '' : 's'}</dd></div><div><dt>Compra completa</dt><dd>${fmt(result.purchased)} ${esc(result.unit)}</dd></div><div><dt>Precio/${esc(p.pack)}</dt><dd>${result.unitPrice === null ? 'Consultar en tienda' : money(result.unitPrice)}</dd></div><div><dt>Coste estimado</dt><dd>${result.total === null ? 'Sin precio verificado vigente' : money(result.total)}</dd></div></dl>${extra}<p class="commerce-detail">${esc((p.notes || []).join(' '))}</p><div class="product-actions"><a class="btn accent" target="_blank" rel="noopener noreferrer" href="${esc(url)}">Ver producto ↗</a><button class="btn" type="button">Añadir a Mi proyecto</button></div>`;
      card.querySelector('a').addEventListener('click', () => window.cmTrack?.('product_click', { product_id: p.id, retailer: p.retailer, category: type }));
      card.querySelector('button').addEventListener('click', () => {
        window.CMProject?.add({ title: p.name, source: location.pathname.split('/').pop(), main: `${result.units} ${p.pack}${result.units === 1 ? '' : 's'}`, sub: `${p.retailer} · ${p.format}`, metrics: [['Tienda', p.retailer], ['Compra', `${fmt(result.purchased)} ${result.unit}`], ['Precio consultado', p.verifiedAt], ['Producto', url]], cost: result.total });
        window.cmToast?.('Producto añadido a Mi proyecto');
      });
      grid.append(card);
    });
    section.querySelector('.commerce-status').textContent = !valid ? 'Introduce medidas válidas para calcular los productos.' : count ? `${count} opción${count === 1 ? '' : 'es'} con unidades calculadas para tu proyecto.` : type === 'wallpaper' ? 'No hay rollos que permitan obtener una tira completa para esta altura. Revisa las medidas o busca otro formato.' : type === 'insulation' && insulationUsage === 'other' ? 'No tenemos productos verificados para este uso. Conserva tu cálculo y comprueba la ficha de un aislamiento adecuado.' : 'No hay una cantidad positiva que comprar con estas medidas.';
  }
  document.addEventListener('cm:calculator-result', event => render(event.detail));
  // Also transfer the project context through the existing next-step links.
  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[href]');
    const form = document.querySelector('[data-calculator="paint"]');
    if (!link || !form || !form.checkValidity() || !link.getAttribute('href').startsWith('comparador-pinturas.html')) return;
    const input = readInputs(form), area = window.CMCommerceMath.paintArea(input);
    if (!(area > 0)) { event.preventDefault(); return; }
    const params = new URLSearchParams({ m2: String(area), capas: String(input.coats), margen: String(input.waste) });
    link.href = 'comparador-pinturas.html?' + params;
  }, true);
  let roomDetail, roomCategory = 'paint';
  function renderRoom() {
    if (!roomDetail) return;
    const d = roomDetail;
    const map = { paint: { paintArea: d.paintArea, coats: d.coats, waste: d.paintWaste }, floor: { area: d.area, waste: d.floorWaste }, skirting: { netPerimeter: d.netPerimeter, waste: d.skirtWaste } };
    render({ type: roomCategory, inputs: map[roomCategory], valid: d.valid });
    const filter = section?.querySelector('.commerce-filter');
    if (filter && !filter.children.length) {
      filter.innerHTML = '<label for="roomProductCategory">Material para esta habitación</label><select id="roomProductCategory"><option value="paint">Pintura</option><option value="floor">Suelo laminado</option><option value="skirting">Rodapié</option></select>';
      filter.querySelector('select').addEventListener('change', e => { roomCategory = e.target.value; renderRoom(); });
    }
  }
  document.addEventListener('cm:room-result', event => { roomDetail = event.detail; renderRoom(); });
  window.CMCalculatorProducts = Object.freeze({ readInputs, render });
})();
