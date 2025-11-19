<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_item_locations', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('model_uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('inventory_item_id')->constrained('inventory_items')->cascadeOnDelete();
            $table->foreignId('inventory_location_id')->constrained('inventory_locations')->cascadeOnDelete();
            $table->decimal('stock_on_hand', 15, 4)->default(0);
            $table->decimal('stock_reserved', 15, 4)->default(0);
            $table->decimal('stock_available', 15, 4)->default(0);
            $table->decimal('stock_damaged', 15, 4)->default(0);
            $table->decimal('stock_in_transit', 15, 4)->default(0);
            $table->timestamp('last_counted_at')->nullable();
            $table->timestamp('last_reconciled_at')->nullable();
            $table->foreignId('last_counted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['inventory_item_id', 'inventory_location_id']);
            $table->index('tenant_id');
            $table->index('inventory_item_id');
            $table->index('inventory_location_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_item_locations');
    }
};
