# INAMI Dashboard

Platform web untuk visualisasi dan analisis risiko bencana tsunami — mencakup peta interaktif, data inundasi, dan risk assessment wilayah Cilacap & Bakauheni.

## Teknologi

| Bagian | Teknologi |
|---|---|
| Frontend | HTML, CSS, JavaScript, Leaflet.js |
| Backend | Node.js, Express.js |
| Database | Supabase (PostgreSQL cloud) |
| Deploy Frontend | Vercel |
| Deploy Backend | Railway |

## Struktur Folder

```
inami-dashboard/
├── public/               ← Frontend (HTML, CSS, JS, assets)
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── assets/
├── server/               ← Backend (Express API)
│   ├── server.js
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   └── geodata/
├── vercel.json           ← Konfigurasi deploy Vercel
├── railway.json          ← Konfigurasi deploy Railway
└── supabase_schema.sql   ← Schema database
```

## Link Deployment

- **Frontend (live):** https://inami-testing.vercel.app
- **Backend (live):** https://inami-testing-production.up.railway.app

## Untuk Developer Baru

Lihat **[GUIDE.md](GUIDE.md)** untuk panduan lengkap langkah demi langkah — mulai dari instalasi software, clone repo, setup Supabase, Railway, hingga Vercel.
