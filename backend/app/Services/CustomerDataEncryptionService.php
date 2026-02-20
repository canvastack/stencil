<?php

namespace App\Services;

use Illuminate\Support\Facades\Crypt;
use Illuminate\Contracts\Encryption\DecryptException;

/**
 * Customer Data Encryption Service
 * 
 * Handles encryption and decryption of sensitive customer data
 * such as personal information, payment details, etc.
 */
class CustomerDataEncryptionService
{
    /**
     * Fields that should be encrypted
     */
    private const ENCRYPTED_FIELDS = [
        'phone',
        'address',
        'tax_id', // NPWP
        'bank_account_number',
        'payment_proof_url',
    ];
    
    /**
     * Encrypt sensitive customer data
     *
     * @param array $data
     * @return array
     */
    public function encryptCustomerData(array $data): array
    {
        foreach (self::ENCRYPTED_FIELDS as $field) {
            if (isset($data[$field]) && !empty($data[$field])) {
                try {
                    $data[$field] = Crypt::encryptString($data[$field]);
                } catch (\Exception $e) {
                    // Log error but don't fail the operation
                    \Log::error("Failed to encrypt field: {$field}", [
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        }
        
        return $data;
    }
    
    /**
     * Decrypt sensitive customer data
     *
     * @param array $data
     * @return array
     */
    public function decryptCustomerData(array $data): array
    {
        foreach (self::ENCRYPTED_FIELDS as $field) {
            if (isset($data[$field]) && !empty($data[$field])) {
                try {
                    $data[$field] = Crypt::decryptString($data[$field]);
                } catch (DecryptException $e) {
                    // If decryption fails, it might be unencrypted data
                    // Leave it as is and log the issue
                    \Log::warning("Failed to decrypt field: {$field}", [
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        }
        
        return $data;
    }
    
    /**
     * Encrypt a single value
     *
     * @param string|null $value
     * @return string|null
     */
    public function encrypt(?string $value): ?string
    {
        if (empty($value)) {
            return $value;
        }
        
        try {
            return Crypt::encryptString($value);
        } catch (\Exception $e) {
            \Log::error('Failed to encrypt value', [
                'error' => $e->getMessage(),
            ]);
            return $value;
        }
    }
    
    /**
     * Decrypt a single value
     *
     * @param string|null $value
     * @return string|null
     */
    public function decrypt(?string $value): ?string
    {
        if (empty($value)) {
            return $value;
        }
        
        try {
            return Crypt::decryptString($value);
        } catch (DecryptException $e) {
            \Log::warning('Failed to decrypt value', [
                'error' => $e->getMessage(),
            ]);
            return $value;
        }
    }
    
    /**
     * Mask sensitive data for display
     *
     * @param string $value
     * @param int $visibleChars Number of characters to show at start and end
     * @return string
     */
    public function maskSensitiveData(string $value, int $visibleChars = 4): string
    {
        $length = strlen($value);
        
        if ($length <= $visibleChars * 2) {
            return str_repeat('*', $length);
        }
        
        $start = substr($value, 0, $visibleChars);
        $end = substr($value, -$visibleChars);
        $masked = str_repeat('*', $length - ($visibleChars * 2));
        
        return $start . $masked . $end;
    }
}
