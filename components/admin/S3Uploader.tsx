'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, X, Image as ImageIcon } from 'lucide-react';

interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  errorMessage?: string;
  key?: string;
  assetUrl?: string;
}

interface S3UploaderProps {
  productId?: string;
  onUploadSuccess?: (result: { key: string; assetUrl: string; filename: string }) => void;
  maxFileSizeMB?: number;
}

export function S3Uploader({
  productId,
  onUploadSuccess,
  maxFileSizeMB = 10,
}: S3UploaderProps) {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024;
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newItems: UploadItem[] = [];

    Array.from(files).forEach((file) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // Immediate Client-Side Validation
      if (!allowedMimeTypes.includes(file.type)) {
        newItems.push({
          id,
          file,
          progress: 0,
          status: 'error',
          errorMessage: 'Invalid file format. Only JPEG, PNG, and WebP are allowed.',
        });
        return;
      }

      if (file.size > maxFileSizeBytes) {
        newItems.push({
          id,
          file,
          progress: 0,
          status: 'error',
          errorMessage: `File size exceeds ${maxFileSizeMB}MB limit.`,
        });
        return;
      }

      newItems.push({
        id,
        file,
        progress: 0,
        status: 'pending',
      });
    });

    setUploads((prev) => [...prev, ...newItems]);

    // Start upload for valid pending items
    newItems
      .filter((item) => item.status === 'pending')
      .forEach((item) => executeUpload(item));
  };

  const executeUpload = async (item: UploadItem) => {
    try {
      updateItemStatus(item.id, { status: 'uploading', progress: 10 });

      // 1. Request Short-lived Pre-Signed S3 PUT URL
      const signRes = await fetch('/api/admin/uploads/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: item.file.name,
          contentType: item.file.type,
          fileSize: item.file.size,
          productId,
        }),
      });

      const signJson = await signRes.json();

      if (!signRes.ok || !signJson.success) {
        throw new Error(signJson.error?.message || 'Failed to sign upload request.');
      }

      const { uploadUrl, key, assetUrl } = signJson.data;

      // 2. Direct Client-to-S3 Binary Upload via XMLHttpRequest for Accurate Progress
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl, true);
      xhr.setRequestHeader('Content-Type', item.file.type);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 90) + 10;
          updateItemStatus(item.id, { progress: Math.min(percent, 98) });
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          updateItemStatus(item.id, {
            status: 'completed',
            progress: 100,
            key,
            assetUrl,
          });
          if (onUploadSuccess) {
            onUploadSuccess({ key, assetUrl, filename: item.file.name });
          }
        } else {
          updateItemStatus(item.id, {
            status: 'error',
            errorMessage: `S3 upload failed with HTTP status ${xhr.status}`,
          });
        }
      };

      xhr.onerror = () => {
        updateItemStatus(item.id, {
          status: 'error',
          errorMessage: 'Network error occurred during S3 media upload.',
        });
      };

      xhr.send(item.file);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed.';
      updateItemStatus(item.id, {
        status: 'error',
        errorMessage: msg,
      });
    }
  };

  const updateItemStatus = (id: string, updates: Partial<UploadItem>) => {
    setUploads((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const removeItem = (id: string) => {
    setUploads((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="w-full space-y-4">
      {/* Drag & Drop Surface */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/5'
            : 'border-stone-300 hover:border-[var(--color-accent-gold)] bg-stone-50/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="flex flex-col items-center justify-center gap-2">
          <div className="p-3 rounded-full bg-[var(--color-primary-base)] text-[var(--color-accent-light-gold)] shadow-sm">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-stone-800">
            Click to upload jewellery imagery or drag &amp; drop
          </p>
          <p className="text-xs text-stone-500">
            Direct-to-S3 • Supported: JPEG, PNG, WebP • Max 10MB per file
          </p>
        </div>
      </div>

      {/* Uploads Progress List */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-lg border border-stone-200 bg-white text-xs"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                <ImageIcon className="w-5 h-5 text-stone-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-medium text-stone-800 truncate">{item.file.name}</p>
                    <span className="text-stone-500 shrink-0 ml-2">
                      {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>

                  {/* Progress Bar */}
                  {item.status === 'uploading' && (
                    <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-[var(--color-accent-gold)] h-full transition-all duration-300"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}

                  {/* Error Message */}
                  {item.status === 'error' && (
                    <p className="text-red-600 flex items-center gap-1 mt-0.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {item.errorMessage}
                    </p>
                  )}

                  {/* Success State */}
                  {item.status === 'completed' && (
                    <p className="text-emerald-700 flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      Direct S3 upload verified • CloudFront ready
                    </p>
                  )}
                </div>
              </div>

              {/* Action */}
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="text-stone-400 hover:text-stone-700 p-1"
                aria-label="Remove item"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
