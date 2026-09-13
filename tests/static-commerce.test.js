const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');
test('todos los JavaScript locales tienen sintaxis válida', () => {
  for (const file of fs.readdirSync('assets').filter(p => p.endsWith('.js'))) execFileSync(process.execPath, ['--check', path.join('assets', file)]);
});
test('todos los recursos y destinos locales del HTML existen', () => {
  const errors = [];
  for (const file of fs.readdirSync('.').filter(p => p.endsWith('.html'))) {
    const html = fs.readFileSync(file, 'utf8');
    for (const [, value] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^(?:[a-z]+:|\/|#)/i.test(value)) continue;
      const target = decodeURIComponent(value.split(/[?#]/)[0]);
      if (target && !fs.existsSync(target)) errors.push(file + ': ' + value);
    }
  }
  assert.deepEqual(errors, []);
});
test('todas las URLs del sitemap corresponden a páginas', () => {
  for (const [, url] of fs.readFileSync('sitemap.xml', 'utf8').matchAll(/<loc>(.*?)<\/loc>/g)) {
    const target = new URL(url).pathname.replace(/^\/cuanto-material\//, '') || 'index.html';
    assert.ok(fs.existsSync(target), target);
  }
});
test('cada recurso compartido usa una única versión de caché', () => {
  const versions = new Map();
  for (const file of fs.readdirSync('.').filter(p => p.endsWith('.html'))) {
    const html = fs.readFileSync(file, 'utf8');
    for (const [, asset, version] of html.matchAll(/(?:href|src)="(assets\/[^"?]+\.(?:css|js))(?:\?v=([^"&]+))?"/g)) {
      if (!versions.has(asset)) versions.set(asset, new Set());
      versions.get(asset).add(version || '(sin versión)');
    }
  }
  const inconsistent = [...versions].filter(([, values]) => values.size > 1).map(([asset, values]) => `${asset}: ${[...values].join(', ')}`);
  assert.deepEqual(inconsistent, []);
});

test('todos los campos estáticos de formulario tienen una etiqueta asociada', () => {
  const missing = [];
  for (const file of fs.readdirSync('.').filter(p => p.endsWith('.html'))) {
    const html = fs.readFileSync(file, 'utf8');
    for (const [form] of html.matchAll(/<form\b[\s\S]*?<\/form>/gi)) {
      for (const [control, tag, attributes] of form.matchAll(/<(input|select|textarea)\b([^>]*)>/gi)) {
        const id = attributes.match(/\bid="([^"]+)"/i)?.[1];
        const type = attributes.match(/\btype="([^"]+)"/i)?.[1]?.toLowerCase();
        if (!id || ['button', 'hidden', 'reset', 'submit', 'radio'].includes(type)) continue;
        const labelled = new RegExp(`<label\\b[^>]*\\bfor="${id}"`, 'i').test(form);
        const ariaLabelled = /\baria-label(?:ledby)?="[^"]+"/i.test(control);
        if (!labelled && !ariaLabelled) missing.push(`${file}: #${id}`);
      }
    }
  }
  assert.deepEqual(missing, []);
});

test('los campos dinámicos del optimizador tienen etiquetas e identificadores únicos', () => {
  const source = fs.readFileSync('assets/optimizer.js', 'utf8');
  for (const key of ['name', 'size', 'price']) {
    assert.ok(source.includes(`label for="format-${key}-${'${i}'}"`), `falta label de ${key}`);
    assert.ok(source.includes(`id="format-${key}-${'${i}'}"`), `falta id de ${key}`);
  }
  assert.ok(source.includes('aria-label="Eliminar ${esc((f.name||`formato ${i+1}`).trim())}"'));
});
