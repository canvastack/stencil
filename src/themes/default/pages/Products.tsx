import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getProductDetailPath } from "@/utils/routes";

interface PageContent {
  hero: {
    title: {
      prefix: string;
      highlight: string;
      suffix?: string;
    };
    subtitle: string;
    typingTexts?: readonly string[];
  };
  informationSection: {
    title: {
      prefix: string;
      highlight: string;
      suffix?: string;
    };
    subtitle: string;
    cards: Array<{
      title: string;
      description: string;
      features: string[];
      icon: string;
      buttonText?: string;
    }>;
  };
  ctaSections: Array<{
    id: string;
    title: string;
    subtitle: string;
    stats?: Array<{
      value: string;
      label: string;
    }>;
    buttons: Array<{
      text: string;
      variant: 'primary' | 'outline';
      icon?: string;
    }>;
  }>;
}

interface ExtendedProduct extends Product {
  subcategory?: string;
}
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Search, Filter, Grid3x3, List, Star, Phone, Target, Fish, Eye, ShoppingCart } from "lucide-react";
import { APP_CONFIG, TYPING_TEXTS } from "@/lib/constants";
import { usePublicProducts } from '@/hooks/usePublicProducts';
import { useReviews } from '@/hooks/useReviews.tsx';
import { resolveImageUrl } from '@/utils/imageUtils';
import { Product } from "@/types/product";
import { usePageContent } from "@/hooks/usePageContent";
import { RatingStars } from "@/components/ui/rating-stars";
import { useGlobalContext } from "@/contexts/GlobalContext";
import { PlatformProductsView } from "@/components/products/PlatformProductsView";



const Products = () => {
  const { userType } = useGlobalContext();
  
  // Always use public products service for better real data access
  const { products: cmsProducts, isLoading: loadingProducts, fetchProducts } = usePublicProducts();
  
  const { reviews: allReviews, loading: loadingReviews } = useReviews(undefined, userType);
  
  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSize, setSelectedSize] = useState("all");
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState("name-asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [typingTextIndex, setTypingTextIndex] = useState(0);
  const { PRODUCTS_PER_PAGE } = APP_CONFIG;

  const { pageContent: cmsPageContent, loading: pageContentLoading } = usePageContent();

  const defaultPageContent: PageContent = {
    hero: {
      title: { prefix: "Semua", highlight: "Produk" },
      subtitle: "Temukan produk etching berkualitas tinggi dengan presisi sempurna untuk kebutuhan Anda.",
      typingTexts: TYPING_TEXTS
    },
    informationSection: {
      title: { prefix: "Layanan", highlight: "Etching", suffix: "Kami" },
      subtitle: "Tiga kategori utama produk etching dengan kualitas terbaik dan presisi tinggi",
      cards: [
        { title: "Etching Logam", description: "Stainless steel, kuningan, tembaga, aluminium untuk berbagai aplikasi industri dan dekorasi.", features: ["Presisi tinggi", "Tahan lama", "Kustomisasi penuh"], icon: "⚙️", buttonText: "Pelajari Lebih Lanjut" },
        { title: "Etching Kaca", description: "Kaca berkualitas tinggi dengan hasil etching yang halus dan elegan untuk interior dan hadiah.", features: ["Desain artistik", "Food-grade safe", "Transparan premium"], icon: "🏆", buttonText: "Pelajari Lebih Lanjut" },
        { title: "Plakat Penghargaan", description: "Plakat custom untuk penghargaan perusahaan, acara, dan apresiasi dengan desain profesional.", features: ["Desain eksklusif", "Material premium", "Personalisasi lengkap"], icon: "🎖️", buttonText: "Pelajari Lebih Lanjut" }
      ]
    },
    ctaSections: [
      { id: "cta-1", title: "Siap Mewujudkan Proyek Anda?", subtitle: "Hubungi kami sekarang dan dapatkan konsultasi gratis untuk proyek etching Anda", stats: [{ value: "1000+", label: "Produk" }, { value: "15+", label: "Tahun Pengalaman" }, { value: "98%", label: "Tingkat Kepuasan" }], buttons: [{ text: "Hubungi Kami", variant: "primary" as const, icon: "Phone" }, { text: "Lihat Produk Kami", variant: "outline" as const, icon: "Target" }] },
      { id: "cta-2", title: "Punya Pertanyaan atau Siap Memulai?", subtitle: "Tim ahli kami siap membantu Anda menemukan solusi terbaik untuk kebutuhan etching Anda.", buttons: [{ text: "Hubungi Tim Kami", variant: "primary" as const }] }
    ]
  };

  // Fix: Ensure pageContent always has proper structure
  const pageContent = {
    ...defaultPageContent,
    ...(cmsPageContent?.content || {}),
    hero: {
      ...defaultPageContent.hero,
      ...(cmsPageContent?.content?.hero || {})
    },
    informationSection: {
      ...defaultPageContent.informationSection,
      ...(cmsPageContent?.content?.informationSection || {})
    }
  };
  const typingTexts = pageContent.hero?.typingTexts || TYPING_TEXTS;

  // Set up typing effect for all users - MOVED BEFORE CONDITIONAL RETURNS
  useEffect(() => {
    const interval = setInterval(() => {
      setTypingTextIndex((prev) => (prev + 1) % typingTexts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [typingTexts]);

  // Reset pagination when filters change - MOVED BEFORE CONDITIONAL RETURNS
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedType, selectedCategory, minRating]);

  // Show loading state while content is loading
  if (pageContentLoading && !cmsPageContent) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Platform users get a different view focused on tenant management and analytics
  if (userType === 'platform') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-20 px-4 py-8">
          <PlatformProductsView />
        </div>
        <Footer />
      </div>
    );
  }

  const allProducts: ExtendedProduct[] = cmsProducts || [];

  const formatPrice = (price: number, currency: string): string => {
    // Handle case where currency is empty or invalid
    if (!currency || currency.trim() === '') {
      currency = 'IDR'; // Default to IDR
    }
    
    try {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(price);
    } catch (error) {
      // Fallback to simple number formatting if currency is invalid
      return `Rp ${new Intl.NumberFormat('id-ID').format(price)}`;
    }
  };

  const getProductRating = (productId: string): number => {
    const productReviews = allReviews.filter(review => review.productId === productId);
    
    if (productReviews.length === 0) {
      return 0;
    }
    
    const sum = productReviews.reduce((acc, review) => acc + review.rating, 0);
    return parseFloat((sum / productReviews.length).toFixed(1));
  };

  const filteredProducts = allProducts.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = selectedType === "all" || 
                       product.category.toLowerCase().includes(selectedType.toLowerCase()) ||
                       product.tags.some(tag => tag.toLowerCase() === selectedType.toLowerCase());
    const matchesCategory = selectedCategory === "all" || 
                          product.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
                          product.subcategory?.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesRating = getProductRating(product.id) >= minRating;
    
    return matchesSearch && matchesType && matchesCategory && matchesRating && product.status === 'published';
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "rating-high":
        return getProductRating(b.id) - getProductRating(a.id);
      case "rating-low":
        return getProductRating(a.id) - getProductRating(b.id);
      default:
        return 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / PRODUCTS_PER_PAGE);
  const indexOfLastProduct = currentPage * PRODUCTS_PER_PAGE;
  const indexOfFirstProduct = indexOfLastProduct - PRODUCTS_PER_PAGE;
  const currentProducts = sortedProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-12 px-4 bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#1e293b] animate-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmOTczMTYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzMuMzE0IDAgNiAyLjY4NiA2IDZzLTIuNjg2IDYtNiA2LTYtMi42ODYtNi02IDIuNjg2LTYgNi02eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
        
        <div className="container mx-auto text-center max-w-4xl animate-fade-in relative z-10">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white">
            {pageContent.hero.title.prefix} <span className="text-primary">{pageContent.hero.title.highlight}</span>
          </h1>
          <p className="text-lg text-slate-300 mb-4">
            {(pageContent.hero as any)?.subtitle}
          </p>
          <div className="h-8 flex items-center justify-center">
            <p 
              key={typingTextIndex}
              className="text-base text-primary font-medium animate-typing"
            >
              {typingTexts[typingTextIndex]}
            </p>
          </div>
        </div>
      </section>

      {/* Search and Filter Bar */}
      <section className="bg-[#1e293b] py-6 px-4 sticky top-16 z-40 backdrop-blur-lg bg-opacity-95 border-b border-white/10">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#0f172a] border-slate-700 text-white placeholder:text-slate-500 focus:border-primary transition-all"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex gap-3 flex-wrap items-center">
              <Select 
                value={selectedType} 
                onValueChange={(value: string) => setSelectedType(value)}>
                <SelectTrigger className="w-[150px] bg-[#0f172a] border-slate-700 text-white">
                  <SelectValue placeholder="Semua Produk" />
                </SelectTrigger>
                <SelectContent className="bg-[#1e293b] border-slate-700">
                  <SelectItem value="all">Semua Produk</SelectItem>
                  <SelectItem value="metal">Metal Etching</SelectItem>
                  <SelectItem value="glass">Glass Etching</SelectItem>
                  <SelectItem value="award">Awards & Plaques</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={sortBy} 
                onValueChange={(value: string) => setSortBy(value)}>
                <SelectTrigger className="w-[150px] bg-[#0f172a] border-slate-700 text-white">
                  <SelectValue placeholder="Nama (A-Z)" />
                </SelectTrigger>
                <SelectContent className="bg-[#1e293b] border-slate-700">
                  <SelectItem value="name-asc">Nama (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Nama (Z-A)</SelectItem>
                  <SelectItem value="rating-high">Rating Tertinggi</SelectItem>
                  <SelectItem value="rating-low">Rating Terendah</SelectItem>
                </SelectContent>
              </Select>

              {/* View Toggle */}
              <div className="flex gap-1 bg-[#0f172a] rounded-lg p-1 border border-slate-700">
                <Button
                  size="sm"
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  onClick={() => setViewMode("grid")}
                  className={viewMode === "grid" ? "bg-primary hover:bg-primary/90" : "text-slate-400 hover:text-white"}
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "list" ? "default" : "ghost"}
                  onClick={() => setViewMode("list")}
                  className={viewMode === "list" ? "bg-primary hover:bg-primary/90" : "text-slate-400 hover:text-white"}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content with Sidebar */}
      <section className="py-12 px-4 bg-[#0f172a]">
        <div className="container mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <aside className="lg:w-64 flex-shrink-0">
              <div className="bg-[#1e293b] rounded-xl p-6 border border-slate-700/50 sticky top-32 shadow-xl">
                <div className="flex items-center gap-2 mb-6">
                  <Filter className="w-5 h-5 text-primary" />
                  <h3 className="text-xl font-bold text-white">Filter Produk</h3>
                </div>

                {/* Search in Sidebar */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Pencarian</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      type="text"
                      placeholder="Cari produk..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-[#0f172a] border-slate-600 text-white placeholder:text-slate-500 text-sm"
                    />
                  </div>
                </div>

                {/* Product Type Filter */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Tipe Produk</label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-full bg-[#0f172a] border-slate-600 text-white">
                      <SelectValue placeholder="Semua Tipe" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-slate-700">
                      <SelectItem value="all">Semua Tipe</SelectItem>
                      <SelectItem value="metal">Metal Etching</SelectItem>
                      <SelectItem value="glass">Glass Etching</SelectItem>
                      <SelectItem value="award">Awards & Plaques</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Category Filter */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Kategori</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full bg-[#0f172a] border-slate-600 text-white">
                      <SelectValue placeholder="Semua Kategori" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-slate-700">
                      <SelectItem value="all">Semua Kategori</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                      <SelectItem value="decorative">Dekoratif</SelectItem>
                      <SelectItem value="corporate">Korporat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Size Filter */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Ukuran</label>
                  <Select value={selectedSize} onValueChange={setSelectedSize}>
                    <SelectTrigger className="w-full bg-[#0f172a] border-slate-600 text-white">
                      <SelectValue placeholder="Semua Ukuran" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-slate-700">
                      <SelectItem value="all">Semua Ukuran</SelectItem>
                      <SelectItem value="small">Kecil</SelectItem>
                      <SelectItem value="medium">Sedang</SelectItem>
                      <SelectItem value="large">Besar</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Rating Filter */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-slate-300 mb-3 block">Rating Minimum</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setMinRating(rating === minRating ? 0 : rating)}
                        className="transition-all hover:scale-110"
                      >
                        <Star
                          className={`w-6 h-6 transition-all ${
                            rating <= minRating
                              ? "fill-primary text-primary"
                              : "text-slate-600 hover:text-slate-400"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  {minRating > 0 && (
                    <p className="text-xs text-slate-400 mt-2">
                      Minimal {minRating} bintang
                    </p>
                  )}
                </div>

                {/* Reset Button */}
                <Button
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedType("all");
                    setSelectedCategory("all");
                    setSelectedSize("all");
                    setMinRating(0);
                  }}
                >
                  Reset Filter
                </Button>
              </div>
            </aside>

            {/* Products Grid */}
            <div className="flex-1">
              {loadingProducts ? (
                <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
                  <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-full p-8 mb-6 animate-pulse">
                    <ShoppingCart className="w-16 h-16 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Memuat produk...</h3>
                  <p className="text-slate-400 max-w-md">
                    Mohon tunggu sebentar
                  </p>
                </div>
              ) : sortedProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
                  <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-full p-8 mb-6">
                    <Fish className="w-16 h-16 text-primary animate-float" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Produk tidak ditemukan</h3>
                  <p className="text-slate-400 max-w-md">
                    Coba gunakan kata kunci yang berbeda atau ubah filter kategori.
                  </p>
                </div>
              ) : (
                <>
                  <div className={`grid ${viewMode === "grid" ? "md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"} gap-6`}>
                    {currentProducts.map((product, i) => {
                      const rating = getProductRating(product.id);
                      return (
                        <Card
                          key={product.id}
                          className="group bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 overflow-hidden animate-scale-in"
                          style={{ animationDelay: `${i * 0.1}s` }}
                        >
                          {/* Product Image */}
                          <div className="relative aspect-video overflow-hidden bg-muted">
                            {product.images && product.images.length > 0 ? (
                              <img
                                src={resolveImageUrl(product.images[0])}
                                alt={product.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                                <Fish className="w-16 h-16 text-gray-400" />
                              </div>
                            )}
                          </div>

                          <div className="p-6">
                            {/* Rating */}
                            <RatingStars rating={rating} size="sm" className="mb-3" />

                            <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors line-clamp-2">
                              {product.name}
                            </h3>
                            <p className="text-lg font-bold text-primary mb-2">{formatPrice(product.price, product.currency)}</p>
                            <p className="text-muted-foreground mb-6 leading-relaxed line-clamp-2">{product.description}</p>
                            
                            <div className="flex gap-3">
                              <Button
                                onClick={() => navigate(getProductDetailPath(product.slug))}
                                variant="outline"
                                className="flex-1 border-primary text-primary hover:bg-primary/10 font-semibold"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Detail
                              </Button>
                              <Button
                                onClick={() => navigate(getProductDetailPath(product.slug))}
                                className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-semibold shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:shadow-primary/40"
                              >
                                <ShoppingCart className="w-4 h-4 mr-2" />
                                Pesan
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12">
                    <Pagination>
                      <PaginationContent className="bg-[#1e293b] rounded-lg p-2 border border-slate-700/50">
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-primary/10 text-white"}
                          />
                        </PaginationItem>
                        
                        {[...Array(totalPages)].map((_, idx) => {
                          const pageNum = idx + 1;
                          if (
                            pageNum === 1 ||
                            pageNum === totalPages ||
                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                          ) {
                            return (
                              <PaginationItem key={pageNum}>
                                <PaginationLink
                                  onClick={() => setCurrentPage(pageNum)}
                                  isActive={currentPage === pageNum}
                                  className={`cursor-pointer ${
                                    currentPage === pageNum
                                      ? "bg-primary text-white hover:bg-primary/90"
                                      : "text-slate-300 hover:bg-slate-700 hover:text-white"
                                  }`}
                                >
                                  {pageNum}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          } else if (
                            pageNum === currentPage - 2 ||
                            pageNum === currentPage + 2
                          ) {
                            return (
                              <PaginationItem key={pageNum}>
                                <PaginationEllipsis className="text-slate-500" />
                              </PaginationItem>
                            );
                          }
                          return null;
                        })}
                        
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-primary/10 text-white"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Information Section - Etching Services */}
      <section className="py-20 px-4 bg-gradient-to-br from-muted/30 to-muted/10 border-y border-border">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {pageContent.informationSection?.title?.prefix} <span className="text-primary">{pageContent.informationSection?.title?.highlight}</span> {pageContent.informationSection?.title?.suffix}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {(pageContent.informationSection as any)?.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {(pageContent.informationSection?.cards || []).map((card, i) => (
              <Card
                key={i}
                className="group bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 overflow-hidden animate-scale-in"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                <div className="p-8">
                  <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform">
                    {card.icon}
                  </div>

                  <h3 className="text-2xl font-bold mb-4 text-foreground group-hover:text-primary transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">{card.description}</p>
                  
                  <ul className="space-y-3 mb-6">
                    {card.features.map((feature, j) => (
                      <li key={j} className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button 
                    variant="outline"
                    className="w-full border-primary text-primary hover:bg-primary/10 font-semibold group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                  >
                    {card.buttonText || "Pelajari Lebih Lanjut"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section 1 */}
      {((pageContent.ctaSections as any)?.[0]) && (
        <section className="py-20 px-4 bg-gradient-to-r from-[#f59e0b] to-[#f97316] relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>
          
          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                {(pageContent.ctaSections as any)[0]?.title}
              </h2>
              <p className="text-lg text-white/90 max-w-2xl mx-auto">
                {(pageContent.ctaSections as any)[0]?.subtitle}
              </p>
            </div>

            {(pageContent.ctaSections as any)[0]?.stats && (
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                {(pageContent.ctaSections as any)[0].stats.map((stat: any, i: number) => (
                  <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20 hover:bg-white/20 transition-all">
                    <div className="text-5xl font-bold text-white mb-2">{stat.value}</div>
                    <div className="text-white/90 font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {(pageContent.ctaSections as any)[0]?.buttons?.map((btn: any, i: number) => (
                <Button
                  key={i}
                  size="lg"
                  variant={btn.variant === 'outline' ? 'outline' : 'default'}
                  className={btn.variant === 'outline' 
                    ? "border-2 border-[#fbbf24] bg-transparent hover:bg-white/10 text-white font-semibold px-8 shadow-xl hover:shadow-2xl transition-all"
                    : "bg-[#475569] hover:bg-[#334155] text-white font-semibold px-8 shadow-xl hover:shadow-2xl transition-all"
                  }
                >
                  {btn.icon === 'Phone' && <Phone className="w-5 h-5 mr-2" />}
                  {btn.text}
                  {btn.icon === 'Target' && <Target className="w-5 h-5 ml-2" />}
                </Button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section 2 */}
      {((pageContent.ctaSections as any)?.[1]) && (
        <section className="py-16 px-4 bg-gradient-to-r from-[#d97706] to-[#ea580c] relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuMDMiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50"></div>
          
          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                  {(pageContent.ctaSections as any)[1]?.title}
                </h2>
                <p className="text-lg text-white/90">
                  {(pageContent.ctaSections as any)[1]?.subtitle}
                </p>
              </div>
              <div className="flex-shrink-0">
                {(pageContent.ctaSections as any)[1]?.buttons?.[0] && (
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-[#f59e0b] to-[#f97316] hover:from-[#f59e0b]/90 hover:to-[#f97316]/90 text-white font-semibold px-12 py-6 text-lg shadow-2xl hover:shadow-3xl transition-all backdrop-blur-sm border border-white/20 hover:scale-105"
                  >
                    {(pageContent.ctaSections as any)[1].buttons[0].text}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default Products;