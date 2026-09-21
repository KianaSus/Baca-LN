// scripts/check.cjs — pemeriksaan kualitas cepat untuk CI & kontributor.
// Dipakai: node scripts/check.cjs  (exit 1 bila ada yang gagal)
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let failures = 0;

function ok(name) { console.log('OK   ' + name); }
function fail(name, detail) { failures++; console.log('FAIL ' + name + (detail ? ' — ' + detail : '')); }

// 1. Semua script inline di index.html harus valid secara sintaks (tanpa dieksekusi).
try {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  if (!scripts.length) fail('inline-script', 'tidak ditemukan');
  scripts.forEach((code, i) => {
    try { new Function(code); ok(`inline-script[${i}] sintaks`); }
    catch (e) { fail(`inline-script[${i}] sintaks`, e.message.split('\n')[0]); }
  });

  // 2. Setiap getElementById('x') harus punya id="x" di HTML.
  const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]));
  const used = new Set([...scripts.join('\n').matchAll(/getElementById\('([^']+)'\)/g)].map(m => m[1]));
  const missing = [...used].filter(id => !ids.has(id));
  if (missing.length) fail('getElementById', 'hilang: ' + missing.join(', '));
  else ok('getElementById (' + used.size + ' id)');

  // 3. Jaminan full-offline: tidak ada URL https:// di kode aplikasi.
  const remote = [...html.matchAll(/https:\/\/[^\s"'<>]+/g)].map(m => m[0]);
  const allowed = remote.filter(u => u.includes('github.com') || u.includes('opencode'));
  const blocked = remote.filter(u => !allowed.includes(u));
  if (blocked.length) fail('offline', 'URL remote tersisa: ' + [...new Set(blocked)].slice(0, 5).join(', '));
  else ok('offline (tanpa CDN)');

  // 4. Blok <style> harus seimbang kurawalnya.
  const style = (html.match(/<style>([\s\S]*?)<\/style>/) || [])[1] || '';
  const open = (style.match(/\{/g) || []).length;
  const close = (style.match(/\}/g) || []).length;
  if (open !== close) fail('css-braces', `${open} vs ${close}`);
  else ok('css-braces (' + open + ')');
} catch (e) { fail('index.html', e.message); }

// 5. Semua JSON konfigurasi harus valid.
['package.json', 'manifest.webmanifest', 'capacitor.config.json'].forEach(f => {
  try { JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8')); ok(f); }
  catch (e) { fail(f, e.message.split('\n')[0]); }
});

// 6. Berkas vendor offline wajib ada.
['vendor/tailwind.js', 'vendor/jszip.min.js', 'vendor/lucide.min.js', 'vendor/fonts.css'].forEach(f => {
  if (fs.existsSync(path.join(ROOT, f))) ok(f);
  else fail(f, 'hilang — lihat docs/BUILD.md bagian vendor');
});

// 7. Data belajar N5 (Fase 0/1) harus valid.
['vendor/jlpt-n5.json', 'vendor/id-gloss-n5.json', 'vendor/kana-map.json', 'vendor/kanji-n5.json'].forEach(f => {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
    const n = Array.isArray(data) ? data.length : Object.keys(data).length;
    if (!n) fail(f, 'kosong');
    else ok(`${f} (${n} entri)`);
  } catch (e) { fail(f, e.message.split('\n')[0]); }
});
try {
  const svgDir = path.join(ROOT, 'vendor', 'kanjivg-n5');
  const svgs = fs.readdirSync(svgDir).filter(f => f.endsWith('.svg'));
  if (!svgs.length) fail('vendor/kanjivg-n5', 'tidak ada SVG');
  else ok(`vendor/kanjivg-n5 (${svgs.length} SVG)`);
} catch (e) { fail('vendor/kanjivg-n5', e.message.split('\n')[0]); }

if (failures) { console.log(`\n${failures} pemeriksaan GAGAL`); process.exit(1); }
console.log('\nSemua pemeriksaan lolos.');
