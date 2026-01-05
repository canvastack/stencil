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
        Schema::create('product_form_configurations', function (Blueprint $table) {
            // Primary Keys & Identifiers
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            
            // Multi-Tenant Isolation (MANDATORY)
            $table->unsignedBigInteger('tenant_id');
            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            
            // Product Relationship
            $table->unsignedBigInteger('product_id');
            $table->foreign('product_id')->references('id')->on('products')->cascadeOnDelete();
            $table->uuid('product_uuid');
            
            // Form Configuration
            $table->string('name', 255)->default('Order Form');
            $table->text('description')->nullable();
            
            // Form Schema (JSONB for flexibility and performance)
            $table->jsonb('form_schema');
            $table->jsonb('validation_rules')->nullable();
            $table->jsonb('conditional_logic')->nullable();
            
            // Status & Flags
            $table->boolean('is_active')->default(true);
            $table->boolean('is_default')->default(false);
            $table->boolean('is_template')->default(false);
            
            // Metadata
            $table->unsignedBigInteger('template_id')->nullable();
            $table->foreign('template_id')->references('id')->on('product_form_templates')->nullOnDelete();
            
            $table->integer('version')->default(1);
            
            // Analytics
            $table->integer('submission_count')->default(0);
            $table->integer('avg_completion_time')->nullable();
            
            // Audit Trail
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();
            
            // Timestamps (REQUIRED)
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes (MANDATORY + Performance Optimization)
            $table->index('tenant_id');
            $table->index('product_id');
            $table->index('product_uuid');
            $table->index('is_active');
            $table->index('is_template');
            $table->index('deleted_at');
            $table->index('created_at');
            
            // Unique Constraint: One active configuration per product
            $table->unique(['product_id', 'tenant_id', 'is_active'], 'unique_active_form_per_product');
        });

        // GIN Index for JSONB search (performance optimization)
        DB::statement('CREATE INDEX idx_pfc_form_schema ON product_form_configurations USING GIN(form_schema)');
        DB::statement('CREATE INDEX idx_pfc_validation_rules ON product_form_configurations USING GIN(validation_rules)');
        DB::statement('CREATE INDEX idx_pfc_conditional_logic ON product_form_configurations USING GIN(conditional_logic)');
        
        // Table comment
        DB::statement("COMMENT ON TABLE product_form_configurations IS 'Stores dynamic form configurations for product orders'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_form_configurations');
    }
};
