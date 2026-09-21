# Arsitektur Kode

> Satu file aplikasi: `index.html` (±3.800 baris). Nomor baris acuan
> (±, bisa bergeser sedikit antar versi) — cari **nama fungsi** bila meleset.

## Struktur `<head>` & CSS (awal file)

- Vendor lokal + font: `<script src="./vendor/...">`, `<link href="./vendor/fonts.css">`.
- `tailwind.config` inline (font + warna bunkobon).
- `<style>`: `.reading-vertical` (tategaki), `.paging-snap/smooth`,
  `figure.page-art` (ilustrasi halaman khusus), tema `body.theme-*`,
  `.is-native-android` (tanpa efek mahal), variabel `--lib-*` (tema pustaka),
  override chrome reader.

## Struktur body (tengah file)

`#libraryView` (header, filter, rak, grid) → `#bookDetailModal` →
`#editMetaModal` → `#shelfModal` → `#readerView` (navbar, sheet, HUD) →
`#navDrawer` → `#settingsDrawer` → lightbox/toast/loading/drag-overlay.

## Modul JS (fungsi kunci di `<script>` akhir)

| Area | Fungsi | ± Baris |
|---|---|---|
| DB IndexedDB | `dbInit dbPut dbGet dbGetAll dbDelete dbUpdate` | 1467+ |
| Sanitizer tategaki | `sanitizeChapterDoc` (figure, h-block, auto-tcy) | 1973 |
| Parser EPUB | `parseEpubZip` (murni, tanpa state global) | 2038 |
| Impor/buka | `importEpubFile importMultipleFiles openBookFromLibrary openDemoBook` | 2189+ |
| Tema & setting | `applyTypography applyLibraryAppearance effectiveLibraryTheme` | 2333+ |
| Scroll vertikal | `getVerticalProgress setVerticalRatio scrollToRatio stepPage` | 2557+ |
| Render bab | `renderCurrentChapter updateReadingProgress persistProgressNow` | 2608+ |
| Pustaka | `normalizeBook buildLibraryCard renderLibraryGrid` + filter/sort | 3363+ |
| Detail & rak | `openBookDetail renderDetailStars renderDetailTags renderShelfList` | 3442+ |
| Wiring UI | listener settings/pustaka/detail + `renderPresetRows` | 3880+ |
| Boot | `DOMContentLoaded` (migrasi config → apply → dbInit → library) | 4106+ |

## Model data

- **Record buku** (IndexedDB `kokoroLibraryDB`.`books`, key `id`):
  `title author description publisher coverBlob coverPlaceholder epubBlob
  languages chapterCount addedAt lastOpenedAt progressPercent
  currentChapterIndex scrollRatio bookmarks[] favorite finished rating tags[]`.
- **Definisi rak kosong**: `localStorage kokoro_shelves` (nama); rak terisi
  diturunkan dari `tags` semua buku (`getAllShelves()`).
- **Config** (`localStorage kokoro_reader_config`): tema terpisah
  `readerTheme/libraryTheme/linkThemes` + custom per permukaan + tipografi +
  preferensi pustaka (`librarySortMode/Filter/Tag/ViewMode`).

## Alur build

`index.html` → `node scripts/copy-dist.cjs` → `dist/` (allowlist, tanpa
backup/config) → `capacitor sync android` → `android/` (di-ignore git).
Ikon native: `assets/icon.png` (1024) → `scripts/gen-android-icons.ps1`.
Mutu: `node scripts/check.cjs` (sintaks, ID, offline, JSON, vendor).
