import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RatingStars } from "@/components/ui/rating-stars";
import { Button } from "@/components/ui/button";

interface ReviewFormProps {
  onSubmit: (review: { rating: number; comment: string; userName?: string }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ReviewForm({ onSubmit, onCancel, isLoading = false }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [userName, setUserName] = useState("");

  const isFormValid = rating > 0 && comment.trim().length >= 10;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    onSubmit({ 
      rating, 
      comment: comment.trim(),
      userName: userName.trim() || undefined
    });
    setRating(0);
    setComment("");
    setUserName("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Nama <span className="text-muted-foreground text-xs">(Opsional)</span>
        </label>
        <Input
          type="text"
          placeholder="Nama Anda (kosongkan untuk anonim)"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Rating</label>
        <RatingStars 
          rating={rating} 
          size="lg" 
          interactive={true} 
          onRatingChange={setRating}
          showValue={false}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Ulasan Anda <span className="text-xs text-muted-foreground">(Minimal 10 karakter)</span>
        </label>
        <Textarea
          placeholder="Bagikan pengalaman Anda dengan produk ini..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="min-h-[100px]"
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {comment.length}/10 karakter
        </p>
      </div>

      <div className="flex gap-2 justify-end mt-6">
        <Button 
          type="button"
          variant="outline" 
          onClick={onCancel}
          disabled={isLoading}
          className="bg-background/50 hover:bg-background/70 border-border/50"
        >
          Batal
        </Button>
        <Button 
          type="submit"
          disabled={!isFormValid || isLoading}
          className={`relative ${!isFormValid || isLoading ? 'opacity-50 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'}`}
        >
          {isLoading ? (
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
  );
}