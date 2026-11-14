# Parnika Jewellers — Online Store

[![Next.js](https://img.shields.io/badge/Next.js-14.2.20-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![AWS DynamoDB](https://img.shields.io/badge/AWS-DynamoDB-4053D6?style=flat&logo=amazon-aws)](https://aws.amazon.com/dynamodb/)
[![AWS S3](https://img.shields.io/badge/AWS-S3_&_CloudFront-569A31?style=flat&logo=amazon-s3)](https://aws.amazon.com/s3/)
[![Payment Gateway](https://img.shields.io/badge/Payments-YOUPI_PG_%2F_Razorpay-FF6C37?style=flat)](https://upi.org/)
[![Compliance](https://img.shields.io/badge/Compliance-DPDP_Act_2023_%26_GST_HSN_7117-0B3B24?style=flat)](https://www.meity.gov.in/)

> High-performance luxury e-commerce web application engineered specifically for **Parnika Jewellers** — traditional temple artistry, premium fashion jewellery, and authentic 1-gram micro gold collections.

---

## 🏛️ Architectural Tenets Enforced Throughout

1. **Repository Abstraction:** All data access routes through strict interfaces in `lib/data/interfaces/`. DynamoDB, local mock fallbacks, and schema evolution are 100% decoupled from UI components and API handlers.
2. **Zero-Oversell Guarantee:** Every inventory decrement executes via DynamoDB conditional atomic update expressions (`stock >= :qty` in `TransactWriteItems`), preventing overselling during concurrent checkouts or flash sales.
3. **Pluggable Payment Subsystem:** Payment flows adhere to a unified `IPaymentProvider` contract. Self-hosted **YOUPI PG (V2)** provides dynamic UPI QR codes with locked transaction notes, while an official **Razorpay** adapter provides zero-downtime fallback.
4. **Direct S3 Media Pipeline:** Store managers upload jewellery imagery directly from the browser to Amazon S3 via short-lived pre-signed PUT URLs, completely bypassing the Node.js server.
5. **Mobile-First Luxury Performance:** Optimized for 4G/3G mobile networks across India with responsive WebP/AVIF images, strict font optimization, aggressive caching, and Lighthouse Mobile score $\ge 85$.
6. **Regulatory Compliance:** Automated Indian GST tax invoice generation (HSN 7117, CGST 1.5% + SGST 1.5% or IGST 3%) and full statutory compliance with the **Digital Personal Data Protection (DPDP) Act, 2023**.

---

## 🎨 Visual Identity & Brand Design System

Built on brand tokens extracted directly from the heritage crest and royal temple aesthetics:

- **Primary Emerald (`#0B3B24`):** Header, core surfaces, primary buttons, trust highlights.
- **Deep Emerald (`#062617`):** Footers, high-contrast dark sections.
- **Royal Temple Gold (`#D4AF37`):** CTAs, borders, crest highlights, active states.
- **Champagne Gold (`#F3E5AB`):** Hover states, badges, subtle icons.
- **Ruby Red (`#9B111E`):** Low-stock badges, sale alerts, urgency indicators.
- **Neutral Ivory (`#FCFBF7`):** Product backdrops and soft card surfaces.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js:** v18.17+ or v20+
- **Package Manager:** npm v9+
- **AWS Credentials (Optional):** If AWS credentials are not configured, the app runs automatically with built-in in-memory fallback stores.

### 2. Clone & Install
```bash
git clone https://github.com/sandeep83103/pjstoreV0.git
cd pjstoreV0
npm install
```

### 3. Environment Setup
```bash
cp .env.example .env.local
```

Configure your `.env.local`:
```ini
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
DYNAMO_TABLE_PREFIX=parnika_
S3_BUCKET_NAME=parnika-jewellers-v0-prod
CLOUDFRONT_DISTRIBUTION_DOMAIN=assets.pjstore.com
JWT_SECRET=your_secure_random_64_character_token_here
ADMIN_BOOTSTRAP_EMAIL=admin@pjstore.com
ADMIN_BOOTSTRAP_PASSWORD=AdminParnika@2026
PAYMENT_PROVIDER=youpi
YOUPI_BASE_API_URL=https://pg.pjstore.com/api/v2
YOUPI_WEBHOOK_SECRET=youpi_dev_webhook_secret_key_32_bytes
YOUPI_MERCHANT_UPI_HANDLE=parnikajewellers@icici
```

### 4. Initialize Database & Seed Catalog
```bash
# Provision all 8 DynamoDB tables with GSIs in ap-south-1
npm run setup:dynamo

# Seed initial categories (Necklaces, Bangles, Earrings, Bridal) and sample items
npm run seed
```

### 5. Launch Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🛍️ Feature Matrix

### Customer Storefront
- **Dynamic Catalog Browsing (`/catalog`):** Multi-faceted filtering by Category, Price range, Material Finish (Antique, Matte Gold, Glossy, Ruby Inlay), and Stock availability.
- **Product Detail Page (`/product/[slug]`):** Desktop hover zoom, specifications table (Base Metal, Plating, Weight, Polish Warranty), and strike-through MRP pricing.
- **1-Click WhatsApp Enquiry:** Automatically pre-fills WhatsApp message with URL-encoded product name, SKU, price, and current link (`wa.me`).
- **Persistent Cart & Stock Clamping (`/cart`):** LocalStorage guest persistence merged to DynamoDB upon login, with real-time stock clamping alerts.
- **Coupon & Promotion Engine:** Percentage and flat discounts with minimum cart values, usage caps, and expiration validations.
- **Multi-Step Checkout (`/checkout`):** Address validation, delivery method selection, and instant Dynamic UPI QR generation with locked amount.
- **Order Tracking & Account Portal (`/account/orders`):** Visual status progression, direct courier partner tracking, and 1-click re-ordering.
- **GST Tax Invoices:** Streams GST-compliant PDF invoices with HSN 7117, store GSTIN, and tax breakdown.
- **DPDP Privacy Portal (`/privacy`):** Customer statutory Right to Erasure portal, PII redaction, and Grievance Officer details.

### Admin Management Portal (`/admin`)
- **Admin Authentication:** Role-based access control (RBAC), bcrypt hashing, and secure 8-hour session JWTs.
- **Inventory Dashboard (`/admin/inventory`):** Live stock levels, supplier code search (`DBI-102`), and ruby red low-stock alert badges.
- **Product Editor (`/admin/inventory/new`):** Direct-to-S3 multi-image drag-and-drop uploader, gallery re-ordering, and jewellery specs.
- **Bulk CSV Import (`/admin/inventory/bulk`):** Downloadable CSV template, 25-item batch write, and row-level error validation modal.
- **Order Pipeline (`/admin/orders`):** Order status transitions (`PLACED -> PAID -> PACKED -> SHIPPED -> DELIVERED`) and printable warehouse packing slips with SKU barcodes.
- **Payment Reconciliation (`/admin/payments`):** Live observer monitors (Bank SMS, Gmail, Gateway) and unmatched payment reconciliation.
- **Coupon Manager (`/admin/coupons`):** Create and track promotional campaign discount codes.

---

## 🧪 Comprehensive Verification & Test Suites

The project features automated evaluation suites for every implementation phase:

```bash
# Typecheck & Static Analysis
npm run typecheck

# Automated Milestone Evaluations
npm run test:eval-p0   # Foundation & Infrastructure (DynamoDB, S3 isolation, DAL)
npm run test:eval-p1   # Brand tokens, responsive shell, customer JWT, admin auth
npm run test:eval-p2   # S3 pre-signed upload API, multi-faceted filtering, WhatsApp CTA
npm run test:eval-p3   # Inventory table, bulk CSV parser, audit logging
npm run test:eval-p4   # Cart sync, coupon engine, atomic stock decrement
npm run test:eval-p5   # IPaymentProvider, dynamic UPI QR, COD limit, HMAC webhooks
npm run test:eval-p6   # Order lifecycle, GST PDF invoices, tracking, email/WhatsApp
npm run test:eval-p7   # Concurrency stress test, DPDP erasure, S3 backups, E2E smoke

# Concurrency & Load Stress Testing
npm run test:load-stock

# Full End-to-End Customer Buying Cycle Smoke Test
npm run test:smoke-e2e

# Nightly Disaster Recovery S3 Backup Pipeline
npm run backup:tables
```

---

## 📁 Repository Structure

```
PJStore V0/
├── app/
│   ├── (storefront)/            # Storefront SSR/SSG/ISR routes
│   │   ├── catalog/             # Category & multi-faceted filtering
│   │   ├── product/[slug]/      # PDP with gallery hover zoom & WhatsApp CTA
│   │   ├── cart/                # Persistent cart & stock clamping
│   │   ├── checkout/            # Multi-step checkout & dynamic UPI QR
│   │   ├── account/             # Orders history, tracking, wishlist
│   │   ├── privacy/             # India DPDP Act compliance portal
│   │   └── page.tsx             # Storefront homepage & hero sections
│   ├── admin/                   # Authenticated administrative portal
│   │   ├── inventory/           # Stock management, editor, bulk CSV
│   │   ├── orders/              # Order lifecycle & packing slips
│   │   ├── payments/            # Gateway observers & reconciliation
│   │   ├── coupons/             # Discount campaign manager
│   │   └── login/               # Staff bootstrap login
│   └── api/                     # REST API Route Handlers
│       ├── checkout/            # Atomic order placement
│       ├── coupons/             # Coupon validation
│       ├── payments/webhook/    # HMAC-SHA256 idempotent webhook
│       ├── orders/              # Tracking & GST invoice PDF streaming
│       ├── account/privacy/     # DPDP data erasure & export
│       └── admin/               # Authenticated admin APIs & S3 signing
├── components/
│   ├── storefront/              # Storefront UI components (Header, Footer, PDP)
│   └── admin/                   # Admin UI components (Uploader, Forms, Tables)
├── lib/
│   ├── auth/                    # Stateless JWT issuance & bcrypt auth
│   ├── aws/                     # DynamoDB singleton client & S3/OAC client
│   ├── data/                    # Data Access Layer & repository abstractions
│   │   ├── dynamodb/            # DynamoDB repository implementations
│   │   └── interfaces/          # Strongly-typed repository contracts
│   ├── invoices/                # GST-compliant PDF invoice & packing slip engine
│   ├── notifications/           # Transactional Email & WhatsApp dispatchers
│   ├── payments/                # YOUPI PG, Razorpay & COD payment adapters
│   ├── security/                # DPDP compliance & PII redaction engine
│   └── types/                   # Zod schemas & TypeScript definitions
├── Docs/                        # Complete Engineering Documentation Suite
│   ├── architecture.md          # Full architectural blueprint
│   ├── implementationplan.md    # 7-Phase implementation roadmap & checklist
│   ├── evals.md                 # Pre-phase evaluation criteria & pass/fail gates
│   ├── edgecases.md             # Edge cases living log & verification matrix
│   ├── production-cutover.md    # Domain mapping, Route 53, ACM, CloudFront
│   └── usageguide.md            # Step-by-step user & administrator guide
├── scripts/                     # Seed scripts, backups & test harnesses
├── styles/                      # Brand tokens (Emerald, Gold, Ruby, Ivory)
├── usageguide.md                # Root usage guide shortcut
└── package.json
```

---

## 📖 Documentation Suite

- **[usageguide.md](usageguide.md):** Step-by-step user guide with concrete examples and workflows.
- **[Docs/architecture.md](Docs/architecture.md):** System architecture, route hierarchy, and AWS security boundaries.
- **[Docs/implementationplan.md](Docs/implementationplan.md):** Detailed 7-phase deliverables roadmap.
- **[Docs/evals.md](Docs/evals.md):** Evaluation scenarios, test cases, and pass/fail thresholds.
- **[Docs/edgecases.md](Docs/edgecases.md):** Concurrency, payment observer latency, and boundary failure modes.
- **[Docs/production-cutover.md](Docs/production-cutover.md):** Route 53, ACM SSL certificates, CloudFront OAC, and live cutover steps.

---

## ⚖️ License & Statutory Credits

Developed for **Parnika Jewellers**, Hyderabad, Telangana, India.  
Compliant with Indian CGST Act 2017 (HSN 7117) and Digital Personal Data Protection (DPDP) Act 2023.
