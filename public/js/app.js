let selectedLocation = null;
let lastSourcePage = "catalog";
let lastDetailView = null;
let inundationDetailMap = null;
let bakauheniInundationDetailMap = null;
let miniRiskRasterMap = null;
let miniRiskLayer = null;
let bakauheniMiniRiskRasterMap = null;
let bakauheniMiniRiskLayer = null;

import { API_BASE_URL } from "./config.js";
import { openPublicDownloadPage } from "./payment.js";

/* ================= AKSES MITRA / PREMIUM ================= */

function openPartnerFeature(event) {
  if (event) event.preventDefault();
  if (!isLoggedIn()) {
    alert("Silakan login terlebih dahulu.");
    openLogin();
    return;
  }
  if (!hasRole(["mitra", "admin"])) {
    alert("Fitur ini hanya tersedia untuk mitra.");
    return;
  }
  alert("Akses mitra diterima.");
}

function openPremiumFeature(event) {
  if (event) event.preventDefault();
  if (!isLoggedIn()) {
    alert("Silakan login terlebih dahulu.");
    openLogin();
    return;
  }
  if (!hasRole(["mitra", "admin"])) {
    alert("Fitur ini hanya tersedia untuk pengguna premium.");
    return;
  }
  alert("Akses premium diterima.");
}

function requireLoginForPurchase(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (!isLoggedIn()) {
    showAccessNotice("Login Diperlukan", "Silakan login terlebih dahulu untuk membeli akses.");
    return;
  }

  /* USER SUDAH LOGIN
→ buka halaman payment */
  openPublicDownloadPage(event);
}

window.requireLoginForPurchase = requireLoginForPurchase;

function getMitraWilayah() {
  try {
    const raw = localStorage.getItem("inami_auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.user?.wilayah?.toLowerCase() || null;
  } catch (error) {
    console.error("Gagal membaca wilayah mitra:", error);
    return null;
  }
}

async function openReportUrl(reportId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/report/download/${reportId}`, {
      method: "GET",
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      showAccessNotice(
        "Gagal Mengunduh",
        data.message || "Terjadi kesalahan saat mengambil link report.",
      );
      return;
    }

    if (!data.url) {
      showAccessNotice("Link Tidak Valid", "Signed URL tidak berhasil dibuat.");
      return;
    }

    const link = document.createElement("a");
    link.href = data.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();

    if (typeof showToast === "function") {
      const label = reportId === "cilacap" ? "Report Cilacap" : "Report Bakauheni";
      showToast(`${label} sedang dibuka.`);
    }
  } catch (err) {
    console.error("openReportUrl error:", err);
    showAccessNotice("Error", "Tidak dapat menghubungi server.");
  }
}

function downloadPartnerReport(event) {
  if (event) event.preventDefault();

  if (!isLoggedIn()) {
    showAccessNotice("Login Diperlukan", "Silakan login terlebih dahulu untuk mengunduh laporan.");
    return;
  }

  if (!hasRole(["admin", "mitra"])) {
    showAccessNotice("Akses Ditolak", "Laporan ini hanya tersedia untuk admin dan mitra.");
    return;
  }

  if (hasRole(["admin"])) {
    showPartnerReportModal();
    return;
  }

  const wilayah = getMitraWilayah();

  if (!wilayah) {
    showAccessNotice("Data Tidak Lengkap", "Wilayah mitra tidak ditemukan. Hubungi administrator.");
    return;
  }

  if (wilayah === "cilacap") {
    openReportUrl("cilacap");
    return;
  }

  if (wilayah === "bakauheni") {
    openReportUrl("bakauheni");
    return;
  }

  showAccessNotice(
    "Wilayah Tidak Dikenali",
    `Wilayah "${wilayah}" tidak memiliki laporan tersedia.`,
  );
}

function showPartnerReportModal() {
  const modal = document.getElementById("adminReportPickerModal");
  if (!modal) {
    console.warn("Modal admin report picker tidak ditemukan.");
    return;
  }

  modal.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closePartnerReportModal() {
  const modal = document.getElementById("adminReportPickerModal");
  if (!modal) return;

  modal.style.display = "none";
  document.body.style.overflow = "";
}

function downloadCilacapReport(event) {
  if (event) event.preventDefault();

  if (!isLoggedIn()) {
    showAccessNotice("Login Diperlukan", "Silakan login terlebih dahulu untuk mengunduh laporan.");
    return;
  }

  if (!hasRole(["admin", "mitra"])) {
    showAccessNotice("Akses Ditolak", "Laporan ini hanya tersedia untuk admin dan mitra.");
    return;
  }

  if (hasRole(["mitra"]) && getMitraWilayah() !== "cilacap") {
    showAccessNotice("Akses Ditolak", "Anda hanya dapat mengunduh laporan wilayah Anda.");
    return;
  }

  openReportUrl("cilacap");
}

function downloadBakauheniReport(event) {
  if (event) event.preventDefault();

  if (!isLoggedIn()) {
    showAccessNotice("Login Diperlukan", "Silakan login terlebih dahulu untuk mengunduh laporan.");
    return;
  }

  if (!hasRole(["admin", "mitra"])) {
    showAccessNotice("Akses Ditolak", "Laporan ini hanya tersedia untuk admin dan mitra.");
    return;
  }

  if (hasRole(["mitra"]) && getMitraWilayah() !== "bakauheni") {
    showAccessNotice("Akses Ditolak", "Anda hanya dapat mengunduh laporan wilayah Anda.");
    return;
  }

  openReportUrl("bakauheni");
}

function openPartnerReports(event) {
  if (event) event.preventDefault();
  if (!isLoggedIn()) {
    showAccessNotice(
      "Akses Report Mitra",
      "Fitur ini khusus untuk mitra. Silakan login terlebih dahulu.",
    );
    return;
  }
  if (!hasRole(["admin", "mitra"])) {
    showAccessNotice("Akses Ditolak", "Fitur ini hanya tersedia untuk mitra.");
    return;
  }
  openProjects(event);
}

function showAccessNotice(title, message) {
  // Hapus overlay lama jika ada
  const existing = document.getElementById("_accessNoticeOverlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "_accessNoticeOverlay";
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  overlay.innerHTML = `
    <div style="
      background: #fff;
      border-radius: 12px;
      padding: 36px 32px;
      max-width: 440px;
      width: 90%;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0,0,0,0.18);
    ">
      <div style="font-size: 2rem; margin-bottom: 12px;">🔒</div>
      <h5 style="font-weight: 700; margin-bottom: 10px;">${title}</h5>
      <p style="color: #666; margin-bottom: 24px;">${message}</p>
      <button id="_accessNoticeOK" style="
        background: #003049;
        color: #fff;
        border: none;
        border-radius: 8px;
        padding: 10px 32px;
        font-weight: 600;
        cursor: pointer;
        font-size: 1rem;
      ">OK</button>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById("_accessNoticeOK").addEventListener("click", () => {
    overlay.remove();
  });

  // Tutup juga kalau klik backdrop
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

/* ================= RISK DOWNLOAD CARD CONFIG ================= */

const riskDownloadMenuConfig = {
  cilacap: [
    {
      title: "Data Indeks Bahaya",
      type: "main",
    },
    {
      title: "Data Indeks Kerentanan",
      type: "main",
      variant: "danger",
      children: [
        {
          title: "Data Indeks Parameter Populasi Terpapar",
          type: "sub",
          locked: true,
          children: {
            criteria: [
              "Data Indeks Kriteria Kepadatan Pekerja",
              "Data Indeks Kriteria Sensitivitas Pekerja",
            ],
            subcriteria: [
              "Data Indeks Sub-Kriteria Rasio Gender",
              "Data Indeks Sub-Kriteria Rasio Usia Rentan",
              "Data Indeks Sub-Kriteria Pekerja Difabel",
              "Data Indeks Sub-Kriteria Rasio Petugas K3",
            ],
          },
        },
        {
          title: "Data Indeks Parameter Kerentanan Finansial",
          type: "sub",
          locked: true,
        },
        {
          title: "Data Indeks Parameter Kerentanan Fisik",
          type: "sub",
          locked: true,
          children: {
            criteria: ["Data Indeks Kriteria Nilai Aset", "Data Indeks Kriteria Jenis Aset"],
          },
        },
      ],
    },
    {
      title: "Data Indeks Kapasitas",
      type: "main",
    },
  ],

  bakauheni: [
    {
      title: "Data Indeks Bahaya",
      type: "main",
    },
    {
      title: "Data Indeks Kerentanan",
      type: "main",
      variant: "danger",
      children: [
        {
          title: "Data Indeks Parameter Populasi Terpapar",
          type: "sub",
          locked: false,
          children: {
            groupedCriteria: [
              {
                criterion: "Data Indeks Kriteria Kepadatan Populasi",
                subcriteria: [
                  "Data Indeks Sub-Kriteria Kepadatan Pekerja",
                  "Data Indeks Sub-Kriteria Kepadatan Pengunjung",
                ],
              },
              {
                criterion: "Data Indeks Kriteria Sensitivitas Populasi",
                subcriteria: [
                  "Data Indeks Sub-Kriteria Rasio Gender",
                  "Data Indeks Sub-Kriteria Rasio Usia Rentan",
                  "Data Indeks Sub-Kriteria Pekerja Difabel",
                  "Data Indeks Sub-Kriteria Rasio Petugas K3",
                ],
              },
            ],
          },
        },
        {
          title: "Data Indeks Parameter Kerentanan Finansial",
          type: "sub",
          locked: true,
        },
        {
          title: "Data Indeks Parameter Kerentanan Fisik",
          type: "sub",
          locked: true,
          children: {
            criteria: ["Data Indeks Kriteria Nilai Aset", "Data Indeks Kriteria Jenis Aset"],
          },
        },
      ],
    },
    {
      title: "Data Indeks Kapasitas",
      type: "main",
    },
  ],
};

function createArrowIcon(isOpen = false) {
  return `<span class="risk-pill-arrow ${isOpen ? "rotated" : ""}">▼</span>`;
}

function createLockIcon() {
  return "";
}

function createLeafPill(text, mode = "criteria", locked = false) {
  return `
    <div class="risk-leaf-pill is-${mode} ${locked ? "has-lock" : ""}">
      ${locked ? createLockIcon() : ""}
      <span class="risk-pill-label">${text}</span>
    </div>
  `;
}

function buildNestedContent(childrenData) {
  if (!childrenData) return "";

  let html = `<div class="risk-nested-panel">`;

  // Pola lama: criteria biasa
  if (Array.isArray(childrenData.criteria) && childrenData.criteria.length) {
    html += `<div class="risk-criteria-list">`;
    childrenData.criteria.forEach((item) => {
      html += createLeafPill(item, "criteria", false);
    });
    html += `</div>`;
  }

  // Pola lama: subcriteria biasa
  if (Array.isArray(childrenData.subcriteria) && childrenData.subcriteria.length) {
    html += `
      <div class="risk-subcriteria-list two-col" style="margin-top:6px;">
        ${childrenData.subcriteria.map((item) => createLeafPill(item, "subcriteria", false)).join("")}
      </div>
    `;
  }

  // Pola baru: groupedCriteria → criterion lalu subcriteria langsung di bawahnya
  if (Array.isArray(childrenData.groupedCriteria) && childrenData.groupedCriteria.length) {
    childrenData.groupedCriteria.forEach((group, index) => {
      html += `
        <div class="risk-criteria-list" style="margin-top:${index === 0 ? 0 : 6}px;">
          ${createLeafPill(group.criterion, "criteria", false)}
        </div>
      `;

      if (Array.isArray(group.subcriteria) && group.subcriteria.length) {
        html += `
          <div class="risk-subcriteria-list ${group.subcriteria.length === 1 ? "one-col" : "two-col"}" style="margin-top:6px;">
            ${group.subcriteria.map((item) => createLeafPill(item, "subcriteria", false)).join("")}
          </div>
        `;
      }
    });
  }

  // Pola lama: grouped subcriteria
  if (Array.isArray(childrenData.subcriteriaGrouped) && childrenData.subcriteriaGrouped.length) {
    childrenData.subcriteriaGrouped.forEach((group, groupIndex) => {
      html += `
        <div class="risk-subcriteria-list ${group.length === 1 ? "one-col" : "two-col"}" style="margin-top:${groupIndex === 0 ? 6 : 8}px;">
          ${group.map((item) => createLeafPill(item, "subcriteria", false)).join("")}
        </div>
      `;
    });
  }

  html += `</div>`;
  return html;
}

function buildSubItem(item, locationKey, parentIndex, childIndex) {
  const hasChildren = !!item.children;
  const targetId = `${locationKey}-sub-${parentIndex}-${childIndex}`;

  return `
    <div class="risk-subgroup">
      <button
        type="button"
        class="risk-subpill-btn ${item.locked ? "has-lock" : ""} ${hasChildren ? "is-clickable" : ""}"
        ${hasChildren ? `data-risk-toggle="${targetId}"` : ""}
      >
        <span class="risk-pill-label">${item.title}</span>
        ${hasChildren ? createArrowIcon(false) : ""}
      </button>

      ${
        hasChildren
          ? `
        <div class="risk-subcontent" id="${targetId}" hidden>
          ${buildNestedContent(item.children)}
        </div>
      `
          : ""
      }
    </div>
  `;
}

function buildMainItem(item, locationKey, index) {
  const hasChildren = Array.isArray(item.children) && item.children.length;
  const targetId = `${locationKey}-main-${index}`;

  return `
    <div class="risk-main-group">
      <button
        type="button"
        class="risk-pill-btn ${item.variant === "danger" ? "is-danger" : ""} ${hasChildren ? "is-clickable" : ""}"
        ${hasChildren ? `data-risk-toggle="${targetId}"` : ""}
      >
        <span class="risk-pill-label">${item.title}</span>
        ${hasChildren ? createArrowIcon(false) : ""}
      </button>

      ${
        hasChildren
          ? `
        <div class="risk-child-panel" id="${targetId}" hidden>
          ${item.children.map((child, childIndex) => buildSubItem(child, locationKey, index, childIndex)).join("")}
        </div>
      `
          : ""
      }
    </div>
  `;
}

function renderRiskDownloadCard(containerId, locationKey) {
  const container = document.getElementById(containerId);
  const config = riskDownloadMenuConfig[locationKey];

  if (!container || !config) return;

  container.innerHTML = config
    .map((item, index) => buildMainItem(item, locationKey, index))
    .join("");
}

function collapseSiblingPanels(scope, exceptId = null) {
  if (!scope) return;

  scope.querySelectorAll("[id]").forEach((panel) => {
    if (!panel.id.startsWith("cilacap-") && !panel.id.startsWith("bakauheni-")) return;
    if (panel.id === exceptId) return;

    panel.hidden = true;

    const trigger = scope.querySelector(`[data-risk-toggle="${panel.id}"]`);
    if (trigger) {
      const arrow = trigger.querySelector(".risk-pill-arrow");
      trigger.classList.remove("is-expanded");
      if (arrow) arrow.classList.remove("rotated");
    }
  });
}

function setupRiskDownloadCardEvents() {
  document.querySelectorAll("[data-risk-toggle]").forEach((button) => {
    button.addEventListener("click", function () {
      const targetId = this.getAttribute("data-risk-toggle");
      const target = document.getElementById(targetId);
      if (!target) return;

      const wrapper = this.closest(".risk-download-card, .risk-child-panel");
      const isOpen = !target.hidden;

      if (!isOpen) {
        collapseSiblingPanels(wrapper, targetId);
      }

      target.hidden = isOpen;
      this.classList.toggle("is-expanded", !isOpen);

      const arrow = this.querySelector(".risk-pill-arrow");
      if (arrow) {
        arrow.classList.toggle("rotated", !isOpen);
      }
    });
  });
}

function initRiskDownloadCards() {
  renderRiskDownloadCard("cilacapRiskDownloadCard", "cilacap");
  renderRiskDownloadCard("bakauheniRiskDownloadCard", "bakauheni");
  setupRiskDownloadCardEvents();
}

/* ================= CILACAP DATA ================= */
async function initInundationDetailMap() {
  if (inundationDetailMap) return;

  inundationDetailMap = L.map("inundationDetailMap");

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
  }).addTo(inundationDetailMap);

  inundationDetailMap.setView([-7.717, 109.017], 13);

  loadInundationGeoRaster("cilacap")
    .then((layer) => {
      layer.addTo(inundationDetailMap);
      setTimeout(() => inundationDetailMap.invalidateSize(), 200);
    })
    .catch((err) => console.error("Detail Inundasi Cilacap failed:", err));
}

function openInundationData(event) {
  if (event) event.preventDefault();

  console.log("OPEN INUNDATION CALLED");

  document.body.classList.add("hide-main-nav");

  if (typeof closeAllDetailViews === "function") {
    closeAllDetailViews();
  }

  if (typeof pertaminaDetailView !== "undefined" && pertaminaDetailView) {
    pertaminaDetailView.classList.remove("active");
  }

  const inundationDetailView = document.getElementById("inundationDetailView");

  if (!inundationDetailView) {
    console.warn("Elemen #inundationDetailView tidak ditemukan.");
    return;
  }

  inundationDetailView.classList.add("active");

  document.body.style.overflow = "hidden";

  inundationDetailView.scrollTo({
    top: 0,
    behavior: "auto",
  });

  setTimeout(() => {
    initInundationDetailMap();
  }, 100);
}

async function openRiskData(event) {
  if (event) event.preventDefault();

  console.log("OPEN RISK CALLED");

  document.body.classList.add("hide-main-nav");

  if (typeof closeAllDetailViews === "function") {
    closeAllDetailViews();
  }

  if (typeof pertaminaDetailView !== "undefined" && pertaminaDetailView) {
    pertaminaDetailView.classList.remove("active");
  }

  const inundationDetailView = document.getElementById("inundationDetailView");

  const riskDetailView = document.getElementById("riskDetailView");

  if (!riskDetailView) {
    console.warn("riskDetailView tidak ditemukan");
    return;
  }

  if (inundationDetailView) {
    inundationDetailView.classList.remove("active");
  }

  riskDetailView.classList.add("active");

  document.body.style.overflow = "hidden";

  await loadRiskData();

  if (typeof updateRiskDashboard === "function") {
    updateRiskDashboard(cilacapRiskFeatures, currentRiskState || "DS1");
  }

  setTimeout(() => {
    renderMiniRiskMap(currentRiskState || "DS1");
  }, 120);

  riskDetailView.scrollTo({
    top: 0,
    behavior: "auto",
  });
}

function showDamageState(state) {
  const title = document.getElementById("damageStateTitle");

  const description = document.getElementById("damageStateDescription");

  const damageData = {
    DS1: {
      title: "DS1 - Minor Damage",
      description:
        "Kerusakan ringan pada elemen non-struktural bangunan. Bangunan masih dapat digunakan.",
    },

    DS2: {
      title: "DS2 - Moderate Damage",
      description: "Kerusakan sedang pada beberapa elemen bangunan namun masih dapat diperbaiki.",
    },

    DS3: {
      title: "DS3 - Extensive Damage",
      description: "Kerusakan berat pada elemen utama bangunan dan memerlukan rehabilitasi besar.",
    },

    DS4: {
      title: "DS4 - Complete Damage",
      description: "Bangunan mengalami kerusakan total dan umumnya tidak layak diperbaiki.",
    },
  };

  title.textContent = damageData[state].title;

  description.textContent = damageData[state].description;
}

function backToPertaminaDetail(event) {
  if (event) event.preventDefault();

  document.body.classList.remove("hide-main-nav");

  const inundationDetailView = document.getElementById("inundationDetailView");
  const riskDetailView = document.getElementById("riskDetailView");
  const detailView = document.getElementById("pertaminaDetailView");

  if (!detailView) {
    console.warn("Elemen #pertaminaDetailView tidak ditemukan.");
    return;
  }

  if (inundationDetailView) inundationDetailView.classList.remove("active");
  if (riskDetailView) riskDetailView.classList.remove("active");

  detailView.classList.add("active");
  document.body.style.overflow = "";
  detailView.scrollTo({ top: 0, behavior: "auto" });
}

function getZoneStyle(level) {
  if (level === "low")
    return { color: "#43a047", fillColor: "#66bb6a", fillOpacity: 0.55, weight: 2 };
  if (level === "medium")
    return { color: "#d89b00", fillColor: "#f4b400", fillOpacity: 0.55, weight: 2 };
  return { color: "#c62828", fillColor: "#d93025", fillOpacity: 0.55, weight: 2 };
}

/* ================= BAKAUHENI DATA ================= */
async function initBakauheniInundationDetailMap() {
  if (bakauheniInundationDetailMap) return;

  bakauheniInundationDetailMap = L.map("bakauheniInundationDetailMap");

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
  }).addTo(bakauheniInundationDetailMap);

  bakauheniInundationDetailMap.setView([-5.879, 105.75], 13);

  loadInundationGeoRaster("bakauheni")
    .then((layer) => {
      layer.addTo(bakauheniInundationDetailMap);
      setTimeout(() => bakauheniInundationDetailMap.invalidateSize(), 200);
    })
    .catch((err) => console.error("Detail Inundasi Bakauheni failed:", err));
}

function openBakauheniInundationData(event) {
  if (event) event.preventDefault();

  document.body.classList.add("hide-main-nav");

  const detailView = document.getElementById("bakauheniDetailView");
  const inundationView = document.getElementById("bakauheniInundationDetailView");
  const riskView = document.getElementById("bakauheniRiskDetailView");

  if (!inundationView) {
    console.warn("Elemen #bakauheniInundationDetailView tidak ditemukan.");
    return;
  }

  if (detailView) {
    detailView.classList.remove("active");
  }

  if (riskView) {
    riskView.classList.remove("active");
  }

  inundationView.classList.add("active");

  document.body.style.overflow = "hidden";

  inundationView.scrollTo({
    top: 0,
    behavior: "auto",
  });

  setTimeout(() => {
    initBakauheniInundationDetailMap();
  }, 100);
}

async function openBakauheniRiskData(event) {
  if (event) event.preventDefault();

  document.body.classList.add("hide-main-nav");

  const detailView = document.getElementById("bakauheniDetailView");

  const inundationView = document.getElementById("bakauheniInundationDetailView");

  const riskView = document.getElementById("bakauheniRiskDetailView");

  if (!riskView) {
    console.warn("bakauheniRiskDetailView tidak ditemukan");
    return;
  }

  if (detailView) detailView.classList.remove("active");

  if (inundationView) inundationView.classList.remove("active");

  riskView.classList.add("active");

  document.body.style.overflow = "hidden";

  await loadRiskData();

  if (typeof updateBakauheniRiskDashboard === "function") {
    updateBakauheniRiskDashboard(bakauheniRiskFeatures, currentRiskState || "DS1");
  }

  setTimeout(() => {
    renderBakauheniMiniRiskMap(currentRiskState || "DS1");
  }, 120);

  riskView.scrollTo({
    top: 0,
    behavior: "auto",
  });
}

function backToBakauheniDetail(event) {
  if (event) event.preventDefault();

  document.body.classList.remove("hide-main-nav");

  const inundationView = document.getElementById("bakauheniInundationDetailView");
  const riskView = document.getElementById("bakauheniRiskDetailView");
  const detailView = document.getElementById("bakauheniDetailView");

  if (!detailView) {
    console.warn("Elemen #bakauheniDetailView tidak ditemukan.");
    return;
  }

  if (inundationView) {
    inundationView.classList.remove("active");
  }

  if (riskView) {
    riskView.classList.remove("active");
  }

  detailView.classList.add("active");

  // kembalikan scroll normal
  document.body.style.overflow = "";

  // scroll ke atas (lebih aman)
  if (detailView) {
    detailView.scrollTo({ top: 0, behavior: "auto" });
  } else {
    window.scrollTo({ top: 0, behavior: "auto" });
  }
}

/*================== DOWNLOAD REPORT PDF ==================*/
function updateReportButtonState(buttonId, iconId) {
  const btn = document.getElementById(buttonId);
  const icon = document.getElementById(iconId);
  if (!btn || !icon) return;
  if (!isLoggedIn()) {
    icon.className = "fas fa-lock";
    return;
  }
  if (!hasRole(["admin", "mitra"])) {
    icon.className = "fas fa-lock";
    btn.style.opacity = "0.7";
    return;
  }
  icon.className = "fas fa-unlock";
}

/*================== Custom Alert ==================*/
function showCustomAlert(message) {
  const alertBox = document.getElementById("customAlert");
  const alertMsg = document.getElementById("customAlertMessage");
  if (!alertBox || !alertMsg) return;
  alertMsg.textContent = message;
  alertBox.classList.remove("hidden");
}

function closeCustomAlert() {
  const alertBox = document.getElementById("customAlert");
  if (alertBox) alertBox.classList.add("hidden");
}

function openMap(event) {
  if (event) event.preventDefault();
  const mapSection = document.getElementById("map");
  if (mapSection) {
    const yOffset = -110;
    const y = mapSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
  }
}

// ===== MODAL OVERVIEW — SATU DEFINISI, TIDAK DUPLIKAT =====

function openModal(type) {
  const modal = document.getElementById("customModal");
  const title = document.getElementById("modalTitle");
  const body = document.getElementById("modalBody");
  if (!modal || !title || !body) return;

  if (type === "inundasi") {
    title.textContent = "Overview Data Raster Inundasi Tsunami";
    body.innerHTML = `
      <p>Data ini berisi raster genangan tsunami hasil pemodelan untuk lokasi yang dipilih.</p>
      <ul style="padding-left:20px; margin:10px 0;">
        <li style="margin-bottom:6px;">Format data: GeoTIFF / raster</li>
        <li style="margin-bottom:6px;">Berisi area genangan hasil simulasi tsunami</li>
        <li style="margin-bottom:6px;">Dapat dibuka di QGIS, ArcGIS, dan software GIS lainnya</li>
        <li style="margin-bottom:6px;">Cocok untuk analisis zona terdampak</li>
      </ul>
    `;
  } else if (type === "risiko") {
    title.textContent = "Overview Data Raster Analisis Risiko Infrastruktur Pesisir";
    body.innerHTML = `
      <p>Data ini berisi hasil analisis risiko infrastruktur pesisir berdasarkan parameter bahaya dan paparan.</p>
      <ul style="padding-left:20px; margin:10px 0;">
        <li style="margin-bottom:6px;">Format data: raster / spasial</li>
        <li style="margin-bottom:6px;">Berisi kelas atau tingkat risiko</li>
        <li style="margin-bottom:6px;">Dapat digunakan untuk prioritas mitigasi</li>
        <li style="margin-bottom:6px;">Cocok untuk analisis lanjutan di GIS</li>
      </ul>
    `;
  }

  modal.style.display = "block";
  modal.style.pointerEvents = "auto";
  document.body.style.overflow = "hidden";
}

function closeModal() {
  const modal = document.getElementById("customModal");
  if (!modal) return;
  modal.style.display = "none";
  modal.style.pointerEvents = "none";
  document.body.style.overflow = "";
}

function openDetailView(viewId) {
  closeAllDetailViews();
  const targetView = document.getElementById(viewId);
  if (!targetView) return;
  targetView.classList.add("active");
  document.body.style.overflow = "hidden";
  targetView.scrollTo({ top: 0, behavior: "auto" });
}

function closePertaminaDataViews() {
  document.getElementById("inundationDetailView")?.classList.remove("active");
  document.getElementById("riskDetailView")?.classList.remove("active");
  document.body.style.overflow = "";
}

//EMAIL BERMITRA//
async function handleSubscribe(event) {
  event.preventDefault();

  const emailInput = document.getElementById("emailAddress");
  const errorEl = document.getElementById("emailError");
  const successEl = document.getElementById("emailSuccess");
  const submitBtn = document.getElementById("submitButton");

  // Reset state
  errorEl.style.display = "none";
  successEl.style.display = "none";
  emailInput.classList.remove("is-invalid");

  const email = emailInput.value.trim();

  if (!email) {
    emailInput.classList.add("is-invalid");
    errorEl.textContent = "Email wajib diisi.";
    errorEl.style.display = "block";
    return;
  }

  // Loading state
  submitBtn.disabled = true;
  submitBtn.textContent = "Mengirim...";

  try {
    const response = await fetch(`${API_BASE_URL}/api/contact/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      emailInput.classList.add("is-invalid");
      errorEl.textContent = data.message || "Gagal mengirim. Coba lagi.";
      errorEl.style.display = "block";
      return;
    }

    successEl.textContent = data.message;
    successEl.style.display = "block";
    emailInput.value = "";
    if (typeof showToast === "function") showToast("Permintaan bermitra terkirim!");
  } catch (error) {
    console.error("handleSubscribe error:", error);
    errorEl.textContent = "Server tidak dapat dihubungi. Coba lagi nanti.";
    errorEl.style.display = "block";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Notify Me!";
  }
}

function showFinalPaymentMessage(message, type = "error") {
  const el = document.getElementById("finalPaymentMessage");
  if (!el) return;

  el.textContent = message;
  el.classList.remove("d-none", "success", "error");
  el.classList.add(type);
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
  const isPdf = fileName.endsWith(".pdf");
  const isJpg = fileName.endsWith(".jpg");
  const isJpeg = fileName.endsWith(".jpeg");
  const isPng = fileName.endsWith(".png");

  if (!isPdf && !isJpg && !isJpeg && !isPng) {
    showFinalPaymentMessage("Format file tidak didukung. Gunakan JPG, PNG, atau PDF.", "error");
    return false;
  }

  showFinalPaymentMessage("", "error");
  document.getElementById("finalPaymentMessage")?.classList.add("d-none");

  return true;
}

// ===== HELPER: Inisialisasi semua custom select =====
function initCustomSelect(wrapperId, triggerId, textId, dropdownId, hiddenId) {
  const wrapper = document.getElementById(wrapperId);
  const trigger = document.getElementById(triggerId);
  const textEl = document.getElementById(textId);
  const dropdown = document.getElementById(dropdownId);
  const hidden = document.getElementById(hiddenId);
  if (!wrapper || !trigger || !dropdown) return;

  trigger.addEventListener("click", function (e) {
    e.stopPropagation();
    const isOpen = wrapper.classList.toggle("open");
    trigger.setAttribute("aria-expanded", isOpen);
  });

  trigger.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      trigger.click();
    } else if (e.key === "Escape") {
      wrapper.classList.remove("open");
      trigger.setAttribute("aria-expanded", "false");
    }
  });

  dropdown.querySelectorAll(".custom-select-option").forEach(function (opt) {
    opt.addEventListener("click", function () {
      dropdown.querySelectorAll(".custom-select-option").forEach(function (o) {
        o.classList.remove("selected");
      });
      opt.classList.add("selected");
      textEl.textContent = opt.dataset.value;
      textEl.classList.remove("placeholder");
      if (hidden) hidden.value = opt.dataset.value;
      wrapper.classList.remove("open");
      trigger.setAttribute("aria-expanded", "false");
    });
  });

  document.addEventListener("click", function (e) {
    if (!wrapper.contains(e.target)) {
      wrapper.classList.remove("open");
      trigger.setAttribute("aria-expanded", "false");
    }
  });
}

// Inisialisasi semua dropdown custom
initCustomSelect(
  "usagePurposeWrapper",
  "usagePurposeTrigger",
  "usagePurposeText",
  "usagePurposeDropdown",
  "usagePurpose",
);
initCustomSelect(
  "senderBankWrapper",
  "senderBankTrigger",
  "senderBankText",
  "senderBankDropdown",
  "senderBank",
);
initCustomSelect(
  "paymentMethodWrapper",
  "paymentMethodTrigger",
  "paymentMethodText",
  "paymentMethodDropdown",
  "paymentMethod",
);

function hasRole(roles = []) {
  const user = typeof window.getCurrentUser === "function" ? window.getCurrentUser() : null;

  if (!user || !user.role) return false;
  return roles.includes((user.role || "").toLowerCase());
}

function requireAuth(action) {
  const loggedIn = typeof window.isLoggedIn === "function" ? window.isLoggedIn() : false;

  if (!loggedIn) {
    if (typeof window.openLogin === "function") {
      window.openLogin();
    }
    return false;
  }

  if (typeof action === "function") {
    const user = typeof window.getCurrentUser === "function" ? window.getCurrentUser() : null;
    action(user);
  }

  return true;
}

document.addEventListener("DOMContentLoaded", function () {
  initRiskDownloadCards();
  initRiskStateButtons();
});

document.addEventListener("DOMContentLoaded", function () {
  const adminReportModal = document.getElementById("adminReportPickerModal");
  const adminReportCloseBtn = document.getElementById("adminReportCloseBtn");
  const adminDownloadCilacapBtn = document.getElementById("adminDownloadCilacapBtn");
  const adminDownloadBakauheniBtn = document.getElementById("adminDownloadBakauheniBtn");

  if (adminReportCloseBtn) {
    adminReportCloseBtn.addEventListener("click", function () {
      closePartnerReportModal();
    });
  }

  if (adminReportModal) {
    adminReportModal.addEventListener("click", function (e) {
      if (e.target === adminReportModal) {
        closePartnerReportModal();
      }
    });
  }

  if (adminDownloadCilacapBtn) {
    adminDownloadCilacapBtn.addEventListener("click", function () {
      closePartnerReportModal();
      openReportUrl("cilacap");
    });
  }

  if (adminDownloadBakauheniBtn) {
    adminDownloadBakauheniBtn.addEventListener("click", function () {
      closePartnerReportModal();
      openReportUrl("bakauheni");
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closePartnerReportModal();
    }
  });

  updateReportButtonState("downloadReportBtnCilacap", "downloadIconCilacap");
  updateReportButtonState("downloadReportBtnBakauheni", "downloadIconBakauheni");
});

document.addEventListener("DOMContentLoaded", function () {
  const overviewButtons = document.querySelectorAll(".public-option-label[data-modal]");

  overviewButtons.forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      const modalType = this.getAttribute("data-modal");
      if (!modalType) return;

      openModal(modalType);
    });
  });

  const closeModalBtn = document.getElementById("closeModalBtn");
  const modalOverlay = document.getElementById("modalOverlay");

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", function () {
      closeModal();
    });
  }

  if (modalOverlay) {
    modalOverlay.addEventListener("click", function () {
      closeModal();
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeModal();
    }
  });
});

function resetAppToHome() {
  // 1. Bersihkan localStorage yang terkait flow pembelian / payment
  [
    "download_location",
    "download_type",
    "public_download_source",
    "publicPurchaseData",
    "paymentDraftData",
  ].forEach((key) => localStorage.removeItem(key));

  // 2. Reset flag payment jika ada
  window._paymentCompleted = false;

  // 3. Tutup semua view/detail view
  document.querySelectorAll(".view, .detail-view").forEach((el) => {
    el.classList.remove("active");
  });

  // 4. Kembalikan ke homeView
  const homeView = document.getElementById("homeView");
  if (homeView) homeView.classList.add("active");

  // 5. Tutup halaman public download & payment kalau sedang terbuka
  const publicDownloadPage = document.getElementById("publicDownloadPage");
  const paymentPage = document.getElementById("paymentPage");
  if (publicDownloadPage) publicDownloadPage.classList.add("hidden-page");
  if (paymentPage) paymentPage.classList.add("hidden-page");

  // 6. Reset body scroll
  document.body.style.overflow = "";

  // 7. Reset form public download
  const locationInput = document.getElementById("locationInput");
  const toggleInundasi = document.getElementById("toggleInundasi");
  const toggleRisiko = document.getElementById("toggleRisiko");
  if (locationInput) locationInput.value = "";
  if (toggleInundasi) toggleInundasi.checked = false;
  if (toggleRisiko) toggleRisiko.checked = false;

  // 8. Reset form payment step 1
  document.getElementById("paymentForm")?.reset();

  // 9. Reset payment instruction step
  const paymentInstructionSection = document.getElementById("paymentInstructionSection");
  const paymentFormCard = document.getElementById("paymentFormCard");
  const paymentSummaryCard = document.getElementById("paymentSummaryCard");

  if (paymentInstructionSection) paymentInstructionSection.classList.add("d-none");
  if (paymentFormCard) paymentFormCard.classList.remove("d-none");
  if (paymentSummaryCard) paymentSummaryCard.classList.remove("d-none");

  // 10. Reset upload text kalau ada
  const paymentFileText = document.getElementById("paymentFileText");
  if (paymentFileText) {
    paymentFileText.textContent = "Belum ada file dipilih";
    paymentFileText.classList.remove("payment-file-selected");
  }

  // 11. Reset pesan validasi/payment
  const paymentFormMessage = document.getElementById("paymentFormMessage");
  const finalPaymentMessage = document.getElementById("finalPaymentMessage");
  if (paymentFormMessage) {
    paymentFormMessage.textContent = "";
    paymentFormMessage.classList.add("d-none");
    paymentFormMessage.classList.remove("success", "error");
  }
  if (finalPaymentMessage) {
    finalPaymentMessage.textContent = "";
    finalPaymentMessage.classList.add("d-none");
    finalPaymentMessage.classList.remove("success", "error");
  }

  // 12. Tutup modal overview kalau masih terbuka
  if (typeof closeModal === "function") {
    closeModal();
  }

  // 13. Tutup modal admin report picker kalau masih terbuka
  const adminReportPickerModal = document.getElementById("adminReportPickerModal");
  if (adminReportPickerModal) {
    adminReportPickerModal.style.display = "none";
  }

  // 14. Scroll ke atas
  window.scrollTo({ top: 0, behavior: "auto" });

  // 15. Refresh ringkasan kalau function ada
  if (typeof window.updateSummary === "function") {
    window.updateSummary();
  }

  // 16. Rapikan navbar state
  if (typeof handleNavbarBackground === "function") {
    handleNavbarBackground();
  }
}

const backBtn = document.getElementById("backToDashboardBtn");

if (backBtn) {
  backBtn.addEventListener("click", function () {
    openDashboard(); // atau fungsi balik ke home kamu
  });
}

function backToDashboardFromProjects(event) {
  if (event) event.preventDefault();

  const projectsAboutView = document.getElementById("projectsAboutView");
  const homeView = document.getElementById("homeView");

  document.querySelectorAll(".view, .detail-view").forEach((view) => {
    view.classList.remove("active");
  });

  if (projectsAboutView) {
    projectsAboutView.classList.remove("active");
    projectsAboutView.scrollTop = 0;
  }

  if (homeView) {
    homeView.classList.add("active");
  }

  window.scrollTo({ top: 0, behavior: "auto" });
  document.body.style.overflow = "";
}
// RISK and INUNDATION DETAIL VIEW
window.openInundationData = openInundationData;
window.openRiskData = openRiskData;
window.backToPertaminaDetail = backToPertaminaDetail;

window.openBakauheniInundationData = openBakauheniInundationData;
window.openBakauheniRiskData = openBakauheniRiskData;
window.backToBakauheniDetail = backToBakauheniDetail;

window.downloadCilacapReport = downloadCilacapReport;
window.downloadBakauheniReport = downloadBakauheniReport;
window.downloadPartnerReport = downloadPartnerReport;

window.openMap = openMap;
window.handleSubscribe = handleSubscribe;
window.closeModal = closeModal;
window.closeCustomAlert = closeCustomAlert;
window.resetAppToHome = resetAppToHome;

/* ======================= MAP MODULE ======================= */

let map;
let jalanLayer;
let inundasiLayer;
let riskLayer;
let mapBaseTileLayer;
let mapVectorRenderer;
let mapControlsInitialized = false;
let mapLazyObserver = null;
let activeMapLocation = "cilacap";
let mapLayerRequestId = 0;

let cilacapRiskFeatures = [];
let bakauheniRiskFeatures = [];
let riskDataLoadPromise = null;

let currentRiskState = "DS1";

let inundationLegendControl = null;
let activeDamageState = "DS1";

const riskGeoJSONCache = {};   // layerName → raw GeoJSON object
const riskLeafletLayers = {};  // layerName → L.geoJSON layer instance

const mapLayerCache = {
  jalan: {},
  inundasi: {},
  risk: {},
};
const mapLoadingTasks = new Set();

// Peta layer name GeoServer → endpoint lokal
const GEODATA_ENDPOINTS = {
  "Capstone:DS_CILACAP_RISK":           "/api/geodata/cilacap-risk",
  "Capstone:Bakauheni_DS_Risk":         "/api/geodata/bakauheni-risk",
  "Capstone:jalan_cilacap":             "/api/geodata/cilacap-jalan",
  "Capstone:jalan_bakauheni":           "/api/geodata/bakauheni-jalan",
};

const INUNDATION_TIFS = {
  cilacap:   "/assets/raster/Inundasi_Tsunami_Cilacap_Fix.tif",
  bakauheni: "/assets/raster/Inundasi_Tsunami_Bakauheni_Fix.tif",
};

const MAP_LOCATION_CONFIG = {
  cilacap: {
    label: "Cilacap",
    center: [-7.699563, 108.998468],
    zoom: 14,
    jalanLayer: "Capstone:jalan_cilacap",
    riskLayer: "Capstone:DS_CILACAP_RISK",
  },
  bakauheni: {
    label: "Bakauheni",
    center: [-5.871, 105.745],
    zoom: 14,
    jalanLayer: "Capstone:jalan_bakauheni",
    riskLayer: "Capstone:Bakauheni_DS_Risk",
  },
};

function getGeoAPIBase() {
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000"
    : "https://inami-testing-production.up.railway.app";
}

function getMapLocationConfig(locationKey = activeMapLocation) {
  return MAP_LOCATION_CONFIG[locationKey] || MAP_LOCATION_CONFIG.cilacap;
}

function getMapVectorRenderer() {
  if (!mapVectorRenderer && typeof L !== "undefined") {
    mapVectorRenderer = L.canvas({ padding: 0.5 });
  }

  return mapVectorRenderer;
}

function createCanvasRenderer() {
  return typeof L !== "undefined" ? L.canvas({ padding: 0.5 }) : undefined;
}

function ensureMapLoadingOverlay() {
  const mapBox = document.querySelector(".map-box");
  if (!mapBox) return null;

  let overlay = document.getElementById("mapLoadingOverlay");
  if (overlay) return overlay;

  overlay = document.createElement("div");
  overlay.id = "mapLoadingOverlay";
  overlay.className = "map-loading-overlay";
  overlay.setAttribute("aria-live", "polite");
  overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML = `
    <div class="map-loading-card">
      <span class="map-loading-spinner" aria-hidden="true"></span>
      <span class="map-loading-text">Memuat peta...</span>
    </div>
  `;

  mapBox.appendChild(overlay);
  return overlay;
}

function showMapLoading(message = "Memuat peta...", task = "map") {
  const overlay = ensureMapLoadingOverlay();
  if (!overlay) return;

  mapLoadingTasks.add(task);
  overlay.querySelector(".map-loading-text").textContent = message;
  overlay.classList.add("is-active");
  overlay.setAttribute("aria-hidden", "false");
}

function hideMapLoading(task = "map") {
  const overlay = ensureMapLoadingOverlay();
  if (!overlay) return;

  mapLoadingTasks.delete(task);
  if (mapLoadingTasks.size) return;

  overlay.classList.remove("is-active");
  overlay.setAttribute("aria-hidden", "true");
}

function setMapControlsDisabled(disabled) {
  ["chkJalan", "chkInundasi", "chkRisk"].forEach((id) => {
    const input = document.getElementById(id);
    if (input) input.disabled = disabled;
  });

  document.querySelectorAll('input[name="riskState"]').forEach((input) => {
    input.disabled = disabled;
  });
}

function isLayerChecked(id) {
  const input = document.getElementById(id);
  return !input || input.checked;
}

function syncMapLayerVisibility() {
  if (!map || !jalanLayer || !inundasiLayer || !riskLayer) return;

  const syncGroup = (group, shouldShow) => {
    const isVisible = map.hasLayer(group);
    if (shouldShow && !isVisible) map.addLayer(group);
    if (!shouldShow && isVisible) map.removeLayer(group);
  };

  syncGroup(jalanLayer, isLayerChecked("chkJalan"));
  syncGroup(inundasiLayer, isLayerChecked("chkInundasi"));
  syncGroup(riskLayer, isLayerChecked("chkRisk"));
}

function refreshMapAfterResize(message = "Menyiapkan basemap...") {
  if (!map) return;

  showMapLoading(message, "resize");

  requestAnimationFrame(() => {
    map.invalidateSize({ pan: false, animate: false });

    setTimeout(() => {
      if (map) map.invalidateSize({ pan: false, animate: false });
    }, 120);

    setTimeout(() => {
      if (map) map.invalidateSize({ pan: false, animate: false });
      hideMapLoading("resize");
    }, 420);
  });
}

function requestMapInitialization() {
  if (map) {
    setTimeout(() => map.invalidateSize(), 80);
    return map;
  }

  return initMap();
}

function setupLazyMapInitialization() {
  const mapEl = document.getElementById("map");
  if (!mapEl || map || mapLazyObserver) return;

  if ("IntersectionObserver" in window) {
    mapLazyObserver = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;

        requestMapInitialization();
        mapLazyObserver.disconnect();
        mapLazyObserver = null;
      },
      {
        rootMargin: "320px 0px",
        threshold: 0.01,
      },
    );

    mapLazyObserver.observe(mapEl);
    return;
  }

  const initOnScroll = () => {
    const rect = mapEl.getBoundingClientRect();
    if (rect.top < window.innerHeight + 320) {
      requestMapInitialization();
      window.removeEventListener("scroll", initOnScroll);
    }
  };

  window.addEventListener("scroll", initOnScroll, { passive: true });
  initOnScroll();
}

async function loadJalanLayer(layerName) {
  const path = GEODATA_ENDPOINTS[layerName];
  if (!path) return L.layerGroup();
  const res = await fetch(getGeoAPIBase() + path);
  const geojson = await res.json();
  return L.geoJSON(geojson, {
    renderer: getMapVectorRenderer(),
    style: { color: "#888", weight: 1.2, opacity: 0.6 },
  });
}

async function loadInundationGeoRaster(key) {
  const tifPath = INUNDATION_TIFS[key];
  const res = await fetch(tifPath);
  const buffer = await res.arrayBuffer();
  const georaster = await parseGeoraster(buffer);
  return new GeoRasterLayer({
    georaster,
    opacity: 0.85,
    pixelValuesToColorFn: (values) => {
      const v = values[0];
      if (!v || v <= 0) return null;
      if (v <= 0.5)  return "#f2f0f7";
      if (v <= 1.5)  return "#dadaeb";
      if (v <= 3)    return "#bcbddc";
      if (v <= 5)    return "#9e9ac8";
      if (v <= 7)    return "#807dba";
      if (v <= 9)    return "#6a51a3";
      return "#4a1486";
    },
    resolution: 256,
  });
}

async function loadRiskLayer(layerName) {
  const path = GEODATA_ENDPOINTS[layerName];
  if (!path) throw new Error(`Unknown layer: ${layerName}`);

  if (!riskGeoJSONCache[layerName]) {
    const url = getGeoAPIBase() + path;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`GeoJSON request failed (${response.status})`);
    riskGeoJSONCache[layerName] = await response.json();
  }

  const geojson = riskGeoJSONCache[layerName];

  const leafletLayer = L.geoJSON(geojson, {
    renderer: getMapVectorRenderer(),
    style(feature) {
      const value = Number(feature.properties?.[activeDamageState]) || 0;

      return {
        color: "#ffffff",
        weight: 0.4,
        opacity: 0.35,
        fillOpacity: 0.9,
        fillColor: getRiskColor(value),
      };
    },

    onEachFeature(feature, layer) {
      const p = feature.properties;

      layer.bindPopup(`
      <b>${p.TYPE}</b><br>
      ${p.SUBTYPE}<br><br>

      HMAX : ${Number(p.HMAX).toFixed(2)} m<br>

      DS1 : ${Number(p.DS1).toFixed(3)}<br>
      DS2 : ${Number(p.DS2).toFixed(3)}<br>
      DS3 : ${Number(p.DS3).toFixed(3)}<br>
      DS4 : ${Number(p.DS4).toFixed(3)}
    `);
    },
  });

  riskLeafletLayers[layerName] = leafletLayer;
  return leafletLayer;
}

async function getCachedJalanLayer(locationKey) {
  const config = getMapLocationConfig(locationKey);

  if (!mapLayerCache.jalan[locationKey]) {
    mapLayerCache.jalan[locationKey] = await loadJalanLayer(config.jalanLayer);
  }

  return mapLayerCache.jalan[locationKey];
}

async function getCachedInundationLayer(locationKey) {
  if (!mapLayerCache.inundasi[locationKey]) {
    mapLayerCache.inundasi[locationKey] = await loadInundationGeoRaster(locationKey);
  }

  return mapLayerCache.inundasi[locationKey];
}

async function getCachedRiskLayer(locationKey) {
  const config = getMapLocationConfig(locationKey);

  if (!mapLayerCache.risk[locationKey]) {
    mapLayerCache.risk[locationKey] = await loadRiskLayer(config.riskLayer);
  }

  return mapLayerCache.risk[locationKey];
}

async function loadMapLayersForLocation(locationKey = activeMapLocation, options = {}) {
  if (!map || !jalanLayer || !inundasiLayer || !riskLayer) return;
  if (!MAP_LOCATION_CONFIG[locationKey]) return;

  const config = getMapLocationConfig(locationKey);
  const requestId = ++mapLayerRequestId;
  activeMapLocation = locationKey;

  showMapLoading(`Memuat layer ${config.label}...`, "layers");
  setMapControlsDisabled(true);
  syncMapLayerVisibility();

  try {
    jalanLayer.clearLayers();
    inundasiLayer.clearLayers();
    riskLayer.clearLayers();

    const loaders = [];

    if (isLayerChecked("chkJalan")) {
      loaders.push(
        getCachedJalanLayer(locationKey).then((layer) => {
          if (requestId === mapLayerRequestId) jalanLayer.addLayer(layer);
        }),
      );
    }

    if (isLayerChecked("chkInundasi")) {
      loaders.push(
        getCachedInundationLayer(locationKey).then((layer) => {
          if (requestId === mapLayerRequestId) inundasiLayer.addLayer(layer);
        }),
      );
    }

    if (isLayerChecked("chkRisk")) {
      loaders.push(
        getCachedRiskLayer(locationKey).then((layer) => {
          if (requestId === mapLayerRequestId) {
            riskLayer.addLayer(layer);
            layer.bringToFront();
          }
        }),
      );
    }

    const results = await Promise.allSettled(loaders);

    results.forEach((result) => {
      if (result.status === "rejected") {
        console.error(`Layer ${config.label} failed:`, result.reason);
      }
    });

    if (requestId !== mapLayerRequestId) return;

    syncMapLayerVisibility();

    if (options.fitToLocation) {
      map.setView(config.center, config.zoom, { animate: true });
    }

    setTimeout(() => {
      if (map) map.invalidateSize({ pan: false, animate: false });
    }, 80);
  } finally {
    if (requestId === mapLayerRequestId) {
      setMapControlsDisabled(false);
      hideMapLoading("layers");
    }
  }
}

function getRiskColor(value) {
  if (value >= 0.8) return "#dc2626";
  if (value >= 0.6) return "#f59e0b";
  if (value >= 0.4) return "#fde047";
  if (value >= 0.2) return "#84cc16";
  return "#16a34a";
}

function populateTopRiskAssets(features, dsField) {
  const tbody = document.getElementById("riskTopAssetsBody");

  const header = document.getElementById("riskTableDsHeader");

  if (!tbody || !header) return;

  header.textContent = dsField;

  const sorted = [...features]
    .sort((a, b) => (b.properties[dsField] || 0) - (a.properties[dsField] || 0))
    .slice(0, 10);

  tbody.innerHTML = "";

  sorted.forEach((feature) => {
    const p = feature.properties;

    tbody.innerHTML += `
      <tr>
        <td>${p.TYPE || "-"}</td>
        <td>${p.SUBTYPE || "-"}</td>
        <td>${Number(p.HMAX).toFixed(2)}</td>
        <td>${Number(p[dsField]).toFixed(3)}</td>
      </tr>
    `;
  });
}

function renderMiniRiskMap(dsField = "DS1") {
  const mapContainer = document.getElementById("miniRiskRasterMap");

  if (!mapContainer) return;

  if (!miniRiskRasterMap) {
    miniRiskRasterMap = L.map("miniRiskRasterMap", {
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
    }).addTo(miniRiskRasterMap);
  }

  const firstLoad = !miniRiskLayer;

  if (miniRiskLayer) {
    miniRiskRasterMap.removeLayer(miniRiskLayer);
  }

  miniRiskLayer = L.geoJSON(cilacapRiskFeatures, {
    renderer: createCanvasRenderer(),
    style(feature) {
      const value = Number(feature.properties[dsField]) || 0;

      return {
        color: "#ffffff",
        weight: 0.4,
        opacity: 0.35,
        fillOpacity: 0.9,
        fillColor: getRiskColor(value),
      };
    },

    onEachFeature(feature, layer) {
      const p = feature.properties;

      layer.bindPopup(`
        <b>${p.TYPE}</b><br>
        ${p.SUBTYPE}<br><br>

        HMAX : ${Number(p.HMAX).toFixed(2)} m<br>

        DS1 : ${Number(p.DS1).toFixed(3)}<br>
        DS2 : ${Number(p.DS2).toFixed(3)}<br>
        DS3 : ${Number(p.DS3).toFixed(3)}<br>
        DS4 : ${Number(p.DS4).toFixed(3)}
      `);
    },
  }).addTo(miniRiskRasterMap);

  if (firstLoad) {
    miniRiskRasterMap.fitBounds(miniRiskLayer.getBounds(), {
      padding: [20, 20],
    });
  }
}

function renderBakauheniMiniRiskMap(dsField = "DS1") {
  const mapContainer = document.getElementById("bakauheniMiniRiskRasterMap");

  if (!mapContainer) return;

  if (!bakauheniMiniRiskRasterMap) {
    bakauheniMiniRiskRasterMap = L.map("bakauheniMiniRiskRasterMap", {
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
    }).addTo(bakauheniMiniRiskRasterMap);
  }

  const firstLoad = !bakauheniMiniRiskLayer;

  if (bakauheniMiniRiskLayer) {
    bakauheniMiniRiskRasterMap.removeLayer(bakauheniMiniRiskLayer);
  }

  bakauheniMiniRiskLayer = L.geoJSON(bakauheniRiskFeatures, {
    renderer: createCanvasRenderer(),
    style(feature) {
      const value = Number(feature.properties[dsField]) || 0;

      return {
        color: "#ffffff",
        weight: 0.4,
        opacity: 0.35,
        fillOpacity: 0.9,
        fillColor: getRiskColor(value),
      };
    },

    onEachFeature(feature, layer) {
      const p = feature.properties;

      layer.bindPopup(`
          <b>${p.TYPE}</b><br>
          ${p.SUBTYPE}<br><br>

          HMAX : ${Number(p.HMAX).toFixed(2)} m<br>

          DS1 : ${Number(p.DS1).toFixed(3)}<br>
          DS2 : ${Number(p.DS2).toFixed(3)}<br>
          DS3 : ${Number(p.DS3).toFixed(3)}<br>
          DS4 : ${Number(p.DS4).toFixed(3)}
        `);
    },
  }).addTo(bakauheniMiniRiskRasterMap);

  if (firstLoad) {
    bakauheniMiniRiskRasterMap.fitBounds(bakauheniMiniRiskLayer.getBounds(), {
      padding: [20, 20],
    });
  }
}

async function refreshRiskLayer() {
  if (!riskLayer) return;

  const styleFunc = (feature) => {
    const value = Number(feature.properties?.[activeDamageState]) || 0;
    return {
      color: "#ffffff",
      weight: 0.4,
      opacity: 0.35,
      fillOpacity: 0.9,
      fillColor: getRiskColor(value),
    };
  };

  Object.values(riskLeafletLayers).forEach((layer) => {
    layer.setStyle(styleFunc);
  });

  if (isLayerChecked("chkRisk")) {
    await loadMapLayersForLocation(activeMapLocation);
  }
}


function initMap() {
  if (map) return map;

  const mapEl = document.getElementById("map");
  if (!mapEl) return;
  if (typeof L === "undefined") {
    console.warn("Leaflet belum siap, peta akan dicoba lagi nanti.");
    return null;
  }

  map = L.map("map", {
    preferCanvas: true,
    zoomAnimation: true,
    markerZoomAnimation: true,
  }).setView([-6.8, 107.5], 7);

  mapBaseTileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    updateWhenIdle: true,
    updateWhenZooming: false,
    keepBuffer: 2,
    detectRetina: false,
  });

  mapBaseTileLayer.on("loading", () => {
    showMapLoading("Memuat basemap...", "tiles");
  });

  mapBaseTileLayer.on("load", () => {
    hideMapLoading("tiles");
  });

  mapBaseTileLayer.on("tileerror", () => {
    hideMapLoading("tiles");
  });

  mapBaseTileLayer.addTo(map);

  jalanLayer = L.layerGroup().addTo(map);
  inundasiLayer = L.layerGroup().addTo(map);
  riskLayer = L.layerGroup().addTo(map);

  createMapLegend();
  loadMapLayersForLocation(activeMapLocation);

  setTimeout(() => {
    addProjectMarkers();
    if (map) map.invalidateSize();
  }, 250);

  return map;
}

function setupLayerControls() {
  if (mapControlsInitialized) return;
  mapControlsInitialized = true;

  const chkJalan = document.getElementById("chkJalan");
  const chkInundasi = document.getElementById("chkInundasi");
  const chkRisk = document.getElementById("chkRisk");

  if (chkJalan) {
    chkJalan.addEventListener("change", async function () {
      const activeMap = requestMapInitialization();
      if (!activeMap || !jalanLayer) return;

      this.checked ? activeMap.addLayer(jalanLayer) : activeMap.removeLayer(jalanLayer);

      if (this.checked) {
        await loadMapLayersForLocation(activeMapLocation);
      }
    });
  }

  if (chkInundasi) {
    chkInundasi.addEventListener("change", async function () {
      const activeMap = requestMapInitialization();
      if (!activeMap || !inundasiLayer) return;

      this.checked ? activeMap.addLayer(inundasiLayer) : activeMap.removeLayer(inundasiLayer);

      if (this.checked) {
        await loadMapLayersForLocation(activeMapLocation);
      }
    });
  }

  if (chkRisk) {
    chkRisk.addEventListener("change", async function () {
      const activeMap = requestMapInitialization();
      if (!activeMap || !riskLayer) return;

      if (this.checked) {
        activeMap.addLayer(riskLayer);
        await loadMapLayersForLocation(activeMapLocation);
      } else {
        activeMap.removeLayer(riskLayer);
      }
    });
  }

  const riskRadios = document.querySelectorAll('input[name="riskState"]');

  riskRadios.forEach((radio) => {
    radio.addEventListener("change", async () => {
      const activeMap = requestMapInitialization();
      if (!activeMap) return;

      activeDamageState = radio.value;

      await refreshRiskLayer();

      if (inundationLegendControl) {
        activeMap.removeControl(inundationLegendControl);
        inundationLegendControl = null;
      }

      createMapLegend();
    });
  });
}

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", function () {
  if (document.getElementById("map")) {
    setupLazyMapInitialization();
    setupLayerControls();
  }
});

/* ======================= INUNDATION & RISK LEGEND ======================= */
function createMapLegend() {
  if (inundationLegendControl) return;

  inundationLegendControl = L.control({
    position: "bottomleft",
  });

  inundationLegendControl.onAdd = function () {
    const div = L.DomUtil.create("div", "map-legend");

    div.innerHTML = `
      <div class="legend-section">

        <div class="legend-section-title">
          Risk Assessment
          <span>${activeDamageState} Probability</span>
        </div>

        <div class="legend-item">
          <span class="legend-color" style="background:#1a9641;"></span>
          <span>0.00 – 0.20</span>
        </div>

        <div class="legend-item">
          <span class="legend-color" style="background:#a6d96a;"></span>
          <span>0.20 – 0.40</span>
        </div>

        <div class="legend-item">
          <span class="legend-color" style="background:#ffff66;"></span>
          <span>0.40 – 0.60</span>
        </div>

        <div class="legend-item">
          <span class="legend-color" style="background:#fdae61;"></span>
          <span>0.60 – 0.80</span>
        </div>

        <div class="legend-item">
          <span class="legend-color" style="background:#d7191c;"></span>
          <span>0.80 – 1.00</span>
        </div>

      </div>

      <hr style="
        border:none;
        border-top:1px solid rgba(255,255,255,0.12);
        margin:10px 0;
      ">

      <div class="legend-section">

        <div class="legend-section-title">
          Inundation
          <span>Tsunami Depth (m)</span>
        </div>

        <div class="legend-item">
          <span class="legend-color" style="background:#f2f0f7;"></span>
          <span>0.05 – 0.5</span>
        </div>

        <div class="legend-item">
          <span class="legend-color" style="background:#dadaeb;"></span>
          <span>0.5 – 1.5</span>
        </div>

        <div class="legend-item">
          <span class="legend-color" style="background:#bcbddc;"></span>
          <span>1.5 – 3</span>
        </div>

        <div class="legend-item">
          <span class="legend-color" style="background:#9e9ac8;"></span>
          <span>3 – 5</span>
        </div>

        <div class="legend-item">
          <span class="legend-color" style="background:#807dba;"></span>
          <span>5 – 7</span>
        </div>

        <div class="legend-item">
          <span class="legend-color" style="background:#6a51a3;"></span>
          <span>7 – 9</span>
        </div>

        <div class="legend-item">
          <span class="legend-color" style="background:#4a1486;"></span>
          <span>9 – 10</span>
        </div>

      </div>
    `;

    return div;
  };

  inundationLegendControl.addTo(map);
}

/* ================= GLOBAL (UNTUK HTML onclick) ================= */

window.closeLeafletPopup = function () {
  if (map) map.closePopup();
};

window.goToProjectPage = function (project) {
  if (project === "pertamina") {
    openPertaminaDetail();
  } else if (project === "bakauheni") {
    openBakauheniDetail();
  }
};

/* ================= FIX GLOBAL NAVIGATION & VIEW ================= */

function closeAllDetailViews() {
  document.querySelectorAll(".view, .detail-view").forEach((el) => {
    el.classList.remove("active");
  });
}

function hideStandalonePages() {
  document.getElementById("publicDownloadPage")?.classList.add("hidden-page");
  document.getElementById("paymentPage")?.classList.add("hidden-page");
}

function setActiveView(viewId) {
  closeAllDetailViews();
  hideStandalonePages();

  const target = document.getElementById(viewId);
  if (target) target.classList.add("active");

  document.body.style.overflow = "";
  window.scrollTo({ top: 0, behavior: "auto" });

  setTimeout(() => {
    if (typeof map !== "undefined" && map) map.invalidateSize();
  }, 200);

  if (typeof handleNavbarBackground === "function") {
    handleNavbarBackground();
  }
}

function collapseNavbar() {
  const navCollapse = document.getElementById("navbarResponsive");
  if (!navCollapse) return;

  if (window.bootstrap && bootstrap.Collapse) {
    const instance = bootstrap.Collapse.getOrCreateInstance(navCollapse, {
      toggle: false,
    });
    instance.hide();
  } else {
    navCollapse.classList.remove("show");
  }
}

function handleNavbarBackground() {
  const nav = document.getElementById("mainNav");
  const homeView = document.getElementById("homeView");

  if (!nav || !homeView) return;

  const isHomeActive = homeView.classList.contains("active");
  const atTop = window.scrollY < 40;

  if (isHomeActive && atTop) {
    nav.classList.remove("navbar-scrolled");
    nav.classList.remove("navbar-shrink");
  } else {
    nav.classList.add("navbar-scrolled");
    nav.classList.add("navbar-shrink");
  }
}

function goHome(event) {
  document.body.classList.remove("hide-main-nav");

  if (event) event.preventDefault();

  setActiveView("homeView");
  collapseNavbar();
  stopPertaminaAutoCarousel();
  stopBakauheniAutoCarousel();

  history.replaceState(null, "", window.location.pathname);
}

function goToSection(sectionId, event) {
  if (event) event.preventDefault();

  hideStandalonePages();

  document.querySelectorAll(".view, .detail-view").forEach((el) => {
    el.classList.remove("active");
  });

  const homeView = document.getElementById("homeView");
  if (homeView) homeView.classList.add("active");

  collapseNavbar();

  setTimeout(() => {
    if (sectionId === "projects") {
      requestMapInitialization();
    }

    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }

    if (typeof map !== "undefined" && map) {
      map.invalidateSize();
    }

    handleNavbarBackground();
  }, 120);
}

function goToAbout(event) {
  goToSection("about", event);
}

function goToMap(event) {
  goToSection("projects", event);
}

function goToProjects(event) {
  goToSection("projects", event);
}

function goToCatalog(event) {
  goToSection("catalog", event);
}

function goToContact(event) {
  goToSection("signup", event);
}

function openProjects(event) {
  if (event) event.preventDefault();

  setActiveView("projectsView");
  collapseNavbar();
}

function openPertaminaDetail(event) {
  if (event) event.preventDefault();

  setActiveView("pertaminaDetailView");

  setTimeout(() => {
    if (typeof renderPertaminaCarousel === "function") {
      renderPertaminaCarousel();
      startPertaminaAutoCarousel();
      stopBakauheniAutoCarousel();
    }
  }, 100);
}

function openBakauheniDetail(event) {
  if (event) event.preventDefault();

  setActiveView("bakauheniDetailView");

  setTimeout(() => {
    if (typeof renderBakauheniCarousel === "function") {
      renderBakauheniCarousel();
      startBakauheniAutoCarousel();
      stopPertaminaAutoCarousel();
    }
  }, 100);
}

/* ================= MODAL ABOUT CARDS ================= */

function openHazardModal(event) {
  if (event) event.preventDefault();
  document.getElementById("hazardModal")?.classList.add("active");
}

function closeHazardModal() {
  document.getElementById("hazardModal")?.classList.remove("active");
}

function openExposureModal(event) {
  if (event) event.preventDefault();
  document.getElementById("exposureModal")?.classList.add("active");
}

function closeExposureModal() {
  document.getElementById("exposureModal")?.classList.remove("active");
}

function openRiskModal(event) {
  if (event) event.preventDefault();
  document.getElementById("riskModal")?.classList.add("active");
}

function closeRiskModal() {
  document.getElementById("riskModal")?.classList.remove("active");
}

/* ================= CAROUSEL DETAIL ================= */

const pertaminaSlides = [
  { src: "assets/img/kilangcilacap.jpeg", alt: "Kilang RU IV Cilacap" },
  { src: "assets/img/image 5.png", alt: "Peta RU IV Cilacap" },
  { src: "assets/img/fasilitas2.jpeg", alt: "Fasilitas RU IV Cilacap" },
];

let pertaminaCenterIndex = 1;
let pertaminaCarouselTimer = null;
let bakauheniCarouselTimer = null;

function startPertaminaAutoCarousel() {
  stopPertaminaAutoCarousel();

  pertaminaCarouselTimer = setInterval(() => {
    movePertaminaCarousel(1);
  }, 6000);
}

function stopPertaminaAutoCarousel() {
  if (pertaminaCarouselTimer) {
    clearInterval(pertaminaCarouselTimer);
    pertaminaCarouselTimer = null;
  }
}

function startBakauheniAutoCarousel() {
  stopBakauheniAutoCarousel();

  bakauheniCarouselTimer = setInterval(() => {
    moveBakauheniCarousel(1);
  }, 6000);
}

function stopBakauheniAutoCarousel() {
  if (bakauheniCarouselTimer) {
    clearInterval(bakauheniCarouselTimer);
    bakauheniCarouselTimer = null;
  }
}

function renderPertaminaCarousel() {
  const total = pertaminaSlides.length;
  const leftIndex = (pertaminaCenterIndex - 1 + total) % total;
  const rightIndex = (pertaminaCenterIndex + 1) % total;

  const imgLeft = document.getElementById("imgLeft");
  const imgCenter = document.getElementById("imgCenter");
  const imgRight = document.getElementById("imgRight");

  if (!imgLeft || !imgCenter || !imgRight) return;

  imgLeft.src = pertaminaSlides[leftIndex].src;
  imgLeft.alt = pertaminaSlides[leftIndex].alt;

  imgCenter.src = pertaminaSlides[pertaminaCenterIndex].src;
  imgCenter.alt = pertaminaSlides[pertaminaCenterIndex].alt;

  imgRight.src = pertaminaSlides[rightIndex].src;
  imgRight.alt = pertaminaSlides[rightIndex].alt;
}

function movePertaminaCarousel(direction) {
  const total = pertaminaSlides.length;
  pertaminaCenterIndex = (pertaminaCenterIndex + direction + total) % total;
  renderPertaminaCarousel();
}

const bakauheniSlides = [
  { src: "assets/img/Bakauheni.jpeg", alt: "Pelabuhan Bakauheni" },
  { src: "assets/img/bakauheni1.jpg", alt: "Bakauheni 1" },
  { src: "assets/img/Bakauheni2.jpeg", alt: "Bakauheni 2" },
  { src: "assets/img/bakauheni3.jpg", alt: "Bakauheni 3" },
];

let bakauheniCenterIndex = 0;

function renderBakauheniCarousel() {
  const total = bakauheniSlides.length;
  const leftIndex = (bakauheniCenterIndex - 1 + total) % total;
  const rightIndex = (bakauheniCenterIndex + 1) % total;

  const imgLeft = document.getElementById("bakauheniImgLeft");
  const imgCenter = document.getElementById("bakauheniImgCenter");
  const imgRight = document.getElementById("bakauheniImgRight");

  if (!imgLeft || !imgCenter || !imgRight) return;

  imgLeft.src = bakauheniSlides[leftIndex].src;
  imgLeft.alt = bakauheniSlides[leftIndex].alt;

  imgCenter.src = bakauheniSlides[bakauheniCenterIndex].src;
  imgCenter.alt = bakauheniSlides[bakauheniCenterIndex].alt;

  imgRight.src = bakauheniSlides[rightIndex].src;
  imgRight.alt = bakauheniSlides[rightIndex].alt;
}

function moveBakauheniCarousel(direction) {
  const total = bakauheniSlides.length;
  bakauheniCenterIndex = (bakauheniCenterIndex + direction + total) % total;
  renderBakauheniCarousel();
}

/* ================= MAP CONTROLS ================= */

function setupLayerMenu() {
  const toggleBtn = document.getElementById("layerMenuToggle");
  const panel = document.getElementById("layerPanel");

  if (!toggleBtn || !panel) return;

  toggleBtn.addEventListener("click", function (event) {
    event.stopPropagation();
    panel.classList.toggle("hidden");
  });

  panel.addEventListener("click", function (event) {
    event.stopPropagation();
  });

  document.addEventListener("click", function () {
    panel.classList.add("hidden");
  });
}

function setupMapFullscreen() {
  const btn = document.getElementById("mapFullscreenBtn");
  const mapBox = document.querySelector(".map-box");
  if (!btn || !mapBox) return;

  btn.addEventListener("click", function () {
    requestMapInitialization();
    const isFullscreen = mapBox.classList.toggle("map-fullscreen");
    btn.querySelector("i").className = isFullscreen ? "fas fa-compress" : "fas fa-expand";
    btn.title = isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh";
    btn.setAttribute("aria-label", isFullscreen ? "Exit fullscreen" : "Toggle fullscreen");
    refreshMapAfterResize(
      isFullscreen ? "Menyiapkan basemap fullscreen..." : "Menyiapkan ukuran peta...",
    );
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && mapBox.classList.contains("map-fullscreen")) {
      mapBox.classList.remove("map-fullscreen");
      btn.querySelector("i").className = "fas fa-expand";
      btn.title = "Layar Penuh";
      btn.setAttribute("aria-label", "Toggle fullscreen");
      refreshMapAfterResize("Menyiapkan ukuran peta...");
    }
  });
}

function setupWilayahControls() {
  const input = document.getElementById("wilayahInput");
  const list = document.getElementById("wilayahList");
  const options = document.querySelectorAll(".wilayah-option");

  if (!input || !list || !options.length) return;

  input.addEventListener("focus", function () {
    list.classList.remove("hidden");
  });

  input.addEventListener("click", function (event) {
    event.stopPropagation();
    list.classList.remove("hidden");
  });

  options.forEach((option) => {
    option.addEventListener("click", async function () {
      const value = this.dataset.value;
      input.value = this.textContent.trim();
      list.classList.add("hidden");

      const activeMap = requestMapInitialization();
      if (!activeMap) return;

      await loadMapLayersForLocation(value, { fitToLocation: true });
    });
  });

  document.addEventListener("click", function () {
    list.classList.add("hidden");
  });
}

function addProjectMarkers() {
  if (!map || window._inamiProjectMarkersAdded) return;
  window._inamiProjectMarkersAdded = true;

  const customIcon = L.divIcon({
    className: "custom-marker-icon",
    html: `<div class="marker-pin"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -20],
  });

  const pertaminaPopup = `
    <div class="custom-map-card">
      <button class="custom-map-close" onclick="closeLeafletPopup()">×</button>
      <img src="assets/img/kilangcilacap.jpeg" class="custom-map-image" alt="Pertamina RU IV Cilacap">
      <button class="custom-map-button" onclick="goToProjectPage('pertamina')">
        Pertamina RU IV Cilacap ➜
      </button>
    </div>
  `;

  L.marker([-7.699563, 108.998468], { icon: customIcon })
    .addTo(map)
    .on("click", function () {
      L.popup({
        closeButton: false,
        className: "custom-leaflet-popup side-popup",
        maxWidth: 300,
        offset: [150, 35],
      })
        .setLatLng([-7.699563, 108.998468])
        .setContent(pertaminaPopup)
        .openOn(map);
    });

  const bakauheniPopup = `
    <div class="custom-map-card">
      <button class="custom-map-close" onclick="closeLeafletPopup()">×</button>
      <img src="assets/img/bakauheni/1.jpg" class="custom-map-image" alt="Pelabuhan Bakauheni">
      <button class="custom-map-button" onclick="goToProjectPage('bakauheni')">
        Pelabuhan Bakauheni ➜
      </button>
    </div>
  `;

  L.marker([-5.866474455268687, 105.75691044277649], { icon: customIcon })
    .addTo(map)
    .on("click", function () {
      L.popup({
        closeButton: false,
        className: "custom-leaflet-popup side-popup",
        maxWidth: 300,
        offset: [-145, 35],
      })
        .setLatLng([-5.866474455268687, 105.75691044277649])
        .setContent(bakauheniPopup)
        .openOn(map);
    });
}

function goToProjectPage(project) {
  if (project === "pertamina") openPertaminaDetail();
  if (project === "bakauheni") openBakauheniDetail();
}

function closeLeafletPopup() {
  if (typeof map !== "undefined" && map) {
    map.closePopup();
  }
}

/* ================= INIT FIX ================= */

document.addEventListener("DOMContentLoaded", function () {
  renderPertaminaCarousel();
  renderBakauheniCarousel();

  if (typeof setupLazyMapInitialization === "function") setupLazyMapInitialization();
  if (typeof setupLayerControls === "function") setupLayerControls();

  setupLayerMenu();
  setupWilayahControls();
  setupMapFullscreen();

  handleNavbarBackground();
});

window.addEventListener("scroll", handleNavbarBackground);

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeHazardModal();
    closeExposureModal();
    closeRiskModal();
  }
});

/* ================= EXPORT TO WINDOW ================= */

window.goHome = goHome;
window.goToSection = goToSection;
window.goToAbout = goToAbout;
window.goToMap = goToMap;
window.goToProjects = goToProjects;
window.goToCatalog = goToCatalog;
window.goToContact = goToContact;

window.openProjects = openProjects;
window.openPertaminaDetail = openPertaminaDetail;
window.openBakauheniDetail = openBakauheniDetail;

window.openHazardModal = openHazardModal;
window.closeHazardModal = closeHazardModal;
window.openExposureModal = openExposureModal;
window.closeExposureModal = closeExposureModal;
window.openRiskModal = openRiskModal;
window.closeRiskModal = closeRiskModal;

window.movePertaminaCarousel = movePertaminaCarousel;
window.moveBakauheniCarousel = moveBakauheniCarousel;

window.closeLeafletPopup = closeLeafletPopup;
window.goToProjectPage = goToProjectPage;
window.closeAllDetailViews = closeAllDetailViews;
window.handleNavbarBackground = handleNavbarBackground;

/* ================= FORCE HOME ON FIRST LOAD ================= */
document.addEventListener("DOMContentLoaded", function () {
  const anyActiveView = document.querySelector(".view.active, .detail-view.active");

  if (!anyActiveView) {
    document.querySelectorAll(".view, .detail-view").forEach((el) => {
      el.classList.remove("active");
    });

    const homeView = document.getElementById("homeView");
    if (homeView) homeView.classList.add("active");

    document.body.style.overflow = "";
    window.scrollTo({ top: 0, behavior: "auto" });
  }
});

window.addEventListener("scroll", handleNavbarBackground);
window.addEventListener("load", handleNavbarBackground);
document.addEventListener("DOMContentLoaded", handleNavbarBackground);
window.requireLoginForPurchase = requireLoginForPurchase;

/* ================= Loader GeoJSON (lokal) ================= */
async function fetchRiskFeatures(layerName) {
  const path = GEODATA_ENDPOINTS[layerName];
  if (!path) throw new Error(`Unknown layer: ${layerName}`);
  const url = getGeoAPIBase() + path;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed loading ${layerName} (${response.status})`);
  }

  const geojson = await response.json();

  return geojson.features || [];
}

async function loadRiskData() {
  if (cilacapRiskFeatures.length && bakauheniRiskFeatures.length) {
    return;
  }

  if (!riskDataLoadPromise) {
    riskDataLoadPromise = (async () => {
      try {
        const [cilacapFeatures, bakauheniFeatures] = await Promise.all([
          fetchRiskFeatures("Capstone:DS_CILACAP_RISK"),
          fetchRiskFeatures("Capstone:Bakauheni_DS_Risk"),
        ]);

        cilacapRiskFeatures = cilacapFeatures;
        bakauheniRiskFeatures = bakauheniFeatures;

        console.log("Cilacap assets:", cilacapRiskFeatures.length);
        console.log("Bakauheni assets:", bakauheniRiskFeatures.length);

        refreshRiskDashboard();
      } catch (error) {
        riskDataLoadPromise = null;
        console.error("Risk data loading failed:", error);
      }
    })();
  }

  return riskDataLoadPromise;
}

/* ================= SUMMARY ================= */
function calculateRiskSummary(features, damageState) {
  const total = features.length;

  if (!total) {
    return {
      total: 0,
      avgRisk: 0,
      maxRisk: 0,
      highestAsset: "-",
    };
  }

  const risks = features.map((f) => Number(f.properties?.[damageState]) || 0);

  const avgRisk = risks.reduce((sum, value) => sum + value, 0) / total;

  const highestFeature = [...features].sort(
    (a, b) => (b.properties?.[damageState] || 0) - (a.properties?.[damageState] || 0),
  )[0];

  return {
    total,
    avgRisk,
    maxRisk: Math.max(...risks),
    highestAsset: highestFeature?.properties?.SUBTYPE || highestFeature?.properties?.TYPE || "-",
  };
}

function renderCilacapRiskSummary() {
  const stats = calculateRiskSummary(cilacapRiskFeatures, currentRiskState);

  document.getElementById("riskTotalAssets").textContent = stats.total;

  document.getElementById("riskAverageRisk").textContent = stats.avgRisk.toFixed(3);

  document.getElementById("riskMaximumRisk").textContent = stats.maxRisk.toFixed(3);

  document.getElementById("riskHighestAsset").textContent = stats.highestAsset;
}

function renderBakauheniRiskSummary() {
  const stats = calculateRiskSummary(bakauheniRiskFeatures, currentRiskState);

  document.getElementById("bakauheniRiskTotalAssets").textContent = stats.total;

  document.getElementById("bakauheniRiskAverageRisk").textContent = stats.avgRisk.toFixed(3);

  document.getElementById("bakauheniRiskMaximumRisk").textContent = stats.maxRisk.toFixed(3);

  document.getElementById("bakauheniRiskHighestAsset").textContent = stats.highestAsset;
}

/* ================= DS1 / DS2 / DS3 / DS4 Interaktif ================= */
function refreshRiskDashboard() {
  renderCilacapRiskSummary();

  renderBakauheniRiskSummary();

  renderInfrastructureSummary();

  renderBakauheniInfrastructureSummary();

  renderTopRiskAssets();

  renderBakauheniTopRiskAssets();

  updateRiskInsight();

  updateBakauheniRiskInsight();
}

function updateRiskInsight() {
  const stats = calculateRiskSummary(cilacapRiskFeatures, currentRiskState);

  const highRiskCount = cilacapRiskFeatures.filter((f) => {
    const value = Number(f.properties?.[currentRiskState]) || 0;

    return value >= 0.6;
  }).length;

  let recommendation = "Maintain monitoring and preparedness activities.";

  if (stats.maxRisk >= 0.8) {
    recommendation = "Immediate mitigation measures are recommended for high-risk assets.";
  } else if (stats.maxRisk >= 0.6) {
    recommendation = "Prioritize inspection and protection of vulnerable infrastructure.";
  }

  const highRiskEl = document.getElementById("riskHighRiskCount");

  const summaryEl = document.getElementById("riskSummary");

  if (highRiskEl) {
    highRiskEl.textContent = `${highRiskCount} Assets`;
  }

  if (summaryEl) {
    summaryEl.textContent = recommendation;
  }
}

function updateBakauheniRiskInsight() {
  const stats = calculateRiskSummary(bakauheniRiskFeatures, currentRiskState);

  const highRiskCount = bakauheniRiskFeatures.filter((f) => {
    const value = Number(f.properties?.[currentRiskState]) || 0;

    return value >= 0.6;
  }).length;

  let recommendation = "Maintain monitoring and preparedness activities.";

  if (stats.maxRisk >= 0.8) {
    recommendation = "Immediate mitigation measures are recommended for high-risk assets.";
  } else if (stats.maxRisk >= 0.6) {
    recommendation = "Prioritize inspection and protection of vulnerable infrastructure.";
  }

  const highRiskEl = document.getElementById("bakauheniRiskHighRiskCount");

  const summaryEl = document.getElementById("bakauheniRiskSummary");

  if (highRiskEl) {
    highRiskEl.textContent = `${highRiskCount} Assets`;
  }

  if (summaryEl) {
    summaryEl.textContent = recommendation;
  }
}

function initRiskStateButtons() {
  const buttons = document.querySelectorAll(".risk-state-btn");

  buttons.forEach((button) => {
    button.addEventListener("click", async () => {
      buttons.forEach((btn) => {
        btn.classList.remove("active");
      });

      button.classList.add("active");

      currentRiskState = button.dataset.ds;

      await loadRiskData();

      refreshRiskDashboard();

      renderMiniRiskMap(currentRiskState);

      renderBakauheniMiniRiskMap(currentRiskState);
    });
  });
}

function renderInfrastructureSummary() {
  const tbody = document.getElementById("riskInfrastructureTable");

  if (!tbody) return;

  tbody.innerHTML = "";

  const groups = {};

  cilacapRiskFeatures.forEach((feature) => {
    const type = feature.properties.TYPE || "Unknown";

    const risk = Number(feature.properties[currentRiskState]) || 0;

    if (!groups[type]) {
      groups[type] = {
        count: 0,
        riskSum: 0,
      };
    }

    groups[type].count++;
    groups[type].riskSum += risk;
  });

  Object.entries(groups)
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([type, data]) => {
      const avg = data.riskSum / data.count;

      tbody.insertAdjacentHTML(
        "beforeend",
        `
        <tr>
          <td>${type}</td>
          <td>${data.count}</td>
          <td>${avg.toFixed(3)}</td>
        </tr>
      `,
      );
    });
}
function renderBakauheniInfrastructureSummary() {
  const tbody = document.getElementById("bakauheniRiskInfrastructureTable");

  if (!tbody) return;

  tbody.innerHTML = "";

  const groups = {};

  bakauheniRiskFeatures.forEach((feature) => {
    const type = feature.properties.TYPE || "Unknown";

    const risk = Number(feature.properties[currentRiskState]) || 0;

    if (!groups[type]) {
      groups[type] = {
        count: 0,
        riskSum: 0,
      };
    }

    groups[type].count++;
    groups[type].riskSum += risk;
  });

  Object.entries(groups)
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([type, data]) => {
      const avg = data.riskSum / data.count;

      tbody.insertAdjacentHTML(
        "beforeend",
        `
        <tr>
          <td>${type}</td>
          <td>${data.count}</td>
          <td>${avg.toFixed(3)}</td>
        </tr>
      `,
      );
    });
}

function renderTopRiskAssets() {
  const tbody = document.getElementById("topRiskAssetTable");

  if (!tbody) return;

  tbody.innerHTML = "";

  document.getElementById("activeDsColumn").textContent = currentRiskState;

  document.getElementById("activeRiskScenario").textContent = currentRiskState;

  const sorted = [...cilacapRiskFeatures]
    .sort((a, b) => (b.properties[currentRiskState] || 0) - (a.properties[currentRiskState] || 0))
    .slice(0, 10);

  sorted.forEach((feature) => {
    const p = feature.properties;

    const originalIndex = cilacapRiskFeatures.indexOf(feature);

    tbody.insertAdjacentHTML(
      "beforeend",
      `
      <tr
        class="risk-row"
        data-feature-index="${originalIndex}"
      >
        <td>${p.id ?? "-"}</td>
        <td>${p.TYPE ?? "-"}</td>
        <td>${p.SUBTYPE ?? "-"}</td>
        <td>${Number(p.HMAX || 0).toFixed(2)}</td>
        <td>${Number(p[currentRiskState] || 0).toFixed(3)}</td>
      </tr>
      `,
    );
  });

  document.querySelectorAll("#topRiskAssetTable .risk-row").forEach((row) => {
    row.addEventListener("click", () => {
      const feature = cilacapRiskFeatures[row.dataset.featureIndex];

      zoomToRiskFeature(feature, miniRiskRasterMap);
    });
  });
}

function renderBakauheniTopRiskAssets() {
  const tbody = document.getElementById("bakauheniTopRiskAssetTable");

  if (!tbody) return;

  tbody.innerHTML = "";

  document.getElementById("bakauheniActiveDsColumn").textContent = currentRiskState;
  document.getElementById("bakauheniActiveRiskScenario").textContent = currentRiskState;

  const sorted = [...bakauheniRiskFeatures]
    .sort((a, b) => (b.properties[currentRiskState] || 0) - (a.properties[currentRiskState] || 0))
    .slice(0, 10);

  sorted.forEach((feature) => {
    const p = feature.properties;

    const originalIndex = bakauheniRiskFeatures.indexOf(feature);

    tbody.insertAdjacentHTML(
      "beforeend",
      `
      <tr
        class="risk-row"
        data-feature-index="${originalIndex}"
      >
        <td>${p.id ?? "-"}</td>
        <td>${p.TYPE ?? "-"}</td>
        <td>${p.SUBTYPE ?? "-"}</td>
        <td>${Number(p.HMAX || 0).toFixed(2)}</td>
        <td>${Number(p[currentRiskState] || 0).toFixed(3)}</td>
      </tr>
      `,
    );
  });

  document.querySelectorAll("#bakauheniTopRiskAssetTable .risk-row").forEach((row) => {
    row.addEventListener("click", () => {
      const feature = bakauheniRiskFeatures[row.dataset.featureIndex];

      zoomToRiskFeature(feature, bakauheniMiniRiskRasterMap);
    });
  });
}

function zoomToRiskFeature(feature, map) {
  if (!feature || !map) return;

  const tempLayer = L.geoJSON(feature);

  map.fitBounds(tempLayer.getBounds(), {
    padding: [50, 50],
    maxZoom: 17,
  });
}

function generateRiskInsight(features) {
  const sorted = [...features].sort(
    (a, b) => (b.properties[currentRiskState] || 0) - (a.properties[currentRiskState] || 0),
  );

  const highest = sorted[0];

  const highCount = features.filter((f) => Number(f.properties[currentRiskState]) > 0.8).length;

  return `
Pada skenario ${currentRiskState},
aset dengan risiko tertinggi adalah
${highest.properties.SUBTYPE}
dengan probabilitas
${Number(highest.properties[currentRiskState]).toFixed(3)}.

Sebanyak ${highCount}
aset memiliki probabilitas
kerusakan di atas 0.8.
`;
}

function exportRiskCSV() {
  const rows = [];

  rows.push(["ID", "TYPE", "SUBTYPE", "HMAX", currentRiskState]);

  const sorted = [...cilacapRiskFeatures]
    .sort((a, b) => (b.properties[currentRiskState] || 0) - (a.properties[currentRiskState] || 0))
    .slice(0, 10);

  sorted.forEach((feature) => {
    const p = feature.properties;

    rows.push([p.id, p.TYPE, p.SUBTYPE, p.HMAX, p[currentRiskState]]);
  });

  const csv = rows.map((r) => r.join(",")).join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);

  link.download = `Cilacap_${currentRiskState}.csv`;

  link.click();
}

function exportBakauheniRiskCSV() {
  const rows = [];

  rows.push(["ID", "TYPE", "SUBTYPE", "HMAX", currentRiskState]);

  const sorted = [...bakauheniRiskFeatures]
    .sort((a, b) => (b.properties[currentRiskState] || 0) - (a.properties[currentRiskState] || 0))
    .slice(0, 10);

  sorted.forEach((feature) => {
    const p = feature.properties;

    rows.push([p.id, p.TYPE, p.SUBTYPE, p.HMAX, p[currentRiskState]]);
  });

  const csv = rows.map((r) => r.join(",")).join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);

  link.download = `Bakauheni_${currentRiskState}.csv`;

  link.click();
}
