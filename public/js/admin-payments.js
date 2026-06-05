import { supabase } from "./supabase-config.js";
import { API_BASE_URL } from "./config.js";

async function loadAdminPayments() {
  const tbody = document.getElementById("adminPaymentTableBody");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="7">Memuat data...</td></tr>`;

  try {
    const { data, error } = await supabase
      .from("payment_submissions")
      .select("id, buyer_name, buyer_email, location_name, product_names, total_payment, status")
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7">Belum ada data payment.</td></tr>`;
      return;
    }

    tbody.innerHTML = "";

    data.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.id}</td>
        <td>${row.buyer_name || "-"}</td>
        <td>${row.buyer_email || "-"}</td>
        <td>${row.location_name || "-"}</td>
        <td>${row.product_names || "-"}</td>
        <td>Rp${Number(row.total_payment || 0).toLocaleString("id-ID")}</td>
        <td>${row.status || "-"}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error("Gagal memuat data admin:", error);
    tbody.innerHTML = `<tr><td colspan="7">Gagal memuat data.</td></tr>`;
  }
}

document.addEventListener("DOMContentLoaded", loadAdminPayments);
