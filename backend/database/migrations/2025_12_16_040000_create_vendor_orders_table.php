<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendor_orders', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('vendor_id')->constrained('vendors')->cascadeOnDelete();
            
            // Assignment details
            $table->enum('assignment_type', ['direct', 'sourcing', 'negotiation'])->default('direct');
            $table->enum('status', [
                'pending', 'accepted', 'rejected', 'in_progress', 
                'completed', 'cancelled'
            ])->default('pending');
            
            // Pricing information
            $table->decimal('estimated_price', 15, 2)->nullable();
            $table->decimal('final_price', 15, 2)->nullable();
            
            // Timeline tracking
            $table->integer('estimated_lead_time_days')->nullable();
            $table->integer('actual_lead_time_days')->nullable();
            
            // Quality and delivery tracking
            $table->enum('delivery_status', ['on_time', 'late', 'early', 'pending'])->nullable();
            $table->decimal('quality_rating', 3, 2)->nullable(); // 1.00 to 5.00
            
            // Notes and metadata
            $table->text('notes')->nullable();
            $table->text('internal_notes')->nullable();
            $table->json('metadata')->nullable();
            
            // Timeline timestamps
            $table->timestamp('assigned_at')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            
            // Audit timestamps
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('uuid');
            $table->index(['tenant_id', 'order_id']);
            $table->index(['tenant_id', 'vendor_id']);
            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'assignment_type']);
            $table->index('assigned_at');
            $table->index('delivery_status');
            
            // Constraints
            $table->unique(['order_id', 'vendor_id', 'deleted_at'], 'unique_vendor_order_assignment');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_orders');
    }
};