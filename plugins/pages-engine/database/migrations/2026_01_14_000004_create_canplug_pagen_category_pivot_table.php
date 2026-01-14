<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('canplug_pagen_category_pivot', function (Blueprint $table) {
            $table->id();
            
            $table->uuid('content_id');
            $table->uuid('category_id');
            
            $table->boolean('is_primary')->default(false);
            
            $table->timestamps();
        });
        
        Schema::table('canplug_pagen_category_pivot', function (Blueprint $table) {
            $table->index('content_id');
            $table->index('category_id');
            $table->index(['content_id', 'category_id']);
            $table->unique(['content_id', 'category_id'], 'canplug_pagen_category_pivot_unique');
        });
    }
    
    public function down(): void
    {
        Schema::dropIfExists('canplug_pagen_category_pivot');
    }
};
