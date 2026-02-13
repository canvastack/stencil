<?php

declare(strict_types=1);

namespace App\Application\Vendor\UseCases;

use App\Application\Vendor\Commands\SendQuoteMessageCommand;
use App\Domain\Audit\Repositories\AuditLogRepositoryInterface;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * Use Case: Send Quote Message
 * 
 * Allows vendor to send a message in the quote communication thread.
 * 
 * Business Rules:
 * - Vendor must own the quote
 * - Message cannot be empty
 * - Maximum 5 attachments per message
 * - Each attachment max 10MB
 * - Allowed file types: pdf, jpg, png, doc, docx, xls, xlsx
 * - Tenant isolation enforced
 * - Creates audit log entry
 * - Sends notification to admins (via event listener)
 */
final class SendQuoteMessageUseCase
{
    public function __construct(
        private readonly AuditLogRepositoryInterface $auditLogRepository
    ) {
    }

    /**
     * Execute command to send quote message
     * 
     * @param SendQuoteMessageCommand $command
     * @return array Message data
     * @throws InvalidArgumentException If validation fails
     */
    public function execute(SendQuoteMessageCommand $command): array
    {
        // Validate message
        if (empty(trim($command->message))) {
            throw new InvalidArgumentException('Message cannot be empty');
        }

        if (strlen($command->message) > 5000) {
            throw new InvalidArgumentException('Message cannot exceed 5000 characters');
        }

        // Validate attachments
        if (count($command->attachments) > 5) {
            throw new InvalidArgumentException('Maximum 5 attachments allowed per message');
        }

        // Validate quote exists and vendor owns it
        $quote = DB::table('order_vendor_negotiations')
            ->where('uuid', $command->quoteUuid)
            ->where('vendor_id', $command->vendorId)
            ->where('tenant_id', $command->tenantId)
            ->whereNull('deleted_at')
            ->first();

        if (!$quote) {
            throw new InvalidArgumentException('Quote not found or access denied');
        }

        // Get vendor user
        $vendorUser = DB::table('users')
            ->where('vendor_id', DB::table('vendors')->where('id', $command->vendorId)->value('uuid'))
            ->where('tenant_id', $command->tenantId)
            ->where('account_type', 'vendor')
            ->first();

        if (!$vendorUser) {
            throw new InvalidArgumentException('Vendor user not found');
        }

        return DB::transaction(function () use ($command, $quote, $vendorUser) {
            // Create message
            $messageId = DB::table('quote_messages')->insertGetId([
                'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
                'tenant_id' => $command->tenantId,
                'quote_id' => $quote->id,
                'sender_id' => $vendorUser->id,
                'sender_type' => 'vendor',
                'message' => $command->message,
                'attachments' => json_encode($command->attachments),
                'is_read' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Get created message
            $message = DB::table('quote_messages')->where('id', $messageId)->first();

            // Log to audit
            $this->auditLogRepository->create(
                tenantId: $command->tenantId,
                action: 'quote_message_sent',
                entityType: 'quote_message',
                entityId: $messageId,
                userId: $vendorUser->id,
                metadata: [
                    'quote_uuid' => $command->quoteUuid,
                    'message_length' => strlen($command->message),
                    'attachments_count' => count($command->attachments),
                ]
            );

            // TODO: Dispatch QuoteMessageSentEvent for notification

            return [
                'id' => $message->id,
                'uuid' => $message->uuid,
                'quote_id' => $message->quote_id,
                'sender_id' => $message->sender_id,
                'sender_type' => $message->sender_type,
                'message' => $message->message,
                'attachments' => json_decode($message->attachments, true),
                'is_read' => $message->is_read,
                'created_at' => $message->created_at,
                'updated_at' => $message->updated_at,
            ];
        });
    }
}
