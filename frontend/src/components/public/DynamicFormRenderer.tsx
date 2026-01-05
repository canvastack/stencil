import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, ShoppingCart, MessageCircle } from 'lucide-react';
import { DynamicFormField } from '@/components/form-builder/DynamicFormField';
import { usePublicFormConfiguration } from '@/hooks/useFormConfiguration';
import type { FormField } from '@/types/form-builder';
import { cn } from '@/lib/utils';

interface DynamicFormRendererProps {
  productUuid: string;
  onSubmitSuccess?: (result: {
    submission_uuid: string;
    product_uuid: string;
    customer_uuid?: string;
    submitted_at: string;
  }) => void;
  onWhatsApp?: (formData: Record<string, any>) => void;
  className?: string;
  showCard?: boolean;
}

export function DynamicFormRenderer({
  productUuid,
  onSubmitSuccess,
  onWhatsApp,
  className,
  showCard = true,
}: DynamicFormRendererProps) {
  const { formConfig, isLoading, error, submitForm } = usePublicFormConfiguration(productUuid);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStartTime] = useState<string>(new Date().toISOString());

  console.log('[DynamicFormRenderer] Product UUID:', productUuid);
  console.log('[DynamicFormRenderer] State:', { isLoading, error, hasConfig: !!formConfig });
  console.log('[DynamicFormRenderer] Form Config:', formConfig);
  console.log('[DynamicFormRenderer] Form Schema Title:', formConfig?.form_schema?.title);
  console.log('[DynamicFormRenderer] Form Schema Fields Count:', formConfig?.form_schema?.fields?.length);

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    if (validationErrors[fieldName]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const validateField = (field: FormField, value: any): string | null => {
    if (field.required && !value) {
      return field.validation?.errorMessage || `${field.label} wajib diisi`;
    }

    if (field.type === 'text' || field.type === 'textarea') {
      if (field.validation?.minLength && value && value.length < field.validation.minLength) {
        return field.validation.errorMessage || `Minimal ${field.validation.minLength} karakter`;
      }
      if (field.validation?.maxLength && value && value.length > field.validation.maxLength) {
        return field.validation.errorMessage || `Maksimal ${field.validation.maxLength} karakter`;
      }
    }

    if (field.type === 'number') {
      if (field.validation?.min !== undefined && value < field.validation.min) {
        return field.validation.errorMessage || `Nilai minimal ${field.validation.min}`;
      }
      if (field.validation?.max !== undefined && value > field.validation.max) {
        return field.validation.errorMessage || `Nilai maksimal ${field.validation.max}`;
      }
    }

    if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return field.validation?.errorMessage || 'Format email tidak valid';
    }

    if (field.validation?.pattern && value) {
      const regex = new RegExp(field.validation.pattern);
      if (!regex.test(value)) {
        return field.validation.errorMessage || `Format ${field.label} tidak valid`;
      }
    }

    if (field.repeatable || field.type === 'repeater') {
      const items = Array.isArray(value) ? value : [];
      if (field.minItems && items.length < field.minItems) {
        return field.validation?.errorMessage || `Minimal ${field.minItems} item diperlukan`;
      }
      if (field.maxItems && items.length > field.maxItems) {
        return field.validation?.errorMessage || `Maksimal ${field.maxItems} item diperbolehkan`;
      }
    }

    return null;
  };

  const validateForm = (): boolean => {
    if (!formConfig?.form_schema?.fields) return false;

    const newErrors: Record<string, string> = {};

    formConfig.form_schema.fields.forEach((field) => {
      const shouldShow = checkConditionalLogic(field);
      if (!shouldShow) return;

      const value = formData[field.name];
      const error = validateField(field, value);
      if (error) {
        newErrors[field.name] = error;
      }
    });

    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkConditionalLogic = (field: FormField): boolean => {
    if (!field.conditionalLogic) return true;

    const { field: dependentField, operator, value: expectedValue } = field.conditionalLogic;
    const actualValue = formData[dependentField];

    switch (operator) {
      case 'equals':
        return actualValue === expectedValue;
      case 'not_equals':
        return actualValue !== expectedValue;
      case 'contains':
        return String(actualValue || '').includes(String(expectedValue));
      case 'greater_than':
        return Number(actualValue || 0) > Number(expectedValue);
      case 'less_than':
        return Number(actualValue || 0) < Number(expectedValue);
      default:
        return true;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const submissionData = {
        ...formData,
        _form_started_at: formStartTime,
      };

      const result = await submitForm(submissionData);

      if (onSubmitSuccess) {
        onSubmitSuccess(result);
      }

      setFormData({});
      setValidationErrors({});
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppClick = () => {
    if (!validateForm()) {
      return;
    }

    if (onWhatsApp) {
      onWhatsApp(formData);
    }
  };

  const sortedFields = useMemo(() => {
    if (!formConfig?.form_schema?.fields) return [];
    return [...formConfig.form_schema.fields].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [formConfig?.form_schema?.fields]);

  const visibleFields = useMemo(() => {
    return sortedFields.filter((field) => checkConditionalLogic(field));
  }, [sortedFields, formData]);

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Memuat form pesanan...</p>
        </div>
      </div>
    );
  }

  if (error || !formConfig) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error || 'Form konfigurasi tidak tersedia untuk produk ini'}
        </AlertDescription>
      </Alert>
    );
  }

  const { form_schema } = formConfig;
  const submitButton = form_schema.submitButton || {
    text: 'Pesan Sekarang',
    position: 'center',
    style: 'primary',
  };

  const hasErrors = Object.keys(validationErrors).length > 0;

  const renderForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      {visibleFields.map((field) => (
        <DynamicFormField
          key={field.id}
          field={field}
          value={formData[field.name]}
          onChange={(value) => handleFieldChange(field.name, value)}
          error={validationErrors[field.name]}
        />
      ))}

      {hasErrors && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Mohon perbaiki kesalahan pada form sebelum mengirim pesanan.
          </AlertDescription>
        </Alert>
      )}

      <div
        className={cn('flex flex-col sm:flex-row gap-3 pt-6 border-t', {
          'justify-start': submitButton.position === 'left',
          'justify-center': submitButton.position === 'center',
          'justify-end': submitButton.position === 'right',
        })}
      >
        <Button
          type="submit"
          size="lg"
          variant={submitButton.style as 'default' | 'secondary' | 'outline'}
          disabled={isSubmitting}
          className={cn('flex-1 sm:flex-initial', submitButton.className)}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Mengirim Pesanan...
            </>
          ) : (
            <>
              <ShoppingCart className="h-5 w-5 mr-2" />
              {submitButton.text}
            </>
          )}
        </Button>

        {onWhatsApp && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleWhatsAppClick}
            className="flex-1 sm:flex-initial"
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            Hubungi via WhatsApp
          </Button>
        )}
      </div>
    </form>
  );

  if (showCard) {
    return (
      <Card className={className}>
        {(form_schema.title || form_schema.description) && (
          <CardHeader>
            {form_schema.title && <CardTitle>{form_schema.title}</CardTitle>}
            {form_schema.description && (
              <CardDescription>{form_schema.description}</CardDescription>
            )}
          </CardHeader>
        )}
        <CardContent>{renderForm()}</CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {(form_schema.title || form_schema.description) && (
        <div className="mb-6">
          {form_schema.title && (
            <h2 className="text-2xl font-bold text-foreground mb-2">{form_schema.title}</h2>
          )}
          {form_schema.description && (
            <p className="text-muted-foreground">{form_schema.description}</p>
          )}
        </div>
      )}
      {renderForm()}
    </div>
  );
}
