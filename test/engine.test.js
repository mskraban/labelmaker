'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../public/engine.js');

test('every sheet format fits on its paper and has sane numbers', () => {
  for (const s of L.SHEETS) {
    assert.ok(L.sheetFits(s), `${s.id} does not fit its page`);
    assert.ok(s.px >= s.w - 0.01 && s.py >= s.h - 0.01, `${s.id}: labels overlap`);
    assert.ok(s.w >= 20 && s.h >= 12 && s.cols >= 1 && s.rows >= 1);
    assert.equal(new Set(L.SHEETS.map((x) => x.id)).size, L.SHEETS.length, 'unique ids');
  }
  assert.equal(L.perSheet(L.sheetById('l7160')), 21); assert.equal(L.perSheet(L.sheetById('us5160')), 30); assert.equal(L.perSheet(L.sheetById('l7651')), 65);
});

test('custom sheet and the fit check', () => {
  assert.ok(L.sheetFits(L.customSheet({ w: 63.5, h: 38.1, cols: 3, rows: 7, left: 7.2, top: 15.1, gapX: 2.5 })));
  assert.ok(!L.sheetFits(L.customSheet({ w: 63.5, h: 38.1, cols: 4, rows: 7, left: 7.2, top: 15.1, gapX: 2.5 })), 'four columns of 63.5 mm cannot fit on A4');
  assert.ok(!L.sheetFits(L.customSheet({ w: 50, h: 50, cols: 1, rows: 1, left: -1, top: 0 })));
});

test('layout: pagination, order and the start-at offset', () => {
  const s = L.sheetById('l7160');
  assert.equal(L.layout(s, 21, 0).length, 1); assert.equal(L.layout(s, 22, 0).length, 2); assert.equal(L.layout(s, 0, 0).length, 1);
  const p = L.layout(s, 5, 0)[0]; assert.deepEqual(p.slice(0, 5).map((x) => x.index), [0, 1, 2, 3, 4]); assert.ok(p.slice(5).every((x) => x.index === -1));
  const q = L.layout(s, 3, 4)[0]; assert.deepEqual(q.map((x) => x.index).slice(0, 8), [-1, -1, -1, -1, 0, 1, 2, -1]);
  assert.equal(L.layout(s, 20, 5).length, 2, 'skipping pushes labels onto a second sheet');
  const flat = L.layout(s, 30, 3).flat().filter((x) => x.index >= 0).map((x) => x.index); assert.deepEqual(flat, [...Array(30).keys()]);
  const first = p[0], second = p[1]; assert.equal(second.x - first.x, s.px); assert.equal(first.x, s.left); assert.equal(first.y, s.top);
});

test('list parsing: names, second lines, icons and repeats', () => {
  const r = L.parseList('Flour\n\n  Sugar | white, fine \n3x Salt\n2 x Pepper|hot|pepper\n|nothing', { sub: 'dflt' });
  assert.deepEqual(r.map((x) => x.text), ['Flour', 'Sugar', 'Salt', 'Salt', 'Salt', 'Pepper', 'Pepper']);
  assert.equal(r[0].sub, 'dflt'); assert.equal(r[1].sub, 'white, fine'); assert.equal(r[5].icon, 'pepper'); assert.equal(L.parseList('Tea|x|nonexistent')[0].icon, null);
  assert.equal(L.parseList('999x Salt').length, 200, 'repeat is capped');
});

test('icons follow the words (and not accidental substrings)', () => {
  const t = (s, id) => assert.equal(L.iconFor(s), id, s);
  t('Allspice', 'leaf'); t('Flour', 'wheat'); t('Black Pepper', 'pepper'); t('Screws', 'bolt'); t('Freezer soup', 'snow'); t('Coffee', 'mug'); t('Mystery', 'jar');
  for (const id of Object.values(L.ICONS)) assert.ok(typeof id === 'string' && id.length > 8);
});

test('text fitting never overflows the box (fuzz over lengths, sizes and fonts)', () => {
  const words = ['Flour', 'Cinnamon', 'Worcestershire', 'Extra Virgin Olive Oil', 'MMMMMMMM', 'iiiiiiii', 'Sun-dried Tomatoes', 'a', 'Self-Raising Flour', 'Smoked Paprika', 'Žafran in čili'];
  for (const font of L.FONT_LIST) for (const w of words) for (const width of [18, 26, 38, 55, 90]) for (const height of [8, 14, 25]) {
    const f = L.fitText(w, width, height, { maxLines: height > 14 ? 2 : 1, font: font.id, spacing: width % 2 ? 0.04 : 0 });
    if (!f.overflow) for (const line of f.lines) assert.ok(L.textWidth(line, { font: font.id, spacing: width % 2 ? 0.04 : 0 }) * f.size <= width + 1e-6, `${font.id} ${w} @ ${width}×${height}`);
    assert.ok(f.size >= 2.2 - 1e-9 && f.size <= 12 + 1e-9 && f.lines.length >= 1);
  }
  assert.ok(L.fitText('Flour', 60, 30).size > L.fitText('Extra Virgin Olive Oil', 60, 30).size, 'longer text gets smaller type');
  assert.ok(L.textWidth('Flour', { font: 'oswald' }) < L.textWidth('Flour', { font: 'cinzel' }), 'condensed is narrower than wide capitals');
});

test('a real measurer is used when installed, and removed again with null', () => {
  const before = L.textWidth('Flour', { font: 'inter' });
  L.setMeasurer((str) => str.length * 0.9); assert.equal(L.textWidth('abcd', { font: 'inter' }), 3.6);
  assert.ok(L.fitText('Flour', 20, 10).size <= 20 * 0.97 / 4.5 + 0.01, 'wide glyphs force a smaller size');
  L.setMeasurer(null); assert.equal(L.textWidth('Flour', { font: 'inter' }), before);
});

test('fonts: every font file exists, and accented letters are covered where promised', () => {
  const fs = require('node:fs'), path = require('node:path');
  assert.ok(L.FONT_LIST.length >= 14);
  for (const f of L.FONT_LIST) { assert.ok(f.files.length >= 1 && f.stack && f.family && f.bold && f.light); for (const file of f.files) assert.ok(fs.existsSync(path.join(__dirname, '..', 'public', 'fonts', file)), `${f.id}: ${file} missing`); if (f.id !== 'marker') assert.ok(f.files.some((x) => x.includes('latin-ext')), `${f.id} should include latin-ext (č š ž)`); }
  assert.equal(L.fontById('nope').id, L.FONT_LIST[0].id);
});

test('case modes', () => {
  assert.equal(L.applyCase('žafran in ČILI', 'upper'), 'ŽAFRAN IN ČILI'); assert.equal(L.applyCase('Žafran', 'lower'), 'žafran'); assert.equal(L.applyCase('sun-dried tomatoes', 'title'), 'Sun-Dried Tomatoes'); assert.equal(L.applyCase('MiXed', 'asis'), 'MiXed');
});

test('themes: unique ids, valid fonts and a decent number of looks', () => {
  assert.ok(L.THEMES.length >= 20); assert.equal(new Set(L.THEMES.map((t) => t.id)).size, L.THEMES.length);
  for (const t of L.THEMES) { assert.ok(L.FONT_LIST.some((f) => f.id === t.font), t.id); assert.match(t.bg, /^#[0-9a-f]{6}$/i); assert.ok(['none', 'solid', 'thick', 'double', 'dashed', 'dotted', 'perforated'].includes(t.border), t.id); assert.ok([false, 'top', 'bottom', 'left'].includes(t.band)); assert.ok([null, 'dots', 'stripes', 'gingham', 'lines'].includes(t.pattern)); }
});

test('shapes: die-cut sheets keep their shape, plain paper can be anything', () => {
  assert.equal(L.effectiveShape(L.sheetById('l7160'), 'circle'), 'rect'); assert.equal(L.effectiveShape(L.sheetById('l7160'), 'sheet'), 'rect');
  for (const sh of ['rect', 'pill', 'square', 'circle', 'oval']) assert.equal(L.effectiveShape(L.sheetById('a4-grid-4x8'), sh), sh);
  assert.equal(L.effectiveShape(L.sheetById('a4-grid-4x8'), 'sheet'), 'rect'); assert.equal(L.effectiveShape(L.sheetById('a4-round-40'), 'sheet'), 'circle');
  assert.equal(L.effectiveShape(L.customSheet({ w: 50, h: 50, cols: 2, rows: 2, left: 5, top: 5 }), 'oval'), 'oval');
  assert.equal(L.effectiveShape(L.sheetById('a4-grid-4x8'), 'bogus'), 'rect');
});

test('every shape × theme renders, with a clip path that keeps everything inside', () => {
  const sheet = L.sheetById('a4-grid-4x8');
  for (const sh of ['rect', 'pill', 'square', 'circle', 'oval']) for (const t of L.THEMES) {
    const svg = L.render(sheet, [{ text: 'Flour', sub: 'x', icon: null }], { theme: t.id, shape: sh, dates: [{ type: 'write', label: 'Date' }] })[0];
    assert.ok(svg.includes('<clipPath id="ws-c0">') && svg.includes('clip-path="url(#ws-c0)"'), `${sh}/${t.id}`); assert.ok(!/undefined|NaN/.test(svg));
    if (t.pattern) assert.ok(svg.includes(`id="ws-pat-${t.id}"`) && svg.includes(`url(#ws-pat-${t.id})`), 'pattern defined and used');
    if (sh === 'circle') assert.ok(svg.includes('<circle')); if (sh === 'oval') assert.ok(svg.includes('<ellipse'));
  }
});

test('fonts and case reach the SVG', () => {
  const svg = L.render(L.sheetById('l7160'), [{ text: 'Flour' }], { theme: 'modern', font: 'playfair', caseMode: 'upper' })[0];
  assert.ok(svg.includes("Playfair Display") && svg.includes('FLOUR') && svg.includes('letter-spacing'));
  assert.ok(L.render(L.sheetById('l7160'), [{ text: 'Flour' }], { theme: 'modern' })[0].includes('Inter'), 'theme default font');
  assert.ok(L.render(L.sheetById('l7160'), [{ text: 'Flour' }], { theme: 'scandi' })[0].includes('>flour<'), 'theme default case');
});

test('dates: formats, adding time, and what lands on the label', () => {
  const d = new Date(2026, 9, 31);
  assert.equal(L.formatDate(d, 'dmy.'), '31.10.2026'); assert.equal(L.formatDate(d, 'dmy/'), '31/10/2026'); assert.equal(L.formatDate(d, 'mdy/'), '10/31/2026'); assert.equal(L.formatDate(d, 'iso'), '2026-10-31'); assert.equal(L.formatDate(d, 'long'), '31 Oct 2026'); assert.equal(L.formatDate(d, 'short'), '31 Oct'); assert.equal(L.formatDate(d, 'month'), 'Oct 2026');
  assert.equal(L.formatDate(L.addTime(d, 3, 'months'), 'iso'), '2027-01-31'); assert.equal(L.formatDate(L.addTime(new Date(2026, 0, 31), 1, 'months'), 'iso'), '2026-02-28', 'no overflow into March');
  assert.equal(L.formatDate(L.addTime(new Date(2024, 1, 29), 1, 'years'), 'iso'), '2025-02-28'); assert.equal(L.formatDate(L.addTime(d, 10, 'days'), 'iso'), '2026-11-10'); assert.equal(L.formatDate(L.addTime(d, 2, 'weeks'), 'iso'), '2026-11-14');
  const svg = L.render(L.sheetById('l7163'), [{ text: 'Soup' }], { theme: 'minimal', dates: [{ type: 'text', text: 'Packed 31.10.2026' }, { type: 'write', label: 'Use by' }] })[0];
  assert.ok(svg.includes('Packed 31.10.2026') && svg.includes('Use by') && svg.includes('<line'), 'text and write-in lines');
  const tiny = L.render(L.sheetById('l7651'), [{ text: 'Soup' }], { theme: 'minimal', dates: [{ type: 'text', text: 'Packed 31.10.2026' }, { type: 'text', text: 'Use by 31.01.2027' }] })[0];
  assert.ok(!/NaN/.test(tiny));
});

test('SVG pages: right size, balanced, one label group per label, no stray values', () => {
  for (const s of L.SHEETS) {
    const labels = L.parseList('Allspice\nFlour | 1 kg\nScrews\nSoup\nVery Long Label Name That Needs To Shrink A Lot');
    const pages = L.render(s, labels, { theme: 'classic', dates: [{ type: 'write', label: 'Date' }] }); assert.equal(pages.length, 1);
    const svg = pages[0];
    assert.ok(svg.startsWith(`<svg xmlns="http://www.w3.org/2000/svg" width="${s.page[0]}mm" height="${s.page[1]}mm"`), s.id);
    assert.equal((svg.match(/<g\b/g) || []).length, (svg.match(/<\/g>/g) || []).length, `${s.id}: unbalanced <g>`);
    assert.equal((svg.match(/<text\b/g) || []).length, (svg.match(/<\/text>/g) || []).length);
    assert.ok(!/undefined|NaN|Infinity/.test(svg), `${s.id}: stray value`);
    assert.ok(svg.endsWith('</svg>'));
  }
});

test('every theme renders every shape, and special characters are escaped', () => {
  const rect = L.sheetById('l7163'), round = L.sheetById('a4-round-40');
  for (const t of L.THEMES) for (const sh of [rect, round]) { const svg = L.render(sh, [{ text: 'A & <B>', sub: "it's", icon: null }], { theme: t.id })[0]; assert.ok(svg.includes('&amp;') && svg.includes('&lt;'), t.id); assert.ok(!/<B>/.test(svg), t.id); }
});

test('offsets move the grid and outlines can be switched on', () => {
  const s = L.sheetById('l7160'), a = L.render(s, [{ text: 'A' }], { offsetX: 0, offsetY: 0 })[0], b = L.render(s, [{ text: 'A' }], { offsetX: 1.5, offsetY: -0.5 })[0];
  assert.ok(a.includes(`translate(${s.left} ${s.top})`)); assert.ok(b.includes(`translate(${s.left + 1.5} ${s.top - 0.5})`));
  assert.ok(L.render(s, [{ text: 'A' }], { outlines: true })[0].includes('stroke="#8a8a8a"'));
});

test('presets are non-empty and use known themes', () => {
  for (const [id, p] of Object.entries(L.PRESETS)) { assert.ok(p.items.length >= 12, id); assert.ok(L.THEMES.some((t) => t.id === p.theme), id); assert.equal(new Set(p.items).size, p.items.length, `${id} has duplicates`); }
});

test('black and white mode: only black, white and greys, for every theme, shape and sheet', () => {
  const allowed = new Set(['#ffffff', '#000000', '#6b6b6b', '#8a8a8a', '#fff']);
  for (const sheet of [L.sheetById('l7160'), L.sheetById('a4-grid-4x8')]) for (const t of L.THEMES) for (const shape of ['rect', 'circle', 'oval']) {
    const svg = L.render(sheet, [{ text: 'Flour', sub: 'x', icon: null }, { text: 'Soup', icon: 'snow' }], { theme: t.id, mono: true, accent: '#d9466f', shape, dates: [{ type: 'write', label: 'Date' }], outlines: true })[0];
    const colours = new Set((svg.match(/#[0-9a-fA-F]{3,6}\b/g) || []).map((c) => c.toLowerCase()));
    for (const c of colours) assert.ok(allowed.has(c), `${t.id}/${shape}: colour ${c} in black-and-white mode`);
  }
  const m = L.monoTheme(L.themeById('gold')); assert.deepEqual([m.bg, m.fg, m.accent], ['#ffffff', '#000000', '#000000']); assert.equal(m.font, 'cinzel', 'font is kept');
  assert.ok(L.render(L.sheetById('l7160'), [{ text: 'Flour' }], { theme: 'chalk', mono: false })[0].includes('#22272b'), 'colour mode unchanged');
});
