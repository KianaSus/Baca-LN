# Berkontribusi ke Kokoro

Terima kasih sudah mau membantu! Aturan mainnya sederhana agar repo tetap
mudah dibaca pendatang baru.

## Prinsip

1. **Satu file aplikasi**: semua logika baca ada di `index.html`
   (lihat peta di `docs/ARSITEKTUR.md`). Jangan pecah file tanpa diskusi dulu.
2. **Full-offline**: dilarang menambah CDN/URL remote. Vendor-kan ke `vendor/`
   (`npm run check` akan menolak URL `https://` baru).
3. **Ringan di HP**: hindari `backdrop-blur`, bayangan blur besar, dan tulis DOM
   di dalam handler `scroll` tanpa throttle rAF.

## Alur kerja

```powershell
npm install --ignore-scripts
# ... edit index.html ...
npm run check          # wajib lolos sebelum PR
npx serve -l 5173 .    # uji manual di browser
```

Untuk mengubah aset APK: `node scripts/copy-dist.cjs` lalu
`capacitor sync android` (jangan commit `dist/` / `android/`).

## Standar PR

- Satu PR = satu topik. Jelaskan: masalah → perubahan → cara menguji.
- Uji minimal: pustaka kosong & berisi, 1 EPUB JP vertikal, 1 EPUB EN,
  ganti tema luar-dalam, backup/restore.
- Tulis Bahasa Indonesia (atau dwibahasa); screenshot/GIF sangat membantu.
- Hormati privasi: jangan sertakan EPUB berhak cipta sebagai contoh uji.

## Melaporkan bug

Gunakan template Issues (bug / permintaan fitur). Sertakan: perangkat,
browser/WebView, langkah reproduksi, dan tangkapan layar bila bisa.
