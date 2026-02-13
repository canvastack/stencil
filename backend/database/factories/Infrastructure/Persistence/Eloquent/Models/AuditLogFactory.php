<?php

namespace Database\Factories\Infrastructure\Persistence\Eloquent\Models;

use App\Infrastructure\Persistence\Eloquent\Models\AuditLog;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Infrastructure\Persistence\Eloquent\Models\AuditLog>
 */
class AuditLogFactory extends Factory
{
    protected $model = AuditLog::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $actionTypes = [
            'vendor_login',
            'vendor_logout',
            'vendor_login_failed',
            'vendor_profile_update',
            'quote_accepted',
            'quote_rejected',
            'quote_countered',
            'quote_message_send',
            'vendor_onboarding_initiated',
            'vendor_password_reset',
        ];

        $resourceTypes = [
            'vendor',
            'quote',
            'quote_message',
            'authentication',
        ];

        // Only use valid user types from CHECK constraint
        $userTypes = ['platform', 'tenant', 'vendor'];

        return [
            'tenant_id' => 1,
            'user_id' => null, // Will be set by test or state method
            'user_type' => $this->faker->randomElement($userTypes),
            'action_type' => $this->faker->randomElement($actionTypes),
            'resource_type' => $this->faker->randomElement($resourceTypes),
            'resource_id' => \Ramsey\Uuid\Uuid::uuid4()->toString(), // Use UUID
            'old_values' => null,
            'new_values' => null,
            'metadata' => [
                'timestamp' => now()->toIso8601String(),
            ],
            'ip_address' => $this->faker->ipv4(),
            'user_agent' => $this->faker->userAgent(),
            'created_at' => now(),
        ];
    }

    /**
     * Indicate that the audit log is for a vendor login.
     */
    public function vendorLogin(): static
    {
        return $this->state(fn (array $attributes) => [
            'user_type' => 'vendor',
            'action_type' => 'vendor_login',
            'resource_type' => 'vendor',
        ]);
    }

    /**
     * Indicate that the audit log is for a failed login.
     */
    public function failedLogin(): static
    {
        return $this->state(fn (array $attributes) => [
            'user_id' => null,
            'user_type' => 'vendor',
            'action_type' => 'vendor_login_failed',
            'resource_type' => 'authentication',
            'metadata' => [
                'email' => $this->faker->email(),
                'reason' => 'invalid_credentials',
            ],
        ]);
    }

    /**
     * Indicate that the audit log is for a quote action.
     */
    public function quoteAction(string $action = 'accepted'): static
    {
        return $this->state(fn (array $attributes) => [
            'user_type' => 'vendor',
            'action_type' => "quote_{$action}",
            'resource_type' => 'quote',
            'old_values' => ['status' => 'pending'],
            'new_values' => ['status' => $action],
        ]);
    }
}
