import {
  confirmPasswordReset,
  verifyPasswordResetCode
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { auth } from "./firebase-config.js";

const urlParams = new URLSearchParams(window.location.search);
const oobCode = urlParams.get("oobCode");

const form = document.getElementById("resetPasswordForm");
const errorBox = document.getElementById("resetError");
const successBox = document.getElementById("resetSuccess");

function showBox(el, message) {
  if (!el) return;
  el.textContent = message;
  el.style.display = "block";
}

function clearBox(el) {
  if (!el) return;
  el.textContent = "";
  el.style.display = "none";
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  clearBox(errorBox);
  clearBox(successBox);

  const password = document.getElementById("resetPassword")?.value || "";
  const confirmPassword = document.getElementById("resetPassword2")?.value || "";

  if (!oobCode) {
    showBox(errorBox, "Kode reset tidak ditemukan.");
    return;
  }

  if (password.length < 8) {
    showBox(errorBox, "Password minimal 8 karakter.");
    return;
  }

  if (password !== confirmPassword) {
    showBox(errorBox, "Konfirmasi password tidak sama.");
    return;
  }

  try {
    await verifyPasswordResetCode(auth, oobCode);
    await confirmPasswordReset(auth, oobCode, password);

    showBox(successBox, "Password berhasil direset.");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);
  } catch (err) {
    console.error(err);
    showBox(errorBox, "Link reset tidak valid atau sudah kedaluwarsa.");
  }
});