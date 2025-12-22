import { useState, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  FileDown, 
  FileSpreadsheet, 
  FileJson, 
  FileCode, 
  Lock,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { importExportService } from '@/services/api/importExport';
import type { 
  ExportFormat, 
  ExportConfig,
  ExportFieldConfig,
  ExportFieldGroup,
} from '@/types/importExport';
import type { ProductFilters } from '@/types/product';
import { cn } from '@/lib/utils';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentFilters?: ProductFilters;
}

const EXPORT_FORMATS: Array<{
  value: ExportFormat;
  label: string;
  icon: any;
  description: string;
}> = [
  {
    value: 'csv',
    label: 'CSV',
    icon: FileSpreadsheet,
    description: 'Comma-separated values (best for Excel)',
  },
  {
    value: 'excel',
    label: 'Excel',
    icon: FileSpreadsheet,
    description: 'Microsoft Excel format (.xlsx)',
  },
  {
    value: 'json',
    label: 'JSON',
    icon: FileJson,
    description: 'JavaScript Object Notation',
  },
  {
    value: 'xml',
    label: 'XML',
    icon: FileCode,
    description: 'Extensible Markup Language',
  },
];

const EXPORT_FIELD_GROUPS: ExportFieldGroup[] = [
  {
    group: 'basic',
    label: 'Basic Information',
    fields: [
      { field: 'id', label: 'ID', enabled: true, group: 'basic' },
      { field: 'uuid', label: 'UUID', enabled: true, group: 'basic' },
      { field: 'name', label: 'Name', enabled: true, group: 'basic' },
      { field: 'slug', label: 'Slug', enabled: true, group: 'basic' },
      { field: 'description', label: 'Description', enabled: true, group: 'basic' },
      { field: 'longDescription', label: 'Long Description', enabled: false, group: 'basic' },
      { field: 'status', label: 'Status', enabled: true, group: 'basic' },
      { field: 'featured', label: 'Featured', enabled: true, group: 'basic' },
    ],
  },
  {
    group: 'pricing',
    label: 'Pricing & Currency',
    fields: [
      { field: 'price', label: 'Price', enabled: true, group: 'pricing' },
      { field: 'currency', label: 'Currency', enabled: true, group: 'pricing' },
      { field: 'priceUnit', label: 'Price Unit', enabled: false, group: 'pricing' },
      { field: 'minOrder', label: 'Minimum Order', enabled: false, group: 'pricing' },
    ],
  },
  {
    group: 'inventory',
    label: 'Inventory & Stock',
    fields: [
      { field: 'inStock', label: 'In Stock', enabled: true, group: 'inventory' },
      { field: 'stockQuantity', label: 'Stock Quantity', enabled: true, group: 'inventory' },
      { field: 'leadTime', label: 'Lead Time', enabled: false, group: 'inventory' },
    ],
  },
  {
    group: 'media',
    label: 'Media & Assets',
    fields: [
      { field: 'images', label: 'Images', enabled: false, group: 'media' },
      { field: 'designFileUrl', label: 'Design File URL', enabled: false, group: 'media' },
    ],
  },
  {
    group: 'seo',
    label: 'SEO & Metadata',
    fields: [
      { field: 'seoTitle', label: 'SEO Title', enabled: false, group: 'seo' },
      { field: 'seoDescription', label: 'SEO Description', enabled: false, group: 'seo' },
      { field: 'seoKeywords', label: 'SEO Keywords', enabled: false, group: 'seo' },
    ],
  },
  {
    group: 'metadata',
    label: 'Additional Data',
    fields: [
      { field: 'category', label: 'Category', enabled: true, group: 'metadata' },
      { field: 'subcategory', label: 'Subcategory', enabled: false, group: 'metadata' },
      { field: 'tags', label: 'Tags', enabled: true, group: 'metadata' },
      { field: 'material', label: 'Material', enabled: false, group: 'metadata' },
      { field: 'features', label: 'Features', enabled: false, group: 'metadata' },
      { field: 'specifications', label: 'Specifications', enabled: false, group: 'metadata' },
      { field: 'createdAt', label: 'Created At', enabled: true, group: 'metadata' },
      { field: 'updatedAt', label: 'Updated At', enabled: true, group: 'metadata' },
    ],
  },
];

export const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  onOpenChange,
  currentFilters,
}) => {
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [selectedFields, setSelectedFields] = useState<Set<string>>(
    new Set(
      EXPORT_FIELD_GROUPS.flatMap((group) =>
        group.fields.filter((f) => f.enabled).map((f) => f.field)
      )
    )
  );
  const [includeRelations, setIncludeRelations] = useState({
    categories: false,
    variants: false,
    images: false,
    specifications: false,
  });
  const [encrypt, setEncrypt] = useState(false);
  const [encryptionPassword, setEncryptionPassword] = useState('');

  const exportMutation = useMutation({
    mutationFn: async (config: ExportConfig) => {
      return await importExportService.createExportJob(config);
    },
    onSuccess: async (job) => {
      toast.success('Export berhasil dimulai', {
        description: `File akan didownload otomatis setelah proses selesai`,
      });

      const checkJobStatus = setInterval(async () => {
        try {
          const updatedJob = await importExportService.getExportJob(job.id);
          
          if (updatedJob.status === 'completed' && updatedJob.fileUrl) {
            clearInterval(checkJobStatus);
            
            const blob = await importExportService.downloadExportFile(job.id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = updatedJob.fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            toast.success('Export selesai', {
              description: `File "${updatedJob.fileName}" berhasil didownload`,
            });
            
            onOpenChange(false);
          } else if (updatedJob.status === 'failed') {
            clearInterval(checkJobStatus);
            toast.error('Export gagal', {
              description: updatedJob.errorMessage || 'Terjadi kesalahan saat export',
            });
          }
        } catch (error) {
          clearInterval(checkJobStatus);
          console.error('Failed to check job status:', error);
        }
      }, 2000);
    },
    onError: (error: any) => {
      toast.error('Export gagal', {
        description: error?.message || 'Terjadi kesalahan saat memulai export',
      });
    },
  });

  const selectedCount = selectedFields.size;
  const totalFields = EXPORT_FIELD_GROUPS.reduce(
    (sum, group) => sum + group.fields.length,
    0
  );

  const handleFieldToggle = (fieldName: string) => {
    const newSelected = new Set(selectedFields);
    if (newSelected.has(fieldName)) {
      newSelected.delete(fieldName);
    } else {
      newSelected.add(fieldName);
    }
    setSelectedFields(newSelected);
  };

  const handleGroupToggle = (group: ExportFieldGroup) => {
    const groupFields = group.fields.map((f) => f.field);
    const allSelected = groupFields.every((f) => selectedFields.has(f));
    
    const newSelected = new Set(selectedFields);
    if (allSelected) {
      groupFields.forEach((f) => newSelected.delete(f));
    } else {
      groupFields.forEach((f) => newSelected.add(f));
    }
    setSelectedFields(newSelected);
  };

  const handleSelectAll = () => {
    const allFields = EXPORT_FIELD_GROUPS.flatMap((group) =>
      group.fields.map((f) => f.field)
    );
    setSelectedFields(new Set(allFields));
  };

  const handleDeselectAll = () => {
    setSelectedFields(new Set());
  };

  const handleExport = () => {
    if (selectedFields.size === 0) {
      toast.error('Pilih minimal satu field untuk di-export');
      return;
    }

    if (encrypt && !encryptionPassword) {
      toast.error('Masukkan password untuk enkripsi');
      return;
    }

    const config: ExportConfig = {
      format,
      fields: Array.from(selectedFields),
      includeRelations,
      filters: currentFilters,
      encrypt,
      encryptionPassword: encrypt ? encryptionPassword : undefined,
    };

    exportMutation.mutate(config);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            Export Products
          </DialogTitle>
          <DialogDescription>
            Pilih format dan fields yang ingin di-export. Export akan mengikuti filter yang sedang aktif.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label>Format Export</Label>
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
              <div className="grid grid-cols-2 gap-3">
                {EXPORT_FORMATS.map((fmt) => {
                  const Icon = fmt.icon;
                  return (
                    <label
                      key={fmt.value}
                      className={cn(
                        'flex items-start gap-3 rounded-lg border-2 p-4 cursor-pointer transition-colors',
                        format === fmt.value
                          ? 'border-primary bg-primary/5'
                          : 'border-muted hover:border-muted-foreground/50'
                      )}
                    >
                      <RadioGroupItem value={fmt.value} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="h-4 w-4" />
                          <span className="font-medium">{fmt.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {fmt.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </RadioGroup>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Fields to Export</Label>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {selectedCount} / {totalFields} fields
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="h-7 text-xs"
                >
                  Select All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeselectAll}
                  className="h-7 text-xs"
                >
                  Deselect All
                </Button>
              </div>
            </div>

            <ScrollArea className="h-64 rounded-md border p-4">
              <div className="space-y-4">
                {EXPORT_FIELD_GROUPS.map((group) => {
                  const groupFields = group.fields.map((f) => f.field);
                  const selectedInGroup = groupFields.filter((f) =>
                    selectedFields.has(f)
                  ).length;
                  const allSelected = selectedInGroup === groupFields.length;
                  const someSelected = selectedInGroup > 0 && !allSelected;

                  return (
                    <div key={group.group} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={() => handleGroupToggle(group)}
                          className={someSelected ? 'data-[state=checked]:bg-primary/50' : ''}
                        />
                        <Label className="font-semibold cursor-pointer" onClick={() => handleGroupToggle(group)}>
                          {group.label}
                        </Label>
                        <Badge variant="outline" className="text-xs">
                          {selectedInGroup}/{groupFields.length}
                        </Badge>
                      </div>
                      <div className="ml-6 grid grid-cols-2 gap-2">
                        {group.fields.map((field) => (
                          <div key={field.field} className="flex items-center gap-2">
                            <Checkbox
                              id={`field-${field.field}`}
                              checked={selectedFields.has(field.field)}
                              onCheckedChange={() => handleFieldToggle(field.field)}
                            />
                            <Label
                              htmlFor={`field-${field.field}`}
                              className="text-sm cursor-pointer"
                            >
                              {field.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Include Related Data</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="include-categories"
                  checked={includeRelations.categories}
                  onCheckedChange={(checked) =>
                    setIncludeRelations({ ...includeRelations, categories: !!checked })
                  }
                />
                <Label htmlFor="include-categories" className="cursor-pointer">
                  Categories
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="include-variants"
                  checked={includeRelations.variants}
                  onCheckedChange={(checked) =>
                    setIncludeRelations({ ...includeRelations, variants: !!checked })
                  }
                />
                <Label htmlFor="include-variants" className="cursor-pointer">
                  Variants
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="include-images"
                  checked={includeRelations.images}
                  onCheckedChange={(checked) =>
                    setIncludeRelations({ ...includeRelations, images: !!checked })
                  }
                />
                <Label htmlFor="include-images" className="cursor-pointer">
                  Images
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="include-specifications"
                  checked={includeRelations.specifications}
                  onCheckedChange={(checked) =>
                    setIncludeRelations({ ...includeRelations, specifications: !!checked })
                  }
                />
                <Label htmlFor="include-specifications" className="cursor-pointer">
                  Specifications
                </Label>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="encrypt-export"
                checked={encrypt}
                onCheckedChange={(checked) => setEncrypt(!!checked)}
              />
              <Label htmlFor="encrypt-export" className="flex items-center gap-2 cursor-pointer">
                <Lock className="h-4 w-4" />
                Encrypt export file
              </Label>
            </div>
            {encrypt && (
              <Input
                type="password"
                placeholder="Enter encryption password"
                value={encryptionPassword}
                onChange={(e) => setEncryptionPassword(e.target.value)}
                className="max-w-md"
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={exportMutation.isPending || selectedFields.size === 0}
          >
            {exportMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
