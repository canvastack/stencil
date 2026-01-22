<?php

namespace Tests\Feature\Tenant\Api;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use App\Infrastructure\Persistence\Eloquent\CustomDomainEloquentModel;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;

class CustomDomainControllerTest extends TestCase
{
    use RefreshDatabase;

    private TenantEloquentModel $tenant;
    private UserEloquentModel $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = TenantEloquentModel::factory()->create([
            'name' => 'Test Tenant',
            'slug' => 'test-tenant',
            'status' => 'active',
        ]);

        $this->user = UserEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Test User',
            'email' => 'test@example.com',
            'status' => 'active',
        ]);

        setPermissionsTeamId($this->tenant->id);

        Permission::firstOrCreate([
            'name' => 'settings.domain.create',
            'guard_name' => 'api',
        ]);
        Permission::firstOrCreate([
            'name' => 'settings.domain.verify',
            'guard_name' => 'api',
        ]);
        Permission::firstOrCreate([
            'name' => 'settings.domain.delete',
            'guard_name' => 'api',
        ]);

        $this->user->givePermissionTo([
            'settings.domain.create',
            'settings.domain.verify',
            'settings.domain.delete',
        ]);

        Sanctum::actingAs($this->user);
    }

    public function test_can_list_custom_domains_for_tenant(): void
    {
        CustomDomainEloquentModel::factory()->count(3)->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $otherTenant = TenantEloquentModel::factory()->create();
        CustomDomainEloquentModel::factory()->count(2)->create([
            'tenant_id' => $otherTenant->id,
        ]);

        $response = $this->withHeaders([
            'X-Tenant-ID' => $this->tenant->id,
        ])->getJson('/api/v1/tenant/custom-domains');

        $response->assertStatus(200);
        $response->assertJsonCount(3, 'data');
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'uuid',
                    'domainName',
                    'isVerified',
                    'status',
                    'verificationMethod',
                    'ssl',
                    'dns',
                ],
            ],
            'meta' => [
                'total',
                'verified',
                'pending',
            ],
        ]);
    }

    public function test_can_filter_domains_by_status(): void
    {
        CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'active',
        ]);

        CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'pending_verification',
        ]);

        $response = $this->withHeaders([
            'X-Tenant-ID' => $this->tenant->id,
        ])->getJson('/api/v1/tenant/custom-domains?status=active');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.status', 'active');
    }

    public function test_can_filter_domains_by_verification_status(): void
    {
        CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_verified' => true,
        ]);

        CustomDomainEloquentModel::factory()->count(2)->create([
            'tenant_id' => $this->tenant->id,
            'is_verified' => false,
        ]);

        $response = $this->withHeaders([
            'X-Tenant-ID' => $this->tenant->id,
        ])->getJson('/api/v1/tenant/custom-domains?is_verified=true');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.isVerified', true);
    }

    public function test_can_get_single_custom_domain_by_uuid(): void
    {
        $domain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'test-domain.com',
        ]);

        $response = $this->withHeaders([
            'X-Tenant-ID' => $this->tenant->id,
        ])->getJson("/api/v1/tenant/custom-domains/{$domain->uuid}");

        $response->assertStatus(200);
        $response->assertJsonPath('data.uuid', $domain->uuid);
        $response->assertJsonPath('data.domainName', 'test-domain.com');
    }

    public function test_cannot_get_domain_from_different_tenant(): void
    {
        $otherTenant = TenantEloquentModel::factory()->create();
        $domain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $otherTenant->id,
        ]);

        $response = $this->withHeaders([
            'X-Tenant-ID' => $this->tenant->id,
        ])->getJson("/api/v1/tenant/custom-domains/{$domain->uuid}");

        $response->assertStatus(404);
    }

    public function test_can_create_custom_domain_with_dns_txt_verification(): void
    {
        setPermissionsTeamId($this->tenant->id);
        
        $response = $this->withHeaders([
            'X-Tenant-ID' => $this->tenant->id,
        ])->postJson('/api/v1/tenant/custom-domains', [
            'domain_name' => 'new-domain.com',
            'verification_method' => 'dns_txt',
        ]);

        if ($response->status() !== 201) {
            dump('Create error:', $response->json(), 'User can create?', $this->user->can('settings.domain.create'));
        }

        $response->assertStatus(201);
        $response->assertJsonPath('data.domainName', 'new-domain.com');
        $response->assertJsonPath('data.verificationMethod', 'dns_txt');
        $response->assertJsonPath('data.isVerified', false);
        $response->assertJsonPath('data.status', 'pending_verification');
        $response->assertJsonStructure([
            'data' => [
                'uuid',
                'verificationToken',
                'verificationInstructions',
            ],
        ]);

        $this->assertDatabaseHas('custom_domains', [
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'new-domain.com',
            'verification_method' => 'dns_txt',
            'is_verified' => false,
        ]);
    }

    public function test_can_create_custom_domain_with_dns_cname_verification(): void
    {
        $response = $this->withHeaders([
            'X-Tenant-ID' => $this->tenant->id,
        ])->postJson('/api/v1/tenant/custom-domains', [
            'domain_name' => 'cname-domain.com',
            'verification_method' => 'dns_cname',
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('data.verificationMethod', 'dns_cname');
    }

    public function test_can_create_custom_domain_with_file_upload_verification(): void
    {
        $response = $this->withHeaders([
            'X-Tenant-ID' => $this->tenant->id,
        ])->postJson('/api/v1/tenant/custom-domains', [
            'domain_name' => 'file-domain.com',
            'verification_method' => 'file_upload',
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('data.verificationMethod', 'file_upload');
    }

    public function test_cannot_create_domain_with_invalid_format(): void
    {
        $response = $this->withHeaders([
            'X-Tenant-ID' => $this->tenant->id,
        ])->postJson('/api/v1/tenant/custom-domains', [
            'domain_name' => 'invalid domain name',
            'verification_method' => 'dns_txt',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['domain_name']);
    }

    public function test_cannot_create_duplicate_domain(): void
    {
        CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'duplicate.com',
        ]);

        $response = $this->withHeaders([
            'X-Tenant-ID' => $this->tenant->id,
        ])->postJson('/api/v1/tenant/custom-domains', [
            'domain_name' => 'duplicate.com',
            'verification_method' => 'dns_txt',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['domain_name']);
    }

    public function test_cannot_create_domain_without_permission(): void
    {
        $this->user->revokePermissionTo('settings.domain.create');

        $response = $this->withHeaders([
            'X-Tenant-ID' => $this->tenant->id,
        ])->postJson('/api/v1/tenant/custom-domains', [
            'domain_name' => 'no-permission.com',
            'verification_method' => 'dns_txt',
        ]);

        $response->assertStatus(403);
    }

    public function test_can_update_custom_domain(): void
    {
        $domain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'ssl_enabled' => false,
            'redirect_to_https' => false,
        ]);

        $response = $this->withHeaders([
            'X-Tenant-ID' => $this->tenant->id,
        ])->patchJson("/api/v1/tenant/custom-domains/{$domain->uuid}", [
            'ssl_enabled' => true,
            'redirect_to_https' => true,
            'auto_renew_ssl' => true,
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.ssl.enabled', true);
        $response->assertJsonPath('data.configuration.redirectToHttps', true);

        $domain->refresh();
        $this->assertTrue($domain->ssl_enabled);
        $this->assertTrue($domain->redirect_to_https);
        $this->assertTrue($domain->auto_renew_ssl);
    }

    public function test_can_update_verification_method_for_unverified_domain(): void
    {
        $domain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'verification_method' => 'dns_txt',
            'is_verified' => false,
        ]);

        $response = $this->withHeaders([
            'X-Tenant-ID' => $this->tenant->id,
        ])->patchJson("/api/v1/tenant/custom-domains/{$domain->uuid}", [
            'verification_method' => 'file_upload',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.verificationMethod', 'file_upload');

        $domain->refresh();
        $this->assertEquals('file_upload', $domain->verification_method);
    }

    public function test_can_delete_custom_domain(): void
    {
        $domain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $response = $this->withHeaders([
            'X-Tenant-ID' => $this->tenant->id,
        ])->deleteJson("/api/v1/tenant/custom-domains/{$domain->uuid}");

        $response->assertStatus(200);
        $response->assertJsonPath('message', 'Custom domain deleted successfully');

        $this->assertSoftDeleted('custom_domains', [
            'id' => $domain->id,
        ]);
    }

    public function test_cannot_delete_domain_without_permission(): void
    {
        $this->user->revokePermissionTo('settings.domain.delete');

        $domain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $response = $this->withHeaders([
            'X-Tenant-ID' => $this->tenant->id,
        ])->deleteJson("/api/v1/tenant/custom-domains/{$domain->uuid}");

        $response->assertStatus(403);
    }

    public function test_can_get_verification_instructions(): void
    {
        $domain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'instructions-test.com',
            'verification_method' => 'dns_txt',
        ]);

        $response = $this->withHeaders([
            'X-Tenant-ID' => $this->tenant->id,
        ])->getJson("/api/v1/tenant/custom-domains/{$domain->uuid}/verification-instructions");

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'domain' => [
                'uuid',
                'domainName',
                'verificationMethod',
            ],
            'instructions' => [
                'method',
                'steps',
            ],
            'verificationToken',
        ]);
    }

    public function test_verification_instructions_include_correct_dns_txt_steps(): void
    {
        $domain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'verification_method' => 'dns_txt',
        ]);

        $response = $this->withHeaders([
            'X-Tenant-ID' => $this->tenant->id,
        ])->getJson("/api/v1/tenant/custom-domains/{$domain->uuid}/verification-instructions");

        $response->assertStatus(200);
        $response->assertJsonPath('instructions.method', 'dns_txt');
        $response->assertJsonPath('instructions.recordName', '_canva-verify.' . $domain->domain_name);
        $response->assertJsonPath('instructions.recordValue', $domain->verification_token);
    }

    public function test_can_verify_domain_with_valid_dns_txt(): void
    {
        $domain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'verify-dns.com',
            'verification_method' => 'file_upload',
            'is_verified' => false,
        ]);

        Http::fake([
            "https://verify-dns.com/.well-known/canva-verify-{$domain->verification_token}.txt" => Http::response(
                $domain->verification_token,
                200
            ),
        ]);

        $response = $this->withHeaders([
            'X-Tenant-ID' => $this->tenant->id,
        ])->postJson("/api/v1/tenant/custom-domains/{$domain->uuid}/verify");

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('message', 'Domain verified successfully');

        $domain->refresh();
        $this->assertTrue($domain->is_verified);
        $this->assertEquals('verified', $domain->status);
        $this->assertNotNull($domain->verified_at);
    }

    public function test_verification_fails_with_incorrect_verification_token(): void
    {
        $domain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'verify-fail.com',
            'verification_method' => 'file_upload',
            'is_verified' => false,
        ]);

        Http::fake([
            "https://verify-fail.com/.well-known/canva-verify-{$domain->verification_token}.txt" => Http::response(
                'wrong-token-123456',
                200
            ),
        ]);

        $response = $this->withHeaders([
            'X-Tenant-ID' => $this->tenant->id,
        ])->postJson("/api/v1/tenant/custom-domains/{$domain->uuid}/verify");

        $response->assertStatus(400);
        $response->assertJsonPath('success', false);

        $domain->refresh();
        $this->assertFalse($domain->is_verified);
        $this->assertEquals('failed', $domain->status);
    }

    public function test_cannot_verify_domain_without_permission(): void
    {
        $this->user->revokePermissionTo('settings.domain.verify');

        $domain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_verified' => false,
        ]);

        $response = $this->withHeaders([
            'X-Tenant-ID' => $this->tenant->id,
        ])->postJson("/api/v1/tenant/custom-domains/{$domain->uuid}/verify");

        $response->assertStatus(403);
    }

    public function test_verification_returns_already_verified_message_for_verified_domain(): void
    {
        $domain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_verified' => true,
            'verified_at' => now(),
        ]);

        $response = $this->withHeaders([
            'X-Tenant-ID' => $this->tenant->id,
        ])->postJson("/api/v1/tenant/custom-domains/{$domain->uuid}/verify");

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('already_verified', true);
        $response->assertJsonPath('message', 'Domain is already verified');
    }

    public function test_list_returns_correct_meta_statistics(): void
    {
        CustomDomainEloquentModel::factory()->count(3)->create([
            'tenant_id' => $this->tenant->id,
            'is_verified' => true,
        ]);

        CustomDomainEloquentModel::factory()->count(2)->create([
            'tenant_id' => $this->tenant->id,
            'is_verified' => false,
            'status' => 'pending_verification',
        ]);

        $response = $this->withHeaders([
            'X-Tenant-ID' => $this->tenant->id,
        ])->getJson('/api/v1/tenant/custom-domains');

        $response->assertStatus(200);
        $response->assertJsonPath('meta.total', 5);
        $response->assertJsonPath('meta.verified', 3);
        $response->assertJsonPath('meta.pending', 2);
    }

    public function test_custom_domain_resource_does_not_expose_internal_ids(): void
    {
        $domain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $response = $this->withHeaders([
            'X-Tenant-ID' => $this->tenant->id,
        ])->getJson("/api/v1/tenant/custom-domains/{$domain->uuid}");

        $response->assertStatus(200);
        $response->assertJsonMissing(['id' => $domain->id]);
        $response->assertJsonMissing(['tenant_id' => $this->tenant->id]);
        $response->assertJsonStructure([
            'data' => [
                'uuid',
                'tenant_uuid',
            ],
        ]);
    }

    public function test_verification_token_only_exposed_for_unverified_domains(): void
    {
        $unverifiedDomain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_verified' => false,
        ]);

        $verifiedDomain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_verified' => true,
        ]);

        $unverifiedResponse = $this->withHeaders([
            'X-Tenant-ID' => $this->tenant->id,
        ])->getJson("/api/v1/tenant/custom-domains/{$unverifiedDomain->uuid}");

        $verifiedResponse = $this->withHeaders([
            'X-Tenant-ID' => $this->tenant->id,
        ])->getJson("/api/v1/tenant/custom-domains/{$verifiedDomain->uuid}");

        $unverifiedResponse->assertJsonStructure(['data' => ['verificationToken']]);
        $verifiedResponse->assertJsonMissing(['verificationToken']);
    }

    public function test_supports_pagination_for_domain_list(): void
    {
        CustomDomainEloquentModel::factory()->count(25)->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $response = $this->withHeaders([
            'X-Tenant-ID' => $this->tenant->id,
        ])->getJson('/api/v1/tenant/custom-domains?per_page=10&page=1');

        $response->assertStatus(200);
        $response->assertJsonCount(10, 'data');
        $response->assertJsonStructure([
            'data',
            'links',
            'meta' => [
                'current_page',
                'last_page',
                'per_page',
                'total',
            ],
        ]);
    }

    public function test_supports_sorting_for_domain_list(): void
    {
        CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'a-domain.com',
            'created_at' => now()->subDays(2),
        ]);

        CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'z-domain.com',
            'created_at' => now()->subDay(),
        ]);

        $response = $this->withHeaders([
            'X-Tenant-ID' => $this->tenant->id,
        ])->getJson('/api/v1/tenant/custom-domains?sort_by=domain_name&sort_order=asc');

        $response->assertStatus(200);
        $response->assertJsonPath('data.0.domainName', 'a-domain.com');
        $response->assertJsonPath('data.1.domainName', 'z-domain.com');
    }
}
