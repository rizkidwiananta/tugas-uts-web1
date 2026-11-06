document.addEventListener("DOMContentLoaded", () => {
  if (!proteksiHalaman()) return;

  const tbody = document.getElementById("tabelKatalog");
  const inputCari = document.getElementById("cariBuku");
  const selectKategori = document.getElementById("filterKategori");

  /* ---------- 1. Isi dropdown jenis buku dari data ---------- */
  const jenisUnik = [...new Set(dataKatalogBuku.map(b => b.jenisBarang))];
  jenisUnik.forEach(jenis => {
    const opt = document.createElement("option");
    opt.value = jenis;
    opt.textContent = jenis;
    selectKategori.appendChild(opt);
  });

  /* ---------- 2. Fungsi membuat satu baris <tr> (DOM API) ---------- */
  function buatBarisBuku(buku, nomor) {
    const tr = document.createElement("tr");
    tr.dataset.id = buku.kodeBarang;

    // Kolom nomor
    const tdNo = document.createElement("td");
    tdNo.textContent = nomor;

    // Kolom buku (cover + nama + edisi)
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
      // Jika file gambar tidak tersedia, hapus <img> → inisial tetap tampil
      img.addEventListener("error", () => img.remove());
      cover.appendChild(img);
    }

    const teks = document.createElement("div");
    const judul = document.createElement("strong");
    judul.textContent = buku.namaBarang;
    const edisi = document.createElement("small");
    edisi.textContent = `Kode ${buku.kodeBarang} · Edisi ${buku.edisi}`;
    teks.append(judul, edisi);
    info.append(cover, teks);
    tdBuku.appendChild(info);

    // Kategori
    const tdKategori = document.createElement("td");
    tdKategori.textContent = buku.jenisBarang;

    // Harga
    const tdHarga = document.createElement("td");
    tdHarga.textContent = formatRupiah(buku.harga);

    // Stok
    const tdStok = document.createElement("td");
    tdStok.textContent = buku.stok;

    // Status
    const tdStatus = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = "badge";
    if (buku.stok === 0) {
      badge.classList.add("badge--danger");
      badge.textContent = "Habis";
    } else if (buku.stok <= 5) {
      badge.classList.add("badge--warning");
      badge.textContent = "Menipis";
    } else {
      badge.classList.add("badge--success");
      badge.textContent = "Tersedia";
    }
    tdStatus.appendChild(badge);

    // Aksi (hapus)
    const tdAksi = document.createElement("td");
    const btnHapus = document.createElement("button");
    btnHapus.type = "button";
    btnHapus.className = "btn btn--danger btn--sm";
    btnHapus.textContent = "Hapus";
    btnHapus.dataset.aksi = "hapus";
    tdAksi.appendChild(btnHapus);

    tr.append(tdNo, tdBuku, tdKategori, tdHarga, tdStok, tdStatus, tdAksi);
    return tr;
  }

  /* ---------- 3. Render seluruh tabel ---------- */
  function renderTabel(daftar = dataKatalogBuku) {
    tbody.innerHTML = ""; // kosongkan dulu
    if (!daftar.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 7;
      td.textContent = "Tidak ada buku yang cocok dengan pencarian.";
      td.style.textAlign = "center";
      td.style.color = "var(--muted)";
      td.style.padding = "2rem";
      tr.appendChild(td);
      tbody.appendChild(tr);
    } else {
      daftar.forEach((buku, i) => tbody.appendChild(buatBarisBuku(buku, i + 1)));
    }
    perbaruiRingkasan();
  }

  /* ---------- 4. Ringkasan angka ---------- */
  function perbaruiRingkasan() {
    document.getElementById("ringkasJudul").textContent = dataKatalogBuku.length;
    document.getElementById("ringkasStok").textContent =
      dataKatalogBuku.reduce((n, b) => n + b.stok, 0);
    document.getElementById("ringkasMenipis").textContent =
      dataKatalogBuku.filter(b => b.stok <= 5).length;
  }

  /* ---------- 5. Filter + pencarian ---------- */
  function terapkanFilter() {
    const kata = inputCari.value.trim().toLowerCase();
    const jenis = selectKategori.value;

    const hasil = dataKatalogBuku.filter(b => {
      const cocokKata = !kata ||
        b.namaBarang.toLowerCase().includes(kata) ||
        b.kodeBarang.toLowerCase().includes(kata);
      const cocokJenis = !jenis || b.jenisBarang === jenis;
      return cocokKata && cocokJenis;
    });

    renderTabel(hasil);
  }

  inputCari.addEventListener("input", terapkanFilter);
  selectKategori.addEventListener("change", terapkanFilter);

  /* ---------- 6. Hapus baris (event delegation) ---------- */
  tbody.addEventListener("click", (e) => {
    const btn = e.target.closest('[data-aksi="hapus"]');
    if (!btn) return;

    const tr = btn.closest("tr");
    const id = tr.dataset.id;
    const buku = dataKatalogBuku.find(b => b.kodeBarang === id);
    if (!buku) return;

    if (confirm(`Hapus buku "${buku.namaBarang}" dari katalog?`)) {
      // hapus dari array
      const index = dataKatalogBuku.findIndex(b => b.kodeBarang === id);
      if (index > -1) dataKatalogBuku.splice(index, 1);

      // hapus elemen baris dari DOM
      simpanKatalog();
      tr.remove();

      // perbarui nomor urut & ringkasan
      [...tbody.querySelectorAll("tr")].forEach((row, i) => {
        if (row.cells.length) row.cells[0].textContent = i + 1;
      });
      perbaruiRingkasan();

      showToast(`Buku "${buku.namaBarang}" berhasil dihapus.`, "success");
    }
  });

  /* ---------- 7. Form tambah buku ---------- */
  const formTambah = document.getElementById("formTambahBuku");
  const inputGambar = document.getElementById("gambarBaru");
  const pratinjauGambar = document.getElementById("pratinjauGambar");
  let urlPratinjau = "";

  inputGambar.addEventListener("change", () => {
    const file = inputGambar.files[0];
    clearFormErrors(formTambah);
    if (urlPratinjau) URL.revokeObjectURL(urlPratinjau);
    urlPratinjau = "";
    pratinjauGambar.hidden = true;
    pratinjauGambar.removeAttribute("src");

    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFieldError("gambarBaru", "File harus berupa gambar.");
      inputGambar.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFieldError("gambarBaru", "Ukuran gambar maksimal 5 MB.");
      inputGambar.value = "";
      return;
    }

    urlPratinjau = URL.createObjectURL(file);
    pratinjauGambar.src = urlPratinjau;
    pratinjauGambar.hidden = false;
  });

  /* =========================================================
     FUNGSI YANG DIPERBAIKI: Kompresi gambar ketat via Canvas
     ========================================================= */
  async function siapkanGambar(file) {
    if (!file) return "";

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Batas maksimal resolusi gambar (dikecilkan agar muat di localStorage)
          const MAX_WIDTH = 300;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          // Hitung rasio aspek agar gambar tidak gepeng/terdistorsi
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          // Gambar ulang ke Canvas dengan ukuran baru
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Browser tidak mendukung pemrosesan gambar."));
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // Ubah ke Base64 JPEG dengan kualitas 60% (sangat kecil tapi tetap jelas)
          resolve(canvas.toDataURL("image/jpeg", 0.6));
        };
        img.onerror = () => reject(new Error("Gagal memuat gambar"));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error("Gagal membaca file"));
      reader.readAsDataURL(file);
    });
  }

  formTambah.addEventListener("reset", () => {
    if (urlPratinjau) URL.revokeObjectURL(urlPratinjau);
    urlPratinjau = "";
    pratinjauGambar.hidden = true;
    pratinjauGambar.removeAttribute("src");
  });

  formTambah.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearFormErrors(formTambah);

    const namaBarang = document.getElementById("judulBaru").value.trim();
    const jenisBarang = document.getElementById("jenisBarangBaru").value;
    const edisi = document.getElementById("edisiBaru").value.trim();
    const harga = Number(document.getElementById("hargaBaru").value);
    const stok = Number(document.getElementById("stokBaru").value);
    const fileGambar = inputGambar.files[0];

    let valid = true;
    if (namaBarang.length < 3) { setFieldError("judulBaru", "Nama buku minimal 3 karakter."); valid = false; }
    if (!jenisBarang) { setFieldError("jenisBarangBaru", "Jenis buku wajib dipilih."); valid = false; }
    if (!edisi) { setFieldError("edisiBaru", "Edisi wajib diisi."); valid = false; }
    if (!harga || harga < 1000) { setFieldError("hargaBaru", "Harga minimal Rp 1.000."); valid = false; }
    if (isNaN(stok) || stok < 0) { setFieldError("stokBaru", "Stok tidak boleh negatif."); valid = false; }
    if (fileGambar && (!fileGambar.type.startsWith("image/") || fileGambar.size > 5 * 1024 * 1024)) {
      setFieldError("gambarBaru", "Pilih file gambar dengan ukuran maksimal 5 MB.");
      valid = false;
    }
    if (!valid) return;

    let gambar = "";
    try {
      gambar = await siapkanGambar(fileGambar);
    } catch {
      setFieldError("gambarBaru", "Gambar tidak dapat diproses. Coba pilih gambar lain.");
      return;
    }

    // Buat kode baru yang tidak bentrok dengan kode katalog.
    let nomorKode = dataKatalogBuku.length + 1;
    let kodeBarang = `BUKU${String(nomorKode).padStart(4, "0")}`;
    while (dataKatalogBuku.some(buku => buku.kodeBarang === kodeBarang)) {
      nomorKode++;
      kodeBarang = `BUKU${String(nomorKode).padStart(4, "0")}`;
    }
    const bukuBaru = {
      kodeBarang,
      namaBarang,
      jenisBarang,
      edisi,
      harga: formatRupiah(harga),
      stok,
      cover: gambar
    };

    // Simpan ke array data
    dataKatalogBuku.push(bukuBaru);
    try {
      simpanKatalog();
    } catch {
      dataKatalogBuku.pop();
      showToast("Data katalog tidak dapat disimpan. Periksa ruang penyimpanan browser.", "error");
      return;
    }

    // Tambahkan baris ke DOM (DOM manipulation)
    terapkanFilter();

    // Opsional: tambahkan jenis buku baru ke dropdown filter
    if (![...selectKategori.options].some(o => o.value === jenisBarang)) {
      const opt = document.createElement("option");
      opt.value = jenisBarang;
      opt.textContent = jenisBarang;
      selectKategori.appendChild(opt);
    }

    formTambah.reset();
    closeModal("modalTambahBuku");
    showToast(`Buku "${namaBarang}" berhasil ditambahkan ke katalog.`, "success");
  });

  /* ---------- 8. Render awal ---------- */
  renderTabel();
});