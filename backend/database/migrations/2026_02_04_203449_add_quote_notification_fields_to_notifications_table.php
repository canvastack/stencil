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
        Schema::table('notifications', function (Blueprint $table) {
            // Change type column from enum to varchar(100) for quote notification types
            $table->string('type', 100)->change();
            
            // Add index for tenant_id + type for filtering quote notifications
            $table->index(['tenant_id', 'type'], 'idx_notifications_tenant_type');
            
            // Add index for user_id + read_at for unread notifications query
            $table->index(['user_id', 'read_at'], 'idx_notifications_user_read');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            // Drop indexes
            $table->dropIndex('idx_notifications_tenant_type');
            $table->dropIndex('idx_notifications_user_read');
            
            // Revert type column back to enum
            $table->enum('type', ['info', 'success', 'warning', 'error'])->default('info')->change();
        });
    }
};
