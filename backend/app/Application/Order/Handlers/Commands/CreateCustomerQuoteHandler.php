<?php

namespace App\Application\Order\Handlers\Commands;

use App\Application\Order\UseCases\CreateCustomerQuoteUseCase;
use App\Application\Order\Commands\CreateCustomerQuoteCommand;
use App\Domain\Order\Entities\Order;

class CreateCustomerQuoteHandler
{
    public function __construct(
        private CreateCustomerQuoteUseCase $useCase
    ) {}

    public function handle(CreateCustomerQuoteCommand $command): Order
    {
        return $this->useCase->execute($command);
    }
}