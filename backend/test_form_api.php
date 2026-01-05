<?php

$productUuid = 'bd3e38b8-2908-4e91-ba35-384403eaaa36';
$url = "http://localhost:8000/api/v1/public/products/{$productUuid}/form-configuration";

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json',
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "HTTP Code: {$httpCode}\n";
if ($error) {
    echo "Error: {$error}\n";
}
echo "Response:\n";
echo $response;
echo "\n";

if ($httpCode === 200) {
    $data = json_decode($response, true);
    if (isset($data['data']['form_schema']['fields'])) {
        echo "\nForm has " . count($data['data']['form_schema']['fields']) . " fields\n";
    }
}
