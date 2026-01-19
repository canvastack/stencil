<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hello_world', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            
            $table->uuid('tenant_id');
            $table->foreign('tenant_id')
                  ->references('uuid')
                  ->on('tenants')
                  ->onDelete('cascade');
            
            $table->string('message', 500);
            $table->timestamps();
        });
        
        Schema::table('hello_world', function (Blueprint $table) {
            $table->index('tenant_id');
            $table->index('uuid');
        });
    }
    
    public function down(): void
    {
        Schema::dropIfExists('hello_world');
    }
};
