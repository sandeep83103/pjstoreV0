import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { productRepository, auditLogRepository, categoryRepository } from '@/lib/data';
import { ProductEditorForm } from '@/components/admin/ProductEditorForm';
import { ArrowLeft, Clock, History, ExternalLink } from 'lucide-react';
import { formatINR } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface AdminEditProductPageProps {
  params: {
    id: string;
  };
}

export default async function AdminEditProductPage({ params }: AdminEditProductPageProps) {
  const [product, categories, auditLogs] = await Promise.all([
    productRepository.findById(params.id),
    categoryRepository.list(),
    auditLogRepository.listByEntity(params.id, 20),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/inventory"
            className="p-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-[var(--color-primary-dark)]">
                Edit Product
              </h1>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                {product.sku}
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Update pricing, adjust stock balances, or upload gallery imagery.
            </p>
          </div>
        </div>

        <Link
          href={`/product/${product.slug}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 shadow-sm"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>View on Store</span>
        </Link>
      </div>

      {/* Interactive Client Product Editor Form */}
      <ProductEditorForm product={product} categories={categories} />

      {/* Audit Log Trail for this product */}
      <div className="p-6 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-[var(--color-accent-gold)]" />
          <h3 className="font-display font-bold text-sm text-[var(--color-primary-dark)]">
            Audit History &amp; Mutation Log (`parnika_audit_logs`)
          </h3>
        </div>

        {auditLogs.length === 0 ? (
          <p className="text-xs text-stone-400 py-3">
            No administrative mutations recorded yet for this product.
          </p>
        ) : (
          <div className="divide-y divide-stone-100 text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-3 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        log.action === 'PRICE_UPDATE'
                          ? 'bg-amber-100 text-amber-800'
                          : log.action === 'STOCK_UPDATE'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {log.action}
                    </span>
                    <span className="text-stone-500 font-mono text-[11px]">
                      By: {log.staffEmail || log.actorEmail}
                    </span>
                  </div>

                  {/* Diff Summary */}
                  {log.diff && (
                    <div className="text-[11px] text-stone-600 font-mono bg-stone-50 p-2 rounded-lg mt-1">
                      {Object.entries(log.diff).map(([k, v]) => (
                        <div key={k}>
                          <span className="text-stone-400">{k}:</span>{' '}
                          <span className="text-stone-800 font-semibold">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[11px] text-stone-400 shrink-0">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(log.timestamp).toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
