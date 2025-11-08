import { Link } from "react-router-dom";
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FooterProps } from "@/core/engine/interfaces";

const Footer: React.FC<FooterProps> = ({ className, showSocialLinks = true }) => {
  return (
    <footer className={`bg-card border-t border-border ${className || ''}`}>
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-orange-light rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">CEX</span>
              </div>
              <span className="text-lg font-bold">
                Etching <span className="text-primary">Xenial</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Platform layanan etching presisi tinggi untuk kebutuhan industri dan personal dengan teknologi terkini.
            </p>
            {showSocialLinks && (
              <div className="flex space-x-2">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Facebook className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Instagram className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Youtube className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Jelajahi</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
                  Beranda
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-muted-foreground hover:text-primary transition-colors">
                  Produk
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                  Kontak
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Layanan Kami</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Etching Logam</li>
              <li>Etching Kaca</li>
              <li>Plakat Penghargaan</li>
              <li>Signage Custom</li>
              <li>Komponen Industri</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Hubungi Kami</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  Jl. Industri No. 123, Jakarta Selatan
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                <a href="mailto:info@etchingpresisi.com" className="text-muted-foreground hover:text-primary">
                  info@etchingpresisi.com
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                <a href="tel:+6282112345678" className="text-muted-foreground hover:text-primary">
                  +62 821-1234-5678
                </a>
              </li>
            </ul>

            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">
                Dapatkan Info & Penawaran Terbaru
              </p>
              <div className="flex space-x-2">
                <Input
                  type="email"
                  placeholder="Email Anda"
                  className="h-9 text-sm"
                />
                <Button size="sm" className="bg-gradient-to-r from-primary to-orange-light text-white">
                  →
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-muted-foreground text-center md:text-left">
              © 2025 Etching Xenial. Powered by Technology. Semua Hak Dilindungi.
            </p>
            <div className="flex space-x-6 text-sm">
              <Link to="#" className="text-muted-foreground hover:text-primary">
                Kebijakan Privasi
              </Link>
              <Link to="#" className="text-muted-foreground hover:text-primary">
                Syarat & Ketentuan
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;