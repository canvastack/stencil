<?php

namespace App\Domain\Payment\Events;

use App\Models\RefundApprovalWorkflow;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RefundWorkflowStepCompleted
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public RefundApprovalWorkflow $workflow,
        public string $decision,
        public int $decidedBy
    ) {}
}