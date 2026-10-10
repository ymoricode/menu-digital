# 🍽️ Menu Digital — Sistem Pemesanan Makanan Berbasis QR Code

> **Sistem informasi pemesanan makanan berbasis web dengan teknologi QR Code untuk restoran/rumah makan, dibangun menggunakan arsitektur Fullstack JavaScript (React.js & Express.js).**

---

## 📋 Daftar Isi

- [Deskripsi Sistem](#-deskripsi-sistem)
- [Latar Belakang](#-latar-belakang)
- [Fitur Sistem](#-fitur-sistem)
- [Teknologi yang Digunakan](#-teknologi-yang-digunakan)
- [Arsitektur Sistem](#-arsitektur-sistem)
- [Struktur Proyek](#-struktur-proyek)
- [Database Schema](#-database-schema)
- [API Endpoints](#-api-endpoints)
- [Alur Kerja Sistem](#-alur-kerja-sistem)
- [Instalasi & Konfigurasi](#-instalasi--konfigurasi)
- [Deployment](#-deployment)
- [Screenshot](#-screenshot)
- [Lisensi](#-lisensi)

---

## 📝 Deskripsi Sistem

**Menu Digital** adalah sebuah sistem informasi berbasis web yang dirancang untuk mempermudah proses pemesanan makanan di restoran atau rumah makan. Sistem ini memanfaatkan teknologi **QR Code** sebagai media akses menu digital oleh pelanggan. Setiap meja di restoran memiliki QR Code unik yang apabila dipindai akan menampilkan daftar menu secara digital melalui perangkat smartphone pelanggan.

Sistem ini terdiri dari dua sisi utama:

1. **Sisi Pelanggan (Customer)** — Antarmuka untuk memindai QR Code, melihat menu, menambahkan pesanan ke keranjang, melakukan checkout, dan membayar melalui QRIS (Midtrans Payment Gateway).
2. **Sisi Admin (Back Office)** — Dashboard manajemen untuk mengelola produk/menu, kategori, QR Code meja, memantau transaksi, dan melihat laporan penjualan.

---

## 🎯 Latar Belakang

Proses pemesanan makanan secara konvensional di restoran seringkali menghadapi beberapa kendala, antara lain:

- Antrian panjang untuk memesan di kasir
- Kesalahan pencatatan pesanan secara manual
- Keterbatasan informasi menu (gambar, deskripsi, harga)
- Proses pembayaran yang lambat dan tidak efisien
- Kesulitan dalam melakukan rekap data penjualan

Dengan adanya sistem **Menu Digital** berbasis QR Code ini, diharapkan dapat:

- Mempercepat proses pemesanan makanan
- Mengurangi kesalahan pencatatan pesanan
- Memberikan pengalaman pemesanan yang modern dan efisien
- Mengintegrasikan sistem pembayaran digital (QRIS)
- Mempermudah pengelolaan data menu dan transaksi

---

## ✨ Fitur Sistem

### 👤 Sisi Pelanggan (Customer)

| No | Fitur | Deskripsi |
|----|-------|-----------|
| 1 | **Scan QR Code** | Pelanggan memindai QR Code pada meja untuk mengakses menu digital |
| 2 | **Lihat Menu** | Menampilkan daftar menu berdasarkan kategori dengan gambar dan harga |
| 3 | **Detail Menu** | Menampilkan informasi lengkap (gambar, deskripsi, harga) setiap item menu |
| 4 | **Keranjang Belanja** | Menambah, mengubah jumlah, dan menghapus item pesanan |
| 5 | **Checkout & Pembayaran** | Proses checkout dengan input data pelanggan dan pembayaran QRIS |
| 6 | **Pembayaran QRIS** | Pembayaran digital melalui QRIS yang terintegrasi dengan Midtrans |
| 7 | **Status Pembayaran** | Halaman konfirmasi status pembayaran (berhasil/gagal) |

### 🔐 Sisi Admin (Back Office)

| No | Fitur | Deskripsi |
|----|-------|-----------|
| 1 | **Login & Autentikasi** | Sistem login admin dengan JWT (JSON Web Token) |
| 2 | **Dashboard** | Ringkasan data penjualan, grafik pendapatan, dan statistik transaksi |
| 3 | **Manajemen Produk** | CRUD (Create, Read, Update, Delete) data menu/makanan dengan upload gambar |
| 4 | **Manajemen Kategori** | CRUD data kategori menu (makanan, minuman, dll.) |
| 5 | **Manajemen QR Code** | Generate dan kelola QR Code untuk setiap meja |
| 6 | **Manajemen Transaksi** | Melihat, memproses, dan ekspor data transaksi ke Excel |
| 7 | **Notifikasi Real-time** | Notifikasi pesanan masuk secara real-time melalui polling |

---

## 🛠️ Teknologi yang Digunakan

### Frontend (Client-Side)

| Teknologi | Versi | Keterangan |
|-----------|-------|------------|
| **React.js** | ^18.2.0 | Library JavaScript untuk membangun antarmuka pengguna (UI) berbasis komponen |
| **Vite** | ^5.0.8 | Build tool modern untuk proyek frontend, menyediakan Hot Module Replacement (HMR) yang cepat |
| **React Router DOM** | ^6.21.0 | Library routing untuk navigasi halaman pada Single Page Application (SPA) |
| **Zustand** | ^4.4.7 | State management library yang ringan untuk mengelola state global (keranjang belanja) |
| **Axios** | ^1.6.2 | HTTP client berbasis promise untuk melakukan request ke RESTful API backend |
| **TailwindCSS** | ^3.3.6 | Utility-first CSS framework untuk styling antarmuka dengan cepat dan responsif |
| **PostCSS** | ^8.4.32 | Tool untuk mentransformasi CSS dengan plugin JavaScript |
| **Autoprefixer** | ^10.4.16 | Plugin PostCSS untuk menambahkan vendor prefix CSS secara otomatis |
| **Recharts** | ^2.10.3 | Library charting berbasis React untuk visualisasi data pada dashboard admin |
| **Lucide React** | ^0.294.0 | Library ikon modern berbasis SVG untuk elemen UI |
| **QRCode.react** | ^3.1.0 | Komponen React untuk menampilkan QR Code pada sisi admin |
| **html5-qrcode** | ^2.3.8 | Library JavaScript untuk memindai QR Code menggunakan kamera perangkat |
| **React Hot Toast** | ^2.4.1 | Library notifikasi toast yang ringan untuk feedback interaksi pengguna |

### Backend (Server-Side)

| Teknologi | Versi | Keterangan |
|-----------|-------|------------|
| **Node.js** | ≥18.0.0 | Runtime environment JavaScript untuk menjalankan kode di sisi server |
| **Express.js** | ^4.18.2 | Framework web minimalis untuk Node.js, digunakan untuk membangun RESTful API |
| **Drizzle ORM** | ^0.29.3 | ORM (Object-Relational Mapping) TypeScript-first untuk interaksi dengan database PostgreSQL |
| **Drizzle Kit** | ^0.20.10 | CLI tool untuk generate dan push migrasi database schema |
| **pg (node-postgres)** | ^8.11.3 | Driver PostgreSQL untuk Node.js, digunakan sebagai adapter Drizzle ORM |
| **JSON Web Token (JWT)** | ^9.0.2 | Standar untuk membuat token akses yang digunakan dalam autentikasi API |
| **bcryptjs** | ^2.4.3 | Library untuk hashing password menggunakan algoritma bcrypt |
| **Multer** | ^1.4.5 | Middleware untuk handling file upload (gambar menu) pada Express.js |
| **Cloudinary** | ^2.8.0 | Cloud-based image management service untuk menyimpan dan mengoptimasi gambar produk |
| **QRCode** | ^1.5.3 | Library untuk generate QR Code dalam format gambar di sisi server |
| **XLSX (SheetJS)** | ^0.18.5 | Library untuk membaca dan membuat file Excel, digunakan untuk ekspor data transaksi |
| **UUID** | ^9.0.1 | Library untuk generate Universally Unique Identifier untuk kode transaksi |
| **CORS** | ^2.8.5 | Middleware Express.js untuk mengaktifkan Cross-Origin Resource Sharing |
| **dotenv** | ^16.3.1 | Modul untuk memuat environment variable dari file `.env` |
| **Nodemon** | ^3.0.2 | Tool untuk auto-restart server Node.js saat terjadi perubahan kode (development) |
| **Concurrently** | ^8.2.2 | Tool untuk menjalankan frontend dan backend secara bersamaan dalam satu terminal |

### Database

| Teknologi | Keterangan |
|-----------|------------|
| **PostgreSQL** | Sistem manajemen basis data relasional (RDBMS) open-source yang powerful dan reliable |
| **Supabase** | Platform Backend-as-a-Service (BaaS) yang menyediakan hosting database PostgreSQL di cloud |

### Payment Gateway

| Teknologi | Keterangan |
|-----------|------------|
| **Midtrans** | Payment gateway Indonesia yang menyediakan metode pembayaran QRIS untuk transaksi digital |

### Deployment & Hosting

| Teknologi | Keterangan |
|-----------|------------|
| **Vercel** | Platform cloud untuk deployment frontend (Static Site) dan backend (Serverless Functions) |

### Development Tools

| Teknologi | Keterangan |
|-----------|------------|
| **Laragon** | Lingkungan pengembangan lokal (local development environment) untuk menjalankan proyek |
| **Git** | Version control system untuk pelacakan perubahan kode sumber |
| **npm** | Package manager untuk mengelola dependensi proyek JavaScript |
| **npm Workspaces** | Fitur monorepo npm untuk mengelola multiple packages dalam satu repository |

---

## 🏗️ Arsitektur Sistem

Sistem ini menggunakan arsitektur **Client-Server** dengan pola **RESTful API**, di mana frontend dan backend dipisahkan secara independen.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ARSITEKTUR SISTEM                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐          ┌──────────────┐     ┌───────────────┐  │
│  │   Pelanggan   │          │    Admin      │     │   Midtrans    │  │
│  │  (Smartphone) │          │  (Browser)    │     │   Webhook     │  │
│  └──────┬───────┘          └──────┬───────┘     └──────┬────────┘  │
│         │                         │                     │           │
│         │    Scan QR Code         │    Login             │           │
│         ▼                         ▼                     │           │
│  ┌────────────────────────────────────────┐             │           │
│  │          FRONTEND (React.js)           │             │           │
│  │         Hosted on Vercel               │             │           │
│  │                                        │             │           │
│  │  • SPA (Single Page Application)       │             │           │
│  │  • Routing: React Router DOM           │             │           │
│  │  • State: Zustand + Context API        │             │           │
│  │  • Styling: TailwindCSS                │             │           │
│  │  • HTTP Client: Axios                  │             │           │
│  └───────────────┬────────────────────────┘             │           │
│                  │ HTTP Request (REST API)               │           │
│                  ▼                                       ▼           │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              BACKEND (Express.js + Node.js)                 │   │
│  │             Vercel Serverless Functions                      │   │
│  │                                                              │   │
│  │  ┌────────────┐  ┌────────────┐  ┌─────────────────────┐   │   │
│  │  │  Routes     │  │ Controllers│  │     Services        │   │   │
│  │  │            │──▶│            │──▶│                     │   │   │
│  │  │ • Auth     │  │ • Auth     │  │ • Auth Service      │   │   │
│  │  │ • Menu     │  │ • Food     │  │ • Food Service      │   │   │
│  │  │ • Food     │  │ • Category │  │ • Category Service  │   │   │
│  │  │ • Category │  │ • Barcode  │  │ • Barcode Service   │   │   │
│  │  │ • Barcode  │  │ • Dashboard│  │ • Transaction Svc   │   │   │
│  │  │ • Payment  │  │ • Menu     │  │ • Midtrans Service  │   │   │
│  │  │ • Transact │  │ • Transact │  │ • Cloudinary Svc    │   │   │
│  │  │ • Dashboard│  │            │  │ • Dashboard Svc     │   │   │
│  │  │ • Notif    │  │            │  │ • Notification Svc  │   │   │
│  │  └────────────┘  └────────────┘  └─────────────────────┘   │   │
│  │                                                              │   │
│  │  ┌────────────┐  ┌──────────────────┐                       │   │
│  │  │ Middleware  │  │    Database       │                       │   │
│  │  │ • JWT Auth  │  │   (Drizzle ORM)  │                       │   │
│  │  │ • Multer    │  │                  │                       │   │
│  │  │ • CORS      │  │   PostgreSQL     │                       │   │
│  │  └────────────┘  │  (Supabase)      │                       │   │
│  │                   └──────────────────┘                       │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │               LAYANAN EKSTERNAL (Third-Party)               │   │
│  │                                                              │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │   │
│  │  │  Supabase    │  │  Cloudinary  │  │   Midtrans   │      │   │
│  │  │  (Database)  │  │  (Image CDN) │  │  (Payment)   │      │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘      │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Pola Arsitektur yang Diterapkan

1. **Monorepo (npm Workspaces)** — Frontend dan backend dikelola dalam satu repository menggunakan npm Workspaces.
2. **MVC (Model-View-Controller)** — Backend menerapkan pemisahan antara Routes → Controllers → Services → Database (Drizzle ORM).
3. **SPA (Single Page Application)** — Frontend dibangun sebagai SPA menggunakan React.js dengan client-side routing.
4. **RESTful API** — Komunikasi antara frontend dan backend menggunakan arsitektur REST melalui HTTP methods (GET, POST, PUT, DELETE).
5. **Serverless** — Backend di-deploy sebagai Serverless Functions pada platform Vercel.

---

## 📂 Struktur Proyek

```
menu-digital/
├── api/                              # Vercel Serverless Functions entry point
│   ├── index.js                      # Router utama untuk serverless deployment
│   └── package.json                  # Dependensi API serverless
│
├── apps/
│   ├── frontend/                     # Aplikasi Frontend (React.js)
│   │   ├── public/                   # Asset statis
│   │   ├── src/
│   │   │   ├── components/           # Komponen UI reusable
│   │   │   │   ├── charts/           # Komponen grafik (Recharts)
│   │   │   │   ├── layout/           # Layout komponen (Admin layout)
│   │   │   │   └── ui/               # Komponen UI dasar
│   │   │   ├── context/              # React Context (Cart Context)
│   │   │   │   └── cartContext.jsx   # Context untuk keranjang belanja
│   │   │   ├── hooks/                # Custom React Hooks
│   │   │   │   ├── useCart.js        # Hook untuk keranjang belanja
│   │   │   │   └── useNotifications.js # Hook untuk notifikasi real-time
│   │   │   ├── pages/                # Halaman aplikasi
│   │   │   │   ├── admin/            # Halaman admin
│   │   │   │   │   ├── Barcodes.jsx  # Manajemen QR Code meja
│   │   │   │   │   ├── Categories.jsx # Manajemen kategori
│   │   │   │   │   ├── Dashboard.jsx # Dashboard admin
│   │   │   │   │   ├── Login.jsx     # Halaman login admin
│   │   │   │   │   ├── Products.jsx  # Manajemen produk/menu
│   │   │   │   │   └── Transactions.jsx # Manajemen transaksi
│   │   │   │   └── customer/         # Halaman pelanggan
│   │   │   │       ├── Cart.jsx      # Keranjang belanja
│   │   │   │       ├── Checkout.jsx  # Proses checkout
│   │   │   │       ├── MenuDetail.jsx # Detail menu
│   │   │   │       ├── MenuList.jsx  # Daftar menu
│   │   │   │       ├── PaymentResult.jsx # Hasil pembayaran
│   │   │   │       ├── QRISPayment.jsx # Halaman pembayaran QRIS
│   │   │   │       └── ScanQR.jsx    # Halaman scan QR Code
│   │   │   ├── services/             # Service layer
│   │   │   │   └── api.js            # Konfigurasi Axios & API calls
│   │   │   ├── App.jsx               # Root component & routing
│   │   │   ├── main.jsx              # Entry point aplikasi React
│   │   │   └── index.css             # Global stylesheet
│   │   ├── index.html                # HTML template
│   │   ├── vite.config.js            # Konfigurasi Vite
│   │   ├── tailwind.config.js        # Konfigurasi TailwindCSS
│   │   ├── postcss.config.js         # Konfigurasi PostCSS
│   │   └── package.json              # Dependensi frontend
│   │
│   └── backend/                      # Aplikasi Backend (Express.js)
│       ├── drizzle/                  # File migrasi database
│       │   └── migrations/           # SQL migration files
│       ├── src/
│       │   ├── controllers/          # Controller layer (handle request/response)
│       │   │   ├── auth.controller.js       # Autentikasi (login/register)
│       │   │   ├── barcode.controller.js    # Manajemen QR Code
│       │   │   ├── category.controller.js   # Manajemen kategori
│       │   │   ├── dashboard.controller.js  # Data dashboard
│       │   │   ├── food.controller.js       # Manajemen produk makanan
│       │   │   ├── menu.controller.js       # Menu publik (customer)
│       │   │   └── transaction.controller.js # Manajemen transaksi & payment
│       │   ├── db/                   # Database layer
│       │   │   ├── index.js          # Koneksi database (Drizzle + pg)
│       │   │   ├── schema.js         # Definisi schema tabel database
│       │   │   └── migrations/       # Migration files
│       │   ├── middleware/           # Express middleware
│       │   │   └── auth.js           # JWT authentication middleware
│       │   ├── routes/               # API route definitions
│       │   │   ├── index.js          # Route aggregator
│       │   │   ├── auth.routes.js    # Route autentikasi
│       │   │   ├── barcode.routes.js # Route QR Code
│       │   │   ├── category.routes.js # Route kategori
│       │   │   ├── dashboard.routes.js # Route dashboard
│       │   │   ├── food.routes.js    # Route produk
│       │   │   ├── menu.routes.js    # Route menu publik
│       │   │   ├── notification.routes.js # Route notifikasi
│       │   │   ├── payment.routes.js # Route pembayaran (webhook)
│       │   │   └── transaction.routes.js # Route transaksi
│       │   ├── services/             # Business logic layer
│       │   │   ├── auth.service.js        # Logika autentikasi
│       │   │   ├── barcode.service.js     # Logika QR Code
│       │   │   ├── category.service.js    # Logika kategori
│       │   │   ├── cloudinary.service.js  # Integrasi Cloudinary (upload gambar)
│       │   │   ├── dashboard.service.js   # Logika dashboard & statistik
│       │   │   ├── food.service.js        # Logika produk makanan
│       │   │   ├── menu.service.js        # Logika menu publik
│       │   │   ├── midtrans.service.js    # Integrasi Midtrans Payment
│       │   │   ├── notification.service.js # Logika notifikasi
│       │   │   └── transaction.service.js # Logika transaksi
│       │   ├── jobs/                 # Background jobs
│       │   ├── utils/                # Utility functions
│       │   ├── app.js                # Express app configuration
│       │   └── server.js             # Server entry point
│       ├── uploads/                  # Direktori upload file lokal
│       ├── drizzle.config.js         # Konfigurasi Drizzle Kit
│       ├── migrate.js                # Script migrasi database
│       ├── seed.js                   # Script seeder data awal
│       ├── .env                      # Environment variables
│       └── package.json              # Dependensi backend
│
├── vercel.json                       # Konfigurasi deployment Vercel
├── package.json                      # Root package.json (Monorepo)
├── package-lock.json                 # Lock file dependensi
├── .gitignore                        # Git ignore rules
└── README.md                         # Dokumentasi proyek (file ini)
```

---

## 🗄️ Database Schema

Sistem ini menggunakan **6 tabel utama** pada database PostgreSQL yang didefinisikan menggunakan Drizzle ORM:

### Entity Relationship Diagram (ERD)

```
┌──────────────┐       ┌──────────────┐       ┌──────────────────┐
│    users     │       │  categories  │       │      foods       │
├──────────────┤       ├──────────────┤       ├──────────────────┤
│ id (PK)      │       │ id (PK)      │       │ id (PK)          │
│ name         │       │ name         │◄──────│ categories_id(FK)│
│ email (UQ)   │       │ created_at   │  1:N  │ name             │
│ password     │       │ updated_at   │       │ description      │
│ created_at   │       └──────────────┘       │ image            │
│ updated_at   │                              │ price            │
└──────┬───────┘                              │ created_at       │
       │                                      │ updated_at       │
       │ 1:N                                  └────────┬─────────┘
       ▼                                               │
┌──────────────┐       ┌──────────────────┐            │
│   barcodes   │       │  transactions    │            │
├──────────────┤       ├──────────────────┤            │
│ id (PK)      │       │ id (PK)          │            │
│ table_number │       │ code             │            │
│ image        │◄──────│ barcode_id (FK)  │            │
│ qr_value     │  1:N  │ name             │            │
│ user_id (FK) │──┐    │ phone            │            │
│ is_occupied  │  │    │ external_id      │            │
│ locked_at    │  │    │ checkout_link    │            │
│ created_at   │  │    │ payment_method   │            │
│ updated_at   │  │    │ payment_status   │            │
└──────────────┘  │    │ total            │            │
                  │    │ completed_at     │            │
    ┌─────────────┘    │ created_at       │            │
    │ users             │ updated_at       │            │
    │ (1:N)             └────────┬─────────┘            │
    │                            │ 1:N                  │ 1:N
    │                            ▼                      │
    │               ┌────────────────────────┐          │
    │               │   transaction_items    │          │
    │               ├────────────────────────┤          │
    │               │ id (PK)                │          │
    │               │ transaction_id (FK) ───┘          │
    │               │ foods_id (FK) ────────────────────┘
    │               │ quantity               │
    │               │ price                  │
    │               │ subtotal               │
    │               │ created_at             │
    │               │ updated_at             │
    │               └────────────────────────┘
```

### Deskripsi Tabel

| No | Tabel | Deskripsi |
|----|-------|-----------|
| 1 | **users** | Menyimpan data pengguna admin (nama, email, password terenkripsi) |
| 2 | **categories** | Menyimpan data kategori menu (makanan, minuman, snack, dll.) |
| 3 | **foods** | Menyimpan data produk/menu beserta gambar, deskripsi, harga, dan relasi ke kategori |
| 4 | **barcodes** | Menyimpan data QR Code untuk setiap meja, termasuk nomor meja dan status ketersediaan |
| 5 | **transactions** | Menyimpan data transaksi pesanan termasuk kode unik, data pelanggan, metode pembayaran, dan status |
| 6 | **transaction_items** | Menyimpan detail item pesanan (relasi many-to-many antara transaksi dan menu) |

### Relasi Antar Tabel

| Relasi | Tipe | Keterangan |
|--------|------|------------|
| users → barcodes | One-to-Many | Satu admin dapat membuat banyak QR Code meja |
| categories → foods | One-to-Many | Satu kategori memiliki banyak menu |
| barcodes → transactions | One-to-Many | Satu meja (QR Code) dapat memiliki banyak transaksi |
| transactions → transaction_items | One-to-Many | Satu transaksi memiliki banyak item pesanan |
| foods → transaction_items | One-to-Many | Satu menu dapat muncul di banyak item transaksi |

---

## 🔌 API Endpoints

### Autentikasi

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| `POST` | `/api/auth/login` | Login admin | ❌ |
| `POST` | `/api/auth/register` | Register admin | ❌ |

### Menu (Public — Pelanggan)

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| `GET` | `/api/menus` | Mendapatkan semua menu beserta kategori | ❌ |

### Produk/Makanan

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| `GET` | `/api/foods` | Mendapatkan semua produk | ✅ |
| `POST` | `/api/foods` | Menambah produk baru (dengan upload gambar) | ✅ |
| `PUT` | `/api/foods/:id` | Mengupdate produk | ✅ |
| `DELETE` | `/api/foods/:id` | Menghapus produk | ✅ |

### Kategori

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| `GET` | `/api/categories` | Mendapatkan semua kategori | ✅ |
| `POST` | `/api/categories` | Menambah kategori baru | ✅ |
| `PUT` | `/api/categories/:id` | Mengupdate kategori | ✅ |
| `DELETE` | `/api/categories/:id` | Menghapus kategori | ✅ |

### QR Code / Barcode

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| `GET` | `/api/barcodes` | Mendapatkan semua QR Code meja | ✅ |
| `POST` | `/api/barcodes` | Generate QR Code baru | ✅ |
| `DELETE` | `/api/barcodes/:id` | Menghapus QR Code | ✅ |
| `GET` | `/api/barcode/:table_number` | Mendapatkan info meja (public) | ❌ |

### Transaksi

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| `GET` | `/api/transactions` | Mendapatkan semua transaksi | ✅ |
| `POST` | `/api/transactions` | Membuat transaksi baru (checkout) | ❌ |

### Pembayaran

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| `POST` | `/api/payment/webhook` | Webhook notifikasi Midtrans | ❌ |
| `GET` | `/api/payment/status/:id` | Cek status pembayaran | ❌ |

### Dashboard

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| `GET` | `/api/dashboard/stats` | Statistik penjualan | ✅ |

### Notifikasi

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| `GET` | `/api/notifications` | Mendapatkan notifikasi pesanan | ✅ |

---

## 🔄 Alur Kerja Sistem

### Alur Pemesanan Pelanggan

```
┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  1. Scan QR  │───▶│ 2. Lihat     │───▶│ 3. Tambah ke │───▶│ 4. Checkout  │
│  Code Meja   │    │    Menu      │    │   Keranjang  │    │  & Isi Data  │
└─────────────┘    └──────────────┘    └──────────────┘    └──────┬───────┘
                                                                  │
                                                                  ▼
┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ 7. Pesanan   │◀──│ 6. Konfirmasi│◀──│ 5. Bayar     │◀──│ 4b. Pilih    │
│   Selesai    │    │   Pembayaran │    │   via QRIS   │    │ Pembayaran   │
└─────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

### Alur Pembayaran QRIS (Midtrans)

```
┌────────────┐   ┌────────────┐   ┌────────────┐   ┌────────────┐
│  Frontend   │   │  Backend    │   │  Midtrans   │   │  Database   │
│  (React)    │   │  (Express)  │   │  API        │   │ (PostgreSQL)│
└─────┬──────┘   └─────┬──────┘   └─────┬──────┘   └─────┬──────┘
      │                │                │                 │
      │  1. POST       │                │                 │
      │  /transactions │                │                 │
      │───────────────▶│                │                 │
      │                │  2. Create     │                 │
      │                │  QRIS Charge   │                 │
      │                │───────────────▶│                 │
      │                │                │                 │
      │                │  3. Return QR  │                 │
      │                │  Code URL      │                 │
      │                │◀───────────────│                 │
      │                │                │                 │
      │                │  4. Save       │                 │
      │                │  Transaction   │                 │
      │                │────────────────│────────────────▶│
      │                │                │                 │
      │  5. Return     │                │                 │
      │  QR Code       │                │                 │
      │◀───────────────│                │                 │
      │                │                │                 │
      │  6. Tampilkan  │                │                 │
      │  QR Code QRIS  │                │                 │
      │  (Pelanggan    │                │                 │
      │   scan & bayar)│                │                 │
      │                │                │                 │
      │                │  7. Webhook    │                 │
      │                │  Notification  │                 │
      │                │◀───────────────│                 │
      │                │                │                 │
      │                │  8. Update     │                 │
      │                │  Status        │                 │
      │                │────────────────│────────────────▶│
      │                │                │                 │
      │  9. Polling    │                │                 │
      │  Check Status  │                │                 │
      │───────────────▶│                │                 │
      │                │  10. Query     │                 │
      │                │────────────────│────────────────▶│
      │                │◀───────────────│─────────────────│
      │  11. Status    │                │                 │
      │  "settlement"  │                │                 │
      │◀───────────────│                │                 │
      │                │                │                 │
      │  12. Redirect  │                │                 │
      │  ke halaman    │                │                 │
      │  sukses        │                │                 │
      │                │                │                 │
```

---

## ⚙️ Instalasi & Konfigurasi

### Prasyarat (Prerequisites)

Pastikan perangkat lunak berikut sudah terinstall:

- **Node.js** versi ≥ 18.0.0 — [Download](https://nodejs.org/)
- **npm** (termasuk dalam instalasi Node.js)
- **Git** — [Download](https://git-scm.com/)
- **PostgreSQL** (atau gunakan Supabase untuk cloud database)

### Langkah Instalasi

#### 1. Clone Repository

```bash
git clone https://github.com/ymoricode/menu-digital.git
cd menu-digital
```

#### 2. Install Dependensi

```bash
# Install semua dependensi (root + workspaces)
npm install
```

#### 3. Konfigurasi Environment Variables

Buat file `.env` di folder `apps/backend/` dengan konfigurasi berikut:

```env
# Server
PORT=5000
NODE_ENV=development

# Database - PostgreSQL (Supabase)
DATABASE_URL=postgresql://username:password@host:5432/database

# JWT Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Midtrans Payment Gateway (QRIS)
MIDTRANS_SERVER_KEY=your_midtrans_server_key
MIDTRANS_CLIENT_KEY=your_midtrans_client_key
MIDTRANS_IS_PRODUCTION=false

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### 4. Setup Database

```bash
# Generate migrasi dari schema
npm run db:generate

# Push schema ke database
npm run db:push
```

#### 5. Jalankan Aplikasi (Development)

```bash
# Jalankan frontend & backend secara bersamaan
npm run dev

# Atau jalankan secara terpisah:
npm run dev:backend    # Backend berjalan di http://localhost:5000
npm run dev:frontend   # Frontend berjalan di http://localhost:5173
```

---

## 🚀 Deployment

Proyek ini di-deploy pada platform **Vercel** dengan konfigurasi sebagai berikut:

- **Frontend**: Di-build sebagai Static Site (SPA) menggunakan `vite build`, output ke folder `apps/frontend/dist`
- **Backend**: Di-deploy sebagai Vercel Serverless Function melalui file `api/index.js`
- **Routing**: Semua request ke `/api/*` diarahkan ke serverless function, sementara request lainnya diarahkan ke `index.html` (SPA routing)

### Langkah Deployment ke Vercel

1. Push kode ke repository GitHub
2. Hubungkan repository ke Vercel
3. Set environment variables di Vercel Dashboard
4. Deploy otomatis setiap push ke branch utama

---

## 📸 Screenshot

> *Tambahkan screenshot aplikasi di sini*

<!-- Contoh:
### Halaman Scan QR Code (Pelanggan)
![Scan QR](./screenshots/scan-qr.png)

### Halaman Menu (Pelanggan)
![Menu](./screenshots/menu-list.png)

### Halaman Keranjang (Pelanggan)
![Cart](./screenshots/cart.png)

### Pembayaran QRIS (Pelanggan)
![QRIS](./screenshots/qris-payment.png)

### Dashboard Admin
![Dashboard](./screenshots/dashboard.png)

### Manajemen Produk (Admin)
![Products](./screenshots/products.png)

### Manajemen Transaksi (Admin)
![Transactions](./screenshots/transactions.png)
-->

---

## 📄 Lisensi

Proyek ini dibuat untuk keperluan **Tugas Akhir / Skripsi** dan tidak ditujukan untuk distribusi komersial.

---

<p align="center">
  Dibuat dengan ❤️ menggunakan React.js, Express.js, dan PostgreSQL
</p>
