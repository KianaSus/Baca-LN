// scripts/build-dict-n5.cjs — bangun data belajar N5 offline (karya sendiri, MIT).
// Keluaran (KECIL, di-commit ke git — bukan bulk seperti JMdict):
//   vendor/jlpt-n5.json      — kunci kata -> { level: "N5" }
//   vendor/id-gloss-n5.json  — kunci kata -> { id, ex_ja, ex_id } (arti + contoh karya sendiri)
//   vendor/kana-map.json     — array { kana, kata, romaji, type } (gojuon+dakuon+yoon)
//   vendor/kanji-n5.json     — kanji -> { id, on, kun, grade } (arti ID karya sendiri,
//                              on/kun disalin dari vendor/kanjidic-compact.json bila ada)
//   vendor/kanjivg-n5/<codepoint>.svg — placeholder SVG per kanji N5 (huruf besar + label N5)
// Jalan: node scripts/build-dict-n5.cjs   (tanpa internet, boleh dijalankan kapan saja)
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const VENDOR = path.join(ROOT, 'vendor');
const KVG_DIR = path.join(VENDOR, 'kanjivg-n5');

// ---------------------------------------------------------------------------
// 1. Kosakata N5 inti: [kanjiAtauNull, kana, artiID, contohJA, contohID]
// Contoh kalimat karya sendiri (sederhana, untuk pemula). MIT.
// ---------------------------------------------------------------------------
const N5_VOCAB = [
  ['食べる', 'たべる', 'makan', 'ごはんを食べる。', 'Makan nasi.'],
  ['飲む', 'のむ', 'minum', '水を飲む。', 'Minum air.'],
  ['行く', 'いく', 'pergi', '学校に行く。', 'Pergi ke sekolah.'],
  ['来る', 'くる', 'datang', '友だちが来る。', 'Teman datang.'],
  ['帰る', 'かえる', 'pulang', '家に帰る。', 'Pulang ke rumah.'],
  ['見る', 'みる', 'melihat, menonton', '映画を見る。', 'Menonton film.'],
  ['聞く', 'きく', 'mendengar, bertanya', '音楽を聞く。', 'Mendengarkan musik.'],
  ['読む', 'よむ', 'membaca', '本を読む。', 'Membaca buku.'],
  ['書く', 'かく', 'menulis', '手紙を書く。', 'Menulis surat.'],
  ['話す', 'はなす', 'berbicara', '先生と話す。', 'Berbicara dengan guru.'],
  ['買う', 'かう', 'membeli', 'パンを買う。', 'Membeli roti.'],
  ['会う', 'あう', 'bertemu', '友だちに会う。', 'Bertemu teman.'],
  ['知る', 'しる', 'mengetahui', '答えを知る。', 'Mengetahui jawaban.'],
  ['住む', 'すむ', 'tinggal', '東京に住む。', 'Tinggal di Tokyo.'],
  ['働く', 'はたらく', 'bekerja', '会社で働く。', 'Bekerja di perusahaan.'],
  ['休む', 'やすむ', 'istirahat, libur', '日曜日に休む。', 'Libur di hari Minggu.'],
  ['起きる', 'おきる', 'bangun tidur', '朝六時に起きる。', 'Bangun jam 6 pagi.'],
  ['寝る', 'ねる', 'tidur', '夜十時に寝る。', 'Tidur jam 10 malam.'],
  ['勉強する', 'べんきょうする', 'belajar', '日本語を勉強する。', 'Belajar bahasa Jepang.'],
  ['歩く', 'あるく', 'berjalan kaki', '公園を歩く。', 'Berjalan kaki di taman.'],
  ['走る', 'はしる', 'berlari', '朝走る。', 'Berlari pagi-pagi.'],
  ['泳ぐ', 'およぐ', 'berenang', '海で泳ぐ。', 'Berenang di laut.'],
  ['歌う', 'うたう', 'bernyanyi', '歌を歌う。', 'Menyanyikan lagu.'],
  ['笑う', 'わらう', 'tertawa', 'みんなで笑う。', 'Tertawa bersama.'],
  ['泣く', 'なく', 'menangis', '赤ちゃんが泣く。', 'Bayi menangis.'],
  ['怒る', 'おこる', 'marah', '父が怒る。', 'Ayah marah.'],
  ['思う', 'おもう', 'berpikir, merasa', 'そう思う。', 'Berpikir begitu.'],
  ['言う', 'いう', 'berkata', '名前を言う。', 'Menyebut nama.'],
  ['作る', 'つくる', 'membuat', '料理を作る。', 'Memasak makanan.'],
  ['使う', 'つかう', 'memakai', '鉛筆を使う。', 'Memakai pensil.'],
  ['開ける', 'あける', 'membuka', '窓を開ける。', 'Membuka jendela.'],
  ['閉める', 'しめる', 'menutup', 'ドアを閉める。', 'Menutup pintu.'],
  ['止める', 'とめる', 'menghentikan', '車を止める。', 'Menghentikan mobil.'],
  ['曲がる', 'まがる', 'belok', '右に曲がる。', 'Belok kanan.'],
  ['渡る', 'わたる', 'menyeberang', '橋を渡る。', 'Menyeberangi jembatan.'],
  ['乗る', 'のる', 'naik (kendaraan)', '電車に乗る。', 'Naik kereta.'],
  ['降りる', 'おりる', 'turun', '駅で降りる。', 'Turun di stasiun.'],
  ['入る', 'はいる', 'masuk', '教室に入る。', 'Masuk ke kelas.'],
  ['出る', 'でる', 'keluar', '家を出る。', 'Keluar rumah.'],
  ['立つ', 'たつ', 'berdiri', '列に立つ。', 'Berdiri dalam antrean.'],
  ['座る', 'すわる', 'duduk', '椅子に座る。', 'Duduk di kursi.'],
  ['浴びる', 'あびる', 'mandi (shower)', 'シャワーを浴びる。', 'Mandi shower.'],
  ['借りる', 'かりる', 'meminjam', '本を借りる。', 'Meminjam buku.'],
  ['貸す', 'かす', 'meminjamkan', '傘を貸す。', 'Meminjamkan payung.'],
  ['教える', 'おしえる', 'mengajar, memberi tahu', '日本語を教える。', 'Mengajar bahasa Jepang.'],
  ['習う', 'ならう', 'belajar (pada guru)', 'ピアノを習う。', 'Les piano.'],
  ['忘れる', 'わすれる', 'lupa', '傘を忘れる。', 'Lupa membawa payung.'],
  ['覚える', 'おぼえる', 'menghafal', '漢字を覚える。', 'Menghafal kanji.'],
  ['払う', 'はらう', 'membayar', 'お金を払う。', 'Membayar uang.'],
  ['消す', 'けす', 'mematikan, menghapus', '電気を消す。', 'Mematikan lampu.'],
  ['付ける', 'つける', 'menyalakan', '電気を付ける。', 'Menyalakan lampu.'],
  ['開く', 'ひらく', 'terbuka', 'ドアが開く。', 'Pintu terbuka.'],
  ['閉まる', 'しまる', 'tertutup', 'ドアが閉まる。', 'Pintu tertutup.'],
  ['咲く', 'さく', 'mekar', '桜が咲く。', 'Bunga sakura mekar.'],
  ['降る', 'ふる', 'turun (hujan/salju)', '雨が降る。', 'Hujan turun.'],
  ['晴れる', 'はれる', 'cerah', '空が晴れる。', 'Langit cerah.'],
  ['曇る', 'くもる', 'berawan', '空が曇る。', 'Langit berawan.'],
  ['吹く', 'ふく', 'bertiup', '風が吹く。', 'Angin bertiup.'],
  ['飛ぶ', 'とぶ', 'terbang', '鳥が飛ぶ。', 'Burung terbang.'],
  ['遊ぶ', 'あそぶ', 'bermain', '公園で遊ぶ。', 'Bermain di taman.'],
  ['撮る', 'とる', 'memotret', '写真を撮る。', 'Memotret foto.'],
  [null, 'かける', 'menelpon', '電話をかける。', 'Menelepon.'],
  ['大きい', 'おおきい', 'besar', '大きい犬。', 'Anjing besar.'],
  ['小さい', 'ちいさい', 'kecil', '小さい猫。', 'Kucing kecil.'],
  ['新しい', 'あたらしい', 'baru', '新しい本。', 'Buku baru.'],
  ['古い', 'ふるい', 'lama, tua', '古い家。', 'Rumah tua.'],
  ['高い', 'たかい', 'tinggi, mahal', '高いビル。', 'Gedung tinggi.'],
  ['安い', 'やすい', 'murah', '安い店。', 'Toko murah.'],
  ['近い', 'ちかい', 'dekat', '駅に近い。', 'Dekat stasiun.'],
  ['遠い', 'とおい', 'jauh', '学校が遠い。', 'Sekolahnya jauh.'],
  ['早い', 'はやい', 'cepat, pagi', '早い電車。', 'Kereta pagi.'],
  ['遅い', 'おそい', 'lambat', '遅いバス。', 'Bus yang lambat.'],
  ['暑い', 'あつい', 'panas (cuaca)', '暑い夏。', 'Musim panas yang terik.'],
  ['寒い', 'さむい', 'dingin (cuaca)', '寒い冬。', 'Musim dingin yang dingin.'],
  ['暖かい', 'あたたかい', 'hangat', '暖かい春。', 'Musim semi yang hangat.'],
  ['涼しい', 'すずしい', 'sejuk', '涼しい秋。', 'Musim gugur yang sejuk.'],
  ['難しい', 'むずかしい', 'sulit', '難しい漢字。', 'Kanji yang sulit.'],
  ['易しい', 'やさしい', 'mudah', '易しい問題。', 'Soal yang mudah.'],
  ['忙しい', 'いそがしい', 'sibuk', '忙しい朝。', 'Pagi yang sibuk.'],
  ['楽しい', 'たのしい', 'menyenangkan', '楽しい祭り。', 'Festival yang meriah.'],
  ['嬉しい', 'うれしい', 'senang, gembira', '嬉しい日。', 'Hari yang membahagiakan.'],
  ['悲しい', 'かなしい', 'sedih', '悲しい話。', 'Cerita sedih.'],
  ['美味しい', 'おいしい', 'enak', '美味しいごはん。', 'Nasi yang enak.'],
  ['青い', 'あおい', 'biru', '空は青い。', 'Langit itu biru.'],
  ['有名', 'ゆうめい', 'terkenal', '有名な人。', 'Orang terkenal.'],
  ['親切', 'しんせつ', 'baik hati', '親切な先生。', 'Guru yang baik hati.'],
  ['元気', 'げんき', 'sehat, semangat', '元気な子。', 'Anak yang sehat.'],
  ['綺麗', 'きれい', 'cantik, bersih', '綺麗な花。', 'Bunga yang cantik.'],
  ['静か', 'しずか', 'tenang, sepi', '静かな教室。', 'Kelas yang tenang.'],
  ['賑やか', 'にぎやか', 'ramai', '賑やかな祭り。', 'Festival yang ramai.'],
  ['便利', 'べんり', 'praktis', '便利な店。', 'Toko yang praktis.'],
  ['大切', 'たいせつ', 'penting, berharga', '大切な友だち。', 'Teman berharga.'],
  ['安全', 'あんぜん', 'aman', '安全な道。', 'Jalan yang aman.'],
  ['今日', 'きょう', 'hari ini', '今日は暑い。', 'Hari ini panas.'],
  ['明日', 'あした', 'besok', '明日は休み。', 'Besok libur.'],
  ['昨日', 'きのう', 'kemarin', '昨日は雨。', 'Kemarin hujan.'],
  ['朝', 'あさ', 'pagi', '朝ごはんを食べる。', 'Sarapan pagi.'],
  ['夜', 'よる', 'malam', '夜早く寝る。', 'Tidur lebih awal di malam hari.'],
  ['家族', 'かぞく', 'keluarga', '家族と食べる。', 'Makan bersama keluarga.'],
  ['友だち', 'ともだち', 'teman', '友だちと遊ぶ。', 'Bermain dengan teman.'],
  ['学校', 'がっこう', 'sekolah', '学校に行く。', 'Pergi ke sekolah.'],
  ['先生', 'せんせい', 'guru', '先生に聞く。', 'Bertanya kepada guru.'],
  ['学生', 'がくせい', 'murid, pelajar', '私は学生です。', 'Saya seorang pelajar.'],
  ['電車', 'でんしゃ', 'kereta listrik', '電車に乗る。', 'Naik kereta.'],
  ['駅', 'えき', 'stasiun', '駅で会う。', 'Bertemu di stasiun.'],
  ['道', 'みち', 'jalan', '道を歩く。', 'Berjalan di jalan.'],
  ['空', 'そら', 'langit', '空が青い。', 'Langit itu biru.'],
  ['海', 'うみ', 'laut', '海で泳ぐ。', 'Berenang di laut.'],
  ['山', 'やま', 'gunung', '山が高い。', 'Gunung itu tinggi.'],
  ['川', 'かわ', 'sungai', '川で遊ぶ。', 'Bermain di sungai.'],
  ['花', 'はな', 'bunga', '花が咲く。', 'Bunga mekar.'],
  ['雨', 'あめ', 'hujan', '雨が降る。', 'Hujan turun.'],
  ['雪', 'ゆき', 'salju', '雪が降る。', 'Salju turun.'],
  ['風', 'かぜ', 'angin', '風が吹く。', 'Angin bertiup.'],
  ['音楽', 'おんがく', 'musik', '音楽を聞く。', 'Mendengarkan musik.'],
  ['映画', 'えいが', 'film', '映画を見る。', 'Menonton film.'],
  ['写真', 'しゃしん', 'foto', '写真を撮る。', 'Memotret.'],
  ['手紙', 'てがみ', 'surat', '手紙を書く。', 'Menulis surat.'],
  ['電話', 'でんわ', 'telepon', '電話をかける。', 'Menelepon.'],
  [null, 'ごはん', 'nasi, makanan', 'ごはんを食べる。', 'Makan nasi.'],
  ['水', 'みず', 'air', '水を飲む。', 'Minum air.'],
  ['お金', 'おかね', 'uang', 'お金を払う。', 'Membayar uang.'],
  ['時間', 'じかん', 'waktu', '時間がない。', 'Tidak ada waktu.'],
  ['日曜日', 'にちようび', 'hari Minggu', '日曜日に休む。', 'Libur di hari Minggu.'],
  ['日本', 'にほん', 'Jepang', '日本に住む。', 'Tinggal di Jepang.'],
  ['日本語', 'にほんご', 'bahasa Jepang', '日本語を勉強する。', 'Belajar bahasa Jepang.'],
  ['人', 'ひと', 'orang', '人が来る。', 'Seseorang datang.'],
  ['子供', 'こども', 'anak-anak', '子供が遊ぶ。', 'Anak-anak bermain.'],
  ['男', 'おとこ', 'laki-laki', '男の人。', 'Seorang pria.'],
  ['女', 'おんな', 'perempuan', '女の人。', 'Seorang wanita.'],
  ['父', 'ちち', 'ayah', '父と話す。', 'Berbicara dengan ayah.'],
  ['母', 'はは', 'ibu', '母と食べる。', 'Makan bersama ibu.'],
  ['犬', 'いぬ', 'anjing', '犬が走る。', 'Anjing berlari.'],
  ['猫', 'ねこ', 'kucing', '猫が寝る。', 'Kucing tidur.'],
  ['鳥', 'とり', 'burung', '鳥が飛ぶ。', 'Burung terbang.'],
  ['魚', 'さかな', 'ikan', '魚を食べる。', 'Makan ikan.'],
  ['肉', 'にく', 'daging', '肉を食べる。', 'Makan daging.'],
  ['野菜', 'やさい', 'sayur', '野菜を食べる。', 'Makan sayur.'],
  ['果物', 'くだもの', 'buah-buahan', '果物を食べる。', 'Makan buah.'],
  [null, 'パン', 'roti', 'パンを買う。', 'Membeli roti.'],
  [null, 'コーヒー', 'kopi', 'コーヒーを飲む。', 'Minum kopi.'],
  [null, 'テレビ', 'televisi', 'テレビを見る。', 'Menonton TV.'],
  [null, 'ラジオ', 'radio', 'ラジオを聞く。', 'Mendengarkan radio.'],
  [null, 'カメラ', 'kamera', 'カメラを買う。', 'Membeli kamera.'],
  [null, 'デパート', 'toserba', 'デパートで買う。', 'Membeli di toserba.'],
  [null, 'レストラン', 'restoran', 'レストランで食べる。', 'Makan di restoran.'],
  [null, 'ベッド', 'tempat tidur', 'ベッドで寝る。', 'Tidur di tempat tidur.'],
  [null, 'ドア', 'pintu', 'ドアを開ける。', 'Membuka pintu.'],
  ['窓', 'まど', 'jendela', '窓を開ける。', 'Membuka jendela.'],
  ['机', 'つくえ', 'meja', '机で書く。', 'Menulis di meja.'],
  ['椅子', 'いす', 'kursi', '椅子に座る。', 'Duduk di kursi.'],
];

// ---------------------------------------------------------------------------
// 2. Kanji N5: [kanji, artiID, gradeSD]
// on/kun diambil dari vendor/kanjidic-compact.json saat build (fallback di bawah).
// ---------------------------------------------------------------------------
const N5_KANJI = [
  ['一', 'satu', 1], ['二', 'dua', 1], ['三', 'tiga', 1], ['四', 'empat', 1],
  ['五', 'lima', 1], ['六', 'enam', 1], ['七', 'tujuh', 1], ['八', 'delapan', 1],
  ['九', 'sembilan', 1], ['十', 'sepuluh', 1], ['百', 'ratus', 1], ['千', 'ribu', 1],
  ['万', 'sepuluh ribu', 2], ['円', 'yen, lingkaran', 1],
  ['日', 'hari, matahari', 1], ['本', 'asal, buku, Jepang', 1], ['人', 'orang', 1],
  ['月', 'bulan, Senin', 1], ['火', 'api, Selasa', 1], ['水', 'air, Rabu', 1],
  ['木', 'pohon, Kamis', 1], ['金', 'emas, Jumat', 1], ['土', 'tanah, Sabtu', 1],
  ['曜', 'hari dalam seminggu', 2], ['年', 'tahun', 1], ['毎', 'setiap', 2],
  ['時', 'waktu, jam', 2], ['分', 'menit, membagi', 2], ['午', 'tengah hari', 2],
  ['前', 'depan, sebelum', 2], ['後', 'belakang, sesudah', 2],
  ['朝', 'pagi', 2], ['昼', 'siang', 2], ['夜', 'malam', 2], ['晩', 'petang', 2],
  ['今', 'sekarang', 2], ['昨', 'kemarin, lampau', 2], ['明', 'terang, besok', 2],
  ['上', 'atas', 1], ['下', 'bawah', 1], ['中', 'tengah, dalam', 1],
  ['右', 'kanan', 1], ['左', 'kiri', 1], ['東', 'timur', 2], ['西', 'barat', 2],
  ['南', 'selatan', 2], ['北', 'utara', 2], ['外', 'luar', 2], ['内', 'dalam', 2],
  ['名', 'nama', 1], ['国', 'negara', 2], ['語', 'bahasa, kata', 2],
  ['話', 'pembicaraan', 2], ['聞', 'mendengar', 2], ['読', 'membaca', 2],
  ['書', 'menulis', 2], ['山', 'gunung', 1], ['川', 'sungai', 1],
  ['田', 'sawah', 1], ['空', 'langit', 1], ['海', 'laut', 2],
  ['魚', 'ikan', 2], ['鳥', 'burung', 2], ['犬', 'anjing', 1],
  ['猫', 'kucing', 1], ['虫', 'serangga', 1], ['花', 'bunga', 1],
  ['雨', 'hujan', 1], ['雪', 'salju', 2], ['風', 'angin', 2],
  ['音', 'bunyi', 1], ['楽', 'musik, senang', 2], ['映', 'memproyeksikan', 2],
  ['画', 'gambar', 2], ['写', 'memotret, menyalin', 2], ['真', 'asli, benar', 2],
  ['手', 'tangan', 1], ['紙', 'kertas', 2], ['電', 'listrik', 2],
  ['車', 'mobil, kereta', 1], ['駅', 'stasiun', 2], ['道', 'jalan', 2],
  ['社', 'perusahaan, kuil', 2], ['校', 'sekolah', 1], ['生', 'lahir, hidup', 1],
  ['先', 'terdahulu, ujung', 1], ['師', 'guru, ahli', 2],
  ['父', 'ayah', 2], ['母', 'ibu', 2], ['姉', 'kakak perempuan', 2],
  ['兄', 'kakak laki-laki', 2], ['弟', 'adik laki-laki', 2], ['妹', 'adik perempuan', 2],
  ['家', 'rumah', 2], ['族', 'keluarga, suku', 2], ['友', 'teman', 2],
  ['達', 'jamak (manusia)', 2], ['室', 'ruangan', 2],
];
// Fallback on/kun bila kanjidic tidak tersedia saat build.
const KANJI_FALLBACK = {
  '一': { on: ['イチ', 'イツ'], kun: ['ひと', 'ひとつ'] }, '二': { on: ['ニ'], kun: ['ふた', 'ふたつ'] },
  '三': { on: ['サン'], kun: ['み', 'みっつ'] }, '四': { on: ['シ'], kun: ['よ', 'よっつ'] },
  '五': { on: ['ゴ'], kun: ['いつ', 'いつつ'] }, '六': { on: ['ロク'], kun: ['む', 'むっつ'] },
  '七': { on: ['シチ'], kun: ['なな', 'ななつ'] }, '八': { on: ['ハチ'], kun: ['や', 'やっつ'] },
  '九': { on: ['キュウ', 'ク'], kun: ['ここの', 'ここのつ'] }, '十': { on: ['ジュウ'], kun: ['とお'] },
  '日': { on: ['ニチ', 'ジツ'], kun: ['ひ', 'か'] }, '本': { on: ['ホン'], kun: ['もと'] },
  '人': { on: ['ジン', 'ニン'], kun: ['ひと'] },
};

// ---------------------------------------------------------------------------
// 3. Kana gojuon + dakuon + yoon (hiragana <-> katakana <-> romaji)
// ---------------------------------------------------------------------------
const GOJUON = [
  ['あ', 'ア', 'a'], ['い', 'イ', 'i'], ['う', 'ウ', 'u'], ['え', 'エ', 'e'], ['お', 'オ', 'o'],
  ['か', 'カ', 'ka'], ['き', 'キ', 'ki'], ['く', 'ク', 'ku'], ['け', 'ケ', 'ke'], ['こ', 'コ', 'ko'],
  ['さ', 'サ', 'sa'], ['し', 'シ', 'shi'], ['す', 'ス', 'su'], ['せ', 'セ', 'se'], ['そ', 'ソ', 'so'],
  ['た', 'タ', 'ta'], ['ち', 'チ', 'chi'], ['つ', 'ツ', 'tsu'], ['て', 'テ', 'te'], ['と', 'ト', 'to'],
  ['な', 'ナ', 'na'], ['に', 'ニ', 'ni'], ['ぬ', 'ヌ', 'nu'], ['ね', 'ネ', 'ne'], ['の', 'ノ', 'no'],
  ['は', 'ハ', 'ha'], ['ひ', 'ヒ', 'hi'], ['ふ', 'フ', 'fu'], ['へ', 'ヘ', 'he'], ['ほ', 'ホ', 'ho'],
  ['ま', 'マ', 'ma'], ['み', 'ミ', 'mi'], ['む', 'ム', 'mu'], ['め', 'メ', 'me'], ['も', 'モ', 'mo'],
  ['や', 'ヤ', 'ya'], ['ゆ', 'ユ', 'yu'], ['よ', 'ヨ', 'yo'],
  ['ら', 'ラ', 'ra'], ['り', 'リ', 'ri'], ['る', 'ル', 'ru'], ['れ', 'レ', 're'], ['ろ', 'ロ', 'ro'],
  ['わ', 'ワ', 'wa'], ['を', 'ヲ', 'wo'], ['ん', 'ン', 'n'],
];
const DAKUON = [
  ['が', 'ガ', 'ga'], ['ぎ', 'ギ', 'gi'], ['ぐ', 'グ', 'gu'], ['げ', 'ゲ', 'ge'], ['ご', 'ゴ', 'go'],
  ['ざ', 'ザ', 'za'], ['じ', 'ジ', 'ji'], ['ず', 'ズ', 'zu'], ['ぜ', 'ゼ', 'ze'], ['ぞ', 'ゾ', 'zo'],
  ['だ', 'ダ', 'da'], ['ぢ', 'ヂ', 'ji'], ['づ', 'ヅ', 'zu'], ['で', 'デ', 'de'], ['ど', 'ド', 'do'],
  ['ば', 'バ', 'ba'], ['び', 'ビ', 'bi'], ['ぶ', 'ブ', 'bu'], ['べ', 'ベ', 'be'], ['ぼ', 'ボ', 'bo'],
  ['ぱ', 'パ', 'pa'], ['ぴ', 'ピ', 'pi'], ['ぷ', 'プ', 'pu'], ['ぺ', 'ペ', 'pe'], ['ぽ', 'ポ', 'po'],
];
const YOON = [
  ['きゃ', 'キャ', 'kya'], ['きゅ', 'キュ', 'kyu'], ['きょ', 'キョ', 'kyo'],
  ['しゃ', 'シャ', 'sha'], ['しゅ', 'シュ', 'shu'], ['しょ', 'ショ', 'sho'],
  ['ちゃ', 'チャ', 'cha'], ['ちゅ', 'チュ', 'chu'], ['ちょ', 'チョ', 'cho'],
  ['にゃ', 'ニャ', 'nya'], ['にゅ', 'ニュ', 'nyu'], ['にょ', 'ニョ', 'nyo'],
  ['ひゃ', 'ヒャ', 'hya'], ['ひゅ', 'ヒュ', 'hyu'], ['ひょ', 'ヒョ', 'hyo'],
  ['みゃ', 'ミャ', 'mya'], ['みゅ', 'ミュ', 'myu'], ['みょ', 'ミョ', 'myo'],
  ['りゃ', 'リャ', 'rya'], ['りゅ', 'リュ', 'ryu'], ['りょ', 'リョ', 'ryo'],
  ['ぎゃ', 'ギャ', 'gya'], ['ぎゅ', 'ギュ', 'gyu'], ['ぎょ', 'ギョ', 'gyo'],
  ['じゃ', 'ジャ', 'ja'], ['じゅ', 'ジュ', 'ju'], ['じょ', 'ジョ', 'jo'],
  ['びゃ', 'ビャ', 'bya'], ['びゅ', 'ビュ', 'byu'], ['びょ', 'ビョ', 'byo'],
  ['ぴゃ', 'ピャ', 'pya'], ['ぴゅ', 'ピュ', 'pyu'], ['ぴょ', 'ピョ', 'pyo'],
];

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------
function main() {
  fs.mkdirSync(VENDOR, { recursive: true });
  fs.mkdirSync(KVG_DIR, { recursive: true });

  // on/kun dari kanjidic bila ada (offline, file lokal).
  let kanjidic = {};
  try {
    kanjidic = JSON.parse(fs.readFileSync(path.join(VENDOR, 'kanjidic-compact.json'), 'utf8'));
    console.log('kanjidic-compact.json terbaca: ' + Object.keys(kanjidic).length + ' kanji');
  } catch (e) {
    console.log('kanjidic-compact.json tidak ada — pakai fallback on/kun.');
  }

  // --- jlpt + id-gloss ---
  const jlpt = {};
  const gloss = {};
  for (const [k, r, id, exJa, exId] of N5_VOCAB) {
    if (k) { jlpt[k] = { level: 'N5' }; gloss[k] = { id, ex_ja: exJa, ex_id: exId, kana: r }; }
    if (r) { jlpt[r] = { level: 'N5' }; if (!gloss[r]) gloss[r] = { id, ex_ja: exJa, ex_id: exId, kana: r }; }
  }
  fs.writeFileSync(path.join(VENDOR, 'jlpt-n5.json'), JSON.stringify(jlpt));
  fs.writeFileSync(path.join(VENDOR, 'id-gloss-n5.json'), JSON.stringify(gloss));
  console.log('kosakata N5: ' + N5_VOCAB.length + ' entri');

  // --- kana map ---
  const kana = [];
  for (const [h, k, r] of GOJUON) kana.push({ kana: h, kata: k, romaji: r, type: 'gojuon' });
  for (const [h, k, r] of DAKUON) kana.push({ kana: h, kata: k, romaji: r, type: 'dakuon' });
  for (const [h, k, r] of YOON) kana.push({ kana: h, kata: k, romaji: r, type: 'yoon' });
  fs.writeFileSync(path.join(VENDOR, 'kana-map.json'), JSON.stringify(kana));
  console.log('kana: ' + kana.length + ' entri');

  // --- kanji N5 ---
  const kanji = {};
  for (const [ch, id, grade] of N5_KANJI) {
    const kd = kanjidic[ch] || {};
    const fb = KANJI_FALLBACK[ch] || {};
    kanji[ch] = {
      id,
      on: (kd.on && kd.on.length ? kd.on : (fb.on || [])).slice(0, 3),
      kun: (kd.kun && kd.kun.length ? kd.kun : (fb.kun || [])).slice(0, 3),
      grade,
      jlpt: 'N5',
    };
    // placeholder SVG: huruf besar + label N5 (diganti KanjiVG asli di Fase lanjutan)
    const cp = ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="140" viewBox="0 0 120 140">'
      + '<rect width="120" height="140" rx="14" fill="#f7f3e8"/>'
      + '<text x="60" y="88" text-anchor="middle" font-size="64" font-family="serif">' + ch + '</text>'
      + '<text x="60" y="122" text-anchor="middle" font-size="13" font-family="sans-serif" fill="#8a7a5c">N5 • U+' + cp + '</text>'
      + '</svg>';
    fs.writeFileSync(path.join(KVG_DIR, 'U' + cp + '.svg'), svg);
  }
  fs.writeFileSync(path.join(VENDOR, 'kanji-n5.json'), JSON.stringify(kanji));
  console.log('kanji N5: ' + Object.keys(kanji).length + ' + placeholder SVG');

  console.log('SELESAI — vendor/jlpt-n5.json, id-gloss-n5.json, kana-map.json, kanji-n5.json, kanjivg-n5/*.svg');
}

main();
