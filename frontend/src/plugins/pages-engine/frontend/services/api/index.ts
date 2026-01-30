export { default as apiClient, clientManager } from './client';
export type { ApiError } from './client';

export * from './errorHandler';
// export * from './auth'; // Removed - using main frontend auth service
export * from './products';
export * from './pages';
export * from './reviews';
export * from './inventory';
export * from './orders';
export * from './customers';
export * from './vendors';
export * from './dashboard';

import { authService } from '@/services/api/auth'; // Import from main frontend auth service
import { ordersService } from './orders';
import { customersService } from './customers';
import { vendorsService } from './vendors';
import { dashboardService } from './dashboard';

export const apiServices = {
  auth: authService,
  orders: ordersService,
  customers: customersService,
  vendors: vendorsService,
  dashboard: dashboardService,
};
