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
        Schema::table('installed_plugins', function (Blueprint $table) {
            // Update status enum to support approval workflow
            $table->dropColumn('status');
        });

        Schema::table('installed_plugins', function (Blueprint $table) {
            $table->enum('status', ['pending', 'approved', 'rejected', 'active', 'suspended', 'expired'])
                  ->default('pending')
                  ->after('display_name');
        });

        Schema::table('installed_plugins', function (Blueprint $table) {
            // Request tracking
            $table->timestamp('requested_at')->nullable()->after('settings');
            $table->uuid('requested_by')->nullable()->after('requested_at');
            
            // Approval tracking
            $table->timestamp('approved_at')->nullable()->after('requested_by');
            $table->uuid('approved_by')->nullable()->after('approved_at');
            $table->text('approval_notes')->nullable()->after('approved_by');
            
            // Expiry tracking
            $table->timestamp('expires_at')->nullable()->after('installed_at');
            $table->timestamp('expiry_notified_at')->nullable()->after('expires_at');
            
            // Rejection tracking
            $table->timestamp('rejected_at')->nullable()->after('expiry_notified_at');
            $table->uuid('rejected_by')->nullable()->after('rejected_at');
            $table->text('rejection_reason')->nullable()->after('rejected_by');
            
            // Add foreign keys
            $table->foreign('requested_by')
                  ->references('uuid')
                  ->on('users')
                  ->onDelete('set null');
                  
            $table->foreign('approved_by')
                  ->references('uuid')
                  ->on('users')
                  ->onDelete('set null');
                  
            $table->foreign('rejected_by')
                  ->references('uuid')
                  ->on('users')
                  ->onDelete('set null');
            
            // Add indexes for performance
            $table->index('expires_at');
            $table->index('requested_at');
            $table->index('approved_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('installed_plugins', function (Blueprint $table) {
            // Drop foreign keys
            $table->dropForeign(['requested_by']);
            $table->dropForeign(['approved_by']);
            $table->dropForeign(['rejected_by']);
            
            // Drop indexes
            $table->dropIndex(['expires_at']);
            $table->dropIndex(['requested_at']);
            $table->dropIndex(['approved_at']);
            
            // Drop columns
            $table->dropColumn([
                'requested_at',
                'requested_by',
                'approved_at',
                'approved_by',
                'approval_notes',
                'expires_at',
                'expiry_notified_at',
                'rejected_at',
                'rejected_by',
                'rejection_reason',
            ]);
        });

        // Restore original status enum
        Schema::table('installed_plugins', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('installed_plugins', function (Blueprint $table) {
            $table->enum('status', ['active', 'disabled', 'error'])
                  ->default('active')
                  ->after('display_name');
        });
    }
};
