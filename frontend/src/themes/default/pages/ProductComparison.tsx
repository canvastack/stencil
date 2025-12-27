import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductComparison } from '@/contexts/ProductComparisonContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trash2, ShoppingCart, Check, X, Download, Share2, Copy } from 'lucide-react';
import { resolveImageUrl } from '@/utils/imageUtils';
import { useCart } from '@/contexts/CartContext';
import { useTheme } from '@/core/engine/ThemeContext';
import { toast } from 'sonner';
import { Product } from '@/types/product';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ProductComparison = () => {
  const { currentTheme } = useTheme();
  const { Header, Footer } = currentTheme?.components ?? {};
  const navigate = useNavigate();
  const { comparedProducts, removeFromCompare, clearComparison } = useProductComparison();
  const { addToCart } = useCart();

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF('l', 'mm', 'a4');
      
      doc.setFontSize(18);
      doc.text('Perbandingan Produk', 14, 15);
      
      doc.setFontSize(10);
      doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 14, 22);
      doc.text(`Total Produk: ${comparedProducts.length}`, 14, 27);

      const tableData: any[] = [];
      
      tableData.push([
        'Spesifikasi',
        ...comparedProducts.map(p => p.name)
      ]);
      
      specs.forEach(spec => {
        const row = [
          spec.label,
          ...comparedProducts.map(product => {
            const value = spec.format ? spec.format(product) : (product as any)[spec.key] || '-';
            if (typeof value === 'string') return value;
            if (spec.key === 'featured') return (product as any).featured ? 'Ya' : 'Tidak';
            return String(value);
          })
        ];
        tableData.push(row);
      });

      tableData.push([
        'Deskripsi',
        ...comparedProducts.map(p => p.description || '-')
      ]);

      autoTable(doc, {
        head: [tableData[0]],
        body: tableData.slice(1),
        startY: 32,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
      });

      doc.save(`perbandingan-produk-${Date.now()}.pdf`);
      toast.success('PDF berhasil diunduh');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Gagal mengekspor PDF');
    }
  };

  const handleShare = async () => {
    try {
      const productIds = comparedProducts.map(p => p.id).join(',');
      const shareUrl = `${window.location.origin}/comparison?products=${productIds}`;
      
      if (navigator.share) {
        await navigator.share({
          title: 'Perbandingan Produk',
          text: `Bandingkan ${comparedProducts.length} produk di CanvaStencil`,
          url: shareUrl,
        });
        toast.success('Berhasil dibagikan');
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link perbandingan disalin ke clipboard');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      if ((error as Error).name !== 'AbortError') {
        const productIds = comparedProducts.map(p => p.id).join(',');
        const shareUrl = `${window.location.origin}/comparison?products=${productIds}`;
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link perbandingan disalin ke clipboard');
      }
    }
  };

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
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button 
            onClick={handleExportPDF}
            className="bg-green-600 hover:bg-green-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Ekspor ke PDF
          </Button>
          <Button
            onClick={handleShare}
            variant="outline"
            className="border-blue-600 text-blue-400 hover:bg-blue-600/10"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Bagikan Perbandingan
          </Button>
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
