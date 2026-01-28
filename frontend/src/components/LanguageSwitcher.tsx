import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Globe, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSupportedLanguages, changeLanguage, getCurrentLanguage } from '@/i18n';

interface LanguageSwitcherProps {
  variant?: 'default' | 'compact' | 'mobile';
  className?: string;
}

export function LanguageSwitcher({ variant = 'default', className }: LanguageSwitcherProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const supportedLanguages = getSupportedLanguages();
  const currentLanguage = getCurrentLanguage();

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await changeLanguage(languageCode);
      setIsOpen(false);
      
      // Store preference in localStorage
      localStorage.setItem('canvastencil-language', languageCode);
      
      // Optionally reload the page to ensure all components update
      // window.location.reload();
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  const getCurrentLanguageInfo = () => {
    return supportedLanguages.find(lang => lang.code === currentLanguage) || supportedLanguages[0];
  };

  const currentLang = getCurrentLanguageInfo();

  if (variant === 'compact') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("h-8 w-8 p-0", className)}
          >
            <Globe className="h-4 w-4" />
            <span className="sr-only">Change language</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {supportedLanguages.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{language.nativeName}</span>
                <span className="text-xs text-muted-foreground">({language.name})</span>
              </div>
              {currentLanguage === language.code && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === 'mobile') {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="text-sm font-medium text-muted-foreground">
          {t('common.fields.language', 'Language')}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {supportedLanguages.map((language) => (
            <Button
              key={language.code}
              variant={currentLanguage === language.code ? "default" : "outline"}
              size="sm"
              onClick={() => handleLanguageChange(language.code)}
              className="justify-start"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{language.nativeName}</span>
                {currentLanguage === language.code && (
                  <Check className="h-3 w-3" />
                )}
              </div>
            </Button>
          ))}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={cn("gap-2", className)}
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLang.nativeName}</span>
          <Badge variant="secondary" className="text-xs">
            {currentLang.code.toUpperCase()}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
          {t('common.actions.selectLanguage', 'Select Language')}
        </div>
        {supportedLanguages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="text-sm font-medium">{language.nativeName}</span>
              <span className="text-xs text-muted-foreground">{language.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {language.code.toUpperCase()}
              </Badge>
              {currentLanguage === language.code && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Hook for language switching functionality
export function useLanguageSwitcher() {
  const { i18n } = useTranslation();
  
  const switchLanguage = async (languageCode: string) => {
    try {
      await changeLanguage(languageCode);
      return true;
    } catch (error) {
      console.error('Failed to switch language:', error);
      return false;
    }
  };

  const getCurrentLanguageInfo = () => {
    const supportedLanguages = getSupportedLanguages();
    return supportedLanguages.find(lang => lang.code === i18n.language) || supportedLanguages[0];
  };

  const isRTL = () => {
    const rtlLanguages = ['ar', 'he', 'fa'];
    return rtlLanguages.includes(i18n.language);
  };

  return {
    currentLanguage: i18n.language,
    supportedLanguages: getSupportedLanguages(),
    switchLanguage,
    getCurrentLanguageInfo,
    isRTL
  };
}