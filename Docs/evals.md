# Phase-Wise Evaluation & Verification Harness — Parnika Jewellers

> Reference Specifications:
> - [problemstatement.md](file:///d:/PJStore%20V0/Docs/problemstatement.md)
> - [architecture.md](file:///d:/PJStore%20V0/Docs/architecture.md)
> - [implementationplan.md](file:///d:/PJStore%20V0/Docs/implementationplan.md)
> - [conventions.md](file:///d:/PJStore%20V0/Docs/conventions.md)
> - [edgecases.md](file:///d:/PJStore%20V0/Docs/edgecases.md)
>
> **Document Purpose:** Concrete evaluation criteria, test scenarios, expected behavior, and pass/fail thresholds defined **prior to phase implementation**. A phase cannot be marked complete until all its evaluation scenarios pass.

---

## Evaluation Framework & Execution Rules

1. **Pre-Phase Definition:** Every test scenario below is immutable during phase development. If requirements shift, this document must be explicitly updated and reviewed first.
2. **Binary Pass/Fail:** Every test has an unambiguous pass/fail metric. Partial passes are treated as failures.
3. **Automated-First:** Where possible, evaluations must be executed via npm scripts (`npm run test:eval-pX`) or reproducible CLI commands.
4. **Edge Case Binding:** Scenarios directly cross-reference corresponding IDs in [edgecases.md](file:///d:/PJStore%20V0/Docs/edgecases.md).

---

## Phase 0: Foundation & Infrastructure Provisioning

### Objective
Verify that repository tooling, TypeScript configuration, AWS DynamoDB tables, AWS S3/CloudFront infrastructure in `ap-south-1`, and data access layer repository contracts are operational.

### Test Scenarios

| Test ID | Target / Component | Test Scenario | Execution Step | Expected Behavior | Pass/Fail Criteria |
|---|---|---|---|---|---|
| **EVAL-P0-01** | Tooling & Types | TypeScript Compilation & Strict Mode | Run `npx tsc --noEmit` | Clean compilation with zero errors under strict mode (`noImplicitAny`, `strictNullChecks`). | **Pass:** Exit code 0, 0 errors.<br>**Fail:** Any type error. |
| **EVAL-P0-02** | Environment Config | Zod Environment Schema Validation | Run `node -r esbuild-register -e "import('./lib/env.ts')"` with missing and valid `.env` | Throws descriptive error when required variables (`AWS_REGION`, `DYNAMO_TABLE_PREFIX`) are missing; loads cleanly when present. | **Pass:** Valid schema parses; invalid schema halts with ZodError.<br>**Fail:** Silent failure or unvalidated config. |
| **EVAL-P0-03** | DynamoDB Setup | Table & GSI Creation Script | Run `npm run setup:dynamo` | Creates 8 tables with `parnika_` prefix in `ap-south-1` (`products`, `categories`, `orders`, `users`, `coupons`, `payments`, `settings`, `audit_logs`) and expected GSIs. | **Pass:** AWS CLI / SDK confirms all 8 tables in `ACTIVE` state with specified key schemas.<br>**Fail:** Missing tables or inactive state. |
| **EVAL-P0-04** | Data Access Layer | Base Repository Interface Contract | Execute repository unit tests (`npm test tests/data/repositories.test.ts`) | `ProductRepository.findById()` and `CategoryRepository.list()` return strongly-typed objects matching Zod schemas. | **Pass:** 100% test suite pass.<br>**Fail:** Any uncaught rejection or schema mismatch. |
| **EVAL-P0-05** | Database Seeding | Catalog & Category Seeding | Run `npm run seed` | Seeds core jewellery categories (Fashion Jewellery, One Gram Gold, Necklaces, etc.) and sample products. | **Pass:** Querying `parnika_categories` returns $\ge 7$ records; `parnika_products` has valid sample items.<br>**Fail:** Incomplete seed or runtime failure. |
| **EVAL-P0-06** | S3 & CloudFront | Storage Bucket & OAC Access | Upload test file via AWS CLI and access via CloudFront distribution URL | Direct public S3 URL returns HTTP 403 Forbidden; CloudFront distribution URL returns HTTP 200 with content. | **Pass:** Public S3 blocked, CloudFront delivers asset.<br>**Fail:** Direct S3 publicly accessible or CloudFront 403/502. |
| **EVAL-P0-07** | AWS Isolation | Multi-Project IAM Scoping & Isolation | Test project IAM credentials against non-project resources (e.g. attempting to read or list foreign S3 buckets or DynamoDB tables) | Scoped IAM policy strictly denies access to any resource outside `parnika-jewellers-v0-*` and `parnika_*`, returning `AccessDenied`. | **Pass:** Zero permissions to read/write existing projects in the AWS account.<br>**Fail:** Project credentials can access foreign account resources. |

---

## Phase 1: Brand System, Shell & Authentication

### Objective
Verify that the Emerald, Gold, Ruby design system is correctly applied, storefront and admin shells render responsively, and customer/admin authentication with RBAC functions securely.

### Test Scenarios

| Test ID | Target / Component | Test Scenario | Execution Step | Expected Behavior | Pass/Fail Criteria |
|---|---|---|---|---|---|
| **EVAL-P1-01** | Design Tokens | Contrast & Token Application | Run axe-core / Lighthouse Accessibility on `/` and `/catalog` | Backgrounds use `--color-primary-base` (`#0B3B24`), accents use `--color-accent-gold` (`#D4AF37`), badges use `--color-ruby-alert` (`#9B111E`). Contrast ratio meets WCAG AA. | **Pass:** Accessibility score $\ge 95$; zero contrast violations.<br>**Fail:** Any color contrast failure. |
| **EVAL-P1-02** | Responsive Shell | Mobile Navigation Drawer | Emulate iPhone SE (375px width) and Pixel 7 (412px width) via Playwright | Hamburger icon expands navigation drawer smoothly; logo scales properly; header remains fixed without horizontal scroll overflow. | **Pass:** Zero horizontal scroll (`scrollWidth === innerWidth`); drawer opens/closes via touch.<br>**Fail:** Layout breakage or overflow. |
| **EVAL-P1-03** | Customer Auth | OTP & Session Cookie Issuance | Submit phone login via `/api/auth/otp` -> `/api/auth/login` | System verifies OTP and returns a signed `httpOnly`, `Secure`, `SameSite=Lax` session cookie (`customer_session`). | **Pass:** Cookie set with `httpOnly`, `Secure`; `GET /api/auth/me` returns customer profile.<br>**Fail:** Cookie accessible in `document.cookie` or missing flags. |
| **EVAL-P1-04** | Admin Bootstrap | Admin Login & Credential Verification | Post valid and invalid credentials to `/api/admin/auth/login` | Bootstrap credentials match `bcrypt` hash; issues `admin_session` cookie; invalid credentials return HTTP 401 with rate-limit tracking. | **Pass:** Valid login redirects to `/admin`; invalid login returns HTTP 401.<br>**Fail:** Bypassed auth or unhashed comparison. |
| **EVAL-P1-05** | RBAC Guard | Route Protection Middleware | 1. Access `/admin` without cookie.<br>2. Access `/admin` with `customer_session` cookie. | Unauthenticated user redirected to `/admin/login`. Customer token receives HTTP 403 Forbidden. | **Pass:** 100% route boundary enforcement.<br>**Fail:** Customer or guest views `/admin` dashboard. |

---

## Phase 2: Product Catalog & Media Pipeline

### Objective
Verify that the media upload pipeline operates via pre-signed URLs, the product catalog supports rich filtering and search, and product detail pages display zoom, pricing, and WhatsApp integration.

### Test Scenarios

| Test ID | Target / Component | Test Scenario | Execution Step | Expected Behavior | Pass/Fail Criteria |
|---|---|---|---|---|---|
| **EVAL-P2-01** | Media Pipeline | Pre-Signed S3 Upload Issuance | POST to `/api/admin/uploads/sign` with: 1. `image/jpeg` (2MB)<br>2. `application/pdf` (2MB)<br>3. `image/png` (15MB) | Payload 1 succeeds with signed S3 PUT URL (expires in 300s). Payload 2 and 3 fail with HTTP 400 validation error. | **Pass:** Valid image gets signed PUT URL; invalid type/oversized file rejected.<br>**Fail:** Unrestricted signed URL generated. |
| **EVAL-P2-02** | Media Upload | Direct S3 Upload & CloudFront Delivery | Execute PUT binary to signed URL, then request asset via CloudFront | S3 responds HTTP 200; CloudFront delivers image with `Content-Type: image/webp` or source format and `nosniff` header. | **Pass:** Image accessible through CloudFront.<br>**Fail:** Upload fails or CloudFront returns 403. |
| **EVAL-P2-03** | Catalog Filters | Multi-Faceted Querying | Navigate to `/catalog?category=necklaces&minPrice=1000&maxPrice=5000&inStock=true` | Product grid displays only in-stock necklaces within the ₹1,000–₹5,000 range. Count matches database records. | **Pass:** Returned items match all filter criteria exactly.<br>**Fail:** Out-of-bounds prices or other categories rendered. |
| **EVAL-P2-04** | PDP Presentation | Pricing, Specs & Gallery Zoom | Open `/product/one-gram-gold-necklace` | Displays High-Res Gallery with hover zoom; Selling Price, strike-through MRP, discount badge; Specifications table (Weight, Polish, Code). | **Pass:** All specs and discount calculations accurate; zero layout shifts (CLS $\le 0.05$).<br>**Fail:** Missing specs or incorrect discount math. |
| **EVAL-P2-05** | WhatsApp Integration | Pre-Filled Enquiry CTA | Click "Enquire on WhatsApp" on product page | Browser opens `https://wa.me/<number>?text=...` with URL-encoded product name, SKU, price, and current URL (verifying [EC-UX-01](file:///d:/PJStore%20V0/Docs/edgecases.md#15-customer-experience-formatting--network-resilience)). | **Pass:** Decoded message contains complete product details with no character truncation.<br>**Fail:** Broken link or malformed query string. |
| **EVAL-P2-06** | SEO & Schema | Structured Data Schema Validation | Run Google Rich Results Test on `/product/[slug]` | HTML includes valid JSON-LD `<script type="application/ld+json">` conforming to `schema.org/Product` (name, image, offers, price, priceCurrency: INR, availability). | **Pass:** Rich Results Test reports 0 errors, 0 warnings.<br>**Fail:** Schema syntax error or missing mandatory fields. |

---

## Phase 3: Admin Inventory & Catalog Management

### Objective
Verify that store owners can manage inventory, edit prices, upload images directly, and bulk import catalogues via CSV without technical assistance.

### Test Scenarios

| Test ID | Target / Component | Test Scenario | Execution Step | Expected Behavior | Pass/Fail Criteria |
|---|---|---|---|---|---|
| **EVAL-P3-01** | Inventory Table | Search, Filter & Stock Indicators | Search inventory table by SKU (`DBI-102`), filter by "Low Stock" | Returns exact product; highlights red badge if `stock <= lowStockAt`. | **Pass:** Instant filter response; accurate visual badge.<br>**Fail:** Filter returns incorrect records. |
| **EVAL-P3-02** | Product Editor | Product Creation with S3 Images | Fill product form in `/admin/inventory/new`, drag 3 images, submit | Images upload directly to S3 via pre-signed URLs; product record written to `parnika_products` with S3 keys and supplier code. | **Pass:** Product appears immediately in storefront catalog with all 3 images.<br>**Fail:** Upload aborts or database record missing keys. |
| **EVAL-P3-03** | Bulk CSV Import | CSV Parsing & Batch Insertion | Upload `sample-jewellery.csv` containing 25 valid products and 2 invalid rows | Valid 25 products inserted into DynamoDB via `BatchWriteItem`; UI displays summary modal detailing the 2 rejected rows with row numbers and errors. | **Pass:** Exactly 25 products added; error modal accurately reports failures.<br>**Fail:** Whole file crashes or invalid rows written. |
| **EVAL-P3-04** | Audit Logging | Administrative Action Auditing | Edit selling price from ₹1,999 to ₹1,799 in admin console | Record inserted into `parnika_audit_logs` capturing: `entityId`, `action: 'PRICE_UPDATE'`, `previousPrice: 1999`, `newPrice: 1799`, `staffEmail`, `timestamp`. | **Pass:** Audit record queryable with complete diff.<br>**Fail:** No audit log created or staff email missing. |

---

## Phase 4: Cart, Coupon Engine & Checkout Flow

### Objective
Verify that cart state persists, coupons enforce business constraints, and checkout executes zero-oversell atomic stock reservation.

### Test Scenarios

| Test ID | Target / Component | Test Scenario | Execution Step | Expected Behavior | Pass/Fail Criteria |
|---|---|---|---|---|---|
| **EVAL-P4-01** | Cart Persistence | Guest to Customer Cart Migration | 1. Add item as guest (LocalStorage).<br>2. Log in with customer account. | LocalStorage cart merges with DynamoDB `parnika_carts` for that customer; header cart badge updates immediately. | **Pass:** Items retained and synced without duplication.<br>**Fail:** Cart wiped or items lost on login. |
| **EVAL-P4-02** | Cart Stock Clamping | Real-Time Stock Adjustment | Customer has 4 items in cart; admin reduces stock to 2; customer opens `/cart` (verifying [EC-INV-04](file:///d:/PJStore%20V0/Docs/edgecases.md#11-inventory-concurrency--stock-reservation)) | Cart displays alert: *"Item 'XXX' quantity adjusted to 2 (available stock)."* Subtotal updates to reflect 2 units. | **Pass:** Cart quantity automatically clamped to available stock.<br>**Fail:** Cart allows checkout with 4 units. |
| **EVAL-P4-03** | Coupon Rules | Discount Cap & Minimum Cart Boundary | Apply coupon `FESTIVE500` (min cart ₹2,500, flat ₹500 discount) on: 1. ₹2,400 cart<br>2. ₹3,000 cart (verifying [EC-CPN-02](file:///d:/PJStore%20V0/Docs/edgecases.md#13-discounts-coupons--pricing-boundary-cases)) | Cart 1 rejects with: *"Minimum order value of ₹2,500 required."* Cart 2 accepts, reducing total by ₹500. | **Pass:** Boundary rules enforced strictly.<br>**Fail:** Coupon applied on sub-threshold cart. |
| **EVAL-P4-04** | Coupon Limits | Single-Use & Usage Limits | Apply coupon with `usageLimit: 1` concurrently across two tabs (verifying [EC-CPN-01](file:///d:/PJStore%20V0/Docs/edgecases.md#13-discounts-coupons--pricing-boundary-cases)) | First checkout succeeds; second checkout rejects with: *"Coupon limit reached."* | **Pass:** Exactly one order receives discount.<br>**Fail:** Both orders receive discount. |
| **EVAL-P4-05** | **Zero-Oversell Race** | Concurrent Checkout on Single Unit | Run `scripts/load-test-stock.ts`: 10 parallel checkout requests for a product with `stock = 1` (verifying [EC-INV-01](file:///d:/PJStore%20V0/Docs/edgecases.md#11-inventory-concurrency--stock-reservation)) | Exactly 1 request succeeds (order `PENDING_PAYMENT`); 9 requests fail with HTTP 409 (`OUT_OF_STOCK`). Stock in DynamoDB becomes `0`, never `-1`. | **Pass:** Exactly 1 winner; final `stock === 0`.<br>**Fail:** $\ge 2$ checkouts succeed or `stock < 0`. |

---

## Phase 5: Payment Gateway Subsystem & Webhooks

### Objective
Verify that the `IPaymentProvider` contract functions, YOUPI PG dynamic UPI QR generation works, COD threshold rules are enforced, and webhooks are cryptographically validated and idempotent.

### Test Scenarios

| Test ID | Target / Component | Test Scenario | Execution Step | Expected Behavior | Pass/Fail Criteria |
|---|---|---|---|---|---|
| **EVAL-P5-01** | Provider Contract | Payment Adapter Polymorphism | Switch `PAYMENT_PROVIDER=youpi` to `PAYMENT_PROVIDER=razorpay` in `.env` | Code invokes `createPayment()` seamlessly without frontend changes or type errors. | **Pass:** Both adapters implement `IPaymentProvider` cleanly.<br>**Fail:** Runtime method missing or interface divergence. |
| **EVAL-P5-02** | YOUPI PG Integration | Dynamic UPI QR Generation | Initiate checkout with UPI payment selected | Backend calls YOUPI PG API, receives session token, and renders dynamic UPI QR with locked order amount and unique transaction note reference (verifying [EC-PAY-04](file:///d:/PJStore%20V0/Docs/edgecases.md#12-payments--gateway-integration-youpi-pg--fallback) & [EC-PAY-06](file:///d:/PJStore%20V0/Docs/edgecases.md#12-payments--gateway-integration-youpi-pg--fallback)). | **Pass:** QR code renders with correct UPI deep-link string (`upi://pay?pa=...&am=...&tn=PJ-ORD-...`).<br>**Fail:** QR missing or amount unlocked. |
| **EVAL-P5-03** | Cash on Delivery | COD Validation & Ceiling Check | 1. Select COD on ₹4,000 cart.<br>2. Select COD on ₹12,000 cart (verifying [EC-PAY-05](file:///d:/PJStore%20V0/Docs/edgecases.md#12-payments--gateway-integration-youpi-pg--fallback)). | Order 1 completes with `orderStatus: PLACED`, `paymentStatus: PENDING_COD`. Order 2 rejects COD with: *"Cash on Delivery is limited to orders up to ₹10,000."* | **Pass:** COD threshold enforced at ₹10,000.<br>**Fail:** ₹12,000 order allowed as COD. |
| **EVAL-P5-04** | Webhook Security | HMAC Signature Verification | POST to `/api/payments/webhook/youpi` with: 1. Valid HMAC-SHA256 signature<br>2. Tampered signature<br>3. Missing signature header | Request 1 processes successfully (HTTP 200). Requests 2 and 3 rejected immediately with HTTP 401 Unauthorized. | **Pass:** Only cryptographically valid signatures processed.<br>**Fail:** Invalid signature returns HTTP 200. |
| **EVAL-P5-05** | Webhook Idempotency | Replayed Webhook Ingestion | Send the identical valid payment webhook payload 5 times consecutively (verifying [EC-PAY-03](file:///d:/PJStore%20V0/Docs/edgecases.md#12-payments--gateway-integration-youpi-pg--fallback)) | First call marks order `PAID` and writes record to `parnika_payments`. Next 4 calls return HTTP 200 OK without repeating state updates or re-dispatching emails. | **Pass:** Order updated exactly once; 0 duplicate side-effects.<br>**Fail:** Multiple email notifications or status flip. |
| **EVAL-P5-06** | Reconciliation | Admin Unmatched Payment Alert | Simulate an observer notification with no matching pending order | Transaction appears in `/admin/payments` under "Unmatched / Pending Review" with action button "Reconcile Manually". | **Pass:** Unmatched payment flagged for admin attention.<br>**Fail:** Transaction silently discarded. |

---

## Phase 6: Order Fulfillment, Customer Account & Communications

### Objective
Verify order status progression, GST tax invoice PDF generation, customer order history tracking, and automated email/WhatsApp alerts.

### Test Scenarios

| Test ID | Target / Component | Test Scenario | Execution Step | Expected Behavior | Pass/Fail Criteria |
|---|---|---|---|---|---|
| **EVAL-P6-01** | Order Pipeline | Admin Status Workflow | In `/admin/orders/[id]`, transition order: `PAID` $\rightarrow$ `PACKED` $\rightarrow$ `SHIPPED` (add courier name & tracking #) $\rightarrow$ `DELIVERED` | Order status and tracking info persist in DynamoDB; timestamps recorded for each stage. | **Pass:** Order status updates accurately at each step.<br>**Fail:** Illegal state transition or tracking number fails to save. |
| **EVAL-P6-02** | GST Invoicing | PDF Generation & Tax Compliance | Trigger invoice generation on paid order of ₹2,000 (intra-state delivery) | Generates PDF at `s3://parnika-store-prod/invoices/INV-<orderNo>.pdf`. PDF includes: Store GSTIN, Customer Address, HSN Code `7117`, CGST (1.5%) = ₹30, SGST (1.5%) = ₹30, Total = ₹2,000. | **Pass:** PDF generated, math matches GST rules exactly, uploaded to S3.<br>**Fail:** Inaccurate tax calculations or missing HSN code. |
| **EVAL-P6-03** | Order Tracking | Customer Account Order Timeline | Customer opens `/account/orders/[orderNo]` | Renders visual progress tracker (Placed $\rightarrow$ Packed $\rightarrow$ Shipped $\rightarrow$ Delivered) with clickable courier tracking link and "Download Invoice" button. | **Pass:** Tracking timeline reflects current status; invoice downloads cleanly.<br>**Fail:** Broken tracking link or missing invoice. |
| **EVAL-P6-04** | Email Dispatch | Transactional Order Confirmation | Complete payment on test order | Customer receives email via SES/SMTP with order summary and attached GST PDF invoice. | **Pass:** Email delivered within 30 seconds with valid PDF attachment.<br>**Fail:** Email fails or attachment missing. |
| **EVAL-P6-05** | WhatsApp Dispatch | Automated / Fallback Notification | Transition order to `SHIPPED` with tracking URL | System dispatches WhatsApp Cloud API message template or generates 1-click admin WhatsApp share link pre-populated with customer name and tracking link. | **Pass:** Pre-formatted message contains accurate tracking details.<br>**Fail:** Broken message text or failure to dispatch. |

---

## Phase 7: Hardening, Performance, Security & Production Launch

### Objective
Verify that the complete production system withstands concurrency stress, meets mobile Core Web Vitals targets, adheres to DPDP privacy requirements, and has automated disaster recovery.

### Test Scenarios

| Test ID | Target / Component | Test Scenario | Execution Step | Expected Behavior | Pass/Fail Criteria |
|---|---|---|---|---|---|
| **EVAL-P7-01** | **Stress & Concurrency** | Multi-User Flash Sale Simulation | Run automated script simulating 50 concurrent virtual users purchasing across 5 low-stock items | System handles all requests without 500 errors; zero oversell; inventory balances reconcile 100% across all SKUs. | **Pass:** 0 negative stock records; 0 duplicate orders; 0 unhandled 500s.<br>**Fail:** Any oversell or unhandled server crash. |
| **EVAL-P7-02** | **Mobile Performance** | Lighthouse Mobile Audit | Run Google Lighthouse on Mobile emulation for `/` and `/product/[slug]` | Scores: Performance $\ge 85$, Accessibility $\ge 95$, Best Practices $\ge 90$, SEO $\ge 90$. Core Web Vitals: LCP $\le 2.5\text{s}$, CLS $\le 0.1$. | **Pass:** All 4 metric thresholds met on mobile.<br>**Fail:** Performance $< 85$ or LCP $> 2.5\text{s}$. |
| **EVAL-P7-03** | Security Sweep | Secrets & Vulnerability Audit | 1. Run `git grep -i "secret\|key" app/` to verify no credentials exposed.<br>2. Run `npm audit`. | Zero AWS secret keys or webhook secrets found in client components (`'use client'`); zero high/critical vulnerabilities in dependencies. | **Pass:** Zero exposed credentials; 0 critical npm audit findings.<br>**Fail:** Any secret in client bundle or high CVE. |
| **EVAL-P7-04** | DPDP Compliance | Data Privacy & Erasure Endpoint | Submit data erasure request for a customer phone number | Customer's saved addresses and personal identifiers redacted from `parnika_users`; historical order invoices retain minimal tax records in compliance with Indian law. | **Pass:** PII scrubbed from active customer profile.<br>**Fail:** PII remains unredacted. |
| **EVAL-P7-05** | Disaster Recovery | Nightly DynamoDB to S3 Backup | Run `scripts/backup-tables.ts` | Exports all 8 DynamoDB tables to compressed JSON (`.json.gz`) in `s3://parnika-store-prod/backups/<YYYY-MM-DD>/`. | **Pass:** S3 contains valid, readable JSON gzip archives of all tables.<br>**Fail:** Backup script fails or output empty. |
| **EVAL-P7-06** | End-to-End Smoke | Full Customer Buying Cycle | On live staging/production domain: Browse $\rightarrow$ Filter $\rightarrow$ View Product $\rightarrow$ Add to Cart $\rightarrow$ Apply Coupon $\rightarrow$ Pay via UPI/COD $\rightarrow$ Verify Invoice | Complete transaction completes under 60 seconds with order confirmation, email invoice delivery, and stock update. | **Pass:** Flawless customer buying cycle verified.<br>**Fail:** Any broken link, checkout abort, or missing confirmation. |

---

## Evaluation Gate Sign-Off Protocol

Before progressing from Phase $N$ to Phase $N+1$, the developer or AI agent must complete the following checklist:

```markdown
### Phase [X] Sign-off Check
- [ ] All Evaluation Scenarios (EVAL-PX-01 through EVAL-PX-0N) executed.
- [ ] Zero test failures recorded.
- [ ] No regression introduced into earlier phase evaluations.
- [ ] Newly discovered edge cases logged in edgecases.md (Section 2).
- [ ] Pull request / code commit verified against conventions.md checklist.
```
