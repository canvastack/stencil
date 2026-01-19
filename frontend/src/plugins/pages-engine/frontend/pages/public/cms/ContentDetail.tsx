import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, Skeleton, Badge, Button, Separator } from '@canvastencil/ui-components';
import { usePublicContentBySlugQuery } from '@/hooks/cms';
import { Calendar, User, ArrowLeft, Tag, Folder } from 'lucide-react';
import { format } from 'date-fns';

export default function ContentDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = usePublicContentBySlugQuery(slug);

  if (isLoading) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <h1 className="text-4xl font-bold">Content Not Found</h1>
          <p className="text-muted-foreground">
            The content you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const content = data.data;
  const publishedDate = content.published_at ? new Date(content.published_at) : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <Card>
            <CardContent className="p-8">
              <div className="space-y-6">
                {content.featured_image && (
                  <img
                    src={content.featured_image}
                    alt={content.title}
                    className="w-full h-[400px] object-cover rounded-lg"
                  />
                )}

                <div className="space-y-4">
                  <div>
                    <h1 className="text-4xl font-bold tracking-tight mb-3">
                      {content.title}
                    </h1>
                    
                    {content.excerpt && (
                      <p className="text-xl text-muted-foreground">
                        {content.excerpt}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    {content.author && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{content.author.name}</span>
                      </div>
                    )}
                    
                    {publishedDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{format(publishedDate, 'MMMM dd, yyyy')}</span>
                      </div>
                    )}

                    <Badge variant="outline">
                      {content.content_type.name}
                    </Badge>
                  </div>

                  {(content.categories && content.categories.length > 0) || (content.tags && content.tags.length > 0) ? (
                    <div className="flex flex-wrap gap-4">
                      {content.categories && content.categories.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Folder className="h-4 w-4 text-muted-foreground" />
                          {content.categories.map((category) => (
                            <Badge key={category.uuid} variant="secondary">
                              {category.name}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {content.tags && content.tags.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          {content.tags.map((tag) => (
                            <Badge key={tag.uuid} variant="outline">
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>

                <Separator />

                <div 
                  className="prose prose-slate dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: typeof content.content === 'object' 
                      ? (content.content.wysiwyg || content.content.html || '')
                      : content.content 
                  }}
                />

                {content.seo_keywords && content.seo_keywords.length > 0 && (
                  <div className="pt-6 border-t">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                      Keywords
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {content.seo_keywords.map((keyword, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
