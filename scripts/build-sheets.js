'use strict';
// Injects the supported-sheet table into public/index.html so search engines can read it. Run: npm run sheets
const fs = require('fs'), path = require('path'), L = require('../public/engine.js');
const rows = L.SHEETS.map((s) => `<tr><td>${s.name.split(' · ')[0]}</td><td>${s.page[0] > 211 ? 'Letter' : 'A4'}</td><td>${s.w} × ${s.h} mm${s.shape === 'round' ? ' (round)' : ''}</td><td>${s.cols} × ${s.rows}</td><td>${L.perSheet(s)}</td></tr>`).join('\n');
const html = `<!--SHEETS--><div class="tablewrap"><table><thead><tr><th>Sheet</th><th>Paper</th><th>Label size</th><th>Layout</th><th>Per sheet</th></tr></thead><tbody>\n${rows}\n</tbody></table></div><!--/SHEETS-->`;
const file = path.join(__dirname, '..', 'public', 'index.html');
fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/<!--SHEETS-->[\s\S]*?<!--\/SHEETS-->/, html));
console.log('sheet table updated');
