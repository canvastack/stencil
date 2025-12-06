<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_status_histories', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            
            // Status transition tracking
            $table->string('previous_status')->nullable();
            $table->string('new_status');
            $table->text('notes')->nullable();
            $table->text('reason')->nullable();
            
            // User and system tracking
            $table->foreignId('changed_by')->constrained('users');
            $table->string('changed_by_name'); // Store name for audit
            $table->string('change_source')->default('manual'); // manual, system, api, webhook
            
            // Additional context
            $table->json('metadata')->nullable(); // Additional context data
            $table->ipAddress('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            
            // Timestamps
            $table->timestamp('changed_at');
            $table->timestamps();
            
            // Indexes
            $table->index('uuid');
            $table->index(['tenant_id', 'order_id']);
            $table->index(['tenant_id', 'new_status']);
            $table->index(['tenant_id', 'changed_by']);
            $table->index('changed_at');
            $table->index(['order_id', 'changed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_status_histories');
    }
};