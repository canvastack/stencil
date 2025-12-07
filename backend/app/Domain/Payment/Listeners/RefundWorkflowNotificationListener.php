<?php

namespace App\Domain\Payment\Listeners;

use App\Domain\Payment\Events\RefundRequested;
use App\Domain\Payment\Events\RefundApproved;
use App\Domain\Payment\Events\RefundRejected;
use App\Domain\Payment\Events\RefundCompleted;
use App\Domain\Payment\Events\RefundFailed;
use App\Domain\Payment\Events\RefundWorkflowEscalated;
use App\Domain\Payment\Events\RefundWorkflowStepAssigned;
use App\Domain\Payment\Services\RefundNotificationService;
use Illuminate\Events\Dispatcher;

class RefundWorkflowNotificationListener
{
    public function __construct(
        private RefundNotificationService $notificationService
    ) {}

    /**
     * Register the listeners for the subscriber
     */
    public function subscribe(Dispatcher $events): void
    {
        $events->listen(
            RefundRequested::class,
            [RefundWorkflowNotificationListener::class, 'handleRefundRequested']
        );

        $events->listen(
            RefundWorkflowStepAssigned::class,
            [RefundWorkflowNotificationListener::class, 'handleWorkflowStepAssigned']
        );

        $events->listen(
            RefundApproved::class,
            [RefundWorkflowNotificationListener::class, 'handleRefundApproved']
        );

        $events->listen(
            RefundRejected::class,
            [RefundWorkflowNotificationListener::class, 'handleRefundRejected']
        );

        $events->listen(
            RefundCompleted::class,
            [RefundWorkflowNotificationListener::class, 'handleRefundCompleted']
        );

        $events->listen(
            RefundFailed::class,
            [RefundWorkflowNotificationListener::class, 'handleRefundFailed']
        );

        $events->listen(
            RefundWorkflowEscalated::class,
            [RefundWorkflowNotificationListener::class, 'handleWorkflowEscalated']
        );
    }

    /**
     * Handle refund requested event
     */
    public function handleRefundRequested(RefundRequested $event): void
    {
        $this->notificationService->sendRefundRequestedNotification($event->refund);
    }

    /**
     * Handle workflow step assigned event
     */
    public function handleWorkflowStepAssigned(RefundWorkflowStepAssigned $event): void
    {
        $this->notificationService->sendWorkflowStepAssignedNotification(
            $event->workflow,
            $event->assignedTo,
            $event->step
        );
    }

    /**
     * Handle refund approved event
     */
    public function handleRefundApproved(RefundApproved $event): void
    {
        $this->notificationService->sendRefundApprovedNotification(
            $event->refund,
            $event->approvedBy
        );
    }

    /**
     * Handle refund rejected event
     */
    public function handleRefundRejected(RefundRejected $event): void
    {
        $this->notificationService->sendRefundRejectedNotification(
            $event->refund,
            $event->rejectedBy,
            $event->rejectionReason
        );
    }

    /**
     * Handle refund completed event
     */
    public function handleRefundCompleted(RefundCompleted $event): void
    {
        $this->notificationService->sendRefundCompletedNotification(
            $event->refund,
            $event->gatewayResponse
        );
    }

    /**
     * Handle refund failed event
     */
    public function handleRefundFailed(RefundFailed $event): void
    {
        $this->notificationService->sendRefundFailedNotification(
            $event->refund,
            $event->failureReason,
            $event->gatewayResponse
        );
    }

    /**
     * Handle workflow escalated event
     */
    public function handleWorkflowEscalated(RefundWorkflowEscalated $event): void
    {
        $this->notificationService->sendWorkflowEscalatedNotification(
            $event->workflow,
            $event->escalatedTo,
            $event->escalationReason,
            $event->originalAssignee
        );
    }
}