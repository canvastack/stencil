<?php

$data = json_encode([
    'email' => 'admin@pt-cex.com',
    'password' => 'PTCexAdmin2024!',
    'tenant_slug' => 'pt-cex'
]);

$ch = curl_init('http://localhost:8000/api/v1/auth/login');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response: $response\n";