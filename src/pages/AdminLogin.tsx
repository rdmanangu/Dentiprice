import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Button, Card, Field, Input } from "../components/ui";
import {
  IconCalendar,
  IconInquiries,
  IconPatients,
  LogoIcon,
} from "../components/admin/icons";

// ─────────────────────────────────────────────
// BRAND PANEL CONTENT
// Hidden on small screens so the sign-in form
// stays the only thing competing for attention.
// ─────────────────────────────────────────────

const adminTools: { icon: typeof IconInquiries; label: string }[] = [
  { icon: IconInquiries, label: "Review and reply to patient inquiries" },
  { icon: IconCalendar, label: "Schedule and track appointments" },
  { icon: IconPatients, label: "Keep patient records up to date" },
];

// ─────────────────────────────────────────────
// SIGN-IN FEEDBACK
// Supabase can authenticate an account that is not
// allowed into the admin panel, and it reports a
// pending email confirmation as a generic failure.
// Both cases are translated here so the reason for a
// rejected sign-in is always explicit.
// ─────────────────────────────────────────────

const NOT_AUTHORIZED_MESSAGE =
  "Your account signed in, but it is not authorized for the DentiPrice admin panel. Ask the clinic owner to grant your account the admin role.";

function describeSignInError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("email not confirmed")) {
    return "Your email address has not been confirmed yet. Open the confirmation link Supabase emailed to this address, then sign in again.";
  }

  if (normalized.includes("invalid login credentials")) {
    return "Incorrect email or password. Please check your details and try again.";
  }

  return message;
}

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setError(describeSignInError(error.message));
      setLoading(false);
      return;
    }

    // A valid Supabase account is not enough on its own. AdminRoute, the
    // dashboard service and the RLS policies all require the admin role in
    // app_metadata, so a signed-in account without it is signed back out
    // here rather than being bounced off /admin with no explanation.
    if (data.session?.user.app_metadata.role !== "admin") {
      await supabase.auth.signOut();
      setError(NOT_AUTHORIZED_MESSAGE);
      setLoading(false);
      return;
    }

    setLoading(false);

    navigate("/admin");
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative flex flex-col justify-center overflow-hidden bg-primary px-6 py-10 sm:px-10 lg:py-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(214,64,112,0.28),transparent_55%)]"
        />

        <div className="relative mx-auto w-full max-w-md">
          <div className="flex items-center gap-3 lg:flex-col lg:items-start lg:gap-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-card bg-cta text-white">
              <LogoIcon className="h-7 w-7" />
            </div>

            <div className="leading-tight">
              <p className="text-2xl font-bold tracking-tight text-white">
                Denti<span className="text-[#f2a9bd]">Price</span>
              </p>
              <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-sidebar-text">
                Clinic Admin
              </p>
            </div>
          </div>

          <p className="mt-6 max-w-sm text-sm leading-relaxed text-sidebar-text lg:mt-8 lg:text-base">
            Manage inquiries, appointments, patients, and treatment
            pricing from one place.
          </p>

          <ul className="mt-8 hidden space-y-3.5 lg:block">
            {adminTools.map((tool) => {
              const Icon = tool.icon;

              return (
                <li key={tool.label} className="flex items-center gap-3">
                  <Icon className="h-[18px] w-[18px] shrink-0 text-[#f2a9bd]" />
                  <span className="text-sm text-sidebar-text">
                    {tool.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Sign-in panel */}
      <div className="flex flex-col justify-center bg-bg px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-16">
        <div className="mx-auto w-full max-w-md">
          <Card className="p-6 sm:p-8">
            <h1
              id="admin-login-title"
              className="text-2xl font-bold tracking-tight text-ink"
            >
              Clinic Admin
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Sign in to manage{" "}
              <span className="font-semibold text-primary">DentiPrice</span>.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-7 space-y-5"
              aria-labelledby="admin-login-title"
              aria-busy={loading}
            >
              <Field label="Email" htmlFor="admin-email" required>
                <Input
                  id="admin-email"
                  type="email"
                  name="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                />
              </Field>

              <Field label="Password" htmlFor="admin-password" required>
                <Input
                  id="admin-password"
                  type="password"
                  name="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="current-password"
                />
              </Field>

              {error && (
                <p
                  role="alert"
                  className="rounded-control border border-error-border bg-error-bg p-3.5 text-sm font-medium text-error"
                >
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
                aria-busy={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="h-4 w-4 animate-spin rounded-pill border-2 border-white/40 border-t-white"
                    />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </Card>

          <p className="mt-6 text-center text-xs text-slate-500">
            Authorized clinic staff only.{" "}
            <Link
              to="/"
              className="rounded-sm font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              Back to DentiPrice
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default AdminLogin;