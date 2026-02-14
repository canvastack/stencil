<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('order_qc_inspections', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('order_id');
            
            // Inspection metadata
            $table->unsignedBigInteger('inspector_user_id');
            $table->timestamp('inspection_date');
            $table->integer('inspection_duration_minutes')->nullable();
            
            // Checklist results (JSON)
            $table->json('checklist_results');
            
            // Overall assessment
            $table->string('overall_rating', 20)->nullable(); // excellent, good, acceptable, poor
            $table->decimal('total_score', 5, 2)->nullable(); // 0.00 to 100.00
            $table->boolean('critical_items_passed')->default(false);
            
            // Decision
            $table->string('decision', 20); // approved, approved_with_notes, rejected, needs_rework
            $table->text('decision_notes')->nullable();
            
            // Photos
            $table->json('photos')->nullable(); // Array of photo URLs
            $table->integer('photo_count')->default(0);
            
            // Vendor feedback
            $table->timestamp('vendor_notified_at')->nullable();
            $table->text('vendor_response')->nullable();
            $table->timestamp('rework_deadline')->nullable();
            
            // Re-inspection tracking
            $table->boolean('is_reinspection')->default(false);
            $table->unsignedBigInteger('original_inspection_id')->nullable();
            $table->integer('reinspection_count')->default(0);
            
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('cascade');
            $table->foreign('inspector_user_id')->references('id')->on('users');
            $table->foreign('original_inspection_id')->references('id')->on('order_qc_inspections')->onDelete('set null');
            
            // Indexes
            $table->index('tenant_id');
            $table->index('order_id');
            $table->index('decision');
            $table->index('inspection_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_qc_inspections');
    }
};
