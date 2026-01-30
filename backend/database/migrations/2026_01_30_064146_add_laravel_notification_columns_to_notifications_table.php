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
            // Add Laravel notification system columns
            $table->string('notifiable_type')->nullable()->after('user_id');
            $table->unsignedBigInteger('notifiable_id')->nullable()->after('notifiable_type');
            
            // Make existing columns nullable for compatibility
            $table->string('title')->nullable()->change();
            $table->text('message')->nullable()->change();
            $table->foreignId('user_id')->nullable()->change();
            
            // Add index for Laravel notifications
            $table->index(['notifiable_type', 'notifiable_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropColumn(['notifiable_type', 'notifiable_id']);
            $table->dropIndex(['notifiable_type', 'notifiable_id']);
            
            // Revert nullable changes
            $table->string('title')->nullable(false)->change();
            $table->text('message')->nullable(false)->change();
            $table->foreignId('user_id')->nullable(false)->change();
        });
    }
};
