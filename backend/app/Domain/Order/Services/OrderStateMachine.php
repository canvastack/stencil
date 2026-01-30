<?php

namespace App\Domain\Order\Services;

use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Order\Events\OrderCancelled;
use App\Domain\Order\Events\OrderDelivered;
use App\Domain\Order\Events\OrderShipped;
use App\Domain\Order\Events\OrderSlaBreached;
use App\Domain\Order\Events\OrderSlaEscalated;
use App\Domain\Order\Events\OrderStatusChanged;
use App\Domain\Order\Events\PaymentReceived;
use App\Domain\Order\Jobs\OrderSlaMonitorJob;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\OrderPaymentTransaction;
use App\Domain\Order\Services\OrderPaymentService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class OrderStateMachine
{
    protected VendorNegotiationService $vendorNegotiationService;
    protected OrderPaymentService $orderPaymentService;
    protected ?OrderPaymentTransaction $recentPaymentTransaction = null;

    protected array $slaPolicies = [
        'vendor_sourcing' => [
            'threshold_minutes' => 240,
            'escalations' => [
                [
                    'level' => 'procurement_lead',
                    'channel' => 'slack',
                    'after_minutes' => 240,
                ],
                [
                    'level' => 'operations_manager',
                    'channel' => 'email',
                    'after_minutes' => 360,
                ],
            ],
        ],
        'vendor_negotiation' => [
            'threshold_minutes' => 720,
            'escalations' => [
                [
                    'level' => 'procurement_manager',
                    'channel' => 'slack',
                    'after_minutes' => 720,
                ],
                [
                    'level' => 'general_manager',
                    'channel' => 'email',
                    'after_minutes' => 960,
                ],
            ],
        ],
        'customer_quote' => [
            'threshold_minutes' => 1440,
            'escalations' => [
                [
                    'level' => 'sales_lead',
                    'channel' => 'email',
                    'after_minutes' => 1440,
                ],
                [
                    'level' => 'operations_manager',
                    'channel' => 'slack',
                    'after_minutes' => 2160,
                ],
            ],
        ],
        'awaiting_payment' => [
            'threshold_minutes' => 4320,
            'escalations' => [
                [
                    'level' => 'finance_team',
                    'channel' => 'email',
                    'after_minutes' => 4320,
                ],
            ],
        ],
        'in_production' => [
            'threshold_minutes' => 2880,
            'escalations' => [
                [
                    'level' => 'production_manager',
                    'channel' => 'slack',
                    'after_minutes' => 2880,
                ],
                [
                    'level' => 'operations_manager',
                    'channel' => 'email',
                    'after_minutes' => 4320,
                ],
            ],
        ],
        'quality_control' => [
            'threshold_minutes' => 720,
            'escalations' => [
                [
                    'level' => 'qa_lead',
                    'channel' => 'slack',
                    'after_minutes' => 720,
                ],
            ],
        ],
        'shipping' => [
            'threshold_minutes' => 2880,
            'escalations' => [
                [
                    'level' => 'logistics_manager',
                    'channel' => 'email',
                    'after_minutes' => 2880,
                ],
                [
                    'level' => 'operations_manager',
                    'channel' => 'slack',
                    'after_minutes' => 4320,
                ],
            ],
        ],
    ];

    public function __construct(
        ?VendorNegotiationService $vendorNegotiationService = null,
        ?OrderPaymentService $orderPaymentService = null
    ) {
        $this->vendorNegotiationService = $vendorNegotiationService ?? app(VendorNegotiationService::class);
        $this->orderPaymentService = $orderPaymentService ?? app(OrderPaymentService::class);
    }

    public function transitionTo(Order $order, OrderStatus $newStatus, array $metadata = []): bool
    {
        $currentStatus = OrderStatus::fromString($order->status);

        if (!$this->canTransition($currentStatus, $newStatus)) {
            throw new \DomainException(
                "Tidak dapat mengubah status pesanan dari {$currentStatus->label()} ke {$newStatus->label()}"
            );
        }

        $transitionTime = Carbon::now();
        $this->recentPaymentTransaction = null;

        return DB::transaction(function () use ($order, $newStatus, $currentStatus, $metadata, $transitionTime) {
            $oldStatus = $order->status;

            $this->finalizeSla($order, $currentStatus, $newStatus, $transitionTime);

            $order->status = $newStatus->value;

            $this->applyStatusSideEffects($order, $newStatus, $metadata);
            $this->applyFinancialMetadata($order, $newStatus, $metadata);

            $this->initializeSla($order, $newStatus, $transitionTime);

            $order->save();

            $this->logStatusTransition($order, $oldStatus, $newStatus, $metadata);

            $this->dispatchEvents($order, $oldStatus, $newStatus->value, $metadata);

            return true;
        });
    }

    public function canTransition(OrderStatus $currentStatus, OrderStatus $newStatus): bool
    {
        if ($currentStatus === $newStatus) {
            return false;
        }

        return $currentStatus->canTransitionTo($newStatus);
    }

    public function getAvailableTransitions(Order $order): array
    {
        $currentStatus = OrderStatus::fromString($order->status);
        
        return array_map(
            fn(OrderStatus $status) => [
                'status' => $status->value,
                'label' => $status->label(),
                'description' => $status->description(),
            ],
            $currentStatus->getAllowedTransitions()
        );
    }

    protected function applyStatusSideEffects(Order $order, OrderStatus $newStatus, array $metadata): void
    {
        match ($newStatus) {
            OrderStatus::VENDOR_SOURCING => $this->handleSourcingVendor($order),
            OrderStatus::VENDOR_NEGOTIATION => $this->handleVendorNegotiation($order, $metadata),
            OrderStatus::CUSTOMER_QUOTE => $this->handleCustomerQuotation($order, $metadata),
            OrderStatus::AWAITING_PAYMENT => $this->handleWaitingPayment($order),
            OrderStatus::PARTIAL_PAYMENT, OrderStatus::FULL_PAYMENT => $this->handlePaymentReceived($order, $metadata),
            OrderStatus::IN_PRODUCTION => $this->handleInProduction($order, $metadata),
            OrderStatus::QUALITY_CONTROL => $this->handleQualityCheck($order),
            OrderStatus::SHIPPING => $this->handleShipped($order, $metadata),
            OrderStatus::COMPLETED => $this->handleCompleted($order),
            OrderStatus::CANCELLED => $this->handleCancelled($order, $metadata),
            OrderStatus::REFUNDED => $this->handleRefunded($order, $metadata),
            default => null,
        };
    }

    protected function applyFinancialMetadata(Order $order, OrderStatus $status, array $metadata): void
    {
        if (!in_array($status, [OrderStatus::PARTIAL_PAYMENT, OrderStatus::FULL_PAYMENT]) 
            && isset($metadata['payment']) && is_array($metadata['payment'])) {
            $this->recentPaymentTransaction = $this->orderPaymentService->recordCustomerPayment($order, $metadata['payment']);
        }

        if (isset($metadata['disbursement']) && is_array($metadata['disbursement'])) {
            $this->orderPaymentService->recordVendorDisbursement($order, $metadata['disbursement']);
        }
    }

    protected function handleSourcingVendor(Order $order): void
    {
        Log::info("Order {$order->order_number}: Mulai mencari vendor");
    }

    protected function handleVendorNegotiation(Order $order, array $metadata): void
    {
        if (isset($metadata['vendor_id'])) {
            $order->vendor_id = $metadata['vendor_id'];
        }

        $payload = $metadata['negotiation'] ?? [];

        if (!isset($payload['vendor_id']) && $order->vendor_id) {
            $payload['vendor_id'] = $order->vendor_id;
        }

        $negotiation = $this->vendorNegotiationService->startNegotiation($order, $payload);

        Log::info("Order {$order->order_number}: Negosiasi dengan vendor dimulai", [
            'negotiation_id' => $negotiation->id,
            'vendor_id' => $order->vendor_id,
        ]);
    }

    protected function handleCustomerQuotation(Order $order, array $metadata): void
    {
        if (isset($metadata['quotation_amount'])) {
            $currentMetadata = $order->metadata ?? [];
            $currentMetadata['quotation_amount'] = $metadata['quotation_amount'];
            $currentMetadata['quotation_date'] = Carbon::now()->toIso8601String();
            $order->metadata = $currentMetadata;
        }

        Log::info("Order {$order->order_number}: Penawaran harga dikirim ke customer");
    }

    protected function handleWaitingPayment(Order $order): void
    {
        Log::info("Order {$order->order_number}: Menunggu pembayaran dari customer");
    }

    protected function handlePaymentReceived(Order $order, array $metadata): void
    {
        $paymentPayload = $metadata['payment'] ?? [];

        if (!isset($paymentPayload['method']) && isset($metadata['payment_method'])) {
            $paymentPayload['method'] = $metadata['payment_method'];
        }

        if (!isset($paymentPayload['currency'])) {
            $paymentPayload['currency'] = $order->currency ?? 'IDR';
        }

        if (!isset($paymentPayload['paid_at']) && isset($metadata['payment_date'])) {
            $paymentPayload['paid_at'] = $metadata['payment_date'];
        }

        if (!isset($paymentPayload['amount']) || $paymentPayload['amount'] <= 0) {
            $outstanding = max(0, ($order->total_amount ?? 0) - ($order->total_paid_amount ?? 0));
            if ($outstanding <= 0) {
                throw new \DomainException('Tidak ada jumlah pembayaran yang perlu diproses');
            }
            $paymentPayload['amount'] = $outstanding;
        }

        if (isset($metadata['down_payment_amount'])) {
            $paymentPayload['down_payment_amount'] = $metadata['down_payment_amount'];
        }

        $transaction = $this->orderPaymentService->recordCustomerPayment($order, $paymentPayload);
        $this->recentPaymentTransaction = $transaction;

        if ($order->customer) {
            $order->customer->updateOrderStats();
        }

        Log::info("Order {$order->order_number}: Pembayaran diterima", [
            'amount' => $paymentPayload['amount'],
            'payment_status' => $order->payment_status,
        ]);
    }

    protected function handleInProduction(Order $order, array $metadata): void
    {
        if (isset($metadata['estimated_delivery'])) {
            $order->estimated_delivery = Carbon::parse($metadata['estimated_delivery']);
        }

        Log::info("Order {$order->order_number}: Pesanan masuk ke produksi");
    }

    protected function handleQualityCheck(Order $order): void
    {
        Log::info("Order {$order->order_number}: Pengecekan kualitas produk");
    }

    protected function handleReadyToShip(Order $order): void
    {
        Log::info("Order {$order->order_number}: Produk siap dikirim");
    }

    protected function handleShipped(Order $order, array $metadata): void
    {
        $order->shipped_at = Carbon::now();
        
        if (isset($metadata['tracking_number'])) {
            $order->tracking_number = $metadata['tracking_number'];
        }

        Log::info("Order {$order->order_number}: Pesanan telah dikirim");
    }

    protected function handleDelivered(Order $order, array $metadata): void
    {
        $order->delivered_at = isset($metadata['delivered_at']) 
            ? Carbon::parse($metadata['delivered_at']) 
            : Carbon::now();

        Log::info("Order {$order->order_number}: Pesanan telah diterima customer");
    }

    protected function handleCompleted(Order $order): void
    {
        if ($order->customer) {
            $order->customer->updateOrderStats();
        }

        Log::info("Order {$order->order_number}: Pesanan selesai");
    }

    protected function handleCancelled(Order $order, array $metadata): void
    {
        $order->payment_status = 'cancelled';
        
        if (isset($metadata['cancellation_reason'])) {
            $currentMetadata = $order->metadata ?? [];
            $currentMetadata['cancellation_reason'] = $metadata['cancellation_reason'];
            $currentMetadata['cancelled_at'] = Carbon::now()->toIso8601String();
            $order->metadata = $currentMetadata;
        }

        Log::info("Order {$order->order_number}: Pesanan dibatalkan");
    }

    protected function handleRefunded(Order $order, array $metadata): void
    {
        $order->payment_status = 'refunded';
        
        if (isset($metadata['refund_amount'])) {
            $currentMetadata = $order->metadata ?? [];
            $currentMetadata['refund_amount'] = $metadata['refund_amount'];
            $currentMetadata['refunded_at'] = Carbon::now()->toIso8601String();
            if (isset($metadata['refund_reason'])) {
                $currentMetadata['refund_reason'] = $metadata['refund_reason'];
            }
            $order->metadata = $currentMetadata;
        }

        Log::info("Order {$order->order_number}: Dana dikembalikan ke customer");
    }

    protected function getSlaPolicy(OrderStatus $status): ?array
    {
        return $this->slaPolicies[$status->value] ?? null;
    }

    protected function finalizeSla(Order $order, OrderStatus $previousStatus, OrderStatus $nextStatus, Carbon $now): void
    {
        $metadata = $order->metadata ?? [];
        $slaMetadata = $metadata['sla'] ?? [];
        $active = $slaMetadata['active'] ?? null;

        if (!$active || ($active['status'] ?? null) !== $previousStatus->value) {
            return;
        }

        $policy = $this->getSlaPolicy($previousStatus);

        if (!$policy) {
            unset($slaMetadata['active']);
            if (!empty($slaMetadata)) {
                $metadata['sla'] = $slaMetadata;
            } else {
                unset($metadata['sla']);
            }
            $order->metadata = $metadata;
            return;
        }

        $startedAt = Carbon::parse($active['started_at']);
        [, $triggeredEscalations] = $this->evaluateEscalations(
            $order,
            $previousStatus,
            $active['escalations'] ?? [],
            $startedAt,
            $now
        );

        $durationSeconds = $startedAt->diffInSeconds($now);
        $thresholdMinutes = $policy['threshold_minutes'] ?? null;
        $breached = $thresholdMinutes !== null && $durationSeconds > ($thresholdMinutes * 60);

        if ($breached) {
            Log::warning('Order SLA breached', [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'status' => $previousStatus->value,
                'tenant_id' => $order->tenant_id,
                'duration_seconds' => $durationSeconds,
                'threshold_minutes' => $thresholdMinutes,
            ]);
        }

        $history = $slaMetadata['history'] ?? [];

        $history[] = array_filter([
            'status' => $previousStatus->value,
            'started_at' => $active['started_at'] ?? null,
            'ended_at' => $now->toIso8601String(),
            'due_at' => $active['due_at'] ?? null,
            'duration_seconds' => $durationSeconds,
            'threshold_minutes' => $thresholdMinutes,
            'breached' => $breached,
            'breached_at' => $breached ? $now->toIso8601String() : null,
            'escalations_triggered' => $triggeredEscalations,
            'next_status' => $nextStatus->value,
        ], fn ($value) => $value !== null && $value !== []);

        $slaMetadata['history'] = $history;
        unset($slaMetadata['active']);

        if (!empty($slaMetadata)) {
            $metadata['sla'] = $slaMetadata;
        } else {
            unset($metadata['sla']);
        }

        $order->metadata = $metadata;
    }

    protected function initializeSla(Order $order, OrderStatus $status, Carbon $now): void
    {
        $policy = $this->getSlaPolicy($status);
        $metadata = $order->metadata ?? [];
        if (!is_array($metadata)) {
            $metadata = [];
        }
        $slaMetadata = $metadata['sla'] ?? [];

        if (!$policy) {
            if (isset($slaMetadata['active'])) {
                unset($slaMetadata['active']);
                if (!empty($slaMetadata)) {
                    $metadata['sla'] = $slaMetadata;
                } else {
                    unset($metadata['sla']);
                }
                $order->metadata = $metadata;
            }
            return;
        }

        $thresholdMinutes = $policy['threshold_minutes'] ?? null;
        $dueAt = $thresholdMinutes ? $now->copy()->addMinutes($thresholdMinutes)->toIso8601String() : null;

        $active = [
            'status' => $status->value,
            'started_at' => $now->toIso8601String(),
            'due_at' => $dueAt,
            'threshold_minutes' => $thresholdMinutes,
        ];

        if (!empty($policy['escalations'] ?? [])) {
            $active['escalations'] = array_map(function (array $escalation) {
                return [
                    'level' => $escalation['level'] ?? null,
                    'channel' => $escalation['channel'] ?? null,
                    'after_minutes' => $escalation['after_minutes'] ?? null,
                    'triggered_at' => null,
                ];
            }, $policy['escalations']);
        }

        $slaMetadata['active'] = $active;
        $metadata['sla'] = $slaMetadata;
        $order->metadata = $metadata;

        $this->scheduleSlaTimers($order, $status, $now, $policy);

        Log::info('Order SLA timer initialized', [
            'order_id' => $order->id,
            'order_number' => $order->order_number,
            'status' => $status->value,
            'tenant_id' => $order->tenant_id,
            'due_at' => $dueAt,
            'threshold_minutes' => $thresholdMinutes,
        ]);
    }

    protected function scheduleSlaTimers(Order $order, OrderStatus $status, Carbon $now, array $policy): void
    {
        $thresholdMinutes = $policy['threshold_minutes'] ?? null;

        if ($thresholdMinutes !== null) {
            $this->dispatchSlaJob(
                $order,
                $status->value,
                null,
                true,
                $now->copy()->addMinutes($thresholdMinutes)
            );
        }

        foreach (($policy['escalations'] ?? []) as $index => $escalation) {
            $afterMinutes = $escalation['after_minutes'] ?? null;

            if ($afterMinutes === null) {
                continue;
            }

            $this->dispatchSlaJob(
                $order,
                $status->value,
                $index,
                false,
                $now->copy()->addMinutes($afterMinutes)
            );
        }
    }

    protected function dispatchSlaJob(
        Order $order,
        string $status,
        ?int $escalationIndex,
        bool $thresholdCheck,
        Carbon $runAt,
        bool $afterCommit = true
    ): void {
        $job = new OrderSlaMonitorJob($order->id, $order->tenant_id, $status, $escalationIndex, $thresholdCheck);
        
        $pending = dispatch($job)->delay($runAt);

        if ($afterCommit) {
            $pending->afterCommit();
        }
    }

    public function processSlaTimer(
        Order $order,
        OrderStatus $status,
        ?int $escalationIndex,
        bool $thresholdCheck,
        ?Carbon $now = null
    ): void {
        $now = $now ?? Carbon::now();
        $metadata = $order->metadata ?? [];
        $slaMetadata = $metadata['sla'] ?? [];
        $active = $slaMetadata['active'] ?? null;

        if (!$active || ($active['status'] ?? null) !== $status->value) {
            return;
        }

        $policy = $this->getSlaPolicy($status);

        if (!$policy) {
            return;
        }

        $startedAt = Carbon::parse($active['started_at']);
        $originalEscalations = $active['escalations'] ?? [];
        $metadataUpdated = false;
        $events = [];

        if (!empty($originalEscalations)) {
            [$updatedEscalations] = $this->evaluateEscalations(
                $order,
                $status,
                $originalEscalations,
                $startedAt,
                $now
            );

            $active['escalations'] = $updatedEscalations;

            foreach ($updatedEscalations as $index => $escalation) {
                $previousTrigger = $originalEscalations[$index]['triggered_at'] ?? null;
                $currentTrigger = $escalation['triggered_at'] ?? null;

                if (!$previousTrigger && $currentTrigger) {
                    $events[] = [
                        'type' => 'escalation',
                        'payload' => $escalation,
                    ];
                    $metadataUpdated = true;
                }
            }

            if ($updatedEscalations !== $originalEscalations) {
                $metadataUpdated = true;
            }
        }

        if ($thresholdCheck) {
            $thresholdMinutes = $policy['threshold_minutes'] ?? null;

            if ($thresholdMinutes !== null) {
                $dueAt = $startedAt->copy()->addMinutes($thresholdMinutes);

                if ($now->lt($dueAt)) {
                    return;
                }

                if (empty($active['breached_at'])) {
                    $active['breached_at'] = $now->toIso8601String();
                    $active['breached'] = true;
                    $metadataUpdated = true;
                    $events[] = [
                        'type' => 'breach',
                        'payload' => [
                            'breached_at' => $active['breached_at'],
                        ],
                    ];

                    Log::warning('Order SLA breached', [
                        'order_id' => $order->id,
                        'order_number' => $order->order_number,
                        'status' => $status->value,
                        'tenant_id' => $order->tenant_id,
                        'duration_seconds' => $startedAt->diffInSeconds($now),
                        'threshold_minutes' => $thresholdMinutes,
                    ]);
                }
            }
        } elseif ($escalationIndex !== null) {
            $escalation = $active['escalations'][$escalationIndex] ?? null;

            if ($escalation) {
                $afterMinutes = $escalation['after_minutes'] ?? null;

                if ($afterMinutes !== null) {
                    $triggerAt = $startedAt->copy()->addMinutes($afterMinutes);

                    if ($now->lt($triggerAt)) {
                        return;
                    }
                }
            }
        }

        if ($metadataUpdated) {
            $slaMetadata['active'] = $active;
            $metadata['sla'] = $slaMetadata;
            $order->metadata = $metadata;
            $order->save();
        }

        foreach ($events as $event) {
            if ($event['type'] === 'escalation') {
                event(new OrderSlaEscalated(
                    $order,
                    $status->value,
                    $event['payload']['level'] ?? null,
                    $event['payload']['channel'] ?? null,
                    $event['payload']['triggered_at'] ?? $now->toIso8601String()
                ));
            }

            if ($event['type'] === 'breach') {
                event(new OrderSlaBreached(
                    $order,
                    $status->value,
                    $event['payload']['breached_at']
                ));
            }
        }
    }

    protected function evaluateEscalations(
        Order $order,
        OrderStatus $status,
        array $escalations,
        Carbon $startedAt,
        Carbon $now
    ): array {
        $triggered = [];

        foreach ($escalations as $index => $escalation) {
            $afterMinutes = $escalation['after_minutes'] ?? null;

            if ($afterMinutes === null) {
                continue;
            }

            $existingTrigger = $escalation['triggered_at'] ?? null;

            if ($existingTrigger) {
                $triggered[] = $escalation;
                continue;
            }

            $triggerAt = $startedAt->copy()->addMinutes($afterMinutes);

            if ($now->greaterThanOrEqualTo($triggerAt)) {
                $timestamp = $triggerAt->toIso8601String();
                $escalations[$index]['triggered_at'] = $timestamp;
                $triggered[] = array_merge($escalation, [
                    'triggered_at' => $timestamp,
                ]);

                Log::warning('Order SLA escalation triggered', [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'status' => $status->value,
                    'tenant_id' => $order->tenant_id,
                    'level' => $escalation['level'] ?? null,
                    'channel' => $escalation['channel'] ?? null,
                    'after_minutes' => $afterMinutes,
                ]);
            }
        }

        return [$escalations, $triggered];
    }

    protected function logStatusTransition(Order $order, string $oldStatus, OrderStatus $newStatus, array $metadata): void
    {
        Log::info("Order status transition", [
            'order_id' => $order->id,
            'order_number' => $order->order_number,
            'old_status' => $oldStatus,
            'new_status' => $newStatus->value,
            'tenant_id' => $order->tenant_id,
            'metadata' => $metadata,
            'timestamp' => Carbon::now()->toIso8601String(),
        ]);
    }

    public function validateTransition(Order $order, OrderStatus $newStatus, array $metadata = []): array
    {
        $errors = [];
        $currentStatus = OrderStatus::fromString($order->status);

        if (!$this->canTransition($currentStatus, $newStatus)) {
            $errors[] = "Transisi dari {$currentStatus->label()} ke {$newStatus->label()} tidak diperbolehkan";
        }

        if ($order->total_amount < 0) {
            $errors[] = 'Total jumlah pesanan tidak boleh negatif';
        }

        switch ($newStatus) {
            case OrderStatus::VENDOR_NEGOTIATION:
                if (!isset($metadata['vendor_id']) && !$order->vendor_id) {
                    $errors[] = 'Vendor harus dipilih untuk negosiasi';
                }
                break;

            case OrderStatus::CUSTOMER_QUOTE:
                if (!isset($metadata['quotation_amount']) && !$order->quotation_amount) {
                    $errors[] = 'Jumlah penawaran harus diisi';
                } elseif (isset($metadata['quotation_amount']) && (int) $metadata['quotation_amount'] <= 0) {
                    $errors[] = 'Jumlah penawaran harus lebih besar dari 0';
                } elseif (!isset($metadata['quotation_amount']) && $order->quotation_amount && (int) $order->quotation_amount <= 0) {
                    $errors[] = 'Jumlah penawaran harus lebih besar dari 0';
                }
                break;

            case OrderStatus::PARTIAL_PAYMENT:
            case OrderStatus::FULL_PAYMENT:
                $paymentData = $metadata['payment'] ?? [];
                $providedMethod = $paymentData['method'] ?? $metadata['payment_method'] ?? null;

                if (!$providedMethod && !$order->payment_method) {
                    $errors[] = 'Metode pembayaran harus diisi';
                }

                if (isset($paymentData['amount']) && (int) $paymentData['amount'] <= 0) {
                    $errors[] = 'Jumlah pembayaran harus lebih besar dari 0';
                }

                $outstanding = max(0, ($order->total_amount ?? 0) - ($order->total_paid_amount ?? 0));
                if ($outstanding <= 0) {
                    $errors[] = 'Pesanan sudah lunas';
                }
                break;

            case OrderStatus::SHIPPING:
                if (!isset($metadata['tracking_number']) && !$order->tracking_number) {
                    $errors[] = 'Nomor resi pengiriman harus diisi';
                }
                break;

            case OrderStatus::CANCELLED:
                if (!isset($metadata['cancellation_reason'])) {
                    $errors[] = 'Alasan pembatalan harus diisi';
                }
                break;

            case OrderStatus::REFUNDED:
                if (!isset($metadata['refund_amount'])) {
                    $errors[] = 'Jumlah pengembalian dana harus diisi';
                }
                break;
        }

        return $errors;
    }

    protected function dispatchEvents(Order $order, string $oldStatus, string $newStatus, array $metadata): void
    {
        // Convert string statuses to OrderStatus enums for proper type handling
        $oldStatusEnum = OrderStatus::fromString($oldStatus);
        $newStatusEnum = OrderStatus::fromString($newStatus);
        
        // Extract reason from metadata if available, otherwise use null
        $reason = isset($metadata['reason']) ? (string) $metadata['reason'] : null;
        
        // Create UuidValueObject instances for the event
        $orderIdVO = \App\Domain\Shared\ValueObjects\UuidValueObject::fromString($order->uuid);
        
        // Get tenant UUID from the tenant relationship
        $tenantUuid = $order->tenant->uuid ?? null;
        if (!$tenantUuid) {
            throw new \RuntimeException('Tenant UUID not found for order ' . $order->uuid);
        }
        $tenantIdVO = \App\Domain\Shared\ValueObjects\UuidValueObject::fromString($tenantUuid);
        
        // Get the user who made the change (if available)
        $changedBy = auth()->id() ? (string) auth()->id() : null;
        
        event(new OrderStatusChanged(
            $orderIdVO,
            $tenantIdVO,
            $oldStatusEnum->value,
            $newStatusEnum->value,
            $changedBy,
            $reason
        ));

        $recentAmount = $this->recentPaymentTransaction?->amount ?? 0;
        if ($recentAmount <= 0 && isset($metadata['payment']) && is_array($metadata['payment'])) {
            $recentAmount = (int) ($metadata['payment']['amount'] ?? 0);
        }

        if ($recentAmount <= 0) {
            $recentAmount = $order->total_paid_amount;
        }

        match ($newStatus) {
            'payment_received' => event(new PaymentReceived(
                $order,
                \App\Domain\Shared\ValueObjects\Money::fromCents($recentAmount),
                $metadata['payment_method'] ?? $order->payment_method ?? 'unknown',
                $metadata['payment_reference'] ?? 'REF-' . time()
            )),
            'shipped' => event(new OrderShipped(
                $order, 
                $metadata['tracking_number'] ?? $order->tracking_number ?? ''
            )),
            'delivered' => event(new OrderDelivered($order)),
            'cancelled' => event(new OrderCancelled(
                $order, 
                $metadata['cancellation_reason'] ?? 'Tidak ada alasan'
            )),
            default => null,
        };
    }
}
