import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { ArrowLeft, ShoppingCart, MessageCircle, Star, Check, Package, Ruler, Palette, ZoomIn, X, Rotate3D, Plus, Trash2, ArrowUpDown, GitCompare } from "lucide-react";
import { ColorPicker } from "@/components/ui/color-picker";
import { useProductComparison } from "@/contexts/ProductComparisonContext";
import { ComparisonBar } from "@/components/products/ComparisonBar";
import { WysiwygEditor } from '@/components/ui/wysiwyg-editor';
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
import { ordersService } from "@/services/api/orders";
import { customersService } from "@/services/api/customers";
import { RatingStars } from "@/components/ui/rating-stars";

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

  const handleSubmitReview = async (review: { rating: number; comment: string }) => {
    if (!product) return;
    
    setReviewLoading(true);
    try {
      await reviewService.createReview({
        productId: product.id,
        userName: formData.name || "Anonymous",
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

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    quantity: "1",
    productType: "",
    size: "",
    material: "",
    bahan: "",
    kualitas: "",
    ketebalan: "",
    warna: "",
    designFile: null as File | null,
    customTexts: [{ text: "", placement: "depan", position: "atas", color: "#000000" }] as Array<{ text: string; placement: string; position: string; color: string }>,
    notes: "",
  });

  const [designFilePreview, setDesignFilePreview] = useState<string | null>(null);
  const [designFileZoom, setDesignFileZoom] = useState<string | null>(null);

  const [magnifiedImage, setMagnifiedImage] = useState<string | null>(null);
  const [view360, setView360] = useState<string | null>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, designFile: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setDesignFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeDesignFile = () => {
    setFormData(prev => ({ ...prev, designFile: null }));
    setDesignFilePreview(null);
  };

  const addCustomText = () => {
    setFormData(prev => ({ 
      ...prev, 
      customTexts: [...prev.customTexts, { text: "", placement: "depan", position: "atas", color: "#000000" }] 
    }));
  };

  const removeCustomText = (index: number) => {
    const newCustomTexts = formData.customTexts.filter((_, i) => i !== index);
    setFormData(prev => ({ 
      ...prev, 
      customTexts: newCustomTexts.length > 0 ? newCustomTexts : [{ text: "", placement: "depan", position: "atas", color: "#000000" }]
    }));
  };

  const handleCustomTextChange = (index: number, field: 'text' | 'placement' | 'position' | 'color', value: string) => {
    setFormData(prev => {
      const newCustomTexts = [...prev.customTexts];
      newCustomTexts[index] = {
        ...newCustomTexts[index],
        [field]: value
      };
      return { ...prev, customTexts: newCustomTexts };
    });
  };

  const predefinedColors = [
    { name: "Hitam", hex: "#000000" },
    { name: "Putih", hex: "#FFFFFF" },
    { name: "Merah", hex: "#DC2626" },
    { name: "Biru", hex: "#2563EB" },
    { name: "Hijau", hex: "#16A34A" },
    { name: "Kuning", hex: "#EAB308" },
    { name: "Oranje", hex: "#EA580C" },
    { name: "Ungu", hex: "#9333EA" },
    { name: "Pink", hex: "#EC4899" },
    { name: "Abu-abu", hex: "#6B7280" },
    { name: "Coklat", hex: "#92400E" },
    { name: "Silver", hex: "#C0C0C0" },
    { name: "Emas", hex: "#FFD700" },
    { name: "Tembaga", hex: "#B87333" },
  ];

  const handleOrder = async () => {
    if (!formData.name || !formData.phone || !formData.quantity || !formData.bahan || !formData.kualitas || !formData.warna || !formData.notes) {
      toast({
        title: "Form Belum Lengkap",
        description: "Mohon lengkapi semua field yang wajib diisi (Nama, Telepon, Jumlah, Bahan, Kualitas, Warna, dan Catatan Tambahan).",
        variant: "destructive",
      });
      return;
    }

    if (!product) return;

    setOrderLoading(true);
    try {
      let customerId: string | null = null;
      
      try {
        const customers = await customersService.getCustomers({
          search: formData.email || formData.phone,
          per_page: 1,
        });
        if (customers.data && customers.data.length > 0) {
          customerId = customers.data[0].id;
        }
      } catch (error) {
        console.log('Error searching for customer, will create new one:', error);
      }

      if (!customerId) {
        const newCustomer = await customersService.createCustomer({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          type: 'individual',
        });
        customerId = newCustomer.id;
      }

      const quantity = parseInt(formData.quantity) || 1;
      await ordersService.createOrder({
        customer_id: customerId,
        items: [
          {
            product_id: product.id,
            quantity,
            price: product.price,
          },
        ],
        notes: `Bahan: ${formData.bahan}, Kualitas: ${formData.kualitas}, Warna: ${formData.warna}, Catatan: ${formData.notes}`,
      });

      toast({
        title: "Pesanan Diterima!",
        description: "Tim kami akan segera menghubungi Anda untuk konfirmasi.",
      });

      setFormData({
        name: "",
        email: "",
        phone: "",
        quantity: "1",
        productType: "",
        size: "",
        material: "",
        bahan: "",
        kualitas: "",
        ketebalan: "",
        warna: "",
        designFile: null,
        customTexts: [{ text: "", placement: "depan", position: "atas", color: "#000000" }],
        notes: "",
      });
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Gagal Membuat Pesanan",
        description: "Terjadi kesalahan saat membuat pesanan. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setOrderLoading(false);
    }
  };

  const handleWhatsApp = () => {
    const message = `Halo, saya tertarik dengan produk *${product.name}*\n\nNama: ${formData.name}\nTelepon: ${formData.phone}\nJumlah: ${formData.quantity}\nCatatan: ${formData.notes || "-"}`;
    const whatsappUrl = `https://wa.me/62812345678?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

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
      type: formData.productType,
      size: formData.size,
      material: formData.bahan,
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
                  <Link to="/products">Produk</Link>
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
            onClick={() => navigate("/products")}
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
                <p className="text-2xl font-bold text-primary mb-4">{formatPrice(product.price, product.currency)}</p>
                <p className="text-muted-foreground leading-relaxed mb-6">{product.description}</p>

                <div className="space-y-3 mb-6">
                  <h3 className="text-lg font-bold text-foreground">Spesifikasi:</h3>
                  {product.specifications.map((spec, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground"><strong>{spec.key}:</strong> {spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Form */}
              <Card className="p-6 border-border bg-card shadow-xl">
                <h3 className="text-xl font-bold text-foreground mb-6">Form Pemesanan</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-foreground">Nama Lengkap *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Masukkan nama lengkap"
                      className="bg-background border-border"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-foreground">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="email@example.com"
                      className="bg-background border-border"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-foreground">No. Telepon *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="08xxxxxxxxxx"
                      className="bg-background border-border"
                    />
                  </div>

                  <div>
                    <Label htmlFor="quantity" className="text-foreground">Jumlah Pesanan *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange("quantity", e.target.value)}
                      className="bg-background border-border"
                    />
                  </div>

                  <div>
                    <Label htmlFor="productType" className="text-foreground">Tipe Produk *</Label>
                    <Input 
                      value={product?.type_display || product?.business_type || 'N/A'} 
                      disabled 
                      className="bg-muted border-border"
                    />
                  </div>

                  <div>
                    <Label htmlFor="size" className="text-foreground">Ukuran *</Label>
                    <Select value={formData.size} onValueChange={(value) => handleInputChange("size", value)}>
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue placeholder="Pilih ukuran" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {loadingOptions ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : productOptions?.sizes && Object.keys(productOptions.sizes).length > 0 ? (
                          Object.entries(productOptions.sizes).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))
                        ) : (
                          <SelectItem value="custom">Custom Size</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="bahan" className="text-foreground">Bahan *</Label>
                    <Select value={formData.bahan} onValueChange={(value) => handleInputChange("bahan", value)}>
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue placeholder="Pilih bahan" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {loadingOptions ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : productOptions?.materials && productOptions.materials.length > 0 ? (
                          productOptions.materials.map((material) => (
                            <SelectItem key={material} value={material.toLowerCase().replace(/\s+/g, '-')}>
                              {material}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="general">General</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="kualitas" className="text-foreground">Kualitas *</Label>
                    <Select value={formData.kualitas} onValueChange={(value) => handleInputChange("kualitas", value)}>
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue placeholder="Pilih kualitas" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {loadingOptions ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : productOptions?.quality_levels && productOptions.quality_levels.length > 0 ? (
                          productOptions.quality_levels.map((quality) => (
                            <SelectItem key={quality} value={quality.toLowerCase()}>
                              {quality.charAt(0).toUpperCase() + quality.slice(1)}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="standard">Standard</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="ketebalan" className="text-foreground">Ketebalan</Label>
                    <Input
                      id="ketebalan"
                      value={formData.ketebalan}
                      onChange={(e) => handleInputChange("ketebalan", e.target.value)}
                      placeholder="Contoh: 2mm, 3mm, dll"
                      className="bg-background border-border"
                    />
                  </div>

                  <ColorPicker
                    value={formData.warna}
                    onChange={(color) => handleInputChange("warna", color)}
                    label="Warna"
                    showPresets={true}
                    required={true}
                  />

                  <div>
                    <Label htmlFor="designFile" className="text-foreground">File Upload Design (Opsional)</Label>
                    <div className="space-y-3">
                      <Input
                        id="designFile"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="bg-background border-border"
                      />
                      {designFilePreview && (
                        <div className="relative group">
                          <div 
                            className="relative w-full h-48 border-2 border-border rounded-lg overflow-hidden cursor-zoom-in"
                            onClick={() => setDesignFileZoom(designFilePreview)}
                          >
                            <img
                              src={designFilePreview}
                              alt="Preview design"
                              className="w-full h-full object-contain bg-muted"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                              <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={removeDesignFile}
                            className="absolute top-2 right-2"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Design File Zoom Dialog */}
                  <Dialog open={!!designFileZoom} onOpenChange={() => setDesignFileZoom(null)}>
                    <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
                      <DialogHeader>
                        <DialogTitle className="sr-only">File Design yang Diperbesar</DialogTitle>
                        <DialogDescription className="sr-only">Tampilan lebih detail dari file design yang diupload</DialogDescription>
                      </DialogHeader>
                      <DialogClose className="absolute right-4 top-4 z-50 rounded-full bg-white/10 p-2 hover:bg-white/20 transition-all">
                        <X className="w-6 h-6 text-white" />
                      </DialogClose>
                      {designFileZoom && (
                        <div className="flex items-center justify-center w-full h-full p-8">
                          <img
                            src={designFileZoom}
                            alt="Zoomed design"
                            className="max-w-full max-h-[90vh] object-contain rounded-lg"
                          />
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-foreground">
                        Teks Custom (Opsional)
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addCustomText}
                        className="h-8 gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Tambah
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {formData.customTexts.map((customText, index) => (
                        <div key={index} className="p-3 border border-border rounded-lg space-y-2 bg-muted/30">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-muted-foreground">
                              Teks Custom #{index + 1}
                            </span>
                            {formData.customTexts.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeCustomText(index)}
                                className="h-6 w-6"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          
                          <Input
                            type="text"
                            value={customText.text}
                            onChange={(e) => handleCustomTextChange(index, 'text', e.target.value)}
                            placeholder="Masukkan teks custom"
                            className="w-full bg-background border-border"
                          />
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Letak Teks</Label>
                              <select
                                value={customText.placement}
                                onChange={(e) => handleCustomTextChange(index, 'placement', e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <option value="depan">Depan</option>
                                <option value="belakang">Belakang</option>
                              </select>
                            </div>
                            
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Posisi Teks</Label>
                              <select
                                value={customText.position}
                                onChange={(e) => handleCustomTextChange(index, 'position', e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <option value="atas">Atas</option>
                                <option value="bawah">Bawah</option>
                                <option value="kiri">Kiri</option>
                                <option value="kanan">Kanan</option>
                                <option value="tengah">Tengah</option>
                              </select>
                            </div>
                          </div>
                          
                          <ColorPicker
                            value={customText.color}
                            onChange={(color) => handleCustomTextChange(index, 'color', color)}
                            label="Warna Teks"
                            showPresets={true}
                            required={false}
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tambahkan teks custom dengan letak dan posisi yang diinginkan pada produk etching
                    </p>
                  </div>

                  <WysiwygEditor
                    value={formData.notes}
                    onChange={(content) => handleInputChange("notes", content)}
                    label="Catatan Tambahan"
                    placeholder="Catatan khusus untuk pesanan Anda..."
                    height={400}
                    required={true}
                  />

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      onClick={handleAddToCart}
                      className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold shadow-lg px-6"
                    >
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Tambah ke Keranjang
                    </Button>
                    <Button
                      onClick={handleOrder}
                      disabled={orderLoading}
                      className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {orderLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2 inline-block"></div>
                          Memproses...
                        </>
                      ) : (
                        "Pesan Sekarang"
                      )}
                    </Button>
                    <Button
                      onClick={handleWhatsApp}
                      variant="outline"
                      className="flex-1 border-primary text-primary hover:bg-primary/10 font-semibold"
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Chat WhatsApp
                    </Button>
                  </div>

                  {/* Compare Button */}
                  <div className="mt-4">
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
              </Card>
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
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="newest">Terbaru</SelectItem>
                      <SelectItem value="oldest">Terlama</SelectItem>
                      <SelectItem value="rating-high">Rating Tertinggi</SelectItem>
                      <SelectItem value="rating-low">Rating Terendah</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Rating Summary */}
                <div className="flex flex-col md:flex-row gap-8 mb-8 pb-8 border-b border-border">
                  <div className="text-center md:text-left">
                    <div className="text-6xl font-bold text-primary mb-2">{averageRating.toFixed(1)}</div>
                    <RatingStars rating={averageRating} size="md" showValue={false} className="justify-center md:justify-start mb-2" />
                    <p className="text-sm text-muted-foreground">Berdasarkan {sortedReviews.length} ulasan</p>
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <Button
                      onClick={() => setReviewModalOpen(true)}
                      className="w-full mb-4 bg-primary hover:bg-primary/90"
                    >
                      Tulis Ulasan
                    </Button>

                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = sortedReviews.filter(r => r.rating === star).length;
                      const percentage = sortedReviews.length > 0 ? (count / sortedReviews.length) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground w-12">{star} bintang</span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-y-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-16 text-right">
                            {count} ({Math.round(percentage)}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Individual Reviews */}
                <div className="space-y-6 max-h-[800px] overflow-y-auto pr-2">
                  {sortedReviews.map((review, idx) => (
                    <div key={idx} className="pb-6 border-b border-border last:border-0">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                            {(review.userName || 'U').charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-foreground">{review.userName || 'User'}</h4>
                              {review.verified && (
                                <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                  <Check className="w-3 h-3" />
                                  Terverifikasi
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <RatingStars rating={review.rating} size="sm" showValue={false} />
                              <span className="text-xs text-muted-foreground">{review.date}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">{review.comment}</p>
                    </div>
                  ))}
                </div>

                {sortedReviews.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Belum ada ulasan untuk produk ini.</p>
                  </div>
                )}
              </Card>
            </div>

            {/* Related Products - Right Column (1/3) */}
            <div className="lg:col-span-1">
              <Card className="p-6 border-border bg-card shadow-xl sticky top-32">
                <h3 className="text-2xl font-bold text-foreground mb-6">Produk Terkait</h3>
                <div className="space-y-4">
                  {relatedProducts.map((relatedProduct) => {
                    const relatedReviews = productReviews.filter(r => r.productId === relatedProduct.id);
                    const relatedRating = relatedReviews.length 
                      ? relatedReviews.reduce((sum, r) => sum + r.rating, 0) / relatedReviews.length 
                      : 0;
                    
                    return (
                      <Card
                        key={relatedProduct.id}
                        className="group cursor-pointer overflow-hidden border-border hover:border-primary transition-all duration-300 hover:shadow-lg"
                        onClick={() => navigate(`/products/${relatedProduct.slug}`)}
                      >
                        <div className="aspect-video relative overflow-hidden bg-muted">
                          <img
                            src={getProductImage(relatedProduct.images, 0)}
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
                          <h4 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                            {relatedProduct.name}
                          </h4>
                          {relatedRating > 0 && (
                            <div className="mb-2">
                              <RatingStars rating={relatedRating} size="sm" className="text-xs" showValue={true} />
                            </div>
                          )}
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {relatedProduct.description}
                          </p>
                          <Button
                            size="sm"
                            className="w-full mt-3 bg-primary hover:bg-primary/90"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/products/${relatedProduct.slug}`);
                            }}
                          >
                            Lihat Detail
                          </Button>
                        </div>
                      </Card>
                    );
                  })}

                  {relatedProducts.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">Tidak ada produk terkait.</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <ScrollToTop />
      
      {/* Comparison Bar - Floating bottom */}
      <ComparisonBar />

      <Footer />

      {/* Review Modal */}
      <Modal
        open={reviewModalOpen}
        onOpenChange={setReviewModalOpen}
        title="Tulis Ulasan"
        submitLabel="Kirim Ulasan"
        isSubmitting={reviewLoading}
        onSubmit={() => {
          const formElement = document.querySelector('form');
          if (formElement) {
            formElement.dispatchEvent(new Event('submit', { cancelable: true }));
          }
        }}
      >
        <ReviewForm
          onSubmit={handleSubmitReview}
          onCancel={() => setReviewModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default ProductDetail;