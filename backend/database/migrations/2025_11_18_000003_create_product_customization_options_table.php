<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('product_customization_options', function (Blueprint $table) {
            // Primary Key (BIGSERIAL for references)
            $table->id();
            
            // UUID for public-facing IDs
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            
            // Tenant isolation
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            
            // Product reference (nullable for global options)
            $table->foreignId('product_id')->nullable()->constrained('products')->cascadeOnDelete();
            
            // Category reference (for category-wide options)
            $table->foreignId('category_id')->nullable()->constrained('product_categories')->cascadeOnDelete();
            
            // Option Information
            $table->string('name'); // "Material", "Quality", "Thickness", etc.
            $table->string('label'); // Display name for frontend
            $table->enum('type', ['select', 'text', 'textarea', 'number', 'color', 'file', 'checkbox', 'radio', 'date', 'range']);
            $table->text('description')->nullable();
            $table->string('placeholder')->nullable();
            
            // Validation rules
            $table->boolean('is_required')->default(false);
            $table->json('validation_rules')->nullable(); // min, max, pattern, etc.
            $table->json('allowed_values')->nullable(); // For select, radio, checkbox types
            
            // Pricing impact
            $table->enum('price_type', ['fixed', 'percentage', 'per_unit', 'calculated'])->default('fixed');
            $table->bigInteger('price_adjustment')->default(0); // Additional cost for this option
            $table->decimal('percentage_adjustment', 5, 2)->default(0.00); // Percentage increase/decrease
            
            // UI Configuration
            $table->integer('sort_order')->default(0);
            $table->boolean('show_in_summary')->default(true);
            $table->boolean('affects_sku')->default(false);
            $table->string('group_name')->nullable(); // Group related options
            
            // Conditional visibility
            $table->json('visibility_conditions')->nullable(); // Show/hide based on other options
            $table->json('default_value')->nullable();
            
            // Status
            $table->boolean('is_active')->default(true);
            
            // Timestamps
            $table->timestamps();
            
            // Indexes
            $table->index('uuid');
            $table->index('tenant_id');
            $table->index('product_id');
            $table->index('category_id');
            $table->index('type');
            $table->index('is_required');
            $table->index('is_active');
            $table->index('sort_order');
            $table->index(['tenant_id', 'product_id']);
            $table->index(['tenant_id', 'category_id']);
            $table->index(['tenant_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_customization_options');
    }
};