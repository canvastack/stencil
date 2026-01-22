import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getProductDetailPath } from "@/utils/routes";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ScrollToTop } from "@/components/ScrollToTop";
import { useTheme } from '@/core/engine/ThemeContext';
import { ArrowLeft, ShoppingCart, MessageCircle, Star, Check, Package, Ruler, Palette, ZoomIn, X, Rotate3D, GitCompare, ArrowUpDown } from "lucide-react";
import { useProductComparison } from "@/contexts/ProductComparisonContext";
import { ComparisonBar } from "@/components/products/ComparisonBar";
import { Modal } from "@/components/ui/modal";
import { ReviewForm } from "@/features/reviews/components/ReviewForm";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { useProductReviews } from "@/hooks/useReviews.tsx";
import { usePublicProductBySlug } from "@/hooks/usePublicProducts";
import { usePublicTenant } from "@/contexts/PublicTenantContext";
import { useRelatedProducts } from "@/hooks/useRelatedProducts";
import { useProductOptions } from "@/hooks/useProductOptions";
import { resolveImageUrl, getProductImage, DEFAULT_PRODUCT_IMAGE } from '@/utils/imageUtils';
import { reviewService } from "@/services/api/reviews";
import { RatingStars } from "@/components/ui/rating-stars";
import { DynamicFormRenderer } from "@/components/public";

const ProductDetail = () => {
  const { currentTheme } = useTheme();
  const { Header, Footer } = currentTheme?.components ?? {};
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToCart } = useCart();
  const { addToCompare, isComparing, isMaxReached } = useProductComparison();
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [visibleReviewsCount, setVisibleReviewsCount] = useState(2);
  
  // Debug: Check if slug is extracted correctly
  console.log('ProductDetail: Extracted slug from URL:', slug);

  // Get tenant context safely
  let tenantSlug: string | null = null;
  try {
    const publicTenantContext = usePublicTenant();
    tenantSlug = publicTenantContext.tenantSlug;
  } catch (error) {
    console.log('ProductDetail: No tenant context available');
  }

  const handleSubmitReview = async (review: { rating: number; comment: string; userName?: string }) => {
    if (!product) return;
    
    setReviewLoading(true);
    try {
      await reviewService.createReview({
        productId: product.id,
        userName: review.userName || "Anonim",
        rating: review.rating,
        comment: review.comment,
        verified: true,
      });
      
      toast({
        title: "Ulasan Terkirim!",
        description: "Terima kasih telah memberikan ulasan Anda.",
      });
      
      setReviewModalOpen(false);
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Gagal Mengirim Ulasan",
        description: "Terjadi kesalahan saat mengirim ulasan. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setReviewLoading(false);
    }
  };
  const searchParams = new URLSearchParams(window.location.search);
  const isPreview = searchParams.get('preview') === 'true';
  
  const draftProduct = isPreview ? JSON.parse(sessionStorage.getItem('productDraft') || 'null') : null;
  
  // Always use public product service for better real data access
  console.log('ProductDetail: About to call usePublicProductBySlug with slug:', slug);
  const { product: cmsProduct, isLoading: loadingProduct } = usePublicProductBySlug(slug || '');
  
  const product = draftProduct || cmsProduct;
  
  // Fetch dynamic product options (Phase 1.6: Remove hardcoded data)
  const { data: productOptionsData, isLoading: loadingOptions } = useProductOptions(
    tenantSlug || undefined,
    product?.id
  );
  const productOptions = productOptionsData?.data;
  
  // Only use product-specific reviews to eliminate duplicate calls
  const { reviews: productReviews = [], loading: reviewsLoading } = useProductReviews(product?.id || '', tenantSlug || undefined);
  
  // Optimize related products fetch with targeted category
  const { relatedProducts } = useRelatedProducts({ 
    productId: product?.id, 
    category: product?.category,
    limit: 3 
  });
  const [reviewSort, setReviewSort] = useState<'rating-high' | 'rating-low' | 'newest' | 'oldest'>('newest');

  const sortedReviews = [...productReviews].sort((a, b) => {
    switch (reviewSort) {
      case 'rating-high':
        return b.rating - a.rating;
      case 'rating-low':
        return a.rating - b.rating;
      case 'newest':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'oldest':
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      default:
        return 0;
    }
  });

  const averageRating = productReviews.length 
    ? productReviews.reduce((acc, review) => acc + review.rating, 0) / productReviews.length 
    : 0;

  // Transform specifications from object to array format with proper value formatting
  const specifications = useMemo(() => {
    if (!product?.specifications) return [];
    
    if (Array.isArray(product.specifications)) {
      return product.specifications;
    }
    
    if (typeof product.specifications === 'object') {
      return Object.entries(product.specifications).map(([key, value]) => {
        let displayValue: string;
        
        if (typeof value === 'string' || typeof value === 'number') {
          displayValue = String(value);
        } else if (Array.isArray(value)) {
          displayValue = value.join(', ');
        } else if (typeof value === 'object' && value !== null) {
          const keyValuePairs = Object.entries(value).map(([k, v]) => {
            if (Array.isArray(v)) {
              return `${k}: ${v.join(', ')}`;
            }
            return `${k}: ${v}`;
          });
          displayValue = keyValuePairs.join(' | ');
        } else {
          displayValue = JSON.stringify(value);
        }
        
        return {
          key,
          value: displayValue
        };
      });
    }
    
    return [];
  }, [product?.specifications]);

  // Legacy form state removed - now using DynamicFormRenderer component
  // All order form logic moved to DynamicFormRenderer for dynamic form configuration support
  
  const [magnifiedImage, setMagnifiedImage] = useState<string | null>(null);
  const [view360, setView360] = useState<string | null>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  useEffect(() => {
    setVisibleReviewsCount(2);
  }, [reviewSort]);

  // Theme components loading guard
  if (!Header || !Footer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading theme components...</p>
        </div>
      </div>
    );
  }

  if (loadingProduct) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-foreground">Memuat produk...</h1>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">Produk Tidak Ditemukan</h1>
          <Button onClick={() => navigate(tenantSlug ? `/${tenantSlug}/products` : "/products")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Produk
          </Button>
        </div>
      </div>
    );
  }

  // Legacy form handlers removed - now using DynamicFormRenderer component
  // All order form logic moved to DynamicFormRenderer for dynamic form configuration support
  
  const handle360Start = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setDragStart({ x: clientX, y: clientY });
  };

  const handle360Move = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    
    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;
    
    setRotation(prev => ({
      x: prev.x + deltaY * 0.5,
      y: prev.y + deltaX * 0.5
    }));
    
    setDragStart({ x: clientX, y: clientY });
  };

  const handle360End = () => {
    setIsDragging(false);
  };

  const open360View = (image: string) => {
    setView360(image);
    setRotation({ x: 0, y: 0 });
  };

  const close360View = () => {
    setView360(null);
    setRotation({ x: 0, y: 0 });
    setIsDragging(false);
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: getProductImage(product.images, 0),
      type: product.category || 'default',
      size: product.minOrder || 1,
      material: product.material || 'default',
    });
  };

  // Related products now optimized with useRelatedProducts hook

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Just use the already sorted and filtered reviews from above

  return (
    <div className="min-h-screen bg-background">
      {isPreview && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground py-2 px-4 text-center">
          <p className="text-sm font-medium">Preview Mode - This is a draft preview of the product</p>
        </div>
      )}
      <Header />
      
      <section className={`${isPreview ? 'pt-40' : 'pt-32'} pb-12 px-4`}>
        <div className="container mx-auto max-w-7xl">
          {/* Breadcrumb Navigation */}
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Beranda</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={tenantSlug ? `/${tenantSlug}/products` : "/products"}>Produk</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{product.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <Button
            variant="ghost"
            onClick={() => navigate(tenantSlug ? `/${tenantSlug}/products` : "/products")}
            className="mb-6 hover:bg-accent/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Produk
          </Button>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Product Images Carousel */}
            <div className="space-y-6 lg:sticky lg:top-32 lg:self-start max-h-screen overflow-y-auto">
              <Card className="overflow-hidden border-border bg-card shadow-xl group">
                <Carousel className="w-full">
                  <CarouselContent>
                    {(product.images && product.images.length > 0 ? product.images : [DEFAULT_PRODUCT_IMAGE]).map((image, index) => {
                      const srcUrl = typeof image === 'string' ? resolveImageUrl(image, { preview: isPreview }) : image;
                      return (
                        <CarouselItem key={index}>
                          <div 
                            className="aspect-video relative overflow-hidden bg-muted cursor-zoom-in"
                            onClick={() => setMagnifiedImage(srcUrl)}
                          >
                            <img
                              src={srcUrl}
                              alt={`${product.name} ${index + 1}`}
                              className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (target.src !== DEFAULT_PRODUCT_IMAGE) {
                                  target.src = DEFAULT_PRODUCT_IMAGE;
                                }
                              }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                              <ZoomIn className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </div>
                          </div>
                        </CarouselItem>
                      );
                    })}
                  </CarouselContent>
                  <CarouselPrevious className="left-4" />
                  <CarouselNext className="right-4" />
                </Carousel>
              </Card>

              {/* View Button */}
              <Button
                onClick={() => product.images && product.images.length > 0 && open360View(resolveImageUrl(product.images[0], { preview: isPreview }))}
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold shadow-lg"
              >
                <Rotate3D className="w-5 h-5 mr-2" />
                Lihat 360°
              </Button>

              {/* Image Magnifier Dialog */}
              <Dialog open={!!magnifiedImage} onOpenChange={() => setMagnifiedImage(null)}>
                <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
                  <DialogHeader>
                    <DialogTitle className="sr-only">Gambar yang Diperbesar</DialogTitle>
                    <DialogDescription className="sr-only">Detail view dari produk {product.name}</DialogDescription>
                  </DialogHeader>
                  <DialogClose className="absolute right-4 top-4 z-50 rounded-full bg-white/10 p-2 hover:bg-white/20 transition-all">
                    <X className="w-6 h-6 text-white" />
                  </DialogClose>
                  {magnifiedImage && (
                    <div className="flex items-center justify-center w-full h-full p-8">
                      <img
                        src={magnifiedImage}
                        alt="Magnified view"
                        className="max-w-full max-h-[90vh] object-contain rounded-lg"
                      />
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              {/* 360 View Dialog */}
              <Dialog open={!!view360} onOpenChange={close360View}>
                <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
                  <DialogHeader>
                    <DialogTitle className="sr-only">Tampilan 360°</DialogTitle>
                    <DialogDescription className="sr-only">Lihat produk {product.name} dari berbagai sudut</DialogDescription>
                  </DialogHeader>
                  <DialogClose className="absolute right-4 top-4 z-50 rounded-full bg-white/10 p-2 hover:bg-white/20 transition-all">
                    <X className="w-6 h-6 text-white" />
                  </DialogClose>
                  {view360 && (
                    <div className="flex flex-col items-center justify-center w-full h-full p-8">
                      <div className="text-white text-center mb-4 bg-white/10 px-4 py-2 rounded-lg backdrop-blur">
                        <Rotate3D className="w-5 h-5 inline mr-2" />
                        <span className="text-sm">Drag untuk memutar gambar ke segala arah</span>
                      </div>
                      <div 
                        className="relative cursor-grab active:cursor-grabbing"
                        style={{ perspective: "1000px" }}
                        onMouseDown={(e) => handle360Start(e.clientX, e.clientY)}
                        onMouseMove={(e) => handle360Move(e.clientX, e.clientY)}
                        onMouseUp={handle360End}
                        onMouseLeave={handle360End}
                        onTouchStart={(e) => handle360Start(e.touches[0].clientX, e.touches[0].clientY)}
                        onTouchMove={(e) => handle360Move(e.touches[0].clientX, e.touches[0].clientY)}
                        onTouchEnd={handle360End}
                      >
                        <img
                          src={view360}
                          alt="360 view"
                          className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
                          style={{
                            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
                            transformStyle: "preserve-3d",
                            transition: isDragging ? "none" : "transform 0.3s ease-out",
                          }}
                          draggable={false}
                        />
                      </div>
                      <div className="text-white/70 text-xs mt-4 text-center">
                        <p>Rotasi X: {Math.round(rotation.x)}° | Rotasi Y: {Math.round(rotation.y)}°</p>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              {/* Product Info Cards */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 text-center border-border bg-card/50 backdrop-blur hover:bg-card transition-all">
                  <Package className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-xs text-muted-foreground">Min. Order</p>
                  <p className="text-sm font-bold text-foreground">{product.minOrder} {product.priceUnit}</p>
                </Card>
                <Card className="p-4 text-center border-border bg-card/50 backdrop-blur hover:bg-card transition-all">
                  <Ruler className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-xs text-muted-foreground">Material</p>
                  <p className="text-sm font-bold text-foreground">{product.material}</p>
                </Card>
                <Card className="p-4 text-center border-border bg-card/50 backdrop-blur hover:bg-card transition-all">
                  <Palette className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-xs text-muted-foreground">Lead Time</p>
                  <p className="text-sm font-bold text-foreground">{product.leadTime}</p>
                </Card>
              </div>
            </div>

            {/* Product Details & Order Form */}
            <div className="space-y-6">
              <div>
                <RatingStars rating={averageRating} size="md" className="mb-3" />

                <h1 className="text-4xl font-bold text-foreground mb-4">{product.name}</h1>
                {product.price !== null && product.price !== undefined && Number(product.price) > 0 && (
                  <p className="text-2xl font-bold text-primary mb-4">{formatPrice(product.price, product.currency)}</p>
                )}
                <p className="text-muted-foreground leading-relaxed mb-6">{product.description}</p>

                <div className="space-y-3 mb-6">
                  <h3 className="text-lg font-bold text-foreground">Spesifikasi:</h3>
                  {specifications.map((spec, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground"><strong>{spec.key}:</strong> {spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Order Form */}
              {console.log('[ProductDetail] Rendering DynamicFormRenderer with product:', product)}
              {console.log('[ProductDetail] Product UUID being passed:', product.uuid)}
              {console.log('[ProductDetail] Product Name:', product.name)}
              <DynamicFormRenderer
                productUuid={product.uuid}
                productName={product.name}
                whatsappNumber="62812345678"
                onSubmitSuccess={async (result) => {
                  toast({
                    title: "Pesanan Berhasil Dibuat!",
                    description: `Nomor Pesanan: ${result.order_number}. Tim kami akan segera menghubungi Anda untuk konfirmasi.`,
                  });
                  console.log('[ProductDetail] Order created:', result);
                }}
                onWhatsApp={(formData) => {
                  const message = `Halo, saya tertarik dengan produk *${product.name}*\n\n` +
                    Object.entries(formData)
                      .filter(([key]) => !key.startsWith('_'))
                      .map(([key, value]) => `${key}: ${value}`)
                      .join('\n');
                  const whatsappUrl = `https://wa.me/62812345678?text=${encodeURIComponent(message)}`;
                  window.open(whatsappUrl, "_blank");
                }}
                showCard={true}
              />

              {/* Compare Button */}
              <div className="mt-6">
                <Button
                  variant={isComparing(product.id) ? "secondary" : "outline"}
                  className="w-full"
                  onClick={() => {
                    if (product) {
                      addToCompare(product);
                    }
                  }}
                  disabled={!isComparing(product.id) && isMaxReached}
                >
                  <GitCompare className="w-5 h-5 mr-2" />
                  {isComparing(product.id) ? 'Ditambahkan ke Perbandingan' : 'Bandingkan Produk'}
                </Button>
              </div>
            </div>
          </div>

          {/* Reviews and Related Products Section */}
          <div className="mt-16 grid lg:grid-cols-3 gap-8">
            {/* Customer Reviews - Left Column (2/3) */}
            <div className="lg:col-span-2">
              <Card className="p-8 border-border bg-card shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold text-foreground">Ulasan Pelanggan</h2>
                  
                  {/* Sort Dropdown */}
                  <Select value={reviewSort} onValueChange={(value) => setReviewSort(value as 'rating-high' | 'rating-low' | 'newest' | 'oldest')}>
                    <SelectTrigger className="w-[180px] bg-background border-border">
                      <ArrowUpDown className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Urutkan" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="rating-high">Rating Tertinggi</SelectItem>
                      <SelectItem value="rating-low">Rating Terendah</SelectItem>
                      <SelectItem value="newest">Terbaru</SelectItem>
                      <SelectItem value="oldest">Terlama</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {reviewsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Memuat ulasan...</p>
                  </div>
                ) : sortedReviews.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Belum ada ulasan untuk produk ini</p>
                    <Button
                      onClick={() => setReviewModalOpen(true)}
                      className="mt-4 bg-primary hover:bg-primary/90"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Tulis Ulasan Pertama
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {sortedReviews.slice(0, visibleReviewsCount).map((review, index) => (
                      <div
                        key={index}
                        className="p-6 border border-border rounded-lg bg-card/50 backdrop-blur hover:bg-card transition-all"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-foreground">{review.userName}</h4>
                            <RatingStars rating={review.rating} size="sm" className="mt-1" />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(review.date).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">{review.comment}</p>
                      </div>
                    ))}
                    
                    {visibleReviewsCount < sortedReviews.length && (
                      <div className="flex justify-center pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setVisibleReviewsCount(prev => prev + 2)}
                          className="border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                        >
                          Muat Lebih Banyak ({sortedReviews.length - visibleReviewsCount} ulasan lagi)
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                <Button
                  onClick={() => setReviewModalOpen(true)}
                  className="w-full mt-6 bg-primary hover:bg-primary/90"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Tulis Ulasan
                </Button>
              </Card>
            </div>

            {/* Related Products - Right Column (1/3) */}
            <div className="lg:col-span-1">
              <Card className="p-6 border-border bg-card shadow-xl sticky top-32">
                <h3 className="text-2xl font-bold text-foreground mb-6">Produk Terkait</h3>
                {relatedProducts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Tidak ada produk terkait
                  </p>
                ) : (
                  <div className="space-y-4">
                    {relatedProducts.slice(0, 3).map((relatedProduct) => (
                      <Link
                        key={relatedProduct.id}
                        to={getProductDetailPath(relatedProduct.slug, false, tenantSlug || undefined)}
                        className="block group"
                      >
                        <Card className="overflow-hidden border-border bg-card/50 backdrop-blur hover:bg-card hover:shadow-lg transition-all">
                          <div className="aspect-video relative overflow-hidden bg-muted">
                            <img
                              src={resolveImageUrl(getProductImage(relatedProduct.images, 0))}
                              alt={relatedProduct.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (target.src !== DEFAULT_PRODUCT_IMAGE) {
                                  target.src = DEFAULT_PRODUCT_IMAGE;
                                }
                              }}
                            />
                          </div>
                          <div className="p-4">
                            <h4 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                              {relatedProduct.name}
                            </h4>
                            {relatedProduct.price && relatedProduct.price > 0 && (
                              <p className="text-primary font-bold">
                                {formatPrice(relatedProduct.price, relatedProduct.currency || 'IDR')}
                              </p>
                            )}
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </section>

      <ComparisonBar />
      <Footer />
      <ScrollToTop />

      <Modal
        open={reviewModalOpen}
        onOpenChange={setReviewModalOpen}
        title="Tulis Ulasan"
        hideFooter
      >
        <ReviewForm
          onSubmit={handleSubmitReview}
          onCancel={() => setReviewModalOpen(false)}
          isLoading={reviewLoading}
        />
      </Modal>
    </div>
  );
};

export default ProductDetail;