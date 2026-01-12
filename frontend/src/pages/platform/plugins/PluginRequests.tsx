import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, RefreshCw, Filter, CheckCircle2, XCircle, Clock, Package, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { pluginApprovalService } from '@/services/platform/pluginApprovalService';
import { InstalledPlugin } from '@/types/plugin';
import { format } from 'date-fns';

export default function PluginRequests() {
  const navigate = useNavigate();
  const [plugins, setPlugins] = useState<InstalledPlugin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const filters: any = {
        page: currentPage,
        per_page: 15,
      };

      if (statusFilter && statusFilter !== 'all') {
        filters.status = statusFilter;
      }

      if (searchQuery) {
        filters.plugin_name = searchQuery;
      }

      const response = await pluginApprovalService.getPluginRequests(filters);
      setPlugins(response.data);
      setTotalPages(response.pagination.last_page);
      setTotalItems(response.pagination.total);
    } catch (error: any) {
      toast.error('Failed to load plugin requests', {
        description: error.message || 'Unable to fetch plugin requests',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [currentPage, statusFilter]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchRequests();
  };

  const getStatusBadge = (status: InstalledPlugin['status']) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      pending: { variant: 'secondary' as const, icon: Clock, label: 'Pending' },
      approved: { variant: 'default' as const, icon: CheckCircle2, label: 'Approved' },
      active: { variant: 'default' as const, icon: CheckCircle2, label: 'Active' },
      rejected: { variant: 'destructive' as const, icon: XCircle, label: 'Rejected' },
      suspended: { variant: 'destructive' as const, icon: XCircle, label: 'Suspended' },
      expired: { variant: 'secondary' as const, icon: Clock, label: 'Expired' },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getTenantName = (plugin: InstalledPlugin) => {
    if (typeof plugin.requested_by === 'object' && plugin.requested_by) {
      return plugin.requested_by.name || 'Unknown';
    }
    return 'Unknown';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Plugin Installation Requests
          </h1>
          <p className="text-muted-foreground mt-1">
            Review and approve plugin installation requests from tenants
          </p>
        </div>
        <Button onClick={fetchRequests} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Requests</CardTitle>
          <CardDescription>Search and filter plugin installation requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by plugin name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Requests</CardTitle>
              <CardDescription>
                {totalItems} {totalItems === 1 ? 'request' : 'requests'} found
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-6 w-24" />
                </div>
              ))}
            </div>
          ) : plugins.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No requests found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'No plugin installation requests yet'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plugin</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plugins.map((plugin) => (
                    <TableRow key={plugin.uuid}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{plugin.display_name}</div>
                          <div className="text-sm text-muted-foreground">
                            v{plugin.version}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">Tenant #{plugin.uuid.substring(0, 8)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{getTenantName(plugin)}</div>
                      </TableCell>
                      <TableCell>{getStatusBadge(plugin.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {plugin.requested_at
                            ? format(new Date(plugin.requested_at), 'PPp')
                            : 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            navigate(`/platform/plugins/requests/${plugin.uuid}`)
                          }
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
