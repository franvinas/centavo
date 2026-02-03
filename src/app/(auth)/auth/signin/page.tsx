"use client";

import {
  useState,
  useEffect,
  useCallback,
  useTransition,
  Suspense,
} from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { OTPInput } from "@/components/ui/otp-input";
import { Mail, ArrowLeft, Loader2, Globe } from "lucide-react";
import { updateLocale } from "@/lib/actions/locale";
import { locales, type Locale } from "@/i18n/config";

const RESEND_COOLDOWN = 60;

const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  es: "ES",
};

export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  );
}

function SignInContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations("auth");
  const currentLocale = useLocale();
  const [isLocaleChanging, startLocaleTransition] = useTransition();
  const errorType = searchParams.get("error");

  const ERROR_MESSAGES: Record<string, string> = {
    Verification: t("errorVerification"),
    OAuthAccountNotLinked: t("errorOAuthLinked"),
    Default: t("errorDefault"),
  };

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
          setOtpError(t("errorInvalidCode"));
          setVerifying(false);
        }
      } catch {
        setOtpError(t("errorDefault"));
        setVerifying(false);
      }
    },
    [email, router, t],
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
      {/* Language switcher */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-1">
        <Globe className="text-text-tertiary h-4 w-4" />
        {locales.map((loc) => (
          <button
            key={loc}
            onClick={() => {
              if (loc !== currentLocale) {
                startLocaleTransition(async () => {
                  await updateLocale(loc);
                  router.refresh();
                });
              }
            }}
            disabled={isLocaleChanging}
            className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
              currentLocale === loc
                ? "bg-accent-primary text-white"
                : "text-text-secondary hover:bg-bg-muted hover:text-text-primary"
            }`}
          >
            {LOCALE_LABELS[loc]}
          </button>
        ))}
      </div>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <Image
            src="/icons/centavo-logo.svg"
            alt="Centavo"
            width={56}
            height={56}
            className="rounded-xl"
          />
          <h1 className="text-text-primary mt-4 text-2xl font-semibold">
            {t("welcome")}
          </h1>
          <p className="text-text-secondary mt-1 text-sm">{t("tagline")}</p>
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
                {t("enterCode")}
              </h2>
              <p className="text-text-secondary mt-1 text-sm">
                {t("codeSent", { email })}
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
                  {t("verifying")}
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
                  {cooldown > 0
                    ? t("resendIn", { seconds: cooldown })
                    : t("resendCode")}
                </Button>
                <button
                  onClick={handleBack}
                  className="text-text-secondary hover:text-text-primary inline-flex items-center gap-1 text-sm"
                >
                  <ArrowLeft className="h-3 w-3" />
                  {t("differentEmail")}
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
                {t("continueGoogle")}
              </Button>

              <div className="my-4 flex items-center gap-3">
                <Separator className="bg-border-subtle flex-1" />
                <span className="text-text-tertiary text-xs">{t("or")}</span>
                <Separator className="bg-border-subtle flex-1" />
              </div>

              {/* Email */}
              <form onSubmit={handleEmail} className="space-y-3">
                <Input
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button
                  type="submit"
                  disabled={loading || !email}
                  className="bg-accent-primary hover:bg-accent-primary/90 w-full text-white"
                >
                  {t("continueEmail")}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
