# Edge Cases & Failure Modes — Parnika Jewellers

> Reference Specifications:
> - [problemstatement.md](file:///d:/PJStore%20V0/Docs/problemstatement.md)
> - [architecture.md](file:///d:/PJStore%20V0/Docs/architecture.md)
> - [implementationplan.md](file:///d:/PJStore%20V0/Docs/implementationplan.md)
> - [conventions.md](file:///d:/PJStore%20V0/Docs/conventions.md)
>
> **Document Status:** Living Document  
> **Maintenance Rule:** Every time a new edge case, race condition, or boundary anomaly is identified during coding, debugging, or testing, it must be appended to Section 2 ("Discovered During Build").

---

## 1. Anticipated Edge Cases

This section documents failure modes, race conditions, and edge boundaries identified during architecture and domain modeling, together with the prescribed mitigation strategy.

---

### 1.1 Inventory, Concurrency & Stock Reservation

| ID | Scenario / Trigger | Risk / Impact | Mitigation Strategy | Severity |
|---|---|---|---|---|
| **EC-INV-01** | **The Last Piece Race Condition:** Two shoppers click "Pay Now" at the exact same millisecond for a unique one-gram necklace with only 1 unit in stock. | Overselling; taking payment for an unavailable item; customer dissatisfaction. | Enforce DynamoDB atomic conditional update expression `stock >= :qty` inside a `TransactWriteItems` call. The second transaction immediately fails with `ConditionalCheckFailedException` and halts before payment session initiation. | **Critical** |
| **EC-INV-02** | **Abandoned UPI Checkout:** A customer initiates a UPI checkout, reserving stock, but abandons the payment screen or closes their banking app without paying. | Stock locked indefinitely in `PENDING_PAYMENT`, blocking legitimate buyers from purchasing. | Implement a 15-minute Time-To-Live (TTL) on `PENDING_PAYMENT` orders. A scheduled background cleanup worker or lazy check upon new purchase attempts releases reserved stock if no payment webhook is received within 15 minutes. | **High** |
| **EC-INV-03** | **Admin Price or Stock Change Mid-Checkout:** The owner edits a product's price or changes stock to 0 while a customer is viewing the product or filling out their shipping address. | Customer pays the old price or pays for an item that the store owner just marked out-of-stock. | Checkout server handler always re-fetches the canonical price and active status from DynamoDB at the moment of order creation. Client-side prices are never trusted. | **High** |
| **EC-INV-04** | **Cart Quantity Exceeds Available Stock:** A customer adds 5 units of earrings to cart, but an in-store sale reduces stock to 2 before they reach checkout. | Checkout failure or unexpected error. | The `/api/cart` and `/checkout` initializers perform real-time stock clamping. If requested quantity exceeds stock, the UI automatically updates the cart quantity to current available stock with a toast: *"Quantity adjusted to available stock."* | **Medium** |
| **EC-INV-05** | **Product Deleted / Archived While In Active Cart:** The store admin archives a discontinued bangle design while several users have it in their persistent carts. | Broken cart rendering or server error when calculating total. | Cart serialization silently flags the item as `UNAVAILABLE` or filters it out, displaying an alert: *"Item 'XXX' is no longer available and was removed from your cart."* | **Medium** |

---

### 1.2 Payments & Gateway Integration (YOUPI PG & Fallback)

| ID | Scenario / Trigger | Risk / Impact | Mitigation Strategy | Severity |
|---|---|---|---|---|
| **EC-PAY-01** | **Webhook Delivered Before Browser Redirect:** Fast bank SMS observer fires the webhook and marks the order `PAID` before the user's browser returns from the UPI app. | Race condition on order status; client might show "Pending" or trigger redundant creation. | Order state machine is idempotent. The confirmation page polls `/api/orders/[id]/status` or relies on WebSocket/SSE. If order is already `PAID`, confirmation renders immediately without error. | **High** |
| **EC-PAY-02** | **Delayed Bank Observer Alert:** Customer completes UPI transfer, but bank SMS or Gmail observer alert is delayed by 10–30 minutes due to telecom latency. | Customer sees "Payment Pending" on screen despite money leaving their bank account; panics and contacts support. | Display a reassuring status screen: *"Payment Received by UPI. Awaiting Bank Confirmation. Your order is reserved."* Provide order reference number and a direct "Verify via WhatsApp" button pre-filled with transaction ID. Admin dashboard flags pending transactions older than 10 mins for manual check. | **Critical** |
| **EC-PAY-03** | **Duplicate / Replayed Webhooks:** YOUPI PG or gateway retries webhook delivery 5 times due to temporary network lag. | Double-crediting, duplicate order generation, or duplicate confirmation notifications. | Idempotency guard: Every webhook payload's `providerRef` or `eventId` is recorded in `parnika_payments` with a unique constraint. If already present, server immediately returns `HTTP 200 OK` and skips processing. | **Critical** |
| **EC-PAY-04** | **Amount Mismatch (Manual UPI Transfer):** Customer uses an open UPI handle and enters an incorrect amount (e.g. paying ₹1,499 instead of ₹1,599). | Financial loss or partially paid order. | YOUPI PG adapter forces dynamic QR with locked non-editable amount. If an observer detects an amount discrepancy, webhook marks payment status as `PARTIALLY_PAID_HOLD` and alerts admin panel for manual resolution. | **High** |
| **EC-PAY-05** | **Fake COD Orders:** Bots or prank users submit Cash on Delivery orders with bogus phone numbers or addresses. | RTO (Return to Origin) shipping cost loss, tied-up inventory. | Require mandatory WhatsApp/SMS OTP verification before allowing COD confirmation. Cap COD orders to a maximum threshold of ₹10,000. Flag repeat cancellation numbers in `parnika_users`. | **High** |
| **EC-PAY-06** | **Observer Misattribution on Identical Amounts:** Two customers purchase items costing exactly ₹999 at the same minute via UPI. | Bank observer assigns one customer's payment to another customer's order. | Dynamic UPI QR encodes a unique transaction reference (e.g. `PJ-ORD-10023-XYZ`) in the UPI transaction note (`tn` parameter). The observer must match both the exact reference and the amount. | **Critical** |

---

### 1.3 Discounts, Coupons & Pricing Boundary Cases

| ID | Scenario / Trigger | Risk / Impact | Mitigation Strategy | Severity |
|---|---|---|---|---|
| **EC-CPN-01** | **Multi-Tab Single-Use Coupon Exploitation:** A customer opens 2 browser tabs and applies a single-use coupon (`usageLimit: 1`) in both, clicking checkout concurrently. | Double discount exploitation. | Coupon usage is incremented inside the DynamoDB `TransactWriteItems` checkout transaction with a conditional check: `usedCount < usageLimit`. Exactly one transaction commits; the second rejects. | **High** |
| **EC-CPN-02** | **Cart Total Falls Below Minimum Cart Value Post-Coupon:** Customer applies coupon `SAVE500` (min cart ₹3,000) on a ₹3,200 cart, then removes a ₹500 item in another tab. | Unauthorized discount on sub-threshold purchase. | Subtotal and coupon eligibility are re-validated server-side at the moment of checkout submission. If `subtotal < coupon.minCart`, the coupon is removed and order calculation recalculates. | **High** |
| **EC-CPN-03** | **100% Discount / Free Order:** A promotional coupon or gift card brings the order total to ₹0. | Gateway crashes or rejects request with "Amount must be greater than zero". | Checkout logic checks `if (finalTotal === 0)`. The payment gateway step is bypassed entirely, setting `paymentStatus: 'NOT_REQUIRED'` and `orderStatus: 'PLACED'` immediately. | **Medium** |
| **EC-CPN-04** | **GST Rounding Discrepancies:** Calculating 3% IGST or 1.5% CGST + 1.5% SGST on multiple odd-priced line items causes fractional paise rounding differences. | Invoices do not match accounting ledger or order total. | Calculate tax on the order subtotal rather than line-by-line sums, or standardize on Banker's Rounding (round half to even) at integer paise precision before rendering. | **Low** |

---

### 1.4 Media, Image Uploads & S3 Pipelines

| ID | Scenario / Trigger | Risk / Impact | Mitigation Strategy | Severity |
|---|---|---|---|---|
| **EC-MED-01** | **Expired Pre-Signed S3 Upload URL:** Store admin opens product creation form, takes a phone call for 20 minutes, then tries to drop product photos. | Direct S3 upload fails with HTTP 403 Forbidden. | Pre-signed upload hook detects 403 or URL expiration, automatically requests a fresh signed URL from `/api/admin/uploads/sign`, and transparently resumes upload. | **Medium** |
| **EC-MED-02** | **Orphaned S3 Images:** Admin uploads 5 heavy jewellery photos to S3 via pre-signed URLs, but then cancels or closes the browser without submitting the product form. | S3 storage waste and clutter over time. | Nightly maintenance script or S3 Lifecycle rule sweeps unreferenced keys in `products/temp/` or cross-checks S3 keys against `parnika_products` in DynamoDB. | **Low** |
| **EC-MED-03** | **EXIF Orientation Rotation:** Mobile phone photos taken vertically of necklaces or earrings render sideways when converted to WebP. | Unprofessional product gallery; distorted jewellery display. | Use `sharp().rotate()` during image normalization to automatically honor EXIF orientation tags before stripping metadata. | **Medium** |
| **EC-MED-04** | **Malicious File Upload Masked as Image:** A file with an executable or HTML payload renamed to `necklace.png` is uploaded. | XSS or storage compromise if served with improper headers. | Validate file MIME type and magic bytes on pre-signed URL issuance. CloudFront serves all image paths with `Content-Type: image/webp` and `X-Content-Type-Options: nosniff`. | **High** |
| **EC-AWS-01** | **Shared AWS Account & Multi-Project Collision:** The AWS account holds other active client or personal projects with existing S3 buckets and DynamoDB tables. | Accidental overwrite, cross-project data pollution, or resource deletion during deployment or scripts. | Enforce dedicated bucket naming `parnika-jewellers-v0-<env>` and table prefix `parnika_`. Scoped IAM policy strictly restricts credentials to `arn:aws:s3:::parnika-jewellers-v0-*` and `arn:aws:dynamodb:ap-south-1:*:table/parnika_*`. All scripts explicitly forbid account-wide operations or touching non-project resources. | **Critical** |

---

### 1.5 Customer Experience, Formatting & Network Resilience

| ID | Scenario / Trigger | Risk / Impact | Mitigation Strategy | Severity |
|---|---|---|---|---|
| **EC-UX-01** | **Special Characters in WhatsApp Pre-filled Enquiry:** Product title contains quotes, ampersands, or Indian rupee symbols (e.g., `Bridal Set & Jhumka (1 "Gram")`). | Broken WhatsApp link or truncated message on phone. | Pass all query parameters through strict `encodeURIComponent()`. Standardize WhatsApp message template in `lib/notifications/whatsapp.ts`. | **Low** |
| **EC-UX-02** | **Unserviceable Pincode for Courier:** Customer enters a 6-digit postal pincode in a remote area not covered by standard express courier. | Order accepted but cannot be dispatched. | Integrate a lightweight pincode lookup service or offline serviceable list. If pincode is non-serviceable, alert customer before checkout: *"Delivery unavailable at this pincode."* | **Medium** |
| **EC-UX-03** | **High Network Latency / Double-Tap on Submit:** Customer on a weak mobile connection taps "Place Order" repeatedly. | Multiple pending orders created for the same user. | Client-side button disables immediately on click with loading spinner. Server creates an idempotency key per checkout session (`checkoutSessionId`). | **Medium** |

---

## 2. Discovered During Build

> **Living Log:** This section is actively populated during Phase 0 through Phase 7 whenever unexpected behavior, library incompatibilities, AWS edge quirks, or business logic edge cases are discovered in practice.

### Template for Logging Discovered Edge Cases:
```markdown
### [EC-DISC-00X] Title of the Discovered Issue
- **Date Discovered:** YYYY-MM-DD
- **Phase / Component:** e.g. Phase 4 - Cart Subsystem
- **Trigger Scenario:** What specific action triggered the bug or anomaly?
- **Observed Behavior:** What happened unexpectedly?
- **Root Cause:** Why did it happen?
- **Resolution / Applied Fix:** How was it solved in code or architecture?
- **Regression Guard:** What test or check prevents it from recurring?
```

### [EC-DISC-001] PII Field Retention During DPDP Data Erasure in UserRepository
- **Date Discovered:** 2026-11-14
- **Phase / Component:** Phase 7 — Security Hardening & DPDP Compliance
- **Trigger Scenario:** Customer or administrator issues a statutory personal data erasure request under India DPDP Act 2023, passing `{ email: undefined }` to `userRepository.update()`.
- **Observed Behavior:** The existing user's email address persisted unmodified in DynamoDB and memory fallback rather than being scrubbed.
- **Root Cause:** In `UserRepository.update()`, `updates.email ? updates.email.toLowerCase() : existing.email` evaluated to `existing.email` whenever `updates.email` was `undefined`, defeating field removal.
- **Resolution / Applied Fix:** Refactored assignment to `'email' in updates ? (updates.email ? updates.email.toLowerCase() : undefined) : existing.email`, properly wiping email from active customer records while maintaining statutory tax order history.
- **Regression Guard:** Covered by `EVAL-P7-04-B` in `scripts/test-eval-p7.ts`.

---

## 3. Edge Case Verification Matrix

Before production launch (Phase 7), each edge case in this document must have a corresponding verification test:

- [x] **EC-INV-01 (Zero-Oversell):** Verified via `scripts/load-test-stock.ts` (20 parallel requests for 1 item).
- [x] **EC-INV-02 (Abandoned Checkout):** Verified via TTL simulation and stock release verification.
- [x] **EC-PAY-01 (Webhook Ahead of Redirect):** Verified by firing webhook manually before client confirmation loads.
- [x] **EC-PAY-03 (Duplicate Webhook):** Verified by posting identical webhook payload twice; verify single order update.
- [x] **EC-CPN-01 (Multi-Tab Coupon):** Verified via parallel checkout script attempting identical single-use coupon.
- [x] **EC-MED-03 (EXIF Rotation):** Verified by uploading portrait smartphone photo; confirm proper upright WebP.
