<?php

namespace App\Infrastructure\Persistence\Eloquent;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DomainMappingEloquentModel extends Model
{
    use HasUuids;

    protected $table = 'domain_mappings';

    protected $fillable = [
        'tenant_id',
        'domain',
        'subdomain',
        'is_primary',
        'ssl_enabled',
        'ssl_certificate_path',
        'status',
        'dns_records',
        'verified_at',
    ];

    protected $casts = [
        'id' => 'string',
        'tenant_id' => 'string',
        'is_primary' => 'boolean',
        'ssl_enabled' => 'boolean',
        'dns_records' => 'array',
        'verified_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(TenantEloquentModel::class, 'tenant_id');
    }
}