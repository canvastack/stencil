<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_locations', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('model_uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('location_code', 50);
            $table->string('location_name');
            $table->text('description')->nullable();
            $table->foreignId('parent_location_id')->nullable()->constrained('inventory_locations')->cascadeOnDelete();
            $table->integer('location_level')->default(1);
            $table->string('location_type', 50)->default('warehouse');
            $table->string('address_line_1')->nullable();
            $table->string('address_line_2')->nullable();
            $table->string('city')->nullable();
            $table->string('state_province')->nullable();
            $table->string('postal_code', 20)->nullable();
            $table->string('country')->default('Indonesia');
            $table->decimal('total_capacity', 15, 4)->nullable();
            $table->decimal('used_capacity', 15, 4)->default(0);
            $table->string('capacity_unit', 20)->default('cubic_meter');
            $table->boolean('temperature_controlled')->default(false);
            $table->decimal('temperature_min', 5, 2)->nullable();
            $table->decimal('temperature_max', 5, 2)->nullable();
            $table->boolean('humidity_controlled')->default(false);
            $table->decimal('humidity_max', 5, 2)->nullable();
            $table->string('security_level', 20)->default('standard');
            $table->boolean('is_active')->default(true);
            $table->boolean('is_primary')->default(false);
            $table->json('operational_hours')->nullable();
            $table->json('contact_information')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['tenant_id', 'location_code']);
            $table->index('tenant_id');
            $table->index('location_type');
            $table->index(['tenant_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_locations');
    }
};
