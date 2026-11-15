'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle,
  Truck,
  CreditCard,
  QrCode,
  AlertCircle,
  ArrowRight,
  MapPin,
  Lock,
} from 'lucide-react';
import { useCart } from '@/app/context/CartContext';
import { formatINR } from '@/lib/utils';
import { getCloudFrontAssetUrl } from '@/lib/aws/s3Client';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, discount, shippingFee, total, couponCode, clearCart, refreshCart } = useCart();

  // Form State
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');
  const [paymentMethod, setPaymentMethod] = useState<'youpi' | 'cod'>('youpi');

  // Address State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Telangana');
  const [pincode, setPincode] = useState('');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pre-fill user profile if logged in
  useEffect(() => {
    async function loadCustomer() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setFullName(json.data.name || '');
            setPhone(json.data.phone || '');
            if (json.data.addresses && json.data.addresses.length > 0) {
              const defaultAddr = json.data.addresses.find((a: any) => a.isDefault) || json.data.addresses[0];
              if (defaultAddr) {
                setStreet(defaultAddr.street || '');
                setCity(defaultAddr.city || '');
                setState(defaultAddr.state || 'Telangana');
                setPincode(defaultAddr.pincode || '');
              }
            }
          }
        }
      } catch {
        // Guest mode fallback
      }
    }
    loadCustomer();
  }, []);

  // Shipping cost calculation based on selected method
  const dynamicShippingFee =
    shippingMethod === 'express' ? 199 : subtotal >= 1999 || subtotal === 0 ? 0 : 99;
  const dynamicTotal = Math.max(0, subtotal - discount + dynamicShippingFee);

  // COD Ceiling Check (EC-PAY-05)
  const isCodAllowed = dynamicTotal <= 10000;

  // Validate Step 1 Address Form
  const isStep1Valid =
    fullName.trim().length >= 2 &&
    phone.trim().length >= 10 &&
    street.trim().length >= 5 &&
    city.trim().length >= 2 &&
    state.trim().length >= 2 &&
    pincode.trim().length === 6;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isStep1Valid) {
      setStep(1);
      setErrorMessage('Please complete all required shipping address fields.');
      return;
    }

    if (paymentMethod === 'cod' && !isCodAllowed) {
      setErrorMessage('Cash on Delivery is limited to orders up to ₹10,000. Please select Online UPI Payment.');
      return;
    }

    if (items.length === 0) {
      setErrorMessage('Your shopping cart is empty.');
      return;
    }

    // Double-tap prevention (EC-UX-03)
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      const payload = {
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        shippingAddress: {
          fullName,
          phone,
          street,
          city,
          state,
          pincode,
        },
        shippingMethod,
        paymentMethod,
        couponCode: couponCode || undefined,
      };

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        if (res.status === 409 || json.error?.code === 'OUT_OF_STOCK') {
          setErrorMessage('One or more items in your cart just sold out. Please review your cart.');
          await refreshCart();
        } else {
          setErrorMessage(json.error?.message || 'Failed to complete order. Please try again.');
        }
        setIsSubmitting(false);
        return;
      }

      const order = json.data;
      // Clear persistent cart
      await clearCart();

      // Redirect to Order Confirmation
      router.push(`/checkout/confirmation?orderId=${order.id}&orderNo=${order.orderNo}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error during checkout. Please check your connection.');
      setIsSubmitting(false);
    }
  };

  if (items.length === 0 && !isSubmitting) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-stone-900 mb-2">Checkout</h1>
        <p className="text-stone-500 mb-6">Your shopping bag is currently empty.</p>
        <Link
          href="/catalog"
          className="px-6 py-3 rounded-xl bg-[var(--color-primary-base)] text-[var(--color-accent-light-gold)] font-bold text-sm inline-block shadow-md hover:bg-[var(--color-primary-dark)]"
        >
          Return to Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8 pb-4 border-b border-stone-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900">
              Secure Checkout
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Guaranteed Zero-Oversell Stock Reservation • Fast Delivery
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full font-medium">
            <Lock className="w-3.5 h-3.5" /> 256-Bit SSL Encrypted
          </div>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-4 gap-2 mt-6 max-w-xl">
          {[
            { num: 1, label: 'Address' },
            { num: 2, label: 'Delivery' },
            { num: 3, label: 'Payment' },
            { num: 4, label: 'Review' },
          ].map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => s.num < step && setStep(s.num as any)}
              className={`flex items-center justify-center gap-2 py-2 px-1 text-xs font-semibold rounded-lg border transition-all ${
                step === s.num
                  ? 'bg-[var(--color-primary-base)] text-white border-[var(--color-primary-base)] shadow-sm'
                  : step > s.num
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-white text-stone-400 border-stone-200'
              }`}
            >
              <span>{s.num}.</span> {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-[var(--color-ruby-alert)] text-sm flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold">Checkout Notice</h4>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Multi-Step Forms (Col 8) */}
        <div className="lg:col-span-8 space-y-6">

          {/* STEP 1: Shipping Address */}
          <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-5">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[var(--color-primary-base)]" />
                <h2 className="font-display text-lg font-bold text-stone-900">
                  1. Shipping &amp; Contact Details
                </h2>
              </div>
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-[var(--color-primary-base)] hover:underline font-semibold"
                >
                  Edit
                </button>
              )}
            </div>

            {step === 1 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Priyadarshini Rao"
                      className="w-full text-sm px-3.5 py-2.5 border border-stone-300 rounded-xl focus:outline-none focus:border-[var(--color-primary-base)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Mobile Number (for delivery SMS/WhatsApp) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full text-sm px-3.5 py-2.5 border border-stone-300 rounded-xl focus:outline-none focus:border-[var(--color-primary-base)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Street Address, Flat / House No., Landmark *
                  </label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="e.g. Flat 402, Sai Heritage Apartments, Temple Road"
                    className="w-full text-sm px-3.5 py-2.5 border border-stone-300 rounded-xl focus:outline-none focus:border-[var(--color-primary-base)]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Hyderabad"
                      className="w-full text-sm px-3.5 py-2.5 border border-stone-300 rounded-xl focus:outline-none focus:border-[var(--color-primary-base)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="e.g. Telangana"
                      className="w-full text-sm px-3.5 py-2.5 border border-stone-300 rounded-xl focus:outline-none focus:border-[var(--color-primary-base)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Pincode (6 digits) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                      placeholder="500001"
                      className="w-full text-sm px-3.5 py-2.5 border border-stone-300 rounded-xl focus:outline-none focus:border-[var(--color-primary-base)]"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    disabled={!isStep1Valid}
                    onClick={() => setStep(2)}
                    className="py-2.5 px-6 rounded-xl bg-[var(--color-primary-base)] text-[var(--color-accent-light-gold)] text-xs sm:text-sm font-bold hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50"
                  >
                    Continue to Delivery Method →
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-xs sm:text-sm text-stone-700">
                <p className="font-semibold text-stone-900">{fullName} • {phone}</p>
                <p className="text-stone-600 mt-0.5">{street}, {city}, {state} - {pincode}</p>
              </div>
            )}
          </div>

          {/* STEP 2: Delivery Method */}
          <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-5">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-[var(--color-primary-base)]" />
                <h2 className="font-display text-lg font-bold text-stone-900">
                  2. Delivery Option
                </h2>
              </div>
              {step > 2 && (
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs text-[var(--color-primary-base)] hover:underline font-semibold"
                >
                  Edit
                </button>
              )}
            </div>

            {step === 2 ? (
              <div className="space-y-3">
                {/* Standard Shipping */}
                <label
                  className={`flex items-start justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                    shippingMethod === 'standard'
                      ? 'border-[var(--color-primary-base)] bg-emerald-50/40 ring-1 ring-[var(--color-primary-base)]'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="shippingMethod"
                      checked={shippingMethod === 'standard'}
                      onChange={() => setShippingMethod('standard')}
                      className="mt-1 text-[var(--color-primary-base)] focus:ring-[var(--color-primary-base)]"
                    />
                    <div>
                      <p className="text-sm font-bold text-stone-900">Standard Insured Delivery</p>
                      <p className="text-xs text-stone-500 mt-0.5">Delivered in 4–6 business days via Delhivery / Shiprocket</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-stone-900">
                    {subtotal >= 1999 ? (
                      <span className="text-emerald-700 font-bold">FREE</span>
                    ) : (
                      formatINR(99)
                    )}
                  </span>
                </label>

                {/* Express Shipping */}
                <label
                  className={`flex items-start justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                    shippingMethod === 'express'
                      ? 'border-[var(--color-primary-base)] bg-emerald-50/40 ring-1 ring-[var(--color-primary-base)]'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="shippingMethod"
                      checked={shippingMethod === 'express'}
                      onChange={() => setShippingMethod('express')}
                      className="mt-1 text-[var(--color-primary-base)] focus:ring-[var(--color-primary-base)]"
                    />
                    <div>
                      <p className="text-sm font-bold text-stone-900">Priority Express Air Courier</p>
                      <p className="text-xs text-stone-500 mt-0.5">Dispatched within 24h, delivered in 2–3 days (Air Insured)</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-stone-900">{formatINR(199)}</span>
                </label>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="py-2.5 px-6 rounded-xl bg-[var(--color-primary-base)] text-[var(--color-accent-light-gold)] text-xs sm:text-sm font-bold hover:bg-[var(--color-primary-dark)] transition-colors"
                  >
                    Continue to Payment Method →
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-xs sm:text-sm text-stone-700">
                <p className="font-semibold text-stone-900">
                  {shippingMethod === 'express' ? 'Priority Express Air Courier (₹199)' : 'Standard Insured Delivery (Free/₹99)'}
                </p>
              </div>
            )}
          </div>

          {/* STEP 3: Payment Method */}
          <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-5">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[var(--color-primary-base)]" />
                <h2 className="font-display text-lg font-bold text-stone-900">
                  3. Payment Method
                </h2>
              </div>
              {step > 3 && (
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="text-xs text-[var(--color-primary-base)] hover:underline font-semibold"
                >
                  Edit
                </button>
              )}
            </div>

            {step === 3 ? (
              <div className="space-y-4">
                {/* Online Payment (YOUPI PG / UPI) */}
                <label
                  className={`flex items-start justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'youpi'
                      ? 'border-[var(--color-primary-base)] bg-emerald-50/40 ring-1 ring-[var(--color-primary-base)]'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'youpi'}
                      onChange={() => setPaymentMethod('youpi')}
                      className="mt-1 text-[var(--color-primary-base)] focus:ring-[var(--color-primary-base)]"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-stone-900">
                          Dynamic UPI QR / Online Payment
                        </p>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                          Recommended
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-1">
                        Pay instantly using Google Pay, PhonePe, Paytm, BHIM, or any banking UPI app. Instant confirmation.
                      </p>
                    </div>
                  </div>
                  <QrCode className="w-6 h-6 text-emerald-700 flex-shrink-0" />
                </label>

                {/* Cash on Delivery (COD) */}
                <label
                  className={`flex items-start justify-between p-4 rounded-xl border transition-all ${
                    !isCodAllowed
                      ? 'opacity-60 bg-stone-50 border-stone-200 cursor-not-allowed'
                      : paymentMethod === 'cod'
                      ? 'border-[var(--color-primary-base)] bg-emerald-50/40 ring-1 ring-[var(--color-primary-base)] cursor-pointer'
                      : 'border-stone-200 hover:border-stone-300 cursor-pointer'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      disabled={!isCodAllowed}
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="mt-1 text-[var(--color-primary-base)] focus:ring-[var(--color-primary-base)]"
                    />
                    <div>
                      <p className="text-sm font-bold text-stone-900">Cash on Delivery (COD)</p>
                      <p className="text-xs text-stone-500 mt-1">
                        Pay cash upon parcel arrival. Limited to orders up to ₹10,000.
                      </p>
                      {!isCodAllowed && (
                        <p className="text-xs text-[var(--color-ruby-alert)] font-semibold mt-1">
                          ⚠️ Cash on Delivery is limited to orders up to ₹10,000.
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-stone-600">COD</span>
                </label>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="py-2.5 px-6 rounded-xl bg-[var(--color-primary-base)] text-[var(--color-accent-light-gold)] text-xs sm:text-sm font-bold hover:bg-[var(--color-primary-dark)] transition-colors"
                  >
                    Continue to Order Review →
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-xs sm:text-sm text-stone-700">
                <p className="font-semibold text-stone-900">
                  {paymentMethod === 'youpi' ? 'Dynamic UPI QR / Online Payment' : 'Cash on Delivery (COD)'}
                </p>
              </div>
            )}
          </div>

          {/* STEP 4: Review Items */}
          <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-sm">
            <h2 className="font-display text-lg font-bold text-stone-900 pb-4 border-b border-stone-100 mb-4">
              4. Review Order Items ({items.length})
            </h2>
            <div className="space-y-3 divide-y divide-stone-100">
              {items.map((item) => {
                const imageUrl = item.imageKey
                  ? item.imageKey.startsWith('/')
                    ? item.imageKey
                    : getCloudFrontAssetUrl(item.imageKey)
                  : '/brand/crest.jpg';
                return (
                  <div key={`${item.productId}-${item.variantId || 'default'}`} className="pt-3 first:pt-0 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-stone-100 bg-stone-50 flex-shrink-0">
                        <Image src={imageUrl} alt={item.name} fill className="object-cover" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-stone-900">{item.name}</p>
                        <p className="text-[11px] text-stone-400">Qty: {item.quantity} × {formatINR(item.price)}</p>
                      </div>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-stone-900">
                      {formatINR(item.price * item.quantity)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: Price Summary & Pay CTA (Col 4) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-stone-200/80 p-6 shadow-sm space-y-6 sticky top-28">
          <h2 className="font-display text-lg font-bold text-stone-900 pb-3 border-b border-stone-100">
            Payment Summary
          </h2>

          <div className="space-y-3 text-xs sm:text-sm text-stone-600">
            <div className="flex justify-between">
              <span>Cart Subtotal</span>
              <span className="font-semibold text-stone-900">{formatINR(subtotal)}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Coupon ({couponCode})</span>
                <span>-{formatINR(discount)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Shipping ({shippingMethod === 'express' ? 'Priority Air' : 'Standard'})</span>
              <span>
                {dynamicShippingFee === 0 ? (
                  <span className="text-emerald-700 font-semibold">FREE</span>
                ) : (
                  formatINR(dynamicShippingFee)
                )}
              </span>
            </div>

            <div className="flex justify-between text-base font-extrabold text-stone-900 pt-3 border-t border-stone-200">
              <span>Payable Amount</span>
              <span className="text-[var(--color-primary-base)] text-lg">
                {formatINR(dynamicTotal)}
              </span>
            </div>
            <p className="text-[10px] text-stone-400">All prices inclusive of 3% jewellery GST</p>
          </div>

          {/* DPDP Act 2023 Statutory Consent Notice */}
          <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-3 text-[11px] text-stone-600 leading-relaxed">
            By placing this order, you consent to Parnika Jewellers processing your contact and address details solely for order delivery and GST invoice generation under India&apos;s{' '}
            <Link href="/privacy" target="_blank" className="text-emerald-700 underline font-semibold">
              Digital Personal Data Protection (DPDP) Act 2023
            </Link>.
          </div>

          {/* Place Order CTA with Double-Tap Guard (EC-UX-03) */}
          <button
            type="submit"
            disabled={isSubmitting || !isStep1Valid}
            className="w-full py-4 px-6 bg-[var(--color-accent-gold)] hover:bg-[var(--color-accent-light-gold)] text-[var(--color-primary-dark)] font-bold text-sm sm:text-base rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
                Reserving Stock &amp; Placing Order...
              </span>
            ) : (
              <>
                {paymentMethod === 'cod' ? 'Confirm Cash on Delivery Order' : `Pay ${formatINR(dynamicTotal)} via UPI`}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          {/* Security and Trust */}
          <div className="pt-2 border-t border-stone-100 space-y-2 text-xs text-stone-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Zero-oversell atomic stock reservation</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[var(--color-accent-gold)]" />
              <span>Certified 1-gram micro gold polish</span>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
