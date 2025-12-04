import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { MessageCircle, HelpCircle, Lightbulb, ShoppingCart, Truck, Package, CheckCircle2 } from "lucide-react";
import { usePageContent } from "@/contexts/ContentContext";
import { Helmet } from "react-helmet-async";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  HelpCircle,
  Lightbulb,
  ShoppingCart,
  Truck,
  Package,
  MessageCircle
};

const FAQ = () => {
  const { content, loading } = usePageContent("faq");

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
  const faqCategories = pageData.categories || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted">
      <Helmet>
        <title>{seoData.title || "FAQ"}</title>
        <meta name="description" content={seoData.description || ""} />
        {seoData.keywords && (
          <meta name="keywords" content={Array.isArray(seoData.keywords) ? seoData.keywords.join(", ") : seoData.keywords} />
        )}
        {seoData.ogImage && <meta property="og:image" content={seoData.ogImage} />}
        <meta property="og:title" content={seoData.title || "FAQ"} />
        <meta property="og:description" content={seoData.description || ""} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoData.title || "FAQ"} />
        <meta name="twitter:description" content={seoData.description || ""} />
        {seoData.ogImage && <meta name="twitter:image" content={seoData.ogImage} />}
      </Helmet>
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-orange-light rounded-2xl mb-6 animate-float">
            <HelpCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-orange-light to-primary bg-clip-text text-transparent animate-gradient">
            {pageData.hero?.title || "Frequently Asked Questions"}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            {pageData.hero?.subtitle || ""}
          </p>
          <Button 
            size="lg"
            className="bg-gradient-to-r from-primary to-orange-light text-white hover:shadow-glow"
            onClick={() => window.location.href = '/contact'}
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Hubungi Kami
          </Button>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="pb-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="space-y-8">
            {faqCategories.map((category, idx) => (
              <Card 
                key={idx}
                className="p-6 md:p-8 backdrop-blur-sm bg-card/50 border-border/50 hover:border-primary/30 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-orange-light flex items-center justify-center text-white">
                    {(() => {
                      const IconComponent = iconMap[category.icon] || HelpCircle;
                      return <IconComponent className="w-5 h-5" />;
                    })()}
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">
                    {category.name || category.category}
                  </h2>
                </div>

                <Accordion type="single" collapsible className="space-y-4">
                  {(category.faqs || category.questions || []).map((item, qIdx) => (
                    <AccordionItem 
                      key={qIdx} 
                      value={`item-${idx}-${qIdx}`}
                      className="border border-border/50 rounded-lg px-6 hover:border-primary/30 transition-all"
                    >
                      <AccordionTrigger className="text-left hover:text-primary hover:no-underline py-4">
                        <span className="font-semibold text-base pr-4">
                          {item.question || item.q}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed pb-4 pt-2">
                        {item.answer || item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Card>
            ))}
          </div>

          {/* Still Have Questions CTA */}
          {pageData.cta && (
            <Card className="mt-12 p-8 md:p-12 text-center bg-gradient-to-br from-primary/5 to-orange-light/5 border-primary/20">
              <MessageCircle className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-4 text-foreground">
                {pageData.cta.title}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                {pageData.cta.subtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {(pageData.cta.buttons || []).map((button: any, i: number) => (
                  <Button 
                    key={i}
                    size="lg"
                    variant={button.variant === 'outline' ? 'outline' : 'default'}
                    className={
                      button.variant === 'outline'
                        ? 'border-primary/30 hover:bg-primary/5'
                        : 'bg-gradient-to-r from-primary to-orange-light text-white hover:shadow-glow'
                    }
                    onClick={() => window.location.href = button.link || '#'}
                  >
                    {i === 0 && <MessageCircle className="w-5 h-5 mr-2" />}
                    {button.text}
                  </Button>
                ))}
              </div>
            </Card>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FAQ;
