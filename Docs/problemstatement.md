# Problem Statement — Parnika Jewellers Online Store

> Hand-off document for continued development in Antigravity.
> Status: **specification, pre-implementation.** Items marked **[OPEN]** need an owner decision before or during build.

---

## 1. Goal

Build a production-quality e-commerce website for **Parnika Jewellers** to showcase and sell **fashion jewellery** and **one-gram gold jewellery** (buy-and-sell trading model, not manufacturing). The store must feel like a mainstream shopping site (Amazon-style browsing, cart and checkout), carry the brand's identity, and give the owner an admin panel to run inventory, coupons and payments without touching code.

## 2. Brand

| Item | Value |
|---|---|
| Brand name | Parnika Jewellers |
| Palette | Emerald green, gold, ruby |
| Logo | Crest logo. **[OPEN]** Place the file at `/public/brand/logo.png` (SVG preferred) |
| Page background | Derived from the logo: emerald green base with subtle gold crest/pattern motif. Extract exact hex values from the logo file and define them as CSS variables in `styles/tokens.css` |
| Registered domain | www.parnikajewellers.com (registered in GoDaddy & connected to AWS Amplify) |
| Tone | Elegant, trustworthy, festive but not cluttered |

Design rules: logo in header and footer, favicon from the crest, gold used for accents and CTAs, ruby for sale badges and alerts, emerald for surfaces. Mobile-first (most traffic will be phones), WCAG AA contrast, lazy-loaded images, product images shown on a neutral or emerald backdrop.

## 3. Users and roles

- **Visitor:** browse, search, filter, view products, WhatsApp enquiry.
- **Customer:** everything above, plus cart, checkout, saved addresses, order history, wishlist.
- **Admin (owner/staff):** inventory, orders, coupons, payment settings, banners, customers.

## 4. Technology decisions (confirmed)

- **Frontend + backend:** Next.js (App Router, TypeScript) with Node API route handlers.
- **Image storage:** Amazon S3 (private bucket, served via CloudFront or pre-signed URLs).
- **Data store:** S3 for images and JSON exports/backups, **DynamoDB for transactional data** (products, stock, orders, coupons, users). Reason: S3 has no querying, no atomic updates and no locking, so stock decrements and order writes would be unsafe on S3 alone.
- **Data-access layer:** all storage behind a `lib/data/` repository interface so the backend can be swapped without touching UI or API code.
- **Auth:** email/phone OTP or email+password for customers; separate admin login with role check, bcrypt/argon2 hashing, secure httpOnly cookies, rate limiting.
- **Payments:** see section 7.
- **Hosting:** [OPEN] Vercel or AWS (Amplify/ECS). Region should be `ap-south-1` (Mumbai) for AWS resources.

## 5. Customer-facing features (v1)

1. **Home:** hero banner carousel, category tiles (Fashion, One Gram Gold, Necklaces, Earrings, Bangles, Rings, Bridal sets), new arrivals, best sellers, offers strip.
2. **Catalog:** category pages, search with suggestions, filters (category, price range, material/finish, occasion, in-stock), sort (price, newest, popularity).
3. **Product page:** image gallery with zoom, price, MRP and discount badge, product code, description, specifications, stock status, size/variant selector where relevant, "Add to cart", "Buy now", "Enquire on WhatsApp", related products.
4. **Cart:** line items, quantity change, remove, coupon entry, price breakup, shipping estimate, persistent for logged-in users.
5. **Checkout:** address selection or entry, shipping method, order summary, payment method, order confirmation page and email/WhatsApp confirmation.
6. **Account:** login/signup, profile, saved addresses, order history with status tracking, wishlist, reorder.
7. **WhatsApp enquiry button:** floating button plus per-product prefilled message (product name, code, link).
8. **Static pages:** About, Contact, Shipping, Returns, Privacy, Terms, FAQ, care instructions for one-gram jewellery.
9. **SEO and performance:** server-rendered product pages, structured data (Product schema), sitemap, Open Graph tags, image optimisation.

## 6. Admin panel (`/admin`)

- **Dashboard:** today's orders, revenue, low-stock alerts, pending shipments.
- **Inventory management:** add/edit/archive products, bulk upload (CSV), multiple images uploaded straight to S3, categories, variants, supplier code (e.g. `DBI-` codes from supplier photos), cost price vs selling price, stock quantity, low-stock threshold, visibility toggle. The owner enters prices manually.
- **Orders:** list, filter, status workflow (placed, paid, packed, shipped, delivered, cancelled, refunded), tracking number, invoice PDF, printable packing slip.
- **Coupons:** percentage or flat discount, minimum cart value, max discount, usage limit total and per customer, start/expiry date, category or product restriction, enable/disable.
- **Payment gateways:** enable/disable methods, store gateway credentials (encrypted), webhook URL display, test-mode toggle, view payment logs, reconcile unverified payments.
- **Customers:** list, order history, block/unblock.
- **Content:** homepage banners, announcement bar, featured categories.
- **Settings:** shipping rates, GST details, store contact, WhatsApp number.
- **Audit log:** who changed what and when.

## 7. Payment gateway

**Source provided:** `https://github.com/youpi-pg/YouPI-PG` (YOUPI PG V2).

What it is, per the repository: a **self-hosted UPI and COD gateway** with no per-transaction platform fee, dynamic UPI QR payments, JavaScript checkout integration, WhatsApp OTP before checkout, webhooks, and automated payment verification through bank SMS and Gmail observers. It runs as a **separate set of services** (payment API, checkout portal, merchant admin, observers) with PostgreSQL or an SQLite fallback.

**Integration approach**

- Run YOUPI PG as its own service; the store talks to it only through its payment API and webhooks.
- Store backend creates a payment session per order, redirects/embeds the checkout, and marks the order paid **only on a verified server-side webhook**, never on a client redirect.
- Webhook handler: signature verification, idempotency keys, retry-safe, logs every event.
- Admin panel shows gateway status and unmatched payments.

**Important risks to resolve [OPEN]**

1. The repository itself states it is an experimental research project, **not certified, bank-approved, NPCI-approved, audited or production-ready**.
2. It confirms payments by reading UPI alerts from bank SMS/Gmail, which can mis-attribute or miss payments. Using personal accounts to collect business receipts can also raise banking and tax compliance questions.
3. Cards and net banking are **not** covered by it (UPI and COD only).

**Therefore:** implement payments through a `PaymentProvider` interface (`createPayment`, `verifyWebhook`, `refund`, `getStatus`) with YOUPI PG as the first adapter and a **Razorpay or Cashfree adapter stubbed alongside**, so the owner can switch or add a licensed gateway without rewriting checkout. Recommend launching with COD plus the licensed gateway for cards/UPI and treating YOUPI PG as optional until it is tested in a real environment.

Never store card numbers, CVV or UPI PINs. Saved "payment details" for customers means gateway-tokenised references only.

## 8. Data model (DynamoDB, single-table or per-entity)

- `Product`: id, sku, supplierCode, name, slug, category, tags, description, specs, price, mrp, costPrice, stock, lowStockAt, images[] (S3 keys), variants[], status, createdAt, updatedAt
- `Category`: id, name, slug, parentId, imageKey, sortOrder
- `User`: id, name, email, phone, passwordHash, role, addresses[], wishlist[]
- `Cart`: userId or sessionId, items[], couponCode, updatedAt
- `Order`: id, orderNo, userId, items[] (price snapshot), address snapshot, subtotal, discount, shipping, tax, total, couponCode, paymentMethod, paymentStatus, orderStatus, tracking, timestamps
- `Payment`: id, orderId, provider, providerRef, amount, status, rawWebhook, verifiedAt
- `Coupon`: code, type, value, minCart, maxDiscount, usageLimit, perUserLimit, usedCount, validFrom, validTo, scope, active
- `Banner`, `Setting`, `AuditLog`

Stock changes must use **conditional updates** (`stock >= qty`) so two buyers cannot take the last piece. Nightly JSON snapshot of every table to S3 for backup.

## 9. S3 layout

```
parnika-store-<env>/
  products/<productId>/<uuid>.webp   (+ thumb/medium variants)
  banners/
  brand/
  invoices/<orderNo>.pdf
  backups/<date>/<table>.json
```

- Bucket is private; public delivery through CloudFront.
- Admin uploads via short-lived pre-signed PUT URLs (type and size validated).
- Auto-convert to WebP and generate thumbnails on upload.

## 10. API outline

`/api/products`, `/api/categories`, `/api/cart`, `/api/checkout`, `/api/orders`, `/api/auth/*`, `/api/coupons/validate`, `/api/payments/create`, `/api/payments/webhook/:provider`, `/api/admin/*` (all behind admin role).

## 11. Security and compliance

- HTTPS only, CSRF protection, input validation (zod), rate limiting on login/OTP/coupon endpoints.
- IAM user with least-privilege S3/DynamoDB policy; secrets in environment variables or AWS Secrets Manager, never committed.
- Admin actions audited; optional 2FA for admin.
- Privacy policy and consent for customer data (India DPDP Act).
- GST-compliant invoices. Hallmark and "one gram gold / imitation jewellery" wording must be accurate on product pages (no misleading "gold" claims).

## 12. Environment variables (starter)

```
AWS_REGION=ap-south-1
S3_BUCKET=
CLOUDFRONT_URL=
DYNAMO_TABLE_PREFIX=parnika_
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
JWT_SECRET=
ADMIN_BOOTSTRAP_EMAIL=
ADMIN_BOOTSTRAP_PASSWORD=
PAYMENT_PROVIDER=youpi
YOUPI_BASE_API_URL=
YOUPI_API_KEY=
YOUPI_WEBHOOK_SECRET=
WHATSAPP_NUMBER=
SMTP_URL=
```

## 13. Suggested project structure

```
/app            (storefront + /admin routes)
/components
/lib/data       (repository interfaces + DynamoDB/S3 implementations)
/lib/payments   (PaymentProvider, youpi.ts, razorpay.ts stub)
/lib/auth
/public/brand
/scripts        (seed data, table creation, CSV import)
/styles/tokens.css
```

## 14. Milestones

1. **Foundation:** repo, brand tokens, layout, auth, AWS setup (S3, DynamoDB, CloudFront), seed data.
2. **Catalog:** categories, product pages, search/filter, image pipeline.
3. **Admin inventory:** product CRUD, uploads, CSV import.
4. **Cart and checkout:** cart, coupons, addresses, COD.
5. **Payments:** provider interface, YOUPI PG adapter, webhooks, reconciliation screen.
6. **Orders and customer account:** statuses, invoices, order history, notifications.
7. **Hardening and launch:** SEO, performance, security review, backups, domain and SSL.

## 15. Open questions

1. Final logo file and exact brand colours.
2. Domain: Resolved — www.parnikajewellers.com registered in GoDaddy and hosted on AWS Amplify (ap-south-1).
3. Final payment strategy given the risks in section 7.
4. Shipping: flat rate, weight-based or courier-API integration (Shiprocket, Delhivery)?
5. Delivery coverage: India only, or specific states?
6. Return and exchange policy for one-gram jewellery.
7. GST registration status and invoice format.
8. Customer login method: OTP via WhatsApp/SMS, email, or both?
9. Product count at launch and format of the existing supplier catalogue for bulk import.

## 16. Acceptance criteria for v1

- A customer can browse, search, add to cart, apply a coupon, pay (COD and at least one online method) and see an order confirmation.
- The admin can add a product with images (stored in S3), change stock and price, create a coupon, and view and update orders without a developer.
- Stock never goes negative under concurrent orders.
- An order is marked paid only after a verified webhook.
- Lighthouse mobile score of 85+ on home and product pages.
