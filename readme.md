# Toko Buku Cendekia - UTS Pemrograman Web 1

**NAMA :** RIZKI DWI ANANATA  
**NIM :** 312510369  
**KELAS :** I251D  

🎥 **Video Presentasi UTS (YouTube):** [Tonton di sini](https://youtu.be/nrigmSJMvfw?si=bDcYvYC7N1nGbK3p)

---

Aplikasi web sederhana untuk pemesanan buku secara online. Proyek ini dibuat untuk memenuhi tugas Ujian Tengah Semester (UTS) mata kuliah Pemrograman Web 1.

Aplikasi ini berfokus murni pada sisi *front-end* (HTML, CSS, dan Vanilla JavaScript) tanpa menggunakan *server* atau *database* (back-end). Semua data dummy (buku, user, dan tracking) disimpan dalam format Array JSON di dalam file JavaScript, dan simulasi penyimpanan data (seperti keranjang dan pesanan baru) menggunakan `localStorage` bawaan browser.

## 🚀 Fitur Utama

1. **Halaman Login (`index.html`)**
   - Validasi input email dan password.
   - Menampilkan *pop-up/alert box* jika login gagal.
   - Fitur "Lupa Password" dan "Daftar Akun" menggunakan *Modal Box*.
   - Menyimpan sesi login pengguna menggunakan `localStorage`.

2. **Dashboard (`dashboard.html`)**
   - Menampilkan sapaan (*greeting*) otomatis (Pagi/Siang/Sore/Malam) berdasarkan waktu lokal perangkat.
   - Navigasi ke seluruh halaman utama.
   - Menampilkan statistik total buku dan stok.
   - Modal box untuk "Laporan Pemesanan" dan "History Transaksi".

3. **Informasi Stok / Katalog (`stok.html`)**
   - Menampilkan data buku secara dinamis dari `data.js`.
   - Fitur pencarian dan filter berdasarkan jenis buku.
   - Fitur **Tambah Buku Baru** yang memanipulasi DOM secara langsung.
   - Dilengkapi fitur unggah gambar sampul dengan **kompresi otomatis (Canvas API)** agar ukuran gambar kecil dan aman disimpan di `localStorage`.

4. **Halaman Pemesanan / Checkout (`checkout.html`)**
   - Sistem keranjang belanja dinamis (tambah, ubah jumlah, hapus).
   - Perhitungan subtotal, ongkos kirim, dan total bayar secara *real-time*.
   - Form informasi pemesan dan pilihan metode pembayaran dengan validasi ketat.
   - Membuat Nomor Delivery Order (DO) unik yang otomatis terhubung ke halaman Tracking.

5. **Tracking Pengiriman (`tracking.html`)**
   - Pencarian paket berdasarkan Nomor Delivery Order (DO).
   - Menampilkan status pengiriman menggunakan **Progress Bar** dan **Stepper**.
   - Menampilkan detail ekspedisi dan **Timeline Riwayat** perjalanan paket.
   - Data tracking baru dari proses checkout otomatis dapat dilacak di sini.

## 🛠️ Teknologi yang Digunakan
- **HTML5** (Struktur semantik: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`)
- **CSS3** (Custom properties/Variabel, Flexbox, Grid, Animasi, Responsive design)
- **JavaScript (ES6)** (DOM Manipulation, Event Delegation, Array methods, JSON, LocalStorage)

## 📂 Struktur Folder

```text
tugas-uts-web1/
│
├── index.html          # Halaman Login
├── dashboard.html      # Halaman Dashboard Menu
├── stok.html           # Halaman Informasi Stok / Katalog
├── checkout.html       # Halaman Pemesanan
├── tracking.html       # Halaman Tracking Pengiriman
│
├── css/
│   ├── style.css       # Gaya utama aplikasi
│   └── enhance.css     # Gaya tambahan (animasi, dark mode, dll)
│
├── js/
│   ├── data.js         # Kumpulan data dummy (Array JSON)
│   ├── script.js       # Fungsi global (helper, modal, alert, tema)
│   ├── login.js        # Logika halaman login
│   ├── dashboard.js    # Logika halaman dashboard
│   ├── stok.js         # Logika halaman katalog & manipulasi DOM
│   ├── checkout.js     # Logika keranjang dan pembuatan pesanan
│   └── tracking.js     # Logika pencarian Delivery Order
│
└── img/                # Folder aset gambar sampul buku
    ├── pengantar_komunikasi.jpg
    ├── manajemen_keuangan.jpg
    ├── kepemimpinan.jpg
    ├── mikrobiologi.jpg
    └── paud_perkembangan.jpg