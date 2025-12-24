# Menu Digital - Fullstack Monorepo

Sistem pemesanan menu digital dengan QR code scanning dan integrasi pembayaran Xendit.

## 📋 Fitur

### Customer Side
- 📱 Scan QR Code untuk akses menu
- 🍔 Lihat daftar menu dengan kategori & search
- 🛒 Keranjang belanja dengan quantity control
- 💳 Pembayaran online via Xendit
- ✅ Status pembayaran realtime

### Admin Side
- 🔐 Authentication dengan JWT
- 📊 Dashboard dengan analytics & grafik
- 🍽️ CRUD Products (Menu)
- 📁 CRUD Categories
- 📱 Generate QR Code untuk setiap meja
- 📋 Lihat riwayat transaksi

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Database | PostgreSQL |
| ORM | Drizzle ORM |
| Backend | Express.js (Node.js) |
| Frontend | React 18 + Vite |
| Styling | TailwindCSS |
| State | Context API |
| HTTP Client | Axios |
| Payment | Xendit |
| QR Code | qrcode / qrcode.react |
| Charts | Recharts |

## 📁 Struktur Project

```
menu-digital/
├── apps/
│   ├── backend/           # Express.js API
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── db/
│   │   │   ├── middleware/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── utils/
│   │   │   ├── app.js
│   │   │   └── server.js
│   │   ├── drizzle/
│   │   ├── uploads/
│   │   └── package.json
│   │
│   └── frontend/          # React + Vite
│       ├── src/
│       │   ├── components/
│       │   ├── context/
│       │   ├── hooks/
│       │   ├── pages/
│       │   ├── services/
│       │   ├── App.jsx
│       │   └── main.jsx
│       └── package.json
│
├── package.json           # Root workspace
└── README.md
```

## 🚀 Instalasi

### Prerequisites
- Node.js >= 18
- PostgreSQL
- npm atau yarn

### 1. Clone & Install Dependencies

```bash
# Clone repository
git clone <repo-url>
cd menu-digital

# Install semua dependencies (root + workspaces)
npm install
```

### 2. Setup Database PostgreSQL

```bash
# Buat database baru
createdb menu_digital

# Atau via psql
psql -U postgres
CREATE DATABASE menu_digital;
```

### 3. Konfigurasi Environment

```bash
# Copy environment template
cp apps/backend/.env.example apps/backend/.env

# Edit .env sesuai konfigurasi Anda
```

Edit file `apps/backend/.env`:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/menu_digital

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Xendit
XENDIT_SECRET_KEY=xnd_development_xxxx
XENDIT_WEBHOOK_TOKEN=your-webhook-token

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### 4. Jalankan Migrasi Database

```bash
# Generate migration
npm run db:generate

# Push schema ke database
npm run db:push
```

### 5. Seed Admin User (Opsional)

```bash
# Masuk ke folder backend
cd apps/backend

# Jalankan script seed (buat file seed jika diperlukan)
node -e "
const bcrypt = require('bcryptjs');
const { drizzle } = require('drizzle-orm/node-postgres');
const pg = require('pg');
require('dotenv').config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function seed() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await pool.query(
    'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING',
    ['Admin', 'admin@menu.com', hashedPassword, 'admin']
  );
  console.log('Admin user created!');
  process.exit(0);
}
seed();
"
```

### 6. Jalankan Development Server

```bash
# Dari root folder, jalankan kedua server
npm run dev

# Atau jalankan terpisah:
npm run dev:backend   # Backend di http://localhost:5000
npm run dev:frontend  # Frontend di http://localhost:5173
```

## 📚 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login admin |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/register` | Register admin |

### Menu (Customer)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/menus` | Get all menus |
| GET | `/api/menus/:id` | Get menu detail |
| GET | `/api/menus/categories` | Get categories |

### Foods (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/foods` | Get all foods |
| POST | `/api/foods` | Create food |
| PUT | `/api/foods/:id` | Update food |
| DELETE | `/api/foods/:id` | Delete food |

### Categories (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | Get all categories |
| POST | `/api/categories` | Create category |
| PUT | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category |

### Barcodes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/barcode/table/:table_number` | Get barcode by table |
| GET | `/api/barcodes` | Get all barcodes (admin) |
| POST | `/api/barcodes` | Create barcode (admin) |
| DELETE | `/api/barcodes/:id` | Delete barcode (admin) |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/transactions` | Create transaction |
| GET | `/api/transactions/:id` | Get transaction detail |
| GET | `/api/transactions/status/:external_id` | Check payment status |
| POST | `/api/payment/xendit/callback` | Xendit webhook |

### Dashboard (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/summary` | Get summary stats |
| GET | `/api/dashboard/top-products` | Get top products |
| GET | `/api/dashboard/monthly-income` | Get monthly income |
| GET | `/api/dashboard/weekly-income` | Get weekly income |

## 🌐 Deployment

### Frontend (Vercel)

1. Push ke GitHub
2. Import project di [Vercel](https://vercel.com)
3. Set root directory: `apps/frontend`
4. Add environment variable:
   ```
   VITE_API_URL=https://your-backend-url.com/api
   ```
5. Deploy

### Backend (Railway/Render)

#### Railway
1. Connect GitHub repository
2. Set root directory: `apps/backend`
3. Add PostgreSQL plugin
4. Add environment variables dari `.env`
5. Deploy

#### Render
1. Create Web Service
2. Connect repository
3. Set root directory: `apps/backend`
4. Build: `npm install`
5. Start: `npm start`
6. Add PostgreSQL database
7. Add environment variables

### Database (Supabase)

1. Create project di [Supabase](https://supabase.com)
2. Copy connection string
3. Update `DATABASE_URL` di backend

## 🔧 Xendit Setup

1. Daftar di [Xendit Dashboard](https://dashboard.xendit.co)
2. Dapatkan API Key (Development/Production)
3. Set Webhook URL: `https://your-backend-url.com/api/payment/xendit/callback`
4. Copy Webhook Verification Token
5. Update environment variables

## 📱 ERD Diagram

```
┌──────────────┐     ┌──────────────┐
│    users     │     │  categories  │
├──────────────┤     ├──────────────┤
│ id           │     │ id           │
│ name         │     │ name         │
│ email        │     │ created_at   │
│ password     │     │ updated_at   │
│ role         │     └──────┬───────┘
│ created_at   │            │
│ updated_at   │            │ 1:N
└──────┬───────┘            │
       │               ┌────┴───────┐
       │ 1:N           │   foods    │
       │               ├────────────┤
┌──────┴───────┐       │ id         │
│   barcodes   │       │ name       │
├──────────────┤       │ description│
│ id           │       │ image      │
│ table_number │       │ price      │
│ image        │       │ categories_id
│ qr_value     │       │ created_at │
│ user_id      │       │ updated_at │
│ created_at   │       └────────────┘
│ updated_at   │              │
└──────┬───────┘              │
       │                      │
       │ 1:N                  │ 1:N
       │                      │
┌──────┴───────────────┐     │
│    transactions      │     │
├──────────────────────┤     │
│ id                   │     │
│ code                 │     │
│ name                 │     │
│ phone                │     │
│ external_id          │     │
│ checkout_link        │     │
│ barcode_id           │     │
│ payment_method       │     │
│ payment_status       │     │
│ total                │     │
│ created_at           │     │
│ updated_at           │     │
└──────────┬───────────┘     │
           │                 │
           │ 1:N             │
           │                 │
┌──────────┴─────────────────┴──┐
│      transaction_items        │
├───────────────────────────────┤
│ id                            │
│ transaction_id                │
│ foods_id                      │
│ quantity                      │
│ price                         │
│ subtotal                      │
│ created_at                    │
│ updated_at                    │
└───────────────────────────────┘
```

## 💡 Rekomendasi Improvement

1. **Caching**: Implementasi Redis untuk caching menu & kategori
2. **Rate Limiting**: Tambahkan rate limiter untuk API public
3. **Image Optimization**: Gunakan Cloudinary/ImageKit untuk image hosting
4. **WebSocket**: Real-time order notification untuk kitchen
5. **Multi-tenant**: Support untuk multiple restoran
6. **Mobile App**: React Native untuk customer app
7. **Print Receipt**: Integrasi dengan thermal printer
8. **Inventory Management**: Stock management per menu item
9. **Promo/Discount**: Sistem kupon dan diskon
10. **Multi-language**: i18n untuk multiple bahasa

## 📄 License

MIT License

## 👨‍💻 Author

Menu Digital - Built with ❤️
