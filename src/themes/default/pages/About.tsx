import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Target, Eye, ChevronLeft, ChevronRight, MessageSquare, Users, Lightbulb, Award } from "lucide-react";
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { usePageContent } from "@/contexts/ContentContext";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Target,
  Users,
  Lightbulb,
  Eye,
  MessageSquare
};

const About = () => {
  const { content, loading } = usePageContent("about");
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);

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
  const team = pageData.team?.members || [];

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
            {pageData.hero?.title || "Tentang Kami"}
          </h1>
          <p className="text-lg md:text-xl text-slate-300 animate-fade-in-up">
            {pageData.hero?.subtitle || ""}
          </p>
        </div>
      </section>

      {/* Company & Mission Section */}
      {pageData.company?.enabled && (
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="relative">
                <div className="aspect-[4/5] rounded-2xl bg-gradient-to-br from-primary/20 to-lavender/20 flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-orange-light flex items-center justify-center">
                        <span className="text-4xl font-bold text-white">
                          {pageData.company?.title?.substring(0, 2).toUpperCase() || "EP"}
                        </span>
                      </div>
                      <p className="text-muted-foreground">{pageData.company?.description || ""}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {pageData.mission?.enabled && pageData.mission?.items && (
                  <>
                    <h2 className="text-3xl font-bold mb-6">
                      {pageData.mission?.title || "Misi Kami"}
                    </h2>
                    {pageData.mission.items.map((item: any, i: number) => {
                      const IconComponent = iconMap[item.icon] || Target;
                      return (
                        <Card key={i} className="p-6 border-l-4 border-primary bg-primary/5">
                          <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                              <IconComponent className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold mb-2 text-primary">{item.title}</h3>
                              <p className="text-muted-foreground">{item.description}</p>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </>
                )}

                {pageData.values?.enabled && (
                  <Card className="p-6 border-l-4 border-primary bg-primary/5">
                    <h3 className="text-xl font-bold mb-4 text-primary">
                      {pageData.values?.title || "Nilai-Nilai Kami"}
                    </h3>
                    <ul className="space-y-2 text-muted-foreground">
                      {(pageData.values?.items || []).map((value: string, i: number) => (
                        <li key={i}>• {value}</li>
                      ))}
                    </ul>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Timeline Section */}
      {pageData.timeline?.enabled && (
        <section className="py-16 px-4 bg-muted/50">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              {pageData.timeline?.title || "Perjalanan Kami"}
            </h2>
            
            <div className="relative">
              <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-primary/20" />
              
              <div className="space-y-12">
                {(pageData.timeline?.events || []).map((item: any, i: number) => (
                  <div 
                    key={i} 
                    className={`flex items-center ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
                  >
                    <div className={`w-5/12 ${i % 2 === 0 ? 'text-right pr-8' : 'text-left pl-8'}`}>
                      <Card className="p-6 hover:shadow-lg transition-all inline-block">
                        <div className="text-2xl font-bold text-primary mb-2">{item.year}</div>
                        <div className="font-semibold mb-1">{item.title}</div>
                        <p className="text-muted-foreground text-sm">{item.description}</p>
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
      )}

      {/* Team Section */}
      {pageData.team?.enabled && team.length > 0 && (
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              {pageData.team?.title || "Tim Kami"}
            </h2>
            <p className="text-center text-muted-foreground mb-12">
              {pageData.team?.subtitle || ""}
            </p>
            
            <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[0, 1, 2].map((offset) => {
                  const index = (currentTeamIndex + offset) % team.length;
                  const member = team[index];
                  return (
                    <Card key={offset} className="p-8 text-center">
                      <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-orange-light flex items-center justify-center text-white text-3xl font-bold">
                        {member?.name?.substring(0, 2).toUpperCase() || "??"}
                      </div>
                      <h3 className="text-2xl font-bold mb-2">{member?.name}</h3>
                      <p className="text-primary font-medium mb-3">{member?.role}</p>
                      {member?.bio && (
                        <p className="text-muted-foreground text-sm">{member.bio}</p>
                      )}
                    </Card>
                  );
                })}
              </div>
              
              {team.length > 3 && (
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
              )}
            </div>
          </div>
        </section>
      )}

      {/* Certifications Section */}
      {pageData.certifications?.enabled && (
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              {pageData.certifications?.title || "Sertifikasi & Penghargaan"}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {(pageData.certifications?.items || []).map((cert: any, i: number) => (
                <Card key={i} className="p-6 hover:shadow-lg transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Award className="h-8 w-8 text-primary" />
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                  {ctaSection.stats.map((stat: any, i: number) => (
                    <Card key={i} className="bg-white/10 backdrop-blur-md border-white/20 p-6 text-center">
                      <div className="text-4xl font-bold mb-2 text-white">{stat.value}</div>
                      <div className="text-white/90">{stat.label}</div>
                    </Card>
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

export default About;
