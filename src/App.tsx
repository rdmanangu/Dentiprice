import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Header from "./components/layout/Header";
import Home from "./pages/Home";
import AdminRoute from "./components/auth/AdminRoute";
import AdminLayout from "./components/admin/AdminLayout";

const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const InquiriesPage = lazy(() => import("./pages/InquiriesPage"));
const SchedulingPage = lazy(() => import("./pages/SchedulingPage"));

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
            <div className="min-h-screen bg-bg">
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
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="inquiries" element={<InquiriesPage />} />
          <Route path="scheduling" element={<SchedulingPage />} />
        </Route>
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
