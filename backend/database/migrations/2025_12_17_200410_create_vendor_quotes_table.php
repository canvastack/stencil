<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendor_quotes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('sourcing_request_id')->nullable()->constrained('vendor_sourcing')->cascadeOnDelete();
            $table->foreignId('vendor_id')->constrained('vendors')->cascadeOnDelete();
            $table->decimal('amount', 15, 2);
            $table->text('description')->nullable();
            $table->enum('status', ['pending', 'accepted', 'rejected', 'expired'])->default('pending');
            $table->timestamp('valid_until')->nullable();
            $table->json('terms')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'vendor_id']);
            $table->index(['tenant_id', 'sourcing_request_id']);
            $table->index(['tenant_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_quotes');
    }
};
