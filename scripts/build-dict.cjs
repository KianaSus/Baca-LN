// scripts/build-dict.cjs — bangun data kamus offline dari sumber EDRDG.
// Keluaran (diabaikan git, dibundel ke dist/ + APK):
//   vendor/jmdict-compact.json    — kata umum JMdict (kanji, kana, pos, gloss EN)
//   vendor/kanjidic-compact.json  — kanji jouyou (arti, on/kun)
// Disalin langsung (sumber, masuk git):
//   scripts/deinflect-rules.json -> vendor/deinflect.json
//   scripts/pos-id.json          -> vendor/pos-id.json
// Jalan: node scripts/build-dict.cjs   (butuh internet sekali saja)
const fs = require('fs');
const path = require('path');
const os = require('os');
const zlib = require('zlib');
const { execFileSync } = require('child_process');
const sax = require('sax');

const ROOT = path.join(__dirname, '..');
const VENDOR = path.join(ROOT, 'vendor');
const TMP = path.join(os.tmpdir(), 'kokoro-dict');

const JMDICT_URL = 'http://ftp.edrdg.org/pub/Nihongo//JMdict.gz';
const KANJIDIC_URL = 'http://www.edrdg.org/kanjidic/kanjidic2.xml.gz';

const PRI_MARKERS = new Set(['news1', 'news2', 'ichi1', 'ichi2', 'spec1', 'spec2', 'gai1']);
const NF_RE = /^nf\d\d$/;

// Nilai pos mentah JMdict -> kode ringkas (lihat scripts/pos-id.json).
function normPos(raw) {
  const t = raw.trim();
  if (/^noun \(common\)/.test(t)) return 'n';
  if (/^noun or participle.*suru/.test(t)) return 'vs';
  if (/^noun/.test(t) || t === 'adverbial noun (fukushi teki youna meishi)') return 'n';
  if (/pronoun/.test(t)) return 'pn';
  if (/pre-noun adjectival/.test(t)) return 'rentai';
  if (/adjectival nouns|quasi-adjectives/.test(t)) return 'adj-na';
  if (/^Na-adjective/.test(t)) return 'adj-na';
  if (/^I-adjective/.test(t)) return 'adj-i';
  if (/Godan verb with '(\w+)' ending/.test(t)) {
    const row = t.match(/'(\w+)' ending/)[1];
    const map = { ku: 'k', gu: 'g', su: 's', tsu: 't', nu: 'n', bu: 'b', mu: 'm', ru: 'r', u: 'u', uru: 'uru' };
    return 'v5' + (map[row] || 'u');
  }
  if (/Godan verb - special class/.test(t)) return 'v5s';
  if (/Ichidan verb/.test(t)) return 'v1';
  if (/^suru verb/.test(t)) return 'vs';
  if (/^kuru verb/.test(t)) return 'vk';
  if (/irregular.*verb/.test(t)) return 'virr';
  if (/intransitive verb/.test(t)) return 'vi';
  if (/transitive verb/.test(t)) return 'vt';
  if (/adverb taking the 'to' particle/.test(t)) return 'adv-to';
  if (/^adverb/.test(t)) return 'adv';
  if (/^particle/.test(t)) return 'prt';
  if (/^expression/.test(t)) return 'exp';
  if (/interjection/.test(t)) return 'int';
  if (/conjunction/.test(t)) return 'conj';
  if (/auxiliary verb/.test(t)) return 'auxv';
  if (/^auxiliary/.test(t)) return 'aux';
  if (/counter/.test(t)) return 'ctr';
  if (/^prefix/.test(t)) return 'pref';
  if (/^suffix/.test(t)) return 'suf';
  if (/numeric/.test(t)) return 'num';
  if (/unclassified/.test(t)) return 'unc';
  return null;
}

function download(url, dest) {
  if (fs.existsSync(dest) && fs.statSync(dest).size > 100000) {
    console.log('pakai cache: ' + path.basename(dest));
    return;
  }
  console.log('unduh: ' + url);
  execFileSync('curl.exe', ['-sL', '--retry', '2', '--max-time', '600', url, '-o', dest], { stdio: 'inherit' });
}

function gunzipToString(gzPath) {
  console.log('dekompresi: ' + path.basename(gzPath));
  return zlib.gunzipSync(fs.readFileSync(gzPath)).toString('utf8');
}

// Ambil peta entitas kustom dari DOCTYPE internal (<!ENTITY xxx "yyy">),
// agar parser SAX tidak tersedak &n; &v5u; dsb.
function buildEntityMap(xmlHead) {
  const map = {};
  const re = /<!ENTITY\s+([\w-]+)\s+"([^"]*)"/g;
  let m;
  while ((m = re.exec(xmlHead)) !== null) {
    if (['amp', 'lt', 'gt', 'quot', 'apos'].includes(m[1])) continue;
    map[m[1]] = m[2];
  }
  return map;
}

function resolveEntities(xml, entityMap) {
  const names = Object.keys(entityMap).sort((a, b) => b.length - a.length);
  let out = xml;
  for (const name of names) {
    out = out.split('&' + name + ';').join(entityMap[name]);
  }
  return out;
}

function buildJMdict(xml) {
  const parser = sax.parser(true, { trim: true, normalize: true });
  const entries = [];
  let entry = null;
  let sense = null;
  let inKEle = false;
  let inREle = false;

  parser.onopentag = (node) => {
    if (node.name === 'entry') entry = { keb: [], reb: [], kePri: false, rePri: false, senses: [] };
    else if (entry && node.name === 'sense') sense = { pos: [], gloss: [] };
    else if (entry && node.name === 'k_ele') inKEle = true;
    else if (entry && node.name === 'r_ele') inREle = true;
    else if (entry && node.name === 'gloss') {
      const lang = node.attributes['xml:lang'] || node.attributes['lang'] || 'en';
      parser._glossEn = (lang === 'en');
    }
  };
  parser.ontext = (t) => {
    if (!entry || !t) return;
    const tag = parser.tag ? parser.tag.name : '';
    if (tag === 'keb' && inKEle && !entry.keb.length) entry.keb.push(t);
    else if (tag === 'reb' && inREle && !entry.reb.length) entry.reb.push(t);
    else if ((tag === 'ke_pri' && inKEle) || (tag === 're_pri' && inREle)) {
      if (PRI_MARKERS.has(t) || NF_RE.test(t)) {
        if (tag === 'ke_pri') entry.kePri = true; else entry.rePri = true;
      }
    } else if (sense && tag === 'pos') {
      const code = normPos(t);
      if (code && !sense.pos.includes(code)) sense.pos.push(code);
    } else if (sense && tag === 'gloss' && parser._glossEn !== false) {
      if (t.length <= 140) sense.gloss.push(t);
    }
  };
  parser.onclosetag = (name) => {
    if (name === 'k_ele') inKEle = false;
    else if (name === 'r_ele') inREle = false;
    else if (name === 'sense' && entry && sense) { entry.senses.push(sense); sense = null; }
    else if (name === 'entry' && entry) {
      if ((entry.kePri || entry.rePri) && (entry.keb.length || entry.reb.length)) {
        const senses = entry.senses.filter(s => s.gloss.length).slice(0, 3);
        if (senses.length) {
          const pos = [...new Set(senses.flatMap(s => s.pos))].slice(0, 4);
          entries.push({
            k: entry.keb[0] || null,
            r: entry.reb[0] || null,
            p: pos.length ? pos : ['unc'],
            g: senses.map(s => s.gloss[0]),
          });
        }
      }
      entry = null;
    }
  };
  parser.onerror = (e) => { throw e; };
  parser.write(xml).close();
  return entries;
}

function buildKanjidic(xml) {
  const parser = sax.parser(true, { trim: true, normalize: true });
  const out = {};
  let ch = null;
  let inGroup = false;
  parser.onopentag = (node) => {
    if (node.name === 'character') ch = { lit: null, grade: false, freq: false, m: [], on: [], kun: [] };
    else if (ch && (node.name === 'reading_meaning_group' || node.name === 'rmgroup')) inGroup = true;
    else if (ch && node.name === 'reading' && inGroup) {
      parser._rtype = node.attributes.r_type || '';
    } else if (ch && node.name === 'meaning' && inGroup) {
      const lang = node.attributes.m_lang || 'en';
      parser._meaningEn = (lang === 'en');
    }
  };
  parser.ontext = (t) => {
    if (!ch || !t) return;
    const tag = parser.tag ? parser.tag.name : '';
    if (tag === 'literal' && !ch.lit) ch.lit = t;
    else if (tag === 'grade') ch.grade = true;
    else if (tag === 'freq') ch.freq = true;
    else if (tag === 'meaning' && inGroup && parser._meaningEn !== false && ch.m.length < 3) ch.m.push(t);
    else if (tag === 'reading' && inGroup) {
      const clean = t.replace(/\./g, '');
      if (parser._rtype === 'ja_on' && ch.on.length < 4) ch.on.push(clean);
      else if (parser._rtype === 'ja_kun' && ch.kun.length < 4) ch.kun.push(clean);
    }
  };
  parser.onclosetag = (name) => {
    if (name === 'reading_meaning_group' || name === 'rmgroup') inGroup = false;
    else if (name === 'character' && ch) {
      if (ch.lit && (ch.grade || ch.freq) && ch.m.length) out[ch.lit] = { m: ch.m, on: ch.on, kun: ch.kun };
      ch = null;
    }
  };
  parser.onerror = (e) => { throw e; };
  parser.write(xml).close();
  return out;
}

function main() {
  fs.mkdirSync(TMP, { recursive: true });
  fs.mkdirSync(VENDOR, { recursive: true });

  // ---- JMdict ----
  const jmGz = path.join(TMP, 'JMdict.gz');
  download(JMDICT_URL, jmGz);
  let jmXml = gunzipToString(jmGz);
  jmXml = resolveEntities(jmXml, buildEntityMap(jmXml.slice(0, 600000)));
  console.log('parse JMdict...');
  const t0 = Date.now();
  const entries = buildJMdict(jmXml);
  console.log(`JMdict: ${entries.length} entri umum (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  jmXml = null;
  const jmPath = path.join(VENDOR, 'jmdict-compact.json');
  fs.writeFileSync(jmPath, JSON.stringify(entries));
  console.log(`tulis ${path.basename(jmPath)} (${(fs.statSync(jmPath).size / 1048576).toFixed(1)} MB)`);

  // ---- KANJIDIC2 ----
  const k2Gz = path.join(TMP, 'kanjidic2.xml.gz');
  download(KANJIDIC_URL, k2Gz);
  let k2Xml = gunzipToString(k2Gz);
  k2Xml = resolveEntities(k2Xml, buildEntityMap(k2Xml.slice(0, 600000)));
  console.log('parse KANJIDIC2...');
  const kanji = buildKanjidic(k2Xml);
  k2Xml = null;
  const k2Path = path.join(VENDOR, 'kanjidic-compact.json');
  fs.writeFileSync(k2Path, JSON.stringify(kanji));
  console.log(`KANJIDIC2: ${Object.keys(kanji).length} kanji -> ${path.basename(k2Path)} (${(fs.statSync(k2Path).size / 1024).toFixed(0)} KB)`);

  // ---- Aturan & label (sumber, masuk git) ----
  fs.copyFileSync(path.join(ROOT, 'scripts', 'deinflect-rules.json'), path.join(VENDOR, 'deinflect.json'));
  fs.copyFileSync(path.join(ROOT, 'scripts', 'pos-id.json'), path.join(VENDOR, 'pos-id.json'));
  console.log('salin deinflect.json + pos-id.json');
  console.log('SELESAI');
}

main();
