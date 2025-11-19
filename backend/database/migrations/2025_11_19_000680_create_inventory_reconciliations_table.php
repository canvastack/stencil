<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_reconciliations', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('model_uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('inventory_item_id')->constrained('inventory_items')->cascadeOnDelete();
            $table->foreignId('inventory_location_id')->nullable()->constrained('inventory_locations')->cascadeOnDelete();
            $table->decimal('expected_quantity', 15, 4);
            $table->decimal('counted_quantity', 15, 4);
            $table->decimal('variance_quantity', 15, 4);
            $table->decimal('variance_value', 15, 4)->default(0);
            $table->string('status', 30)->default('open');
            $table->string('source', 50)->nullable();
            $table->foreignId('initiated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('initiated_at')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('resolved_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index('tenant_id');
            $table->index('status');
            $table->index(['tenant_id', 'inventory_item_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_reconciliations');
    }
};
