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

const quoteItemSchema = z.object({
  product_id: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unit_price: z.number().min(0, 'Unit price must be non-negative'),
  vendor_cost: z.number().min(0, 'Vendor cost must be non-negative').optional(),
  total_price: z.number().min(0),
  specifications: z.record(z.any()).optional(),
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
  quote?: Quote;
  onSubmit: (data: CreateQuoteRequest | UpdateQuoteRequest) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  isRevision?: boolean;
}

export const QuoteForm = ({ quote, onSubmit, onCancel, loading, isRevision }: QuoteFormProps) => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  
  // State for search/select options
  const [customers, setCustomers] = useState<Array<{ id: string; name: string; company?: string }>>([]);
  const [vendors, setVendors] = useState<Array<{ id: string; name: string; company: string }>>([]);
  const [products, setProducts] = useState<Array<{ id: string; intId?: number; name: string; sku: string; unit: string }>>([]);
  const [orderContext, setOrderContext] = useState<Order | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [roundingModes, setRoundingModes] = useState<Record<number, RoundingMode>>({});
  const [termsEditorKey, setTermsEditorKey] = useState(0);
  const [notesEditorKey, setNotesEditorKey] = useState(0);
  const [exchangeRate, setExchangeRate] = useState<number>(getDefaultExchangeRateSync()); // Use env config as initial value

  const form = useForm<QuoteFormData>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      customer_id: quote?.customer_id || '',
      vendor_id: quote?.vendor_id || '',
      title: quote?.title || '',
      description: quote?.description || '',
      valid_until: quote ? new Date(quote.valid_until) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
      terms_and_conditions: quote?.terms_and_conditions || '',
      notes: quote?.notes || '',
      items: quote?.items.length ? quote.items.map(item => ({
        product_id: item.product_id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        vendor_cost: item.vendor_cost || 0,
        total_price: item.total_price,
        specifications: item.specifications,
        notes: item.notes,
      })) : [{
        description: '',
        quantity: 1,
        unit_price: 0,
        vendor_cost: 0,
        total_price: 0,
      }],
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

  // Load order context when order_id is present
  useEffect(() => {
    const loadOrderContext = async () => {
      if (orderId && !quote) {
        try {
          setOrderLoading(true);
          const order = await ordersService.getOrderById(orderId);
          console.log('📦 Order loaded:', order);
          console.log('📦 Order items:', order.items);
          console.log('📦 Customer ID:', order.customerId);
          console.log('📦 Vendor ID:', order.vendorId);
          setOrderContext(order);
          
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
          
          // Pre-populate order items into quote items
          if (order.items && order.items.length > 0) {
            console.log('📋 Transforming order items to quote items...');
            const quoteItems = order.items.map((item: any) => {
              console.log('  - Item:', item);
              // Backend sends snake_case, not camelCase
              return {
                product_id: (item.product_id || item.productId)?.toString() || '',
                description: item.product_name || item.productName || '',
                quantity: item.quantity || 1,
                unit_price: item.unit_price || item.unitPrice || item.final_price || 0,
                vendor_cost: item.vendor_cost || item.vendorCost || 0,
                total_price: item.subtotal || 0,
                specifications: {},
                notes: '',
              };
            });
            
            console.log('✅ Quote items prepared:', quoteItems);
            
            // Set customer_id, vendor_id, and items together to prevent form reset
            console.log('🔄 Setting form values (customer + vendor + items)...');
            form.reset({
              ...form.getValues(),
              customer_id: order.customerId,
              vendor_id: order.vendorId || form.getValues('vendor_id'),
              items: quoteItems,
            });
            console.log('✅ Form values set (customer + vendor + items)');
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
      }
    };

    loadOrderContext();
  }, [orderId, quote, form, toast]);

  const loadCustomers = async (search?: string) => {
    try {
      console.log('👥 Loading customers...');
      // Use existing customers endpoint instead of /for-quotes
      const response = await tenantApiClient.get('/customers', {
        params: { search, per_page: 50, status: 'active' }
      });
      // Transform response to match expected format
      const customersData = response.data?.data || response.data || [];
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
      // Use existing vendors endpoint instead of /for-quotes
      const response = await tenantApiClient.get('/vendors', {
        params: { search, per_page: 50, status: 'active' }
      });
      // Transform response to match expected format
      const vendorsData = response.data?.data || response.data || [];
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
        params: { search, per_page: 100, status: 'active' }
      });
      // Transform response to match expected format
      const productsData = response.data?.data || response.data || [];
      console.log('📦 Raw products data:', productsData);
      
      const transformedProducts = productsData.map((p: any) => ({
        id: p.uuid || p.id?.toString() || '',
        intId: p.id, // Keep integer ID for matching with order items
        name: p.name,
        sku: p.sku || '',
        unit: p.unit || 'pcs'
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
    try {
      // Calculate initial_offer from items total
      const initialOffer = data.items.reduce((sum, item) => {
        return sum + (item.quantity * item.unit_price);
      }, 0);

      const submitData: CreateQuoteRequest | UpdateQuoteRequest = {
        ...data,
        valid_until: data.valid_until.toISOString(),
        items: data.items.map(item => ({
          ...item,
          total_price: item.quantity * item.unit_price,
        })),
      };

      // Include order_id and initial_offer if coming from order context
      if (orderId && !quote) {
        (submitData as CreateQuoteRequest).order_id = orderId;
        // Add initial_offer for backend vendor negotiation
        (submitData as any).initial_offer = initialOffer;
      }

      await onSubmit(submitData);
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: 'Error',
        description: 'Failed to save quote. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleAddItem = () => {
    append({
      description: '',
      quantity: 1,
      unit_price: 0,
      vendor_cost: 0,
      total_price: 0,
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
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              {isRevision ? 'Create Quote Revision' : quote ? 'Edit Quote' : 'Create New Quote'}
            </CardTitle>
            {isRevision && (
              <CardDescription>
                Creating a revision of quote #{quote?.quote_number}
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
                      <FormLabel>Customer</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={!!orderId && !!orderContext}
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
                      {orderId && orderContext && (
                        <FormDescription>
                          Pre-filled from Order #{orderContext.orderNumber} - Field is locked
                        </FormDescription>
                      )}
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
                      <FormLabel>Vendor</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={isVendorFromOrder}
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
                      {isVendorFromOrder && (
                        <FormDescription>
                          Pre-filled from Order #{orderContext.orderNumber} - Field is locked
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
                  <FormLabel>Quote Title</FormLabel>
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
                  <FormLabel>Valid Until</FormLabel>
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
                        {/* Product Selection */}
                        <div className="space-y-2">
                          <Label>Product (Optional)</Label>
                          <Select 
                            onValueChange={(value) => handleProductSelect(index, value)}
                            value={watchedItems[index]?.product_id || ''}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select product">
                                {(() => {
                                  const productId = watchedItems[index]?.product_id;
                                  if (productId) {
                                    let product = products.find(p => p.id === productId);
                                    if (!product && !isNaN(Number(productId))) {
                                      product = products.find(p => p.intId === Number(productId));
                                    }
                                    if (product) {
                                      return product.name;
                                    }
                                    return watchedItems[index]?.description || 'Select product';
                                  }
                                  return 'Select product';
                                })()}
                              </SelectValue>
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
                        </div>

                        {/* Description */}
                        <FormField
                          control={form.control}
                          name={`items.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
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
                              <FormLabel>Quantity</FormLabel>
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

                        {/* Vendor Cost */}
                        <FormField
                          control={form.control}
                          name={`items.${index}.vendor_cost`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Vendor Cost (IDR)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Banknote className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                  <Input
                                    type="number"
                                    min="0"
                                    className="pl-9"
                                    placeholder="0"
                                    {...field}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value) || 0;
                                      field.onChange(value);
                                    }}
                                  />
                                </div>
                              </FormControl>
                              <FormDescription className="text-xs">
                                Cost from vendor (for profit calculation)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Unit Price with Rounding Buttons */}
                        <FormField
                          control={form.control}
                          name={`items.${index}.unit_price`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unit Price (IDR)</FormLabel>
                              <div className="flex items-center gap-2">
                                <FormControl>
                                  <div className="relative flex-1">
                                    <Banknote className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                    <Input
                                      type="number"
                                      min="0"
                                      className="pl-9"
                                      placeholder="0"
                                      {...field}
                                      onChange={(e) => {
                                        const value = parseFloat(e.target.value) || 0;
                                        field.onChange(value);
                                        const quantity = form.getValues(`items.${index}.quantity`);
                                        form.setValue(`items.${index}.total_price`, calculateItemTotal(quantity, value));
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

                        {/* Profit Margin Display */}
                        {(() => {
                          const vendorCost = watchedItems[index]?.vendor_cost || 0;
                          const unitPrice = watchedItems[index]?.unit_price || 0;
                          const quantity = watchedItems[index]?.quantity || 0;
                          const profit = calculateProfitMargin(unitPrice, vendorCost);
                          
                          if (!profit) {
                            return (
                              <div className="text-xs text-muted-foreground italic">
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
                              <Label className="text-xs text-muted-foreground">Profit Margin</Label>
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
                                          <div className="text-muted-foreground">
                                            ≈ {formatCurrency(convertToUSD(Math.abs(profit.markupAmount)), 'USD')}
                                          </div>
                                          <div className="mt-1">
                                            Total {isLoss ? 'Loss' : 'Profit'} (×{quantity}): {formatCurrency(Math.abs(totalItemProfit), 'IDR')}
                                          </div>
                                          <div className="text-muted-foreground">
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
                              <div className="text-xs text-muted-foreground">
                                ≈ {formatCurrency(convertToUSD(Math.abs(profit.markupAmount)), 'USD')} per unit
                              </div>
                            </div>
                          );
                        })()}

                        {/* Total (Read-only) */}
                        <FormField
                          control={form.control}
                          name={`items.${index}.total_price`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Total</FormLabel>
                              <FormControl>
                                <div className="space-y-1">
                                  <Input
                                    {...field}
                                    value={formatCurrency(field.value || 0)}
                                    disabled
                                    className="font-semibold"
                                  />
                                  <div className="text-xs text-muted-foreground pl-1">
                                    ≈ {formatCurrency(convertToUSD(field.value || 0), 'USD')}
                                  </div>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
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
                    <div className="text-lg text-muted-foreground">
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
                  <div className="text-lg text-muted-foreground">
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

        {/* Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {quote && !isRevision ? 'Saving will update the existing quote' : 'The quote will be saved as draft'}
              </div>
              <div className="flex gap-2">
                {onCancel && (
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                )}
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {isRevision ? 'Create Revision' : quote ? 'Update Quote' : 'Save Quote'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
};