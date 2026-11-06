document.addEventListener("DOMContentLoaded", () => {
  if (getUserAktif()) { window.location.replace("dashboard.html"); return; }
  /* ---- Muat user tambahan hasil registrasi dari localStorage ---- */
  try {
    const tambahan = JSON.parse(localStorage.getItem("usersTambahan") || "[]");
    tambahan.forEach(u => {
      if (!dataPengguna.some(x => x.email.toLowerCase() === u.email.toLowerCase())) {
        dataPengguna.push(u);
      }
    });
  } catch (e) { /* abaikan jika data korup */ }

  /* ---- Toggle tampil/sembunyi password ---- */
  const inputPass = document.getElementById("password");
  const btnToggle = document.getElementById("togglePass");
  if (btnToggle) {
    btnToggle.addEventListener("click", () => {
      const lihat = inputPass.type === "password";
      inputPass.type = lihat ? "text" : "password";
      btnToggle.textContent = lihat ? "Sembunyi" : "Lihat";
    });
  }

  /* ================= FORM LOGIN ================= */
  const formLogin = document.getElementById("formLogin");
  formLogin.addEventListener("submit", (e) => {
    e.preventDefault();
    clearFormErrors(formLogin);

    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = inputPass.value;

    let valid = true;

    if (!email) {
      setFieldError("email", "Email wajib diisi."); valid = false;
    } else if (!isEmailValid(email)) {
      setFieldError("email", "Format email tidak valid."); valid = false;
    }
    if (!password) {
      setFieldError("password", "Password wajib diisi."); valid = false;
    }
    if (!valid) return;

    // Cocokkan dengan data user
    const user = dataPengguna.find(
      u => u.email.toLowerCase() === email && u.password === password
    );

    if (!user) {
      // Sesuai soal: munculkan pop-up/alert
      showAlert("email/password yang anda masukkan salah", "Login Gagal", "error");
      inputPass.value = "";
      inputPass.focus();
      return;
    }

    simpanSesi(user);
    showToast(`Login berhasil. Selamat datang, ${user.nama}!`, "success");
    setTimeout(() => { window.location.href = "dashboard.html"; }, 700);
  });

  /* ================= MODAL LUPA PASSWORD ================= */
  const formLupa = document.getElementById("formLupa");
  formLupa.addEventListener("submit", (e) => {
    e.preventDefault();
    clearFormErrors(formLupa);
    const email = document.getElementById("emailLupa").value.trim().toLowerCase();

    if (!email) {
      setFieldError("emailLupa", "Email wajib diisi."); return;
    }
    if (!isEmailValid(email)) {
      setFieldError("emailLupa", "Format email tidak valid."); return;
    }

    const terdaftar = dataPengguna.some(u => u.email.toLowerCase() === email);
    if (!terdaftar) {
      setFieldError("emailLupa", "Email tidak terdaftar pada sistem."); return;
    }

    closeModal("modalLupa");
    formLupa.reset();
    showAlert(
      `Tautan reset password telah dikirim ke ${email}. Silakan periksa kotak masuk Anda.`,
      "Email Terkirim", "success"
    );
  });

  /* ================= MODAL DAFTAR ================= */
  const formDaftar = document.getElementById("formDaftar");
  formDaftar.addEventListener("submit", (e) => {
    e.preventDefault();
    clearFormErrors(formDaftar);

    const nama = document.getElementById("namaDaftar").value.trim();
    const email = document.getElementById("emailDaftar").value.trim().toLowerCase();
    const pass = document.getElementById("passDaftar").value;

    let valid = true;
    if (nama.length < 3) { setFieldError("namaDaftar", "Nama minimal 3 karakter."); valid = false; }
    if (!email) { setFieldError("emailDaftar", "Email wajib diisi."); valid = false; }
    else if (!isEmailValid(email)) { setFieldError("emailDaftar", "Format email tidak valid."); valid = false; }
    else if (dataPengguna.some(u => u.email.toLowerCase() === email)) {
      setFieldError("emailDaftar", "Email sudah terdaftar, silakan login."); valid = false;
    }
    if (pass.length < 6) { setFieldError("passDaftar", "Password minimal 6 karakter."); valid = false; }
    if (!valid) return;

    // Simpan user baru (in-memory + localStorage agar tidak hilang saat refresh)
    const userBaru = { id: Date.now(), nama, email, password: pass, role: "User" };
    dataPengguna.push(userBaru);

    try {
      const tambahan = JSON.parse(localStorage.getItem("usersTambahan") || "[]");
      tambahan.push(userBaru);
      localStorage.setItem("usersTambahan", JSON.stringify(tambahan));
    } catch (err) { /* abaikan */ }

    closeModal("modalDaftar");
    formDaftar.reset();
    showAlert("Akun berhasil dibuat. Silakan login menggunakan email dan password Anda.", "Registrasi Berhasil", "success");
  });
});