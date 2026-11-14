# Project Conventions & Coding Standards — Parnika Jewellers

> Reference Specifications:
> - [problemstatement.md](file:///d:/PJStore%20V0/Docs/problemstatement.md)
> - [architecture.md](file:///d:/PJStore%20V0/Docs/architecture.md)
> - [implementationplan.md](file:///d:/PJStore%20V0/Docs/implementationplan.md)
>
> **Target Framework:** Next.js (App Router, TypeScript 5+) • Node.js 20+  
> **Infrastructure:** Amazon DynamoDB • Amazon S3 • Amazon CloudFront (AWS `ap-south-1`)  
> **Status:** Mandatory Baseline for all AI and human developers.

---

## 1. Architectural Core Principles ("The Golden Rules")

1. **Repository Isolation:** Never call AWS SDK or DynamoDB DocumentClient directly inside a React component or an API route handler. All data operations MUST pass through `lib/data/` repository interfaces.
2. **Zero-Oversell Guarantee:** Never decrement stock in application memory or via blind writes. Every inventory deduction MUST use a DynamoDB conditional update expression (`stock >= :qty`).
3. **Server-Side Payment Truth:** Never mark an order as `PAID` based on a frontend redirect or client-side callback. Orders transition to `PAID` exclusively through verified, cryptographically signed server-to-server webhooks.
4. **Direct S3 Uploads:** Never stream media files through Next.js serverless functions. Large media uploads MUST go directly from the client to S3 using short-lived pre-signed PUT URLs.
5. **Mobile-First & Tokenized Styling:** Never write arbitrary hardcoded hex colors or non-responsive pixel layouts. All styling MUST consume the brand design tokens defined in `styles/tokens.css`.
6. **Strict Type Safety:** Zero tolerance for `any`, `@ts-ignore`, or loose type assertions. All external inputs (APIs, query parameters, webhooks, forms) MUST be validated with `zod`.

---

## 2. Directory & Folder Structure

```
PJStore V0/
├── app/                                # Next.js App Router
│   ├── (storefront)/                   # Route group: Customer-facing store
│   │   ├── layout.tsx                  # Root storefront layout (Header, Nav, Footer, CartDrawer)
│   │   ├── page.tsx                    # Home (Hero carousel, featured categories, new arrivals)
│   │   ├── catalog/
│   │   │   ├── page.tsx                # Catalog browsing with multi-attribute filtering
│   │   │   └── [category]/page.tsx     # Category-specific landing pages
│   │   ├── product/
│   │   │   └── [slug]/page.tsx         # Product detail page (PDP) with zoom, specs, WhatsApp CTA
│   │   ├── cart/
│   │   │   └── page.tsx                # Cart page & price breakdown
│   │   ├── checkout/
│   │   │   ├── page.tsx                # Multi-step checkout (Address, Method, Review)
│   │   │   └── confirmation/page.tsx   # Order confirmation & receipt
│   │   ├── account/
│   │   │   ├── login/page.tsx          # Customer OTP / Password login
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx            # Order history list
│   │   │   │   └── [orderNo]/page.tsx  # Order tracking & invoice download
│   │   │   └── wishlist/page.tsx       # Saved customer wishlist
│   │   └── (static)/                   # Static policy pages (SSG)
│   │       ├── about/page.tsx
│   │       ├── shipping/page.tsx
│   │       ├── returns/page.tsx
│   │       ├── privacy/page.tsx
│   │       └── terms/page.tsx
│   ├── admin/                          # Route group: Protected store administration
│   │   ├── layout.tsx                  # Admin dashboard shell with navigation sidebar
│   │   ├── login/page.tsx              # Admin authentication login
│   │   ├── page.tsx                    # Executive Dashboard (sales, low stock, pending orders)
│   │   ├── inventory/
│   │   │   ├── page.tsx                # Inventory data table (filters, stock toggles)
│   │   │   ├── new/page.tsx            # Product creation form (S3 uploader, variant setup)
│   │   │   ├── [id]/page.tsx           # Product editor
│   │   │   └── bulk/page.tsx           # CSV catalog bulk import
│   │   ├── orders/
│   │   │   ├── page.tsx                # Order management pipeline
│   │   │   └── [id]/page.tsx           # Order details, packing slip, tracking number
│   │   ├── coupons/
│   │   │   └── page.tsx                # Discount coupon management
│   │   ├── payments/
│   │   │   └── page.tsx                # Gateway health, webhook audit log, manual reconciliation
│   │   ├── customers/
│   │   │   └── page.tsx                # Customer database & order history lookup
│   │   └── settings/
│   │       └── page.tsx                # Shipping fees, WhatsApp numbers, store meta
│   ├── api/                            # Backend API route handlers
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── logout/route.ts
│   │   │   └── otp/route.ts
│   │   ├── products/
│   │   │   ├── route.ts                # GET catalog products (filtered & paginated)
│   │   │   └── [id]/route.ts
│   │   ├── categories/route.ts
│   │   ├── cart/route.ts               # GET / POST persistent cart sync
│   │   ├── coupons/
│   │   │   └── validate/route.ts       # POST validate coupon rules
│   │   ├── checkout/
│   │   │   └── route.ts                # POST initiate checkout & stock reservation
│   │   ├── payments/
│   │   │   ├── create/route.ts         # POST create gateway payment session
│   │   │   └── webhook/
│   │   │       └── [provider]/route.ts # POST HMAC verified webhook endpoint
│   │   └── admin/                      # Protected admin endpoints
│   │       ├── uploads/
│   │       │   └── sign/route.ts       # POST generate pre-signed S3 PUT URL
│   │       ├── products/route.ts
│   │       ├── orders/
│   │       │   └── [id]/status/route.ts
│   │       └── inventory/
│   │           └── bulk/route.ts
│   ├── globals.css                     # Global Tailwind base styles
│   ├── layout.tsx                      # Root HTML layout (fonts, metadata, providers)
│   └── not-found.tsx                   # Custom 404 page
├── components/                         # Reusable UI component library
│   ├── ui/                             # Primitive presentation components (Button, Input, Modal, Badge)
│   ├── storefront/                     # Storefront-specific components (ProductCard, Hero, FilterBar)
│   ├── admin/                          # Admin-specific components (DataTable, S3Uploader, StatCard)
│   └── shared/                         # Shared utilities (BrandLogo, WhatsAppButton, PriceTag)
├── lib/                                # Core domain logic, utilities, and infrastructure
│   ├── data/                           # Data Access Layer (Repository Pattern)
│   │   ├── interfaces/                 # Strict TypeScript contracts (IProductRepository, etc.)
│   │   └── dynamodb/                   # AWS DynamoDB SDK v3 implementations
│   ├── payments/                       # Payment Gateway Abstraction Layer
│   │   ├── IPaymentProvider.ts         # Payment provider interface
│   │   ├── youpi.ts                    # YOUPI PG V2 REST adapter
│   │   ├── cod.ts                      # Cash on Delivery adapter
│   │   └── razorpay.ts                 # Licensed fallback adapter
│   ├── auth/                           # Authentication, JWT, and session management
│   ├── invoices/                       # GST-compliant PDF invoice generation
│   ├── notifications/                  # WhatsApp & Email transactional dispatchers
│   ├── s3/                             # S3 pre-signed URL generator and CloudFront linkers
│   ├── env.ts                          # Validated Zod environment variable parser
│   └── utils.ts                        # Shared formatting helpers (currency, date, slugify)
├── styles/
│   └── tokens.css                      # CSS custom properties for brand palette
├── scripts/                            # DevOps, migration, and seeding scripts
│   ├── setup-dynamo.ts                 # Table and GSI creator
│   ├── seed.ts                         # Initial catalog and admin user seeder
│   └── backup-tables.ts                # Scheduled DynamoDB to S3 JSON snapshot
├── public/                             # Public static assets
│   ├── brand/                          # Logo, crest, favicon
│   └── images/                         # Fallback placeholders
└── Docs/                               # Specification & Architecture documents
```

---

## 3. Naming Conventions

### 3.1 Files & Directories
- **Directories:** Lowercase kebab-case (`components/storefront/`, `lib/data/`).
- **Next.js App Routes:** Lowercase kebab-case (`app/(storefront)/catalog/[category]/page.tsx`).
- **React Components:** PascalCase (`ProductCard.tsx`, `ImageGallery.tsx`, `CartDrawer.tsx`).
- **Interfaces & Types:** PascalCase prefixed with `I` for repository interfaces (`IProductRepository.ts`, `Product.ts`).
- **Utility & Service Files:** CamelCase or kebab-case (`formatCurrency.ts`, `youpi.ts`, `s3Client.ts`).
- **API Route Handlers:** Must always be named `route.ts`.

### 3.2 Code Identifiers
| Target | Convention | Example |
|---|---|---|
| **React Components** | PascalCase | `function ProductFilterDrawer() { ... }` |
| **Custom Hooks** | camelCase with `use` prefix | `useCart()`, `useDebounce()` |
| **Functions & Methods** | camelCase (verb-first) | `calculateDiscount()`, `verifySignature()` |
| **Variables & Properties** | camelCase | `stockQuantity`, `supplierCode`, `isSubmitting` |
| **Constants & Enums** | UPPER_SNAKE_CASE | `DEFAULT_PAGE_SIZE`, `MAX_IMAGE_SIZE_BYTES` |
| **TypeScript Types & Interfaces** | PascalCase | `interface Product`, `type OrderStatus` |
| **Zod Schemas** | camelCase with `Schema` suffix | `createProductSchema`, `checkoutPayloadSchema` |

### 3.3 Database & AWS Infrastructure Identifiers
- **DynamoDB Tables:** Lowercase snake_case with `parnika_` prefix:
  - `parnika_products`, `parnika_orders`, `parnika_coupons`, `parnika_users`, `parnika_payments`, `parnika_settings`, `parnika_audit_logs`.
- **DynamoDB Attributes:** camelCase (`supplierCode`, `costPrice`, `lowStockAt`, `paymentStatus`).
- **Global Secondary Indexes (GSIs):** Kebab-case naming pattern:
  - `slug-index`, `category-createdAt-index`, `sku-index`, `orderNo-index`, `userId-createdAt-index`.
- **S3 Object Keys:** Lowercase kebab-case with hierarchical prefixes:
  - `products/{productId}/{uuid}-{variant}.webp`
  - `invoices/INV-{orderNo}.pdf`
  - `backups/{YYYY-MM-DD}/{tableName}.json.gz`

### 3.4 Design Tokens & CSS Variables
All brand tokens in `styles/tokens.css` MUST follow the `--color-<role>-<modifier>` convention:
```css
:root {
  --color-primary-base: #0B3B24;        /* Emerald Green Primary */
  --color-primary-dark: #062617;        /* Deep Forest Emerald */
  --color-accent-gold: #D4AF37;         /* Royal Temple Gold */
  --color-accent-light-gold: #F3E5AB;   /* Champagne Gold Accent */
  --color-ruby-alert: #9B111E;          /* Ruby Red Badges & Alerts */
  --color-surface-ivory: #FCFBF7;       /* Card Backdrop */
  --color-text-main: #1A1A1A;           /* High contrast body text */
  --color-text-muted: #666666;          /* Subtitles & borders */
}
```

---

## 4. TypeScript & Data Modeling Standards

### 4.1 Strict Configuration Rules
- `tsconfig.json` MUST enforce:
  ```json
  {
    "compilerOptions": {
      "strict": true,
      "noImplicitAny": true,
      "strictNullChecks": true,
      "noUncheckedIndexedAccess": true,
      "exactOptionalPropertyTypes": true
    }
  }
  ```
- **Prohibited:** Any usage of `any`. If a generic data blob is necessary, use `unknown` combined with Zod parsing.

### 4.2 Single Source of Truth for Schemas
All data structures shared across client and server MUST have a corresponding Zod schema that infers the TypeScript type:

```typescript
// lib/types/product.ts
import { z } from 'zod';

export const ProductSchema = z.object({
  id: z.string().uuid(),
  sku: z.string().min(3).max(32),
  supplierCode: z.string().min(2).max(64), // e.g. "DBI-102"
  name: z.string().min(3).max(180),
  slug: z.string().min(3).max(180),
  categoryId: z.string().min(1),
  tags: z.array(z.string()).default([]),
  description: z.string().min(10),
  specs: z.record(z.string(), z.string()).default({}),
  price: z.number().int().positive(),      // Always in Indian Paise or whole Rupees (Standardize: INR Whole)
  mrp: z.number().int().positive(),
  costPrice: z.number().int().positive(),  // Admin only
  stock: z.number().int().min(0),
  lowStockAt: z.number().int().default(5),
  images: z.array(z.string()).min(1),      // S3 object keys
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).default('ACTIVE'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Product = z.infer<typeof ProductSchema>;
export type ProductSummary = Omit<Product, 'costPrice'>; // Sanitized for public storefront
```

---

## 5. Error Handling Patterns

### 5.1 Standardized API Response Envelope
All Route Handlers (`app/api/**/route.ts`) MUST return a consistent JSON envelope:

```typescript
// Success Envelope
type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: {
    page?: number;
    total?: number;
    hasMore?: boolean;
  };
};

// Error Envelope
type ApiError = {
  success: false;
  error: {
    code: string;       // e.g. "OUT_OF_STOCK", "INVALID_COUPON", "UNAUTHORIZED"
    message: string;    // Human-readable message safe for UI display
    details?: unknown;  // Optional Zod validation issues
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
```

### 5.2 Application Error Hierarchy
Use strongly-typed custom error classes extending `AppError`:

```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string, id: string) {
    super('NOT_FOUND', `${entity} with id '${id}' was not found.`, 404);
  }
}

export class OutOfStockError extends AppError {
  constructor(productName: string) {
    super('OUT_OF_STOCK', `Item '${productName}' is no longer available in the requested quantity.`, 409);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required.') {
    super('UNAUTHORIZED', message, 401);
  }
}
```

### 5.3 Route Handler Error Handling Template
Every API route handler must catch exceptions and route them through a shared `handleApiError` utility:

```typescript
// app/api/checkout/route.ts
import { NextResponse } from 'next/server';
import { AppError } from '@/lib/errors';
import { ZodError } from 'zod';

export function handleApiError(error: unknown) {
  console.error('[API Error]:', error);

  if (error instanceof AppError) {
    return NextResponse.json(
      { success: false, error: { code: error.code, message: error.message, details: error.details } },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input payload.', details: error.flatten().fieldErrors } },
      { status: 422 }
    );
  }

  return NextResponse.json(
    { success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred.' } },
    { status: 500 }
  );
}
```

### 5.4 DynamoDB Conditional Update Handling
When executing atomic stock decrements, handle `ConditionalCheckFailedException` explicitly:

```typescript
// lib/data/dynamodb/ProductRepository.ts
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { OutOfStockError } from '@/lib/errors';

try {
  await docClient.send(new UpdateCommand(conditionalParams));
} catch (error) {
  if (error instanceof ConditionalCheckFailedException) {
    throw new OutOfStockError(productName);
  }
  throw error;
}
```

---

## 6. Approved Libraries & Tech Stack

To prevent dependency bloat, security risks, and version divergence, developers MUST strictly use the following approved packages:

| Purpose | Approved Package | Prohibited Alternatives | Reason |
|---|---|---|---|
| **Framework** | `next` (14/15 App Router) | Pages Router, Express, Vite | SSR/ISR hybrid rendering, SEO |
| **AWS SDK** | `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` | `aws-sdk` (v2), `dynamoose` | AWS SDK v3 is modular, tree-shakable, and actively supported |
| **Data Validation** | `zod` | `yup`, `joi` | First-class TypeScript inference and zero runtime overhead |
| **Styling** | `tailwindcss`, `clsx`, `tailwind-merge` | Sass, CSS-in-JS, Styled-components | Utility-first, zero runtime CSS injection, high mobile performance |
| **Icons** | `lucide-react` | `react-icons`, `@heroicons/react` | Lightweight, consistent 24px grid, treeshakeable |
| **Auth / Cryptography** | `jose` (stateless JWT), `bcryptjs` / `argon2` | `jsonwebtoken` (Node only) | `jose` runs seamlessly across Node and Edge runtimes |
| **PDF Generation** | `pdfkit` or `@react-pdf/renderer` | Client-side `html2pdf.js` | Server-side invoice generation guarantees GST consistency and direct S3 persistence |
| **Image Handling** | `next/image`, `sharp` | Canvas resizing, raw `<img>` | Automated WebP conversion, responsive `srcset`, and zero layout shift |
| **UUIDs** | Node built-in `crypto.randomUUID()` | `uuid` npm package | Zero-dependency native implementation |

---

## 7. React & Next.js Best Practices

### 7.1 Server Components by Default
- Every page (`page.tsx`) and layout (`layout.tsx`) MUST be a Server Component unless interactive state (`useState`, `useEffect`, event handlers) is strictly needed.
- Push Client Components down the tree to the leaf nodes (e.g., `<AddToCartButton />`, `<ProductImageZoom />`).
- Mark all interactive files explicitly at Line 1 with `'use client';`.

### 7.2 Data Fetching in Server Components
- Call the repository layer directly inside Server Components:
  ```typescript
  // app/(storefront)/product/[slug]/page.tsx
  import { productRepository } from '@/lib/data';
  import { notFound } from 'next/navigation';

  export const revalidate = 60; // ISR cache for 60 seconds

  export default async function ProductPage({ params }: { params: { slug: string } }) {
    const product = await productRepository.findBySlug(params.slug);
    if (!product) notFound();

    return <ProductDetailView product={product} />;
  }
  ```

### 7.3 Currency & Price Display Rule
- All monetary amounts in code and databases MUST be represented as integers in Indian Rupees (`₹` whole) or whole Paise (standardized across the project: **INR Whole Rupees**).
- Format all prices using a single centralized helper:
  ```typescript
  // lib/utils.ts
  export function formatINR(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }
  ```

---

## 8. Anti-Patterns & Prohibited Practices

### ❌ NEVER DO THIS:
1. **Never import AWS credentials into client code:**
   - Any variable starting with `NEXT_PUBLIC_` MUST NOT contain secret keys, DynamoDB credentials, or gateway webhook secrets.
2. **Never calculate order totals on the client:**
   - The browser sends only `{ items: [{ productId, quantity }], couponCode }`. The backend recalculates item prices, verifies discounts from the database, adds shipping, and computes the canonical total.
3. **Never perform in-memory stock checks before checkout:**
   - Reading `stock` from the database and checking `if (stock > 0)` in JavaScript before issuing an update creates a critical race condition. Always use `ConditionExpression: "stock >= :qty"`.
4. **Never save sensitive payment details:**
   - Never store credit card numbers, CVVs, expiry dates, or UPI PINs. Only store gateway references (`providerRef`, `paymentSessionId`).
5. **Never use `window.alert` or `window.confirm`:**
   - Use custom accessible modal dialogs or toast notifications styled with the brand palette.
6. **Never upload files directly to the Next.js server route:**
   - Bypassing S3 pre-signed URLs leads to Vercel/Node 4.5MB request payload limit errors and worker memory spikes.
7. **Never commit `.env` or `.env.local`:**
   - All environment secrets must remain in local machines or AWS Secrets Manager. Always update `.env.example` when adding a new variable.

---

## 9. Security, Webhooks & Gateway Integration

### 9.1 HMAC Webhook Signature Verification
Incoming webhooks from YOUPI PG or Razorpay MUST verify signatures before JSON body parsing:

```typescript
// app/api/payments/webhook/[provider]/route.ts
import crypto from 'crypto';

export async function POST(req: Request, { params }: { params: { provider: string } }) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-youpi-signature') || req.headers.get('x-razorpay-signature');

  if (!signature) {
    return new Response('Missing webhook signature', { status: 400 });
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.YOUPI_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest('hex');

  if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature)) === false) {
    return new Response('Invalid signature verification', { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  // Process idempotent order state transition
  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
```

### 9.2 Rate Limiting & Abuse Prevention
- Rate limit customer OTP requests to a maximum of 5 attempts per phone number per 15-minute window.
- Rate limit `/api/coupons/validate` to prevent automated discount guessing.
- Sanitize all user inputs before rendering to prevent Cross-Site Scripting (XSS).

---

## 10. Checklist for Every Pull Request / Code Edit

Before considering any task or feature complete, verify:

- [ ] Does the code compile with zero TypeScript errors (`npx tsc --noEmit`)?
- [ ] Are all database operations wrapped behind `lib/data/` repository methods?
- [ ] Are all inputs validated with `zod`?
- [ ] Is stock decremented using conditional expressions?
- [ ] Are UI components styled using tokens from `styles/tokens.css`?
- [ ] Is the page/component responsive and usable on a 360px wide mobile viewport?
- [ ] Are image tags using Next.js `<Image />` with appropriate `width`, `height`, or `fill`?
- [ ] Are audit logs recorded for admin mutations?
- [ ] Did you avoid adding unapproved npm packages?
