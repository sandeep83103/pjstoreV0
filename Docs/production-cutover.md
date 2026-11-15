# Production Cutover & Domain Mapping Guide — Parnika Jewellers

> **Registered Domain:** `www.parnikajewellers.com` & `parnikajewellers.com` (GoDaddy)  
> **Hosting Platform:** AWS Amplify Hosting (Region: `ap-south-1` Mumbai)  
> **Media CDN:** Amazon CloudFront + S3 (`assets.parnikajewellers.com`)  
> **Reference Specifications:**
> - [problemstatement.md](file:///d:/PJStore%20V0/Docs/problemstatement.md)
> - [architecture.md](file:///d:/PJStore%20V0/Docs/architecture.md)
> - [implementationplan.md](file:///d:/PJStore%20V0/Docs/implementationplan.md)
> - [evals.md](file:///d:/PJStore%20V0/Docs/evals.md)
> - [usageguide.md](file:///d:/PJStore%20V0/Docs/usageguide.md)

---

## 1. Domain & DNS Configuration (GoDaddy & AWS Amplify)

### 1.1 Custom Domain Connection in AWS Amplify
1. Open the [AWS Amplify Console](https://console.aws.amazon.com/amplify) in **ap-south-1 (Mumbai)**.
2. Select the app (`Parnika Jewellers` / `pjstoreV0`).
3. Under **Hosting**, navigate to **Custom domains** $\rightarrow$ click **Add domain**.
4. Enter `parnikajewellers.com`.
5. Configure the domain routing:
   - `www.parnikajewellers.com` $\rightarrow$ points to branch `main` (Primary)
   - `parnikajewellers.com` $\rightarrow$ redirects to `https://www.parnikajewellers.com`
6. Click **Save**. AWS Amplify automatically:
   - Generates the SSL/TLS certificate request via Amazon Trust Services.
   - Provides DNS validation records for GoDaddy.

### 1.2 GoDaddy DNS Record Configuration
Log in to your **GoDaddy DNS Management Console** for `parnikajewellers.com` and add/update the records provided by Amplify:

| Record Type | Host / Name | Value / Points to | TTL | Purpose |
|---|---|---|---|---|
| `CNAME` | `www` | `dXXXXXXXXXXXXX.cloudfront.net` *(from Amplify)* | 1 Hour / Automatic | Directs WWW traffic to your live Next.js store on Amplify |
| `CNAME` | `_cname...` *(from Amplify)* | `_...acm-validations.aws` *(from Amplify)* | 1 Hour | Automated SSL certificate issuance & auto-renewal |
| `CNAME` | `assets` | `dYYYYYYYYYYYYY.cloudfront.net` | 1 Hour | CloudFront CDN for S3 product imagery & invoices |
| `Forwarding` | `@` (Apex) | `https://www.parnikajewellers.com` (301 Permanent) | Default | Redirects bare `parnikajewellers.com` to `www.parnikajewellers.com` |

---

## 2. CloudFront & Origin Access Control (OAC) Configuration

### 2.1 Media & Invoices S3 Origin (`assets.parnikajewellers.com`)
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

### 2.2 Next.js Fullstack Application on Amplify (`www.parnikajewellers.com`)
- **Caching & SSR:** Server-Side Rendering (SSR) and dynamic API route handlers (`/api/*`) execute in AWS Mumbai (`ap-south-1`).
- **Static Assets (`/_next/static/*`, `/brand/*`):** Cached globally on CloudFront edge locations (`TTL: 31536000`, immutable).
- **Security Response Headers:** Enforced globally:
  - HSTS: `max-age=63072000; includeSubDomains; preload`
  - CSP: `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https: *.cloudfront.net assets.parnikajewellers.com www.parnikajewellers.com; font-src 'self' data: https:; connect-src 'self' https:; frame-ancestors 'none';`
  - X-Frame-Options: `SAMEORIGIN`
  - X-Content-Type-Options: `nosniff`

---

## 3. Production Environment Checklist (Amplify Console)

Configure these environment variables in **AWS Amplify Console $\rightarrow$ App settings $\rightarrow$ Environment variables**:

```ini
# Application Core
NODE_ENV=production
NEXT_PUBLIC_STORE_URL=https://www.parnikajewellers.com

# AWS Production Infrastructure (ap-south-1 Mumbai)
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=AKIA...PROD_USER
AWS_SECRET_ACCESS_KEY=...PROD_SECRET
DYNAMO_TABLE_PREFIX=parnika_
S3_BUCKET_NAME=parnika-jewellers-v0-prod
CLOUDFRONT_DISTRIBUTION_DOMAIN=assets.parnikajewellers.com

# Authentication & Admin
JWT_SECRET=...SECURE_64_CHAR_HEX_TOKEN
ADMIN_BOOTSTRAP_EMAIL=admin@parnikajewellers.com
ADMIN_BOOTSTRAP_PASSWORD=...SECURE_ADMIN_PASSWORD

# Payments & Gateway (YOUPI PG / Dynamic UPI QR)
PAYMENT_PROVIDER=youpi
YOUPI_BASE_API_URL=https://pg.parnikajewellers.com
YOUPI_API_KEY=...YOUPI_PROD_KEY
YOUPI_WEBHOOK_SECRET=...YOUPI_HMAC_SECRET
YOUPI_MERCHANT_UPI_HANDLE=parnikajewellers@icici

# Fallback Gateway (Razorpay - Optional)
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...

# Logistics & Notifications
WHATSAPP_STORE_NUMBER=+919876543210
SMTP_HOST=email-smtp.ap-south-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
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

Execute the automated end-to-end smoke test suite to verify all critical store flows:

```bash
npm run test:smoke-e2e
```

The smoke test verifies the core customer and admin journeys:
1. Category navigation and catalog indexing (`/catalog`).
2. Multi-faceted filtering and search (`/catalog?category=...&minPrice=...`).
3. Product detail page loading and WhatsApp CTA generation (`/product/[slug]`).
4. Cart operations and atomic stock validation (`/cart`).
5. Coupon code validation and boundary calculation (`/api/coupons/validate`).
6. Checkout order placement and dynamic UPI session generation (`/api/checkout`).
7. Payment webhook processing, order status transition to `PAID`, and GST invoice generation.
8. DPDP compliance data erasure verification (`/api/account/privacy/erasure`).
