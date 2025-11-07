import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, 
  Award, 
  MapPin, 
  Target, 
  Zap, 
  Layers, 
  Palette, 
  CheckCircle2, 
  ClipboardCheck, 
  Package,
  Shield,
  MessageSquare
} from "lucide-react";
import { useTheme } from '@/core/engine/ThemeContext';
import type { PageProps } from '@/core/engine/types';
import { TypingEffect } from "@/components/TypingEffect";

const Home: React.FC<PageProps> = ({ className }) => {
  const { currentTheme } = useTheme();
  const { Header, Footer, HeroCarousel } = currentTheme?.components ?? {};

  if (!Header || !Footer || !HeroCarousel) {
    return <div>Loading theme components...</div>;
  }

  return (
    <div className={`min-h-screen ${className || ''}`}>
      <Header />
      
      {/* Hero Section with Carousel */}
      <section className="relative h-screen min-h-[600px] flex items-center justify-center px-4 overflow-hidden">
        <HeroCarousel />
        
        <div className="container mx-auto text-center max-w-4xl relative z-10">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in text-white">
            <TypingEffect 
              texts={[
                "Presisi Artistik, Kualitas Teruji",
                "Solusi Cetak Terbaik untuk Anda",
                "Teknologi Modern, Hasil Sempurna",
                "Wujudkan Desain Impian Anda"
              ]}
              typingSpeed={80}
              deletingSpeed={40}
              delayBetweenTexts={3000}
            />
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-slate-300 mb-8 animate-fade-in-up max-w-3xl mx-auto" style={{ animationDelay: "0.2s" }}>
            Menghadirkan layanan etching presisi tinggi untuk kebutuhan industri dan personal. 
            Dari plakat penghargaan hingga komponen mesin, kami wujudkan detail impian Anda.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <Button size="lg" className="bg-gradient-to-r from-primary to-orange-light text-white text-lg px-8 hover:shadow-glow transition-all">
              Lihat Layanan Kami
            </Button>
            <Button size="lg" variant="outline" className="border-2 border-white/20 bg-white/5 backdrop-blur-sm text-white hover:bg-white/10 text-lg px-8 transition-all">
              Hubungi Konsultan
            </Button>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Dipercaya oleh <span className="text-primary">Para Profesional dan Kreator</span>
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Lebih dari 2000+ proyek telah diselesaikan dengan kepuasan klien mencapai 99%
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Users, value: "2000+", label: "Proyek Selesai", color: "text-blue-500" },
              { icon: Target, value: "500+", label: "Klien Puas", color: "text-green-500" },
              { icon: Award, value: "10+", label: "Tahun Pengalaman", color: "text-purple-500" },
              { icon: CheckCircle2, value: "99%", label: "Tingkat Presisi", color: "text-primary" },
            ].map((stat, i) => (
              <Card 
                key={i} 
                className="p-6 text-center bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-scale-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-${stat.color} to-${stat.color}/50 flex items-center justify-center`}>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
                <div className="text-4xl font-bold mb-2 text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Layanan <span className="text-primary">Unggulan Kami</span>
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Menghadirkan berbagai layanan etching berkualitas tinggi untuk kebutuhan personal dan industri
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Package,
                title: "Etching Industri",
                description: "Layanan etching presisi tinggi untuk komponen industri dan manufaktur"
              },
              {
                icon: Award,
                title: "Plakat & Trophy",
                description: "Desain dan produksi plakat penghargaan dengan detail menakjubkan"
              },
              {
                icon: Shield,
                title: "Label Keamanan",
                description: "Label dan segel keamanan dengan fitur anti-pemalsuan"
              },
              {
                icon: Palette,
                title: "Etching Dekoratif",
                description: "Sentuhan artistik untuk dekorasi interior dan eksterior"
              },
              {
                icon: Layers,
                title: "PCB Prototyping",
                description: "Layanan prototyping PCB dengan ketepatan tinggi"
              },
              {
                icon: MessageSquare,
                title: "Konsultasi Desain",
                description: "Bantuan profesional untuk mewujudkan desain impian Anda"
              }
            ].map((service, i) => (
              <Card 
                key={i}
                className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <service.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                <p className="text-muted-foreground">{service.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-[#f59e0b] to-[#f97316] text-white relative overflow-hidden">
        <div className="container mx-auto relative z-10 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Siap Mewujudkan Proyek Anda?
            </h2>
            <p className="text-lg md:text-xl text-white/90">
              Diskusikan kebutuhan Anda dengan tim kami dan dapatkan penawaran gratis hari ini
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6 text-center">
              <div className="text-4xl font-bold mb-2 text-white">1000+</div>
              <div className="text-white/90">Products</div>
            </Card>
            <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6 text-center">
              <div className="text-4xl font-bold mb-2 text-white">15+</div>
              <div className="text-white/90">Tahun Pengalaman</div>
            </Card>
            <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6 text-center">
              <div className="text-4xl font-bold mb-2 text-white">98%</div>
              <div className="text-white/90">Tingkat Kepuasan</div>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-[#475569] hover:bg-[#334155] text-white text-lg px-8 shadow-xl transition-all">
              <MessageSquare className="mr-2 h-5 w-5" />
              Hubungi Kami
            </Button>
            <Button size="lg" variant="outline" className="border-2 border-[#fbbf24] bg-transparent text-white hover:bg-white/10 text-lg px-8 shadow-xl transition-all">
              Lihat Produk Kami
              <Target className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ/Contact Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-[#d97706] to-[#ea580c]">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1 text-white">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Punya Pertanyaan atau Siap Memulai?
              </h2>
              <p className="text-lg text-white/90">
                Tim ahli kami siap membantu Anda menemukan solusi terbaik untuk kebutuhan etching Anda
              </p>
            </div>
            <div className="flex-shrink-0">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-[#f59e0b] to-[#f97316] hover:bg-gradient-to-r hover:from-[#f59e0b]/90 hover:to-[#f97316]/90 text-white px-8 text-lg shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all"
              >
                Hubungi Tim Kami
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-4 bg-muted">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Siap Memulai <span className="text-primary">Proyek Anda?</span>
              </h2>
              <p className="text-muted-foreground mb-6">
                Hubungi tim kami untuk konsultasi gratis dan penawaran khusus untuk proyek Anda
              </p>
              
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input placeholder="Nama Lengkap" />
                  <Input type="email" placeholder="Email" />
                </div>
                <Input placeholder="Subjek" />
                <Textarea 
                  placeholder="Pesan Anda" 
                  className="min-h-[150px]"
                />
                <Button className="w-full md:w-auto">
                  Kirim Pesan
                </Button>
              </form>
            </div>
            
            <div className="lg:pl-12">
              <Card className="p-8 bg-card">
                <h3 className="text-2xl font-bold mb-6">Informasi Kontak</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <MapPin className="h-6 w-6 text-primary mt-1" />
                    <div>
                      <p className="font-semibold">Alamat</p>
                      <p className="text-muted-foreground">
                        Jl. Industri Raya No. 123<br />
                        Jakarta Pusat, 10150
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <MessageSquare className="h-6 w-6 text-primary mt-1" />
                    <div>
                      <p className="font-semibold">Email & Telepon</p>
                      <p className="text-muted-foreground">
                        info@etching.id<br />
                        +62 21 1234 5678
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;