document.addEventListener("DOMContentLoaded", () => {
  if (!proteksiHalaman()) return;

  /* ---------- 1. GREETING BERDASARKAN WAKTU LOKAL ---------- */
  const user = getUserAktif();
  const { teks, icon } = getGreeting();
  const namaDepan = user ? user.nama.split(" ")[0] : "Pengguna";

  const opsiTanggal = { weekday: "long", day: "numeric", month: "long", year: "numeric" };
  const tanggal = new Date().toLocaleDateString("id-ID", opsiTanggal);

  document.getElementById("greetingTeks").textContent = `${teks}, ${namaDepan} ${icon}`;
  document.getElementById("greetingSub").textContent =
    `Hari ini ${tanggal}. Ada ${dataKatalogBuku.length} judul buku yang bisa kamu jelajahi.`;

  /* ---------- 2. STATISTIK RINGKASAN ---------- */
  const totalStok = dataKatalogBuku.reduce((n, b) => n + b.stok, 0);
  const stokMenipis = dataKatalogBuku.filter(b => b.stok <= 5).length;

  let pesananLokal = [];
  try { pesananLokal = JSON.parse(localStorage.getItem("pesananToko") || "[]"); }
  catch { pesananLokal = []; }

  document.getElementById("statJudul").textContent = dataKatalogBuku.length;
  document.getElementById("statStok").textContent = totalStok;
  document.getElementById("statMenipis").textContent = stokMenipis;
  const pesananAwal = Object.values(dataTracking).map(p => ({
    noDO: p.nomorDO,
    tanggal: p.tanggalKirim,
    namaPemesan: p.nama,
    items: [],
    total: nilaiHarga(p.total),
    status: p.status
  }));
  document.getElementById("statPesanan").textContent = pesananAwal.length + pesananLokal.length;

  /* ---------- 3. GABUNGKAN DATA PESANAN ---------- */
  // Pesanan baru hasil checkout disimpan di localStorage dengan bentuk berbeda,
  // jadi kita normalisasi agar bisa ditampilkan pada laporan.
  const pesananBaru = pesananLokal.map(p => ({
    noDO: p.noDO,
    tanggal: p.tanggalKirim,
    namaPemesan: p.namaPemesan,
    items: (p.items || []).map(i => `${i.judul} ×${i.qty}`),
    total: p.total,
    status: p.status
  }));

  const semuaPesanan = [...pesananBaru, ...pesananAwal]
    .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

  /* ---------- 4. RENDER LAPORAN PEMESANAN ---------- */
  const tbodyLaporan = document.getElementById("isiLaporan");
  let grandTotal = 0;

  semuaPesanan.forEach(p => {
    grandTotal += nilaiHarga(p.total);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${esc(p.noDO)}</strong></td>
      <td>${formatTanggal(p.tanggal)}</td>
      <td>${esc(p.namaPemesan)}</td>
      <td>${formatRupiah(p.total)}</td>
      <td>${badgeStatus(p.status)}</td>`;
    tbodyLaporan.appendChild(tr);
  });

  document.getElementById("grandTotalLaporan").textContent = formatRupiah(grandTotal);

  /* ---------- 5. RENDER HISTORY TRANSAKSI ---------- */
  const wrapRiwayat = document.getElementById("isiRiwayat");

  semuaPesanan.forEach(p => {
    const item = document.createElement("article");
    item.style.cssText = "border:1px solid var(--border);border-radius:12px;padding:1rem;margin-bottom:.85rem";
    item.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;align-items:center">
        <div>
          <strong>${esc(p.noDO)}</strong>
          <div class="text-muted" style="font-size:.8rem">${formatTanggal(p.tanggal)} · ${esc(p.namaPemesan)}</div>
        </div>
        <div style="text-align:right">
          <div style="font-weight:700">${formatRupiah(p.total)}</div>
          <div style="margin-top:.25rem">${badgeStatus(p.status)}</div>
        </div>
      </div>
      ${p.items.length
        ? `<ul style="margin:.7rem 0 0 1.1rem;font-size:.85rem;color:var(--muted)">${p.items.map(i => `<li>${esc(i)}</li>`).join("")}</ul>`
        : ""}`;
    wrapRiwayat.appendChild(item);
  });

  if (!semuaPesanan.length) {
    wrapRiwayat.innerHTML = `<p class="text-muted">Belum ada transaksi.</p>`;
  }
});

/* ---------- Helper: badge status ---------- */
function badgeStatus(status) {
  const map = {
    "Diterima":         "badge--success",
    "Dalam Perjalanan": "badge--info",
    "Dikirim":           "badge--info",
    "Diproses":         "badge--warning",
    "Dibatalkan":       "badge--danger"
  };
  return `<span class="badge ${map[status] || "badge--info"}">${esc(status)}</span>`;
}