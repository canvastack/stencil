<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendors', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('name');
            $table->string('code')->nullable();
            $table->string('email');
            $table->string('phone')->nullable();
            $table->string('contact_person')->nullable();
            $table->string('category')->nullable();
            $table->enum('status', ['active', 'inactive', 'suspended'])->default('active');
            $table->string('company_name')->nullable();
            $table->text('address')->nullable();
            $table->json('location')->nullable();
            $table->string('tax_id')->nullable();
            $table->string('bank_account')->nullable();
            $table->string('bank_name')->nullable();
            $table->json('payment_terms')->nullable();
            $table->json('contacts')->nullable();
            $table->json('specializations')->nullable();
            $table->unsignedInteger('lead_time')->nullable();
            $table->unsignedInteger('minimum_order')->nullable();
            $table->decimal('rating', 5, 2)->default(0);
            $table->unsignedInteger('total_orders')->default(0);
            $table->json('metadata')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index('uuid');
            $table->index('tenant_id');
            $table->index('status');
            $table->index('email');
            $table->index('code');
            $table->unique(['tenant_id', 'code']);
            $table->unique(['tenant_id', 'email']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendors');
    }
};
