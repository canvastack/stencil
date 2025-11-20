<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shipping_methods', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('name');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->string('carrier');
            $table->enum('type', ['standard', 'express', 'same_day', 'pickup'])->default('standard');
            $table->json('service_areas')->nullable();
            $table->integer('estimated_days_min')->default(1);
            $table->integer('estimated_days_max')->default(7);
            $table->decimal('base_cost', 12, 2)->default(0);
            $table->json('cost_calculation')->nullable();
            $table->json('restrictions')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_default')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['tenant_id', 'is_active']);
            $table->index(['carrier', 'type']);
            $table->index(['uuid']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shipping_methods');
    }
};
