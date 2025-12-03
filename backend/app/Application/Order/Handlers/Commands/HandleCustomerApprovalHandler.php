<?php

namespace App\Application\Order\Handlers\Commands;

use App\Application\Order\UseCases\HandleCustomerApprovalUseCase;
use App\Application\Order\Commands\HandleCustomerApprovalCommand;
use App\Domain\Order\Entities\Order;

class HandleCustomerApprovalHandler
{
    public function __construct(
        private HandleCustomerApprovalUseCase $useCase
    ) {}

    public function handle(HandleCustomerApprovalCommand $command): Order
    {
        return $this->useCase->execute($command);
    }
}