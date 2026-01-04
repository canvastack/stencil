export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'tel'
  | 'url'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'radio'
  | 'checkbox'
  | 'color'
  | 'file'
  | 'wysiwyg'
  | 'repeater';

export interface FieldOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  errorMessage?: string;
  maxSize?: number;
  allowedFileTypes?: string[];
}

export interface ConditionalLogic {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: string | number | boolean;
}

export interface FormField {
  id: string;
  type: FieldType;
  name: string;
  label: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  order: number;
  options?: FieldOption[];
  validation?: FieldValidation;
  conditionalLogic?: ConditionalLogic;
  defaultValue?: string | number | boolean | string[];
  className?: string;
  repeaterFields?: FormField[];
}

export interface SubmitButtonConfig {
  text: string;
  position: 'left' | 'center' | 'right';
  style: 'primary' | 'secondary' | 'outline';
  className?: string;
}

export interface FormSchema {
  version: string;
  title: string;
  description?: string;
  fields: FormField[];
  submitButton?: SubmitButtonConfig;
}

export interface FormConfiguration {
  uuid: string;
  productUuid: string;
  productName?: string;
  name: string;
  description?: string;
  formSchema: FormSchema;
  validationRules?: Record<string, any>;
  conditionalLogic?: Record<string, any>;
  isActive: boolean;
  isDefault: boolean;
  isTemplate: boolean;
  version: number;
  template?: {
    uuid: string;
    name: string;
    category: string;
  };
  analytics?: {
    submissionCount: number;
    avgCompletionTime: number;
  };
  audit?: {
    createdBy?: string;
    updatedBy?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

export interface FormTemplate {
  uuid: string;
  tenantId?: string;
  name: string;
  description?: string;
  category: string;
  formSchema?: FormSchema;
  validationRules?: Record<string, any>;
  conditionalLogic?: Record<string, any>;
  isPublic: boolean;
  isSystem: boolean;
  previewImageUrl?: string;
  tags?: string[];
  usageCount?: number;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FormSubmission {
  uuid: string;
  productUuid: string;
  formConfigurationUuid: string;
  customerUuid?: string;
  submissionData: Record<string, any>;
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
  completionTime?: number;
  isCompleted: boolean;
  startedAt?: string;
  submittedAt?: string;
}

export interface FieldTypeDefinition {
  type: FieldType;
  label: string;
  icon: string;
  description: string;
  category: 'basic' | 'selection' | 'advanced';
  defaultConfig: Partial<FormField>;
}

export const FIELD_TYPES: FieldTypeDefinition[] = [
  {
    type: 'text',
    label: 'Text Input',
    icon: 'Type',
    description: 'Single line text input',
    category: 'basic',
    defaultConfig: {
      type: 'text',
      placeholder: 'Enter text',
      validation: { maxLength: 255 },
    },
  },
  {
    type: 'textarea',
    label: 'Text Area',
    icon: 'AlignLeft',
    description: 'Multi-line text input',
    category: 'basic',
    defaultConfig: {
      type: 'textarea',
      placeholder: 'Enter description',
      validation: { maxLength: 1000 },
    },
  },
  {
    type: 'number',
    label: 'Number',
    icon: 'Hash',
    description: 'Numeric input',
    category: 'basic',
    defaultConfig: {
      type: 'number',
      placeholder: '0',
      validation: { min: 0 },
    },
  },
  {
    type: 'email',
    label: 'Email',
    icon: 'Mail',
    description: 'Email address input',
    category: 'basic',
    defaultConfig: {
      type: 'email',
      placeholder: 'email@example.com',
    },
  },
  {
    type: 'tel',
    label: 'Phone',
    icon: 'Phone',
    description: 'Telephone number input',
    category: 'basic',
    defaultConfig: {
      type: 'tel',
      placeholder: '+62 xxx-xxxx-xxxx',
    },
  },
  {
    type: 'url',
    label: 'URL',
    icon: 'Link',
    description: 'Website URL input',
    category: 'basic',
    defaultConfig: {
      type: 'url',
      placeholder: 'https://example.com',
    },
  },
  {
    type: 'date',
    label: 'Date',
    icon: 'Calendar',
    description: 'Date picker',
    category: 'basic',
    defaultConfig: {
      type: 'date',
    },
  },
  {
    type: 'select',
    label: 'Select Dropdown',
    icon: 'ChevronDown',
    description: 'Single selection dropdown',
    category: 'selection',
    defaultConfig: {
      type: 'select',
      options: [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
      ],
    },
  },
  {
    type: 'multiselect',
    label: 'Multi Select',
    icon: 'ListChecks',
    description: 'Multiple selection dropdown',
    category: 'selection',
    defaultConfig: {
      type: 'multiselect',
      options: [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
      ],
    },
  },
  {
    type: 'radio',
    label: 'Radio Buttons',
    icon: 'Circle',
    description: 'Single choice radio buttons',
    category: 'selection',
    defaultConfig: {
      type: 'radio',
      options: [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
      ],
    },
  },
  {
    type: 'checkbox',
    label: 'Checkboxes',
    icon: 'CheckSquare',
    description: 'Multiple choice checkboxes',
    category: 'selection',
    defaultConfig: {
      type: 'checkbox',
      options: [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
      ],
    },
  },
  {
    type: 'color',
    label: 'Color Picker',
    icon: 'Palette',
    description: 'Color selection input',
    category: 'advanced',
    defaultConfig: {
      type: 'color',
      defaultValue: '#000000',
    },
  },
  {
    type: 'file',
    label: 'File Upload',
    icon: 'Upload',
    description: 'File upload input',
    category: 'advanced',
    defaultConfig: {
      type: 'file',
      validation: {
        maxSize: 10485760,
        allowedFileTypes: ['image/*', '.pdf', '.doc', '.docx'],
      },
    },
  },
  {
    type: 'wysiwyg',
    label: 'Rich Text Editor',
    icon: 'FileText',
    description: 'WYSIWYG text editor',
    category: 'advanced',
    defaultConfig: {
      type: 'wysiwyg',
      validation: { maxLength: 5000 },
    },
  },
  {
    type: 'repeater',
    label: 'Repeater',
    icon: 'Copy',
    description: 'Repeatable field group',
    category: 'advanced',
    defaultConfig: {
      type: 'repeater',
      repeaterFields: [],
    },
  },
];
