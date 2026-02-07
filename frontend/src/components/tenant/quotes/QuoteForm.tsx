import { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Plus,
  CalendarIcon,
  Package,
  User,
  Building,
  Save,
  X,
  TrendingUp,
  TrendingDown,
  Banknote,
} from 'lucide-react';
import { Quote, CreateQuoteRequest, UpdateQuoteRequest } from '@/services/tenant/quoteService';
import { tenantApiClient } from '@/services/tenant/tenantApiClient';
import { ordersService } from '@/services/api/orders';
import { exchangeRateService } from '@/services/api/exchangeRate';
import { Order } from '@/types/order';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { WysiwygEditor } from '@/components/ui/wysiwyg-editor';
import { RoundingButtonGroup, RoundingMode } from './RoundingButtonGroup';
import { TermsTemplateDialog } from './TermsTemplateDialog';
import { InternalNotesTemplateDialog } from './InternalNotesTemplateDialog';
import { QuoteFormSkeleton } from './QuoteFormSkeleton';
import { getDefaultExchangeRateSync } from '@/lib/currency';
import { QuoteItemSpecificationsDisplay } from './QuoteItemSpecifications';
import { ErrorAlert } from '@/components/ui/error-alert';
import { parseApiError, logError, type ApiError } from '@/lib/errorHandling';
import { getDefaultQuoteValidUntil } from '@/utils/businessDays';

const quoteItemSchema = z.object({
  product_id: z.union([z.string(), z.number()]).transform(val => String(val)).refine(val => val.length > 0, 'Product is required'),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unit_price: z.number().min(0, 'Unit price must be non-negative'),
  vendor_cost: z.number().min(0, 'Vendor cost is required'),
  total_price: z.number().min(0),
  specifications: z.record(z.any()).optional(),
  form_schema: z.any().optional(),
  notes: z.string().optional(),
});

const quoteFormSchema = z.object({
  customer_id: z.string().min(1, 'Customer is required'),
  vendor_id: z.string().min(1, 'Vendor is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  valid_until: z.date({
    required_error: 'Valid until date is required',
  }),
  terms_and_conditions: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(quoteItemSchema).min(1, 'At least one item is required'),
});

type QuoteFormData = z.infer<typeof quoteFormSchema>;

interface QuoteFormProps {
  mode?: 'create' | 'edit';
  initialData?: Quote;
  quote?: Quote; // Deprecated: use initialData instead
  onSubmit: (data: CreateQuoteRequest | UpdateQuoteRequest) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  isRevision?: boolean;
  formId?: string; // Optional form ID for external submit button
}

export const QuoteForm = ({ 
  mode = 'create',
  initialData,
  quote, 
  onSubmit, 
  onCancel, 
  loading, 
  isRevision,
  formId = 'quote-form', // Default form ID
}: QuoteFormProps) => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  
  // Support both initialData (new) and quote (deprecated) props
  const quoteData = initialData || quote;
  
  // DEBUG: Log received data
  console.log('[QuoteForm] Component mounted/updated', {
    mode,
    hasInitialData: !!initialData,
    hasQuote: !!quote,
    quoteData,
    quoteDataItems: quoteData?.items,
    orderId,
  });
  
  // State for search/select options
  const [customers, setCustomers] = useState<Array<{ id: string; name: string; company?: string }>>([]);
  const [vendors, setVendors] = useState<Array<{ id: string; name: string; company: string }>>([]);
  const [products, setProducts] = useState<Array<{ id: string; intId?: number; name: string; sku: string; unit: string; images?: string[] }>>([]);
  const [orderContext, setOrderContext] = useState<Order | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [roundingModes, setRoundingModes] = useState<Record<number, RoundingMode>>({});
  const [termsEditorKey, setTermsEditorKey] = useState(0);
  const [notesEditorKey, setNotesEditorKey] = useState(0);
  const [exchangeRate, setExchangeRate] = useState<number>(getDefaultExchangeRateSync()); // Use env config as initial value
  
  // Error state management
  const [submitError, setSubmitError] = useState<ApiError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const form = useForm<QuoteFormData>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      customer_id: quoteData?.customer_id || '',
      vendor_id: quoteData?.vendor_id || '',
      title: quoteData?.title || '', // Empty string if null, will be populated by useEffect
      description: quoteData?.description || '',
      valid_until: (() => {
        // Handle valid_until with proper validation
        if (quoteData?.valid_until) {
          const parsedDate = new Date(quoteData.valid_until);
          // Check if date is valid and not epoch (1970-01-01)
          if (!isNaN(parsedDate.getTime()) && parsedDate.getFullYear() > 1970) {
            return parsedDate;
          }
        }
        // Default: Now + 24 business hours
        return getDefaultQuoteValidUntil();
      })(),
      terms_and_conditions: quoteData?.terms_and_conditions || '',
      notes: quoteData?.notes || '',
      items: (() => {
        const items = quoteData?.items && Array.isArray(quoteData.items) && quoteData.items.length > 0 
          ? quoteData.items.map(item => {
              console.log('[QuoteForm] Mapping item from quoteData:', item);
              return {
                product_id: item.product_id || '',
                description: item.description || '', // QuoteItem already has description
                quantity: item.quantity || 1,
                unit_price: item.unit_price || 0,
                vendor_cost: item.vendor_cost || 0,
                total_price: item.total_price || 0,
                specifications: item.specifications || {},
                notes: item.notes || '',
              };
            }) 
          : [{
              product_id: '',
              description: '',
              quantity: 1,
              unit_price: 0,
              vendor_cost: 0,
              total_price: 0,
              specifications: {},
              notes: '',
            }];
        console.log('[QuoteForm] Final items for form:', items);
        return items;
      })(),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  // Load initial data with loading state - OPTIMIZED
  useEffect(() => {
    const loadInitialData = async () => {
      setIsInitialLoading(true);
      try {
        // Load all data in parallel for faster loading
        await Promise.all([
          loadCustomers(),
          loadVendors(),
          loadProducts(),
          loadExchangeRate(),
        ]);
      } catch (error) {
        console.error('❌ Failed to load initial data:', error);
      } finally {
        // Don't set loading to false yet if we're waiting for order context
        if (!orderId) {
          setIsInitialLoading(false);
        }
      }
    };
    
    loadInitialData();
  }, []);

  // Ensure customer is selected after customers list is loaded
  useEffect(() => {
    if (orderContext && customers.length > 0) {
      const currentCustomerId = form.getValues('customer_id');
      console.log('🔄 Customers loaded, checking selection...');
      console.log('🔄 Current customer_id in form:', currentCustomerId);
      console.log('🔄 Order customer_id:', orderContext.customerId);
      console.log('🔄 Customers list:', customers);
      
      // If customer_id is set but not matching, reset it
      if (currentCustomerId !== orderContext.customerId) {
        console.log('🔄 Re-setting customer_id to:', orderContext.customerId);
        form.setValue('customer_id', orderContext.customerId, { shouldValidate: true });
      }
    }
  }, [customers, orderContext, form]);

  // Ensure vendor is selected after vendors list is loaded
  useEffect(() => {
    if (orderContext && orderContext.vendorId && vendors.length > 0) {
      const currentVendorId = form.getValues('vendor_id');
      console.log('🔄 Vendors loaded, checking selection...');
      console.log('🔄 Current vendor_id in form:', currentVendorId);
      console.log('🔄 Order vendor_id:', orderContext.vendorId);
      console.log('🔄 Vendors list:', vendors);
      
      // If vendor_id is set but not matching, reset it
      if (currentVendorId !== orderContext.vendorId) {
        console.log('🔄 Re-setting vendor_id to:', orderContext.vendorId);
        form.setValue('vendor_id', orderContext.vendorId, { shouldValidate: true });
      }
    }
  }, [vendors, orderContext, form]);

  // Load customers after order context is loaded (if applicable)
  useEffect(() => {
    // Only reload customers if we have order context and need to ensure customer is in list
    if (orderContext && orderContext.customerId && customers.length > 0) {
      const customerExists = customers.some(c => c.id === orderContext.customerId);
      if (!customerExists && orderContext.customerName) {
        // Add the order's customer to the list
        setCustomers(prev => [{
          id: orderContext.customerId,
          name: orderContext.customerName,
          company: orderContext.customerEmail
        }, ...prev]);
      }
    }
  }, [orderContext, customers]);

  // Ensure quote customer is in the list when editing (EDIT mode with quoteData)
  useEffect(() => {
    if (quoteData && quoteData.customer_id && customers.length > 0) {
      const customerExists = customers.some(c => c.id === quoteData.customer_id);
      console.log('👥 Checking if quote customer exists in list...');
      console.log('👥 Looking for customer ID:', quoteData.customer_id);
      console.log('👥 Customer exists in list:', customerExists);
      console.log('👥 Quote data customer:', quoteData.customer);
      
      if (!customerExists && quoteData.customer) {
        console.log('👥 Adding quote customer to list:', {
          id: quoteData.customer.id,
          name: quoteData.customer.name,
          company: quoteData.customer.company || quoteData.customer.email
        });
        // Add the quote's customer to the list
        setCustomers(prev => [{
          id: quoteData.customer.id,
          name: quoteData.customer.name,
          company: quoteData.customer.company || quoteData.customer.email
        }, ...prev]);
      }
    }
  }, [quoteData, customers]);

  // Enrich quote items with order data when in EDIT mode OR when orderContext is available
  useEffect(() => {
    const enrichQuoteItemsWithOrderData = async () => {
      // Run enrichment when:
      // 1. EDIT mode with quoteData and orderContext, OR
      // 2. CREATE mode with orderContext (for pre-filling from order)
      const shouldEnrich = (
        (mode === 'edit' && quoteData && orderContext && orderContext.items && orderContext.items.length > 0) ||
        (mode === 'create' && orderContext && orderContext.items && orderContext.items.length > 0 && form.getValues('items').length > 0)
      );
      
      if (shouldEnrich) {
        console.log('🔄 [ENRICHMENT] Starting enrichment process...');
        console.log('📦 [ENRICHMENT] Order items:', orderContext.items);
        console.log('📋 [ENRICHMENT] Mode:', mode);
        
        const currentItems = form.getValues('items');
        console.log('📝 [ENRICHMENT] Current form items:', currentItems);
        
        // Enrich each quote item with order data
        const enrichedItemsPromises = currentItems.map(async (quoteItem: any, index: number) => {
          console.log(`🔍 [ENRICHMENT] Processing item ${index}, product_id: ${quoteItem.product_id}`);
          
          // Find matching order item by product_id (try both integer and string)
          const orderItem = (orderContext.items as any[]).find((oi: any) => {
            const oiProductId = oi.product_id || oi.productId;
            const quoteProductId = quoteItem.product_id;
            
            // Try exact match first
            if (oiProductId === quoteProductId) return true;
            
            // Try string/number conversion
            if (String(oiProductId) === String(quoteProductId)) return true;
            if (Number(oiProductId) === Number(quoteProductId)) return true;
            
            return false;
          });
          
          if (orderItem) {
            console.log(`  ✅ [ENRICHMENT] Found order item for product ${quoteItem.product_id}:`, orderItem);
            console.log(`  📋 [ENRICHMENT] Order item specifications:`, orderItem.specifications);
            console.log(`  📋 [ENRICHMENT] Order item customization:`, orderItem.customization);
            
            // Fetch form_schema if product_id exists
            let formSchema = null;
            // Use product_uuid for API call (backend expects UUID, not integer ID)
            const productUuid = orderItem.product_uuid || orderItem.productUuid;
            const productId = orderItem.product_id || orderItem.productId;
            
            console.log(`  - [ENRICHMENT] Product identifiers:`, { productUuid, productId });
            
            if (productUuid) {
              try {
                console.log(`  - [ENRICHMENT] Fetching form_schema for product UUID ${productUuid}...`);
                const response = await tenantApiClient.get(`/products/${productUuid}/form-configuration`);
                formSchema = response.data?.form_schema || null;
                console.log(`  - [ENRICHMENT] Form schema fetched:`, formSchema);
              } catch (error) {
                console.warn(`  - [ENRICHMENT] Could not fetch form_schema for product ${productUuid}:`, error);
              }
            } else {
              console.warn(`  - [ENRICHMENT] No product_uuid found for product ${productId}, cannot fetch form_schema`);
            }
            
            const enrichedItem = {
              ...quoteItem,
              description: orderItem.product_name || orderItem.productName || quoteItem.description,
              specifications: orderItem.customization || orderItem.specifications || {}, // Use customization first, fallback to specifications
              form_schema: formSchema,
            };
            
            console.log(`  ✅ [ENRICHMENT] Enriched item ${index}:`, enrichedItem);
            console.log(`  📋 [ENRICHMENT] Enriched specifications:`, enrichedItem.specifications);
            return enrichedItem;
          }
          
          console.log(`  ❌ [ENRICHMENT] No order item found for product ${quoteItem.product_id}`);
          return quoteItem;
        });
        
        const enrichedItems = await Promise.all(enrichedItemsPromises);
        console.log('✅ [ENRICHMENT] All items enriched:', enrichedItems);
        console.log('✅ [ENRICHMENT] Enriched items details:', JSON.stringify(enrichedItems, null, 2));
        
        // Update form with enriched items - use reset to ensure re-render
        console.log('🔄 [ENRICHMENT] Updating form with enriched items...');
        const currentValues = form.getValues();
        form.reset({
          ...currentValues,
          items: enrichedItems,
        });
        console.log('✅ [ENRICHMENT] Form updated successfully');
        
        // Verify form values after reset
        const verifyItems = form.getValues('items');
        console.log('🔍 [ENRICHMENT] Verification - Form items after reset:', verifyItems);
        console.log('🔍 [ENRICHMENT] Verification - First item specifications:', verifyItems[0]?.specifications);
        console.log('🔍 [ENRICHMENT] Verification - First item form_schema:', verifyItems[0]?.form_schema);
      } else {
        console.log('⏭️ [ENRICHMENT] Skipping enrichment:', {
          mode,
          hasQuoteData: !!quoteData,
          hasOrderContext: !!orderContext,
          hasOrderItems: !!(orderContext?.items),
          orderItemsLength: orderContext?.items?.length || 0,
          formItemsLength: form.getValues('items').length
        });
      }
    };
    
    enrichQuoteItemsWithOrderData();
  }, [mode, quoteData, orderContext?.items, form]); // Changed dependency to orderContext.items

  // Load order context when order_id is present
  useEffect(() => {
    const loadOrderContext = async () => {
      // Load order context if orderId exists
      // In EDIT mode: We need order context for enrichment
      // In CREATE mode: We need order context for pre-filling
      if (orderId) {
        console.log('🔄 loadOrderContext: Loading order context...');
        console.log('🔄 Mode:', mode, 'Has quoteData:', !!quoteData);
        console.log('🔄 loadOrderContext: Condition met, loading order...');
        try {
          setOrderLoading(true);
          const order = await ordersService.getOrderById(orderId);
          console.log('📦 Order loaded:', order);
          console.log('📦 Order items:', order.items);
          console.log('📦 Customer ID:', order.customerId);
          console.log('📦 Vendor ID:', order.vendorId);
          setOrderContext(order);
          
          // Pre-fill title ONLY if it's empty (null/undefined)
          // This ensures we don't override user-edited titles
          const currentTitle = form.getValues('title');
          
          if (!currentTitle) {
            // Generate title with vendor name and quote number if available
            const vendorName = order.vendorName || 'Vendor TBD';
            
            // For EDIT mode with existing quote, use quote_number from quoteData
            // For CREATE mode, use placeholder
            let quoteNumber = 'QT-PENDING';
            if (quoteData?.quote_number) {
              quoteNumber = quoteData.quote_number;
            }
            
            // Format: "Quote Request - {Vendor Name} ({Quote Number})"
            const defaultTitle = `Quote Request - ${vendorName} (${quoteNumber})`;
            console.log('✅ Setting default title:', defaultTitle);
            form.setValue('title', defaultTitle);
          } else {
            console.log('⏭️ Skipping title generation - already has value:', currentTitle);
          }
          
          // Pre-fill customer_id from order
          if (order.customerId) {
            console.log('✅ Setting customer_id:', order.customerId);
            form.setValue('customer_id', order.customerId);
          }
          
          // Pre-fill vendor_id from order if available
          if (order.vendorId) {
            console.log('✅ Setting vendor_id:', order.vendorId);
            form.setValue('vendor_id', order.vendorId);
          }
          
          // Only pre-populate items in CREATE mode
          // In EDIT mode, items come from quoteData and will be enriched later
          if (order.items && order.items.length > 0 && !quoteData) {
            console.log('📋 Transforming order items to quote items (CREATE mode)...');
            
            // Fetch form_schema for each product
            const quoteItemsPromises = order.items.map(async (item: any) => {
              console.log('  - Processing item:', item);
              console.log('  - Item specifications:', item.specifications);
              
              // Use product_uuid for API call (backend expects UUID, not integer ID)
              const productUuid = item.product_uuid || item.productUuid;
              const productId = item.product_id || item.productId;
              let formSchema = null;
              
              console.log('  - Product identifiers:', { productUuid, productId });
              
              // Fetch form_schema from ProductFormConfiguration if product_uuid exists
              if (productUuid) {
                try {
                  console.log(`  - Fetching form_schema for product UUID ${productUuid}...`);
                  const response = await tenantApiClient.get(`/products/${productUuid}/form-configuration`);
                  formSchema = response.data?.form_schema || null;
                  console.log(`  - Form schema fetched:`, formSchema);
                } catch (error) {
                  console.warn(`  - Could not fetch form_schema for product ${productUuid}:`, error);
                }
              } else {
                console.warn(`  - No product_uuid found for product ${productId}, cannot fetch form_schema`);
              }
              
              // Backend sends snake_case, not camelCase
              const productIdValue = productId?.toString() || productUuid?.toString() || '';
              
              if (!productIdValue) {
                console.error(`  - ERROR: No valid product_id found for item:`, item);
              }
              
              return {
                product_id: productIdValue,
                description: item.product_name || item.productName || '',
                quantity: item.quantity || 1,
                unit_price: item.unit_price || item.unitPrice || item.final_price || 0,
                vendor_cost: item.vendor_cost || item.vendorCost || 0,
                total_price: item.subtotal || 0,
                specifications: item.customization || item.specifications || {}, // Use customization first, fallback to specifications
                form_schema: formSchema, // Add form_schema for rendering
                notes: '',
              };
            });
            
            const quoteItems = await Promise.all(quoteItemsPromises);
            console.log('✅ Quote items prepared with form_schema:', quoteItems);
            
            // Set customer_id, vendor_id, and items together to prevent form reset
            console.log('🔄 Setting form values (customer + vendor + items)...');
            form.reset({
              ...form.getValues(),
              customer_id: order.customerId,
              vendor_id: order.vendorId || form.getValues('vendor_id'),
              items: quoteItems,
            });
            console.log('✅ Form values set (customer + vendor + items)');
          } else if (quoteData) {
            console.log('📋 EDIT mode: Skipping item transformation, will be enriched by useEffect');
            // Just set customer and vendor, items will be enriched by useEffect
            if (order.customerId && !form.getValues('customer_id')) {
              form.setValue('customer_id', order.customerId);
            }
            if (order.vendorId && !form.getValues('vendor_id')) {
              form.setValue('vendor_id', order.vendorId);
            }
          } else {
            // If no items, set customer and vendor
            if (order.customerId) {
              form.setValue('customer_id', order.customerId);
            }
            if (order.vendorId) {
              form.setValue('vendor_id', order.vendorId);
            }
          }
          
          const vendorInfo = order.vendorId ? ' with pre-selected vendor' : '';
          toast({
            title: 'Order Context Loaded',
            description: `Creating quote for Order #${order.orderNumber} with ${order.items.length} items${vendorInfo}`,
          });
        } catch (error) {
          console.error('❌ Failed to load order context:', error);
          toast({
            title: 'Warning',
            description: 'Failed to load order details. You can still create the quote manually.',
            variant: 'destructive',
          });
        } finally {
          setOrderLoading(false);
          setIsInitialLoading(false); // Set loading to false after order context loaded
        }
      } else {
        console.log('⏭️ loadOrderContext: Skipping - orderId:', orderId, 'quote:', !!quote, 'quoteData:', !!quoteData);
        // If we have orderId but also have quoteData (edit mode), don't load order
        if (orderId && quoteData) {
          setIsInitialLoading(false);
        }
      }
    };

    loadOrderContext();
  }, [orderId, quote, quoteData, form, toast]);

  const loadCustomers = async (search?: string) => {
    try {
      console.log('👥 Loading customers...');
      
      // OPTIMIZATION: If we have orderContext with customer, use it directly
      if (orderContext && orderContext.customerId && !search) {
        console.log('✅ Using customer from orderContext (optimized)');
        const customerFromOrder = {
          id: orderContext.customerId,
          name: orderContext.customerName,
          company: orderContext.customerEmail
        };
        setCustomers([customerFromOrder]);
        return;
      }
      
      // Use existing customers endpoint instead of /for-quotes
      const response = await tenantApiClient.get('/customers', {
        params: { search, per_page: 50, status: 'active' }
      });
      // Response interceptor already unwraps pagination
      const customersData = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      console.log('👥 Raw customers data:', customersData);
      
      const transformedCustomers = customersData.map((c: any) => ({
        id: c.uuid || c.id,
        name: c.name,
        company: c.company_name || c.company
      }));
      console.log('👥 Transformed customers:', transformedCustomers);
      setCustomers(transformedCustomers);
      
      // If we have an order context with customer_id, ensure that customer is in the list
      if (orderContext && orderContext.customerId) {
        console.log('👥 Checking if order customer exists in list...');
        console.log('👥 Looking for customer ID:', orderContext.customerId);
        const customerExists = transformedCustomers.some((c: any) => c.id === orderContext.customerId);
        console.log('👥 Customer exists in list:', customerExists);
        
        if (!customerExists && orderContext.customerName) {
          console.log('👥 Adding order customer to list:', {
            id: orderContext.customerId,
            name: orderContext.customerName,
            company: orderContext.customerEmail
          });
          // Add the order's customer to the list
          setCustomers(prev => [{
            id: orderContext.customerId,
            name: orderContext.customerName,
            company: orderContext.customerEmail
          }, ...prev]);
        }
      }
      
      // After customers are loaded, check form value
      const currentCustomerId = form.getValues('customer_id');
      console.log('👥 Current form customer_id:', currentCustomerId);
    } catch (error) {
      console.error('❌ Failed to load customers:', error);
      toast({
        title: 'Warning',
        description: 'Failed to load customers list',
        variant: 'destructive',
      });
    }
  };

  const loadVendors = async (search?: string) => {
    try {
      console.log('🏢 Loading vendors...');
      
      // OPTIMIZATION: If we have orderContext with vendor, use it directly
      if (orderContext && orderContext.vendorId && !search) {
        console.log('✅ Using vendor from orderContext (optimized)');
        const vendorFromOrder = {
          id: orderContext.vendorId,
          name: orderContext.vendorName!,
          company: orderContext.vendorName!
        };
        setVendors([vendorFromOrder]);
        return;
      }
      
      // Use existing vendors endpoint instead of /for-quotes
      const response = await tenantApiClient.get('/vendors', {
        params: { search, per_page: 50, status: 'active' }
      });
      // Response interceptor already unwraps pagination
      const vendorsData = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      console.log('🏢 Raw vendors data:', vendorsData);
      
      const transformedVendors = vendorsData.map((v: any) => ({
        id: v.uuid || v.id,
        name: v.name,
        company: v.company_name || v.company || v.name
      }));
      console.log('🏢 Transformed vendors:', transformedVendors);
      setVendors(transformedVendors);
      
      // If we have an order context with vendor_id, ensure that vendor is in the list
      if (orderContext && orderContext.vendorId) {
        console.log('🏢 Checking if order vendor exists in list...');
        console.log('🏢 Looking for vendor ID:', orderContext.vendorId);
        const vendorExists = transformedVendors.some((v: any) => v.id === orderContext.vendorId);
        console.log('🏢 Vendor exists in list:', vendorExists);
        
        if (!vendorExists && orderContext.vendorName) {
          console.log('🏢 Adding order vendor to list:', {
            id: orderContext.vendorId,
            name: orderContext.vendorName,
            company: orderContext.vendorName
          });
          // Add the order's vendor to the list
          setVendors(prev => [{
            id: orderContext.vendorId!,
            name: orderContext.vendorName!,
            company: orderContext.vendorName!
          }, ...prev]);
        }
      }
      
      // After vendors are loaded, check form value
      const currentVendorId = form.getValues('vendor_id');
      console.log('🏢 Current form vendor_id:', currentVendorId);
    } catch (error) {
      console.error('❌ Failed to load vendors:', error);
      toast({
        title: 'Warning',
        description: 'Failed to load vendors list',
        variant: 'destructive',
      });
    }
  };

  const loadProducts = async (search?: string) => {
    try {
      console.log('📦 Loading products...');
      // Use existing products endpoint instead of /for-quotes
      const response = await tenantApiClient.get('/products', {
        params: { search, per_page: 100, status: 'published' }
      });
      // Response interceptor already unwraps pagination, so response.data is the paginated object
      const productsData = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      console.log('📦 Raw products data:', productsData);
      
      const transformedProducts = productsData.map((p: any) => ({
        id: p.uuid || p.id?.toString() || '',
        intId: p.id, // Keep integer ID for matching with order items
        name: p.name,
        sku: p.sku || '',
        unit: p.unit || 'pcs',
        images: p.images || [] // Add images field
      }));
      console.log('📦 Transformed products:', transformedProducts);
      setProducts(transformedProducts);
    } catch (error) {
      console.error('❌ Failed to load products:', error);
      toast({
        title: 'Warning',
        description: 'Failed to load products list',
        variant: 'destructive',
      });
    }
  };

  const loadExchangeRate = async () => {
    try {
      console.log('💱 Loading exchange rate...');
      const settings = await exchangeRateService.getSettings();
      
      // Get rate from manual_rate if in manual mode, or from latest history
      let rate = getDefaultExchangeRateSync(); // Use env config as fallback
      
      if (settings.mode === 'manual' && settings.manual_rate) {
        rate = settings.manual_rate;
        console.log('💱 Using manual exchange rate:', rate);
      } else {
        // Try to get latest rate from history
        try {
          const history = await exchangeRateService.getHistory({ per_page: 1 });
          if (history?.data && history.data.length > 0 && history.data[0]?.rate) {
            rate = history.data[0].rate;
            console.log('💱 Using latest exchange rate from history:', rate);
          }
        } catch (historyError) {
          console.warn('💱 Could not fetch exchange rate history, using fallback');
        }
      }
      
      setExchangeRate(rate);
      console.log('💱 Exchange rate set to:', rate);
    } catch (error) {
      console.error('❌ Failed to load exchange rate:', error);
      // Keep using default fallback rate from env
      console.log('💱 Using fallback exchange rate from env:', exchangeRate);
    }
  };

  const handleSubmit = async (data: QuoteFormData) => {
    console.log('🚀 [QuoteForm.handleSubmit] Function called with data:', data);
    console.log('🚀 [QuoteForm.handleSubmit] Form state:', {
      isSubmitting: form.formState.isSubmitting,
      isValid: form.formState.isValid,
      errors: form.formState.errors,
      isDirty: form.formState.isDirty,
    });
    
    // Clear previous errors
    setSubmitError(null);
    setIsSubmitting(true);
    
    try {
      // Calculate initial_offer from items total
      const initialOffer = data.items.reduce((sum, item) => {
        return sum + (item.quantity * item.unit_price);
      }, 0);

      const submitData: CreateQuoteRequest | UpdateQuoteRequest = {
        ...data,
        valid_until: data.valid_until.toISOString(),
        items: data.items.map(item => {
          const quantity = item.quantity;
          const unitPrice = item.unit_price;
          const vendorCost = item.vendor_cost || 0;
          
          // Calculate totals
          const totalVendorCost = vendorCost * quantity;
          const totalUnitPrice = unitPrice * quantity;
          
          // Calculate profit margins
          const profitPerPiece = unitPrice - vendorCost;
          const profitPerPiecePercent = vendorCost > 0 ? (profitPerPiece / vendorCost) * 100 : 0;
          const profitTotal = totalUnitPrice - totalVendorCost;
          const profitTotalPercent = totalVendorCost > 0 ? (profitTotal / totalVendorCost) * 100 : 0;
          
          return {
            ...item,
            total_price: totalUnitPrice,
            total_vendor_cost: totalVendorCost,
            total_unit_price: totalUnitPrice,
            profit_per_piece: profitPerPiece,
            profit_per_piece_percent: profitPerPiecePercent,
            profit_total: profitTotal,
            profit_total_percent: profitTotalPercent,
          };
        }),
      };

      // Include order_id and initial_offer if coming from order context (create mode only)
      if (orderId && !quoteData && mode === 'create') {
        (submitData as CreateQuoteRequest).order_id = orderId;
        // Add initial_offer for backend vendor negotiation
        (submitData as any).initial_offer = initialOffer;
      }

      // In edit mode, ensure we don't send immutable fields
      if (mode === 'edit' && quoteData) {
        // Remove immutable fields that shouldn't be updated
        delete (submitData as any).customer_id;
        delete (submitData as any).vendor_id;
        delete (submitData as any).order_id;
        
        console.log('📝 Submitting quote update:', {
          quoteId: quoteData.id,
          mode,
          data: submitData
        });
      }

      console.log('📤 [QuoteForm.handleSubmit] Calling onSubmit with data:', submitData);
      await onSubmit(submitData);
      
      console.log('✅ [QuoteForm.handleSubmit] onSubmit completed successfully');
      
      // Clear error state on success
      setSubmitError(null);
      setRetryCount(0);
      
    } catch (error) {
      console.error('❌ [QuoteForm.handleSubmit] Error occurred:', error);
      
      // Parse and set error
      const apiError = parseApiError(error);
      setSubmitError(apiError);
      
      // Log error with context
      logError('QuoteForm.handleSubmit', error, {
        mode,
        quoteId: quoteData?.id,
        orderId,
        retryCount,
      });
      
      // Show toast notification for user feedback
      toast({
        title: 'Error',
        description: apiError.message,
        variant: 'destructive',
      });
      
      // Set field-level errors if validation error
      if (apiError.type === 'validation' && apiError.errors) {
        Object.entries(apiError.errors).forEach(([field, messages]) => {
          const message = Array.isArray(messages) ? messages[0] : messages;
          // Map API field names to form field names
          const formField = field as keyof QuoteFormData;
          if (formField in form.getValues()) {
            form.setError(formField, {
              type: 'manual',
              message,
            });
          }
        });
      }
      
      // Re-throw to let parent component handle if needed
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle retry for network/timeout errors
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setSubmitError(null);
    form.handleSubmit(handleSubmit)();
  };
  
  // Handle dismiss error
  const handleDismissError = () => {
    setSubmitError(null);
  };

  const handleAddItem = () => {
    append({
      product_id: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      vendor_cost: 0,
      total_price: 0,
      specifications: {},
      notes: '',
    });
  };

  const handleRemoveItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      form.setValue(`items.${index}.product_id`, productId);
      form.setValue(`items.${index}.description`, product.name);
    }
  };

  const calculateItemTotal = (quantity: number, unitPrice: number) => {
    const total = quantity * unitPrice;
    return isNaN(total) ? 0 : total;
  };
  
  const formatCurrency = (amount: number, currency: 'IDR' | 'USD' = 'IDR') => {
    if (isNaN(amount)) return currency === 'IDR' ? 'Rp 0' : '$0.00';
    
    if (currency === 'IDR') {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    }
  };

  const convertToUSD = (idrAmount: number) => {
    return idrAmount / exchangeRate;
  };

  // Profit margin calculation
  const calculateProfitMargin = (customerPrice: number, vendorCost: number) => {
    if (!vendorCost || vendorCost === 0) return null;
    const markupAmount = customerPrice - vendorCost;
    const profitPercentage = (markupAmount / vendorCost) * 100;
    return { markupAmount, profitPercentage };
  };

  // Use useWatch for proper nested field watching
  const watchedItems = useWatch({
    control: form.control,
    name: 'items',
  }) || [];
  
  const totalAmount = watchedItems.reduce((sum, item) => {
    const itemTotal = calculateItemTotal(item?.quantity || 0, item?.unit_price || 0);
    return sum + itemTotal;
  }, 0);

  // Total profit calculation - now properly reactive to vendor_cost changes
  const totalProfit = useMemo(() => {
    let totalMarkup = 0;
    let totalVendorCost = 0;
    let totalCustomerPrice = 0;
    
    console.log('💰 Calculating total profit from items:', watchedItems);
    
    watchedItems.forEach((item: any) => {
      const quantity = item?.quantity || 0;
      const unitPrice = item?.unit_price || 0;
      const vendorCost = item?.vendor_cost || 0;
      
      console.log(`  - Item: qty=${quantity}, price=${unitPrice}, cost=${vendorCost}`);
      
      if (vendorCost > 0) {
        const itemCustomerTotal = quantity * unitPrice;
        const itemVendorTotal = quantity * vendorCost;
        const itemMarkup = itemCustomerTotal - itemVendorTotal;
        
        totalMarkup += itemMarkup;
        totalVendorCost += itemVendorTotal;
        totalCustomerPrice += itemCustomerTotal;
        
        console.log(`    ✅ Included: markup=${itemMarkup}`);
      } else {
        console.log(`    ❌ Skipped: no vendor cost`);
      }
    });
    
    console.log('💰 Total calculation:', { totalMarkup, totalVendorCost, totalCustomerPrice });
    
    if (totalVendorCost === 0) {
      console.log('💰 Result: null (no vendor cost)');
      return null;
    }
    
    const profitPercentage = (totalMarkup / totalVendorCost) * 100;
    const result = { totalMarkup, profitPercentage };
    console.log('💰 Result:', result);
    return result;
  }, [watchedItems]);

    // Show loading skeleton while data is loading
  if (isInitialLoading || orderLoading) {
    return <QuoteFormSkeleton />;
  }

  return (
    <Form {...form}>
      <form 
        id={formId}
        onSubmit={(e) => {
          console.log('📝 [QuoteForm] Form onSubmit event triggered');
          console.log('📝 [QuoteForm] Event details:', {
            defaultPrevented: e.defaultPrevented,
            target: e.target,
            currentTarget: e.currentTarget,
          });
          console.log('📝 [QuoteForm] Form validation state:', {
            isValid: form.formState.isValid,
            errors: form.formState.errors,
            isSubmitting: form.formState.isSubmitting,
          });
          
          // Call React Hook Form's handleSubmit
          form.handleSubmit(handleSubmit)(e);
        }} 
        className="space-y-6"
      >
        {/* API Error Alert */}
        {submitError && (
          <ErrorAlert
            error={submitError}
            onRetry={handleRetry}
            onDismiss={handleDismissError}
          />
        )}
        
        {/* Validation Error Summary */}
        {Object.keys(form.formState.errors).length > 0 && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="text-destructive">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-destructive mb-2">Please fix the following errors:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {form.formState.errors.customer_id && (
                      <li>{form.formState.errors.customer_id.message}</li>
                    )}
                    {form.formState.errors.vendor_id && (
                      <li>{form.formState.errors.vendor_id.message}</li>
                    )}
                    {form.formState.errors.title && (
                      <li>{form.formState.errors.title.message}</li>
                    )}
                    {form.formState.errors.valid_until && (
                      <li>{form.formState.errors.valid_until.message}</li>
                    )}
                    {form.formState.errors.items && (
                      <li>{form.formState.errors.items.message || 'Please check quote items for errors'}</li>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              {isRevision 
                ? 'Create Quote Revision' 
                : mode === 'edit' && quoteData 
                  ? `Edit Quote ${quoteData.quote_number}` 
                  : 'Create New Quote'
              }
            </CardTitle>
            {isRevision && (
              <CardDescription>
                Creating a revision of quote #{quoteData?.quote_number}
              </CardDescription>
            )}
            {mode === 'edit' && quoteData && !isRevision && (
              <CardDescription>
                Editing existing quote for {orderContext?.customerName || 'customer'}
              </CardDescription>
            )}
          </CardHeader>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Selection */}
              <FormField
                control={form.control}
                name="customer_id"
                render={({ field }) => {
                  const selectedCustomer = customers.find(c => c.id === field.value);
                  console.log('🎨 Rendering customer field:', {
                    fieldValue: field.value,
                    selectedCustomer,
                    customersCount: customers.length
                  });
                  
                  return (
                    <FormItem>
                      <FormLabel>
                        Customer <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={mode === 'edit' || (!!orderId && !!orderContext)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a customer">
                              {selectedCustomer ? selectedCustomer.name : 'Select a customer'}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground">Loading customers...</div>
                          ) : (
                            customers.map((customer) => (
                              <SelectItem key={customer.id} value={customer.id}>
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4" />
                                  <div>
                                    <div className="font-medium">{customer.name}</div>
                                    {customer.company && (
                                      <div className="text-sm text-muted-foreground">{customer.company}</div>
                                    )}
                                  </div>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {(orderId && orderContext) || mode === 'edit' ? (
                        <FormDescription>
                          {mode === 'edit' 
                            ? '🔒 Customer cannot be changed when editing a quote'
                            : `Pre-filled from Order #${orderContext?.orderNumber} - Field is locked`
                          }
                        </FormDescription>
                      ) : null}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              {/* Vendor Selection */}
              <FormField
                control={form.control}
                name="vendor_id"
                render={({ field }) => {
                  const selectedVendor = vendors.find(v => v.id === field.value);
                  const isVendorFromOrder = !!orderId && !!orderContext && !!orderContext.vendorId;
                  
                  return (
                    <FormItem>
                      <FormLabel>
                        Vendor <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={mode === 'edit' || isVendorFromOrder}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a vendor">
                              {selectedVendor ? selectedVendor.name : 'Select a vendor'}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {vendors.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground">Loading vendors...</div>
                          ) : (
                            vendors.map((vendor) => (
                              <SelectItem key={vendor.id} value={vendor.id}>
                                <div className="flex items-center gap-2">
                                  <Building className="w-4 h-4" />
                                  <div>
                                    <div className="font-medium">{vendor.name}</div>
                                    <div className="text-sm text-muted-foreground">{vendor.company}</div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {(isVendorFromOrder || mode === 'edit') && (
                        <FormDescription>
                          {mode === 'edit'
                            ? '🔒 Vendor cannot be changed when editing a quote'
                            : `Pre-filled from Order #${orderContext?.orderNumber} - Field is locked`
                          }
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Quote Title <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Enter quote title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter quote description"
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Valid Until */}
            <FormField
              control={form.control}
              name="valid_until"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>
                    Valid Until <span className="text-red-500">*</span>
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Quote Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Quote Items</CardTitle>
                {orderId && orderContext && orderContext.items && orderContext.items.length > 0 && (
                  <CardDescription className="mt-1">
                    {orderContext.items.length} item(s) pre-populated from Order #{orderContext.orderNumber}
                  </CardDescription>
                )}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fields.map((field, index) => (
                <Card key={field.id} className="relative">
                  <CardContent className="pt-6">
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}

                    {/* ENHANCED: Two-Column Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* LEFT COLUMN */}
                      <div className="space-y-4">
                        {/* Product Selection - Read-only display with image */}
                        <div className="space-y-2">
                          <Label>
                            Product <span className="text-destructive">*</span>
                          </Label>
                          {(() => {
                            const productId = watchedItems[index]?.product_id;
                            const description = watchedItems[index]?.description;
                            
                            console.log('🔍 Product Debug:', {
                              index,
                              productId,
                              description,
                              productsCount: products.length,
                              watchedItem: watchedItems[index]
                            });
                            
                            // If we have description from order/quote, show it in read-only mode
                            if (description) {
                              console.log('✅ Showing description as product name (read-only)');
                              
                              // Try to find product to get image
                              let product = products.find(p => p.id === productId);
                              if (!product && productId && !isNaN(Number(productId))) {
                                product = products.find(p => p.intId === Number(productId));
                              }
                              
                              // Get product image if available
                              const productImage = product?.images?.[0] || null;
                              const imageUrl = productImage ? `${import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8000'}/storage/${productImage}` : null;
                              
                              return (
                                <div className="flex items-center gap-3 p-3 border rounded-md bg-muted/50">
                                  {imageUrl ? (
                                    <img 
                                      src={imageUrl} 
                                      alt={description}
                                      className="w-12 h-12 object-cover rounded"
                                      onError={(e) => {
                                        // Fallback to icon if image fails to load
                                        e.currentTarget.style.display = 'none';
                                        const icon = e.currentTarget.nextElementSibling as HTMLElement;
                                        if (icon) icon.style.display = 'block';
                                      }}
                                    />
                                  ) : null}
                                  <Package 
                                    className="w-4 h-4 text-muted-foreground flex-shrink-0" 
                                    style={{ display: imageUrl ? 'none' : 'block' }}
                                  />
                                  <div className="flex-1">
                                    <div className="font-medium">{description}</div>
                                    <div className="text-sm text-muted-foreground">Product from order</div>
                                  </div>
                                </div>
                              );
                            }
                            
                            // Try to find product by UUID first
                            let product = products.find(p => p.id === productId);
                            
                            // If not found and productId is a number, try by intId
                            if (!product && productId && !isNaN(Number(productId))) {
                              product = products.find(p => p.intId === Number(productId));
                              console.log('🔍 Trying intId match:', { productId, found: !!product });
                            }
                            
                            if (product) {
                              console.log('✅ Product found:', product);
                              
                              // Get product image if available
                              const productImage = product?.images?.[0] || null;
                              const imageUrl = productImage ? `${import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8000'}/storage/${productImage}` : null;
                              
                              // Display product in read-only mode with image
                              return (
                                <div className="flex items-center gap-3 p-3 border rounded-md bg-muted/50">
                                  {imageUrl ? (
                                    <img 
                                      src={imageUrl} 
                                      alt={product.name}
                                      className="w-12 h-12 object-cover rounded"
                                      onError={(e) => {
                                        // Fallback to icon if image fails to load
                                        e.currentTarget.style.display = 'none';
                                        const icon = e.currentTarget.nextElementSibling as HTMLElement;
                                        if (icon) icon.style.display = 'block';
                                      }}
                                    />
                                  ) : null}
                                  <Package 
                                    className="w-4 h-4 text-muted-foreground flex-shrink-0" 
                                    style={{ display: imageUrl ? 'none' : 'block' }}
                                  />
                                  <div className="flex-1">
                                    <div className="font-medium">{product.name}</div>
                                    <div className="text-sm text-muted-foreground">SKU: {product.sku}</div>
                                  </div>
                                </div>
                              );
                            }
                            
                            console.log('❌ No product or description, showing select');
                            // Show select if no product selected (manual quote creation)
                            return (
                              <Select 
                                onValueChange={(value) => handleProductSelect(index, value)}
                                value={productId || ''}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select product" />
                                </SelectTrigger>
                                <SelectContent>
                                  {products.map((product) => (
                                    <SelectItem key={product.id} value={product.id}>
                                      <div className="flex items-center gap-2">
                                        <Package className="w-4 h-4" />
                                        <div>
                                          <div className="font-medium">{product.name}</div>
                                          <div className="text-sm text-muted-foreground">SKU: {product.sku}</div>
                                        </div>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            );
                          })()}
                        </div>

                        {/* Product Specifications - Moved here from bottom */}
                        {(() => {
                          const item = watchedItems[index];
                          const specifications = item?.specifications;
                          const formSchema = (item as any)?.form_schema;
                          
                          if (specifications && typeof specifications === 'object' && Object.keys(specifications).length > 0) {
                            return (
                              <QuoteItemSpecificationsDisplay
                                specifications={specifications}
                                formSchema={formSchema}
                              />
                            );
                          }
                          
                          return null;
                        })()}

                        {/* Description */}
                        <FormField
                          control={form.control}
                          name={`items.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Description <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <WysiwygEditor
                                  value={field.value || ''}
                                  onChange={field.onChange}
                                  label=""
                                  placeholder="Item description..."
                                  height={150}
                                  required={false}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* RIGHT COLUMN */}
                      <div className="space-y-4">
                        {/* Quantity */}
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Quantity <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  placeholder="0"
                                  {...field}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value) || 0;
                                    field.onChange(value);
                                    const unitPrice = form.getValues(`items.${index}.unit_price`);
                                    form.setValue(`items.${index}.total_price`, calculateItemTotal(value, unitPrice));
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Vendor Cost with Currency Formatting */}
                        <FormField
                          control={form.control}
                          name={`items.${index}.vendor_cost`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Vendor Cost (IDR) <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Banknote className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                  <Input
                                    type="text"
                                    className="pl-9"
                                    placeholder="0"
                                    value={field.value === 0 ? '' : new Intl.NumberFormat('id-ID').format(field.value || 0)}
                                    onFocus={(e) => {
                                      // Auto-clear if value is 0
                                      if (field.value === 0) {
                                        e.target.value = '';
                                      }
                                    }}
                                    onChange={(e) => {
                                      // Remove all non-digit characters
                                      const rawValue = e.target.value.replace(/\D/g, '');
                                      const numericValue = rawValue === '' ? 0 : parseFloat(rawValue);
                                      field.onChange(numericValue);
                                    }}
                                    onBlur={(e) => {
                                      // Format on blur
                                      if (field.value === 0) {
                                        e.target.value = '';
                                      }
                                    }}
                                  />
                                </div>
                              </FormControl>
                              <FormDescription className="text-xs text-yellow-600 dark:text-yellow-500">
                                Cost from vendor (for profit calculation per piece)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Unit Price with Rounding Buttons and Currency Formatting */}
                        <FormField
                          control={form.control}
                          name={`items.${index}.unit_price`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Unit Price (IDR) <span className="text-red-500">*</span>
                              </FormLabel>
                              <div className="flex items-center gap-2">
                                <FormControl>
                                  <div className="relative flex-1">
                                    <Banknote className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                    <Input
                                      type="text"
                                      className="pl-9"
                                      placeholder="0"
                                      value={field.value === 0 ? '' : new Intl.NumberFormat('id-ID').format(field.value || 0)}
                                      onFocus={(e) => {
                                        // Auto-clear if value is 0
                                        if (field.value === 0) {
                                          e.target.value = '';
                                        }
                                      }}
                                      onChange={(e) => {
                                        // Remove all non-digit characters
                                        const rawValue = e.target.value.replace(/\D/g, '');
                                        const numericValue = rawValue === '' ? 0 : parseFloat(rawValue);
                                        field.onChange(numericValue);
                                        const quantity = form.getValues(`items.${index}.quantity`);
                                        form.setValue(`items.${index}.total_price`, calculateItemTotal(quantity, numericValue));
                                      }}
                                      onBlur={(e) => {
                                        // Format on blur
                                        if (field.value === 0) {
                                          e.target.value = '';
                                        }
                                      }}
                                    />
                                  </div>
                                </FormControl>
                                <RoundingButtonGroup
                                  value={field.value || 0}
                                  onChange={(roundedValue, mode) => {
                                    field.onChange(roundedValue);
                                    setRoundingModes(prev => ({ ...prev, [index]: mode }));
                                    const quantity = form.getValues(`items.${index}.quantity`);
                                    form.setValue(`items.${index}.total_price`, calculateItemTotal(quantity, roundedValue));
                                  }}
                                  activeMode={roundingModes[index] || 'none'}
                                />
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Profit Margin & Pricing Breakdown - Side by Side */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {/* LEFT: Profit Margin Display */}
                          {(() => {
                            const vendorCost = watchedItems[index]?.vendor_cost || 0;
                            const unitPrice = watchedItems[index]?.unit_price || 0;
                            const quantity = watchedItems[index]?.quantity || 0;
                            const profit = calculateProfitMargin(unitPrice, vendorCost);
                            
                            if (!profit) {
                              return (
                                <div className="text-xs text-yellow-600 dark:text-yellow-500 italic">
                                  Enter vendor cost to see profit margin
                                </div>
                              );
                            }
                            
                            // Determine if loss (vendor cost > unit price)
                            const isLoss = vendorCost > unitPrice;
                            const profitColor = isLoss ? 'text-red-600' : 'text-green-600';
                            const profitBgColor = isLoss ? 'bg-red-100 dark:bg-red-900' : 'bg-green-100 dark:bg-green-900';
                            const profitIconColor = isLoss ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400';
                            const ProfitIcon = isLoss ? TrendingDown : TrendingUp;
                            const totalItemProfit = profit.markupAmount * quantity;
                            
                            return (
                              <div className="space-y-1">
                                <Label className="text-xs text-yellow-600 dark:text-yellow-500">Profit Margin Per Piece</Label>
                                <div className="flex items-center gap-2">
                                  <div className={`font-bold ${profitColor} ${isLoss ? 'font-extrabold' : ''}`}>
                                    {isLoss ? '-' : '+'}{formatCurrency(Math.abs(profit.markupAmount), 'IDR')}
                                  </div>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className={`w-3 h-3 rounded-full ${profitBgColor} flex items-center justify-center cursor-help`}>
                                        <span className={`text-xs ${profitIconColor} font-bold`}>i</span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="left" className="max-w-xs">
                                      <div className="space-y-2">
                                        <div className="font-semibold">Detail Profit Calculation:</div>
                                        <div className="space-y-1 text-sm">
                                          <div>Customer Price: {formatCurrency(unitPrice, 'IDR')}</div>
                                          <div>Vendor Cost: {formatCurrency(vendorCost, 'IDR')}</div>
                                          <div className="border-t pt-1 mt-1">
                                            <div className={`font-semibold ${profitColor}`}>
                                              {isLoss ? 'Loss' : 'Markup'} per unit: {formatCurrency(Math.abs(profit.markupAmount), 'IDR')}
                                            </div>
                                            <div className="text-yellow-600 dark:text-yellow-500">
                                              ≈ {formatCurrency(convertToUSD(Math.abs(profit.markupAmount)), 'USD')}
                                            </div>
                                            <div className="mt-1">
                                              Total {isLoss ? 'Loss' : 'Profit'} (×{quantity}): {formatCurrency(Math.abs(totalItemProfit), 'IDR')}
                                            </div>
                                            <div className="text-yellow-600 dark:text-yellow-500">
                                              ≈ {formatCurrency(convertToUSD(Math.abs(totalItemProfit)), 'USD')}
                                            </div>
                                            <div className="mt-1">{isLoss ? 'Loss' : 'Profit'} Margin: {Math.abs(profit.profitPercentage).toFixed(1)}%</div>
                                          </div>
                                          <div className="text-xs opacity-75 mt-2">
                                            Formula: (Customer Price - Vendor Cost) / Vendor Cost × 100%
                                          </div>
                                        </div>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                                <div className="flex items-center gap-1">
                                  <ProfitIcon className={`w-3 h-3 ${profitColor}`} />
                                  <p className={`text-xs italic ${profitColor}`}>
                                    {Math.abs(profit.profitPercentage).toFixed(1)}% margin
                                  </p>
                                </div>
                                <div className="text-xs text-yellow-600 dark:text-yellow-500">
                                  ≈ {formatCurrency(convertToUSD(Math.abs(profit.markupAmount)), 'USD')} per unit
                                </div>
                              </div>
                            );
                          })()}

                          {/* RIGHT: Pricing Breakdown (Total for Qty > 1) */}
                          {(() => {
                            const vendorCost = watchedItems[index]?.vendor_cost || 0;
                            const unitPrice = watchedItems[index]?.unit_price || 0;
                            const quantity = watchedItems[index]?.quantity || 1;
                            
                            // Only show if quantity > 1 and has vendor cost
                            if (quantity <= 1 || vendorCost === 0) {
                              return null;
                            }
                            
                            const totalVendorCost = vendorCost * quantity;
                            const totalUnitPrice = unitPrice * quantity;
                            const profitTotal = totalUnitPrice - totalVendorCost;
                            const profitTotalPercent = totalVendorCost > 0 ? (profitTotal / totalVendorCost) * 100 : 0;
                            const isLoss = profitTotal < 0;
                            const profitColor = isLoss ? 'text-red-600' : 'text-green-600';
                            const ProfitIcon = isLoss ? TrendingDown : TrendingUp;
                            
                            return (
                              <div className="space-y-1 p-3 border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 rounded-md">
                                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                  <span>Total (Qty: {quantity})</span>
                                </Label>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Vendor Cost:</span>
                                    <span className="font-semibold">{formatCurrency(totalVendorCost, 'IDR')}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Unit Price:</span>
                                    <span className="font-semibold">{formatCurrency(totalUnitPrice, 'IDR')}</span>
                                  </div>
                                  <div className="border-t pt-2 flex justify-between items-center">
                                    <span className="text-muted-foreground flex items-center gap-1">
                                      <ProfitIcon className={`w-3 h-3 ${profitColor}`} />
                                      Total {isLoss ? 'Loss' : 'Profit'}:
                                    </span>
                                    <div className="text-right">
                                      <div className={`font-bold ${profitColor}`}>
                                        {isLoss ? '-' : '+'}{formatCurrency(Math.abs(profitTotal), 'IDR')}
                                      </div>
                                      <div className={`text-xs ${profitColor}`}>
                                        ({Math.abs(profitTotalPercent).toFixed(1)}%)
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Total (Read-only) - Calculated from quantity × unit_price */}
                        <div className="space-y-2">
                          <Label>Total</Label>
                          <div className="space-y-1">
                            <Input
                              value={formatCurrency(calculateItemTotal(
                                watchedItems[index]?.quantity || 0,
                                watchedItems[index]?.unit_price || 0
                              ))}
                              disabled
                              className="font-semibold bg-muted"
                            />
                            <div className="text-xs text-yellow-600 dark:text-yellow-500 pl-1">
                              ≈ {formatCurrency(convertToUSD(calculateItemTotal(
                                watchedItems[index]?.quantity || 0,
                                watchedItems[index]?.unit_price || 0
                              )), 'USD')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Notes - WYSIWYG - Full Width */}
                    <div className="mt-6">
                      <FormField
                        control={form.control}
                        name={`items.${index}.notes`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes (Optional)</FormLabel>
                            <FormControl>
                              <WysiwygEditor
                                value={field.value || ''}
                                onChange={field.onChange}
                                label=""
                                placeholder="Additional notes for this item..."
                                height={200}
                                required={false}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Total Summary */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* LEFT: Total Profit */}
                {totalProfit ? (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                      Total Profit
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className={`w-3 h-3 rounded-full ${totalProfit.totalMarkup < 0 ? 'bg-red-100 dark:bg-red-900' : 'bg-green-100 dark:bg-green-900'} flex items-center justify-center cursor-help`}>
                            <span className={`text-xs ${totalProfit.totalMarkup < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'} font-bold`}>i</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <div className="space-y-1">
                            <div className="font-semibold">Total Profit Calculation:</div>
                            <div className="text-sm">
                              Sum of all items' markup amounts
                            </div>
                            <div className="text-xs opacity-75 mt-2">
                              Formula: Σ(Customer Price - Vendor Cost)
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className={`text-2xl font-bold ${totalProfit.totalMarkup < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {totalProfit.totalMarkup < 0 ? '-' : '+'}{formatCurrency(Math.abs(totalProfit.totalMarkup), 'IDR')}
                    </div>
                    <div className="text-lg text-yellow-600 dark:text-yellow-500">
                      ≈ {formatCurrency(convertToUSD(Math.abs(totalProfit.totalMarkup)), 'USD')}
                    </div>
                    <div className="flex items-center gap-1">
                      {totalProfit.totalMarkup < 0 ? (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      ) : (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      )}
                      <span className={`text-sm italic ${totalProfit.totalMarkup < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {Math.abs(totalProfit.profitPercentage).toFixed(1)}% margin
                      </span>
                    </div>
                  </div>
                ) : (
                  <div></div>
                )}
                
                {/* RIGHT: Total Amount - Always on the right */}
                <div className="text-right space-y-2">
                  <div className="text-sm text-muted-foreground mb-1">Total Amount</div>
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(totalAmount, 'IDR')}
                  </div>
                  <div className="text-lg text-yellow-600 dark:text-yellow-500">
                    ≈ {formatCurrency(convertToUSD(totalAmount), 'USD')}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 text-center space-y-1">
                <div className="text-sm text-muted-foreground">
                  Excluding taxes and fees
                </div>
                <div className="text-xs text-muted-foreground">
                  Exchange rate: 1 USD = Rp {exchangeRate.toLocaleString('id-ID')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms and Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Terms and Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="terms_and_conditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    Terms and Conditions
                    <TermsTemplateDialog 
                      onInsert={(content) => {
                        field.onChange(content);
                        // Force re-render of WYSIWYG editor
                        setTermsEditorKey(prev => prev + 1);
                        toast({
                          title: 'Template Inserted',
                          description: 'Terms and conditions template has been added to the form',
                        });
                      }}
                    />
                  </FormLabel>
                  <FormControl>
                    <WysiwygEditor
                      key={`terms-editor-${termsEditorKey}`}
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder="Enter terms and conditions"
                      height={300}
                    />
                  </FormControl>
                  <FormDescription>
                    Specify payment terms, delivery conditions, and other important terms
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    Internal Notes
                    <InternalNotesTemplateDialog 
                      onInsert={(content) => {
                        field.onChange(content);
                        // Force re-render of WYSIWYG editor
                        setNotesEditorKey(prev => prev + 1);
                        toast({
                          title: 'Template Inserted',
                          description: 'Internal notes template has been added to the form',
                        });
                      }}
                    />
                  </FormLabel>
                  <FormControl>
                    <WysiwygEditor
                      key={`notes-editor-${notesEditorKey}`}
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder="Internal notes (not visible to vendor)"
                      height={300}
                    />
                  </FormControl>
                  <FormDescription>
                    These notes are for internal use only and will not be shared with the vendor
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      </form>
    </Form>
  );
};