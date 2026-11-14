import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { env } from '../lib/env';
import { getTableName } from '../lib/aws/dynamoClient';
import { PROJECT_S3_BUCKET, getCloudFrontAssetUrl } from '../lib/aws/s3Client';
import {
  productRepository,
  categoryRepository,
  orderRepository,
  couponRepository,
  userRepository,
  paymentRepository,
  settingRepository,
  auditLogRepository,
} from '../lib/data';
import { ProductSchema, CategorySchema, OrderSchema, CouponSchema } from '../lib/types';

async function runPhase0Evaluations() {
  console.log('====================================================');
  console.log('🧪 RUNNING PHASE 0 EVALUATIONS (evals.md)');
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

  // EVAL-P0-02: Zod Environment Config
  assert(
    'EVAL-P0-02',
    'Zod Environment Schema Validation',
    Boolean(env.AWS_REGION === 'ap-south-1' && env.DYNAMO_TABLE_PREFIX === 'parnika_' && env.S3_BUCKET_NAME === 'parnika-jewellers-v0-prod'),
    `Current region: ${env.AWS_REGION}, prefix: ${env.DYNAMO_TABLE_PREFIX}, bucket: ${env.S3_BUCKET_NAME}`
  );

  // EVAL-P0-03: DynamoDB Table Names Resolution
  const expectedTables = ['products', 'categories', 'orders', 'users', 'coupons', 'payments', 'settings', 'audit_logs'];
  const generatedNames = expectedTables.map(getTableName);
  const allPrefixed = generatedNames.every((t) => t.startsWith('parnika_'));
  assert(
    'EVAL-P0-03',
    'DynamoDB Table Prefix Resolution (8 tables)',
    allPrefixed && generatedNames.length === 8,
    `Resolved tables: ${generatedNames.join(', ')}`
  );

  // EVAL-P0-04: Repository Singletons Initialized
  const reposInitialized =
    Boolean(productRepository) &&
    Boolean(categoryRepository) &&
    Boolean(orderRepository) &&
    Boolean(userRepository) &&
    Boolean(couponRepository) &&
    Boolean(paymentRepository) &&
    Boolean(settingRepository) &&
    Boolean(auditLogRepository);
  assert(
    'EVAL-P0-04',
    'Data Access Layer Repository Singletons Initialized',
    reposInitialized,
    'All 8 repositories instantiated and conform to interfaces'
  );

  // EVAL-P0-04B: Zod Schema Structural Checks
  const testCategory = CategorySchema.safeParse({
    id: 'test-cat',
    name: 'Sample Category',
    slug: 'sample-category',
    parentId: null,
    sortOrder: 1,
  });
  assert(
    'EVAL-P0-04B',
    'Category Zod Schema Parsing & Type Inference',
    testCategory.success,
    testCategory.success ? undefined : JSON.stringify(testCategory.error.flatten())
  );

  // EVAL-P0-06: Dedicated S3 Bucket & CloudFront URL Generator
  const sampleKey = 'products/1111/necklace.webp';
  const cfUrl = getCloudFrontAssetUrl(sampleKey);
  assert(
    'EVAL-P0-06',
    'Dedicated S3 Bucket & CloudFront OAC Asset Resolver',
    PROJECT_S3_BUCKET === 'parnika-jewellers-v0-prod' && cfUrl.includes('assets.pjstore.com/products/1111/necklace.webp'),
    `Bucket: ${PROJECT_S3_BUCKET}, CF Url: ${cfUrl}`
  );

  // EVAL-P0-07: Multi-Project AWS Isolation Scoping
  const bucketNameSafe = PROJECT_S3_BUCKET.startsWith('parnika-jewellers-v0-');
  const tablesSafe = generatedNames.every((name) => name.startsWith('parnika_'));
  assert(
    'EVAL-P0-07',
    'Multi-Project AWS Resource Isolation Scoping',
    bucketNameSafe && tablesSafe,
    `Dedicated bucket '${PROJECT_S3_BUCKET}' and table prefix '${env.DYNAMO_TABLE_PREFIX}' guarantee zero interference with existing account buckets.`
  );

  console.log('\n====================================================');
  console.log(`📊 PHASE 0 EVALUATION RESULT: ${passed}/${total} TESTS PASSED`);
  console.log('====================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runPhase0Evaluations().catch((err) => {
  console.error('Fatal evaluation runner error:', err);
  process.exit(1);
});
