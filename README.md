# Boi-Hat (বই হাট) — Used Book Marketplace (Bangladesh)

> **Bangladesh's First Two-Sided Marketplace for Used and Rare Books**  
> Built strictly according to the **Master Development Prompt (Bangladesh)** specification.

---

## 📖 Project Overview

**Boi-Hat** (বই হাট) is a localized, full-stack marketplace connecting book lovers, students, and bookshops across **Dhaka, Bangladesh** (Nilkhet, Bangla Bazar, Aziz Super Market, Dhanmondi, Mirpur, Uttara).

### ✨ Phase 1 Key Features (Delivered & Verified)
* **Phone Number + OTP Authentication:**
  * Passwordless authentication designed for Bangladesh mobile behavior.
  * Normalizes numbers (`01XXXXXXXXX` and `+8801XXXXXXXXX`) to E.164.
  * Rate-limited to 3 requests/phone/hour; 5-minute bcrypt hashed expiry.
  * **Dev Mode OTP:** Returns `dev_otp` in response and auto-populates in UI for instant testing without real SMS gateways.
  * Short-lived 15-minute JWT access token + 30-day `httpOnly` secure refresh token.
* **Smart 3-Level Categorization & Deep Search:**
  * Hierarchical tree: *Academic* (School, College, University, BCS/Admission), *Literature* (Fiction, Non-Fiction, Poetry), *Religion*, *Children & Comics*, and *Rare & Vintage*.
  * Deep filtering by author (autocomplete supporting Bangla, English, and Banglish like `"humayun"` &rarr; `হুমায়ূন আহমেদ`), publisher, language, condition, price range (BDT), and Dhaka location.
  * Condition guide with in-app copy and reference standards (New, Like New, Good, Acceptable).
* **Book Listing & Quality Enforcement:**
  * Strict enforcement of **minimum 3 photos** (front cover, back cover, spine/inside pages) at the API validation layer (**5 photos** for Rare & Vintage listings).
  * Courier weight bucket classification (`<300g`, `300g-1kg`, `1kg+`).
* **Rare & Vintage Curated Archive:**
  * Dedicated section for out-of-print classics, first editions, signed copies, and historic periodicals (e.g. *Bichitra 1978*, *Desh 1985*, *Nondito Noroke 1972 1st Print*).
  * Interactive "Make an Offer" flow.
* **In-App Messaging:**
  * Real-time buyer & seller conversation threads linked to specific book listings.
* **Cash on Delivery (COD) & 48-Hour Buyer Protection:**
  * Standard Dhaka delivery fee calculation (৳60).
  * Order status lifecycle: `pending` &rarr; `confirmed` &rarr; `shipped` &rarr; `delivered`.
  * Manual courier booking flow (Pathao / Steadfast / RedX tracking ID entry).
  * **48-Hour Buyer Protection Window:** Automatically initiated upon delivery confirmation, allowing the buyer to open a dispute if the book's condition does not match the listing.
* **Admin Control Panel (`/admin`):**
  * Live platform metrics (signups, listings count, order volumes, GMV in BDT).
  * Category manager with real-time CRUD without requiring redeployment.
* **Bilingual UI (Bangla Default / English Toggle):**
  * Full localization layer (`locales/bn.json` and `locales/en.json`) with an instant header switcher.
* **PWA Enabled:**
  * Web app manifest and mobile-first responsive layout installable to Android home screens.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Monorepo** | NPM Workspaces + TypeScript | Shared typed DTOs and contracts between client and server |
| **Backend API** | NestJS 10 + TypeScript | Modular, testable domain resources (`/apps/api`) |
| **Web Client** | Next.js 14 (App Router) + React + TailwindCSS | Fast, server/client rendered PWA (`/apps/web`) |
| **Database & ORM** | PostgreSQL 16 + Prisma ORM | Relational integrity, typed queries, migrations |
| **Resilient Store** | Hybrid Prisma + In-Memory local store | Runs with PostgreSQL in Docker **or** zero-dependency locally |
| **Containerization** | Docker & Docker Compose | Single-command end-to-end full stack deployment |
| **Testing** | Jest + Supertest + Playwright | Unit, integration, and end-to-end user flow testing |

---

## 🚀 Quick Start (Local Development)

### Prerequisites
* Node.js v18+ or v20+ (v24 supported)
* npm v9+

### 1. Clone & Install
```bash
git clone <repo-url> boi-hat
cd boi-hat
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(On Windows PowerShell: `Copy-Item .env.example .env`)*

### 3. Build Shared Packages
```bash
npm run build:types
```

### 4. Run the Full Stack
Open two terminal windows (or run in background):

**Terminal 1 — NestJS API:**
```bash
npm run dev:api
# Running at http://localhost:4000
```

**Terminal 2 — Next.js Web App:**
```bash
npm run dev:web
# Running at http://localhost:3000
```

Open your browser at **[http://localhost:3000](http://localhost:3000)**.

---

## 🐳 Running with Docker Compose

To run PostgreSQL 16, Redis, Meilisearch, the API, and Web client simultaneously:
```bash
docker-compose up --build
```
* **Web Client:** http://localhost:3000
* **API Server:** http://localhost:4000
* **PostgreSQL:** port 5432
* **Redis:** port 6379
* **Meilisearch:** http://localhost:7700

---

## 🧪 Testing

### Run All Unit & Integration Tests:
```bash
npm test
```

### Run End-to-End User Flow Tests:
Runs the full sequence: Phone OTP &rarr; Verify &rarr; List Book (min 3 photos) &rarr; Search &rarr; Message Seller &rarr; Place COD Order &rarr; Confirm & Ship &rarr; Delivered (48h protection):
```bash
npm --workspace=@boi-hat/api run test -- src/test/e2e-flow.spec.ts
```

### Run Playwright E2E Tests:
```bash
npm run test:e2e
```

---

## 🔑 Demo Accounts & Pre-Seeded Data

The database initializes with **195 realistic books**, **33 categories**, **30 authors**, **10 publishers**, and **3 verified shops** across Dhaka.

| Role | Name | Phone Number | Dev OTP | Access Level |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Boi-Hat Admin (এডমিন) | `+8801700000000` | `123456` | Full admin privileges (`/admin`) |
| **Seller 1** | Tanvir Ahmed (তানভীর) | `+8801711111111` | `123456` | Nilkhet seller profile & listings |
| **Seller 2** | Farhana Rahman (ফারহানা) | `+8801722222222` | `123456` | Dhanmondi seller profile & listings |
| **Buyer** | Sabbir Hossain (সাব্বির) | `+8801733333333` | `123456` | Uttara buyer profile & sample order |

*Note: In Dev Mode (`OTP_DEV_MODE=true`), you can also log in with any valid 11-digit Bangladeshi mobile number (`01XXXXXXXXX`); the 6-digit OTP code will be shown directly on screen with a 1-click auto-fill button.*

---

## 📁 Repository Structure

```
/
├── docker-compose.yml           # Full containerized stack
├── .env.example                 # Documented environment variables
├── README.md                    # Setup, architecture & credentials guide
├── package.json                 # Monorepo workspaces definition
├── /apps
│   ├── /api                     # NestJS 10 backend API
│   │   ├── /src
│   │   │   ├── /modules         # auth, users, categories, books, messages, orders, admin
│   │   │   ├── /common          # database service, guards, interceptors, filters, phone utils
│   │   │   └── /test            # unit & e2e flow tests
│   │   └── /prisma
│   │       ├── schema.prisma    # Complete database schema
│   │       └── /seed            # Seeding 195 books, 33 categories, 30 authors, 3 shops
│   └── /web                     # Next.js 14 App Router web client
│       ├── /app                 # /(buyer), /(seller), /(admin), /(auth)
│       ├── /components          # Navbar, Footer, BookCard, AuthModal
│       ├── /lib                 # api, i18n, auth context
│       └── /locales             # bn.json, en.json translation dictionaries
└── /packages
    └── /shared-types            # Shared TypeScript types, enums & DTOs
```

---

## 📜 Phase Progression & Master Prompt Compliance

All 5 core development phases from the **Master Development Prompt (Bangladesh)** have been completely built, tested, and verified:

* **✅ Phase 1 (MVP Core — Commit `1937400`):** Phone OTP Auth, Seeded Catalog (195 books across 33 categories, 30 authors), Banglish & Phonetic Search, Book Details & Seller Profile, In-App Real-Time Messaging, Cash on Delivery (COD) Order Flow, 48-Hour Buyer Protection, Admin Control Panel (`/admin`), Bilingual UI (Bangla default / English toggle), and Docker Compose full-stack configuration.
* **✅ Phase 2 (Engagement & Discovery — Commit `d3d83fc`):** Rule-based recommendation engine (scoring category affinity, author matches, recency, popularity), Homepage Personalized Feed ("আপনার জন্য বাছাইকৃত বই"), Wishlist & Price-Drop Tracking (`/wishlist`), Saved Searches & In-App Alerts, and 3-step User Onboarding Flow.
* **✅ Phase 3 (Monetization & Escrow — Commit `5410032`):** SSLCommerz payment gateway provider (bKash, Nagad, Upay, Visa, Mastercard) with interactive `/payments/mock-gateway`, Listing Boost Packages (Featured ৳49, Urgent ৳29, Highlight ৳19), Seller Wallet (`/wallet`) with pending escrow vs available balance and payout requests, and Verified Buyer 1–5 star reviews & ratings.
* **✅ Phase 4 (Native Courier Logistics — Commit `314b985`):** Modular courier integration for **Pathao**, **Steadfast**, and **RedX**, tiered weight-bucket delivery fee calculation, Seller Courier Booking Modal (`CourierBookingModal.tsx`), Live 5-Step Tracking Stepper (`CourierTrackingModal.tsx`), automated inbound webhooks progressing orders and triggering 48-hour buyer protection escrow, and dedicated testing lab (`/courier-simulator`).
* **✅ Phase 5 (Merchant Bulk Tools & Mobile Apps — Commit `b98145c`):** High-volume Merchant CSV Bulk Upload Engine (`/bulk-upload`) with bilingual header parsing and validation, HTML5 Barcode & ISBN Camera Scanner (`BarcodeScannerModal.tsx`) integrated into `/post-ad`, Nilkhet & Banglabazar Verified Merchant Storefronts (`/shop/[id]`), and PWA Mobile Shell with mobile bottom navigation (`MobileBottomNav.tsx`).

See [**`TRACK.md`**](TRACK.md) for the complete roadmap, test suites, and commit history.

