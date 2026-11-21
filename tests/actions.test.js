// Provjera: svako dugme sa data-act u interfejsu ima svoj slučaj u obradi klikova (app.js).
const fs = require('fs'), path = require('path');
const src = path.join(__dirname, '..', 'src');
const app = fs.readFileSync(path.join(src, 'js', 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(src, 'index.html'), 'utf8');
const acts = new Set([...(app + html).matchAll(/data-act="([a-z0-9-]+)"/g)].map((m) => m[1]));
const cases = new Set([...app.matchAll(/case '([a-z0-9-]+)'/g)].map((m) => m[1]));
const missing = [...acts].filter((a) => !cases.has(a));
if (missing.length) { console.error('Dugmad bez obrade klika:', missing.join(', ')); process.exit(1); }
console.log(`Sva dugmad imaju obradu klika (${acts.size}).`);
