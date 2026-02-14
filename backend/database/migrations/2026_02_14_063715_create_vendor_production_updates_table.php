<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('vendor_production_updates', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('purchase_order_id');
            $table->unsignedBigInteger('vendor_id');
            
            // Status Information
            $table->string('status', 50); // 'started', 'in_progress', 'quality_check', 'completed', 'delayed'
            $table->integer('progress_percentage')->default(0);
            
            // Update Details
            $table->text('notes')->nullable();
            $table->timestamp('estimated_completion_date')->nullable();
            $table->timestamp('actual_completion_date')->nullable();
            
            // Photo Documentation (JSON array)
            $table->json('photos')->nullable();
            
            // Metadata
            $table->boolean('is_milestone')->default(false);
            $table->unsignedBigInteger('created_by');
            $table->timestamps();
            
            // Foreign Keys
            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->onDelete('cascade');
                
            $table->foreign('purchase_order_id')
                ->references('id')
                ->on('vendor_purchase_orders')
                ->onDelete('cascade');
                
            $table->foreign('vendor_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');
                
            $table->foreign('created_by')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');
            
            // Indexes
            $table->index('tenant_id');
            $table->index('purchase_order_id');
            $table->index('vendor_id');
            $table->index('status');
            $table->index('created_at');
            $table->index(['is_milestone', 'created_at']);
        });
        
        // Add check constraint using raw SQL (Laravel Blueprint doesn't support check())
        DB::statement('ALTER TABLE vendor_production_updates ADD CONSTRAINT chk_progress_percentage CHECK (progress_percentage >= 0 AND progress_percentage <= 100)');
        
        // Add production tracking fields to vendor_purchase_orders table
        Schema::table('vendor_purchase_orders', function (Blueprint $table) {
            $table->string('latest_production_status', 50)->nullable()->after('status');
            $table->integer('latest_progress_percentage')->default(0)->after('latest_production_status');
            $table->timestamp('latest_update_at')->nullable()->after('latest_progress_percentage');
            $table->timestamp('production_started_at')->nullable()->after('latest_update_at');
            $table->timestamp('production_completed_at')->nullable()->after('production_started_at');
            
            $table->index('latest_production_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop columns from vendor_purchase_orders first
        Schema::table('vendor_purchase_orders', function (Blueprint $table) {
            $table->dropIndex(['latest_production_status']);
            $table->dropColumn([
                'latest_production_status',
                'latest_progress_percentage',
                'latest_update_at',
                'production_started_at',
                'production_completed_at',
            ]);
        });
        
        Schema::dropIfExists('vendor_production_updates');
    }
};
