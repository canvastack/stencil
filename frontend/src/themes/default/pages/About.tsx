import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePageContent } from "@/hooks/usePageContent";
import { useTheme } from '@/core/engine/ThemeContext';
import type { PageProps } from '@/core/engine/types';
import { Helmet } from "react-helmet-async";
import {
  Target,
  Lightbulb,
  Shield,
  Award,
  MapPin,
  Calendar,
  Users,
  Building
} from "lucide-react";

// Icon mapping for dynamic icon resolution
const iconMap: Record<string, any> = {
  Target,
  Lightbulb,
  Shield,
  Award,
  MapPin,
  Calendar,
  Users,
  Building
};

const About: React.FC<PageProps> = ({ className }) => {
  const { currentTheme } = useTheme();
  const { Header, Footer } = currentTheme?.components ?? {};
  const { pageContent, loading } = usePageContent();

  // Default fallback content
  const defaultAboutContent = {
    hero: {
      title: { prefix: "Tentang", highlight: "Kami" },
      subtitle: "Pelajari lebih lanjut tentang layanan etching profesional kami"
    },
    company: {
      history: "Berpengalaman lebih dari 15 tahun dalam industri etching",
      vision: "Menjadi penyedia layanan etching terdepan",
      mission: "Memberikan solusi etching terbaik dengan teknologi modern"
    }
  };

  // Merge content dengan fallback yang robust
  const content = pageContent?.content ? pageContent : { content: defaultAboutContent };

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const pageData = content?.content;

  return (
    <>
      <Helmet>
        <title>{pageData?.seo?.title || "About - Stencil"}</title>
        <meta name="description" content={pageData?.seo?.description || "Learn about our company"} />
        <meta name="keywords" content={pageData?.seo?.keywords?.join(', ') || "about, company"} />
        {pageData?.seo?.ogImage && <meta property="og:image" content={pageData.seo.ogImage} />}
      </Helmet>
      
      <Header />
      
      <div className="min-h-screen">
      {/* Hero Section */}
      {pageData?.hero && (
        <section className="py-20 px-4 bg-gradient-to-br from-primary/10 to-secondary/10">
          <div className="container mx-auto max-w-6xl text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {typeof pageData.hero.title === 'string' 
                ? pageData.hero.title 
                : `${pageData.hero.title?.prefix || ''} ${pageData.hero.title?.highlight || ''}`
              }
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              {pageData.hero.subtitle}
            </p>
            {pageData.hero.image && (
              <div className="mt-12">
                <img
                  src={pageData.hero.image}
                  alt={pageData.hero.title}
                  className="w-full max-w-4xl mx-auto rounded-lg shadow-2xl"
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Company Profile Section */}
      {pageData?.company?.enabled && (
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {pageData.company.title}
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                {pageData.company.description}
              </p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-6">
              <Card className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div className="text-2xl font-bold text-primary mb-1">
                  {pageData.company.founded}
                </div>
                <div className="text-sm text-muted-foreground">Didirikan</div>
              </Card>
              
              <Card className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div className="text-lg font-semibold mb-1">
                  {pageData.company.location}
                </div>
                <div className="text-sm text-muted-foreground">Lokasi</div>
              </Card>
              
              <Card className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="text-2xl font-bold text-primary mb-1">
                  {pageData.company.employees}
                </div>
                <div className="text-sm text-muted-foreground">Karyawan</div>
              </Card>
              
              <Card className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building className="h-6 w-6 text-primary" />
                </div>
                <div className="text-2xl font-bold text-primary mb-1">
                  {pageData.company.clients}
                </div>
                <div className="text-sm text-muted-foreground">Klien</div>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Mission & Vision Section */}
      {pageData?.mission?.enabled && (
        <section className="py-16 px-4 bg-muted">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              {pageData.mission.title}
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {pageData.mission.items?.map((item: any, index: number) => {
                const IconComponent = iconMap[item.icon] || Target;
                return (
                  <Card key={index} className="p-8">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <IconComponent className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-3 text-primary">
                          {item.title}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
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

      {/* Values Section */}
      {pageData?.values?.enabled && (
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              {pageData.values.title}
            </h2>
            
            <div className="space-y-8">
              {pageData.values.items?.map((value: string, index: number) => (
                <Card key={index} className="p-8">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold">{index + 1}</span>
                    </div>
                    <p className="text-lg leading-relaxed">{value}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Team Section */}
      {pageData?.team?.enabled && (
        <section className="py-16 px-4 bg-muted">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {pageData.team.title}
              </h2>
              <p className="text-lg text-muted-foreground">
                {pageData.team.subtitle}
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {pageData.team.members?.map((member: any, index: number) => (
                <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="mb-4">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-24 h-24 rounded-full mx-auto object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${member.name}&background=random`;
                      }}
                    />
                  </div>
                  <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                  <p className="text-primary font-medium mb-3">{member.role}</p>
                  <p className="text-sm text-muted-foreground">{member.bio}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Timeline Section */}
      {pageData?.timeline?.enabled && (
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              {pageData.timeline.title}
            </h2>
            
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-primary/20"></div>
              
              <div className="space-y-12">
                {pageData.timeline.events?.map((event: any, index: number) => (
                  <div
                    key={index}
                    className={`flex items-center ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}
                  >
                    <Card className={`p-6 max-w-md ${index % 2 === 0 ? 'mr-auto' : 'ml-auto'} relative`}>
                      {/* Timeline dot */}
                      <div className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-primary rounded-full border-4 border-background"
                           style={{
                             [index % 2 === 0 ? 'right' : 'left']: '-2rem'
                           }}>
                      </div>
                      
                      <div className="text-2xl font-bold text-primary mb-2">
                        {event.year}
                      </div>
                      <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                      <p className="text-muted-foreground">{event.description}</p>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Certifications Section */}
      {pageData?.certifications?.enabled && (
        <section className="py-16 px-4 bg-muted">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              {pageData.certifications.title}
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {pageData.certifications.items?.map((cert: any, index: number) => (
                <Card key={index} className="p-8 hover:shadow-lg transition-shadow">
                  <div className="flex items-start space-x-4">
                    <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Award className="h-10 w-10 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">{cert.name}</h3>
                      <p className="text-muted-foreground">{cert.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      {pageData?.cta && pageData.cta.length > 0 && pageData.cta[0]?.enabled !== false && (
        <section className={`py-20 px-4 ${pageData.cta[0].background} text-white relative overflow-hidden`}>
          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="text-center">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                {pageData.cta[0].title}
              </h2>
              <p className="text-xl mb-8 max-w-3xl mx-auto">
                {pageData.cta[0].subtitle}
              </p>
              
              {pageData.cta[0].stats && (
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  {pageData.cta[0].stats.map((stat: any, index: number) => (
                    <div key={index} className="text-center">
                      <div className="text-4xl font-bold mb-2">{stat.value}</div>
                      <div className="text-lg opacity-90">{stat.label}</div>
                    </div>
                  ))}
                </div>
              )}
              
              {pageData.cta[0].buttons && (
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {pageData.cta[0].buttons.map((button: any, index: number) => (
                    <Button
                      key={index}
                      variant={button.variant === 'outline' ? 'outline' : 'default'}
                      size="lg"
                      className={`${button.variant === 'outline' 
                        ? 'border-white text-white hover:bg-white hover:text-primary' 
                        : 'bg-white text-primary hover:bg-white/90'
                      } px-8`}
                    >
                      {button.text}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-10 right-10 w-32 h-32 border border-white rounded-full"></div>
            <div className="absolute bottom-10 left-10 w-48 h-48 border border-white rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-white rounded-full"></div>
          </div>
        </section>
      )}
      </div>
      
      <Footer />
    </>
  );
}

export default About;