# Atribusi Data Kamus

Fitur kamus tap-to-lookup Kokoro memakai data dan pustaka berikut.
Halaman ini memenuhi syarat lisensi masing-masing proyek.

## Data kamus (dibangun via `scripts/build-dict.cjs`)

- **JMdict** — Japanese-Multilingual Dictionary.
  Berkas ini properti milik **Electronic Dictionary Research and Development
  Group (EDRDG)** dan dipakai sesuai lisensi Grup tersebut.
  http://www.edrdg.org/jmdict/j_jmdict.html
- **KANJIDIC2** — Kanji database.
  Berkas ini properti milik **Electronic Dictionary Research and Development
  Group (EDRDG)** dan dipakai sesuai lisensi Grup tersebut.
  http://www.edrdg.org/wiki/index.php/KANJIDIC_Project

## Data belajar N5 (dibangun via `scripts/build-dict-n5.cjs`, tanpa internet)

- **Daftar kosakata + kanji N5** (`vendor/jlpt-n5.json`, `vendor/kanji-n5.json`):
  pemilihan kata/kanji level N5 mengikuti daftar umum JLPT N5 yang beredar
  publik; bacaan on/kun disalin dari KANJIDIC2 (EDRDG, lihat di atas).
- **Arti Indonesia + contoh kalimat** (`vendor/id-gloss-n5.json`):
  karya sendiri untuk proyek ini (MIT) — ditulis sederhana untuk pemula,
  boleh dikoreksi via kontribusi.
- **Tabel kana** (`vendor/kana-map.json`): gojuon/dakuon/yoon standar (fakta
  bahasa umum), karya sendiri (MIT).
- **Placeholder SVG kanji** (`vendor/kanjivg-n5/`): gambar sederhana berisi
  huruf kanji + label N5, karya sendiri (MIT). Bukan KanjiVG; urutan goresan
  resmi KanjiVG (CC-BY-SA) direncanakan bila dibutuhkan Fase lanjutan dan
  akan dicantumkan di sini bila dipakai.

Berkas hasil build N5 berukuran kecil dan **di-commit** ke git (berbeda dari
bulk JMdict). Bangun ulang kapan saja dengan `node scripts/build-dict-n5.cjs`.

## Pustaka runtime (di `vendor/`)

| Pustaka | Lisensi | Kegunaan |
|---|---|---|
| kuromoji.js | Apache-2.0 | Tokenizer Jepang (Fase B) |
| wanakana | MIT | Konversi kana ↔ romaji |
| Aturan de-inflect (`scripts/deinflect-rules.json`, karya sendiri, MIT) | MIT | Bedah konjugasi → catatan grammar Indonesia |

## Catatan terjemahan

Gloss kamus berbahasa Inggris (apa adanya dari JMdict). Catatan gramatika
dan label kelas kata berbahasa Indonesia ditulis untuk proyek ini (MIT).
Contoh kalimat (Tatoeba, CC-BY) direncanakan Fase 2 dan akan dicantumkan
di sini bila dipakai.
