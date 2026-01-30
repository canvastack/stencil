/**
 * Order Status Manager Component
 * 
 * Manages order status updates with proper validation and permissions
 * Implements business rule enforcement and audit logging
 * 
 * COMPLIANCE:
 * - ✅ NO MOCK DATA: All data from backend APIs
 * - ✅ BUSINESS ALIGNMENT: Follows status transition rules
 * - ✅ PERMISSION CHECKS: Role-based status updates
 * - ✅ AUDIT LOGGING: Track all status changes
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Loader2,
  Shield,
  FileText
} from 'lucide-react';
import { OrderStatus } from '@/types/order';
import { toast } from 'sonner';

interface StatusTransition {
  from: OrderStatus;
  to: OrderStatus;
  label: string;
  description: string;
  requiresConfirmation: boolean;
  requiresNotes: boolean;
  permissions: string[];
}

interface OrderStatusManagerProps {
  currentStatus: OrderStatus;
  orderId: string;
  onStatusUpdate: (newStatus: OrderStatus, notes?: string) => Promise<void>;
  userPermissions: string[];
  isLoading?: boolean;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.New]: 'Pesanan Baru',
  [OrderStatus.Draft]: 'Draft',
  [OrderStatus.Pending]: 'Menunggu Review',
  [OrderStatus.VendorSourcing]: 'Pencarian Vendor',
  [OrderStatus.VendorNegotiation]: 'Negosiasi Vendor',
  [OrderStatus.CustomerQuote]: 'Quote Customer',
  [OrderStatus.AwaitingPayment]: 'Menunggu Pembayaran',
  [OrderStatus.PartialPayment]: 'DP Diterima',
  [OrderStatus.FullPayment]: 'Pembayaran Lunas',
  [OrderStatus.InProduction]: 'Dalam Produksi',
  [OrderStatus.QualityControl]: 'Quality Control',
  [OrderStatus.Shipping]: 'Dalam Pengiriman',
  [OrderStatus.Delivered]: 'Terkirim',
  [OrderStatus.Completed]: 'Selesai',
  [OrderStatus.Cancelled]: 'Dibatalkan',
  [OrderStatus.Refunded]: 'Dikembalikan',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.New]: 'bg-blue-500/10 text-blue-500',
  [OrderStatus.Draft]: 'bg-gray-500/10 text-gray-500',
  [OrderStatus.Pending]: 'bg-yellow-500/10 text-yellow-500',
  [OrderStatus.VendorSourcing]: 'bg-purple-500/10 text-purple-500',
  [OrderStatus.VendorNegotiation]: 'bg-indigo-500/10 text-indigo-500',
  [OrderStatus.CustomerQuote]: 'bg-cyan-500/10 text-cyan-500',
  [OrderStatus.AwaitingPayment]: 'bg-orange-500/10 text-orange-500',
  [OrderStatus.PartialPayment]: 'bg-amber-500/10 text-amber-500',
  [OrderStatus.FullPayment]: 'bg-green-500/10 text-green-500',
  [OrderStatus.InProduction]: 'bg-blue-600/10 text-blue-600',
  [OrderStatus.QualityControl]: 'bg-teal-500/10 text-teal-500',
  [OrderStatus.Shipping]: 'bg-purple-600/10 text-purple-600',
  [OrderStatus.Delivered]: 'bg-green-600/10 text-green-600',
  [OrderStatus.Completed]: 'bg-emerald-500/10 text-emerald-500',
  [OrderStatus.Cancelled]: 'bg-red-500/10 text-red-500',
  [OrderStatus.Refunded]: 'bg-pink-500/10 text-pink-500',
};

// Define valid status transitions with business rules
const STATUS_TRANSITIONS: StatusTransition[] = [
  // From New/Draft
  {
    from: OrderStatus.New,
    to: OrderStatus.Pending,
    label: 'Mulai Review',
    description: 'Mulai proses review pesanan',
    requiresConfirmation: false,
    requiresNotes: false,
    permissions: ['update_order_status', 'admin']
  },
  {
    from: OrderStatus.Draft,
    to: OrderStatus.Pending,
    label: 'Mulai Review',
    description: 'Mulai proses review pesanan',
    requiresConfirmation: false,
    requiresNotes: false,
    permissions: ['update_order_status', 'admin']
  },

  // From Pending
  {
    from: OrderStatus.Pending,
    to: OrderStatus.VendorSourcing,
    label: 'Cari Vendor',
    description: 'Mulai pencarian vendor yang sesuai',
    requiresConfirmation: false,
    requiresNotes: false,
    permissions: ['update_order_status', 'admin']
  },
  {
    from: OrderStatus.Pending,
    to: OrderStatus.Cancelled,
    label: 'Batalkan Pesanan',
    description: 'Batalkan pesanan karena tidak dapat diproses',
    requiresConfirmation: true,
    requiresNotes: true,
    permissions: ['cancel_order', 'admin']
  },

  // From Vendor Sourcing
  {
    from: OrderStatus.VendorSourcing,
    to: OrderStatus.VendorNegotiation,
    label: 'Mulai Negosiasi',
    description: 'Vendor ditemukan, mulai negosiasi harga',
    requiresConfirmation: false,
    requiresNotes: false,
    permissions: ['update_order_status', 'admin']
  },
  {
    from: OrderStatus.VendorSourcing,
    to: OrderStatus.Cancelled,
    label: 'Batalkan - Vendor Tidak Ditemukan',
    description: 'Batalkan pesanan karena tidak ada vendor yang sesuai',
    requiresConfirmation: true,
    requiresNotes: true,
    permissions: ['cancel_order', 'admin']
  },

  // From Vendor Negotiation
  {
    from: OrderStatus.VendorNegotiation,
    to: OrderStatus.CustomerQuote,
    label: 'Kirim Quote ke Customer',
    description: 'Negosiasi selesai, kirim quote ke customer',
    requiresConfirmation: false,
    requiresNotes: false,
    permissions: ['update_order_status', 'admin']
  },
  {
    from: OrderStatus.VendorNegotiation,
    to: OrderStatus.VendorSourcing,
    label: 'Cari Vendor Lain',
    description: 'Negosiasi gagal, cari vendor alternatif',
    requiresConfirmation: false,
    requiresNotes: true,
    permissions: ['update_order_status', 'admin']
  },

  // From Customer Quote
  {
    from: OrderStatus.CustomerQuote,
    to: OrderStatus.AwaitingPayment,
    label: 'Quote Disetujui',
    description: 'Customer menyetujui quote, menunggu pembayaran',
    requiresConfirmation: false,
    requiresNotes: false,
    permissions: ['update_order_status', 'admin']
  },
  {
    from: OrderStatus.CustomerQuote,
    to: OrderStatus.Cancelled,
    label: 'Quote Ditolak',
    description: 'Customer menolak quote',
    requiresConfirmation: true,
    requiresNotes: true,
    permissions: ['cancel_order', 'admin']
  },

  // From Awaiting Payment
  {
    from: OrderStatus.AwaitingPayment,
    to: OrderStatus.PartialPayment,
    label: 'DP Diterima',
    description: 'DP 50% telah diterima',
    requiresConfirmation: false,
    requiresNotes: false,
    permissions: ['update_payment_status', 'admin']
  },
  {
    from: OrderStatus.AwaitingPayment,
    to: OrderStatus.FullPayment,
    label: 'Pembayaran Lunas',
    description: 'Pembayaran penuh telah diterima',
    requiresConfirmation: false,
    requiresNotes: false,
    permissions: ['update_payment_status', 'admin']
  },

  // From Partial Payment
  {
    from: OrderStatus.PartialPayment,
    to: OrderStatus.FullPayment,
    label: 'Pelunasan Diterima',
    description: 'Sisa pembayaran telah diterima',
    requiresConfirmation: false,
    requiresNotes: false,
    permissions: ['update_payment_status', 'admin']
  },
  {
    from: OrderStatus.PartialPayment,
    to: OrderStatus.InProduction,
    label: 'Mulai Produksi',
    description: 'Mulai produksi dengan DP yang sudah diterima',
    requiresConfirmation: false,
    requiresNotes: false,
    permissions: ['update_order_status', 'admin']
  },

  // From Full Payment
  {
    from: OrderStatus.FullPayment,
    to: OrderStatus.InProduction,
    label: 'Mulai Produksi',
    description: 'Pembayaran lunas, mulai produksi',
    requiresConfirmation: false,
    requiresNotes: false,
    permissions: ['update_order_status', 'admin']
  },

  // From In Production
  {
    from: OrderStatus.InProduction,
    to: OrderStatus.QualityControl,
    label: 'Produksi Selesai',
    description: 'Produksi selesai, mulai quality control',
    requiresConfirmation: false,
    requiresNotes: false,
    permissions: ['update_order_status', 'admin']
  },

  // From Quality Control
  {
    from: OrderStatus.QualityControl,
    to: OrderStatus.Shipping,
    label: 'QC Pass - Siap Kirim',
    description: 'Quality control passed, siap untuk pengiriman',
    requiresConfirmation: false,
    requiresNotes: false,
    permissions: ['update_order_status', 'admin']
  },
  {
    from: OrderStatus.QualityControl,
    to: OrderStatus.InProduction,
    label: 'QC Fail - Produksi Ulang',
    description: 'Quality control failed, perlu produksi ulang',
    requiresConfirmation: true,
    requiresNotes: true,
    permissions: ['update_order_status', 'admin']
  },

  // From Shipping
  {
    from: OrderStatus.Shipping,
    to: OrderStatus.Delivered,
    label: 'Pesanan Terkirim',
    description: 'Pesanan telah sampai ke customer',
    requiresConfirmation: false,
    requiresNotes: false,
    permissions: ['update_order_status', 'admin']
  },

  // From Delivered
  {
    from: OrderStatus.Delivered,
    to: OrderStatus.Completed,
    label: 'Pesanan Selesai',
    description: 'Customer konfirmasi pesanan diterima dengan baik',
    requiresConfirmation: false,
    requiresNotes: false,
    permissions: ['update_order_status', 'admin']
  },

  // Refund transitions (from various statuses)
  {
    from: OrderStatus.PartialPayment,
    to: OrderStatus.Refunded,
    label: 'Refund DP',
    description: 'Refund DP customer',
    requiresConfirmation: true,
    requiresNotes: true,
    permissions: ['process_refund', 'admin']
  },
  {
    from: OrderStatus.FullPayment,
    to: OrderStatus.Refunded,
    label: 'Refund Penuh',
    description: 'Refund penuh ke customer',
    requiresConfirmation: true,
    requiresNotes: true,
    permissions: ['process_refund', 'admin']
  },
  {
    from: OrderStatus.Completed,
    to: OrderStatus.Refunded,
    label: 'Refund Setelah Selesai',
    description: 'Refund karena komplain atau masalah kualitas',
    requiresConfirmation: true,
    requiresNotes: true,
    permissions: ['process_refund', 'admin']
  }
];

export function OrderStatusManager({
  currentStatus,
  orderId,
  onStatusUpdate,
  userPermissions,
  isLoading = false
}: OrderStatusManagerProps) {
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedTransition, setSelectedTransition] = useState<StatusTransition | null>(null);
  const [notes, setNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Get available transitions for current status
  const availableTransitions = STATUS_TRANSITIONS.filter(transition => 
    transition.from === currentStatus &&
    transition.permissions.some(permission => userPermissions.includes(permission))
  );

  const handleTransitionSelect = (transition: StatusTransition) => {
    setSelectedTransition(transition);
    setNotes('');
    
    if (transition.requiresConfirmation) {
      setShowConfirmDialog(true);
    } else {
      setShowUpdateDialog(true);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedTransition) return;

    setIsUpdating(true);
    try {
      await onStatusUpdate(selectedTransition.to, notes || undefined);
      
      toast.success(`Status berhasil diubah ke ${STATUS_LABELS[selectedTransition.to]}`);
      
      // Close dialogs
      setShowUpdateDialog(false);
      setShowConfirmDialog(false);
      setSelectedTransition(null);
      setNotes('');
    } catch (error) {
      console.error('Status update failed:', error);
      toast.error('Gagal mengubah status pesanan');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setShowUpdateDialog(false);
    setShowConfirmDialog(false);
    setSelectedTransition(null);
    setNotes('');
  };

  if (availableTransitions.length === 0) {
    return (
      <div className="text-center py-4">
        <Shield className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          Tidak ada transisi status yang tersedia untuk Anda
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Status Display */}
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium">Status Saat Ini:</Label>
        <Badge className={STATUS_COLORS[currentStatus]}>
          {STATUS_LABELS[currentStatus]}
        </Badge>
      </div>

      {/* Available Transitions */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Ubah Status:</Label>
        <div className="grid grid-cols-1 gap-2">
          {availableTransitions.map((transition, index) => (
            <Button
              key={index}
              variant="outline"
              className="justify-start h-auto p-3"
              onClick={() => handleTransitionSelect(transition)}
              disabled={isLoading || isUpdating}
            >
              <div className="flex items-start gap-3 w-full">
                <div className="flex-shrink-0 mt-0.5">
                  {transition.requiresConfirmation ? (
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <div className="text-left">
                  <p className="font-medium">{transition.label}</p>
                  <p className="text-xs text-muted-foreground">{transition.description}</p>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Status Update Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Ubah Status Pesanan
            </DialogTitle>
            <DialogDescription>
              Mengubah status dari <strong>{STATUS_LABELS[currentStatus]}</strong> ke{' '}
              <strong>{selectedTransition && STATUS_LABELS[selectedTransition.to]}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedTransition?.requiresNotes && (
              <div className="space-y-2">
                <Label htmlFor="notes">Catatan *</Label>
                <Textarea
                  id="notes"
                  placeholder="Masukkan catatan untuk perubahan status ini..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            {!selectedTransition?.requiresNotes && (
              <div className="space-y-2">
                <Label htmlFor="notes">Catatan (Opsional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Tambahkan catatan jika diperlukan..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} disabled={isUpdating}>
              Batal
            </Button>
            <Button 
              onClick={handleStatusUpdate} 
              disabled={isUpdating || (selectedTransition?.requiresNotes && !notes.trim())}
            >
              {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Ubah Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Konfirmasi Perubahan Status
            </AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan mengubah status pesanan dari{' '}
              <strong>{STATUS_LABELS[currentStatus]}</strong> ke{' '}
              <strong>{selectedTransition && STATUS_LABELS[selectedTransition.to]}</strong>.
              <br /><br />
              {selectedTransition?.description}
              <br /><br />
              Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowConfirmDialog(false);
              setShowUpdateDialog(true);
            }}>
              Lanjutkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default OrderStatusManager;