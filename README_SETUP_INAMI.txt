# INAMI Dashboard - Setup Guide

Panduan ini dibuat agar rekan kerja bisa menjalankan project INAMI Dashboard di laptopnya sendiri.

## Isi project
Project ini terdiri dari 3 bagian:
1. Frontend
2. Backend Node.js + Express
3. Database MySQL

## Prasyarat
Pastikan perangkat sudah terpasang:
- Node.js
- npm
- XAMPP atau MySQL
- VS Code + Live Server (opsional, untuk frontend)

## Struktur penting project
- `public/` -> frontend
- `server/` -> backend
- `server/.env` -> konfigurasi backend
- `server/db.js` -> koneksi database
- `server/server.js` -> entry point backend

## Langkah setup

### 1. Extract project ZIP
Extract seluruh isi project ke folder kerja.

### 2. Install dependency backend
Buka terminal, lalu masuk ke folder `server`:

```bash
cd server
npm install
```

### 3. Jalankan MySQL
Jika memakai XAMPP:
- Start Apache
- Start MySQL
- Buka phpMyAdmin

### 4. Buat database
Jalankan file SQL `init_inami_dashboard.sql`, atau copy isi SQL-nya ke phpMyAdmin.

### 5. Buat file .env
Di dalam folder `server`, buat file `.env` dengan isi berdasarkan file `.env.example`.

Contoh default:
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=inami_dashboard
JWT_SECRET=inami_super_secret_key_123
```

### 6. Jalankan backend
Masih di folder `server`:

```bash
node server.js
```

Jika berhasil, akan muncul:
```text
Server berjalan di http://localhost:3000
```

### 7. Jalankan frontend
Buka folder project di VS Code, lalu jalankan `public/index.html` menggunakan Live Server.

Frontend biasanya berjalan di:
```text
http://127.0.0.1:5500/public/index.html
```

## Login / Signup
Login dan signup hanya akan berfungsi jika:
- backend berjalan di port 3000
- MySQL aktif
- database `inami_dashboard` sudah dibuat
- file `.env` sudah benar

## Catatan penting
- `localhost` di laptop rekan kerja berarti laptop dia sendiri, bukan laptop pengirim.
- Akun yang sudah dibuat di laptop pengirim tidak otomatis ikut pindah, kecuali database juga diexport/import.
- Jika ingin akun contoh, rekan kerja bisa signup ulang, atau import data tabel `users`.

## Troubleshooting singkat

### Gambar / CSS / JS tidak muncul
Pastikan frontend dijalankan dari `public/index.html` dan struktur folder tidak berubah.

### Login gagal
Cek:
- backend aktif
- MySQL aktif
- `.env` benar
- database sudah dibuat

### Error `npm not recognized`
Install Node.js lalu restart terminal / VS Code.

### Error koneksi database
Pastikan `DB_USER`, `DB_PASSWORD`, dan `DB_NAME` pada `.env` sesuai.

## File yang disarankan ikut dikirim
- source code project
- `README_SETUP_INAMI.md`
- `.env.example`
- `init_inami_dashboard.sql`

Selesai.
