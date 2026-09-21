# Kebijakan Keamanan

Kokoro berjalan 100% di sisi klien (tanpa server), jadi permukaan serangannya
kecil. Meski begitu, harap laporkan secara bertanggung jawab:

- **Jangan** membuka Issues publik untuk kerentanan (mis. XSS via konten EPUB,
  penyalahgunaan file picker, kebocoran data IndexedDB).
- Kirim deskripsi + langkah reproduksi melalui Issues **privat/draf** atau hubungi
  maintainer repo ini secara langsung.
- Kami berusaha merespons dalam 7 hari dan memberi kredit di catatan rilis
  bila diinginkan.

Catatan untuk kontributor: semua HTML dari EPUB dianggap tidak tepercaya —
jangan menambahkan `innerHTML` dari sumber luar tanpa sanitasi, dan jangan
memuat skrip/URL remote apa pun (aturan offline di `npm run check`).

## Kunci API terjemahan (Tahap 4, opt-in)

- Kunci API (Gemini / OpenAI-compatible) disimpan **hanya di `localStorage`
  perangkat** (`kokoro_reader_config`), input bertipe password, dan **tidak
  ikut backup/pulihkan pustaka** (backup hanya metadata buku).
- Teks yang diterjemahkan/dijelaskan **dikirim ke provider terpilih** —
  tertulis di Pengaturan → Terjemahan. Jangan menempel kunci milik orang lain
  / kunci produksi ke perangkat bersama.
- Domain endpoint yang diizinkan di kode didaftar eksplisit di
  `scripts/check.cjs` (allowlist); URL kustom pengguna adalah input runtime
  dan tidak di-hardcode.
