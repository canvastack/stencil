<?php

namespace App\Domain\Order\Events;

use App\Infrastructure\Persistence\Eloquent\Models\RefundRequest;
use App\Domain\Order\ValueObjects\RefundCalculation;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Event fired when a new refund request is created.
 */
class RefundRequestCreated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public RefundRequest $refundRequest,
        public RefundCalculation $calculation
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
            'order_id' => $this->refundRequest->order_id,
            'tenant_id' => $this->refundRequest->tenant_id,
            'refund_reason' => $this->refundRequest->refund_reason,
            'refund_amount' => $this->calculation->refundableToCustomer,
            'fault_party' => $this->calculation->faultParty,
            'risk_level' => $this->calculation->getRiskLevel(),
            'requires_high_approval' => $this->calculation->requiresHighLevelApproval(),
            'requested_by' => $this->refundRequest->requested_by,
            'created_at' => $this->refundRequest->created_at->toISOString()
        ];
    }
}