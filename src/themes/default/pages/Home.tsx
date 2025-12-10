import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  Award, 
  MapPin, 
  Target, 
  Zap, 
  Layers, 
  Palette, 
  CheckCircle2, 
  Package,
  Shield,
  MessageSquare,
  Sparkles,
  DollarSign,
  Clock,
  ShieldCheck,
  FileCheck,
  Cpu,
  Truck,
  TrendingUp,
  ClipboardCheck,
  Star,
  Quote
} from "lucide-react";
import { useTheme } from '@/core/engine/ThemeContext';
import type { PageProps } from '@/core/engine/types';
import { TypingEffect } from "@/components/TypingEffect";
import { usePageContent } from "@/hooks/usePageContent";
import { Helmet } from "react-helmet-async";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  Award,
  Target,
  Zap,
  CheckCircle2,
  Package,
  Shield,
  MessageSquare,
  Sparkles,
  Palette,
  DollarSign,
  Clock,
  ShieldCheck,
  FileCheck,
  Cpu,
  Truck,
  TrendingUp
};

const Home: React.FC<PageProps> = ({ className }) => {
  const { currentTheme } = useTheme();
  const { Header, Footer, HeroCarousel } = currentTheme?.components ?? {};
  const { pageContent, loading } = usePageContent();
  const navigate = useNavigate();

  // Default fallback content  
  const defaultHomeContent = {
    hero: {
      title: "Selamat Datang di Platform Etching Profesional",
      subtitle: "Layanan etching berkualitas tinggi untuk semua kebutuhan Anda"
    },
    features: [
      { title: "Kualitas Tinggi", description: "Presisi sempurna dalam setiap detail", icon: "CheckCircle2" },
      { title: "Pengalaman 15+ Tahun", description: "Trusted oleh ribuan pelanggan", icon: "Award" },
      { title: "Layanan Lengkap", description: "Metal, glass, dan plakat custom", icon: "Package" }
    ]
  };

  // Merge content dengan fallback yang robust
  const content = pageContent?.content ? pageContent : { content: defaultHomeContent };

  if (!Header || !Footer || !HeroCarousel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading theme components...</p>
        </div>
      </div>
    );
  }

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
  const seoData = pageData.seo || {};

  return (
    <div className={`min-h-screen ${className || ''}`}>
      <Helmet>
        <title>{seoData.title || "Home"}</title>
        <meta name="description" content={seoData.description || ""} />
        {seoData.keywords && (
          <meta name="keywords" content={Array.isArray(seoData.keywords) ? seoData.keywords.join(", ") : seoData.keywords} />
        )}
        {seoData.ogImage && <meta property="og:image" content={seoData.ogImage} />}
        <meta property="og:title" content={seoData.title || "Home"} />
        <meta property="og:description" content={seoData.description || ""} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoData.title || "Home"} />
        <meta name="twitter:description" content={seoData.description || ""} />
        {seoData.ogImage && <meta name="twitter:image" content={seoData.ogImage} />}
      </Helmet>
      <Header />
      
      {/* Hero Section with Carousel */}
      <section className="relative h-screen min-h-[600px] flex items-center justify-center px-4 overflow-hidden">
        <HeroCarousel content={content} />
        
        <div className="container mx-auto text-center max-w-4xl relative z-10">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in text-white">
            <TypingEffect 
              texts={pageData.hero?.title?.typing || pageData.hero?.texts || ['Build Your Business', 'Create Beautiful Websites', 'Grow Your Success']}
              typingSpeed={80}
              deletingSpeed={40}
              delayBetweenTexts={3000}
            />
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-slate-300 mb-8 animate-fade-in-up max-w-3xl mx-auto" style={{ animationDelay: "0.2s" }}>
            {pageData.hero?.subtitle || ""}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-primary to-orange-light text-white text-lg px-8 hover:shadow-glow transition-all"
              onClick={() => navigate(pageData.hero?.buttons?.primary?.link || "/")}
            >
              {pageData.hero?.buttons?.primary?.text || "Lihat Layanan Kami"}
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-white/20 bg-white/5 backdrop-blur-sm text-white hover:bg-white/10 text-lg px-8 transition-all"
              onClick={() => navigate(pageData.hero?.buttons?.secondary?.link || "/contact")}
            >
              {pageData.hero?.buttons?.secondary?.text || "Hubungi Konsultan"}
            </Button>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      {pageData.socialProof?.enabled && (
        <section className="py-16 px-4 bg-muted/50">
          <div className="container mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              {pageData.socialProof.title?.split(' ').slice(0, 2).join(' ')} <span className="text-primary">{pageData.socialProof.title?.split(' ').slice(2).join(' ')}</span>
            </h2>
            <p className="text-center text-muted-foreground mb-12">
              {pageData.socialProof.subtitle}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {pageData.socialProof.stats?.map((stat: any, i: number) => {
                const IconComponent = iconMap[stat.icon] || Users;
                return (
                  <Card 
                    key={i} 
                    className="p-6 text-center bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-scale-in"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-${stat.color} to-${stat.color}/50 flex items-center justify-center`}>
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



      {/* Process Section */}
      {pageData.process?.enabled && (
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              {pageData.process.title?.split(' ').slice(0, 3).join(' ')} <span className="text-primary">{pageData.process.title?.split(' ').slice(3).join(' ')}</span>
            </h2>
            <p className="text-center text-muted-foreground mb-12">
              {pageData.process.subtitle}
            </p>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {pageData.process.steps?.map((step: any, i: number) => {
                const IconComponent = iconMap[step.icon] || MessageSquare;
                return (
                  <Card key={i} className="p-6 text-center hover:shadow-lg transition-all">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </Card>
                );
              })}
            </div>
            
            {pageData.process.preview?.enabled && (
              <Card className="p-8 bg-gradient-to-r from-card to-muted border-2">
                <div className="flex flex-col md:flex-row items-center justify-between">
                  <div className="mb-4 md:mb-0">
                    <h3 className="text-xl font-bold mb-2">{pageData.process.preview.title}</h3>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {pageData.process.preview.features?.map((feature: string, i: number) => (
                        <li key={i}>• {feature}</li>
                      ))}
                    </ul>
                  </div>
                  <Button 
                    className="bg-gradient-to-r from-primary to-orange-light text-white px-8"
                    onClick={() => navigate(pageData.process.preview.button?.link || "/")}
                  >
                    {pageData.process.preview.button?.text}
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* Why Choose Us Section */}
      {pageData.whyChooseUs?.enabled && (
        <section className="py-16 px-4 bg-muted/50">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              {pageData.whyChooseUs.title?.split('?')[0].split(' ').slice(0, 2).join(' ')} <span className="text-primary">{pageData.whyChooseUs.title?.split('?')[0].split(' ').slice(2).join(' ')}?</span>
            </h2>
            <p className="text-center text-muted-foreground mb-12">
              {pageData.whyChooseUs.subtitle}
            </p>
            
            <div className="grid md:grid-cols-3 gap-8">
              {pageData.whyChooseUs.items?.map((feature: any, i: number) => {
                const IconComponent = iconMap[feature.icon] || Zap;
                return (
                  <Card key={i} className="p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                    <div className={`w-16 h-16 mb-4 rounded-lg bg-gradient-to-br from-${feature.color}-500/20 to-${feature.color}-500/10 flex items-center justify-center`}>
                      <IconComponent className={`h-8 w-8 text-${feature.color}-500`} />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}
      
      {/* Achievements Section */}
      {pageData.achievements?.enabled && (
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              {pageData.achievements.title?.split(' dan ')[0]} <span className="text-primary">{pageData.achievements.title?.split(' dan ')[1]}</span>
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {pageData.achievements.items?.map((item: any, i: number) => {
                const IconComponent = iconMap[item.icon] || Shield;
                const colorClass = item.color === 'blue' ? 'blue-500' : 'purple-500';
                return (
                  <Card key={i} className={`p-8 bg-gradient-to-br from-${colorClass}/10 to-${item.color === 'blue' ? 'purple' : 'pink'}-500/10 border-${colorClass}/20 hover:shadow-xl transition-all`}>
                    <div className="flex items-start space-x-4">
                      <div className={`w-16 h-16 rounded-lg bg-${colorClass}/20 flex items-center justify-center flex-shrink-0`}>
                        <IconComponent className={`h-8 w-8 text-${colorClass}`} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                        <p className="text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Services Section */}
      {pageData.services?.enabled && (
        <section className="py-20 px-4 bg-muted/50">
          <div className="container mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              {pageData.services.title?.split(' ').slice(0, 1).join(' ')} <span className="text-primary">{pageData.services.title?.split(' ').slice(1).join(' ')}</span>
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              {pageData.services.subtitle}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pageData.services.items?.map((service: any, i: number) => {
                const IconComponent = iconMap[service.icon] || Package;
                return (
                  <Card 
                    key={i}
                    className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in-up"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                    <p className="text-muted-foreground">{service.description}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {pageData.testimonials?.enabled && (
        <section className="py-20 px-4 bg-muted">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              {pageData.testimonials.title}
            </h2>
            <p className="text-center text-muted-foreground mb-12">
              {pageData.testimonials.subtitle}
            </p>
            
            <div className="grid md:grid-cols-3 gap-8">
              {pageData.testimonials.items?.map((testimonial: any, i: number) => (
                <Card key={i} className="p-6 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating || 5)].map((_, index) => (
                      <Star key={index} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <Quote className="h-8 w-8 text-primary/30 mb-3" />
                  <p className="text-muted-foreground mb-6 italic">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.role} - {testimonial.company}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}
      
      {/* CTA Sections */}
      {pageData.cta?.map((ctaSection: any, index: number) => (
        <section 
          key={index}
          className={`py-${ctaSection.type === 'primary' ? '20' : '16'} px-4 ${ctaSection.background} text-white relative overflow-hidden`}
        >
          <div className={`container mx-auto relative z-10 ${ctaSection.type === 'primary' ? 'max-w-6xl' : 'max-w-6xl'}`}>
            {ctaSection.type === 'primary' ? (
              <>
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-5xl font-bold mb-4">
                    {ctaSection.title}
                  </h2>
                  <p className="text-lg md:text-xl text-white/90">
                    {ctaSection.subtitle}
                  </p>
                </div>

                {ctaSection.stats && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {ctaSection.stats.map((stat: any, i: number) => (
                      <Card key={i} className="bg-white/10 backdrop-blur-md border-white/20 p-6 text-center">
                        <div className="text-4xl font-bold mb-2 text-white">{stat.value}</div>
                        <div className="text-white/90">{stat.label}</div>
                      </Card>
                    ))}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {ctaSection.buttons?.map((button: any, i: number) => {
                    const IconComponent = button.icon ? iconMap[button.icon] : null;
                    return (
                      <Button 
                        key={i}
                        size="lg" 
                        variant={button.variant}
                        className={`text-lg px-8 shadow-xl transition-all ${button.className || ''}`}
                        onClick={() => navigate(button.link || "/")}
                      >
                        {IconComponent && i === 0 && <IconComponent className="mr-2 h-5 w-5" />}
                        {button.text}
                        {IconComponent && i === 1 && <IconComponent className="ml-2 h-5 w-5" />}
                      </Button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex-1 text-white">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    {ctaSection.title}
                  </h2>
                  <p className="text-lg text-white/90">
                    {ctaSection.subtitle}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {ctaSection.buttons?.map((button: any, i: number) => (
                    <Button 
                      key={i}
                      size="lg" 
                      className={button.className}
                      onClick={() => navigate(button.link || "/")}
                    >
                      {button.text}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      ))}

      <Footer />
    </div>
  );
};

export default Home;