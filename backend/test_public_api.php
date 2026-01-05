<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

use Illuminate\Http\Request;
use App\Infrastructure\Presentation\Http\Controllers\Public\ProductFormController;

echo "=== TESTING PUBLIC API ENDPOINT ===\n\n";

// Test 1: Get form configuration for Designer Clear Plaque
$productUuid = 'bd3e38b8-2908-4e91-ba35-384403eaaa36';

echo "Test 1: GET /api/public/products/{$productUuid}/form-configuration\n";
echo "---\n";

try {
    $controller = new ProductFormController();
    $request = Request::create("/api/public/products/{$productUuid}/form-configuration", 'GET');
    
    $response = $controller->show($request, $productUuid);
    $statusCode = $response->getStatusCode();
    $data = json_decode($response->getContent(), true);
    
    echo "Status Code: {$statusCode}\n";
    
    if ($statusCode === 200) {
        echo "✅ SUCCESS!\n";
        echo "Product UUID: " . ($data['data']['product_uuid'] ?? 'N/A') . "\n";
        echo "Product Name: " . ($data['data']['product_name'] ?? 'N/A') . "\n";
        echo "Form Fields: " . (isset($data['data']['form_schema']['fields']) ? count($data['data']['form_schema']['fields']) : 0) . "\n";
        echo "Version: " . ($data['data']['version'] ?? 'N/A') . "\n";
        
        if (isset($data['data']['form_schema']['fields'])) {
            echo "\nField Names:\n";
            foreach ($data['data']['form_schema']['fields'] as $field) {
                echo "  - {$field['name']} ({$field['type']})" . ($field['required'] ? ' *' : '') . "\n";
            }
        }
    } else {
        echo "❌ FAILED!\n";
        echo "Error: " . ($data['message'] ?? 'Unknown error') . "\n";
        echo "Full response: " . json_encode($data, JSON_PRETTY_PRINT) . "\n";
    }
    
} catch (\Exception $e) {
    echo "❌ EXCEPTION: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
}

echo "\n=== DONE ===\n";
