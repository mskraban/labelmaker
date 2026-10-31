<div align="center">

<img src="public/og.jpg" alt="Labelmaker: labels that match your sheets" width="760">

# Labelmaker

**Labels that match your sheets.**<br>
Type a list, pick your label sheet (Avery or plain paper) and print matching labels with icons, at exactly the right size.

[**Try it live →**](https://labelmaker-xi.vercel.app) · [Report an issue](https://github.com/mskraban/labelmaker/issues)

[![CI](https://github.com/mskraban/labelmaker/actions/workflows/ci.yml/badge.svg)](https://github.com/mskraban/labelmaker/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-2a7de1.svg)](LICENSE)
![Dependencies](https://img.shields.io/badge/dependencies-0-7fb069)
![No AI](https://img.shields.io/badge/AI-none-5fa8c4)

</div>

---

<p align="center"><img src="docs/screenshot.png" alt="Labelmaker with a pantry preset on an Avery L7163 sheet" width="820"></p>

## Why

Spice jars, pantry tubs, workshop drawers, freezer bags: everybody wants matching labels and nobody wants to fight a word processor to line text up with a sticker sheet.

- 🏷️ **15 real sheet formats**: Avery L7160–L7165, L7651, US 5160/5163/5164, round 40/50 mm, and plain-paper grids. Or enter your own measurements.
- ⚡ **Seven presets** (spices, pantry, baking, freezer, workshop, garden, craft) or paste your own list.
- 🎨 **Seven themes** with accent colours, and icons chosen from the words (a leaf for herbs, wheat for flour, a snowflake for the freezer).
- 📏 **Exact size.** Output is SVG in millimetres, so it prints at the sheet's true dimensions.
- 🧩 **Partly used sheet?** Start at label #7 and the first six stay blank.
- 🔧 **Print fine-tuning**: shift the grid by tenths of a millimetre until it lines up.
- ✂️ **No sheets? No problem.** Plain-paper layouts print cutting outlines.
- 🔒 **Private and offline.** Nothing is uploaded. No AI, no tracking, no dependencies.

## Run it

```bash
git clone https://github.com/mskraban/labelmaker.git
cd labelmaker
npm run dev        # or open public/index.html with any static server
```

Print at 100% (“Actual size”). In the print dialog choose “Save as PDF” to keep a copy.

## Use the engine in your own project

```js
const L = require('./public/engine.js');
const labels = L.parseList('Flour\n3x Salt | fine\nSoup | Date: ____');
const pages = L.render(L.sheetById('l7160'), labels, { theme: 'classic', skip: 4 });
// pages[0] is a complete SVG string (210 × 297 mm) ready to save or print
```

Other exports: `SHEETS`, `customSheet()`, `layout()`, `fitText()`, `iconFor()`, `THEMES`, `PRESETS`, `ICONS`.

## Sheet data

The measurements follow the manufacturers' templates. If your pack is off by a fraction of a millimetre, use the shift controls, and please open an issue or pull request with the correct numbers. A test checks that every sheet fits its paper.

## Contributing

New sheet formats, themes, icons and presets are the easiest first contributions. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

[MIT](LICENSE). Fonts under the SIL Open Font License, see [NOTICE.md](NOTICE.md). Avery is a trademark of its owner; this project is not affiliated with or endorsed by Avery.

<p align="center"><sub>Same family: <a href="https://github.com/mskraban/cakecalc">Cakecalc</a> · <a href="https://github.com/mskraban/worldscape">Worldscape</a> · <a href="https://github.com/mskraban/seedscape">Seedscape</a></sub></p>
