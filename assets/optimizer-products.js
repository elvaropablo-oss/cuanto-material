(() => {
  'use strict';
  function init() {
    const field = document.createElement('div'); field.className = 'field full';
    field.innerHTML = '<label for="optimizerProductCategory">Consultar productos reales (opcional)</label><select id="optimizerProductCategory"><option value="">Selecciona el material que necesitas</option><option value="paint">Pintura (litros)</option><option value="floor">Suelo laminado (m²)</option><option value="tile">Azulejo de pared (m²)</option><option value="drywall">Placa de yeso estándar (m²)</option><option value="insulation">Aislamiento para tabiques (m²)</option><option value="skirting">Rodapié (metros)</option></select><small>Las opciones comparan cada producto por separado. Los formatos de ejemplo del optimizador no son productos de tienda.</small>';
    document.getElementById('requiredQty')?.closest('.form-grid')?.append(field);
    function update() {
      const type = document.getElementById('optimizerProductCategory').value;
      const section = document.querySelector('.calculator-products');
      if (!type) { if (section) section.hidden = true; return; }
      if (section) section.hidden = false;
      const units = { paint: 'L', floor: 'm²', tile: 'm²', drywall: 'm²', insulation: 'm²', skirting: 'm' };
      const selectedUnit = document.getElementById('unit').value;
      const qty = Number(document.getElementById('requiredQty').value);
      window.CMCalculatorProducts?.render({ type, inputs: { requiredQuantity: qty, requiredUnit: selectedUnit }, valid: qty > 0 && selectedUnit === units[type] });
      const status = document.querySelector('.commerce-status');
      if (status && selectedUnit !== units[type]) status.textContent = `Selecciona la unidad ${units[type]} para comparar este material. No convertimos unidades incompatibles.`;
    }
    ['optimizerProductCategory', 'requiredQty', 'unit'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', update);
      document.getElementById(id)?.addEventListener('change', update);
    });
    document.getElementById('loadExample')?.addEventListener('click', update);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
