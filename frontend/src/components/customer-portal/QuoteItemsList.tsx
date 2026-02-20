/**
 * QuoteItemsList Component
 * 
 * Displays the list of items in a customer quote.
 * Shows product details, specifications, quantities, and pricing.
 * 
 * Features:
 * - Product name and description
 * - Quantity display
 * - Unit price and subtotal
 * - Custom specifications/customizations
 * - Responsive design
 * - Currency formatting
 * 
 * Integration: Phase 7.2 - Customer Portal Components
 * Spec: .kiro/specs/customer-quote-workflow/tasks.md
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';

interface QuoteItem {
  product_id?: string;
  product_name?: string;
  productName?: string;
  name?: string;
  quantity?: number;
  price?: number;
  unit_price?: number;
  subtotal?: number;
  specifications?: Record<string, any>;
  customization?: Record<string, any>;
  pricing?: {
    unit_price?: number;
    total_price?: number;
  };
}

interface QuoteItemsListProps {
  items: QuoteItem[];
  currency?: string;
}

export function QuoteItemsList({ items, currency = 'IDR' }: QuoteItemsListProps) {
  if (!items || items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Order Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No items found in this quote
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Order Items ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item, index) => {
            // Handle different JSON structures from backend
            const productName = item.productName || item.product_name || item.name || 'Unknown Product';
            const quantity = item.quantity || 1;
            const unitPrice = item.price || item.unit_price || item.pricing?.unit_price || 0;
            const subtotal = item.subtotal || item.pricing?.total_price || (unitPrice * quantity);
            const specifications = item.specifications || item.customization || {};

            return (
              <div 
                key={index} 
                className="flex justify-between items-start border-b pb-4 last:border-0 last:pb-0"
              >
                <div className="flex-1 pr-4">
                  {/* Product Name */}
                  <h4 className="font-semibold text-base">{productName}</h4>
                  
                  {/* Quantity */}
                  <p className="text-sm text-muted-foreground mt-1">
                    Quantity: {quantity}
                  </p>

                  {/* Specifications/Customizations */}
                  {specifications && Object.keys(specifications).length > 0 && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs font-medium text-gray-700 mb-2">
                        Specifications:
                      </p>
                      <div className="space-y-1">
                        {Object.entries(specifications).map(([key, value]) => (
                          <div key={key} className="flex text-xs">
                            <span className="text-gray-600 min-w-[120px]">
                              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                            </span>
                            <span className="text-gray-900 font-medium">
                              {String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Pricing */}
                <div className="text-right min-w-[120px]">
                  <div className="font-bold text-lg">
                    {formatCurrency(subtotal, currency)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    @ {formatCurrency(unitPrice, currency)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total Summary */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">
              Items Subtotal:
            </span>
            <span className="text-lg font-bold">
              {formatCurrency(
                items.reduce((sum, item) => {
                  const unitPrice = item.price || item.unit_price || item.pricing?.unit_price || 0;
                  const quantity = item.quantity || 1;
                  const subtotal = item.subtotal || item.pricing?.total_price || (unitPrice * quantity);
                  return sum + subtotal;
                }, 0),
                currency
              )}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
