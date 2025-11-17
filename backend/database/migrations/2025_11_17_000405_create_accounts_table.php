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
        Schema::create('accounts', function (Blueprint $table) {
            // Primary Key (BIGSERIAL for Sanctum compatibility)
            $table->id();
            
            // UUID for public-facing IDs 
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            
            // Account Information
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->enum('account_type', ['platform_owner', 'platform_manager'])->default('platform_owner');
            $table->enum('status', ['active', 'inactive', 'suspended'])->default('active');
            $table->json('settings')->nullable();
            $table->string('avatar')->nullable();
            $table->timestamp('last_login_at')->nullable();
            $table->rememberToken();
            
            // Timestamps
            $table->timestamps();
            
            // Indexes
            $table->index('uuid');
            $table->index('status');
            $table->index('account_type');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('accounts');
    }
};