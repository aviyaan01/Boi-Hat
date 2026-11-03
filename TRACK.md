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
| **Phase 5** | **Merchant Tools & Mobile Apps** | 🟡 **Up Next** | *Pending* | Bulk CSV Upload, Barcode/ISBN Scanner, Nilkhet Merchant Storefronts, PWA Mobile Shell |
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

## 🎯 Phase 5: Action Plan & Implementation Blueprint

Phase 5 transitions Boi-Hat into high-volume physical merchant adoption (Nilkhet, Banglabazar, Katabon bookshops) and mobile-optimized field workflows.

### 5.1 Merchant Inventory CSV Bulk Upload
- **Goal:** Enable physical bookstores with 500+ books to import their entire stock via CSV in seconds rather than listing books individually.
- **Components to Build:**
  - [ ] **CSV Parser & Validator (`apps/api/src/modules/merchants/`):**
    - Supported headers: `isbn`, `title_bn`, `title_en`, `author`, `category`, `condition`, `original_price`, `sale_price`, `stock_quantity`, `description`, `shelf_location`.
    - Automated Bengali/English header detection and value validation.
    - Error reporting highlighting exact invalid rows without dropping valid entries.
  - [ ] **Bulk Import UI (`apps/web/app/(seller)/bulk-upload/page.tsx`):**
    - Drag-and-drop CSV zone with downloadable sample template (`boi_hat_inventory_template.csv`).
    - Pre-upload table preview showing parsed book rows, validation warnings, and batch summary.
    - Progress bar indicating batch insertion and automatic catalog publishing.

### 5.2 Barcode & ISBN Camera Scanner
- **Goal:** Allow sellers and merchants at bookstalls to scan a book's physical barcode or ISBN using their mobile or webcam to auto-populate book details.
- **Components to Build:**
  - [ ] **Barcode Scanner Component (`apps/web/components/BarcodeScannerModal.tsx`):**
    - HTML5 camera stream integration using `@zxing/library` or native BarcodeDetector API.
    - Real-time EAN-13 / ISBN-10 / ISBN-13 barcode detection.
    - Auto-lookup fallback to query local database or OpenLibrary/Google Books API to autofill title, author, and published year.
  - [ ] **Post-Ad Integration (`apps/web/app/(seller)/post-ad/page.tsx`):**
    - "ক্যামেরা দিয়ে বারকোড স্ক্যান করুন (Scan Barcode)" button next to ISBN input.

### 5.3 Nilkhet & Banglabazar Merchant Storefronts
- **Goal:** Dedicated merchant profile pages highlighting verified physical bookstore locations in Dhaka.
- **Components to Build:**
  - [ ] **Merchant Profile & Badging:**
    - Verified physical shop badge ("নীলক্ষেত ভেরিফাইড বুকশপ" / "বাংলাবাজার বুকস্টল").
    - Shop location details: Market name, shop/stall number, and pickup hours.
  - [ ] **Storefront Inventory Search:**
    - Filter listings specifically within that merchant's inventory.

### 5.4 Progressive Web App (PWA) Mobile Shell
- **Goal:** App-like mobile experience for buyers and sellers without requiring App Store downloads.
- **Components to Build:**
  - [ ] **PWA Manifest & Service Worker (`manifest.json`):**
    - Standalone display mode, theme colors (`#059669` emerald), high-res book icons.
    - Offline fallback shell with local caching for book searches and order viewing.
  - [ ] **Mobile Bottom Navigation Bar:**
    - Fixed bottom navigation for mobile viewports (Home, Search, Sell, Orders, Wallet).

---

## 📈 Quality Assurance, Test Suites & Verification

Current health metrics of the repository:

- **API Unit & Integration Tests:** 10 passed, 10 total (43 tests).
  - Auth Service & Phone Validation: `PASS`
  - Orders & Checkout Flow: `PASS`
  - SSLCommerz & bKash Gateway: `PASS`
  - Ad Boost Packages: `PASS`
  - Wallet Escrow & Payouts: `PASS`
  - Recommendations Engine: `PASS`
  - Reviews & Ratings: `PASS`
  - Courier Logistics & Webhook Simulation: `PASS`
  - Full End-to-End Buyer/Seller Cycle: `PASS`
- **Next.js Production Build:** 14 static and dynamic routes compiled with zero TypeScript or linting errors.

---

## 📋 Rules of Engagement & Workflow Discipline

1. **Strict Phase Sequencing:** Phases must proceed strictly in order (Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5).
2. **Phase Boundary Reports:** At the conclusion of each phase, stop and report:
   - What was built.
   - What was deferred/skipped.
   - What decision is required before continuing.
3. **Localization Integrity:** Default UI language remains Bangla (`bn`) with seamless English toggle (`en`), BDT (`৳`) pricing, and Dhaka-centric logistics.
4. **Git Versioning:** Every completed phase receives a clean atomic Git commit with detailed message headers.
