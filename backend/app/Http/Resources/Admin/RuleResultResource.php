<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RuleResultResource extends JsonResource
{
    private float $executionTime;
    private string $ruleCode;

    public function __construct($resource, float $executionTime = 0, string $ruleCode = '')
    {
        parent::__construct($resource);
        $this->executionTime = $executionTime;
        $this->ruleCode = $ruleCode;
    }

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'ruleCode' => $this->ruleCode,
            'isValid' => $this->isValid(),
            'errors' => $this->getErrors(),
            'warnings' => $this->getWarnings(),
            'metadata' => $this->getMetadata(),
            'executionTime' => $this->executionTime,
            'timestamp' => now()->toISOString()
        ];
    }
}