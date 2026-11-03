# Boi-Hat (বই হাট) — Master Development & Execution Tracker

> **Project Vision:** A hyper-localized, two-sided marketplace tailored for used, academic, rare, and vintage books in Bangladesh, featuring Banglish search, bKash/Nagad/SSLCommerz payments, COD logistics, 48-hour buyer protection escrow, and native courier integration (Pathao, Steadfast, RedX).

---

## 📊 Executive Progress Dashboard

| Phase | Milestone Name | Status | Git Commit | Key Deliverables |
| :--- | :--- | :---: | :---: | :--- |
| **Phase 1** | **MVP Core Marketplace** | ✅ **Completed** | [`1937400`](file:///c:/Users/ASUS/Desktop/Boi-Hat) | Catalog, Auth + OTP, Banglish Search, In-App Chat, Orders, Admin Moderation |
| **Phase 2** | **Engagement & Discovery** | ✅ **Completed** | [`d3d83fc`](file:///c:/Users/ASUS/Desktop/Boi-Hat) | Recommendation Engine, Wishlists, Saved Searches, Dynamic Carousels, User Onboarding |
| **Phase 3** | **Monetization & Escrow** | ✅ **Completed** | [`5410032`](file:///c:/Users/ASUS/Desktop/Boi-Hat) | SSLCommerz Gateway, Ad Boost Packages, Seller Wallet Escrow, 48h Protection, Reviews |
| **Phase 4** | **Native Courier Logistics** | ✅ **Completed** | [`314b985`](file:///c:/Users/ASUS/Desktop/Boi-Hat) | Pathao / Steadfast / RedX APIs, Live Tracking Stepper, Webhook Escrow Trigger, Simulator |
| **Phase 5** | **Merchant Tools & Mobile Apps** | ✅ **Completed** | *Pending Commit* | Bulk CSV Upload, Barcode/ISBN Scanner, Nilkhet Merchant Storefronts, PWA Mobile Shell |
| **Phase 6** | **Production Hardening** | ⚪ *Planned* | *Scheduled* | SMS Gateway (SSL Wireless), Redis Clustering, AI Condition Grader, Performance CDN |

---

## 🛠️ Detailed Phase Review & Deliverables

### ✅ Phase 1: MVP Core (Completed — Commit `1937400`)
- [x] **Monorepo Architecture:** Turborepo with NestJS (`apps/api`), Next.js 14 App Router (`apps/web`), and shared contracts (`packages/shared-types`).
- [x] **Database & Seeding:** In-memory + Prisma schema with 195 books (Humayun Ahmed, Muhammad Zafar Iqbal, BCS/IBA, rare vintage), 33 categories, 30 authors, and Dhaka division locations.
- [x] **Bangla-First Localization:** Full i18n support (Bangla default with instant English toggle) and BDT (৳) currency formatting.
- [x] **Banglish & Phonetic Search:** Multi-token search supporting phonetic variations (e.g., `himu`, `হিমু`, `gonit`, `গনিত`).
- [x] **In-App Real-Time Chat:** Buyer-seller messaging with automatic price negotiation offers and message history.
- [x] **Order Checkout & Admin Moderation:** COD order placement, pending book listing moderation, and suspension controls.

---

### ✅ Phase 2: Discovery, Recommendations & Onboarding (Completed — Commit `d3d83fc`)
- [x] **Recommendation Engine:** Category affinity, collaborative filtering, author matching, and cold-start popularity fallbacks.
- [x] **Personalized Feed:** "আপনার জন্য বাছাইকৃত বই" (Recommended for you) carousel on homepage.
- [x] **Wishlist & Price Drops:** One-click heart toggling, dedicated `/wishlist` management page, and price-drop notifications.
- [x] **User Onboarding Flow:** Interactive 3-step modal capturing user reading interests and preferred Dhaka locations.
- [x] **Saved Searches & Alerts:** Query subscription alerts when matching new books are listed.

---

### ✅ Phase 3: Monetization, Gateways & Seller Wallet (Completed — Commit `5410032`)
- [x] **SSLCommerz Payment Gateway:** Sandbox provider and interactive mock gateway supporting bKash, Nagad, Rocket, Upay, Visa, and Mastercard.
- [x] **Ad Monetization & Listing Boosts:** Featured (`৳49`), Urgent (`৳29`), and Highlight (`৳19`) packages with bKash checkout and badge rendering.
- [x] **Seller Wallet & Escrow Ledger:** Available balance vs. pending balance tracking, transaction history, and bKash/Nagad/Bank payout withdrawal requests.
- [x] **48-Hour Buyer Protection Window:** Automatic dispute submission modal holding funds in escrow until dispute resolution.
- [x] **Verified Reviews & Ratings:** 1–5 star rating system with verified buyer badges and dynamic seller average rating calculations.

---

### ✅ Phase 4: Native Courier Logistics & Webhooks (Completed — Commit `314b985`)
- [x] **Courier Provider Architecture:** Modular `ICourierProvider` interface with adapters for **Pathao**, **Steadfast**, and **RedX**.
- [x] **Automated Fee Calculation:** Tiered weight buckets (<300g, 300g–1kg, 1kg+) and destination rules (Inside Dhaka ৳60–৳90, Outside Dhaka ৳120–৳160).
- [x] **Seller Booking Modal (`CourierBookingModal.tsx`):** Seamless modal on the orders page allowing sellers to book Pathao/Steadfast couriers in one click.
- [x] **Live Tracking Stepper (`CourierTrackingModal.tsx`):** Visual 5-step progress bar (Booked → Picked Up → In Transit → Out for Delivery → Delivered) with timestamped hub history.
- [x] **Webhook Delivery Trigger:** Webhook receipt of `delivered` status auto-progresses order, initiates 48-hour dispute window, and credits seller wallet pending balance.
- [x] **Courier Webhook Lab & Simulator (`/courier-simulator`):** Testing page for simulating courier events, tracking inquiries, and escrow handoffs.
- [x] **Automated Verification:** 10/10 test suites passed (43 unit/integration tests) and 100% clean Next.js production build.

---

### ✅ Phase 5: Merchant Tools & Mobile Experience (Completed)
- [x] **Merchant CSV Bulk Upload Engine (`apps/api/src/modules/merchants/`):**
  - Flexible Bengali/English header mapper (`title_bn`, `author`, `isbn`, `condition`, `sale_price`, `stock_quantity`, `shelf_location`).
  - Strict validation catches invalid prices, missing titles, and maps conditions (LIKE_NEW, GOOD, ACCEPTABLE).
  - Sample CSV template generator (`GET /merchants/template`).
- [x] **Bulk Import UI (`apps/web/app/(seller)/bulk-upload/page.tsx`):**
  - Drag-and-drop CSV upload, downloadable template, pre-upload validation table, and instant batch import.
- [x] **Barcode & ISBN Camera Scanner (`apps/web/components/BarcodeScannerModal.tsx`):**
  - HTML5 video camera stream with targeting viewfinder, ISBN manual fallback, and instant metadata autofill.
  - Integrated directly into post-ad listing flow (`apps/web/app/(seller)/post-ad/page.tsx`).
- [x] **Nilkhet & Banglabazar Verified Merchant Storefronts (`apps/web/app/shop/[id]/page.tsx`):**
  - Verified physical bookshop badges, market location, trade license indicator, opening hours, and filtered inventory search.
- [x] **Progressive Web App (PWA) Mobile Shell:**
  - `manifest.json` configured with emerald theme `#059669` and standalone display mode.
  - Fixed mobile bottom navigation bar (`apps/web/components/MobileBottomNav.tsx`) with Home, Books, Sell (+), Orders, and Wallet.
- [x] **Automated Verification:**
  - 11/11 test suites passing (**47 unit/integration tests**).
  - 15/15 Next.js pages successfully compiled and generated.

---

## 📈 Quality Assurance, Test Suites & Verification

Current health metrics of the repository:

- **API Unit & Integration Tests:** 11 passed, 11 total (47 tests).
  - Auth Service & Phone Validation: `PASS`
  - Orders & Checkout Flow: `PASS`
  - SSLCommerz & bKash Gateway: `PASS`
  - Ad Boost Packages: `PASS`
  - Wallet Escrow & Payouts: `PASS`
  - Recommendations Engine: `PASS`
  - Reviews & Ratings: `PASS`
  - Courier Logistics & Webhook Simulation: `PASS`
  - Merchants Bulk CSV & Storefront Service: `PASS`
  - Full End-to-End Buyer/Seller Cycle: `PASS`
- **Next.js Production Build:** 15 static and dynamic routes compiled with zero TypeScript or linting errors.

---

## 📋 Rules of Engagement & Workflow Discipline

1. **Strict Phase Sequencing:** Phases must proceed strictly in order (Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5).
2. **Phase Boundary Reports:** At the conclusion of each phase, stop and report:
   - What was built.
   - What was deferred/skipped.
   - What decision is required before continuing.
3. **Localization Integrity:** Default UI language remains Bangla (`bn`) with seamless English toggle (`en`), BDT (`৳`) pricing, and Dhaka-centric logistics.
4. **Git Versioning:** Every completed phase receives a clean atomic Git commit with detailed message headers.

