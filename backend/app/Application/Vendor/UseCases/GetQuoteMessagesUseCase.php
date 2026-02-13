<?php

declare(strict_types=1);

namespace App\Application\Vendor\UseCases;

use App\Application\Vendor\Queries\GetQuoteMessagesQuery;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * Use Case: Get Quote Messages
 * 
 * Retrieves all messages for a specific quote in chronological order.
 * 
 * Business Rules:
 * - Vendor must own the quote
 * - Messages ordered by created_at ASC (oldest first)
 * - Support pagination
 * - Tenant isolation enforced
 * - Mark vendor's unread messages as read
 * - Include sender information
 */
final class GetQuoteMessagesUseCase
{
    /**
     * Execute query to get quote messages
     * 
     * @param GetQuoteMessagesQuery $query
     * @return array Paginated messages data
     * @throws InvalidArgumentException If validation fails
     */
    public function execute(GetQuoteMessagesQuery $query): array
    {
        // Validate quote exists and vendor owns it
        $quote = DB::table('order_vendor_negotiations')
            ->where('uuid', $query->quoteUuid)
            ->where('vendor_id', $query->vendorId)
            ->where('tenant_id', $query->tenantId)
            ->whereNull('deleted_at')
            ->first();

        if (!$quote) {
            throw new InvalidArgumentException('Quote not found or access denied');
        }

        // Get total count
        $total = DB::table('quote_messages')
            ->where('quote_id', $quote->id)
            ->where('tenant_id', $query->tenantId)
            ->whereNull('deleted_at')
            ->count();

        // Get paginated messages with sender info
        $messages = DB::table('quote_messages as qm')
            ->leftJoin('users as u', 'qm.sender_id', '=', 'u.id')
            ->select(
                'qm.*',
                'u.name as sender_name',
                'u.email as sender_email'
            )
            ->where('qm.quote_id', $quote->id)
            ->where('qm.tenant_id', $query->tenantId)
            ->whereNull('qm.deleted_at')
            ->orderBy('qm.created_at', 'asc')
            ->offset(($query->page - 1) * $query->perPage)
            ->limit($query->perPage)
            ->get();

        // Mark unread messages from admin as read
        DB::table('quote_messages')
            ->where('quote_id', $quote->id)
            ->where('tenant_id', $query->tenantId)
            ->where('sender_type', 'admin')
            ->where('is_read', false)
            ->whereNull('deleted_at')
            ->update([
                'is_read' => true,
                'read_at' => now(),
                'updated_at' => now(),
            ]);

        return [
            'data' => $messages->map(function ($message) {
                return [
                    'id' => $message->id,
                    'uuid' => $message->uuid,
                    'quote_id' => $message->quote_id,
                    'sender_id' => $message->sender_id,
                    'sender_type' => $message->sender_type,
                    'sender' => [
                        'id' => (string) $message->sender_id,
                        'name' => $message->sender_name ?? 'Unknown',
                        'email' => $message->sender_email,
                    ],
                    'message' => $message->message,
                    'attachments' => json_decode($message->attachments, true) ?? [],
                    'is_read' => $message->is_read,
                    'read_at' => $message->read_at,
                    // Format timestamps in ISO 8601 with application timezone
                    // This ensures consistent timezone handling across frontend
                    'created_at' => $message->created_at ? 
                        \Carbon\Carbon::parse($message->created_at)->toIso8601String() : 
                        null,
                    'updated_at' => $message->updated_at ? 
                        \Carbon\Carbon::parse($message->updated_at)->toIso8601String() : 
                        null,
                ];
            })->toArray(),
            'pagination' => [
                'total' => $total,
                'per_page' => $query->perPage,
                'current_page' => $query->page,
                'last_page' => (int) ceil($total / $query->perPage),
                'from' => (($query->page - 1) * $query->perPage) + 1,
                'to' => min($query->page * $query->perPage, $total),
            ],
        ];
    }
}
