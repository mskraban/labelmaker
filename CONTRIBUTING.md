# Contributing to Labelmaker

Thanks for helping! Labelmaker is small on purpose: one dependency-free engine (`public/engine.js`) and one page (`public/index.html`).

```bash
git clone https://github.com/mskraban/labelmaker.git
cd labelmaker
npm install
npm test
npm run dev      # http://localhost:3000
```

## Good first contributions

- More sheet formats (add them to `SHEETS` in `public/engine.js`; the tests check that they fit the page).
- More themes and icons (24×24 stroke paths).
- More presets: school supplies, medicine cabinet, baby gear, shop stock rooms.
- Translations.

## Rules

- A new sheet must match the manufacturer's template; say where you got the numbers.
- Keep it dependency-free and offline-first.
- Run `npm test` before opening a pull request; CI runs it too.
- Include a screenshot of what changed.

## Code of conduct

Be kind and assume good intent. Harassment and personal attacks are not tolerated.
