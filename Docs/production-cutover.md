# Production Cutover & Domain Mapping Guide — Parnika Jewellers

> Reference Specifications:
> - [problemstatement.md](file:///d:/PJStore%20V0/Docs/problemstatement.md)
> - [architecture.md](file:///d:/PJStore%20V0/Docs/architecture.md)
> - [implementationplan.md](file:///d:/PJStore%20V0/Docs/implementationplan.md)
> - [evals.md](file:///d:/PJStore%20V0/Docs/evals.md)

---

## 1. Domain & DNS Configuration (Route 53 & ACM)

### 1.1 SSL/TLS Certificate Provisioning (AWS Certificate Manager)
CloudFront distributions require SSL/TLS certificates issued in `us-east-1` (N. Virginia):

1. **Request Public Certificate:**
   ```bash
   aws acm request-certificate \
     --domain-name "pjstore.com" \
     --subject-alternative-names "*.pjstore.com" "assets.pjstore.com" \
     --validation-method DNS \
     --region us-east-1
   ```
2. **DNS CNAME Validation:**
   Add the generated validation CNAME records to the Route 53 hosted zone `pjstore.com`.
3. **Wait for Issuance:** Verify certificate status transitions to `ISSUED`.

### 1.2 Route 53 DNS Record Mapping
Configure Route 53 hosted zone records pointing to the CloudFront distribution:

| Record Name | Type | Routing Policy | Target / Value | Description |
|---|---|---|---|---|
| `pjstore.com` | `A (Alias)` | Simple | `dXXXXXXXXXXXXX.cloudfront.net` | Apex store domain (IPv4) |
| `pjstore.com` | `AAAA (Alias)` | Simple | `dXXXXXXXXXXXXX.cloudfront.net` | Apex store domain (IPv6) |
| `www.pjstore.com` | `CNAME` | Simple | `pjstore.com` | Canonical WWW redirect |
| `assets.pjstore.com` | `A (Alias)` | Simple | `dYYYYYYYYYYYYY.cloudfront.net` | Static S3 asset CDN (OAC) |

---

## 2. CloudFront & Origin Access Control (OAC) Configuration

### 2.1 Media & Invoices S3 Origin (`assets.pjstore.com`)
- **Origin Domain:** `parnika-jewellers-v0-prod.s3.ap-south-1.amazonaws.com`
- **Origin Access Control (OAC):** Enforce `Always` sign requests with SigV4.
- **S3 Bucket Policy:**
  ```json
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "AllowCloudFrontServicePrincipalReadOnly",
        "Effect": "Allow",
        "Principal": { "Service": "cloudfront.amazonaws.com" },
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::parnika-jewellers-v0-prod/*",
        "Condition": {
          "StringEquals": {
            "AWS:SourceArn": "arn:aws:cloudfront::ACCOUNT_ID:distribution/DISTRIBUTION_ID"
          }
        }
      }
    ]
  }
  ```
- **Block Public Access:** All 4 S3 Block Public Access toggles remain **Enabled** at all times.

### 2.2 Next.js Fullstack Application Origin (`pjstore.com`)
- **Default Cache Behavior (`/*`):**
  - Allowed Methods: `GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE`
  - Cache Policy: `Managed-CachingDisabled` (forward all headers & query parameters for SSR/API)
  - Origin Request Policy: `Managed-AllViewerExceptHostHeader`
- **Static Assets Cache Behavior (`/_next/static/*`, `/brand/*`):**
  - Cache Policy: `Managed-CachingOptimized` (`TTL: 31536000`, `Gzip: true`, `Brotli: true`)
- **Security Response Headers:**
  Enforce HSTS (`max-age=63072000`), CSP, X-Frame-Options (`SAMEORIGIN`), X-Content-Type-Options (`nosniff`).

---

## 3. Production Environment Checklist (`.env.production`)

Ensure all production environment variables are configured in the deployment environment:

```ini
# Application Core
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://pjstore.com

# AWS Production Infrastructure (ap-south-1)
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=AKIA...PROD_USER
AWS_SECRET_ACCESS_KEY=...PROD_SECRET
DYNAMO_TABLE_PREFIX=parnika_
S3_BUCKET_NAME=parnika-jewellers-v0-prod
CLOUDFRONT_DISTRIBUTION_DOMAIN=assets.pjstore.com

# Authentication & Sessions
JWT_SECRET=...SECURE_64_CHAR_HEX_TOKEN
ADMIN_BOOTSTRAP_EMAIL=owner@pjstore.com
ADMIN_BOOTSTRAP_PASSWORD=...SECURE_ADMIN_HASH

# Payments & Gateway
PAYMENT_PROVIDER=youpi
YOUPI_BASE_API_URL=https://pg.pjstore.com/api/v2
YOUPI_API_KEY=...YOUPI_PROD_KEY
YOUPI_WEBHOOK_SECRET=...YOUPI_HMAC_SECRET
YOUPI_MERCHANT_UPI_HANDLE=parnikajewellers@icici

# Licensed Fallback Gateway (Razorpay)
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...

# Logistics & Notifications
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_STORE_PHONE=+919876543210
SES_FROM_EMAIL=orders@pjstore.com
```

---

## 4. Disaster Recovery & Nightly Snapshot Deployment

### 4.1 EventBridge Nightly Rule Creation
Deploy the EventBridge scheduled rule triggering the backup script every night at 02:00 UTC (07:30 AM IST):

```bash
aws events put-rule \
  --name "ParnikaJewellers-Nightly-DynamoDB-Backup" \
  --schedule-expression "cron(0 2 * * ? *)" \
  --state ENABLED \
  --description "Nightly export of all 8 parnika_* DynamoDB tables to S3 gzip archives" \
  --region ap-south-1
```

### 4.2 Manual / On-Demand Backup Execution
To trigger an immediate backup snapshot on production:
```bash
npm run backup:tables
```

---

## 5. Post-Cutover Live Smoke Test Verification

Execute the automated end-to-end smoke test suite against the target production or staging URL:

```bash
npm run test:smoke-e2e
```

The smoke test verifies the 7 core customer and admin journeys:
1. Category navigation and catalog indexing (`/catalog`).
2. Multi-faceted filtering and search (`/catalog?category=...&minPrice=...`).
3. Product detail page loading and WhatsApp CTA generation (`/product/[slug]`).
4. Cart operations and atomic stock validation (`/cart`).
5. Coupon code validation and boundary calculation (`/api/coupons/validate`).
6. Checkout order placement and dynamic UPI session generation (`/api/checkout`).
7. Payment webhook processing, order status transition to `PAID`, and GST invoice generation.
8. DPDP compliance data erasure verification (`/api/account/privacy/erasure`).
