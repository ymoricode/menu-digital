# Menu Digital - QR Code Ordering System

A full-stack web application designed for restaurants and cafes to provide a seamless digital menu and ordering experience via QR code scanning. Built with a modern tech stack utilizing an npm workspaces monorepo structure.

## 🚀 Features

- **Digital Menu**: Browse categories and items easily.
- **QR Code Integration**: Generate QR codes for tables and scan them to initiate orders.
- **Order Management**: Real-time order tracking and management.
- **QRIS Payment**: Customers pay by scanning a QRIS QR code displayed directly in the app, using any supported payment app (GoPay, DANA, OVO, ShopeePay, Mobile Banking, etc.).
- **Payment Verification**: Payments are verified via Midtrans webhook and backend API — never trusted from frontend.
- **Image Uploads**: Cloudinary integration for menu item images.
- **Authentication & Security**: JWT-based authentication for admin and staff.
- **Analytics & Reports**: Visual charts for sales data and Excel (xlsx) export capabilities.
- **Real-time Notifications**: SSE-based notifications for new orders and payments.

## 💳 Payment System

### Payment: QRIS
### Payment Provider: Midtrans

The payment system uses **QRIS** as the only available payment method. Customers see a QR code displayed inline in the app after checkout.

**Payment Flow:**
```
Customer → Digital Menu → Cart → Checkout → QRIS QR Code →
Customer scans with any payment app → Midtrans verifies payment →
Payment Notification (webhook) → Backend verification →
Order status = PAID → Customer sees success
```

**Supported Payment Apps (via QRIS):**
- GoPay, DANA, OVO, ShopeePay, LinkAja
- Mobile Banking (BCA, BRI, Mandiri, BNI, etc.)
- Any app that supports QRIS

**Security:**
- Payment status is only set via Midtrans webhook notification or backend API verification
- Webhook signature validated via SHA512
- Payment amount verified against order total
- Idempotent processing prevents duplicate payments

## 💻 Tech Stack

### Monorepo Structure
This project is structured as a monorepo using **npm workspaces**, containing two main applications: `frontend` and `backend`.

### Frontend (`apps/frontend`)
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS & Lucide React for icons
- **State Management**: Zustand
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **QR Code Utilities**: `html5-qrcode` (scanning), `qrcode.react` (rendering QRIS)
- **Charts**: Recharts
- **Notifications**: React Hot Toast

### Backend (`apps/backend`)
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database & ORM**: PostgreSQL with Drizzle ORM (`drizzle-kit`)
- **Authentication**: JWT (`jsonwebtoken`), Password Hashing (`bcryptjs`)
- **Payment Provider**: Midtrans — QRIS via Core API v2
- **File Uploads**: Cloudinary & Multer
- **Utilities**: `qrcode`, `uuid`, `xlsx` (for Excel reports)

## 🛠️ Prerequisites

Make sure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [PostgreSQL](https://www.postgresql.org/)
- A [Cloudinary](https://cloudinary.com/) account (for image hosting)
- A [Midtrans](https://midtrans.com/) account (for QRIS payments)

## ⚙️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd "menu digital"
   ```

2. **Install dependencies:**
   From the root directory, install the dependencies for all workspaces:
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Create a `.env` file in `apps/backend/`:
   ```env
   # Server
   PORT=5000
   NODE_ENV=development

   # Database
   DATABASE_URL=postgresql://user:password@host:5432/dbname

   # JWT
   JWT_SECRET=your-jwt-secret
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

   > **Note:** Get your Midtrans Server Key and Client Key from [Midtrans Dashboard](https://dashboard.midtrans.com/) → Settings → Access Keys. Use Sandbox keys for development.

4. **Midtrans Webhook Configuration:**
   In your Midtrans Dashboard → Settings → Configuration:
   - Set **Payment Notification URL** to: `https://your-domain.com/api/payment/webhook`
   - Enable **GoPay** payment channel (required for QRIS)

5. **Database Setup:**
   Run the following commands from the root directory to generate and push the database schema using Drizzle ORM:
   ```bash
   npm run db:generate
   npm run db:push
   ```

## 🏃‍♂️ Running the Application

You can run both the frontend and backend concurrently from the root directory:

```bash
# Run both frontend and backend
npm run dev
```

Alternatively, you can run them individually:

```bash
# Run only the backend
npm run dev:backend

# Run only the frontend
npm run dev:frontend
```

## 📦 Build for Production

To build the frontend for production:

```bash
npm run build:frontend
```

## 📜 Scripts Overview (Root `package.json`)

- `npm run dev`: Runs both backend and frontend development servers concurrently.
- `npm run dev:backend`: Starts the backend server using Nodemon.
- `npm run dev:frontend`: Starts the Vite development server for the frontend.
- `npm run build:frontend`: Builds the frontend Vite app for production.
- `npm run db:generate`: Generates Drizzle database migrations.
- `npm run db:migrate`: Runs database migrations.
- `npm run db:push`: Pushes schema changes directly to the database.

---
*Built with ❤️ for a better dining experience.*
