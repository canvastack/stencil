<?php

namespace Plugins\PagesEngine\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'content_id' => $this->contentId,
            'parent_id' => $this->parentId,
            'author_id' => $this->authorId,
            'author_name' => $this->authorName,
            'author_email' => $this->authorEmail,
            'comment_text' => $this->commentText,
            'status' => $this->status,
            'user_ip' => $this->userIp,
            'user_agent' => $this->userAgent,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt,
        ];
    }
}
