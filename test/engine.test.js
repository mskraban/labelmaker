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

test('text fitting never overflows the box (fuzz over lengths and sizes)', () => {
  const words = ['Flour', 'Cinnamon', 'Worcestershire', 'Extra Virgin Olive Oil', 'MMMMMMMM', 'iiiiiiii', 'Sun-dried Tomatoes', 'a', 'Self-Raising Flour', 'Smoked Paprika'];
  for (const w of words) for (const width of [18, 26, 38, 55, 90]) for (const height of [8, 14, 25]) {
    const f = L.fitText(w, width, height, { maxLines: height > 14 ? 2 : 1, serif: width % 2 === 0, caps: width > 40 });
    if (!f.overflow) for (const line of f.lines) assert.ok(L.textWidth(line, { bold: true, serif: width % 2 === 0, caps: width > 40 }) * f.size <= width + 1e-6, `${w} @ ${width}×${height}`);
    assert.ok(f.size >= 2.2 - 1e-9 && f.size <= 12 + 1e-9 && f.lines.length >= 1);
  }
  assert.ok(L.fitText('Flour', 60, 30).size > L.fitText('Extra Virgin Olive Oil', 60, 30).size, 'longer text gets smaller type');
});

test('SVG pages: right size, balanced, one label group per label, no stray values', () => {
  for (const s of L.SHEETS) {
    const labels = L.parseList('Allspice\nFlour | 1 kg\nScrews\nSoup\nVery Long Label Name That Needs To Shrink A Lot');
    const pages = L.render(s, labels, { theme: 'classic' }); assert.equal(pages.length, 1);
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
  for (const t of L.THEMES) for (const sh of [rect, round]) { const svg = L.render(sh, [{ text: 'Salt & <Pepper> "mix"', sub: "it's", icon: null }], { theme: t.id })[0]; assert.ok(svg.includes('&amp;') && svg.includes('&lt;'), t.id); assert.ok(!/<Pepper|<PEPPER/i.test(svg), t.id); }
});

test('offsets move the grid and outlines can be switched on', () => {
  const s = L.sheetById('l7160'), a = L.render(s, [{ text: 'A' }], { offsetX: 0, offsetY: 0 })[0], b = L.render(s, [{ text: 'A' }], { offsetX: 1.5, offsetY: -0.5 })[0];
  assert.ok(a.includes(`translate(${s.left} ${s.top})`)); assert.ok(b.includes(`translate(${s.left + 1.5} ${s.top - 0.5})`));
  assert.ok(L.render(s, [{ text: 'A' }], { outlines: true })[0].includes('stroke="#999"'));
});

test('presets are non-empty and use known themes', () => {
  for (const [id, p] of Object.entries(L.PRESETS)) { assert.ok(p.items.length >= 12, id); assert.ok(L.THEMES.some((t) => t.id === p.theme), id); assert.equal(new Set(p.items).size, p.items.length, `${id} has duplicates`); }
});
