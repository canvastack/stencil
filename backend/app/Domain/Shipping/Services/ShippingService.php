<?php

namespace App\Domain\Shipping\Services;

use App\Infrastructure\Persistence\Eloquent\Models\Shipment;
use App\Infrastructure\Persistence\Eloquent\Models\ShippingMethod;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use Illuminate\Support\Str;

class ShippingService
{
    public function calculateShippingCost(Order $order, ShippingMethod $method): array
    {
        $baseConfig = $method->cost_calculation ?? [];

        $totalWeight = $this->calculateOrderWeight($order);
        $weightCost = ($baseConfig['per_kg'] ?? 0) * $totalWeight;

        $distanceCost = 0;
        if ($baseConfig['per_km'] ?? false) {
            $distance = $this->calculateDistance($order->shipping_address, $order->tenant->address ?? []);
            $distanceCost = $baseConfig['per_km'] * $distance;
        }

        $totalCost = $method->base_cost + $weightCost + $distanceCost;

        if ($totalCost < ($baseConfig['minimum_cost'] ?? 0)) {
            $totalCost = $baseConfig['minimum_cost'];
        }

        return [
            'base_cost' => $method->base_cost,
            'weight_cost' => $weightCost,
            'distance_cost' => $distanceCost,
            'total_cost' => $totalCost,
            'weight_kg' => $totalWeight,
            'estimated_days' => rand($method->estimated_days_min, $method->estimated_days_max)
        ];
    }

    public function createShipment(Order $order, array $data): Shipment
    {
        $shippingMethod = ShippingMethod::findOrFail($data['shipping_method_id']);

        $costDetails = $this->calculateShippingCost($order, $shippingMethod);

        $shipmentData = [
            'tenant_id' => $order->tenant_id,
            'order_id' => $order->id,
            'shipping_method_id' => $shippingMethod->id,
            'status' => 'pending',
            'shipping_address' => $order->shipping_address,
            'return_address' => $this->getReturnAddress($order),
            'weight_kg' => $costDetails['weight_kg'],
            'dimensions' => $data['dimensions'] ?? null,
            'shipping_cost' => $costDetails['total_cost'],
            'currency' => 'IDR',
            'items' => $this->prepareShipmentItems($order),
            'special_instructions' => $data['special_instructions'] ?? null,
            'estimated_delivery' => now()->addDays($costDetails['estimated_days']),
        ];

        $shipment = Shipment::create($shipmentData);

        $order->update(['status' => 'processing']);

        return $shipment;
    }

    public function processShipment(Shipment $shipment): bool
    {
        if ($shipment->status !== 'pending') {
            throw new \Exception('Only pending shipments can be processed.');
        }

        $trackingNumber = $this->generateTrackingNumber($shipment);

        $carrierResponse = $this->submitToCarrier($shipment, $trackingNumber);

        $shipment->update([
            'status' => 'processing',
            'tracking_number' => $trackingNumber,
            'carrier_reference' => $carrierResponse['reference'] ?? null,
        ]);

        $shipment->order->update(['status' => 'shipped']);

        return true;
    }

    public function updateTracking(Shipment $shipment): array
    {
        $trackingEvents = $this->getCarrierTrackingEvents($shipment);

        $shipment->update([
            'tracking_events' => $trackingEvents,
        ]);

        $latestEvent = collect($trackingEvents)->last();
        $newStatus = $this->mapCarrierStatusToShipmentStatus($latestEvent['status'] ?? 'in_transit');

        if ($newStatus !== $shipment->status) {
            $shipment->update(['status' => $newStatus]);

            if ($newStatus === 'delivered') {
                $shipment->update(['delivered_at' => now()]);
                $shipment->order->update(['status' => 'delivered']);
            }
        }

        return $trackingEvents;
    }

    public function cancelShipment(Shipment $shipment, string $reason = null): bool
    {
        if (!in_array($shipment->status, ['pending', 'processing'])) {
            throw new \Exception('Only pending or processing shipments can be cancelled.');
        }

        $shipment->update([
            'status' => 'cancelled',
            'metadata' => array_merge($shipment->metadata ?? [], [
                'cancellation_reason' => $reason,
                'cancelled_at' => now()->toIso8601String(),
            ])
        ]);

        return true;
    }

    private function calculateOrderWeight(Order $order): float
    {
        $totalWeight = 0;

        if (!empty($order->items) && is_array($order->items)) {
            foreach ($order->items as $item) {
                $itemWeight = $item['weight_kg'] ?? $item['product']['weight_kg'] ?? 0.5;
                $quantity = $item['quantity'] ?? 1;
                $totalWeight += $itemWeight * $quantity;
            }
        }

        return max($totalWeight, 0.1);
    }

    private function calculateDistance(array $from, array $to): float
    {
        if (empty($from['latitude']) || empty($to['latitude'])) {
            return 0;
        }

        $lat1 = floatval($from['latitude']);
        $lon1 = floatval($from['longitude']);
        $lat2 = floatval($to['latitude'] ?? 0);
        $lon2 = floatval($to['longitude'] ?? 0);

        $theta = $lon1 - $lon2;
        $dist = sin(deg2rad($lat1)) * sin(deg2rad($lat2)) +
                cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * cos(deg2rad($theta));
        $dist = acos($dist);
        $dist = rad2deg($dist);

        return $dist * 60 * 1.1515 * 1.609344;
    }

    private function getReturnAddress(Order $order): array
    {
        $address = $order->tenant?->address ?? [];
        return [
            'company_name' => $order->tenant?->name,
            'address_line_1' => $address['address_line_1'] ?? '',
            'address_line_2' => $address['address_line_2'] ?? '',
            'city' => $address['city'] ?? '',
            'state_province' => $address['state_province'] ?? '',
            'postal_code' => $address['postal_code'] ?? '',
            'country_code' => $address['country_code'] ?? 'IDN',
        ];
    }

    private function generateTrackingNumber(Shipment $shipment): string
    {
        return strtoupper($shipment->shippingMethod->carrier) .
               now()->format('ymd') .
               str_pad($shipment->id, 6, '0', STR_PAD_LEFT);
    }

    private function submitToCarrier(Shipment $shipment, string $trackingNumber): array
    {
        return [
            'status' => 'success',
            'reference' => 'CR' . strtoupper(Str::random(8)),
            'estimated_pickup' => now()->addHours(4)->toIso8601String(),
        ];
    }

    private function getCarrierTrackingEvents(Shipment $shipment): array
    {
        return [
            [
                'status' => 'picked_up',
                'description' => 'Package picked up from sender',
                'location' => 'Jakarta',
                'timestamp' => now()->subHours(2)->toIso8601String(),
            ],
            [
                'status' => 'in_transit',
                'description' => 'Package in transit to destination',
                'location' => 'Jakarta Sorting Center',
                'timestamp' => now()->subHour()->toIso8601String(),
            ]
        ];
    }

    private function mapCarrierStatusToShipmentStatus(string $carrierStatus): string
    {
        return match($carrierStatus) {
            'picked_up', 'collected' => 'shipped',
            'in_transit', 'on_the_way' => 'in_transit',
            'delivered', 'completed' => 'delivered',
            'failed', 'returned' => 'failed',
            default => 'processing'
        };
    }

    private function prepareShipmentItems(Order $order): array
    {
        if (empty($order->items) || !is_array($order->items)) {
            return [];
        }

        return collect($order->items)->map(function ($item) {
            return [
                'product_id' => $item['product_id'] ?? $item['product']['id'] ?? null,
                'name' => $item['product']['name'] ?? $item['name'] ?? 'Unknown',
                'sku' => $item['product']['sku'] ?? null,
                'quantity' => $item['quantity'] ?? 1,
                'weight_kg' => $item['weight_kg'] ?? $item['product']['weight_kg'] ?? 0.5,
            ];
        })->toArray();
    }
}
