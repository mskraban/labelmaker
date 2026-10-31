'use strict';
// Generates the favicon set and the social preview image. Run: npm run assets
const fs = require('fs'), path = require('path');
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const pub = path.join(__dirname, '..', 'public');
GlobalFonts.registerFromPath(path.join(pub, 'fonts/bricolage-grotesque-latin-wght-normal.woff2'), 'Bricolage');
GlobalFonts.registerFromPath(path.join(pub, 'fonts/inter-latin-wght-normal.woff2'), 'InterV');
const L = require('../public/engine.js');
fs.writeFileSync(path.join(pub, 'favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#2a7de1"/><path d="M12 22a4 4 0 0 1 4-4h22l14 14-14 14H16a4 4 0 0 1-4-4z" fill="#fff"/><circle cx="21" cy="32" r="3.6" fill="#2a7de1"/><path d="M29 28h10M29 36h7" stroke="#2a7de1" stroke-width="3" stroke-linecap="round"/></svg>\n`);
function mark(x, px, py, s) { const k = s / 64; x.save(); x.translate(px, py); x.scale(k, k); x.fillStyle = '#2a7de1'; x.beginPath(); x.roundRect(0, 0, 64, 64, 16); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.moveTo(12, 22); x.arcTo(12, 18, 16, 18, 4); x.lineTo(38, 18); x.lineTo(52, 32); x.lineTo(38, 46); x.lineTo(16, 46); x.arcTo(12, 46, 12, 42, 4); x.closePath(); x.fill(); x.fillStyle = '#2a7de1'; x.beginPath(); x.arc(21, 32, 3.6, 0, 7); x.fill(); x.strokeStyle = '#2a7de1'; x.lineWidth = 3; x.lineCap = 'round'; x.beginPath(); x.moveTo(29, 28); x.lineTo(39, 28); x.moveTo(29, 36); x.lineTo(36, 36); x.stroke(); x.restore(); }
for (const [n, s] of [['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512], ['favicon-32.png', 32]]) { const c = createCanvas(s, s), x = c.getContext('2d'); mark(x, 0, 0, s); fs.writeFileSync(path.join(pub, n), c.toBuffer('image/png')); }
const W = 1200, H = 630, c = createCanvas(W, H), x = c.getContext('2d'); x.fillStyle = '#f6f3ec'; x.fillRect(0, 0, W, H);
mark(x, 72, 62, 64); x.fillStyle = '#1d2430'; x.font = '800 40px Bricolage'; x.fillText('Labelmaker', 148, 108);
x.font = '800 92px Bricolage'; x.fillText('Labels that', 72, 280); x.fillStyle = '#2a7de1'; x.fillText('match your sheets.', 72, 380);
x.fillStyle = '#6b7380'; x.font = '500 30px InterV'; x.fillText('Avery & plain paper · icons · presets · free and offline', 74, 450);
// sample labels, rendered by the engine itself (SVG → drawn as simple boxes with text to avoid an SVG decoder)
const names = ['Cinnamon', 'Flour', 'Screws', 'Soup']; const themes = ['classic', 'modern', 'bold', 'minimal'];
names.forEach((n, i) => { const t = L.themeById(themes[i]), bx = 760 + (i % 2) * 210, by = 170 + Math.floor(i / 2) * 140; x.fillStyle = t.bg; x.strokeStyle = t.accent; x.lineWidth = 3; x.beginPath(); x.roundRect(bx, by, 190, 118, 12); x.fill(); x.stroke(); x.fillStyle = t.fg; x.font = '800 34px Bricolage'; x.textAlign = 'center'; x.fillText(n, bx + 95, by + 72); x.textAlign = 'left'; });
let cx = 74; for (const t of ['free', 'offline', 'exact size']) { x.font = '600 24px InterV'; const w = x.measureText(t).width; x.fillStyle = '#e9e5d9'; x.beginPath(); x.roundRect(cx, 500, w + 36, 48, 24); x.fill(); x.fillStyle = '#1d2430'; x.fillText(t, cx + 18, 533); cx += w + 52; }
fs.writeFileSync(path.join(pub, 'og.jpg'), c.toBuffer('image/jpeg', 90)); console.log('assets done');
