import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Check, Package, Wrench, Frame, Box } from 'lucide-react';
import { useState } from 'react';
import type { QuoteItemSpecifications, QuoteItemFormSchema } from '@/services/tenant/quoteService';
import { cn } from '@/lib/utils';

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
   * Prioritizes form schema, then falls back to common mappings, then snake_case conversion.
   * 
   * @param fieldName - The technical field name from specifications
   * @returns The display label for the field
   */
  const getFieldLabel = (fieldName: string): string => {
    // PRIORITY 1: Try to get from form schema (DYNAMIC)
    if (formSchema?.fields) {
      const field = formSchema.fields.find(f => f.name === fieldName);
      if (field?.label) {
        console.log(`  ✅ [Label] Using form schema for "${fieldName}": "${field.label}"`);
        return field.label;
      }
    }
    
    // PRIORITY 2: Common field name mappings for better UX (FALLBACK)
    const commonLabels: Record<string, string> = {
      'plakat_type': 'Jenis Plakat',
      'metal_type': 'Jenis Logam',
      'thickness': 'Ketebalan Plat',
      'size': 'Ukuran Plakat',
      'finishing': 'Finishing Surface',
      'text_content': 'Teks yang Akan Di-Etching',
      'additional_services': 'Layanan Tambahan',
      'quantity': 'Jumlah Plakat',
      'special_instructions': 'Instruksi Khusus',
    };
    
    if (commonLabels[fieldName]) {
      console.log(`  ⚠️ [Label] Using common mapping for "${fieldName}": "${commonLabels[fieldName]}"`);
      return commonLabels[fieldName];
    }
    
    // PRIORITY 3: Fallback - Convert snake_case to Title Case
    const fallbackLabel = fieldName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    console.log(`  ℹ️ [Label] Using fallback for "${fieldName}": "${fallbackLabel}"`);
    return fallbackLabel;
  };
  
  /**
   * Formats a specification value for display.
   * Handles null/undefined, boolean, arrays, and other types appropriately.
   * Converts technical values to user-friendly format using form schema options.
   * 
   * @param value - The raw specification value
   * @param fieldName - The field name for context-specific formatting
   * @returns Formatted string representation of the value or JSX for arrays
   */
  const formatValue = (value: any, fieldName?: string): React.ReactNode => {
    if (value === null || value === undefined) return 'Not specified';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    
    // Handle arrays (e.g., additional_services) - render with icons
    if (Array.isArray(value)) {
      // Check if this is a checkbox/multi-select field
      const isCheckboxField = fieldName && (
        fieldName.includes('services') || 
        fieldName.includes('options') ||
        fieldName.includes('features')
      );
      
      if (isCheckboxField && value.length > 0) {
        return (
          <div className="flex flex-wrap gap-2">
            {value.map((item, index) => {
              const formattedValue = formatSingleValue(String(item), fieldName);
              const icon = getIconForValue(String(item));
              
              return (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="flex items-center gap-1.5 px-2.5 py-1"
                >
                  {icon}
                  <span className="text-xs">{formattedValue}</span>
                </Badge>
              );
            })}
          </div>
        );
      }
      
      // For non-checkbox arrays, use comma-separated format
      return value
        .map(item => formatSingleValue(String(item), fieldName))
        .join(', ');
    }
    
    return formatSingleValue(String(value), fieldName);
  };
  
  /**
   * Gets an appropriate icon for a value based on its content
   * Used for checkbox/multi-select fields to provide visual context
   */
  const getIconForValue = (value: string): React.ReactNode => {
    const iconClass = "h-3.5 w-3.5";
    
    // Icon mapping based on value content
    if (value.includes('gold') || value.includes('filling')) {
      return <Wrench className={iconClass} />;
    }
    if (value.includes('frame') || value.includes('kayu')) {
      return <Frame className={iconClass} />;
    }
    if (value.includes('stand') || value.includes('acrylic')) {
      return <Box className={iconClass} />;
    }
    if (value.includes('package') || value.includes('packaging')) {
      return <Package className={iconClass} />;
    }
    
    // Default icon for checkboxes
    return <Check className={iconClass} />;
  };
  
  /**
   * Formats a single value string to user-friendly format
   * PRIORITY 1: Use form schema options (DYNAMIC)
   * PRIORITY 2: Use common value mappings (FALLBACK)
   * PRIORITY 3: Convert snake_case to Title Case (FALLBACK)
   */
  const formatSingleValue = (value: string, fieldName?: string): string => {
    // PRIORITY 1: Try to get label from form schema options (DYNAMIC)
    if (fieldName && formSchema?.fields) {
      const field = formSchema.fields.find(f => f.name === fieldName);
      if (field?.options && Array.isArray(field.options)) {
        // Handle both formats: array of objects or array of strings
        if (field.options.length > 0) {
          const firstOption = field.options[0];
          
          // Format 1: Array of objects with value and label
          if (typeof firstOption === 'object' && 'value' in firstOption && 'label' in firstOption) {
            const option = (field.options as Array<{ value: string; label: string }>).find(
              opt => opt.value === value
            );
            if (option?.label) {
              console.log(`  ✅ [Value] Using form schema option for "${value}": "${option.label}"`);
              return option.label;
            }
          }
          
          // Format 2: Array of strings (value === label)
          if (typeof firstOption === 'string') {
            const option = (field.options as string[]).find(opt => opt === value);
            if (option) {
              console.log(`  ✅ [Value] Using form schema option (string) for "${value}": "${option}"`);
              return option;
            }
          }
        }
      }
    }
    
    // PRIORITY 2: Common value mappings (FALLBACK for known values)
    const valueMap: Record<string, string> = {
      'wall_mount': 'Plakat Dinding',
      'brass-antique': 'Kuningan Antik (Brass Antique)',
      'brass_antique': 'Kuningan Antik (Brass Antique)',
      'stainless_steel': 'Stainless Steel',
      '3mm': '3mm (Professional)',
      '30x40': '30 x 40 cm',
      'matte': 'Matte (Doff)',
      'gold_filling': 'Gold Filling (Isi Emas pada Etching)',
      'frame_wood': 'Frame Kayu',
      'stand_acrylic': 'Stand Acrylic',
    };
    
    // Check if we have a direct mapping
    if (valueMap[value]) {
      console.log(`  ⚠️ [Value] Using common mapping for "${value}": "${valueMap[value]}"`);
      return valueMap[value];
    }
    
    // PRIORITY 3: Convert snake_case to Title Case (FALLBACK)
    const fallbackValue = value
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    console.log(`  ℹ️ [Value] Using fallback for "${value}": "${fallbackValue}"`);
    return fallbackValue;
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
            {specEntries.map(([key, value]) => {
              const isArrayValue = Array.isArray(value);
              const isCheckboxField = key && (
                key.includes('services') || 
                key.includes('options') ||
                key.includes('features')
              );
              
              return (
                <div 
                  key={key} 
                  className={cn(
                    "space-y-1",
                    // Span full width for checkbox arrays for better display
                    isArrayValue && isCheckboxField && "sm:col-span-2"
                  )}
                >
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
                    {formatValue(value, key)}
                  </dd>
                </div>
              );
            })}
          </dl>
        </CardContent>
      )}
    </Card>
  );
};
