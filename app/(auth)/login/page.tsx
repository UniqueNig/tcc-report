"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Loader2,
  Shield,
} from "lucide-react";

type Role = "UNIT_HEAD" | "CORE_LEADER" | "ADMIN";

interface FormState {
  email: string;
  password: string;
}

interface UIState {
  showPassword: boolean;
  isLoading: boolean;
  error: string | null;
  success: boolean;
  redirectTarget: string;
  forgotSent: boolean;
}

const ROLE_REDIRECTS: Record<Role, string> = {
  UNIT_HEAD: "/dashboard/unit-head",
  CORE_LEADER: "/dashboard/core-leader",
  ADMIN: "/dashboard/admin",
};

const ROLE_LABELS: Record<Role, string> = {
  UNIT_HEAD: "Unit Head Dashboard",
  CORE_LEADER: "Core Leader Dashboard",
  ADMIN: "Admin Overview",
};

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({ email: "", password: "" });
  const [ui, setUi] = useState<UIState>({
    showPassword: false,
    isLoading: false,
    error: null,
    success: false,
    redirectTarget: "",
    forgotSent: false,
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<FormState>>({});

  function validate(): boolean {
    const errors: Partial<FormState> = {};
    if (!form.email.trim()) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email))
      errors.email = "Enter a valid email address";
    if (!form.password) errors.password = "Password is required";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;

    setUi((prev) => ({ ...prev, isLoading: true, error: null, forgotSent: false }));

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setUi((prev) => ({
          ...prev,
          isLoading: false,
          error: data.message || "Invalid email or password. Please try again.",
        }));
        setFieldErrors({ email: " ", password: " " });
        return;
      }

      const role = data.user?.role as Role;
      const redirectPath = ROLE_REDIRECTS[role] ?? "/dashboard";
      const redirectLabel = ROLE_LABELS[role] ?? "your dashboard";

      setUi((prev) => ({
        ...prev,
        isLoading: false,
        success: true,
        redirectTarget: redirectLabel,
      }));

      setTimeout(() => router.push(redirectPath), 1800);
    } catch {
      setUi((prev) => ({
        ...prev,
        isLoading: false,
        error: "Something went wrong. Please check your connection and try again.",
      }));
    }
  }

  function handleForgotPassword(e: React.MouseEvent) {
    e.preventDefault();
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) {
      setFieldErrors({ email: "Enter your email address first" });
      return;
    }
    setUi((prev) => ({ ...prev, forgotSent: true, error: null }));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleLogin();
  }

  function updateField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setUi((prev) => ({ ...prev, error: null, forgotSent: false }));
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-stone-100 dark:bg-neutral-950 relative overflow-hidden">

      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-stone-200/70 dark:bg-neutral-800/50" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-stone-200/60 dark:bg-neutral-800/40" />
        <div className="absolute top-1/2 left-1/4 w-40 h-40 rounded-full bg-amber-100/40 dark:bg-amber-900/10" />
      </div>

      <div className="w-full max-w-sm relative z-10">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 mb-3 rounded-xl bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800">
            <Shield size={20} className="text-stone-700 dark:text-stone-300" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-stone-900 dark:text-white">
            Church Reporting
          </h1>
          <p className="text-sm mt-1 text-stone-500 dark:text-neutral-400">
            Sign in to your account
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl p-8">

          {/* Success state */}
          {ui.success ? (
            <div className="text-center py-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 bg-emerald-50 dark:bg-emerald-950">
                <CheckCircle size={22} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-sm font-medium text-stone-900 dark:text-white">
                Signed in successfully
              </p>
              <p className="text-sm mt-1 text-stone-500 dark:text-neutral-400">
                Redirecting to {ui.redirectTarget}…
              </p>
              <div className="mt-5 h-0.5 w-full bg-stone-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ animation: "grow 1.8s linear forwards" }}
                />
              </div>
            </div>
          ) : (
            <>
              {/* Error banner */}
              {ui.error && (
                <div className="flex items-start gap-2.5 px-4 py-3 mb-5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl">
                  <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-500 dark:text-red-400" />
                  <p className="text-xs leading-relaxed text-red-700 dark:text-red-400">
                    {ui.error}
                  </p>
                </div>
              )}

              {/* Forgot password sent */}
              {ui.forgotSent && (
                <div className="flex items-start gap-2.5 px-4 py-3 mb-5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl">
                  <CheckCircle size={14} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-xs leading-relaxed text-emerald-700 dark:text-emerald-400">
                    A password reset link has been sent to your email.
                  </p>
                </div>
              )}

              {/* Email */}
              <div className="mb-4">
                <label className="block text-xs font-medium mb-1.5 text-stone-500 dark:text-neutral-400">
                  Email address
                </label>
                <div className="relative">
                  <Mail
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400 dark:text-neutral-500"
                  />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="you@church.org"
                    autoComplete="email"
                    className={`w-full pl-9 pr-4 py-2.5 text-sm rounded-xl outline-none transition-colors bg-stone-50 dark:bg-neutral-800 text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-neutral-500
                      ${fieldErrors.email
                        ? "border border-red-400 dark:border-red-700"
                        : "border border-stone-200 dark:border-neutral-700 focus:border-stone-400 dark:focus:border-neutral-500"
                      }`}
                  />
                </div>
                {fieldErrors.email?.trim() && (
                  <p className="flex items-center gap-1 text-xs mt-1.5 text-red-500">
                    <AlertCircle size={11} />
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="mb-5">
                <label className="block text-xs font-medium mb-1.5 text-stone-500 dark:text-neutral-400">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400 dark:text-neutral-500"
                  />
                  <input
                    type={ui.showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className={`w-full pl-9 pr-10 py-2.5 text-sm rounded-xl outline-none transition-colors bg-stone-50 dark:bg-neutral-800 text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-neutral-500
                      ${fieldErrors.password
                        ? "border border-red-400 dark:border-red-700"
                        : "border border-stone-200 dark:border-neutral-700 focus:border-stone-400 dark:focus:border-neutral-500"
                      }`}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() =>
                      setUi((p) => ({ ...p, showPassword: !p.showPassword }))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-neutral-500 hover:text-stone-600 dark:hover:text-neutral-300 transition-colors"
                  >
                    {ui.showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {fieldErrors.password?.trim() && (
                  <p className="flex items-center gap-1 text-xs mt-1.5 text-red-500">
                    <AlertCircle size={11} />
                    {fieldErrors.password}
                  </p>
                )}
                <div className="flex justify-end mt-2">
                  <a
                    href="#"
                    onClick={handleForgotPassword}
                    className="text-xs text-stone-400 dark:text-neutral-500 hover:text-stone-700 dark:hover:text-neutral-200 transition-colors"
                  >
                    Forgot password?
                  </a>
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleLogin}
                disabled={ui.isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {ui.isLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-6 text-stone-400 dark:text-neutral-600">
          Having trouble? Contact your church administrator
        </p>
      </div>


    </main>
  );
}