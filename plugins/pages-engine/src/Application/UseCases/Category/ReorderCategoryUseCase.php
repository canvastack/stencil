<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\UseCases\Category;

use Plugins\PagesEngine\Application\Commands\ReorderCategoryCommand;
use Plugins\PagesEngine\Domain\Repositories\ContentCategoryRepositoryInterface;
use InvalidArgumentException;

final class ReorderCategoryUseCase
{
    public function __construct(
        private readonly ContentCategoryRepositoryInterface $categoryRepository
    ) {}

    public function execute(ReorderCategoryCommand $command): void
    {
        foreach ($command->categoryOrders as $order) {
            if (!isset($order['id']) || !isset($order['sort_order'])) {
                throw new InvalidArgumentException("Invalid category order data");
            }

            $category = $this->categoryRepository->findById($order['id']);
            
            if (!$category) {
                continue;
            }

            if (!$category->getTenantId()->equals($command->tenantId)) {
                throw new InvalidArgumentException("Unauthorized access to category");
            }

            $category->reorder((int) $order['sort_order']);
            $this->categoryRepository->save($category);
        }
    }
}
