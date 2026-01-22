<?php

namespace Tests\Integration\Application\TenantConfiguration;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Application\TenantConfiguration\UseCases\VerifyDomainOwnershipUseCase;
use App\Application\TenantConfiguration\Services\DomainVerificationService;
use App\Infrastructure\Persistence\Eloquent\CustomDomainEloquentModel;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Domain\Tenant\Exceptions\DomainVerificationException;
use Illuminate\Support\Facades\Http;

class VerifyDomainOwnershipUseCaseTest extends TestCase
{
    use RefreshDatabase;

    private VerifyDomainOwnershipUseCase $useCase;
    private TenantEloquentModel $tenant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = TenantEloquentModel::factory()->create();
        
        $verificationService = new DomainVerificationService();
        $this->useCase = new VerifyDomainOwnershipUseCase($verificationService);
    }

    public function test_execute_marks_domain_as_verified_on_successful_verification(): void
    {
        $domain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'success-test.com',
            'verification_method' => 'file_upload',
            'is_verified' => false,
            'status' => 'pending_verification',
        ]);

        Http::fake([
            'https://success-test.com/.well-known/canva-verification.txt' => Http::response(
                $domain->verification_token,
                200
            ),
        ]);

        $result = $this->useCase->execute($domain->uuid);

        $this->assertTrue($result['success']);
        $this->assertFalse($result['already_verified']);
        $this->assertEquals('Domain verified successfully', $result['message']);
        $this->assertEquals('file_upload', $result['verification_method']);
        $this->assertEquals($domain->uuid, $result['domain']['uuid']);
        $this->assertTrue($result['domain']['is_verified']);
        $this->assertEquals('verified', $result['domain']['status']);

        $domain->refresh();
        $this->assertTrue($domain->is_verified);
        $this->assertNotNull($domain->verified_at);
        $this->assertEquals('verified', $domain->status);
    }

    public function test_execute_marks_domain_as_failed_on_verification_failure(): void
    {
        $domain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'failed-test.com',
            'verification_method' => 'file_upload',
            'is_verified' => false,
            'status' => 'pending_verification',
        ]);

        Http::fake([
            'https://failed-test.com/.well-known/canva-verification.txt' => Http::response('', 404),
        ]);

        $result = $this->useCase->execute($domain->uuid);

        $this->assertFalse($result['success']);
        $this->assertEquals('Domain verification failed', $result['message']);
        $this->assertArrayHasKey('error', $result);
        $this->assertArrayHasKey('help', $result);
        $this->assertEquals('file_upload', $result['verification_method']);

        $domain->refresh();
        $this->assertFalse($domain->is_verified);
        $this->assertEquals('failed', $domain->status);
    }

    public function test_execute_returns_success_if_domain_already_verified(): void
    {
        $domain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'already-verified.com',
            'is_verified' => true,
            'verified_at' => now(),
            'status' => 'verified',
        ]);

        $result = $this->useCase->execute($domain->uuid);

        $this->assertTrue($result['success']);
        $this->assertTrue($result['already_verified']);
        $this->assertEquals('Domain is already verified', $result['message']);
        $this->assertEquals($domain->uuid, $result['domain']['uuid']);
        $this->assertTrue($result['domain']['is_verified']);
    }

    public function test_execute_throws_exception_when_domain_not_found(): void
    {
        $fakeUuid = '550e8400-e29b-41d4-a716-446655440000';

        $this->expectException(DomainVerificationException::class);
        $this->expectExceptionMessage('Domain not found');

        $this->useCase->execute($fakeUuid);
    }

    public function test_execute_provides_contextual_help_for_dns_txt_failure(): void
    {
        $domain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'dns-txt-test.com',
            'verification_method' => 'dns_txt',
            'is_verified' => false,
        ]);

        $mockService = $this->getMockBuilder(DomainVerificationService::class)
            ->onlyMethods(['verifyDomain'])
            ->getMock();

        $mockService->expects($this->once())
            ->method('verifyDomain')
            ->willReturn([
                'success' => false,
                'method' => 'dns_txt',
                'error' => 'Verification token not found in DNS TXT records',
                'dns_records_found' => [],
                'expected_value' => $domain->verification_token,
            ]);

        $useCase = new VerifyDomainOwnershipUseCase($mockService);
        $result = $useCase->execute($domain->uuid);

        $this->assertFalse($result['success']);
        $this->assertArrayHasKey('help', $result);
        $this->assertStringContainsString('DNS TXT record', $result['help']);
        $this->assertStringContainsString('_canva-verify', $result['help']);
    }

    public function test_execute_provides_contextual_help_for_dns_cname_failure(): void
    {
        $domain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'dns-cname-test.com',
            'verification_method' => 'dns_cname',
            'is_verified' => false,
        ]);

        $mockService = $this->getMockBuilder(DomainVerificationService::class)
            ->onlyMethods(['verifyDomain'])
            ->getMock();

        $mockService->expects($this->once())
            ->method('verifyDomain')
            ->willReturn([
                'success' => false,
                'method' => 'dns_cname',
                'error' => 'Verification target not found in DNS CNAME records',
                'dns_records_found' => [],
                'expected_value' => $domain->verification_token . '.verify.canvastack.com',
            ]);

        $useCase = new VerifyDomainOwnershipUseCase($mockService);
        $result = $useCase->execute($domain->uuid);

        $this->assertFalse($result['success']);
        $this->assertArrayHasKey('help', $result);
        $this->assertStringContainsString('DNS CNAME record', $result['help']);
        $this->assertStringContainsString('verify.canvastack.com', $result['help']);
    }

    public function test_execute_provides_contextual_help_for_file_upload_failure(): void
    {
        $domain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'file-upload-test.com',
            'verification_method' => 'file_upload',
            'is_verified' => false,
        ]);

        Http::fake([
            'https://file-upload-test.com/.well-known/canva-verification.txt' => Http::response('', 404),
        ]);

        $result = $this->useCase->execute($domain->uuid);

        $this->assertFalse($result['success']);
        $this->assertArrayHasKey('help', $result);
        $this->assertStringContainsString('.well-known/canva-verification.txt', $result['help']);
        $this->assertStringContainsString('HTTPS', $result['help']);
    }

    public function test_execute_updates_domain_status_from_pending_to_verified(): void
    {
        $domain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'status-update.com',
            'verification_method' => 'file_upload',
            'is_verified' => false,
            'status' => 'pending_verification',
        ]);

        Http::fake([
            'https://status-update.com/.well-known/canva-verification.txt' => Http::response(
                $domain->verification_token,
                200
            ),
        ]);

        $this->assertEquals('pending_verification', $domain->status);

        $result = $this->useCase->execute($domain->uuid);

        $this->assertTrue($result['success']);
        $this->assertEquals('verified', $result['domain']['status']);

        $domain->refresh();
        $this->assertEquals('verified', $domain->status);
    }

    public function test_execute_updates_domain_status_from_failed_to_verified_on_retry(): void
    {
        $domain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'retry-success.com',
            'verification_method' => 'file_upload',
            'is_verified' => false,
            'status' => 'failed',
        ]);

        Http::fake([
            'https://retry-success.com/.well-known/canva-verification.txt' => Http::response(
                $domain->verification_token,
                200
            ),
        ]);

        $this->assertEquals('failed', $domain->status);

        $result = $this->useCase->execute($domain->uuid);

        $this->assertTrue($result['success']);
        $this->assertEquals('verified', $result['domain']['status']);

        $domain->refresh();
        $this->assertEquals('verified', $domain->status);
        $this->assertTrue($domain->is_verified);
    }

    public function test_execute_includes_verification_details_in_response(): void
    {
        $domain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'details-test.com',
            'verification_method' => 'file_upload',
            'is_verified' => false,
        ]);

        Http::fake([
            'https://details-test.com/.well-known/canva-verification.txt' => Http::response(
                $domain->verification_token,
                200
            ),
        ]);

        $result = $this->useCase->execute($domain->uuid);

        $this->assertTrue($result['success']);
        $this->assertArrayHasKey('verification_details', $result);
        $this->assertArrayHasKey('method', $result['verification_details']);
        $this->assertEquals('file_upload', $result['verification_details']['method']);
        $this->assertTrue($result['verification_details']['success']);
    }

    public function test_execute_logs_verification_attempts(): void
    {
        $domain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'logging-test.com',
            'verification_method' => 'file_upload',
            'is_verified' => false,
        ]);

        Http::fake([
            'https://logging-test.com/.well-known/canva-verification.txt' => Http::response(
                $domain->verification_token,
                200
            ),
        ]);

        $this->useCase->execute($domain->uuid);

        $this->assertDatabaseHas('domain_verification_logs', [
            'custom_domain_id' => $domain->id,
            'verification_method' => 'file_upload',
            'success' => true,
        ]);
    }
}
