import {
  db,
  collection,
  getDocs,
  query,
  orderBy
} from "./firebase-config.js";

import { API_BASE_URL } from "./config.js";

async function loadAdminPayments() {
  const tbody = document.getElementById("adminPaymentTableBody");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="7">Memuat data...</td></tr>`;

  try {
    const q = query(
      collection(db, "payment_submissions"),
      orderBy("created_at", "desc")
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      tbody.innerHTML = `<tr><td colspan="7">Belum ada data payment.</td></tr>`;
      return;
    }

    tbody.innerHTML = "";

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${docSnap.id}</td>
        <td>${data.buyer_name || "-"}</td>
        <td>${data.buyer_email || "-"}</td>
        <td>${data.location_name || "-"}</td>
        <td>${data.product_names || "-"}</td>
        <td>Rp${Number(data.total_payment || 0).toLocaleString("id-ID")}</td>
        <td>${data.status || "-"}</td>
      `;

      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error("Gagal memuat data admin:", error);
    tbody.innerHTML = `<tr><td colspan="7">Gagal memuat data.</td></tr>`;
  }
}

document.addEventListener("DOMContentLoaded", loadAdminPayments);