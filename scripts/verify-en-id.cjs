// scripts/verify-en-id.cjs — verifikasi jembatan EN→ID Tahap 3 (kurasi MIT).
// Jalan: node scripts/verify-en-id.cjs  (exit 1 bila ada yang gagal)
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const V = (f) => path.join(ROOT, 'vendor', f);
let failures = 0;
const ok = (n) => console.log('OK   ' + n);
const fail = (n, d) => { failures++; console.log('FAIL ' + n + (d ? ' — ' + d : '')); };

const enId = JSON.parse(fs.readFileSync(V('en-id.json'), 'utf8'));
const keys = Object.keys(enId);

// 1. Volume minimum: ≥280 pasangan.
if (keys.length < 280) fail('en-id-volume', keys.length + ' pasangan');
else ok(`en-id-volume (${keys.length} pasangan)`);

// 2. Spot-check kata paling sering di gloss.
const spot = { school: 'sekolah', person: 'orang', time: 'waktu', water: 'air', book: 'buku' };
const miss = Object.entries(spot).filter(([k, want]) => enId[k] !== want);
if (miss.length) fail('en-id-spot', miss.map((x) => x[0]).join(', '));
else ok('en-id-spot (school/person/time/water/book benar)');

// 3. Simulasi bridge: gloss khas JMdict harus menghasilkan ≥1 kata Indonesia.
function bridge(gloss) {
  const words = String(gloss).toLowerCase().match(/[a-z][a-z'-]*/g) || [];
  return words.map((w) => enId[w] || w).join(' ');
}
const sim = [
  ['school festival', 'sekolah'],
  ['to grumble', 'grumble'],
  ['tunnel', 'tunnel'],
];
const simFail = sim.filter(([g, want]) => !bridge(g).includes(want));
if (simFail.length) fail('en-id-bridge-sim', simFail.map((x) => x[0]).join(', '));
else ok('en-id-bridge-sim (kata terpetakan, tak dikenal dipertahankan)');

// 4. Budget: en-id.json harus < 100KB.
const bytes = fs.statSync(V('en-id.json')).size;
if (bytes > 102400) fail('budget-en-id', bytes + ' bytes');
else ok(`budget-en-id (${(bytes / 1024).toFixed(1)} KB)`);

if (failures) { console.log(`\n${failures} pemeriksaan GAGAL`); process.exit(1); }
console.log('\nVerifikasi EN-ID lolos.');
