<?php

namespace Tests\Unit\Application\TenantConfiguration;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Application\TenantConfiguration\Services\DomainVerificationService;
use App\Infrastructure\Persistence\Eloquent\CustomDomainEloquentModel;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\DomainVerificationLogEloquentModel;
use App\Domain\Tenant\Exceptions\DomainVerificationException;
use Illuminate\Support\Facades\Http;

class DomainVerificationServiceTest extends TestCase
{
    use RefreshDatabase;

    private DomainVerificationService $service;
    private TenantEloquentModel $tenant;
    private CustomDomainEloquentModel $domain;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = new DomainVerificationService();
        
        $this->tenant = TenantEloquentModel::factory()->create();
        
        $this->domain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'test-domain.com',
            'verification_method' => 'dns_txt',
            'is_verified' => false,
        ]);
    }

    public function test_verify_dns_txt_success_when_record_matches(): void
    {
        $mockRecords = [$this->domain->verification_token];
        
        $mockService = $this->getMockBuilder(DomainVerificationService::class)
            ->onlyMethods(['getDnsTxtRecords'])
            ->getMock();
        
        $mockService->expects($this->once())
            ->method('getDnsTxtRecords')
            ->with('_canva-verify.test-domain.com')
            ->willReturn($mockRecords);
        
        $result = $mockService->verifyDnsTxt($this->domain);
        
        $this->assertTrue($result['success']);
        $this->assertEquals('dns_txt', $result['method']);
        $this->assertEquals($this->domain->verification_token, $result['matched_record']);
    }

    public function test_verify_dns_txt_fails_when_no_matching_record(): void
    {
        $mockRecords = ['wrong-token-12345'];
        
        $mockService = $this->getMockBuilder(DomainVerificationService::class)
            ->onlyMethods(['getDnsTxtRecords'])
            ->getMock();
        
        $mockService->expects($this->once())
            ->method('getDnsTxtRecords')
            ->willReturn($mockRecords);
        
        $result = $mockService->verifyDnsTxt($this->domain);
        
        $this->assertFalse($result['success']);
        $this->assertEquals('dns_txt', $result['method']);
        $this->assertStringContainsString('Verification token not found', $result['error']);
    }

    public function test_verify_dns_txt_fails_when_no_records_found(): void
    {
        $mockService = $this->getMockBuilder(DomainVerificationService::class)
            ->onlyMethods(['getDnsTxtRecords'])
            ->getMock();
        
        $mockService->expects($this->once())
            ->method('getDnsTxtRecords')
            ->willReturn([]);
        
        $result = $mockService->verifyDnsTxt($this->domain);
        
        $this->assertFalse($result['success']);
        $this->assertArrayHasKey('dns_records_found', $result);
        $this->assertEmpty($result['dns_records_found']);
    }

    public function test_verify_dns_cname_success_when_record_matches(): void
    {
        $this->domain->update(['verification_method' => 'dns_cname']);
        
        $expectedTarget = $this->domain->verification_token . '.verify.canvastack.com';
        $mockRecords = [$expectedTarget];
        
        $mockService = $this->getMockBuilder(DomainVerificationService::class)
            ->onlyMethods(['getDnsCnameRecords'])
            ->getMock();
        
        $mockService->expects($this->once())
            ->method('getDnsCnameRecords')
            ->with('_canva-verify.test-domain.com')
            ->willReturn($mockRecords);
        
        $result = $mockService->verifyDnsCname($this->domain);
        
        $this->assertTrue($result['success']);
        $this->assertEquals('dns_cname', $result['method']);
        $this->assertEquals($expectedTarget, $result['matched_record']);
    }

    public function test_verify_dns_cname_fails_when_no_matching_record(): void
    {
        $this->domain->update(['verification_method' => 'dns_cname']);
        
        $mockRecords = ['wrong-target.example.com'];
        
        $mockService = $this->getMockBuilder(DomainVerificationService::class)
            ->onlyMethods(['getDnsCnameRecords'])
            ->getMock();
        
        $mockService->expects($this->once())
            ->method('getDnsCnameRecords')
            ->willReturn($mockRecords);
        
        $result = $mockService->verifyDnsCname($this->domain);
        
        $this->assertFalse($result['success']);
        $this->assertStringContainsString('not found in DNS CNAME records', $result['error']);
    }

    public function test_verify_file_upload_success_when_file_exists(): void
    {
        $this->domain->update(['verification_method' => 'file_upload']);
        
        $verificationUrl = "https://test-domain.com/.well-known/canva-verify-{$this->domain->verification_token}.txt";
        
        Http::fake([
            $verificationUrl => Http::response(
                $this->domain->verification_token,
                200
            ),
        ]);
        
        $result = $this->service->verifyFileUpload($this->domain);
        
        $this->assertTrue($result['success']);
        $this->assertEquals('file_upload', $result['method']);
        $this->assertEquals($this->domain->verification_token, $result['file_content']);
    }

    public function test_verify_file_upload_fails_when_file_not_found(): void
    {
        $this->domain->update(['verification_method' => 'file_upload']);
        
        $verificationUrl = "https://test-domain.com/.well-known/canva-verify-{$this->domain->verification_token}.txt";
        
        Http::fake([
            $verificationUrl => Http::response('', 404),
        ]);
        
        $result = $this->service->verifyFileUpload($this->domain);
        
        $this->assertFalse($result['success']);
        $this->assertStringContainsString('not found or not accessible', $result['error']);
    }

    public function test_verify_file_upload_fails_when_content_doesnt_match(): void
    {
        $this->domain->update(['verification_method' => 'file_upload']);
        
        $verificationUrl = "https://test-domain.com/.well-known/canva-verify-{$this->domain->verification_token}.txt";
        
        Http::fake([
            $verificationUrl => Http::response(
                'wrong-token-content',
                200
            ),
        ]);
        
        $result = $this->service->verifyFileUpload($this->domain);
        
        $this->assertFalse($result['success']);
        $this->assertStringContainsString('does not match', $result['error']);
    }

    public function test_verify_domain_throws_exception_for_invalid_method(): void
    {
        $domain = \Mockery::mock(CustomDomainEloquentModel::class);
        $domain->shouldReceive('getAttribute')->with(\Mockery::any())->andReturnUsing(function ($key) {
            return match($key) {
                'verification_method' => 'invalid_method',
                'id' => 999,
                'uuid' => 'test-uuid',
                'domain_name' => 'test-domain.com',
                default => null,
            };
        });
        $domain->shouldReceive('__get')->with(\Mockery::any())->andReturnUsing(function ($key) {
            return match($key) {
                'verification_method' => 'invalid_method',
                'id' => 999,
                'uuid' => 'test-uuid',
                'domain_name' => 'test-domain.com',
                default => null,
            };
        });
        
        $this->expectException(DomainVerificationException::class);
        $this->expectExceptionMessage('Invalid verification method');
        
        $this->service->verifyDomain($domain);
    }

    public function test_verify_domain_logs_verification_attempt_on_success(): void
    {
        $this->domain->update(['verification_method' => 'file_upload']);
        
        $verificationUrl = "https://test-domain.com/.well-known/canva-verify-{$this->domain->verification_token}.txt";
        
        Http::fake([
            $verificationUrl => Http::response(
                $this->domain->verification_token,
                200
            ),
        ]);
        
        $this->service->verifyDomain($this->domain);
        
        $this->assertDatabaseHas('domain_verification_logs', [
            'custom_domain_id' => $this->domain->id,
            'verification_method' => 'file_upload',
            'verification_status' => 'success',
        ]);
    }

    public function test_verify_domain_logs_verification_attempt_on_failure(): void
    {
        $this->domain->update(['verification_method' => 'file_upload']);
        
        $verificationUrl = "https://test-domain.com/.well-known/canva-verify-{$this->domain->verification_token}.txt";
        
        Http::fake([
            $verificationUrl => Http::response('', 404),
        ]);
        
        try {
            $this->service->verifyDomain($this->domain);
        } catch (DomainVerificationException $e) {
        }
        
        $this->assertDatabaseHas('domain_verification_logs', [
            'custom_domain_id' => $this->domain->id,
            'verification_method' => 'file_upload',
            'verification_status' => 'failed',
        ]);
    }

    public function test_verify_domain_throws_exception_on_dns_lookup_failure(): void
    {
        $mockService = $this->getMockBuilder(DomainVerificationService::class)
            ->onlyMethods(['getDnsTxtRecords'])
            ->getMock();
        
        $mockService->expects($this->once())
            ->method('getDnsTxtRecords')
            ->willThrowException(new \Exception('DNS lookup failed'));
        
        $this->expectException(DomainVerificationException::class);
        $this->expectExceptionMessage('DNS TXT lookup failed');
        
        $mockService->verifyDnsTxt($this->domain);
    }

    public function test_file_verification_only_uses_https(): void
    {
        $this->domain->update(['verification_method' => 'file_upload']);
        
        $verificationUrl = "https://test-domain.com/.well-known/canva-verify-{$this->domain->verification_token}.txt";
        
        Http::fake([
            $verificationUrl => Http::response(
                $this->domain->verification_token,
                200
            ),
        ]);
        
        $result = $this->service->verifyFileUpload($this->domain);
        
        $this->assertTrue($result['success']);
        
        Http::assertSent(function ($request) use ($verificationUrl) {
            return $request->url() === $verificationUrl;
        });
    }

    public function test_dns_txt_verification_uses_correct_record_name(): void
    {
        $mockService = $this->getMockBuilder(DomainVerificationService::class)
            ->onlyMethods(['getDnsTxtRecords'])
            ->getMock();
        
        $mockService->expects($this->once())
            ->method('getDnsTxtRecords')
            ->with($this->equalTo('_canva-verify.test-domain.com'))
            ->willReturn([$this->domain->verification_token]);
        
        $result = $mockService->verifyDnsTxt($this->domain);
        
        $this->assertTrue($result['success']);
    }

    public function test_dns_cname_verification_uses_correct_record_name_and_target(): void
    {
        $this->domain->update(['verification_method' => 'dns_cname']);
        
        $expectedTarget = $this->domain->verification_token . '.verify.canvastack.com';
        
        $mockService = $this->getMockBuilder(DomainVerificationService::class)
            ->onlyMethods(['getDnsCnameRecords'])
            ->getMock();
        
        $mockService->expects($this->once())
            ->method('getDnsCnameRecords')
            ->with($this->equalTo('_canva-verify.test-domain.com'))
            ->willReturn([$expectedTarget]);
        
        $result = $mockService->verifyDnsCname($this->domain);
        
        $this->assertTrue($result['success']);
        $this->assertEquals($expectedTarget, $result['matched_record']);
    }
}
