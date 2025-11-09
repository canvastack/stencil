import { useState } from "react";
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
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ArrowLeft, ShoppingCart, MessageCircle, Star, Check, Package, Ruler, Palette, ZoomIn, X, Rotate3D, Plus, Trash2, ArrowUpDown } from "lucide-react";
import { ColorPicker } from "@/components/ui/color-picker";
import { WysiwygEditor } from '@/components/ui/wysiwyg-editor';
import { Modal } from "@/components/ui/modal";
import { ReviewForm } from "@/features/reviews/components/ReviewForm";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { useProductReviews } from "@/hooks/useReviews";
import { useProductBySlug } from "@/hooks/useProducts";
import { resolveImageUrl } from '@/utils/imageUtils';

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

const allProducts = [
  {
    id: "1",
    name: "Nameplate Stainless Steel Premium",
    type: "metal",
    category: "industrial",
    rating: 5,
    images: [metalEtching1, metalEtching2, metalEtching3],
    description: "Nameplate stainless steel dengan pola geometris yang rumit, cocok untuk aplikasi industrial dan dekorasi premium. Material berkualitas tinggi dengan hasil etching presisi tinggi.",
    features: [
      "Material: Stainless Steel 304",
      "Ketebalan: 0.5mm - 2mm",
      "Finishing: Brushed/Mirror",
      "Tahan korosi dan weathering",
      "Presisi tinggi hingga 0.1mm"
    ],
    specifications: {
      material: "Stainless Steel 304",
      thickness: "0.5mm - 2mm",
      minOrder: "10 pcs",
      leadTime: "7-14 hari kerja"
    }
  },
  {
    id: "2",
    name: "Glass Award Trophy Premium",
    type: "glass",
    category: "corporate",
    price: "Rp 450.000",
    rating: 5,
    images: [glassEtching1, glassEtching2, glassEtching3],
    description: "Trophy kaca premium dengan etching logo perusahaan, sempurna untuk penghargaan korporat. Kaca berkualitas tinggi dengan detail etching yang halus dan elegan.",
    features: [
      "Kaca Crystal Premium",
      "Etching halus dan detail",
      "Include base akrilik/kayu",
      "Food-grade safe",
      "Dapat dicuci dengan aman"
    ],
    specifications: {
      material: "Crystal Glass",
      thickness: "8mm - 12mm",
      minOrder: "5 pcs",
      leadTime: "10-14 hari kerja"
    }
  },
  {
    id: "3",
    name: "Memorial Brass Plaque Deluxe",
    type: "award",
    category: "corporate",
    price: "Rp 650.000",
    rating: 5,
    images: [awardPlaque1, awardPlaque2, awardPlaque3],
    description: "Plakat memorial kuningan dengan border ornamen elegan dan ukiran teks yang presisi. Dilengkapi dengan base kayu untuk tampilan yang lebih mewah.",
    features: [
      "Material: Brass Premium",
      "Base kayu solid",
      "Border ornamen custom",
      "Teks ukiran detail",
      "Anti-tarnish coating"
    ],
    specifications: {
      material: "Brass/Kuningan Premium",
      baseSize: "15cm x 20cm",
      minOrder: "1 pcs",
      leadTime: "14-21 hari kerja"
    }
  },
  {
    id: "4",
    name: "Copper Decorative Panel Artistic",
    type: "metal",
    category: "decorative",
    rating: 4.5,
    images: [metalEtching2, metalEtching1, metalEtching3],
    description: "Panel dekoratif tembaga dengan pola botanical artistik. Finishing metalik kemerahan yang hangat, cocok untuk interior modern dan kontemporer.",
    features: [
      "Material: Pure Copper",
      "Pola botanical artistik",
      "Finishing anti-oxidation",
      "Mounting hardware included",
      "Custom design available"
    ],
    specifications: {
      material: "Pure Copper 99.9%",
      size: "60cm x 80cm",
      minOrder: "1 pcs",
      leadTime: "21-30 hari kerja"
    }
  },
  {
    id: "5",
    name: "Etched Crystal Vase Luxury",
    type: "glass",
    category: "decorative",
    price: "Rp 550.000",
    rating: 5,
    images: [glassEtching2, glassEtching1, glassEtching3],
    description: "Vas crystal dengan pola floral etching yang halus. Transparansi sempurna dengan detail frosted yang elegan, cocok untuk dekorasi rumah mewah.",
    features: [
      "Crystal Glass Premium",
      "Pola floral etching",
      "Food-grade & dishwasher safe",
      "Transparansi tinggi",
      "Handcrafted quality"
    ],
    specifications: {
      material: "Lead-free Crystal",
      height: "25cm - 35cm",
      minOrder: "3 pcs",
      leadTime: "14-21 hari kerja"
    }
  },
  {
    id: "6",
    name: "Corporate Recognition Plaque",
    type: "award",
    category: "corporate",
    price: "Rp 500.000",
    rating: 5,
    images: [awardPlaque2, awardPlaque1, awardPlaque3],
    description: "Plakat pengakuan korporat dengan plate metal yang di-etch detail pencapaian karyawan. Frame kayu elegan untuk setting kantor eksekutif.",
    features: [
      "Metal plate precision etching",
      "Frame kayu premium",
      "Mounting ready",
      "Custom text & logo",
      "Professional packaging"
    ],
    specifications: {
      material: "Brass/Stainless Steel",
      frameSize: "20cm x 25cm",
      minOrder: "1 pcs",
      leadTime: "10-14 hari kerja"
    }
  },
  {
    id: "7",
    name: "Industrial Signage Aluminum",
    type: "metal",
    category: "industrial",
    rating: 4.5,
    images: [metalEtching3, metalEtching1, metalEtching2],
    description: "Signage industrial aluminum dengan marking teknis presisi dan nomor seri. Brushed metal finish dengan estetika industrial modern yang bersih.",
    features: [
      "Aluminum 6061-T6",
      "Brushed finish",
      "UV & weather resistant",
      "Serial numbering available",
      "Industrial grade quality"
    ],
    specifications: {
      material: "Aluminum 6061-T6",
      thickness: "1mm - 3mm",
      minOrder: "50 pcs",
      leadTime: "7-10 hari kerja"
    }
  },
  {
    id: "8",
    name: "Frosted Glass Door Panel",
    type: "glass",
    category: "decorative",
    price: "Rp 1.200.000",
    rating: 5,
    images: [glassEtching3, glassEtching1, glassEtching2],
    description: "Panel kaca pintu dengan pola geometris etching. Kaca frosted translucent dengan etching presisi untuk interior arsitektur modern dan kontemporer mewah.",
    features: [
      "Tempered glass 10mm",
      "Pola geometris custom",
      "Frosted translucent",
      "Safety standard certified",
      "Professional installation"
    ],
    specifications: {
      material: "Tempered Glass",
      size: "80cm x 200cm",
      minOrder: "1 pcs",
      leadTime: "30-45 hari kerja"
    }
  },
  {
    id: "9",
    name: "Championship Sports Trophy",
    type: "award",
    category: "corporate",
    price: "Rp 750.000",
    rating: 5,
    images: [awardPlaque3, awardPlaque1, awardPlaque2],
    description: "Trophy olahraga custom dengan logo tim dan detail kejuaraan. Kombinasi metal dan kaca yang dipoles dengan setting podium kemenangan yang dramatis.",
    features: [
      "Metal & glass combination",
      "Custom logo etching",
      "Polished premium finish",
      "Championship grade",
      "Luxury gift box included"
    ],
    specifications: {
      material: "Metal + Crystal Glass",
      height: "30cm - 45cm",
      minOrder: "1 pcs",
      leadTime: "14-21 hari kerja"
    }
  },
  {
    id: "10",
    name: "Titanium Aerospace Plate",
    type: "metal",
    category: "industrial",
    price: "Rp 950.000",
    rating: 5,
    images: [titaniumAerospace1, metalEtching1, metalEtching2],
    description: "Plate titanium grade aerospace dengan marking presisi untuk aplikasi high-tech dan industri dirgantara. Material ultra-ringan dengan kekuatan luar biasa.",
    features: [
      "Material: Titanium Grade 5",
      "Laser etching presisi",
      "Corrosion resistant",
      "Aerospace certified",
      "Ultra-lightweight"
    ],
    specifications: {
      material: "Titanium Grade 5 (Ti-6Al-4V)",
      thickness: "0.8mm - 2mm",
      minOrder: "5 pcs",
      leadTime: "21-30 hari kerja"
    }
  },
  {
    id: "11",
    name: "Engraved Wine Glass Set",
    type: "glass",
    category: "decorative",
    rating: 4.5,
    images: [wineGlassSet1, glassEtching1, glassEtching2],
    description: "Set gelas wine dengan etching monogram elegan. Crystal clear dengan detail frosted sempurna untuk hadiah premium atau koleksi pribadi.",
    features: [
      "Set 4 atau 6 gelas",
      "Monogram custom etching",
      "Crystal clear glass",
      "Dishwasher safe",
      "Luxury gift box"
    ],
    specifications: {
      material: "Lead-free Crystal Glass",
      capacity: "350ml - 500ml",
      minOrder: "1 set (4 pcs)",
      leadTime: "10-14 hari kerja"
    }
  },
  {
    id: "12",
    name: "Excellence Award Crystal",
    type: "award",
    category: "corporate",
    price: "Rp 890.000",
    rating: 5,
    images: [crystalAward1, awardPlaque1, awardPlaque2],
    description: "Crystal award prestisius dengan etching 3D dan prismatic effect. Trophy eksklusif untuk penghargaan tertinggi dan pencapaian luar biasa.",
    features: [
      "3D etching technology",
      "Optical crystal premium",
      "Prismatic light effects",
      "Crystal clear base",
      "Velvet presentation case"
    ],
    specifications: {
      material: "Optical Crystal K9",
      height: "25cm - 35cm",
      minOrder: "1 pcs",
      leadTime: "14-21 hari kerja"
    }
  },
  {
    id: "13",
    name: "Brass Door Sign Custom",
    type: "metal",
    category: "decorative",
    rating: 4.5,
    images: [brassDoorSign1, metalEtching2, metalEtching1],
    description: "Papan nama pintu kuningan dengan border dekoratif ornamental dan teks custom. Finishing glossy yang tahan lama untuk interior dan eksterior.",
    features: [
      "Solid brass construction",
      "Ornamental border design",
      "Weather resistant coating",
      "Custom text engraving",
      "Mounting screws included"
    ],
    specifications: {
      material: "Solid Brass",
      size: "15cm x 10cm - 30cm x 20cm",
      minOrder: "1 pcs",
      leadTime: "7-10 hari kerja"
    }
  },
  {
    id: "14",
    name: "Decorative Mirror Frame",
    type: "glass",
    category: "decorative",
    price: "Rp 680.000",
    rating: 5,
    images: [mirrorFrame1, glassEtching2, glassEtching3],
    description: "Frame cermin dengan pola etching art deco geometris. Desain elegant untuk interior luxury dengan detail frosted yang presisi dan simetris.",
    features: [
      "Art deco design",
      "Precision geometric etching",
      "Beveled mirror edges",
      "Wall mounting ready",
      "Modern luxury style"
    ],
    specifications: {
      material: "Mirror Glass + Etched Border",
      size: "60cm x 80cm - 100cm x 150cm",
      minOrder: "1 pcs",
      leadTime: "21-30 hari kerja"
    }
  },
  {
    id: "15",
    name: "Retirement Commemoration Plaque",
    type: "award",
    category: "corporate",
    price: "Rp 580.000",
    rating: 5,
    images: [retirementPlaque1, awardPlaque2, awardPlaque1],
    description: "Plakat pensiun dengan foto etching dan teks personalisasi lengkap. Brass plate on premium wood base untuk menghormati dedikasi karir.",
    features: [
      "Photo etching capability",
      "Personalized text",
      "Premium wood base",
      "Brass nameplate",
      "Professional packaging"
    ],
    specifications: {
      material: "Brass Plate + Mahogany Base",
      size: "20cm x 25cm",
      minOrder: "1 pcs",
      leadTime: "14-21 hari kerja"
    }
  },
  {
    id: "16",
    name: "Stainless Control Panel",
    type: "metal",
    category: "industrial",
    price: "Rp 420.000",
    rating: 4.5,
    images: [controlPanel1, metalEtching3, metalEtching1],
    description: "Panel kontrol stainless dengan marking tombol dan instruksi teknis. Brushed finish dengan etching tahan lama untuk lingkungan industrial.",
    features: [
      "Stainless steel 316",
      "Button label etching",
      "UV & chemical resistant",
      "Custom layout design",
      "Industrial grade"
    ],
    specifications: {
      material: "Stainless Steel 316",
      thickness: "1.5mm - 3mm",
      minOrder: "10 pcs",
      leadTime: "14-21 hari kerja"
    }
  },
  {
    id: "17",
    name: "Bathroom Mirror Etched",
    type: "glass",
    category: "decorative",
    price: "Rp 1.500.000",
    rating: 5,
    images: [bathroomMirror1, glassEtching3, glassEtching1],
    description: "Cermin kamar mandi besar dengan border etching ornamental. Anti-fog coating dan LED backlight ready untuk luxury bathroom.",
    features: [
      "Large format mirror",
      "Ornamental border etching",
      "Anti-fog coating",
      "LED backlight compatible",
      "Professional installation"
    ],
    specifications: {
      material: "Mirror Glass 6mm + Etching",
      size: "100cm x 150cm - 150cm x 200cm",
      minOrder: "1 pcs",
      leadTime: "30-45 hari kerja"
    }
  },
  {
    id: "18",
    name: "Lifetime Achievement Trophy",
    type: "award",
    category: "corporate",
    price: "Rp 1.200.000",
    rating: 5,
    images: [lifetimeTrophy1, awardPlaque3, awardPlaque1],
    description: "Trophy prestasi seumur hidup dengan kombinasi premium metal, crystal glass, dan granite base. Ultimate recognition award dengan kemewahan maksimal.",
    features: [
      "Metal & crystal combination",
      "Granite base premium",
      "24K gold plating option",
      "3D logo etching",
      "Luxury wooden case"
    ],
    specifications: {
      material: "Bronze/Crystal + Granite",
      height: "40cm - 60cm",
      minOrder: "1 pcs",
      leadTime: "21-30 hari kerja"
    }
  },
];

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToCart } = useCart();
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const handleSubmitReview = async (review: { rating: number; comment: string }) => {
    // TODO: Replace with actual API call
    toast({
      title: "Ulasan Terkirim!",
      description: "Terima kasih telah memberikan ulasan Anda.",
    });
  };
  const searchParams = new URLSearchParams(window.location.search);
  const isPreview = searchParams.get('preview') === 'true';
  
  // Get draft data from sessionStorage if in preview mode
  const draftProduct = isPreview ? JSON.parse(sessionStorage.getItem('productDraft') || 'null') : null;
  const { product: cmsProduct, loading: loadingProduct } = useProductBySlug(slug || '');

  const hardcodedProduct = allProducts.find(p => 
    p.name.toLowerCase().replace(/\s+/g, '-') === slug
  );

  // Use draft data in preview mode, otherwise use normal product data
  // Get reviews for current product
  const { reviews: productReviews = [], loading: reviewsLoading } = useProductReviews(slug || '');
  
  const product = draftProduct || cmsProduct || (hardcodedProduct ? {
    id: hardcodedProduct.id,
    name: hardcodedProduct.name,
    slug: hardcodedProduct.name.toLowerCase().replace(/\s+/g, '-'),
    description: hardcodedProduct.description,
    longDescription: hardcodedProduct.features?.join('\n'),
    images: hardcodedProduct.images.map(img => {
      if (typeof img === 'string') {
        // Handle imported images vs string paths differently
        return img.startsWith('/') ? resolveImageUrl(img, { preview: isPreview }) : img;
      }
      return img;
    }),
    category: hardcodedProduct.category,
    tags: [hardcodedProduct.type],
    material: hardcodedProduct.specifications?.material || hardcodedProduct.type,
    price: hardcodedProduct.price ? parseInt(hardcodedProduct.price.replace(/\D/g, '')) : 0,
    currency: "IDR" as const,
    priceUnit: "per pcs",
    minOrder: hardcodedProduct.specifications?.minOrder ? parseInt(hardcodedProduct.specifications.minOrder.replace(/\D/g, '')) : 1,
    specifications: hardcodedProduct.features?.map(f => ({ key: f.split(':')[0], value: f.split(':')[1]?.trim() || f })) || [],
    customizable: true,
    inStock: true,
    leadTime: hardcodedProduct.specifications?.leadTime || "5-7 hari kerja",
    status: 'published' as const,
    featured: hardcodedProduct.rating >= 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } : null);
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
          <Button onClick={() => navigate("/products")}>
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

  const handleOrder = () => {
    if (!formData.name || !formData.phone || !formData.quantity || !formData.bahan || !formData.kualitas || !formData.warna || !formData.notes) {
      toast({
        title: "Form Belum Lengkap",
        description: "Mohon lengkapi semua field yang wajib diisi (Nama, Telepon, Jumlah, Bahan, Kualitas, Warna, dan Catatan Tambahan).",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Pesanan Diterima!",
      description: "Tim kami akan segera menghubungi Anda untuk konfirmasi.",
    });
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
      image: typeof product.images[0] === 'string' ? resolveImageUrl(product.images[0], { preview: isPreview }) : product.images[0],
      type: formData.productType,
      size: formData.size,
      material: formData.bahan,
    });
  };

  // Get related products based on same category/type
  const relatedProducts = allProducts
    .filter(p => 
      p.id !== product.id && // Exclude current product
      (p.category === product.category || p.type === product.type) // Same category or type
    )
    .slice(0, 3); // Limit to 3 related products

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
                    {product.images.map((image, index) => {
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
                onClick={() => open360View(resolveImageUrl(product.images[0], { preview: isPreview }))}
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold shadow-lg"
              >
                <Rotate3D className="w-5 h-5 mr-2" />
                Lihat 360°
              </Button>

              {/* Image Magnifier Dialog */}
              <Dialog open={!!magnifiedImage} onOpenChange={() => setMagnifiedImage(null)}>
                <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
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
                <div className="flex items-center gap-2 mb-3">
                  {[...Array(5)].map((_, idx) => (
                    <Star
                      key={idx}
                      className={`w-5 h-5 ${
                        idx < Math.floor(averageRating)
                          ? "fill-primary text-primary"
                          : "text-muted"
                      }`}
                    />
                  ))}
                  <span className="text-sm text-muted-foreground">({averageRating.toFixed(1)})</span>
                </div>

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
                    <Select value={formData.productType} onValueChange={(value) => handleInputChange("productType", value)}>
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue placeholder="Pilih tipe produk" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="metal">Etching Logam</SelectItem>
                        <SelectItem value="glass">Etching Kaca</SelectItem>
                        <SelectItem value="award">Plakat Penghargaan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="size" className="text-foreground">Ukuran *</Label>
                    <Select value={formData.size} onValueChange={(value) => handleInputChange("size", value)}>
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue placeholder="Pilih ukuran" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="10x15">10cm x 15cm</SelectItem>
                        <SelectItem value="15x20">15cm x 20cm (Rekomendasi)</SelectItem>
                        <SelectItem value="20x30">20cm x 30cm</SelectItem>
                        <SelectItem value="30x40">30cm x 40cm</SelectItem>
                        <SelectItem value="custom">Custom Size</SelectItem>
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
                        <SelectItem value="akrilik">Akrilik</SelectItem>
                        <SelectItem value="kuningan">Kuningan</SelectItem>
                        <SelectItem value="tembaga">Tembaga</SelectItem>
                        <SelectItem value="stainless-steel">Stainless Steel</SelectItem>
                        <SelectItem value="aluminum">Aluminum</SelectItem>
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
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="tinggi">Tinggi</SelectItem>
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
                      className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg"
                    >
                      Pesan Sekarang
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
                  <Select value={reviewSort} onValueChange={(value) => setReviewSort(value as any)}>
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
                    <div className="flex items-center justify-center md:justify-start gap-1 mb-2">
                      {[...Array(5)].map((_, idx) => (
                        <Star
                          key={idx}
                          className={`w-5 h-5 ${
                            idx < Math.floor(averageRating)
                              ? "fill-primary text-primary"
                              : "text-muted"
                          }`}
                        />
                      ))}
                    </div>
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
                            {review.userName.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-foreground">{review.userName}</h4>
                              {review.verified && (
                                <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                  <Check className="w-3 h-3" />
                                  Terverifikasi
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex gap-0.5">
                                {[...Array(5)].map((_, starIdx) => (
                                  <Star
                                    key={starIdx}
                                    className={`w-4 h-4 ${
                                      starIdx < review.rating
                                        ? "fill-primary text-primary"
                                        : "text-muted"
                                    }`}
                                  />
                                ))}
                              </div>
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
                  {relatedProducts.map((relatedProduct) => (
                    <Card
                      key={relatedProduct.id}
                      className="group cursor-pointer overflow-hidden border-border hover:border-primary transition-all duration-300 hover:shadow-lg"
                      onClick={() => navigate(`/products/${relatedProduct.id}`)}
                    >
                      <div className="aspect-video relative overflow-hidden bg-muted">
                        <img
                          src={resolveImageUrl(relatedProduct.images[0], { preview: isPreview })}
                          alt={relatedProduct.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                      <div className="p-4">
                        <h4 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                          {relatedProduct.name}
                        </h4>
                        <div className="flex items-center gap-1 mb-2">
                          {[...Array(5)].map((_, idx) => (
                            <Star
                              key={idx}
                              className={`w-3 h-3 ${
                                idx < Math.floor(relatedProduct.rating)
                                  ? "fill-primary text-primary"
                                  : "text-muted"
                              }`}
                            />
                          ))}
                          <span className="text-xs text-muted-foreground ml-1">
                            ({relatedProduct.rating})
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {relatedProduct.description}
                        </p>
                        <Button
                          size="sm"
                          className="w-full mt-3 bg-primary hover:bg-primary/90"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/products/${relatedProduct.id}`);
                          }}
                        >
                          Lihat Detail
                        </Button>
                      </div>
                    </Card>
                  ))}

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
      <Footer />

      {/* Review Modal */}
      <Modal
        open={reviewModalOpen}
        onOpenChange={setReviewModalOpen}
        title="Tulis Ulasan"
        submitLabel="Kirim Ulasan"
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