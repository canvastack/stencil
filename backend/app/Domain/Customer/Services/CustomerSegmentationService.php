<?php

namespace App\Domain\Customer\Services;

use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class CustomerSegmentationService
{
    public function calculateRFMScore(Customer $customer): array
    {
        $recency = $this->calculateRecency($customer);
        $frequency = $this->calculateFrequency($customer);
        $monetary = $this->calculateMonetary($customer);

        $recencyScore = $this->scoreRecency($recency);
        $frequencyScore = $this->scoreFrequency($frequency);
        $monetaryScore = $this->scoreMonetary($monetary);

        $rfmScore = $recencyScore . $frequencyScore . $monetaryScore;
        $segment = $this->determineSegment($rfmScore);

        return [
            'customer_id' => $customer->id,
            'customer_name' => $customer->name,
            'recency_days' => $recency,
            'frequency_count' => $frequency,
            'monetary_value' => $monetary,
            'recency_score' => $recencyScore,
            'frequency_score' => $frequencyScore,
            'monetary_score' => $monetaryScore,
            'rfm_score' => $rfmScore,
            'segment' => $segment,
            'segment_label' => $this->getSegmentLabel($segment),
            'segment_description' => $this->getSegmentDescription($segment),
        ];
    }

    public function segmentAllCustomers(): Collection
    {
        $customers = Customer::with('orders')->active()->get();
        
        return $customers->map(function ($customer) {
            return $this->calculateRFMScore($customer);
        })->sortByDesc('rfm_score');
    }

    public function getCustomersBySegment(string $segment): Collection
    {
        $allSegments = $this->segmentAllCustomers();
        
        return $allSegments->filter(function ($customer) use ($segment) {
            return $customer['segment'] === $segment;
        });
    }

    public function getSegmentDistribution(): array
    {
        $segments = $this->segmentAllCustomers();
        
        $distribution = $segments->groupBy('segment')->map(function ($group) {
            return [
                'count' => $group->count(),
                'percentage' => 0,
                'total_value' => $group->sum('monetary_value'),
                'avg_frequency' => round($group->avg('frequency_count'), 2),
            ];
        });

        $totalCustomers = $segments->count();
        foreach ($distribution as $segment => $data) {
            $distribution[$segment]['percentage'] = $totalCustomers > 0 
                ? round(($data['count'] / $totalCustomers) * 100, 2) 
                : 0;
        }

        return $distribution->toArray();
    }

    public function getLifetimeValue(Customer $customer): array
    {
        $orders = $customer->orders()
            ->where('status', 'completed')
            ->where('payment_status', 'paid')
            ->get();

        $totalValue = $orders->sum('total_amount');
        $orderCount = $orders->count();
        $avgOrderValue = $orderCount > 0 ? $totalValue / $orderCount : 0;

        $firstOrderDate = $orders->min('created_at');
        $lastOrderDate = $orders->max('created_at');
        
        $customerLifespanDays = $firstOrderDate && $lastOrderDate 
            ? Carbon::parse($firstOrderDate)->diffInDays(Carbon::parse($lastOrderDate)) 
            : 0;

        $customerLifespanDays = max($customerLifespanDays, 1);

        $predictedLifetimeValue = $this->predictLifetimeValue(
            $avgOrderValue,
            $orderCount,
            $customerLifespanDays
        );

        return [
            'customer_id' => $customer->id,
            'total_orders' => $orderCount,
            'total_spent' => $totalValue,
            'average_order_value' => round($avgOrderValue, 2),
            'first_order_date' => $firstOrderDate?->format('Y-m-d'),
            'last_order_date' => $lastOrderDate?->format('Y-m-d'),
            'lifespan_days' => $customerLifespanDays,
            'predicted_lifetime_value' => round($predictedLifetimeValue, 2),
        ];
    }

    public function getChurnRisk(Customer $customer): array
    {
        $rfm = $this->calculateRFMScore($customer);
        $recencyDays = $rfm['recency_days'];
        $frequency = $rfm['frequency_count'];

        $avgDaysBetweenOrders = $this->calculateAvgDaysBetweenOrders($customer);
        $expectedNextOrder = $customer->last_order_date 
            ? Carbon::parse($customer->last_order_date)->addDays($avgDaysBetweenOrders)
            : null;

        $daysOverdue = $expectedNextOrder 
            ? max(0, Carbon::now()->diffInDays($expectedNextOrder, false)) 
            : 0;

        $churnRisk = $this->calculateChurnRiskScore($recencyDays, $frequency, $daysOverdue);
        $riskLevel = $this->getChurnRiskLevel($churnRisk);

        return [
            'customer_id' => $customer->id,
            'customer_name' => $customer->name,
            'recency_days' => $recencyDays,
            'frequency' => $frequency,
            'avg_days_between_orders' => round($avgDaysBetweenOrders, 1),
            'expected_next_order' => $expectedNextOrder?->format('Y-m-d'),
            'days_overdue' => abs($daysOverdue),
            'churn_risk_score' => round($churnRisk, 2),
            'risk_level' => $riskLevel,
            'recommendation' => $this->getChurnRecommendation($riskLevel),
        ];
    }

    public function getHighValueCustomers(int $limit = 20): Collection
    {
        return $this->segmentAllCustomers()
            ->filter(function ($customer) {
                return in_array($customer['segment'], ['champions', 'loyal_customers', 'potential_loyalists']);
            })
            ->sortByDesc('monetary_value')
            ->take($limit);
    }

    public function getAtRiskCustomers(int $limit = 20): Collection
    {
        return Customer::with('orders')
            ->active()
            ->get()
            ->map(function ($customer) {
                return $this->getChurnRisk($customer);
            })
            ->filter(function ($data) {
                return in_array($data['risk_level'], ['high', 'critical']);
            })
            ->sortByDesc('churn_risk_score')
            ->take($limit);
    }

    protected function calculateRecency(Customer $customer): int
    {
        if (!$customer->last_order_date) {
            return 999;
        }

        return Carbon::parse($customer->last_order_date)->diffInDays(Carbon::now());
    }

    protected function calculateFrequency(Customer $customer): int
    {
        return $customer->orders()->count();
    }

    protected function calculateMonetary(Customer $customer): int
    {
        return $customer->orders()
            ->where('status', 'completed')
            ->where('payment_status', 'paid')
            ->sum('total_amount');
    }

    protected function scoreRecency(int $days): int
    {
        return match (true) {
            $days <= 30 => 5,
            $days <= 60 => 4,
            $days <= 90 => 3,
            $days <= 180 => 2,
            default => 1,
        };
    }

    protected function scoreFrequency(int $count): int
    {
        return match (true) {
            $count >= 20 => 5,
            $count >= 10 => 4,
            $count >= 5 => 3,
            $count >= 2 => 2,
            default => 1,
        };
    }

    protected function scoreMonetary(int $value): int
    {
        return match (true) {
            $value >= 50000000 => 5,
            $value >= 20000000 => 4,
            $value >= 10000000 => 3,
            $value >= 5000000 => 2,
            default => 1,
        };
    }

    protected function determineSegment(string $rfmScore): string
    {
        $r = (int) substr($rfmScore, 0, 1);
        $f = (int) substr($rfmScore, 1, 1);
        $m = (int) substr($rfmScore, 2, 1);

        if ($r >= 4 && $f >= 4 && $m >= 4) {
            return 'champions';
        } elseif ($r >= 3 && $f >= 3 && $m >= 3) {
            return 'loyal_customers';
        } elseif ($r >= 4 && $f <= 2 && $m <= 2) {
            return 'new_customers';
        } elseif ($r >= 3 && $f <= 2 && $m >= 3) {
            return 'potential_loyalists';
        } elseif ($r >= 3 && $f >= 3 && $m <= 2) {
            return 'promising';
        } elseif ($r <= 2 && $f >= 3 && $m >= 3) {
            return 'at_risk';
        } elseif ($r <= 2 && $f >= 4 && $m >= 4) {
            return 'cant_lose_them';
        } elseif ($r <= 2 && $f <= 2 && $m <= 2) {
            return 'hibernating';
        } elseif ($r <= 1 && $f <= 1) {
            return 'lost';
        } else {
            return 'need_attention';
        }
    }

    protected function getSegmentLabel(string $segment): string
    {
        return match ($segment) {
            'champions' => 'Champions',
            'loyal_customers' => 'Pelanggan Setia',
            'new_customers' => 'Pelanggan Baru',
            'potential_loyalists' => 'Berpotensi Setia',
            'promising' => 'Menjanjikan',
            'at_risk' => 'Berisiko Churn',
            'cant_lose_them' => 'Jangan Sampai Hilang',
            'hibernating' => 'Hibernasi',
            'lost' => 'Hilang',
            'need_attention' => 'Butuh Perhatian',
            default => 'Tidak Dikategorikan',
        };
    }

    protected function getSegmentDescription(string $segment): string
    {
        return match ($segment) {
            'champions' => 'Pelanggan terbaik yang sering membeli dengan nilai tinggi',
            'loyal_customers' => 'Pelanggan yang konsisten dan loyal',
            'new_customers' => 'Pelanggan baru dengan potensi tinggi',
            'potential_loyalists' => 'Pelanggan dengan potensi menjadi loyal',
            'promising' => 'Pelanggan yang menunjukkan tren positif',
            'at_risk' => 'Pelanggan yang berisiko berhenti membeli',
            'cant_lose_them' => 'Pelanggan bernilai tinggi yang mulai tidak aktif',
            'hibernating' => 'Pelanggan tidak aktif dalam waktu lama',
            'lost' => 'Pelanggan yang sudah tidak membeli lagi',
            'need_attention' => 'Pelanggan yang memerlukan perhatian khusus',
            default => 'Kategori tidak diketahui',
        };
    }

    protected function predictLifetimeValue(float $avgOrderValue, int $orderCount, int $lifespanDays): float
    {
        if ($lifespanDays <= 0 || $orderCount <= 0) {
            return $avgOrderValue;
        }

        $orderFrequency = $lifespanDays / $orderCount;
        $estimatedLifetimeYears = 3;
        $estimatedOrders = ($estimatedLifetimeYears * 365) / $orderFrequency;

        return $avgOrderValue * $estimatedOrders;
    }

    protected function calculateAvgDaysBetweenOrders(Customer $customer): float
    {
        $orders = $customer->orders()
            ->orderBy('created_at', 'asc')
            ->pluck('created_at')
            ->toArray();

        if (count($orders) < 2) {
            return 90;
        }

        $intervals = [];
        for ($i = 1; $i < count($orders); $i++) {
            $intervals[] = Carbon::parse($orders[$i])->diffInDays(Carbon::parse($orders[$i - 1]));
        }

        return array_sum($intervals) / count($intervals);
    }

    protected function calculateChurnRiskScore(int $recencyDays, int $frequency, int $daysOverdue): float
    {
        $recencyWeight = 0.5;
        $frequencyWeight = 0.3;
        $overdueWeight = 0.2;

        $recencyRisk = min(100, ($recencyDays / 180) * 100);
        $frequencyRisk = $frequency > 0 ? max(0, 100 - ($frequency * 10)) : 100;
        $overdueRisk = min(100, ($daysOverdue / 90) * 100);

        return ($recencyRisk * $recencyWeight) + 
               ($frequencyRisk * $frequencyWeight) + 
               ($overdueRisk * $overdueWeight);
    }

    protected function getChurnRiskLevel(float $score): string
    {
        return match (true) {
            $score >= 75 => 'critical',
            $score >= 50 => 'high',
            $score >= 25 => 'medium',
            default => 'low',
        };
    }

    protected function getChurnRecommendation(string $level): string
    {
        return match ($level) {
            'critical' => 'URGENT: Hubungi segera dengan penawaran khusus atau diskon besar',
            'high' => 'Prioritas tinggi: Kirim email personal atau telepon untuk re-engagement',
            'medium' => 'Kirim kampanye email atau promo untuk meningkatkan engagement',
            'low' => 'Customer aktif, lanjutkan strategi retention normal',
            default => 'Tidak ada rekomendasi',
        };
    }
}
