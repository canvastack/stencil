<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Models\ProductFormConfiguration;
use App\Models\ProductFormTemplate;
use Illuminate\Support\Str;

echo "=== GENERATING MISSING FORM CONFIGURATIONS ===\n\n";

// Get default template
$defaultTemplate = ProductFormTemplate::where('name', 'Default Product Order Form')->first();

if (!$defaultTemplate) {
    echo "❌ Default template not found! Cannot proceed.\n";
    exit(1);
}

echo "Using template: {$defaultTemplate->name} (ID: {$defaultTemplate->id})\n\n";

// Find published products without form configurations
$publishedProducts = Product::where('status', 'published')
    ->whereDoesntHave('formConfiguration')
    ->get();

echo "Found {$publishedProducts->count()} published products without form configurations\n";

if ($publishedProducts->count() === 0) {
    echo "✅ All published products already have form configurations!\n";
    exit(0);
}

echo "\nGenerating form configurations...\n";
$created = 0;

foreach ($publishedProducts as $product) {
    try {
        $formSchema = $defaultTemplate->form_schema;
        
        // Customize form schema with product info if needed
        if (isset($formSchema['title'])) {
            $formSchema['title'] = "Order Form - {$product->name}";
        }
        
        $config = ProductFormConfiguration::create([
            'uuid' => Str::uuid()->toString(),
            'tenant_id' => $product->tenant_id,
            'product_id' => $product->id,
            'product_uuid' => $product->uuid,
            'name' => "Order Form - {$product->name}",
            'description' => "Auto-generated form configuration for {$product->name}",
            'form_schema' => $formSchema,
            'validation_rules' => $defaultTemplate->validation_rules,
            'conditional_logic' => [],
            'is_active' => true,
            'is_default' => false,
            'is_template' => false,
            'template_id' => $defaultTemplate->id,
            'version' => 1,
            'submission_count' => 0,
            'avg_completion_time' => null,
            'created_by' => null,
            'updated_by' => null,
        ]);
        
        $created++;
        echo "  ✓ {$product->name} (UUID: {$product->uuid})\n";
        
    } catch (\Exception $e) {
        echo "  ✗ {$product->name}: {$e->getMessage()}\n";
    }
}

echo "\n✅ Created {$created} form configurations\n";

// Summary
echo "\n=== SUMMARY ===\n";
echo "Total form configurations now: " . ProductFormConfiguration::count() . "\n";
echo "Published products: " . Product::where('status', 'published')->count() . "\n";
echo "Published products WITH forms: " . Product::where('status', 'published')->has('formConfiguration')->count() . "\n";
echo "Published products WITHOUT forms: " . Product::where('status', 'published')->doesntHave('formConfiguration')->count() . "\n";

echo "\nDONE!\n";
