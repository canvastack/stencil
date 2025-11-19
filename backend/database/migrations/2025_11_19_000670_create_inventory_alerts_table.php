<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_alerts', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('model_uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('inventory_item_id')->constrained('inventory_items')->cascadeOnDelete();
            $table->foreignId('inventory_location_id')->nullable()->constrained('inventory_locations')->cascadeOnDelete();
            $table->string('alert_type', 50);
            $table->string('severity', 20)->default('warning');
            $table->string('message');
            $table->decimal('triggered_quantity', 15, 4)->nullable();
            $table->decimal('threshold_quantity', 15, 4)->nullable();
            $table->boolean('resolved')->default(false);
            $table->timestamp('resolved_at')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index('tenant_id');
            $table->index('alert_type');
            $table->index('severity');
            $table->index(['tenant_id', 'resolved']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_alerts');
    }
};
