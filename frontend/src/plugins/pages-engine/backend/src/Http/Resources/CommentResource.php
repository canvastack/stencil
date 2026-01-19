<?php

namespace Plugins\PagesEngine\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->resource->uuid,
            'content_id' => $this->resource->contentId,
            'parent_id' => $this->resource->parentId,
            'author_id' => $this->resource->authorId,
            'author_name' => $this->resource->authorName,
            'author_email' => $this->resource->authorEmail,
            'comment_text' => $this->resource->commentText,
            'status' => $this->resource->status,
            'user_ip' => $this->resource->userIp,
            'user_agent' => $this->resource->userAgent,
            'created_at' => $this->resource->createdAt,
            'updated_at' => $this->resource->updatedAt,
        ];
    }
}
