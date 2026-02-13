<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds login tracking and security fields to users table for authentication:
     * - failed_login_attempts: Track failed login attempts for account lockout
     * - last_failed_login_at: Timestamp of last failed login attempt
     * - last_login_at: Already exists, but ensure it's there
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Login security tracking
            $table->unsignedInteger('failed_login_attempts')->default(0)->after('password');
            $table->timestamp('last_failed_login_at')->nullable()->after('failed_login_attempts');
            
            // Add index for performance
            $table->index('failed_login_attempts');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['failed_login_attempts']);
            $table->dropColumn([
                'failed_login_attempts',
                'last_failed_login_at',
            ]);
        });
    }
};
