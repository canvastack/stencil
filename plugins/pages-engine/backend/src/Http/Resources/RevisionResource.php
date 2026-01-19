<?php

namespace Plugins\PagesEngine\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RevisionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'tenant_id' => $this->tenantId,
            'content_id' => $this->contentId,
            'revision_number' => $this->revisionNumber,
            'content_snapshot' => $this->contentSnapshot,
            'created_by' => $this->createdBy,
            'change_notes' => $this->changeNotes,
            'created_at' => $this->createdAt,
        ];
    }
}
