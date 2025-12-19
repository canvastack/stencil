<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendor_sourcing', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('order_id')->nullable();
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('status', ['active', 'negotiating', 'completed', 'cancelled'])->default('active');
            $table->string('assigned_vendor')->nullable();
            $table->json('requirements')->nullable();
            $table->integer('responses')->default(0);
            $table->decimal('best_quote', 15, 2)->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'order_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_sourcing');
    }
};
