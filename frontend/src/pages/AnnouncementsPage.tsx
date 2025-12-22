import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, 
  Zap, 
  Paintbrush, 
  Search, 
  Filter,
  Calendar,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  date: string;
  category: 'feature' | 'improvement' | 'fix' | 'announcement';
  tag: 'new' | 'updated' | 'deprecated' | null;
  summary: string;
  highlights: string[];
  action?: {
    label: string;
    url: string;
  };
}

const announcements: Announcement[] = [
  {
    id: 'dec-2025-performance',
    title: 'Product Catalog Performance Update',
    date: 'December 22, 2025',
    category: 'improvement',
    tag: 'new',
    summary: 'Major performance improvements to the Product Catalog with 68% faster loading times and enhanced mobile experience.',
    highlights: [
      '68% faster loading times with virtual scrolling',
      'Enhanced mobile experience with responsive layout',
      'Advanced filtering options for better product discovery',
      'Improved accessibility with WCAG 2.1 AA compliance',
    ],
    action: {
      label: 'Learn More',
      url: '/help/whats-new/product-catalog-v2',
    },
  },
  {
    id: 'dec-2025-advanced-search',
    title: 'Advanced Search & Filters',
    date: 'December 15, 2025',
    category: 'feature',
    tag: 'new',
    summary: 'New advanced search capabilities with saved filters and multi-column sorting.',
    highlights: [
      'Save custom search filters for quick access',
      'Multi-column sorting and filtering',
      'Search across all product attributes',
      'Export filtered results to Excel/CSV',
    ],
    action: {
      label: 'Try It Now',
      url: '/admin/products/catalog',
    },
  },
  {
    id: 'dec-2025-dark-mode',
    title: 'Enhanced Dark Mode',
    date: 'December 10, 2025',
    category: 'improvement',
    tag: 'updated',
    summary: 'Improved dark theme with better contrast ratios and reduced eye strain.',
    highlights: [
      'Better contrast ratios for improved readability',
      'Reduced blue light for comfortable night viewing',
      'Consistent color scheme across all pages',
      'Automatic theme switching based on system preferences',
    ],
  },
  {
    id: 'nov-2025-bulk-actions',
    title: 'Bulk Edit Improvements',
    date: 'November 28, 2025',
    category: 'feature',
    tag: null,
    summary: 'Enhanced bulk editing with preview and undo capabilities.',
    highlights: [
      'Preview changes before applying',
      'Undo last bulk action',
      'Edit multiple fields at once',
      'Better error handling and validation',
    ],
    action: {
      label: 'View Documentation',
      url: '/help/bulk-edit',
    },
  },
  {
    id: 'nov-2025-api-improvements',
    title: 'API Performance Enhancements',
    date: 'November 15, 2025',
    category: 'improvement',
    tag: null,
    summary: 'Backend API optimizations resulting in faster response times.',
    highlights: [
      '40% faster API response times',
      'Improved caching mechanisms',
      'Better error messages and debugging',
      'Enhanced rate limiting for stability',
    ],
  },
];

const getCategoryIcon = (category: Announcement['category']) => {
  switch (category) {
    case 'feature':
      return <Sparkles className="h-5 w-5 text-purple-500" />;
    case 'improvement':
      return <Zap className="h-5 w-5 text-orange-500" />;
    case 'fix':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case 'announcement':
      return <Calendar className="h-5 w-5 text-blue-500" />;
  }
};

const getCategoryBadge = (category: Announcement['category']) => {
  const config = {
    feature: { label: 'Feature', className: 'bg-purple-500' },
    improvement: { label: 'Improvement', className: 'bg-orange-500' },
    fix: { label: 'Bug Fix', className: 'bg-green-500' },
    announcement: { label: 'Announcement', className: 'bg-blue-500' },
  };

  const { label, className } = config[category];
  return <Badge className={className}>{label}</Badge>;
};

const getTagBadge = (tag: Announcement['tag']) => {
  if (!tag) return null;

  const config = {
    new: { label: 'NEW', className: 'bg-green-600' },
    updated: { label: 'UPDATED', className: 'bg-blue-600' },
    deprecated: { label: 'DEPRECATED', className: 'bg-red-600' },
  };

  const { label, className } = config[tag];
  return <Badge className={className} variant="default">{label}</Badge>;
};

export default function AnnouncementsPage() {
  const [selectedCategory, setSelectedCategory] = useState<Announcement['category'] | 'all'>('all');

  const filteredAnnouncements = selectedCategory === 'all'
    ? announcements
    : announcements.filter(a => a.category === selectedCategory);

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          What's New in CanvaStack
        </h1>
        <p className="text-muted-foreground mt-2">
          Stay up to date with the latest features, improvements, and announcements
        </p>
      </div>

      <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as any)}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="all">All Updates</TabsTrigger>
          <TabsTrigger value="feature">
            <Sparkles className="h-4 w-4 mr-2" />
            Features
          </TabsTrigger>
          <TabsTrigger value="improvement">
            <Zap className="h-4 w-4 mr-2" />
            Improvements
          </TabsTrigger>
          <TabsTrigger value="fix">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Fixes
          </TabsTrigger>
          <TabsTrigger value="announcement">
            <Calendar className="h-4 w-4 mr-2" />
            Announcements
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-4 mt-6">
          {filteredAnnouncements.map((announcement) => (
            <Card key={announcement.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  {getCategoryIcon(announcement.category)}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-semibold">{announcement.title}</h3>
                        {getTagBadge(announcement.tag)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{announcement.date}</span>
                        <span>•</span>
                        {getCategoryBadge(announcement.category)}
                      </div>
                    </div>
                  </div>

                  <p className="text-muted-foreground mb-4">
                    {announcement.summary}
                  </p>

                  <div className="space-y-2 mb-4">
                    {announcement.highlights.map((highlight, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{highlight}</span>
                      </div>
                    ))}
                  </div>

                  {announcement.action && (
                    <Button variant="outline" asChild>
                      <a href={announcement.action.url}>
                        {announcement.action.label}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}

          {filteredAnnouncements.length === 0 && (
            <Card className="p-12">
              <div className="text-center">
                <Filter className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No announcements found</h3>
                <p className="text-muted-foreground">
                  Try selecting a different category
                </p>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Card className="p-6 bg-primary/5 border-primary">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">Want to stay updated?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Subscribe to our newsletter to get the latest updates delivered to your inbox.
            </p>
            <div className="flex gap-2">
              <Button variant="default">
                Subscribe to Newsletter
              </Button>
              <Button variant="outline" asChild>
                <a href="/help">
                  Visit Help Center
                </a>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
