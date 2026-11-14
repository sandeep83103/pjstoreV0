# Architecture & Design Decisions — Parnika Jewellers

> Reference Specifications:
> - [problemstatement.md](file:///d:/PJStore%20V0/Docs/problemstatement.md)
> - [architecture.md](file:///d:/PJStore%20V0/Docs/architecture.md)
> - [implementationplan.md](file:///d:/PJStore%20V0/Docs/implementationplan.md)
> - [conventions.md](file:///d:/PJStore%20V0/Docs/conventions.md)
> - [edgecases.md](file:///d:/PJStore%20V0/Docs/edgecases.md)
> - [evals.md](file:///d:/PJStore%20V0/Docs/evals.md)
>
> **Document Purpose:** Records every non-obvious technology, architectural, and design choice. Each entry is strictly formatted in two lines (Decision and Rationale) to prevent future sessions or agents from reversing established technical reasoning.

---

### DEC-01: Fullstack Next.js App Router over Decoupled React SPA + Express/Nest Backend
We chose a unified Next.js App Router codebase over maintaining separate frontend SPA and backend API repositories.  
Because shared TypeScript data types, native Server Components (RSC), and zero-CORS internal routing eliminate deployment divergence and dual-repo maintenance for an indie-scale e-commerce store.

### DEC-02: Amazon DynamoDB over PostgreSQL / Supabase for Primary Data
We chose Amazon DynamoDB with conditional updates over a relational database like PostgreSQL or Supabase.  
Because serverless on-demand DynamoDB in `ap-south-1` costs zero when idle, requires zero connection-pool tuning in serverless routes, and provides sub-10ms atomic conditional updates.

### DEC-03: DynamoDB over S3-Only Flat JSON Storage
We chose DynamoDB for transactional state rather than storing catalog and orders directly as JSON files in S3.  
Because S3 lacks row-level locking, secondary indexing, and atomic conditional writes (`stock >= :qty`), making concurrent inventory decrements and checkout updates unsafe against race conditions.

### DEC-04: Multi-Table Layout over Strict Single-Table DynamoDB Design
We chose clean dedicated DynamoDB tables (`parnika_products`, `parnika_orders`, etc.) with GSIs over an overloaded Single-Table Design.  
Because discrete tables simplify bulk CSV imports, independent table backup snapshots, schema migrations, and admin data inspections without complex PK/SK overloading.

### DEC-05: Direct S3 Pre-Signed PUT Uploads over Streaming through Serverless API Routes
We chose client-direct S3 uploads via pre-signed PUT URLs over streaming file buffers through Next.js route handlers.  
Because streaming high-resolution jewellery photos through serverless functions hits Vercel/Node 4.5MB payload limits, spikes server memory, and triggers function timeouts.

### DEC-06: CloudFront with Origin Access Control (OAC) over Public S3 Bucket Policies
We chose a private S3 bucket fronted by Amazon CloudFront with Origin Access Control over making the S3 bucket publicly readable.  
Because CloudFront caches media at Indian edge locations for rapid mobile delivery, prevents public bucket scraping, and incurs zero data transfer egress fees from S3 to CloudFront.

### DEC-07: Pluggable `IPaymentProvider` Abstraction over Hardcoded YOUPI PG Integration
We chose an adapter interface (`IPaymentProvider`) with YOUPI PG as an adapter and a Razorpay stub alongside over hardcoding YOUPI PG directly into checkout.  
Because YOUPI PG is an uncertified, experimental self-hosted gateway; the adapter allows switching to a licensed gateway like Razorpay or Cashfree with zero changes to checkout logic.

### DEC-08: Server-Side Webhooks over Client Redirect Callbacks for Payment Confirmation
We chose cryptographically signed HMAC webhooks over client-side redirect query parameters to mark orders as `PAID`.  
Because client redirects can be spoofed, altered, or lost if the customer closes their browser early, whereas server webhooks guarantee authentic proof of payment from the gateway.

### DEC-09: Immediate Stock Reservation with 15-Minute TTL over Deduct-After-Payment
We chose decrementing stock at checkout creation with a 15-minute expiration release over waiting for payment confirmation before deducting stock.  
Because deducting stock only after payment allows two customers to pay for the last piece simultaneously, whereas temporary reservation prevents overselling while freeing abandoned carts.

### DEC-10: Stateless `jose` JWTs in `httpOnly` Cookies over NextAuth or External Auth Providers
We chose stateless JWTs in secure `httpOnly` cookies using `jose` over NextAuth, Supabase Auth, or Auth0.  
Because our authentication needs (phone OTP, customer credentials, and bootstrap admin) run seamlessly on Node and Edge without third-party subscription costs, external network hops, or vendor lock-in.

### DEC-11: CSS Custom Properties (`tokens.css`) + Tailwind over CSS-in-JS (Styled Components)
We chose CSS custom properties combined with Tailwind CSS over CSS-in-JS libraries like Styled Components or Emotion.  
Because CSS-in-JS breaks Next.js Server Components, increases client JavaScript bundle size, and degrades mobile Lighthouse scores, whereas CSS variables provide instant brand theming with zero runtime penalty.

### DEC-12: React Context + LocalStorage for Cart over Redux Toolkit or Zustand
We chose React Context (`CartContext`) synchronized with LocalStorage and DynamoDB over Redux Toolkit or Zustand.  
Because shopping cart and drawer visibility represent the only interactive client state in the application, making external state management libraries unnecessary bundle overhead.

### DEC-13: Zod for Unified Runtime Validation & Type Inference over Yup or Joi
We chose Zod for all API payload, query parameter, environment variable, and database schema validation over Yup or Joi.  
Because Zod enables compile-time TypeScript type inference (`z.infer`), allowing a single schema definition to serve simultaneously as runtime validator and compile-time type contract.

### DEC-14: Server-Side PDF Generation (`pdfkit`) over Client-Side Canvas Printing (`html2pdf.js`)
We chose server-side PDF generation via `pdfkit` saved directly to S3 over client-side DOM-to-canvas PDF converters.  
Because client-side HTML canvas tools produce inconsistent fonts on Android devices and cannot automatically store immutable GST-compliant tax invoices in cloud audit storage.

### DEC-15: Whole Integer Indian Rupees (INR) over Floating-Point Decimals
We chose integer whole Indian Rupees for all database prices, discounts, and order calculations over floating-point numbers.  
Because floating-point numbers produce IEEE-754 precision rounding errors in discount thresholds and tax calculations, whereas whole integer representation guarantees mathematical exactness.

### DEC-16: Prefilled WhatsApp Click-to-Chat CTA over Embedded Live Chat Widgets
We chose prefilled WhatsApp URL links (`wa.me`) on product pages over an embedded live chat widget like Intercom or Tawk.to.  
Because third-party chat widgets inject 300KB+ of external JavaScript that degrades mobile Core Web Vitals, while Indian jewellery buyers overwhelmingly prefer direct conversations on WhatsApp.

### DEC-17: Manual Admin Price & Supplier Code Entry over Automated Wholesale Scrapers
We chose manual admin entry for selling price, cost price, and supplier codes (`DBI-`) over automated distributor scrapers.  
Because fashion jewellery trading relies on informal wholesale catalog photos with negotiated batch pricing, making manual tagging and pricing faster and more accurate for the store owner.

### DEC-18: `sharp().rotate()` Image Pipeline over Client-Side Browser Canvas Resizing
We chose server-side image processing via Sharp over client-side HTML5 canvas resizing before S3 upload.  
Because client-side browser canvas resizing strips EXIF orientation tags (causing vertical jewellery necklace photos to rotate sideways) and strains battery on budget mobile devices.

### DEC-19: Standardized JSON Envelope (`ApiResponse<T>`) over Raw Payload Returns
We chose a strict `{ success: boolean, data?, error? }` response envelope for all API endpoints over returning bare objects or arbitrary HTTP text.  
Because a unified envelope enables frontend clients to handle responses, validation details, and business exceptions consistently without duplicated try/catch blocks.

### DEC-20: Order-Level Tax Calculation over Line-Item Fractional Tax Summation
We chose calculating 3% GST on the order subtotal rather than summing independently rounded fractional line-item taxes.  
Because summing rounded fractions across multiple small accessories causes 1-paise discrepancies between itemized lines and the final total on GST invoices.

### DEC-21: Dedicated Project AWS Instance & Scoped IAM Policy over Shared / Wildcard Permissions
We chose a dedicated project S3 bucket instance (`parnika-jewellers-v0-<env>`) and scoped IAM policies over account-wide shared buckets or wildcard permissions.  
Because strictly scoping access to `parnika-jewellers-v0-*` and `parnika_*` ARNs guarantees that existing client projects and buckets in the user's AWS account are never read, altered, or disturbed.
