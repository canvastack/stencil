<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_movements', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('model_uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('inventory_item_id')->constrained('inventory_items')->cascadeOnDelete();
            $table->foreignId('from_location_id')->nullable()->constrained('inventory_locations')->cascadeOnDelete();
            $table->foreignId('to_location_id')->nullable()->constrained('inventory_locations')->cascadeOnDelete();
            $table->decimal('quantity', 15, 4);
            $table->string('movement_type', 50);
            $table->string('reason')->nullable();
            $table->string('reference_type')->nullable();
            $table->string('reference_id')->nullable();
            $table->json('metadata')->nullable();
            $table->foreignId('performed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('performed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index('tenant_id');
            $table->index('inventory_item_id');
            $table->index('movement_type');
            $table->index(['tenant_id', 'performed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_movements');
    }
};
