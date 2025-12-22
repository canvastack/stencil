import type { Vendor } from '@/types/vendor';

export const getVendorStatusVariant = (
  status: Vendor['status']
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'active':
      return 'default';
    case 'inactive':
      return 'secondary';
    case 'suspended':
    case 'blacklisted':
      return 'destructive';
    case 'on_hold':
      return 'outline';
    default:
      return 'secondary';
  }
};

export const getVendorStatusLabel = (status: Vendor['status']): string => {
  switch (status) {
    case 'active':
      return 'Active';
    case 'inactive':
      return 'Inactive';
    case 'suspended':
      return 'Suspended';
    case 'blacklisted':
      return 'Blacklisted';
    case 'on_hold':
      return 'On Hold';
    default:
      return status;
  }
};

export const calculateVendorSize = (
  totalOrders: number
): 'small' | 'medium' | 'large' => {
  if (totalOrders > 100) return 'large';
  if (totalOrders > 20) return 'medium';
  return 'small';
};

export const getVendorSizeLabel = (size: 'small' | 'medium' | 'large'): string => {
  switch (size) {
    case 'large':
      return 'Large';
    case 'medium':
      return 'Medium';
    case 'small':
      return 'Small';
  }
};

export const getVendorRatingColor = (rating: number): string => {
  if (rating >= 4.5) return 'text-green-600';
  if (rating >= 4.0) return 'text-blue-600';
  if (rating >= 3.5) return 'text-yellow-600';
  return 'text-red-600';
};

export const getVendorRatingBadgeVariant = (
  rating: number
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (rating >= 4.5) return 'default';
  if (rating >= 4.0) return 'secondary';
  if (rating >= 3.5) return 'outline';
  return 'destructive';
};

export const getPerformanceGrade = (score: number): string => {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'B+';
  if (score >= 80) return 'B';
  if (score >= 75) return 'C+';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
};

export const getPerformanceColor = (score: number): string => {
  if (score >= 90) return 'bg-green-500';
  if (score >= 80) return 'bg-blue-500';
  if (score >= 70) return 'bg-yellow-500';
  if (score >= 60) return 'bg-orange-500';
  return 'bg-red-500';
};

export const getTrendIcon = (direction: 'up' | 'down' | 'neutral'): string => {
  switch (direction) {
    case 'up':
      return '↑';
    case 'down':
      return '↓';
    case 'neutral':
      return '→';
  }
};

export const getTrendColor = (direction: 'up' | 'down' | 'neutral'): string => {
  switch (direction) {
    case 'up':
      return 'text-green-600';
    case 'down':
      return 'text-red-600';
    case 'neutral':
      return 'text-gray-400';
  }
};

export const formatVendorSpecializations = (specializations: string[] | { name: string }[]): string => {
  if (!specializations || specializations.length === 0) return 'N/A';
  
  const specNames = specializations.map(spec => 
    typeof spec === 'string' ? spec : spec.name
  );
  
  if (specNames.length <= 2) {
    return specNames.join(', ');
  }
  
  return `${specNames.slice(0, 2).join(', ')} +${specNames.length - 2} more`;
};

export const getDeliveryStatusVariant = (
  status: 'pending' | 'on_time' | 'early' | 'late'
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'on_time':
    case 'early':
      return 'default';
    case 'late':
      return 'destructive';
    case 'pending':
      return 'secondary';
    default:
      return 'outline';
  }
};

export const getOrderStatusVariant = (
  status: 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'completed' | 'cancelled'
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'completed':
      return 'default';
    case 'in_progress':
    case 'accepted':
      return 'secondary';
    case 'rejected':
    case 'cancelled':
      return 'destructive';
    case 'pending':
      return 'outline';
    default:
      return 'outline';
  }
};

export const calculateCompletionRate = (completedOrders: number, totalOrders: number): number => {
  if (totalOrders === 0) return 0;
  return Math.round((completedOrders / totalOrders) * 100);
};

export const calculateOnTimeRate = (onTimeOrders: number, completedOrders: number): number => {
  if (completedOrders === 0) return 0;
  return Math.round((onTimeOrders / completedOrders) * 100);
};
