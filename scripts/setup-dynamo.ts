import {
  CreateTableCommand,
  DescribeTableCommand,
  CreateTableCommandInput,
  ResourceNotFoundException,
} from '@aws-sdk/client-dynamodb';
import { rawDynamoClient, getTableName } from '../lib/aws/dynamoClient';
import { env } from '../lib/env';

interface TableDefinition {
  name: string;
  input: CreateTableCommandInput;
}

const tableDefinitions: TableDefinition[] = [
  // 1. PRODUCTS
  {
    name: 'products',
    input: {
      TableName: getTableName('products'),
      BillingMode: 'PAY_PER_REQUEST',
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'slug', AttributeType: 'S' },
        { AttributeName: 'sku', AttributeType: 'S' },
        { AttributeName: 'categoryId', AttributeType: 'S' },
        { AttributeName: 'createdAt', AttributeType: 'S' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'slug-index',
          KeySchema: [{ AttributeName: 'slug', KeyType: 'HASH' }],
          Projection: { ProjectionType: 'ALL' },
        },
        {
          IndexName: 'sku-index',
          KeySchema: [{ AttributeName: 'sku', KeyType: 'HASH' }],
          Projection: { ProjectionType: 'ALL' },
        },
        {
          IndexName: 'category-createdAt-index',
          KeySchema: [
            { AttributeName: 'categoryId', KeyType: 'HASH' },
            { AttributeName: 'createdAt', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
        },
      ],
    },
  },

  // 2. CATEGORIES
  {
    name: 'categories',
    input: {
      TableName: getTableName('categories'),
      BillingMode: 'PAY_PER_REQUEST',
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'slug', AttributeType: 'S' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'slug-index',
          KeySchema: [{ AttributeName: 'slug', KeyType: 'HASH' }],
          Projection: { ProjectionType: 'ALL' },
        },
      ],
    },
  },

  // 3. ORDERS
  {
    name: 'orders',
    input: {
      TableName: getTableName('orders'),
      BillingMode: 'PAY_PER_REQUEST',
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'orderNo', AttributeType: 'S' },
        { AttributeName: 'userId', AttributeType: 'S' },
        { AttributeName: 'orderStatus', AttributeType: 'S' },
        { AttributeName: 'createdAt', AttributeType: 'S' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'orderNo-index',
          KeySchema: [{ AttributeName: 'orderNo', KeyType: 'HASH' }],
          Projection: { ProjectionType: 'ALL' },
        },
        {
          IndexName: 'userId-createdAt-index',
          KeySchema: [
            { AttributeName: 'userId', KeyType: 'HASH' },
            { AttributeName: 'createdAt', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
        },
        {
          IndexName: 'orderStatus-createdAt-index',
          KeySchema: [
            { AttributeName: 'orderStatus', KeyType: 'HASH' },
            { AttributeName: 'createdAt', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
        },
      ],
    },
  },

  // 4. USERS
  {
    name: 'users',
    input: {
      TableName: getTableName('users'),
      BillingMode: 'PAY_PER_REQUEST',
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'phone', AttributeType: 'S' },
        { AttributeName: 'email', AttributeType: 'S' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'phone-index',
          KeySchema: [{ AttributeName: 'phone', KeyType: 'HASH' }],
          Projection: { ProjectionType: 'ALL' },
        },
        {
          IndexName: 'email-index',
          KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
          Projection: { ProjectionType: 'ALL' },
        },
      ],
    },
  },

  // 5. COUPONS
  {
    name: 'coupons',
    input: {
      TableName: getTableName('coupons'),
      BillingMode: 'PAY_PER_REQUEST',
      KeySchema: [{ AttributeName: 'code', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'code', AttributeType: 'S' }],
    },
  },

  // 6. PAYMENTS
  {
    name: 'payments',
    input: {
      TableName: getTableName('payments'),
      BillingMode: 'PAY_PER_REQUEST',
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'orderId', AttributeType: 'S' },
        { AttributeName: 'providerRef', AttributeType: 'S' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'orderId-index',
          KeySchema: [{ AttributeName: 'orderId', KeyType: 'HASH' }],
          Projection: { ProjectionType: 'ALL' },
        },
        {
          IndexName: 'providerRef-index',
          KeySchema: [{ AttributeName: 'providerRef', KeyType: 'HASH' }],
          Projection: { ProjectionType: 'ALL' },
        },
      ],
    },
  },

  // 7. SETTINGS
  {
    name: 'settings',
    input: {
      TableName: getTableName('settings'),
      BillingMode: 'PAY_PER_REQUEST',
      KeySchema: [{ AttributeName: 'key', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'key', AttributeType: 'S' }],
    },
  },

  // 8. AUDIT LOGS
  {
    name: 'audit_logs',
    input: {
      TableName: getTableName('audit_logs'),
      BillingMode: 'PAY_PER_REQUEST',
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'entityId', AttributeType: 'S' },
        { AttributeName: 'timestamp', AttributeType: 'S' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'entityId-timestamp-index',
          KeySchema: [
            { AttributeName: 'entityId', KeyType: 'HASH' },
            { AttributeName: 'timestamp', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
        },
      ],
    },
  },
];

async function doesTableExist(tableName: string): Promise<boolean> {
  try {
    const res = await rawDynamoClient.send(new DescribeTableCommand({ TableName: tableName }));
    return res.Table?.TableStatus !== undefined;
  } catch (error) {
    if (error instanceof ResourceNotFoundException) {
      return false;
    }
    // If running in dry-run or mock mode where credentials might not connect, report error
    console.warn(`⚠️ Warning inspecting table ${tableName}:`, (error as Error).message);
    return false;
  }
}

export async function setupAllTables() {
  console.log(`\n🚀 Initializing DynamoDB tables in region [${env.AWS_REGION}] with prefix [${env.DYNAMO_TABLE_PREFIX}]...\n`);

  for (const def of tableDefinitions) {
    const tableName = def.input.TableName!;
    const exists = await doesTableExist(tableName);

    if (exists) {
      console.log(`✅ Table already exists: ${tableName}`);
    } else {
      try {
        console.log(`⏳ Creating table: ${tableName}...`);
        await rawDynamoClient.send(new CreateTableCommand(def.input));
        console.log(`✅ Table created successfully: ${tableName}`);
      } catch (err) {
        console.error(`❌ Failed to create table ${tableName}:`, (err as Error).message);
        throw err;
      }
    }
  }

  console.log('\n🎉 All 8 DynamoDB tables are configured and ready!\n');
}

// Run if called directly
if (require.main === module) {
  setupAllTables()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal setup error:', err);
      process.exit(1);
    });
}
