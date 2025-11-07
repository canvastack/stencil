import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

// Import product images
import metalEtching1 from "@/assets/products/metal-etching-1.jpg";
import metalEtching2 from "@/assets/products/metal-etching-2.jpg";
import metalEtching3 from "@/assets/products/metal-etching-3.jpg";
import glassEtching1 from "@/assets/products/glass-etching-1.jpg";
import glassEtching2 from "@/assets/products/glass-etching-2.jpg";
import glassEtching3 from "@/assets/products/glass-etching-3.jpg";
import awardPlaque1 from "@/assets/products/award-plaque-1.jpg";
import awardPlaque2 from "@/assets/products/award-plaque-2.jpg";
import awardPlaque3 from "@/assets/products/award-plaque-3.jpg";
import titaniumAerospace1 from "@/assets/products/titanium-aerospace-1.jpg";
import wineGlassSet1 from "@/assets/products/wine-glass-set-1.jpg";
import crystalAward1 from "@/assets/products/crystal-award-1.jpg";
import brassDoorSign1 from "@/assets/products/brass-door-sign-1.jpg";
import mirrorFrame1 from "@/assets/products/mirror-frame-1.jpg";
import retirementPlaque1 from "@/assets/products/retirement-plaque-1.jpg";
import controlPanel1 from "@/assets/products/control-panel-1.jpg";
import bathroomMirror1 from "@/assets/products/bathroom-mirror-1.jpg";
import lifetimeTrophy1 from "@/assets/products/lifetime-trophy-1.jpg";

const Products = () => {
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

  const typingTexts = TYPING_TEXTS;

  useEffect(() => {
    const interval = setInterval(() => {
      setTypingTextIndex((prev) => (prev + 1) % typingTexts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const products = [
    {
      id: "1",
      name: "Nameplate Stainless Steel Premium",
      image: metalEtching1,
      type: "metal",
      category: "industrial",
      rating: 5,
      description: "Nameplate stainless steel dengan pola geometris yang rumit dan presisi tinggi.",
    },
    {
      id: "2",
      name: "Glass Award Trophy Premium",
      image: glassEtching1,
      price: "Rp 450.000",
      type: "glass",
      category: "corporate",
      rating: 5,
      description: "Trophy kaca premium dengan etching logo perusahaan untuk penghargaan korporat.",
    },
    {
      id: "3",
      name: "Memorial Brass Plaque Deluxe",
      image: awardPlaque1,
      price: "Rp 650.000",
      type: "award",
      category: "corporate",
      rating: 5,
      description: "Plakat memorial kuningan dengan border ornamen elegan dan base kayu solid.",
    },
    {
      id: "4",
      name: "Copper Decorative Panel Artistic",
      image: metalEtching2,
      type: "metal",
      category: "decorative",
      rating: 4.5,
      description: "Panel dekoratif tembaga dengan pola botanical artistik untuk interior modern.",
    },
    {
      id: "5",
      name: "Etched Crystal Vase Luxury",
      image: glassEtching2,
      price: "Rp 550.000",
      type: "glass",
      category: "decorative",
      rating: 5,
      description: "Vas crystal dengan pola floral etching halus, cocok untuk dekorasi rumah mewah.",
    },
    {
      id: "6",
      name: "Corporate Recognition Plaque",
      image: awardPlaque2,
      price: "Rp 500.000",
      type: "award",
      category: "corporate",
      rating: 5,
      description: "Plakat pengakuan korporat dengan plate metal dan frame kayu premium.",
    },
    {
      id: "7",
      name: "Industrial Signage Aluminum",
      image: metalEtching3,
      type: "metal",
      category: "industrial",
      rating: 4.5,
      description: "Signage industrial aluminum dengan marking teknis presisi untuk aplikasi industri.",
    },
    {
      id: "8",
      name: "Frosted Glass Door Panel",
      image: glassEtching3,
      price: "Rp 1.200.000",
      type: "glass",
      category: "decorative",
      rating: 5,
      description: "Panel kaca pintu dengan pola geometris etching untuk interior arsitektur modern.",
    },
    {
      id: "9",
      name: "Championship Sports Trophy",
      image: awardPlaque3,
      price: "Rp 750.000",
      type: "award",
      category: "corporate",
      rating: 5,
      description: "Trophy olahraga custom dengan logo tim dan detail kejuaraan yang presisi.",
    },
    {
      id: "10",
      name: "Titanium Aerospace Plate",
      image: titaniumAerospace1,
      price: "Rp 950.000",
      type: "metal",
      category: "industrial",
      rating: 5,
      description: "Plate titanium grade aerospace dengan marking presisi untuk aplikasi high-tech.",
    },
    {
      id: "11",
      name: "Engraved Wine Glass Set",
      image: wineGlassSet1,
      type: "glass",
      category: "decorative",
      rating: 4.5,
      description: "Set gelas wine dengan etching monogram elegan untuk hadiah premium.",
    },
    {
      id: "12",
      name: "Excellence Award Crystal",
      image: crystalAward1,
      price: "Rp 890.000",
      type: "award",
      category: "corporate",
      rating: 5,
      description: "Crystal award prestisius dengan etching 3D untuk penghargaan tertinggi.",
    },
    {
      id: "13",
      name: "Brass Door Sign Custom",
      image: brassDoorSign1,
      type: "metal",
      category: "decorative",
      rating: 4.5,
      description: "Papan nama pintu kuningan dengan border dekoratif dan teks custom.",
    },
    {
      id: "14",
      name: "Decorative Mirror Frame",
      image: mirrorFrame1,
      price: "Rp 680.000",
      type: "glass",
      category: "decorative",
      rating: 5,
      description: "Frame cermin dengan pola etching art deco untuk interior luxury.",
    },
    {
      id: "15",
      name: "Retirement Commemoration Plaque",
      image: retirementPlaque1,
      price: "Rp 580.000",
      type: "award",
      category: "corporate",
      rating: 5,
      description: "Plakat pensiun dengan foto etching dan teks personalisasi lengkap.",
    },
    {
      id: "16",
      name: "Stainless Control Panel",
      image: controlPanel1,
      price: "Rp 420.000",
      type: "metal",
      category: "industrial",
      rating: 4.5,
      description: "Panel kontrol stainless dengan marking tombol dan instruksi teknis.",
    },
    {
      id: "17",
      name: "Bathroom Mirror Etched",
      image: bathroomMirror1,
      price: "Rp 1.500.000",
      type: "glass",
      category: "decorative",
      rating: 5,
      description: "Cermin kamar mandi dengan border etching dan anti-fog coating.",
    },
    {
      id: "18",
      name: "Lifetime Achievement Trophy",
      image: lifetimeTrophy1,
      price: "Rp 1.200.000",
      type: "award",
      category: "corporate",
      rating: 5,
      description: "Trophy prestasi seumur hidup dengan kombinasi metal, kaca, dan base granite.",
    },
  ];

  const infoCards = [
    {
      title: "Etching Logam",
      description: "Stainless steel, kuningan, tembaga, aluminium untuk berbagai aplikasi industri dan dekorasi.",
      features: ["Presisi tinggi", "Tahan lama", "Kustomisasi penuh"],
      icon: "⚙️",
    },
    {
      title: "Etching Kaca",
      description: "Kaca berkualitas tinggi dengan hasil etching yang halus dan elegan untuk interior dan hadiah.",
      features: ["Desain artistik", "Food-grade safe", "Transparan premium"],
      icon: "🏆",
    },
    {
      title: "Plakat Penghargaan",
      description: "Plakat custom untuk penghargaan perusahaan, acara, dan apresiasi dengan desain profesional.",
      features: ["Desain eksklusif", "Material premium", "Personalisasi lengkap"],
      icon: "🎖️",
    },
  ];

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "all" || product.type === selectedType;
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const matchesRating = product.rating >= minRating;
    
    return matchesSearch && matchesType && matchesCategory && matchesRating;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const indexOfLastProduct = currentPage * PRODUCTS_PER_PAGE;
  const indexOfFirstProduct = indexOfLastProduct - PRODUCTS_PER_PAGE;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedType, selectedCategory, minRating]);

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-12 px-4 bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#1e293b] animate-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmOTczMTYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzMuMzE0IDAgNiAyLjY4NiA2IDZzLTIuNjg2IDYtNiA2LTYtMi42ODYtNi02IDIuNjg2LTYgNi02eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
        
        <div className="container mx-auto text-center max-w-4xl animate-fade-in relative z-10">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white">
            Semua <span className="text-primary">Produk</span>
          </h1>
          <p className="text-lg text-slate-300 mb-4">
            Temukan produk etching berkualitas tinggi dengan presisi sempurna untuk kebutuhan Anda.
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
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[150px] bg-[#0f172a] border-slate-700 text-white">
                  <SelectValue placeholder="Semua Produk" />
                </SelectTrigger>
                <SelectContent className="bg-[#1e293b] border-slate-700">
                  <SelectItem value="all">Semua Produk</SelectItem>
                  <SelectItem value="metal">Etching Logam</SelectItem>
                  <SelectItem value="glass">Etching Kaca</SelectItem>
                  <SelectItem value="award">Plakat</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
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
                      <SelectItem value="metal">Etching Logam</SelectItem>
                      <SelectItem value="glass">Etching Kaca</SelectItem>
                      <SelectItem value="award">Plakat Penghargaan</SelectItem>
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
              {filteredProducts.length === 0 ? (
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
                    {currentProducts.map((product, i) => (
                    <Card
                      key={product.id}
                      className="group bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 overflow-hidden animate-scale-in"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    >
                      {/* Product Image */}
                      <div className="relative aspect-video overflow-hidden bg-muted">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>

                      <div className="p-6">
                        {/* Rating */}
                        <div className="flex items-center gap-1 mb-3">
                          {[...Array(5)].map((_, idx) => (
                            <Star
                              key={idx}
                              className={`w-4 h-4 ${
                                idx < Math.floor(product.rating)
                                  ? "fill-primary text-primary"
                                  : "text-muted"
                              }`}
                            />
                          ))}
                          <span className="text-sm text-muted-foreground ml-1">({product.rating})</span>
                        </div>

                        <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {product.name}
                        </h3>
                        {product.price && (
                          <p className="text-lg font-bold text-primary mb-2">{product.price}</p>
                        )}
                        <p className="text-muted-foreground mb-6 leading-relaxed line-clamp-2">{product.description}</p>
                        
                        <div className="flex gap-3">
                          <Button
                            onClick={() => navigate(`/products/${product.id}`)}
                            variant="outline"
                            className="flex-1 border-primary text-primary hover:bg-primary/10 font-semibold"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Detail
                          </Button>
                          <Button
                            onClick={() => navigate(`/products/${product.id}`)}
                            className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-semibold shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:shadow-primary/40"
                          >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Pesan
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
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
              Layanan <span className="text-primary">Etching</span> Kami
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tiga kategori utama produk etching dengan kualitas terbaik dan presisi tinggi
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {infoCards.map((card, i) => (
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
                    Pelajari Lebih Lanjut
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section 1 - "Siap Mewujudkan Proyek Anda?" Style */}
      <section className="py-20 px-4 bg-gradient-to-r from-[#f59e0b] to-[#f97316] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Siap Mewujudkan Proyek Anda?
            </h2>
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              Hubungi kami sekarang dan dapatkan konsultasi gratis untuk proyek etching Anda
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20 hover:bg-white/20 transition-all">
              <div className="text-5xl font-bold text-white mb-2">1000+</div>
              <div className="text-white/90 font-medium">Produk</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20 hover:bg-white/20 transition-all">
              <div className="text-5xl font-bold text-white mb-2">15+</div>
              <div className="text-white/90 font-medium">Tahun Pengalaman</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20 hover:bg-white/20 transition-all">
              <div className="text-5xl font-bold text-white mb-2">98%</div>
              <div className="text-white/90 font-medium">Tingkat Kepuasan</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-[#475569] hover:bg-[#334155] text-white font-semibold px-8 shadow-xl hover:shadow-2xl transition-all"
            >
              <Phone className="w-5 h-5 mr-2" />
              Hubungi Kami
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-[#fbbf24] bg-transparent hover:bg-white/10 text-white font-semibold px-8 shadow-xl hover:shadow-2xl transition-all"
            >
              Lihat Produk Kami
              <Target className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section 2 - "Punya Pertanyaan atau Siap Memulai?" Style */}
      <section className="py-16 px-4 bg-gradient-to-r from-[#d97706] to-[#ea580c] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuMDMiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50"></div>
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                Punya Pertanyaan atau Siap Memulai?
              </h2>
              <p className="text-lg text-white/90">
                Tim ahli kami siap membantu Anda menemukan solusi terbaik untuk kebutuhan etching Anda.
              </p>
            </div>
            <div className="flex-shrink-0">
              <Button
                size="lg"
                className="bg-gradient-to-r from-[#f59e0b] to-[#f97316] hover:from-[#f59e0b]/90 hover:to-[#f97316]/90 text-white font-semibold px-12 py-6 text-lg shadow-2xl hover:shadow-3xl transition-all backdrop-blur-sm border border-white/20 hover:scale-105"
              >
                Hubungi Tim Kami
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Products;