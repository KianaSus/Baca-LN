// scripts/build-ja-id.cjs — bangun kamus Jepang→Indonesia offline dari Wikikamus.
// Sumber: id.wiktionary.org, kategori "Kata bahasa Jepang" + subkategori ja:*
//   (crawl API saat build — butuh internet SEKALI; hasil di-commit ke git).
// Keluaran (KECIL, di-commit):
//   vendor/ja-id.json — kunci kata (kanji & kana) -> { id:[definisi...], pos:[...] }
// Lisensi DATA: CC BY-SA (Wikikamus) — lihat docs/ATRIBUSI-DATA.md.
//   Kode skrip ini: MIT. File data tetap CC BY-SA (terpisah dari kode).
// Jalan: node scripts/build-ja-id.cjs
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const VENDOR = path.join(ROOT, 'vendor');
const OUT = path.join(VENDOR, 'ja-id.json');
const UA = 'KokoroLNReader/2.0 (build-script; offline dictionary builder)';
// Cache wikitext mentah agar rebuild ulang tak mengulang crawl (rate-limit).
const CACHE_DIR = path.join(require('os').tmpdir(), 'kokoro-jaid');
const cacheFile = (t) => path.join(CACHE_DIR, Buffer.from(t, 'utf8').toString('base64url') + '.txt');

const CATS = [
  'Kategori:Kata bahasa Jepang',
  'Kategori:ja:Verba',
  'Kategori:ja:Nomina',
  'Kategori:ja:Nomina diri',
  'Kategori:ja:Adjektiva',
  'Kategori:ja:Adverbia',
  'Kategori:ja:Numeralia',
  'Kategori:ja:Konjungsi',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(params, tries = 0) {
  const u = 'https://id.wiktionary.org/w/api.php?' + params + '&format=json&formatversion=2';
  const r = await fetch(u, { headers: { 'User-Agent': UA } });
  const t = await r.text();
  try {
    return JSON.parse(t);
  } catch (e) {
    if (tries >= 4) throw new Error('API non-JSON setelah retry: ' + t.slice(0, 80));
    await sleep(15000);
    return api(params, tries + 1);
  }
}

async function catMembers(cat) {
  const out = [];
  let cont = null;
  for (;;) {
    const j = await api(
      'action=query&list=categorymembers&cmtitle=' + encodeURIComponent(cat) +
      '&cmtype=page&cmlimit=500' + (cont ? '&cmcontinue=' + encodeURIComponent(cont) : '')
    );
    for (const m of ((j.query && j.query.categorymembers) || [])) {
      if (m.ns === 0 && !/^(Indeks|Lampiran|Wikikamus|Kategori|Berkas|Templat):/.test(m.title)) out.push(m.title);
    }
    cont = j.continue && j.continue.cmcontinue;
    await sleep(800);
    if (!cont) break;
  }
  return out;
}

async function fetchTexts(titles) {
  const out = new Map();
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const need = [];
  for (const t of titles) {
    try {
      out.set(t, fs.readFileSync(cacheFile(t), 'utf8'));
    } catch (e) {
      need.push(t);
    }
  }
  console.log(`cache: ${out.size} halaman, unduh: ${need.length} halaman`);
  for (let i = 0; i < need.length; i += 25) {
    const batch = need.slice(i, i + 25);
    const j = await api(
      'action=query&prop=revisions&rvprop=content&rvslots=main&titles=' +
      batch.map(encodeURIComponent).join('|')
    );
    for (const p of ((j.query && j.query.pages) || [])) {
      if (!p.missing && p.revisions && p.revisions[0] && p.revisions[0].slots) {
        const txt = p.revisions[0].slots.main.content;
        out.set(p.title, txt);
        try { fs.writeFileSync(cacheFile(p.title), txt); } catch (e) {}
      }
    }
    process.stdout.write(`\rambil teks ${Math.min(i + 25, need.length)}/${need.length}`);
    await sleep(800);
  }
  process.stdout.write('\n');
  return out;
}

// ---- Parser seksi Bahasa Jepang ----
const POS_MAP = [
  [/ja-vb/i, 'verba'], [/ja-adj/i, 'adjektiva'], [/ja-nou?n/i, 'nomina'],
  [/ja-nm/i, 'nomina'], [/ja-adv/i, 'adverbia'], [/ja-num/i, 'numeralia'],
  [/ja-conj/i, 'konjungsi'], [/ja-pronoun|ja-pn/i, 'pronomina'],
  [/ja-prt|ja-part/i, 'partikel'], [/ja-exp/i, 'ekspresi'], [/ja-int/i, 'interjeksi'],
];
const KANA_RE = /^[\u3040-\u30ffー・]+$/;

function cleanDef(s) {
  let t = String(s);
  t = t.replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, '$2');
  t = t.replace(/\[\[([^\]]+)\]\]/g, '$1');
  t = t.replace(/\{\{[^{}]*\}\}/g, '');
  t = t.replace(/'''?/g, '');
  t = t.replace(/<[^>]*>/g, '');
  t = t.replace(/&[a-z]+;/g, ' ');
  return t.replace(/\s+/g, ' ').trim();
}

function parseJaSection(title, text) {
  const m = text.match(/^==\s*(?:\{\{bahasa\|ja\}\}|Bahasa Jepang)\s*==/m);
  if (!m) return null;
  const rest = text.slice(m.index + m[0].length);
  const end = rest.search(/^==[^=]/m);
  const sec = end === -1 ? rest : rest.slice(0, end);

  const pos = new Set();
  const readings = new Set();
  // Bacaan dari templat pelafalan & POS.
  const pron = sec.match(/\{\{ja-pron\|([^|}]+)/);
  if (pron && KANA_RE.test(pron[1].trim())) readings.add(pron[1].trim());
  for (const tm of sec.matchAll(/\{\{(ja-[a-z0-9-]+)(\|[^}]*)?\}\}/gi)) {
    const name = tm[1];
    for (const [re, label] of POS_MAP) {
      if (re.test(name)) { pos.add(label); break; }
    }
    const params = (tm[2] || '').split('|').map((s) => s.trim()).filter(Boolean);
    const last = params[params.length - 1];
    if (last && KANA_RE.test(last) && !/^(ja|b|下一|上一|一段|五段)/.test(last)) readings.add(last);
    for (const p of params) {
      if (KANA_RE.test(p) && p.length >= 2) readings.add(p);
    }
  }
  // Entri ejaan-alternatif: 【[[KANA#...]]】 + "* [pos] definisi".
  const defs = [];
  const lines = sec.split('\n');
  // Definisi valid harus memuat huruf Latin (artinya bahasa Indonesia/serapan);
  // ini membuang contoh kalimat, rujukan silang kanji/kana, dan varian CJK.
  const validDef = (d) => d && d.length <= 140 && /[a-zA-Z]/.test(d);
  let altReading = null;
  for (const line of lines) {
    const alt = line.match(/【\[\[([^#\]]+)(?:#[^\]]+)?\|?[^\]]*\]\]/);
    if (alt && KANA_RE.test(alt[1].trim())) altReading = alt[1].trim();
    const star = line.match(/^\*\s*\[([^\]]+)\]\s*(.+)$/);
    if (star && altReading && defs.length < 3) {
      const d = cleanDef(star[2]);
      if (validDef(d)) { defs.push(d); readings.add(altReading); }
      continue;
    }
    const h = line.match(/^#(?![#*:])(.*)$/);
    if (h) {
      const d = cleanDef(h[1]);
      if (validDef(d) && defs.length < 3) defs.push(d);
    }
  }
  if (!defs.length) return null;
  return { defs, pos: [...pos], readings: [...readings] };
}

// Daftar uji cakupan (kata tipikal LN + demo Oregairu).
const TEST_WORDS = [
  '思った', '言った', '見ている', '分からない', 'スマートフォン', '文化祭',
  '実行委員会', '比企谷', '雪乃', 'ゆきのん', 'ヒッキー', 'とても', 'やはり',
  '少し', '綺麗', '静か', '片付けられ', '戻っている', '振り返る', '見つめていた',
  'ぼやく', '近づいてくる', '振る舞う', '食べる', 'たべる', '電車', '学校',
  '先生', '今日', '明日', '嬉しい', '楽しい', '難しい', '窓',
];

async function main() {
  fs.mkdirSync(VENDOR, { recursive: true });
  console.log('crawl kategori...');
  const titleSet = new Set();
  for (const c of CATS) {
    const ms = await catMembers(c);
    console.log(`  ${c}: ${ms.length}`);
    ms.forEach((t) => titleSet.add(t));
  }
  const titles = [...titleSet];
  console.log(`unik: ${titles.length} judul`);

  console.log('ambil wikitext...');
  const texts = await fetchTexts(titles);

  const jaId = {};
  let parsed = 0;
  for (const [title, text] of texts) {
    const r = parseJaSection(title, text);
    if (!r) continue;
    parsed++;
    const keys = new Set([title, ...r.readings]);
    for (const k of keys) {
      if (!k) continue;
      if (!jaId[k]) jaId[k] = { id: [], pos: [] };
      for (const d of r.defs) {
        if (!jaId[k].id.includes(d) && jaId[k].id.length < 3) jaId[k].id.push(d);
      }
      for (const p of r.pos) {
        if (!jaId[k].pos.includes(p)) jaId[k].pos.push(p);
      }
    }
  }
  fs.writeFileSync(OUT, JSON.stringify(jaId));
  const kb = (fs.statSync(OUT).size / 1024).toFixed(1);
  console.log(`OK ${OUT}: ${parsed} halaman → ${Object.keys(jaId).length} kunci (${kb} KB)`);

  console.log('cakupan kata uji:');
  let hit = 0;
  for (const w of TEST_WORDS) {
    const ok = !!jaId[w];
    if (ok) hit++;
    console.log(`  ${ok ? '✓' : '✗'} ${w}${ok ? ' → ' + jaId[w].id.slice(0, 2).join(' / ') : ''}`);
  }
  console.log(`hasil: ${hit}/${TEST_WORDS.length}`);
  console.log('SELESAI');
}

main().catch((e) => { console.error('GAGAL: ' + (e && e.message)); process.exit(1); });
