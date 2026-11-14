import { z } from 'zod';
import dotenv from 'dotenv';

if (typeof window === 'undefined') {
  dotenv.config({ path: '.env.local' });
  dotenv.config();
}

const envSchema = z.object({
  // AWS Configuration (ap-south-1 Mumbai)
  AWS_REGION: z.string().default('ap-south-1'),
  AWS_ACCESS_KEY_ID: z.string().min(1, 'AWS_ACCESS_KEY_ID is required'),
  AWS_SECRET_ACCESS_KEY: z.string().min(1, 'AWS_SECRET_ACCESS_KEY is required'),
  DYNAMO_TABLE_PREFIX: z.string().default('parnika_'),
  S3_BUCKET_NAME: z.string().default('parnika-jewellers-v0-prod'),
  CLOUDFRONT_DISTRIBUTION_DOMAIN: z.string().optional().default('assets.pjstore.com'),
  DYNAMODB_ENDPOINT: z.string().url().optional(),

  // Authentication & Security
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters').default('dev-insecure-jwt-secret-min-16-characters'),
  ADMIN_BOOTSTRAP_EMAIL: z.string().email().default('admin@pjstore.com'),
  ADMIN_BOOTSTRAP_PASSWORD: z.string().min(8).default('admin123456'),

  // Payment Providers
  PAYMENT_PROVIDER: z.enum(['youpi', 'razorpay', 'cod']).default('youpi'),
  YOUPI_BASE_API_URL: z.string().url().optional().default('https://pg.pjstore.com'),
  YOUPI_API_KEY: z.string().optional().default('test_youpi_key'),
  YOUPI_WEBHOOK_SECRET: z.string().optional().default('test_youpi_webhook_secret'),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),

  // Notifications & Contacts
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_STORE_NUMBER: z.string().default('+919876543210'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  NEXT_PUBLIC_STORE_URL: z.string().url().default('https://pjstore.com'),
});

export type Env = z.infer<typeof envSchema>;

let parsedEnv: Env;

try {
  parsedEnv = envSchema.parse(process.env);
} catch (error) {
  if (process.env.NODE_ENV === 'test' || process.env.SKIP_ENV_VALIDATION === 'true') {
    // Return dummy values in test mode if variables missing
    parsedEnv = envSchema.parse({
      AWS_ACCESS_KEY_ID: 'dummy_access_key',
      AWS_SECRET_ACCESS_KEY: 'dummy_secret_key',
      ...process.env,
    });
  } else {
    console.error('❌ Invalid or missing environment variables:');
    if (error instanceof z.ZodError) {
      console.error(JSON.stringify(error.flatten().fieldErrors, null, 2));
    }
    throw error;
  }
}

export const env = parsedEnv;
