import { Vendor, VendorOrder } from '../api/vendors';
import { VendorPerformanceScore } from './performanceCalculator';

export interface VendorRiskProfile {
  vendor_id: string;
  vendor_name: string;
  overall_risk_score: number; // 0-100, higher = more risk
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_factors: RiskFactor[];
  risk_categories: {
    operational: RiskCategoryScore;
    financial: RiskCategoryScore;
    strategic: RiskCategoryScore;
    compliance: RiskCategoryScore;
    reputational: RiskCategoryScore;
  };
  mitigation_strategies: MitigationStrategy[];
  monitoring_alerts: RiskAlert[];
  last_assessment: string;
  next_review_date: string;
}

export interface RiskFactor {
  factor_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact_score: number; // 0-100
  likelihood: number; // 0-100
  description: string;
  evidence: string[];
  trend: 'improving' | 'stable' | 'deteriorating';
  first_detected: string;
  category: 'operational' | 'financial' | 'strategic' | 'compliance' | 'reputational';
}

export interface RiskCategoryScore {
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  primary_factors: string[];
  trend: 'improving' | 'stable' | 'deteriorating';
  weight: number;
}

export interface MitigationStrategy {
  strategy_id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimated_cost: number;
  expected_risk_reduction: number;
  implementation_timeline: string;
  responsible_party: 'vendor' | 'internal' | 'shared';
  status: 'proposed' | 'approved' | 'in_progress' | 'completed' | 'rejected';
}

export interface RiskAlert {
  alert_id: string;
  alert_type: 'performance_decline' | 'capacity_shortage' | 'quality_issue' | 'delivery_delay' | 'financial_concern';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  detected_at: string;
  threshold_breached: {
    metric: string;
    threshold: number;
    current_value: number;
  };
  auto_actions_taken: string[];
  requires_manual_review: boolean;
}

export interface RiskThresholds {
  performance_score_min: number;
  on_time_delivery_min: number;
  quality_rating_min: number;
  capacity_utilization_max: number;
  response_time_max: number;
  financial_stability_min: number;
  compliance_score_min: number;
}

export class VendorRiskAnalyzer {
  private static defaultThresholds: RiskThresholds = {
    performance_score_min: 70,
    on_time_delivery_min: 80,
    quality_rating_min: 3.5,
    capacity_utilization_max: 90,
    response_time_max: 48,
    financial_stability_min: 75,
    compliance_score_min: 85,
  };

  /**
   * Conduct comprehensive risk assessment for a vendor
   */
  static async assessVendorRisk(
    vendor: Vendor,
    vendorOrders: VendorOrder[],
    performanceScore: VendorPerformanceScore,
    thresholds: RiskThresholds = this.defaultThresholds
  ): Promise<VendorRiskProfile> {
    const riskFactors = await this.identifyRiskFactors(vendor, vendorOrders, performanceScore, thresholds);
    const riskCategories = this.categorizeRisks(riskFactors);
    const overallRiskScore = this.calculateOverallRiskScore(riskCategories);
    const riskLevel = this.determineRiskLevel(overallRiskScore);
    const mitigationStrategies = this.generateMitigationStrategies(riskFactors, vendor);
    const monitoringAlerts = this.generateMonitoringAlerts(riskFactors, thresholds);

    return {
      vendor_id: vendor.id.toString(),
      vendor_name: vendor.name,
      overall_risk_score: overallRiskScore,
      risk_level: riskLevel,
      risk_factors: riskFactors,
      risk_categories: riskCategories,
      mitigation_strategies: mitigationStrategies,
      monitoring_alerts: monitoringAlerts,
      last_assessment: new Date().toISOString(),
      next_review_date: this.calculateNextReviewDate(riskLevel),
    };
  }

  /**
   * Identify all risk factors for a vendor
   */
  private static async identifyRiskFactors(
    vendor: Vendor,
    orders: VendorOrder[],
    performance: VendorPerformanceScore,
    thresholds: RiskThresholds
  ): Promise<RiskFactor[]> {
    const factors: RiskFactor[] = [];

    // Operational Risk Factors
    factors.push(...this.assessOperationalRisks(vendor, orders, performance, thresholds));
    
    // Financial Risk Factors
    factors.push(...this.assessFinancialRisks(vendor, orders));
    
    // Strategic Risk Factors
    factors.push(...this.assessStrategicRisks(vendor, orders));
    
    // Compliance Risk Factors
    factors.push(...this.assessComplianceRisks(vendor));
    
    // Reputational Risk Factors
    factors.push(...this.assessReputationalRisks(vendor, performance));

    return factors.filter(factor => factor.impact_score > 10); // Only significant risks
  }

  /**
   * Assess operational risk factors
   */
  private static assessOperationalRisks(
    vendor: Vendor,
    orders: VendorOrder[],
    performance: VendorPerformanceScore,
    thresholds: RiskThresholds
  ): RiskFactor[] {
    const factors: RiskFactor[] = [];

    // Performance decline risk
    if (performance.overall_score < thresholds.performance_score_min) {
      factors.push({
        factor_type: 'poor_performance',
        severity: this.calculateSeverity(performance.overall_score, thresholds.performance_score_min, 'below'),
        impact_score: 100 - performance.overall_score,
        likelihood: 85,
        description: `Vendor performance score (${performance.overall_score}%) is below threshold (${thresholds.performance_score_min}%)`,
        evidence: ['Historical performance data', 'Recent order evaluations'],
        trend: performance.trend.direction === 'down' ? 'deteriorating' : 'stable',
        first_detected: new Date().toISOString(),
        category: 'operational',
      });
    }

    // On-time delivery risk
    if (performance.scores.on_time_delivery < thresholds.on_time_delivery_min) {
      factors.push({
        factor_type: 'delivery_delays',
        severity: this.calculateSeverity(performance.scores.on_time_delivery, thresholds.on_time_delivery_min, 'below'),
        impact_score: (thresholds.on_time_delivery_min - performance.scores.on_time_delivery) * 2,
        likelihood: 75,
        description: `On-time delivery rate (${performance.scores.on_time_delivery}%) below standard`,
        evidence: ['Delivery tracking data', 'Customer complaints'],
        trend: 'stable',
        first_detected: new Date().toISOString(),
        category: 'operational',
      });
    }

    // Capacity constraint risk
    const activeOrders = orders.filter(order => ['pending', 'accepted', 'in_progress'].includes(order.status)).length;
    const maxCapacity = this.estimateMaxCapacity(vendor);
    const capacityUtilization = (activeOrders / maxCapacity) * 100;

    if (capacityUtilization > thresholds.capacity_utilization_max) {
      factors.push({
        factor_type: 'capacity_constraints',
        severity: capacityUtilization > 95 ? 'critical' : 'high',
        impact_score: Math.min(100, capacityUtilization - thresholds.capacity_utilization_max),
        likelihood: 90,
        description: `Capacity utilization (${capacityUtilization.toFixed(1)}%) exceeds safe limits`,
        evidence: ['Current workload analysis', 'Resource allocation data'],
        trend: activeOrders > orders.length * 0.8 ? 'deteriorating' : 'stable',
        first_detected: new Date().toISOString(),
        category: 'operational',
      });
    }

    // Quality consistency risk
    if (performance.scores.quality_rating < thresholds.quality_rating_min) {
      factors.push({
        factor_type: 'quality_issues',
        severity: this.calculateSeverity(performance.scores.quality_rating, thresholds.quality_rating_min, 'below'),
        impact_score: (thresholds.quality_rating_min - performance.scores.quality_rating) * 20,
        likelihood: 70,
        description: `Quality rating (${performance.scores.quality_rating}) below expectations`,
        evidence: ['Quality assessments', 'Customer feedback'],
        trend: 'stable',
        first_detected: new Date().toISOString(),
        category: 'operational',
      });
    }

    return factors;
  }

  /**
   * Assess financial risk factors
   */
  private static assessFinancialRisks(vendor: Vendor, orders: VendorOrder[]): RiskFactor[] {
    const factors: RiskFactor[] = [];

    // Payment dependency risk
    const recentOrderValue = orders
      .filter(order => order.created_at && new Date(order.created_at) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))
      .reduce((sum, order) => sum + (order.final_price || order.estimated_price || 0), 0);

    const totalVendorValue = vendor.total_value || 0;
    const dependencyRatio = totalVendorValue > 0 ? (recentOrderValue / totalVendorValue) * 100 : 0;

    if (dependencyRatio > 50) {
      factors.push({
        factor_type: 'payment_dependency',
        severity: dependencyRatio > 80 ? 'high' : 'medium',
        impact_score: Math.min(100, dependencyRatio),
        likelihood: 60,
        description: `High dependency on our orders (${dependencyRatio.toFixed(1)}% of recent business)`,
        evidence: ['Order volume analysis', 'Financial dependency assessment'],
        trend: 'stable',
        first_detected: new Date().toISOString(),
        category: 'financial',
      });
    }

    // Cost escalation risk
    const costTrend = this.analyzeCostTrend(orders);
    if (costTrend.escalation_rate > 15) {
      factors.push({
        factor_type: 'cost_escalation',
        severity: costTrend.escalation_rate > 25 ? 'high' : 'medium',
        impact_score: Math.min(100, costTrend.escalation_rate * 2),
        likelihood: 75,
        description: `Significant cost escalation trend (${costTrend.escalation_rate}% increase)`,
        evidence: ['Historical pricing data', 'Cost structure analysis'],
        trend: 'deteriorating',
        first_detected: new Date().toISOString(),
        category: 'financial',
      });
    }

    return factors;
  }

  /**
   * Assess strategic risk factors
   */
  private static assessStrategicRisks(vendor: Vendor, orders: VendorOrder[]): RiskFactor[] {
    const factors: RiskFactor[] = [];

    // Single source dependency
    const specializations = vendor.specializations || [];
    const uniqueSpecializations = specializations.filter(spec => 
      !this.isCommonSpecialization(spec)
    );

    if (uniqueSpecializations.length > 0) {
      factors.push({
        factor_type: 'single_source_dependency',
        severity: 'medium',
        impact_score: uniqueSpecializations.length * 20,
        likelihood: 40,
        description: `Unique specializations create single-source dependency`,
        evidence: ['Specialization analysis', 'Market availability assessment'],
        trend: 'stable',
        first_detected: new Date().toISOString(),
        category: 'strategic',
      });
    }

    // Technology obsolescence risk
    if (this.assessTechnologyObsolescence(vendor)) {
      factors.push({
        factor_type: 'technology_obsolescence',
        severity: 'medium',
        impact_score: 50,
        likelihood: 30,
        description: 'Vendor technology may become obsolete',
        evidence: ['Technology assessment', 'Industry trend analysis'],
        trend: 'stable',
        first_detected: new Date().toISOString(),
        category: 'strategic',
      });
    }

    return factors;
  }

  /**
   * Assess compliance risk factors
   */
  private static assessComplianceRisks(vendor: Vendor): RiskFactor[] {
    const factors: RiskFactor[] = [];

    // Missing certifications
    const requiredCertifications = ['ISO_9001', 'ISO_14001'];
    const vendorCertifications = vendor.certifications || [];
    const missingCertifications = requiredCertifications.filter(cert => 
      !vendorCertifications.includes(cert)
    );

    if (missingCertifications.length > 0) {
      factors.push({
        factor_type: 'missing_certifications',
        severity: missingCertifications.length > 1 ? 'high' : 'medium',
        impact_score: missingCertifications.length * 25,
        likelihood: 90,
        description: `Missing required certifications: ${missingCertifications.join(', ')}`,
        evidence: ['Certification audit', 'Compliance checklist'],
        trend: 'stable',
        first_detected: new Date().toISOString(),
        category: 'compliance',
      });
    }

    // Data security concerns
    if (!vendor.bank_account_details || !vendor.tax_id) {
      factors.push({
        factor_type: 'incomplete_documentation',
        severity: 'medium',
        impact_score: 30,
        likelihood: 80,
        description: 'Incomplete vendor documentation and verification',
        evidence: ['Documentation audit', 'Verification checklist'],
        trend: 'stable',
        first_detected: new Date().toISOString(),
        category: 'compliance',
      });
    }

    return factors;
  }

  /**
   * Assess reputational risk factors
   */
  private static assessReputationalRisks(vendor: Vendor, performance: VendorPerformanceScore): RiskFactor[] {
    const factors: RiskFactor[] = [];

    // Poor customer satisfaction
    if ((vendor.rating || 0) < 3.0) {
      factors.push({
        factor_type: 'poor_satisfaction',
        severity: vendor.rating < 2.5 ? 'high' : 'medium',
        impact_score: (3.0 - (vendor.rating || 0)) * 30,
        likelihood: 70,
        description: `Low customer satisfaction rating (${vendor.rating}/5.0)`,
        evidence: ['Customer feedback', 'Review analysis'],
        trend: 'stable',
        first_detected: new Date().toISOString(),
        category: 'reputational',
      });
    }

    return factors;
  }

  /**
   * Categorize risks by type
   */
  private static categorizeRisks(riskFactors: RiskFactor[]): VendorRiskProfile['risk_categories'] {
    const categories = ['operational', 'financial', 'strategic', 'compliance', 'reputational'] as const;
    const result = {} as VendorRiskProfile['risk_categories'];

    for (const category of categories) {
      const categoryFactors = riskFactors.filter(factor => factor.category === category);
      const avgScore = categoryFactors.length > 0 
        ? categoryFactors.reduce((sum, factor) => sum + factor.impact_score, 0) / categoryFactors.length
        : 0;

      result[category] = {
        score: avgScore,
        level: this.determineRiskLevel(avgScore),
        primary_factors: categoryFactors.slice(0, 3).map(factor => factor.factor_type),
        trend: this.calculateCategoryTrend(categoryFactors),
        weight: this.getCategoryWeight(category),
      };
    }

    return result;
  }

  /**
   * Calculate overall risk score
   */
  private static calculateOverallRiskScore(categories: VendorRiskProfile['risk_categories']): number {
    const weightedSum = Object.values(categories).reduce((sum, category) => {
      return sum + (category.score * category.weight);
    }, 0);

    const totalWeight = Object.values(categories).reduce((sum, category) => sum + category.weight, 0);
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * Determine risk level based on score
   */
  private static determineRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  /**
   * Generate mitigation strategies
   */
  private static generateMitigationStrategies(riskFactors: RiskFactor[], vendor: Vendor): MitigationStrategy[] {
    const strategies: MitigationStrategy[] = [];
    
    // Performance improvement strategy
    const performanceRisks = riskFactors.filter(factor => factor.category === 'operational');
    if (performanceRisks.length > 0) {
      strategies.push({
        strategy_id: `perf_improve_${vendor.id}`,
        title: 'Performance Improvement Plan',
        description: 'Implement structured performance improvement with regular monitoring',
        priority: 'high',
        estimated_cost: 50000,
        expected_risk_reduction: 30,
        implementation_timeline: '90 days',
        responsible_party: 'shared',
        status: 'proposed',
      });
    }

    // Diversification strategy for high-dependency vendors
    const dependencyRisks = riskFactors.filter(factor => factor.factor_type === 'single_source_dependency');
    if (dependencyRisks.length > 0) {
      strategies.push({
        strategy_id: `diversify_${vendor.id}`,
        title: 'Vendor Diversification',
        description: 'Develop alternative vendors for critical specializations',
        priority: 'medium',
        estimated_cost: 100000,
        expected_risk_reduction: 50,
        implementation_timeline: '180 days',
        responsible_party: 'internal',
        status: 'proposed',
      });
    }

    return strategies;
  }

  /**
   * Generate monitoring alerts
   */
  private static generateMonitoringAlerts(riskFactors: RiskFactor[], thresholds: RiskThresholds): RiskAlert[] {
    const alerts: RiskAlert[] = [];

    // Performance alerts
    const criticalFactors = riskFactors.filter(factor => factor.severity === 'critical');
    for (const factor of criticalFactors) {
      alerts.push({
        alert_id: `alert_${factor.factor_type}_${Date.now()}`,
        alert_type: this.mapFactorToAlertType(factor.factor_type),
        severity: 'critical',
        message: `Critical risk detected: ${factor.description}`,
        detected_at: new Date().toISOString(),
        threshold_breached: {
          metric: factor.factor_type,
          threshold: this.getThresholdForFactor(factor.factor_type, thresholds),
          current_value: factor.impact_score,
        },
        auto_actions_taken: ['Risk assessment updated', 'Stakeholders notified'],
        requires_manual_review: true,
      });
    }

    return alerts;
  }

  // Helper methods
  private static calculateSeverity(current: number, threshold: number, direction: 'above' | 'below'): 'low' | 'medium' | 'high' | 'critical' {
    const diff = direction === 'below' ? threshold - current : current - threshold;
    const percentage = Math.abs(diff / threshold) * 100;
    
    if (percentage >= 30) return 'critical';
    if (percentage >= 20) return 'high';
    if (percentage >= 10) return 'medium';
    return 'low';
  }

  private static estimateMaxCapacity(vendor: Vendor): number {
    const tierCapacities = { standard: 8, premium: 12, exclusive: 15 };
    return tierCapacities[vendor.quality_tier as keyof typeof tierCapacities] || 8;
  }

  private static analyzeCostTrend(orders: VendorOrder[]): { escalation_rate: number; trend: string } {
    // Simplified cost trend analysis
    const recentOrders = orders.filter(order => order.created_at && 
      new Date(order.created_at) > new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
    );
    
    if (recentOrders.length < 3) return { escalation_rate: 0, trend: 'stable' };
    
    // Calculate average cost per unit for recent vs older orders
    const mid = Math.floor(recentOrders.length / 2);
    const olderOrders = recentOrders.slice(0, mid);
    const newerOrders = recentOrders.slice(mid);
    
    const olderAvg = olderOrders.reduce((sum, order) => sum + (order.final_price || order.estimated_price || 0), 0) / olderOrders.length;
    const newerAvg = newerOrders.reduce((sum, order) => sum + (order.final_price || order.estimated_price || 0), 0) / newerOrders.length;
    
    const escalationRate = olderAvg > 0 ? ((newerAvg - olderAvg) / olderAvg) * 100 : 0;
    
    return { escalation_rate: escalationRate, trend: escalationRate > 5 ? 'increasing' : 'stable' };
  }

  private static isCommonSpecialization(specialization: string): boolean {
    const commonSpecs = ['manufacturing', 'assembly', 'packaging', 'logistics'];
    return commonSpecs.some(spec => specialization.toLowerCase().includes(spec));
  }

  private static assessTechnologyObsolescence(vendor: Vendor): boolean {
    // Simplified assessment - would analyze vendor's technology stack
    const oldTechIndicators = ['legacy', 'manual', 'traditional'];
    const vendorDescription = (vendor.notes || '').toLowerCase();
    
    return oldTechIndicators.some(indicator => vendorDescription.includes(indicator));
  }

  private static calculateCategoryTrend(factors: RiskFactor[]): 'improving' | 'stable' | 'deteriorating' {
    const deteriorating = factors.filter(f => f.trend === 'deteriorating').length;
    const improving = factors.filter(f => f.trend === 'improving').length;
    
    if (deteriorating > improving) return 'deteriorating';
    if (improving > deteriorating) return 'improving';
    return 'stable';
  }

  private static getCategoryWeight(category: string): number {
    const weights = {
      operational: 0.35,
      financial: 0.25,
      strategic: 0.20,
      compliance: 0.15,
      reputational: 0.05,
    };
    return weights[category as keyof typeof weights] || 0.1;
  }

  private static calculateNextReviewDate(riskLevel: string): string {
    const daysToAdd = {
      critical: 7,
      high: 14,
      medium: 30,
      low: 90,
    };
    
    const days = daysToAdd[riskLevel as keyof typeof daysToAdd] || 30;
    const nextDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    
    return nextDate.toISOString();
  }

  private static mapFactorToAlertType(factorType: string): RiskAlert['alert_type'] {
    const mapping = {
      poor_performance: 'performance_decline',
      delivery_delays: 'delivery_delay',
      capacity_constraints: 'capacity_shortage',
      quality_issues: 'quality_issue',
      payment_dependency: 'financial_concern',
    };
    
    return mapping[factorType as keyof typeof mapping] || 'performance_decline';
  }

  private static getThresholdForFactor(factorType: string, thresholds: RiskThresholds): number {
    const mapping = {
      poor_performance: thresholds.performance_score_min,
      delivery_delays: thresholds.on_time_delivery_min,
      capacity_constraints: thresholds.capacity_utilization_max,
      quality_issues: thresholds.quality_rating_min,
    };
    
    return mapping[factorType as keyof typeof mapping] || 0;
  }
}