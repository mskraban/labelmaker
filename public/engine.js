/* Labelmaker engine: label sheet formats, layout, themes, icons and SVG page generation.
   Dependency-free; runs in browsers and Node. Output is SVG in millimetres, so it prints at exact size. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Labelmaker = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const VERSION = 1;

  /* ───────────── sheet formats (all sizes in mm) ───────────── */
  // left/top = margin to the first label; px/py = pitch (distance from one label's edge to the next one's).
  const A4 = [210, 297], LETTER = [215.9, 279.4];
  const S = (id, name, page, w, h, cols, rows, left, top, px, py, extra = {}) => ({ id, name, page, w, h, cols, rows, left, top, px, py, shape: 'rect', ...extra });
  const SHEETS = [
    S('l7160', 'Avery L7160 · 63.5 × 38.1 mm · 21 labels', A4, 63.5, 38.1, 3, 7, 7.21, 15.15, 66.04, 38.1),
    S('l7161', 'Avery L7161 · 63.5 × 46.6 mm · 18 labels', A4, 63.5, 46.6, 3, 6, 7.21, 8.47, 66.04, 46.6),
    S('l7162', 'Avery L7162 · 99.1 × 33.9 mm · 16 labels', A4, 99.1, 33.9, 2, 8, 4.65, 12.9, 101.6, 33.9),
    S('l7163', 'Avery L7163 · 99.1 × 38.1 mm · 14 labels', A4, 99.1, 38.1, 2, 7, 4.65, 15.15, 101.6, 38.1),
    S('l7164', 'Avery L7164 · 63.5 × 72 mm · 12 labels', A4, 63.5, 72, 3, 3, 7.21, 12.9, 66.04, 72),
    S('l7165', 'Avery L7165 · 99.1 × 67.7 mm · 8 labels', A4, 99.1, 67.7, 2, 4, 4.65, 13, 101.6, 67.7),
    S('l7651', 'Avery L7651 · 38.1 × 21.2 mm · 65 labels', A4, 38.1, 21.2, 5, 13, 4.7, 10.7, 40.64, 21.2),
    S('us5160', 'Avery 5160 (Letter) · 2⅝ × 1″ · 30 labels', LETTER, 66.68, 25.4, 3, 10, 4.76, 12.7, 69.85, 25.4),
    S('us5163', 'Avery 5163 (Letter) · 4 × 2″ · 10 labels', LETTER, 101.6, 50.8, 2, 5, 4.76, 12.7, 104.78, 50.8),
    S('us5164', 'Avery 5164 (Letter) · 4 × 3⅓″ · 6 labels', LETTER, 101.6, 84.67, 2, 3, 4.76, 12.7, 104.78, 84.67),
    S('a4-round-40', 'A4 · round 40 mm · 24 labels', A4, 40, 40, 4, 6, 15, 18.5, 45, 45, { shape: 'round' }),
    S('a4-round-50', 'A4 · round 50 mm · 15 labels', A4, 50, 50, 3, 5, 20, 21.5, 55, 55, { shape: 'round' }),
    S('a4-grid-3x8', 'Plain A4 · 3 × 8 grid (print and cut)', A4, 65, 33, 3, 8, 7.5, 16.5, 65, 33),
    S('a4-grid-2x6', 'Plain A4 · 2 × 6 grid (print and cut)', A4, 95, 45, 2, 6, 10, 13.5, 95, 45),
    S('letter-grid-3x8', 'Plain Letter · 3 × 8 grid (print and cut)', LETTER, 68, 32, 3, 8, 5.95, 11.7, 68, 32),
  ];
  const sheetById = (id) => SHEETS.find((s) => s.id === id) || null;
  function customSheet({ page = 'a4', w, h, cols, rows, left, top, gapX = 0, gapY = 0, shape = 'rect' }) {
    const p = page === 'letter' ? LETTER : A4;
    return { id: 'custom', name: 'Custom', page: p, w, h, cols, rows, left, top, px: w + gapX, py: h + gapY, shape };
  }
  /** Does the grid fit on the page? (lets the UI warn about a typo) */
  function sheetFits(s) { return s.left + (s.cols - 1) * s.px + s.w <= s.page[0] + 0.01 && s.top + (s.rows - 1) * s.py + s.h <= s.page[1] + 0.01 && s.left >= 0 && s.top >= 0; }
  const perSheet = (s) => s.cols * s.rows;

  /* ───────────── themes ───────────── */
  const THEMES = [
    { id: 'classic', name: 'Classic', bg: '#fffdf7', fg: '#2b2118', accent: '#8a5a2b', font: 'serif', border: 'double', band: false, caps: false },
    { id: 'modern', name: 'Modern', bg: '#ffffff', fg: '#16202b', accent: '#2a7de1', font: 'sans', border: 'none', band: true, caps: false },
    { id: 'chalk', name: 'Chalkboard', bg: '#22272b', fg: '#f5f2ea', accent: '#e8c36a', font: 'sans', border: 'solid', band: false, caps: true },
    { id: 'kraft', name: 'Kraft', bg: '#d8b98c', fg: '#3a2a18', accent: '#6e4a24', font: 'serif', border: 'solid', band: false, caps: true },
    { id: 'minimal', name: 'Minimal', bg: '#ffffff', fg: '#111111', accent: '#111111', font: 'sans', border: 'none', band: false, caps: false },
    { id: 'garden', name: 'Garden', bg: '#f4f8ec', fg: '#25391f', accent: '#5b8f3a', font: 'serif', border: 'solid', band: true, caps: false },
    { id: 'bold', name: 'Bold', bg: '#ffd84a', fg: '#111111', accent: '#111111', font: 'sans', border: 'solid', band: false, caps: true },
  ];
  const themeById = (id) => THEMES.find((t) => t.id === id) || THEMES[0];
  const ACCENTS = ['#8a5a2b', '#2a7de1', '#d9466f', '#5b8f3a', '#e08a1e', '#7a4fc0', '#1fa08a', '#444444'];

  /* ───────────── icons: 24×24, stroke only ───────────── */
  const ICONS = {
    leaf: 'M5 19C5 10 10 5 20 4c0 10-5 15-14 15zM5 19c3-4 6-7 10-9',
    wheat: 'M12 21V8M12 8c-2-1-3-3-3-5 2 0 3 2 3 5zM12 8c2-1 3-3 3-5-2 0-3 2-3 5zM12 13c-2-1-3-3-3-5M12 13c2-1 3-3 3-5M12 18c-2-1-3-3-3-5M12 18c2-1 3-3 3-5',
    cube: 'M12 3l8 4v10l-8 4-8-4V7zM4 7l8 4 8-4M12 11v10',
    bowl: 'M3 11h18a9 9 0 0 1-18 0zM8 21h8M12 11V6',
    cup: 'M5 8h12v7a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5zM17 10h2a2 2 0 0 1 0 5h-2M8 3v2M12 3v2',
    snow: 'M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M9 4l3 2 3-2M9 20l3-2 3 2',
    seeds: 'M8 8a2 3 0 1 0 .01 0M16 7a2 3 0 1 0 .01 0M12 15a2 3 0 1 0 .01 0M6 17a2 3 0 1 0 .01 0M18 16a2 3 0 1 0 .01 0',
    flame: 'M12 3c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-10z',
    fish: 'M3 12c3-5 9-6 14-2l4-3v10l-4-3c-5 4-11 3-14-2zM8 11v.01',
    drop: 'M12 3s6 6 6 11a6 6 0 0 1-12 0c0-5 6-11 6-11z',
    nut: 'M12 3c5 0 8 4 8 9s-3 9-8 9-8-4-8-9 3-9 8-9zM12 3v18M9 8c1 2 1 6 0 8M15 8c-1 2-1 6 0 8',
    apple: 'M12 7c-3-2-8-1-8 5 0 5 3 9 5 9 1 0 2-1 3-1s2 1 3 1c2 0 5-4 5-9 0-6-5-7-8-5zM12 7c0-2 1-4 3-4',
    wrench: 'M14 4a5 5 0 0 0-5 6L3 16l2 2 2 2 6-6a5 5 0 0 0 6-5l-3 3-3-1-1-3 3-3z',
    bolt: 'M12 2l9 5v10l-9 5-9-5V7zM12 8a4 4 0 1 0 .01 0',
    tape: 'M12 4a8 8 0 1 0 .01 0M12 10a2 2 0 1 0 .01 0M19 17l3 3',
    plug: 'M9 3v5M15 3v5M6 8h12v4a6 6 0 0 1-12 0zM12 18v4',
    thread: 'M7 4h10v3H7zM7 17h10v3H7zM8 7v10M16 7v10M10 9l4 2M10 12l4 2',
    flower: 'M12 9a3 3 0 1 0 .01 0M12 6c-2-3 2-4 0 0M12 18c-2 3 2 4 0 0M6 12c-3-2-4 2 0 0M18 12c3-2 4 2 0 0M8 8L6 6M16 8l2-2M8 16l-2 2M16 16l2 2',
    jar: 'M7 3h10v3H7zM6 6h12v2c1 1 1 3 1 5v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6c0-2 0-4 1-5z',
    star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
    heart: 'M12 20S4 14 4 9a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 5-8 11-8 11z',
    egg: 'M12 3c4 0 7 7 7 11a7 7 0 0 1-14 0c0-4 3-11 7-11z',
    mug: 'M5 6h11v10a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4zM16 8h2a3 3 0 0 1 0 6h-2',
    pepper: 'M13 4c1-1 3-1 4 0M14 5c-6 0-9 5-9 9 0 3 2 6 5 6 4 0 8-5 4-15z',
    box: 'M3 8l9-4 9 4v10l-9 4-9-4zM3 8l9 4 9-4M12 12v10',
    scissors: 'M6 6a2.5 2.5 0 1 0 .01 0M6 18a2.5 2.5 0 1 0 .01 0M8 7.5L20 17M8 16.5L20 7',
  };
  const ICON_KEYWORDS = [
    [/freez|frozen|\bice\b/i, 'snow'], [/pepper|chil[il]|cayenne|paprika|jalape|harissa/i, 'pepper'], [/flour|wheat|oat|cereal|bread|rye|barley|corn ?meal|semolina|grain|muesli|granola/i, 'wheat'],
    [/sugar|salt|stock cube|bouillon|cube/i, 'cube'], [/rice|pasta|spaghetti|noodle|couscous|quinoa|lentil|bean|chickpea|soup|stew|bolognese|chili|broth|curry|bowl/i, 'bowl'],
    [/tea|chamomile|mint tea/i, 'cup'], [/coffee|espresso|cocoa|chocolate|hot choc/i, 'mug'],
    [/seed|sesame|poppy|mustard|fennel|cumin|coriander|caraway|popcorn|sunflower|chia|flax/i, 'seeds'], [/oil|vinegar|sauce|syrup|honey|juice|milk|vanilla|extract|soy/i, 'drop'],
    [/nut|almond|walnut|cashew|pecan|peanut|pistachio|hazel/i, 'nut'], [/apple|berry|berries|fruit|raisin|apricot|date|fig|plum|cherry|tomato/i, 'apple'],
    [/fish|salmon|tuna|cod|shrimp|prawn/i, 'fish'], [/egg|custard/i, 'egg'],
    [/basil|oregano|thyme|rosemary|sage|parsley|dill|tarragon|chive|bay|herb|mint|cilantro|leaf|tobacco|sumac|za'?atar|cardamom|clove|cinnamon|nutmeg|allspice|anise|saffron|turmeric|ginger|garam|spice/i, 'leaf'],
    [/screw|nail|bolt|nut\b|washer|anchor|rivet|hook|hinge|fastener|staple/i, 'bolt'], [/drill|hex|key|wrench|socket|plier|tool|spanner|clamp|saw|hammer/i, 'wrench'],
    [/tape|glue|adhesive|sandpaper|paint|brush|varnish|sealant/i, 'tape'], [/cable|battery|batteries|fuse|bulb|plug|adapter|charger|wire|usb|electr|zip tie|cable tie/i, 'plug'],
    [/thread|yarn|wool|ribbon|button|bead|felt|fabric|needle|sewing|knit|crochet/i, 'thread'], [/scissors|craft|paper|glitter|stamp|sticker/i, 'scissors'],
    [/flower|garden|tomato|carrot|lettuce|pea\b|bean plant|cucumber|squash|plant/i, 'flower'], [/jar|pickle|jam|preserve|marmalade|chutney/i, 'jar'], [/toy|lego|game|puzzle/i, 'star'], [/love|heart|gift|wedding/i, 'heart'],
  ];
  /** Pick an icon for a label from its text; falls back to a neutral one. */
  function iconFor(text, fallback = 'jar') { for (const [re, id] of ICON_KEYWORDS) if (re.test(text)) return id; return fallback; }

  /* ───────────── presets ───────────── */
  const PRESETS = {
    spices: { name: 'Spice jars', theme: 'classic', sub: '', items: ['Allspice', 'Basil', 'Bay Leaves', 'Black Pepper', 'Cardamom', 'Cayenne', 'Chili Flakes', 'Chili Powder', 'Chives', 'Cinnamon', 'Cloves', 'Coriander', 'Cumin', 'Curry Powder', 'Dill', 'Fennel Seeds', 'Garam Masala', 'Garlic Powder', 'Ginger', 'Italian Seasoning', 'Mustard Seeds', 'Nutmeg', 'Onion Powder', 'Oregano', 'Paprika', 'Smoked Paprika', 'Parsley', 'Rosemary', 'Saffron', 'Sage', 'Sea Salt', 'Sesame Seeds', 'Star Anise', 'Sumac', 'Tarragon', 'Thyme', 'Turmeric', 'Vanilla', 'White Pepper', "Za'atar"] },
    pantry: { name: 'Pantry', theme: 'kraft', sub: '', items: ['Flour', 'Bread Flour', 'Sugar', 'Brown Sugar', 'Powdered Sugar', 'Rice', 'Basmati Rice', 'Pasta', 'Spaghetti', 'Lentils', 'Chickpeas', 'Black Beans', 'Oats', 'Cornmeal', 'Couscous', 'Quinoa', 'Breadcrumbs', 'Cocoa', 'Chocolate Chips', 'Coffee', 'Tea', 'Honey', 'Peanut Butter', 'Raisins', 'Almonds', 'Walnuts', 'Cashews', 'Popcorn', 'Cereal', 'Crackers'] },
    baking: { name: 'Baking', theme: 'modern', sub: '', items: ['All-Purpose Flour', 'Self-Raising Flour', 'Baking Powder', 'Baking Soda', 'Cornstarch', 'Yeast', 'Vanilla Extract', 'Cocoa Powder', 'Brown Sugar', 'Caster Sugar', 'Icing Sugar', 'Chocolate Chips', 'Sprinkles', 'Food Colouring', 'Gelatine', 'Almond Flour', 'Shredded Coconut', 'Cream of Tartar'] },
    freezer: { name: 'Freezer (with date)', theme: 'minimal', sub: 'Date: ____ / ____', items: ['Soup', 'Stew', 'Bolognese', 'Chili', 'Broth', 'Bread', 'Berries', 'Chicken', 'Beef', 'Fish', 'Pesto', 'Cookie Dough', 'Leftovers', 'Curry', 'Dumplings', 'Vegetables'] },
    workshop: { name: 'Workshop drawers', theme: 'bold', sub: '', items: ['Screws', 'Nails', 'Bolts', 'Nuts', 'Washers', 'Wall Anchors', 'Drill Bits', 'Hex Keys', 'Fuses', 'Cable Ties', 'Tape', 'Glue', 'Sandpaper', 'Batteries', 'Light Bulbs', 'Hooks', 'Hinges', 'Sockets', 'Paint Brushes', 'Wire', 'Adapters', 'Magnets', 'Clamps', 'Spare Parts'] },
    garden: { name: 'Garden markers', theme: 'garden', sub: 'Sown: ____', items: ['Tomato', 'Basil', 'Mint', 'Carrot', 'Lettuce', 'Spinach', 'Peas', 'Beans', 'Cucumber', 'Courgette', 'Radish', 'Parsley', 'Chives', 'Thyme', 'Sunflower', 'Marigold'] },
    craft: { name: 'Craft room', theme: 'classic', sub: '', items: ['Buttons', 'Beads', 'Thread', 'Ribbon', 'Felt', 'Yarn', 'Needles', 'Fabric Scraps', 'Zippers', 'Elastic', 'Glitter', 'Stickers', 'Washi Tape', 'Stamps', 'Paint', 'Scissors'] },
  };

  /* ───────────── text measurement (Helvetica-like widths, per 1000 em) ───────────── */
  const W = {};
  const set = (chars, w) => { for (const c of chars) W[c] = w; };
  set(' ', 278); set('abdeghnopqu', 556); set('c', 500); set('ksvxyz', 500); set('fjt', 278); set('il', 222); set('m', 833); set('r', 333); set('w', 722);
  set('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 690); set('IJ', 300); set('M', 830); set('W', 944); set('FEL', 600); set('GOQ', 778); set('0123456789', 556); set('.,:;\'’!|', 260); set('-–—', 333); set('&', 667); set('/()', 300); set('_', 556);
  /** Width of a string in em for the given font family kind. */
  function textWidth(str, { bold = false, serif = false, caps = false } = {}) {
    let w = 0; for (const ch of caps ? str.toUpperCase() : str) w += W[ch] !== undefined ? W[ch] : (ch.charCodeAt(0) > 0x2e80 ? 1000 : 600);
    w /= 1000; if (bold) w *= 1.07; if (serif) w *= 0.93; return w;
  }
  /** Largest font size (mm) so `text` fits `maxW` on at most `maxLines` lines, and ≤ maxH tall. */
  function fitText(text, maxW, maxH, { maxSize = 12, minSize = 2.2, maxLines = 2, bold = true, serif = false, caps = false, lineHeight = 1.12 } = {}) {
    const words = String(text).trim().split(/\s+/).filter(Boolean);
    const opt = { bold, serif, caps };
    for (let size = maxSize; size >= minSize - 1e-9; size -= 0.1) {
      const lines = []; let cur = '';
      for (const w of words) { const t = cur ? cur + ' ' + w : w; if (textWidth(t, opt) * size <= maxW || !cur) cur = t; else { lines.push(cur); cur = w; } }
      if (cur) lines.push(cur);
      if (lines.length <= maxLines && lines.every((l) => textWidth(l, opt) * size <= maxW + 1e-6) && lines.length * size * lineHeight <= maxH + 1e-6) return { size: Math.round(size * 10) / 10, lines, overflow: false };
    }
    // cannot fit: shrink to the minimum and truncate the last line
    const size = minSize, lines = [];
    let cur = '';
    for (const w of words) { const t = cur ? cur + ' ' + w : w; if (textWidth(t, opt) * size <= maxW || !cur) cur = t; else { lines.push(cur); cur = w; } }
    if (cur) lines.push(cur);
    const out = lines.slice(0, maxLines);
    let last = out[out.length - 1] || ''; while (last.length > 1 && textWidth(last + '…', opt) * size > maxW) last = last.slice(0, -1);
    if (lines.length > maxLines || textWidth(last, opt) * size > maxW) out[out.length - 1] = last + '…';
    return { size, lines: out, overflow: true };
  }

  /* ───────────── parsing the label list ───────────── */
  /** One label per line. "Name | second line | icon" – everything after the first | is optional. "3x Name" repeats. */
  function parseList(text, defaults = {}) {
    const out = [];
    for (const raw of String(text || '').split(/\r?\n/)) {
      let line = raw.trim(); if (!line) continue;
      let n = 1; const m = /^(\d{1,3})\s*[x×]\s+(.*)$/i.exec(line); if (m) { n = Math.min(200, +m[1]); line = m[2]; }
      const [name, sub, icon] = line.split('|').map((s) => s.trim());
      if (!name) continue;
      for (let i = 0; i < n; i++) out.push({ text: name.slice(0, 60), sub: sub !== undefined && sub !== '' ? sub.slice(0, 60) : (defaults.sub || ''), icon: icon && ICONS[icon] ? icon : null });
    }
    return out;
  }

  /* ───────────── layout ───────────── */
  /** Place `count` labels on as many sheets as needed. `skip` leaves that many positions empty at the start (partly used sheet). */
  function layout(sheet, count, skip = 0) {
    const per = perSheet(sheet), pages = []; let idx = -skip;
    const total = count + skip, nPages = Math.max(1, Math.ceil(total / per));
    for (let p = 0; p < nPages; p++) {
      const slots = [];
      for (let r = 0; r < sheet.rows; r++) for (let c = 0; c < sheet.cols; c++) {
        const slot = p * per + r * sheet.cols + c, i = slot - skip;
        slots.push({ col: c, row: r, x: sheet.left + c * sheet.px, y: sheet.top + r * sheet.py, w: sheet.w, h: sheet.h, index: i >= 0 && i < count ? i : -1 });
      }
      pages.push(slots);
    }
    return pages;
  }

  /* ───────────── SVG ───────────── */
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const num = (n) => Math.round(n * 100) / 100;
  const FONTS = { sans: "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif", serif: "'Bricolage Grotesque', Georgia, 'Times New Roman', serif" };

  /** One label as an SVG <g> in a w×h mm box at the origin. */
  function labelSvg(label, w, h, theme, opts = {}) {
    const t = typeof theme === 'string' ? themeById(theme) : theme, accent = opts.accent || t.accent, round = opts.shape === 'round';
    const serif = t.font === 'serif', family = serif ? "Georgia, 'Times New Roman', serif" : FONTS.sans, bold = true;
    const out = [];
    const pad = Math.min(w, h) * 0.09 + 0.8;
    // background and border
    if (round) {
      const r = Math.min(w, h) / 2;
      out.push(`<circle cx="${num(w / 2)}" cy="${num(h / 2)}" r="${num(r)}" fill="${t.bg}"/>`);
      if (t.border !== 'none') out.push(`<circle cx="${num(w / 2)}" cy="${num(h / 2)}" r="${num(r - 1.1)}" fill="none" stroke="${accent}" stroke-width="0.5"/>`);
      if (t.border === 'double') out.push(`<circle cx="${num(w / 2)}" cy="${num(h / 2)}" r="${num(r - 2)}" fill="none" stroke="${accent}" stroke-width="0.25"/>`);
    } else {
      const rad = Math.min(2.2, Math.min(w, h) * 0.1);
      out.push(`<rect width="${num(w)}" height="${num(h)}" rx="${num(rad)}" fill="${t.bg}"/>`);
      if (t.band) out.push(`<path d="M0 ${num(rad)}a${num(rad)} ${num(rad)} 0 0 1 ${num(rad)} ${num(-rad)}h${num(w - 2 * rad)}a${num(rad)} ${num(rad)} 0 0 1 ${num(rad)} ${num(rad)}v${num(Math.max(1.4, h * 0.08) - rad)}h${num(-w)}z" fill="${accent}"/>`);
      if (t.border !== 'none') out.push(`<rect x="0.7" y="0.7" width="${num(w - 1.4)}" height="${num(h - 1.4)}" rx="${num(Math.max(0.5, rad - 0.6))}" fill="none" stroke="${accent}" stroke-width="0.4"/>`);
      if (t.border === 'double') out.push(`<rect x="1.7" y="1.7" width="${num(w - 3.4)}" height="${num(h - 3.4)}" rx="${num(Math.max(0.4, rad - 1.4))}" fill="none" stroke="${accent}" stroke-width="0.2"/>`);
    }
    const bandH = t.band && !round ? Math.max(1.4, h * 0.08) : 0;
    const innerW = (round ? w * 0.74 : w) - pad * 2, innerH = h - pad * 2 - bandH;
    const iconId = label.icon || (opts.icons === false ? null : iconFor(label.text));
    const wide = !round && w / h >= 1.55 && innerH > 8;
    const showIcon = iconId && ICONS[iconId] && Math.min(w, h) >= 16 && opts.icons !== false;
    let iconSize = showIcon ? (wide ? Math.min(innerH * 0.8, h * 0.52, 14) : Math.min(h * (round ? 0.28 : 0.32), w * 0.4, 14)) : 0;
    let tx = pad, ty = pad + bandH, tw = innerW, th = innerH, anchor = 'middle', cx;
    if (showIcon && wide) { const ix = pad + 1.2; out.push(iconGroup(iconId, ix, bandH + (h - bandH - iconSize) / 2, iconSize, accent)); tx = ix + iconSize + 2.2; tw = w - tx - pad; cx = tx + tw / 2; }
    else if (showIcon) { const iy = round ? h * 0.15 : pad + bandH + 0.3; out.push(iconGroup(iconId, (w - iconSize) / 2, iy, iconSize, accent)); ty = iy + iconSize + 0.8; th = h - ty - (round ? h * 0.14 : pad); tw = round ? w * 0.7 : innerW; cx = w / 2; }
    else { cx = w / 2; if (round) { tw = w * 0.72; } }
    if (wide || !showIcon) cx = (showIcon && wide) ? cx : w / 2;
    const subH = label.sub ? Math.min(th * 0.34, 4.2) : 0, mainH = th - subH - (subH ? 0.6 : 0);
    const fit = fitText(label.text, tw, mainH, { maxSize: Math.min(11, mainH * 0.92), maxLines: mainH > 14 ? 2 : 1, bold, serif, caps: t.caps });
    const lineH = fit.size * 1.12, blockH = fit.lines.length * lineH + (subH ? subH + 0.6 : 0), startY = ty + (th - blockH) / 2;
    const txtOpen = `<text font-family="${family}" fill="${t.fg}" text-anchor="${anchor}" font-weight="700"${t.caps ? ' letter-spacing="0.04em"' : ''}>`;
    out.push(`<g font-size="${fit.size}">${fit.lines.map((l, i) => `<text x="${num(cx)}" y="${num(startY + lineH * (i + 0.82))}" font-family="${esc(family)}" fill="${t.fg}" text-anchor="middle" font-weight="700"${t.caps ? ' letter-spacing="0.04em"' : ''}>${esc(t.caps ? l.toUpperCase() : l)}</text>`).join('')}</g>`);
    if (label.sub) { const sf = fitText(label.sub, tw, subH, { maxSize: Math.min(4.2, subH * 0.95), maxLines: 1, bold: false, serif }); out.push(`<text x="${num(cx)}" y="${num(startY + fit.lines.length * lineH + 0.6 + sf.size * 0.85)}" font-size="${sf.size}" font-family="${esc(family)}" fill="${t.fg}" fill-opacity="0.72" text-anchor="middle">${esc(sf.lines[0] || '')}</text>`); }
    return out.join('');
  }
  function iconGroup(id, x, y, size, color) {
    const k = size / 24;
    return `<g transform="translate(${num(x)} ${num(y)}) scale(${num(k)})" fill="none" stroke="${color}" stroke-width="${num(Math.max(1.3, 0.55 / k))}" stroke-linecap="round" stroke-linejoin="round"><path d="${ICONS[id]}"/></g>`;
  }

  /**
   * One full page as a standalone SVG sized in mm. `slots` come from layout(); `labels` is the full list.
   * opts: { theme, accent, offsetX, offsetY, outlines, icons }
   */
  function pageSvg(sheet, slots, labels, opts = {}) {
    const [pw, ph] = sheet.page, ox = opts.offsetX || 0, oy = opts.offsetY || 0, theme = themeById(opts.theme);
    const parts = [`<svg xmlns="http://www.w3.org/2000/svg" width="${pw}mm" height="${ph}mm" viewBox="0 0 ${pw} ${ph}" role="img" aria-label="Label sheet">`, `<rect width="${pw}" height="${ph}" fill="#fff"/>`];
    for (const s of slots) {
      if (s.index < 0) { if (opts.showEmpty) parts.push(`<g transform="translate(${num(s.x + ox)} ${num(s.y + oy)})"><${sheet.shape === 'round' ? `circle cx="${num(s.w / 2)}" cy="${num(s.h / 2)}" r="${num(s.w / 2)}"` : `rect width="${num(s.w)}" height="${num(s.h)}" rx="2"`} fill="none" stroke="#bbb" stroke-width="0.25" stroke-dasharray="1.5 1.5"/></g>`); continue; }
      const lab = labels[s.index], th = lab.theme ? themeById(lab.theme) : theme;
      parts.push(`<g transform="translate(${num(s.x + ox)} ${num(s.y + oy)})">${labelSvg(lab, s.w, s.h, th, { accent: opts.accent, shape: sheet.shape, icons: opts.icons })}${opts.outlines ? (sheet.shape === 'round' ? `<circle cx="${num(s.w / 2)}" cy="${num(s.h / 2)}" r="${num(s.w / 2)}" fill="none" stroke="#999" stroke-width="0.2"/>` : `<rect width="${num(s.w)}" height="${num(s.h)}" fill="none" stroke="#999" stroke-width="0.2"/>`) : ''}</g>`);
    }
    parts.push('</svg>');
    return parts.join('');
  }

  /** All pages for a label list on a sheet. */
  function render(sheet, labels, opts = {}) {
    const pages = layout(sheet, labels.length, opts.skip || 0);
    return pages.map((slots) => pageSvg(sheet, slots, labels, opts));
  }

  return { VERSION, SHEETS, THEMES, ACCENTS, ICONS, PRESETS, sheetById, customSheet, sheetFits, perSheet, themeById, iconFor, textWidth, fitText, parseList, layout, labelSvg, pageSvg, render };
});
