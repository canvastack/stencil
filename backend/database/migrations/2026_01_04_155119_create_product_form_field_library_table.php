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
        Schema::create('product_form_field_library', function (Blueprint $table) {
            // Primary Keys & Identifiers
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            
            // Field Info
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->string('field_type', 50);
            $table->string('category', 100)->nullable();
            
            // Field Configuration Template
            $table->jsonb('field_config');
            
            // Visibility
            $table->boolean('is_system')->default(false);
            $table->foreignUuid('tenant_id')->nullable()->constrained('tenants', 'uuid')->cascadeOnDelete();
            
            // Metadata
            $table->string('icon', 100)->nullable();
            $table->string('preview_url', 500)->nullable();
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
            $table->index('field_type');
            $table->index('category');
            $table->index('tenant_id');
            $table->index('is_system');
            $table->index('deleted_at');
        });

        // GIN Index for JSONB
        DB::statement('CREATE INDEX idx_pffl_field_config ON product_form_field_library USING GIN(field_config)');
        
        // Table comment
        DB::statement("COMMENT ON TABLE product_form_field_library IS 'Reusable field definitions for form builder'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_form_field_library');
    }
};
