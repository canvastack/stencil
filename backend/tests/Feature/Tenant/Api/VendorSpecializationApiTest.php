<?php

namespace Tests\Feature\Tenant\Api;

use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class VendorSpecializationApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Tenant $tenant;
    protected string $tenantHost;
    protected Vendor $vendor;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create();
        $this->tenantHost = $this->tenant->slug . '.canvastencil.test';
        $this->tenant->update(['domain' => $this->tenantHost]);

        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
        
        Sanctum::actingAs($this->user);
        auth('tenant')->setUser($this->user);

        app()->instance('current_tenant', $this->tenant);
        config(['multitenancy.current_tenant' => $this->tenant]);

        $this->vendor = Vendor::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Test Vendor',
            'specializations' => [],
        ]);
    }

    public function test_can_list_vendor_specializations(): void
    {
        $this->vendor->update([
            'specializations' => [
                [
                    'id' => 1,
                    'name' => 'Glass Etching',
                    'category' => 'Etching & Engraving',
                    'experience_years' => 5,
                ],
                [
                    'id' => 2,
                    'name' => 'Metal Fabrication',
                    'category' => 'Metalworking',
                    'experience_years' => 8,
                ],
            ]
        ]);

        $response = $this->tenantGet('/api/v1/tenant/vendors/' . $this->vendor->id . '/specializations');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                '*' => [
                    'id',
                    'vendor_id',
                    'name',
                    'category',
                    'experience_years',
                    'certification',
                ]
            ],
            'meta' => [
                'vendor_id',
                'vendor_name',
                'total_specializations',
            ]
        ]);

        $this->assertTrue($response->json('success'));
        $this->assertCount(2, $response->json('data'));
        $this->assertEquals($this->vendor->name, $response->json('meta.vendor_name'));
    }

    public function test_list_specializations_handles_empty_array(): void
    {
        $response = $this->tenantGet('/api/v1/tenant/vendors/' . $this->vendor->id . '/specializations');

        $response->assertStatus(200);
        $this->assertTrue($response->json('success'));
        $this->assertCount(0, $response->json('data'));
        $this->assertEquals(0, $response->json('meta.total_specializations'));
    }

    public function test_list_specializations_transforms_string_array(): void
    {
        $this->vendor->update([
            'specializations' => ['Glass Etching', 'Metal Work', 'Wood Carving']
        ]);

        $response = $this->tenantGet('/api/v1/tenant/vendors/' . $this->vendor->id . '/specializations');

        $response->assertStatus(200);
        $this->assertCount(3, $response->json('data'));
        $this->assertEquals('Glass Etching', $response->json('data.0.name'));
        $this->assertNotNull($response->json('data.0.category'));
    }

    public function test_can_add_vendor_specialization(): void
    {
        $specializationData = [
            'name' => 'Laser Engraving',
            'category' => 'Etching & Engraving',
            'experience_years' => 3,
            'certification' => 'ISO 9001 Certified',
        ];

        $response = $this->tenantPost('/api/v1/tenant/vendors/' . $this->vendor->id . '/specializations', $specializationData);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'id',
                'vendor_id',
                'name',
                'category',
                'experience_years',
                'certification',
            ]
        ]);

        $this->assertTrue($response->json('success'));
        $this->assertEquals('Laser Engraving', $response->json('data.name'));
        $this->assertEquals($this->vendor->id, $response->json('data.vendor_id'));

        $this->vendor->refresh();
        $this->assertCount(1, $this->vendor->specializations);
    }

    public function test_add_specialization_auto_categorizes(): void
    {
        $specializationData = [
            'name' => 'Glass Etching Services',
        ];

        $response = $this->tenantPost('/api/v1/tenant/vendors/' . $this->vendor->id . '/specializations', $specializationData);

        $response->assertStatus(201);
        $this->assertEquals('Etching & Engraving', $response->json('data.category'));
    }

    public function test_add_specialization_prevents_duplicates(): void
    {
        $this->vendor->update([
            'specializations' => [
                [
                    'id' => 1,
                    'name' => 'Glass Etching',
                    'category' => 'Etching & Engraving',
                ],
            ]
        ]);

        $specializationData = [
            'name' => 'Glass Etching',
        ];

        $response = $this->tenantPost('/api/v1/tenant/vendors/' . $this->vendor->id . '/specializations', $specializationData);

        $response->assertStatus(409);
        $this->assertFalse($response->json('success'));
        $this->assertStringContainsString('already exists', $response->json('message'));
    }

    public function test_add_specialization_validates_required_fields(): void
    {
        $response = $this->tenantPost('/api/v1/tenant/vendors/' . $this->vendor->id . '/specializations', []);

        $response->assertStatus(422);
        $response->assertJsonStructure([
            'success',
            'message',
            'errors',
        ]);
        $this->assertFalse($response->json('success'));
    }

    public function test_can_update_vendor_specialization(): void
    {
        $this->vendor->update([
            'specializations' => [
                [
                    'id' => 1,
                    'name' => 'Glass Etching',
                    'category' => 'Etching & Engraving',
                    'experience_years' => 3,
                ],
            ]
        ]);

        $updateData = [
            'experience_years' => 5,
            'certification' => 'Advanced Certification',
        ];

        $response = $this->tenantPut('/api/v1/tenant/vendors/' . $this->vendor->id . '/specializations/1', $updateData);

        $response->assertStatus(200);
        $this->assertTrue($response->json('success'));
        $this->assertEquals(5, $response->json('data.experience_years'));
        $this->assertEquals('Advanced Certification', $response->json('data.certification'));

        $this->vendor->refresh();
        $this->assertEquals(5, $this->vendor->specializations[0]['experience_years']);
    }

    public function test_update_specialization_returns_404_for_non_existent_id(): void
    {
        $this->vendor->update([
            'specializations' => [
                [
                    'id' => 1,
                    'name' => 'Glass Etching',
                ],
            ]
        ]);

        $updateData = [
            'experience_years' => 5,
        ];

        $response = $this->tenantPut('/api/v1/tenant/vendors/' . $this->vendor->id . '/specializations/99', $updateData);

        $response->assertStatus(404);
        $this->assertFalse($response->json('success'));
        $this->assertStringContainsString('not found', $response->json('message'));
    }

    public function test_can_delete_vendor_specialization(): void
    {
        $this->vendor->update([
            'specializations' => [
                [
                    'id' => 1,
                    'name' => 'Glass Etching',
                    'category' => 'Etching & Engraving',
                ],
                [
                    'id' => 2,
                    'name' => 'Metal Work',
                    'category' => 'Metalworking',
                ],
            ]
        ]);

        $response = $this->tenantDelete('/api/v1/tenant/vendors/' . $this->vendor->id . '/specializations/1');

        $response->assertStatus(200);
        $this->assertTrue($response->json('success'));

        $this->vendor->refresh();
        $this->assertCount(1, $this->vendor->specializations);
        $this->assertEquals('Metal Work', $this->vendor->specializations[0]['name']);
    }

    public function test_delete_specialization_returns_404_for_non_existent_id(): void
    {
        $this->vendor->update([
            'specializations' => [
                [
                    'id' => 1,
                    'name' => 'Glass Etching',
                ],
            ]
        ]);

        $response = $this->tenantDelete('/api/v1/tenant/vendors/' . $this->vendor->id . '/specializations/99');

        $response->assertStatus(404);
        $this->assertFalse($response->json('success'));
        $this->assertStringContainsString('not found', $response->json('message'));
    }

    public function test_specialization_operations_return_404_for_non_existent_vendor(): void
    {
        $response = $this->tenantGet('/api/v1/tenant/vendors/99999/specializations');
        $response->assertStatus(404);

        $response = $this->tenantPost('/api/v1/tenant/vendors/99999/specializations', ['name' => 'Test']);
        $response->assertStatus(404);

        $response = $this->tenantPut('/api/v1/tenant/vendors/99999/specializations/1', ['name' => 'Test']);
        $response->assertStatus(404);

        $response = $this->tenantDelete('/api/v1/tenant/vendors/99999/specializations/1');
        $response->assertStatus(404);
    }

    public function test_specialization_id_increments_correctly(): void
    {
        $response1 = $this->tenantPost('/api/v1/tenant/vendors/' . $this->vendor->id . '/specializations', [
            'name' => 'First Specialization',
        ]);
        $this->assertEquals(1, $response1->json('data.id'));

        $response2 = $this->tenantPost('/api/v1/tenant/vendors/' . $this->vendor->id . '/specializations', [
            'name' => 'Second Specialization',
        ]);
        $this->assertEquals(2, $response2->json('data.id'));

        $response3 = $this->tenantPost('/api/v1/tenant/vendors/' . $this->vendor->id . '/specializations', [
            'name' => 'Third Specialization',
        ]);
        $this->assertEquals(3, $response3->json('data.id'));
    }

    protected function tenantGet(string $uri, array $headers = []): \Illuminate\Testing\TestResponse
    {
        return $this->get($uri, array_merge([
            'Host' => $this->tenantHost,
        ], $headers));
    }

    protected function tenantPost(string $uri, array $data = [], array $headers = []): \Illuminate\Testing\TestResponse
    {
        return $this->post($uri, $data, array_merge([
            'Host' => $this->tenantHost,
        ], $headers));
    }

    protected function tenantPut(string $uri, array $data = [], array $headers = []): \Illuminate\Testing\TestResponse
    {
        return $this->put($uri, $data, array_merge([
            'Host' => $this->tenantHost,
        ], $headers));
    }

    protected function tenantDelete(string $uri, array $headers = []): \Illuminate\Testing\TestResponse
    {
        return $this->delete($uri, array_merge([
            'Host' => $this->tenantHost,
        ], $headers));
    }
}
