<?php

declare(strict_types=1);

namespace Database\Factories\Infrastructure\Persistence\Eloquent\Models;

use App\Infrastructure\Persistence\Eloquent\Models\Notification;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class NotificationFactory extends Factory
{
    protected $model = Notification::class;

    public function definition(): array
    {
        return [
            'uuid' => Str::uuid(),
            'tenant_id' => 1,
            'user_id' => User::factory(),
            'type' => $this->faker->randomElement([
                'quote_received',
                'quote_response',
                'quote_expired',
                'order_status_changed',
                'payment_received',
            ]),
            'title' => $this->faker->sentence(),
            'message' => $this->faker->paragraph(),
            'data' => [],
            'read_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    public function read(): static
    {
        return $this->state(fn (array $attributes) => [
            'read_at' => now(),
        ]);
    }

    public function unread(): static
    {
        return $this->state(fn (array $attributes) => [
            'read_at' => null,
        ]);
    }

    public function forTenant(int $tenantId): static
    {
        return $this->state(fn (array $attributes) => [
            'tenant_id' => $tenantId,
        ]);
    }

    public function forUser(int $userId): static
    {
        return $this->state(fn (array $attributes) => [
            'user_id' => $userId,
        ]);
    }

    public function quoteReceived(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'quote_received',
            'title' => 'New Quote Request',
            'message' => 'You have received a new quote request',
        ]);
    }

    public function quoteResponse(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'quote_response',
            'title' => 'Vendor Responded to Quote',
            'message' => 'A vendor has responded to your quote request',
        ]);
    }
}
