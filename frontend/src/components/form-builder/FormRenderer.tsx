import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DynamicFormField } from './DynamicFormField';
import type { FormSchema } from '@/types/form-builder';
import { cn } from '@/lib/utils';

interface FormRendererProps {
  schema: FormSchema;
  onSubmit: (data: Record<string, any>) => void | Promise<void>;
  initialData?: Record<string, any>;
  className?: string;
  showCard?: boolean;
}

export function FormRenderer({
  schema,
  onSubmit,
  initialData = {},
  className,
  showCard = true,
}: FormRendererProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    schema.fields.forEach((field) => {
      const value = formData[field.name];

      if (field.required && !value) {
        newErrors[field.name] = field.validation?.errorMessage || `${field.label} is required`;
      }

      if (field.type === 'text' || field.type === 'textarea') {
        if (field.validation?.minLength && value && value.length < field.validation.minLength) {
          newErrors[field.name] =
            field.validation.errorMessage ||
            `Minimum length is ${field.validation.minLength} characters`;
        }
        if (field.validation?.maxLength && value && value.length > field.validation.maxLength) {
          newErrors[field.name] =
            field.validation.errorMessage ||
            `Maximum length is ${field.validation.maxLength} characters`;
        }
      }

      if (field.type === 'number') {
        if (field.validation?.min !== undefined && value < field.validation.min) {
          newErrors[field.name] =
            field.validation.errorMessage || `Minimum value is ${field.validation.min}`;
        }
        if (field.validation?.max !== undefined && value > field.validation.max) {
          newErrors[field.name] =
            field.validation.errorMessage || `Maximum value is ${field.validation.max}`;
        }
      }

      if (field.validation?.pattern && value) {
        const regex = new RegExp(field.validation.pattern);
        if (!regex.test(value)) {
          newErrors[field.name] =
            field.validation.errorMessage || `${field.label} format is invalid`;
        }
      }

      if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        newErrors[field.name] = field.validation?.errorMessage || 'Invalid email address';
      }

      if (field.repeatable || field.type === 'repeater') {
        const items = Array.isArray(value) ? value : [];
        if (field.minItems && items.length < field.minItems) {
          newErrors[field.name] =
            field.validation?.errorMessage ||
            `Minimum ${field.minItems} item${field.minItems > 1 ? 's' : ''} required`;
        }
        if (field.maxItems && items.length > field.maxItems) {
          newErrors[field.name] =
            field.validation?.errorMessage ||
            `Maximum ${field.maxItems} item${field.maxItems > 1 ? 's' : ''} allowed`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sortedFields = [...schema.fields].sort((a, b) => (a.order || 0) - (b.order || 0));

  const submitButton = schema.submitButton || {
    text: 'Submit',
    position: 'center',
    style: 'primary',
  };

  const renderForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      {sortedFields.map((field) => (
        <DynamicFormField
          key={field.id}
          field={field}
          value={formData[field.name]}
          onChange={(value) => handleFieldChange(field.name, value)}
          error={errors[field.name]}
        />
      ))}

      <div
        className={cn('flex', {
          'justify-start': submitButton.position === 'left',
          'justify-center': submitButton.position === 'center',
          'justify-end': submitButton.position === 'right',
        })}
      >
        <Button
          type="submit"
          variant={submitButton.style as 'primary' | 'secondary' | 'outline'}
          disabled={isSubmitting}
          className={submitButton.className}
        >
          {isSubmitting ? 'Submitting...' : submitButton.text}
        </Button>
      </div>
    </form>
  );

  if (showCard) {
    return (
      <Card className={className}>
        {(schema.title || schema.description) && (
          <CardHeader>
            {schema.title && <CardTitle>{schema.title}</CardTitle>}
            {schema.description && <CardDescription>{schema.description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent>{renderForm()}</CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {(schema.title || schema.description) && (
        <div className="mb-6">
          {schema.title && <h2 className="text-2xl font-bold mb-2">{schema.title}</h2>}
          {schema.description && (
            <p className="text-muted-foreground">{schema.description}</p>
          )}
        </div>
      )}
      {renderForm()}
    </div>
  );
}
