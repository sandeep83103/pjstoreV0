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
