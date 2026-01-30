import { CheckCircle2, Circle, Clock, XCircle } from 'lucide-react';
import { OrderStatus } from '@/types/order';
import { cn } from '@/lib/utils';

// ✅ PT CEX Business Workflow - Aligned with Backend OrderStatus Enum
const STATUS_STEPS = [
  { status: OrderStatus.New, label: 'New Order', description: 'Pesanan baru diterima' },
  { status: OrderStatus.Draft, label: 'Draft', description: 'Menunggu review admin' },
  { status: OrderStatus.Pending, label: 'Pending', description: 'Siap diproses' },
  { status: OrderStatus.VendorSourcing, label: 'Vendor Sourcing', description: 'Mencari vendor' },
  { status: OrderStatus.VendorNegotiation, label: 'Negosiasi', description: 'Negosiasi harga' },
  { status: OrderStatus.CustomerQuote, label: 'Quotation', description: 'Quote dikirim ke customer' },
  { status: OrderStatus.AwaitingPayment, label: 'Menunggu Pembayaran', description: 'Menunggu payment' },
  { status: OrderStatus.PartialPayment, label: 'DP Dibayar', description: 'DP 50% diterima' },
  { status: OrderStatus.FullPayment, label: 'Lunas', description: '100% payment diterima' },
  { status: OrderStatus.InProduction, label: 'Produksi', description: 'Dalam produksi' },
  { status: OrderStatus.QualityControl, label: 'Quality Check', description: 'Pemeriksaan kualitas' },
  { status: OrderStatus.Shipping, label: 'Pengiriman', description: 'Dalam pengiriman' },
  { status: OrderStatus.Completed, label: 'Selesai', description: 'Pesanan selesai' },
];

interface OrderStatusStepperProps {
  currentStatus: OrderStatus;
  className?: string;
}

export function OrderStatusStepper({ currentStatus, className }: OrderStatusStepperProps) {
  const currentIndex = STATUS_STEPS.findIndex(step => step.status === currentStatus);

  const getStepIcon = (index: number) => {
    if (currentStatus === OrderStatus.Cancelled || currentStatus === OrderStatus.Refunded) {
      if (index === currentIndex) {
        return <XCircle className="w-5 h-5 text-destructive" />;
      }
      if (index < currentIndex) {
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      }
      return <Circle className="w-5 h-5 text-muted-foreground" />;
    }

    if (index < currentIndex) {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    } else if (index === currentIndex) {
      return <Clock className="w-5 h-5 text-primary animate-pulse" />;
    } else {
      return <Circle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  if (currentStatus === OrderStatus.Cancelled || currentStatus === OrderStatus.Refunded) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center gap-3 p-4 rounded-lg border border-destructive/50 bg-destructive/5">
          <XCircle className="w-6 h-6 text-destructive" />
          <div>
            <p className="text-sm font-medium text-destructive">
              {currentStatus === OrderStatus.Cancelled ? 'Pesanan Dibatalkan' : 'Pesanan Dikembalikan'}
            </p>
            <p className="text-xs text-muted-foreground">
              {currentStatus === OrderStatus.Cancelled 
                ? 'Pesanan telah dibatalkan dan tidak akan diproses' 
                : 'Pembayaran telah dikembalikan ke customer'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {STATUS_STEPS.map((step, index) => (
        <div
          key={step.status}
          className={cn(
            "flex items-start gap-3 relative",
            index < STATUS_STEPS.length - 1 && "pb-2"
          )}
        >
          {index < STATUS_STEPS.length - 1 && (
            <div
              className={cn(
                "absolute left-2.5 top-7 bottom-0 w-0.5",
                index < currentIndex ? "bg-green-500" : "bg-border"
              )}
            />
          )}

          <div className="relative z-10 flex-shrink-0 mt-0.5">
            {getStepIcon(index)}
          </div>

          <div className="flex-1 min-w-0">
            <p className={cn(
              "text-sm font-medium leading-none mb-1",
              index <= currentIndex ? "text-foreground" : "text-muted-foreground"
            )}>
              {step.label}
            </p>
            <p className="text-xs text-muted-foreground leading-tight">
              {step.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
