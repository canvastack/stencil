<?php

namespace Database\Factories\Infrastructure\Persistence\Eloquent\Models;

use App\Infrastructure\Persistence\Eloquent\Models\QuoteMessage;
use Illuminate\Database\Eloquent\Factories\Factory;

class QuoteMessageFactory extends Factory
{
    protected $model = QuoteMessage::class;

    public function definition(): array
    {
        return [
            'uuid' => $this->faker->uuid(),
            'tenant_id' => 1,
            'quote_id' => 1,
            'sender_id' => 1,
            'message' => $this->faker->sentence(10),
            'attachments' => [],
            'read_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    public function withAttachments(int $count = 1): self
    {
        return $this->state(function (array $attributes) use ($count) {
            $attachments = [];
            for ($i = 0; $i < $count; $i++) {
                $attachments[] = [
                    'name' => $this->faker->word() . '.pdf',
                    'path' => 'attachments/' . $this->faker->uuid() . '.pdf',
                    'size' => $this->faker->numberBetween(1000, 5 * 1024 * 1024),
                    'mime_type' => 'application/pdf'
                ];
            }
            return ['attachments' => $attachments];
        });
    }

    public function read(): self
    {
        return $this->state(function (array $attributes) {
            return ['read_at' => now()];
        });
    }
}

