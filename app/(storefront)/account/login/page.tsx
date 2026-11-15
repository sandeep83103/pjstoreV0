'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Phone, Lock, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

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
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/account/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to send OTP.');
      }

      setOtpSent(true);
      setSuccessMsg('OTP sent successfully to your mobile number.');
      if (data.data?.devOtp) {
        setDevOtpHint(data.data.devOtp);
      }
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/account/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Invalid or expired OTP.');
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
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/account/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
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
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F7F0DE]">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-xl border border-[#E6D7B4] border-t-4 border-t-[#7A262D]">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="relative w-16 h-16 mx-auto rounded-full border-2 border-[#D4AF5A] overflow-hidden bg-[#2E0A0F] mb-3 shadow-md">
            <Image
              src="/brand/crest.jpg"
              alt="Parnika Jewellers Crest Logo"
              fill
              className="object-cover"
              priority
            />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#4A1118]">
            Welcome to Parnika Jeweller
          </h2>
          <p className="text-xs text-[#5E4A4C] mt-1.5">
            Log in to manage orders, saved addresses, and jewellery wishlists.
          </p>

          {/* Toggle Tab */}
          <div className="flex bg-[#F7F0DE] p-1 rounded-xl mt-6 border border-[#E6D7B4]">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('otp');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                authMethod === 'otp'
                  ? 'bg-[#7A262D] text-[#F7F0DE] shadow'
                  : 'text-[#5E4A4C] hover:text-[#2B1316]'
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
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                authMethod === 'password'
                  ? 'bg-[#7A262D] text-[#F7F0DE] shadow'
                  : 'text-[#5E4A4C] hover:text-[#2B1316]'
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
                  <label className="block text-xs font-semibold text-[#2B1316] mb-1">
                    Mobile Number (India)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#5E4A4C]">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      maxLength={10}
                      className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF5A] focus:border-[#7A262D]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || phone.length < 10}
                  className="w-full py-3 rounded-xl bg-[#7A262D] text-[#F7F0DE] font-semibold text-xs uppercase tracking-wider hover:bg-[#2E0A0F] hover:text-[#E9D08A] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
                >
                  {isLoading ? 'Sending OTP...' : 'Send Login OTP'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-[#2B1316]">
                      Enter 6-Digit OTP
                    </label>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-[11px] text-[#7A262D] hover:underline font-semibold"
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
                    className="w-full tracking-widest text-center text-lg font-bold py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF5A]"
                  />
                  {devOtpHint && (
                    <p className="mt-1 text-[11px] text-emerald-800 bg-emerald-50 p-1.5 rounded border border-emerald-200">
                      Demo Environment OTP: <strong>{devOtpHint}</strong>
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className="w-full py-3 rounded-xl bg-[#D4AF5A] text-[#2E0A0F] font-bold text-xs uppercase tracking-wider hover:bg-[#E9D08A] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow"
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
              <label className="block text-xs font-semibold text-[#2B1316] mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="email"
                  required
                  placeholder="customer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF5A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2B1316] mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF5A]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-[#7A262D] text-[#F7F0DE] font-semibold text-xs uppercase tracking-wider hover:bg-[#2E0A0F] hover:text-[#E9D08A] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Footer info */}
        <div className="mt-8 pt-4 border-t border-stone-200 text-center text-xs text-[#5E4A4C]">
          <p>By continuing, you agree to Parnika Jewellers’</p>
          <p>Terms of Service and Privacy Policy.</p>
        </div>
      </div>
    </div>
  );
}
