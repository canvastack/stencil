import { useAdminStore } from '@/stores/adminStore';

describe('Admin Store - Integration Tests', () => {
  beforeEach(() => {
    const store = useAdminStore.getState();
    store.setUser(null);
    store.setSidebarCollapsed(false);
    store.setCurrentPage('dashboard');
  });

  describe('State Management', () => {
    test('should initialize with default state', () => {
      const store = useAdminStore.getState();

      expect(store.user).toBeNull();
      expect(store.sidebarCollapsed).toBe(false);
      expect(store.currentPage).toBe('dashboard');

      console.log('✓ Admin store initialized with default state');
    });

    test('should set user', () => {
      const store = useAdminStore.getState();

      const mockUser = {
        id: 'user-1',
        email: 'admin@test.com',
        name: 'Test Admin',
        role: 'admin' as const,
        avatar: 'https://example.com/avatar.jpg',
      };

      store.setUser(mockUser);
      const currentStore = useAdminStore.getState();

      expect(currentStore.user).toEqual(mockUser);
      expect(currentStore.user?.email).toBe('admin@test.com');
      expect(currentStore.user?.role).toBe('admin');

      console.log('✓ User set correctly');
    });

    test('should clear user', () => {
      const store = useAdminStore.getState();

      const mockUser = {
        id: 'user-1',
        email: 'admin@test.com',
        name: 'Test Admin',
        role: 'admin' as const,
      };

      store.setUser(mockUser);
      expect(useAdminStore.getState().user).not.toBeNull();

      store.setUser(null);
      expect(useAdminStore.getState().user).toBeNull();

      console.log('✓ User cleared correctly');
    });
  });

  describe('Sidebar State Management', () => {
    test('should toggle sidebar state', () => {
      const store = useAdminStore.getState();

      expect(store.sidebarCollapsed).toBe(false);

      store.toggleSidebar();
      expect(useAdminStore.getState().sidebarCollapsed).toBe(true);

      store.toggleSidebar();
      expect(useAdminStore.getState().sidebarCollapsed).toBe(false);

      console.log('✓ Sidebar toggled correctly');
    });

    test('should set sidebar collapsed state directly', () => {
      const store = useAdminStore.getState();

      store.setSidebarCollapsed(true);
      expect(useAdminStore.getState().sidebarCollapsed).toBe(true);

      store.setSidebarCollapsed(false);
      expect(useAdminStore.getState().sidebarCollapsed).toBe(false);

      console.log('✓ Sidebar collapsed state set directly');
    });

    test('should persist sidebar state preference', () => {
      const store = useAdminStore.getState();

      store.setSidebarCollapsed(true);
      const firstAccess = useAdminStore.getState();
      expect(firstAccess.sidebarCollapsed).toBe(true);

      const secondAccess = useAdminStore.getState();
      expect(secondAccess.sidebarCollapsed).toBe(true);

      console.log('✓ Sidebar state persists correctly');
    });
  });

  describe('Page Navigation State', () => {
    test('should set current page', () => {
      const store = useAdminStore.getState();

      store.setCurrentPage('products');
      expect(useAdminStore.getState().currentPage).toBe('products');

      store.setCurrentPage('orders');
      expect(useAdminStore.getState().currentPage).toBe('orders');

      store.setCurrentPage('customers');
      expect(useAdminStore.getState().currentPage).toBe('customers');

      console.log('✓ Current page set correctly');
    });

    test('should maintain current page across state updates', () => {
      const store = useAdminStore.getState();

      store.setCurrentPage('settings');
      store.setSidebarCollapsed(true);

      const currentStore = useAdminStore.getState();
      expect(currentStore.currentPage).toBe('settings');
      expect(currentStore.sidebarCollapsed).toBe(true);

      console.log('✓ Current page maintained across state updates');
    });
  });

  describe('Logout Functionality', () => {
    test('should logout and reset state', () => {
      const store = useAdminStore.getState();

      const mockUser = {
        id: 'user-1',
        email: 'admin@test.com',
        name: 'Test Admin',
        role: 'admin' as const,
      };

      store.setUser(mockUser);
      store.setCurrentPage('products');
      store.setSidebarCollapsed(true);

      expect(useAdminStore.getState().user).not.toBeNull();
      expect(useAdminStore.getState().currentPage).toBe('products');

      store.logout();

      const currentStore = useAdminStore.getState();
      expect(currentStore.user).toBeNull();
      expect(currentStore.currentPage).toBe('dashboard');

      console.log('✓ Logout resets user and current page correctly');
    });

    test('should preserve sidebar state on logout', () => {
      const store = useAdminStore.getState();

      const mockUser = {
        id: 'user-1',
        email: 'admin@test.com',
        name: 'Test Admin',
        role: 'admin' as const,
      };

      store.setUser(mockUser);
      store.setSidebarCollapsed(true);

      store.logout();

      const currentStore = useAdminStore.getState();
      expect(currentStore.user).toBeNull();
      expect(currentStore.sidebarCollapsed).toBe(true);

      console.log('✓ Sidebar state preserved on logout');
    });
  });

  describe('State Persistence', () => {
    test('should persist sidebar preference across store access', () => {
      const store = useAdminStore.getState();

      store.setSidebarCollapsed(true);

      const firstAccess = useAdminStore.getState();
      expect(firstAccess.sidebarCollapsed).toBe(true);

      const secondAccess = useAdminStore.getState();
      expect(secondAccess.sidebarCollapsed).toBe(true);

      console.log('✓ Sidebar preference persisted across store access');
    });

    test('should handle multiple state changes correctly', () => {
      const store = useAdminStore.getState();

      const mockUser = {
        id: 'user-1',
        email: 'admin@test.com',
        name: 'Test Admin',
        role: 'admin' as const,
      };

      store.setUser(mockUser);
      store.setCurrentPage('orders');
      store.setSidebarCollapsed(true);
      store.toggleSidebar();
      store.setCurrentPage('products');

      const currentStore = useAdminStore.getState();
      expect(currentStore.user?.id).toBe('user-1');
      expect(currentStore.currentPage).toBe('products');
      expect(currentStore.sidebarCollapsed).toBe(false);

      console.log('✓ Multiple state changes handled correctly');
    });
  });
});
