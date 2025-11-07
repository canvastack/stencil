import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Target, Eye, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const About = () => {
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);

  const timeline = [
    { year: "2015", event: "Pendirian perusahaan dengan fokus etching logam" },
    { year: "2017", event: "Ekspansi layanan ke etching kaca dan akrilik" },
    { year: "2020", event: "Sertifikasi ISO 9001:2015" },
    { year: "2022", event: "Melayani 1000+ proyek dari seluruh Indonesia" },
    { year: "2024", event: "Penerima Desain Award untuk inovasi produk" },
  ];

  const team = [
    { name: "Ahmad Prasetyo", role: "Founder & CEO", image: "AP" },
    { name: "Sarah Wijaya", role: "Production Manager", image: "SW" },
    { name: "Budi Santoso", role: "Lead Designer", image: "BS" },
    { name: "Diana Putri", role: "Quality Control", image: "DP" },
  ];

  const nextTeam = () => {
    setCurrentTeamIndex((prev) => (prev + 1) % team.length);
  };

  const prevTeam = () => {
    setCurrentTeamIndex((prev) => (prev - 1 + team.length) % team.length);
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden bg-[#0f172a]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] via-[#0f172a] to-[#1e293b] -z-10" />
        
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in text-white">
            Tentang <span className="text-[#f59e0b]">Kami</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 animate-fade-in-up">
            Membangun Karya Seni Presisi Melalui Teknologi dan Dedikasi
          </p>
        </div>
      </section>

      {/* Vision & Mission Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Professional Image Placeholder */}
            <div className="relative">
              <div className="aspect-[4/5] rounded-2xl bg-gradient-to-br from-primary/20 to-lavender/20 flex items-center justify-center overflow-hidden">
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-orange-light flex items-center justify-center">
                      <span className="text-4xl font-bold text-white">EP</span>
                    </div>
                    <p className="text-muted-foreground">Profesional dan Berdedikasi</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <Card className="p-6 border-l-4 border-primary bg-primary/5">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Eye className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-primary">Visi Kami</h3>
                    <p className="text-muted-foreground">
                      Menjadi penyedia layanan etching terpercaya di Indonesia yang menghadirkan 
                      solusi presisi tinggi dengan teknologi terdepan untuk berbagai kebutuhan industri dan personal.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-l-4 border-primary bg-primary/5">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-primary">Misi Kami</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Menyediakan layanan etching dengan kualitas internasional</li>
                      <li>• Berinovasi dalam teknologi dan desain produk</li>
                      <li>• Membangun kemitraan jangka panjang dengan klien</li>
                      <li>• Mengintegrasikan teknologi digital untuk transparansi dan efisiensi</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Perjalanan <span className="text-primary">Kami</span>
          </h2>
          
          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-primary/20" />
            
            <div className="space-y-12">
              {timeline.map((item, i) => (
                <div 
                  key={i} 
                  className={`flex items-center ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
                >
                  <div className={`w-5/12 ${i % 2 === 0 ? 'text-right pr-8' : 'text-left pl-8'}`}>
                    <Card className="p-6 hover:shadow-lg transition-all inline-block">
                      <div className="text-2xl font-bold text-primary mb-2">{item.year}</div>
                      <p className="text-muted-foreground">{item.event}</p>
                    </Card>
                  </div>
                  <div className="w-2/12 flex justify-center">
                    <div className="w-4 h-4 rounded-full bg-primary ring-4 ring-background" />
                  </div>
                  <div className="w-5/12" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Tim <span className="text-primary">Kami</span>
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Dipimpin oleh para ahli berpengalaman di bidang etching
          </p>
          
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[0, 1, 2].map((offset) => {
                const index = (currentTeamIndex + offset) % team.length;
                return (
                  <Card key={offset} className="p-8 text-center">
                    <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-orange-light flex items-center justify-center text-white text-3xl font-bold">
                      {team[index].image}
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{team[index].name}</h3>
                    <p className="text-primary font-medium">{team[index].role}</p>
                  </Card>
                );
              })}
            </div>
            
            <div className="flex justify-center gap-4 mt-6">
              <Button
                variant="outline"
                size="icon"
                onClick={prevTeam}
                className="rounded-full"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={nextTeam}
                className="rounded-full"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
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

export default About;
