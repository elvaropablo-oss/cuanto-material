const fs = require('node:fs');
const vm = require('node:vm');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync('assets/commerce-catalog.js', 'utf8'), context);
const products = Object.entries(context.window.CMCommerceCatalog).filter(([key]) => key !== 'merchants').flatMap(([, list]) => list);
(async () => {
  const results = [];
  for (let i = 0; i < products.length; i += 4) {
    results.push(...await Promise.all(products.slice(i, i + 4).map(async p => {
      try {
        const r = await fetch(p.normalUrl, { signal: AbortSignal.timeout(25000), headers: { 'User-Agent': 'Mozilla/5.0' } });
        const body = await r.text();
        return { id: p.id, url: p.normalUrl, finalUrl: r.url, status: r.status, title: body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1].trim() || '', broken: r.status === 404 || r.status === 410, inconclusive: !r.ok && r.status !== 404 && r.status !== 410 };
      } catch (error) { return { id: p.id, url: p.normalUrl, status: null, error: error.message, broken: false, inconclusive: true }; }
    })));
  }
  fs.mkdirSync('qa/commerce-2026-09-12', { recursive: true });
  fs.writeFileSync('qa/commerce-2026-09-12/product-links.json', JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results.map(({ id, status, title, broken, error }) => ({ id, status, title, broken, error })), null, 2));
  if (results.some(r => r.broken)) process.exitCode = 1;
})();
