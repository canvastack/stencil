<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel as Tenant;
use App\Models\ProductFormConfiguration;

echo "=== FINAL VERIFICATION REPORT ===\n\n";

// 1. Check Designer Clear Plaque
echo "1. DESIGNER CLEAR PLAQUE STATUS:\n";
$designerPlaque = Product::where('uuid', 'bd3e38b8-2908-4e91-ba35-384403eaaa36')->first();
if ($designerPlaque) {
    echo "   ✅ Found: {$designerPlaque->name}\n";
    echo "   ✅ Status: {$designerPlaque->status}\n";
    echo "   ✅ Tenant: " . $designerPlaque->tenant->name . "\n";
    echo "   ✅ Slug: {$designerPlaque->slug}\n";
    
    $formConfig = ProductFormConfiguration::where('product_id', $designerPlaque->id)
        ->where('is_active', true)
        ->first();
    
    if ($formConfig) {
        echo "   ✅ Has active form configuration\n";
        echo "   ✅ Form fields: " . count($formConfig->form_schema['fields']) . "\n";
    } else {
        echo "   ❌ NO FORM CONFIGURATION!\n";
    }
} else {
    echo "   ❌ NOT FOUND!\n";
}

echo "\n2. DATABASE STATISTICS:\n";
echo "   - Total tenants: " . Tenant::count() . "\n";
echo "   - Total products: " . Product::count() . "\n";
echo "   - Published products: " . Product::where('status', 'published')->count() . "\n";
echo "   - Total form configurations: " . ProductFormConfiguration::count() . "\n";
echo "   - Active form configurations: " . ProductFormConfiguration::where('is_active', true)->count() . "\n";

echo "\n3. TENANT BREAKDOWN:\n";
$tenants = Tenant::all();
foreach ($tenants as $tenant) {
    $publishedCount = Product::where('tenant_id', $tenant->id)
        ->where('status', 'published')
        ->count();
    
    $formConfigCount = ProductFormConfiguration::where('tenant_id', $tenant->id)
        ->where('is_active', true)
        ->count();
    
    $withFormsCount = Product::where('tenant_id', $tenant->id)
        ->where('status', 'published')
        ->has('formConfiguration')
        ->count();
    
    echo "   {$tenant->name} ({$tenant->slug}):\n";
    echo "     - Published products: {$publishedCount}\n";
    echo "     - Form configurations: {$formConfigCount}\n";
    echo "     - Products with forms: {$withFormsCount}\n";
    
    if ($publishedCount !== $withFormsCount) {
        echo "     ⚠️  WARNING: " . ($publishedCount - $withFormsCount) . " published products missing forms!\n";
    } else {
        echo "     ✅ All published products have forms\n";
    }
}

echo "\n4. SAMPLE PRODUCTS WITH FORMS (per tenant):\n";
foreach ($tenants->take(2) as $tenant) {
    echo "\n   {$tenant->name}:\n";
    $products = Product::where('tenant_id', $tenant->id)
        ->where('status', 'published')
        ->with('formConfiguration')
        ->limit(3)
        ->get();
    
    foreach ($products as $product) {
        $formCount = $product->formConfiguration->where('is_active', true)->count();
        echo "     - {$product->name} → Forms: {$formCount}\n";
    }
}

echo "\n5. CRITICAL CHECKS:\n";

// Check if any published products without forms
$missingForms = Product::where('status', 'published')
    ->doesntHave('formConfiguration')
    ->count();

if ($missingForms === 0) {
    echo "   ✅ All published products have form configurations\n";
} else {
    echo "   ❌ {$missingForms} published products missing form configurations!\n";
}

// Check relationship integrity
$brokenRelationships = ProductFormConfiguration::whereDoesntHave('product')->count();
if ($brokenRelationships === 0) {
    echo "   ✅ All form configurations have valid product relationships\n";
} else {
    echo "   ❌ {$brokenRelationships} form configurations with broken product relationships!\n";
}

$brokenTenantRels = ProductFormConfiguration::whereDoesntHave('tenant')->count();
if ($brokenTenantRels === 0) {
    echo "   ✅ All form configurations have valid tenant relationships\n";
} else {
    echo "   ❌ {$brokenTenantRels} form configurations with broken tenant relationships!\n";
}

echo "\n=== VERIFICATION COMPLETE ===\n";
echo "\nREADY FOR TESTING! ✨\n";
echo "\nNext steps:\n";
echo "1. Reload frontend (Ctrl+R)\n";
echo "2. Visit: http://localhost:5173/etchinx/products\n";
echo "3. Search for 'Designer Clear Plaque'\n";
echo "4. Click the product and verify form renders\n";
