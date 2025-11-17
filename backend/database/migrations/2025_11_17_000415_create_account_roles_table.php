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
        Schema::create('account_roles', function (Blueprint $table) {
            // Primary Key (Simple BIGINT auto-increment)
            $table->id();
            
            // Foreign Keys
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->foreignId('role_id')->constrained('roles')->cascadeOnDelete();
            
            // Timestamps
            $table->timestamps();
            
            // Indexes
            $table->index('account_id');
            $table->index('role_id');
            
            // Unique constraint to prevent duplicate role assignments
            $table->unique(['account_id', 'role_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('account_roles');
    }
};