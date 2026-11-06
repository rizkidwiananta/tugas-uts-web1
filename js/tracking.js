document.addEventListener("DOMContentLoaded", () => {
  if (!proteksiHalaman()) return;

  const form = document.getElementById("formTracking");
  const inputDO = document.getElementById("inputDO");
  const hasil = document.getElementById("hasilTracking");

  const TAHAP = ["Dikonfirmasi", "Dikemas", "Dikirim", "Diantar", "Diterima"];

  /* ---------- 1. Ambil semua sumber data ---------- */
  function ambilSemuaPesanan() {
    let pesananLokal = [];
    try {
      pesananLokal = JSON.parse(localStorage.getItem("pesananToko") || "[]");
    } catch { pesananLokal = []; }
    const trackingAwal = Object.values(dataTracking).map(p => {
      const riwayat = (p.perjalanan || []).map(perjalanan => ({
        waktu: perjalanan.waktu,
        keterangan: perjalanan.keterangan,
        selesai: true
      }));

      return {
        noDO: p.nomorDO,
        namaPemesan: p.nama,
        status: p.status,
        progress: Math.min(100, riwayat.length * 20),
        ekspedisi: p.ekspedisi,
        layanan: "-",
        tanggalKirim: p.tanggalKirim,
        jenisPaket: p.paket,
        total: nilaiHarga(p.total),
        alamat: "-",
        riwayat
      };
    });
    return [...pesananLokal, ...trackingAwal];
  }

  /* ---------- 2. Cari pesanan berdasarkan nomor DO ---------- */
  function cariPesanan(noDO) {
    const kunci = noDO.trim().toUpperCase();
    return ambilSemuaPesanan().find(p => String(p.noDO).toUpperCase() === kunci);
  }

  /* ---------- 3. Render hasil pencarian ---------- */
  function renderHasil(data) {
    // Header
    document.getElementById("hasilNoDO").textContent = data.noDO;
    document.getElementById("hasilTanggal").textContent =
      `Dikirim: ${formatTanggal(data.tanggalKirim)}`;

    const badge = document.getElementById("hasilStatus");
    badge.textContent = data.status;
    badge.className = "badge " + (
      data.status === "Diterima" ? "badge--success" :
      ["Dalam Perjalanan", "Dikirim"].includes(data.status) ? "badge--info" :
      data.status === "Diproses" ? "badge--warning" : "badge--danger"
    );

    document.getElementById("hasilTotal").textContent = formatRupiah(data.total);

    // Progress bar
    const persen = Math.max(0, Math.min(100, Number(data.progress) || 0));
    document.getElementById("progressBar").style.width = persen + "%";
    document.getElementById("hasilPersen").textContent = persen + "%";
    const wrap = document.getElementById("progressWrap");
    wrap.setAttribute("aria-valuenow", persen);

    // Detail pengiriman
    document.getElementById("detailNama").textContent = data.namaPemesan;
    document.getElementById("detailEkspedisi").textContent = data.ekspedisi;
    document.getElementById("detailLayanan").textContent = data.layanan;
    document.getElementById("detailTanggal").textContent = formatTanggal(data.tanggalKirim);
    document.getElementById("detailPaket").textContent = data.jenisPaket;
    document.getElementById("detailTotal").textContent = formatRupiah(data.total);
    document.getElementById("detailAlamat").textContent = data.alamat || "-";

    // Stepper
    const stepper = document.getElementById("stepperTracking");
    stepper.innerHTML = "";
    const riwayat = data.riwayat || [];
    TAHAP.forEach((nama, i) => {
      const li = document.createElement("li");
      li.className = "stepper__item";

      const sudah = riwayat[i] ? riwayat[i].selesai : false;
      if (sudah) li.classList.add("is-done");
      else if (i > 0 && riwayat[i - 1] && riwayat[i - 1].selesai && !sudah) {
        li.classList.add("is-active");
      }

      li.innerHTML = `<span class="stepper__dot">${sudah ? "✓" : i + 1}</span>${nama}`;
      stepper.appendChild(li);
    });

    // Timeline riwayat
    const timeline = document.getElementById("timelineTracking");
    timeline.innerHTML = "";
    riwayat.forEach(r => {
      const li = document.createElement("li");
      if (r.selesai) li.classList.add("is-done");
      li.innerHTML = `
        <span class="timeline__dot"></span>
        <div>
          <strong>${esc(r.keterangan)}</strong>
          <span class="timeline__time">${esc(r.waktu)}</span>
        </div>`;
      timeline.appendChild(li);
    });

    // Tampilkan
    hasil.classList.remove("hidden");
    hasil.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ---------- 4. Submit form pencarian ---------- */
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    setFieldError("inputDO", "");

    const nilai = inputDO.value.trim();
    if (!nilai) {
      setFieldError("inputDO", "Nomor Delivery Order wajib diisi.");
      return;
    }

    const data = cariPesanan(nilai);
    if (!data) {
      hasil.classList.add("hidden");
      showAlert(
        `Nomor Delivery Order "${nilai}" tidak ditemukan. Pastikan nomor sudah benar.`,
        "Data Tidak Ditemukan", "error"
      );
      return;
    }

    renderHasil(data);
    showToast("Data pengiriman berhasil ditemukan.", "success");
  });

  /* ---------- 5. Tombol contoh nomor DO ---------- */
  document.querySelectorAll("[data-contoh]").forEach(btn => {
    btn.addEventListener("click", () => {
      inputDO.value = btn.dataset.contoh;
      form.requestSubmit();
    });
  });
});