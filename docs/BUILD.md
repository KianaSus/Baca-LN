# Build: Browser, PWA, APK, EXE

## Prasyarat

- Node.js ≥ 18 (lihat `.nvmrc`; `nvm use` bila memakai nvm).
- `npm install --ignore-scripts` sekali saja.
  (`--ignore-scripts` melewati postinstall Electron — hanya perlu di Fase EXE.)
- Jika `npx` error `node not recognized` (Node di luar PATH): pakai pemanggilan
  langsung `node node_modules/@capacitor/cli/bin/capacitor ...`, atau instal
  Node LTS via `winget install OpenJS.NodeJS.LTS` lalu restart terminal.

## Browser / PWA

```powershell
npx serve -l 5173 .          # atau: python -m http.server 5173
# buka http://localhost:5173/index.html
```

Klik ganda `index.html` juga jalan (Service Worker nonaktif di `file://`).
Install sebagai aplikasi: buka via `http://localhost`/HTTPS → **Install**.

## APK debug (Capacitor + Android Studio)

Prasyarat sekali saja: **Android Studio + SDK/JDK**.

```powershell
node scripts/copy-dist.cjs     # bangun dist/ bersih (allowlist)
node node_modules/@capacitor/cli/bin/capacitor add android   # sekali saja
node node_modules/@capacitor/cli/bin/capacitor sync android  # tiap habis edit
```

Buka folder `android/` di Android Studio → **Run ▶** (emulator/HP USB debugging)
atau **Build > Build APK** →
`android/app/build/outputs/apk/debug/app-debug.apk` (sideload, data aman saat
menimpa; jangan Uninstall bila tak mau kehilangan pustaka).

Rutin tiap update aplikasi: `copy-dist` → `sync` → Run/Build ulang.
Setelah update di HP: tutup total app lalu buka lagi sekali (refresh cache SW).

Ikon: `assets/icon.png` (1024) → regenerasi semua densitas + splash via
`powershell -ExecutionPolicy Bypass -File scripts/gen-android-icons.ps1`.

## EXE (rencana — belum aktif)

- **Electron**: `npm install` (tanpa `--ignore-scripts`), `npm run electron:dev`;
  rilis via Electron Forge (`npm run make`). Catatan: `electron-main.js` memakai
  `require()` sementara `package.json` bertipe `"module"` — ganti ke `.cjs`
  sebelum dipakai.
- **Tauri**: butuh toolchain Rust; `npm run tauri:dev` / `tauri:build`.

## Full-offline & vendor

Aplikasi dilarang memuat URL remote (`npm run check` menegakkannya).
Bila butuh lib/versi baru:

1. Unduh file ke `vendor/` (JS) — font: ambil CSS Google Fonts dengan UA Chrome
   (agar `woff2`), unduh subset yang dipakai ke `vendor/fonts/`, tulis ulang
   URL ke lokal di `vendor/fonts.css` (lihat riwayat: subset latin + JP inti).
2. Daftarkan di `sw.js` → `APP_SHELL` bila kritis saat boot.
3. `npm run check` untuk verifikasi.

## Data kamus tap-to-lookup (fitur belajar bahasa)

Sekali saja (butuh internet), dari root repo:

```powershell
node scripts/build-dict.cjs
```

Mengunduh JMdict + KANJIDIC2 (EDRDG, ~25MB) ke folder temp, mengekstrak kata
umum (±30rb entri) dan kanji jouyou (±3rb) ke `vendor/jmdict-compact.json` +
`vendor/kanjidic-compact.json`, serta menyalin `deinflect.json` + `pos-id.json`
(sumber versi manusia di `scripts/`). Hasil bulk di-ignore git (lihat
`.gitignore`) — bangun ulang bila repo fresh. Atribusi lisensi:
`docs/ATRIBUSI-DATA.md`.

## Tokenizer kuromoji (fitur kamus tap-to-lookup)

```powershell
node scripts/fetch-kuromoji.cjs
```

Mengunduh `vendor/kuromoji.min.js` + `vendor/kuromoji-dict/*.dat.gz` (±17MB,
di-ignore git). Runtime-nya jalan **penuh di Web Worker**
(`scripts/dict-worker.cjs` → disalin ke `dist/dict-worker.js`), jadi UI thread
tidak pernah freeze saat cold-start.
