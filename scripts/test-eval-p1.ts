import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { signToken, verifyToken, COOKIE_NAMES } from '../lib/auth/jwt';
import { hashPassword, comparePassword } from '../lib/auth/password';
import { env } from '../lib/env';
import fs from 'fs';
import path from 'path';

async function runPhase1Evaluations() {
  console.log('====================================================');
  console.log('🧪 RUNNING PHASE 1 EVALUATIONS (evals.md)');
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

  // EVAL-P1-01: Brand Tokens Integrity
  const tokensCssPath = path.join(process.cwd(), 'styles/tokens.css');
  const tokensContent = fs.readFileSync(tokensCssPath, 'utf8');
  const hasEmerald = tokensContent.includes('#0B3B24');
  const hasEmeraldDark = tokensContent.includes('#062617');
  const hasGold = tokensContent.includes('#D4AF37');
  const hasRuby = tokensContent.includes('#9B111E');
  const hasIvory = tokensContent.includes('#FCFBF7');
  assert(
    'EVAL-P1-01',
    'Brand Theme Tokens (Emerald, Gold, Ruby, Ivory) in tokens.css',
    hasEmerald && hasEmeraldDark && hasGold && hasRuby && hasIvory,
    `Found emerald: ${hasEmerald}, gold: ${hasGold}, ruby: ${hasRuby}, ivory: ${hasIvory}`
  );

  // EVAL-P1-02: Public Brand Logo Asset Present
  const logoPath = path.join(process.cwd(), 'public/brand/logo.png');
  const logoExists = fs.existsSync(logoPath);
  assert(
    'EVAL-P1-02',
    'Brand Logo Asset Installed at /public/brand/logo.png',
    logoExists,
    `Logo exists: ${logoExists}`
  );

  // EVAL-P1-03: Customer Auth JWT Token Lifecycle
  const customerPayload = {
    userId: 'cust-1234-uuid',
    phone: '9876543210',
    email: 'customer@pjstore.com',
    role: 'customer' as const,
  };
  const customerToken = await signToken(customerPayload, '30d');
  const decodedCustomer = await verifyToken(customerToken);
  assert(
    'EVAL-P1-03',
    'Customer Stateless JWT Session Generation & Jose Verification',
    Boolean(decodedCustomer && decodedCustomer.userId === customerPayload.userId && decodedCustomer.role === 'customer'),
    `Decoded role: ${decodedCustomer?.role}, id: ${decodedCustomer?.userId}`
  );

  // EVAL-P1-04: Admin Bootstrap & Password Hashing
  const rawAdminPassword = env.ADMIN_BOOTSTRAP_PASSWORD;
  const hashedPassword = await hashPassword(rawAdminPassword);
  const passwordValid = await comparePassword(rawAdminPassword, hashedPassword);
  const passwordInvalid = await comparePassword('wrong-password', hashedPassword);
  
  const adminPayload = {
    userId: 'admin-bootstrap-id',
    email: env.ADMIN_BOOTSTRAP_EMAIL,
    role: 'admin' as const,
  };
  const adminToken = await signToken(adminPayload, '8h');
  const decodedAdmin = await verifyToken(adminToken);

  assert(
    'EVAL-P1-04',
    'Admin Bootstrap Credential Verification & Bcrypt Hashing',
    passwordValid && !passwordInvalid && Boolean(decodedAdmin && decodedAdmin.role === 'admin'),
    `Admin email: ${decodedAdmin?.email}, verified: ${passwordValid}`
  );

  // EVAL-P1-05: RBAC Role Separation Guard
  const isCustomerAdmin = decodedCustomer?.role === 'admin';
  const isAdminAdmin = decodedAdmin?.role === 'admin';
  assert(
    'EVAL-P1-05',
    'RBAC Role Separation (Customer cannot act as Admin)',
    !isCustomerAdmin && isAdminAdmin,
    `Customer role acting as admin: ${isCustomerAdmin}, Admin role acting as admin: ${isAdminAdmin}`
  );

  console.log('\n====================================================');
  console.log(`📊 PHASE 1 EVALUATION RESULT: ${passed}/${total} TESTS PASSED`);
  console.log('====================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runPhase1Evaluations().catch((err) => {
  console.error('Fatal evaluation runner error:', err);
  process.exit(1);
});
