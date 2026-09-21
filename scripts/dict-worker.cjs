// scripts/dict-worker.js — kuromoji FULL di Web Worker (tak pernah blokir UI thread).
// SUMBER (masuk git) — disalin ke dist/dict-worker.js oleh scripts/copy-dist.cjs.
// Protokol postMessage:
//   main -> worker : {type:'init'} | {type:'tokenize', id, text}
//   worker -> main : {type:'ready', ms} | {type:'tokens', id, tokens, compounds}
//                  | {type:'error', id?, message} (message memuat tahap: load-kuromoji/build-dict)
'use strict';

const KUROMOJI_URL = './vendor/kuromoji.min.js';
const DICT_PATH = './vendor/kuromoji-dict/';

// Cache tokenisasi per paragraf di memori worker (tap ulang <5ms, tanpa kirim ulang).
const tokenCache = new Map();
const MAX_CACHE = 200;

function cacheSet(text, tokens) {
  if (tokenCache.has(text)) tokenCache.delete(text);
  tokenCache.set(text, tokens);
  if (tokenCache.size > MAX_CACHE) {
    tokenCache.delete(tokenCache.keys().next().value);
  }
}

// Usulan gabungan kata majemuk: run token 名詞 berurutan (mis. 企画+書 -> 企画書).
// Main thread query gabungan terpanjang dulu, fallback per-token (Fase D).
// Mengembalikan [{s, i, n}] terurut: panjang desc, posisi asc. Maks 12.
function expandCompounds(tokens) {
  const out = [];
  const isNounish = (t) => t && (t.p === '名詞' || t.p === '接頭詞' || t.p === '接尾辞');
  let run = [];
  const flush = () => {
    // Hanya run yang semua tokennya bersebelahan persis (tanpa spasi/tanda).
    const adj = [];
    let cur = [];
    for (const t of run) {
      const prev = cur[cur.length - 1];
      if (prev && prev.i + prev.s.length === t.i) cur.push(t);
      else { if (cur.length) adj.push(cur); cur = [t]; }
    }
    if (cur.length) adj.push(cur);
    for (const seq of adj) {
      if (seq.length < 2) continue;
      const spans = [];
      for (let a = 0; a < seq.length; a++) {
        let s = '';
        for (let b = a; b < seq.length; b++) {
          s += seq[b].s;
          if (b > a && s.length >= 2) spans.push({ s, i: seq[a].i, n: b - a + 1 });
        }
      }
      spans.sort((x, y) => (y.s.length - x.s.length) || (x.i - y.i));
      for (const sp of spans) {
        if (out.length >= 12) return;
        out.push(sp);
      }
    }
    run = [];
  };
  for (const t of tokens) {
    if (isNounish(t)) run.push(t);
    else flush();
  }
  flush();
  return out;
}

function compactToken(t) {
  return {
    s: t.surface_form,
    r: t.reading || null, // katakana; konversi hiragana/romaji di main thread (wanakana)
    b: (t.basic_form && t.basic_form !== '*') ? t.basic_form : t.surface_form,
    p: t.pos || '',
    d1: t.pos_detail_1 || '',
    i: typeof t.word_position === 'number' ? t.word_position : -1,
  };
}

let tokenizerPromise = null;

function post(msg) {
  if (typeof self !== 'undefined' && typeof self.postMessage === 'function') {
    self.postMessage(msg);
  }
}

function ensureTokenizer() {
  if (tokenizerPromise) return tokenizerPromise;
  tokenizerPromise = (async () => {
    const t0 = Date.now();
    // Muat 1x langsung via builder (tanpa prefetch ganda: hemat 17MB transfer di HP).
    try {
      importScripts(KUROMOJI_URL);
    } catch (e) {
      throw new Error('tahap load-kuromoji: ' + String((e && e.message) || e));
    }
    let tokenizer;
    try {
      const builder = kuromoji.builder({ dicPath: DICT_PATH });
      tokenizer = await new Promise((resolve, reject) => {
        try {
          builder.build((err, tok) => (err ? reject(err) : resolve(tok)));
        } catch (e) { reject(e); }
      });
    } catch (e) {
      throw new Error('tahap build-dict: ' + String((e && e.message) || e));
    }
    post({ type: 'ready', ms: Date.now() - t0 });
    return tokenizer;
  })().catch((e) => {
    tokenizerPromise = null; // boleh coba lagi
    post({ type: 'error', message: String((e && e.message) || e) });
    throw e;
  });
  return tokenizerPromise;
}

async function handleMessage(msg) {
  const m = msg || {};
  if (m.type === 'init') {
    try { await ensureTokenizer(); }
    catch (e) { /* error sudah dipost */ }
    return;
  }
  if (m.type === 'tokenize') {
    try {
      const text = String(m.text || '');
      if (!text) { post({ type: 'tokens', id: m.id, tokens: [], compounds: [] }); return; }
      let tokens = tokenCache.get(text);
      if (!tokens) {
        const tokenizer = await ensureTokenizer();
        tokens = tokenizer.tokenize(text).map(compactToken);
        cacheSet(text, tokens);
      }
      post({ type: 'tokens', id: m.id, tokens, compounds: expandCompounds(tokens) });
    } catch (e) {
      post({ type: 'error', id: m.id, message: String((e && e.message) || e) });
    }
  }
}

const isWorkerEnv = typeof self !== 'undefined' && typeof importScripts === 'function';
if (isWorkerEnv) {
  self.onmessage = (e) => { handleMessage(e.data); };
}

// Hook uji Node (tanpa Worker): const {expandCompounds} = require('./dict-worker.js')
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { expandCompounds, MAX_CACHE };
}
