<?php

namespace App\Domain\VendorProduction\Notifications;

use App\Models\VendorProductionUpdate;
use App\Models\VendorPurchaseOrder;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Production Completed Notification
 * 
 * Sent to admin users when vendor completes production.
 */
class ProductionCompletedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        protected VendorPurchaseOrder $purchaseOrder,
        protected VendorProductionUpdate $finalUpdate
    ) {}

    /**
     * Get the notification's delivery channels.
     */
    public function via($notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail($notifiable): MailMessage
    {
        $vendorName = $this->purchaseOrder->vendor->name ?? 'Vendor';
        $completionDate = $this->finalUpdate->actual_completion_date 
            ? $this->finalUpdate->actual_completion_date->format('d M Y, H:i')
            : now()->format('d M Y, H:i');

        $message = (new MailMessage)
            ->subject("✅ Produksi Selesai: {$this->purchaseOrder->po_number}")
            ->greeting("Halo {$notifiable->name},")
            ->line("Kabar baik! Vendor **{$vendorName}** telah menyelesaikan produksi untuk PO **{$this->purchaseOrder->po_number}**.")
            ->line("**Tanggal Selesai:** {$completionDate}");

        // Check if on time
        if ($this->isOnTime()) {
            $message->line("✅ **Produksi selesai tepat waktu!**");
        } else {
            $daysOverdue = $this->getDaysOverdue();
            $message->line("⚠️ **Produksi terlambat {$daysOverdue} hari dari estimasi.**");
        }

        if ($this->finalUpdate->notes) {
            $message->line("**Catatan Vendor:** {$this->finalUpdate->notes}");
        }

        if ($this->finalUpdate->photos && count($this->finalUpdate->photos) > 0) {
            $photoCount = count($this->finalUpdate->photos);
            $message->line("📷 **{$photoCount} foto** hasil produksi telah diunggah.");
        }

        $poUrl = config('app.frontend_url') . '/admin/purchase-orders/' . $this->purchaseOrder->uuid;
        $message->action('Lihat Detail & Foto', $poUrl);

        $message->line('**Langkah Selanjutnya:**')
            ->line('1. Review foto hasil produksi')
            ->line('2. Lakukan quality check jika diperlukan')
            ->line('3. Koordinasi pengiriman dengan vendor')
            ->line('4. Update status order ke customer');

        return $message->line('Terima kasih telah menggunakan sistem kami.');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray($notifiable): array
    {
        return [
            'type' => 'production_completed',
            'purchase_order_uuid' => $this->purchaseOrder->uuid,
            'po_number' => $this->purchaseOrder->po_number,
            'vendor_name' => $this->purchaseOrder->vendor->name ?? 'Vendor',
            'completion_date' => $this->finalUpdate->actual_completion_date?->toISOString(),
            'is_on_time' => $this->isOnTime(),
            'days_overdue' => $this->getDaysOverdue(),
            'photo_count' => $this->finalUpdate->photos ? count($this->finalUpdate->photos) : 0,
            'notes' => $this->finalUpdate->notes,
        ];
    }

    /**
     * Check if production was completed on time
     */
    private function isOnTime(): bool
    {
        if (!$this->purchaseOrder->expected_delivery_date) {
            return true;
        }

        $completionDate = $this->finalUpdate->actual_completion_date ?? now();
        return $completionDate <= $this->purchaseOrder->expected_delivery_date;
    }

    /**
     * Get days overdue (0 if on time)
     */
    private function getDaysOverdue(): int
    {
        if (!$this->purchaseOrder->expected_delivery_date) {
            return 0;
        }

        $completionDate = $this->finalUpdate->actual_completion_date ?? now();
        $diff = $completionDate->diff($this->purchaseOrder->expected_delivery_date);
        
        return $diff->invert ? $diff->days : 0;
    }
}
