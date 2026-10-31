'use strict';
// Real-browser check that no text ever leaves its label: every theme × font × shape on several sheets, with awkward strings.
// Needs Playwright (not a project dependency):  npx playwright install chromium  &&  node scripts/check-fit.js
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const PUB = path.join(__dirname, '..', 'public');
const server = http.createServer((q, r) => { const f = path.join(PUB, q.url === '/' ? 'index.html' : decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(f)) { r.statusCode = 404; return r.end(); } r.setHeader('Content-Type', { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' }[path.extname(f)] || 'application/octet-stream'); fs.createReadStream(f).pipe(r); });
(async () => {
  await new Promise((r) => server.listen(0, r)); const port = server.address().port;
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1000, height: 800 } });
  await p.goto(`http://localhost:${port}/`); await p.waitForTimeout(500);
  const result = await p.evaluate(async () => {
    const L = Labelmaker, TEXTS = ['Flour', 'Worcestershire Sauce', 'Extra Virgin Olive Oil', 'Wall Anchors', 'Žafran in čili', 'Chocolate Chips', 'MMMMMMMM', 'Sun-dried Tomatoes', 'Spaghetti', 'a', 'Self-Raising Flour', 'Cardamom', 'Bolognese sauce'];
    const sample = TEXTS.join('') + 'Second line Date Packed Use by 0123456789./-: ŠĐČĆŽ';
    await Promise.all(L.FONT_LIST.flatMap((f) => [f.bold, f.light].map((w) => document.fonts.load(`${w} 20px "${f.family}"`, sample))));
    const ctx = document.createElement('canvas').getContext('2d'), cache = new Map();
    L.setMeasurer((s, id, bold) => { const k = id + bold + s; if (!cache.has(k)) { const f = L.fontById(id); ctx.font = `${bold ? f.bold : f.light} 100px "${f.family}"`; cache.set(k, ctx.measureText(s).width / 100); } return cache.get(k); });
    const labels = TEXTS.map((t, i) => ({ text: t, sub: i % 2 ? 'Second line text' : '', icon: null }));
    const dateSets = [[], [{ type: 'write', label: 'Date' }], [{ type: 'text', text: 'Packed 31.10.2026' }, { type: 'text', text: 'Use by 31.01.2027' }]];
    const combos = [['l7160', 'sheet'], ['l7651', 'sheet'], ['us5163', 'sheet'], ['a4-round-40', 'circle'], ['a4-round-40', 'oval'], ['a4-round-40', 'pill'], ['a4-round-40', 'square'], ['a4-grid-4x8', 'rect'], ['a4-square-45', 'square']];
    const box = document.createElement('div'); box.style.cssText = 'position:absolute;left:-9999px;top:0'; document.body.appendChild(box);
    let checked = 0; const bad = [];
    for (const theme of L.THEMES) for (const font of L.FONT_LIST) for (const [sid, shape] of combos) {
      const sheet = L.sheetById(sid), eff = L.effectiveShape(sheet, shape), dates = dateSets[(checked + font.id.length) % 3], scale = [1, 1.3, 0.8][checked % 3];
      const svg = L.render(sheet, labels, { theme: theme.id, font: font.id, shape, dates, sizeScale: scale, icons: checked % 2 === 0 })[0];
      box.innerHTML = svg; const root = box.firstChild;
      const groups = [...root.querySelectorAll(':scope > g[transform]')];
      groups.forEach((g, gi) => {
        const cw = sheet.w, ch = sheet.h, s = Math.min(cw, ch), sw = eff === 'square' || eff === 'circle' ? s : cw, sh = eff === 'square' || eff === 'circle' ? s : ch, sx = (cw - sw) / 2, sy = (ch - sh) / 2;
        g.querySelectorAll('text').forEach((t) => {
          const bb = t.getBBox(); if (!bb.width) return; checked++;
          // vertical extent of the ink, not of the font's line box (script fonts have enormous ascent/descent)
          const size = parseFloat(t.getAttribute('font-size') || t.parentNode.getAttribute('font-size')), base = parseFloat(t.getAttribute('y')), top = base - size * 0.75, bot = base + size * 0.22;
          const pts = [[bb.x, top], [bb.x + bb.width, top], [bb.x, bot], [bb.x + bb.width, bot]], m = 0.15;
          const inside = pts.every(([x, y]) => {
            if (eff === 'circle' || eff === 'oval') { const a = sw / 2 - m, c = sh / 2 - m, dx = (x - cw / 2) / a, dy = (y - ch / 2) / c; return dx * dx + dy * dy <= 1; }
            return x >= sx + m && x <= sx + sw - m && y >= sy + m && y <= sy + sh - m;
          });
          if (!inside && bad.length < 40) bad.push(`${theme.id}/${font.id}/${sid}/${shape}: "${t.textContent.slice(0, 30)}" bbox ${bb.x.toFixed(1)},${bb.y.toFixed(1)} ${bb.width.toFixed(1)}×${bb.height.toFixed(1)} in ${cw}×${ch}`);
        });
      });
    }
    return { checked, bad };
  });
  console.log(`checked ${result.checked} text elements`); console.log(result.bad.length ? 'OUTSIDE:\n' + result.bad.join('\n') : 'all text is inside its label');
  await b.close(); server.close(); process.exit(result.bad.length ? 1 : 0);
})();
