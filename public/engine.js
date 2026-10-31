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
    S('a4-round-40', 'Plain A4 · 40 mm cells · 24 labels (print and cut)', A4, 40, 40, 4, 6, 15, 18.5, 45, 45, { shape: 'round', plain: true }),
    S('a4-round-50', 'Plain A4 · 50 mm cells · 15 labels (print and cut)', A4, 50, 50, 3, 5, 20, 21.5, 55, 55, { shape: 'round', plain: true }),
    S('a4-square-45', 'Plain A4 · 45 mm squares · 20 labels (print and cut)', A4, 45, 45, 4, 5, 7.5, 26, 50, 50, { plain: true }),
    S('a4-grid-4x8', 'Plain A4 · 4 × 8 small · 45 × 30 mm (print and cut)', A4, 45, 30, 4, 8, 15, 25, 45, 30, { plain: true }),
    S('a4-grid-2x4', 'Plain A4 · 2 × 4 large · 90 × 60 mm (print and cut)', A4, 90, 60, 2, 4, 10, 20, 95, 65, { plain: true }),
    S('a4-grid-3x8', 'Plain A4 · 3 × 8 grid (print and cut)', A4, 65, 33, 3, 8, 7.5, 16.5, 65, 33, { plain: true }),
    S('a4-grid-2x6', 'Plain A4 · 2 × 6 grid (print and cut)', A4, 95, 45, 2, 6, 10, 13.5, 95, 45, { plain: true }),
    S('letter-grid-3x8', 'Plain Letter · 3 × 8 grid (print and cut)', LETTER, 68, 32, 3, 8, 5.95, 11.7, 68, 32, { plain: true }),
  ];
  const sheetById = (id) => SHEETS.find((s) => s.id === id) || null;
  function customSheet({ page = 'a4', w, h, cols, rows, left, top, gapX = 0, gapY = 0, shape = 'rect' }) {
    const p = page === 'letter' ? LETTER : A4;
    return { id: 'custom', name: 'Custom', page: p, w, h, cols, rows, left, top, px: w + gapX, py: h + gapY, shape, plain: true };
  }
  /** Does the grid fit on the page? (lets the UI warn about a typo) */
  function sheetFits(s) { return s.left + (s.cols - 1) * s.px + s.w <= s.page[0] + 0.01 && s.top + (s.rows - 1) * s.py + s.h <= s.page[1] + 0.01 && s.left >= 0 && s.top >= 0; }
  const perSheet = (s) => s.cols * s.rows;

  /* ───────────── fonts ───────────── */
  // All bundled with the app (SIL Open Font License), so labels work offline.
  // wMul / boldMul: width relative to the built-in Helvetica-like table, used only when no real measurer is available.
  const FONT_LIST = [
    { id: 'inter', name: 'Inter', kind: 'Clean sans', family: 'Inter', bold: 700, light: 500, mul: 1.0, files: ['inter-latin-wght-normal.woff2', 'inter-latin-ext-wght-normal.woff2'], var: '100 900', stack: "Inter, 'Helvetica Neue', Arial, sans-serif" },
    { id: 'bricolage', name: 'Bricolage Grotesque', kind: 'Friendly sans', family: 'Bricolage Grotesque', bold: 700, light: 500, mul: 1.0, files: ['bricolage-grotesque-latin-wght-normal.woff2', 'bricolage-grotesque-latin-ext-wght-normal.woff2'], var: '200 800', stack: "'Bricolage Grotesque', Inter, Arial, sans-serif" },
    { id: 'oswald', name: 'Oswald', kind: 'Condensed', family: 'Oswald', bold: 600, light: 400, mul: 0.8, files: ['oswald-latin-wght-normal.woff2', 'oswald-latin-ext-wght-normal.woff2'], var: '200 700', stack: "Oswald, 'Arial Narrow', Arial, sans-serif" },
    { id: 'bebas', name: 'Bebas Neue', kind: 'Tall capitals', family: 'Bebas Neue', bold: 400, light: 400, mul: 0.74, files: ['bebas-neue-latin-400-normal.woff2', 'bebas-neue-latin-ext-400-normal.woff2'], var: '400', stack: "'Bebas Neue', Oswald, Impact, sans-serif", capsOnly: true },
    { id: 'fredoka', name: 'Fredoka', kind: 'Round and friendly', family: 'Fredoka', bold: 600, light: 400, mul: 1.06, files: ['fredoka-latin-wght-normal.woff2', 'fredoka-latin-ext-wght-normal.woff2'], var: '300 700', stack: "Fredoka, 'Comic Sans MS', Arial, sans-serif" },
    { id: 'lora', name: 'Lora', kind: 'Book serif', family: 'Lora', bold: 700, light: 400, mul: 1.02, files: ['lora-latin-wght-normal.woff2', 'lora-latin-ext-wght-normal.woff2'], var: '400 700', stack: "Lora, Georgia, 'Times New Roman', serif" },
    { id: 'playfair', name: 'Playfair Display', kind: 'Elegant serif', family: 'Playfair Display', bold: 700, light: 400, mul: 1.06, files: ['playfair-display-latin-wght-normal.woff2', 'playfair-display-latin-ext-wght-normal.woff2'], var: '400 900', stack: "'Playfair Display', Georgia, serif" },
    { id: 'dmserif', name: 'DM Serif Display', kind: 'Classic display', family: 'DM Serif Display', bold: 400, light: 400, mul: 0.98, files: ['dm-serif-display-latin-400-normal.woff2', 'dm-serif-display-latin-ext-400-normal.woff2'], var: '400', stack: "'DM Serif Display', Georgia, serif" },
    { id: 'garamond', name: 'EB Garamond', kind: 'Old-style serif', family: 'EB Garamond', bold: 700, light: 500, mul: 0.92, files: ['eb-garamond-latin-wght-normal.woff2', 'eb-garamond-latin-ext-wght-normal.woff2'], var: '400 800', stack: "'EB Garamond', Garamond, Georgia, serif" },
    { id: 'cinzel', name: 'Cinzel', kind: 'Roman capitals', family: 'Cinzel', bold: 700, light: 500, mul: 1.3, files: ['cinzel-latin-wght-normal.woff2', 'cinzel-latin-ext-wght-normal.woff2'], var: '400 900', stack: "Cinzel, 'Trajan Pro', Georgia, serif", capsOnly: true },
    { id: 'caveat', name: 'Caveat', kind: 'Handwriting', family: 'Caveat', bold: 700, light: 500, mul: 0.78, files: ['caveat-latin-wght-normal.woff2', 'caveat-latin-ext-wght-normal.woff2'], var: '400 700', stack: "Caveat, 'Segoe Script', cursive" },
    { id: 'pacifico', name: 'Pacifico', kind: 'Retro script', family: 'Pacifico', bold: 400, light: 400, mul: 1.12, files: ['pacifico-latin-400-normal.woff2', 'pacifico-latin-ext-400-normal.woff2'], var: '400', stack: "Pacifico, 'Brush Script MT', cursive" },
    { id: 'amatic', name: 'Amatic SC', kind: 'Chalk lettering', family: 'Amatic SC', bold: 700, light: 700, mul: 0.62, files: ['amatic-sc-latin-700-normal.woff2', 'amatic-sc-latin-ext-700-normal.woff2'], var: '700', stack: "'Amatic SC', Caveat, cursive" },
    { id: 'marker', name: 'Permanent Marker', kind: 'Felt-tip marker (no č š ž)', family: 'Permanent Marker', bold: 400, light: 400, mul: 1.05, files: ['permanent-marker-latin-400-normal.woff2'], var: '400', stack: "'Permanent Marker', 'Marker Felt', cursive" },
    { id: 'typewriter', name: 'Special Elite', kind: 'Typewriter', family: 'Special Elite', bold: 400, light: 400, mul: 1.08, files: ['special-elite-latin-400-normal.woff2', 'special-elite-latin-ext-400-normal.woff2'], var: '400', stack: "'Special Elite', 'Courier New', monospace" },
    { id: 'mono', name: 'JetBrains Mono', kind: 'Monospace', family: 'JetBrains Mono', bold: 700, light: 400, mul: 1.13, files: ['jetbrains-mono-latin-wght-normal.woff2', 'jetbrains-mono-latin-ext-wght-normal.woff2'], var: '100 800', stack: "'JetBrains Mono', Menlo, Consolas, monospace" },
  ];
  const fontById = (id) => FONT_LIST.find((f) => f.id === id) || FONT_LIST[0];

  /* ───────────── themes ───────────── */
  // border: none|solid|thick|double|dashed|dotted|perforated  ·  band: false|top|bottom|left  ·  pattern: null|dots|stripes|gingham|lines
  const T = (id, name, bg, fg, accent, font, extra = {}) => ({ id, name, bg, fg, accent, font, border: 'solid', band: false, pattern: null, pcolor: accent, case: 'asis', ...extra });
  const THEMES = [
    T('classic', 'Classic', '#fffdf7', '#2b2118', '#8a5a2b', 'lora', { border: 'double' }),
    T('modern', 'Modern', '#ffffff', '#16202b', '#2a7de1', 'inter', { border: 'none', band: 'top' }),
    T('chalk', 'Chalkboard', '#22272b', '#f5f2ea', '#e8c36a', 'oswald', { case: 'upper' }),
    T('kraft', 'Kraft', '#d8b98c', '#3a2a18', '#6e4a24', 'typewriter', { case: 'upper' }),
    T('minimal', 'Minimal', '#ffffff', '#111111', '#111111', 'inter', { border: 'none' }),
    T('garden', 'Garden', '#f4f8ec', '#25391f', '#5b8f3a', 'lora', { band: 'bottom' }),
    T('bold', 'Bold', '#ffd84a', '#111111', '#111111', 'bebas', { border: 'thick', case: 'upper' }),
    T('apothecary', 'Apothecary', '#f3ecd8', '#3b1f1f', '#6b1f1f', 'cinzel', { border: 'double', case: 'upper' }),
    T('vintage', 'Vintage blue', '#e4eff5', '#17324a', '#2f5d86', 'dmserif', { border: 'dotted' }),
    T('pastel', 'Pastel pink', '#ffe6ec', '#5a2433', '#e0577f', 'fredoka', { border: 'solid' }),
    T('mint', 'Mint', '#e0f5ea', '#17392b', '#2f9e77', 'fredoka', { border: 'dashed' }),
    T('gingham', 'Gingham', '#ffffff', '#3a1010', '#c8323c', 'lora', { pattern: 'gingham', pcolor: '#c8323c' }),
    T('stripes', 'Stripes', '#ffffff', '#102a43', '#1f4e79', 'bebas', { pattern: 'stripes', pcolor: '#1f4e79', case: 'upper', border: 'thick' }),
    T('polka', 'Polka dots', '#fff6e0', '#4a2a10', '#e08a1e', 'pacifico', { pattern: 'dots', pcolor: '#f3c77a', border: 'none' }),
    T('terracotta', 'Terracotta', '#c8693f', '#fff3e4', '#fff3e4', 'playfair', { border: 'perforated' }),
    T('ocean', 'Ocean', '#0f3b5f', '#eaf6ff', '#7cc4ee', 'oswald', { band: 'bottom', border: 'none', case: 'upper' }),
    T('gold', 'Black & gold', '#141414', '#e9cf8a', '#c9a24a', 'cinzel', { border: 'double', case: 'upper' }),
    T('scandi', 'Scandi', '#f7f5f0', '#2a2a2a', '#9aa0a6', 'inter', { border: 'none', band: 'bottom', case: 'lower' }),
    T('stamp', 'Stamp', '#fbf3df', '#7a1f1f', '#7a1f1f', 'typewriter', { border: 'perforated', case: 'upper' }),
    T('notebook', 'Notebook', '#fffbea', '#1b2a49', '#3b6fd4', 'caveat', { pattern: 'lines', pcolor: '#bcd0f2', border: 'none' }),
    T('marker', 'Marker', '#ffffff', '#151515', '#e8453c', 'marker', { border: 'dashed' }),
    T('chalkdoodle', 'Chalk doodle', '#2c3e36', '#f6f6ee', '#bfe3c8', 'amatic', { border: 'dashed', case: 'upper' }),
  ];
  const themeById = (id) => THEMES.find((t) => t.id === id) || THEMES[0];
  /** Black-and-white version of a theme: white paper and black ink (dark themes are inverted), so it prints without colour ink. */
  const monoTheme = (t) => ({ ...t, bg: '#ffffff', fg: '#000000', accent: '#000000', pcolor: '#6b6b6b' });
  const ACCENTS = ['#8a5a2b', '#2a7de1', '#d9466f', '#5b8f3a', '#e08a1e', '#7a4fc0', '#1fa08a', '#444444'];
  const SHAPES = [['sheet', 'Sheet default'], ['rect', 'Rounded rectangle'], ['pill', 'Pill'], ['square', 'Square'], ['circle', 'Circle'], ['oval', 'Oval']];
  const CASES = [['theme', 'Theme default'], ['asis', 'As typed'], ['upper', 'CAPITALS'], ['lower', 'lowercase'], ['title', 'Title Case']];

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

  /* ───────────── text measurement ───────────── */
  // Without a real font to measure we estimate from a Helvetica-like width table (per 1000 em).
  const W = {};
  const set = (chars, w) => { for (const c of chars) W[c] = w; };
  set(' ', 278); set('abdeghnopqu', 556); set('c', 500); set('ksvxyz', 500); set('fjt', 278); set('il', 222); set('m', 833); set('r', 333); set('w', 722);
  set('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 690); set('IJ', 300); set('M', 830); set('W', 944); set('FEL', 600); set('GOQ', 778); set('0123456789', 556); set('.,:;\'’!|', 260); set('-–—', 333); set('&', 667); set('/()', 300); set('_', 556);
  set('čćšžđ', 500); set('ČĆŠŽĐ', 690); set('äöüéèêàáíóúñç', 556); set('ÄÖÜÉ', 700);
  let measurer = null;
  /** Install a function (str, fontId, bold) → width in em, backed by a real canvas. Pass null to go back to estimates. */
  function setMeasurer(fn) { measurer = fn; }
  /** Apply a case mode: asis | upper | lower | title. */
  function applyCase(text, mode) {
    if (mode === 'upper') return text.toLocaleUpperCase(); if (mode === 'lower') return text.toLocaleLowerCase();
    if (mode === 'title') return text.toLocaleLowerCase().replace(/(^|[\s\-/(])(\p{L})/gu, (m, a, b) => a + b.toLocaleUpperCase());
    return text;
  }
  /** Width of a string in em. opts: font id, bold, spacing (em per character). */
  function textWidth(str, { font = 'inter', bold = true, spacing = 0 } = {}) {
    const f = fontById(font); let w = null;
    if (measurer) { try { w = measurer(str, f.id, bold); } catch (e) { w = null; } }
    if (typeof w !== 'number' || !isFinite(w)) { w = 0; for (const ch of str) w += W[ch] !== undefined ? W[ch] : (ch.charCodeAt(0) > 0x2e80 ? 1000 : 600); w = (w / 1000) * f.mul * (bold && f.bold >= 600 ? 1.06 : 1); if (f.capsOnly) w *= 1; }
    return w + spacing * str.length;
  }
  /** Largest font size (mm) so `text` fits maxW on at most maxLines lines and maxH tall. Words are never split. */
  function fitText(text, maxW, maxH, { maxSize = 12, minSize = 2.2, maxLines = 2, bold = true, font = 'inter', spacing = 0, lineHeight = 1.12 } = {}) {
    const words = String(text).trim().split(/\s+/).filter(Boolean), opt = { font, bold, spacing }, safe = 0.97;
    const wrap = (size) => { const lines = []; let cur = ''; for (const w of words) { const t = cur ? cur + ' ' + w : w; if (textWidth(t, opt) * size <= maxW * safe || !cur) cur = t; else { lines.push(cur); cur = w; } } if (cur) lines.push(cur); return lines; };
    for (let size = maxSize; size >= minSize - 1e-9; size -= 0.1) {
      const lines = wrap(size);
      if (lines.length <= maxLines && lines.every((l) => textWidth(l, opt) * size <= maxW * safe + 1e-6) && lines.length * size * lineHeight <= maxH + 1e-6) return { size: Math.round(size * 10) / 10, lines, overflow: false };
    }
    const size = minSize, out = wrap(size).slice(0, maxLines);
    let last = out[out.length - 1] || '';
    const all = wrap(size);
    if (all.length > maxLines || textWidth(last, opt) * size > maxW * safe) { while (last.length > 1 && textWidth(last + '…', opt) * size > maxW * safe) last = last.slice(0, -1); out[out.length - 1] = last + '…'; }
    return { size, lines: out, overflow: true };
  }

  /* ───────────── dates ───────────── */
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const p2 = (n) => String(n).padStart(2, '0');
  /** English/ISO formatting (the app uses Intl for localized month names). fmt: dmy. | dmy/ | mdy/ | iso | long | short | month */
  function formatDate(d, fmt = 'dmy.') {
    const D = d.getDate(), M = d.getMonth(), Y = d.getFullYear();
    switch (fmt) { case 'dmy/': return `${p2(D)}/${p2(M + 1)}/${Y}`; case 'mdy/': return `${p2(M + 1)}/${p2(D)}/${Y}`; case 'iso': return `${Y}-${p2(M + 1)}-${p2(D)}`; case 'long': return `${D} ${MONTHS[M]} ${Y}`; case 'short': return `${D} ${MONTHS[M]}`; case 'month': return `${MONTHS[M]} ${Y}`; default: return `${p2(D)}.${p2(M + 1)}.${Y}`; }
  }
  /** Add days / weeks / months / years without drifting (31 Jan + 1 month = 28/29 Feb). */
  function addTime(d, n, unit = 'days') {
    const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (unit === 'days') r.setDate(r.getDate() + n); else if (unit === 'weeks') r.setDate(r.getDate() + 7 * n);
    else { const day = r.getDate(); r.setDate(1); r.setMonth(r.getMonth() + (unit === 'years' ? 12 * n : n)); const last = new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate(); r.setDate(Math.min(day, last)); }
    return r;
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
  const esc = (x) => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const num = (n) => Math.round(n * 100) / 100;
  const SANS_STACK = "Inter, 'Helvetica Neue', Arial, sans-serif";

  /** The effective shape for a sheet: die-cut sheets keep their own shape, plain paper can be anything. */
  function effectiveShape(sheet, wanted) {
    const own = sheet.shape === 'round' ? 'circle' : 'rect';
    if (!sheet.plain || !wanted || wanted === 'sheet') return own;
    return ['rect', 'pill', 'square', 'circle', 'oval'].includes(wanted) ? wanted : own;
  }
  /** Pattern definitions (once per page); patterns are referenced as url(#ws-pat-<theme>). */
  function patternDefs(theme) {
    const c = theme.pcolor;
    switch (theme.pattern) {
      case 'dots': return `<pattern id="ws-pat-${theme.id}" width="4.2" height="4.2" patternUnits="userSpaceOnUse"><circle cx="1.1" cy="1.1" r="0.55" fill="${c}"/><circle cx="3.2" cy="3.2" r="0.55" fill="${c}"/></pattern>`;
      case 'stripes': return `<pattern id="ws-pat-${theme.id}" width="3.4" height="3.4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="1.1" height="3.4" fill="${c}" fill-opacity="0.16"/></pattern>`;
      case 'gingham': return `<pattern id="ws-pat-${theme.id}" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="2.5" height="5" fill="${c}" fill-opacity="0.16"/><rect width="5" height="2.5" fill="${c}" fill-opacity="0.16"/></pattern>`;
      case 'lines': return `<pattern id="ws-pat-${theme.id}" width="6" height="4.6" patternUnits="userSpaceOnUse"><rect y="3.9" width="6" height="0.35" fill="${c}"/></pattern>`;
      default: return '';
    }
  }
  /** Label outline element for a shape inside a w×h cell (inset shrinks it). `attrs` are appended. */
  function shapeEl(shape, w, h, inset, attrs) {
    const sq = shape === 'square' || shape === 'circle', s = Math.min(w, h), sw = sq ? s : w, sh = sq ? s : h, x = (w - sw) / 2 + inset, y = (h - sh) / 2 + inset, iw = sw - 2 * inset, ih = sh - 2 * inset;
    if (shape === 'circle') return `<circle cx="${num(w / 2)}" cy="${num(h / 2)}" r="${num(Math.max(0.1, iw / 2))}" ${attrs}/>`;
    if (shape === 'oval') return `<ellipse cx="${num(w / 2)}" cy="${num(h / 2)}" rx="${num(Math.max(0.1, iw / 2))}" ry="${num(Math.max(0.1, ih / 2))}" ${attrs}/>`;
    const r = shape === 'pill' ? ih / 2 : Math.max(0.3, Math.min(shape === 'square' ? 3.2 : 2.2, Math.min(sw, sh) * 0.1) - inset * 0.5);
    return `<rect x="${num(x)}" y="${num(y)}" width="${num(iw)}" height="${num(ih)}" rx="${num(r)}" ${attrs}/>`;
  }
  const dashFor = { dashed: '2.4 1.5', dotted: '0.05 1.35', perforated: '0.05 2' };

  /**
   * One label as an SVG fragment in a w×h mm cell at the origin.
   * opts: { accent, shape: rect|pill|square|circle|oval, font, sizeScale, caseMode, icons, dateScale (0.5–2.5), dateBold, dates:[{type:'text',text}|{type:'write',label}], uid }
   * Returns the markup; its <clipPath> keeps everything inside the label no matter what.
   */
  function labelSvg(label, w, h, theme, opts = {}) {
    const t0 = typeof theme === 'string' ? themeById(theme) : theme, t = opts.mono ? monoTheme(t0) : t0, accent = opts.mono ? '#000000' : (opts.accent || t.accent), shape = opts.shape || 'rect';
    const f = fontById(opts.font || t.font), caseMode = !opts.caseMode || opts.caseMode === 'theme' ? t.case : opts.caseMode, uid = opts.uid === undefined ? 0 : opts.uid;
    const round = shape === 'circle' || shape === 'oval', sizeScale = opts.sizeScale || 1;
    const spacing = caseMode === 'upper' ? 0.04 : 0, fam = esc(f.stack), out = [];
    const cell = Math.min(w, h), sw = shape === 'square' || shape === 'circle' ? cell : w, sh = shape === 'square' || shape === 'circle' ? cell : h, sx = (w - sw) / 2, sy = (h - sh) / 2;
    out.push(`<clipPath id="ws-c${uid}">${shapeEl(shape, w, h, 0, '')}</clipPath>`);
    out.push(`<g clip-path="url(#ws-c${uid})">`);
    out.push(shapeEl(shape, w, h, 0, `fill="${t.bg}"`));
    if (t.pattern) out.push(shapeEl(shape, w, h, 0, `fill="url(#ws-pat-${t.id})"`));
    // colour band
    let bT = 0, bB = 0, bL = 0;
    if (t.band && !round) {
      const bh = Math.max(1.4, sh * 0.09), bw = Math.max(1.6, sw * 0.06);
      if (t.band === 'top') { out.push(`<rect x="${num(sx)}" y="${num(sy)}" width="${num(sw)}" height="${num(bh)}" fill="${accent}"/>`); bT = bh; }
      else if (t.band === 'bottom') { out.push(`<rect x="${num(sx)}" y="${num(sy + sh - bh)}" width="${num(sw)}" height="${num(bh)}" fill="${accent}"/>`); bB = bh; }
      else { out.push(`<rect x="${num(sx)}" y="${num(sy)}" width="${num(bw)}" height="${num(sh)}" fill="${accent}"/>`); bL = bw; }
    }
    // borders
    const sw1 = cell < 25 ? 0.35 : 0.45, bd = t.border;
    if (bd === 'solid') out.push(shapeEl(shape, w, h, 0.8, `fill="none" stroke="${accent}" stroke-width="${sw1}"`));
    else if (bd === 'thick') out.push(shapeEl(shape, w, h, 0.9, `fill="none" stroke="${accent}" stroke-width="${Math.max(0.9, sw1 * 2.4)}"`));
    else if (bd === 'double') { out.push(shapeEl(shape, w, h, 0.8, `fill="none" stroke="${accent}" stroke-width="${sw1}"`)); out.push(shapeEl(shape, w, h, 1.8, `fill="none" stroke="${accent}" stroke-width="0.2"`)); }
    else if (dashFor[bd]) out.push(shapeEl(shape, w, h, 1.1, `fill="none" stroke="${accent}" stroke-width="${bd === 'dashed' ? 0.5 : bd === 'dotted' ? 0.75 : 0.9}" stroke-dasharray="${dashFor[bd]}" stroke-linecap="${bd === 'dashed' ? 'butt' : 'round'}"`));
    // content box
    const bw0 = bd === 'none' ? 0 : 1, pad = Math.min(sw, sh) * 0.08 + 0.9 + bw0;
    let bx, by, bwid, bhgt;
    if (shape === 'circle') { bwid = sw * 0.7; bhgt = sh * 0.62; bx = sx + (sw - bwid) / 2; by = sy + (sh - bhgt) / 2 + sh * 0.02; }
    else if (shape === 'oval') { bwid = sw * 0.72; bhgt = sh * 0.6; bx = sx + (sw - bwid) / 2; by = sy + (sh - bhgt) / 2; }
    else if (shape === 'pill') { const px = sh * 0.34 + 0.8; bx = sx + px; bwid = sw - 2 * px; by = sy + pad * 0.7 + bT; bhgt = sh - pad * 1.4 - bT - bB; }
    else { bx = sx + pad + bL; bwid = sw - 2 * pad - bL; by = sy + pad + bT; bhgt = sh - 2 * pad - bT - bB; }
    // dates (at the bottom)
    const dates = (opts.dates || []).filter(Boolean).slice(0, 2);
    const ds = Math.min(2.5, Math.max(0.5, opts.dateScale || 1)), dBold = !!opts.dateBold;
    let dh = dates.length ? Math.min(bhgt * 0.2 * ds, 3.6 * ds, bhgt * 0.32 / dates.length * (dates.length > 1 ? 1.2 : 1.6)) : 0, showDates = dh >= 1.7 && bhgt >= 11 - (dates.length - 1);
    if (!showDates) dh = 0;
    const dateBlock = showDates ? dh * dates.length + 0.5 : 0;
    const innerH = bhgt - dateBlock;
    const iconId = label.icon || (opts.icons === false ? null : iconFor(label.text));
    const wide = !round && bwid / innerH >= 1.7 && innerH > 8 && shape !== 'square';
    const showIcon = iconId && ICONS[iconId] && opts.icons !== false && Math.min(sw, sh) >= 16 && innerH >= (wide ? 9 : 15);
    let iconSize = showIcon ? (wide ? Math.min(innerH * 0.78, 14) : Math.min(innerH * 0.34, bwid * 0.4, 13)) : 0;
    let tx = bx, ty = by, tw = bwid, th = innerH, cx = bx + bwid / 2;
    if (showIcon && wide) { out.push(iconGroup(iconId, bx + 0.6, by + (innerH - iconSize) / 2, iconSize, accent)); tx = bx + iconSize + 2.6; tw = bx + bwid - tx; cx = tx + tw / 2; }
    else if (showIcon) { out.push(iconGroup(iconId, bx + (bwid - iconSize) / 2, by, iconSize, accent)); ty = by + iconSize + 0.7; th = innerH - iconSize - 0.7; }
    // text
    const text = applyCase(label.text, caseMode), subTxt = label.sub ? applyCase(label.sub, caseMode === 'upper' ? 'asis' : caseMode) : '';
    const subH = subTxt ? Math.min(th * 0.34, 4.4) : 0, mainH = th - subH - (subH ? 0.5 : 0);
    const fit = fitText(text, tw, mainH, { maxSize: Math.min(11.5, mainH * 0.92) * sizeScale, minSize: 2.2, maxLines: mainH > 13 ? 2 : 1, bold: true, font: f.id, spacing });
    const lineH = fit.size * 1.12, blockH = fit.lines.length * lineH + (subH ? subH + 0.5 : 0), startY = ty + (th - blockH) / 2;
    const ls = spacing ? ` letter-spacing="${spacing}em"` : '';
    out.push(`<g font-size="${fit.size}" font-family="${fam}" font-weight="${f.bold}" fill="${t.fg}" text-anchor="middle">${fit.lines.map((l, i) => `<text x="${num(cx)}" y="${num(startY + lineH * (i + 0.8))}"${ls}>${esc(l)}</text>`).join('')}</g>`);
    if (subTxt) { const sf = fitText(subTxt, tw, subH, { maxSize: Math.min(4.4, subH * 0.95), minSize: 1.8, maxLines: 1, bold: false, font: f.id }); out.push(`<text x="${num(cx)}" y="${num(startY + fit.lines.length * lineH + 0.5 + sf.size * 0.82)}" font-size="${sf.size}" font-family="${fam}" font-weight="${f.light}" fill="${t.fg}" fill-opacity="0.75" text-anchor="middle">${esc(sf.lines[0] || '')}</text>`); }
    // date lines
    if (showDates) {
      const dsize = Math.min(dh * 0.86, 3.4 * ds), dW = dBold ? f.bold : f.light, dArea = showIcon && wide ? tw : bwid, dLeft = showIcon && wide ? tx : bx, dx0 = dLeft + dArea * 0.03, dwid = dArea * 0.94;
      dates.forEach((d, i) => {
        const base = by + innerH + 0.5 + dh * i + dsize * 0.86;
        if (d.type === 'write') {
          const lab = applyCase(d.label || 'Date', caseMode === 'upper' ? 'asis' : caseMode), lw = textWidth(lab, { font: f.id, bold: dBold }) * dsize + 0.8;
          const lx = dx0, ex = dx0 + dwid; if (lw + 6 < dwid) { out.push(`<text x="${num(lx)}" y="${num(base)}" font-size="${num(dsize)}" font-family="${fam}" font-weight="${dW}" fill="${t.fg}" fill-opacity="${dBold ? 1 : 0.8}">${esc(lab)}</text><line x1="${num(lx + lw)}" y1="${num(base + 0.25)}" x2="${num(ex)}" y2="${num(base + 0.25)}" stroke="${t.fg}" stroke-opacity="0.55" stroke-width="0.25"/>`); }
          else out.push(`<line x1="${num(lx)}" y1="${num(base + 0.25)}" x2="${num(ex)}" y2="${num(base + 0.25)}" stroke="${t.fg}" stroke-opacity="0.55" stroke-width="0.25"/>`);
        } else {
          const df = fitText(d.text || '', dwid, dh, { maxSize: dsize, minSize: 1.6, maxLines: 1, bold: dBold, font: f.id });
          out.push(`<text x="${num(cx)}" y="${num(base)}" font-size="${df.size}" font-family="${fam}" font-weight="${dW}" fill="${t.fg}" fill-opacity="${dBold ? 1 : 0.82}" text-anchor="middle">${esc(df.lines[0] || '')}</text>`);
        }
      });
    }
    out.push('</g>');
    return out.join('');
  }
  function iconGroup(id, x, y, size, color) {
    const k = size / 24;
    return `<g transform="translate(${num(x)} ${num(y)}) scale(${num(k)})" fill="none" stroke="${color}" stroke-width="${num(Math.max(1.3, 0.55 / k))}" stroke-linecap="round" stroke-linejoin="round"><path d="${ICONS[id]}"/></g>`;
  }

  /**
   * One full page as a standalone SVG sized in mm. `slots` come from layout(); `labels` is the full list.
   * opts: { theme, accent, mono, font, sizeScale, caseMode, shape, dates, offsetX, offsetY, outlines, icons, embed }
   * `embed` is optional extra markup (for example an @font-face <style>) placed at the top.
   */
  function pageSvg(sheet, slots, labels, opts = {}) {
    const [pw, ph] = sheet.page, ox = opts.offsetX || 0, oy = opts.offsetY || 0, theme = opts.mono ? monoTheme(themeById(opts.theme)) : themeById(opts.theme), shape = effectiveShape(sheet, opts.shape);
    const parts = [`<svg xmlns="http://www.w3.org/2000/svg" width="${pw}mm" height="${ph}mm" viewBox="0 0 ${pw} ${ph}" role="img" aria-label="Label sheet">`, `<defs>${patternDefs(theme)}</defs>`, opts.embed || '', `<rect width="${pw}" height="${ph}" fill="#fff"/>`];
    const used = new Set();
    for (const sl of slots) {
      if (sl.index < 0) { if (opts.showEmpty) parts.push(`<g transform="translate(${num(sl.x + ox)} ${num(sl.y + oy)})">${shapeEl(shape, sl.w, sl.h, 0, 'fill="none" stroke="#bbb" stroke-width="0.25" stroke-dasharray="1.5 1.5"')}</g>`); continue; }
      const lab = labels[sl.index], th = lab.theme ? themeById(lab.theme) : theme; used.add(th.id);
      parts.push(`<g transform="translate(${num(sl.x + ox)} ${num(sl.y + oy)})">${labelSvg(lab, sl.w, sl.h, th, { accent: opts.accent, mono: opts.mono, shape, icons: opts.icons, font: opts.font, sizeScale: opts.sizeScale, caseMode: opts.caseMode, dates: opts.dates, dateScale: opts.dateScale, dateBold: opts.dateBold, uid: sl.index })}${opts.outlines ? shapeEl(shape, sl.w, sl.h, 0, 'fill="none" stroke="#8a8a8a" stroke-width="0.2"') : ''}</g>`);
    }
    parts.push('</svg>');
    return parts.join('');
  }

  /** All pages for a label list on a sheet. */
  function render(sheet, labels, opts = {}) {
    const pages = layout(sheet, labels.length, opts.skip || 0);
    return pages.map((slots) => pageSvg(sheet, slots, labels, opts));
  }

  return { VERSION, SHEETS, THEMES, ACCENTS, SHAPES, CASES, FONT_LIST, ICONS, PRESETS, sheetById, customSheet, sheetFits, perSheet, themeById, monoTheme, fontById, effectiveShape, iconFor, setMeasurer, applyCase, textWidth, fitText, formatDate, addTime, parseList, layout, labelSvg, pageSvg, render };
});
