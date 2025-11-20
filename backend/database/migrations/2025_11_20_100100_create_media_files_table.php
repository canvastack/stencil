<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media_files', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('name');
            $table->string('original_name');
            $table->string('file_path');
            $table->string('file_url');
            $table->string('thumbnail_url')->nullable();
            $table->string('mime_type');
            $table->string('file_extension', 10);
            $table->bigInteger('file_size');
            $table->json('dimensions')->nullable();
            $table->json('metadata')->nullable();
            $table->string('storage_disk')->default('public');
            $table->string('alt_text')->nullable();
            $table->text('description')->nullable();
            $table->foreignId('folder_id')->nullable()->constrained('media_folders');
            $table->enum('status', ['processing', 'ready', 'failed'])->default('processing');
            $table->foreignId('uploaded_by')->constrained('users');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'mime_type']);
            $table->index(['tenant_id', 'status']);
            $table->index(['folder_id']);
            $table->index(['uuid']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('media_files');
    }
};
