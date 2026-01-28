<?php

namespace Tests\Unit\Domain\Intelligence\Services;

use Tests\TestCase;
use App\Domain\Intelligence\Services\SmartSearchService;
use App\Domain\Intelligence\Services\MachineLearningService;
use App\Domain\Intelligence\ValueObjects\SearchResultItem;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;

class SmartSearchServiceTest extends TestCase
{
    use RefreshDatabase;

    private SmartSearchService $smartSearchService;
    private MachineLearningService $mockMlService;
    private $mockOrderRepository;
    private $mockCustomerRepository;
    private $mockVendorRepository;
    private $mockProductRepository;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->mockMlService = Mockery::mock(MachineLearningService::class);
        $this->mockOrderRepository = Mockery::mock(\App\Domain\Order\Repositories\OrderRepositoryInterface::class);
        $this->mockCustomerRepository = Mockery::mock(\App\Domain\Customer\Repositories\CustomerRepositoryInterface::class);
        $this->mockVendorRepository = Mockery::mock(\App\Domain\Vendor\Repositories\VendorRepositoryInterface::class);
        $this->mockProductRepository = Mockery::mock(\App\Domain\Product\Repositories\ProductRepositoryInterface::class);
        
        $this->smartSearchService = new SmartSearchService(
            $this->mockMlService,
            $this->mockOrderRepository,
            $this->mockCustomerRepository,
            $this->mockVendorRepository,
            $this->mockProductRepository
        );
    }

    public function test_it_returns_search_result_object()
    {
        // Arrange
        $query = 'test';
        $userId = 1;

        // Mock all repositories to return empty collections
        $this->mockCustomerRepository->shouldReceive('findByTenant')->andReturn(collect([]));
        $this->mockProductRepository->shouldReceive('findByTenant')->andReturn(collect([]));
        $this->mockOrderRepository->shouldReceive('findByTenant')->andReturn(collect([]));
        $this->mockVendorRepository->shouldReceive('findByTenant')->andReturn(collect([]));

        // Act
        $result = $this->smartSearchService->search($query, $userId);

        // Assert
        $this->assertInstanceOf(\App\Domain\Intelligence\ValueObjects\SmartSearchResult::class, $result);
        $this->assertIsArray($result->getResults());
        $this->assertIsArray($result->getSuggestions());
        $this->assertIsInt($result->getTotalCount());
        $this->assertIsFloat($result->getSearchTime());
    }

    public function test_it_gets_search_suggestions()
    {
        // Arrange
        $query = 'j';
        $userId = 1;

        // Act
        $suggestions = $this->smartSearchService->getSuggestions($query, $userId);

        // Assert
        $this->assertIsArray($suggestions);
    }

    public function test_it_handles_empty_search_query()
    {
        // Arrange
        $query = '';
        $userId = 1;

        // Act
        $result = $this->smartSearchService->search($query, $userId);

        // Assert
        $this->assertInstanceOf(\App\Domain\Intelligence\ValueObjects\SmartSearchResult::class, $result);
        $this->assertEmpty($result->getResults());
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}