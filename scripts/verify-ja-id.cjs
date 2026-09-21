// scripts/verify-ja-id.cjs — verifikasi kamus Jepang→Indonesia (Wikikamus, CC BY-SA).
// Jalan: node scripts/verify-ja-id.cjs  (exit 1 bila ada yang gagal)
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const V = (f) => path.join(ROOT, 'vendor', f);
let failures = 0;
const ok = (n) => console.log('OK   ' + n);
const fail = (n, d) => { failures++; console.log('FAIL ' + n + (d ? ' — ' + d : '')); };

const jaId = JSON.parse(fs.readFileSync(V('ja-id.json'), 'utf8'));
const keys = Object.keys(jaId);

// 1. Volume minimum: ≥500 kunci (hasil crawl ~779; di bawah itu berarti parser rusak).
if (keys.length < 500) fail('ja-id-volume', keys.length + ' kunci');
else ok(`ja-id-volume (${keys.length} kunci)`);

// 2. Setiap entri: minimal 1 definisi berhuruf Latin, maksimal 3.
const bad = Object.entries(jaId).filter(([, v]) => {
  const ids = v.id || [];
  return !ids.length || ids.length > 3 || ids.some((s) => !/[a-zA-Z]/.test(s) || s.length > 140);
});
if (bad.length) fail('ja-id-bersih', bad.length + ' entri kotor, cth: ' + bad.slice(0, 3).map((x) => x[0]).join(', '));
else ok('ja-id-bersih (definisi berhuruf Latin, ≤140 char, ≤3/entri)');

// 3. Spot-check entri kunci (hasil kurasi Wikikamus, bukan tebakan).
const spot = { '食べる': 'makan', '電車': 'kereta', '学校': 'sekolah', '今日': 'hari ini' };
const miss = Object.entries(spot).filter(([k, want]) => {
  const v = jaId[k];
  return !v || !v.id.some((s) => s.toLowerCase().includes(want));
});
if (miss.length) fail('ja-id-spot', miss.map((x) => x[0]).join(', '));
else ok('ja-id-spot (食べる/電車/学校/今日 benar)');

// 4. Budget: ja-id.json harus < 1MB.
const bytes = fs.statSync(V('ja-id.json')).size;
if (bytes > 1048576) fail('budget-ja-id', bytes + ' bytes');
else ok(`budget-ja-id (${(bytes / 1024).toFixed(1)} KB)`);

if (failures) { console.log(`\n${failures} pemeriksaan GAGAL`); process.exit(1); }
console.log('\nVerifikasi JA-ID lolos.');
