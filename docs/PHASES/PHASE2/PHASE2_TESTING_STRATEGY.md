# 🧪 PHASE 2 TESTING STRATEGY

**Comprehensive Testing Plan for Enhancement Features**

> **Version**: 1.0  
> **Status**: ✅ Testing Strategy Complete  
> **Test Philosophy**: Test-Driven Development (TDD)  
> **Coverage Target**: Domain 100%, Use Cases 100%, API 90%+

---

## 📋 TABLE OF CONTENTS

1. [Testing Philosophy & Approach](#testing-philosophy--approach)
2. [Test Coverage Requirements](#test-coverage-requirements)
3. [Unit Testing Strategy](#unit-testing-strategy)
4. [Integration Testing Strategy](#integration-testing-strategy)
5. [Security Testing (CRITICAL)](#security-testing-critical)
6. [Performance Testing](#performance-testing)
7. [E2E Testing](#e2e-testing)
8. [CI/CD Integration](#cicd-integration)

---

## TESTING PHILOSOPHY & APPROACH

### TDD (Test-Driven Development)

**Phase 2 MUST follow TDD**:

1. **Write Test First**: Before implementing any feature, write the test
2. **Red**: Run test → It fails (expected)
3. **Green**: Write minimum code to make test pass
4. **Refactor**: Improve code while keeping tests green
5. **Repeat**: Continue for next feature

**Benefits for Phase 2**:
- Ensures 100% coverage for Domain & Use Cases
- Catches bugs early (especially security vulnerabilities)
- Self-documenting code (tests show how to use features)
- Confidence in refactoring (critical for package system)

### Testing Pyramid

```
        /\
       /  \
      / E2E\         10 tests (Happy paths + critical flows)
     /______\
    /        \
   /Integration\    50 tests (API endpoints + flows)
  /______________\
 /                \
/   Unit Tests     \ 200+ tests (Domain + Use Cases)
/____________________\
```

**Distribution**:
- **70%** Unit Tests (Domain + Use Cases)
- **20%** Integration Tests (API + Feature tests)
- **10%** E2E Tests (Critical user journeys)

---

## TEST COVERAGE REQUIREMENTS

### Mandatory Coverage Targets

| Layer | Target | Tool | Enforced By |
|-------|--------|------|-------------|
| **Domain Entities** | **100%** | PHPUnit | CI/CD (fails if < 100%) |
| **Use Cases** | **100%** | PHPUnit | CI/CD (fails if < 100%) |
| **API Endpoints** | **90%+** | PHPUnit Feature Tests | CI/CD (warning if < 90%) |
| **Frontend Components** | **80%+** | Vitest + React Testing Library | CI/CD (warning if < 80%) |

### Phase 2 Specific Coverage

#### Menu Management
- ✅ **Domain/Menu/MenuTest.php**: 100%
- ✅ **Domain/Menu/MenuItemTest.php**: 100%
- ✅ **Application/Menu/CreateMenuUseCaseTest.php**: 100%
- ✅ **Application/Menu/ReorderMenuItemsUseCaseTest.php**: 100%
- ✅ **Feature/Menu/MenuApiTest.php**: 90%+

#### Package Management
- ✅ **Domain/Package/PackageTest.php**: 100%
- ✅ **Domain/Package/PackageSecurityScannerTest.php**: 100% (CRITICAL)
- ✅ **Application/Package/InstallPackageUseCaseTest.php**: 100%
- ✅ **Application/Package/ScanPackageSecurityUseCaseTest.php**: 100%
- ✅ **Feature/Package/PackageSecurityTest.php**: 100% (CRITICAL)

#### License Management
- ✅ **Domain/License/LicenseValidationServiceTest.php**: 100%
- ✅ **Application/License/ValidateLicenseUseCaseTest.php**: 100%
- ✅ **Feature/License/LicenseActivationTest.php**: 90%+

#### Content Editor
- ✅ **Domain/Content/ContentSanitizerTest.php**: 100% (CRITICAL - XSS prevention)
- ✅ **Application/Content/CreatePageUseCaseTest.php**: 100%
- ✅ **Feature/Content/PagePublishTest.php**: 90%+

---

## UNIT TESTING STRATEGY

### Domain Layer Testing

**Goal**: Test pure business logic with NO dependencies on Laravel.

#### Menu Management - Example Tests

**Domain/Menu/MenuTest.php**:
```php
<?php

namespace Tests\Unit\Domain\Menu;

use App\Domain\Menu\Entity\Menu;
use App\Domain\Menu\Entity\MenuItem;
use App\Domain\Menu\ValueObject\MenuLocation;
use App\Domain\Menu\ValueObject\MenuType;
use App\Domain\Menu\Exception\MaxDepthExceededException;
use PHPUnit\Framework\TestCase;

class MenuTest extends TestCase
{
    public function test_can_create_menu()
    {
        $menu = new Menu(
            tenantId: 1,
            name: 'Admin Sidebar',
            location: MenuLocation::ADMIN_SIDEBAR,
            type: MenuType::ADMIN
        );

        $this->assertEquals('Admin Sidebar', $menu->getName());
        $this->assertEquals(MenuLocation::ADMIN_SIDEBAR, $menu->getLocation());
    }

    public function test_can_add_menu_item()
    {
        $menu = new Menu(1, 'Test Menu', MenuLocation::HEADER, MenuType::PUBLIC);
        
        $item = new MenuItem(
            menuId: $menu->getId(),
            title: 'Home',
            url: '/',
            type: MenuItemType::INTERNAL
        );

        $menu->addItem($item);

        $this->assertCount(1, $menu->getItems());
    }

    public function test_prevents_circular_menu_reference()
    {
        $item1 = new MenuItem(1, 'Item 1', '/item1', MenuItemType::INTERNAL);
        $item2 = new MenuItem(1, 'Item 2', '/item2', MenuItemType::INTERNAL);

        $item1->setParentId($item2->getId());
        
        $this->expectException(CircularMenuException::class);
        $item2->setParentId($item1->getId());
    }

    public function test_enforces_max_depth_limit()
    {
        $menu = new Menu(1, 'Test', MenuLocation::HEADER, MenuType::PUBLIC);
        
        $level1 = new MenuItem(1, 'Level 1', '/l1', MenuItemType::INTERNAL);
        $level2 = new MenuItem(1, 'Level 2', '/l2', MenuItemType::INTERNAL);
        $level3 = new MenuItem(1, 'Level 3', '/l3', MenuItemType::INTERNAL);
        $level4 = new MenuItem(1, 'Level 4', '/l4', MenuItemType::INTERNAL);
        $level5 = new MenuItem(1, 'Level 5', '/l5', MenuItemType::INTERNAL);
        $level6 = new MenuItem(1, 'Level 6', '/l6', MenuItemType::INTERNAL);

        $level2->setParentId($level1->getId());
        $level3->setParentId($level2->getId());
        $level4->setParentId($level3->getId());
        $level5->setParentId($level4->getId());

        $this->expectException(MaxDepthExceededException::class);
        $level6->setParentId($level5->getId());
    }
}
```

**Domain/Menu/MenuFilterServiceTest.php**:
```php
<?php

namespace Tests\Unit\Domain\Menu\Service;

use App\Domain\Menu\Service\MenuFilterService;
use App\Domain\Menu\Entity\MenuItem;
use PHPUnit\Framework\TestCase;

class MenuFilterServiceTest extends TestCase
{
    private MenuFilterService $filterService;

    protected function setUp(): void
    {
        $this->filterService = new MenuFilterService();
    }

    public function test_filters_menu_by_role()
    {
        $user = $this->createMockUser(['roles' => ['staff']]);

        $items = collect([
            new MenuItem(1, 'Dashboard', '/dashboard', MenuItemType::INTERNAL),
            new MenuItem(1, 'Finance', '/finance', MenuItemType::INTERNAL, [
                'roles' => ['admin', 'finance_manager']
            ]),
        ]);

        $filtered = $this->filterService->filterByPermissions($items, $user);

        $this->assertCount(1, $filtered);
        $this->assertEquals('Dashboard', $filtered[0]->getTitle());
    }

    public function test_shows_item_if_user_has_permission()
    {
        $user = $this->createMockUser([
            'roles' => ['manager'],
            'permissions' => ['view_finance']
        ]);

        $items = collect([
            new MenuItem(1, 'Finance', '/finance', MenuItemType::INTERNAL, [
                'permissions' => ['view_finance']
            ]),
        ]);

        $filtered = $this->filterService->filterByPermissions($items, $user);

        $this->assertCount(1, $filtered);
    }

    public function test_shows_item_if_no_permissions_defined()
    {
        $user = $this->createMockUser(['roles' => ['staff']]);

        $items = collect([
            new MenuItem(1, 'Public Page', '/page', MenuItemType::INTERNAL),
        ]);

        $filtered = $this->filterService->filterByPermissions($items, $user);

        $this->assertCount(1, $filtered);
    }
}
```

### Use Case Testing

**Goal**: Test application logic with mocked repositories.

**Application/Menu/CreateMenuUseCaseTest.php**:
```php
<?php

namespace Tests\Unit\Application\Menu\UseCase;

use App\Application\Menu\Command\CreateMenuCommand;
use App\Application\Menu\UseCase\CreateMenuUseCase;
use App\Domain\Menu\Repository\MenuRepositoryInterface;
use App\Domain\Menu\Exception\MenuLocationTakenException;
use PHPUnit\Framework\TestCase;
use Mockery;

class CreateMenuUseCaseTest extends TestCase
{
    private MenuRepositoryInterface $repository;
    private CreateMenuUseCase $useCase;

    protected function setUp(): void
    {
        $this->repository = Mockery::mock(MenuRepositoryInterface::class);
        $this->useCase = new CreateMenuUseCase($this->repository);
    }

    public function test_creates_menu_successfully()
    {
        $command = new CreateMenuCommand(
            tenantId: 1,
            name: 'Test Menu',
            location: 'header',
            type: 'public'
        );

        $this->repository
            ->shouldReceive('findByLocation')
            ->with(1, 'header')
            ->once()
            ->andReturn(null);

        $this->repository
            ->shouldReceive('save')
            ->once()
            ->andReturn(true);

        $menu = $this->useCase->execute($command);

        $this->assertEquals('Test Menu', $menu->getName());
    }

    public function test_throws_exception_if_location_taken()
    {
        $command = new CreateMenuCommand(1, 'Test', 'header', 'public');

        $existingMenu = new Menu(1, 'Existing', MenuLocation::HEADER, MenuType::PUBLIC);

        $this->repository
            ->shouldReceive('findByLocation')
            ->with(1, 'header')
            ->once()
            ->andReturn($existingMenu);

        $this->expectException(MenuLocationTakenException::class);
        $this->useCase->execute($command);
    }

    protected function tearDown(): void
    {
        Mockery::close();
    }
}
```

**Critical Use Case Tests**:

#### Package Security Scanner (100% Coverage MANDATORY)

```php
public function test_detects_malicious_function_calls()
{
    $scanner = new PackageSecurityScanner();
    
    $maliciousCode = '<?php eval($_GET["cmd"]); ?>';
    
    $result = $scanner->scan($maliciousCode);
    
    $this->assertFalse($result->isSafe());
    $this->assertStringContainsString('eval', $result->getViolations()[0]);
}

public function test_detects_sql_injection_attempts()
{
    $scanner = new PackageSecurityScanner();
    
    $code = '<?php DB::select("SELECT * FROM users WHERE id = " . $_GET["id"]); ?>';
    
    $result = $scanner->scan($code);
    
    $this->assertFalse($result->isSafe());
}

public function test_allows_safe_code()
{
    $scanner = new PackageSecurityScanner();
    
    $code = '<?php return Order::where("status", "completed")->get(); ?>';
    
    $result = $scanner->scan($code);
    
    $this->assertTrue($result->isSafe());
}
```

---

## INTEGRATION TESTING STRATEGY

### Feature (API) Tests

**Goal**: Test HTTP endpoints with database interactions.

**Feature/Menu/MenuApiTest.php**:
```php
<?php

namespace Tests\Feature\Menu;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Infrastructure\Persistence\Eloquent\Model\MenuModel;
use Laravel\Sanctum\Sanctum;

class MenuApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->tenant = Tenant::factory()->create();
        tenancy()->initialize($this->tenant);
        
        $this->user = User::factory()->create();
        Sanctum::actingAs($this->user, ['*']);
    }

    public function test_can_list_all_menus()
    {
        MenuModel::factory()->count(3)->create(['tenant_id' => $this->tenant->id]);

        $response = $this->getJson('/api/v1/admin/menus');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'success',
                     'data' => [
                         '*' => ['id', 'name', 'location', 'type']
                     ]
                 ])
                 ->assertJsonCount(3, 'data');
    }

    public function test_can_create_menu()
    {
        $payload = [
            'name' => 'Test Menu',
            'location' => 'header',
            'type' => 'public',
        ];

        $response = $this->postJson('/api/v1/admin/menus', $payload);

        $response->assertStatus(201)
                 ->assertJsonFragment(['name' => 'Test Menu']);

        $this->assertDatabaseHas('menus', [
            'tenant_id' => $this->tenant->id,
            'name' => 'Test Menu',
            'location' => 'header',
        ]);
    }

    public function test_cannot_create_duplicate_location_menu()
    {
        MenuModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'location' => 'header',
        ]);

        $payload = [
            'name' => 'Another Header',
            'location' => 'header',
            'type' => 'public',
        ];

        $response = $this->postJson('/api/v1/admin/menus', $payload);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['location']);
    }

    public function test_tenant_isolation_enforced()
    {
        $otherTenant = Tenant::factory()->create();
        MenuModel::factory()->create(['tenant_id' => $otherTenant->id]);

        $response = $this->getJson('/api/v1/admin/menus');

        $response->assertStatus(200)
                 ->assertJsonCount(0, 'data');
    }

    public function test_cannot_edit_other_tenant_menu()
    {
        $otherTenant = Tenant::factory()->create();
        $otherMenu = MenuModel::factory()->create(['tenant_id' => $otherTenant->id]);

        $response = $this->putJson("/api/v1/admin/menus/{$otherMenu->id}", [
            'name' => 'Hacked Menu',
        ]);

        $response->assertStatus(404);
    }
}
```

### Package Installation Flow Test

**Feature/Package/PackageInstallationTest.php**:
```php
public function test_complete_package_installation_flow()
{
    Queue::fake();
    Storage::fake('packages');

    $package = Package::factory()->create(['slug' => 'test-package']);

    $response = $this->postJson('/api/v1/admin/packages/install', [
        'slug' => 'test-package',
        'version' => '1.0.0',
    ]);

    $response->assertStatus(202)
             ->assertJsonStructure(['data' => ['job_id', 'status']]);

    Queue::assertPushed(InstallPackageJob::class);
}

public function test_package_installation_rollback_on_failure()
{
    $this->mock(PackageInstaller::class, function ($mock) {
        $mock->shouldReceive('install')
             ->andThrow(new PackageInstallationFailedException('Migration failed'));
    });

    $this->postJson('/api/v1/admin/packages/install', [
        'slug' => 'failing-package',
        'version' => '1.0.0',
    ]);

    $this->assertDatabaseMissing('tenant_packages', [
        'package_slug' => 'failing-package',
        'status' => 'active',
    ]);
}
```

---

## SECURITY TESTING (CRITICAL)

### Package Security Tests

**MANDATORY**: 100% coverage for package security scanner.

**Feature/Package/PackageSecurityTest.php**:
```php
<?php

namespace Tests\Feature\Package;

use Tests\TestCase;

class PackageSecurityTest extends TestCase
{
    public function test_blocks_package_with_eval_call()
    {
        $packageCode = '<?php eval($_POST["code"]); ?>';

        $result = app(PackageSecurityScanner::class)->scan($packageCode);

        $this->assertFalse($result->isSafe());
        $this->assertStringContainsString('eval', implode('', $result->getViolations()));
    }

    public function test_blocks_package_with_exec_call()
    {
        $packageCode = '<?php exec("rm -rf /"); ?>';

        $result = app(PackageSecurityScanner::class)->scan($packageCode);

        $this->assertFalse($result->isSafe());
    }

    public function test_blocks_package_with_file_get_contents_to_restricted_path()
    {
        $packageCode = '<?php $env = file_get_contents("/var/www/.env"); ?>';

        $result = app(PackageSecurityScanner::class)->scan($packageCode);

        $this->assertFalse($result->isSafe());
    }

    public function test_blocks_package_with_sql_injection_attempt()
    {
        $packageCode = '<?php DB::select("SELECT * FROM users WHERE id = " . $request->id); ?>';

        $result = app(PackageSecurityScanner::class)->scan($packageCode);

        $this->assertFalse($result->isSafe());
    }

    public function test_allows_safe_package_code()
    {
        $packageCode = '<?php 
        namespace TestPackage;
        
        class FinanceService {
            public function calculateTotal($items) {
                return collect($items)->sum("price");
            }
        }
        ?>';

        $result = app(PackageSecurityScanner::class)->scan($packageCode);

        $this->assertTrue($result->isSafe());
    }
}
```

### License Bypass Attempts

**Feature/License/LicenseBypassAttemptTest.php**:
```php
public function test_cannot_bypass_license_check_with_fake_key()
{
    $package = Package::factory()->create(['requires_license' => true]);

    $response = $this->postJson('/api/v1/licenses/activate', [
        'license_key' => 'FAKE-KEY-1234-5678',
        'package_slug' => $package->slug,
    ]);

    $response->assertStatus(422)
             ->assertJsonFragment(['code' => 'INVALID_LICENSE']);
}

public function test_cannot_use_expired_license()
{
    $expiredLicense = License::factory()->create([
        'expires_at' => now()->subDays(10),
    ]);

    $response = $this->postJson('/api/v1/licenses/activate', [
        'license_key' => $expiredLicense->license_key,
        'package_slug' => $expiredLicense->package->slug,
    ]);

    $response->assertStatus(422)
             ->assertJsonFragment(['code' => 'LICENSE_EXPIRED']);
}
```

### XSS Prevention Tests (Content Editor)

**Feature/Content/XSSPreventionTest.php**:
```php
public function test_sanitizes_malicious_script_tags()
{
    $maliciousContent = [
        'html' => '<div><script>alert("XSS")</script></div>',
        'css' => '',
    ];

    $response = $this->postJson('/api/v1/admin/pages', [
        'title' => 'Test Page',
        'slug' => 'test-page',
        'content' => $maliciousContent,
    ]);

    $response->assertStatus(201);

    $page = Page::where('slug', 'test-page')->first();
    $this->assertStringNotContainsString('<script>', $page->content['html']);
}

public function test_sanitizes_inline_javascript()
{
    $maliciousContent = [
        'html' => '<div onclick="alert(\'XSS\')">Click me</div>',
        'css' => '',
    ];

    $response = $this->postJson('/api/v1/admin/pages', [
        'title' => 'Test Page',
        'slug' => 'test-page',
        'content' => $maliciousContent,
    ]);

    $page = Page::where('slug', 'test-page')->first();
    $this->assertStringNotContainsString('onclick', $page->content['html']);
}
```

---

## PERFORMANCE TESTING

### Load Testing (Artillery.io)

**artillery-config.yml**:
```yaml
config:
  target: "https://api.stencil.com/v1"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 300
      arrivalRate: 50
      name: "Sustained load"
    - duration: 120
      arrivalRate: 100
      name: "Peak load"

scenarios:
  - name: "Menu API Load Test"
    flow:
      - post:
          url: "/auth/login"
          json:
            email: "test@example.com"
            password: "password"
          capture:
            json: "$.data.token"
            as: "token"
      - get:
          url: "/admin/menus"
          headers:
            Authorization: "Bearer {{ token }}"
          expect:
            - statusCode: 200
            - contentType: json
```

**Run Load Test**:
```bash
artillery run artillery-config.yml --output report.json
artillery report report.json
```

**Performance Benchmarks**:
- Menu API: P95 < 100ms, P99 < 200ms
- Package Install: Complete within 2 minutes
- License Validation (cached): < 50ms
- Page Publish: < 500ms

---

## E2E TESTING

### Playwright E2E Tests

**tests/e2e/menu-management.spec.ts**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Menu Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/admin/dashboard');
  });

  test('admin can create and edit menu', async ({ page }) => {
    await page.goto('/admin/menus');
    
    await page.click('text=Create Menu');
    await page.fill('input[name="name"]', 'Test Menu');
    await page.selectOption('select[name="location"]', 'footer');
    await page.click('button:has-text("Save")');
    
    await expect(page.locator('text=Test Menu')).toBeVisible();
  });

  test('admin can reorder menu items via drag and drop', async ({ page }) => {
    await page.goto('/admin/menus/1/editor');
    
    const firstItem = page.locator('[data-testid="menu-item-1"]');
    const secondItem = page.locator('[data-testid="menu-item-2"]');
    
    await firstItem.dragTo(secondItem);
    
    await page.click('button:has-text("Save Changes")');
    
    await expect(page.locator('text=Order updated successfully')).toBeVisible();
  });
});
```

**tests/e2e/package-installation.spec.ts**:
```typescript
test('admin can install package from marketplace', async ({ page }) => {
  await page.goto('/admin/packages/marketplace');
  
  await page.click('text=Finance & Reporting');
  
  await page.click('button:has-text("Install")');
  
  await expect(page.locator('text=Installing...')).toBeVisible();
  
  await page.waitForSelector('text=Installation complete', { timeout: 120000 });
  
  await page.goto('/admin/packages/installed');
  
  await expect(page.locator('text=Finance & Reporting')).toBeVisible();
});
```

---

## CI/CD INTEGRATION

### GitHub Actions Workflow

**.github/workflows/phase2-tests.yml**:
```yaml
name: Phase 2 Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: stencil_test
          POSTGRES_PASSWORD: secret
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
          extensions: pdo, pdo_pgsql, redis
          coverage: xdebug
      
      - name: Install Dependencies
        run: composer install --prefer-dist --no-progress
      
      - name: Run Migrations
        run: php artisan migrate --force
      
      - name: Run Unit Tests (Domain)
        run: vendor/bin/phpunit --testsuite=Domain --coverage-text --coverage-clover=domain-coverage.xml
      
      - name: Check Domain Coverage (Must be 100%)
        run: |
          COVERAGE=$(php -r "echo round(simplexml_load_file('domain-coverage.xml')->project->metrics['coveredstatements'] / simplexml_load_file('domain-coverage.xml')->project->metrics['statements'] * 100, 2);")
          echo "Domain Coverage: $COVERAGE%"
          if (( $(echo "$COVERAGE < 100" | bc -l) )); then
            echo "❌ Domain coverage is below 100%!"
            exit 1
          fi
      
      - name: Run Unit Tests (Use Cases)
        run: vendor/bin/phpunit --testsuite=Application --coverage-text --coverage-clover=application-coverage.xml
      
      - name: Check Use Case Coverage (Must be 100%)
        run: |
          COVERAGE=$(php -r "echo round(simplexml_load_file('application-coverage.xml')->project->metrics['coveredstatements'] / simplexml_load_file('application-coverage.xml')->project->metrics['statements'] * 100, 2);")
          echo "Use Case Coverage: $COVERAGE%"
          if (( $(echo "$COVERAGE < 100" | bc -l) )); then
            echo "❌ Use Case coverage is below 100%!"
            exit 1
          fi
      
      - name: Run Feature Tests
        run: vendor/bin/phpunit --testsuite=Feature --coverage-text --coverage-clover=feature-coverage.xml
      
      - name: Check Feature Coverage (Must be >= 90%)
        run: |
          COVERAGE=$(php -r "echo round(simplexml_load_file('feature-coverage.xml')->project->metrics['coveredstatements'] / simplexml_load_file('feature-coverage.xml')->project->metrics['statements'] * 100, 2);")
          echo "Feature Coverage: $COVERAGE%"
          if (( $(echo "$COVERAGE < 90" | bc -l) )); then
            echo "⚠️ Feature coverage is below 90%"
          fi
      
      - name: Run Security Tests
        run: vendor/bin/phpunit tests/Feature/Package/PackageSecurityTest.php
      
      - name: Upload Coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./domain-coverage.xml,./application-coverage.xml,./feature-coverage.xml

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
      
      - name: Run Unit Tests
        run: npm run test:unit -- --coverage
      
      - name: Run Component Tests
        run: npm run test:component
      
      - name: Check Coverage (Must be >= 80%)
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          echo "Frontend Coverage: $COVERAGE%"
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "⚠️ Frontend coverage is below 80%"
          fi

  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E Tests
        run: npx playwright test
      
      - name: Upload Playwright Report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## TEST EXECUTION CHECKLIST

### Before Committing Code

- [ ] All Domain tests passing (100% coverage)
- [ ] All Use Case tests passing (100% coverage)
- [ ] All Feature tests passing (90%+ coverage)
- [ ] No security test failures
- [ ] No tenant isolation test failures
- [ ] Static analysis passing (PHPStan level 8)
- [ ] Code style checks passing (PHP CS Fixer)

### Before Merging PR

- [ ] All CI/CD tests passing
- [ ] Code review approved
- [ ] Security audit passed (for package-related changes)
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Changelog updated

### Before Deployment

- [ ] All tests passing in staging
- [ ] E2E tests passing
- [ ] Load tests passing
- [ ] Security penetration tests passed
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured

---

**Document Version:** 1.0  
**Created:** November 2025  
**Status:** ✅ Testing Strategy Complete

**Related Documents:**
- `PHASE2_COMPLETE_ROADMAP.md` - Development timeline
- `PHASE2_FEATURES_SPECIFICATION.md` - Feature requirements
- `.zencoder/rules` - Development rules

---

**END OF PHASE 2 TESTING STRATEGY**