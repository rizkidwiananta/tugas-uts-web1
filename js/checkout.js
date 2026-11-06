document.addEventListener("DOMContentLoaded", () => {
  if (!proteksiHalaman()) return;

  const ONGKIR = 15000;
  const GRATIS_ONGKIR_MIN = 200000;

  let keranjang = []; // [{ idBuku, qty }]

  const tbody = document.getElementById("tabelKeranjang");
  const selectBuku = document.getElementById("pilihBuku");
  const form = document.getElementById("formCheckout");

  /* ---------- 1. Muat keranjang dari localStorage / data awal ---------- */
  function muatKeranjang() {
    try {
      const simpan = JSON.parse(localStorage.getItem("cartToko") || "null");
      keranjang = Array.isArray(simpan) && simpan.length
        ? simpan
        : [];
    } catch {
      keranjang = [];
    }
  }

  function simpanKeranjang() {
    localStorage.setItem("cartToko", JSON.stringify(keranjang));
  }

  /* Buang item yang bukunya terhapus / qty melebihi stok */
  function bersihkanKeranjang() {
    keranjang = keranjang.filter(i => dataKatalogBuku.some(b => b.kodeBarang === i.idBuku && b.stok > 0));
    keranjang.forEach(i => { i.qty = Math.min(i.qty, dataKatalogBuku.find(b => b.kodeBarang === i.idBuku).stok); });
  }

  /* ---------- 2. Isi dropdown pilihan buku ---------- */
  function isiDropdown() {
    selectBuku.innerHTML = "";
    dataKatalogBuku.forEach(b => {
      const opt = document.createElement("option");
      opt.value = b.kodeBarang;
      opt.textContent = `${b.namaBarang} — ${formatRupiah(b.harga)} (stok ${b.stok})`;
      opt.disabled = b.stok === 0;
      selectBuku.appendChild(opt);
    });
  }

  /* ---------- 3. Render tabel keranjang ---------- */
  function renderKeranjang() {
    tbody.innerHTML = "";

    if (!keranjang.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 5;
      td.textContent = "Keranjang masih kosong. Silakan tambahkan buku di atas.";
      td.style.textAlign = "center";
      td.style.padding = "2rem";
      td.style.color = "var(--muted)";
      tr.appendChild(td);
      tbody.appendChild(tr);
      perbaruiRingkasan();
      return;
    }

    keranjang.forEach(item => {
      const buku = dataKatalogBuku.find(b => b.kodeBarang === item.idBuku);
      if (!buku) return;

      const tr = document.createElement("tr");
      tr.dataset.id = item.idBuku;

      // Kolom buku
      const tdBuku = document.createElement("td");
      const info = document.createElement("div");
      info.className = "buku-info";

      const cover = document.createElement("div");
      cover.className = "cover";
      cover.textContent = inisial(buku.namaBarang, 2);

      if (buku.cover) {
        const img = document.createElement("img");
        img.src = buku.cover;
        img.alt = `Sampul ${buku.namaBarang}`;
        img.addEventListener("error", () => img.remove());
        cover.appendChild(img);
      }

      const teks = document.createElement("div");
      const judul = document.createElement("strong");
      judul.textContent = buku.namaBarang;
      const penulis = document.createElement("small");
      penulis.textContent = `${buku.jenisBarang} · Edisi ${buku.edisi}`;
      teks.append(judul, penulis);
      info.append(cover, teks);
      tdBuku.appendChild(info);

      // Harga
      const tdHarga = document.createElement("td");
      tdHarga.textContent = formatRupiah(buku.harga);

      // Qty
      const tdQty = document.createElement("td");
      const qty = document.createElement("div");
      qty.className = "qty";
      qty.innerHTML = `
        <button type="button" data-aksi="kurang" aria-label="Kurangi jumlah">−</button>
        <span>${item.qty}</span>
        <button type="button" data-aksi="tambah" aria-label="Tambah jumlah">+</button>`;
      tdQty.appendChild(qty);

      // Subtotal
      const tdSub = document.createElement("td");
      tdSub.textContent = formatRupiah(nilaiHarga(buku.harga) * item.qty);

      // Aksi
      const tdAksi = document.createElement("td");
      const btnHapus = document.createElement("button");
      btnHapus.type = "button";
      btnHapus.className = "btn btn--danger btn--sm";
      btnHapus.dataset.aksi = "hapus";
      btnHapus.textContent = "Hapus";
      tdAksi.appendChild(btnHapus);

      tr.append(tdBuku, tdHarga, tdQty, tdSub, tdAksi);
      tbody.appendChild(tr);
    });

    perbaruiRingkasan();
  }

  /* ---------- 4. Hitung & tampilkan ringkasan ---------- */
  function hitungTotal() {
    let subtotal = 0;
    let jumlahItem = 0;
    keranjang.forEach(item => {
      const buku = dataKatalogBuku.find(b => b.kodeBarang === item.idBuku);
      if (!buku) return;
      subtotal += nilaiHarga(buku.harga) * item.qty;
      jumlahItem += item.qty;
    });
    const ongkir = subtotal === 0 ? 0 : (subtotal >= GRATIS_ONGKIR_MIN ? 0 : ONGKIR);
    return { subtotal, ongkir, jumlahItem, total: subtotal + ongkir };
  }

  function perbaruiRingkasan() {
    const { subtotal, ongkir, jumlahItem, total } = hitungTotal();
    document.getElementById("ringkasSubtotal").textContent = formatRupiah(subtotal);
    document.getElementById("ringkasOngkir").textContent = ongkir === 0 && subtotal > 0
      ? "GRATIS" : formatRupiah(ongkir);
    document.getElementById("ringkasItem").textContent = jumlahItem;
    document.getElementById("ringkasTotal").textContent = formatRupiah(total);
    document.getElementById("jumlahItem").textContent = `${jumlahItem} item`;
  }

  /* ---------- 5. Aksi tambah / kurang / hapus item ---------- */
  tbody.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-aksi]");
    if (!btn) return;

    const tr = btn.closest("tr");
    const id = tr.dataset.id;
    const item = keranjang.find(i => i.idBuku === id);
    const buku = dataKatalogBuku.find(b => b.kodeBarang === id);
    if (!item || !buku) return;

    const aksi = btn.dataset.aksi;

    if (aksi === "tambah") {
      if (item.qty >= buku.stok) {
        showToast(`Stok "${buku.namaBarang}" hanya ${buku.stok} buah.`, "error");
        return;
      }
      item.qty++;
    } else if (aksi === "kurang") {
      item.qty--;
      if (item.qty <= 0) {
        keranjang = keranjang.filter(i => i.idBuku !== id);
      }
    } else if (aksi === "hapus") {
      keranjang = keranjang.filter(i => i.idBuku !== id);
      showToast(`"${buku.namaBarang}" dihapus dari pesanan.`, "info");
    }

    simpanKeranjang();
    renderKeranjang();
  });

  /* ---------- 6. Tombol tambah buku ke keranjang ---------- */
  document.getElementById("btnTambahItem").addEventListener("click", () => {
    const id = selectBuku.value;
    if (!id) {
      showToast("Pilih buku terlebih dahulu.", "error");
      return;
    }
    const buku = dataKatalogBuku.find(b => b.kodeBarang === id);
    if (!buku || buku.stok === 0) {
      showToast("Buku ini sedang tidak tersedia.", "error");
      return;
    }

    const ada = keranjang.find(i => i.idBuku === id);
    if (ada) {
      if (ada.qty >= buku.stok) {
        showToast(`Stok "${buku.namaBarang}" hanya ${buku.stok} buah.`, "error");
        return;
      }
      ada.qty++;
      showToast(`Jumlah "${buku.namaBarang}" ditambah.`, "success");
    } else {
      keranjang.push({ idBuku: id, qty: 1 });
      showToast(`"${buku.namaBarang}" ditambahkan ke pesanan.`, "success");
    }

    simpanKeranjang();
    renderKeranjang();
  });

  /* ---------- 7. Info metode pembayaran ---------- */
  const infoPembayaran = document.getElementById("infoPembayaran");
  const teksMetode = {
    "Transfer Bank": "Transfer ke BCA 1234567890 a.n. Toko Buku Cendekia. Konfirmasi otomatis setelah pembayaran.",
    "E-Wallet": "Pembayaran melalui GoPay / OVO / Dana ke nomor 0812-3456-7890.",
    "COD": "Bayar tunai kepada kurir saat paket tiba di alamat Anda."
  };
  document.querySelectorAll('input[name="metodeBayar"]').forEach(radio => {
    radio.addEventListener("change", () => {
      infoPembayaran.textContent = teksMetode[radio.value] || "";
      setFieldError("metodeBayar", "");
    });
  });

  /* ---------- 8. Validasi & submit pesanan ---------- */
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearFormErrors(form);

    const nama = document.getElementById("namaPemesan").value.trim();
    const telepon = document.getElementById("teleponPemesan").value.trim();
    const email = document.getElementById("emailPemesan").value.trim();
    const alamat = document.getElementById("alamatPemesan").value.trim();
    const metode = document.querySelector('input[name="metodeBayar"]:checked');

    let valid = true;

    if (keranjang.length === 0) {
      showAlert("Keranjang masih kosong. Tambahkan minimal satu buku sebelum membuat pesanan.",
                "Pesanan Belum Lengkap", "error");
      return;
    }
    if (nama.length < 3) { setFieldError("namaPemesan", "Nama minimal 3 karakter."); valid = false; }
    if (!isTeleponValid(telepon)) { setFieldError("teleponPemesan", "Nomor telepon harus 10–14 digit angka."); valid = false; }
    if (!isEmailValid(email)) { setFieldError("emailPemesan", "Format email tidak valid."); valid = false; }
    if (alamat.length < 10) { setFieldError("alamatPemesan", "Alamat minimal 10 karakter agar kurir mudah menemukan."); valid = false; }
    if (!metode) { setFieldError("metodeBayar", "Pilih salah satu metode pembayaran."); valid = false; }

    if (!valid) {
      showToast("Periksa kembali data yang Anda isi.", "error");
      return;
    }

    // ---- Bangun objek pesanan (bentuknya sama dengan dataTracking) ----
    const { subtotal, ongkir, total, jumlahItem } = hitungTotal();
    const sekarang = new Date();
    const noDO = "DO-" + sekarang.getFullYear() + "-" +
                 String(Math.floor(Math.random() * 9000) + 1000);

    const items = keranjang.map(i => {
      const b = dataKatalogBuku.find(x => x.kodeBarang === i.idBuku);
      return { idBuku: i.idBuku, judul: b.namaBarang, harga: nilaiHarga(b.harga), qty: i.qty };
    });

    const pesanan = {
      noDO,
      namaPemesan: nama,
      telepon,
      email,
      alamat,
      catatan: document.getElementById("catatanPemesan").value.trim(),
      metodeBayar: metode.value,
      ekspedisi: "JNE Express",
      layanan: "Reguler (2-3 hari)",
      tanggalKirim: sekarang.toISOString().slice(0, 10),
      jenisPaket: `Paket Buku (${jumlahItem} item)`,
      items,
      subtotal,
      ongkir,
      total,
      status: "Diproses",
      progress: 25,
      riwayat: [
        { waktu: sekarang.toLocaleString("id-ID"), keterangan: "Pesanan dibuat & menunggu pembayaran", selesai: true },
        { waktu: "-", keterangan: "Pembayaran dikonfirmasi", selesai: false },
        { waktu: "-", keterangan: "Paket diserahkan ke ekspedisi", selesai: false },
        { waktu: "-", keterangan: "Paket dalam perjalanan", selesai: false },
        { waktu: "-", keterangan: "Paket diterima penerima", selesai: false }
      ]
    };

    // ---- Simpan ke localStorage ----
    let semuaPesanan = [];
    try { semuaPesanan = JSON.parse(localStorage.getItem("pesananToko") || "[]"); }
    catch { semuaPesanan = []; }
    semuaPesanan.unshift(pesanan);
    localStorage.setItem("pesananToko", JSON.stringify(semuaPesanan));

    // ---- Kurangi stok katalog ----
    items.forEach(i => {
      const b = dataKatalogBuku.find(x => x.kodeBarang === i.idBuku);
      if (b) b.stok = Math.max(0, b.stok - i.qty);
    });
    simpanKatalog();

    // ---- Bersihkan keranjang ----
    keranjang = [];
    localStorage.removeItem("cartToko");

    // ---- Tampilkan pop-up sukses ----
    showAlert(
      `Pesanan Anda berhasil dibuat.\n\nNomor Delivery Order: ${noDO}\n\n` +
      `Simpan nomor ini dan gunakan pada halaman Tracking Pengiriman untuk memantau paket.`,
      "Pesanan Berhasil! 🎉", "success"
    );

    form.reset();
    isiDropdown();
    infoPembayaran.textContent = "Silakan pilih salah satu metode pembayaran.";
    renderKeranjang();
  });

  /* ---------- 9. Inisialisasi ---------- */
  muatKeranjang();
  bersihkanKeranjang();
  isiDropdown();
  renderKeranjang();
});