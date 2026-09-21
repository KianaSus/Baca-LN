# Panduan Fitur — di mana letak semuanya

> Untuk pengguna & kontributor baru. Nama tombol persis seperti di aplikasi.

## Pustaka (layar awal)

| Mau apa | Caranya |
|---|---|
| Tambah buku | Tombol **Impor EPUB** (kanan atas) atau tombol **＋** (HP), atau seret file `.epub` ke halaman |
| Cari buku | Kolom **Cari judul / penulis / rak...** (atas) |
| Filter status | Chip **Semua / Sedang Dibaca / Belum Dibaca / Selesai / Favorit** |
| Filter rak | Baris **Rak:** → ketuk chip `📚 NamaRak` (ketuk lagi melepas) |
| Urutkan | Ikon **⇅** → Terakhir Dibaca / Baru Ditambahkan / Judul / Penulis / Progres / Rating |
| Grid ↔ Daftar | Ikon **grid** di header |
| Buka buku | Ketuk **sampul** → halaman detail → **Lanjutkan/Mulai Membaca** |
| Opsi cepat buku | Tombol **⋯** di pojok sampul → Detail / Baca / Favorit / Selesai / Hapus |
| Buat rak | Baris Rak → **Kelola** → ketik nama → **Buat** |
| Masukkan buku ke rak | Halaman detail → seksi **Rak / Tag** → ketik → Enter |
| Cadangkan/pulihkan | Header → **⋮ (Lainnya)** → Cadangkan / Pulihkan / Hapus Semua |

## Halaman detail buku

Dibuka dengan mengetuk sampul. Berisi: sampul besar, progres, rating ★
(ketuk bintang; ketuk ulang membatalkan), tombol **Favorit / Selesai**,
**Edit info**, **Ganti cover**, **Ekspor EPUB**, **Hapus**, deskripsi,
editor **Rak/Tag**, dan **Daftar Bab** (ketuk bab untuk langsung lompat).

## Membaca

| Mau apa | Caranya |
|---|---|
| Balik halaman | Usap/jentik layar, tombol **Layar ◀ ▶** (bar bawah), slider `%`, `← →` (laptop), scroll mouse |
| Ganti bab | Tombol bab di bar bawah, atau **Menu & Bab** (atas) → tab **Bab** |
| Vertikal ↔ Horizontal | Tombol **縦/横** (bar atas) atau tombol `V` |
| Cari kata di bab | Ikon **🔍** (atau Ctrl+F), navigasi `∧ ∨` |
| Bookmark | Ikon **🔖** di header halaman, atau tombol `B`; kelola di **Menu & Bab** → **Tanda** |
| Lihat ilustrasi | Ketuk gambar di teks, atau **Menu & Bab** → **Galeri** |
| Mode fokus | Ikon **👁** (atau `F`); ketuk tengah layar untuk keluar |
| Layar penuh | Ikon **⛶** (laptop) |

## Kamus tap-to-lookup (mode Kamus)

Aktifkan via tombol tangan di bar atas (label **Mode Kamus**), lalu ketuk atau
tahan kata di teks — tanpa menu sistem. Popover menampilkan kana (hiragana +
katakana), romaji, arti Indonesia (kurasi N5 + Wikikamus, berlabel sumber),
kelas kata, arti kamus offline, catatan konjugasi (mis. “→ よむ: bentuk ～て”),
bedah kanji, tombol 🔊 dengarkan, 🐢 dengarkan pelan (0.6x), dan ⭐ simpan.

| Mau apa | Caranya |
|---|---|
| Simpan kata | Popover → **⭐ Simpan** (tersimpan permanen di perangkat) |
| Lihat/hapus kosakata | **Menu & Bab** → tab **Kosa** → hapus per baris |
| Ekspor ke Anki | Tab **Kosa** → **Ekspor Anki** (TSV: surface/kana/romaji/pos/arti) |
| Bedah kalimat | Toolbar seleksi → **Kamus & Bedah** (arti + konjugasi + **rōmaji tiap kata**) |
| Arti Indonesia berlapis | Tiap kata dicari berurutan: **🇮🇩 kurasi N5 → 🇮🇩 Wikikamus → ≈ ~gloss** (jembatan kasar gloss Inggris, dilabeli jujur) → EN asli |
| Kata majemuk | Ketuk bagian mana pun dari kata majemuk (mis. 実行委員会) → otomatis dicoba bentuk gabungan terpanjang dulu |
| Nama diri | Token berpenanda nama (mis. 比企谷) tampil 👤 **“Kemungkinan nama diri”** + bacaan/romaji + bedah kanji (tanpa data tambahan) |
| Terjemahan kalimat | Mode **Otomatis** (default): online bila bisa → offline bila tidak. Mode **Offline**/**Online** manual di Pengaturan → Terjemahan |
| Provider online | **MyMemory** (bawaan, tanpa kunci, akurasi biasa) / **Gemini** / **OpenAI-compatible** (kunci + URL kustom). Hasil online di-cache di perangkat + label sumber (Online via X / Offline / Cache) |
| ✨ Jelaskan (LLM) | Tombol di modal bila provider LLM + kunci siap: terjemahan akurat + makna/nuansa + tata bahasa, Bahasa Indonesia, hasil di-cache |
| Rōmaji kalimat | Modal Terjemahan & Kamus → bagian **Rōmaji (bacaan latin)**: transkripsi per kata dari bacaan token (+ tombol Salin). Nonaktif via Pengaturan → romaji |
| Tandai kata N5 | Garis titik hijau di bawah kata N5 yang belum disimpan (Pengaturan → Tandai kata N5; butuh “Kamus siap”) |

## Kosakata + review SRS (tab **Kosa** di Menu & Bab)

Setiap kata/kanji yang disimpan membawa **1 kalimat konteks** dari buku,
badge JLPT, arti Indonesia (bisa diedit ✏️ inline), dan status penguasaan
●●●○○. Baris kosakata punya tombol 🔊 dengar, 📍 lompat ke konteks di buku,
✏️ edit arti, 🗑 hapus. Filter: cari teks, **Semua buku / Buku ini / N5 /
Kanji / Jatuh tempo**.

| Mau apa | Caranya |
|---|---|
| Review harian | Panel **Belajar Hari Ini (N)** → **Review** (maks 20 kartu; bila kosong → latihan bebas) |
| Kuis | 4 tipe bergilir: JP→Arti, Bacaan→Kanji, 🎧 Dengar→Arti, Isi kalimat (dengan contoh dari bukumu) |
| Nilai | Tiap jawaban dinilai **😅 Lupa / 🤔 Ragu / 😄 Tahu** (SM-2: interval 10 mnt → 1 → 3 → ×ease hari) |
| Shortcut | Keyboard `1-4` pilih jawaban, `1-3` nilai, `Esc` tutup |
| Streak & XP | 🔥 streak harian + ✨ XP (10 benar / 2 salah) + bar progres N5 di panel Kosa |
| Ekspor ke Anki | Tab **Kosa** → **Ekspor Anki** (TSV+: surface/kana/romaji/pos/arti_id/arti_en/jlpt/kalimat/mastery) |
| Kartu kanji pemula | Popover → ketuk chip kanji (mis. **雪 N5**) → arti ID, bacaan on/kun, contoh dari buku, 🔊/⭐ |
| Tabel kana | Tombol **あ Kana** di bar atas → grid hiragana/katakana + suara per sel |

## Furigana pintar (pengaturan Tampilan & Kertas)

- **Semua**: semua furigana tampil (default lama).
- **Pintar** (default baru): furigana kata yang sudah disimpan memudar;
  ketuk untuk mengintip bacaan 1,4 detik.
- **Mati**: semua furigana disembunyikan (latihan baca).

## Pengaturan (ikon **sliders** di bar atas reader)

- **Gaya Tampilan**: Mode Buku (bunkobon) / Mode Default (bersih tanpa bingkai).
- **Tema Luar & Dalam**: toggle **Samakan**; grid **Tema isi** dan **Tema luar**
  (文庫本/純和紙/琥珀/OLED/桜色/Kustom); editor **Warna kustom isi/luar**
  (BG + teks + preset Midnight/Charcoal/Warm Paper/Forest/Matrix).
- **Arah Penulisan**, **Gerak Halaman Vertikal** (Snap/Mulus), font, ukuran,
  jarak baris/paragraf, perataan, lebar kolom, kecerahan, header/footer,
  animasi, jaga-layar-menyala, bayangan, furigana.

Semua tersimpan otomatis di perangkat (`localStorage`); progres baca di
`IndexedDB`. Reset via tombol **Reset Default** di bawah drawer pengaturan.
