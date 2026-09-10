import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import {
  AuthProvider,
  LoginPage,
  RegisterPage,
  useAuth,
} from "./features/auth";
import { ArticleEditorPage, CheckoutPage, CreateArticlePage } from "./features/articles";
import UserArticlesPage from "./pages/UserArticlesPage";
import PaymentHistoryPage from "./pages/PaymentHistoryPage";
import { AdminPackagesPage, AdminPage, AdminPublishersPage } from "./features/admin";
import AdminTestimonialsPage from "./pages/AdminTestimonialsPage";
import AdminMediaPartnersPage from "./pages/AdminMediaPartnersPage";
import { DashboardPage } from "./features/dashboard";
import { AppShell, ThemeProvider } from "./shared";
import LandingPage from "./pages/LandingPage";

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="grid min-h-screen place-items-center text-slate-500">
        Loading SEO…
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== "admin")
    return <Navigate to="/dashboard" replace />;
  return children;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <GuestRoute>
                  <LandingPage />
                </GuestRoute>
              }
            />
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <LoginPage />
                </GuestRoute>
              }
            />
            <Route
              path="/register"
              element={
                <GuestRoute>
                  <RegisterPage />
                </GuestRoute>
              }
            />
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/articles/new" element={<CreateArticlePage />} />
              <Route path="/articles/drafts" element={<UserArticlesPage mode="draft" />} />
              <Route path="/articles/my" element={<UserArticlesPage mode="my" />} />
              <Route path="/payments" element={<PaymentHistoryPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route
                path="/articles/:articleId"
                element={<ArticleEditorPage />}
              />
              <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
              <Route path="/admin/dashboard" element={<Navigate to="/dashboard" replace />} />
              <Route path="/admin/review" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
              <Route
                path="/admin/packages"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminPackagesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/publishers"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminPublishersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/testimonials"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminTestimonialsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/media-partners"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminMediaPartnersPage />
                  </ProtectedRoute>
                }
              />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <Toaster position="top-right" gutter={12} />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
