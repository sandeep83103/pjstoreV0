'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function CustomerLoginPage() {
  const router = useRouter();
  const [authMethod, setAuthMethod] = useState<'otp' | 'password'>('otp');

  // OTP State
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  // Password State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to send OTP.');
      }

      setOtpSent(true);
      if (data.data?.devOtp) {
        setDevOtpHint(data.data.devOtp);
      }
      setSuccessMsg('OTP sent successfully! Please enter the 6-digit code.');
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Invalid OTP code.');
      }

      setSuccessMsg('Login successful! Redirecting...');
      setTimeout(() => {
        router.push('/catalog');
        router.refresh();
      }, 1000);
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Invalid email or password.');
      }

      setSuccessMsg('Login successful! Redirecting...');
      setTimeout(() => {
        router.push('/catalog');
        router.refresh();
      }, 1000);
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-[var(--color-border)]">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-[var(--color-primary-base)] text-[var(--color-accent-gold)] mb-3">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--color-primary-dark)]">
            Welcome to Parnika
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-1.5">
            Log in to manage orders, saved addresses, and jewellery wishlists.
          </p>

          {/* Toggle Tab */}
          <div className="flex bg-[var(--color-surface-ivory)] p-1 rounded-xl mt-6 border border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('otp');
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                authMethod === 'otp'
                  ? 'bg-[var(--color-primary-base)] text-white shadow'
                  : 'text-[var(--color-text-muted)] hover:text-black'
              }`}
            >
              Phone OTP (Fast)
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('password');
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                authMethod === 'password'
                  ? 'bg-[var(--color-primary-base)] text-white shadow'
                  : 'text-[var(--color-text-muted)] hover:text-black'
              }`}
            >
              Email &amp; Password
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
            {errorMsg}
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs border border-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Method 1: OTP */}
        {authMethod === 'otp' && (
          <div>
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-main)] mb-1">
                    Mobile Number (India)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--color-text-muted)]">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      maxLength={10}
                      className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-gold)]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || phone.length < 10}
                  className="w-full py-3 rounded-xl bg-[var(--color-primary-base)] text-[var(--color-accent-light-gold)] font-semibold text-sm hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? 'Sending OTP...' : 'Send Login OTP'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-[var(--color-text-main)]">
                      Enter 6-Digit OTP
                    </label>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-[11px] text-[var(--color-accent-gold)] hover:underline"
                    >
                      Change Number
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    maxLength={6}
                    className="w-full tracking-widest text-center text-lg font-bold py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-gold)]"
                  />
                  {devOtpHint && (
                    <p className="mt-1 text-[11px] text-emerald-700 bg-emerald-50 p-1.5 rounded">
                      Demo Environment OTP: <strong>{devOtpHint}</strong>
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className="w-full py-3 rounded-xl bg-[var(--color-accent-gold)] text-[var(--color-primary-dark)] font-bold text-sm hover:bg-[var(--color-accent-light-gold)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow"
                >
                  {isLoading ? 'Verifying...' : 'Verify & Enter Store'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        )}

        {/* Method 2: Email & Password */}
        {authMethod === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-main)] mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  placeholder="customer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-gold)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-main)] mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-gold)]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-[var(--color-primary-base)] text-[var(--color-accent-light-gold)] font-semibold text-sm hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Footer info */}
        <div className="mt-8 pt-4 border-t border-gray-100 text-center text-xs text-gray-500">
          <p>By continuing, you agree to Parnika Jewellers’</p>
          <p>Terms of Service and Privacy Policy.</p>
        </div>
      </div>
    </div>
  );
}
