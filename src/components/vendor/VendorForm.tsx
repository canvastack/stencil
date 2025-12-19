import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RotateCcw, Package, Mail, DollarSign, MapPin, Star } from 'lucide-react';
import {
  InputFormField,
  SelectFormField,
} from '@/components/vendor/VendorFormField';
import {
  createVendorSchema,
  updateVendorSchema,
  CreateVendorFormData,
  UpdateVendorFormData,
} from '@/schemas/vendor.schema';
import { Vendor } from '@/types/vendor';
import { toast } from '@/lib/toast-config';
import MapPicker, { LocationData } from '@/components/admin/MapPicker';

interface VendorFormProps {
  mode: 'create' | 'edit';
  defaultValues?: Partial<Vendor>;
  onSubmit: (data: CreateVendorFormData | UpdateVendorFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  enableDraftSave?: boolean;
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'blacklisted', label: 'Blacklisted' },
];

const COMPANY_SIZE_OPTIONS = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'enterprise', label: 'Enterprise' },
];

const DRAFT_STORAGE_KEY = 'vendor-form-draft';

export function VendorForm({
  mode,
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  enableDraftSave = true,
}: VendorFormProps) {
  const getInitialValues = () => {
    if (mode === 'edit' && defaultValues) {
      return {
        name: defaultValues.name || '',
        code: defaultValues.code || '',
        company: defaultValues.company || '',
        category: defaultValues.category || '',
        industry: defaultValues.industry || '',
        contact_person: defaultValues.contact_person || '',
        email: defaultValues.email || '',
        phone: defaultValues.phone || '',
        address: defaultValues.location?.address || defaultValues.address || '',
        city: defaultValues.location?.city || defaultValues.city || '',
        province: defaultValues.location?.province || defaultValues.province || '',
        status: defaultValues.status || 'active',
        company_size: defaultValues.company_size || 'small',
        payment_terms: defaultValues.payment_terms || '',
        tax_id: defaultValues.tax_id || '',
        bank_account: defaultValues.bank_account || '',
        bank_name: defaultValues.bank_name || '',
        rating: defaultValues.rating || 0,
        total_orders: defaultValues.total_orders || 0,
        total_value: defaultValues.total_value || 0,
        latitude: defaultValues.location?.latitude || defaultValues.latitude,
        longitude: defaultValues.location?.longitude || defaultValues.longitude,
      };
    }

    if (mode === 'create' && enableDraftSave) {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        try {
          return JSON.parse(savedDraft);
        } catch {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        }
      }
    }

    return {
      name: '',
      code: '',
      company: '',
      category: '',
      industry: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      province: '',
      status: 'active',
      company_size: 'small',
      payment_terms: '',
      tax_id: '',
      bank_account: '',
      bank_name: '',
      rating: 0,
      total_orders: 0,
      total_value: 0,
    };
  };

  const form = useForm<CreateVendorFormData | UpdateVendorFormData>({
    resolver: zodResolver(mode === 'create' ? createVendorSchema : updateVendorSchema),
    defaultValues: getInitialValues(),
    mode: 'onChange',
  });

  useEffect(() => {
    if (mode === 'create' && enableDraftSave) {
      const subscription = form.watch((value) => {
        const hasAnyValue = Object.values(value).some(
          (v) => v !== '' && v !== undefined && v !== null && v !== 0
        );
        
        if (hasAnyValue) {
          localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(value));
        }
      });

      return () => subscription.unsubscribe();
    }
  }, [form, mode, enableDraftSave]);

  const handleFormSubmit = async (data: CreateVendorFormData | UpdateVendorFormData) => {
    try {
      await onSubmit(data);
      // Draft clearing handled by VendorFormDialog after dialog closes
      // form.reset() removed to prevent re-triggering watch() auto-save
    } catch (error: any) {
      if (error.response?.data?.errors) {
        const serverErrors = error.response.data.errors;
        const errorCount = Object.keys(serverErrors).length;
        
        Object.keys(serverErrors).forEach((key) => {
          form.setError(key as any, {
            type: 'server',
            message: Array.isArray(serverErrors[key]) 
              ? serverErrors[key][0] 
              : serverErrors[key],
          });
        });
        
        toast.error(`Gagal menyimpan vendor: ${errorCount} field memiliki error. Periksa form di bawah.`);
      } else {
        toast.error(error.response?.data?.message || 'Gagal menyimpan vendor. Silakan coba lagi.');
      }
    }
  };

  const handleClearDraft = () => {
    if (mode === 'create' && enableDraftSave) {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      form.reset(getInitialValues());
      toast.info('Draft berhasil dihapus');
    }
  };

  const handleLocationSelect = (locationData: LocationData) => {
    form.setValue('latitude', locationData.latitude);
    form.setValue('longitude', locationData.longitude);
    form.setValue('address', locationData.address);
    form.setValue('city', locationData.city || '');
    form.setValue('province', locationData.province || '');
    form.setValue('location', locationData);
  };

  const handleInvalidSubmit = (errors: any) => {
    const errorCount = Object.keys(errors).length;
    const firstError = Object.values(errors)[0] as any;
    const firstErrorMessage = firstError?.message || 'Form tidak valid';
    
    toast.error(`Gagal menyimpan: ${errorCount} field memiliki error. ${firstErrorMessage}`);
  };

  return (
    <FormProvider {...form}>
      <form 
        onSubmit={form.handleSubmit(handleFormSubmit, handleInvalidSubmit)} 
        className="space-y-4"
      >
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputFormField
                control={form.control}
                name="name"
                label="Vendor Name *"
                placeholder="Enter vendor name"
                required
              />
              <InputFormField
                control={form.control}
                name="code"
                label="Vendor Code *"
                placeholder="e.g., VEND001"
                required
              />
              <InputFormField
                control={form.control}
                name="company"
                label="Company Name"
                placeholder="Company name"
              />
              <InputFormField
                control={form.control}
                name="industry"
                label="Industry"
                placeholder="e.g., Manufacturing, Services"
              />
              <InputFormField
                control={form.control}
                name="category"
                label="Category *"
                placeholder="e.g., Raw Material, Packaging, Services"
                required
                description="Kategori vendor (contoh: Bahan Baku, Packaging, Jasa, dll)"
              />
              <SelectFormField
                control={form.control}
                name="status"
                label="Status"
                placeholder="Select status"
                options={STATUS_OPTIONS}
                required
              />
              <SelectFormField
                control={form.control}
                name="company_size"
                label="Company Size"
                placeholder="Select size"
                options={COMPANY_SIZE_OPTIONS}
              />
            </div>
          </Card>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputFormField
                control={form.control}
                name="contact_person"
                label="Contact Person *"
                placeholder="Contact person name"
                required
              />
              <InputFormField
                control={form.control}
                name="email"
                type="email"
                label="Email *"
                placeholder="vendor@example.com"
                required
              />
              <InputFormField
                control={form.control}
                name="phone"
                type="tel"
                label="Phone *"
                placeholder="+62 812 3456 7890"
                required
              />
              <InputFormField
                control={form.control}
                name="city"
                label="City"
                placeholder="City name"
              />
              <InputFormField
                control={form.control}
                name="province"
                label="Province"
                placeholder="Province name"
              />
              <div className="md:col-span-2">
                <InputFormField
                  control={form.control}
                  name="address"
                  label="Address"
                  placeholder="Complete address"
                />
              </div>
            </div>
          </Card>
          </TabsContent>

          {/* Business Tab */}
          <TabsContent value="business" className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Business Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputFormField
                control={form.control}
                name="payment_terms"
                label="Payment Terms *"
                placeholder="e.g., NET 30, NET 60"
                required
              />
              <InputFormField
                control={form.control}
                name="tax_id"
                label="Tax ID / NPWP *"
                placeholder="Tax ID / NPWP"
                required
              />
              <InputFormField
                control={form.control}
                name="bank_account"
                label="Bank Account"
                placeholder="Bank account number"
              />
              <InputFormField
                control={form.control}
                name="bank_name"
                label="Bank Name"
                placeholder="e.g., BCA, Mandiri, BNI"
              />
            </div>
          </Card>

          {mode === 'edit' && (
            <Card className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5" />
                Performance Metrics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputFormField
                  control={form.control}
                  name="rating"
                  type="number"
                  label="Rating (0-5)"
                  placeholder="0.0"
                  description="Enter value between 0 and 5"
                />
                <InputFormField
                  control={form.control}
                  name="total_orders"
                  type="number"
                  label="Total Orders"
                  placeholder="0"
                />
                <InputFormField
                  control={form.control as any}
                  name="total_value"
                  type="number"
                  label="Total Value (IDR)"
                  placeholder="0"
                />
              </div>
            </Card>
          )}
          </TabsContent>

          {/* Location Tab */}
          <TabsContent value="location" className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Location Management
            </h3>
            
            <MapPicker
              initialLocation={{
                lat: defaultValues?.location?.latitude || defaultValues?.latitude || -6.2088,
                lng: defaultValues?.location?.longitude || defaultValues?.longitude || 106.8456,
              }}
              value={defaultValues?.location ? {
                latitude: defaultValues.location.latitude,
                longitude: defaultValues.location.longitude,
                city: defaultValues.location.city || '',
                district: defaultValues.location.district || '',
                subdistrict: defaultValues.location.subdistrict || '',
                village: defaultValues.location.village || '',
                municipality: defaultValues.location.municipality || '',
                province: defaultValues.location.province || '',
                country: defaultValues.location.country || '',
                address: defaultValues.location.address || '',
              } : undefined}
              onLocationSelect={handleLocationSelect}
            />
          </Card>
          </TabsContent>
        </Tabs>

        {/* Form Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          {mode === 'create' && enableDraftSave && localStorage.getItem(DRAFT_STORAGE_KEY) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearDraft}
            disabled={isSubmitting}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Clear Draft
          </Button>
        )}
        
        <div className="flex gap-3 ml-auto">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'create' ? 'Add Vendor' : 'Update Vendor'}
          </Button>
        </div>
        </div>
      </form>
    </FormProvider>
  );
}
