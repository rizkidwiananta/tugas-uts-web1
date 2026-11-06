/* ---------- 1. Utilitas singkat ---------- */
const $  = (sel, parent = document) => parent.querySelector(sel);
const $$ = (sel, parent = document) => [...parent.querySelectorAll(sel)];

/* Format angka menjadi Rupiah */
function formatRupiah(angka) {
  return "Rp " + nilaiHarga(angka).toLocaleString("id-ID");
}

function nilaiHarga(harga) {
  if (typeof harga === "number") return Number.isFinite(harga) ? harga : 0;
  const angka = Number(String(harga ?? "").replace(/[^\d-]/g, ""));
  return Number.isFinite(angka) ? angka : 0;
}

/* Format tanggal ISO -> "12 Mei 2024" */
function formatTanggal(iso) {
  if (!iso) return "-";
  const bulan = ["Januari","Februari","Maret","April","Mei","Juni",
                 "Juli","Agustus","September","Oktober","November","Desember"];
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
}

/* Inisial nama untuk avatar / cover buku */
function inisial(teks, panjang = 2) {
  return String(teks || "?").trim().split(/\s+/).slice(0, panjang)
    .map(k => k[0]).join("").toUpperCase();
}

/* Escape HTML agar input pengguna tidak bisa menyisipkan tag */
function esc(t) {
  return String(t ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}

/* ---------- 2. Tema (terang/gelap) ---------- */
function terapkanTema(tema) {
  document.documentElement.dataset.tema = tema;
  const btn = document.getElementById("btnTema");
  if (btn) btn.textContent = tema === "dark" ? "☀️" : "🌙";
}

function toggleTema() {
  const sekarang = document.documentElement.dataset.tema === "dark" ? "dark" : "light";
  const baru = sekarang === "dark" ? "light" : "dark";
  localStorage.setItem("tema", baru);
  terapkanTema(baru);
  showToast(`Tema ${baru === "dark" ? "gelap" : "terang"} diaktifkan`, "info");
}

/* ---------- 3. Greeting berdasarkan jam lokal ---------- */
function getGreeting() {
  const jam = new Date().getHours();
  if (jam >= 4 && jam < 11)  return { teks: "Selamat pagi",  icon: "🌅" };
  if (jam >= 11 && jam < 15) return { teks: "Selamat siang", icon: "☀️" };
  if (jam >= 15 && jam < 18) return { teks: "Selamat sore",  icon: "🌇" };
  return { teks: "Selamat malam", icon: "🌙" };
}

/* ---------- 4. Toast notification ---------- */
function showToast(pesan, tipe = "info") {
  let wrap = document.getElementById("toastContainer");
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.id = "toastContainer";
    wrap.className = "toast-container";
    document.body.appendChild(wrap);
  }
  const ikon = { success: "✓", error: "✕", info: "ℹ" }[tipe] || "ℹ";
  const toast = document.createElement("div");
  toast.className = `toast toast--${tipe}`;
  const i = document.createElement("span"); i.className = "toast__icon"; i.textContent = ikon;
  const t = document.createElement("span"); t.textContent = pesan;
  toast.append(i, t);
  wrap.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("toast--hide");
    setTimeout(() => toast.remove(), 320);
  }, 3200);
}

/* ---------- 5. Modal & Alert Box ---------- */
function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
  setTimeout(() => modal.querySelector("input, select, textarea, button.btn--primary")?.focus(), 120);
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  if (!$(".modal.is-open")) document.body.classList.remove("no-scroll");
}

/* Alert box (modal) generik — dipakai untuk pesan error/sukses penting */
function showAlert(pesan, judul = "Perhatian", tipe = "error") {
  let modal = document.getElementById("modalAlertUmum");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "modalAlertUmum";
    modal.className = "modal modal--alert";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <div class="modal__dialog modal__dialog--sm" role="alertdialog" aria-modal="true">
        <div class="modal__body modal__body--center">
          <div class="alert-icon" id="alertUmumIcon">!</div>
          <h3 id="alertUmumJudul">Perhatian</h3>
          <p id="alertUmumPesan"></p>
          <button type="button" class="btn btn--primary btn--block" id="alertUmumOk">Mengerti</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
  }
  const ikon = { error: "!", success: "✓", info: "i" }[tipe] || "!";
  const elIkon = $("#alertUmumIcon", modal);
  elIkon.textContent = ikon;
  elIkon.className = `alert-icon alert-icon--${tipe}`;
  $("#alertUmumJudul", modal).textContent = judul;
  $("#alertUmumPesan", modal).textContent = pesan;
  $("#alertUmumOk", modal).onclick = () => closeModal("modalAlertUmum");

  openModal("modalAlertUmum");
}

/* Pasang event untuk semua modal di halaman */
function initModals() {
  // tombol dengan atribut data-open-modal
  $$("[data-open-modal]").forEach(btn => {
    btn.addEventListener("click", () => openModal(btn.dataset.openModal));
  });
  // tombol tutup
  $$("[data-close-modal]").forEach(btn => {
    btn.addEventListener("click", () => {
      const modal = btn.closest(".modal");
      if (modal) closeModal(modal.id);
    });
  });
  // klik area gelap di luar dialog
  $$(".modal").forEach(modal => {
    modal.addEventListener("click", e => {
      if (e.target === modal) closeModal(modal.id);
    });
  });
  // tombol Escape
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") $$(".modal.is-open").forEach(m => closeModal(m.id));
  });
}

/* ---------- 6. Validasi form helper ---------- */
function setFieldError(inputId, pesan) {
  const input = document.getElementById(inputId);
  const err = document.querySelector(`[data-error-for="${inputId}"]`);
  if (input) input.classList.toggle("is-invalid", Boolean(pesan));
  if (err) {
    err.textContent = pesan || "";
    err.classList.toggle("is-show", Boolean(pesan));
  }
}

function clearFormErrors(form) {
  $$(".field__error", form).forEach(el => { el.textContent = ""; el.classList.remove("is-show"); });
  $$("input, select, textarea", form).forEach(el => el.classList.remove("is-invalid"));
}

const isEmailValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
const isTeleponValid = (telp) => /^[0-9]{10,14}$/.test(telp);

/* ---------- 7. Autentikasi (session) ---------- */
function simpanSesi(user) {
  localStorage.setItem("userAktif", JSON.stringify({
    nama: user.nama, email: user.email, role: user.role
  }));
}

function getUserAktif() {
  try { return JSON.parse(localStorage.getItem("userAktif") || "null"); }
  catch { return null; }
}

function logout() {
  localStorage.removeItem("userAktif");
  window.location.href = "index.html";
}

/* Proteksi halaman: jika belum login, kembalikan ke halaman login */
function proteksiHalaman() {
  if (!getUserAktif()) {
    window.location.replace("index.html");
    return false;
  }
  return true;
}

/* ---------- 8. Inisialisasi komponen umum ---------- */
function initTopbar() {
  const user = getUserAktif();
  $$("[data-nama-user]").forEach(el => { el.textContent = user ? user.nama : "Tamu"; });
  $$("[data-avatar]").forEach(el => { el.textContent = user ? inisial(user.nama, 1) : "?"; });
  $$("[data-role-user]").forEach(el => { el.textContent = user ? user.role : "-"; });

  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) btnLogout.addEventListener("click", logout);

  const btnTema = document.getElementById("btnTema");
  if (btnTema) btnTema.addEventListener("click", toggleTema);

  // tandai menu aktif sesuai nama file
  const file = location.pathname.split("/").pop() || "dashboard.html";
  $$(".topnav a").forEach(a => {
    const href = a.getAttribute("href");
    if (href === file) a.classList.add("is-active");
    else a.classList.remove("is-active");
  });
}

/* ---------- 9. Jalankan saat DOM siap ---------- */
document.addEventListener("DOMContentLoaded", () => {
  initModals();
  initTopbar();
});

/* ---------- 10. Interaksi visual umum ---------- */
document.addEventListener("DOMContentLoaded", () => {
  // Tunggu halaman mengisi statistik sebelum mengambil nilai akhirnya.
  setTimeout(() => {
    document.querySelectorAll(".stat-card strong").forEach(el => {
      const target = parseInt(el.textContent.replace(/\D/g, ""), 10);
      if (isNaN(target) || target === 0) return;
      const mulai = performance.now(), durasi = 900;
      (function langkah(t) {
        const p = Math.min((t - mulai) / durasi, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(langkah);
      })(mulai);
    });
  }, 0);

  document.addEventListener("click", e => {
    const tombol = e.target.closest(".btn--primary");
    if (!tombol) return;
    const rect = tombol.getBoundingClientRect();
    const diameter = Math.max(rect.width, rect.height);
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.cssText = `width:${diameter}px;height:${diameter}px;left:${e.clientX - rect.left - diameter / 2}px;top:${e.clientY - rect.top - diameter / 2}px`;
    tombol.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });

  const topbar = document.querySelector(".topbar");
  const tombolKeAtas = document.createElement("button");
  tombolKeAtas.className = "to-top";
  tombolKeAtas.type = "button";
  tombolKeAtas.textContent = "↑";
  tombolKeAtas.setAttribute("aria-label", "Kembali ke atas");
  tombolKeAtas.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  document.body.appendChild(tombolKeAtas);

  window.addEventListener("scroll", () => {
    topbar?.classList.toggle("is-scrolled", window.scrollY > 8);
    tombolKeAtas.classList.toggle("is-show", window.scrollY > 400);
  }, { passive: true });

  const tbodyKeranjang = document.getElementById("tabelKeranjang");
  if (tbodyKeranjang) {
    new MutationObserver(() => {
      tbodyKeranjang.querySelectorAll(".qty span").forEach(span => {
        if (span.dataset.v !== undefined && span.dataset.v !== span.textContent) {
          span.classList.remove("pop");
          void span.offsetWidth;
          span.classList.add("pop");
        }
        span.dataset.v = span.textContent;
      });
    }).observe(tbodyKeranjang, { childList: true, subtree: true });
  }
});

/* ---------- 11. Fungsi Penyimpanan Katalog (LocalStorage) ---------- */
// Fungsi ini wajib ada agar data buku baru dan sisa stok tersimpan permanen
function simpanKatalog() {
  try {
    localStorage.setItem("katalogToko", JSON.stringify(dataKatalogBuku));
  } catch (e) {
    console.error("Gagal menyimpan katalog:", e);
    showToast("Penyimpanan browser penuh. Gagal menyimpan data buku.", "error");
  }
}

// Fungsi untuk memuat data katalog yang tersimpan (jika ada)
function muatKatalog() {
  try {
    const tersimpan = localStorage.getItem("katalogToko");
    if (tersimpan) {
      // Timpa data awal dari data.js dengan data terbaru dari localStorage
      dataKatalogBuku = JSON.parse(tersimpan);
    }
  } catch (e) {
    console.error("Gagal memuat katalog:", e);
  }
}

// Jalankan muatKatalog saat halaman pertama kali dimuat
document.addEventListener("DOMContentLoaded", () => {
  muatKatalog();
});