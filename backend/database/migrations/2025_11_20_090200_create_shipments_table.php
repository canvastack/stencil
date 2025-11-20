<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shipments', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('shipping_method_id')->constrained('shipping_methods')->cascadeOnDelete();
            $table->string('tracking_number')->nullable()->unique();
            $table->string('carrier_reference')->nullable();
            $table->enum('status', ['pending', 'processing', 'shipped', 'in_transit', 'delivered', 'failed', 'cancelled'])->default('pending');
            $table->json('shipping_address');
            $table->json('return_address');
            $table->decimal('weight_kg', 8, 3)->nullable();
            $table->json('dimensions')->nullable();
            $table->decimal('shipping_cost', 12, 2);
            $table->string('currency', 3)->default('IDR');
            $table->json('items');
            $table->text('special_instructions')->nullable();
            $table->timestamp('shipped_at')->nullable();
            $table->timestamp('estimated_delivery')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->json('tracking_events')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'status']);
            $table->index(['order_id']);
            $table->index(['tracking_number']);
            $table->index(['uuid']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shipments');
    }
};
