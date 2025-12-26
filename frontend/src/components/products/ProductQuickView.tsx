import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types/product";
import { resolveImageUrl, getProductImage, DEFAULT_PRODUCT_IMAGE } from "@/utils/imageUtils";
import { RatingStars } from "@/components/ui/rating-stars";
import { Package, Clock, ShoppingCart, GitCompare, Wand2, Award } from "lucide-react";
import { useState } from "react";

interface ProductQuickViewProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onViewDetails: (slug: string) => void;
  onCompare?: (product: Product) => void;
  formatPrice: (price: number, currency: string) => string;
}

export const ProductQuickView = ({
  product,
  open,
  onClose,
  onViewDetails,
  onCompare,
  formatPrice,
}: ProductQuickViewProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!product) return null;

  const productExtended = product as any;
  const images = (product.images && product.images.length > 0) ? product.images : [DEFAULT_PRODUCT_IMAGE];
  const currentImage = images[currentImageIndex] || DEFAULT_PRODUCT_IMAGE;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Quick View</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 mt-4">
          {/* Image Section */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square overflow-hidden rounded-lg bg-muted border border-border">
              <img
                src={resolveImageUrl(currentImage)}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== DEFAULT_PRODUCT_IMAGE) {
                    target.src = DEFAULT_PRODUCT_IMAGE;
                  }
                }}
              />

              {/* Featured Badge */}
              {productExtended.featured && (
                <Badge variant="default" className="absolute top-3 right-3 bg-primary text-primary-foreground shadow-lg">
                  <Award className="w-3 h-3 mr-1" />
                  Featured
                </Badge>
              )}
            </div>

            {/* Image Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all ${
                      idx === currentImageIndex
                        ? "border-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <img
                      src={resolveImageUrl(img)}
                      alt={`${product.name} - ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src !== DEFAULT_PRODUCT_IMAGE) {
                          target.src = DEFAULT_PRODUCT_IMAGE;
                        }
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info Section */}
          <div className="space-y-4">
            {/* Product Name & Rating */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">{product.name}</h2>
              <RatingStars
                rating={productExtended.reviewSummary?.averageRating || 0}
                size="sm"
                showCount
                count={productExtended.reviewSummary?.totalReviews || 0}
              />
            </div>

            {/* Price */}
            <div className="text-3xl font-bold text-primary">
              {formatPrice(product.price, product.currency)}
            </div>

            {/* Product Badges */}
            <div className="flex flex-wrap gap-2">
              {/* Stock Status */}
              {productExtended.stock?.status && (
                <Badge
                  variant={
                    productExtended.stock.status === "in_stock"
                      ? "default"
                      : productExtended.stock.status === "low_stock"
                      ? "secondary"
                      : "destructive"
                  }
                  className="text-xs"
                >
                  {productExtended.stock.status === "in_stock"
                    ? "Tersedia"
                    : productExtended.stock.status === "low_stock"
                    ? "Stok Terbatas"
                    : "Habis"}
                </Badge>
              )}

              {/* Material */}
              {productExtended.material && (
                <Badge variant="outline" className="text-xs">
                  {productExtended.material}
                </Badge>
              )}

              {/* Customizable */}
              {productExtended.customizable && (
                <Badge variant="secondary" className="text-xs">
                  <Wand2 className="w-3 h-3 mr-1" />
                  Customizable
                </Badge>
              )}
            </div>

            {/* Description */}
            <p className="text-muted-foreground leading-relaxed line-clamp-4">
              {product.description}
            </p>

            {/* Key Specifications */}
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg border border-border">
              <h3 className="font-semibold text-sm text-foreground">Key Specifications</h3>

              {/* Material */}
              {productExtended.material && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Material:</span>
                  <span className="font-medium text-foreground">{productExtended.material}</span>
                </div>
              )}

              {/* Lead Time */}
              {productExtended.lead_time && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Lead Time:
                  </span>
                  <span className="font-medium text-foreground">{productExtended.lead_time}</span>
                </div>
              )}

              {/* Min Order Quantity */}
              {productExtended.min_order_quantity && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Package className="w-4 h-4" />
                    Min Order:
                  </span>
                  <span className="font-medium text-foreground">
                    {productExtended.min_order_quantity} pcs
                  </span>
                </div>
              )}

              {/* Size */}
              {productExtended.size && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Size:</span>
                  <span className="font-medium text-foreground">{productExtended.size}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-4">
              <Button
                onClick={() => {
                  onViewDetails(product.slug);
                  onClose();
                }}
                className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-semibold shadow-lg"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                View Full Details & Order
              </Button>

              {onCompare && (
                <Button
                  variant="outline"
                  onClick={() => {
                    onCompare(product);
                    onClose();
                  }}
                  className="w-full border-primary text-primary hover:bg-primary/10"
                >
                  <GitCompare className="w-4 h-4 mr-2" />
                  Add to Compare
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
