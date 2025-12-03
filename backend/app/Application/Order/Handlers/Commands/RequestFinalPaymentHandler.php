<?php

namespace App\Application\Order\Handlers\Commands;

use App\Application\Order\UseCases\RequestFinalPaymentUseCase;
use App\Application\Order\Commands\RequestFinalPaymentCommand;
use App\Domain\Order\Entities\Order;

class RequestFinalPaymentHandler
{
    public function __construct(
        private RequestFinalPaymentUseCase $useCase
    ) {}

    public function handle(RequestFinalPaymentCommand $command): Order
    {
        return $this->useCase->execute($command);
    }
}