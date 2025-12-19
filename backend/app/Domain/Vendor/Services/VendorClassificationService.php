<?php

namespace App\Domain\Vendor\Services;

use App\Infrastructure\Persistence\Eloquent\Models\Vendor;

class VendorClassificationService
{
    private array $defaultThresholds = [
        'large' => 100,
        'medium' => 20,
    ];

    public function __construct(
        private ?array $customThresholds = null
    ) {
    }

    public function calculateCompanySize(Vendor $vendor): string
    {
        $thresholds = $this->getCompanySizeThresholds();
        $totalOrders = $vendor->total_orders ?? 0;

        if ($totalOrders >= $thresholds['large']) {
            return 'large';
        }

        if ($totalOrders >= $thresholds['medium']) {
            return 'medium';
        }

        return 'small';
    }

    public function getCompanySizeThresholds(): array
    {
        if ($this->customThresholds !== null) {
            return array_merge($this->defaultThresholds, $this->customThresholds);
        }

        return $this->defaultThresholds;
    }

    public function setThresholds(array $thresholds): void
    {
        $this->customThresholds = $thresholds;
    }

    public function classifyMultipleVendors(iterable $vendors): array
    {
        $results = [];
        
        foreach ($vendors as $vendor) {
            $results[$vendor->id] = [
                'vendor_id' => $vendor->id,
                'company_size' => $this->calculateCompanySize($vendor),
                'total_orders' => $vendor->total_orders ?? 0,
                'thresholds_used' => $this->getCompanySizeThresholds(),
            ];
        }

        return $results;
    }

    public function getClassificationStats(iterable $vendors): array
    {
        $stats = [
            'large' => 0,
            'medium' => 0,
            'small' => 0,
            'total' => 0,
        ];

        foreach ($vendors as $vendor) {
            $size = $this->calculateCompanySize($vendor);
            $stats[$size]++;
            $stats['total']++;
        }

        $stats['percentages'] = [
            'large' => $stats['total'] > 0 ? round(($stats['large'] / $stats['total']) * 100, 2) : 0,
            'medium' => $stats['total'] > 0 ? round(($stats['medium'] / $stats['total']) * 100, 2) : 0,
            'small' => $stats['total'] > 0 ? round(($stats['small'] / $stats['total']) * 100, 2) : 0,
        ];

        return $stats;
    }
}
