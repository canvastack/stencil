import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Package, Download, Star, Puzzle } from 'lucide-react';
import { toast } from 'sonner';
import { pluginService } from '@/services/api/plugins';
import { Plugin } from '@/types/plugin';

export default function PluginMarketplace() {
  const navigate = useNavigate();
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [filteredPlugins, setFilteredPlugins] = useState<Plugin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const fetchPlugins = async () => {
    setIsLoading(true);
    try {
      const data = await pluginService.getMarketplacePlugins();
      setPlugins(data);
      setFilteredPlugins(data);
    } catch (error: any) {
      toast.error('Failed to load plugins', {
        description: error.message || 'Unable to fetch marketplace plugins',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlugins();
  }, []);

  useEffect(() => {
    let filtered = [...plugins];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (plugin) =>
          plugin.display_name.toLowerCase().includes(query) ||
          plugin.description.toLowerCase().includes(query) ||
          plugin.author.toLowerCase().includes(query)
      );
    }

    if (selectedTag) {
      filtered = filtered.filter((plugin) => plugin.tags?.includes(selectedTag));
    }

    setFilteredPlugins(filtered);
  }, [searchQuery, selectedTag, plugins]);

  const getAllTags = () => {
    const tagsSet = new Set<string>();
    plugins.forEach((plugin) => {
      plugin.tags?.forEach((tag) => tagsSet.add(tag));
    });
    return Array.from(tagsSet);
  };

  const handlePluginClick = (pluginName: string) => {
    navigate(`/admin/plugins/marketplace/${pluginName}`);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-orange-light bg-clip-text text-transparent">
            Plugin Marketplace
          </h1>
          <p className="text-muted-foreground mt-1">
            Extend your application with powerful plugins
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/admin/plugins/installed')}
        >
          <Package className="w-4 h-4 mr-2" />
          My Plugins
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search plugins..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {getAllTags().length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              <Button
                variant={selectedTag === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTag(null)}
              >
                All
              </Button>
              {getAllTags().map((tag) => (
                <Button
                  key={tag}
                  variant={selectedTag === tag ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTag(tag)}
                >
                  {tag}
                </Button>
              ))}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredPlugins.length === 0 ? (
            <div className="text-center py-12">
              <Puzzle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No plugins found</h3>
              <p className="text-muted-foreground">
                {searchQuery || selectedTag
                  ? 'Try adjusting your search or filters'
                  : 'No plugins are available in the marketplace yet'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlugins.map((plugin) => (
                <Card
                  key={plugin.name}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handlePluginClick(plugin.name)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{plugin.display_name}</CardTitle>
                        <CardDescription className="mt-1">
                          by {plugin.author}
                        </CardDescription>
                      </div>
                      {plugin.icon && (
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/10 to-orange-light/10 flex items-center justify-center">
                          <Puzzle className="w-6 h-6 text-primary" />
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {plugin.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {plugin.tags?.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {plugin.tags && plugin.tags.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{plugin.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                      <Badge variant="outline">{plugin.version}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
