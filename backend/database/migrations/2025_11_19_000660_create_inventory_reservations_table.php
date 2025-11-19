<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_reservations', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('model_uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('inventory_item_id')->constrained('inventory_items')->cascadeOnDelete();
            $table->foreignId('inventory_location_id')->nullable()->constrained('inventory_locations')->cascadeOnDelete();
            $table->decimal('quantity', 15, 4);
            $table->string('status', 30)->default('active');
            $table->string('reserved_for_type')->nullable();
            $table->string('reserved_for_id')->nullable();
            $table->timestamp('reserved_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('released_at')->nullable();
            $table->foreignId('reserved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('released_by')->nullable()->constrained('users')->nullOnDelete();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index('tenant_id');
            $table->index('inventory_item_id');
            $table->index('status');
            $table->index(['reserved_for_type', 'reserved_for_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_reservations');
    }
};
