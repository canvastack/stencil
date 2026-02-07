<?php

declare(strict_types=1);

namespace App\Infrastructure\Presentation\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Domain\Quote\Entities\Message;
use App\Infrastructure\Persistence\Eloquent\Models\User;

/**
 * Message Resource
 * 
 * Transforms Message domain entity into JSON API response format.
 * Includes sender information and attachment URLs.
 */
class MessageResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param Request $request
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Message $message */
        $message = $this->resource;

        // Get sender information
        $sender = User::find($message->getSenderId());

        // Process attachments to include download URLs
        $attachments = array_map(function ($attachment) {
            $attachmentData = [
                'name' => $attachment['name'],
                'path' => $attachment['path'],
                'size' => $attachment['size'],
                'mime_type' => $attachment['mime_type'],
            ];
            
            // Only add URL if route exists
            if (\Illuminate\Support\Facades\Route::has('api.attachments.download')) {
                $attachmentData['url'] = route('api.attachments.download', [
                    'path' => base64_encode($attachment['path'])
                ]);
            }
            
            return $attachmentData;
        }, $message->getAttachments());

        return [
            'uuid' => $message->getUuid(),
            'quote_id' => $message->getQuoteId(),
            'sender_id' => $message->getSenderId(),
            'sender' => $sender ? [
                'uuid' => $sender->uuid,
                'name' => $sender->name,
                'email' => $sender->email,
                'role' => $sender->roles->first()?->name ?? null
            ] : null,
            'message' => $message->getMessage(),
            'attachments' => $attachments,
            'read_at' => $message->getReadAt()?->format('Y-m-d H:i:s'),
            'created_at' => $message->getCreatedAt()->format('Y-m-d H:i:s'),
            'updated_at' => $message->getUpdatedAt()->format('Y-m-d H:i:s'),
        ];
    }
}

