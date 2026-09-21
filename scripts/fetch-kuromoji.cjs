// scripts/fetch-kuromoji.cjs — unduh kuromoji.js + kamus biner ipadic.
// Keluaran (diabaikan git, dibundel ke dist/ + APK):
//   vendor/kuromoji.min.js  vendor/kuromoji-dict/*.dat.gz  (±18 MB)
// Jalan: node scripts/fetch-kuromoji.cjs   (butuh internet sekali saja)
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const VENDOR = path.join(ROOT, 'vendor');
const DICT_DIR = path.join(VENDOR, 'kuromoji-dict');
const VER = '0.1.2';
const BASE = `https://cdn.jsdelivr.net/npm/kuromoji@${VER}`;

const DICT_FILES = [
  'base.dat.gz', 'cc.dat.gz', 'check.dat.gz', 'tid.dat.gz',
  'tid_map.dat.gz', 'tid_pos.dat.gz', 'unk.dat.gz', 'unk_char.dat.gz',
  'unk_compat.dat.gz', 'unk_invoke.dat.gz', 'unk_map.dat.gz', 'unk_pos.dat.gz',
];

function fetch(url, dest, minBytes) {
  if (fs.existsSync(dest) && fs.statSync(dest).size >= (minBytes || 1000)) {
    console.log('pakai cache: ' + path.basename(dest));
    return;
  }
  console.log('unduh: ' + path.basename(dest));
  execFileSync('curl.exe', ['-sL', '--retry', '2', '--max-time', '300', url, '-o', dest], { stdio: 'inherit' });
  if (!fs.existsSync(dest) || fs.statSync(dest).size < (minBytes || 1000)) {
    throw new Error('Unduhan gagal/tidak valid: ' + dest);
  }
}

fs.mkdirSync(DICT_DIR, { recursive: true });
fetch(`${BASE}/build/kuromoji.js`, path.join(VENDOR, 'kuromoji.min.js'), 200000);
for (const f of DICT_FILES) {
  fetch(`${BASE}/dict/${f}`, path.join(DICT_DIR, f), 200);
}
const total = DICT_FILES.reduce((s, f) => s + fs.statSync(path.join(DICT_DIR, f)).size, 0);
console.log(`SELESAI — dict ${(total / 1048576).toFixed(1)} MB (${DICT_FILES.length} berkas)`);
