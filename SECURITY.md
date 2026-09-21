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
