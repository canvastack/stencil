<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\ProductFormConfiguration;
use App\Models\ProductFormTemplate;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\Product;

class ProductFormConfigurationSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🔧 Seeding Product Form Configurations...');

        $tenants = TenantEloquentModel::all();

        foreach ($tenants as $tenant) {
            $this->command->info("   📊 Processing Tenant: {$tenant->name}");
            $this->seedConfigurationsForTenant($tenant);
        }

        $this->command->info('✅ Product Form Configuration Seeding Completed!');
    }

    private function seedConfigurationsForTenant($tenant): void
    {
        $existingConfigsCount = ProductFormConfiguration::where('tenant_id', $tenant->uuid)->count();
        
        if ($existingConfigsCount >= 30) {
            $this->command->info("      ℹ️  Configurations already exist for {$tenant->name}, skipping...");
            return;
        }

        $products = Product::where('tenant_id', $tenant->id)
            ->where('status', 'published')
            ->orderBy('created_at', 'desc')
            ->take(50)
            ->get();

        if ($products->isEmpty()) {
            $this->command->info("      ⚠️  No published products found for {$tenant->name}");
            return;
        }

        $templates = [
            'default' => ProductFormTemplate::where('name', 'Default Product Order Form')->first(),
            'plakat' => ProductFormTemplate::where('name', 'Metal Plakat Order Form')->first(),
            'trophy' => ProductFormTemplate::where('name', 'Glass Trophy & Award Form')->first(),
            'corporate' => ProductFormTemplate::where('name', 'Corporate Award & Recognition Form')->first(),
            'signage' => ProductFormTemplate::where('name', 'Acrylic Signage Order Form')->first(),
            'custom' => ProductFormTemplate::where('name', 'Custom Design Upload Form')->first(),
            'quote' => ProductFormTemplate::where('name', 'Quote Request Form')->first(),
            'gift' => ProductFormTemplate::where('name', 'Personalized Gift Order Form')->first(),
        ];

        if (!$templates['default']) {
            $this->command->error("      ❌ Default template not found! Run ProductFormTemplateSeeder first.");
            return;
        }

        $createdCount = 0;
        $targetCount = min(40, $products->count());

        foreach ($products->take($targetCount) as $index => $product) {
            $template = $this->selectTemplateForProduct($product, $templates);
            
            if (!$template) {
                continue;
            }

            $formSchema = $this->customizeSchemaForProduct($product, $template->form_schema);

            ProductFormConfiguration::updateOrCreate(
                [
                    'product_id' => $product->id,
                    'tenant_id' => $tenant->uuid,
                ],
                [
                    'uuid' => Str::uuid()->toString(),
                    'product_uuid' => $product->uuid,
                    'name' => $template->name . ' - ' . $product->name,
                    'description' => "Form configuration for {$product->name}",
                    'form_schema' => $formSchema,
                    'validation_rules' => $this->generateValidationRules($formSchema),
                    'conditional_logic' => $this->generateConditionalLogic($product),
                    'is_active' => true,
                    'is_default' => false,
                    'is_template' => false,
                    'template_id' => $template->id,
                    'version' => 1,
                    'submission_count' => rand(0, 50),
                    'avg_completion_time' => rand(120, 600),
                    'created_by' => null,
                    'updated_by' => null,
                ]
            );

            $createdCount++;
        }

        $this->command->info("      ✅ Created {$createdCount} form configurations");
    }

    private function selectTemplateForProduct($product, $templates)
    {
        $productName = strtolower($product->name);
        $productType = strtolower($product->product_type ?? '');
        $subcategory = strtolower($product->subcategory ?? '');
        $description = strtolower($product->description ?? '');

        // PT CEX Business-Specific: Metal Plakat Detection
        if (str_contains($productName, 'plakat') || str_contains($productName, 'plaque')) {
            return $templates['plakat'];
        }

        // Metal products (copper, brass, stainless, aluminum) for etching
        if (str_contains($productName, 'copper') || 
            str_contains($productName, 'brass') || 
            str_contains($productName, 'stainless') ||
            str_contains($productName, 'aluminum') ||
            str_contains($productName, 'metal') ||
            str_contains($productType, 'metal')) {
            return $templates['plakat'];
        }

        // Glass/Crystal Trophy & Awards
        if (str_contains($productName, 'trophy') || 
            str_contains($productName, 'crystal') ||
            str_contains($productName, 'glass') && (str_contains($productName, 'award') || str_contains($productName, 'trophy'))) {
            return $templates['trophy'];
        }

        // Corporate Awards (certificates, employee recognition)
        if (str_contains($productName, 'corporate') || 
            str_contains($productName, 'certificate') ||
            str_contains($productName, 'employee') ||
            str_contains($productName, 'recognition') ||
            str_contains($subcategory, 'corporate')) {
            return $templates['corporate'];
        }

        // Award general (if not metal/glass)
        if (str_contains($productName, 'award') || str_contains($subcategory, 'award')) {
            return $templates['trophy'];
        }

        // Signage & Labels (acrylic, door sign, name plate, label, badge)
        if (str_contains($productName, 'sign') || 
            str_contains($productName, 'acrylic') ||
            str_contains($productName, 'label') ||
            str_contains($productName, 'badge') ||
            str_contains($productName, 'plate') ||
            str_contains($productName, 'board') && !str_contains($productName, 'award')) {
            return $templates['signage'];
        }

        // Personalized Gifts (wedding, birthday, graduation)
        if (str_contains($productName, 'gift') || 
            str_contains($productName, 'personalized') ||
            str_contains($productName, 'wedding') ||
            str_contains($productName, 'birthday') ||
            str_contains($productName, 'graduation')) {
            return $templates['gift'];
        }

        // Quote Request for expensive/complex items
        if ($product->requires_quote || 
            (isset($product->price) && $product->price > 1000000)) {
            return $templates['quote'];
        }

        // Custom Design Upload for highly customizable products
        if ($product->customizable && rand(0, 10) > 7) {
            return $templates['custom'];
        }

        return $templates['default'];
    }

    private function customizeSchemaForProduct($product, $baseSchema)
    {
        $schema = $baseSchema;

        if (isset($product->bahan_options) && !empty($product->bahan_options)) {
            foreach ($schema['fields'] as &$field) {
                if (isset($field['name']) && $field['name'] === 'bahan') {
                    $field['options'] = array_map(function($bahan) {
                        return [
                            'value' => Str::slug($bahan),
                            'label' => $bahan
                        ];
                    }, $product->bahan_options);
                }
            }
        }

        if (isset($product->kualitas_options) && !empty($product->kualitas_options)) {
            foreach ($schema['fields'] as &$field) {
                if (isset($field['name']) && $field['name'] === 'kualitas') {
                    $field['options'] = array_map(function($kualitas) {
                        return [
                            'value' => strtolower($kualitas),
                            'label' => $kualitas
                        ];
                    }, $product->kualitas_options);
                }
            }
        }

        if (isset($product->ketebalan_options) && !empty($product->ketebalan_options)) {
            foreach ($schema['fields'] as &$field) {
                if (isset($field['name']) && $field['name'] === 'ketebalan') {
                    $field['options'] = array_map(function($ketebalan) {
                        return [
                            'value' => $ketebalan,
                            'label' => $ketebalan
                        ];
                    }, $product->ketebalan_options);
                }
            }
        }

        if (isset($product->ukuran_options) && !empty($product->ukuran_options)) {
            foreach ($schema['fields'] as &$field) {
                if (isset($field['name']) && in_array($field['name'], ['ukuran', 'size'])) {
                    $field['options'] = array_map(function($ukuran) {
                        return [
                            'value' => $ukuran,
                            'label' => $ukuran
                        ];
                    }, $product->ukuran_options);
                }
            }
        }

        return $schema;
    }

    private function generateValidationRules($formSchema)
    {
        $rules = [];

        foreach ($formSchema['fields'] as $field) {
            $fieldRules = [];
            $fieldName = $field['name'];

            if (isset($field['required']) && $field['required']) {
                $fieldRules[] = 'required';
            }

            switch ($field['type']) {
                case 'text':
                case 'textarea':
                    if (isset($field['validation']['minLength'])) {
                        $fieldRules[] = 'min:' . $field['validation']['minLength'];
                    }
                    if (isset($field['validation']['maxLength'])) {
                        $fieldRules[] = 'max:' . $field['validation']['maxLength'];
                    }
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

                case 'email':
                    $fieldRules[] = 'email';
                    break;

                case 'file':
                    $fieldRules[] = 'file';
                    if (isset($field['validation']['maxSize'])) {
                        $fieldRules[] = 'max:' . ($field['validation']['maxSize'] / 1024);
                    }
                    if (isset($field['validation']['fileTypes'])) {
                        $fieldRules[] = 'mimes:' . implode(',', $field['validation']['fileTypes']);
                    }
                    break;

                case 'date':
                    $fieldRules[] = 'date';
                    if (isset($field['validation']['minDate']) && $field['validation']['minDate'] !== null) {
                        $fieldRules[] = 'after:' . $field['validation']['minDate'];
                    }
                    break;
            }

            if (!empty($fieldRules)) {
                $rules[$fieldName] = $fieldRules;
            }
        }

        return $rules;
    }

    private function generateConditionalLogic($product)
    {
        $logic = [];

        if ($product->product_type === 'metal' && $product->customizable) {
            $logic['field_ketebalan'] = [
                'showIf' => [
                    'field' => 'product_type',
                    'operator' => 'equals',
                    'value' => 'metal'
                ]
            ];
        }

        if ($product->requires_quote) {
            $logic['field_budget_estimate'] = [
                'showIf' => [
                    'field' => 'quantity',
                    'operator' => 'greaterThan',
                    'value' => 50
                ]
            ];
        }

        if (str_contains(strtolower($product->name), 'custom')) {
            $logic['field_design_files'] = [
                'showIf' => [
                    'field' => 'project_name',
                    'operator' => 'notEmpty',
                    'value' => true
                ]
            ];
        }

        return !empty($logic) ? $logic : null;
    }
}
