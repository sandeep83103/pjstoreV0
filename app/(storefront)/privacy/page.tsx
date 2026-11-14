'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  FileText,
  UserCheck,
  Trash2,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';

export default function PrivacyPolicyPage() {
  const [phoneInput, setPhoneInput] = useState('');
  const [reasonInput, setReasonInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responseMessage, setResponseMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);

  const handleErasureRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setResponseMessage(null);
    setIsSuccess(null);

    const clean = phoneInput.replace(/\D/g, '');
    if (clean.length < 10) {
      setIsSuccess(false);
      setResponseMessage('Please enter a valid 10-digit Indian phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/account/privacy/erasure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: clean.slice(-10),
          reason: reasonInput || 'Customer requested data erasure via Privacy Portal',
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setIsSuccess(true);
        setResponseMessage(
          json.data?.message ||
            'Your personal information (name, address, phone) has been successfully scrubbed from our active customer records.'
        );
        setPhoneInput('');
        setReasonInput('');
      } else {
        setIsSuccess(false);
        setResponseMessage(
          json.error?.message ||
            'Unable to locate an active account for that phone number. Please check the digits and try again.'
        );
      }
    } catch {
      setIsSuccess(false);
      setResponseMessage('A network error occurred while submitting your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Header */}
      <div className="text-center space-y-3 mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>India DPDP Act 2023 Compliance</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-stone-900">
          Privacy Policy &amp; Data Protection
        </h1>
        <p className="text-sm sm:text-base text-stone-600 max-w-2xl mx-auto">
          Parnika Jewellers is committed to safeguarding your personal data in accordance with the
          Digital Personal Data Protection (DPDP) Act, 2023 and Indian regulatory guidelines.
        </p>
        <p className="text-xs text-stone-400">Last Updated &amp; Effective Date: November 2026</p>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm p-6 sm:p-10 space-y-10 text-stone-700 leading-relaxed text-sm sm:text-base">
        {/* Section 1: Data Fiduciary */}
        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold text-stone-900 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[var(--color-primary-base)] text-[var(--color-accent-light-gold)] flex items-center justify-center text-xs">
              1
            </span>
            Data Fiduciary Identity
          </h2>
          <p>
            <strong>Parnika Jewellers</strong> (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates as the
            Data Fiduciary responsible for deciding the purpose and means of processing personal data collected through
            the website <code>https://pjstore.com</code>.
          </p>
          <div className="bg-stone-50 border border-stone-200/60 rounded-xl p-4 text-xs sm:text-sm space-y-1">
            <p><strong>Business Name:</strong> Parnika Jewellers</p>
            <p><strong>GSTIN:</strong> 36ABCDE1234F1Z5 (Registered in Telangana, India)</p>
            <p><strong>HSN Code:</strong> 7117 (Imitation &amp; One-Gram Gold Jewellery)</p>
            <p><strong>Registered Address:</strong> Jubilee Hills, Hyderabad, Telangana - 500033, India</p>
          </div>
        </section>

        {/* Section 2: What Data We Collect */}
        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold text-stone-900 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[var(--color-primary-base)] text-[var(--color-accent-light-gold)] flex items-center justify-center text-xs">
              2
            </span>
            Categories of Personal Data Collected
          </h2>
          <p>
            We adhere to the principle of <em>Data Minimisation</em>. We collect only what is strictly necessary to
            deliver your jewellery orders and meet statutory tax compliance:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-xs sm:text-sm">
            <li>
              <strong>Contact Identifiers:</strong> Name, 10-digit mobile phone number, and email address (used for
              order confirmation, dispatch alerts, and digital tax invoices).
            </li>
            <li>
              <strong>Delivery Coordinates:</strong> Street address, landmark, city, state, and postal pincode for
              courier dispatch.
            </li>
            <li>
              <strong>Order &amp; Payment Records:</strong> Unique Order Number, purchase summary, transaction
              reference (UPI/PG Provider Reference), and payment status. <em>We never store credit/debit card numbers or UPI MPINs.</em>
            </li>
            <li>
              <strong>Technical Telemetry:</strong> Anonymized session cookies and IP addresses necessary for cart
              state persistence and fraud prevention.
            </li>
          </ul>
        </section>

        {/* Section 3: Legal Basis & Purpose */}
        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold text-stone-900 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[var(--color-primary-base)] text-[var(--color-accent-light-gold)] flex items-center justify-center text-xs">
              3
            </span>
            Purposes of Data Processing &amp; Lawful Basis
          </h2>
          <p>
            Under Section 4 and Section 6 of the DPDP Act 2023, your personal data is processed solely for lawful
            purposes with your explicit consent:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="border border-stone-200 rounded-xl p-4 bg-stone-50">
              <h3 className="font-bold text-stone-900 text-sm mb-1">Contractual Fulfillment</h3>
              <p className="text-xs text-stone-600">
                Processing orders, reserving real-time stock, packing shipments, and coordinating delivery with verified
                courier partners (Delhivery, Shiprocket, India Post).
              </p>
            </div>
            <div className="border border-stone-200 rounded-xl p-4 bg-stone-50">
              <h3 className="font-bold text-stone-900 text-sm mb-1">Statutory Tax Compliance</h3>
              <p className="text-xs text-stone-600">
                Generating GST-compliant tax invoices under Section 31 and maintaining transaction records under Section
                36 of the Central Goods and Services Tax (CGST) Act 2017.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Data Retention & Statutory Limits */}
        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold text-stone-900 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[var(--color-primary-base)] text-[var(--color-accent-light-gold)] flex items-center justify-center text-xs">
              4
            </span>
            Data Retention &amp; Statutory Tax Requirements
          </h2>
          <p>
            Your personal information is retained only as long as necessary to fulfill the commercial transaction or as
            mandated by Indian law:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-xs sm:text-sm">
            <li>
              <strong>Active Account Profile:</strong> Retained until you request data erasure or terminate your
              account.
            </li>
            <li>
              <strong>Tax &amp; GST Invoices:</strong> Retained for a mandatory statutory period of <strong>72 months
              (6 years)</strong> pursuant to Section 36 of the CGST Act 2017. Upon an approved DPDP erasure request,
              your active profile PII is scrubbed, while anonymized statutory order ledgers remain archived for tax audits.
            </li>
          </ul>
        </section>

        {/* Section 5: Data Principal Rights */}
        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold text-stone-900 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[var(--color-primary-base)] text-[var(--color-accent-light-gold)] flex items-center justify-center text-xs">
              5
            </span>
            Your Rights Under the DPDP Act 2023
          </h2>
          <p>As a Data Principal, you are entitled to the following statutory rights:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm pt-2">
            <div className="p-3 rounded-lg border border-stone-200 bg-white">
              <span className="font-bold text-stone-900">Right to Access (Section 11):</span>
              <p className="text-stone-500 mt-1">Request a copy of your personal data processed by our store.</p>
            </div>
            <div className="p-3 rounded-lg border border-stone-200 bg-white">
              <span className="font-bold text-stone-900">Right to Correction (Section 12):</span>
              <p className="text-stone-500 mt-1">Correct or update any inaccurate or outdated shipping details.</p>
            </div>
            <div className="p-3 rounded-lg border border-stone-200 bg-white">
              <span className="font-bold text-stone-900">Right to Erasure (Section 12):</span>
              <p className="text-stone-500 mt-1">Scrub your profile, saved addresses, and contact identifiers.</p>
            </div>
            <div className="p-3 rounded-lg border border-stone-200 bg-white">
              <span className="font-bold text-stone-900">Right to Grievance Redressal (Section 13):</span>
              <p className="text-stone-500 mt-1">Direct escalation to our Grievance Officer with 7-day resolution.</p>
            </div>
          </div>
        </section>

        {/* Interactive Data Erasure Request Portal */}
        <section className="bg-stone-50 border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-full bg-red-100 text-[var(--color-ruby-alert)] flex-shrink-0">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-stone-900">
                Exercise Your Right to Erasure (Right to be Forgotten)
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 mt-1">
                Enter your registered 10-digit mobile phone number below to scrub your active personal profile,
                saved addresses, and contact information from our databases.
              </p>
            </div>
          </div>

          <form onSubmit={handleErasureRequest} className="space-y-4 max-w-xl">
            <div>
              <label htmlFor="erasure-phone" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Registered Phone Number
              </label>
              <div className="flex rounded-xl overflow-hidden border border-stone-300 focus-within:ring-2 focus-within:ring-[var(--color-primary-base)]">
                <span className="bg-stone-100 px-3 py-2.5 text-xs sm:text-sm font-semibold text-stone-600 border-r border-stone-300">
                  +91
                </span>
                <input
                  id="erasure-phone"
                  type="tel"
                  required
                  placeholder="9876543210"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  maxLength={10}
                  className="w-full px-3 py-2.5 text-xs sm:text-sm outline-none bg-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="erasure-reason" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Reason / Note (Optional)
              </label>
              <input
                id="erasure-reason"
                type="text"
                placeholder="e.g. Account closure, no longer purchasing"
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary-base)] bg-white"
              />
            </div>

            {responseMessage && (
              <div
                className={`p-3 rounded-xl text-xs sm:text-sm flex items-start gap-2 ${
                  isSuccess
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {isSuccess ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
                )}
                <span>{responseMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl bg-[var(--color-ruby-alert)] hover:bg-red-800 text-white font-bold text-xs sm:text-sm transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? 'Processing Erasure Request...' : 'Submit Data Erasure Request'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </section>

        {/* Section 6: Grievance Officer */}
        <section className="space-y-3 pt-4 border-t border-stone-100">
          <h2 className="font-display text-xl font-bold text-stone-900 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[var(--color-primary-base)] text-[var(--color-accent-light-gold)] flex items-center justify-center text-xs">
              6
            </span>
            Data Protection &amp; Grievance Officer
          </h2>
          <p>
            In compliance with Section 13(2) of the DPDP Act 2023, Parnika Jewellers has appointed a designated
            Grievance Officer to resolve any questions or complaints regarding data processing:
          </p>
          <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-4 text-xs sm:text-sm space-y-1">
            <p><strong>Grievance Officer:</strong> Smt. P. Radhika</p>
            <p><strong>Email:</strong> <a href="mailto:grievance@pjstore.com" className="text-emerald-700 underline font-semibold">grievance@pjstore.com</a></p>
            <p><strong>Phone:</strong> +91 98765 43210 (Mon–Sat, 10:00 AM – 6:00 PM IST)</p>
            <p><strong>Official Address:</strong> Parnika Jewellers, Ground Floor, Palace Heights, Jubilee Hills, Hyderabad, Telangana - 500033</p>
            <p className="text-stone-500 pt-1 text-xs">
              Statutory Resolution Timeline: All data grievances are acknowledged within 24 hours and resolved within 7 business days.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
