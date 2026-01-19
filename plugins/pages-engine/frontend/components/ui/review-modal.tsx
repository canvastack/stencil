import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";

interface ReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (review: { rating: number; comment: string }) => void;
}

export function ReviewModal({ open, onOpenChange, onSubmit }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ rating, comment });
    setRating(0);
    setComment("");
    onOpenChange(false);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmitWithValidation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) {
      setValidationError('Mohon berikan rating untuk produk ini');
      return;
    }
    if (!comment.trim()) {
      setValidationError('Mohon tulis ulasan Anda');
      return;
    }

    try {
      setIsSubmitting(true);
      setValidationError('');
      await onSubmit({ rating, comment });
      setSubmitSuccess(true);
      
      // Reset form dan tutup modal setelah 1.5 detik
      setTimeout(() => {
        setRating(0);
        setComment("");
        onOpenChange(false);
        setSubmitSuccess(false);
      }, 1500);
    } catch (error) {
      setValidationError('Terjadi kesalahan saat mengirim ulasan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Tulis Ulasan"
      isSubmitting={isSubmitting}
      validationError={validationError}
      submitSuccess={submitSuccess}
      hideFooter
    >
      <form onSubmit={handleSubmitWithValidation} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= (hoveredRating || rating)
                          ? "fill-primary text-primary"
                          : "text-muted"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Ulasan Anda</label>
              <Textarea
                placeholder="Bagikan pengalaman Anda dengan produk ini..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[100px]"
                required
              />
            </div>

            <div className="flex gap-2 justify-end mt-6">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="bg-background/50 hover:bg-background/70 border-border/50"
              >
                Batal
              </Button>
              <Button 
                type="submit"
                disabled={!rating || !comment || isSubmitting}
                className={`${isSubmitting ? 'opacity-50' : 'bg-primary hover:bg-primary/90'}`}
              >
                {isSubmitting ? (
                  <>
                    <span className="opacity-0">Kirim Ulasan</span>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    </div>
                  </>
                ) : 'Kirim Ulasan'}
              </Button>
            </div>
          </form>
      </Modal>
  );
}