<?php

namespace App\Application\Order\Services;

use App\Application\Order\UseCases\CreatePurchaseOrderUseCase;
use App\Application\Order\UseCases\AssignVendorUseCase;
use App\Application\Order\UseCases\NegotiateWithVendorUseCase;
use App\Application\Order\UseCases\CreateCustomerQuoteUseCase;
use App\Application\Order\UseCases\HandleCustomerApprovalUseCase;
use App\Application\Order\UseCases\VerifyCustomerPaymentUseCase;
use App\Application\Order\UseCases\UpdateProductionProgressUseCase;
use App\Application\Order\UseCases\RequestFinalPaymentUseCase;
use App\Application\Order\UseCases\ShipOrderUseCase;
use App\Application\Order\UseCases\CompleteOrderUseCase;
use App\Application\Order\UseCases\CancelOrderUseCase;
use App\Application\Order\UseCases\RefundOrderUseCase;
use App\Application\Order\Commands\CreatePurchaseOrderCommand;
use App\Application\Order\Commands\AssignVendorCommand;
use App\Application\Order\Commands\NegotiateWithVendorCommand;
use App\Application\Order\Commands\CreateCustomerQuoteCommand;
use App\Application\Order\Commands\HandleCustomerApprovalCommand;
use App\Application\Order\Commands\VerifyCustomerPaymentCommand;
use App\Application\Order\Commands\UpdateProductionProgressCommand;
use App\Application\Order\Commands\RequestFinalPaymentCommand;
use App\Application\Order\Commands\ShipOrderCommand;
use App\Application\Order\Commands\CompleteOrderCommand;
use App\Application\Order\Commands\CancelOrderCommand;
use App\Application\Order\Commands\RefundOrderCommand;
use App\Domain\Order\Entities\Order;
use App\Domain\Order\Repositories\OrderRepositoryInterface;
use Illuminate\Database\ConnectionInterface;
use InvalidArgumentException;

class OrderApplicationService
{
    public function __construct(
        private CreatePurchaseOrderUseCase $createPurchaseOrderUseCase,
        private AssignVendorUseCase $assignVendorUseCase,
        private NegotiateWithVendorUseCase $negotiateWithVendorUseCase,
        private CreateCustomerQuoteUseCase $createCustomerQuoteUseCase,
        private HandleCustomerApprovalUseCase $handleCustomerApprovalUseCase,
        private VerifyCustomerPaymentUseCase $verifyCustomerPaymentUseCase,
        private UpdateProductionProgressUseCase $updateProductionProgressUseCase,
        private RequestFinalPaymentUseCase $requestFinalPaymentUseCase,
        private ShipOrderUseCase $shipOrderUseCase,
        private CompleteOrderUseCase $completeOrderUseCase,
        private CancelOrderUseCase $cancelOrderUseCase,
        private RefundOrderUseCase $refundOrderUseCase,
        private OrderRepositoryInterface $orderRepository,
        private ConnectionInterface $database
    ) {}

    public function createOrder(CreatePurchaseOrderCommand $command): Order
    {
        return $this->database->transaction(
            fn() => $this->createPurchaseOrderUseCase->execute($command)
        );
    }

    public function assignVendor(AssignVendorCommand $command): Order
    {
        return $this->database->transaction(
            fn() => $this->assignVendorUseCase->execute($command)
        );
    }

    public function negotiateWithVendor(NegotiateWithVendorCommand $command): Order
    {
        return $this->database->transaction(
            fn() => $this->negotiateWithVendorUseCase->execute($command)
        );
    }

    public function createCustomerQuote(CreateCustomerQuoteCommand $command): Order
    {
        return $this->database->transaction(
            fn() => $this->createCustomerQuoteUseCase->execute($command)
        );
    }

    public function handleCustomerApproval(HandleCustomerApprovalCommand $command): Order
    {
        return $this->database->transaction(
            fn() => $this->handleCustomerApprovalUseCase->execute($command)
        );
    }

    public function verifyCustomerPayment(VerifyCustomerPaymentCommand $command): Order
    {
        return $this->database->transaction(
            fn() => $this->verifyCustomerPaymentUseCase->execute($command)
        );
    }

    public function updateProductionProgress(UpdateProductionProgressCommand $command): Order
    {
        return $this->database->transaction(
            fn() => $this->updateProductionProgressUseCase->execute($command)
        );
    }

    public function requestFinalPayment(RequestFinalPaymentCommand $command): Order
    {
        return $this->database->transaction(
            fn() => $this->requestFinalPaymentUseCase->execute($command)
        );
    }

    public function shipOrder(ShipOrderCommand $command): Order
    {
        return $this->database->transaction(
            fn() => $this->shipOrderUseCase->execute($command)
        );
    }

    public function completeOrder(CompleteOrderCommand $command): Order
    {
        return $this->database->transaction(
            fn() => $this->completeOrderUseCase->execute($command)
        );
    }

    public function cancelOrder(CancelOrderCommand $command): Order
    {
        return $this->database->transaction(
            fn() => $this->cancelOrderUseCase->execute($command)
        );
    }

    public function refundOrder(RefundOrderCommand $command): Order
    {
        return $this->database->transaction(
            fn() => $this->refundOrderUseCase->execute($command)
        );
    }
}