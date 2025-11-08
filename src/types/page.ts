export interface PageButton {
  text: string;
  link: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'outline';
}

export interface PageCarousel {
  images: string[];
  autoplay: boolean;
  interval: number;
}

export interface PageHero {
  title: {
    static: string;
    typing?: string[];
  };
  subtitle: string;
  buttons: {
    primary: PageButton;
    secondary?: PageButton;
  };
  carousel?: PageCarousel;
  backgroundImage?: string;
  backgroundVideo?: string;
}

export interface PageStatItem {
  icon: string;
  value: string;
  label: string;
  color?: string;
}

export interface PageStats {
  enabled: boolean;
  items: PageStatItem[];
}

export interface PageServiceItem {
  icon: string;
  title: string;
  description: string;
  features?: string[];
  link?: string;
}

export interface PageServices {
  enabled: boolean;
  title: string;
  subtitle: string;
  items: PageServiceItem[];
}

export interface PageFeatureItem {
  icon: string;
  title: string;
  description: string;
}

export interface PageFeatures {
  enabled: boolean;
  title: string;
  subtitle: string;
  items: PageFeatureItem[];
}

export interface PageCTA {
  enabled: boolean;
  title: string;
  subtitle: string;
  button: PageButton;
  backgroundImage?: string;
}

export interface PageContent {
  hero?: PageHero;
  stats?: PageStats;
  services?: PageServices;
  features?: PageFeatures;
  cta?: PageCTA;
  sections?: PageSection[];
  [key: string]: any;
}

export interface PageSection {
  id: string;
  type: 'hero' | 'stats' | 'services' | 'features' | 'cta' | 'custom';
  title?: string;
  content: any;
  order?: number;
  visible?: boolean;
}

export interface Page {
  id: string;
  slug: string;
  title: string;
  pageSlug: string;
  content: PageContent;
  seo?: PageSEO;
  status?: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PageSEO {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  canonical?: string;
}

export interface PageFormData {
  slug: string;
  title: string;
  content: PageContent;
  seo?: PageSEO;
  status?: 'draft' | 'published' | 'archived';
}

export interface PageFilters {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}
