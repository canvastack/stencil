import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { RatingStars } from "@/components/ui/rating-stars";

interface ReviewFormProps {
  onSubmit: (review: { rating: number; comment: string }) => void;
  onCancel: () => void;
}

export function ReviewForm({ onSubmit, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ rating, comment });
    setRating(0);
    setComment("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        <label className="block text-sm font-medium mb-2">Ulasan Anda</label>
        <Textarea
          placeholder="Bagikan pengalaman Anda dengan produk ini..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="min-h-[100px]"
          required
        />
      </div>
    </form>
  );
}