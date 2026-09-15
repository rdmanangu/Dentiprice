import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

type AdminRouteProps = {
  children: React.ReactNode;
};

function AdminRoute({ children }: AdminRouteProps) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let active = true;

    async function evaluate() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!active) {
        return;
      }

      if (error) {
        console.error(
          "Unable to verify admin session:",
          error
        );
      }

      setAuthenticated(session?.user.app_metadata.role === "admin");
      setLoading(false);
    }

    // Initial one-shot check on mount.
    evaluate();

    // Stay reactive to session lifetime events (sign-in, token refresh,
    // sign-out, expiry). When the session is lost, the user is returned
    // to the login page instead of being left on a dashboard that keeps
    // failing with 401 responses.
    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      evaluate();
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg">
        <p className="text-sm text-slate-500" role="status">
          Checking authentication...
        </p>
      </main>
    );
  }

  if (!authenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}

export default AdminRoute;
