import { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
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
  Plus,
  Minus,
  CalendarIcon,
  Search,
  DollarSign,
  Package,
  User,
  Building,
  Save,
  Send,
  X,
} from 'lucide-react';
import { Quote, CreateQuoteRequest, UpdateQuoteRequest, QuoteItem } from '@/services/tenant/quoteService';
import { quoteService } from '@/services/tenant/quoteService';
import { tenantApiClient } from '@/services/tenant/tenantApiClient';
import { ordersService } from '@/services/api/orders';
import { Order } from '@/types/order';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const quoteItemSchema = z.object({
  product_id: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unit_price: z.number().min(0, 'Unit price must be non-negative'),
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
  const [customersLoading, setCustomersLoading] = useState(false);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [orderContext, setOrderContext] = useState<Order | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);

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
        total_price: item.total_price,
        specifications: item.specifications,
        notes: item.notes,
      })) : [{
        description: '',
        quantity: 1,
        unit_price: 0,
        total_price: 0,
      }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  // Load initial data
  useEffect(() => {
    // Load vendors and products immediately
    loadVendors();
    loadProducts();
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

  // Load customers after order context is loaded (if applicable)
  useEffect(() => {
    if (orderContext || !orderId) {
      // Load customers after we have order context, or if there's no order context
      loadCustomers();
    }
  }, [orderContext, orderId]);

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
          setOrderContext(order);
          
          // Pre-fill customer_id from order
          if (order.customerId) {
            console.log('✅ Setting customer_id:', order.customerId);
            form.setValue('customer_id', order.customerId);
          }
          
          // Pre-populate order items into quote items
          if (order.items && order.items.length > 0) {
            console.log('📋 Transforming order items to quote items...');
            const quoteItems = order.items.map(item => {
              console.log('  - Item:', item);
              return {
                product_id: item.product_id?.toString() || '',
                description: item.product_name,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_price: item.subtotal,
                specifications: {},
                notes: '',
              };
            });
            
            console.log('✅ Quote items prepared:', quoteItems);
            
            // Set both customer_id and items together to prevent form reset
            console.log('🔄 Setting form values (customer + items)...');
            form.reset({
              ...form.getValues(),
              customer_id: order.customerId,
              items: quoteItems,
            });
            console.log('✅ Form values set (customer + items)');
          } else if (order.customerId) {
            // If no items, just set customer
            form.setValue('customer_id', order.customerId);
          }
          
          toast({
            title: 'Order Context Loaded',
            description: `Creating quote for Order #${order.orderNumber} with ${order.items.length} items`,
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
        }
      }
    };

    loadOrderContext();
  }, [orderId, quote, form, toast]);

  const loadCustomers = async (search?: string) => {
    try {
      setCustomersLoading(true);
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
    } finally {
      setCustomersLoading(false);
    }
  };

  const loadVendors = async (search?: string) => {
    try {
      setVendorsLoading(true);
      // Use existing vendors endpoint instead of /for-quotes
      const response = await tenantApiClient.get('/vendors', {
        params: { search, per_page: 50, status: 'active' }
      });
      // Transform response to match expected format
      const vendorsData = response.data?.data || response.data || [];
      setVendors(vendorsData.map((v: any) => ({
        id: v.uuid || v.id,
        name: v.name,
        company: v.company_name || v.company || v.name
      })));
    } catch (error) {
      console.error('Failed to load vendors:', error);
      toast({
        title: 'Warning',
        description: 'Failed to load vendors list',
        variant: 'destructive',
      });
    } finally {
      setVendorsLoading(false);
    }
  };

  const loadProducts = async (search?: string) => {
    try {
      setProductsLoading(true);
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
    } finally {
      setProductsLoading(false);
    }
  };

  const handleSubmit = async (data: QuoteFormData) => {
    try {
      const submitData: CreateQuoteRequest | UpdateQuoteRequest = {
        ...data,
        valid_until: data.valid_until.toISOString(),
        items: data.items.map(item => ({
          ...item,
          total_price: item.quantity * item.unit_price,
        })),
      };

      // Include order_id if coming from order context
      if (orderId && !quote) {
        (submitData as CreateQuoteRequest).order_id = orderId;
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

  // Currency conversion rate (IDR to USD)
  const USD_TO_IDR_RATE = 15750; // Update this rate as needed
  
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
    return idrAmount / USD_TO_IDR_RATE;
  };

  const watchedItems = form.watch('items');
  const totalAmount = watchedItems.reduce((sum, item) => {
    const itemTotal = calculateItemTotal(item.quantity || 0, item.unit_price || 0);
    return sum + itemTotal;
  }, 0);

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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a vendor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vendors.map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4" />
                              <div>
                                <div className="font-medium">{vendor.name}</div>
                                <div className="text-sm text-muted-foreground">{vendor.company}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
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

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      {/* Product Selection */}
                      <div className="md:col-span-3">
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
                                  // Try to find product by UUID first
                                  let product = products.find(p => p.id === productId);
                                  
                                  // If not found and productId is numeric, try matching by integer ID
                                  if (!product && !isNaN(Number(productId))) {
                                    product = products.find(p => p.intId === Number(productId));
                                  }
                                  
                                  if (product) {
                                    return product.name;
                                  }
                                  // If not found in list, use description as fallback
                                  return watchedItems[index]?.description || 'Select product';
                                }
                                return 'Select product';
                              })()}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                <div>
                                  <div className="font-medium">{product.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    SKU: {product.sku}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Description */}
                      <div className="md:col-span-4">
                        <FormField
                          control={form.control}
                          name={`items.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Input placeholder="Item description" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Quantity */}
                      <div className="md:col-span-2">
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
                      </div>

                      {/* Unit Price */}
                      <div className="md:col-span-2">
                        <FormField
                          control={form.control}
                          name={`items.${index}.unit_price`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unit Price (IDR)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                                    Rp
                                  </span>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="1000"
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
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Total */}
                      <div className="md:col-span-1">
                        <Label>Total</Label>
                        <div className="h-10 px-3 py-2 bg-muted rounded-md flex items-center justify-end">
                          <span className="text-sm font-medium">
                            {formatCurrency(calculateItemTotal(watchedItems[index]?.quantity || 0, watchedItems[index]?.unit_price || 0), 'IDR')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Item Notes */}
                    <FormField
                      control={form.control}
                      name={`items.${index}.notes`}
                      render={({ field }) => (
                        <FormItem className="mt-4">
                          <FormLabel>Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Additional notes for this item"
                              className="min-h-[60px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Total Summary */}
            <div className="border-t pt-4">
              <div className="flex justify-end">
                <div className="text-right space-y-2">
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(totalAmount, 'IDR')}
                    </div>
                    <div className="text-lg text-muted-foreground">
                      ≈ {formatCurrency(convertToUSD(totalAmount), 'USD')}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Excluding taxes and fees
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Exchange rate: 1 USD = Rp {USD_TO_IDR_RATE.toLocaleString('id-ID')}
                  </div>
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
                  <FormLabel>Terms and Conditions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter terms and conditions"
                      className="min-h-[120px]"
                      {...field}
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
                  <FormLabel>Internal Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Internal notes (not visible to vendor)"
                      className="min-h-[100px]"
                      {...field}
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