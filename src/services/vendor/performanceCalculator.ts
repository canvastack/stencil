import { VendorOrder } from '../api/vendors';

export interface VendorMetrics {
  vendor_id: string;
  on_time_delivery: number; // 0-1
  quality_rating: number; // 0-1
  response_time: number; // 0-1 (normalized)
  completion_rate: number; // 0-1
  cost_efficiency: number; // 0-1
  overall_score: number;
  period: {
    start_date: string;
    end_date: string;
  };
}

export interface TrendAnalysis {
  direction: 'up' | 'down' | 'stable';
  percentage: number;
  significance: 'low' | 'medium' | 'high';
}

export interface PerformanceWeights {
  on_time_delivery: number;
  quality_rating: number;
  response_time: number;
  completion_rate: number;
  cost_efficiency: number;
}

export interface VendorPerformanceScore {
  vendor_id: string;
  scores: {
    on_time_delivery: number;
    quality_rating: number;
    response_time: number;
    completion_rate: number;
    cost_efficiency: number;
  };
  overall_score: number;
  weighted_score: number;
  performance_grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
  trend: TrendAnalysis;
}

export class VendorPerformanceCalculator {
  private static defaultWeights: PerformanceWeights = {
    on_time_delivery: 0.3,
    quality_rating: 0.25,
    response_time: 0.2,
    completion_rate: 0.15,
    cost_efficiency: 0.1
  };

  /**
   * Calculate overall vendor performance score
   */
  static calculateOverallScore(
    metrics: Omit<VendorMetrics, 'overall_score'>, 
    weights: PerformanceWeights = this.defaultWeights
  ): number {
    const weightedScore = Object.entries(weights).reduce((score, [metric, weight]) => {
      const metricValue = metrics[metric as keyof PerformanceWeights] || 0;
      return score + (metricValue * weight);
    }, 0);

    return Math.min(Math.max(weightedScore * 100, 0), 100); // Convert to 0-100 scale
  }

  /**
   * Calculate performance trend based on historical data
   */
  static calculateTrend(historical: VendorMetrics[]): TrendAnalysis {
    if (historical.length < 2) {
      return { direction: 'stable', percentage: 0, significance: 'low' };
    }

    // Use last 3 months vs previous 3 months for trend analysis
    const recent = historical.slice(-3);
    const older = historical.slice(-6, -3);

    if (recent.length === 0 || older.length === 0) {
      return { direction: 'stable', percentage: 0, significance: 'low' };
    }

    const recentAvg = recent.reduce((sum, m) => sum + m.overall_score, 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + m.overall_score, 0) / older.length;

    if (olderAvg === 0) {
      return { direction: 'stable', percentage: 0, significance: 'low' };
    }

    const changePercentage = ((recentAvg - olderAvg) / olderAvg) * 100;
    const absChange = Math.abs(changePercentage);

    let direction: 'up' | 'down' | 'stable';
    let significance: 'low' | 'medium' | 'high';

    if (changePercentage > 2) direction = 'up';
    else if (changePercentage < -2) direction = 'down';
    else direction = 'stable';

    if (absChange >= 10) significance = 'high';
    else if (absChange >= 5) significance = 'medium';
    else significance = 'low';

    return {
      direction,
      percentage: absChange,
      significance
    };
  }

  /**
   * Calculate on-time delivery rate
   */
  static calculateOnTimeDelivery(orders: VendorOrder[]): number {
    if (orders.length === 0) return 0;

    const onTimeOrders = orders.filter(order => 
      order.delivery_status === 'on_time' || order.delivery_status === 'early'
    ).length;

    return onTimeOrders / orders.length;
  }

  /**
   * Calculate average quality rating
   */
  static calculateQualityRating(orders: VendorOrder[]): number {
    const ordersWithRating = orders.filter(order => order.quality_rating && order.quality_rating > 0);
    
    if (ordersWithRating.length === 0) return 0;

    const avgRating = ordersWithRating.reduce((sum, order) => sum + (order.quality_rating || 0), 0) / ordersWithRating.length;
    
    return avgRating / 5; // Normalize to 0-1 scale (assuming 5-star rating)
  }

  /**
   * Calculate response time score (normalized)
   */
  static calculateResponseTimeScore(averageResponseHours: number): number {
    // Excellent: <= 4 hours (1.0), Good: <= 24 hours (0.8), Fair: <= 48 hours (0.6), Poor: > 48 hours (0.2)
    if (averageResponseHours <= 4) return 1.0;
    if (averageResponseHours <= 24) return 0.8;
    if (averageResponseHours <= 48) return 0.6;
    if (averageResponseHours <= 72) return 0.4;
    return 0.2;
  }

  /**
   * Calculate completion rate
   */
  static calculateCompletionRate(totalOrders: number, completedOrders: number): number {
    if (totalOrders === 0) return 0;
    return completedOrders / totalOrders;
  }

  /**
   * Calculate cost efficiency score
   */
  static calculateCostEfficiency(actualCost: number, estimatedCost: number): number {
    if (estimatedCost === 0) return 0;
    
    const ratio = actualCost / estimatedCost;
    
    // Best efficiency: actual <= estimated (1.0), decreasing score for overruns
    if (ratio <= 1.0) return 1.0;
    if (ratio <= 1.1) return 0.9; // 10% overrun
    if (ratio <= 1.2) return 0.7; // 20% overrun
    if (ratio <= 1.3) return 0.5; // 30% overrun
    if (ratio <= 1.5) return 0.3; // 50% overrun
    return 0.1; // >50% overrun
  }

  /**
   * Assign performance grade based on score
   */
  static getPerformanceGrade(score: number): 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F' {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'B+';
    if (score >= 80) return 'B';
    if (score >= 75) return 'C+';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Calculate comprehensive vendor performance score
   */
  static calculateVendorPerformance(
    vendorId: string,
    orders: VendorOrder[],
    averageResponseHours: number,
    weights?: PerformanceWeights
  ): VendorPerformanceScore {
    const completedOrders = orders.filter(order => order.status === 'completed');
    
    const scores = {
      on_time_delivery: this.calculateOnTimeDelivery(completedOrders),
      quality_rating: this.calculateQualityRating(completedOrders),
      response_time: this.calculateResponseTimeScore(averageResponseHours),
      completion_rate: this.calculateCompletionRate(orders.length, completedOrders.length),
      cost_efficiency: this.calculateAverageCostEfficiency(completedOrders)
    };

    const overall_score = (Object.values(scores).reduce((sum, score) => sum + score, 0) / 5) * 100;
    const weighted_score = this.calculateOverallScore({ 
      vendor_id: vendorId, 
      period: { start_date: '', end_date: '' },
      overall_score,
      ...scores 
    }, weights);

    return {
      vendor_id: vendorId,
      scores,
      overall_score,
      weighted_score,
      performance_grade: this.getPerformanceGrade(weighted_score),
      trend: { direction: 'stable', percentage: 0, significance: 'low' } // Calculated separately with historical data
    };
  }

  /**
   * Calculate average cost efficiency across orders
   */
  private static calculateAverageCostEfficiency(orders: VendorOrder[]): number {
    const ordersWithCosts = orders.filter(order => 
      order.estimated_price && order.final_price && order.estimated_price > 0
    );

    if (ordersWithCosts.length === 0) return 0.8; // Default neutral score

    const efficiencies = ordersWithCosts.map(order => 
      this.calculateCostEfficiency(order.final_price!, order.estimated_price!)
    );

    return efficiencies.reduce((sum, eff) => sum + eff, 0) / efficiencies.length;
  }

  /**
   * Calculate vendor risk score based on performance metrics
   */
  static calculateRiskScore(performance: VendorPerformanceScore): {
    score: number; // 0-100, higher = more risk
    level: 'low' | 'medium' | 'high' | 'critical';
    factors: string[];
  } {
    const riskFactors: string[] = [];
    let riskScore = 0;

    // Performance-based risk factors
    if (performance.scores.on_time_delivery < 0.8) {
      riskScore += 25;
      riskFactors.push('Poor on-time delivery rate');
    }

    if (performance.scores.quality_rating < 0.7) {
      riskScore += 20;
      riskFactors.push('Low quality ratings');
    }

    if (performance.scores.completion_rate < 0.9) {
      riskScore += 15;
      riskFactors.push('Low order completion rate');
    }

    if (performance.scores.response_time < 0.6) {
      riskScore += 15;
      riskFactors.push('Slow response times');
    }

    if (performance.scores.cost_efficiency < 0.7) {
      riskScore += 10;
      riskFactors.push('Cost overruns');
    }

    // Trend-based risk factors
    if (performance.trend.direction === 'down' && performance.trend.significance === 'high') {
      riskScore += 15;
      riskFactors.push('Declining performance trend');
    }

    // Overall score risk
    if (performance.overall_score < 60) {
      riskScore += 20;
      riskFactors.push('Overall poor performance');
    }

    // Determine risk level
    let level: 'low' | 'medium' | 'high' | 'critical';
    if (riskScore >= 80) level = 'critical';
    else if (riskScore >= 60) level = 'high';
    else if (riskScore >= 30) level = 'medium';
    else level = 'low';

    return {
      score: Math.min(riskScore, 100),
      level,
      factors: riskFactors
    };
  }

  /**
   * Get performance insights and recommendations
   */
  static getPerformanceInsights(performance: VendorPerformanceScore): {
    insights: string[];
    recommendations: string[];
    priority: 'low' | 'medium' | 'high';
  } {
    const insights: string[] = [];
    const recommendations: string[] = [];

    // Generate insights based on performance
    if (performance.overall_score >= 90) {
      insights.push('Exceptional vendor performance across all metrics');
      recommendations.push('Consider this vendor for premium and urgent orders');
    } else if (performance.overall_score >= 80) {
      insights.push('Strong vendor performance with room for improvement');
    } else if (performance.overall_score >= 70) {
      insights.push('Average performance with some concerning areas');
      recommendations.push('Schedule performance review and improvement plan');
    } else {
      insights.push('Below-average performance requiring immediate attention');
      recommendations.push('Consider vendor replacement or intensive improvement program');
    }

    // Specific metric insights
    if (performance.scores.on_time_delivery < 0.8) {
      insights.push('Delivery timeliness is a significant concern');
      recommendations.push('Discuss delivery optimization strategies');
    }

    if (performance.scores.quality_rating < 0.7) {
      insights.push('Quality standards need improvement');
      recommendations.push('Implement quality assurance checkpoints');
    }

    if (performance.scores.response_time < 0.6) {
      insights.push('Communication responsiveness is lacking');
      recommendations.push('Establish communication SLAs and monitoring');
    }

    // Priority assessment
    let priority: 'low' | 'medium' | 'high';
    if (performance.overall_score < 70) priority = 'high';
    else if (performance.overall_score < 85) priority = 'medium';
    else priority = 'low';

    return { insights, recommendations, priority };
  }
}