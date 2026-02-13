import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { VendorLayout } from '@/layouts/VendorLayout';
import { VendorAuthProvider } from '@/contexts/VendorAuthContext';

// Mock the child components
vi.mock('@/components/vendor/VendorSidebar', () => ({
  VendorSidebar: () => <div data-testid="vendor-sidebar">Vendor Sidebar</div>,
}));

vi.mock('@/components/vendor/VendorHeader', () => ({
  VendorHeader: () => <div data-testid="vendor-header">Vendor Header</div>,
}));

vi.mock('@/components/vendor/VendorFooter', () => ({
  VendorFooter: () => <div data-testid="vendor-footer">Vendor Footer</div>,
}));

vi.mock('@/components/ScrollToTop', () => ({
  ScrollToTop: () => <div data-testid="scroll-to-top">Scroll To Top</div>,
}));

vi.mock('@/components/DebugErrorBoundary', () => ({
  DebugErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock the vendor auth hook
const mockVendorAuth = {
  user: {
    id: '1',
    uuid: 'user-uuid',
    name: 'Test Vendor User',
    email: 'vendor@test.com',
    account_type: 'vendor' as const,
  },
  vendor: {
    id: '1',
    uuid: 'vendor-uuid',
    company_name: 'Test Vendor Company',
    email: 'vendor@test.com',
    phone: '1234567890',
    status: 'active' as const,
  },
  isAuthenticated: true,
  isLoading: false,
  error: null,
  login: vi.fn(),
  logout: vi.fn(),
  refreshProfile: vi.fn(),
  clearError: vi.fn(),
};

vi.mock('@/contexts/VendorAuthContext', () => ({
  VendorAuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useVendorAuth: () => mockVendorAuth,
}));

// Mock the admin store
vi.mock('@/stores/adminStore', () => ({
  useAdminStore: () => ({
    sidebarCollapsed: false,
    toggleSidebar: vi.fn(),
  }),
}));

describe('VendorLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the layout with all components when authenticated', () => {
    render(
      <BrowserRouter>
        <VendorAuthProvider>
          <VendorLayout />
        </VendorAuthProvider>
      </BrowserRouter>
    );

    // Check that all main components are rendered
    expect(screen.getByTestId('vendor-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('vendor-header')).toBeInTheDocument();
    expect(screen.getByTestId('vendor-footer')).toBeInTheDocument();
    expect(screen.getByTestId('scroll-to-top')).toBeInTheDocument();
  });

  it('applies correct responsive layout classes', () => {
    const { container } = render(
      <BrowserRouter>
        <VendorAuthProvider>
          <VendorLayout />
        </VendorAuthProvider>
      </BrowserRouter>
    );

    // Check for responsive layout structure
    const mainContainer = container.querySelector('.min-h-screen');
    expect(mainContainer).toBeInTheDocument();
    expect(mainContainer).toHaveClass('flex', 'bg-purple-50/30', 'dark:bg-purple-950/20');
  });

  it('has proper main content area with overflow handling', () => {
    const { container } = render(
      <BrowserRouter>
        <VendorAuthProvider>
          <VendorLayout />
        </VendorAuthProvider>
      </BrowserRouter>
    );

    const mainContent = container.querySelector('#vendor-main-content');
    expect(mainContent).toBeInTheDocument();
    expect(mainContent).toHaveClass('absolute', 'inset-0', 'overflow-y-auto', 'bg-background');
  });

  it('redirects to login when not authenticated', () => {
    // Mock unauthenticated state
    vi.mocked(mockVendorAuth).isAuthenticated = false;
    vi.mocked(mockVendorAuth).user = null;
    vi.mocked(mockVendorAuth).vendor = null;

    render(
      <BrowserRouter>
        <VendorAuthProvider>
          <VendorLayout />
        </VendorAuthProvider>
      </BrowserRouter>
    );

    // Should not render the layout components
    expect(screen.queryByTestId('vendor-sidebar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('vendor-header')).not.toBeInTheDocument();
  });
});
