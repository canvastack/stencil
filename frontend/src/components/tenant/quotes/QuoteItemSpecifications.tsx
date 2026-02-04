import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { QuoteItemSpecifications, QuoteItemFormSchema } from '@/services/tenant/quoteService';

/**
 * Props for the QuoteItemSpecificationsDisplay component
 */
interface QuoteItemSpecificationsProps {
  /** Customer-submitted specifications from the dynamic order form */
  specifications: QuoteItemSpecifications;
  /** Form schema containing field definitions and labels */
  formSchema?: QuoteItemFormSchema;
}

/**
 * Displays product specifications from customer orders in a collapsible card.
 * 
 * This component shows dynamic form fields that customers submitted when placing
 * their order. It uses the form schema to display proper field labels and formats
 * values appropriately for different data types.
 * 
 * @component
 * @example
 * ```tsx
 * <QuoteItemSpecificationsDisplay
 *   specifications={{
 *     jenis_plakat: "Plakat Logam",
 *     ukuran_plakat: "30x40cm"
 *   }}
 *   formSchema={{
 *     fields: [
 *       { name: "jenis_plakat", label: "Jenis Plakat", type: "select" }
 *     ]
 *   }}
 * />
 * ```
 */
export const QuoteItemSpecificationsDisplay = ({ 
  specifications, 
  formSchema 
}: QuoteItemSpecificationsProps) => {
  const [isExpanded, setIsExpanded] = useState(true); // Changed to true for better UX - show by default
  
  // Debug logging
  console.log('🎨 [QuoteItemSpecificationsDisplay] Rendering:', {
    specifications,
    specCount: Object.keys(specifications).length,
    isExpanded,
    formSchema
  });
  
  /**
   * Retrieves the human-readable label for a specification field.
   * Falls back to the field name if no schema is provided or field not found.
   * 
   * @param fieldName - The technical field name from specifications
   * @returns The display label for the field
   */
  const getFieldLabel = (fieldName: string): string => {
    if (!formSchema?.fields) return fieldName;
    
    const field = formSchema.fields.find(f => f.name === fieldName);
    return field?.label || fieldName;
  };
  
  /**
   * Formats a specification value for display.
   * Handles null/undefined, boolean, and other types appropriately.
   * Converts technical values to user-friendly format.
   * 
   * @param value - The raw specification value
   * @returns Formatted string representation of the value
   */
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'Not specified';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    
    // Convert snake_case and technical values to user-friendly format
    const stringValue = String(value);
    
    // Replace underscores with spaces and capitalize each word
    return stringValue
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };
  
  const specEntries = Object.entries(specifications);
  
  if (specEntries.length === 0) {
    return null;
  }
  
  return (
    <Card 
      className="mt-4 border-slate-200 dark:border-slate-700 shadow-sm"
      role="region"
      aria-label="Product specifications"
    >
      <CardHeader 
        className="cursor-pointer hover:bg-muted/50 transition-colors py-4 px-4 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-t-lg"
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-controls="specifications-content"
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Badge variant="outline" className="text-xs">Product Specifications</Badge>
            <span className="text-xs text-muted-foreground" aria-label={`${specEntries.length} specification fields`}>
              ({specEntries.length} fields)
            </span>
          </CardTitle>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
          )}
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent 
          id="specifications-content"
          className="pt-4 pb-4 px-4"
          role="group"
          aria-label="Specification details"
        >
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {specEntries.map(([key, value]) => (
              <div key={key} className="space-y-1">
                <dt 
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                  id={`spec-label-${key}`}
                >
                  {getFieldLabel(key)}
                </dt>
                <dd 
                  className="text-sm font-semibold text-foreground break-words"
                  aria-labelledby={`spec-label-${key}`}
                >
                  {formatValue(value)}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      )}
    </Card>
  );
};
