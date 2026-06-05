# Panduan Setup INAMI Dashboard — Untuk Pemula

Panduan ini ditulis untuk kamu yang baru pertama kali menjalankan project ini. Ikuti setiap langkah secara berurutan. Jangan lewati satupun.

---

## Daftar Isi

1. [Gambaran Umum Project](#1-gambaran-umum-project)
2. [Software yang Harus Diinstall](#2-software-yang-harus-diinstall)
3. [Clone Repository (Ambil Kode dari GitHub)](#3-clone-repository)
4. [Setup Supabase (Database)](#4-setup-supabase-database)
5. [Setup Backend Lokal](#5-setup-backend-lokal)
6. [Setup Frontend Lokal](#6-setup-frontend-lokal)
7. [Deploy Backend ke Railway](#7-deploy-backend-ke-railway)
8. [Deploy Frontend ke Vercel](#8-deploy-frontend-ke-vercel)
9. [Menghubungkan Frontend ke Backend](#9-menghubungkan-frontend-ke-backend)
10. [Troubleshooting (Masalah Umum)](#10-troubleshooting-masalah-umum)

---

## 1. Gambaran Umum Project

Project INAMI Dashboard terdiri dari **3 komponen utama**:

```
┌─────────────────────────────────────────────────────────┐
│                     ARSITEKTUR SISTEM                   │
│                                                         │
│  Browser Pengguna                                       │
│       │                                                 │
│       ▼                                                 │
│  VERCEL (Frontend)          ← public/index.html         │
│  https://inami-testing.vercel.app                       │
│       │                                                 │
│       ▼ (API calls)                                     │
│  RAILWAY (Backend)          ← server/server.js          │
│  https://inami-testing-production.up.railway.app        │
│       │                                                 │
│       ▼ (database queries)                              │
│  SUPABASE (Database)        ← PostgreSQL cloud          │
│  https://awlebphylpznwhboydqc.supabase.co               │
└─────────────────────────────────────────────────────────┘
```

- **Frontend** = halaman web yang dilihat pengguna (HTML/CSS/JS), di-deploy ke **Vercel**
- **Backend** = server API yang mengurus login, data, dll, di-deploy ke **Railway**
- **Database** = tempat menyimpan data pengguna & transaksi, menggunakan layanan cloud **Supabase**

---

## 2. Software yang Harus Diinstall

Sebelum memulai, pastikan laptop kamu sudah terpasang software berikut:

### 2.1 Node.js

Node.js dibutuhkan untuk menjalankan backend secara lokal.

1. Buka https://nodejs.org
2. Download versi **LTS** (tulisan "Recommended For Most Users")
3. Install seperti biasa (klik Next terus)
4. Verifikasi dengan buka **Terminal / Command Prompt**, ketik:
   ```
   node --version
   ```
   Harus muncul versi, contoh: `v22.x.x`

### 2.2 Git

Git dibutuhkan untuk mengambil kode dari GitHub.

1. Buka https://git-scm.com/downloads
2. Download sesuai OS kamu (Windows/Mac/Linux)
3. Install (klik Next terus, semua opsi default sudah benar)
4. Verifikasi:
   ```
   git --version
   ```
   Harus muncul versi, contoh: `git version 2.x.x`

### 2.3 VS Code (Editor Kode)

1. Buka https://code.visualstudio.com
2. Download dan install
3. Install ekstensi **Live Server**:
   - Buka VS Code
   - Klik ikon Extensions di sidebar kiri (ikon kotak-kotak)
   - Cari "Live Server" oleh Ritwick Dey
   - Klik Install

---

## 3. Clone Repository

"Clone" artinya mengunduh seluruh kode project dari GitHub ke laptop kamu.

### Langkah-langkah:

1. Buka **Terminal** (Windows: cari "Command Prompt" atau "PowerShell" di Start Menu)

2. Navigasi ke folder tempat kamu ingin menyimpan project. Contoh, simpan di Desktop:
   ```
   cd Desktop
   ```

3. Clone repository:
   ```
   git clone https://github.com/mykewazowsky/inami-testing.git
   ```

4. Masuk ke folder project:
   ```
   cd inami-testing
   ```

5. Buka di VS Code:
   ```
   code .
   ```

Sekarang kamu sudah punya seluruh kode project di laptop kamu.

---

## 4. Setup Supabase (Database)

Supabase adalah layanan database cloud gratis. Kita perlu membuat project di Supabase dan menyiapkan tabel-tabel yang dibutuhkan.

### 4.1 Buat Akun Supabase

1. Buka https://supabase.com
2. Klik **Start your project** → **Sign Up**
3. Daftar menggunakan akun GitHub atau email

### 4.2 Buat Project Baru di Supabase

> **Catatan:** Jika kamu menggunakan database yang sama dengan project yang sudah berjalan, lewati langkah 4.2–4.3 dan minta URL + key dari pemilik project.

1. Setelah login, klik **New Project**
2. Isi:
   - **Name:** `inami-dashboard` (atau nama apapun)
   - **Database Password:** buat password yang kuat, **simpan password ini**, kamu butuhkan nanti
   - **Region:** pilih yang paling dekat (misal: Singapore)
3. Klik **Create new project**
4. Tunggu beberapa menit sampai project selesai dibuat (ada loading bar)

### 4.3 Jalankan Schema SQL (Buat Tabel)

Ini langkah penting — membuat tabel-tabel yang dibutuhkan aplikasi.

1. Di dashboard Supabase, klik menu **SQL Editor** di sidebar kiri
2. Klik **New query**
3. Buka file `supabase_schema.sql` di VS Code (ada di root folder project)
4. **Salin semua isinya** (Ctrl+A lalu Ctrl+C)
5. **Tempel** ke SQL Editor Supabase (Ctrl+V)
6. Klik tombol **Run** (atau tekan Ctrl+Enter)
7. Harus muncul pesan **"Success. No rows returned"** atau sejenisnya — artinya berhasil

### 4.4 Ambil API Keys Supabase

Kamu butuh 2 kunci (key) dari Supabase:
- **anon key** → untuk frontend
- **service_role key** → untuk backend (jangan dibagikan ke publik!)

Cara mendapatkannya:

1. Di dashboard Supabase, klik **Project Settings** (ikon gear/gigi di sidebar kiri bawah)
2. Klik tab **API**
3. Catat 3 hal ini:
   - **Project URL** → contoh: `https://abcdefgh.supabase.co`
   - **anon public** (di bagian "Project API keys") → kunci panjang yang dimulai dengan `eyJ...`
   - **service_role** (di bagian yang sama, klik "Reveal") → kunci panjang lainnya

> ⚠️ **PENTING:** `service_role` key memiliki akses penuh ke database. Jangan pernah taruh di kode frontend atau commit ke GitHub.

---

## 5. Setup Backend Lokal

### 5.1 Install Dependency Backend

Buka Terminal, pastikan kamu ada di folder root project (`inami-testing`):

```
npm install
```

Tunggu sampai selesai. Ini akan mengunduh semua library yang dibutuhkan.

### 5.2 Buat File .env untuk Backend

File `.env` adalah file konfigurasi rahasia yang berisi kata sandi dan API key. File ini **tidak** masuk ke GitHub (sudah diabaikan oleh `.gitignore`).

1. Buka folder `server/` di project
2. Buat file baru bernama `.env` (persis seperti itu, dengan titik di depan)
3. Isi dengan template berikut:

```env
PORT=3000
FRONTEND_URL=http://127.0.0.1:5500

# ── Supabase ──────────────────────────────────────────────
SUPABASE_URL=https://XXXXXXXX.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# ── JWT (untuk keamanan token) ────────────────────────────
JWT_SECRET=buat_kalimat_rahasia_panjang_acak_di_sini

# ── Email (opsional, untuk fitur kirim email) ─────────────
EMAIL_USER=
EMAIL_PASS=

# ── Resend (opsional, untuk notifikasi partnership) ───────
RESEND_API_KEY=
MAIL_TO=

# ── Cloudflare R2 (opsional, untuk upload file) ───────────
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_BASE_URL=
```

4. Ganti nilai-nilai berikut:
   - `SUPABASE_URL` → ganti dengan **Project URL** dari Supabase (langkah 4.4)
   - `SUPABASE_SERVICE_ROLE_KEY` → ganti dengan **service_role** key dari Supabase
   - `JWT_SECRET` → buat kalimat rahasia acak yang panjang, contoh: `inami_super_rahasia_123_xk9p`

5. Simpan file

### 5.3 Isi Supabase Anon Key di Frontend

1. Buka file `public/js/supabase-config.js`
2. Ganti baris ini:
   ```javascript
   const SUPABASE_ANON = "GANTI_DENGAN_SUPABASE_ANON_KEY";
   ```
   dengan:
   ```javascript
   const SUPABASE_ANON = "eyJhbGci...";  // isi dengan anon key dari langkah 4.4
   ```
3. Simpan file

> ⚠️ **Catatan:** `anon` key boleh ada di frontend karena Supabase sudah membatasi aksesnya lewat Row Level Security. Tapi tetap jangan bagikan ke orang yang tidak perlu.

### 5.4 Jalankan Backend Lokal

Di Terminal, dari folder root project:

```
node server/server.js
```

Jika berhasil, akan muncul:
```
Server berjalan di http://localhost:3000
```

Biarkan terminal ini tetap terbuka selama pengembangan.

---

## 6. Setup Frontend Lokal

Frontend adalah file-file statis (HTML/CSS/JS) yang ada di folder `public/`.

### Cara Menjalankan:

1. Buka VS Code
2. Klik kanan pada file `public/index.html`
3. Pilih **"Open with Live Server"**
4. Browser akan terbuka otomatis di `http://127.0.0.1:5500/public/index.html`

Frontend sudah berjalan! Login, peta, dan semua fitur seharusnya berfungsi selama backend juga aktif (langkah 5.4).

---

## 7. Deploy Backend ke Railway

Railway adalah platform cloud untuk menjalankan backend Node.js secara online (gratis dengan batasan tertentu).

### 7.1 Buat Akun Railway

1. Buka https://railway.com
2. Klik **Login** → pilih **Login with GitHub**
3. Authorize Railway untuk mengakses akun GitHub kamu

### 7.2 Buat Project Baru di Railway

1. Di dashboard Railway, klik **New Project**
2. Pilih **Deploy from GitHub repo**
3. Pilih repository `inami-testing` dari daftar
4. Railway akan mulai build otomatis — **tunggu dulu**, kita perlu setting dulu sebelum build berhasil

### 7.3 Set Environment Variables di Railway

Ini adalah langkah **paling penting** untuk Railway. Backend butuh variabel ini agar bisa berjalan.

1. Di halaman project Railway, klik service yang baru dibuat
2. Klik tab **Variables**
3. Klik **New Variable** dan tambahkan satu per satu:

| Variable | Value |
|---|---|
| `SUPABASE_URL` | URL project Supabase kamu (contoh: `https://abcdefgh.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key dari Supabase |
| `JWT_SECRET` | kalimat rahasia yang sama dengan di `.env` lokal |
| `FRONTEND_URL` | URL Vercel kamu (setelah deploy, contoh: `https://inami-testing.vercel.app`) |

> Untuk `FRONTEND_URL`: jika kamu belum deploy ke Vercel, isi dulu dengan `*` sementara, lalu ganti setelah Vercel selesai.

4. Klik **Add** setiap kali selesai mengisi satu variabel

### 7.4 Cek Build & Start Command

Railway sudah dikonfigurasi lewat file `railway.json` di project:
- **Build:** `npm install --omit=dev`
- **Start:** `node server/server.js`

Seharusnya sudah otomatis. Tapi untuk memastikan:

1. Klik tab **Settings**
2. Scroll ke bagian **Build** → pastikan **Custom Build Command** kosong atau isi `npm install --omit=dev`
3. Scroll ke bagian **Deploy** → pastikan **Custom Start Command** kosong atau isi `node server/server.js`
4. Pastikan **Root Directory** kosong (bukan `/server`)

### 7.5 Cek Deployment Berhasil

1. Klik tab **Deployments**
2. Tunggu sampai status berubah jadi **Active** (berwarna hijau)
3. Klik **View Logs** jika ingin melihat detail proses build
4. Setelah Active, klik **Settings** → scroll ke bagian **Networking** → klik **Generate Domain**
5. Kamu akan mendapat URL seperti: `https://nama-project-production.up.railway.app`

Verifikasi backend berjalan dengan buka URL tersebut di browser. Harus muncul teks:
```
INAMI backend is running
```

---

## 8. Deploy Frontend ke Vercel

Vercel adalah platform hosting untuk frontend statis — gratis dan sangat cepat.

### 8.1 Buat Akun Vercel

1. Buka https://vercel.com
2. Klik **Sign Up** → pilih **Continue with GitHub**
3. Authorize Vercel

### 8.2 Import Project

1. Di dashboard Vercel, klik **Add New...** → **Project**
2. Cari dan pilih repository `inami-testing`
3. Klik **Import**

### 8.3 Konfigurasi Deploy

Di halaman konfigurasi:

1. **Framework Preset:** pilih **Other** (bukan Next.js, bukan React — ini project HTML biasa)
2. **Root Directory:** biarkan kosong (titik `.`)
3. **Build Command:** kosongkan (tidak perlu build)
4. **Output Directory:** isi dengan `public`

   > Ini penting! Vercel perlu tahu bahwa file HTML ada di folder `public/`, bukan di root.

5. Klik **Deploy**

### 8.4 Tunggu Deploy Selesai

Vercel akan memproses beberapa detik. Setelah selesai:
- Status berubah jadi **Ready**
- Kamu mendapat URL, contoh: `https://inami-testing.vercel.app`

Buka URL tersebut — website sudah online!

---

## 9. Menghubungkan Frontend ke Backend

### 9.1 Update URL Backend di Frontend

File `public/js/config.js` mengatur ke mana frontend mengirim request API:

```javascript
export const API_BASE_URL =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000"           // ← untuk development lokal
    : "https://inami-testing-production.up.railway.app";  // ← untuk production
```

Jika URL Railway kamu berbeda dari yang tertulis di atas, ubah baris ke-3 sesuai URL Railway kamu.

Setelah mengubah, simpan file lalu commit dan push ke GitHub agar Vercel otomatis re-deploy.

### 9.2 Update FRONTEND_URL di Railway

Setelah kamu punya URL Vercel:

1. Buka Railway → project → tab **Variables**
2. Edit variabel `FRONTEND_URL`
3. Ganti nilainya dengan URL Vercel kamu (contoh: `https://inami-testing.vercel.app`)
4. Railway akan otomatis restart backend dengan nilai baru

### 9.3 Cara Push Perubahan ke GitHub (dan Auto-Deploy)

Setiap kali kamu mengubah kode dan ingin mempublikasikannya:

```bash
# 1. Lihat file apa yang berubah
git status

# 2. Tambahkan file yang ingin di-commit (ganti nama-file.js dengan file yang diubah)
git add public/js/config.js

# Atau tambahkan semua perubahan sekaligus:
git add .

# 3. Buat commit (catatan perubahan)
git commit -m "tulis keterangan perubahan di sini"

# 4. Push ke GitHub
git push
```

Setelah push:
- **Vercel** akan otomatis re-deploy frontend dalam ~30 detik
- **Railway** akan otomatis re-deploy backend dalam ~1-2 menit

---

## 10. Troubleshooting (Masalah Umum)

### ❌ "node is not recognized as an internal or external command"

**Penyebab:** Node.js belum diinstall atau perlu restart terminal.

**Solusi:**
1. Install Node.js dari https://nodejs.org
2. Tutup terminal/VS Code lalu buka kembali
3. Coba lagi

---

### ❌ "git is not recognized as an internal or external command"

**Penyebab:** Git belum diinstall.

**Solusi:** Install Git dari https://git-scm.com, lalu restart terminal.

---

### ❌ Website terbuka tapi peta tidak muncul / data tidak ada

**Penyebab:** Backend tidak berjalan atau URL backend salah.

**Solusi:**
1. Pastikan Railway sudah di-deploy dan statusnya **Active**
2. Buka URL Railway di browser — harus muncul "INAMI backend is running"
3. Cek file `public/js/config.js` — pastikan URL Railway sudah benar

---

### ❌ Login gagal / tidak bisa daftar akun

**Penyebab:** `supabase-config.js` belum diisi dengan anon key yang benar.

**Solusi:**
1. Buka `public/js/supabase-config.js`
2. Pastikan `SUPABASE_ANON` sudah diisi dengan **anon public** key dari Supabase (bukan service_role key)
3. Pastikan `SUPABASE_URL` benar

---

### ❌ Railway deployment gagal: "npm ci" error atau lock file error

**Penyebab:** Railway mencoba menggunakan `npm ci` tapi tidak ada `package-lock.json`.

**Solusi:** Project ini sudah dikonfigurasi untuk menggunakan `npm install` via `railway.json`. Pastikan file `railway.json` ada dan isinya benar:
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install --omit=dev"
  },
  "deploy": {
    "startCommand": "node server/server.js"
  }
}
```

Jika masih gagal, buka Railway Dashboard → Settings → isi **Custom Build Command** dengan `npm install --omit=dev` dan **Custom Start Command** dengan `node server/server.js`.

---

### ❌ Railway deployment gagal: "Cannot find module 'firebase-admin'"

**Penyebab:** Ada sisa kode lama yang mencoba mengimpor Firebase.

**Solusi:** Pastikan file `server/middleware/firebaseAuth.js` isinya adalah versi yang sudah dinonaktifkan (tidak ada `require('firebase-admin')` di dalamnya). Lihat file tersebut — jika masih ada baris `require('firebase-admin')`, hapus atau ganti dengan versi stub.

---

### ❌ Vercel deploy berhasil tapi halaman 404

**Penyebab:** Output directory salah.

**Solusi:**
1. Buka Vercel → project → **Settings** → **General**
2. Scroll ke **Build & Development Settings**
3. Pastikan **Output Directory** adalah `public`
4. Klik Save lalu Redeploy

---

### ❌ CORS error di browser (Console: "blocked by CORS policy")

**Penyebab:** Backend tidak mengizinkan request dari URL frontend kamu.

**Solusi:**
1. Buka Railway → Variables
2. Pastikan `FRONTEND_URL` sudah diisi dengan URL Vercel kamu yang benar (contoh: `https://nama-project.vercel.app`)
3. Railway akan otomatis restart setelah variabel diubah

---

## Ringkasan Checklist

Gunakan checklist ini untuk memastikan semua sudah selesai:

### Persiapan Lokal
- [ ] Node.js terinstall (`node --version` berhasil)
- [ ] Git terinstall (`git --version` berhasil)
- [ ] VS Code + ekstensi Live Server terinstall
- [ ] Repository sudah di-clone
- [ ] `npm install` berhasil dijalankan

### Supabase
- [ ] Akun Supabase sudah dibuat
- [ ] Project Supabase sudah dibuat
- [ ] Schema SQL (`supabase_schema.sql`) sudah dijalankan
- [ ] Project URL, anon key, dan service_role key sudah dicatat

### Konfigurasi Kode
- [ ] File `server/.env` sudah dibuat dengan nilai yang benar
- [ ] `public/js/supabase-config.js` sudah diisi dengan anon key

### Railway (Backend)
- [ ] Akun Railway sudah dibuat
- [ ] Project Railway sudah dibuat dari repo GitHub
- [ ] Variables sudah diisi: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `FRONTEND_URL`
- [ ] Deployment status **Active**
- [ ] Buka URL Railway di browser → muncul "INAMI backend is running"

### Vercel (Frontend)
- [ ] Akun Vercel sudah dibuat
- [ ] Project Vercel sudah di-import dari repo GitHub
- [ ] Output Directory diset ke `public`
- [ ] Deployment status **Ready**
- [ ] Buka URL Vercel → website tampil normal

### Integrasi
- [ ] `public/js/config.js` sudah diupdate dengan URL Railway yang benar
- [ ] `FRONTEND_URL` di Railway sudah diupdate dengan URL Vercel yang benar
- [ ] Login dan fitur peta berfungsi normal
