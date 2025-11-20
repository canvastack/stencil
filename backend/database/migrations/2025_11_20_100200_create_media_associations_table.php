<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media_associations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('media_file_id')->constrained('media_files')->cascadeOnDelete();
            $table->morphs('associable');
            $table->string('context')->default('default');
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['media_file_id', 'associable_type', 'associable_id', 'context'], 'unique_media_association');
            $table->index(['tenant_id', 'associable_type', 'associable_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('media_associations');
    }
};
