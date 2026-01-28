import { apiClient } from './client';

export interface OrderRecommendationsParams {
  customerId: string;
}

export interface MarketTrendsParams {
  months?: number;
}

export interface InventoryOptimizationParams {
  forecast_months?: number;
}

export interface DemandForecastParams {
  months?: number;
}

export interface RevenuePredictionsParams {
  months?: number;
}

export interface OrderSuccessPredictionParams {
  orderId: string;
}

export const intelligenceApi = {
  /**
   * Get AI dashboard overview
   */
  getAIDashboard: async () => {
    const response = await apiClient.get('/admin/intelligence/dashboard');
    return response.data;
  },

  /**
   * Generate order recommendations for a customer
   */
  generateOrderRecommendations: async (params: OrderRecommendationsParams) => {
    const response = await apiClient.get(`/admin/intelligence/recommendations/customer/${params.customerId}`);
    return response.data;
  },

  /**
   * Predict order success probability
   */
  predictOrderSuccess: async (params: OrderSuccessPredictionParams) => {
    const response = await apiClient.get(`/admin/intelligence/predictions/order-success/${params.orderId}`);
    return response.data;
  },

  /**
   * Get market trend predictions
   */
  getMarketTrends: async (params: MarketTrendsParams = {}) => {
    const response = await apiClient.get('/admin/intelligence/market-trends', { params });
    return response.data;
  },

  /**
   * Get inventory optimization recommendations
   */
  getInventoryOptimization: async (params: InventoryOptimizationParams = {}) => {
    const response = await apiClient.get('/admin/intelligence/inventory-optimization', { params });
    return response.data;
  },

  /**
   * Get demand forecast
   */
  getDemandForecast: async (params: DemandForecastParams = {}) => {
    const response = await apiClient.get('/admin/intelligence/demand-forecast', { params });
    return response.data;
  },

  /**
   * Get customer churn predictions
   */
  getCustomerChurnPredictions: async () => {
    const response = await apiClient.get('/admin/intelligence/customer-churn');
    return response.data;
  },

  /**
   * Get revenue predictions
   */
  getRevenuePredictions: async (params: RevenuePredictionsParams = {}) => {
    const response = await apiClient.get('/admin/intelligence/revenue-predictions', { params });
    return response.data;
  },

  /**
   * Generate data insights
   */
  generateDataInsights: async () => {
    const response = await apiClient.get('/admin/intelligence/data-insights');
    return response.data;
  },
};

// Type definitions for API responses
export interface AIDashboardResponse {
  success: boolean;
  data: {
    market_outlook: string;
    market_confidence: number;
    inventory_savings: number;
    service_level: number;
    high_risk_customers: number;
    average_churn_rate: number;
    recent_recommendations: number;
    ai_features_active: {
      recommendations: boolean;
      market_trends: boolean;
      inventory_optimization: boolean;
      churn_prediction: boolean;
      demand_forecasting: boolean;
    };
    last_updated: string;
  };
}

export interface OrderRecommendationsResponse {
  success: boolean;
  data: {
    customer_id: string;
    product_recommendations: Array<{
      product_id: string;
      product_name: string;
      reason: string;
      confidence: number;
      expected_order_value: {
        amount: number;
        currency: string;
        formatted: string;
      };
      seasonal_relevance: number;
      material_match: boolean;
      complexity_match: boolean;
      recommendation_strength: string;
    }>;
    vendor_recommendations: Array<{
      vendor_id: string;
      vendor_name: string;
      reason: string;
      confidence: number;
      expected_lead_time: number;
      quality_score: number;
      price_competitiveness: number;
      past_collaboration: boolean;
      capacity_availability: number;
    }>;
    pricing_recommendations: Array<{
      strategy: string;
      strategy_category: string;
      reason: string;
      suggested_markup: number;
      markup_percentage: number;
      confidence: number;
      expected_impact: string;
      risk_level: string;
    }>;
    confidence_score: number;
    reasoning: string[];
    generated_at: string;
  };
}

export interface MarketTrendsResponse {
  success: boolean;
  data: {
    tenant_id: string;
    demand_trends: Array<{
      month: number;
      demand_change: number;
      confidence: number;
    }>;
    pricing_trends: Array<{
      month: number;
      price_change: number;
      recommended_adjustment: number;
      market_position: string;
    }>;
    material_trends: any[];
    competitor_trends: any[];
    recommendations: string[];
    confidence: number;
    timeframe_months: number;
    generated_at: string;
    market_outlook: string;
    key_opportunities: string[];
    key_risks: string[];
    strategic_recommendations: string[];
    monthly_summary: Array<{
      month: number;
      demand_outlook: string;
      pricing_outlook: string;
      overall_outlook: string;
      confidence: number;
    }>;
  };
}

export interface InventoryOptimizationResponse {
  success: boolean;
  data: {
    tenant_id: string;
    recommended_stock_levels: Record<string, number>;
    reorder_points: Record<string, number>;
    economic_order_quantities: Record<string, number>;
    cost_savings: number;
    service_level: number;
    risk_assessment: {
      stockout_risk: string;
      overstock_risk: string;
      supplier_risk: string;
    };
    implementation_plan: Record<string, string>;
    forecast_accuracy: number;
    generated_at: string;
    optimization_summary: {
      total_products: number;
      products_optimized: number;
      optimization_rate: number;
      projected_savings: number;
      service_level: number;
      forecast_reliability: number;
      implementation_complexity: string;
    };
    high_priority_products: Array<{
      product_id: string;
      recommended_stock: number;
      reorder_point: number;
      eoq: number;
      priority_reason: string;
    }>;
  };
}

export interface CustomerChurnResponse {
  success: boolean;
  data: {
    tenant_id: string;
    predictions: Array<{
      customer_id: string;
      customer_name: string;
      churn_probability: number;
      risk_level: string;
      key_factors: string[];
      retention_recommendations: string[];
    }>;
    high_risk_customers: Array<any>;
    average_churn_rate: number;
    total_customers: number;
    model_accuracy: number;
    generated_at: string;
    customers_by_risk_level: {
      very_high: any[];
      high: any[];
      medium: any[];
      low: any[];
      very_low: any[];
    };
    churn_statistics: {
      total_customers: number;
      very_high_risk: number;
      high_risk: number;
      medium_risk: number;
      low_risk: number;
      very_low_risk: number;
      average_churn_rate: number;
      predicted_churners: number;
    };
  };
}