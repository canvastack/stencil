export interface PageContent {
  hero: {
    title: {
      prefix: string;
      highlight: string;
      suffix?: string;
    };
    subtitle: string;
    typingTexts?: readonly string[];
  };
  informationSection: {
    title: {
      prefix: string;
      highlight: string;
      suffix?: string;
    };
    subtitle: string;
    cards: Array<{
      title: string;
      description: string;
      features: string[];
      icon: string;
      buttonText?: string;
    }>;
  };
  ctaSections: Array<{
    id: string;
    title: string;
    subtitle: string;
    stats?: Array<{
      value: string;
      label: string;
    }>;
    buttons: Array<{
      text: string;
      variant: 'primary' | 'outline';
      icon?: string;
    }>;
  }>;
}