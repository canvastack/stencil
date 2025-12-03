<?php

namespace App\Application\Order\Handlers\Commands;

use App\Application\Order\UseCases\CompleteOrderUseCase;
use App\Application\Order\Commands\CompleteOrderCommand;
use App\Domain\Order\Entities\Order;

class CompleteOrderHandler
{
    public function __construct(
        private CompleteOrderUseCase $useCase
    ) {}

    public function handle(CompleteOrderCommand $command): Order
    {
        return $this->useCase->execute($command);
    }
}