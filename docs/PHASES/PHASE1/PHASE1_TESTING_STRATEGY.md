# 🧪 Phase 1: Testing Strategy & Quality Assurance

> **Comprehensive Testing Guide for Backend & Frontend**  
> **Companion Document to**: PHASE1_COMPLETE_ROADMAP.md

---

## 🎯 **TESTING PHILOSOPHY**

### **Test-Driven Development (TDD)**
```
1. Write failing test FIRST
2. Write minimal code to pass test
3. Refactor code
4. Repeat
```

### **Coverage Requirements**

```yaml
MINIMUM TEST COVERAGE:
  Domain Layer: 100%
  Application Layer (Use Cases): 100%
  API Endpoints: 90%+
  Critical Business Flows: 100%
  Frontend Components: 80%+
```

---

## 🔬 **BACKEND TESTING**

### **1. Unit Tests (Domain Layer)**

**Purpose**: Test pure business logic in isolation

**Location**: `tests/Unit/Domain/`

**Example: Testing PurchaseOrder Entity**

```php
<?php

namespace Tests\Unit\Domain\Order;

use Tests\TestCase;
use App\Domain\Order\Entity\PurchaseOrder;
use App\Domain\Order\Enum\OrderStatus;
use App\Domain\Order\Exception\InvalidOrderTransitionException;
use App\Domain\Shared\ValueObject\Money;

class PurchaseOrderTest extends TestCase
{
    public function test_can_create_purchase_order(): void
    {
        $order = new PurchaseOrder(
            orderCode: 'PO-2024-001',
            customerId: 'customer-001',
            status: OrderStatus::New,
            totalAmount: Money::fromAmount(1000000, 'IDR')
        );
        
        $this->assertEquals('PO-2024-001', $order->getOrderCode());
        $this->assertEquals(OrderStatus::New, $order->getStatus());
        $this->assertTrue($order->getTotalAmount()->equals(Money::fromAmount(1000000, 'IDR')));
    }
    
    public function test_can_transition_to_valid_status(): void
    {
        $order = new PurchaseOrder(
            orderCode: 'PO-2024-001',
            customerId: 'customer-001',
            status: OrderStatus::New
        );
        
        $order->transitionTo(OrderStatus::SourcingVendor);
        
        $this->assertEquals(OrderStatus::SourcingVendor, $order->getStatus());
    }
    
    public function test_cannot_transition_to_invalid_status(): void
    {
        $this->expectException(InvalidOrderTransitionException::class);
        
        $order = new PurchaseOrder(
            orderCode: 'PO-2024-001',
            customerId: 'customer-001',
            status: OrderStatus::New
        );
        
        // Cannot go directly from New to Completed
        $order->transitionTo(OrderStatus::Completed);
    }
    
    public function test_price_calculator_service(): void
    {
        $calculator = new \App\Domain\Order\Service\PriceCalculatorService();
        
        $vendorPrice = Money::fromAmount(1000000, 'IDR');
        $markupPercentage = 50.0;
        $ppn = Money::fromAmount(150000, 'IDR');
        
        $customerPrice = $calculator->calculateCustomerPrice(
            $vendorPrice,
            $markupPercentage,
            $ppn
        );
        
        // 1,000,000 + 50% + 150,000 = 1,650,000
        $this->assertTrue($customerPrice->equals(Money::fromAmount(1650000, 'IDR')));
    }
}
```

---

### **2. Application Tests (Use Cases)**

**Purpose**: Test orchestration logic and interactions

**Location**: `tests/Unit/Application/`

**Example: Testing CreatePurchaseOrderUseCase**

```php
<?php

namespace Tests\Unit\Application\Order;

use Tests\TestCase;
use App\Application\Order\UseCase\CreatePurchaseOrderUseCase;
use App\Application\Order\Command\CreatePurchaseOrderCommand;
use App\Domain\Order\Repository\PurchaseOrderRepositoryInterface;
use App\Domain\Order\Service\OrderCodeGeneratorService;
use App\Domain\Customer\Repository\CustomerRepositoryInterface;
use Mockery;

class CreatePurchaseOrderUseCaseTest extends TestCase
{
    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
    
    public function test_can_create_purchase_order(): void
    {
        // Mock dependencies
        $orderRepository = Mockery::mock(PurchaseOrderRepositoryInterface::class);
        $customerRepository = Mockery::mock(CustomerRepositoryInterface::class);
        $codeGenerator = Mockery::mock(OrderCodeGeneratorService::class);
        
        // Setup expectations
        $codeGenerator->shouldReceive('generate')
            ->once()
            ->andReturn('PO-2024-001');
        
        $customerRepository->shouldReceive('findById')
            ->with('customer-001')
            ->once()
            ->andReturn(new \App\Domain\Customer\Entity\Customer(
                id: 'customer-001',
                name: 'Test Customer',
                email: 'test@example.com'
            ));
        
        $orderRepository->shouldReceive('save')
            ->once()
            ->andReturn(true);
        
        // Create use case
        $useCase = new CreatePurchaseOrderUseCase(
            $orderRepository,
            $customerRepository,
            $codeGenerator
        );
        
        // Execute
        $command = new CreatePurchaseOrderCommand(
            customerId: 'customer-001',
            orderDetails: [
                'product' => 'Plakat Premium',
                'quantity' => 10
            ],
            productionType: 'vendor'
        );
        
        $order = $useCase->execute($command);
        
        // Assertions
        $this->assertEquals('PO-2024-001', $order->getOrderCode());
        $this->assertEquals('customer-001', $order->getCustomerId());
    }
    
    public function test_throws_exception_when_customer_not_found(): void
    {
        $this->expectException(\App\Domain\Customer\Exception\CustomerNotFoundException::class);
        
        $orderRepository = Mockery::mock(PurchaseOrderRepositoryInterface::class);
        $customerRepository = Mockery::mock(CustomerRepositoryInterface::class);
        $codeGenerator = Mockery::mock(OrderCodeGeneratorService::class);
        
        $customerRepository->shouldReceive('findById')
            ->with('non-existent')
            ->once()
            ->andReturn(null);
        
        $useCase = new CreatePurchaseOrderUseCase(
            $orderRepository,
            $customerRepository,
            $codeGenerator
        );
        
        $command = new CreatePurchaseOrderCommand(
            customerId: 'non-existent',
            orderDetails: [],
            productionType: 'vendor'
        );
        
        $useCase->execute($command);
    }
}
```

---

### **3. Feature Tests (API Endpoints)**

**Purpose**: Test complete HTTP request/response cycles

**Location**: `tests/Feature/Api/`

**Example: Testing Product API**

```php
<?php

namespace Tests\Feature\Api;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use App\Models\User;
use App\Models\Tenant;
use App\Infrastructure\Persistence\Eloquent\Model\ProductModel;

class ProductApiTest extends TestCase
{
    use RefreshDatabase;
    
    protected Tenant $tenant;
    protected User $user;
    
    protected function setUp(): void
    {
        parent::setUp();
        
        // Create tenant
        $this->tenant = Tenant::factory()->create([
            'domain' => 'test.stencil.com',
        ]);
        
        // Initialize tenancy
        tenancy()->initialize($this->tenant);
        
        // Create user
        $this->user = User::factory()->create();
        
        // Assign user to tenant with admin role
        $this->user->tenants()->attach($this->tenant->id, [
            'role_name' => 'admin',
            'is_owner' => true,
        ]);
        
        // Authenticate
        Sanctum::actingAs($this->user);
    }
    
    public function test_can_list_products(): void
    {
        // Create products in tenant schema
        ProductModel::factory()->count(5)->create();
        
        $response = $this->getJson('/api/v1/admin/products');
        
        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'slug',
                        'base_price',
                        'is_public',
                    ]
                ],
                'meta' => [
                    'current_page',
                    'per_page',
                    'total',
                ],
            ])
            ->assertJsonCount(5, 'data');
    }
    
    public function test_can_create_product(): void
    {
        $productData = [
            'name' => 'Test Product',
            'slug' => 'test-product',
            'description' => 'Test description',
            'base_price' => 100000,
            'is_public' => true,
        ];
        
        $response = $this->postJson('/api/v1/admin/products', $productData);
        
        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'name',
                    'slug',
                    'base_price',
                ]
            ]);
        
        $this->assertDatabaseHas('products', [
            'name' => 'Test Product',
            'slug' => 'test-product',
        ]);
    }
    
    public function test_validation_fails_for_invalid_data(): void
    {
        $response = $this->postJson('/api/v1/admin/products', [
            'name' => '', // Required field empty
        ]);
        
        $response->assertStatus(422)
            ->assertJsonStructure([
                'error' => [
                    'code',
                    'message',
                    'details',
                ]
            ])
            ->assertJsonValidationErrors(['name']);
    }
    
    public function test_can_update_product(): void
    {
        $product = ProductModel::factory()->create([
            'name' => 'Original Name',
        ]);
        
        $response = $this->putJson("/api/v1/admin/products/{$product->id}", [
            'name' => 'Updated Name',
        ]);
        
        $response->assertStatus(200);
        
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'name' => 'Updated Name',
        ]);
    }
    
    public function test_can_delete_product(): void
    {
        $product = ProductModel::factory()->create();
        
        $response = $this->deleteJson("/api/v1/admin/products/{$product->id}");
        
        $response->assertStatus(204);
        
        $this->assertSoftDeleted('products', [
            'id' => $product->id,
        ]);
    }
    
    public function test_requires_authentication(): void
    {
        Sanctum::actingAs(null); // Remove auth
        
        $response = $this->getJson('/api/v1/admin/products');
        
        $response->assertStatus(401);
    }
}
```

---

### **4. Multi-Tenancy Isolation Tests**

**Purpose**: Ensure absolute tenant data isolation

**Location**: `tests/Feature/MultiTenancy/`

**Example: Critical Tenant Isolation Test**

```php
<?php

namespace Tests\Feature\MultiTenancy;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\Tenant;
use App\Infrastructure\Persistence\Eloquent\Model\ProductModel;
use App\Infrastructure\Persistence\Eloquent\Model\PurchaseOrderModel;

class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;
    
    public function test_tenant_cannot_access_another_tenants_products(): void
    {
        // Create two tenants
        $tenant1 = Tenant::factory()->create(['domain' => 'tenant1.test']);
        $tenant2 = Tenant::factory()->create(['domain' => 'tenant2.test']);
        
        // Switch to tenant1 and create product
        tenancy()->initialize($tenant1);
        $product1 = ProductModel::factory()->create([
            'name' => 'Tenant 1 Product',
        ]);
        
        // Switch to tenant2 and create product
        tenancy()->initialize($tenant2);
        $product2 = ProductModel::factory()->create([
            'name' => 'Tenant 2 Product',
        ]);
        
        // Verify isolation
        $products = ProductModel::all();
        
        $this->assertCount(1, $products);
        $this->assertEquals('Tenant 2 Product', $products->first()->name);
        $this->assertNotContains($product1->id, $products->pluck('id'));
    }
    
    public function test_tenant_cannot_access_another_tenants_orders(): void
    {
        $tenant1 = Tenant::factory()->create();
        $tenant2 = Tenant::factory()->create();
        
        tenancy()->initialize($tenant1);
        $order1 = PurchaseOrderModel::factory()->create();
        
        tenancy()->initialize($tenant2);
        $order2 = PurchaseOrderModel::all();
        
        $this->assertCount(0, $order2);
        $this->assertNotContains($order1->id, $order2->pluck('id'));
    }
    
    public function test_cross_tenant_queries_are_impossible(): void
    {
        $tenant1 = Tenant::factory()->create();
        $tenant2 = Tenant::factory()->create();
        
        tenancy()->initialize($tenant1);
        $product1 = ProductModel::factory()->create();
        
        tenancy()->initialize($tenant2);
        
        // Try to fetch tenant1's product while in tenant2 context
        $product = ProductModel::find($product1->id);
        
        $this->assertNull($product);
    }
}
```

---

## 🎨 **FRONTEND TESTING**

### **1. Component Unit Tests**

**Location**: `src/**/__tests__/`

**Example: Testing ProductCard Component**

```typescript
// src/components/ProductCard.test.tsx
import { render, screen } from '@testing-library/react';
import { ProductCard } from './ProductCard';

describe('ProductCard', () => {
  const mockProduct = {
    id: 'prod-001',
    name: 'Test Product',
    slug: 'test-product',
    base_price: 100000,
    currency: 'IDR',
    thumbnail_url: '/test.jpg',
    is_public: true,
  };
  
  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('Rp 100.000')).toBeInTheDocument();
  });
  
  it('displays product image', () => {
    render(<ProductCard product={mockProduct} />);
    
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', '/test.jpg');
    expect(image).toHaveAttribute('alt', 'Test Product');
  });
  
  it('handles missing price gracefully', () => {
    const productWithoutPrice = { ...mockProduct, base_price: null };
    render(<ProductCard product={productWithoutPrice} />);
    
    expect(screen.getByText('Price on Request')).toBeInTheDocument();
  });
});
```

---

### **2. Integration Tests (React Query)**

```typescript
// src/hooks/useProducts.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProducts } from './useProducts';
import { productApi } from '@/lib/api/products';

jest.mock('@/lib/api/products');

describe('useProducts', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  
  it('fetches products successfully', async () => {
    const mockProducts = {
      data: [
        { id: '1', name: 'Product 1' },
        { id: '2', name: 'Product 2' },
      ],
      meta: { total: 2 },
    };
    
    (productApi.getAll as jest.Mock).mockResolvedValue(mockProducts);
    
    const { result } = renderHook(() => useProducts(), { wrapper });
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    expect(result.current.data).toEqual(mockProducts);
  });
  
  it('handles API errors', async () => {
    (productApi.getAll as jest.Mock).mockRejectedValue(new Error('API Error'));
    
    const { result } = renderHook(() => useProducts(), { wrapper });
    
    await waitFor(() => expect(result.current.isError).toBe(true));
    
    expect(result.current.error).toBeDefined();
  });
});
```

---

### **3. E2E Tests (Playwright/Cypress)**

**Location**: `e2e/`

**Example: Product Management Flow**

```typescript
// e2e/product-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Product Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'admin@test.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/admin/dashboard');
  });
  
  test('can create a new product', async ({ page }) => {
    // Navigate to products
    await page.click('text=Products');
    await page.waitForURL('/admin/products');
    
    // Click create button
    await page.click('text=Create Product');
    
    // Fill form
    await page.fill('[name="name"]', 'E2E Test Product');
    await page.fill('[name="slug"]', 'e2e-test-product');
    await page.fill('[name="description"]', 'This is a test product');
    await page.fill('[name="base_price"]', '150000');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Verify success
    await expect(page.locator('text=Product created successfully')).toBeVisible();
    await expect(page.locator('text=E2E Test Product')).toBeVisible();
  });
  
  test('validates required fields', async ({ page }) => {
    await page.goto('/admin/products/create');
    
    // Submit empty form
    await page.click('button[type="submit"]');
    
    // Check for validation errors
    await expect(page.locator('text=Name is required')).toBeVisible();
  });
  
  test('can edit existing product', async ({ page }) => {
    await page.goto('/admin/products');
    
    // Click edit on first product
    await page.click('[data-testid="edit-product"]:first-child');
    
    // Update name
    await page.fill('[name="name"]', 'Updated Product Name');
    await page.click('button[type="submit"]');
    
    // Verify update
    await expect(page.locator('text=Product updated successfully')).toBeVisible();
    await expect(page.locator('text=Updated Product Name')).toBeVisible();
  });
  
  test('can delete product', async ({ page }) => {
    await page.goto('/admin/products');
    
    // Click delete
    await page.click('[data-testid="delete-product"]:first-child');
    
    // Confirm deletion
    await page.click('text=Confirm');
    
    // Verify deletion
    await expect(page.locator('text=Product deleted successfully')).toBeVisible();
  });
});
```

---

## 🚀 **RUNNING TESTS**

### **Backend Tests**

```bash
# Run all tests
php artisan test

# Run specific test suite
php artisan test tests/Unit
php artisan test tests/Feature

# Run specific test file
php artisan test tests/Unit/Domain/Order/PurchaseOrderTest.php

# Run with coverage
php artisan test --coverage

# Run with coverage minimum
php artisan test --coverage --min=80
```

---

### **Frontend Tests**

```bash
# Run all tests
npm run test

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# E2E tests
npm run test:e2e

# E2E tests in headed mode
npm run test:e2e:headed
```

---

## 📊 **CI/CD PIPELINE**

### **GitHub Actions Workflow**

```yaml
# .github/workflows/tests.yml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.1'
          extensions: pgsql, redis
      
      - name: Install Dependencies
        run: composer install --no-interaction
      
      - name: Run Tests
        env:
          DB_CONNECTION: pgsql
          DB_HOST: postgres
          DB_DATABASE: testing
          REDIS_HOST: redis
        run: php artisan test --coverage --min=80
  
  frontend-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Dependencies
        run: npm ci
      
      - name: Run Tests
        run: npm run test:coverage
      
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
```

---

## ✅ **QUALITY GATES**

```yaml
REQUIRED TO PASS:
  - All unit tests must pass
  - All feature tests must pass
  - Tenant isolation tests must pass
  - Code coverage >= 80%
  - No PHPStan/Psalm errors (level 8)
  - No ESLint errors
  - No TypeScript errors
  - E2E critical paths must pass
```

---

**All Phase 1 Documentation Complete!**

