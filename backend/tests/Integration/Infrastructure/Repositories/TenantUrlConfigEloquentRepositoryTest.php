<?php

namespace Tests\Integration\Infrastructure\Repositories;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Infrastructure\Persistence\Repositories\TenantUrlConfigEloquentRepository;
use App\Infrastructure\Persistence\Eloquent\TenantUrlConfigurationEloquentModel;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\CustomDomainEloquentModel;
use App\Domain\Tenant\Entities\TenantUrlConfiguration;
use App\Domain\Shared\ValueObjects\Uuid;
use App\Domain\Tenant\Enums\UrlPattern;
use App\Domain\Tenant\ValueObjects\SubdomainName;
use App\Domain\Tenant\ValueObjects\UrlPath;

class TenantUrlConfigEloquentRepositoryTest extends TestCase
{
    use RefreshDatabase;

    private TenantUrlConfigEloquentRepository $repository;
    private TenantEloquentModel $tenant;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->tenant = TenantEloquentModel::factory()->create();
        $this->repository = new TenantUrlConfigEloquentRepository(
            new TenantUrlConfigurationEloquentModel()
        );
    }

    public function test_saves_new_subdomain_configuration(): void
    {
        $tenantId = Uuid::fromString($this->tenant->uuid);
        $subdomain = new SubdomainName('testcorp');

        $config = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::SUBDOMAIN,
            subdomain: $subdomain,
            isPrimary: true
        );

        $savedConfig = $this->repository->save($config);

        $this->assertNotNull($savedConfig->getId());
        $this->assertEquals(UrlPattern::SUBDOMAIN, $savedConfig->getUrlPattern());
        $this->assertEquals('testcorp', $savedConfig->getSubdomain()->getValue());
        $this->assertTrue($savedConfig->isPrimary());
        $this->assertDatabaseHas('tenant_url_configurations', [
            'uuid' => $savedConfig->getId()->getValue(),
            'tenant_id' => $this->tenant->id,
            'url_pattern' => 'subdomain',
            'subdomain' => 'testcorp',
            'is_primary' => true
        ]);
    }

    public function test_saves_new_path_based_configuration(): void
    {
        $tenantId = Uuid::fromString($this->tenant->uuid);
        $urlPath = new UrlPath('testcorp');

        $config = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::PATH,
            urlPath: $urlPath,
            isPrimary: false
        );

        $savedConfig = $this->repository->save($config);

        $this->assertEquals(UrlPattern::PATH, $savedConfig->getUrlPattern());
        $this->assertEquals('testcorp', $savedConfig->getUrlPath()->getValue());
        $this->assertFalse($savedConfig->isPrimary());
        $this->assertDatabaseHas('tenant_url_configurations', [
            'uuid' => $savedConfig->getId()->getValue(),
            'url_pattern' => 'path',
            'url_path' => 'testcorp'
        ]);
    }

    public function test_updates_existing_configuration(): void
    {
        $tenantId = Uuid::fromString($this->tenant->uuid);
        $config = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::SUBDOMAIN,
            subdomain: new SubdomainName('original'),
            isPrimary: false
        );

        $savedConfig = $this->repository->save($config);
        $configId = $savedConfig->getId();

        $savedConfig->markAsPrimary();
        $updatedConfig = $this->repository->save($savedConfig);

        $this->assertEquals($configId->getValue(), $updatedConfig->getId()->getValue());
        $this->assertTrue($updatedConfig->isPrimary());
        $this->assertDatabaseHas('tenant_url_configurations', [
            'uuid' => $configId->getValue(),
            'is_primary' => true
        ]);
    }

    public function test_finds_configuration_by_id(): void
    {
        $tenantId = Uuid::fromString($this->tenant->uuid);
        $config = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::SUBDOMAIN,
            subdomain: new SubdomainName('findme'),
            isPrimary: true
        );

        $savedConfig = $this->repository->save($config);
        $foundConfig = $this->repository->findById($savedConfig->getId());

        $this->assertNotNull($foundConfig);
        $this->assertEquals($savedConfig->getId()->getValue(), $foundConfig->getId()->getValue());
        $this->assertEquals('findme', $foundConfig->getSubdomain()->getValue());
    }

    public function test_returns_null_when_configuration_not_found(): void
    {
        $nonExistentId = Uuid::generate();
        $foundConfig = $this->repository->findById($nonExistentId);

        $this->assertNull($foundConfig);
    }

    public function test_finds_configurations_by_tenant_id(): void
    {
        $tenantId = Uuid::fromString($this->tenant->uuid);
        
        $config1 = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::SUBDOMAIN,
            subdomain: new SubdomainName('config1'),
            isPrimary: true
        );
        
        $config2 = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::PATH,
            urlPath: new UrlPath('config2'),
            isPrimary: false
        );

        $this->repository->save($config1);
        $this->repository->save($config2);

        $configs = $this->repository->findByTenantId($tenantId);

        $this->assertCount(2, $configs);
        $this->assertContainsOnlyInstancesOf(TenantUrlConfiguration::class, $configs);
    }

    public function test_finds_primary_configuration_by_tenant_id(): void
    {
        $tenantId = Uuid::fromString($this->tenant->uuid);
        
        $primaryConfig = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::SUBDOMAIN,
            subdomain: new SubdomainName('primary'),
            isPrimary: true
        );
        
        $secondaryConfig = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::PATH,
            urlPath: new UrlPath('secondary'),
            isPrimary: false
        );

        $this->repository->save($primaryConfig);
        $this->repository->save($secondaryConfig);

        $foundPrimary = $this->repository->findPrimaryByTenantId($tenantId);

        $this->assertNotNull($foundPrimary);
        $this->assertTrue($foundPrimary->isPrimary());
        $this->assertEquals('primary', $foundPrimary->getSubdomain()->getValue());
    }

    public function test_finds_enabled_configurations_by_tenant_id(): void
    {
        $tenantId = Uuid::fromString($this->tenant->uuid);
        
        $enabledConfig = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::SUBDOMAIN,
            subdomain: new SubdomainName('enabled'),
            isPrimary: true
        );
        
        $disabledConfig = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::PATH,
            urlPath: new UrlPath('disabled'),
            isPrimary: false
        );
        
        $this->repository->save($enabledConfig);
        $savedDisabled = $this->repository->save($disabledConfig);
        
        $savedDisabled->disable();
        $this->repository->save($savedDisabled);

        $enabledConfigs = $this->repository->findEnabledByTenantId($tenantId);

        $this->assertCount(1, $enabledConfigs);
        $this->assertTrue($enabledConfigs[0]->isEnabled());
    }

    public function test_finds_configuration_by_subdomain(): void
    {
        $tenantId = Uuid::fromString($this->tenant->uuid);
        $subdomain = new SubdomainName('uniquesubdomain');
        
        $config = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::SUBDOMAIN,
            subdomain: $subdomain,
            isPrimary: true
        );

        $this->repository->save($config);

        $foundConfig = $this->repository->findBySubdomain($subdomain);

        $this->assertNotNull($foundConfig);
        $this->assertEquals('uniquesubdomain', $foundConfig->getSubdomain()->getValue());
    }

    public function test_finds_configuration_by_url_path(): void
    {
        $tenantId = Uuid::fromString($this->tenant->uuid);
        $urlPath = new UrlPath('uniquepath');
        
        $config = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::PATH,
            urlPath: $urlPath,
            isPrimary: false
        );

        $this->repository->save($config);

        $foundConfig = $this->repository->findByUrlPath($urlPath);

        $this->assertNotNull($foundConfig);
        $this->assertEquals('uniquepath', $foundConfig->getUrlPath()->getValue());
    }

    public function test_finds_configurations_by_pattern(): void
    {
        $tenantId = Uuid::fromString($this->tenant->uuid);
        
        $subdomainConfig = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::SUBDOMAIN,
            subdomain: new SubdomainName('test1'),
            isPrimary: true
        );
        
        $pathConfig = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::PATH,
            urlPath: new UrlPath('test2'),
            isPrimary: false
        );

        $this->repository->save($subdomainConfig);
        $this->repository->save($pathConfig);

        $subdomainConfigs = $this->repository->findByPattern(UrlPattern::SUBDOMAIN);

        $this->assertGreaterThanOrEqual(1, count($subdomainConfigs));
        foreach ($subdomainConfigs as $config) {
            $this->assertEquals(UrlPattern::SUBDOMAIN, $config->getUrlPattern());
        }
    }

    public function test_deletes_configuration(): void
    {
        $tenantId = Uuid::fromString($this->tenant->uuid);
        $config = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::SUBDOMAIN,
            subdomain: new SubdomainName('deleteme'),
            isPrimary: false
        );

        $savedConfig = $this->repository->save($config);
        $configId = $savedConfig->getId();

        $deleted = $this->repository->delete($configId);

        $this->assertTrue($deleted);
        $this->assertDatabaseMissing('tenant_url_configurations', [
            'uuid' => $configId->getValue()
        ]);
    }

    public function test_checks_if_configuration_exists(): void
    {
        $tenantId = Uuid::fromString($this->tenant->uuid);
        
        $this->assertFalse($this->repository->exists($tenantId, UrlPattern::SUBDOMAIN));
        
        $config = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::SUBDOMAIN,
            subdomain: new SubdomainName('exists'),
            isPrimary: true
        );
        
        $this->repository->save($config);

        $this->assertTrue($this->repository->exists($tenantId, UrlPattern::SUBDOMAIN));
    }

    public function test_checks_if_subdomain_exists(): void
    {
        $tenantId = Uuid::fromString($this->tenant->uuid);
        $subdomain = new SubdomainName('checkexists');
        
        $this->assertFalse($this->repository->existsSubdomain($subdomain));
        
        $config = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::SUBDOMAIN,
            subdomain: $subdomain,
            isPrimary: true
        );
        
        $this->repository->save($config);

        $this->assertTrue($this->repository->existsSubdomain($subdomain));
    }

    public function test_checks_if_url_path_exists(): void
    {
        $tenantId = Uuid::fromString($this->tenant->uuid);
        $urlPath = new UrlPath('checkpathexists');
        
        $this->assertFalse($this->repository->existsUrlPath($urlPath));
        
        $config = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::PATH,
            urlPath: $urlPath,
            isPrimary: false
        );
        
        $this->repository->save($config);

        $this->assertTrue($this->repository->existsUrlPath($urlPath));
    }

    public function test_sets_configuration_as_primary(): void
    {
        $tenantId = Uuid::fromString($this->tenant->uuid);
        
        $config1 = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::SUBDOMAIN,
            subdomain: new SubdomainName('first'),
            isPrimary: true
        );
        
        $config2 = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::PATH,
            urlPath: new UrlPath('second'),
            isPrimary: false
        );

        $saved1 = $this->repository->save($config1);
        $saved2 = $this->repository->save($config2);

        $this->repository->setPrimary($saved2->getId(), $tenantId);

        $foundConfig1 = $this->repository->findById($saved1->getId());
        $foundConfig2 = $this->repository->findById($saved2->getId());

        $this->assertFalse($foundConfig1->isPrimary());
        $this->assertTrue($foundConfig2->isPrimary());
    }

    public function test_unsets_all_primary_configurations(): void
    {
        $tenantId = Uuid::fromString($this->tenant->uuid);
        
        $config1 = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::SUBDOMAIN,
            subdomain: new SubdomainName('primary1'),
            isPrimary: true
        );
        
        $config2 = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::PATH,
            urlPath: new UrlPath('primary2'),
            isPrimary: true
        );

        $this->repository->save($config1);
        $this->repository->save($config2);

        $this->repository->unsetAllPrimary($tenantId);

        $configs = $this->repository->findByTenantId($tenantId);
        
        foreach ($configs as $config) {
            $this->assertFalse($config->isPrimary());
        }
    }

    public function test_counts_configurations_by_tenant_id(): void
    {
        $tenantId = Uuid::fromString($this->tenant->uuid);
        
        $this->assertEquals(0, $this->repository->countByTenantId($tenantId));
        
        $config1 = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::SUBDOMAIN,
            subdomain: new SubdomainName('count1'),
            isPrimary: true
        );
        
        $config2 = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::PATH,
            urlPath: new UrlPath('count2'),
            isPrimary: false
        );

        $this->repository->save($config1);
        $this->repository->save($config2);

        $this->assertEquals(2, $this->repository->countByTenantId($tenantId));
    }

    public function test_checks_if_tenant_has_primary_config(): void
    {
        $tenantId = Uuid::fromString($this->tenant->uuid);
        
        $this->assertFalse($this->repository->hasPrimaryConfig($tenantId));
        
        $config = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::SUBDOMAIN,
            subdomain: new SubdomainName('hasprimary'),
            isPrimary: true
        );
        
        $this->repository->save($config);

        $this->assertTrue($this->repository->hasPrimaryConfig($tenantId));
    }

    public function test_enables_configuration(): void
    {
        $tenantId = Uuid::fromString($this->tenant->uuid);
        $config = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::SUBDOMAIN,
            subdomain: new SubdomainName('enable'),
            isPrimary: false
        );

        $savedConfig = $this->repository->save($config);
        $savedConfig->disable();
        $this->repository->save($savedConfig);

        $this->repository->enable($savedConfig->getId());

        $foundConfig = $this->repository->findById($savedConfig->getId());
        $this->assertTrue($foundConfig->isEnabled());
    }

    public function test_disables_configuration(): void
    {
        $tenantId = Uuid::fromString($this->tenant->uuid);
        $config = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::SUBDOMAIN,
            subdomain: new SubdomainName('disable'),
            isPrimary: false
        );

        $savedConfig = $this->repository->save($config);

        $this->repository->disable($savedConfig->getId());

        $foundConfig = $this->repository->findById($savedConfig->getId());
        $this->assertFalse($foundConfig->isEnabled());
    }

    public function test_finds_all_with_filters(): void
    {
        $tenantId = Uuid::fromString($this->tenant->uuid);
        
        $config1 = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::SUBDOMAIN,
            subdomain: new SubdomainName('filter1'),
            isPrimary: true
        );
        
        $config2 = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::PATH,
            urlPath: new UrlPath('filter2'),
            isPrimary: false
        );

        $this->repository->save($config1);
        $saved2 = $this->repository->save($config2);
        
        $saved2->disable();
        $this->repository->save($saved2);

        $allConfigs = $this->repository->findAll(
            tenantId: $tenantId,
            pattern: null,
            isEnabled: null
        );
        $this->assertCount(2, $allConfigs);

        $enabledConfigs = $this->repository->findAll(
            tenantId: $tenantId,
            pattern: null,
            isEnabled: true
        );
        $this->assertCount(1, $enabledConfigs);

        $subdomainConfigs = $this->repository->findAll(
            tenantId: $tenantId,
            pattern: UrlPattern::SUBDOMAIN,
            isEnabled: null
        );
        $this->assertCount(1, $subdomainConfigs);
    }

    public function test_isolates_tenant_data(): void
    {
        $tenant1 = TenantEloquentModel::factory()->create();
        $tenant2 = TenantEloquentModel::factory()->create();
        
        $tenant1Id = Uuid::fromString($tenant1->uuid);
        $tenant2Id = Uuid::fromString($tenant2->uuid);
        
        $config1 = TenantUrlConfiguration::create(
            tenantId: $tenant1Id,
            urlPattern: UrlPattern::SUBDOMAIN,
            subdomain: new SubdomainName('tenant1'),
            isPrimary: true
        );
        
        $config2 = TenantUrlConfiguration::create(
            tenantId: $tenant2Id,
            urlPattern: UrlPattern::SUBDOMAIN,
            subdomain: new SubdomainName('tenant2'),
            isPrimary: true
        );

        $this->repository->save($config1);
        $this->repository->save($config2);

        $tenant1Configs = $this->repository->findByTenantId($tenant1Id);
        $tenant2Configs = $this->repository->findByTenantId($tenant2Id);

        $this->assertCount(1, $tenant1Configs);
        $this->assertCount(1, $tenant2Configs);
        $this->assertEquals('tenant1', $tenant1Configs[0]->getSubdomain()->getValue());
        $this->assertEquals('tenant2', $tenant2Configs[0]->getSubdomain()->getValue());
    }
}
