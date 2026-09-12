const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const root = process.cwd();
const pages = ['pintura-paredes', 'suelo-laminado', 'azulejos-baldosas', 'pladur', 'aislamiento', 'hormigon', 'mortero', 'ladrillos-bloques', 'rodapie', 'papel-pintado', 'grava-aridos', 'frigorias-aire-acondicionado', 'reforma-habitacion', 'optimizador-compra-materiales', 'comparador-pinturas'];
const errors = [], results = [];
const server = http.createServer((req, res) => {
  const filename = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!filename.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(filename, (error, body) => {
    if (error) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', ({ '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' })[path.extname(filename)] || 'application/octet-stream'); res.end(body);
  });
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ executablePath: process.env.COMMERCE_BROWSER || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const artifacts = path.join(root, 'qa', 'commerce-2026-09-12'); fs.mkdirSync(artifacts, { recursive: true });
  try {
    for (const width of [1440, 375]) {
      const context = await browser.newContext({ viewport: { width, height: 1000 } });
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400) errors.push(response.status() + ' ' + response.url()); });
      for (const name of pages) {
        await page.goto(base + '/' + name + '.html');
        await page.waitForTimeout(350);
        if (await page.locator('[data-consent="no"]').isVisible()) await page.locator('[data-consent="no"]').click();
        const form = page.locator('form[data-calculator]');
        if (await form.count()) {
          assert.notEqual(await page.locator('#resultMain').textContent(), '—');
          await form.locator('button[type=submit]').click();
          assert.notEqual(await page.locator('#resultMain').textContent(), '—');
          const supported = !['grava-aridos', 'frigorias-aire-acondicionado'].includes(name);
          assert.equal((await page.locator('.commerce-card').count()) > 0, supported, name);
          if (supported) {
            const area = page.locator('#area');
            if (await area.count()) { await area.fill('20'); await form.locator('button[type=submit]').click(); }
            assert.ok(!(await page.locator('.calculator-products').textContent()).includes('NaN'));
          }
        }
        if (name === 'azulejos-baldosas') {
          assert.equal(await page.locator('.commerce-card').getAttribute('data-product-id'), 'metro-artens');
          await page.selectOption('#productTileUse', 'floor');
          assert.equal(await page.locator('.commerce-card').getAttribute('data-product-id'), 'atelier-taupe');
        }
        if (name === 'aislamiento') {
          await page.selectOption('#productInsulationUse', 'other');
          assert.equal(await page.locator('.commerce-card').count(), 0);
          await page.selectOption('#productInsulationUse', 'wall');
        }
        if (name === 'papel-pintado') {
          await page.fill('#height', '11');
          await page.waitForTimeout(200); assert.equal(await page.locator('.commerce-card').count(), 0);
          await page.fill('#height', '2.5'); await page.waitForTimeout(200);
        }
        if (name === 'pintura-paredes') {
          await page.fill('#length', '5'); await page.fill('#width', '4'); await page.fill('#height', '2.5'); await page.fill('#openings', '4'); await page.fill('#coats', '2'); await page.fill('#waste', '10'); await page.check('#ceiling');
          await form.locator('button[type=submit]').click();
          assert.ok((await page.locator('[data-product-id="edm15"]').textContent()).includes('3 botes'));
          assert.ok((await page.locator('[data-product-id="edm15"]').textContent()).includes('Sin precio verificado'));
          const before = await page.locator('[data-product-id="swingcolor-plus15"]').textContent();
          await page.fill('#height', '5'); await page.waitForTimeout(200);
          assert.notEqual(await page.locator('[data-product-id="swingcolor-plus15"]').textContent(), before);
          await page.fill('#height', '2.5'); await page.waitForTimeout(200);
          await page.fill('#length', ''); await page.waitForTimeout(200); assert.equal(await page.locator('.commerce-card').count(), 0);
          await page.fill('#length', '5'); await page.waitForTimeout(200);
          await page.locator('[data-product-id="swingcolor-plus15"] button').click();
          const link = page.locator('.cm-next-links a[href^="comparador-pinturas"]').first();
          await link.click();
          await page.waitForLoadState('domcontentloaded');
          assert.equal(await page.inputValue('#compareArea'), '61');
          assert.equal(await page.inputValue('#compareWaste'), '10');
          assert.equal(await page.locator('.product-card').count(), 8);
          await page.goto(base + '/pintura-paredes.html');
        }
        if (name === 'reforma-habitacion') {
          assert.ok(await page.locator('.commerce-card').count());
          await page.selectOption('#roomProductCategory', 'floor'); assert.equal(await page.locator('.commerce-card').count(), 3);
          await page.selectOption('#roomProductCategory', 'skirting'); assert.equal(await page.locator('.commerce-card').count(), 2);
          await page.locator('#modePlan').click(); await page.waitForTimeout(100); assert.equal(await page.locator('.commerce-card').count(), 0);
          await page.locator('#modeQuick').click(); await page.waitForTimeout(100); assert.equal(await page.locator('.commerce-card').count(), 2);
        }
        if (name === 'optimizador-compra-materiales') {
          await page.selectOption('#optimizerProductCategory', 'paint'); await page.fill('#requiredQty', '28'); await page.selectOption('#unit', 'L');
          assert.ok((await page.locator('[data-product-id="swingcolor-plus15"]').textContent()).includes('2 botes'));
          assert.ok((await page.locator('[data-product-id="swingcolor-plus15"]').textContent()).includes('91,98'));
          await page.selectOption('#unit', 'kg'); assert.equal(await page.locator('.commerce-card').count(), 0);
          await page.selectOption('#unit', 'm²'); await page.selectOption('#optimizerProductCategory', 'tile');
          await page.selectOption('#productTileUse', 'floor'); assert.equal(await page.locator('.commerce-card').getAttribute('data-product-id'), 'atelier-taupe');
          await page.selectOption('#optimizerProductCategory', 'insulation'); assert.equal(await page.locator('#productInsulationUse').count(), 1);
          await page.selectOption('#optimizerProductCategory', ''); assert.equal(await page.locator('.calculator-products').isVisible(), false);
          await page.selectOption('#optimizerProductCategory', 'floor'); assert.equal(await page.locator('.calculator-products').isVisible(), true);
        }
        if (name === 'comparador-pinturas') {
          await page.goto(base + '/comparador-pinturas.html?m2=80&capas=3&margen=10');
          assert.equal(await page.inputValue('#compareArea'), '80');
          assert.equal(await page.inputValue('#compareCoats'), '3');
          assert.equal(await page.locator('.product-card').count(), 8);
          await page.fill('#compareArea', '40'); await page.selectOption('#compareCoats', '2'); await page.fill('#compareWaste', '0');
          await page.locator('#compareForm button[type=submit]').click();
          assert.ok((await page.locator('[data-product-id="swingcolor-plus15"]').textContent()).includes('45,99'));
          assert.ok((await page.locator('[data-product-id="edm15"]').textContent()).includes('Consultar precio'));
          for (const order of ['cost', 'cost_desc', 'tech', 'area', 'value']) { await page.selectOption('#compareSort', order); assert.equal(await page.locator('.product-card').count(), 8); }
          await page.goto(base + '/comparador-pinturas.html?m2=61.0625&capas=4&margen=10');
          assert.equal(await page.inputValue('#compareCoats'), '4'); assert.equal(await page.locator('.product-card').count(), 8);
        }
        const badLinks = await page.locator('.commerce-card a, .product-card a').evaluateAll(links => links.filter(a => !a.href.startsWith('https://') || /awinaffid|awinmid|awin1\.com/.test(a.href)).map(a => a.href));
        assert.deepEqual(badLinks, []);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
        assert.equal(overflow, false, name + ' overflow at ' + width);
        if (['pintura-paredes', 'azulejos-baldosas', 'reforma-habitacion', 'comparador-pinturas'].includes(name)) {
          await page.locator('.calculator-products, #productResults').first().scrollIntoViewIfNeeded();
          await page.locator('.calculator-products, #productResults').first().screenshot({ path: path.join(artifacts, name + '-' + width + '.png') });
        }
        results.push({ page: name, width, ok: true });
      }
      await context.close();
    }
    assert.deepEqual(errors, [], 'JavaScript/local resource errors');
    fs.writeFileSync(path.join(artifacts, 'browser-results.json'), JSON.stringify({ results, errors }, null, 2));
    console.log('30 page/viewport checks passed; no JavaScript or local resource errors.');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
