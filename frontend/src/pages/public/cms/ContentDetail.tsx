import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  User, 
  Eye, 
  MessageSquare, 
  Clock, 
  Share2, 
  Bookmark,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import { usePublicContentBySlugQuery } from '@/hooks/cms';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow, format } from 'date-fns';
import { CommentSection } from '@/components/cms/CommentSection';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ContentDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  const { data, isLoading } = usePublicContentBySlugQuery(slug);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-[400px] w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!data?.data) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-lg">Content not found</p>
            <Button 
              onClick={() => navigate('/content')} 
              variant="outline" 
              className="mt-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Content
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const content = data.data;
  const contentBody = content.content.wysiwyg || content.content.markdown || '';

  return (
    <div className="min-h-screen">
      {content.featured_image && (
        <div className="w-full h-[400px] md:h-[500px] overflow-hidden bg-muted">
          <img
            src={content.featured_image.url}
            alt={content.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <article className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {content.content_type && (
                <Badge variant="outline">{content.content_type.name}</Badge>
              )}
              {content.categories && content.categories.map((cat) => (
                <Badge key={cat.uuid} variant="secondary">{cat.name}</Badge>
              ))}
              {content.flags?.is_featured && (
                <Badge>Featured</Badge>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              {content.title}
            </h1>

            {content.excerpt && (
              <p className="text-xl text-muted-foreground">
                {content.excerpt}
              </p>
            )}

            <div className="flex items-center gap-4 py-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={content.author?.avatar} />
                  <AvatarFallback>
                    {content.author?.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{content.author?.name || 'Unknown'}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {content.published_at
                        ? format(new Date(content.published_at), 'MMMM d, yyyy')
                        : format(new Date(content.created_at), 'MMMM d, yyyy')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="ml-auto flex items-center gap-4 text-sm text-muted-foreground">
                {content.metrics && (
                  <>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{content.metrics.view_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>{content.metrics.comment_count || 0}</span>
                    </div>
                  </>
                )}
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatDistanceToNow(new Date(content.created_at), { addSuffix: true })}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Bookmark className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-8">
              <div 
                className="prose dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-primary prose-img:rounded-lg"
                dangerouslySetInnerHTML={{ __html: contentBody }}
              />
            </CardContent>
          </Card>

          {content.categories && content.categories.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3">Categories</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {content.categories.map((cat) => (
                    <Badge
                      key={cat.uuid}
                      variant="secondary"
                      className="cursor-pointer hover:bg-secondary/80"
                      onClick={() => navigate(`/content?category=${cat.slug}`)}
                    >
                      {cat.path.split(' > ').map((part, i, arr) => (
                        <span key={i}>
                          {part}
                          {i < arr.length - 1 && (
                            <ChevronRight className="inline h-3 w-3 mx-1" />
                          )}
                        </span>
                      ))}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Separator className="my-8" />

          {content.flags?.is_commentable && (
            <CommentSection contentUuid={content.uuid} />
          )}
        </article>
      </div>
    </div>
  );
}
