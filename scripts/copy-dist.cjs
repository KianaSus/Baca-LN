// scripts/copy-dist.cjs — salin aset web bersih ke dist/ untuk Capacitor webDir.
// Dijalankan via: node scripts/copy-dist.cjs
// Hanya file yang didaftar di ALLOW yang ikut ke APK (node_modules, backup, config tidak ikut).
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const FILES = [
  'index.html',
  'manifest.webmanifest',
  'sw.js',
];

const DIRS = [
  'icons',
  'vendor',
];

// Salinan file Satuan dengan nama beda (sumber -> tujuan di dist/).
const EXTRA = [
  { src: 'scripts/dict-worker.cjs', dest: 'dict-worker.js' },
];

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else copyFile(s, d);
  }
}

rmrf(DIST);
fs.mkdirSync(DIST, { recursive: true });

for (const f of FILES) {
  const src = path.join(ROOT, f);
  if (!fs.existsSync(src)) throw new Error('Hilang: ' + f);
  copyFile(src, path.join(DIST, f));
}
for (const d of DIRS) {
  const src = path.join(ROOT, d);
  if (!fs.existsSync(src)) throw new Error('Hilang: ' + d);
  copyDir(src, path.join(DIST, d));
}
for (const e of EXTRA) {
  const src = path.join(ROOT, e.src);
  if (!fs.existsSync(src)) throw new Error('Hilang: ' + e.src);
  copyFile(src, path.join(DIST, e.dest));
}

console.log('dist/ OK');
