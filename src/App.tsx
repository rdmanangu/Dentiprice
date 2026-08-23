import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Header from "./components/layout/Header";
import Home from "./pages/Home";
import AdminRoute from "./components/auth/AdminRoute";

const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

function App() {
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center">
            <p className="text-slate-500">Loading...</p>
          </div>
        }
      >
        <Routes>
        <Route
          path="/"
          element={
            <div className="min-h-screen bg-slate-50">
              <Header />
              <Home />
            </div>
          }
        />

        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;