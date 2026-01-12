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
            $table->dropForeign('installed_plugins_approved_by_foreign');
            $table->dropForeign('installed_plugins_rejected_by_foreign');
            $table->dropForeign('installed_plugins_installed_by_foreign');
        });

        Schema::table('installed_plugins', function (Blueprint $table) {
            $table->foreign('approved_by', 'installed_plugins_approved_by_fkey')
                  ->references('uuid')
                  ->on('accounts')
                  ->onDelete('set null');
                  
            $table->foreign('rejected_by', 'installed_plugins_rejected_by_fkey')
                  ->references('uuid')
                  ->on('accounts')
                  ->onDelete('set null');
                  
            $table->foreign('installed_by', 'installed_plugins_installed_by_fkey')
                  ->references('uuid')
                  ->on('accounts')
                  ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('installed_plugins', function (Blueprint $table) {
            $table->dropForeign('installed_plugins_approved_by_fkey');
            $table->dropForeign('installed_plugins_rejected_by_fkey');
            $table->dropForeign('installed_plugins_installed_by_fkey');
        });

        Schema::table('installed_plugins', function (Blueprint $table) {
            $table->foreign('approved_by', 'installed_plugins_approved_by_foreign')
                  ->references('uuid')
                  ->on('users')
                  ->onDelete('set null');
                  
            $table->foreign('rejected_by', 'installed_plugins_rejected_by_foreign')
                  ->references('uuid')
                  ->on('users')
                  ->onDelete('set null');
                  
            $table->foreign('installed_by', 'installed_plugins_installed_by_foreign')
                  ->references('uuid')
                  ->on('users')
                  ->onDelete('set null');
        });
    }
};
