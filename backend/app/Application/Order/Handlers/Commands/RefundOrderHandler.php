<?php

namespace App\Application\Order\Handlers\Commands;

use App\Application\Order\UseCases\RefundOrderUseCase;
use App\Application\Order\Commands\RefundOrderCommand;
use App\Domain\Order\Entities\Order;

class RefundOrderHandler
{
    public function __construct(
        private RefundOrderUseCase $useCase
    ) {}

    public function handle(RefundOrderCommand $command): Order
    {
        return $this->useCase->execute($command);
    }
}