export interface CatalogOverview {
  totalProducts: number;
  publishedProducts: number;
  draftProducts: number;
  archivedProducts: number;
  outOfStock: number;
  lowStock: number;
  totalValue: number;
  averagePrice: number;
}

export interface TrendingProduct {
  id: string;
  uuid: string;
  name: string;
  slug: string;
  views: number;
  sales: number;
  revenue: number;
  conversionRate: number;
  stockQuantity: number;
  status: 'draft' | 'published' | 'archived';
}

export interface StockAlert {
  id: string;
  uuid: string;
  name: string;
  slug: string;
  stockQuantity: number;
  lowStockThreshold: number;
  status: 'out_of_stock' | 'low_stock' | 'overstock';
  lastRestocked?: string;
  averageDailySales?: number;
  daysUntilStockout?: number;
}

export interface CategoryRevenue {
  category: string;
  categorySlug: string;
  productCount: number;
  revenue: number;
  averagePrice: number;
  totalSales: number;
  growthPercentage?: number;
}

export interface ProductPerformance {
  topSelling: TrendingProduct[];
  trending: TrendingProduct[];
  slowMoving: Array<{
    id: string;
    uuid: string;
    name: string;
    slug: string;
    stockQuantity: number;
    lastSold?: string;
    daysSinceLastSale?: number;
  }>;
}

export interface InventoryHealth {
  outOfStock: StockAlert[];
  lowStock: StockAlert[];
  overstock: StockAlert[];
  stockTurnoverRate: number;
  averageStockAge: number;
}

export interface ProductAnalytics {
  overview: CatalogOverview;
  performance: ProductPerformance;
  inventory: InventoryHealth;
  revenueByCategory: CategoryRevenue[];
  lastUpdated: string;
}

export interface AnalyticsDateRange {
  from: string;
  to: string;
}

export interface AnalyticsFilters {
  dateRange?: AnalyticsDateRange;
  category?: string;
  status?: string;
}

export interface AnalyticsResponse {
  analytics: ProductAnalytics;
  meta: {
    generatedAt: string;
    dataPoints: number;
    cacheExpiry: string;
  };
}
