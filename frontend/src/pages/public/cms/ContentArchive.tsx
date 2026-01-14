import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Calendar, User, Eye, MessageSquare, ArrowRight } from 'lucide-react';
import { usePublicContentsQuery, usePublicCategoriesQuery, useContentTypesQuery } from '@/hooks/cms';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { ContentFilters } from '@/types/cms';

export default function ContentArchive() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ContentFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data, isLoading } = usePublicContentsQuery(filters);
  const { data: categoriesData } = usePublicCategoriesQuery();
  const { data: contentTypesData } = useContentTypesQuery();

  const contents = data?.data || [];
  const categories = categoriesData?.data || [];
  const contentTypes = contentTypesData?.data || [];

  const handleSearch = () => {
    setFilters({ ...filters, search: searchQuery });
  };

  const handleCategoryFilter = (categoryUuid: string) => {
    setFilters({ ...filters, category_uuid: categoryUuid === 'all' ? undefined : categoryUuid });
  };

  const handleContentTypeFilter = (contentTypeUuid: string) => {
    setFilters({ ...filters, content_type_uuid: contentTypeUuid === 'all' ? undefined : contentTypeUuid });
  };

  const handleContentClick = (slug: string, contentTypeSlug: string) => {
    navigate(`/content/${contentTypeSlug}/${slug}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[400px] w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="space-y-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Content Library</h1>
          <p className="text-muted-foreground mt-2">
            Browse our collection of articles, posts, and resources
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9"
            />
          </div>

          <Select value={filters.content_type_uuid || 'all'} onValueChange={handleContentTypeFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {contentTypes.map((ct) => (
                <SelectItem key={ct.uuid} value={ct.uuid}>
                  {ct.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.category_uuid || 'all'} onValueChange={handleCategoryFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.uuid} value={cat.uuid}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={handleSearch}>Search</Button>
        </div>
      </div>

      {contents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No content found matching your criteria.</p>
          </CardContent>
        </Card>
      ) : (
        <div
          className={cn(
            "grid gap-6",
            viewMode === 'grid'
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-1"
          )}
        >
          {contents.map((content) => (
            <Card
              key={content.uuid}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => handleContentClick(content.slug, content.content_type?.slug || '')}
            >
              {content.featured_image && (
                <div className="aspect-video overflow-hidden bg-muted">
                  <img
                    src={content.featured_image.url}
                    alt={content.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {content.content_type && (
                      <Badge variant="outline">{content.content_type.name}</Badge>
                    )}
                    {content.categories && content.categories.length > 0 && (
                      <Badge variant="secondary">{content.categories[0].name}</Badge>
                    )}
                    {content.flags?.is_featured && (
                      <Badge>Featured</Badge>
                    )}
                  </div>

                  <h3 className="text-xl font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                    {content.title}
                  </h3>

                  {content.excerpt && (
                    <p className="text-muted-foreground text-sm line-clamp-3">
                      {content.excerpt}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{content.author?.name || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {content.published_at
                          ? formatDistanceToNow(new Date(content.published_at), { addSuffix: true })
                          : formatDistanceToNow(new Date(content.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    {content.metrics && (
                      <>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span>{content.metrics.view_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          <span>{content.metrics.comment_count || 0}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full group/btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContentClick(content.slug, content.content_type?.slug || '');
                    }}
                  >
                    Read More
                    <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {data?.meta && data.meta.total > data.meta.per_page && (
        <div className="flex justify-center gap-2 pt-6">
          <Button
            variant="outline"
            disabled={data.meta.current_page === 1}
            onClick={() => setFilters({ ...filters, page: (data.meta.current_page || 1) - 1 })}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {data.meta.current_page} of {data.meta.last_page}
          </span>
          <Button
            variant="outline"
            disabled={data.meta.current_page === data.meta.last_page}
            onClick={() => setFilters({ ...filters, page: (data.meta.current_page || 1) + 1 })}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
