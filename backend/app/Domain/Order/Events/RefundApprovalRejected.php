<?php

namespace App\Domain\Order\Events;

use App\Infrastructure\Persistence\Eloquent\Models\{RefundRequest, RefundApproval};
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Event fired when a refund approval is rejected.
 */
class RefundApprovalRejected
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public RefundRequest $refundRequest,
        public RefundApproval $approval
    ) {
        //
    }

    /**
     * Get event data for broadcasting or logging.
     */
    public function getEventData(): array
    {
        return [
            'refund_request_id' => $this->refundRequest->id,
            'request_number' => $this->refundRequest->request_number,
            'approval_id' => $this->approval->id,
            'approval_level' => $this->approval->approval_level,
            'rejected_by' => $this->approval->approver_id,
            'rejection_reason' => $this->approval->decision_notes,
            'current_status' => $this->refundRequest->status,
            'decided_at' => $this->approval->decided_at->toISOString()
        ];
    }
}