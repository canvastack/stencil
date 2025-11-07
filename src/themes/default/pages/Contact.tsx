import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Mail, Phone, Clock, Users, Award, Target, CheckCircle2, MessageSquare } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Contact = () => {
  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden bg-[#0f172a]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] via-[#0f172a] to-[#1e293b] -z-10" />
        
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in text-white">
            Hubungi <span className="text-[#f59e0b]">Kami</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 animate-fade-in-up">
            Tim ahli kami siap membantu Anda menemukan solusi terbaik untuk kebutuhan etching Anda.
          </p>
        </div>
      </section>

      {/* Main Contact Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-6">Kirim Pesan Anda</h2>
              <form className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <Input id="name" placeholder="Nama Lengkap" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email / Nomor WhatsApp</Label>
                    <Input id="email" placeholder="Email / Nomor WhatsApp" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Saya tertarik dengan:</Label>
                  <Select>
                    <SelectTrigger id="subject">
                      <SelectValue placeholder="Pilih Layanan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="etching-logam">Etching Logam</SelectItem>
                      <SelectItem value="etching-kaca">Etching Kaca</SelectItem>
                      <SelectItem value="plakat">Plakat Penghargaan</SelectItem>
                      <SelectItem value="signage">Signage Custom</SelectItem>
                      <SelectItem value="industri">Komponen Industri</SelectItem>
                      <SelectItem value="lainnya">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Pesan</Label>
                  <Textarea 
                    id="message" 
                    placeholder="Ceritakan tentang proyek atau kebutuhan Anda..." 
                    className="min-h-32"
                  />
                </div>

                <Button className="w-full bg-gradient-to-r from-primary to-orange-light text-white text-lg py-6">
                  ✉ Kirim Pesan Anda
                </Button>
              </form>
            </Card>

            {/* Contact Information */}
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">Informasi Kontak</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Alamat Workshop</p>
                      <p className="text-sm text-muted-foreground">
                        Jl. Industri No. 123, Kawasan Industri Pulogadung<br />
                        Jakarta Timur, DKI Jakarta 13260
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Mail className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Email</p>
                      <a href="mailto:info@etchingpresisi.com" className="text-sm text-primary hover:underline">
                        info@etchingpresisi.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Phone className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Telepon / WhatsApp</p>
                      <a href="tel:+6282112345678" className="text-sm text-primary hover:underline">
                        +62 821-1234-5678
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Jam Operasional</p>
                      <p className="text-sm text-muted-foreground">
                        Senin - Jumat: 08:00 - 17:00 WIB<br />
                        Sabtu: 08:00 - 13:00 WIB<br />
                        Minggu: Tutup
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Map Placeholder */}
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">Lokasi Kami</h3>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Peta Lokasi Workshop</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-4">Pencapaian Kami</h2>
          <p className="text-center text-muted-foreground mb-12">
            Kepercayaan yang telah diberikan selama bertahun-tahun
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Users, value: "2000+", label: "Proyek Selesai", color: "text-blue-500" },
              { icon: Award, value: "10+", label: "Tahun Pengalaman", color: "text-green-500" },
              { icon: Target, value: "500+", label: "Klien Puas", color: "text-purple-500" },
              { icon: CheckCircle2, value: "99%", label: "Tingkat Presisi", color: "text-primary" },
            ].map((stat, i) => (
              <Card key={i} className="p-6 text-center hover:shadow-lg transition-all">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
                <div className="text-4xl font-bold mb-2 text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Mengapa Memilih <span className="text-primary">Kami?</span>
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Kualitas Terjamin",
                description: "Semua produk telah melalui quality control ketat dan memiliki sertifikasi resmi dari lembaga terpercaya.",
              },
              {
                title: "Tim Ahli Berpengalaman",
                description: "Didukung oleh tim ahli akuakultur dengan pengalaman puluhan tahun di industri perikanan.",
              },
              {
                title: "Layanan Prima",
                description: "Konsultasi gratis, dukungan teknis 24/7, dan garansi kepuasan untuk semua pelanggan.",
              },
            ].map((feature, i) => (
              <Card key={i} className="p-6 text-center hover:shadow-lg transition-all">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Siap Mewujudkan */}
      <section className="py-20 px-4 bg-gradient-to-r from-[#f59e0b] to-[#f97316] text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Siap Mewujudkan Proyek Anda?
            </h2>
            <p className="text-lg md:text-xl text-white/90">
              Diskusikan kebutuhan Anda dengan tim kami dan dapatkan penawaran gratis hari ini.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2 text-white">1000+</div>
              <div className="text-white/90">Products</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2 text-white">15+</div>
              <div className="text-white/90">Tahun Pengalaman</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2 text-white">98%</div>
              <div className="text-white/90">Tingkat Kepuasan</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button 
              size="lg" 
              className="bg-[#475569] hover:bg-[#475569]/90 text-white text-lg px-8 gap-2"
            >
              <MessageSquare className="h-5 w-5" />
              Hubungi Kami
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-2 border-[#fbbf24] bg-transparent text-white hover:bg-white/10 text-lg px-8 gap-2"
            >
              Lihat Produk Kami
              <Target className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section - Punya Pertanyaan */}
      <section className="py-20 px-4 bg-gradient-to-r from-[#d97706] to-[#ea580c] text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Punya Pertanyaan atau Siap Memulai?
              </h2>
              <p className="text-lg md:text-xl text-white/90">
                Tim ahli kami siap membantu Anda menemukan solusi terbaik untuk kebutuhan etching Anda
              </p>
            </div>
            <div className="flex-shrink-0">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-[#f59e0b] to-[#f97316] hover:from-[#f59e0b]/90 hover:to-[#f97316]/90 text-white text-lg px-8 backdrop-blur-sm hover:backdrop-blur-md transition-all"
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

export default Contact;
