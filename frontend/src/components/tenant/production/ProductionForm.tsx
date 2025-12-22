import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DatePicker } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar,
  Clock,
  Package,
  Users,
  Settings,
  AlertCircle,
  Plus,
  X
} from 'lucide-react';
import { ProductionItem, CreateProductionItemRequest, UpdateProductionItemRequest } from '@/services/tenant/productionService';
import { useProductionStore } from '@/stores/productionStore';
import { toast } from 'sonner';

const productionFormSchema = z.object({
  order_id: z.string().min(1, 'Order is required'),
  product_id: z.string().min(1, 'Product is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unit_of_measure: z.string().min(1, 'Unit of measure is required'),
  scheduled_start_date: z.date().optional(),
  scheduled_completion_date: z.date().optional(),
  estimated_duration_hours: z.number().min(0, 'Duration must be non-negative'),
  production_line: z.string().optional(),
  workstation: z.string().optional(),
  shift: z.enum(['morning', 'afternoon', 'night', 'overtime']).optional(),
  supervisor_id: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  notes: z.string().optional(),
  quality_requirements: z.array(z.string()).optional(),
  specifications: z.record(z.any()).optional(),
  material_requirements: z.array(z.object({
    material_type: z.string(),
    quantity: z.number(),
    unit: z.string(),
    supplier: z.string().optional(),
  })).optional(),
});

type ProductionFormData = z.infer<typeof productionFormSchema>;

interface ProductionFormProps {
  item?: ProductionItem | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProductionForm({ item, onSuccess, onCancel }: ProductionFormProps) {
  const { createProductionItem, updateProductionItem, loading } = useProductionStore();
  const [qualityRequirements, setQualityRequirements] = useState<string[]>(
    item?.quality_requirements || []
  );
  const [materialRequirements, setMaterialRequirements] = useState<any[]>(
    item?.material_requirements || []
  );
  const [newQualityRequirement, setNewQualityRequirement] = useState('');
  const [newMaterialRequirement, setNewMaterialRequirement] = useState({
    material_type: '',
    quantity: 0,
    unit: '',
    supplier: ''
  });

  const form = useForm<ProductionFormData>({
    resolver: zodResolver(productionFormSchema),
    defaultValues: {
      order_id: item?.order_id || '',
      product_id: item?.product_id || '',
      quantity: item?.quantity || 1,
      unit_of_measure: item?.unit_of_measure || 'pcs',
      scheduled_start_date: item?.scheduled_start_date ? new Date(item.scheduled_start_date) : undefined,
      scheduled_completion_date: item?.scheduled_completion_date ? new Date(item.scheduled_completion_date) : undefined,
      estimated_duration_hours: item?.estimated_duration_hours || 8,
      production_line: item?.production_line || '',
      workstation: item?.workstation || '',
      shift: item?.shift as any || 'morning',
      supervisor_id: item?.supervisor_id || '',
      priority: (item?.priority as any) || 'normal',
      notes: item?.notes || '',
    }
  });

  const addQualityRequirement = () => {
    if (newQualityRequirement.trim()) {
      setQualityRequirements([...qualityRequirements, newQualityRequirement.trim()]);
      setNewQualityRequirement('');
    }
  };

  const removeQualityRequirement = (index: number) => {
    setQualityRequirements(qualityRequirements.filter((_, i) => i !== index));
  };

  const addMaterialRequirement = () => {
    if (newMaterialRequirement.material_type && newMaterialRequirement.quantity > 0) {
      setMaterialRequirements([...materialRequirements, { ...newMaterialRequirement }]);
      setNewMaterialRequirement({
        material_type: '',
        quantity: 0,
        unit: '',
        supplier: ''
      });
    }
  };

  const removeMaterialRequirement = (index: number) => {
    setMaterialRequirements(materialRequirements.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ProductionFormData) => {
    try {
      const formData = {
        ...data,
        scheduled_start_date: data.scheduled_start_date?.toISOString(),
        scheduled_completion_date: data.scheduled_completion_date?.toISOString(),
        quality_requirements: qualityRequirements,
        material_requirements: materialRequirements,
      };

      if (item) {
        await updateProductionItem(item.id, formData as UpdateProductionItemRequest);
        toast.success('Production item updated successfully');
      } else {
        await createProductionItem(formData as CreateProductionItemRequest);
        toast.success('Production item created successfully');
      }
      
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${item ? 'update' : 'create'} production item`);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Configure the basic production item details
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="order_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order ID</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Select order..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="product_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product ID</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Select product..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      min="1" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unit_of_measure"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit of Measure</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pcs">Pieces</SelectItem>
                      <SelectItem value="kg">Kilograms</SelectItem>
                      <SelectItem value="m">Meters</SelectItem>
                      <SelectItem value="m2">Square Meters</SelectItem>
                      <SelectItem value="l">Liters</SelectItem>
                      <SelectItem value="boxes">Boxes</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estimated_duration_hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Duration (Hours)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      min="0" 
                      step="0.5"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Schedule Information
            </CardTitle>
            <CardDescription>
              Set the production timeline and schedule
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="scheduled_start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scheduled Start Date</FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value}
                      setDate={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scheduled_completion_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scheduled Completion Date</FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value}
                      setDate={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Assignment Information
            </CardTitle>
            <CardDescription>
              Assign production resources and personnel
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="production_line"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Production Line</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Line A, Line B" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="workstation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workstation</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. WS-001, Assembly-1" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shift"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shift</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="morning">Morning (06:00-14:00)</SelectItem>
                      <SelectItem value="afternoon">Afternoon (14:00-22:00)</SelectItem>
                      <SelectItem value="night">Night (22:00-06:00)</SelectItem>
                      <SelectItem value="overtime">Overtime</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="supervisor_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supervisor</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Select supervisor..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Quality & Material Requirements
            </CardTitle>
            <CardDescription>
              Define quality standards and material needs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Quality Requirements */}
            <div className="space-y-3">
              <Label>Quality Requirements</Label>
              <div className="flex gap-2">
                <Input
                  value={newQualityRequirement}
                  onChange={(e) => setNewQualityRequirement(e.target.value)}
                  placeholder="Add quality requirement..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addQualityRequirement())}
                />
                <Button type="button" onClick={addQualityRequirement} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {qualityRequirements.map((requirement, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {requirement}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-muted-foreground hover:text-foreground"
                      onClick={() => removeQualityRequirement(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            {/* Material Requirements */}
            <div className="space-y-3">
              <Label>Material Requirements</Label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
                <Input
                  value={newMaterialRequirement.material_type}
                  onChange={(e) => setNewMaterialRequirement(prev => ({ 
                    ...prev, 
                    material_type: e.target.value 
                  }))}
                  placeholder="Material type..."
                />
                <Input
                  type="number"
                  value={newMaterialRequirement.quantity}
                  onChange={(e) => setNewMaterialRequirement(prev => ({ 
                    ...prev, 
                    quantity: Number(e.target.value) 
                  }))}
                  placeholder="Quantity"
                  min="0"
                />
                <Input
                  value={newMaterialRequirement.unit}
                  onChange={(e) => setNewMaterialRequirement(prev => ({ 
                    ...prev, 
                    unit: e.target.value 
                  }))}
                  placeholder="Unit"
                />
                <div className="flex gap-2">
                  <Input
                    value={newMaterialRequirement.supplier}
                    onChange={(e) => setNewMaterialRequirement(prev => ({ 
                      ...prev, 
                      supplier: e.target.value 
                    }))}
                    placeholder="Supplier (optional)"
                  />
                  <Button type="button" onClick={addMaterialRequirement} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {materialRequirements.length > 0 && (
                <div className="border rounded-lg p-3 space-y-2">
                  {materialRequirements.map((material, index) => (
                    <div key={index} className="flex items-center justify-between bg-muted rounded p-2">
                      <span className="text-sm">
                        {material.quantity} {material.unit} of {material.material_type}
                        {material.supplier && ` from ${material.supplier}`}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => removeMaterialRequirement(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>
              Add any additional notes or special instructions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Additional notes and instructions..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : (item ? 'Update Production Item' : 'Create Production Item')}
          </Button>
        </div>
      </form>
    </Form>
  );
}