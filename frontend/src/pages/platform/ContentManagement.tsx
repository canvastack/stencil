import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { platformApiClient } from '@/services/api/platformApiClient';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Globe,
  Archive,
  FileText,
  Calendar,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PlatformPage {
  id: string;
  title: string;
  slug: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  page_type: string;
  is_homepage: boolean;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export const ContentManagement: React.FC = () => {
  const [pages, setPages] = useState<PlatformPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      setLoading(true);
      const response = await platformApiClient.get('/platform/content/pages');
      
      if (response.data?.success) {
        setPages(response.data.data || []);
      } else {
        throw new Error('Failed to load pages');
      }
    } catch (error) {
      console.error('Failed to load platform pages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load platform pages',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePage = async (slug: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await platformApiClient.delete(`/platform/content/pages/${slug}`);
      
      if (response.data?.success) {
        setPages(pages.filter(page => page.slug !== slug));
        toast({
          title: 'Success',
          description: 'Page deleted successfully'
        });
      } else {
        throw new Error('Failed to delete page');
      }
    } catch (error) {
      console.error('Failed to delete page:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete page',
        variant: 'destructive'
      });
    }
  };

  const handlePublishPage = async (slug: string, title: string) => {
    try {
      const response = await platformApiClient.patch(`/platform/content/pages/${slug}/publish`);
      
      if (response.data?.success) {
        await loadPages();
        toast({
          title: 'Success',
          description: `"${title}" has been published`
        });
      } else {
        throw new Error('Failed to publish page');
      }
    } catch (error) {
      console.error('Failed to publish page:', error);
      toast({
        title: 'Error',
        description: 'Failed to publish page',
        variant: 'destructive'
      });
    }
  };

  const handleArchivePage = async (slug: string, title: string) => {
    try {
      const response = await platformApiClient.patch(`/platform/content/pages/${slug}/archive`);
      
      if (response.data?.success) {
        await loadPages();
        toast({
          title: 'Success',
          description: `"${title}" has been archived`
        });
      } else {
        throw new Error('Failed to archive page');
      }
    } catch (error) {
      console.error('Failed to archive page:', error);
      toast({
        title: 'Error',
        description: 'Failed to archive page',
        variant: 'destructive'
      });
    }
  };

  const filteredPages = pages.filter(page => {
    const matchesSearch = page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         page.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || page.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800">Published</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'archived':
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Platform Content Management</h1>
          <p className="text-gray-600 mt-1">
            Manage platform marketing content and informational pages
          </p>
        </div>
        <Link to="/platform/content/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Page
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platform Pages</CardTitle>
          <CardDescription>
            Manage content for platform marketing, about pages, contact information, and more
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search pages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Status: {statusFilter === 'all' ? 'All' : statusFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                  All Pages
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('published')}>
                  Published
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('draft')}>
                  Draft
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('archived')}>
                  Archived
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-4">
            {filteredPages.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No pages found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'No pages match your current filters.' 
                    : 'Get started by creating your first platform page.'
                  }
                </p>
                {(!searchTerm && statusFilter === 'all') && (
                  <Link to="/platform/content/create">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Page
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredPages.map((page) => (
                  <div key={page.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{page.title}</h3>
                          {getStatusBadge(page.status)}
                          {page.is_homepage && (
                            <Badge variant="outline" className="text-blue-600 border-blue-600">
                              <Globe className="w-3 h-3 mr-1" />
                              Homepage
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">/{page.slug}</p>
                        {page.description && (
                          <p className="text-sm text-gray-500 mb-2">{page.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Created {formatDate(page.created_at)}
                          </span>
                          {page.published_at && (
                            <span className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              Published {formatDate(page.published_at)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link to={`/platform/content/${page.slug}`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <Link to={`/platform/content/preview/${page.slug}`}>
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" />
                                Preview
                              </DropdownMenuItem>
                            </Link>
                            {page.status === 'draft' && (
                              <DropdownMenuItem
                                onClick={() => handlePublishPage(page.slug, page.title)}
                              >
                                <Globe className="w-4 h-4 mr-2" />
                                Publish
                              </DropdownMenuItem>
                            )}
                            {page.status === 'published' && (
                              <DropdownMenuItem
                                onClick={() => handleArchivePage(page.slug, page.title)}
                              >
                                <Archive className="w-4 h-4 mr-2" />
                                Archive
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleDeletePage(page.slug, page.title)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};