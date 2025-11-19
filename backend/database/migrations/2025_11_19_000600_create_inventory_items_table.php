<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('model_uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained('products')->cascadeOnDelete();
            $table->string('item_code', 100);
            $table->string('item_name');
            $table->text('description')->nullable();
            $table->string('category')->nullable();
            $table->string('subcategory')->nullable();
            $table->string('item_type', 50)->default('material');
            $table->string('unit_of_measure', 50);
            $table->decimal('weight_per_unit', 10, 4)->nullable();
            $table->decimal('volume_per_unit', 10, 4)->nullable();
            $table->string('material_type')->nullable();
            $table->string('material_grade')->nullable();
            $table->decimal('thickness', 8, 3)->nullable();
            $table->string('finish')->nullable();
            $table->string('color')->nullable();
            $table->boolean('is_serialized')->default(false);
            $table->boolean('is_batch_tracked')->default(false);
            $table->boolean('is_expirable')->default(false);
            $table->integer('shelf_life_days')->nullable();
            $table->decimal('current_stock', 15, 4)->default(0);
            $table->decimal('available_stock', 15, 4)->default(0);
            $table->decimal('reserved_stock', 15, 4)->default(0);
            $table->decimal('on_order_stock', 15, 4)->default(0);
            $table->decimal('minimum_stock_level', 15, 4)->default(0);
            $table->decimal('reorder_point', 15, 4)->default(0);
            $table->decimal('reorder_quantity', 15, 4)->default(0);
            $table->decimal('standard_cost', 15, 4)->default(0);
            $table->decimal('average_cost', 15, 4)->default(0);
            $table->decimal('last_purchase_cost', 15, 4)->default(0);
            $table->decimal('current_market_price', 15, 4)->nullable();
            $table->string('valuation_method', 20)->default('FIFO');
            $table->string('quality_grade')->nullable();
            $table->boolean('inspection_required')->default(false);
            $table->boolean('quarantine_required')->default(false);
            $table->uuid('primary_supplier_uuid')->nullable();
            $table->string('supplier_part_number')->nullable();
            $table->integer('lead_time_days')->default(0);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_discontinued')->default(false);
            $table->boolean('is_hazardous')->default(false);
            $table->string('hazard_classification')->nullable();
            $table->decimal('storage_temperature_min', 5, 2)->nullable();
            $table->decimal('storage_temperature_max', 5, 2)->nullable();
            $table->decimal('storage_humidity_max', 5, 2)->nullable();
            $table->json('technical_specifications')->nullable();
            $table->json('custom_fields')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['tenant_id', 'item_code']);
            $table->index('tenant_id');
            $table->index('item_code');
            $table->index(['category', 'subcategory']);
            $table->index('item_type');
            $table->index('valuation_method');
            $table->index(['tenant_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_items');
    }
};
