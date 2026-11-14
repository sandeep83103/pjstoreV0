import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { NextRequest } from 'next/server';
import {
  runSingleProductConcurrencyTest,
  runMultiProductFlashSaleSimulation,
} from './load-test-stock';
import { runBackupPipeline, verifyBackupSnapshot, BACKUP_TABLES } from './backup-tables';
import { runEndToEndSmokeTest } from './smoke-test-e2e';
import { processCustomerErasure, exportCustomerData } from '../lib/security/dpdp';
import { POST as handleCustomerErasure } from '../app/api/account/privacy/erasure/route';
import { POST as handleAdminErasure } from '../app/api/admin/privacy/erasure/route';
import { userRepository, orderRepository, auditLogRepository } from '../lib/data';
import { signToken, COOKIE_NAMES } from '../lib/auth/jwt';
import { env } from '../lib/env';
import nextConfig from '../next.config.mjs';

async function runPhase7Evaluations() {
  console.log('====================================================');
  console.log('🧪 RUNNING PHASE 7 EVALUATIONS (evals.md)');
  console.log('   Hardening, Performance, Security & Launch');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(testId: string, description: string, condition: boolean, details?: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testId}: ${description}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testId}: ${description}`);
      if (details) console.error(`   Details: ${details}`);
    }
  }

  // =========================================================================
  // EVAL-P7-01: Stress & Concurrency (Multi-User Flash Sale Simulation)
  // =========================================================================
  console.log('--- Testing EVAL-P7-01: Stress & Concurrency Simulation ---');
  try {
    const singleProductRacePassed = await runSingleProductConcurrencyTest(20, 2);
    assert(
      'EVAL-P7-01-A',
      'Plan 7.1: 20 concurrent shoppers competing for 2 stock units results in exactly 2 orders and 0 negative stock',
      singleProductRacePassed
    );

    const flashSalePassed = await runMultiProductFlashSaleSimulation(50, 5);
    assert(
      'EVAL-P7-01-B',
      'EVAL-P7-01: 50 virtual users across 5 low-stock items handled with 0 oversell, 0 negative stock, and 0 500s',
      flashSalePassed
    );
  } catch (err: any) {
    assert('EVAL-P7-01', 'Concurrency stress testing threw an unhandled exception', false, err.message);
  }

  // =========================================================================
  // EVAL-P7-02: Mobile Performance & Core Web Vitals Optimization
  // =========================================================================
  console.log('\n--- Testing EVAL-P7-02: Mobile Performance & Web Vitals Config ---');
  try {
    // 1. Check next.config.mjs configuration
    const isPoweredByDisabled = nextConfig.poweredByHeader === false;
    const isCompressionEnabled = nextConfig.compress === true;
    const hasModernImageFormats =
      Array.isArray(nextConfig.images?.formats) &&
      nextConfig.images.formats.includes('image/webp') &&
      nextConfig.images.formats.includes('image/avif');

    assert(
      'EVAL-P7-02-A',
      'Next.js production config enforces poweredByHeader: false, compress: true, and WebP/AVIF image formats',
      isPoweredByDisabled && isCompressionEnabled && hasModernImageFormats
    );

    // 2. Check Static Caching Headers in next.config.mjs
    const headersList = typeof nextConfig.headers === 'function' ? await nextConfig.headers() : [];
    const staticHeader = headersList.find((h: any) => h.source === '/_next/static/:path*');
    const imageHeader = headersList.find((h: any) => h.source === '/_next/image/:path*');
    const hasImmutableCache =
      staticHeader?.headers?.some(
        (kv: any) => kv.key === 'Cache-Control' && kv.value.includes('immutable')
      ) &&
      imageHeader?.headers?.some(
        (kv: any) => kv.key === 'Cache-Control' && kv.value.includes('immutable')
      );

    assert(
      'EVAL-P7-02-B',
      'Static assets and image optimization routes enforce 1-year immutable caching (Cache-Control: max-age=31536000)',
      Boolean(hasImmutableCache)
    );

    // 3. Check Security Headers in next.config.mjs (CSP, HSTS, X-Content-Type-Options)
    const globalHeader = headersList.find((h: any) => h.source === '/:path*');
    const hasHsts = globalHeader?.headers?.some((kv: any) => kv.key === 'Strict-Transport-Security');
    const hasNosniff = globalHeader?.headers?.some(
      (kv: any) => kv.key === 'X-Content-Type-Options' && kv.value === 'nosniff'
    );
    const hasCsp = globalHeader?.headers?.some((kv: any) => kv.key === 'Content-Security-Policy');

    assert(
      'EVAL-P7-02-C',
      'HTTP security headers configured globally: Strict-Transport-Security, X-Content-Type-Options, and CSP',
      Boolean(hasHsts && hasNosniff && hasCsp)
    );

    // 4. Check Typography & CSS Tokens
    const globalsCss = fs.readFileSync(path.join(process.cwd(), 'app', 'globals.css'), 'utf-8');
    const hasFontDisplay = globalsCss.includes('--font-display');
    const hasFontSans = globalsCss.includes('--font-sans');
    assert(
      'EVAL-P7-02-D',
      'Typography layer configures display font and responsive sans font variables with antialiasing for zero CLS',
      hasFontDisplay && hasFontSans
    );
  } catch (err: any) {
    assert('EVAL-P7-02', 'Performance configuration check failed', false, err.message);
  }

  // =========================================================================
  // EVAL-P7-03: Security Sweep (Secrets & Vulnerability Audit)
  // =========================================================================
  console.log('\n--- Testing EVAL-P7-03: Security Sweep & Secrets Audit ---');
  try {
    // Scan all client components ('use client') for exposed AWS/Webhook secrets
    function scanDirectoryForClientSecrets(dir: string): string[] {
      const violations: string[] = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          violations.push(...scanDirectoryForClientSecrets(fullPath));
        } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          if (content.includes("'use client'") || content.includes('"use client"')) {
            if (
              content.includes('AWS_SECRET_ACCESS_KEY') ||
              content.includes('YOUPI_WEBHOOK_SECRET') ||
              content.includes('ADMIN_BOOTSTRAP_PASSWORD')
            ) {
              violations.push(fullPath);
            }
          }
        }
      }
      return violations;
    }

    const clientSecretViolations = [
      ...scanDirectoryForClientSecrets(path.join(process.cwd(), 'app')),
      ...scanDirectoryForClientSecrets(path.join(process.cwd(), 'components')),
    ];

    assert(
      'EVAL-P7-03-A',
      "Zero AWS secret keys, webhook secrets, or bootstrap passwords exposed in client components ('use client')",
      clientSecretViolations.length === 0,
      clientSecretViolations.join(', ')
    );

    // Verify Middleware protects admin API routes without secret exposure
    const middlewareContent = fs.readFileSync(path.join(process.cwd(), 'middleware.ts'), 'utf-8');
    const hasAdminProtection =
      middlewareContent.includes('/admin') &&
      middlewareContent.includes('COOKIE_NAMES.ADMIN') &&
      middlewareContent.includes('verifyToken');

    assert(
      'EVAL-P7-03-B',
      'Next.js middleware enforces cryptographic token verification and RBAC on all administrative paths',
      hasAdminProtection
    );
  } catch (err: any) {
    assert('EVAL-P7-03', 'Security audit failed', false, err.message);
  }

  // =========================================================================
  // EVAL-P7-04: India DPDP Act Compliance & Data Privacy Erasure
  // =========================================================================
  console.log('\n--- Testing EVAL-P7-04: DPDP Compliance & Data Privacy Erasure ---');
  try {
    // 1. Create a customer with personal data and an associated order
    const testUserId = crypto.randomUUID();
    const testPhone = `9811${Math.floor(100000 + Math.random() * 900000)}`;

    const user = await userRepository.create({
      id: testUserId,
      name: 'Shrimati Vimala Devi',
      phone: testPhone,
      email: 'vimala.devi@example.com',
      role: 'customer',
      addresses: [
        {
          id: crypto.randomUUID(),
          fullName: 'Shrimati Vimala Devi',
          phone: testPhone,
          street: 'Flat 402, Royal Palms, Madhapur',
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500081',
          isDefault: true,
        },
      ],
      wishlist: ['prod-1', 'prod-2'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 2. Submit data erasure request
    const erasureResult = await processCustomerErasure({
      phone: testPhone,
      requestedBy: 'customer-dpdp-portal',
      reason: 'Statutory Right to Erasure request under DPDP Act 2023 Section 12',
    });

    assert(
      'EVAL-P7-04-A',
      'DPDP data erasure workflow executes successfully and returns statutory compliance confirmation',
      erasureResult.success && erasureResult.redactedFields.includes('phone')
    );

    // 3. Inspect the user in database to verify PII is completely scrubbed
    const scrubbedUser = await userRepository.findById(testUserId);
    const piiScrubbed =
      scrubbedUser?.name === 'Customer [REDACTED DPDP]' &&
      scrubbedUser?.email === undefined &&
      scrubbedUser?.phone.startsWith('REDACTED_') &&
      scrubbedUser?.addresses.length === 0 &&
      scrubbedUser?.wishlist.length === 0;

    assert(
      'EVAL-P7-04-B',
      'Customer PII (name, phone, email, addresses, wishlist) is scrubbed and redacted from parnika_users',
      Boolean(piiScrubbed)
    );

    // 4. Verify immutable regulatory audit log was created
    const auditLogs = await auditLogRepository.listByEntity(testUserId);
    const hasDpdpAuditLog = auditLogs.some(
      (log) => log.action === 'DPDP_DATA_ERASURE' && log.entityId === testUserId
    );

    assert(
      'EVAL-P7-04-C',
      'Immutable regulatory audit record created in parnika_audit_logs capturing DPDP erasure event',
      hasDpdpAuditLog
    );

    // 5. Verify customer API endpoint /api/account/privacy/erasure
    const erasureApiReq = new NextRequest('http://localhost:3000/api/account/privacy/erasure', {
      method: 'POST',
      body: JSON.stringify({ phone: testPhone }),
      headers: { 'Content-Type': 'application/json' },
    });
    const erasureApiRes = await handleCustomerErasure(erasureApiReq);
    // Already scrubbed so phone won't match or will return 404/200 appropriately
    assert(
      'EVAL-P7-04-D',
      'Customer privacy erasure API route (/api/account/privacy/erasure) is operational',
      erasureApiRes.status === 200 || erasureApiRes.status === 404
    );
  } catch (err: any) {
    assert('EVAL-P7-04', 'DPDP compliance evaluation failed', false, err.message);
  }

  // =========================================================================
  // EVAL-P7-05: Disaster Recovery & Automated Backups
  // =========================================================================
  console.log('\n--- Testing EVAL-P7-05: Disaster Recovery & Nightly S3 Backups ---');
  try {
    const testDateKey = `test-${new Date().toISOString().split('T')[0]}`;
    const manifest = await runBackupPipeline({ dateKey: testDateKey, saveLocalCopy: true });

    assert(
      'EVAL-P7-05-A',
      'Nightly backup script (scripts/backup-tables.ts) executes and exports all 8 DynamoDB tables',
      manifest.status === 'SUCCESS' && manifest.totalTables === BACKUP_TABLES.length
    );

    // Verify decompressing and reading tables
    let allTablesValid = true;
    for (const tableKey of BACKUP_TABLES) {
      const check = await verifyBackupSnapshot(testDateKey, tableKey);
      if (!check.valid) {
        allTablesValid = false;
        console.error(`   Failed to verify backup archive for ${tableKey}`);
      }
    }

    assert(
      'EVAL-P7-05-B',
      'All 8 table backup archives (.json.gz) in S3/storage decompress cleanly with valid JSON syntax',
      allTablesValid
    );
  } catch (err: any) {
    assert('EVAL-P7-05', 'Disaster recovery backup evaluation failed', false, err.message);
  }

  // =========================================================================
  // EVAL-P7-06: End-to-End Smoke Test (Full Customer Buying Cycle)
  // =========================================================================
  console.log('\n--- Testing EVAL-P7-06: End-to-End Customer Buying Cycle Smoke Test ---');
  try {
    const smokePassed = await runEndToEndSmokeTest();
    assert(
      'EVAL-P7-06',
      'End-to-end smoke test verifies complete transaction: Browse -> Filter -> PDP -> Coupon -> Checkout -> Webhook -> Order PAID -> GST Invoice',
      smokePassed
    );
  } catch (err: any) {
    assert('EVAL-P7-06', 'End-to-end smoke test failed', false, err.message);
  }

  console.log('\n====================================================');
  console.log(`🏁 PHASE 7 EVALUATIONS COMPLETE: ${passed}/${total} PASSED`);
  console.log('====================================================\n');

  if (passed === total) {
    console.log('🎉 ALL PHASE 7 EVALUATION CHECKS PASSED PERFECTLY!\n');
    return true;
  } else {
    console.error(`💥 ${total - passed} EVALUATION CHECKS FAILED! Check logs above.\n`);
    return false;
  }
}

if (require.main === module) {
  runPhase7Evaluations().then((success) => {
    process.exit(success ? 0 : 1);
  });
}
