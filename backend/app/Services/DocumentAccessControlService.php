<?php

namespace App\Services;

use App\Infrastructure\Persistence\Eloquent\Models\OrderDocument;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use Illuminate\Support\Facades\Log;

/**
 * Document Access Control Service
 * 
 * Manages secure access to order documents with proper authorization
 * and audit logging
 */
class DocumentAccessControlService
{
    /**
     * Check if user can access document
     *
     * @param OrderDocument $document
     * @param string $userType (admin|customer|vendor)
     * @param int $userId
     * @return bool
     */
    public function canAccess(OrderDocument $document, string $userType, int $userId): bool
    {
        switch ($userType) {
            case 'admin':
                // Admin can access all documents in their tenant
                $user = UserEloquentModel::find($userId);
                return $user && $user->tenant_id === $document->tenant_id;
                
            case 'customer':
                // Customer can only access their own documents
                $customer = Customer::find($userId);
                if (!$customer) {
                    return false;
                }
                
                // Check if document belongs to customer's order
                return $document->order->customer_id === $userId;
                
            case 'vendor':
                // Vendor can only access PO documents sent to them
                return $document->document_type === 'purchase_order' 
                    && $document->recipient_type === 'vendor'
                    && $document->recipient_id === $userId;
                
            default:
                return false;
        }
    }
    
    /**
     * Log document access
     *
     * @param OrderDocument $document
     * @param string $userType
     * @param int $userId
     * @param string $action (view|download|email)
     * @return void
     */
    public function logAccess(OrderDocument $document, string $userType, int $userId, string $action): void
    {
        $accessEntry = [
            'accessed_by' => $userId,
            'user_type' => $userType,
            'accessed_at' => now()->toIso8601String(),
            'ip_address' => request()->ip(),
            'action' => $action,
        ];
        
        // Add to document access log
        $accessLog = $document->access_log ?? [];
        $accessLog[] = $accessEntry;
        $document->access_log = $accessLog;
        $document->save();
        
        // Also log to Laravel log
        Log::info("Document Access: {$action}", [
            'document_id' => $document->id,
            'document_type' => $document->document_type,
            'document_number' => $document->document_number,
            'user_type' => $userType,
            'user_id' => $userId,
            'ip_address' => $accessEntry['ip_address'],
        ]);
    }
    
    /**
     * Generate secure download URL with expiration
     *
     * @param OrderDocument $document
     * @param int $expiresInMinutes
     * @return string
     */
    public function generateSecureDownloadUrl(OrderDocument $document, int $expiresInMinutes = 60): string
    {
        $token = encrypt([
            'document_id' => $document->id,
            'expires_at' => now()->addMinutes($expiresInMinutes)->timestamp,
        ]);
        
        return route('documents.secure-download', ['token' => $token]);
    }
    
    /**
     * Verify secure download token
     *
     * @param string $token
     * @return OrderDocument|null
     */
    public function verifyDownloadToken(string $token): ?OrderDocument
    {
        try {
            $data = decrypt($token);
            
            // Check expiration
            if ($data['expires_at'] < now()->timestamp) {
                Log::warning('Expired document download token used', [
                    'document_id' => $data['document_id'],
                ]);
                return null;
            }
            
            return OrderDocument::find($data['document_id']);
        } catch (\Exception $e) {
            Log::error('Invalid document download token', [
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }
    
    /**
     * Check if document contains sensitive data
     *
     * @param OrderDocument $document
     * @return bool
     */
    public function isSensitive(OrderDocument $document): bool
    {
        $sensitiveTypes = [
            'tax_invoice',
            'receipt',
            'purchase_order',
        ];
        
        return in_array($document->document_type, $sensitiveTypes);
    }
    
    /**
     * Get document access history
     *
     * @param OrderDocument $document
     * @return array
     */
    public function getAccessHistory(OrderDocument $document): array
    {
        return $document->access_log ?? [];
    }
}
