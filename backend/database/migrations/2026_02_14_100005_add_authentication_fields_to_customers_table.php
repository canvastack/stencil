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
        Schema::table('customers', function (Blueprint $table) {
            // Authentication fields
            $table->string('account_type', 20)->default('guest')->after('type');
            // Values: guest, registered, verified
            
            $table->string('password_hash')->nullable()->after('account_type');
            $table->timestamp('email_verified_at')->nullable()->after('password_hash');
            $table->uuid('registration_token')->nullable()->after('email_verified_at');
            
            // Login tracking
            $table->timestamp('last_login_at')->nullable()->after('registration_token');
            $table->integer('login_count')->default(0)->after('last_login_at');
            $table->integer('failed_login_attempts')->default(0)->after('login_count');
            $table->timestamp('locked_until')->nullable()->after('failed_login_attempts');
            
            // Indexes for authentication queries
            $table->index('account_type');
            $table->index('email_verified_at');
            $table->index('registration_token');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            // Drop indexes first
            $table->dropIndex(['account_type']);
            $table->dropIndex(['email_verified_at']);
            $table->dropIndex(['registration_token']);
            
            // Drop columns
            $table->dropColumn([
                'account_type',
                'password_hash',
                'email_verified_at',
                'registration_token',
                'last_login_at',
                'login_count',
                'failed_login_attempts',
                'locked_until',
            ]);
        });
    }
};
