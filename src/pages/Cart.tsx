import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { ShoppingBag, Trash2, Plus, Minus, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const Cart = () => {
  const { items, removeFromCart, updateQuantity, getTotalItems, getTotalPrice, clearCart } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });

  const handleQuantityChange = (id: string, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    if (newQty > 0) {
      updateQuantity(id, newQty);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleCheckout = () => {
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
      toast.error("Mohon lengkapi informasi pengiriman");
      return;
    }

    // Generate WhatsApp message
    let message = `*PESANAN BARU*\n\n`;
    message += `Nama: ${customerInfo.name}\n`;
    message += `Telepon: ${customerInfo.phone}\n`;
    message += `Email: ${customerInfo.email || '-'}\n`;
    message += `Alamat: ${customerInfo.address}\n\n`;
    message += `*DETAIL PESANAN:*\n`;
    
    items.forEach((item, index) => {
      message += `\n${index + 1}. ${item.name}\n`;
      message += `   Jumlah: ${item.quantity} pcs\n`;
      message += `   Harga: ${formatPrice(item.price)}\n`;
      if (item.material) message += `   Bahan: ${item.material}\n`;
      if (item.size) message += `   Ukuran: ${item.size}\n`;
      message += `   Subtotal: ${formatPrice(item.price * item.quantity)}\n`;
    });
    
    message += `\n*TOTAL: ${formatPrice(getTotalPrice())}*\n`;
    if (customerInfo.notes) {
      message += `\nCatatan: ${customerInfo.notes}`;
    }

    const whatsappUrl = `https://wa.me/62812345678?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
    
    toast.success("Pesanan dikirim ke WhatsApp!");
    clearCart();
    setShowCheckout(false);
    setCustomerInfo({ name: "", email: "", phone: "", address: "", notes: "" });
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center pt-32 pb-12 px-4">
          <div className="text-center max-w-md">
            <ShoppingBag className="w-24 h-24 mx-auto mb-6 text-muted-foreground/30" />
            <h2 className="text-3xl font-bold text-foreground mb-3">Keranjang Kosong</h2>
            <p className="text-muted-foreground mb-8">
              Belum ada produk di keranjang. Yuk mulai belanja!
            </p>
            <Button asChild size="lg">
              <Link to="/products">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Lihat Produk
              </Link>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="pt-32 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Keranjang Belanja</h1>
            <p className="text-muted-foreground">
              {getTotalItems()} produk dalam keranjang
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.id} className="p-6 border-border">
                  <div className="flex gap-6">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-32 h-32 object-cover rounded-lg border border-border"
                    />
                    
                    <div className="flex-1 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold text-foreground">{item.name}</h3>
                          {item.material && (
                            <Badge variant="secondary" className="mt-2">
                              {item.material}
                            </Badge>
                          )}
                          {item.size && (
                            <Badge variant="outline" className="mt-2 ml-2">
                              {item.size}
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromCart(item.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                            className="h-8 w-8"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="text-lg font-semibold w-12 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                            className="h-8 w-8"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            {formatPrice(item.price)} x {item.quantity}
                          </p>
                          <p className="text-xl font-bold text-primary">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Summary & Checkout */}
            <div className="lg:col-span-1">
              <Card className="p-6 border-border sticky top-32">
                <h3 className="text-2xl font-bold text-foreground mb-6">Ringkasan Pesanan</h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal ({getTotalItems()} produk)</span>
                    <span className="font-semibold">{formatPrice(getTotalPrice())}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-xl font-bold text-foreground">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(getTotalPrice())}</span>
                  </div>
                </div>

                {!showCheckout ? (
                  <Button
                    onClick={() => setShowCheckout(true)}
                    className="w-full"
                    size="lg"
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Lanjut ke Checkout
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-foreground">Informasi Pengiriman</h4>
                    
                    <div>
                      <Label htmlFor="name">Nama Lengkap *</Label>
                      <Input
                        id="name"
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Nama lengkap"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">No. Telepon *</Label>
                      <Input
                        id="phone"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="08xxxxxxxxxx"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="email@example.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor="address">Alamat Pengiriman *</Label>
                      <Input
                        id="address"
                        value={customerInfo.address}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Alamat lengkap"
                      />
                    </div>

                    <div>
                      <Label htmlFor="notes">Catatan (Opsional)</Label>
                      <Input
                        id="notes"
                        value={customerInfo.notes}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Catatan tambahan"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowCheckout(false)}
                        className="flex-1"
                      >
                        Kembali
                      </Button>
                      <Button
                        onClick={handleCheckout}
                        className="flex-1"
                      >
                        Pesan via WhatsApp
                      </Button>
                    </div>
                  </div>
                )}

                <Button
                  variant="outline"
                  onClick={clearCart}
                  className="w-full mt-4"
                >
                  Kosongkan Keranjang
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Cart;
