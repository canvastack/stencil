<?php

namespace Tests\Unit\Infrastructure\Adapters;

use Tests\TestCase;
use App\Infrastructure\Adapters\CloudflareDNSAdapter;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Config;

class CloudflareDNSAdapterTest extends TestCase
{
    private CloudflareDNSAdapter $adapter;
    private string $zoneId;
    private string $recordId;

    protected function setUp(): void
    {
        parent::setUp();

        Config::set('dns-providers.cloudflare.api_url', 'https://api.cloudflare.com/client/v4');
        Config::set('dns-providers.cloudflare.api_token', 'test-token-12345');
        Config::set('dns-providers.cloudflare.api_email', null);
        Config::set('dns-providers.cloudflare.api_key', null);
        Config::set('dns-providers.cloudflare.default_ttl', 300);
        Config::set('dns-providers.cloudflare.proxied', true);

        $this->adapter = new CloudflareDNSAdapter();
        $this->zoneId = 'zone-test-id-123';
        $this->recordId = 'record-test-id-456';
    }

    public function test_create_txt_record_success(): void
    {
        Http::fake([
            '*/zones/*/dns_records' => Http::response([
                'success' => true,
                'result' => [
                    'id' => $this->recordId,
                    'type' => 'TXT',
                    'name' => '_canva-verify.example.com',
                    'content' => 'verification-token-12345',
                    'ttl' => 300,
                    'proxied' => false,
                ],
            ], 200),
        ]);

        $result = $this->adapter->createTxtRecord(
            $this->zoneId,
            '_canva-verify.example.com',
            'verification-token-12345',
            300
        );

        $this->assertTrue($result['success']);
        $this->assertEquals($this->recordId, $result['record_id']);
        $this->assertArrayHasKey('record', $result);
        $this->assertEquals('TXT', $result['record']['type']);
    }

    public function test_create_txt_record_failure(): void
    {
        Http::fake([
            '*/zones/*/dns_records' => Http::response([
                'success' => false,
                'errors' => [
                    ['message' => 'Invalid zone ID'],
                ],
            ], 400),
        ]);

        $result = $this->adapter->createTxtRecord(
            'invalid-zone-id',
            '_canva-verify.example.com',
            'verification-token-12345'
        );

        $this->assertFalse($result['success']);
        $this->assertArrayHasKey('error', $result);
        $this->assertStringContainsString('Invalid zone ID', $result['error']);
    }

    public function test_create_cname_record_success(): void
    {
        Http::fake([
            '*/zones/*/dns_records' => Http::response([
                'success' => true,
                'result' => [
                    'id' => $this->recordId,
                    'type' => 'CNAME',
                    'name' => '_canva-verify.example.com',
                    'content' => 'token.verify.canvastack.com',
                    'ttl' => 300,
                    'proxied' => false,
                ],
            ], 200),
        ]);

        $result = $this->adapter->createCnameRecord(
            $this->zoneId,
            '_canva-verify.example.com',
            'token.verify.canvastack.com',
            300
        );

        $this->assertTrue($result['success']);
        $this->assertEquals($this->recordId, $result['record_id']);
        $this->assertEquals('CNAME', $result['record']['type']);
    }

    public function test_create_a_record_success(): void
    {
        Http::fake([
            '*/zones/*/dns_records' => Http::response([
                'success' => true,
                'result' => [
                    'id' => $this->recordId,
                    'type' => 'A',
                    'name' => 'example.com',
                    'content' => '192.168.1.1',
                    'ttl' => 300,
                    'proxied' => true,
                ],
            ], 200),
        ]);

        $result = $this->adapter->createARecord(
            $this->zoneId,
            'example.com',
            '192.168.1.1',
            300,
            true
        );

        $this->assertTrue($result['success']);
        $this->assertEquals($this->recordId, $result['record_id']);
        $this->assertEquals('A', $result['record']['type']);
        $this->assertTrue($result['record']['proxied']);
    }

    public function test_update_record_success(): void
    {
        Http::fake([
            '*/zones/*/dns_records/*' => Http::response([
                'success' => true,
                'result' => [
                    'id' => $this->recordId,
                    'type' => 'TXT',
                    'name' => '_canva-verify.example.com',
                    'content' => 'new-verification-token',
                    'ttl' => 600,
                ],
            ], 200),
        ]);

        $result = $this->adapter->updateRecord(
            $this->zoneId,
            $this->recordId,
            ['content' => 'new-verification-token', 'ttl' => 600]
        );

        $this->assertTrue($result['success']);
        $this->assertArrayHasKey('record', $result);
        $this->assertEquals('new-verification-token', $result['record']['content']);
    }

    public function test_delete_record_success(): void
    {
        Http::fake([
            '*/zones/*/dns_records/*' => Http::response([
                'success' => true,
                'result' => ['id' => $this->recordId],
            ], 200),
        ]);

        $result = $this->adapter->deleteRecord($this->zoneId, $this->recordId);

        $this->assertTrue($result['success']);
    }

    public function test_delete_record_failure(): void
    {
        Http::fake([
            '*/zones/*/dns_records/*' => Http::response([
                'success' => false,
                'errors' => [
                    ['message' => 'Record not found'],
                ],
            ], 404),
        ]);

        $result = $this->adapter->deleteRecord($this->zoneId, $this->recordId);

        $this->assertFalse($result['success']);
        $this->assertArrayHasKey('error', $result);
    }

    public function test_get_record_success(): void
    {
        Http::fake([
            '*/zones/*/dns_records/*' => Http::response([
                'success' => true,
                'result' => [
                    'id' => $this->recordId,
                    'type' => 'TXT',
                    'name' => '_canva-verify.example.com',
                    'content' => 'verification-token-12345',
                ],
            ], 200),
        ]);

        $result = $this->adapter->getRecord($this->zoneId, $this->recordId);

        $this->assertTrue($result['success']);
        $this->assertArrayHasKey('record', $result);
        $this->assertEquals($this->recordId, $result['record']['id']);
    }

    public function test_list_records_success(): void
    {
        Http::fake([
            '*/zones/*/dns_records*' => Http::response([
                'success' => true,
                'result' => [
                    [
                        'id' => 'record-1',
                        'type' => 'TXT',
                        'name' => '_canva-verify.example.com',
                    ],
                    [
                        'id' => 'record-2',
                        'type' => 'A',
                        'name' => 'example.com',
                    ],
                ],
                'result_info' => [
                    'total_count' => 2,
                    'page' => 1,
                    'per_page' => 20,
                ],
            ], 200),
        ]);

        $result = $this->adapter->listRecords($this->zoneId, 'TXT');

        $this->assertTrue($result['success']);
        $this->assertArrayHasKey('records', $result);
        $this->assertCount(2, $result['records']);
        $this->assertArrayHasKey('pagination', $result);
    }

    public function test_list_records_with_filters(): void
    {
        Http::fake([
            '*/zones/*/dns_records*' => Http::response([
                'success' => true,
                'result' => [
                    [
                        'id' => 'record-1',
                        'type' => 'TXT',
                        'name' => '_canva-verify.example.com',
                    ],
                ],
                'result_info' => [
                    'total_count' => 1,
                ],
            ], 200),
        ]);

        $result = $this->adapter->listRecords($this->zoneId, 'TXT', '_canva-verify.example.com');

        $this->assertTrue($result['success']);
        $this->assertCount(1, $result['records']);
    }

    public function test_get_zone_by_domain_success(): void
    {
        Http::fake([
            '*/zones*' => Http::response([
                'success' => true,
                'result' => [
                    [
                        'id' => $this->zoneId,
                        'name' => 'example.com',
                        'status' => 'active',
                    ],
                ],
            ], 200),
        ]);

        $result = $this->adapter->getZoneByDomain('example.com');

        $this->assertTrue($result['success']);
        $this->assertArrayHasKey('zone', $result);
        $this->assertEquals($this->zoneId, $result['zone']['id']);
        $this->assertEquals('example.com', $result['zone']['name']);
    }

    public function test_get_zone_by_domain_not_found(): void
    {
        Http::fake([
            '*/zones*' => Http::response([
                'success' => true,
                'result' => [],
            ], 200),
        ]);

        $result = $this->adapter->getZoneByDomain('nonexistent.com');

        $this->assertFalse($result['success']);
        $this->assertArrayHasKey('error', $result);
        $this->assertStringContainsString('not found', $result['error']);
    }

    public function test_list_zones_success(): void
    {
        Http::fake([
            '*/zones*' => Http::response([
                'success' => true,
                'result' => [
                    ['id' => 'zone-1', 'name' => 'example1.com'],
                    ['id' => 'zone-2', 'name' => 'example2.com'],
                ],
                'result_info' => [
                    'total_count' => 2,
                ],
            ], 200),
        ]);

        $result = $this->adapter->listZones();

        $this->assertTrue($result['success']);
        $this->assertArrayHasKey('zones', $result);
        $this->assertCount(2, $result['zones']);
    }

    public function test_verify_connection_success(): void
    {
        Http::fake([
            '*/user/tokens/verify' => Http::response([
                'success' => true,
                'result' => [
                    'status' => 'active',
                ],
            ], 200),
        ]);

        $result = $this->adapter->verifyConnection();

        $this->assertTrue($result);
    }

    public function test_verify_connection_failure(): void
    {
        Http::fake([
            '*/user/tokens/verify' => Http::response([
                'success' => false,
                'errors' => [
                    ['message' => 'Invalid API token'],
                ],
            ], 401),
        ]);

        $result = $this->adapter->verifyConnection();

        $this->assertFalse($result);
    }

    public function test_create_txt_record_uses_bearer_token_authentication(): void
    {
        Http::fake([
            '*/zones/*/dns_records' => Http::response(['success' => true, 'result' => []], 200),
        ]);

        $this->adapter->createTxtRecord($this->zoneId, 'test.com', 'token');

        Http::assertSent(function ($request) {
            return $request->hasHeader('Authorization', 'Bearer test-token-12345');
        });
    }

    public function test_create_txt_record_sets_proxied_false_for_txt_records(): void
    {
        Http::fake([
            '*/zones/*/dns_records' => Http::response(['success' => true, 'result' => []], 200),
        ]);

        $this->adapter->createTxtRecord($this->zoneId, 'test.com', 'token');

        Http::assertSent(function ($request) {
            $data = json_decode($request->body(), true);
            return $data['proxied'] === false;
        });
    }

    public function test_create_a_record_respects_proxied_parameter(): void
    {
        Http::fake([
            '*/zones/*/dns_records' => Http::response(['success' => true, 'result' => ['id' => 'test-id']], 200),
        ]);

        $this->adapter->createARecord($this->zoneId, 'test.com', '192.168.1.1');

        Http::assertSent(function ($request) {
            $data = json_decode($request->body(), true);
            return isset($data['proxied']);
        });
    }

    public function test_handles_network_errors_gracefully(): void
    {
        Http::fake([
            '*/zones/*/dns_records' => Http::response(null, 500),
        ]);

        $result = $this->adapter->createTxtRecord($this->zoneId, 'test.com', 'token');

        $this->assertFalse($result['success']);
        $this->assertArrayHasKey('error', $result);
    }

    public function test_handles_timeout_errors_gracefully(): void
    {
        Http::fake([
            '*/zones/*/dns_records' => function () {
                throw new \Illuminate\Http\Client\ConnectionException('Timeout');
            },
        ]);

        $result = $this->adapter->createTxtRecord($this->zoneId, 'test.com', 'token');

        $this->assertFalse($result['success']);
        $this->assertArrayHasKey('error', $result);
    }
}
