<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class MediaAssociation extends Model
{
    use HasFactory;

    protected $table = 'media_associations';

    protected $fillable = [
        'tenant_id',
        'media_file_id',
        'associable_type',
        'associable_id',
        'context',
        'sort_order',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function mediaFile(): BelongsTo
    {
        return $this->belongsTo(MediaFile::class);
    }

    public function associable(): MorphTo
    {
        return $this->morphTo();
    }

    public function scopeByContext($query, string $context)
    {
        return $query->where('context', $context);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order');
    }
}
