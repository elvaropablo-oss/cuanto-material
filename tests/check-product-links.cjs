const fs = require('node:fs');
const vm = require('node:vm');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync('assets/commerce-catalog.js', 'utf8'), context);
const products = Object.entries(context.window.CMCommerceCatalog).filter(([key]) => key !== 'merchants').flatMap(([, list]) => list);
async function checkLinks(products, fetcher = fetch) {
  const results = [];
  for (let i = 0; i < products.length; i += 4) {
    results.push(...await Promise.all(products.slice(i, i + 4).map(async p => {
      try {
        const r = await fetcher(p.normalUrl, { signal: AbortSignal.timeout(25000), headers: { 'User-Agent': 'Mozilla/5.0' } });
        const body = await r.text();
        return { id: p.id, url: p.normalUrl, finalUrl: r.url, status: r.status, title: body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1].trim() || '', broken: r.status === 404 || r.status === 410, inconclusive: !r.ok && r.status !== 404 && r.status !== 410 };
      } catch (error) { return { id: p.id, url: p.normalUrl, status: null, error: error.message, broken: false, inconclusive: true }; }
    })));
  }
  return results;
}
// HTTP reachability is not evidence of price, stock or product compatibility.
function exitCode(results) {
  if (results.some(r => r.broken)) return 1;
  if (!results.length || results.some(r => r.inconclusive)) return 2;
  return 0;
}
module.exports = { checkLinks, exitCode };
if (require.main === module) {
  checkLinks(products).then(results => {
    console.log(JSON.stringify({ checkedAt: new Date().toISOString(), scope: 'HTTP reachability only', results }, null, 2));
    process.exitCode = exitCode(results);
  }).catch(error => { console.error(error.message); process.exitCode = 2; });
}
