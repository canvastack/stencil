import React, { useState, useEffect } from 'react';
import { Search, Download, Star, TrendingUp, Package, Shield, Calendar, DollarSign, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { themePackageManager } from '@/core/engine/packaging/ThemePackageManager';
import { InstallationProgress } from '@/core/engine/packaging/ThemePackageManager';

interface MarketplaceTheme {
  id: string;
  name: string;
  displayName: string;
  author: string;
  version: string;
  description: string;
  preview: string;
  screenshots: string[];
  downloads: number;
  rating: number;
  reviews: number;
  price: number;
  isPremium: boolean;
  isVerified: boolean;
  isFeatured: boolean;
  category: string;
  tags: string[];
  lastUpdated: string;
  size: number;
  compatibility: string;
}

export default function ThemeMarketplace() {
  const [themes, setThemes] = useState<MarketplaceTheme[]>([]);
  const [filteredThemes, setFilteredThemes] = useState<MarketplaceTheme[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTheme, setSelectedTheme] = useState<MarketplaceTheme | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState<InstallationProgress | null>(null);
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'rating' | 'name'>('popular');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadMarketplaceThemes();
  }, []);

  useEffect(() => {
    filterThemes();
  }, [themes, searchQuery, selectedCategory, sortBy]);

  const loadMarketplaceThemes = async () => {
    const mockThemes: MarketplaceTheme[] = [
      {
        id: '1',
        name: 'modern-business',
        displayName: 'Modern Business Pro',
        author: 'ThemeVendor',
        version: '2.1.0',
        description: 'A sleek, modern theme designed for professional businesses. Features advanced customization options and responsive design.',
        preview: 'https://via.placeholder.com/600x400/4f46e5/ffffff?text=Modern+Business+Pro',
        screenshots: [],
        downloads: 15420,
        rating: 4.8,
        reviews: 342,
        price: 0,
        isPremium: false,
        isVerified: true,
        isFeatured: true,
        category: 'Business',
        tags: ['professional', 'modern', 'responsive'],
        lastUpdated: '2024-01-15',
        size: 2.4,
        compatibility: '^1.0.0'
      },
      {
        id: '2',
        name: 'creative-portfolio',
        displayName: 'Creative Portfolio',
        author: 'DesignStudio',
        version: '1.5.2',
        description: 'Showcase your creative work with this stunning portfolio theme. Perfect for artists, photographers, and designers.',
        preview: 'https://via.placeholder.com/600x400/8b5cf6/ffffff?text=Creative+Portfolio',
        screenshots: [],
        downloads: 8760,
        rating: 4.9,
        reviews: 187,
        price: 49,
        isPremium: true,
        isVerified: true,
        isFeatured: true,
        category: 'Portfolio',
        tags: ['creative', 'portfolio', 'artist'],
        lastUpdated: '2024-01-10',
        size: 3.1,
        compatibility: '^1.0.0'
      },
      {
        id: '3',
        name: 'minimal-clean',
        displayName: 'Minimal & Clean',
        author: 'MinimalThemes',
        version: '1.0.0',
        description: 'Clean, minimal design focused on content and readability. Perfect for blogs and content-focused websites.',
        preview: 'https://via.placeholder.com/600x400/10b981/ffffff?text=Minimal+Clean',
        screenshots: [],
        downloads: 12350,
        rating: 4.6,
        reviews: 298,
        price: 0,
        isPremium: false,
        isVerified: false,
        isFeatured: false,
        category: 'Minimal',
        tags: ['minimal', 'clean', 'blog'],
        lastUpdated: '2024-01-05',
        size: 1.8,
        compatibility: '^1.0.0'
      }
    ];

    setThemes(mockThemes);
    setFilteredThemes(mockThemes);
  };

  const filterThemes = () => {
    let filtered = [...themes];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(theme =>
        theme.displayName.toLowerCase().includes(query) ||
        theme.description.toLowerCase().includes(query) ||
        theme.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(theme => theme.category === selectedCategory);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.downloads - a.downloads;
        case 'newest':
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        case 'rating':
          return b.rating - a.rating;
        case 'name':
          return a.displayName.localeCompare(b.displayName);
        default:
          return 0;
      }
    });

    setFilteredThemes(filtered);
  };

  const handleInstallTheme = async (theme: MarketplaceTheme) => {
    setSelectedTheme(theme);
    setIsInstalling(true);
    setInstallProgress(null);

    try {
      const mockZipBlob = new Blob(['mock theme data'], { type: 'application/zip' });
      const zipFile = new File([mockZipBlob], `${theme.name}.zip`, { type: 'application/zip' });

      const result = await themePackageManager.installThemeFromZip(
        zipFile,
        (progress) => setInstallProgress(progress)
      );

      if (result.success) {
        alert(`Theme "${theme.displayName}" installed successfully!`);
        setSelectedTheme(null);
      } else {
        alert(`Installation failed: ${result.error}`);
      }
    } catch (error) {
      alert(`Installation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsInstalling(false);
      setInstallProgress(null);
    }
  };

  const categories = ['all', 'Business', 'Portfolio', 'Minimal', 'E-commerce', 'Blog'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Theme Marketplace
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Discover and install professional themes for your Stencil store
          </p>
        </div>

        <div className="mb-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search themes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          {showFilters && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Filters</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(category => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory(category)}
                      >
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Sort By</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'popular', label: 'Most Popular' },
                      { value: 'newest', label: 'Newest' },
                      { value: 'rating', label: 'Highest Rated' },
                      { value: 'name', label: 'Name' }
                    ].map(option => (
                      <Button
                        key={option.value}
                        variant={sortBy === option.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSortBy(option.value as any)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Tabs defaultValue="all" className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All Themes</TabsTrigger>
            <TabsTrigger value="featured">
              <Star className="h-4 w-4 mr-2" />
              Featured
            </TabsTrigger>
            <TabsTrigger value="free">Free</TabsTrigger>
            <TabsTrigger value="premium">Premium</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <ThemeGrid themes={filteredThemes} onInstall={handleInstallTheme} />
          </TabsContent>
          
          <TabsContent value="featured" className="mt-6">
            <ThemeGrid 
              themes={filteredThemes.filter(t => t.isFeatured)} 
              onInstall={handleInstallTheme} 
            />
          </TabsContent>
          
          <TabsContent value="free" className="mt-6">
            <ThemeGrid 
              themes={filteredThemes.filter(t => !t.isPremium)} 
              onInstall={handleInstallTheme} 
            />
          </TabsContent>
          
          <TabsContent value="premium" className="mt-6">
            <ThemeGrid 
              themes={filteredThemes.filter(t => t.isPremium)} 
              onInstall={handleInstallTheme} 
            />
          </TabsContent>
        </Tabs>

        {isInstalling && installProgress && (
          <div className="fixed bottom-4 right-4 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold mb-2">Installing {selectedTheme?.displayName}</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>{installProgress.message}</span>
                <span>{installProgress.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${installProgress.progress}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface ThemeGridProps {
  themes: MarketplaceTheme[];
  onInstall: (theme: MarketplaceTheme) => void;
}

function ThemeGrid({ themes, onInstall }: ThemeGridProps) {
  if (themes.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">No themes found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {themes.map(theme => (
        <Card key={theme.id} className="overflow-hidden hover:shadow-lg transition-shadow">
          <div className="relative">
            <img
              src={theme.preview}
              alt={theme.displayName}
              className="w-full h-48 object-cover"
            />
            {theme.isFeatured && (
              <Badge className="absolute top-2 right-2 bg-orange-500">
                <Star className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            )}
            {theme.isPremium && (
              <Badge className="absolute top-2 left-2 bg-purple-500">
                Premium
              </Badge>
            )}
          </div>

          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  {theme.displayName}
                  {theme.isVerified && (
                    <Shield className="h-4 w-4 text-blue-500" />
                  )}
                </CardTitle>
                <CardDescription className="text-sm">
                  by {theme.author}
                </CardDescription>
              </div>
              {theme.isPremium && (
                <div className="text-right">
                  <div className="font-bold text-lg text-orange-600">
                    ${theme.price}
                  </div>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
              {theme.description}
            </p>

            <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{theme.rating}</span>
                <span className="text-gray-400">({theme.reviews})</span>
              </div>
              <div className="flex items-center gap-1">
                <Download className="h-4 w-4" />
                <span>{(theme.downloads / 1000).toFixed(1)}k</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
              {theme.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Updated {new Date(theme.lastUpdated).toLocaleDateString()}</span>
              </div>
              <span>{theme.size} MB</span>
            </div>
          </CardContent>

          <CardFooter className="flex gap-2">
            <Button
              className="flex-1"
              onClick={() => onInstall(theme)}
            >
              <Download className="h-4 w-4 mr-2" />
              Install
            </Button>
            <Button variant="outline">
              Preview
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
