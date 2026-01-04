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
        Schema::create('product_form_submissions', function (Blueprint $table) {
            // Primary Keys & Identifiers
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            
            // Multi-Tenant Isolation
            $table->foreignUuid('tenant_id')->constrained('tenants', 'uuid')->cascadeOnDelete();
            
            // Relationships
            $table->unsignedBigInteger('product_id');
            $table->foreign('product_id')->references('id')->on('products')->cascadeOnDelete();
            $table->uuid('product_uuid');
            
            $table->unsignedBigInteger('form_configuration_id');
            $table->foreign('form_configuration_id')->references('id')->on('product_form_configurations')->cascadeOnDelete();
            $table->uuid('form_configuration_uuid');
            
            $table->unsignedBigInteger('order_id')->nullable();
            $table->foreign('order_id')->references('id')->on('orders')->nullOnDelete();
            $table->uuid('order_uuid')->nullable();
            
            $table->unsignedBigInteger('customer_id')->nullable();
            $table->foreign('customer_id')->references('id')->on('customers')->nullOnDelete();
            $table->uuid('customer_uuid')->nullable();
            
            // Submission Data
            $table->jsonb('submission_data');
            
            // Metadata
            $table->text('user_agent')->nullable();
            $table->ipAddress('ip_address')->nullable();
            $table->text('referrer')->nullable();
            
            // Analytics
            $table->integer('completion_time')->nullable();
            $table->boolean('is_completed')->default(false);
            $table->boolean('is_converted_to_order')->default(false);
            
            // Timestamps
            $table->timestamp('started_at')->default(DB::raw('CURRENT_TIMESTAMP'));
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
            
            // Indexes
            $table->index('tenant_id');
            $table->index('product_id');
            $table->index('form_configuration_id');
            $table->index('order_id');
            $table->index('customer_id');
            $table->index('is_completed');
            $table->index('is_converted_to_order');
            $table->index('created_at');
        });

        // GIN Index for JSONB search
        DB::statement('CREATE INDEX idx_pfs_submission_data ON product_form_submissions USING GIN(submission_data)');
        
        // Table comment
        DB::statement("COMMENT ON TABLE product_form_submissions IS 'Tracks form submissions for analytics and order processing'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_form_submissions');
    }
};
