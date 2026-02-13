<?php

namespace Tests\Feature\Api\Admin;

use App\Infrastructure\Persistence\Eloquent\Models\NotificationPreference;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Test notification preferences API endpoints
 * 
 * Tests:
 * - Get default notification preferences
 * - Update notification preferences
 * - Preferences are tenant-scoped
 * - Preferences persist across requests
 */
class NotificationPreferencesTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private TenantEloquentModel $tenant;
    private string $tenantHost;

    protected function setUp(): void
    {
        parent::setUp();

        // Create tenant
        $this->tenant = TenantEloquentModel::factory()->create();
        $this->tenantHost = $this->tenant->slug . '.canvastencil.test';
        $this->tenant->update(['domain' => $this->tenantHost]);

        // Create user
        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'account_type' => 'tenant',
        ]);

        // Authenticate user
        Sanctum::actingAs($this->user);
        auth('tenant')->setUser($this->user);

        // Set tenant context
        app()->instance('current_tenant', $this->tenant);
        config(['multitenancy.current_tenant' => $this->tenant]);
    }

    public function test_get_default_notification_preferences(): void
    {
        $response = $this->tenantGet('/api/notifications/preferences');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'preferences' => [
                    'vendor_quote_accepted' => ['email', 'in_app'],
                    'vendor_quote_rejected' => ['email', 'in_app'],
                    'vendor_quote_countered' => ['email', 'in_app'],
                    'vendor_quote_message' => ['email', 'in_app'],
                    'order_status_changes' => ['email', 'in_app'],
                    'payment_updates' => ['email', 'in_app'],
                    'system_announcements' => ['email', 'in_app'],
                ]
            ]);

        // Verify all defaults are true
        $preferences = $response->json('preferences');
        foreach ($preferences as $type => $channels) {
            $this->assertTrue($channels['email'], "Default email should be true for {$type}");
            $this->assertTrue($channels['in_app'], "Default in_app should be true for {$type}");
        }
    }

    public function test_update_notification_preferences(): void
    {
        $newPreferences = [
            'vendor_quote_accepted' => [
                'email' => false,
                'in_app' => true,
            ],
            'vendor_quote_rejected' => [
                'email' => true,
                'in_app' => false,
            ],
        ];

        $response = $this->tenantPut('/api/notifications/preferences', [
            'preferences' => $newPreferences
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Preferences updated successfully',
            ]);

        // Verify preferences were saved
        $savedPreferences = $response->json('preferences');
        $this->assertFalse($savedPreferences['vendor_quote_accepted']['email']);
        $this->assertTrue($savedPreferences['vendor_quote_accepted']['in_app']);
        $this->assertTrue($savedPreferences['vendor_quote_rejected']['email']);
        $this->assertFalse($savedPreferences['vendor_quote_rejected']['in_app']);
    }

    public function test_preferences_persist_across_requests(): void
    {
        // Update preferences
        $newPreferences = [
            'vendor_quote_accepted' => [
                'email' => false,
                'in_app' => true,
            ],
        ];

        $this->tenantPut('/api/notifications/preferences', [
            'preferences' => $newPreferences
        ]);

        // Get preferences in a new request
        $response = $this->tenantGet('/api/notifications/preferences');

        $response->assertStatus(200);
        $preferences = $response->json('preferences');
        $this->assertFalse($preferences['vendor_quote_accepted']['email']);
        $this->assertTrue($preferences['vendor_quote_accepted']['in_app']);
    }

    public function test_preferences_are_tenant_scoped(): void
    {
        // Create another tenant and user
        $otherTenant = TenantEloquentModel::factory()->create();
        $otherTenantHost = $otherTenant->slug . '.canvastencil.test';
        $otherTenant->update(['domain' => $otherTenantHost]);
        
        $otherUser = User::factory()->create([
            'tenant_id' => $otherTenant->id,
            'account_type' => 'tenant',
        ]);

        // Update preferences for first user
        $this->tenantPut('/api/notifications/preferences', [
            'preferences' => [
                'vendor_quote_accepted' => [
                    'email' => false,
                    'in_app' => false,
                ],
            ]
        ]);

        // Switch to other user and tenant
        Sanctum::actingAs($otherUser);
        auth('tenant')->setUser($otherUser);
        $this->tenant = $otherTenant;
        $this->tenantHost = $otherTenantHost;
        app()->instance('current_tenant', $otherTenant);
        config(['multitenancy.current_tenant' => $otherTenant]);

        // Get preferences for other user (should be defaults)
        $response = $this->tenantGet('/api/notifications/preferences');

        $response->assertStatus(200);
        $preferences = $response->json('preferences');
        
        // Other user should have default preferences (all true)
        $this->assertTrue($preferences['vendor_quote_accepted']['email']);
        $this->assertTrue($preferences['vendor_quote_accepted']['in_app']);
    }

    public function test_partial_preference_update_merges_with_existing(): void
    {
        // Set initial preferences
        $this->tenantPut('/api/notifications/preferences', [
            'preferences' => [
                'vendor_quote_accepted' => [
                    'email' => false,
                    'in_app' => true,
                ],
                'vendor_quote_rejected' => [
                    'email' => true,
                    'in_app' => false,
                ],
            ]
        ]);

        // Update only one preference
        $this->tenantPut('/api/notifications/preferences', [
            'preferences' => [
                'vendor_quote_countered' => [
                    'email' => false,
                    'in_app' => false,
                ],
            ]
        ]);

        // Get all preferences
        $response = $this->tenantGet('/api/notifications/preferences');

        $preferences = $response->json('preferences');
        
        // Previous preferences should still be there
        $this->assertFalse($preferences['vendor_quote_accepted']['email']);
        $this->assertTrue($preferences['vendor_quote_accepted']['in_app']);
        $this->assertTrue($preferences['vendor_quote_rejected']['email']);
        $this->assertFalse($preferences['vendor_quote_rejected']['in_app']);
        
        // New preference should be added
        $this->assertFalse($preferences['vendor_quote_countered']['email']);
        $this->assertFalse($preferences['vendor_quote_countered']['in_app']);
    }

    public function test_requires_authentication(): void
    {
        // Create a new test instance without authentication
        $this->refreshApplication();
        
        // Make unauthenticated requests
        $response = $this->getJson('https://' . $this->tenantHost . $this->tenantUri('/api/notifications/preferences'));
        $response->assertStatus(401);

        $response = $this->putJson('https://' . $this->tenantHost . $this->tenantUri('/api/notifications/preferences'), [
            'preferences' => []
        ]);
        $response->assertStatus(401);
    }

    public function test_validates_preference_structure(): void
    {
        // Invalid structure - missing email/in_app
        $response = $this->tenantPut('/api/notifications/preferences', [
            'preferences' => [
                'vendor_quote_accepted' => [
                    'invalid_key' => true,
                ],
            ]
        ]);

        // Should still succeed but ignore invalid keys
        $response->assertStatus(200);
    }

    public function test_notification_preference_record_created_in_database(): void
    {
        // Update preferences
        $this->tenantPut('/api/notifications/preferences', [
            'preferences' => [
                'vendor_quote_accepted' => [
                    'email' => false,
                    'in_app' => true,
                ],
            ]
        ]);

        // Verify record exists in database
        $this->assertDatabaseHas('notification_preferences', [
            'user_id' => $this->user->id,
            'tenant_id' => $this->tenant->id,
        ]);

        // Verify preferences are stored correctly
        $preference = NotificationPreference::where('user_id', $this->user->id)
            ->where('tenant_id', $this->tenant->id)
            ->first();

        $this->assertNotNull($preference);
        $this->assertIsArray($preference->preferences);
        $this->assertFalse($preference->preferences['vendor_quote_accepted']['email']);
        $this->assertTrue($preference->preferences['vendor_quote_accepted']['in_app']);
    }

    // Helper methods for tenant requests
    private function tenantGet(string $uri)
    {
        return $this->getJson('https://' . $this->tenantHost . $this->tenantUri($uri));
    }

    private function tenantPut(string $uri, array $data = [])
    {
        return $this->putJson('https://' . $this->tenantHost . $this->tenantUri($uri), $data);
    }

    private function tenantUri(string $uri): string
    {
        if (str_starts_with($uri, '/api/v1/tenant/')) {
            return $uri;
        }

        if (str_starts_with($uri, '/api/v1/')) {
            return '/api/v1/tenant/' . ltrim(substr($uri, 8), '/');
        }

        if (str_starts_with($uri, '/api/')) {
            return '/api/v1/tenant/' . ltrim(substr($uri, 5), '/');
        }

        return '/api/v1/tenant' . $uri;
    }
}
