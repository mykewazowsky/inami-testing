import { API_BASE_URL } from "./config.js";
import { supabase } from "./supabase-config.js";

(() => {
  const AUTH_STORAGE_KEY = "inami_auth";
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function $(id) { return document.getElementById(id); }
  function getLoginOverlay()  { return $("loginOverlay"); }
  function getSignupOverlay() { return $("signupOverlay"); }
  function getLoginForm()  { return getLoginOverlay()?.querySelector("form") || null; }
  function getSignupForm() { return getSignupOverlay()?.querySelector("form") || null; }

  function saveAuth(authData) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
  }

  function getAuth() {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  function clearAuth() { localStorage.removeItem(AUTH_STORAGE_KEY); }
  function getCurrentUser() { return getAuth()?.user || null; }
  function isLoggedIn() {
    const auth = getAuth();
    return !!(auth && auth.token && auth.user);
  }

  function createMessageBox(form, id, extraClass = "") {
    if (!form) return null;
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement("div");
      el.id = id;
      el.className = `small mt-2 ${extraClass}`.trim();
      el.style.display = "none";
      form.appendChild(el);
    }
    return el;
  }

  function showMessage(id, message, type = "error") {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = message;
    el.style.display = "block";
    el.classList.remove("text-danger", "text-success");
    el.classList.add(type === "success" ? "text-success" : "text-danger");
  }

  function clearMessage(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = "";
    el.style.display = "none";
  }

  function setFieldInvalid(input, isInvalid = true) {
    if (!input) return;
    input.classList.toggle("is-invalid", isInvalid);
  }

  function clearValidation(ids) {
    ids.forEach((id) => setFieldInvalid($(id), false));
  }

  function setSubmitLoading(form, loading, fallbackText) {
    if (!form) return;
    const button = form.querySelector('button[type="submit"]');
    if (!button) return;
    if (loading) {
      button.disabled = true;
      button.dataset.originalText = button.textContent;
      button.textContent = "Loading...";
    } else {
      button.disabled = false;
      button.textContent = button.dataset.originalText || fallbackText;
    }
  }

  function openLogin(e) {
    if (e) e.preventDefault();
    if (typeof closeNavbarIfOpen === "function") closeNavbarIfOpen();
    const overlay = getLoginOverlay();
    if (!overlay) return;
    clearMessage("loginError");
    overlay.classList.add("active");
    setTimeout(() => $("loginEmail")?.focus(), 50);
  }

  function closeLogin() {
    const overlay = getLoginOverlay();
    if (!overlay) return;
    overlay.classList.remove("active");
    clearMessage("loginError");
  }

  function openSignup(e) {
    if (e) e.preventDefault();
    if (typeof closeNavbarIfOpen === "function") closeNavbarIfOpen();
    closeLogin();
    const overlay = getSignupOverlay();
    if (!overlay) return;
    clearMessage("signupError");
    clearMessage("signupSuccess");
    overlay.classList.add("active");
    setTimeout(() => $("signupName")?.focus(), 50);
  }

  function closeSignup() {
    const overlay = getSignupOverlay();
    if (!overlay) return;
    overlay.classList.remove("active");
    clearMessage("signupError");
    clearMessage("signupSuccess");
  }

  function overlayClickClose(e) {
    if (e.target === getLoginOverlay()) closeLogin();
    if (e.target === getSignupOverlay()) closeSignup();
    if (e.target === getForgotOverlay()) closeForgotPassword();
  }

  function validateLoginForm() {
    const emailEl = $("loginEmail");
    const passwordEl = $("loginPassword");
    const email = emailEl?.value.trim() || "";
    const password = passwordEl?.value || "";

    clearValidation(["loginEmail", "loginPassword"]);
    clearMessage("loginError");

    if (!email) { setFieldInvalid(emailEl, true); showMessage("loginError", "Email wajib diisi."); return null; }
    if (!EMAIL_REGEX.test(email)) { setFieldInvalid(emailEl, true); showMessage("loginError", "Format email tidak valid."); return null; }
    if (!password) { setFieldInvalid(passwordEl, true); showMessage("loginError", "Password wajib diisi."); return null; }

    return { email: email.toLowerCase(), password };
  }

  function validateSignupForm() {
    const nameEl  = $("signupName");
    const emailEl = $("signupEmail");
    const pass1El = $("signupPassword");
    const pass2El = $("signupPassword2");

    const name            = nameEl?.value.trim() || "";
    const email           = emailEl?.value.trim() || "";
    const password        = pass1El?.value || "";
    const confirmPassword = pass2El?.value || "";

    clearValidation(["signupName", "signupEmail", "signupPassword", "signupPassword2"]);
    clearMessage("signupError");
    clearMessage("signupSuccess");

    if (name.length < 3)         { setFieldInvalid(nameEl, true);  showMessage("signupError", "Nama minimal 3 karakter."); return null; }
    if (!EMAIL_REGEX.test(email)){ setFieldInvalid(emailEl, true); showMessage("signupError", "Format email tidak valid."); return null; }
    if (password.length < 8)     { setFieldInvalid(pass1El, true); showMessage("signupError", "Password minimal 8 karakter."); return null; }
    if (password !== confirmPassword){ setFieldInvalid(pass2El, true); showMessage("signupError", "Konfirmasi password tidak sama."); return null; }

    return { name, email: email.toLowerCase(), password };
  }

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, role, wilayah")
      .eq("id", userId)
      .single();
    return data || {};
  }

  async function handleLogin(e) {
    e.preventDefault();
    const form = e.target;
    const payload = validateLoginForm();
    if (!payload) return;

    try {
      setSubmitLoading(form, true, "Log In");

      const { data, error } = await supabase.auth.signInWithPassword({
        email: payload.email,
        password: payload.password,
      });

      if (error) throw error;

      const token   = data.session.access_token;
      const sbUser  = data.user;
      const profile = await fetchProfile(sbUser.id);

      saveAuth({
        token,
        user: {
          uid:     sbUser.id,
          name:    profile.full_name || sbUser.email || "",
          email:   sbUser.email || "",
          role:    profile.role || "public",
          wilayah: profile.wilayah || "",
        },
      });

      form.reset();
      closeLogin();
      updateAuthUI();

      if (typeof window.resetAppToHome === "function") window.resetAppToHome();
      showToast(`Selamat datang, ${profile.full_name || sbUser.email}!`);
    } catch (err) {
      console.error(err);
      showMessage("loginError", "Login gagal. Cek email dan password.");
    } finally {
      setSubmitLoading(form, false, "Log In");
    }
  }

  async function handleSignupSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const payload = validateSignupForm();
    if (!payload) return;

    try {
      setSubmitLoading(form, true, "Sign Up");

      const { data, error } = await supabase.auth.signUp({
        email: payload.email,
        password: payload.password,
      });

      if (error) throw error;

      // Simpan profile ke tabel profiles
      if (data.user) {
        await supabase.from("profiles").insert([{
          id:        data.user.id,
          full_name: payload.name,
          role:      "public",
          wilayah:   "",
        }]);
      }

      showMessage("signupSuccess", "Akun berhasil dibuat. Silakan login.", "success");
      showToast("Akun berhasil dibuat");
      form.reset();

      setTimeout(() => { closeSignup(); openLogin(); }, 700);
    } catch (err) {
      console.error(err);
      showMessage("signupError", "Signup gagal. Email mungkin sudah terdaftar.");
    } finally {
      setSubmitLoading(form, false, "Sign Up");
    }
  }

  async function logout(e) {
    if (e) e.preventDefault();
    await supabase.auth.signOut();
    clearAuth();
    updateAuthUI();
    if (typeof window.resetAppToHome === "function") window.resetAppToHome();
    showToast("Kamu sudah logout");
  }

  function updateAuthUI() {
    const authData     = getAuth();
    const loginNav     = document.getElementById("loginNav");
    const userNav      = document.getElementById("userNav");
    const userGreeting = document.getElementById("userGreeting");
    const userRoleLabel= document.getElementById("userRoleLabel");

    if (!authData || !authData.user) {
      loginNav?.classList.remove("d-none");
      userNav?.classList.add("d-none");
      if (userGreeting)  userGreeting.textContent  = "Account";
      if (userRoleLabel) userRoleLabel.textContent = "Role: guest";
      return;
    }

    loginNav?.classList.add("d-none");
    userNav?.classList.remove("d-none");

    if (userGreeting) {
      userGreeting.textContent = authData.user.name || authData.user.email || "User";
    }

    if (userRoleLabel) {
      const roleMap = { public: "publik", mitra: "mitra", admin: "admin", premium: "premium" };
      const roleText    = roleMap[authData.user.role] || authData.user.role || "guest";
      const wilayahLabel= authData.user.wilayah ? ` · ${authData.user.wilayah}` : "";
      userRoleLabel.textContent = `Role: ${roleText}${wilayahLabel}`;
    }
  }

  function setupEscClose() {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { closeLogin(); closeSignup(); closeForgotPassword(); }
    });
  }

  // Sinkronisasi session Supabase → localStorage
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (!session) {
      clearAuth();
      updateAuthUI();
      if (typeof window.resetAppToHome === "function") window.resetAppToHome();
      return;
    }

    const sbUser  = session.user;
    const profile = await fetchProfile(sbUser.id);

    saveAuth({
      token: session.access_token,
      user: {
        uid:     sbUser.id,
        name:    profile.full_name || sbUser.email || "",
        email:   sbUser.email || "",
        role:    profile.role || "public",
        wilayah: profile.wilayah || "",
      },
    });

    updateAuthUI();
  });

  function initAuth() {
    createMessageBox(getLoginForm(),  "loginError");
    createMessageBox(getSignupForm(), "signupError");
    createMessageBox(getSignupForm(), "signupSuccess");
    createMessageBox(getForgotForm(), "forgotError");
    createMessageBox(getForgotForm(), "forgotSuccess");
    updateAuthUI();
    setupEscClose();
  }

  /* ── Forgot Password ── */

  function getForgotOverlay() { return $("forgotOverlay"); }
  function getForgotForm()    { return getForgotOverlay()?.querySelector("form") || null; }

  function openForgotPassword(e) {
    if (e) e.preventDefault();
    closeLogin();
    const overlay = getForgotOverlay();
    if (!overlay) return;
    clearMessage("forgotError");
    clearMessage("forgotSuccess");
    overlay.classList.add("active");
    setTimeout(() => $("forgotEmail")?.focus(), 50);
  }

  function closeForgotPassword() {
    const overlay = getForgotOverlay();
    if (!overlay) return;
    overlay.classList.remove("active");
    clearMessage("forgotError");
    clearMessage("forgotSuccess");
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    const form  = e.target;
    const email = $("forgotEmail")?.value.trim() || "";

    clearMessage("forgotError");
    clearMessage("forgotSuccess");

    if (!EMAIL_REGEX.test(email)) {
      showMessage("forgotError", "Format email tidak valid.");
      return;
    }

    try {
      setSubmitLoading(form, true, "Send Reset Link");

      // Kirim via backend agar bisa custom email dengan Nodemailer
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password-firebase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Gagal mengirim reset password.");

      showMessage("forgotSuccess", "Jika email terdaftar, link reset sudah dikirim.", "success");
      showToast("Link reset berhasil dikirim");
      form.reset();
    } catch (err) {
      console.error(err);
      showMessage("forgotError", err.message || "Gagal memproses forgot password.");
    } finally {
      setSubmitLoading(form, false, "Send Reset Link");
    }
  }

  async function getFreshAuthToken(forceRefresh = false) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    if (forceRefresh) {
      const { data: { session: refreshed } } = await supabase.auth.refreshSession();
      if (!refreshed) return null;

      const profile = await fetchProfile(refreshed.user.id);
      saveAuth({
        token: refreshed.access_token,
        user: {
          uid:     refreshed.user.id,
          name:    profile.full_name || refreshed.user.email || "",
          email:   refreshed.user.email || "",
          role:    profile.role || "public",
          wilayah: profile.wilayah || "",
        },
      });

      return refreshed.access_token;
    }

    return session.access_token;
  }

  function hasRole(roles = []) {
    const user = getCurrentUser();
    if (!user || !user.role) return false;
    return roles.includes(user.role);
  }

  function requireAuth(action) {
    if (!isLoggedIn()) { openLogin(); return false; }
    if (typeof action === "function") action(getCurrentUser());
    return true;
  }

  window.openLogin          = openLogin;
  window.closeLogin         = closeLogin;
  window.openSignup         = openSignup;
  window.closeSignup        = closeSignup;
  window.overlayClickClose  = overlayClickClose;
  window.handleLogin        = handleLogin;
  window.handleSignupSubmit = handleSignupSubmit;
  window.logout             = logout;
  window.updateAuthUI       = updateAuthUI;
  window.isLoggedIn         = isLoggedIn;
  window.getCurrentUser     = getCurrentUser;
  window.openForgotPassword = openForgotPassword;
  window.closeForgotPassword= closeForgotPassword;
  window.handleForgotPassword = handleForgotPassword;
  window.hasRole            = hasRole;
  window.requireAuth        = requireAuth;
  window.getFreshAuthToken  = getFreshAuthToken;

  document.addEventListener("DOMContentLoaded", initAuth);
})();

function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 100);
  setTimeout(() => { toast.classList.remove("show"); setTimeout(() => toast.remove(), 300); }, 3000);
}
