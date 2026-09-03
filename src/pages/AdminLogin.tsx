import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Button, Card, Field, Input } from "../components/ui";

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

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);

    navigate("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-12">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-ink">
          Clinic Admin
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Sign in to manage <span className="font-semibold text-primary">DentiPrice</span>.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <Field label="Email" htmlFor="admin-email" required>
            <Input
              id="admin-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
            />
          </Field>

          <Field label="Password" htmlFor="admin-password" required>
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
            />
          </Field>

          {error && (
            <p
              role="alert"
              className="rounded-control border border-error-border bg-error-bg p-4 text-sm font-medium text-error"
            >
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </Card>
    </main>
  );
}

export default AdminLogin;
