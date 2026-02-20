<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use App\Infrastructure\Persistence\Eloquent\Contracts\TenantAwareModel;
use App\Infrastructure\Persistence\Eloquent\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

class DocumentSequence extends Model implements TenantAwareModel
{
    use HasFactory, BelongsToTenant;

    protected $table = 'document_sequences';

    protected $fillable = [
        'tenant_id',
        'document_type',
        'prefix',
        'current_number',
        'year',
        'month',
        'reset_frequency',
        'padding_length',
        'metadata',
    ];

    protected $casts = [
        'current_number' => 'integer',
        'year' => 'integer',
        'month' => 'integer',
        'padding_length' => 'integer',
        'metadata' => 'json',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relationships
     */

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Get next sequence number for a document type
     * 
     * This method is thread-safe and uses database locking to prevent race conditions
     */
    public static function getNextSequence(
        int $tenantId,
        string $documentType,
        string $prefix = '',
        string $resetFrequency = 'yearly',
        int $paddingLength = 4
    ): array {
        $year = date('Y');
        $month = date('m');

        // Determine if we need to reset based on frequency
        $shouldReset = false;
        $sequenceKey = ['tenant_id' => $tenantId, 'document_type' => $documentType];

        if ($resetFrequency === 'yearly') {
            $sequenceKey['year'] = $year;
            $sequenceKey['month'] = null;
        } elseif ($resetFrequency === 'monthly') {
            $sequenceKey['year'] = $year;
            $sequenceKey['month'] = $month;
        }

        // Use database transaction with row locking to prevent race conditions
        return DB::transaction(function () use ($sequenceKey, $prefix, $resetFrequency, $paddingLength, $year, $month) {
            // Lock the row for update
            $sequence = static::where($sequenceKey)
                ->lockForUpdate()
                ->first();

            if (!$sequence) {
                // Create new sequence
                $sequence = static::create(array_merge($sequenceKey, [
                    'prefix' => $prefix,
                    'current_number' => 1,
                    'reset_frequency' => $resetFrequency,
                    'padding_length' => $paddingLength,
                ]));
                $nextNumber = 1;
            } else {
                // Increment existing sequence
                $nextNumber = $sequence->current_number + 1;
                $sequence->current_number = $nextNumber;
                $sequence->save();
            }

            // Format the number with padding
            $formattedNumber = str_pad($nextNumber, $paddingLength, '0', STR_PAD_LEFT);

            // Build the full document number
            $parts = array_filter([$prefix]);
            
            if ($resetFrequency === 'yearly') {
                $parts[] = $year;
            } elseif ($resetFrequency === 'monthly') {
                $parts[] = $year . $month;
            }
            
            $parts[] = $formattedNumber;

            return [
                'number' => $nextNumber,
                'formatted_number' => $formattedNumber,
                'document_number' => implode('-', $parts),
                'prefix' => $prefix,
                'year' => $year,
                'month' => $month,
            ];
        });
    }

    /**
     * Reset sequence for a document type
     */
    public static function resetSequence(
        int $tenantId,
        string $documentType,
        ?int $year = null,
        ?int $month = null
    ): void {
        $query = static::where('tenant_id', $tenantId)
            ->where('document_type', $documentType);

        if ($year) {
            $query->where('year', $year);
        }

        if ($month) {
            $query->where('month', $month);
        }

        $query->update(['current_number' => 0]);
    }

    /**
     * Get current sequence number without incrementing
     */
    public static function getCurrentSequence(
        int $tenantId,
        string $documentType,
        ?int $year = null,
        ?int $month = null
    ): int {
        $query = static::where('tenant_id', $tenantId)
            ->where('document_type', $documentType);

        if ($year) {
            $query->where('year', $year);
        }

        if ($month) {
            $query->where('month', $month);
        }

        $sequence = $query->first();

        return $sequence ? $sequence->current_number : 0;
    }
}
