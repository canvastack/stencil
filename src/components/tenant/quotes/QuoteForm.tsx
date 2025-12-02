import { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
  
  // State for search/select options
  const [customers, setCustomers] = useState<Array<{ id: string; name: string; company?: string }>>([]);
  const [vendors, setVendors] = useState<Array<{ id: string; name: string; company: string }>>([]);
  const [products, setProducts] = useState<Array<{ id: string; name: string; sku: string; unit: string }>>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);

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
    loadCustomers();
    loadVendors();
    loadProducts();
  }, []);

  const loadCustomers = async (search?: string) => {
    try {
      setCustomersLoading(true);
      const data = await quoteService.getAvailableCustomers(search);
      setCustomers(data);
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setCustomersLoading(false);
    }
  };

  const loadVendors = async (search?: string) => {
    try {
      setVendorsLoading(true);
      const data = await quoteService.getAvailableVendors(search);
      setVendors(data);
    } catch (error) {
      console.error('Failed to load vendors:', error);
    } finally {
      setVendorsLoading(false);
    }
  };

  const loadProducts = async (search?: string) => {
    try {
      setProductsLoading(true);
      const data = await quoteService.getAvailableProducts(search);
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleSubmit = async (data: QuoteFormData) => {
    try {
      const submitData = {
        ...data,
        valid_until: data.valid_until.toISOString(),
        items: data.items.map(item => ({
          ...item,
          total_price: item.quantity * item.unit_price,
        })),
      };

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
    return quantity * unitPrice;
  };

  const watchedItems = form.watch('items');
  const totalAmount = watchedItems.reduce((sum, item) => sum + calculateItemTotal(item.quantity, item.unit_price), 0);

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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((customer) => (
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
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
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
              <CardTitle>Quote Items</CardTitle>
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
                        <Select onValueChange={(value) => handleProductSelect(index, value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
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
                              <FormLabel>Unit Price</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="pl-9"
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
                        <div className="h-10 px-3 py-2 bg-muted rounded-md flex items-center">
                          <span className="text-sm font-medium">
                            ${calculateItemTotal(watchedItems[index]?.quantity || 0, watchedItems[index]?.unit_price || 0).toFixed(2)}
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
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    Total: ${totalAmount.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Excluding taxes and fees
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