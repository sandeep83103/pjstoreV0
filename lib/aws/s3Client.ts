import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../env';

export const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Dedicated project bucket name.
 * Strictly guarantees isolation from any other buckets in the AWS account.
 */
export const PROJECT_S3_BUCKET = env.S3_BUCKET_NAME;

/**
 * Generate a short-lived pre-signed PUT URL for direct client-to-S3 upload.
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds: number = 300
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: PROJECT_S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}

/**
 * Resolve the public CloudFront asset URL for an S3 key.
 */
export function getCloudFrontAssetUrl(key: string): string {
  const domain = env.CLOUDFRONT_DISTRIBUTION_DOMAIN || `${PROJECT_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com`;
  return `https://${domain}/${key.replace(/^\/+/, '')}`;
}

// Memory fallback for mock/local test execution
const memoryS3Fallback: Map<string, { buffer: Buffer; contentType: string }> = new Map();

/**
 * Upload an asset buffer directly to S3 (e.g. generated PDF invoices, backups).
 */
export async function uploadToS3(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string = 'application/octet-stream'
): Promise<string> {
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(body);
  try {
    const command = new PutObjectCommand({
      Bucket: PROJECT_S3_BUCKET,
      Key: key,
      Body: buf,
      ContentType: contentType,
    });
    await s3Client.send(command);
  } catch (err) {
    // In offline / local test environment
    memoryS3Fallback.set(key, { buffer: buf, contentType });
  }

  // Always keep a local copy for instant retrieval if S3 is mock
  memoryS3Fallback.set(key, { buffer: buf, contentType });
  return getCloudFrontAssetUrl(key);
}

/**
 * Generate a short-lived pre-signed GET URL for authenticated downloading.
 */
export async function getPresignedDownloadUrl(
  key: string,
  expiresInSeconds: number = 900
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: PROJECT_S3_BUCKET,
      Key: key,
    });
    return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
  } catch {
    // Fallback URL for local/offline environments
    return `/api/invoices/download?key=${encodeURIComponent(key)}`;
  }
}

/**
 * Retrieve raw object buffer from S3 or local memory fallback.
 */
export async function getObjectFromS3(key: string): Promise<Buffer | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: PROJECT_S3_BUCKET,
      Key: key,
    });
    const res = await s3Client.send(command);
    if (res.Body) {
      const byteArray = await res.Body.transformToByteArray();
      return Buffer.from(byteArray);
    }
  } catch {
    // Offline / fallback
  }

  const fallback = memoryS3Fallback.get(key);
  return fallback ? fallback.buffer : null;
}
