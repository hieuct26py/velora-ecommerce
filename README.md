<div align="center">

# ⚡ Velora E-Commerce Engine

### *High-Performance, Concurrency-Safe E-Commerce RESTful API*

[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-v5.0-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-v5.22-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](https://github.com/hieuct26py/velora-ecommerce/pulls)

<p align="center">
  <a href="#-overview">Overview</a> •
  <a href="#-architectural-highlights--concurrency-safety">Architecture & Highlights</a> •
  <a href="#-key-features">Key Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-api-reference">API Reference</a> •
  <a href="#-project-structure">Project Structure</a> •
  <a href="#-license">License</a>
</p>

</div>

---

## 📖 Overview

**Velora** is a production-grade, high-throughput RESTful e-commerce backend built with **Node.js**, **Express 5**, **Prisma ORM**, and **PostgreSQL**. Designed with high-concurrency resilience and financial precision at its core, Velora solves critical challenges inherent to modern shopping platforms: race conditions during flash sales, database deadlocks, memory exhaustion from uncapped queries, and timing-attack vulnerabilities.

Whether handling thousands of concurrent cart checkouts or streaming catalog data with minimal latency, Velora guarantees atomicity, data integrity, and near-zero Time to First Byte (TTFB).

---

## 🏛️ Architectural Highlights & Concurrency Safety

> [!IMPORTANT]
> Velora is engineered from the ground up to prevent high-load edge cases that crash conventional e-commerce backends.

### 1. 🛡️ Concurrency Safety via Global Lock Ordering (Deadlock Immunity)
- **The Problem:** In high-concurrency systems, simultaneous checkout transactions and admin order cancellations competing for identical inventory rows in different sequences cause PostgreSQL Deadlocks (`SQLSTATE 40P01`), resulting in random rollbacks and server `500` errors.
- **The Solution:** Velora enforces **Strict Lexicographical Lock Ordering**. All product updates within `createOrder`, `deleteOrder`, and `updateOrderStatus` sort target `product_id`s in alphanumeric order (`localeCompare`) prior to acquiring transactional row locks.
- **Atomic Stock Checks:** Inventory decrements execute conditionally via `tx.product.updateMany({ where: { stock_quantity: { gte: item.quantity } } })`. A zero affected count immediately aborts the transaction without negative inventory leakage.

```
Concurrent Checkouts & Cancellations
─────────────────────────────────────────────────────────────────────────────
Order A (Items: [B, A])  ───► Lexicographical Sort ───► Locks A then B  ──┐ (No Deadlock)
Order B (Items: [A, B])  ───► Lexicographical Sort ───► Locks A then B  ──┘ Deterministic Order
```

### 2. 🚀 Database Hyper-Optimization & Indexing Strategy
- **Elimination of Sequential Scans:** Standard e-commerce catalog queries filter by active status while sorting by creation timestamp or price. Without targeted indexes, PostgreSQL executes expensive Sequential Scans coupled with Disk-based External Sorts.
- **Targeted B-Tree Composite Indexes:**
  - `@@index([is_active, created_at(sort: Desc)])` — Accelerates public storefront catalog browsing directly from index memory.
  - `@@index([is_active, price])` — Enables instant range filtering (`minPrice` / `maxPrice`).
  - `@@index([status, created_at(sort: Desc)])` — Streamlines admin order management pipelines.

### 3. 🧱 Resilience Engineering & DoS Hardening
- **Clamped Upper-Bound Pagination:** All paginated endpoints (`/products`, `/orders`, `/users`) employ rigid dual-bound clamping:
  ```javascript
  const MAX_LIMIT = 100;
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
  ```
  This eliminates Out-Of-Memory (OOM) crashes by denying malicious requests attempting to query millions of records into the Node.js V8 heap.
- **Map-Based Cart Deduplication:** Guest-to-authenticated cart synchronization utilizes an in-memory `Map` with an absolute ceiling of 100 items, verifying stock and overwriting quantities deterministically to eliminate payload bloat.
- **Timing-Attack Resistance:** The authentication pipeline executes a constant-time `bcrypt.compare` against a precomputed dummy hash when user emails do not exist, neutralizing user enumeration via response latency analysis.

### 4. 🚨 Centralized Exception & Prisma Error Mapping
- Dedicated global error handling middleware translates internal ORM errors into clean, semantic HTTP status codes:
  - `P2002` (Unique Constraint Violation) $\rightarrow$ `409 Conflict`
  - `P2025` (Record Not Found / Stale Target) $\rightarrow$ `404 Not Found`
  - `P2023` (Invalid UUID Parameter Syntax) $\rightarrow$ `400 Bad Request`
- Production error responses strictly sanitize stack traces and raw database internals to safeguard against information disclosure.

---

## ✨ Key Features

- **🔐 Robust Authentication & Role-Based Access Control (RBAC)**
  - Dual-token system: Short-lived Access Tokens (15m) paired with 7-day SHA-256 hashed Refresh Tokens stored in PostgreSQL.
  - `HttpOnly`, `SameSite`, and `Secure` cookie transport.
  - Granular permission tiers (`CUSTOMER`, `ADMIN`, `SELLER`).
  - Real-time deactivation check (`verifyActiveUser`) preventing zombie access tokens.
- **📦 Dynamic Product & Category Catalog**
  - Full search capabilities with case-insensitive substring matching.
  - Parametric filtering by price boundaries, categories, stock availability, and sorting modes.
  - Soft-deletion lifecycle preserving historical order records.
- **🛒 Resilient Shopping Cart Engine**
  - Seamless multi-device synchronization between offline/guest local storage and database persistence.
  - Real-time price and availability snapshot verification.
- **💳 Order Management State Machine**
  - Formal transition guards (`PENDING` $\rightarrow$ `PAID` or `CANCELLED`).
  - Price-tamper protection via `expectedTotalAmount` verification against live inventory database values.
- **📈 Real-Time Business Analytics**
  - High-performance aggregation pipeline for revenue calculations and order volume analytics.

---

## 🛠️ Tech Stack

| Domain | Technology | Description |
| :--- | :--- | :--- |
| **Runtime** | [Node.js](https://nodejs.org/) (v20+) | High-performance asynchronous event-driven JavaScript runtime (ES Modules) |
| **Framework** | [Express.js](https://expressjs.com/) (v5.x) | Minimalist, fast web application framework |
| **Database** | [PostgreSQL](https://www.postgresql.org/) (v14+) | Robust ACID-compliant relational database |
| **ORM** | [Prisma](https://www.prisma.io/) (v5.22) | Next-generation type-safe database toolkit and query engine |
| **Authentication** | [JWT](https://jwt.io/) & [bcrypt](https://github.com/kelektiv/node.bcrypt.js) | Cryptographic token signing and salted password hashing |
| **Security** | [Helmet](https://helmetjs.github.io/) & [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit) | HTTP security headers and distributed endpoint rate limiting |
| **Client Frontend** | [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) | Modern, reactive storefront single-page application |

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: `v18.0.0` or higher (Recommended: `v20+ LTS`)
- **PostgreSQL**: `v14` or higher
- **npm** or **pnpm** / **yarn**

### 1. Clone the Repository

```bash
git clone https://github.com/hieuct26py/velora-ecommerce.git
cd velora-ecommerce
```

### 2. Configure Environment Variables

Navigate to the `server` directory and copy the environment template:

```bash
cd server
cp .env.example .env
```

Open `.env` and fill in your configuration:

```env
# Server Runtime
PORT=5000
NODE_ENV=development

# Database Connection (PostgreSQL)
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/velora?schema=public"

# Cryptographic Token Secrets
ACCESS_TOKEN_SECRET="your-256-bit-access-token-secret-key-here"
REFRESH_TOKEN_SECRET="your-256-bit-refresh-token-secret-key-here"

# Allowed Frontend Origins (CORS)
CLIENT_URL="http://localhost:5173"
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Database Setup & Migration

Synchronize the Prisma schema with your PostgreSQL instance:

```bash
# Push schema changes directly to the database
npx prisma db push

# (Optional) Seed the database with initial catalog data
npm run seed:apple
```

### 5. Launch Application

```bash
# Start the backend in Development mode (with live reload)
npm run dev

# Start the backend in Production mode
npm start
```

The server will initialize on `http://localhost:5000` (or your configured `PORT`).

---

## 📡 API Reference (Core Endpoints)

All endpoints are mounted under the `/api/v1` namespace.

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/register` | Public | Register a new customer account |
| `POST` | `/login` | Public | Authenticate user & issue Access Token + Refresh Cookie |
| `POST` | `/refresh-token` | Public (Cookie) | Exchange valid Refresh Cookie for a new Access Token |
| `PATCH` | `/change-password` | Authenticated | Update user password and revoke existing refresh tokens |
| `POST` | `/logout` | Public (Cookie) | Clear session cookie and revoke token from database |

### Product Catalog (`/api/v1/products`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Public / Optional | List products with pagination, search, price & category filters |
| `GET` | `/:productId` | Public / Optional | Get detailed information for a single product |
| `POST` | `/` | Admin | Create a new product |
| `PATCH` | `/:productId` | Admin | Update product details, pricing, and stock levels |
| `DELETE` | `/:productId` | Admin | Soft-delete product (`is_active: false`) |

### Shopping Cart (`/api/v1/cart`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Authenticated | Retrieve active user's cart with live pricing |
| `POST` | `/items` | Authenticated | Add item to cart with stock validation |
| `PATCH` | `/items/:itemId` | Authenticated | Update quantity of an item in the cart |
| `DELETE` | `/items/:itemId` | Authenticated | Remove specific item from cart |
| `POST` | `/sync` | Authenticated | Deduplicate and sync offline/guest cart into database |
| `DELETE` | `/` | Authenticated | Flush all items from the current cart |

### Order Processing (`/api/v1/orders`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | Authenticated | Checkout cart, lock inventory, and create order atomically |
| `GET` | `/me` | Authenticated | List order history for the authenticated user |
| `GET` | `/` | Admin | Query all system orders with multi-parameter filtering |
| `GET` | `/:orderId` | Owner / Admin | Retrieve full order receipt and itemized breakdown |
| `PATCH` | `/:orderId/status` | Admin | Transition order state (`PENDING` $\rightarrow$ `PAID` / `CANCELLED`) |
| `PATCH` | `/:orderId` | Owner / Admin | Cancel a `PENDING` order and restock inventory |

---

## 📂 Project Structure

```text
velora-ecommerce/
├── client/                     # Frontend Application (React 19 + Vite)
│   ├── src/
│   │   ├── components/         # Reusable UI Components
│   │   ├── contexts/           # Authentication & Cart State Contexts
│   │   └── pages/              # Shop, Cart, Checkout, Admin Views
│   └── package.json
│
├── server/                     # Backend API Service (Node.js + Express)
│   ├── controllers/            # Business Logic & Request Handlers
│   │   ├── analytics.controller.js
│   │   ├── auth.controller.js
│   │   ├── cart.controller.js
│   │   ├── category.controller.js
│   │   ├── order.controller.js
│   │   ├── product.controller.js
│   │   └── user.controller.js
│   ├── middlewares/            # Security, Auth, Validation & Error Handlers
│   │   ├── auth.middleware.js  # JWT verification, Role check, Active status
│   │   ├── checkOwner.js       # IDOR ownership authorization
│   │   ├── errorHandler.js     # Centralized Prisma/HTTP error normalization
│   │   ├── optionalAuth.js     # Non-blocking authentication context
│   │   └── validateUuid.js     # UUID regex parameter sanitization
│   ├── prisma/                 # Database Schema & Migrations
│   │   ├── schema.prisma       # Prisma Models, Enums & Composite Indexes
│   │   └── seed-apple-demo.mjs # Production seed scripts
│   ├── routes/                 # Express API Route Declarations
│   ├── utils/                  # Cryptography & DB Client Singletons
│   ├── index.js                # Server Entrypoint, Middleware Pipeline & CORS
│   └── package.json
│
├── API_DOCUMENTATION.md        # Comprehensive API Endpoint Specifications
└── README.md                   # Project Documentation
```

---

## 🤝 Contributing

Contributions make the open-source community an inspiring place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/hieuct26py">HieuCT</a> & the Velora Engineering Team.</sub>
</div>
