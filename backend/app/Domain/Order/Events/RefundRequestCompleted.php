<?php

namespace App\Domain\Order\Events;

use App\Infrastructure\Persistence\Eloquent\Models\{RefundRequest, RefundApproval};
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Event fired when a refund request completes all approvals and is ready for processing.
 */
class RefundRequestCompleted
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public RefundRequest $refundRequest,
        public RefundApproval $finalApproval
    ) {
        //
    }

    /**
     * Get event data for broadcasting or logging.
     */
    public function getEventData(): array
    {
        $calculation = \App\Domain\Order\ValueObjects\RefundCalculation::fromArray($this->refundRequest->calculation);

        return [
            'refund_request_id' => $this->refundRequest->id,
            'request_number' => $this->refundRequest->request_number,
            'order_id' => $this->refundRequest->order_id,
            'final_approval_id' => $this->finalApproval->id,
            'final_approved_by' => $this->finalApproval->approver_id,
            'refund_amount' => $calculation->refundableToCustomer,
            'company_impact' => $calculation->getNetCompanyImpact(),
            'vendor_recoverable' => $calculation->vendorRecoverable,
            'insurance_cover' => $calculation->insuranceCover,
            'approved_at' => $this->refundRequest->approved_at->toISOString(),
            'ready_for_processing' => true
        ];
    }
}