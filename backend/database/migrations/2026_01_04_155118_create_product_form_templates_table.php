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
        Schema::create('product_form_templates', function (Blueprint $table) {
            // Primary Keys & Identifiers
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            
            // Template Info
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->string('category', 100)->nullable();
            
            // Template Schema (same structure as product_form_configurations)
            $table->jsonb('form_schema');
            $table->jsonb('validation_rules')->nullable();
            $table->jsonb('conditional_logic')->nullable();
            
            // Visibility & Access
            $table->boolean('is_public')->default(true);
            $table->boolean('is_system')->default(false);
            $table->foreignUuid('tenant_id')->nullable()->constrained('tenants', 'uuid')->cascadeOnDelete();
            
            // Metadata
            $table->string('preview_image_url', 500)->nullable();
            $table->text('tags')->nullable();
            
            // Usage Tracking
            $table->integer('usage_count')->default(0);
            
            // Audit
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();
            
            // Timestamps
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('category');
            $table->index('is_public');
            $table->index('tenant_id');
            $table->index('deleted_at');
        });

        // GIN Index for JSONB
        DB::statement('CREATE INDEX idx_pft_form_schema ON product_form_templates USING GIN(form_schema)');
        
        // Table comment
        DB::statement("COMMENT ON TABLE product_form_templates IS 'Pre-built form templates for quick configuration'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_form_templates');
    }
};
