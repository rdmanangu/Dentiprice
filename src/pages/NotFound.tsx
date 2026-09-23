import { Link } from "react-router-dom";
import { Button } from "../components/ui";

function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center py-16">
      <div className="text-center">
        <p
          className="text-5xl font-bold text-primary"
          aria-hidden="true"
        >
          404
        </p>
        <h1 className="mt-4 text-2xl font-bold text-ink">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          The page you are looking for does not exist or may have moved.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/">
            <Button type="button" variant="primary">
              Go to home
            </Button>
          </Link>
          <Link to="/admin">
            <Button type="button" variant="secondary">
              Admin dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFound;