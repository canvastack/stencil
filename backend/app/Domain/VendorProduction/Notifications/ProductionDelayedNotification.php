<?php

namespace App\Domain\VendorProduction\Notifications;

use App\Models\VendorProductionUpdate;
use App\Models\VendorPurchaseOrder;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Production Delayed Notification
 * 
 * Sent to admin users when vendor reports a production delay.
 */
class ProductionDelayedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        protected VendorPurchaseOrder $purchaseOrder,
        protected VendorProductionUpdate $update
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
        
        $message = (new MailMessage)
            ->subject("⚠️ Delay Produksi: {$this->purchaseOrder->po_number}")
            ->greeting("Halo {$notifiable->name},")
            ->line("Vendor **{$vendorName}** melaporkan adanya delay pada produksi PO **{$this->purchaseOrder->po_number}**.")
            ->line("**Progress Saat Ini:** {$this->update->progress_percentage}%");

        if ($this->update->notes) {
            $message->line("**Alasan Delay:** {$this->update->notes}");
        }

        // Show old and new estimated dates
        if ($this->purchaseOrder->expected_delivery_date) {
            $oldDate = $this->purchaseOrder->expected_delivery_date->format('d M Y');
            $message->line("**Estimasi Awal:** {$oldDate}");
        }

        if ($this->update->estimated_completion_date) {
            $newDate = $this->update->estimated_completion_date->format('d M Y');
            $message->line("**Estimasi Baru:** {$newDate}");
            
            // Calculate delay days
            if ($this->purchaseOrder->expected_delivery_date) {
                $delayDays = $this->update->estimated_completion_date
                    ->diff($this->purchaseOrder->expected_delivery_date)
                    ->days;
                $message->line("⏱️ **Delay:** {$delayDays} hari dari estimasi awal");
            }
        }

        $poUrl = config('app.frontend_url') . '/admin/purchase-orders/' . $this->purchaseOrder->uuid;
        $message->action('Lihat Detail PO', $poUrl);

        $message->line('**Tindakan yang Perlu Dilakukan:**')
            ->line('1. Review alasan delay dari vendor')
            ->line('2. Evaluasi dampak terhadap timeline customer')
            ->line('3. Komunikasikan perubahan timeline ke customer')
            ->line('4. Monitor progress vendor lebih ketat');

        return $message->line('Segera ambil tindakan untuk meminimalkan dampak delay.');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray($notifiable): array
    {
        $delayDays = 0;
        if ($this->purchaseOrder->expected_delivery_date && $this->update->estimated_completion_date) {
            $delayDays = $this->update->estimated_completion_date
                ->diff($this->purchaseOrder->expected_delivery_date)
                ->days;
        }

        return [
            'type' => 'production_delayed',
            'purchase_order_uuid' => $this->purchaseOrder->uuid,
            'po_number' => $this->purchaseOrder->po_number,
            'vendor_name' => $this->purchaseOrder->vendor->name ?? 'Vendor',
            'progress_percentage' => $this->update->progress_percentage,
            'reason' => $this->update->notes,
            'old_estimated_date' => $this->purchaseOrder->expected_delivery_date?->toISOString(),
            'new_estimated_date' => $this->update->estimated_completion_date?->toISOString(),
            'delay_days' => $delayDays,
        ];
    }
}
