import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { getPresignedUploadUrl, getCloudFrontAssetUrl } from '@/lib/aws/s3Client';
import { handleApiError, ValidationError } from '@/lib/errors';

const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

const signUploadSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  contentType: z.string().min(1, 'Content type is required'),
  fileSize: z.number().int().positive('File size must be positive'),
  productId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = signUploadSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input payload.',
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { filename, contentType, fileSize, productId } = parsed.data;

    // MIME Type Validation (Strictly image/jpeg, image/png, image/webp)
    if (!ALLOWED_CONTENT_TYPES.includes(contentType as (typeof ALLOWED_CONTENT_TYPES)[number])) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_FILE_TYPE',
            message: `Unsupported file type '${contentType}'. Only image/jpeg, image/png, and image/webp are permitted.`,
          },
        },
        { status: 400 }
      );
    }

    // File Size Validation (<= 10MB)
    if (fileSize > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: `File size (${(fileSize / (1024 * 1024)).toFixed(2)}MB) exceeds maximum allowed limit of 10MB.`,
          },
        },
        { status: 400 }
      );
    }

    // Sanitize filename and construct isolated S3 key
    const sanitizedFilename = filename
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '-')
      .replace(/-+/g, '-');

    const folderPrefix = productId ? `products/${productId}` : 'products/temp';
    const uniqueId = crypto.randomUUID();
    const key = `${folderPrefix}/${uniqueId}-${sanitizedFilename}`;

    const expiresInSeconds = 300; // 5-minute expiry
    const uploadUrl = await getPresignedUploadUrl(key, contentType, expiresInSeconds);
    const assetUrl = getCloudFrontAssetUrl(key);

    return NextResponse.json(
      {
        success: true,
        data: {
          uploadUrl,
          key,
          assetUrl,
          expiresIn: expiresInSeconds,
          contentType,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
