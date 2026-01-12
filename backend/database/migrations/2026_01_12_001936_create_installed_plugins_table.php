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
        Schema::create('installed_plugins', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            
            $table->uuid('tenant_id');
            $table->foreign('tenant_id')
                  ->references('uuid')
                  ->on('tenants')
                  ->onDelete('cascade');
            
            $table->string('plugin_name', 255);
            $table->string('plugin_version', 50);
            $table->string('display_name', 255);
            $table->enum('status', ['active', 'disabled', 'error'])->default('active');
            
            $table->jsonb('manifest');
            $table->jsonb('migrations_run')->default('[]');
            $table->jsonb('settings')->default('{}');
            
            $table->timestamp('installed_at')->useCurrent();
            $table->uuid('installed_by')->nullable();
            $table->foreign('installed_by')
                  ->references('uuid')
                  ->on('users')
                  ->onDelete('set null');
            
            $table->timestamps();
            
            $table->unique(['tenant_id', 'plugin_name']);
        });
        
        Schema::table('installed_plugins', function (Blueprint $table) {
            $table->index('tenant_id');
            $table->index('status');
            $table->index('plugin_name');
            $table->index('uuid');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('installed_plugins');
    }
};
