"use client";

import { useState, type KeyboardEvent, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Shield,
} from "lucide-react";
import { getRoleHomePath, type AppUserRole } from "@/src/lib/roleRoutes";

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

interface DemoAccount {
  role: AppUserRole;
  name: string;
  email: string;
  password: string;
}

const ROLE_LABELS: Record<AppUserRole, string> = {
  UNIT_HEAD: "Unit Head Dashboard",
  CORE_LEADER: "Core Leader Dashboard",
  ADMIN: "Admin Overview",
};

export default function LoginPage() {
  const router = useRouter();
  const isDevelopment = process.env.NODE_ENV !== "production";

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
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);
  const [demoUnitName, setDemoUnitName] = useState("");
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  function validate(): boolean {
    const errors: Partial<FormState> = {};

    if (!form.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      errors.email = "Enter a valid email address";
    }

    if (!form.password) {
      errors.password = "Password is required";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleLogin() {
    if (!validate()) {
      return;
    }

    setUi((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
      forgotSent: false,
    }));

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

      const role = data.user?.role as AppUserRole;
      const requestedPath = new URLSearchParams(window.location.search).get("redirect");
      const redirectPath = requestedPath?.startsWith("/")
        ? requestedPath
        : getRoleHomePath(role);
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

  function handleForgotPassword(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();

    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) {
      setFieldErrors({ email: "Enter your email address first" });
      return;
    }

    setUi((prev) => ({ ...prev, forgotSent: true, error: null }));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      void handleLogin();
    }
  }

  function updateField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setUi((prev) => ({ ...prev, error: null, forgotSent: false }));
  }

  function fillDemoAccount(account: DemoAccount) {
    setForm({ email: account.email, password: account.password });
    setFieldErrors({});
    setBootstrapError(null);
    setUi((prev) => ({
      ...prev,
      error: null,
      forgotSent: false,
      success: false,
    }));
  }

  async function handleCreateDemoAccounts() {
    setIsBootstrapping(true);
    setBootstrapError(null);

    try {
      const res = await fetch("/api/auth/bootstrap", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setBootstrapError(data.message || "Could not create the demo accounts.");
        return;
      }

      setDemoAccounts(data.accounts ?? []);
      setDemoUnitName(data.unitName ?? "");

      if (data.accounts?.[0]) {
        fillDemoAccount(data.accounts[0]);
      }
    } catch {
      setBootstrapError("Could not create the demo accounts.");
    } finally {
      setIsBootstrapping(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-stone-100 px-4 py-12 dark:bg-neutral-950">
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-stone-200/70 dark:bg-neutral-800/50" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-stone-200/60 dark:bg-neutral-800/40" />
        <div className="absolute left-1/4 top-1/2 h-40 w-40 rounded-full bg-amber-100/40 dark:bg-amber-900/10" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-stone-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <Shield size={20} className="text-stone-700 dark:text-stone-300" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-stone-900 dark:text-white">
            Church Reporting
          </h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-neutral-400">
            Sign in to your account
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-8 dark:border-neutral-800 dark:bg-neutral-900">
          {ui.success ? (
            <div className="py-2 text-center">
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950">
                <CheckCircle size={22} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-sm font-medium text-stone-900 dark:text-white">
                Signed in successfully
              </p>
              <p className="mt-1 text-sm text-stone-500 dark:text-neutral-400">
                Redirecting to {ui.redirectTarget}...
              </p>
              <div className="mt-5 h-0.5 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-neutral-800">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ animation: "grow 1.8s linear forwards" }}
                />
              </div>
            </div>
          ) : (
            <>
              {ui.error && (
                <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950/40">
                  <AlertCircle
                    size={14}
                    className="mt-0.5 shrink-0 text-red-500 dark:text-red-400"
                  />
                  <p className="text-xs leading-relaxed text-red-700 dark:text-red-400">
                    {ui.error}
                  </p>
                </div>
              )}

              {ui.forgotSent && (
                <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900 dark:bg-emerald-950/40">
                  <CheckCircle
                    size={14}
                    className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                  />
                  <p className="text-xs leading-relaxed text-emerald-700 dark:text-emerald-400">
                    A password reset link has been sent to your email.
                  </p>
                </div>
              )}

              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-medium text-stone-500 dark:text-neutral-400">
                  Email address
                </label>
                <div className="relative">
                  <Mail
                    size={14}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-neutral-500"
                  />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="you@church.org"
                    autoComplete="email"
                    className={`w-full rounded-xl bg-stone-50 py-2.5 pl-9 pr-4 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-400 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500 ${
                      fieldErrors.email
                        ? "border border-red-400 dark:border-red-700"
                        : "border border-stone-200 focus:border-stone-400 dark:border-neutral-700 dark:focus:border-neutral-500"
                    }`}
                  />
                </div>
                {fieldErrors.email?.trim() && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
                    <AlertCircle size={11} />
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div className="mb-5">
                <label className="mb-1.5 block text-xs font-medium text-stone-500 dark:text-neutral-400">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={14}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-neutral-500"
                  />
                  <input
                    type={ui.showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(event) => updateField("password", event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className={`w-full rounded-xl bg-stone-50 py-2.5 pl-9 pr-10 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-400 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500 ${
                      fieldErrors.password
                        ? "border border-red-400 dark:border-red-700"
                        : "border border-stone-200 focus:border-stone-400 dark:border-neutral-700 dark:focus:border-neutral-500"
                    }`}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() =>
                      setUi((prev) => ({ ...prev, showPassword: !prev.showPassword }))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 transition-colors hover:text-stone-600 dark:text-neutral-500 dark:hover:text-neutral-300"
                  >
                    {ui.showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {fieldErrors.password?.trim() && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
                    <AlertCircle size={11} />
                    {fieldErrors.password}
                  </p>
                )}
                <div className="mt-2 flex justify-end">
                  <a
                    href="#"
                    onClick={handleForgotPassword}
                    className="text-xs text-stone-400 transition-colors hover:text-stone-700 dark:text-neutral-500 dark:hover:text-neutral-200"
                  >
                    Forgot password?
                  </a>
                </div>
              </div>

              <button
                onClick={() => void handleLogin()}
                disabled={ui.isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition-all active:scale-[0.98] hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100"
              >
                {ui.isLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>

              {isDevelopment && (
                <section className="mt-6 border-t border-stone-200 pt-5 dark:border-neutral-800">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500 dark:text-neutral-400">
                        Demo access
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-stone-500 dark:text-neutral-400">
                        Create the default admin, core leader, and unit head accounts for local testing.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleCreateDemoAccounts()}
                      disabled={isBootstrapping}
                      className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-stone-200 px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                    >
                      {isBootstrapping ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create demo accounts"
                      )}
                    </button>
                  </div>

                  {bootstrapError && (
                    <p className="mt-3 text-xs text-red-600 dark:text-red-400">
                      {bootstrapError}
                    </p>
                  )}

                  {demoAccounts.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                        Demo accounts are ready
                        {demoUnitName ? ` for ${demoUnitName}` : ""}. Click any role to autofill the form.
                      </div>

                      {demoAccounts.map((account) => (
                        <button
                          key={account.role}
                          type="button"
                          onClick={() => fillDemoAccount(account)}
                          className="w-full rounded-xl border border-stone-200 px-4 py-3 text-left transition-colors hover:bg-stone-50 dark:border-neutral-800 dark:hover:bg-neutral-800/70"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-stone-900 dark:text-white">
                                {account.name}
                              </p>
                              <p className="mt-1 text-xs text-stone-500 dark:text-neutral-400">
                                {ROLE_LABELS[account.role]}
                              </p>
                            </div>
                            <span className="text-xs font-medium text-stone-500 dark:text-neutral-400">
                              Use account
                            </span>
                          </div>
                          <div className="mt-3 grid gap-1 text-xs text-stone-500 dark:text-neutral-400">
                            <p>Email: {account.email}</p>
                            <p>Password: {account.password}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-stone-400 dark:text-neutral-600">
          Having trouble? Contact your church administrator
        </p>
      </div>
    </main>
  );
}
