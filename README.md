<p align="center">
  <h1 align="center">🍔 Menu Digital</h1>
  <p align="center">
    <strong>QR Code Ordering & QRIS Payment System for Restaurants</strong>
  </p>
  <p align="center">
    Sistem pemesanan digital berbasis QR Code dengan pembayaran QRIS untuk restoran dan kafe.
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-≥18.0.0-339933?logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Express.js-4-000000?logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Midtrans-QRIS-0a7cff?logo=midtrans&logoColor=white" alt="Midtrans" />
  <img src="https://img.shields.io/badge/Deploy-Vercel-000?logo=vercel&logoColor=white" alt="Vercel" />
</p>

---

## 📖 Daftar Isi

- [Tentang Proyek](#-tentang-proyek)
- [Fitur Utama](#-fitur-utama)
- [Arsitektur & Tech Stack](#-arsitektur--tech-stack)
- [Struktur Proyek](#-struktur-proyek)
- [Database Schema](#-database-schema)
- [Alur Pembayaran QRIS](#-alur-pembayaran-qris)
- [API Reference](#-api-reference)
- [Prerequisites](#-prerequisites)
- [Instalasi & Setup](#%EF%B8%8F-instalasi--setup)
- [Menjalankan Aplikasi](#-menjalankan-aplikasi)
- [Deployment](#-deployment)
- [Environment Variables](#-environment-variables)
- [Scripts](#-scripts)
- [Keamanan](#-keamanan)

---

## 🎯 Tentang Proyek

**Menu Digital** adalah aplikasi web full-stack yang dirancang untuk restoran dan kafe agar bisa menyediakan pengalaman pemesanan digital yang seamless melalui QR Code. Pelanggan cukup scan QR Code di meja, browse menu, pesan, dan bayar langsung via QRIS — tanpa perlu memanggil pelayan.

Proyek ini dibangun dengan arsitektur **monorepo** menggunakan **npm workspaces**, terdiri dari dua aplikasi utama: **frontend** (React + Vite) dan **backend** (Express.js + PostgreSQL).

---

## ✨ Fitur Utama

### 👤 Sisi Pelanggan (Customer)
| Fitur | Deskripsi |
|-------|-----------|
| **Scan QR Code** | Scan QR di meja untuk memulai pemesanan |
| **Digital Menu** | Browse menu berdasarkan kategori dengan gambar & deskripsi |
| **Keranjang** | Tambah/kurangi item, lihat subtotal real-time |
| **Checkout** | Isi nama & nomor telepon, lalu submit pesanan |
| **Pembayaran QRIS** | Bayar langsung via QR Code QRIS (GoPay, DANA, OVO, ShopeePay, Mobile Banking, dll.) |
| **Status Pembayaran** | Polling otomatis — halaman auto-redirect ke sukses/gagal |

### 🔧 Sisi Admin (Dashboard)
| Fitur | Deskripsi |
|-------|-----------|
| **Dashboard Analytics** | Ringkasan penjualan, pendapatan harian/mingguan/bulanan, dan grafik chart |
| **Manajemen Produk** | CRUD makanan/minuman dengan upload gambar ke Cloudinary |
| **Manajemen Kategori** | CRUD kategori menu |
| **Manajemen QR/Barcode** | Generate dan kelola QR Code per meja |
| **Manajemen Transaksi** | Lihat semua transaksi, filter, selesaikan, atau batalkan pesanan |
| **Export Excel** | Ekspor data transaksi ke file `.xlsx` |
| **Notifikasi Real-time** | Notifikasi SSE untuk pesanan baru & pembayaran masuk |
| **Auto Unlock Meja** | Background job otomatis membersihkan meja yang terkunci karena transaksi expired/gagal |

---

## 🏗 Arsitektur & Tech Stack

### Monorepo Structure (npm workspaces)

```
menu-digital/
├── apps/
│   ├── frontend/    → React SPA (Customer & Admin UI)
│   └── backend/     → Express REST API + Background Jobs
├── api/             → Vercel Serverless Function (production adapter)
└── package.json     → Root workspace config
```

### Frontend (`apps/frontend`)

| Teknologi | Kegunaan |
|-----------|----------|
| **React 18** | UI library |
| **Vite 5** | Build tool & dev server |
| **Tailwind CSS 3** | Utility-first styling |
| **React Router DOM 6** | Client-side routing |
| **Zustand 4** | Lightweight state management (cart) |
| **Axios** | HTTP client |
| **Recharts** | Chart/grafik dashboard |
| **Lucide React** | Icon library |
| **html5-qrcode** | QR Code scanning (kamera) |
| **qrcode.react** | QR Code rendering (QRIS) |
| **React Hot Toast** | Toast notifications |

### Backend (`apps/backend`)

| Teknologi | Kegunaan |
|-----------|----------|
| **Node.js ≥18** | Runtime (ES Modules) |
| **Express.js 4** | Web framework |
| **PostgreSQL** | Relational database |
| **Drizzle ORM** | Type-safe SQL query builder & schema |
| **drizzle-kit** | Migration & schema push tooling |
| **JWT (jsonwebtoken)** | Authentication tokens |
| **bcryptjs** | Password hashing |
| **Midtrans Core API v2** | QRIS payment processing |
| **Cloudinary** | Cloud image hosting |
| **Multer** | File upload handling (memory storage) |
| **qrcode** | Server-side QR Code generation |
| **xlsx** | Excel export |
| **uuid** | Unique ID generation |

### Deployment

| Teknologi | Kegunaan |
|-----------|----------|
| **Vercel** | Hosting (frontend static + serverless API) |
| **Supabase** | Managed PostgreSQL database |

---

## 📂 Struktur Proyek

```
menu-digital/
│
├── 📦 package.json              # Root workspace config & scripts
├── 🔧 vercel.json               # Vercel deployment config
├── 📝 .gitignore                # Git ignore rules
│
├── 🌐 api/                      # Vercel Serverless Adapter
│   ├── index.js                 # Catch-all serverless function
│   └── package.json             # Serverless dependencies
│
├── 📱 apps/frontend/            # React Frontend
│   ├── index.html               # Entry HTML
│   ├── vite.config.js           # Vite config (dev proxy)
│   ├── tailwind.config.js       # Tailwind CSS config
│   ├── postcss.config.js        # PostCSS config
│   ├── package.json             # Frontend dependencies
│   │
│   └── src/
│       ├── main.jsx             # App entry point
│       ├── App.jsx              # Route definitions
│       ├── index.css            # Global styles
│       │
│       ├── pages/
│       │   ├── customer/        # Customer-facing pages
│       │   │   ├── ScanQR.jsx        # QR scanning page
│       │   │   ├── MenuList.jsx      # Menu browsing
│       │   │   ├── MenuDetail.jsx    # Item detail
│       │   │   ├── Cart.jsx          # Shopping cart
│       │   │   ├── Checkout.jsx      # Checkout form
│       │   │   ├── QRISPayment.jsx   # QRIS payment page
│       │   │   └── PaymentResult.jsx # Payment result
│       │   │
│       │   └── admin/           # Admin dashboard pages
│       │       ├── Login.jsx         # Admin login
│       │       ├── Dashboard.jsx     # Analytics dashboard
│       │       ├── Products.jsx      # Product management
│       │       ├── Categories.jsx    # Category management
│       │       ├── Barcodes.jsx      # QR/Barcode management
│       │       └── Transactions.jsx  # Transaction management
│       │
│       ├── components/
│       │   ├── ui/              # Reusable UI components
│       │   │   ├── Button.jsx
│       │   │   ├── Card.jsx
│       │   │   ├── Input.jsx
│       │   │   └── Modal.jsx
│       │   ├── layout/          # Layout components
│       │   │   ├── LayoutAdmin.jsx
│       │   │   ├── Navbar.jsx
│       │   │   └── Sidebar.jsx
│       │   └── charts/
│       │       └── RevenueChart.jsx
│       │
│       ├── context/
│       │   └── cartContext.jsx  # Cart context provider
│       │
│       ├── hooks/
│       │   ├── useCart.js       # Cart hook
│       │   └── useNotifications.js  # SSE notifications hook
│       │
│       └── services/
│           └── api.js           # Axios API client
│
└── ⚙️ apps/backend/             # Express Backend
    ├── package.json             # Backend dependencies
    ├── drizzle.config.js        # Drizzle ORM config
    ├── migrate.js               # Manual migration script
    ├── seed.js                  # Admin seeder script
    ├── .env                     # Environment variables
    │
    ├── drizzle/                 # Generated migrations
    │
    └── src/
        ├── app.js               # Express app setup (CORS, middleware, routes)
        ├── server.js            # HTTP server + graceful shutdown
        │
        ├── db/
        │   ├── index.js         # Database connection (Drizzle + pg)
        │   ├── schema.js        # Drizzle schema definitions
        │   └── migrations/      # Migration files
        │
        ├── routes/
        │   ├── index.js              # Route aggregator
        │   ├── auth.routes.js        # Authentication routes
        │   ├── menu.routes.js        # Public menu routes
        │   ├── category.routes.js    # Category CRUD routes
        │   ├── food.routes.js        # Food/product CRUD routes
        │   ├── barcode.routes.js     # QR barcode routes
        │   ├── transaction.routes.js # Transaction routes
        │   ├── payment.routes.js     # Payment webhook & status
        │   ├── dashboard.routes.js   # Dashboard analytics
        │   └── notification.routes.js # SSE notification stream
        │
        ├── controllers/
        │   ├── auth.controller.js
        │   ├── menu.controller.js
        │   ├── category.controller.js
        │   ├── food.controller.js
        │   ├── barcode.controller.js
        │   ├── transaction.controller.js
        │   └── dashboard.controller.js
        │
        ├── services/
        │   ├── auth.service.js
        │   ├── menu.service.js
        │   ├── category.service.js
        │   ├── food.service.js
        │   ├── barcode.service.js
        │   ├── transaction.service.js
        │   ├── midtrans.service.js       # QRIS payment via Midtrans
        │   ├── cloudinary.service.js     # Image upload to Cloudinary
        │   ├── dashboard.service.js      # Analytics queries
        │   └── notification.service.js   # SSE broadcast service
        │
        ├── middleware/
        │   └── auth.js          # JWT auth & admin middleware
        │
        ├── jobs/
        │   └── autoUnlock.job.js  # Background table auto-unlock
        │
        └── utils/
            └── qrcode.js        # QR Code generation utility
```

---

## 🗄 Database Schema

Aplikasi menggunakan **PostgreSQL** dengan **Drizzle ORM**. Berikut Entity Relationship Diagram:

```mermaid
erDiagram
    users ||--o{ barcodes : "creates"
    categories ||--o{ foods : "has"
    barcodes ||--o{ transactions : "has"
    transactions ||--o{ transaction_items : "contains"
    foods ||--o{ transaction_items : "included_in"

    users {
        serial id PK
        varchar name
        varchar email UK
        varchar password
        timestamp created_at
        timestamp updated_at
    }

    categories {
        serial id PK
        varchar name
        timestamp created_at
        timestamp updated_at
    }

    foods {
        serial id PK
        varchar name
        text description
        varchar image
        integer price
        integer categories_id FK
        timestamp created_at
        timestamp updated_at
    }

    barcodes {
        serial id PK
        varchar table_number
        varchar image
        varchar qr_value
        integer user_id FK
        boolean is_occupied
        timestamp locked_at
        timestamp created_at
        timestamp updated_at
    }

    transactions {
        serial id PK
        varchar code
        varchar name
        varchar phone
        varchar external_id
        varchar checkout_link
        integer barcode_id FK
        varchar payment_method
        varchar payment_status
        integer total
        timestamp completed_at
        timestamp created_at
        timestamp updated_at
    }

    transaction_items {
        serial id PK
        integer transaction_id FK
        integer foods_id FK
        integer quantity
        integer price
        integer subtotal
        timestamp created_at
        timestamp updated_at
    }
```

### Tabel & Relasi

| Tabel | Deskripsi |
|-------|-----------|
| `users` | Admin users (login dashboard) |
| `categories` | Kategori menu (Makanan, Minuman, dll.) |
| `foods` | Item menu dengan harga dan gambar |
| `barcodes` | QR Code per meja, tracking status meja (occupied/available) |
| `transactions` | Pesanan pelanggan dengan info pembayaran |
| `transaction_items` | Detail item per transaksi (relasi many-to-many foods ↔ transactions) |

### Payment Status Flow

```
pending → paid       (pembayaran berhasil via webhook/sync)
pending → expired    (pembayaran kedaluwarsa, >15 menit)
pending → cancelled  (admin membatalkan)
pending → failed     (pembayaran ditolak)
paid    → completed  (admin menyelesaikan pesanan)
```

---

## 💳 Alur Pembayaran QRIS

### Payment Provider: Midtrans (Core API v2)

Sistem pembayaran menggunakan **QRIS** sebagai satu-satunya metode pembayaran. QR Code ditampilkan langsung di dalam aplikasi setelah checkout.

### Flow Diagram

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Customer    │     │   Backend    │     │    Midtrans      │
│  (Frontend)  │     │   (Express)  │     │   Core API v2    │
└──────┬───────┘     └──────┬───────┘     └────────┬─────────┘
       │                    │                      │
       │  1. Submit Order   │                      │
       │───────────────────>│                      │
       │                    │  2. POST /v2/charge  │
       │                    │  (payment_type:qris) │
       │                    │─────────────────────>│
       │                    │                      │
       │                    │  3. Return qr_string │
       │                    │<─────────────────────│
       │  4. Display QRIS   │                      │
       │<───────────────────│                      │
       │                    │                      │
       │  5. Customer scans │                      │
       │  QR with e-wallet  │                      │
       │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─>│
       │                    │                      │
       │                    │  6. Webhook POST     │
       │                    │  /api/payment/webhook│
       │                    │<─────────────────────│
       │                    │                      │
       │                    │  7. Verify signature │
       │                    │  (SHA512 validation) │
       │                    │                      │
       │  8. Polling status │                      │
       │───────────────────>│                      │
       │                    │                      │
       │  9. Payment SUCCESS│                      │
       │<───────────────────│                      │
       │                    │                      │
       │  10. Redirect to   │                      │
       │  success page      │                      │
       └────────────────────┘                      │
```

### Supported Payment Apps (via QRIS)
- **E-Wallets**: GoPay, DANA, OVO, ShopeePay, LinkAja
- **Mobile Banking**: BCA, BRI, Mandiri, BNI, dan semua bank yang mendukung QRIS
- **Semua aplikasi** yang mendukung standar QRIS Bank Indonesia

### Keamanan Pembayaran
- ✅ Payment status hanya di-set via **Midtrans webhook** atau **backend API verification**
- ✅ Webhook signature divalidasi via **SHA512** (`order_id + status_code + gross_amount + server_key`)
- ✅ Jumlah pembayaran diverifikasi terhadap total pesanan
- ✅ **Idempotent processing** — mencegah duplikasi pembayaran
- ✅ Mock mode tersedia untuk development tanpa API key Midtrans

---

## 📡 API Reference

Base URL: `/api`

### Authentication

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `POST` | `/api/auth/login` | ❌ | Login admin |
| `POST` | `/api/auth/register` | ❌ | Register user baru |
| `POST` | `/api/auth/logout` | ✅ | Logout |
| `GET` | `/api/auth/profile` | ✅ | Get profile user |

### Menu (Public)

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `GET` | `/api/menus` | ❌ | Get semua menu dengan kategori |

### Categories

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `GET` | `/api/categories` | ❌ | Get semua kategori |
| `POST` | `/api/categories` | ✅ Admin | Tambah kategori |
| `PUT` | `/api/categories/:id` | ✅ Admin | Update kategori |
| `DELETE` | `/api/categories/:id` | ✅ Admin | Hapus kategori |

### Foods / Products

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `GET` | `/api/foods` | ❌ | Get semua produk |
| `GET` | `/api/foods/:id` | ❌ | Get produk by ID |
| `POST` | `/api/foods` | ✅ Admin | Tambah produk (multipart/form-data) |
| `PUT` | `/api/foods/:id` | ✅ Admin | Update produk (multipart/form-data) |
| `DELETE` | `/api/foods/:id` | ✅ Admin | Hapus produk |

> **Note**: Upload gambar menggunakan field `image` (max 5MB, format: JPEG, PNG, GIF, WebP). Gambar otomatis di-upload ke Cloudinary.

### Barcodes / QR Codes

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `GET` | `/api/barcode/table/:table_number` | ❌ | Get barcode by nomor meja |
| `GET` | `/api/barcodes` | ✅ Admin | Get semua barcode |
| `GET` | `/api/barcodes/:id` | ✅ Admin | Get barcode by ID |
| `POST` | `/api/barcodes` | ✅ Admin | Generate barcode baru |
| `POST` | `/api/barcodes/:id/regenerate` | ✅ Admin | Regenerate QR Code |
| `DELETE` | `/api/barcodes/:id` | ✅ Admin | Hapus barcode |

### Transactions

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `POST` | `/api/transactions` | ❌ | Buat transaksi baru (customer checkout) |
| `GET` | `/api/transactions/status/:external_id` | ❌ | Get transaksi by external ID |
| `POST` | `/api/transactions/sync/:external_id` | ❌ | Sync status pembayaran dari Midtrans |
| `GET` | `/api/transactions/table-status/:barcodeId` | ❌ | Cek status meja |
| `GET` | `/api/transactions` | ✅ Admin | Get semua transaksi (with filter) |
| `GET` | `/api/transactions/export` | ✅ Admin | Export transaksi ke Excel |
| `GET` | `/api/transactions/:id` | ✅ Admin | Get detail transaksi |
| `PATCH` | `/api/transactions/:id/complete` | ✅ Admin | Tandai pesanan selesai |
| `PATCH` | `/api/transactions/:id/cancel` | ✅ Admin | Batalkan pesanan |

### Payment

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `POST` | `/api/payment/webhook` | ❌* | Midtrans webhook notification |
| `POST` | `/api/payment/notification` | ❌* | Alias untuk webhook |
| `GET` | `/api/payment/status/:id` | ❌ | Cek status pembayaran (DB-only, untuk polling) |

> \* Webhook diverifikasi via SHA512 signature, bukan JWT auth.

### Dashboard (Admin)

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `GET` | `/api/dashboard/summary` | ✅ Admin | Ringkasan dashboard |
| `GET` | `/api/dashboard/top-products` | ✅ Admin | Produk terlaris |
| `GET` | `/api/dashboard/monthly-income` | ✅ Admin | Pendapatan bulanan |
| `GET` | `/api/dashboard/weekly-income` | ✅ Admin | Pendapatan mingguan |
| `GET` | `/api/dashboard/recent-transactions` | ✅ Admin | Transaksi terbaru |

### Notifications (SSE)

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `GET` | `/api/notifications/stream` | ✅ Admin | SSE stream untuk notifikasi real-time |

**SSE Events:**
| Event | Deskripsi |
|-------|-----------|
| `connected` | Koneksi SSE berhasil |
| `new_transaction` | Ada pesanan baru dari customer |
| `payment_received` | Pembayaran berhasil diterima |
| `payment_expired` | Pembayaran kedaluwarsa |

### Health Check

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `GET` | `/api/health` | ❌ | Health check |

---

## 📋 Prerequisites

Pastikan sudah terinstall di komputer:

| Software | Versi | Link |
|----------|-------|------|
| **Node.js** | ≥ 18.0.0 | [nodejs.org](https://nodejs.org/) |
| **npm** | ≥ 8.0.0 | (bundled with Node.js) |
| **PostgreSQL** | ≥ 13 | [postgresql.org](https://www.postgresql.org/) |

### Akun Layanan Eksternal

| Layanan | Kegunaan | Link |
|---------|----------|------|
| **Cloudinary** | Hosting gambar menu | [cloudinary.com](https://cloudinary.com/) |
| **Midtrans** | Payment gateway QRIS | [midtrans.com](https://midtrans.com/) |
| **Supabase** *(opsional)* | Managed PostgreSQL | [supabase.com](https://supabase.com/) |
| **Vercel** *(opsional)* | Deployment | [vercel.com](https://vercel.com/) |

---

## ⚙️ Instalasi & Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd "menu digital"
```

### 2. Install Dependencies

Dari root directory, install semua dependencies untuk frontend dan backend sekaligus:

```bash
npm install
```

### 3. Setup Environment Variables

Buat file `.env` di `apps/backend/`:

```env
# Server
PORT=5000
NODE_ENV=development

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Midtrans (QRIS Payment)
MIDTRANS_SERVER_KEY=SB-Mid-server-your_key
MIDTRANS_CLIENT_KEY=SB-Mid-client-your_key
MIDTRANS_IS_PRODUCTION=false

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

> **📝 Catatan:**
> - Dapatkan **Midtrans Server Key & Client Key** dari [Midtrans Dashboard](https://dashboard.midtrans.com/) → Settings → Access Keys
> - Gunakan **Sandbox keys** untuk development (`SB-Mid-server-xxx`)
> - Set `MIDTRANS_IS_PRODUCTION=true` hanya untuk production
> - Jika Midtrans belum dikonfigurasi, aplikasi akan berjalan dalam **mock mode** (QR Code dummy)

### 4. Setup Database

#### Opsi A: Menggunakan Drizzle ORM (Recommended)

```bash
# Generate migration files
npm run db:generate

# Push schema ke database
npm run db:push
```

#### Opsi B: Manual Migration

```bash
cd apps/backend
node migrate.js
```

Script ini akan membuat semua tabel dan akun admin default.

### 5. Seed Admin User

```bash
cd apps/backend
node seed.js
```

Akan membuat akun admin:
| Field | Value |
|-------|-------|
| Email | `admin@menu.com` |
| Password | `admin123` |

### 6. Konfigurasi Midtrans Webhook

Di [Midtrans Dashboard](https://dashboard.midtrans.com/) → Settings → Configuration:

1. Set **Payment Notification URL** ke:
   ```
   https://your-domain.com/api/payment/webhook
   ```
2. Enable payment channel **GoPay** (diperlukan untuk QRIS)
3. Untuk development lokal, gunakan tool seperti [ngrok](https://ngrok.com/) untuk expose localhost

---

## 🏃 Menjalankan Aplikasi

### Development Mode

Jalankan frontend & backend secara bersamaan dari root directory:

```bash
npm run dev
```

Atau jalankan secara terpisah:

```bash
# Backend saja (port 5000)
npm run dev:backend

# Frontend saja (port 5173)
npm run dev:frontend
```

### Akses Aplikasi

| Halaman | URL |
|---------|-----|
| 🏠 Customer (Scan QR) | `http://localhost:5173/` |
| 📋 Menu | `http://localhost:5173/menu` |
| 🛒 Cart | `http://localhost:5173/cart` |
| 🔐 Admin Login | `http://localhost:5173/admin/login` |
| 📊 Admin Dashboard | `http://localhost:5173/admin/dashboard` |
| 🍔 Admin Products | `http://localhost:5173/admin/products` |
| 🏷️ Admin Categories | `http://localhost:5173/admin/categories` |
| 📱 Admin Barcodes | `http://localhost:5173/admin/barcodes` |
| 💰 Admin Transactions | `http://localhost:5173/admin/transactions` |
| ❤️ API Health | `http://localhost:5000/api/health` |

### Vite Dev Proxy

Pada development, Vite di-config untuk mem-proxy request `/api/*` ke backend (`http://localhost:5000`), sehingga frontend dan backend bisa berjalan tanpa masalah CORS.

---

## 🚀 Deployment

### Vercel (Production)

Proyek ini sudah di-configure untuk deploy ke **Vercel** dengan konfigurasi di `vercel.json`:

- **Frontend**: Di-build oleh Vite, di-serve sebagai static files
- **Backend**: Dikemas dalam serverless function di `api/index.js`
- **Routing**: `/api/*` → serverless function, `/*` → SPA (index.html)

#### Deploy Steps

1. Push ke GitHub repository
2. Import project di [Vercel Dashboard](https://vercel.com/dashboard)
3. Set environment variables di Vercel project settings
4. Deploy!

#### Vercel Config Highlights

```json
{
  "buildCommand": "cd apps/frontend && npm install --include=dev && npm run build",
  "outputDirectory": "apps/frontend/dist",
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/index.js?path=:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Build Frontend untuk Production

```bash
npm run build:frontend
```

Output: `apps/frontend/dist/`

---

## 🔐 Environment Variables

### Backend (`apps/backend/.env`)

| Variable | Required | Default | Deskripsi |
|----------|----------|---------|-----------|
| `PORT` | ❌ | `5000` | Port backend server |
| `NODE_ENV` | ❌ | `development` | Environment mode |
| `DATABASE_URL` | ✅ | - | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | - | Secret key untuk JWT |
| `JWT_EXPIRES_IN` | ❌ | `7d` | Masa berlaku JWT token |
| `MIDTRANS_SERVER_KEY` | ✅* | - | Midtrans Server Key |
| `MIDTRANS_CLIENT_KEY` | ✅* | - | Midtrans Client Key |
| `MIDTRANS_IS_PRODUCTION` | ❌ | `false` | `true` untuk production |
| `FRONTEND_URL` | ❌ | `http://localhost:5173` | URL frontend (CORS) |
| `CLOUDINARY_CLOUD_NAME` | ✅ | - | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | ✅ | - | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ✅ | - | Cloudinary API secret |

> \* Jika tidak di-set, payment berjalan dalam **mock mode** (QR Code dummy, tidak terhubung ke Midtrans).

---

## 📜 Scripts

### Root Scripts (`package.json`)

| Script | Perintah | Deskripsi |
|--------|----------|-----------|
| `dev` | `npm run dev` | Jalankan backend + frontend bersamaan |
| `dev:backend` | `npm run dev:backend` | Jalankan backend saja (Nodemon) |
| `dev:frontend` | `npm run dev:frontend` | Jalankan frontend saja (Vite) |
| `build:frontend` | `npm run build:frontend` | Build frontend untuk production |
| `db:generate` | `npm run db:generate` | Generate migration Drizzle |
| `db:migrate` | `npm run db:migrate` | Jalankan migration |
| `db:push` | `npm run db:push` | Push schema langsung ke database |

### Backend Scripts (`apps/backend/package.json`)

| Script | Deskripsi |
|--------|-----------|
| `dev` | Start dev server dengan Nodemon (auto-reload) |
| `start` | Start production server |
| `db:generate` | Generate Drizzle migration files |
| `db:migrate` | Run Drizzle migrations |
| `db:push` | Push schema ke database (tanpa migration file) |
| `db:studio` | Buka Drizzle Studio (database GUI) |

### Frontend Scripts (`apps/frontend/package.json`)

| Script | Deskripsi |
|--------|-----------|
| `dev` | Start Vite dev server |
| `build` | Build production bundle |
| `preview` | Preview production build |
| `lint` | Run ESLint |

---

## 🛡 Keamanan

### Authentication & Authorization
- **JWT-based authentication** — Token disimpan di localStorage
- **Auth middleware** — Memvalidasi JWT di setiap request yang memerlukan autentikasi
- **Admin middleware** — Membatasi akses ke endpoint admin-only
- **SSE auth** — Mendukung token via query parameter untuk EventSource (yang tidak bisa set header)

### Password Security
- Password di-hash menggunakan **bcryptjs** dengan salt rounds = 10
- Password plain-text tidak pernah disimpan di database

### Payment Security
- Webhook Midtrans diverifikasi via **SHA512 signature**
- Payment status hanya diubah oleh backend (never trusted from frontend)
- **Idempotent processing** — Transaksi yang sudah `paid` tidak diproses ulang
- Jumlah pembayaran diverifikasi terhadap total pesanan

### File Upload
- Upload dibatasi maksimal **5MB**
- Hanya menerima format gambar: **JPEG, JPG, PNG, GIF, WebP**
- File di-upload ke **Cloudinary** (tidak disimpan di server)
- Menggunakan **memory storage** (Multer) — kompatibel dengan serverless (Vercel)

### CORS
- Origin di-configure berdasarkan `FRONTEND_URL`
- Methods yang diizinkan: `GET, POST, PUT, DELETE, PATCH, OPTIONS`

### Background Jobs
- **Auto Unlock Job** — Membersihkan meja yang terkunci oleh transaksi stale setiap 60 detik
- Guard terhadap overlapping execution
- Graceful shutdown saat server berhenti

---

## 📄 Lisensi

Proyek ini dibuat untuk keperluan internal / pembelajaran.

---

<p align="center">
  Built with ❤️ for a better dining experience.
</p>
