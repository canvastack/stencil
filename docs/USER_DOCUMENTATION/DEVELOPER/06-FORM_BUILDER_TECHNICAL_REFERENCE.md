# 🔧 Form Builder - Technical Reference

## Architecture Overview

Form Builder adalah sistem dynamic form yang terdiri dari:
- **Backend**: Laravel (form schema storage, validation, API)
- **Frontend**: React + TypeScript (form builder UI, renderer)
- **Database**: PostgreSQL (form configurations, templates)

---

## Database Schema

### Table: `product_form_configurations`
```sql
CREATE TABLE product_form_configurations (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(uuid),
    product_uuid UUID NOT NULL REFERENCES products(uuid),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    form_schema JSONB NOT NULL,
    validation_rules JSONB,
    conditional_logic JSONB,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    is_template BOOLEAN DEFAULT false,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);
```

### Table: `product_form_templates`
```sql
CREATE TABLE product_form_templates (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(uuid),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    form_schema JSONB NOT NULL,
    validation_rules JSONB,
    conditional_logic JSONB,
    tags TEXT[],
    preview_image_url TEXT,
    is_public BOOLEAN DEFAULT false,
    is_system BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);
```

### Table: `product_form_submissions`
```sql
CREATE TABLE product_form_submissions (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(uuid),
    product_uuid UUID NOT NULL REFERENCES products(uuid),
    form_configuration_uuid UUID NOT NULL,
    customer_uuid UUID REFERENCES customers(uuid),
    submission_data JSONB NOT NULL,
    user_agent TEXT,
    ip_address INET,
    referrer TEXT,
    completion_time INTEGER,
    is_completed BOOLEAN DEFAULT false,
    started_at TIMESTAMP,
    submitted_at TIMESTAMP,
    created_at TIMESTAMP
);
```

---

## Form Schema Structure

### FormSchema Interface
```typescript
interface FormSchema {
  version: string;
  title: string;
  description?: string;
  fields: FormField[];
  submitButton?: SubmitButtonConfig;
}
```

### FormField Interface
```typescript
interface FormField {
  id: string;
  type: FieldType;
  name: string;
  label: string;
  placeholder?: string;
  description?: string;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
  order: number;
  options?: FieldOption[];
  validation?: FieldValidation;
  conditionalLogic?: ConditionalLogic;
  defaultValue?: string | number | boolean | string[];
  className?: string;
  
  // Dynamic field properties
  repeatable?: boolean;
  minItems?: number;
  maxItems?: number;
  addButtonText?: string;
  
  // File-specific
  accept?: string;
  maxSize?: number;
  
  // Color picker
  presetColors?: string[];
  
  // WYSIWYG
  toolbar?: string[];
  maxLength?: number;
  
  // Repeater
  fields?: FormField[];
  repeaterFields?: FormField[];
}
```

### Field Types
```typescript
type FieldType =
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
```

---

## Component Architecture

### Frontend Components

#### 1. FormBuilder (`FormBuilder.tsx`)
Main container component untuk form builder UI.

**Props:**
```typescript
interface FormBuilderProps {
  productUuid: string;
}
```

**State:**
- `formSchema`: Current form schema
- `selectedFieldId`: Currently selected field
- `activeTab`: 'builder' | 'preview'
- `hasUnsavedChanges`: Boolean

**Key Methods:**
- `handleAddField(fieldType)`: Add new field
- `handleUpdateField(fieldId, updates)`: Update field config
- `handleDeleteField(fieldId)`: Delete field
- `handleSaveConfiguration()`: Save to backend

#### 2. FieldLibrary (`FieldLibrary.tsx`)
Panel dengan daftar field types yang bisa ditambahkan.

**Props:**
```typescript
interface FieldLibraryProps {
  onAddField: (fieldType: FieldType) => void;
}
```

#### 3. FormCanvas (`FormCanvas.tsx`)
Canvas untuk display & reorder fields (drag & drop).

**Props:**
```typescript
interface FormCanvasProps {
  fields: FormField[];
  selectedFieldId: string | null;
  onSelectField: (fieldId: string | null) => void;
  onDeleteField: (fieldId: string) => void;
  onOpenTemplateSelector?: () => void;
}
```

**Features:**
- Sortable fields via `@dnd-kit/sortable`
- Empty state dengan template selector
- Field count indicator

#### 4. FieldConfigPanel (`FieldConfigPanel.tsx`)
Panel konfigurasi untuk field yang dipilih.

**Props:**
```typescript
interface FieldConfigPanelProps {
  field: FormField;
  onUpdate: (updates: Partial<FormField>) => void;
  onClose: () => void;
}
```

**Tabs:**
- **General**: Label, name, placeholder, required, repeatable
- **Validation**: Min/max, pattern, custom error
- **Nested Fields** *(repeater only)*: Manage nested fields

**Key Methods:**
- `handleChange(key, value)`: Update field property
- `handleValidationChange(key, value)`: Update validation
- `handleAddNestedField()`: Add nested field to repeater
- `handleUpdateNestedField(index, updates)`: Update nested field
- `handleDeleteNestedField(index)`: Delete nested field

#### 5. TemplateSelector (`TemplateSelector.tsx`)
Dialog untuk browse & apply templates.

**Props:**
```typescript
interface TemplateSelectorProps {
  onApplyTemplate: (schema: FormSchema) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}
```

**Features:**
- Search & filter templates
- Category grouping (system vs custom)
- Preview template schema
- Apply template to current form

#### 6. LivePreview (`LivePreview.tsx`)
Preview real-time form rendering.

**Props:**
```typescript
interface LivePreviewProps {
  schema: FormSchema;
}
```

#### 7. DynamicFormField (`DynamicFormField.tsx`)
Component untuk render individual field di public form.

**Props:**
```typescript
interface DynamicFormFieldProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}
```

**Sub-components:**
- `SingleField`: Render field biasa
- `RepeatableField`: Render repeatable single field
- `RepeaterGroup`: Render repeater dengan nested fields

#### 8. FormRenderer (`FormRenderer.tsx`)
Component untuk render complete form di public pages.

**Props:**
```typescript
interface FormRendererProps {
  schema: FormSchema;
  onSubmit: (data: Record<string, any>) => void | Promise<void>;
  initialData?: Record<string, any>;
  className?: string;
  showCard?: boolean;
}
```

**Features:**
- Auto-validation
- Error handling
- Submit button positioning
- Card wrapper optional

---

## API Endpoints

### Product Form Configuration

#### Get Configuration
```http
GET /api/tenant/products/{uuid}/form-configuration
Authorization: Bearer {token}
```

**Response:**
```json
{
  "uuid": "...",
  "productUuid": "...",
  "productName": "...",
  "name": "Order Form",
  "formSchema": {
    "version": "1.0",
    "fields": [...]
  },
  "isActive": true,
  "version": 1
}
```

#### Create/Update Configuration
```http
POST /api/tenant/products/{uuid}/form-configuration
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Order Form",
  "description": "...",
  "formSchema": {...},
  "isActive": true
}
```

#### Delete Configuration
```http
DELETE /api/tenant/products/{uuid}/form-configuration
Authorization: Bearer {token}
```

### Form Templates

#### List Templates
```http
GET /api/tenant/form-templates?include_schema=true&per_page=50
Authorization: Bearer {token}
```

**Query Parameters:**
- `search`: Search by name/description
- `category`: Filter by category
- `is_system`: Filter system/custom templates
- `include_schema`: Include full form schema (default: false)
- `page`, `per_page`: Pagination

**Response:**
```json
{
  "data": [
    {
      "uuid": "...",
      "name": "Default Product Order Form",
      "category": "general",
      "tags": ["default", "comprehensive"],
      "formSchema": {...},
      "isSystem": true,
      "usageCount": 150
    }
  ],
  "meta": {
    "current_page": 1,
    "total": 8,
    "per_page": 50,
    "last_page": 1
  }
}
```

#### Get Single Template
```http
GET /api/tenant/form-templates/{uuid}
Authorization: Bearer {token}
```

---

## Backend Implementation

### Models

#### ProductFormConfiguration
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductFormConfiguration extends Model
{
    protected $casts = [
        'form_schema' => 'array',
        'validation_rules' => 'array',
        'conditional_logic' => 'array',
        'is_active' => 'boolean',
        'is_default' => 'boolean',
        'is_template' => 'boolean',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_uuid', 'uuid');
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class, 'tenant_id', 'uuid');
    }
}
```

#### ProductFormTemplate
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductFormTemplate extends Model
{
    protected $casts = [
        'form_schema' => 'array',
        'validation_rules' => 'array',
        'conditional_logic' => 'array',
        'tags' => 'array',
        'is_public' => 'boolean',
        'is_system' => 'boolean',
        'usage_count' => 'integer',
    ];
}
```

### Controllers

#### FormConfigurationController
```php
<?php

namespace App\Http\Controllers\Api\Tenant;

class FormConfigurationController extends Controller
{
    public function show(string $productUuid)
    {
        $config = ProductFormConfiguration::where('product_uuid', $productUuid)
            ->where('tenant_id', auth()->user()->tenant_id)
            ->firstOrFail();

        return FormConfigurationResource::make($config);
    }

    public function store(Request $request, string $productUuid)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'formSchema' => 'required|array',
            'isActive' => 'boolean',
        ]);

        $config = ProductFormConfiguration::updateOrCreate(
            ['product_uuid' => $productUuid],
            [
                'tenant_id' => auth()->user()->tenant_id,
                'name' => $validated['name'],
                'form_schema' => $validated['formSchema'],
                'is_active' => $validated['isActive'] ?? true,
            ]
        );

        return FormConfigurationResource::make($config);
    }
}
```

### Seeders

#### ProductFormTemplateSeeder
```php
<?php

namespace Database\Seeders;

use App\Models\ProductFormTemplate;
use Illuminate\Database\Seeder;

class ProductFormTemplateSeeder extends Seeder
{
    public function run()
    {
        $templates = [
            $this->defaultProductOrderForm(),
            $this->simpleProductForm(),
            // ... more templates
        ];

        foreach ($templates as $template) {
            ProductFormTemplate::create($template);
        }
    }

    private function defaultProductOrderForm(): array
    {
        return [
            'name' => 'Default Product Order Form',
            'category' => 'general',
            'is_system' => true,
            'is_public' => true,
            'tags' => ['default', 'comprehensive'],
            'form_schema' => [
                'version' => '1.0',
                'fields' => [
                    // ... 13 fields
                ]
            ]
        ];
    }
}
```

---

## Validation Rules

### Frontend Validation
Dilakukan di `FormRenderer` component sebelum submit:

```typescript
const validateForm = (): boolean => {
  const newErrors: Record<string, string> = {};

  schema.fields.forEach((field) => {
    const value = formData[field.name];

    // Required check
    if (field.required && !value) {
      newErrors[field.name] = `${field.label} is required`;
    }

    // Type-specific validation
    if (field.type === 'text' || field.type === 'textarea') {
      if (field.validation?.minLength && value.length < field.validation.minLength) {
        newErrors[field.name] = `Minimum ${field.validation.minLength} characters`;
      }
      if (field.validation?.maxLength && value.length > field.validation.maxLength) {
        newErrors[field.name] = `Maximum ${field.validation.maxLength} characters`;
      }
    }

    // Pattern validation
    if (field.validation?.pattern && value) {
      const regex = new RegExp(field.validation.pattern);
      if (!regex.test(value)) {
        newErrors[field.name] = field.validation.errorMessage || 'Invalid format';
      }
    }

    // Repeater validation
    if (field.repeatable || field.type === 'repeater') {
      const items = Array.isArray(value) ? value : [];
      if (field.minItems && items.length < field.minItems) {
        newErrors[field.name] = `Minimum ${field.minItems} items required`;
      }
      if (field.maxItems && items.length > field.maxItems) {
        newErrors[field.name] = `Maximum ${field.maxItems} items allowed`;
      }
    }
  });

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

### Backend Validation
Dilakukan di Laravel controller:

```php
$rules = [];
foreach ($formSchema['fields'] as $field) {
    $fieldRules = [];
    
    if ($field['required'] ?? false) {
        $fieldRules[] = 'required';
    } else {
        $fieldRules[] = 'nullable';
    }
    
    switch ($field['type']) {
        case 'email':
            $fieldRules[] = 'email';
            break;
        case 'number':
            $fieldRules[] = 'numeric';
            if (isset($field['validation']['min'])) {
                $fieldRules[] = 'min:' . $field['validation']['min'];
            }
            if (isset($field['validation']['max'])) {
                $fieldRules[] = 'max:' . $field['validation']['max'];
            }
            break;
        case 'file':
            $fieldRules[] = 'file';
            if (isset($field['maxSize'])) {
                $fieldRules[] = 'max:' . ($field['maxSize'] / 1024);
            }
            break;
    }
    
    $rules[$field['name']] = $fieldRules;
}

$validated = $request->validate($rules);
```

---

## State Management

### Form Builder State
```typescript
const [formSchema, setFormSchema] = useState<FormSchema>({
  version: '1.0',
  title: 'Product Order Form',
  description: '',
  fields: [],
});

const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
```

### Form Renderer State
```typescript
const [formData, setFormData] = useState<Record<string, any>>({});
const [errors, setErrors] = useState<Record<string, string>>({});
const [isSubmitting, setIsSubmitting] = useState(false);
```

---

## Performance Considerations

### 1. Form Schema Size
- Recommended max: 30 fields per form
- Large schemas can slow down rendering
- Consider pagination for very long forms

### 2. Nested Repeaters
- Max 1 level of nesting recommended
- Deeply nested repeaters impact performance
- Consider alternative UI patterns for complex hierarchies

### 3. File Uploads
- Set reasonable `maxSize` limits (default: 10MB)
- Use client-side compression for images
- Consider async upload with progress indicator

### 4. Live Preview
- Debounce schema updates (300ms)
- Memoize rendered components
- Use React.memo for field components

### 5. Database Queries
- Index on `product_uuid`, `tenant_id`
- Use `include_schema` parameter wisely
- Cache frequently-used templates

---

## Testing

### Unit Tests
```typescript
describe('DynamicFormField', () => {
  it('renders text input correctly', () => {
    const field: FormField = {
      id: 'test',
      type: 'text',
      name: 'test_field',
      label: 'Test Field',
      required: true,
      order: 1,
    };

    render(<DynamicFormField field={field} value="" onChange={() => {}} />);
    expect(screen.getByLabelText('Test Field')).toBeInTheDocument();
  });

  it('validates required field', () => {
    // ... test validation
  });
});
```

### Integration Tests
```php
/** @test */
public function it_saves_form_configuration()
{
    $tenant = Tenant::factory()->create();
    $product = Product::factory()->create(['tenant_id' => $tenant->uuid]);
    $user = User::factory()->create(['tenant_id' => $tenant->uuid]);

    $response = $this->actingAs($user)
        ->postJson("/api/tenant/products/{$product->uuid}/form-configuration", [
            'name' => 'Test Form',
            'formSchema' => [
                'fields' => [
                    ['type' => 'text', 'name' => 'name', 'label' => 'Name']
                ]
            ]
        ]);

    $response->assertStatus(200);
    $this->assertDatabaseHas('product_form_configurations', [
        'product_uuid' => $product->uuid,
        'name' => 'Test Form',
    ]);
}
```

---

## Security Considerations

### 1. Tenant Isolation
- Always filter by `tenant_id` in queries
- Use middleware to enforce tenant context
- Validate product ownership before saving

### 2. Input Validation
- Sanitize form schema before saving
- Validate field types against whitelist
- Prevent XSS in user-provided labels/placeholders

### 3. File Uploads
- Validate file types server-side
- Store files outside web root
- Generate unique filenames
- Scan for malware

### 4. Rate Limiting
- Limit form submissions per IP/user
- Implement CAPTCHA for public forms
- Monitor for abuse patterns

---

## Migration Guide

### Adding New Field Type

#### 1. Update Type Definition
```typescript
// frontend/src/types/form-builder.ts
export type FieldType =
  | 'text'
  | 'newFieldType'; // Add here
```

#### 2. Add to Field Types
```typescript
// frontend/src/types/form-builder.ts
export const FIELD_TYPES: FieldTypeDefinition[] = [
  // ...
  {
    type: 'newFieldType',
    label: 'New Field',
    icon: 'IconName',
    description: 'Description',
    category: 'basic',
    defaultConfig: {
      type: 'newFieldType',
      // ... defaults
    },
  },
];
```

#### 3. Implement Renderer
```typescript
// frontend/src/components/form-builder/DynamicFormField.tsx
case 'newFieldType':
  return (
    <NewFieldComponent
      value={value}
      onChange={onChange}
      {...field}
    />
  );
```

#### 4. Add Configuration UI
```typescript
// frontend/src/components/form-builder/FieldConfigPanel.tsx
{field.type === 'newFieldType' && (
  <div className="space-y-2">
    {/* Configuration options */}
  </div>
)}
```

---

## Changelog

### Version 1.0.0 (5 Jan 2026)
- ✅ Initial release
- ✅ 16 field types
- ✅ Repeatable fields support
- ✅ Nested fields in repeater
- ✅ Template system
- ✅ Live preview
- ✅ Full TypeScript support

---

## Future Improvements

### Phase 2: Advanced Features
- Conditional logic (show/hide based on other fields)
- Field dependencies & calculations
- Multi-page/wizard forms
- Custom validation functions

### Phase 3: Analytics & Optimization
- Field completion rates
- Abandonment analytics
- A/B testing framework
- Performance monitoring

### Phase 4: Extensions
- Custom field types via plugins
- Third-party integrations
- Form versioning & rollback
- Import/export configurations

---

**Maintained by:** CanvaStack Development Team  
**Last Updated:** 5 Januari 2026  
**Version:** 1.0.0
