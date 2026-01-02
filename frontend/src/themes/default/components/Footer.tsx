import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FooterProps } from "@/core/engine/interfaces";
import { usePublicFooterConfig, usePublicHeaderConfig } from "@/hooks/usePublicNavigation";

const Footer: React.FC<FooterProps> = ({ className, showSocialLinks = true }) => {
  const { data: footerConfig } = usePublicFooterConfig();
  const { data: headerConfig } = usePublicHeaderConfig();

  const brandName = headerConfig?.brand_name || "Etching Xenial";
  const brandInitials = headerConfig?.brand_initials || "CEX";
  const sections = footerConfig?.footer_sections || [];
  const socialLinks = footerConfig?.social_links || [];
  const contactAddress = footerConfig?.contact_address || "Jl. Industri No. 123, Jakarta Selatan";
  const contactEmail = footerConfig?.contact_email || "info@etchingpresisi.com";
  const contactPhone = footerConfig?.contact_phone || "+62 821-1234-5678";
  const aboutText = footerConfig?.about_text || footerConfig?.bottom_text || "Solusi etching profesional untuk kebutuhan industri dan dekorasi";
  const copyrightText = footerConfig?.copyright_text || "© 2025 Etching Xenial. All rights reserved.";
  const legalLinks = footerConfig?.legal_links || [];
  const showNewsletter = footerConfig?.show_newsletter ?? true;
  const newsletterTitle = footerConfig?.newsletter_title || "Dapatkan Info & Penawaran Terbaru";
  const newsletterButtonText = footerConfig?.newsletter_button_text || "→";
  const showContactInfo = footerConfig?.show_contact_info ?? true;
  const showSections = footerConfig?.show_sections ?? true;

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook':
        return <Facebook className="h-4 w-4" />;
      case 'instagram':
        return <Instagram className="h-4 w-4" />;
      case 'twitter':
        return <Twitter className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <footer className={`bg-card border-t border-border ${className || ''}`}>
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-orange-light rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">{brandInitials}</span>
              </div>
              <span className="text-lg font-bold">
                {brandName.split(' ').map((word, i) => (
                  <span key={i} className={i === brandName.split(' ').length - 1 ? 'text-primary' : ''}>
                    {word}{' '}
                  </span>
                ))}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {aboutText}
            </p>
            {showSocialLinks && socialLinks.length > 0 && (
              <div className="flex space-x-2">
                {socialLinks.map((social) => (
                  <Button 
                    key={social.platform}
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full"
                    asChild
                  >
                    <a href={social.url} target="_blank" rel="noopener noreferrer">
                      {getSocialIcon(social.icon || social.platform)}
                    </a>
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Footer Sections */}
          {showSections && sections.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold text-foreground mb-4">{section.title}</h3>
              <ul className="space-y-2 text-sm">
                {section.links.map((link) => (
                  <li key={link.path}>
                    <Link 
                      to={link.path} 
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact Info */}
          {showContactInfo && (
            <div>
              <h3 className="font-semibold text-foreground mb-4">Hubungi Kami</h3>
              <ul className="space-y-3 text-sm">
                {contactAddress && (
                  <li className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">
                      {contactAddress}
                    </span>
                  </li>
                )}
                {contactEmail && (
                  <li className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                    <a href={`mailto:${contactEmail}`} className="text-muted-foreground hover:text-primary">
                      {contactEmail}
                    </a>
                  </li>
                )}
                {contactPhone && (
                  <li className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                    <a href={`tel:${contactPhone.replace(/\s/g, '')}`} className="text-muted-foreground hover:text-primary">
                      {contactPhone}
                    </a>
                  </li>
                )}
              </ul>

              {showNewsletter && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    {newsletterTitle}
                  </p>
                  <div className="flex space-x-2">
                    <Input
                      type="email"
                      placeholder="Email Anda"
                      className="h-9 text-sm"
                    />
                    <Button size="sm" className="bg-gradient-to-r from-primary to-orange-light text-white">
                      {newsletterButtonText}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-muted-foreground text-center md:text-left">
              {copyrightText}
            </p>
            {legalLinks.length > 0 && (
              <div className="flex space-x-6 text-sm">
                {legalLinks.map((link) => (
                  <Link 
                    key={link.path}
                    to={link.path} 
                    className="text-muted-foreground hover:text-primary"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;