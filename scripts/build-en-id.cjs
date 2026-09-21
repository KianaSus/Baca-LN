// scripts/build-en-id.cjs — bangun jembatan EN→ID Tahap 3 dari kurasi manual.
// Sumber (masuk git, MIT): scripts/en-id-core.json — ditulis manual untuk Kokoro,
// mengikuti prioritas scripts/en-id-todo.json (node scripts/en-gloss-freq.cjs).
// Format sumber: { "english": "indonesia" } — boleh "a; b" untuk dua makna umum.
// Keluaran (KECIL, di-commit): vendor/en-id.json — { en: id } ringkas.
// Dipakai runtime (lookupWord): menerjemahkan gloss Inggris JMdict kata-per-kata
// secara kasar; hasil SELALU dilabeli "~ID (gloss)" di UI (jujur, fallback terakhir).
// Jalan: node scripts/build-en-id.cjs
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function main() {
  const core = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'en-id-core.json'), 'utf8'));
  let todo = [];
  try {
    todo = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'en-id-todo.json'), 'utf8'));
  } catch (e) { /* todo opsional */ }
  const keys = Object.keys(core);
  if (keys.length < 280) {
    console.error(`GAGAL: kurasi hanya ${keys.length} kunci (<280)`);
    process.exit(1);
  }
  const bad = Object.entries(core).filter(([, v]) => typeof v !== 'string' || !v.trim() || v.length > 40);
  if (bad.length) {
    console.error('GAGAL: nilai kosong/terlalu panjang: ' + bad.slice(0, 5).map((x) => x[0]).join(', '));
    process.exit(1);
  }
  // Normalisasi: kunci lower-case, nilai trim.
  const out = {};
  for (const [k, v] of Object.entries(core)) out[k.toLowerCase().trim()] = v.trim();
  const outPath = path.join(ROOT, 'vendor', 'en-id.json');
  fs.writeFileSync(outPath, JSON.stringify(out));
  const kb = (fs.statSync(outPath).size / 1024).toFixed(1);
  const todoKeys = new Set(todo.map((t) => t.en));
  const covered = keys.filter((k) => todoKeys.has(k)).length;
  console.log(`OK ${outPath}: ${keys.length} pasangan (${kb} KB), mencakup ${covered}/${todoKeys.size} kata todo`);
  console.log('SELESAI');
}

main();
