'use strict';
// Copies the label fonts (latin + latin-ext, so č š ž ä ö ü é work) from Fontsource packages into public/fonts
// and writes public/fonts.css. One-off dev script:  npm i --no-save @fontsource-variable/... @fontsource/...  then  node scripts/fetch-fonts.js <node_modules dir>
const fs = require('fs'), path = require('path');
const NM = process.argv[2] || path.join(__dirname, '..', 'node_modules');
const OUT = path.join(__dirname, '..', 'public', 'fonts');
// [id, css family, package, file stem, weights ('var' for variable, or list), display weight range for @font-face]
const FONTS = [
  ['inter', 'Inter', '@fontsource-variable/inter', 'inter', 'var', '100 900'],
  ['bricolage', 'Bricolage Grotesque', '@fontsource-variable/bricolage-grotesque', 'bricolage-grotesque', 'var', '200 800'],
  ['oswald', 'Oswald', '@fontsource-variable/oswald', 'oswald', 'var', '200 700'],
  ['bebas', 'Bebas Neue', '@fontsource/bebas-neue', 'bebas-neue', [400], '400'],
  ['fredoka', 'Fredoka', '@fontsource-variable/fredoka', 'fredoka', 'var', '300 700'],
  ['lora', 'Lora', '@fontsource-variable/lora', 'lora', 'var', '400 700'],
  ['playfair', 'Playfair Display', '@fontsource-variable/playfair-display', 'playfair-display', 'var', '400 900'],
  ['dmserif', 'DM Serif Display', '@fontsource/dm-serif-display', 'dm-serif-display', [400], '400'],
  ['garamond', 'EB Garamond', '@fontsource-variable/eb-garamond', 'eb-garamond', 'var', '400 800'],
  ['cinzel', 'Cinzel', '@fontsource-variable/cinzel', 'cinzel', 'var', '400 900'],
  ['caveat', 'Caveat', '@fontsource-variable/caveat', 'caveat', 'var', '400 700'],
  ['pacifico', 'Pacifico', '@fontsource/pacifico', 'pacifico', [400], '400'],
  ['amatic', 'Amatic SC', '@fontsource/amatic-sc', 'amatic-sc', [700], '700'],
  ['marker', 'Permanent Marker', '@fontsource/permanent-marker', 'permanent-marker', [400], '400'],
  ['typewriter', 'Special Elite', '@fontsource/special-elite', 'special-elite', [400], '400'],
  ['mono', 'JetBrains Mono', '@fontsource-variable/jetbrains-mono', 'jetbrains-mono', 'var', '100 800'],
];
let css = '/* Self-hosted fonts (SIL Open Font License 1.1, see /fonts/*-LICENSE.txt). Latin + Latin Extended, loaded only when used. */\n';
const RANGE = { latin: 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD', 'latin-ext': 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF' };
for (const [id, family, pkg, stem, w, range] of FONTS) {
  const dir = path.join(NM, pkg, 'files'), lic = path.join(NM, pkg, 'LICENSE');
  if (!fs.existsSync(dir)) { console.error('missing', pkg); process.exit(1); }
  if (fs.existsSync(lic)) fs.copyFileSync(lic, path.join(OUT, `${stem}-LICENSE.txt`));
  for (const subset of ['latin', 'latin-ext']) {
    const weights = w === 'var' ? [null] : w;
    for (const wt of weights) {
      const file = w === 'var' ? `${stem}-${subset}-wght-normal.woff2` : `${stem}-${subset}-${wt}-normal.woff2`;
      if (!fs.existsSync(path.join(dir, file))) { if (subset === 'latin-ext') { console.log('no latin-ext for', family, '(accented letters fall back)'); continue; } console.error('missing file', pkg, file); process.exit(1); }
      fs.copyFileSync(path.join(dir, file), path.join(OUT, file));
      css += `@font-face { font-family: '${family}'; font-style: normal; font-display: swap; font-weight: ${range}; src: url('fonts/${file}') format('${w === 'var' ? 'woff2-variations' : 'woff2'}'); unicode-range: ${RANGE[subset]}; }\n`;
    }
  }
}
css += ":root { --font-body: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; --font-display: 'Bricolage Grotesque', 'Inter', system-ui, sans-serif; --font-mono: 'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace; }\n";
fs.writeFileSync(path.join(OUT, '..', 'fonts.css'), css);
console.log('fonts copied:', FONTS.length, 'families');
