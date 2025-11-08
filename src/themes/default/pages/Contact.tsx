import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Mail, Phone, Clock, Users, Award, Target, CheckCircle2, MessageSquare } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { usePageContent } from "@/contexts/ContentContext";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  MapPin,
  Mail,
  Phone,
  Clock,
  Users,
  Award,
  Target,
  CheckCircle2,
  MessageSquare
};

const Contact = () => {
  const { content, loading } = usePageContent("contact");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading content...</p>
        </div>
      </div>
    );
  }

  if (!content?.content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Failed to load page content</p>
        </div>
      </div>
    );
  }

  const pageData = content.content;

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden bg-[#0f172a]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] via-[#0f172a] to-[#1e293b] -z-10" />
        
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in text-white">
            {pageData.hero?.title || "Hubungi Kami"}
          </h1>
          <p className="text-lg md:text-xl text-slate-300 animate-fade-in-up">
            {pageData.hero?.subtitle || ""}
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
              {pageData.contactInfo?.enabled && (
                <Card className="p-6">
                  <h3 className="text-xl font-bold mb-4">Informasi Kontak</h3>
                  <div className="space-y-4">
                    {(pageData.contactInfo?.items || []).map((item: any, i: number) => {
                      const IconComponent = iconMap[item.icon] || MapPin;
                      return (
                        <div key={i} className="flex items-start space-x-3">
                          <IconComponent className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                          <div>
                            <p className="font-medium">{item.title}</p>
                            <p className="text-sm text-muted-foreground whitespace-pre-line">
                              {item.content}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* Map Placeholder */}
              {pageData.map?.enabled && (
                <Card className="p-6">
                  <h3 className="text-xl font-bold mb-4">{pageData.map?.title || "Lokasi Kami"}</h3>
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="h-12 w-12 text-primary mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Peta Lokasi Workshop</p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      {pageData.achievements?.enabled && (
        <section className="py-16 px-4 bg-muted/50">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-4">
              {pageData.achievements?.title || "Pencapaian Kami"}
            </h2>
            <p className="text-center text-muted-foreground mb-12">
              {pageData.achievements?.subtitle || ""}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {(pageData.achievements?.items || []).map((stat: any, i: number) => {
                const IconComponent = iconMap[stat.icon] || CheckCircle2;
                return (
                  <Card key={i} className="p-6 text-center hover:shadow-lg transition-all">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                      <IconComponent className={`h-8 w-8 ${stat.color}`} />
                    </div>
                    <div className="text-4xl font-bold mb-2 text-primary">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Us Section */}
      {pageData.whyChooseUs?.enabled && (
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">
              {pageData.whyChooseUs?.title || "Mengapa Memilih Kami?"}
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              {(pageData.whyChooseUs?.items || []).map((feature: any, i: number) => (
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
      )}

      {/* CTA Sections */}
      {(pageData.cta || []).map((ctaSection: any, index: number) => {
        const isPrimary = ctaSection.type === 'primary';
        return (
          <section 
            key={index}
            className={`py-20 px-4 ${isPrimary ? 'bg-gradient-to-r from-[#f59e0b] to-[#f97316]' : 'bg-gradient-to-r from-[#d97706] to-[#ea580c]'} text-white relative overflow-hidden`}
          >
            <div className="container mx-auto relative z-10 max-w-6xl">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-5xl font-bold mb-4">
                  {ctaSection.title}
                </h2>
                <p className="text-lg md:text-xl text-white/90">
                  {ctaSection.subtitle}
                </p>
              </div>

              {ctaSection.stats && ctaSection.stats.length > 0 && (
                <div className={`grid grid-cols-1 md:grid-cols-${Math.min(ctaSection.stats.length, 3)} gap-6 mb-12`}>
                  {ctaSection.stats.map((stat: any, i: number) => (
                    <div key={i} className="text-center">
                      <div className="text-4xl md:text-5xl font-bold mb-2 text-white">{stat.value}</div>
                      <div className="text-white/90">{stat.label}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {(ctaSection.buttons || []).map((button: any, i: number) => (
                  <Button 
                    key={i}
                    size="lg" 
                    variant={button.variant === 'outline' ? 'outline' : 'default'}
                    className={
                      button.variant === 'outline' 
                        ? 'border-2 border-white/50 bg-transparent text-white hover:bg-white/10 text-lg px-8 shadow-xl transition-all'
                        : 'bg-slate-700 hover:bg-slate-800 text-white text-lg px-8 shadow-xl transition-all'
                    }
                    onClick={() => window.location.href = button.link || "#"}
                  >
                    {button.text}
                  </Button>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      <Footer />
    </div>
  );
};

export default Contact;
