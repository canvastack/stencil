import { useTheme } from '@/core/engine/ThemeContext';
import DefaultHeader from '@/components/Header';
import DefaultFooter from '@/components/Footer';
import { headerContent, footerContent } from '@/config/navigation.config';

export const useThemeComponents = () => {
  const { currentTheme } = useTheme();
  
  const Header = currentTheme?.components?.Header || DefaultHeader;
  const Footer = currentTheme?.components?.Footer || DefaultFooter;

  return {
    Header,
    Footer,
    headerContent,
    footerContent
  };
};

export const useActiveTheme = () => {
  const { currentTheme } = useTheme();
  
  return {
    hasThemeHeader: Boolean(currentTheme?.components?.Header),
    hasThemeFooter: Boolean(currentTheme?.components?.Footer),
    themeName: currentTheme?.metadata?.name || 'Default'
  };
};