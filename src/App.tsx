import * as React from "react";
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/react-query";
import { ThemeProvider } from "@/core/engine/ThemeProvider";
import { themeManager } from "@/core/engine/ThemeManager";
// Import default theme to ensure registration
import "@/themes/default/index";
import { 
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";
import { ThemeScrollToTop } from "@/core/engine/ThemeComponent";
import { CartProvider } from "@/contexts/CartContext";
import { ContentProvider } from "@/contexts/ContentContext";
import { HelmetProvider } from "react-helmet-async";
import { ApiServiceProvider } from "@/contexts/ApiServiceContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PlatformAuthProvider } from "@/contexts/PlatformAuthContext";
import { TenantAuthProvider } from "@/contexts/TenantAuthContext";
import { GlobalContextProvider } from "@/contexts/GlobalContext";
import { PublicTenantProvider } from "@/contexts/PublicTenantContext";
import { ProductComparisonProvider } from "@/contexts/ProductComparisonContext";
import { PlatformRouteGuard } from "@/guards/PlatformRouteGuard";
import { TenantRouteGuard } from "@/guards/TenantRouteGuard";
import { DebugAuth } from "@/components/DebugAuth";
import { TenantRedirectWrapper } from "@/components/TenantRedirectWrapper";
import DevDebugger from "@/components/debug/DevDebugger";

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

// Platform Components
import PlatformLogin from "./pages/platform/PlatformLogin";
import { PlatformLayout } from "@/layouts/PlatformLayout";
import PlatformDashboard from "./pages/platform/PlatformDashboard";

// Tenant Components
import TenantLogin from "./pages/tenant/TenantLogin";
import { TenantLayout } from "@/layouts/TenantLayout";
import Dashboard from "./pages/admin/Dashboard";


const PageHome = lazy(() => import("./pages/admin/PageHome"));
const PageAbout = lazy(() => import("./pages/admin/PageAbout"));
const PageContact = lazy(() => import("./pages/admin/PageContact"));
const PageFAQ = lazy(() => import("./pages/admin/PageFAQ"));
const PageProducts = lazy(() => import("./pages/admin/PageProducts"));
const ProductList = lazy(() => import("./pages/admin/ProductList"));
const ProductEditor = lazy(() => import("./pages/admin/ProductEditor"));
const AdminProductDetail = lazy(() => import("./pages/admin/ProductDetail"));
const ProductPageContent = lazy(() => import("@/features/admin/pages/ProductPageContent"));
const ProductSettings = lazy(() => import("@/features/admin/pages/ProductSettings"));
const ReviewList = lazy(() => import("./pages/admin/ReviewList"));
const MediaLibrary = lazy(() => import("./pages/admin/MediaLibrary"));
const Documentation = lazy(() => import("./pages/admin/Documentation"));
const Settings = lazy(() => import("./pages/admin/Settings"));
const VendorSettings = lazy(() => import("./pages/admin/settings/VendorSettings"));
const ProductCategories = lazy(() => import("./pages/admin/ProductCategories"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const RoleManagement = lazy(() => import("./pages/admin/RoleManagement"));
const CustomerManagement = lazy(() => import("./pages/admin/CustomerManagement"));
const CustomerDetail = lazy(() => import("./pages/admin/CustomerDetail"));
const VendorManagement = lazy(() => import("./pages/admin/VendorManagement"));
const VendorDetail = lazy(() => import("./pages/admin/VendorDetail"));
const VendorPerformance = lazy(() => import("./pages/admin/VendorPerformance"));
const VendorContracts = lazy(() => import("./pages/admin/VendorContracts"));
const VendorCommunications = lazy(() => import("./pages/admin/VendorCommunications"));
const OrderManagement = lazy(() => import("./pages/admin/OrderManagement"));
const OrderTracking = lazy(() => import("./pages/admin/OrderTracking"));
const BulkOrders = lazy(() => import("./pages/admin/BulkOrders"));
const OrderAnalytics = lazy(() => import("./pages/admin/OrderAnalytics"));
const QuoteManagement = lazy(() => import("./pages/tenant/QuoteManagement"));
const InvoiceManagement = lazy(() => import("./pages/tenant/InvoiceManagement"));
const PaymentManagement = lazy(() => import("./pages/tenant/PaymentManagement"));
const ProductComparison = lazy(() => import("./pages/tenant/ProductComparison"));
const ProductionManagement = lazy(() => import("./pages/tenant/ProductionManagement"));
const QualityManagement = lazy(() => import("./pages/tenant/QualityManagement"));
const ShippingManagement = lazy(() => import("./pages/tenant/ShippingManagement"));
const TenantManagement = lazy(() => import("./pages/platform/TenantManagement"));
const LicenseManagement = lazy(() => import("./pages/platform/LicenseManagement"));
const PlatformAnalytics = lazy(() => import("./pages/platform/PlatformAnalytics"));
const ContentManagement = lazy(() => import("./pages/platform/ContentManagement"));

// Platform Content Management Pages
const PlatformPageContact = lazy(() => import("./pages/platform/content/PageContact"));
const PlatformPageHome = lazy(() => import("./pages/platform/content/PageHome"));
const PlatformPageAbout = lazy(() => import("./pages/platform/content/PageAbout"));
const PlatformPageFAQ = lazy(() => import("./pages/platform/content/PageFAQ"));
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
const ActivityLog = lazy(() => import("./pages/admin/ActivityLog"));
const PerformanceMonitoring = lazy(() => import("./pages/admin/PerformanceMonitoring"));
const RefundManagement = lazy(() => import("./pages/admin/RefundManagement"));
const InsuranceFundDashboard = lazy(() => import("./pages/admin/InsuranceFundDashboard"));

// Track B Commerce Management Pages - Product Management
const ProductCatalog = lazy(() => import("./pages/admin/products/ProductCatalog"));
const ProductBulk = lazy(() => import("./pages/admin/products/ProductBulk"));
const ProductAnalytics = lazy(() => import("./pages/admin/products/ProductAnalytics"));

// Track B Commerce Management Pages - Customer Management
const CustomerDatabase = lazy(() => import("./pages/admin/customers/CustomerDatabase"));
const CustomerSegments = lazy(() => import("./pages/admin/customers/CustomerSegments"));
const CustomerCredit = lazy(() => import("./pages/admin/customers/CustomerCredit"));
const CustomerPortal = lazy(() => import("./pages/admin/customers/CustomerPortal"));

// Track B Commerce Management Pages - Inventory Management
const InventoryStock = lazy(() => import("./pages/admin/inventory/InventoryStock"));
const InventoryLocations = lazy(() => import("./pages/admin/inventory/InventoryLocations"));
const InventoryAlerts = lazy(() => import("./pages/admin/inventory/InventoryAlerts"));
const InventoryReports = lazy(() => import("./pages/admin/inventory/InventoryReports"));

// Track B Commerce Management Pages - Shipping Management
const ShippingMethods = lazy(() => import("./pages/admin/shipping/ShippingMethods"));
const ShippingCarriers = lazy(() => import("./pages/admin/shipping/ShippingCarriers"));
const ShippingTracking = lazy(() => import("./pages/admin/shipping/ShippingTracking"));
const ShippingReports = lazy(() => import("./pages/admin/shipping/ShippingReports"));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}



function App() {
  // Default theme is imported at module load (see top-level import) so registration
  // happens synchronously before ThemeProvider mounts.

  return (
    <ErrorBoundary>
        <HelmetProvider>
          <QueryClientProvider client={queryClient}>
            <ApiServiceProvider>
              <PlatformAuthProvider>
                <TenantAuthProvider>
                  <GlobalContextProvider>
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
                      <PublicTenantProvider>
                        <TenantRedirectWrapper>
                          <Routes>
                  {/* Global Public Routes (no tenant) */}
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:slug" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/faq" element={<FAQ />} />
                  
                  {/* Tenant-Scoped Public Routes */}
                  <Route path="/:tenantSlug" element={<Home />} />
                  <Route path="/:tenantSlug/about" element={<About />} />
                  <Route path="/:tenantSlug/contact" element={<Contact />} />
                  <Route path="/:tenantSlug/products" element={<Products />} />
                  <Route path="/:tenantSlug/products/:slug" element={<ProductDetail />} />
                  <Route path="/:tenantSlug/cart" element={<Cart />} />
                  <Route path="/:tenantSlug/faq" element={<FAQ />} />
                  
                  {/* Tenant-scoped Auth Routes */}
                  <Route path="/:tenantSlug/login" element={<Login />} />
                  <Route path="/:tenantSlug/register" element={<Register />} />
                  <Route path="/:tenantSlug/forgot-password" element={<ForgotPassword />} />
                  <Route path="/:tenantSlug/reset-password" element={<ResetPassword />} />
                  <Route path="/:tenantSlug/verify-email" element={<VerifyEmail />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  
                {/* Platform Routes */}
                <Route path="/platform/login" element={<PlatformLogin />} />
                <Route path="/platform" element={
                  <PlatformRouteGuard>
                    <PlatformLayout />
                  </PlatformRouteGuard>
                }>
                  <Route index element={<Navigate to="/platform/dashboard" replace />} />
                  <Route path="dashboard" element={<PlatformDashboard />} />
                  <Route path="tenants" element={<Suspense fallback={<LoadingFallback />}><TenantManagement /></Suspense>} />
                  <Route path="users" element={<div className="p-6">User Management - Coming Soon</div>} />
                  <Route path="subscriptions" element={<div className="p-6">Subscriptions - Coming Soon</div>} />
                  <Route path="licenses" element={<Suspense fallback={<LoadingFallback />}><LicenseManagement /></Suspense>} />
                  <Route path="domains" element={<div className="p-6">Domains - Coming Soon</div>} />
                  <Route path="analytics" element={<Suspense fallback={<LoadingFallback />}><PlatformAnalytics /></Suspense>} />
                  <Route path="content" element={<Suspense fallback={<LoadingFallback />}><ContentManagement /></Suspense>} />
                  <Route path="content/home" element={<Suspense fallback={<LoadingFallback />}><PlatformPageHome /></Suspense>} />
                  <Route path="content/about" element={<Suspense fallback={<LoadingFallback />}><PlatformPageAbout /></Suspense>} />
                  <Route path="content/contact" element={<Suspense fallback={<LoadingFallback />}><PlatformPageContact /></Suspense>} />
                  <Route path="content/faq" element={<Suspense fallback={<LoadingFallback />}><PlatformPageFAQ /></Suspense>} />
                  <Route path="appearance/*" element={<div className="p-6">Platform Appearance - Coming Soon</div>} />
                  <Route path="users/*" element={<div className="p-6">Platform User Management - Coming Soon</div>} />
                  <Route path="system" element={<div className="p-6">System - Coming Soon</div>} />
                  <Route path="activity" element={<div className="p-6">Platform Activity Monitor - Coming Soon</div>} />
                  <Route path="settings/*" element={<div className="p-6">Platform Settings - Coming Soon</div>} />
                </Route>
                
                {/* Tenant Routes */}
                <Route path="/admin/login" element={<TenantLogin />} />
                <Route path="/admin" element={
                  <TenantRouteGuard>
                    <TenantLayout />
                  </TenantRouteGuard>
                }>
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="content/home" element={<Suspense fallback={<LoadingFallback />}><PageHome /></Suspense>} />
                  <Route path="content/about" element={<Suspense fallback={<LoadingFallback />}><PageAbout /></Suspense>} />
                  <Route path="content/contact" element={<Suspense fallback={<LoadingFallback />}><PageContact /></Suspense>} />
                  <Route path="content/faq" element={<Suspense fallback={<LoadingFallback />}><PageFAQ /></Suspense>} />
                  <Route path="content/products" element={<Suspense fallback={<LoadingFallback />}><PageProducts /></Suspense>} />
                  <Route path="products" element={<Suspense fallback={<LoadingFallback />}><ProductList /></Suspense>} />
                  <Route path="products/new" element={<Suspense fallback={<LoadingFallback />}><ProductEditor /></Suspense>} />
                  <Route path="products/:id/edit" element={<Suspense fallback={<LoadingFallback />}><ProductEditor /></Suspense>} />
                  <Route path="products/:id" element={<Suspense fallback={<LoadingFallback />}><AdminProductDetail /></Suspense>} />
                  <Route path="products/categories" element={<Suspense fallback={<LoadingFallback />}><ProductCategories /></Suspense>} />
                  <Route path="products/page-content" element={<Suspense fallback={<LoadingFallback />}><ProductPageContent /></Suspense>} />
                  <Route path="products/settings" element={<Suspense fallback={<LoadingFallback />}><ProductSettings /></Suspense>} />
                  <Route path="reviews" element={<Suspense fallback={<LoadingFallback />}><ReviewList /></Suspense>} />
                  <Route path="media" element={<Suspense fallback={<LoadingFallback />}><MediaLibrary /></Suspense>} />
                  <Route path="users" element={<Suspense fallback={<LoadingFallback />}><UserManagement /></Suspense>} />
                  <Route path="roles" element={<Suspense fallback={<LoadingFallback />}><RoleManagement /></Suspense>} />
                  <Route path="customers" element={<Suspense fallback={<LoadingFallback />}><CustomerManagement /></Suspense>} />
                  <Route path="customers/:id" element={<Suspense fallback={<LoadingFallback />}><CustomerDetail /></Suspense>} />
                  <Route path="vendors" element={<Suspense fallback={<LoadingFallback />}><VendorManagement /></Suspense>} />
                  <Route path="vendors/:id" element={<Suspense fallback={<LoadingFallback />}><VendorDetail /></Suspense>} />
                  <Route path="vendors/performance" element={<Suspense fallback={<LoadingFallback />}><VendorPerformance /></Suspense>} />
                  <Route path="vendors/contracts" element={<Suspense fallback={<LoadingFallback />}><VendorContracts /></Suspense>} />
                  <Route path="vendors/communications" element={<Suspense fallback={<LoadingFallback />}><VendorCommunications /></Suspense>} />
                  <Route path="orders" element={<Suspense fallback={<LoadingFallback />}><OrderManagement /></Suspense>} />
                  <Route path="orders/tracking" element={<Suspense fallback={<LoadingFallback />}><OrderTracking /></Suspense>} />
                  <Route path="orders/bulk" element={<Suspense fallback={<LoadingFallback />}><BulkOrders /></Suspense>} />
                  <Route path="orders/analytics" element={<Suspense fallback={<LoadingFallback />}><OrderAnalytics /></Suspense>} />
                  <Route path="quotes" element={<Suspense fallback={<LoadingFallback />}><QuoteManagement /></Suspense>} />
                  <Route path="invoices" element={<Suspense fallback={<LoadingFallback />}><InvoiceManagement /></Suspense>} />
                  <Route path="payments" element={<Suspense fallback={<LoadingFallback />}><PaymentManagement /></Suspense>} />
                  <Route path="production" element={<Suspense fallback={<LoadingFallback />}><ProductionManagement /></Suspense>} />
                  <Route path="quality" element={<Suspense fallback={<LoadingFallback />}><QualityManagement /></Suspense>} />
                  <Route path="shipping" element={<Suspense fallback={<LoadingFallback />}><ShippingManagement /></Suspense>} />
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
                  <Route path="settings/general" element={<Suspense fallback={<LoadingFallback />}><Settings /></Suspense>} />
                  <Route path="settings/vendor" element={<Suspense fallback={<LoadingFallback />}><VendorSettings /></Suspense>} />
                  <Route path="activity-log" element={<Suspense fallback={<LoadingFallback />}><ActivityLog /></Suspense>} />
                  <Route path="performance" element={<Suspense fallback={<LoadingFallback />}><PerformanceMonitoring /></Suspense>} />
                  <Route path="refunds" element={<Suspense fallback={<LoadingFallback />}><RefundManagement /></Suspense>} />
                  <Route path="insurance-fund" element={<Suspense fallback={<LoadingFallback />}><InsuranceFundDashboard /></Suspense>} />
                  
                  {/* Track B Commerce Management Pages - Product Management */}
                  <Route path="products/catalog" element={<Suspense fallback={<LoadingFallback />}><ProductCatalog /></Suspense>} />
                  <Route path="products/bulk" element={<Suspense fallback={<LoadingFallback />}><ProductBulk /></Suspense>} />
                  <Route path="products/analytics" element={<Suspense fallback={<LoadingFallback />}><ProductAnalytics /></Suspense>} />
                  <Route path="products/compare" element={<Suspense fallback={<LoadingFallback />}><ProductComparisonProvider><ProductComparison /></ProductComparisonProvider></Suspense>} />
                  
                  {/* Track B Commerce Management Pages - Customer Management */}
                  <Route path="customers/database" element={<Suspense fallback={<LoadingFallback />}><CustomerDatabase /></Suspense>} />
                  <Route path="customers/segments" element={<Suspense fallback={<LoadingFallback />}><CustomerSegments /></Suspense>} />
                  <Route path="customers/credit" element={<Suspense fallback={<LoadingFallback />}><CustomerCredit /></Suspense>} />
                  <Route path="customers/portal" element={<Suspense fallback={<LoadingFallback />}><CustomerPortal /></Suspense>} />
                  
                  {/* Track B Commerce Management Pages - Inventory Management */}
                  <Route path="inventory/stock" element={<Suspense fallback={<LoadingFallback />}><InventoryStock /></Suspense>} />
                  <Route path="inventory/locations" element={<Suspense fallback={<LoadingFallback />}><InventoryLocations /></Suspense>} />
                  <Route path="inventory/alerts" element={<Suspense fallback={<LoadingFallback />}><InventoryAlerts /></Suspense>} />
                  <Route path="inventory/reports" element={<Suspense fallback={<LoadingFallback />}><InventoryReports /></Suspense>} />
                  
                  {/* Track B Commerce Management Pages - Shipping Management */}
                  <Route path="shipping/methods" element={<Suspense fallback={<LoadingFallback />}><ShippingMethods /></Suspense>} />
                  <Route path="shipping/carriers" element={<Suspense fallback={<LoadingFallback />}><ShippingCarriers /></Suspense>} />
                  <Route path="shipping/tracking" element={<Suspense fallback={<LoadingFallback />}><ShippingTracking /></Suspense>} />
                  <Route path="shipping/reports" element={<Suspense fallback={<LoadingFallback />}><ShippingReports /></Suspense>} />
                  
                  <Route path="profile" element={<UserProfile />} />
                </Route>
                  
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                          </Routes>
                        </TenantRedirectWrapper>
                        <ThemeScrollToTop />
                        <DebugAuth />
                      </PublicTenantProvider>
                      </BrowserRouter>
                          </CartProvider>
                      </ContentProvider>
                    </ThemeProvider>
                  </GlobalContextProvider>
                </TenantAuthProvider>
              </PlatformAuthProvider>
            </ApiServiceProvider>
          </QueryClientProvider>
        </HelmetProvider>
        
        {/* Dev Debugger - FIXED: Removed recursive refresh loop */}
        <DevDebugger />
      </ErrorBoundary>
  );
}

export default App;
