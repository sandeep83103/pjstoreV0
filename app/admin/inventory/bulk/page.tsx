'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Package,
} from 'lucide-react';

interface RowError {
  row: number;
  error: string;
}

interface BulkImportResult {
  insertedCount: number;
  failedCount: number;
  errors: RowError[];
}

export default function BulkCatalogImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.name.endsWith('.csv')) {
        setError('Please upload a valid .csv spreadsheet file.');
        return;
      }
      setFile(selected);
      setError(null);
      setResult(null);

      const reader = new FileReader();
      reader.onload = (event) => {
        setCsvContent(event.target?.result as string);
      };
      reader.readAsText(selected);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      if (!dropped.name.endsWith('.csv')) {
        setError('Only .csv files are supported.');
        return;
      }
      setFile(dropped);
      setError(null);
      setResult(null);

      const reader = new FileReader();
      reader.onload = (event) => {
        setCsvContent(event.target?.result as string);
      };
      reader.readAsText(dropped);
    }
  };

  const handleImport = async () => {
    if (!csvContent) {
      setError('Please select a CSV file first.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const res = await fetch('/api/admin/inventory/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText: csvContent }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to process CSV import.');
      }

      setResult(json.data);
      setIsSubmitting(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Import failed.';
      setError(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/inventory"
            className="p-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold text-[var(--color-primary-dark)]">
              Bulk Catalog CSV Import
            </h1>
            <p className="text-xs text-stone-500">
              Batch import up to hundreds of products with atomic DynamoDB BatchWriteItem writes.
            </p>
          </div>
        </div>

        {/* Download CSV Template Button */}
        <a
          href="/api/admin/inventory/bulk"
          download="sample-jewellery-template.csv"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-[var(--color-accent-gold)]" />
          <span>Download Template</span>
        </a>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Zone */}
      <div className="p-6 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-6">
        <div>
          <h3 className="font-display font-bold text-sm text-[var(--color-primary-dark)] mb-1">
            Upload CSV Catalogue File
          </h3>
          <p className="text-xs text-stone-500">
            Standard headers: <code className="bg-stone-100 px-1 py-0.5 rounded font-mono text-[11px]">title, sku, supplierCode, category, price, mrp, costPrice, stock, imageUrls, description</code>
          </p>
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-stone-300 hover:border-[var(--color-accent-gold)] rounded-2xl p-8 text-center cursor-pointer bg-stone-50/50 hover:bg-amber-50/20 transition-all flex flex-col items-center justify-center gap-3"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="p-3.5 rounded-full bg-[var(--color-primary-base)] text-[var(--color-accent-light-gold)] shadow-sm">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-800">
              {file ? file.name : 'Click to select CSV file or drag and drop here'}
            </p>
            <p className="text-xs text-stone-400 mt-1">
              Supports UTF-8 CSV exports from Excel, Google Sheets, or supplier systems
            </p>
          </div>
        </div>

        {/* Selected File Details & Actions */}
        {file && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-stone-500" />
              <div>
                <p className="font-semibold text-stone-800">{file.name}</p>
                <p className="text-stone-400 text-[11px]">
                  {(file.size / 1024).toFixed(1)} KB • {csvContent.split('\n').filter(Boolean).length - 1} rows detected
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleImport}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[var(--color-primary-base)] hover:bg-[var(--color-primary-dark)] text-[var(--color-accent-light-gold)] font-semibold text-xs shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Package className="w-4 h-4" />
              <span>{isSubmitting ? 'Parsing & Batching...' : 'Start Bulk Import'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Result & Detailed Error Summary Modal/Section */}
      {result && (
        <div className="p-6 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-display font-bold text-base text-[var(--color-primary-dark)]">
                Bulk Import Execution Summary
              </h3>
            </div>
            <Link
              href="/admin/inventory"
              className="text-xs font-semibold text-[var(--color-primary-base)] hover:underline"
            >
              View in Inventory &rarr;
            </Link>
          </div>

          {/* Counts */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-xs font-medium text-emerald-800 uppercase tracking-wider">
                Successfully Inserted
              </span>
              <p className="font-display text-3xl font-bold text-emerald-900 mt-1">
                {result.insertedCount}
              </p>
              <span className="text-[11px] text-emerald-700">
                Live in DynamoDB `parnika_products`
              </span>
            </div>

            <div
              className={`p-4 rounded-xl border ${
                result.failedCount > 0
                  ? 'bg-red-50 border-red-200'
                  : 'bg-stone-50 border-stone-200'
              }`}
            >
              <span
                className={`text-xs font-medium uppercase tracking-wider ${
                  result.failedCount > 0 ? 'text-red-800' : 'text-stone-500'
                }`}
              >
                Rejected / Failed Rows
              </span>
              <p
                className={`font-display text-3xl font-bold mt-1 ${
                  result.failedCount > 0 ? 'text-red-900' : 'text-stone-700'
                }`}
              >
                {result.failedCount}
              </p>
              <span
                className={`text-[11px] ${
                  result.failedCount > 0 ? 'text-red-700' : 'text-stone-400'
                }`}
              >
                {result.failedCount > 0
                  ? 'Skipped due to validation issues'
                  : 'Zero validation errors'}
              </span>
            </div>
          </div>

          {/* Error Details Table if any rows were rejected */}
          {result.errors.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-red-700 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                Row-Level Validation Error Details:
              </h4>

              <div className="border border-red-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-red-50/70 border-b border-red-200 text-red-900 font-bold">
                    <tr>
                      <th className="py-2.5 px-4 w-24">Row #</th>
                      <th className="py-2.5 px-4">Failure Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-100 bg-white">
                    {result.errors.map((err) => (
                      <tr key={err.row} className="hover:bg-red-50/40">
                        <td className="py-2.5 px-4 font-mono font-bold text-red-700">
                          Row {err.row}
                        </td>
                        <td className="py-2.5 px-4 text-stone-700">{err.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
