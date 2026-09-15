import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import AdminRoute from "./components/auth/AdminRoute";
import AdminLayout from "./components/admin/AdminLayout";

const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const InquiriesPage = lazy(() => import("./pages/InquiriesPage"));
const PatientsPage = lazy(() => import("./pages/PatientsPage"));
const PatientDetailsPage = lazy(() => import("./pages/PatientDetailsPage"));
const SchedulingPage = lazy(() => import("./pages/SchedulingPage"));
const TreatmentsPage = lazy(() => import("./pages/TreatmentsPage"));

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
            <div className="flex min-h-screen flex-col bg-bg">
              <Header />
              <div className="flex-1">
                <Home />
              </div>
              <Footer />
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
          <Route path="patients" element={<PatientsPage />} />
          <Route path="patients/:id" element={<PatientDetailsPage />} />
          <Route path="scheduling" element={<SchedulingPage />} />
          <Route path="treatments" element={<TreatmentsPage />} />
        </Route>
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
