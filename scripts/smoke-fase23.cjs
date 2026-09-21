// scripts/smoke-fase23.cjs — smoke test logika Fase 2+3 tanpa browser.
// Mengeksekusi inline <script> index.html di sandbox VM dengan stub DOM
// minimal, lalu menguji fungsi murni: extractSentence, SRS, cache, literal.
// Jalan: node scripts/smoke-fase23.cjs  (exit 1 bila ada yang gagal)
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const code = scripts.join('\n;\n');

let failures = 0;
const results = [];
function assert(name, cond, extra) {
  results.push((cond ? 'OK   ' : 'FAIL ') + name + (extra && !cond ? ' — ' + extra : ''));
  if (!cond) failures++;
}

// ---- Stub DOM minimal ----
function fakeEl(tag) {
  const t = {
    tagName: String(tag || 'div').toUpperCase(),
    children: [],
    dataset: {},
    style: { setProperty() {}, removeProperty() {} },
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    value: '', textContent: '', disabled: false, checked: false, src: '', alt: '', title: '',
    addEventListener() {}, removeEventListener() {},
    appendChild(c) { t.children.push(c); return c; },
    removeChild(c) { return c; },
    replaceWith() {}, remove() {},
    querySelector() { return fakeEl(); },
    querySelectorAll() { return []; },
    getBoundingClientRect() { return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }; },
    getClientRects() { return []; },
    setPointerCapture() {}, releasePointerCapture() {},
    scrollIntoView() {}, scrollTo() {}, scrollBy() {},
    focus() {}, select() {}, click() {},
    closest() { return null; },
    scrollLeft: 0, scrollTop: 0, scrollWidth: 0, scrollHeight: 0, clientWidth: 0, clientHeight: 0,
    offsetWidth: 0, offsetHeight: 0,
    parentElement: null, parentNode: null, childNodes: [], nodeValue: null,
  };
  return new Proxy(t, {
    get(o, p) { return p in o ? o[p] : undefined; },
    set(o, p, v) {
      o[p] = v;
      if (p === 'innerHTML') o.textContent = String(v).replace(/<[^>]*>/g, '');
      return true;
    },
  });
}

const lsStore = {};
const sandbox = {
  console,
  setTimeout, clearTimeout, setInterval, clearInterval,
  requestAnimationFrame: () => 0,
  addEventListener() {}, removeEventListener() {},
  process,
  URL, Blob,
  AbortController,
  document: {
    getElementById: () => fakeEl(),
    createElement: (tag) => fakeEl(tag),
    createTextNode: (t) => ({ nodeValue: t }),
    createRange: () => fakeEl('range'),
    createTreeWalker: () => ({ nextNode: () => null }),
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener() {},
    body: fakeEl('body'),
    documentElement: fakeEl('html'),
    activeElement: { tagName: 'BODY' },
    fonts: undefined,
    hidden: false, visibilityState: 'visible',
  },
  window: {},
  navigator: {},
  location: { protocol: 'http:' },
  localStorage: {
    getItem: (k) => (k in lsStore ? lsStore[k] : null),
    setItem: (k, v) => { lsStore[k] = String(v); },
    removeItem: (k) => { delete lsStore[k]; },
  },
  lucide: { createIcons() {} },
  tailwind: {},
  // Stub wanakana minimal (cukup untuk kata uji: たべる, ごはんを食べる).
  // Aplikasi asli memakai vendor/wanakana.min.js yang lengkap.
  wanakana: {
    toHiragana: (s) => String(s).replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60)),
    toKatakana: (s) => String(s).replace(/[ぁ-ん]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60)),
    toRomaji: (s) => {
      const m = { あ: 'a', い: 'i', う: 'u', え: 'e', お: 'o', か: 'ka', き: 'ki', く: 'ku', け: 'ke', こ: 'ko', さ: 'sa', し: 'shi', す: 'su', せ: 'se', そ: 'so', た: 'ta', ち: 'chi', つ: 'tsu', て: 'te', と: 'to', な: 'na', に: 'ni', ぬ: 'nu', ね: 'ne', の: 'no', は: 'ha', ひ: 'hi', ふ: 'fu', へ: 'he', ほ: 'ho', ま: 'ma', み: 'mi', む: 'mu', め: 'me', も: 'mo', や: 'ya', ゆ: 'yu', よ: 'yo', ら: 'ra', り: 'ri', る: 'ru', れ: 're', ろ: 'ro', わ: 'wa', を: 'wo', ん: 'n', が: 'ga', ぎ: 'gi', ぐ: 'gu', げ: 'ge', ご: 'go', ざ: 'za', じ: 'ji', ず: 'zu', ぜ: 'ze', ぞ: 'zo', だ: 'da', ぢ: 'ji', づ: 'zu', で: 'de', ど: 'do', ば: 'ba', び: 'bi', ぶ: 'bu', べ: 'be', ぼ: 'bo', ぱ: 'pa', ぴ: 'pi', ぷ: 'pu', ぺ: 'pe', ぽ: 'po', きゃ: 'kya', きゅ: 'kyu', きょ: 'kyo', しゃ: 'sha', しゅ: 'shu', しょ: 'sho', ちゃ: 'cha', ちゅ: 'chu', ちょ: 'cho', じゃ: 'ja', じゅ: 'ju', じょ: 'jo', ぁ: 'a', ぃ: 'i', ぅ: 'u', ぇ: 'e', ぉ: 'o', ゃ: 'ya', ゅ: 'yu', ょ: 'yo', っ: '', ー: '-' };
      let h = String(s).replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
      let out = '';
      for (let i = 0; i < h.length;) {
        const two = h.slice(i, i + 2);
        if (m[two]) { out += m[two]; i += 2; continue; }
        const one = h[i];
        if (m[one] !== undefined) { out += m[one]; i += 1; continue; }
        out += one; i += 1;
      }
      return out;
    },
  },
  Worker: class { constructor() { throw new Error('no worker in harness'); } },
  fetch: (url) => {
    const m = String(url).match(/vendor\/([^?]+)$/);
    if (!m) return Promise.reject(new Error('fetch diblokir di harness: ' + url));
    const file = path.join(ROOT, 'vendor', m[1]);
    return Promise.resolve({ ok: true, json: async () => JSON.parse(fs.readFileSync(file, 'utf8')) });
  },
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

const driver = `
;(async () => {
  const A = (name, cond, extra) => {
    globalThis.__results.push((cond ? 'OK   ' : 'FAIL ') + name + (extra && !cond ? ' — ' + extra : ''));
    if (!cond) globalThis.__failures++;
  };
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  // --- extractSentence ---
  A('sentence-tengah', extractSentence('今日は暑い。明日は休み。', 7) === '明日は休み。');
  A('sentence-awal', extractSentence('今日は暑い。明日は休み。', 2) === '今日は暑い。');
  A('sentence-kutipan', extractSentence('彼は「行く」と言った。', 3) === '彼は「行く」と言った。');
  A('sentence-kosong', extractSentence('', 0) === '');
  A('sentence-panjang-dipotong', extractSentence('あ'.repeat(200) + '。x', 5).length <= 161);

  // --- SRS defaults & mastery ---
  const e0 = srsDefaults({});
  A('srs-defaults', e0.ease === 2.5 && e0.interval === 0 && e0.reps === 0 && e0.mastery === 0 && e0.nextReview === 0);
  A('mastery-nol', masteryDots({}) === '○○○○○');
  A('mastery-tiga', masteryDots({ mastery: 3 }) === '●●●○○');
  A('due-baru', srsIsDue({ nextReview: 0 }, Date.now()) === true);
  A('due-nanti', srsIsDue({ nextReview: Date.now() + 999999 }, Date.now()) === false);

  // --- Quiz helpers ---
  const d = srsPickDistractors(['a', 'b', 'c', 'd'], 'b', 3);
  A('distractors-4-unik', d.length === 4 && d.includes('b') && new Set(d).size === 4);
  A('kind-jp-id', srsQuizKind({ surface: 'たべる' }, 0) === 'jp-id');
  A('kind-listen-fallback', srsQuizKind({ surface: 'たべる' }, 1) === 'listen');
  A('kind-cloze', srsQuizKind({ surface: '食べる', sentence: 'ごはんを食べる。' }, 3) === 'cloze');
  A('kind-cloze-skip-tanpa-kalimat', srsQuizKind({ surface: '食べる' }, 3) === 'jp-id');
  A('kind-kana-kanji', srsQuizKind({ surface: '食べる', kana: 'たべる' }, 1) === 'kana-kanji');
  A('has-kanji', srsHasKanji({ surface: '食べる' }) === true && srsHasKanji({ surface: 'たべる' }) === false);
  A('answer-text-id', srsAnswerText({ meaningsId: 'makan', meanings: ['to eat'] }) === 'makan');
  A('answer-text-en', srsAnswerText({ meanings: ['to eat'] }) === 'to eat');

  // --- Cache & hash ---
  A('hash-deterministik', transHash('abc') === transHash('abc') && transHash('abc') !== transHash('abd'));
  const big = {};
  for (let i = 0; i < 210; i++) big['k' + i] = { id: 'v' + i, ts: i };
  transCacheSave(big);
  const back = transCacheLoad();
  A('cache-cap-200', Object.keys(back).length === 200 && !back.k0 && back.k209);

  // --- Statistik streak ---
  localStorage.removeItem('kokoro_srs_stats');
  srsRecordAnswer(true);
  let s = srsStatsLoad();
  A('streak-hari-pertama', s.streak === 1 && s.xp === 10 && s.correct === 1);
  const y = new Date(Date.now() - 86400000);
  const yk = y.getFullYear() + '-' + String(y.getMonth() + 1).padStart(2, '0') + '-' + String(y.getDate()).padStart(2, '0');
  localStorage.setItem('kokoro_srs_stats', JSON.stringify({ xp: 10, correct: 1, wrong: 0, streak: 2, lastDate: yk }));
  srsRecordAnswer(false);
  s = srsStatsLoad();
  A('streak-lanjut', s.streak === 3 && s.wrong === 1 && s.xp === 12);

  // --- vocabMatches ---
  vocabScope = 'all'; vocabQuery = '';
  A('match-semua', vocabMatches({ surface: 'x' }, '') === true);
  vocabScope = 'n5';
  A('match-n5', vocabMatches({ jlpt: 'N5' }, '') === true && vocabMatches({}, '') === false);
  vocabScope = 'kanji';
  A('match-kanji', vocabMatches({ kind: 'kanji' }, '') === true && vocabMatches({ kind: 'word' }, '') === false);
  vocabScope = 'book';
  A('match-buku', vocabMatches({ bookTitle: currentBook.title }, '') === true);
  A('match-buku-lain', vocabMatches({ bookTitle: 'Buku Lain ##' }, '') === false);
  vocabScope = 'due';
  A('match-due', vocabMatches({ nextReview: 0 }, '') === true);
  vocabScope = 'all';
  A('match-query', vocabMatches({ surface: '食べる', kana: 'たべる', meaningsId: 'makan' }, 'mak') === true);
  A('match-query-miss', vocabMatches({ surface: '食べる' }, 'zzz') === false);
  vocabQuery = '';

  // --- Pool pengecoh dari data N5 asli ---
  const pools = await srsBuildPools('tidak-ada');
  A('pool-jawaban-n5', pools.answers.includes('makan'), 'pool=' + pools.answers.length);
  A('pool-surface-n5', pools.surfaces.includes('食べる'));

  // --- Rakit harfiah offline (worker mati → fallback + lookupWord asli) ---
  await renderLiteralBreakdown('食べる');
  A('literal-gloss-id', el.transResultText.textContent.includes('makan'), el.transResultText.textContent.slice(0, 80));

  // --- translateText via cache (tanpa internet) ---
  const ck = transHash('ごはんを食べる。'.slice(0, 500));
  const c0 = transCacheLoad(); c0[ck] = { id: 'Makan nasi (cache).', ts: Date.now() }; transCacheSave(c0);
  await translateText('ごはんを食べる。');
  await new Promise((r) => setTimeout(r, 50));
  A('translate-cache', el.transResultText.textContent.includes('Makan nasi (cache).'));

  // --- Sesi review penuh 1 kartu (jp-id) ---
  srsQueue = [{ id: 101, surface: '食べる', kana: 'たべる', romaji: 'taberu', meanings: ['to eat'], meaningsId: 'makan', jlpt: 'N5', kind: 'word', sentence: 'ごはんを食べる。', createdAt: 1 }];
  srsIndex = 0;
  await renderSrsCard();
  A('srs-4-pilihan', el.srsChoices.children.length === 4, 'dapat ' + el.srsChoices.children.length);
  A('srs-prompt', el.srsQuestion.textContent === '食べる', el.srsQuestion.textContent);
  const btns = Array.from(el.srsChoices.children);
  const correctIdx = btns.findIndex((b) => String(b.textContent).replace(/^\\d/, '').trim() === 'makan');
  A('srs-kunci-ditemukan', correctIdx >= 0);
  srsAnswer(correctIdx, 'jp-id', 'makan', '食べる', srsQueue[0]);
  A('srs-feedback-benar', srsSessionGood === 1 && srsAnswered === true);
  await srsGradeCurrent('good');
  A('srs-lanjut-selesai', srsIndex === 1);
  A('srs-grade-interval', srsQueue[0].interval === 1 && srsQueue[0].reps === 1 && srsQueue[0].mastery === 1,
    JSON.stringify({ i: srsQueue[0].interval, r: srsQueue[0].reps, m: srsQueue[0].mastery }));

  // --- startReview tanpa data → toast, tanpa throw ---
  srsQueue = []; srsIndex = 0;
  await startReview();
  A('startReview-kosong-aman', true);

  // --- markN5Words tanpa blok → diam, tanpa throw ---
  await markN5Words();
  A('markN5-aman', true);

  // --- Rōmaji tiap kata & kalimat (stub wanakana minimal) ---
  await renderVocabularyBreakdown('食べる');
  const cardsText = el.transWordsList.children.map((c) => c.textContent).join(' ');
  A('romaji-kartu-kata', cardsText.includes('taberu'), cardsText.slice(0, 120));
  await renderRomajiTranscription('ごはんを食べる。');
  A('romaji-kalimat-fallback', el.transRomajiText.textContent.includes('gohan') && el.transRomajiText.textContent.includes('beru'), el.transRomajiText.textContent);
  openTranslationModal('たべる');
  await new Promise((r) => setTimeout(r, 50));
  A('romaji-modal-hook', el.transRomajiText.textContent.includes('taberu'), el.transRomajiText.textContent);

  // --- Kamus JA→ID Wikikamus (prioritas N5 dulu, lalu Wikikamus) ---
  const w1 = await lookupWord('秘書', null, null);
  A('jaid-gloss', w1.idGloss && w1.idGloss.id.includes('sekretaris') && w1.idGloss.src === 'wikikamus', JSON.stringify(w1.idGloss));
  const w2 = await lookupWord('食べる', null, null);
  A('n5-prioritas', w2.idGloss && w2.idGloss.id === 'makan' && w2.idGloss.src === 'n5', JSON.stringify(w2.idGloss));
  await renderVocabularyBreakdown('秘書');
  const bt = el.transWordsList.children.map((c) => c.textContent).join(' ');
  A('jaid-label-kartu', bt.includes('Wikikamus') && bt.includes('sekretaris'), bt.slice(0, 160));

  // --- Tahap 2: kamus penuh + gabungan majemuk + nama diri ---
  await loadFullDictBG();
  A('fullmap-siap', jmdictFullReady === true);
  const wf = await lookupWord('文化祭', null, null);
  A('full-ada-bunkasai', !!(wf.entry && wf.entry.g && wf.entry.g[0].includes('festival')), JSON.stringify(wf.entry && wf.entry.g));
  const wb = await lookupWord('ぼやく', null, null);
  A('full-ada-boyaku', !!(wb.entry && wb.entry.g && wb.entry.g[0].includes('grumble')));
  const wn = await lookupWord('比企谷', 'ヒキガヤ', '比企谷', { p: '名詞', d1: '固有名詞' });
  A('nama-diri', wn.isName === true && !wn.entry && wn.romaji.includes('hikigaya'), wn.kana + '/' + wn.romaji);
  const wn2 = await lookupWord('xyzabc', null, null, { p: '名詞', d1: '一般' });
  A('bukan-nama-tetap-gagal', wn2.isName !== true && !wn2.entry);
  A('compound-pick', (() => {
    const c = pickCompoundSpan([{ s: '実行委員会', i: 5, n: 3 }, { s: '委員会', i: 7, n: 2 }], 6, 2);
    return !!(c && c.s === '実行委員会');
  })());
  A('compound-skip-pendek', pickCompoundSpan([{ s: '実行委員会', i: 5, n: 3 }], 6, 20) === null);
  A('compound-skip-luar', pickCompoundSpan([{ s: '実行委員会', i: 5, n: 3 }], 20, 1) === null);
  A('compound-tanpa-list', pickCompoundSpan(null, 6, 1) === null);

  // --- Tahap 3: jembatan EN→ID (gloss Inggris → Indonesia kasar) ---
  A('bridge-dasar', bridgeEnGloss(['school festival']) === 'sekolah festival');
  A('bridge-skip-stop', bridgeEnGloss(['to school']) === 'sekolah');
  A('bridge-kurung-relatif', bridgeEnGloss(['red wine (drink)']) === 'merah anggur');
  A('bridge-tanpa-hit', bridgeEnGloss(['xyzzy plugh']) === null);
  A('bridge-tanpa-gloss', bridgeEnGloss([]) === null && bridgeEnGloss(null) === null);
  const w3 = await lookupWord('文化祭', null, null);
  A('bridge-via-lookup', !!(w3.bridgeId && w3.bridgeId.includes('sekolah') && !w3.idGloss), JSON.stringify(w3.bridgeId));
  const w4 = await lookupWord('食べる', null, null);
  A('bridge-tidak-timpa-id', !w4.bridgeId && !!(w4.idGloss && w4.idGloss.src === 'n5'));
  // --- Tahap 4: provider dual-mode (fungsi murni) ---
  config.translationProvider = 'mymemory'; config.translationApiKey = '';
  A('prov-mymemory', translationProviderLabel() === 'MyMemory' && !translationProviderDef().needsKey && !translationLlmReady());
  config.translationProvider = 'gemini';
  A('prov-gemini-nokey', translationProviderDef().needsKey && !translationHasKey() && !translationLlmReady());
  config.translationApiKey = 'kunci-palsu';
  A('prov-gemini-key', translationHasKey() && translationLlmReady());
  config.translationProvider = 'openai'; config.translationApiKey = '';
  A('prov-openai-nokey', !translationLlmReady());
  config.translationProvider = 'mymemory'; config.translationApiKey = '';
  A('prompt-terjemah', promptTranslate('おはよう').includes('おはよう') && promptTranslate('x').includes('HANYA'));
  const ep = buildExplainPrompt('おはよう');
  A('prompt-jelaskan', ep.includes('1) Terjemahan') && ep.includes('2) Makna') && ep.includes('3) Tata bahasa') && ep.includes('おはよう'));
  config.translationProvider = 'gemini'; config.translationModel = 'm1';
  const k1 = transExplainKey('abc');
  config.translationModel = 'm2';
  const k2 = transExplainKey('abc');
  config.translationProvider = 'openai';
  const k3 = transExplainKey('abc');
  A('kunci-cache-unik', k1 !== k2 && k2 !== k3 && k1 !== k3);
  config.translationProvider = 'mymemory'; config.translationModel = '';
  let onlineGagal = false;
  try { await translateOnline('おはよう', false); } catch (e) { onlineGagal = true; }
  A('online-gagal-tanpa-net', onlineGagal === true);
  config.translationMode = 'offline';
  await translateText('食べる');
  await new Promise((r) => setTimeout(r, 50));
  A('mode-offline-literal', el.transResultText.textContent.includes('makan') && el.transSourceLabel.textContent === 'Offline', el.transSourceLabel.textContent);
  config.translationMode = 'online';
  await translateText('食べる');
  await new Promise((r) => setTimeout(r, 50));
  A('mode-online-gagal-jujur', el.transResultText.textContent.includes('Online gagal'), el.transResultText.textContent.slice(0, 80));
  config.translationMode = 'auto';
  syncExplainSection();
  await explainText();
  A('jelaskan-tanpa-kunci-aman', true);
  globalThis.__done = true;
})();
`;

sandbox.__results = results;
sandbox.__failures = 0;
Object.defineProperty(sandbox, '__failures', {
  get() { return failures; },
  set(v) { failures = v; },
});

(async () => {
  try {
    await vm.runInContext(code + '\n' + driver, sandbox);
  } catch (e) {
    console.error('HARNESS ERROR: ' + ((e && e.stack) || e));
    failures++;
  }
  for (const line of results) console.log(line);
  if (failures) {
    console.log('\\n' + failures + ' pemeriksaan GAGAL');
    process.exitCode = 1;
  } else {
    console.log('\\nSmoke Fase 2+3 lolos.');
  }
})();
