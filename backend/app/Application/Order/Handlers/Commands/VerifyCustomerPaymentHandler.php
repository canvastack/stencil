<?php

namespace App\Application\Order\Handlers\Commands;

use App\Application\Order\UseCases\VerifyCustomerPaymentUseCase;
use App\Application\Order\Commands\VerifyCustomerPaymentCommand;
use App\Domain\Order\Entities\Order;

class VerifyCustomerPaymentHandler
{
    public function __construct(
        private VerifyCustomerPaymentUseCase $useCase
    ) {}

    public function handle(VerifyCustomerPaymentCommand $command): Order
    {
        return $this->useCase->execute($command);
    }
}