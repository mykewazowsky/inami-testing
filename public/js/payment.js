let lastSourcePage = "catalog";
let lastDetailView = null;
let selectedLocation = null;

import { API_BASE_URL } from "./config.js";

async function requestSecureDatasetDownload({ location, datasetType }) {
  try {
    const authUser = getCurrentAuthUserForPayment();

    if (!authUser) {
      showPaymentAccessNotice("Login Diperlukan", "Silakan login terlebih dahulu.");
      return;
    }

    const token =
      typeof window.getFreshAuthToken === "function" ? await window.getFreshAuthToken(true) : null;

    if (!token) {
      showPaymentAccessNotice("Token Tidak Tersedia", "Silakan login ulang lalu coba lagi.");
      return;
    }

    const response = await fetch(`${API_BASE_URL}/api/payment/secure-download`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-user-role": authUser.role || "",
        "x-user-wilayah": authUser.wilayah || "",
        "x-user-name": authUser.name || "",
        "x-user-email": authUser.email || "",
      },
      body: JSON.stringify({
        location,
        datasetType,
      }),
    });

    if (!response.ok) {
      let message = "Gagal mengunduh file.";

      try {
        const data = await response.json();
        message = data.message || message;
      } catch (_) {}

      showPaymentAccessNotice("Download Ditolak", message);
      return;
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);

    let fileName = `${datasetType}-${location}.zip`;

    const disposition = response.headers.get("Content-Disposition");

    if (disposition) {
      const match = disposition.match(/filename="?([^"]+)"?/);

      if (match && match[1]) {
        fileName = match[1];
      }
    }

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(downloadUrl);
  } catch (err) {
    console.error("requestSecureDatasetDownload error:", err);

    showPaymentAccessNotice(
      "Server Tidak Aktif",
      "Backend Express belum berjalan atau tidak dapat dihubungi.",
    );
  }
}

async function handleSecureAuthorizedDownload(purchaseData) {
  const locationKey = String(
    purchaseData?.location?.id || purchaseData?.location?.name || "",
  ).toLowerCase();

  if (!locationKey) {
    showPaymentAccessNotice("Lokasi Tidak Valid", "Lokasi download tidak ditemukan.");
    return;
  }

  if (purchaseData?.items?.inundasi) {
    await requestSecureDatasetDownload({
      location: locationKey,
      datasetType: "inundasi",
    });
  }

  if (purchaseData?.items?.risiko) {
    await requestSecureDatasetDownload({
      location: locationKey,
      datasetType: "risiko",
    });
  }
}

function showPaymentAccessNotice(title, message) {
  if (typeof window.showAccessNotice === "function") {
    window.showAccessNotice(title, message);
    return;
  }

  alert(`${title}\n\n${message}`);
}

function getCurrentAuthUserForPayment() {
  try {
    const rawAuth = localStorage.getItem("inami_auth");
    if (!rawAuth) return null;
    const auth = JSON.parse(rawAuth);
    return auth?.user || null;
  } catch (err) {
    console.error("Gagal membaca auth:", err);
    return null;
  }
}

function isMitraPaymentUser() {
  const user = getCurrentAuthUserForPayment();
  return (user?.role || "").toLowerCase() === "mitra";
}

function isAdminPaymentUser() {
  const user = getCurrentAuthUserForPayment();
  return (user?.role || "").toLowerCase() === "admin";
}

function canAccessSelectedLocation(locationObj) {
  const user = getCurrentAuthUserForPayment();
  if (!user) return true;

  const role = (user.role || "").toLowerCase();
  const userWilayah = (user.wilayah || "").toLowerCase();
  const selectedWilayah = (locationObj?.name || "").toLowerCase();

  if (role === "admin") return true;
  if (role !== "mitra") return true;

  return !!selectedWilayah && selectedWilayah === userWilayah;
}

function normalizeLocationKey(value = "") {
  return String(value).trim().toLowerCase();
}

function getAllowedLocationsForCurrentUser() {
  const user = getCurrentAuthUserForPayment();

  const allLocations = [
    { id: "cilacap", name: "Cilacap" },
    { id: "bakauheni", name: "Bakauheni" },
  ];

  if (!user) return allLocations;

  const role = normalizeLocationKey(user.role);
  const wilayah = normalizeLocationKey(user.wilayah);

  if (role === "admin") return allLocations;
  if (role !== "mitra") return allLocations;

  return allLocations.filter((item) => normalizeLocationKey(item.id) === wilayah);
}

function findLocationByKey(locationKey) {
  const allLocations = [
    { id: "cilacap", name: "Cilacap" },
    { id: "bakauheni", name: "Bakauheni" },
  ];

  const key = normalizeLocationKey(locationKey);
  return allLocations.find((item) => normalizeLocationKey(item.id) === key) || null;
}

function setSelectedLocationByKey(locationKey) {
  const found = findLocationByKey(locationKey);

  if (!found) {
    selectedLocation = null;
    return null;
  }

  selectedLocation = found;
  return found;
}

// ===== PUBLIC DOWNLOAD OVERLAY PAGE =====
document.addEventListener("DOMContentLoaded", function () {
  const openBtn = document.getElementById("openPublicDownload");
  const page = document.getElementById("publicDownloadPage");
  const backBtn = document.getElementById("backToCatalog");
  const locationInput = document.getElementById("locationInput");
  const locationDropdown = document.getElementById("locationDropdown");
  const toggleDropdownBtn = document.getElementById("toggleDropdownBtn");
  const toggleInundasi = document.getElementById("toggleInundasi");
  const toggleRisiko = document.getElementById("toggleRisiko");
  const selectedLocationText = document.getElementById("selectedLocationText");
  const selectedDataText = document.getElementById("selectedDataText");
  const paymentBtn = document.getElementById("paymentBtn");
  const paymentPage = document.getElementById("paymentPage");
  const paymentInstructionPage = document.getElementById("paymentInstructionPage");
  const backToPublicDownloadBtn = document.getElementById("backToPublicDownloadBtn");
  const paymentForm = document.getElementById("paymentForm");
  const paymentLocationText = document.getElementById("paymentLocationText");
  const paymentProductText = document.getElementById("paymentProductText");
  const paymentItemCount = document.getElementById("paymentItemCount");
  const paymentAdminFee = document.getElementById("paymentAdminFee");
  const paymentTotalPrice = document.getElementById("paymentTotalPrice");
  const buyerName = document.getElementById("buyerName");
  const buyerWhatsapp = document.getElementById("buyerWhatsapp");
  const buyerEmail = document.getElementById("buyerEmail");
  const buyerInstitution = document.getElementById("buyerInstitution");
  const paymentMethod = document.getElementById("paymentMethod");
  const agreementCheck = document.getElementById("agreementCheck");
  const paymentFormMessage = document.getElementById("paymentFormMessage");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const modalOverlay = document.getElementById("modalOverlay");
  const optionLabels = document.querySelectorAll(".public-option-label");

  if (!openBtn || !page) return;

  const availableLocations = getAllowedLocationsForCurrentUser();
  console.log("USER:", getCurrentAuthUserForPayment());
  console.log("AVAILABLE LOCATIONS:", availableLocations);

  if (!selectedLocation && availableLocations.length === 1) {
    selectedLocation = availableLocations[0];
    if (locationInput) {
      locationInput.value = selectedLocation.name;
    }
  }

  function openPublicPage() {
    lastSourcePage = "catalog";
    lastDetailView = null;

    const backBtn = document.getElementById("backToCatalog");
    if (backBtn) {
      backBtn.innerHTML = '<i class="fas fa-arrow-left"></i><span>Kembali ke Katalog</span>';
    }

    const isRestrictedMitra = isMitraPaymentUser() && !isAdminPaymentUser();

    if (!isRestrictedMitra) {
      selectedLocation = null;
      if (locationInput) locationInput.value = "";
      if (toggleInundasi) toggleInundasi.checked = false;
      if (toggleRisiko) toggleRisiko.checked = false;
    } else if (availableLocations.length === 1) {
      selectedLocation = availableLocations[0];
      if (locationInput) locationInput.value = selectedLocation.name;
    }

    page.classList.remove("hidden-page");
    document.body.style.overflow = "hidden";

    if (typeof window.updateSummary === "function") {
      window.updateSummary();
    }

    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function closePublicPage() {
    document.body.classList.remove("hide-main-nav");
    page.classList.add("hidden-page");
    document.body.style.overflow = "";
  }

  function animatePriceChange(element, newValue) {
    if (!element) return;
    element.classList.remove("price-bump");
    void element.offsetWidth;
    element.textContent = newValue;
    element.classList.add("price-bump");
    setTimeout(() => {
      element.classList.remove("price-bump");
    }, 220);
  }

  function updateSummary() {
    const PRICE_INUNDASI = 300000;
    const PRICE_RISIKO = 300000;

    const isRoleFree = isLoggedIn() && hasRole(["admin", "mitra"]);
    const allowedLocation = canAccessSelectedLocation(selectedLocation);
    const isFree = isRoleFree && allowedLocation;
    const badgeInundasi = document.getElementById("badgeInundasi");
    const badgeRisiko = document.getElementById("badgeRisiko");
    const optionInundasiCard = document.getElementById("optionInundasiCard");
    const optionRisikoCard = document.getElementById("optionRisikoCard");
    const selectedItemCount = document.getElementById("selectedItemCount");
    const selectedTotalPrice = document.getElementById("selectedTotalPrice");
    const summaryStatus = document.getElementById("summaryStatus");
    const summaryBox = document.querySelector(".public-selection-summary");

    selectedLocationText.textContent = selectedLocation ? selectedLocation.name : "Belum dipilih";

    const selectedData = [];
    let totalPrice = 0;
    let totalItems = 0;

    if (toggleInundasi.checked) {
      selectedData.push("Raster Inundasi Tsunami");
      totalPrice += isFree ? 0 : PRICE_INUNDASI; // ✅ gratis untuk mitra/admin
      totalItems += 1;
      if (badgeInundasi) badgeInundasi.classList.remove("d-none");
      if (optionInundasiCard) optionInundasiCard.classList.add("is-selected");
    } else {
      if (badgeInundasi) badgeInundasi.classList.add("d-none");
      if (optionInundasiCard) optionInundasiCard.classList.remove("is-selected");
    }

    if (toggleRisiko.checked) {
      selectedData.push("Data Risiko");
      totalPrice += isFree ? 0 : PRICE_RISIKO; // ✅ gratis untuk mitra/admin
      totalItems += 1;
      if (badgeRisiko) badgeRisiko.classList.remove("d-none");
      if (optionRisikoCard) optionRisikoCard.classList.add("is-selected");
    } else {
      if (badgeRisiko) badgeRisiko.classList.add("d-none");
      if (optionRisikoCard) optionRisikoCard.classList.remove("is-selected");
    }

    selectedDataText.textContent = selectedData.length ? selectedData.join(", ") : "Belum ada";
    if (selectedItemCount) selectedItemCount.textContent = `${totalItems} item`;

    if (selectedTotalPrice) {
      // ✅ Tampilkan "Gratis" jika mitra/admin, harga normal jika publik
      const formattedPrice =
        isFree && totalItems > 0 ? "Gratis" : `Rp${totalPrice.toLocaleString("id-ID")}`;

      if (selectedTotalPrice.textContent !== formattedPrice) {
        animatePriceChange(selectedTotalPrice, formattedPrice);
      } else {
        selectedTotalPrice.textContent = formattedPrice;
      }
    }

    const isReady = !!selectedLocation && totalItems > 0;
    const isBlockedMitraLocation = isMitraPaymentUser() && !!selectedLocation && !allowedLocation;

    if (summaryStatus) {
      if (isBlockedMitraLocation) {
        summaryStatus.textContent = "Lokasi tidak tersedia untuk akun mitra ini";
        summaryStatus.classList.remove("ready");
      } else {
        summaryStatus.textContent = isReady ? "Siap checkout" : "Belum lengkap";
        summaryStatus.classList.toggle("ready", isReady);
      }
    }

    if (summaryBox) summaryBox.classList.toggle("has-selection", totalItems > 0);

    if (paymentBtn) {
      paymentBtn.disabled = !isReady || isBlockedMitraLocation;
    }

    // ✅ Ubah teks tombol payment sesuai role
    if (paymentBtn) {
      if (isBlockedMitraLocation) {
        paymentBtn.innerHTML = '<span>Akses Diblokir</span><i class="fas fa-lock"></i>';
      } else {
        paymentBtn.innerHTML =
          isFree && totalItems > 0
            ? '<span>Unduh Sekarang</span><i class="fas fa-download"></i>'
            : '<span>Lanjut ke Payment</span><i class="fas fa-arrow-right"></i>';
      }
    }
  }
  window.updateSummary = updateSummary;

  function getSelectedProducts() {
    const selected = [];

    if (toggleInundasi && toggleInundasi.checked) {
      selected.push("Raster Inundasi Tsunami");
    }

    if (toggleRisiko && toggleRisiko.checked) {
      selected.push("Data Risiko");
    }

    return selected;
  }

  function getPaymentSummaryData() {
    const PRICE_INUNDASI = 300000;
    const PRICE_RISIKO = 300000;
    const ADMIN_FEE = 2500;

    const allowedLocation = canAccessSelectedLocation(selectedLocation);
    const isFree = isLoggedIn() && hasRole(["admin", "mitra"]) && allowedLocation;

    const selectedProducts = getSelectedProducts();
    let subtotal = 0;

    if (!isFree) {
      if (toggleInundasi && toggleInundasi.checked) subtotal += PRICE_INUNDASI;
      if (toggleRisiko && toggleRisiko.checked) subtotal += PRICE_RISIKO;
    }

    const totalItems = selectedProducts.length;
    const adminFee = totalItems > 0 && !isFree ? ADMIN_FEE : 0;
    const total = totalItems > 0 ? subtotal + adminFee : 0;

    return {
      locationName: selectedLocation ? selectedLocation.name : "-",
      products: selectedProducts,
      totalItems,
      adminFee,
      total,
      isFree,
      allowedLocation,
    };
  }

  async function submitDirectPartnerRequest(purchaseData) {
    const authRaw = localStorage.getItem("inami_auth");
    const authData = authRaw ? JSON.parse(authRaw) : null;
    const user = authData?.user || null;

    if (!user) {
      showPaymentAccessNotice("Login Diperlukan", "Silakan login terlebih dahulu.");
      return;
    }

    if (!canAccessSelectedLocation(purchaseData.location)) {
      showPaymentAccessNotice(
        "Akses Ditolak",
        "Akun mitra kamu hanya bisa mengakses data sesuai wilayah yang terdaftar.",
      );
      return;
    }

    const payload = {
      buyerName: user.name || "-",
      buyerWhatsapp: "",
      buyerEmail: user.email || "",
      deliveryEmail: user.email || "",
      senderBank: "",
      buyerInstitution: "",
      buyerPurpose: "Akses langsung admin/mitra",
      buyerNotes: `Request otomatis oleh ${user.role || "user"}${user.wilayah ? ` (${user.wilayah})` : ""}`,
      locationName: purchaseData.location?.name || "",
      productNames: (purchaseData.productNames || []).join(", "),
      totalItems: purchaseData.summary?.itemCount || 0,
      adminFee: 0,
      totalPayment: 0,
      verificationType: "admin-mitra-direct",
      requesterRole: user.role || "",
      requesterWilayah: user.wilayah || "",
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/payment/direct-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        showPaymentAccessNotice(
          "Gagal Memproses",
          data.message || "Permintaan tidak berhasil dikirim.",
        );
        return;
      }

      localStorage.removeItem("publicPurchaseData");
      localStorage.removeItem("paymentDraftData");
      localStorage.removeItem("download_location");
      localStorage.removeItem("download_type");
      localStorage.removeItem("public_download_source");

      window._paymentCompleted = true;

      const successModal = document.getElementById("paymentSuccessModal");
      const successMsg = document.getElementById("paymentSuccessModalMsg");

      if (successMsg) {
        successMsg.textContent =
          "Permintaan data berhasil dikirim ke developer. Data akan diproses tanpa pembayaran.";
      }

      const publicDownloadPage = document.getElementById("publicDownloadPage");
      const paymentPage = document.getElementById("paymentPage");

      if (publicDownloadPage) publicDownloadPage.classList.add("hidden-page");
      if (paymentPage) paymentPage.classList.add("hidden-page");

      if (successModal) {
        successModal.style.display = "flex";
      }
    } catch (error) {
      console.error("submitDirectPartnerRequest error:", error);
      showPaymentAccessNotice("Error", "Tidak dapat menghubungi server.");
    }
  }

  function formatRupiah(value) {
    return `Rp${Number(value || 0).toLocaleString("id-ID")}`;
  }

  function openPaymentPage() {
    if (!page || !paymentPage) return;

    const summary = getPaymentSummaryData();

    paymentLocationText.textContent = summary.locationName;

    paymentProductText.textContent = summary.products.length ? summary.products.join(", ") : "-";

    paymentItemCount.textContent = `${summary.totalItems} item`;

    paymentAdminFee.textContent = formatRupiah(summary.adminFee);

    paymentTotalPrice.textContent = formatRupiah(summary.total);

    /* PREFILL */

    try {
      const rawAuth = localStorage.getItem("inami_auth");

      if (rawAuth) {
        const auth = JSON.parse(rawAuth);

        if (auth?.user) {
          if (buyerName && !buyerName.value) {
            buyerName.value = auth.user.name || "";
          }

          if (buyerEmail && !buyerEmail.value) {
            buyerEmail.value = auth.user.email || "";
          }
        }
      }
    } catch (err) {
      console.error("Gagal membaca auth:", err);
    }

    /* PINDAH PAGE */

    page.classList.add("hidden-page");

    page.classList.remove("active");

    /* PAYMENT */

    paymentPage.classList.remove("hidden-page");

    paymentPage.classList.add("active");

    document.body.classList.add("hide-main-nav");

    /* INI FIX UTAMA */

    document.body.style.overflow = "auto";

    document.documentElement.style.overflow = "auto";

    /* SCROLL KE ATAS */

    window.scrollTo({
      top: 0,

      behavior: "smooth",
    });
  }

  function closePaymentPageToPublicDownload() {
    document.body.classList.remove("hide-main-nav");

    if (!page || !paymentPage) return;
    paymentPage.classList.add("hidden-page");
    page.classList.remove("hidden-page");
    document.body.style.overflow = "hidden";
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function showPaymentMessage(message, type = "error") {
    if (!paymentFormMessage) return;
    paymentFormMessage.textContent = message;
    paymentFormMessage.classList.remove("d-none", "success", "error");
    paymentFormMessage.classList.add(type);
  }

  function clearPaymentMessage() {
    if (!paymentFormMessage) return;
    paymentFormMessage.textContent = "";
    paymentFormMessage.classList.add("d-none");
    paymentFormMessage.classList.remove("success", "error");
  }

  function validatePaymentForm() {
    clearPaymentMessage();

    const name = buyerName?.value.trim() || "";
    const whatsapp = buyerWhatsapp?.value.trim() || "";
    const email = buyerEmail?.value.trim() || "";
    const method = paymentMethod?.value || "";

    if (name.length < 3) {
      showPaymentMessage("Nama pembeli minimal 3 karakter.");
      buyerName?.focus();
      return false;
    }

    if (!/^(\+62|62|0)8[1-9][0-9]{6,11}$/.test(whatsapp)) {
      showPaymentMessage("Nomor WhatsApp tidak valid. Gunakan format 08xxxxxxxxxx.");
      buyerWhatsapp?.focus();
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showPaymentMessage("Format email tidak valid.");
      buyerEmail?.focus();
      return false;
    }

    if (!method) {
      showPaymentMessage("Silakan pilih metode pembayaran.");
      paymentMethod?.focus();
      return false;
    }

    if (!agreementCheck?.checked) {
      showPaymentMessage("Kamu harus menyetujui ketentuan penggunaan data.");
      agreementCheck?.focus();
      return false;
    }

    return true;
  }

  function renderLocationDropdown(list) {
    locationDropdown.innerHTML = "";
    if (!list.length) {
      locationDropdown.innerHTML = `<div class="public-location-item">Lokasi tidak ditemukan</div>`;
      return;
    }
    list.forEach((location) => {
      const item = document.createElement("div");
      item.className = "public-location-item";
      item.textContent = location.name;
      item.addEventListener("click", function () {
        selectedLocation = location;
        locationInput.value = location.name;
        locationDropdown.classList.add("hidden-dropdown");
        updateSummary();
      });
      locationDropdown.appendChild(item);
    });
  }

  function filterLocations(keyword) {
    const key = keyword.trim().toLowerCase();
    if (!key) return availableLocations;
    return availableLocations.filter((item) => item.name.toLowerCase().includes(key));
  }

  // Event listeners — masing-masing SATU kali
  openBtn.addEventListener("click", function (e) {
    e.preventDefault();
    openPublicPage();
  });

  if (backBtn)
    backBtn.addEventListener("click", function () {
      closePublicPage();
    });

  if (locationInput) {
    locationInput.addEventListener("input", function (e) {
      const filtered = filterLocations(e.target.value);
      renderLocationDropdown(filtered);
      locationDropdown.classList.remove("hidden-dropdown");

      if (
        !selectedLocation ||
        selectedLocation.name.toLowerCase() !== e.target.value.toLowerCase()
      ) {
        selectedLocation = null;
        updateSummary();
      }
      if (typeof isLoggedIn === "function" && !isLoggedIn()) {
        if (typeof showAccessNotice === "function") {
          showAccessNotice(
            "Login Diperlukan",
            "Silakan login terlebih dahulu untuk membeli akses.",
          );
        }
        return;
      }

      openPublicPage();
    });

    locationInput.addEventListener("focus", function () {
      renderLocationDropdown(availableLocations);
      locationDropdown.classList.remove("hidden-dropdown");
    });
  }

  if (toggleDropdownBtn) {
    toggleDropdownBtn.addEventListener("click", function () {
      renderLocationDropdown(availableLocations);
      locationDropdown.classList.toggle("hidden-dropdown");
    });
  }

  // Tombol "Lihat overview data" — SATU listener saja
  optionLabels.forEach((btn) => {
    btn.addEventListener("click", function () {
      if (typeof openModal === "function") {
        openModal(btn.dataset.modal);
        return;
      }

      console.warn("openModal tidak tersedia.");
    });
  });

  if (toggleInundasi) toggleInundasi.addEventListener("change", updateSummary);
  if (toggleRisiko) toggleRisiko.addEventListener("change", updateSummary);

  if (paymentBtn) {
    paymentBtn.addEventListener("click", async function () {
      if (!selectedLocation) {
        alert("Silakan pilih lokasi terlebih dahulu.");
        return;
      }

      if (!toggleInundasi.checked && !toggleRisiko.checked) {
        alert("Silakan pilih minimal satu jenis data.");
        return;
      }

      if (!canAccessSelectedLocation(selectedLocation)) {
        showPaymentAccessNotice(
          "Akses Ditolak",
          "Akun mitra kamu hanya bisa mengakses data sesuai wilayah yang terdaftar.",
        );
        return;
      }

      const summary = getPaymentSummaryData();
      const isFree = summary.isFree;

      const purchaseData = {
        location: selectedLocation,
        items: {
          inundasi: toggleInundasi.checked,
          risiko: toggleRisiko.checked,
        },
        productNames: summary.products,
        summary: {
          itemCount: summary.totalItems,
          subtotal: summary.total,
          adminFee: summary.adminFee,
          totalPrice: summary.total,
          isFree: summary.isFree,
        },
      };

      localStorage.setItem("publicPurchaseData", JSON.stringify(purchaseData));

      if (isFree) {
        await handleSecureAuthorizedDownload(purchaseData);
        return;
      }

      openPaymentPage();
    });
  }

  // Modal close — SATU listener saja
  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
  if (modalOverlay) modalOverlay.addEventListener("click", closeModal);

  document.addEventListener("click", function (e) {
    if (locationDropdown && !e.target.closest(".public-search-wrapper")) {
      locationDropdown.classList.add("hidden-dropdown");
    }
  });

  updateSummary();

  if (paymentForm) {
    paymentForm.addEventListener("submit", function (e) {
      e.preventDefault();

      if (!validatePaymentForm()) return;

      const rawPurchaseData = localStorage.getItem("publicPurchaseData");
      if (!rawPurchaseData) {
        showPaymentMessage(
          "Data pembelian tidak ditemukan. Silakan ulangi dari halaman pemilihan data.",
          "error",
        );
        return;
      }

      const purchaseData = JSON.parse(rawPurchaseData);

      const payload = {
        buyerName: buyerName?.value.trim(),
        buyerWhatsapp: buyerWhatsapp?.value.trim(),
        buyerEmail: buyerEmail?.value.trim(),
        buyerInstitution: buyerInstitution?.value.trim() || "",
        buyerPurpose: document.getElementById("buyerPurpose")?.value || "",
        paymentMethod: paymentMethod?.value || "",
        buyerNotes: document.getElementById("buyerNotes")?.value.trim() || "",
        location: purchaseData.location?.name || "",
        products: purchaseData.productNames || [],
        totalItems: purchaseData.summary?.itemCount || 0,
        adminFee: purchaseData.summary?.adminFee || 0,
        totalPayment: purchaseData.summary?.totalPrice || 0,
      };

      localStorage.setItem("paymentDraftData", JSON.stringify(payload));
      console.log("PAYMENT STEP 1 PAYLOAD:", payload);

      if (!paymentInstructionPage) {
        console.error("paymentInstructionPage tidak ditemukan");
        return;
      }

      paymentPage.classList.remove("active");
      paymentPage.classList.add("hidden-page");

      paymentInstructionPage.classList.remove("hidden-page");
      paymentInstructionPage.classList.add("active");

      showPaymentInstructionStep(payload, purchaseData);
    });
  }

  function showPaymentInstructionStep(payload, purchaseData) {
    const paymentFormCard = document.getElementById("paymentFormCard");
    const paymentInstructionSection = document.getElementById("paymentInstructionSection");

    const instructionTotalPayment = document.getElementById("instructionTotalPayment");
    const instructionDeliveryEmail = document.getElementById("instructionDeliveryEmail");
    const deliveryEmail = document.getElementById("deliveryEmail");

    const paymentProofLabel = document.getElementById("paymentProofLabel");
    const paymentProofHint = document.getElementById("paymentProofHint");
    const paymentProof = document.getElementById("paymentProof");
    const paymentSummaryCard = document.getElementById("paymentSummaryCard");

    if (instructionTotalPayment) {
      instructionTotalPayment.textContent = formatRupiah(purchaseData.summary?.totalPrice || 0);
    }

    if (deliveryEmail) {
      deliveryEmail.value = payload.buyerEmail || "";
    }

    if (instructionDeliveryEmail) {
      instructionDeliveryEmail.textContent = payload.buyerEmail || "-";
    }

    if (isMitraPaymentUser()) {
      if (paymentProofLabel) {
        paymentProofLabel.textContent = "Upload Dokumen Identitas / Surat Mitra";
      }
      if (paymentProofHint) {
        paymentProofHint.textContent =
          "Khusus mitra: upload file PDF identitas, surat tugas, atau surat mitra.";
      }
      if (paymentProof) {
        paymentProof.accept = ".pdf";
      }
    } else {
      if (paymentProofLabel) {
        paymentProofLabel.textContent = "Upload Bukti Pembayaran";
      }
      if (paymentProofHint) {
        paymentProofHint.textContent = "Upload bukti transfer dalam format JPG, PNG, atau PDF.";
      }
      if (paymentProof) {
        paymentProof.accept = ".jpg,.jpeg,.png,.pdf";
      }
    }

    const paymentPage = document.getElementById("paymentPage");
    const paymentInstructionPage = document.getElementById("paymentInstructionPage");

    if (paymentPage) {
      paymentPage.classList.add("hidden-page");
    }

    if (paymentInstructionPage) {
      paymentInstructionPage.classList.remove("hidden-page");
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  if (backToPublicDownloadBtn) {
    backToPublicDownloadBtn.addEventListener("click", function () {
      const paymentPage = document.getElementById("paymentPage");
      const publicDownloadPage = document.getElementById("publicDownloadPage");
      const paymentInstructionSection = document.getElementById("paymentInstructionSection");
      const paymentFormCard = document.getElementById("paymentFormCard");
      const paymentSummaryCard = document.getElementById("paymentSummaryCard");

      if (paymentInstructionSection) paymentInstructionSection.classList.add("d-none");
      if (paymentFormCard) paymentFormCard.classList.remove("d-none");
      if (paymentSummaryCard) paymentSummaryCard.classList.remove("d-none");

      if (paymentPage) paymentPage.classList.add("hidden-page");
      if (publicDownloadPage) publicDownloadPage.classList.remove("hidden-page");

      showFinalPaymentMessage("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
});

export function openPublicDownloadPage(event) {
  if (event) event.preventDefault();
  const page = document.getElementById("publicDownloadPage");

  const backBtn = document.getElementById("backToCatalog");

  const locationInput = document.getElementById("locationInput");

  const toggleInundasi = document.getElementById("toggleInundasi");

  const toggleRisiko = document.getElementById("toggleRisiko");

  if (!page) return;

  /* RESET NAV */
  lastSourcePage = "catalog";
  lastDetailView = null;
  /* BACK BUTTON */
  if (backBtn) {
    backBtn.innerHTML = `
    <i class="fas fa-arrow-left"></i>
    <span>Kembali ke Katalog</span>
    `;
  }

  /* HIDE SEMUA VIEW */
  document.querySelectorAll(".detail-view, .view").forEach((view) => {
    view.classList.remove("active");
  });

  /* RESET FILTER */
  const isRestrictedMitra = isMitraPaymentUser() && !isAdminPaymentUser();

  const allowedLocations = getAllowedLocationsForCurrentUser();

  if (!isRestrictedMitra) {
    selectedLocation = null;
    locationInput && (locationInput.value = "");
    toggleInundasi && (toggleInundasi.checked = false);
    toggleRisiko && (toggleRisiko.checked = false);
  } else if (allowedLocations.length === 1) {
    selectedLocation = allowedLocations[0];
    locationInput && (locationInput.value = selectedLocation.name);
  }

  /* SHOW PAYMENT PAGE */
  page.classList.remove("hidden-page");

  /* INI YANG HILANG */
  page.classList.add("active");

  document.body.classList.add("hide-main-nav");

  document.body.style.overflow = "auto";

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });

  if (typeof window.updateSummary === "function") {
    window.updateSummary();
  }
}

window.openPublicDownloadPage = openPublicDownloadPage;

// ===== GO TO PUBLIC DOWNLOAD =====
function goToPublicDownload(type, wilayah = "cilacap") {
  if (window._paymentCompleted) return;

  localStorage.setItem("download_location", wilayah);
  localStorage.setItem("download_type", type);

  let sourceView = "catalog";
  const viewIds = [
    "inundationDetailView",
    "riskDetailView",
    "bakauheniInundationDetailView",
    "bakauheniRiskDetailView",
    "pertaminaDetailView",
    "bakauheniDetailView",
  ];

  viewIds.forEach((id) => {
    if (document.getElementById(id)?.classList.contains("active")) {
      sourceView = id;
    }
  });

  localStorage.setItem("public_download_source", sourceView);

  if (sourceView === "catalog") {
    lastSourcePage = "catalog";
    lastDetailView = null;
  } else {
    lastSourcePage = "detail";
    lastDetailView = document.getElementById(sourceView);
  }

  const backBtn = document.getElementById("backToCatalog");
  if (backBtn) {
    backBtn.innerHTML =
      lastSourcePage === "detail"
        ? '<i class="fas fa-arrow-left"></i><span>Kembali ke Detail</span>'
        : '<i class="fas fa-arrow-left"></i><span>Kembali ke Katalog</span>';
  }

  document.querySelectorAll(".detail-view, .view").forEach((view) => {
    view.classList.remove("active");
  });

  const publicDownloadPage = document.getElementById("publicDownloadPage");
  if (!publicDownloadPage) return;

  publicDownloadPage.classList.remove("hidden-page");
  document.body.style.overflow = "hidden";

  const locationInput = document.getElementById("locationInput");
  const toggleInundasi = document.getElementById("toggleInundasi");
  const toggleRisiko = document.getElementById("toggleRisiko");
  const resolvedLocation = setSelectedLocationByKey(wilayah);

  if (locationInput) {
    locationInput.value = resolvedLocation ? resolvedLocation.name : "";
  }

  if (toggleInundasi) toggleInundasi.checked = type === "inundasi";
  if (toggleRisiko) toggleRisiko.checked = type === "risiko";

  if (typeof window.updateSummary === "function") {
    window.updateSummary();
  }

  window.scrollTo({ top: 0, behavior: "auto" });
}

window.goToPublicDownload = goToPublicDownload;

document.addEventListener("DOMContentLoaded", function () {
  if (window._paymentCompleted) return;

  const savedLocation = localStorage.getItem("download_location");
  const savedType = localStorage.getItem("download_type");

  const locationInput = document.getElementById("locationInput");
  const toggleInundasi = document.getElementById("toggleInundasi");
  const toggleRisiko = document.getElementById("toggleRisiko");

  const backToPaymentFormBtn = document.getElementById("backToPaymentFormBtn");
  const finalSubmitPaymentBtn = document.getElementById("finalSubmitPaymentBtn");
  const senderBank = document.getElementById("senderBank")?.value || "";

  const uploadTriggerBtn = document.getElementById("uploadTriggerBtn");
  const paymentProof = document.getElementById("paymentProof");
  const paymentFileText = document.getElementById("paymentFileText");

  if (uploadTriggerBtn && paymentProof) {
    uploadTriggerBtn.addEventListener("click", function () {
      paymentProof.click();
    });
  }
  if (paymentProof && paymentFileText) {
    paymentProof.addEventListener("change", function () {
      const file = this.files?.[0];

      if (file) {
        paymentFileText.textContent = file.name;
        paymentFileText.classList.add("payment-file-selected");
      } else {
        paymentFileText.textContent = "Belum ada file dipilih";
        paymentFileText.classList.remove("payment-file-selected");
      }
    });
  }

  backToPaymentFormBtn.addEventListener("click", function () {
    const paymentPage = document.getElementById("paymentPage");
    const paymentInstructionPage = document.getElementById("paymentInstructionPage");

    if (!paymentPage || !paymentInstructionPage) {
      console.error("Payment pages tidak ditemukan");
      return;
    }

    paymentInstructionPage.classList.remove("active");
    paymentInstructionPage.classList.add("hidden-page");

    paymentPage.classList.remove("hidden-page");
    paymentPage.classList.add("active");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });

  if (finalSubmitPaymentBtn) {
    finalSubmitPaymentBtn.addEventListener("click", async function (e) {
      if (e) e.preventDefault();

      if (!validateFinalPaymentStep()) return;

      const deliveryEmailInput = document.getElementById("deliveryEmail");
      const senderBankSelect = document.getElementById("senderBank");
      const paymentProofInput = document.getElementById("paymentProof");
      const backButton = document.getElementById("backToPaymentFormBtn");

      const deliveryEmail = deliveryEmailInput?.value.trim() || "";
      const senderBank = senderBankSelect?.value || "";
      const selectedFile = paymentProofInput?.files?.[0] || null;

      const draftRaw = localStorage.getItem("paymentDraftData");
      const draftData = draftRaw ? JSON.parse(draftRaw) : {};

      if (!selectedFile) {
        showFinalPaymentMessage("Silakan upload file terlebih dahulu.", "error");
        return;
      }

      const formData = new FormData();
      formData.append("buyerName", draftData.buyerName || "");
      formData.append("buyerWhatsapp", draftData.buyerWhatsapp || "");
      formData.append("buyerEmail", draftData.buyerEmail || "");
      formData.append("deliveryEmail", deliveryEmail);
      formData.append("senderBank", senderBank);
      formData.append("buyerInstitution", draftData.buyerInstitution || "");
      formData.append("buyerPurpose", draftData.buyerPurpose || "");
      formData.append("buyerNotes", draftData.buyerNotes || "");
      formData.append("locationName", draftData.location || "");
      formData.append(
        "productNames",
        Array.isArray(draftData.products) ? draftData.products.join(", ") : "",
      );
      formData.append("totalItems", draftData.totalItems || 0);
      formData.append("adminFee", draftData.adminFee || 0);
      formData.append("totalPayment", draftData.totalPayment || 0);
      formData.append("verificationType", draftData.verificationType || "bukti-transfer");
      formData.append("paymentProof", selectedFile);

      try {
        this.disabled = true;
        this.textContent = "Mengirim...";
        showFinalPaymentMessage(
          "Sedang mengupload file. Mohon tunggu, proses ini bisa memakan waktu beberapa detik.",
          "success",
        );

        const response = await fetch(`${API_BASE_URL}/api/payment/submit`, {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          showFinalPaymentMessage(data.message || "Gagal mengirim bukti pembayaran.", "error");
          this.disabled = false;
          this.textContent = "Kirim Bukti & Selesaikan";
          return;
        }

        window._paymentCompleted = true;

        localStorage.removeItem("paymentDraftData");
        localStorage.removeItem("download_location");
        localStorage.removeItem("download_type");
        localStorage.removeItem("publicPurchaseData");
        localStorage.removeItem("public_download_source");

        this.textContent = "✓ Terkirim";
        this.disabled = true;
        this.style.opacity = "0.7";
        this.style.cursor = "not-allowed";

        if (backButton) backButton.disabled = true;
        if (deliveryEmailInput) deliveryEmailInput.disabled = true;
        if (paymentProofInput) paymentProofInput.disabled = true;

        const successMsg =
          data.message || "Bukti pembayaran berhasil dikirim. Tim INAMI akan memverifikasi.";
        const modal = document.getElementById("paymentSuccessModal");
        const modalMsg = document.getElementById("paymentSuccessModalMsg");
        const homeBtn = document.getElementById("paymentSuccessHomeBtn");

        if (modalMsg) modalMsg.textContent = successMsg;
        if (modal) modal.style.display = "flex";

        if (homeBtn) {
          const newBtn = homeBtn.cloneNode(true);
          homeBtn.parentNode.replaceChild(newBtn, homeBtn);

          newBtn.addEventListener("click", function () {
            if (modal) modal.style.display = "none";

            window._paymentCompleted = false;

            const paymentPage = document.getElementById("paymentPage");
            const paymentInstructionPage = document.getElementById("paymentInstructionPage");
            const publicDownloadPage = document.getElementById("publicDownloadPage");

            if (paymentPage) {
              paymentPage.classList.add("hidden-page");
              paymentPage.classList.remove("active");
            }

            if (paymentInstructionPage) {
              paymentInstructionPage.classList.add("hidden-page");
              paymentInstructionPage.classList.remove("active");
            }

            if (publicDownloadPage) {
              publicDownloadPage.classList.add("hidden-page");
              publicDownloadPage.classList.remove("active");
            }

            document.body.style.overflow = "";

            document.body.classList.remove("hide-main-nav");

            document.querySelectorAll(".view, .detail-view").forEach(function (el) {
              el.classList.remove("active");
            });

            const homeView = document.getElementById("homeView");

            if (homeView) {
              homeView.classList.add("active");
            }

            window.scrollTo({
              top: 0,
              behavior: "smooth",
            });

            if (typeof handleNavbarBackground === "function") {
              handleNavbarBackground();
            }
          });
        }
      } catch (error) {
        console.error("submit payment error:", error);

        showFinalPaymentMessage(
          "Server lokal tidak dapat dihubungi. Pastikan backend Express aktif.",
          "error",
        );

        this.disabled = false;
        this.textContent = "Kirim Bukti & Selesaikan";
      }
    });
  }

  if (savedLocation) {
    const restoredLocation = setSelectedLocationByKey(savedLocation);
    if (locationInput) {
      locationInput.value = restoredLocation ? restoredLocation.name : "";
    }
  }

  if (savedType === "risiko" && toggleRisiko) toggleRisiko.checked = true;
  if (savedType === "inundasi" && toggleInundasi) toggleInundasi.checked = true;
  if (typeof window.updateSummary === "function") {
    window.updateSummary();
  }

  const backToCatalog = document.getElementById("backToCatalog");
  if (backToCatalog) {
    backToCatalog.addEventListener("click", function (e) {
      e.preventDefault();
      const publicDownloadPage = document.getElementById("publicDownloadPage");
      if (publicDownloadPage) publicDownloadPage.classList.add("hidden-page");
      document.body.style.overflow = "";
      document.querySelectorAll(".view, .detail-view").forEach((el) => {
        el.classList.remove("active");
      });

      if (lastSourcePage === "detail" && lastDetailView) {
        document.body.classList.add("hide-main-nav");
        lastDetailView.classList.add("active");
        window.scrollTo(0, 0);
        return;
      }

      document.body.classList.remove("hide-main-nav");
      const homeView = document.getElementById("homeView");
      if (homeView) homeView.classList.add("active");

      setTimeout(() => {
        const catalogSection = document.getElementById("catalog");
        if (catalogSection) catalogSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);

      const backBtn = document.getElementById("backToCatalog");
      if (backBtn) backBtn.innerHTML = "← Kembali ke Katalog";
      if (typeof handleNavbarBackground === "function") handleNavbarBackground();
    });
  }

  localStorage.removeItem("download_location");
  localStorage.removeItem("download_type");
});

if (typeof closeAllDetailViews === "function") {
  closeAllDetailViews();
}

function showFinalPaymentMessage(message, type = "error") {
  const el = document.getElementById("finalPaymentMessage");
  if (!el) return;

  el.textContent = message || "";
  el.classList.remove("d-none", "success", "error");

  if (!message) {
    el.classList.add("d-none");
    return;
  }

  el.classList.add(type === "success" ? "success" : "error");
}

function validateFinalPaymentStep() {
  const deliveryEmailInput = document.getElementById("deliveryEmail");
  const senderBankSelect = document.getElementById("senderBank");
  const paymentProofInput = document.getElementById("paymentProof");

  const deliveryEmail = deliveryEmailInput?.value.trim() || "";
  const senderBank = senderBankSelect?.value || "";
  const selectedFile = paymentProofInput?.files?.[0] || null;

  if (!deliveryEmail) {
    showFinalPaymentMessage("Email pengiriman data wajib diisi.", "error");
    deliveryEmailInput?.focus();
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(deliveryEmail)) {
    showFinalPaymentMessage("Format email pengiriman tidak valid.", "error");
    deliveryEmailInput?.focus();
    return false;
  }

  if (!senderBank) {
    showFinalPaymentMessage("Silakan pilih bank pengirim.", "error");
    senderBankSelect?.focus();
    return false;
  }

  if (!selectedFile) {
    showFinalPaymentMessage("Silakan upload file terlebih dahulu.", "error");
    paymentProofInput?.focus();
    return false;
  }

  const maxSize = 5 * 1024 * 1024;
  if (selectedFile.size > maxSize) {
    showFinalPaymentMessage("Ukuran file maksimal 5 MB.", "error");
    return false;
  }

  const fileName = selectedFile.name.toLowerCase();
  const allowed = [".jpg", ".jpeg", ".png", ".pdf"];
  const isAllowed = allowed.some((ext) => fileName.endsWith(ext));

  if (!isAllowed) {
    showFinalPaymentMessage("Format file tidak didukung. Gunakan JPG, PNG, atau PDF.", "error");
    return false;
  }

  showFinalPaymentMessage("");
  return true;
}
