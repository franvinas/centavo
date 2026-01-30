"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { OTPInput } from "@/components/ui/otp-input";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";

const RESEND_COOLDOWN = 60;

const ERROR_MESSAGES: Record<string, string> = {
  Verification:
    "That code is invalid or has expired. Please request a new one.",
  OAuthAccountNotLinked:
    "This email is already associated with another sign-in method.",
  Default: "Something went wrong. Please try again.",
};

export default function SignInPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const errorType = searchParams.get("error");
  const errorMessage = errorType
    ? (ERROR_MESSAGES[errorType] ?? ERROR_MESSAGES.Default)
    : null;

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function handleGoogle() {
    setLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    await signIn("resend", { email, redirect: false });
    setEmailSent(true);
    setLoading(false);
    setCooldown(RESEND_COOLDOWN);
  }

  const handleVerify = useCallback(
    async (code: string) => {
      if (code.length !== 6) return;
      setVerifying(true);
      setOtpError(null);

      try {
        const callbackUrl = `/api/auth/callback/resend?token=${encodeURIComponent(code)}&email=${encodeURIComponent(email)}`;
        const res = await fetch(callbackUrl, { redirect: "follow" });

        if (res.ok || res.redirected) {
          router.push("/dashboard");
          router.refresh();
        } else {
          setOtpError("Invalid or expired code. Please try again.");
          setVerifying(false);
        }
      } catch {
        setOtpError("Something went wrong. Please try again.");
        setVerifying(false);
      }
    },
    [email, router],
  );

  function handleOtpChange(value: string) {
    setOtp(value);
    setOtpError(null);
    const trimmed = value.replace(/\s/g, "");
    if (trimmed.length === 6) {
      handleVerify(trimmed);
    }
  }

  async function handleResend() {
    if (cooldown > 0) return;
    setCooldown(RESEND_COOLDOWN);
    setOtp("");
    setOtpError(null);
    await signIn("resend", { email, redirect: false });
  }

  function handleBack() {
    setEmailSent(false);
    setOtp("");
    setOtpError(null);
    setCooldown(0);
  }

  return (
    <div className="bg-bg-primary flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="bg-accent-primary flex h-14 w-14 items-center justify-center rounded-xl text-white">
            <span className="text-2xl font-bold">C</span>
          </div>
          <h1 className="text-text-primary mt-4 text-2xl font-semibold">
            Welcome to Centavo
          </h1>
          <p className="text-text-secondary mt-1 text-sm">
            Track your expenses with ease
          </p>
        </div>

        {errorMessage && !emailSent && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="bg-bg-surface shadow-card rounded-lg p-6">
          {emailSent ? (
            <div className="text-center">
              <Mail className="text-accent-primary mx-auto h-10 w-10" />
              <h2 className="text-text-primary mt-3 text-lg font-semibold">
                Enter verification code
              </h2>
              <p className="text-text-secondary mt-1 text-sm">
                We sent a 6-digit code to {email}
              </p>

              <div className="mt-6">
                <OTPInput
                  value={otp}
                  onChange={handleOtpChange}
                  disabled={verifying}
                />
              </div>

              {verifying && (
                <div className="text-text-secondary mt-4 flex items-center justify-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </div>
              )}

              {otpError && (
                <p className="mt-4 text-sm text-red-600">{otpError}</p>
              )}

              <div className="mt-6 space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResend}
                  disabled={cooldown > 0}
                  className="w-full text-sm"
                >
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
                </Button>
                <button
                  onClick={handleBack}
                  className="text-text-secondary hover:text-text-primary inline-flex items-center gap-1 text-sm"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Use a different email
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Google */}
              <Button
                onClick={handleGoogle}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </Button>

              <div className="my-4 flex items-center gap-3">
                <Separator className="bg-border-subtle flex-1" />
                <span className="text-text-tertiary text-xs">or</span>
                <Separator className="bg-border-subtle flex-1" />
              </div>

              {/* Email */}
              <form onSubmit={handleEmail} className="space-y-3">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button
                  type="submit"
                  disabled={loading || !email}
                  className="bg-accent-primary hover:bg-accent-primary/90 w-full text-white"
                >
                  Continue with Email
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
