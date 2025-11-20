import * as React from "react";
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/core/engine/ThemeProvider";
import { themeManager } from "@/core/engine/ThemeManager";
// Import default theme to ensure registration
import "@/themes/default/index";
import { 
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";
import { ThemeScrollToTop } from "@/core/engine/ThemeComponent";
import { CartProvider } from "@/contexts/CartContext";
import { ContentProvider } from "@/contexts/ContentContext";
import { HelmetProvider } from "react-helmet-async";
import { ApiServiceProvider } from "@/contexts/ApiServiceContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Home from "@/themes/default/pages/Home";
import About from "@/themes/default/pages/About";
import Contact from "@/themes/default/pages/Contact";
import Products from "@/themes/default/pages/Products";
import ProductDetail from "@/themes/default/pages/ProductDetail";
import FAQ from "@/themes/default/pages/FAQ";
import NotFound from "@/themes/default/pages/NotFound";
import Cart from "@/themes/default/pages/Cart";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import UserProfile from "./pages/admin/UserProfile";

import { AdminLayout } from "@/components/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";

const PageHome = lazy(() => import("./pages/admin/PageHome"));
const PageAbout = lazy(() => import("./pages/admin/PageAbout"));
const PageContact = lazy(() => import("./pages/admin/PageContact"));
const PageFAQ = lazy(() => import("./pages/admin/PageFAQ"));
const ProductList = lazy(() => import("./pages/admin/ProductList"));
const ProductEditor = lazy(() => import("./pages/admin/ProductEditor"));
const ProductPageContent = lazy(() => import("@/features/admin/pages/ProductPageContent"));
const ProductSettings = lazy(() => import("@/features/admin/pages/ProductSettings"));
const ReviewList = lazy(() => import("./pages/admin/ReviewList"));
const MediaLibrary = lazy(() => import("./pages/admin/MediaLibrary"));
const Documentation = lazy(() => import("./pages/admin/Documentation"));
const Settings = lazy(() => import("./pages/admin/Settings"));
const ProductCategories = lazy(() => import("./pages/admin/ProductCategories"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const RoleManagement = lazy(() => import("./pages/admin/RoleManagement"));
const CustomerManagement = lazy(() => import("./pages/admin/CustomerManagement"));
const VendorManagement = lazy(() => import("./pages/admin/VendorManagement"));
const OrderManagement = lazy(() => import("./pages/admin/OrderManagement"));
const InventoryManagement = lazy(() => import("./pages/admin/InventoryManagement"));
const FinancialReport = lazy(() => import("./pages/admin/FinancialReport"));
const LanguageSettings = lazy(() => import("./pages/admin/LanguageSettings"));
const Product3DManager = lazy(() => import("./pages/admin/Product3DManager"));
const ThemeDashboard = lazy(() => import("./pages/admin/ThemeDashboard"));
const ThemeUpload = lazy(() => import("./pages/admin/ThemeUpload"));
const ThemeExport = lazy(() => import("./pages/admin/ThemeExport"));
const ThemeSettings = lazy(() => import("./pages/admin/ThemeSettings"));
const ThemeCodeEditor = lazy(() => import("./pages/admin/ThemeCodeEditor"));
const ThemeFiles = lazy(() => import("./pages/admin/ThemeFiles"));
const ThemeAdvancedEditor = lazy(() => import("./pages/admin/ThemeAdvancedEditor"));
const ThemeMarketplace = lazy(() => import("./pages/admin/ThemeMarketplace"));
const ThemePackaging = lazy(() => import("./pages/admin/ThemePackaging"));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

function App() {
  // Default theme is imported at module load (see top-level import) so registration
  // happens synchronously before ThemeProvider mounts.

  return (
    <ErrorBoundary>
        <HelmetProvider>
          <QueryClientProvider client={queryClient}>
            <ApiServiceProvider>
              <ThemeProvider initialTheme="default">
                <ContentProvider>
                  <CartProvider>
                    <Toaster />
                    <Sonner />
                {/* Use Vite's BASE_URL so builds with different bases (e.g. /stencil/) work correctly.
                    import.meta.env.BASE_URL includes a trailing slash (e.g. '/stencil/'), so strip it.
                    Fallback to '/' when empty. */}
                <BrowserRouter
                  basename={(import.meta.env.BASE_URL || '/').replace(/\/$/, '') || '/'}
                  future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
                >
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:slug" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  
                {/* Admin Routes */}
                <Route path="/admin" element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Dashboard />} />
                  <Route path="content/home" element={<Suspense fallback={<LoadingFallback />}><PageHome /></Suspense>} />
                  <Route path="content/about" element={<Suspense fallback={<LoadingFallback />}><PageAbout /></Suspense>} />
                  <Route path="content/contact" element={<Suspense fallback={<LoadingFallback />}><PageContact /></Suspense>} />
                  <Route path="content/faq" element={<Suspense fallback={<LoadingFallback />}><PageFAQ /></Suspense>} />
                  <Route path="products" element={<Suspense fallback={<LoadingFallback />}><ProductList /></Suspense>} />
                  <Route path="products/new" element={<Suspense fallback={<LoadingFallback />}><ProductEditor /></Suspense>} />
                  <Route path="products/:id/edit" element={<Suspense fallback={<LoadingFallback />}><ProductEditor /></Suspense>} />
                  <Route path="products/categories" element={<Suspense fallback={<LoadingFallback />}><ProductCategories /></Suspense>} />
                  <Route path="products/page-content" element={<Suspense fallback={<LoadingFallback />}><ProductPageContent /></Suspense>} />
                  <Route path="products/settings" element={<Suspense fallback={<LoadingFallback />}><ProductSettings /></Suspense>} />
                  <Route path="reviews" element={<Suspense fallback={<LoadingFallback />}><ReviewList /></Suspense>} />
                  <Route path="media" element={<Suspense fallback={<LoadingFallback />}><MediaLibrary /></Suspense>} />
                  <Route path="users" element={<Suspense fallback={<LoadingFallback />}><UserManagement /></Suspense>} />
                  <Route path="roles" element={<Suspense fallback={<LoadingFallback />}><RoleManagement /></Suspense>} />
                  <Route path="customers" element={<Suspense fallback={<LoadingFallback />}><CustomerManagement /></Suspense>} />
                  <Route path="vendors" element={<Suspense fallback={<LoadingFallback />}><VendorManagement /></Suspense>} />
                  <Route path="orders" element={<Suspense fallback={<LoadingFallback />}><OrderManagement /></Suspense>} />
                  <Route path="inventory" element={<Suspense fallback={<LoadingFallback />}><InventoryManagement /></Suspense>} />
                  <Route path="financial-report" element={<Suspense fallback={<LoadingFallback />}><FinancialReport /></Suspense>} />
                  <Route path="language" element={<Suspense fallback={<LoadingFallback />}><LanguageSettings /></Suspense>} />
                  <Route path="3d-manager" element={<Suspense fallback={<LoadingFallback />}><Product3DManager /></Suspense>} />
                  <Route path="themes" element={<Suspense fallback={<LoadingFallback />}><ThemeDashboard /></Suspense>} />
                  <Route path="themes/upload" element={<Suspense fallback={<LoadingFallback />}><ThemeUpload /></Suspense>} />
                  <Route path="themes/export" element={<Suspense fallback={<LoadingFallback />}><ThemeExport /></Suspense>} />
                  <Route path="themes/settings" element={<Suspense fallback={<LoadingFallback />}><ThemeSettings /></Suspense>} />
                  <Route path="themes/editor" element={<Suspense fallback={<LoadingFallback />}><ThemeCodeEditor /></Suspense>} />
                  <Route path="themes/files" element={<Suspense fallback={<LoadingFallback />}><ThemeFiles /></Suspense>} />
                  <Route path="themes/advanced" element={<Suspense fallback={<LoadingFallback />}><ThemeAdvancedEditor /></Suspense>} />
                  <Route path="themes/marketplace" element={<Suspense fallback={<LoadingFallback />}><ThemeMarketplace /></Suspense>} />
                  <Route path="themes/packaging" element={<Suspense fallback={<LoadingFallback />}><ThemePackaging /></Suspense>} />
                  <Route path="documentation" element={<Suspense fallback={<LoadingFallback />}><Documentation /></Suspense>} />
                  <Route path="settings" element={<Suspense fallback={<LoadingFallback />}><Settings /></Suspense>} />
                  <Route path="profile" element={<UserProfile />} />
                </Route>
                  
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
                    <ThemeScrollToTop />
                  </BrowserRouter>
                  </CartProvider>
                </ContentProvider>
              </ThemeProvider>
            </ApiServiceProvider>
          </QueryClientProvider>
        </HelmetProvider>
      </ErrorBoundary>
  );
}

export default App;
