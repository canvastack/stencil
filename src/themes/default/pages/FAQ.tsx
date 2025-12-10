import { useState } from "react";
import { usePageContent } from "@/hooks/usePageContent";
import { useTheme } from '@/core/engine/ThemeContext';
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  HelpCircle, 
  Lightbulb, 
  Package, 
  ShoppingCart, 
  Truck,
  ChevronDown,
  ChevronUp
} from "lucide-react";

// Icon mapping
const iconMap: Record<string, any> = {
  HelpCircle,
  Lightbulb,
  Package,
  ShoppingCart,
  Truck
};

export default function FAQ() {
  const { currentTheme } = useTheme();
  const { Header, Footer } = currentTheme?.components ?? {};
  const { pageContent, loading } = usePageContent();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [openQuestions, setOpenQuestions] = useState<Record<string, boolean>>({});

  // Default fallback content
  const defaultFaqContent = {
    hero: {
      title: "FAQ - Pertanyaan Umum",
      subtitle: "Temukan jawaban untuk pertanyaan yang sering diajukan"
    },
    categories: [
      {
        id: "general",
        category: "Umum",
        icon: "HelpCircle",
        questions: [
          { q: "Apa itu etching?", a: "Etching adalah proses mengukir permukaan material menggunakan teknik kimia atau laser." },
          { q: "Berapa lama waktu pengerjaan?", a: "Waktu pengerjaan bervariasi tergantung kompleksitas, umumnya 3-7 hari kerja." }
        ]
      }
    ]
  };

  // Merge content dengan fallback yang robust
  const content = pageContent?.content ? pageContent : { content: defaultFaqContent };

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

  const toggleQuestion = (categoryId: string, questionIndex: number) => {
    const questionKey = `${categoryId}-${questionIndex}`;
    setOpenQuestions(prev => ({
      ...prev,
      [questionKey]: !prev[questionKey]
    }));
  };

  const filteredCategories = selectedCategory 
    ? pageData?.categories?.filter((cat: any) => cat.id === selectedCategory)
    : pageData?.categories;

  return (
    <>
      <Helmet>
        {pageData?.seo?.enabled !== false ? (
          <>
            <title>{pageData?.seo?.title || "FAQ - Stencil"}</title>
            <meta name="description" content={pageData?.seo?.description || "Frequently asked questions"} />
            <meta name="keywords" content={pageData?.seo?.keywords?.join(', ') || "faq, questions"} />
            {pageData?.seo?.ogImage && <meta property="og:image" content={pageData.seo.ogImage} />}
          </>
        ) : (
          <title>FAQ</title>
        )}
      </Helmet>
      
      <Header />
      
      <div className="min-h-screen">
        {/* Hero Section */}
        {pageData?.hero && (
          <section className="py-20 px-4 bg-gradient-to-br from-primary/10 to-secondary/10">
            <div className="container mx-auto max-w-4xl text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                {typeof pageData.hero.title === 'string' 
                  ? pageData.hero.title 
                  : `${pageData.hero.title?.prefix || ''} ${pageData.hero.title?.highlight || ''}`
                }
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                {pageData.hero.subtitle}
              </p>
            </div>
          </section>
        )}

        {/* FAQ Content */}
        {pageData?.categories && pageData.categories?.enabled !== false && (
          <section className="py-16 px-4">
            <div className="container mx-auto max-w-6xl">
              
              {/* Category Filter */}
              <div className="mb-12">
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button
                    variant={selectedCategory === null ? "default" : "outline"}
                    onClick={() => setSelectedCategory(null)}
                    className="flex items-center gap-2"
                  >
                    <HelpCircle className="w-4 h-4" />
                    Semua Kategori
                  </Button>
                  {pageData.categories.map((category: any) => {
                    const IconComponent = iconMap[category.icon] || HelpCircle;
                    return (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? "default" : "outline"}
                        onClick={() => setSelectedCategory(category.id)}
                        className="flex items-center gap-2"
                      >
                        <IconComponent className="w-4 h-4" />
                        {category.category}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* FAQ Categories and Questions */}
              <div className="space-y-8">
                {filteredCategories?.map((category: any) => {
                  const IconComponent = iconMap[category.icon] || HelpCircle;
                  return (
                    <div key={category.id} className="space-y-4">
                      {/* Category Header */}
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                          <IconComponent className="h-6 w-6 text-primary" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-primary">
                          {category.category}
                        </h2>
                      </div>

                      {/* Questions */}
                      <div className="space-y-3">
                        {category.questions?.map((faq: any, index: number) => {
                          const questionKey = `${category.id}-${index}`;
                          const isOpen = openQuestions[questionKey];
                          
                          return (
                            <Card key={index} className="overflow-hidden">
                              <button
                                onClick={() => toggleQuestion(category.id, index)}
                                className="w-full p-6 text-left hover:bg-muted/50 transition-colors flex items-center justify-between"
                              >
                                <h3 className="text-lg font-semibold pr-4">
                                  {faq.q}
                                </h3>
                                {isOpen ? (
                                  <ChevronUp className="h-5 w-5 text-primary flex-shrink-0" />
                                ) : (
                                  <ChevronDown className="h-5 w-5 text-primary flex-shrink-0" />
                                )}
                              </button>
                              
                              {isOpen && (
                                <div className="px-6 pb-6 border-t">
                                  <div className="pt-4 text-muted-foreground leading-relaxed whitespace-pre-line">
                                    {faq.a}
                                  </div>
                                </div>
                              )}
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        {pageData?.cta && pageData.cta?.enabled !== false && (
          <section className="py-20 px-4 bg-gradient-to-r from-primary to-primary/80 text-white relative overflow-hidden">
            <div className="container mx-auto max-w-4xl relative z-10">
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  {pageData.cta.title}
                </h2>
                <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
                  {pageData.cta.subtitle}
                </p>
                
                {pageData.cta.buttons && (
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    {pageData.cta.buttons.map((button: any, index: number) => (
                      <Button
                        key={index}
                        variant={button.variant === 'outline' ? 'outline' : 'default'}
                        size="lg"
                        className={`${button.variant === 'outline' 
                          ? 'border-white text-white hover:bg-white hover:text-primary' 
                          : 'bg-white text-primary hover:bg-white/90'
                        } px-8`}
                        asChild
                      >
                        <a href={button.link} target={button.link.startsWith('http') ? '_blank' : '_self'}>
                          {button.text}
                        </a>
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