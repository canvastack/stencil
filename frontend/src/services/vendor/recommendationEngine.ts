import { Vendor } from '../api/vendors';
import { VendorPerformanceCalculator, VendorPerformanceScore } from './performanceCalculator';

export interface OrderRequirements {
  material: string;
  process: string;
  quantity: number;
  budget_min?: number;
  budget_max?: number;
  deadline_days?: number;
  quality_tier?: 'standard' | 'premium' | 'exclusive';
  complexity_level?: 'simple' | 'medium' | 'complex';
  delivery_location?: {
    city?: string;
    province?: string;
    country?: string;
  };
  special_requirements?: string[];
}

export interface VendorRecommendation {
  vendor: Vendor;
  overall_score: number;
  sub_scores: {
    specialization_match: number;
    performance_score: number;
    capacity_availability: number;
    cost_competitiveness: number;
    reliability_score: number;
    geographic_proximity: number;
    quality_consistency: number;
  };
  estimated_price: number;
  estimated_lead_time: number;
  confidence_level: 'high' | 'medium' | 'low';
  risk_level: 'low' | 'medium' | 'high';
  match_explanation: string;
  competitive_advantages: string[];
  potential_concerns: string[];
  recommendation_reason: string;
}

export interface RecommendationWeights {
  specialization_match: number;
  performance_score: number;
  capacity_availability: number;
  cost_competitiveness: number;
  reliability_score: number;
  geographic_proximity: number;
  quality_consistency: number;
}

export class VendorRecommendationEngine {
  private static defaultWeights: RecommendationWeights = {
    specialization_match: 0.25,
    performance_score: 0.20,
    capacity_availability: 0.15,
    cost_competitiveness: 0.15,
    reliability_score: 0.10,
    geographic_proximity: 0.08,
    quality_consistency: 0.07,
  };

  /**
   * Find best vendor matches for order requirements
   */
  static async findBestMatches(
    vendors: Vendor[],
    orderRequirements: OrderRequirements,
    weights: RecommendationWeights = this.defaultWeights,
    limit: number = 10
  ): Promise<VendorRecommendation[]> {
    const recommendations: VendorRecommendation[] = [];

    for (const vendor of vendors) {
      if (vendor.status !== 'active') continue;

      const recommendation = await this.calculateRecommendation(vendor, orderRequirements, weights);
      
      // Filter out very low scoring vendors
      if (recommendation.overall_score >= 30) {
        recommendations.push(recommendation);
      }
    }

    // Sort by overall score (highest first)
    recommendations.sort((a, b) => b.overall_score - a.overall_score);

    // Apply advanced filtering and ranking
    const refinedRecommendations = this.applyAdvancedRanking(recommendations, orderRequirements);

    return refinedRecommendations.slice(0, limit);
  }

  /**
   * Calculate comprehensive recommendation for a vendor
   */
  private static async calculateRecommendation(
    vendor: Vendor,
    requirements: OrderRequirements,
    weights: RecommendationWeights
  ): Promise<VendorRecommendation> {
    const subScores = {
      specialization_match: this.calculateSpecializationMatch(vendor, requirements),
      performance_score: this.normalizePerformanceScore(vendor.performance_score || 0),
      capacity_availability: await this.calculateCapacityAvailability(vendor, requirements),
      cost_competitiveness: this.calculateCostCompetitiveness(vendor, requirements),
      reliability_score: this.calculateReliabilityScore(vendor),
      geographic_proximity: this.calculateGeographicProximity(vendor, requirements),
      quality_consistency: this.calculateQualityConsistency(vendor),
    };

    // Calculate weighted overall score
    const overallScore = Object.entries(weights).reduce((score, [metric, weight]) => {
      return score + (subScores[metric as keyof typeof subScores] * weight);
    }, 0) * 100;

    const estimatedPrice = this.estimatePrice(vendor, requirements);
    const estimatedLeadTime = this.estimateLeadTime(vendor, requirements);
    const confidenceLevel = this.calculateConfidenceLevel(vendor, requirements, subScores);
    const riskLevel = this.assessRisk(vendor, subScores);

    const matchExplanation = this.generateMatchExplanation(subScores, requirements);
    const competitiveAdvantages = this.identifyCompetitiveAdvantages(vendor, subScores);
    const potentialConcerns = this.identifyPotentialConcerns(vendor, subScores);
    const recommendationReason = this.generateRecommendationReason(vendor, subScores, overallScore);

    return {
      vendor,
      overall_score: overallScore,
      sub_scores: Object.fromEntries(
        Object.entries(subScores).map(([key, value]) => [key, value * 100])
      ) as any,
      estimated_price: estimatedPrice,
      estimated_lead_time: estimatedLeadTime,
      confidence_level: confidenceLevel,
      risk_level: riskLevel,
      match_explanation: matchExplanation,
      competitive_advantages: competitiveAdvantages,
      potential_concerns: potentialConcerns,
      recommendation_reason: recommendationReason,
    };
  }

  /**
   * Calculate specialization match score
   */
  private static calculateSpecializationMatch(vendor: Vendor, requirements: OrderRequirements): number {
    const vendorSpecs = vendor.specializations || [];
    
    // Define required specializations based on order requirements
    const requiredSpecs = this.extractRequiredSpecializations(requirements);
    
    if (requiredSpecs.length === 0) return 0.7; // Neutral score if no specific requirements
    
    const matchCount = requiredSpecs.filter(spec => 
      vendorSpecs.some(vendorSpec => 
        vendorSpec.toLowerCase().includes(spec.toLowerCase()) ||
        spec.toLowerCase().includes(vendorSpec.toLowerCase())
      )
    ).length;

    const baseScore = matchCount / requiredSpecs.length;

    // Bonus for exact matches
    const exactMatches = requiredSpecs.filter(spec => vendorSpecs.includes(spec)).length;
    const exactBonus = exactMatches * 0.1;

    // Bonus for quality tier alignment
    const qualityBonus = this.calculateQualityTierBonus(vendor, requirements);

    return Math.min(baseScore + exactBonus + qualityBonus, 1.0);
  }

  /**
   * Extract required specializations from order requirements
   */
  private static extractRequiredSpecializations(requirements: OrderRequirements): string[] {
    const specs: string[] = [];
    
    // Material-based specializations
    specs.push(requirements.material.toLowerCase());
    
    // Process-based specializations
    specs.push(requirements.process.toLowerCase());
    
    // Combined material-process specialization
    specs.push(`${requirements.material.toLowerCase()}_${requirements.process.toLowerCase()}`);
    
    // Complexity-based specializations
    if (requirements.complexity_level) {
      specs.push(`${requirements.complexity_level}_work`);
    }
    
    // Special requirements
    if (requirements.special_requirements) {
      specs.push(...requirements.special_requirements.map(req => req.toLowerCase()));
    }
    
    return specs.filter(spec => spec.length > 0);
  }

  /**
   * Calculate capacity availability score
   */
  private static async calculateCapacityAvailability(vendor: Vendor, requirements: OrderRequirements): Promise<number> {
    // This would typically query the database for current vendor workload
    // For now, we'll use a simplified calculation based on vendor tier and estimated capacity
    
    const maxCapacity = this.getEstimatedMaxCapacity(vendor);
    const currentWorkload = vendor.total_orders || 0; // This should be current active orders
    
    const utilizationRate = currentWorkload / maxCapacity;
    
    // Calculate availability score (1.0 = fully available, 0.0 = at capacity)
    let availabilityScore = Math.max(0, 1 - utilizationRate);
    
    // Adjust for order size
    const orderSizeImpact = this.calculateOrderSizeImpact(requirements.quantity, vendor);
    availabilityScore *= orderSizeImpact;
    
    // Adjust for deadline urgency
    if (requirements.deadline_days && requirements.deadline_days < (vendor.average_lead_time_days || 14)) {
      availabilityScore *= 0.7; // Reduce score for urgent deadlines
    }
    
    return Math.max(0, Math.min(1, availabilityScore));
  }

  /**
   * Calculate cost competitiveness score
   */
  private static calculateCostCompetitiveness(vendor: Vendor, requirements: OrderRequirements): number {
    // Base pricing tier adjustment
    const tierMultipliers = {
      standard: 1.0,
      premium: 1.25,
      exclusive: 1.6,
    };
    
    const tierMultiplier = tierMultipliers[vendor.quality_tier as keyof typeof tierMultipliers] || 1.0;
    
    // Calculate estimated base cost
    const baseCost = this.calculateBaseCost(requirements);
    const estimatedVendorCost = baseCost * tierMultiplier;
    
    // Compare with budget if available
    let competitivenessScore = 0.7; // Default neutral score
    
    if (requirements.budget_max) {
      if (estimatedVendorCost <= requirements.budget_max) {
        // Within budget - calculate how competitive
        const budgetUtilization = estimatedVendorCost / requirements.budget_max;
        competitivenessScore = 1 - (budgetUtilization * 0.5); // Lower cost = higher score
      } else {
        // Over budget - penalize
        const overBudgetRatio = estimatedVendorCost / requirements.budget_max;
        competitivenessScore = Math.max(0.1, 1 / overBudgetRatio);
      }
    }
    
    // Adjust for vendor's historical cost efficiency
    const costEfficiencyAdjustment = this.getVendorCostEfficiency(vendor);
    competitivenessScore *= costEfficiencyAdjustment;
    
    return Math.max(0, Math.min(1, competitivenessScore));
  }

  /**
   * Calculate reliability score based on historical performance
   */
  private static calculateReliabilityScore(vendor: Vendor): number {
    const metrics = {
      onTimeDelivery: vendor.completion_rate || 80,
      qualityConsistency: (vendor.rating || 3.5) / 5 * 100,
      communicationScore: 85, // This would be calculated from actual data
      contractCompliance: 90, // This would be calculated from actual data
    };
    
    // Weighted average of reliability factors
    const weights = {
      onTimeDelivery: 0.4,
      qualityConsistency: 0.3,
      communicationScore: 0.2,
      contractCompliance: 0.1,
    };
    
    const reliabilityScore = Object.entries(weights).reduce((score, [metric, weight]) => {
      return score + ((metrics[metric as keyof typeof metrics] / 100) * weight);
    }, 0);
    
    return Math.max(0, Math.min(1, reliabilityScore));
  }

  /**
   * Calculate geographic proximity score
   */
  private static calculateGeographicProximity(vendor: Vendor, requirements: OrderRequirements): number {
    if (!requirements.delivery_location || !vendor.latitude || !vendor.longitude) {
      return 0.5; // Neutral score if location data unavailable
    }
    
    // This would calculate actual distance in a real implementation
    // For now, we'll use province/city matching
    let proximityScore = 0.3; // Base score for same country
    
    if (vendor.province === requirements.delivery_location.province) {
      proximityScore = 0.8; // Same province
    }
    
    if (vendor.city === requirements.delivery_location.city) {
      proximityScore = 1.0; // Same city
    }
    
    return proximityScore;
  }

  /**
   * Calculate quality consistency score
   */
  private static calculateQualityConsistency(vendor: Vendor): number {
    const baseQualityScore = (vendor.rating || 0) / 5;
    const performanceStability = (vendor.performance_score || 0) / 100;
    
    // Combine quality rating with performance stability
    const consistencyScore = (baseQualityScore * 0.6) + (performanceStability * 0.4);
    
    // Adjust for total orders (more orders = more reliable data)
    const orderVolumeBonus = Math.min(0.2, (vendor.total_orders || 0) / 100 * 0.2);
    
    return Math.max(0, Math.min(1, consistencyScore + orderVolumeBonus));
  }

  /**
   * Apply advanced ranking algorithms
   */
  private static applyAdvancedRanking(
    recommendations: VendorRecommendation[],
    requirements: OrderRequirements
  ): VendorRecommendation[] {
    // Apply diversification to avoid recommending only similar vendors
    const diversified = this.applyDiversification(recommendations);
    
    // Apply risk-adjusted scoring
    const riskAdjusted = this.applyRiskAdjustment(diversified);
    
    // Apply preference learning (this would use historical selection data)
    const preferenceAdjusted = this.applyPreferenceLearning(riskAdjusted, requirements);
    
    return preferenceAdjusted;
  }

  /**
   * Apply vendor diversification
   */
  private static applyDiversification(recommendations: VendorRecommendation[]): VendorRecommendation[] {
    const diversified: VendorRecommendation[] = [];
    const qualityTiersUsed: Set<string> = new Set();
    
    // Prioritize top scorer from each quality tier
    for (const rec of recommendations) {
      const tier = rec.vendor.quality_tier || 'standard';
      
      if (!qualityTiersUsed.has(tier) || diversified.length < 3) {
        diversified.push(rec);
        qualityTiersUsed.add(tier);
      }
    }
    
    // Add remaining high-scoring vendors
    for (const rec of recommendations) {
      if (!diversified.includes(rec) && diversified.length < 10) {
        diversified.push(rec);
      }
    }
    
    return diversified;
  }

  /**
   * Apply risk adjustment to scores
   */
  private static applyRiskAdjustment(recommendations: VendorRecommendation[]): VendorRecommendation[] {
    return recommendations.map(rec => {
      let adjustedScore = rec.overall_score;
      
      // Penalize high-risk vendors
      if (rec.risk_level === 'high') {
        adjustedScore *= 0.85;
      } else if (rec.risk_level === 'medium') {
        adjustedScore *= 0.95;
      }
      
      // Bonus for low-risk, high-performance vendors
      if (rec.risk_level === 'low' && rec.overall_score > 80) {
        adjustedScore *= 1.05;
      }
      
      return {
        ...rec,
        overall_score: Math.min(100, adjustedScore),
      };
    });
  }

  /**
   * Apply preference learning based on historical selections
   */
  private static applyPreferenceLearning(
    recommendations: VendorRecommendation[],
    requirements: OrderRequirements
  ): VendorRecommendation[] {
    // This would analyze historical vendor selections for similar orders
    // For now, we'll apply simple heuristics
    
    return recommendations.map(rec => {
      let learningAdjustment = 1.0;
      
      // Prefer vendors with recent successful orders
      if (rec.vendor.total_orders && rec.vendor.total_orders > 20) {
        learningAdjustment *= 1.02;
      }
      
      // Prefer vendors that match quality tier preference
      if (requirements.quality_tier === rec.vendor.quality_tier) {
        learningAdjustment *= 1.03;
      }
      
      return {
        ...rec,
        overall_score: Math.min(100, rec.overall_score * learningAdjustment),
      };
    });
  }

  // Helper methods
  private static normalizePerformanceScore(score: number): number {
    return Math.max(0, Math.min(1, score / 100));
  }

  private static calculateQualityTierBonus(vendor: Vendor, requirements: OrderRequirements): number {
    if (requirements.quality_tier === vendor.quality_tier) return 0.15;
    if (!requirements.quality_tier) return 0;
    
    const tierHierarchy = { standard: 1, premium: 2, exclusive: 3 };
    const requiredLevel = tierHierarchy[requirements.quality_tier] || 1;
    const vendorLevel = tierHierarchy[vendor.quality_tier as keyof typeof tierHierarchy] || 1;
    
    return vendorLevel >= requiredLevel ? 0.1 : -0.1;
  }

  private static getEstimatedMaxCapacity(vendor: Vendor): number {
    const tierCapacities = { standard: 8, premium: 12, exclusive: 15 };
    return tierCapacities[vendor.quality_tier as keyof typeof tierCapacities] || 8;
  }

  private static calculateOrderSizeImpact(quantity: number, vendor: Vendor): number {
    const minOrder = vendor.minimum_order || 1;
    if (quantity < minOrder) return 0.3;
    if (quantity > minOrder * 10) return 0.8; // Large orders may strain capacity
    return 1.0;
  }

  private static calculateBaseCost(requirements: OrderRequirements): number {
    // Simplified cost calculation
    const materialCosts = { aluminum: 1000, brass: 1200, steel: 800, plastic: 500 };
    const baseMaterialCost = materialCosts[requirements.material as keyof typeof materialCosts] || 1000;
    
    const processCosts = { laser_cutting: 1.2, cnc_machining: 1.5, casting: 1.1, printing: 0.8 };
    const processMultiplier = processCosts[requirements.process as keyof typeof processCosts] || 1.0;
    
    return baseMaterialCost * processMultiplier * requirements.quantity;
  }

  private static getVendorCostEfficiency(vendor: Vendor): number {
    // This would be calculated from historical data
    return 1.0; // Neutral for now
  }

  private static estimatePrice(vendor: Vendor, requirements: OrderRequirements): number {
    const baseCost = this.calculateBaseCost(requirements);
    const tierMultipliers = { standard: 1.0, premium: 1.25, exclusive: 1.6 };
    const tierMultiplier = tierMultipliers[vendor.quality_tier as keyof typeof tierMultipliers] || 1.0;
    
    return Math.round(baseCost * tierMultiplier);
  }

  private static estimateLeadTime(vendor: Vendor, requirements: OrderRequirements): number {
    const baseLeadTime = vendor.average_lead_time_days || 14;
    const quantityMultiplier = Math.max(1, Math.log10(requirements.quantity / 10));
    
    return Math.round(baseLeadTime * quantityMultiplier);
  }

  private static calculateConfidenceLevel(
    vendor: Vendor,
    requirements: OrderRequirements,
    scores: any
  ): 'high' | 'medium' | 'low' {
    const avgScore = Object.values(scores).reduce((sum: number, score) => sum + score, 0) / Object.keys(scores).length;
    const dataQuality = (vendor.total_orders || 0) > 10 ? 'high' : 'low';
    
    if (avgScore > 0.8 && dataQuality === 'high') return 'high';
    if (avgScore > 0.6) return 'medium';
    return 'low';
  }

  private static assessRisk(vendor: Vendor, scores: any): 'low' | 'medium' | 'high' {
    const riskFactors = {
      lowPerformance: scores.performance_score < 0.6,
      lowReliability: scores.reliability_score < 0.7,
      limitedCapacity: scores.capacity_availability < 0.5,
      newVendor: (vendor.total_orders || 0) < 5,
    };
    
    const riskCount = Object.values(riskFactors).filter(Boolean).length;
    
    if (riskCount >= 3) return 'high';
    if (riskCount >= 2) return 'medium';
    return 'low';
  }

  private static generateMatchExplanation(scores: any, requirements: OrderRequirements): string {
    const topFactors = Object.entries(scores)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([factor]) => factor.replace('_', ' '));
    
    return `Best match based on ${topFactors.join(', ')} for ${requirements.material} ${requirements.process} work`;
  }

  private static identifyCompetitiveAdvantages(vendor: Vendor, scores: any): string[] {
    const advantages: string[] = [];
    
    if (scores.specialization_match > 0.8) advantages.push('Perfect specialization match');
    if (scores.performance_score > 0.85) advantages.push('Excellent track record');
    if (scores.cost_competitiveness > 0.8) advantages.push('Competitive pricing');
    if (scores.quality_consistency > 0.9) advantages.push('Consistent quality');
    if (vendor.quality_tier === 'exclusive') advantages.push('Premium service level');
    
    return advantages;
  }

  private static identifyPotentialConcerns(vendor: Vendor, scores: any): string[] {
    const concerns: string[] = [];
    
    if (scores.capacity_availability < 0.5) concerns.push('Limited current capacity');
    if (scores.cost_competitiveness < 0.6) concerns.push('Higher than average pricing');
    if (scores.geographic_proximity < 0.4) concerns.push('Distant location may affect delivery');
    if ((vendor.total_orders || 0) < 5) concerns.push('Limited order history');
    
    return concerns;
  }

  private static generateRecommendationReason(vendor: Vendor, scores: any, overallScore: number): string {
    if (overallScore > 85) {
      return `Highly recommended due to excellent ${this.getTopStrength(scores)} and strong overall performance`;
    } else if (overallScore > 70) {
      return `Good choice with solid ${this.getTopStrength(scores)} and reliable performance`;
    } else {
      return `Acceptable option with decent ${this.getTopStrength(scores)}, consider for standard requirements`;
    }
  }

  private static getTopStrength(scores: any): string {
    const topScore = Object.entries(scores).sort(([,a], [,b]) => (b as number) - (a as number))[0];
    return topScore[0].replace('_', ' ');
  }
}