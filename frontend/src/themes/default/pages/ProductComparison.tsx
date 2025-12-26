import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductComparison } from '@/contexts/ProductComparisonContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trash2, ShoppingCart, Check, X } from 'lucide-react';
import { resolveImageUrl } from '@/utils/imageUtils';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import { Product } from '@/types/product';

const ProductComparison = () => {
  const navigate = useNavigate();
  const { comparedProducts, removeFromCompare, clearComparison } = useProductComparison();
  const { addToCart } = useCart();

  if (comparedProducts.length === 0) {
    return (
      <div className="min-h-screen bg-[#0f172a]">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <Card className="max-w-md mx-auto bg-[#1e293b] border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Tidak Ada Produk untuk Dibandingkan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 mb-4">
                Anda belum menambahkan produk untuk dibandingkan.
              </p>
              <Button onClick={() => navigate(-1)} className="bg-primary hover:bg-primary/90">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Produk
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const formatPrice = (price: number, currency: string): string => {
    if (!currency || currency.trim() === '') {
      currency = 'IDR';
    }
    
    try {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(price);
    } catch (error) {
      return `Rp ${new Intl.NumberFormat('id-ID').format(price)}`;
    }
  };

  // Specification rows to compare
  const specs = [
    { 
      key: 'price', 
      label: 'Harga', 
      format: (p: Product) => formatPrice(p.price, p.currency) 
    },
    { 
      key: 'category', 
      label: 'Kategori',
      format: (p: Product) => p.category || '-'
    },
    { 
      key: 'stockQuantity', 
      label: 'Stok', 
      format: (p: Product) => (p as any).inStock ? `${(p as any).stockQuantity} tersedia` : 'Habis' 
    },
    { 
      key: 'minOrder', 
      label: 'Min. Order', 
      format: (p: Product) => `${(p as any).minOrder || 1} ${(p as any).priceUnit || 'pcs'}` 
    },
    { 
      key: 'reviewSummary', 
      label: 'Rating', 
      format: (p: Product) => (p as any).reviewSummary 
        ? `${(p as any).reviewSummary.averageRating} ⭐ (${(p as any).reviewSummary.totalReviews} ulasan)` 
        : 'Belum ada ulasan' 
    },
    { 
      key: 'featured', 
      label: 'Unggulan', 
      format: (p: Product) => (p as any).featured 
        ? <Check className="w-5 h-5 text-green-500 mx-auto" /> 
        : <X className="w-5 h-5 text-slate-600 mx-auto" /> 
    },
  ];

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)}
              className="border-slate-600 text-white hover:bg-slate-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
            <h1 className="text-3xl font-bold text-white">
              Bandingkan Produk ({comparedProducts.length})
            </h1>
          </div>
          
          <Button
            variant="outline"
            onClick={() => {
              if (confirm('Hapus semua produk dari perbandingan?')) {
                clearComparison();
                navigate(-1);
              }
            }}
            className="border-red-600 text-red-500 hover:bg-red-600/10"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Hapus Semua
          </Button>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#1e293b]">
                <th className="sticky left-0 z-10 bg-[#1e293b] p-4 text-left font-semibold min-w-[200px] text-white border-r border-slate-700">
                  Spesifikasi
                </th>
                {comparedProducts.map((product) => (
                  <th key={product.id} className="p-4 min-w-[250px]">
                    <Card className="bg-[#0f172a] border-slate-700">
                      <CardContent className="p-4">
                        {/* Product Image */}
                        <div className="relative mb-4">
                          <img
                            src={resolveImageUrl(product.images?.[0] || '/placeholder.jpg')}
                            alt={product.name}
                            className="w-full h-48 object-cover rounded"
                          />
                          {(product as any).featured && (
                            <Badge className="absolute top-2 right-2 bg-primary">
                              Unggulan
                            </Badge>
                          )}
                        </div>

                        {/* Product Name */}
                        <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-white">
                          {product.name}
                        </h3>

                        {/* Quick Actions */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-primary hover:bg-primary/90"
                            onClick={() => {
                              addToCart({
                                id: product.id,
                                name: product.name,
                                price: product.price,
                                image: product.images?.[0] || '/placeholder.jpg',
                              });
                            }}
                          >
                            <ShoppingCart className="w-4 h-4 mr-1" />
                            Tambah
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeFromCompare(product.id)}
                            className="border-slate-600 text-slate-300 hover:bg-slate-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {/* Specifications */}
              {specs.map((spec, idx) => (
                <tr key={spec.key} className={idx % 2 === 0 ? 'bg-[#0f172a]' : 'bg-[#1e293b]/30'}>
                  <td className="sticky left-0 z-10 bg-inherit p-4 font-medium border-r border-slate-700 text-white">
                    {spec.label}
                  </td>
                  {comparedProducts.map((product) => {
                    const value = spec.format 
                      ? spec.format(product) 
                      : (product as any)[spec.key] || '-';
                    
                    return (
                      <td key={product.id} className="p-4 text-center text-slate-300">
                        {value}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Description */}
              <tr className="bg-[#0f172a]">
                <td className="sticky left-0 z-10 bg-[#0f172a] p-4 font-medium border-r border-slate-700 text-white">
                  Deskripsi
                </td>
                {comparedProducts.map((product) => (
                  <td key={product.id} className="p-4">
                    <p className="text-sm text-slate-300 line-clamp-3">
                      {product.description}
                    </p>
                  </td>
                ))}
              </tr>

              {/* Actions Row */}
              <tr className="bg-[#1e293b]">
                <td className="sticky left-0 z-10 bg-[#1e293b] p-4 font-medium text-white">
                  Aksi
                </td>
                {comparedProducts.map((product) => (
                  <td key={product.id} className="p-4">
                    <div className="flex flex-col gap-2">
                      <Button
                        className="w-full bg-primary hover:bg-primary/90"
                        onClick={() => navigate(`/products/${product.slug}`)}
                      >
                        Lihat Detail
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                        onClick={() => {
                          addToCart({
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            image: product.images?.[0] || '/placeholder.jpg',
                          });
                          toast.success(`${product.name} ditambahkan ke keranjang`);
                        }}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Tambah ke Keranjang
                      </Button>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bottom Actions */}
        <div className="mt-8 flex justify-center gap-4">
          <Button 
            onClick={() => navigate(-1)}
            className="bg-primary hover:bg-primary/90"
          >
            Jelajahi Produk Lainnya
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              clearComparison();
              navigate(-1);
            }}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Hapus & Mulai Lagi
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProductComparison;
