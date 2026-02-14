<?php

namespace App\Domain\VendorProduction\Notifications;

use App\Models\VendorProductionUpdate;
use App\Models\VendorPurchaseOrder;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Production Update Notification
 * 
 * Sent to admin users when vendor creates a production update.
 */
class ProductionUpdateNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        protected VendorProductionUpdate $update,
        protected VendorPurchaseOrder $purchaseOrder
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
        $statusLabels = [
            'started' => 'Dimulai',
            'in_progress' => 'Dalam Proses',
            'quality_check' => 'Quality Check',
            'delayed' => 'Tertunda',
            'completed' => 'Selesai',
        ];

        $statusLabel = $statusLabels[$this->update->status] ?? $this->update->status;
        $vendorName = $this->purchaseOrder->vendor->name ?? 'Vendor';

        $message = (new MailMessage)
            ->subject("Update Produksi: {$this->purchaseOrder->po_number}")
            ->greeting("Halo {$notifiable->name},")
            ->line("Vendor **{$vendorName}** telah memberikan update produksi untuk PO **{$this->purchaseOrder->po_number}**.")
            ->line("**Status:** {$statusLabel}")
            ->line("**Progress:** {$this->update->progress_percentage}%");

        if ($this->update->notes) {
            $message->line("**Catatan:** {$this->update->notes}");
        }

        if ($this->update->estimated_completion_date) {
            $estimatedDate = $this->update->estimated_completion_date->format('d M Y');
            $message->line("**Estimasi Selesai:** {$estimatedDate}");
        }

        if ($this->update->photos && count($this->update->photos) > 0) {
            $photoCount = count($this->update->photos);
            $message->line("📷 **{$photoCount} foto** dokumentasi telah diunggah.");
        }

        $poUrl = config('app.frontend_url') . '/admin/purchase-orders/' . $this->purchaseOrder->uuid;
        $message->action('Lihat Detail PO', $poUrl);

        if ($this->update->is_milestone) {
            $message->line('⭐ **Ini adalah milestone penting!**');
        }

        return $message->line('Terima kasih telah menggunakan sistem kami.');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray($notifiable): array
    {
        return [
            'type' => 'production_update',
            'update_uuid' => $this->update->uuid,
            'purchase_order_uuid' => $this->purchaseOrder->uuid,
            'po_number' => $this->purchaseOrder->po_number,
            'vendor_name' => $this->purchaseOrder->vendor->name ?? 'Vendor',
            'status' => $this->update->status,
            'progress_percentage' => $this->update->progress_percentage,
            'notes' => $this->update->notes,
            'is_milestone' => $this->update->is_milestone,
            'photo_count' => $this->update->photos ? count($this->update->photos) : 0,
            'created_at' => $this->update->created_at->toISOString(),
        ];
    }
}
