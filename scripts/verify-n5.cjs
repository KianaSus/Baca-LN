// scripts/verify-n5.cjs — verifikasi silang data belajar N5 (Fase 0).
// Jalan: node scripts/verify-n5.cjs  (exit 1 bila ada yang gagal)
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const V = (f) => path.join(ROOT, 'vendor', f);
let failures = 0;
const ok = (n) => console.log('OK   ' + n);
const fail = (n, d) => { failures++; console.log('FAIL ' + n + (d ? ' — ' + d : '')); };

const jlpt = JSON.parse(fs.readFileSync(V('jlpt-n5.json'), 'utf8'));
const gloss = JSON.parse(fs.readFileSync(V('id-gloss-n5.json'), 'utf8'));
const kana = JSON.parse(fs.readFileSync(V('kana-map.json'), 'utf8'));
const kanji = JSON.parse(fs.readFileSync(V('kanji-n5.json'), 'utf8'));

// 1. Semua kunci JLPT punya gloss Indonesia + contoh.
const miss = Object.keys(jlpt).filter((k) => !gloss[k] || !gloss[k].id);
if (miss.length) fail('gloss-lengkap', miss.slice(0, 5).join(', ') + (miss.length > 5 ? '…' : ''));
else ok(`gloss-lengkap (${Object.keys(jlpt).length} kunci)`);

const noEx = Object.entries(gloss).filter(([, v]) => !v.ex_ja || !v.ex_id);
if (noEx.length) fail('contoh-kalimat', noEx.length + ' tanpa contoh');
else ok(`contoh-kalimat (${Object.keys(gloss).length})`);

// 2. Kana: unik, romaji terisi, 3 tipe.
const types = [...new Set(kana.map((k) => k.type))];
const badKana = kana.filter((k) => !k.kana || !k.kata || !k.romaji);
const dupKana = kana.length - new Set(kana.map((k) => k.kana)).size;
if (badKana.length || dupKana || kana.length < 100) fail('kana-map', `rusak:${badKana.length} duplikat:${dupKana}`);
else ok(`kana-map (${kana.length}: ${types.join(',')})`);

// 3. Kanji: arti + minimal satu bacaan.
const badKanji = Object.entries(kanji).filter(([, v]) => !v.id || (!(v.on || []).length && !(v.kun || []).length));
if (badKanji.length) fail('kanji-n5', badKanji.map((x) => x[0]).join(''));
else ok(`kanji-n5 (${Object.keys(kanji).length})`);

// 4. SVG placeholder ada untuk tiap kanji + format U+XXXX.
let svgOk = 0;
const svgMiss = [];
for (const ch of Object.keys(kanji)) {
  const cp = ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
  const p = path.join(ROOT, 'vendor', 'kanjivg-n5', 'U' + cp + '.svg');
  if (!fs.existsSync(p)) { svgMiss.push(ch); continue; }
  const svg = fs.readFileSync(p, 'utf8');
  if (svg.includes('<svg') && svg.includes(ch)) svgOk++;
  else svgMiss.push(ch);
}
if (svgMiss.length) fail('kanjivg-svg', svgMiss.join(''));
else ok(`kanjivg-svg (${svgOk})`);

// 5. Budget ukuran: tambahan N5 harus < 1MB.
let bytes = 0;
for (const f of ['jlpt-n5.json', 'id-gloss-n5.json', 'kana-map.json', 'kanji-n5.json']) {
  bytes += fs.statSync(V(f)).size;
}
for (const f of fs.readdirSync(path.join(ROOT, 'vendor', 'kanjivg-n5'))) {
  bytes += fs.statSync(path.join(ROOT, 'vendor', 'kanjivg-n5', f)).size;
}
if (bytes > 1048576) fail('budget-1MB', bytes + ' bytes');
else ok(`budget-1MB (${(bytes / 1024).toFixed(1)} KB)`);

if (failures) { console.log(`\n${failures} pemeriksaan GAGAL`); process.exit(1); }
console.log('\nVerifikasi N5 lolos.');
