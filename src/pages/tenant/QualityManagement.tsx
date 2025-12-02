import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Plus,
  Filter,
  Download,
  RefreshCw,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Shield,
  Target,
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  FileText,
  Eye,
  Edit,
  Trash2,
  Play,
  Square,
  Camera,
  ClipboardCheck,
  Award,
  AlertCircle
} from 'lucide-react';
import { QCInspection, QCStats } from '@/services/tenant/qcService';
import { toast } from 'sonner';

// Mock data for now - will be replaced with real API calls
const mockInspections: QCInspection[] = [
  {
    id: '1',
    inspection_uuid: 'qc-2024-001',
    production_item_id: 'prod-1',
    order_id: 'order-1',
    product_id: 'product-1',
    inspection_type: 'final',
    inspection_date: '2024-12-02T10:00:00Z',
    inspection_number: 'QC-2024-001',
    status: 'passed',
    overall_score: 95,
    pass_rate: 98,
    inspector_id: 'inspector-1',
    inspector_name: 'John Doe',
    inspector_level: 'senior',
    inspection_duration_minutes: 45,
    sample_size: 10,
    total_quantity: 100,
    sample_method: 'random',
    criteria: [],
    defects: [],
    measurements: [],
    inspection_notes: 'All criteria met with excellent quality standards',
    recommendations: 'Continue current production process',
    corrective_actions: [],
    certification_required: true,
    certification_status: 'certified',
    photos: [],
    documents: [],
    test_reports: [],
    created_by: 'admin',
    updated_by: 'admin',
    created_at: '2024-12-02T09:00:00Z',
    updated_at: '2024-12-02T11:00:00Z',
    production_item: {
      id: 'prod-1',
      product_name: 'Custom Etched Plate',
      product_sku: 'CEP-001',
      quantity: 100
    },
    order: {
      id: 'order-1',
      order_code: 'ORD-2024-001',
      customer_name: 'ABC Company'
    }
  },
  {
    id: '2',
    inspection_uuid: 'qc-2024-002',
    production_item_id: 'prod-2',
    order_id: 'order-2',
    product_id: 'product-2',
    inspection_type: 'in_process',
    inspection_date: '2024-12-02T14:00:00Z',
    inspection_number: 'QC-2024-002',
    status: 'failed',
    overall_score: 72,
    pass_rate: 85,
    inspector_id: 'inspector-2',
    inspector_name: 'Jane Smith',
    inspector_level: 'lead',
    inspection_duration_minutes: 60,
    sample_size: 15,
    total_quantity: 150,
    sample_method: 'systematic',
    criteria: [],
    defects: [
      {
        id: 'defect-1',
        defect_type: 'minor',
        defect_code: 'DIM-001',
        defect_name: 'Dimension variance',
        description: 'Minor dimensional variation outside tolerance',
        quantity: 3,
        severity: 'medium',
        category: 'dimensional',
        photos: [],
        created_at: '2024-12-02T14:30:00Z'
      }
    ],
    measurements: [],
    inspection_notes: 'Minor dimensional issues found in 3 samples',
    recommendations: 'Review cutting process and tool calibration',
    corrective_actions: ['Recalibrate cutting tools', 'Retrain operators on precision requirements'],
    certification_required: false,
    photos: [],
    documents: [],
    test_reports: [],
    created_by: 'admin',
    updated_by: 'admin',
    created_at: '2024-12-02T13:30:00Z',
    updated_at: '2024-12-02T15:00:00Z',
    production_item: {
      id: 'prod-2',
      product_name: 'Precision Component',
      product_sku: 'PC-002',
      quantity: 150
    },
    order: {
      id: 'order-2',
      order_code: 'ORD-2024-002',
      customer_name: 'XYZ Manufacturing'
    }
  }
];

const mockStats: QCStats = {
  total_inspections: 145,
  passed_inspections: 132,
  failed_inspections: 13,
  pending_inspections: 8,
  overall_pass_rate: 91.0,
  average_quality_score: 88.5,
  defect_rate: 4.2,
  rework_rate: 2.1,
  rejection_rate: 0.8,
  active_inspectors: 5,
  average_inspection_time: 42,
  total_defects: 67,
  critical_defects: 3,
  defect_categories: [
    { category: 'dimensional', count: 25, percentage: 37.3 },
    { category: 'visual', count: 18, percentage: 26.9 },
    { category: 'functional', count: 15, percentage: 22.4 },
    { category: 'material', count: 9, percentage: 13.4 }
  ],
  monthly_trends: [
    { month: 'Oct 2024', inspections: 52, pass_rate: 89.5, quality_score: 86.2 },
    { month: 'Nov 2024', inspections: 48, pass_rate: 92.1, quality_score: 87.8 },
    { month: 'Dec 2024', inspections: 45, pass_rate: 91.0, quality_score: 88.5 }
  ],
  product_quality_ranking: [
    { product_id: 'product-1', product_name: 'Custom Etched Plate', pass_rate: 96.5, inspections_count: 42 },
    { product_id: 'product-2', product_name: 'Precision Component', pass_rate: 88.2, inspections_count: 38 },
    { product_id: 'product-3', product_name: 'Decorative Panel', pass_rate: 85.7, inspections_count: 35 }
  ]
};

const statusColors = {
  pending: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  passed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  conditional_pass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  rework_required: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
};

const inspectionTypeColors = {
  incoming: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  in_process: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  final: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  customer_return: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  supplier_audit: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
};

export default function QualityManagement() {
  const [inspections, setInspections] = useState<QCInspection[]>(mockInspections);
  const [stats, setStats] = useState<QCStats>(mockStats);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<QCInspection | null>(null);

  const filteredInspections = inspections.filter(inspection => {
    const matchesSearch = inspection.inspection_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inspection.production_item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inspection.order.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inspection.status === statusFilter;
    const matchesType = typeFilter === 'all' || inspection.inspection_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getQualityScoreColor = (score: number) => {
    if (score >= 95) return 'text-green-600';
    if (score >= 85) return 'text-blue-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleStartInspection = (inspection: QCInspection) => {
    toast.success('Inspection started successfully');
    // Update inspection status in real implementation
  };

  const handleCompleteInspection = (inspection: QCInspection) => {
    toast.success('Inspection completed successfully');
    // Update inspection status in real implementation
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quality Management</h1>
          <p className="text-muted-foreground">Manage quality control inspections and standards</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Inspection
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
          <TabsTrigger value="defects">Defect Analysis</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quality Metrics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.overall_pass_rate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.passed_inspections} of {stats.total_inspections} inspections
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
                <Award className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.average_quality_score.toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Average inspection score
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Defect Rate</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {stats.defect_rate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.critical_defects} critical defects
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Inspections</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.pending_inspections}
                </div>
                <p className="text-xs text-muted-foreground">
                  Awaiting inspection
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quality Trends and Defect Categories */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quality Trends</CardTitle>
                <CardDescription>Monthly quality performance overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.monthly_trends.map((trend, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{trend.month}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{trend.pass_rate.toFixed(1)}%</span>
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        </div>
                      </div>
                      <Progress value={trend.pass_rate} className="h-2" />
                      <div className="text-xs text-muted-foreground">
                        {trend.inspections} inspections, Quality Score: {trend.quality_score.toFixed(1)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Defect Categories</CardTitle>
                <CardDescription>Distribution of defect types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.defect_categories.map((category) => (
                    <div key={category.category} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="capitalize text-sm">{category.category}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{category.count}</span>
                        <span className="text-xs text-muted-foreground">({category.percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Product Quality Ranking */}
          <Card>
            <CardHeader>
              <CardTitle>Product Quality Ranking</CardTitle>
              <CardDescription>Quality performance by product type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.product_quality_ranking.map((product, index) => (
                  <div key={product.product_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                        <span className="text-sm font-bold text-primary">#{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium">{product.product_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {product.inspections_count} inspections
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getQualityScoreColor(product.pass_rate)}`}>
                        {product.pass_rate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Pass rate</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inspections" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search inspections..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="passed">Passed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="rework_required">Rework Required</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="incoming">Incoming</SelectItem>
                    <SelectItem value="in_process">In Process</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                    <SelectItem value="customer_return">Customer Return</SelectItem>
                    <SelectItem value="supplier_audit">Supplier Audit</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                }}>
                  <Filter className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Inspections Table */}
          <Card>
            <CardHeader>
              <CardTitle>Quality Inspections</CardTitle>
              <CardDescription>
                Showing {filteredInspections.length} of {inspections.length} inspections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Inspection</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Quality Score</TableHead>
                      <TableHead>Inspector</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-12">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInspections.map((inspection) => (
                      <TableRow key={inspection.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{inspection.inspection_number}</div>
                            <div className="text-sm text-muted-foreground">
                              Order: {inspection.order.order_code}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Customer: {inspection.order.customer_name}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{inspection.production_item.product_name}</div>
                            <div className="text-sm text-muted-foreground">
                              SKU: {inspection.production_item.product_sku}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Qty: {inspection.production_item.quantity}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={inspectionTypeColors[inspection.inspection_type]}>
                            {inspection.inspection_type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[inspection.status]}>
                            {inspection.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className={`text-lg font-bold ${getQualityScoreColor(inspection.overall_score)}`}>
                              {inspection.overall_score}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Pass: {inspection.pass_rate}%
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{inspection.inspector_name}</div>
                            <div className="text-xs text-muted-foreground">
                              Level: {inspection.inspector_level}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Duration: {inspection.inspection_duration_minutes}min
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(inspection.inspection_date).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(inspection.inspection_date).toLocaleTimeString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedInspection(inspection)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {inspection.status === 'pending' && (
                                <DropdownMenuItem onClick={() => handleStartInspection(inspection)}>
                                  <Play className="h-4 w-4 mr-2" />
                                  Start Inspection
                                </DropdownMenuItem>
                              )}
                              {inspection.status === 'in_progress' && (
                                <DropdownMenuItem onClick={() => handleCompleteInspection(inspection)}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Complete
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Camera className="h-4 w-4 mr-2" />
                                Add Photos
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="defects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Defect Analysis</CardTitle>
              <CardDescription>Analyze defect patterns and root causes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Defect Analysis Dashboard</h3>
                <p className="text-muted-foreground">Detailed defect analysis interface coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quality Reports</CardTitle>
              <CardDescription>Generate and download quality control reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Quality Reports</h3>
                <p className="text-muted-foreground">Report generation interface coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Inspection Details Dialog */}
      {selectedInspection && (
        <Dialog open={!!selectedInspection} onOpenChange={() => setSelectedInspection(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Inspection Details - {selectedInspection.inspection_number}</DialogTitle>
              <DialogDescription>
                Quality control inspection for {selectedInspection.production_item.product_name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Basic Information</h4>
                  <div className="space-y-1 text-sm">
                    <div><strong>Type:</strong> {selectedInspection.inspection_type.replace('_', ' ')}</div>
                    <div><strong>Status:</strong> 
                      <Badge className={`ml-2 ${statusColors[selectedInspection.status]}`}>
                        {selectedInspection.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div><strong>Quality Score:</strong> 
                      <span className={`ml-2 font-bold ${getQualityScoreColor(selectedInspection.overall_score)}`}>
                        {selectedInspection.overall_score}
                      </span>
                    </div>
                    <div><strong>Pass Rate:</strong> {selectedInspection.pass_rate}%</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Inspector Information</h4>
                  <div className="space-y-1 text-sm">
                    <div><strong>Inspector:</strong> {selectedInspection.inspector_name}</div>
                    <div><strong>Level:</strong> {selectedInspection.inspector_level}</div>
                    <div><strong>Duration:</strong> {selectedInspection.inspection_duration_minutes} minutes</div>
                    <div><strong>Date:</strong> {new Date(selectedInspection.inspection_date).toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Sample Information</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div><strong>Sample Size:</strong> {selectedInspection.sample_size}</div>
                  <div><strong>Total Quantity:</strong> {selectedInspection.total_quantity}</div>
                  <div><strong>Method:</strong> {selectedInspection.sample_method}</div>
                </div>
              </div>

              {selectedInspection.defects.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Defects Found</h4>
                  <div className="space-y-2">
                    {selectedInspection.defects.map((defect) => (
                      <Alert key={defect.id}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{defect.defect_name} ({defect.defect_code})</div>
                              <div className="text-sm text-muted-foreground">{defect.description}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Quantity: {defect.quantity} | Category: {defect.category}
                              </div>
                            </div>
                            <Badge variant={defect.severity === 'critical' ? 'destructive' : 'secondary'}>
                              {defect.severity}
                            </Badge>
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-2">Notes & Recommendations</h4>
                <div className="space-y-2 text-sm">
                  {selectedInspection.inspection_notes && (
                    <div>
                      <strong>Inspection Notes:</strong>
                      <p className="text-muted-foreground">{selectedInspection.inspection_notes}</p>
                    </div>
                  )}
                  {selectedInspection.recommendations && (
                    <div>
                      <strong>Recommendations:</strong>
                      <p className="text-muted-foreground">{selectedInspection.recommendations}</p>
                    </div>
                  )}
                  {selectedInspection.corrective_actions.length > 0 && (
                    <div>
                      <strong>Corrective Actions:</strong>
                      <ul className="list-disc list-inside text-muted-foreground">
                        {selectedInspection.corrective_actions.map((action, index) => (
                          <li key={index}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}