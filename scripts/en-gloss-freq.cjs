// scripts/en-gloss-freq.cjs — hitung kata Inggris tersering di gloss JMdict-full.
// Dipakai Tahap 3 (jembatan EN→ID): memilih ±300 kata isi prioritas kurasi.
// Keluaran (sumber, masuk git): scripts/en-id-todo.json
//   [{ en, n, skip }] — skip:true untuk kata fungsi (of/to/the/...) yang TIDAK
//   diterjemahkan kata-per-kata (ditangani cerdas di runtime).
// Jalan: node scripts/en-gloss-freq.cjs [--top N, default 300]
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TOP = parseInt((process.argv[2] || '').replace('--top', '').trim(), 10) || 300;

// Kata fungsi Inggris: jangan diterjemahkan literal (dibuang/dirapikan runtime).
const STOP = new Set([
  'of', 'to', 'a', 'the', 'in', 'and', 'for', 'or', 'with', 'on', 'by', 'an',
  'from', 'at', 'as', 'is', 'are', 'be', 'was', 'were', 'been', 'being', 'it',
  'its', 'that', 'this', 'these', 'those', 'which', 'who', 'whom', 'what',
  'one', 'ones', "one's", 'etc', 'esp', 'e', 'g', 'i', 'eg', 'ie', 'cf',
  'up', 'out', 'off', 'over', 'under', 'into', 'onto', 'than', 'then', 'so',
  'such', 'no', 'not', 'nor', 'but', 'if', 'when', 'while', 'after', 'before',
  'between', 'through', 'during', 'about', 'against', 'among', 'per', 'via',
  's', 't', 'd', 'll', 're', 've', 'm', 'o', 'usu', 'sth', 'sb', 'esp',
]);

function main() {
  const j = JSON.parse(fs.readFileSync(path.join(ROOT, 'vendor', 'jmdict-full.json'), 'utf8'));
  const freq = new Map();
  for (const e of j) {
    for (const g of (e.g || [])) {
      for (const w of String(g).toLowerCase().match(/[a-z][a-z'-]*/g) || []) {
        freq.set(w, (freq.get(w) || 0) + 1);
      }
    }
  }
  const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);
  // Ambil kata isi teratas (lewati stopwords) sebanyak TOP.
  const todo = [];
  for (const [en, n] of sorted) {
    if (STOP.has(en)) continue;
    // Buang token sisa kontraksi/penanda (one's, -like, 's).
    if (/^['-]|['-]$/.test(en) || en.length < 2) continue;
    todo.push({ en, n });
    if (todo.length >= TOP) break;
  }
  const outPath = path.join(ROOT, 'scripts', 'en-id-todo.json');
  fs.writeFileSync(outPath, JSON.stringify(todo, null, 1));
  let covered = 0;
  for (const t of todo) covered += t.n;
  let total = 0;
  for (const [, n] of sorted) total += n;
  console.log(`OK ${todo.length} kata isi → scripts/en-id-todo.json`);
  console.log(`cakupan token gloss: ${(covered / total * 100).toFixed(1)}% (dari ${sorted.length} kata unik)`);
  console.log('contoh:', todo.slice(0, 15).map((t) => `${t.en}(${t.n})`).join(', '));
  console.log('SELESAI — isi kolom arti di scripts/en-id-core.json mengikuti daftar ini');
}

main();
