<?php

echo "🌐 Testing HTTP API Endpoint...\n\n";

$url = 'http://localhost:8000/api/v1/public/products/307815d4-e587-4b95-aa57-a40325326956/form-configuration';

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json',
    'X-Context: anonymous',
    'X-Anonymous-Request: true',
    'Cache-Control: no-cache'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    echo "❌ cURL Error: {$error}\n";
    exit(1);
}

echo "HTTP Status: {$httpCode}\n\n";

if ($httpCode === 200) {
    $data = json_decode($response, true);
    
    if (isset($data['data']['form_schema'])) {
        $title = $data['data']['form_schema']['title'] ?? 'N/A';
        $fieldCount = isset($data['data']['form_schema']['fields']) ? count($data['data']['form_schema']['fields']) : 0;
        $version = $data['data']['version'] ?? 'N/A';
        
        echo "✅ API Response:\n";
        echo "  Title: {$title}\n";
        echo "  Fields: {$fieldCount}\n";
        echo "  Version: {$version}\n\n";
        
        if ($title === 'Form Pemesanan' && $fieldCount === 13) {
            echo "✅ CORRECT! API is returning the new form configuration!\n";
        } else {
            echo "❌ WRONG! API is still returning old form configuration!\n";
            echo "   Expected: Title='Form Pemesanan', Fields=13\n";
            echo "   Got: Title='{$title}', Fields={$fieldCount}\n";
        }
    } else {
        echo "Response: {$response}\n";
    }
} else {
    echo "Response: {$response}\n";
}
