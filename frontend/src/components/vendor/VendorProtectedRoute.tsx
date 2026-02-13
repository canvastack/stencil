import { Navigate } from 'react-router-dom';
import { useVendorAuth } from '@/contexts/VendorAuthContext';

interface VendorProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * VendorProtectedRoute Component
 * 
 * Protects vendor portal routes by checking authentication status.
 * Redirects unauthenticated users to the vendor login page.
 * 
 * Requirements:
 * - 1.8: Redirect to /vendor/login when not authenticated
 * - 11.11: Protect all vendor routes with authentication check
 * 
 * @example
 * <Route path="/vendor/dashboard" element={
 *   <VendorProtectedRoute>
 *     <VendorDashboard />
 *   </VendorProtectedRoute>
 * } />
 */
export const VendorProtectedRoute = ({ children }: VendorProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useVendorAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to vendor login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/vendor/login" replace />;
  }

  // Render protected content
  return <>{children}</>;
};
