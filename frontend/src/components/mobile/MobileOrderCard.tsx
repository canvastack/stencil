import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Eye, Edit } from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  customer: {
    name: string;
  };
  vendor?: {
    name: string;
  };
  totalAmount: number;
  status: string;
  dueDate: string;
  progress: number;
  items?: Array<{
    name: string;
    quantity: number;
  }>;
}

interface MobileOrderCardProps {
  order: Order;
  onViewDetails?: (orderId: string) => void;
  onUpdateStatus?: (orderId: string) => void;
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusLabel = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'Pending';
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
};

export function MobileOrderCard({ order, onViewDetails, onUpdateStatus }: MobileOrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(order.id);
    }
  };

  const handleUpdateStatus = () => {
    if (onUpdateStatus) {
      onUpdateStatus(order.id);
    }
  };

  return (
    <Card className="w-full touch-manipulation shadow-sm hover:shadow-md transition-shadow">
      <CardHeader 
        className="pb-2 cursor-pointer active:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-medium truncate">
              {order.orderNumber}
            </CardTitle>
            <CardDescription className="text-xs truncate">
              {order.customer.name}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <div className="text-right">
              <div className="text-sm font-semibold">
                {formatCurrency(order.totalAmount)}
              </div>
              <Badge 
                variant="outline" 
                className={cn("text-xs", getStatusColor(order.status))}
              >
                {getStatusLabel(order.status)}
              </Badge>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
            )}
          </div>
        </div>
      </CardHeader>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <CardContent className="pt-0 pb-4">
              <div className="space-y-3">
                {/* Order Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Vendor:</span>
                    <span className="font-medium">
                      {order.vendor?.name || 'Not assigned'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Due Date:</span>
                    <span className="font-medium">
                      {formatDate(order.dueDate)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Progress:</span>
                    <span className="font-medium">{order.progress}%</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${order.progress}%` }}
                  />
                </div>

                {/* Order Items */}
                {order.items && order.items.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground font-medium">Items:</span>
                    <div className="space-y-1">
                      {order.items.slice(0, 3).map((item, index) => (
                        <div key={index} className="flex justify-between text-xs">
                          <span className="truncate">{item.name}</span>
                          <span className="text-muted-foreground ml-2">
                            x{item.quantity}
                          </span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{order.items.length - 3} more items
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 h-9 text-xs"
                    onClick={handleViewDetails}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View Details
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1 h-9 text-xs"
                    onClick={handleUpdateStatus}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Update Status
                  </Button>
                </div>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}