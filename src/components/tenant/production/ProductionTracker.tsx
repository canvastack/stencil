import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Play,
  Pause,
  Square,
  CheckCircle,
  Clock,
  AlertTriangle,
  Settings,
  Users,
  Calendar,
  FileText,
  Edit,
  Eye,
  BarChart3,
  Activity
} from 'lucide-react';
import { ProductionItem, ProductionCheckpoint, ProductionIssue } from '@/services/tenant/productionService';
import { useProductionStore } from '@/stores/productionStore';
import { toast } from 'sonner';

interface ProductionTrackerProps {
  item: ProductionItem;
  onUpdate?: () => void;
}

const statusColors = {
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  material_preparation: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  in_progress: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  quality_check: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
  on_hold: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
};

const checkpointStatusColors = {
  pending: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  skipped: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
};

export function ProductionTracker({ item, onUpdate }: ProductionTrackerProps) {
  const {
    checkpoints,
    updateProductionItem,
    updateProgress,
    startProduction,
    completeProduction,
    fetchProductionCheckpoints,
    updateCheckpoint,
    createProductionIssue,
    loading
  } = useProductionStore();

  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [progressValue, setProgressValue] = useState(item.progress_percentage);
  const [currentStage, setCurrentStage] = useState(item.current_stage || '');
  const [issueData, setIssueData] = useState({
    title: '',
    description: '',
    issue_type: 'quality_defect' as const,
    severity: 'medium' as const
  });

  const handleStartProduction = async () => {
    try {
      await startProduction(item.id, {
        actual_start_date: new Date().toISOString(),
        notes: 'Production started from tracker'
      });
      toast.success('Production started successfully');
      onUpdate?.();
    } catch (error) {
      toast.error('Failed to start production');
    }
  };

  const handleCompleteProduction = async () => {
    try {
      await completeProduction(item.id, {
        actual_completion_date: new Date().toISOString(),
        quality_check_required: true,
        notes: 'Production completed from tracker'
      });
      toast.success('Production completed successfully');
      onUpdate?.();
    } catch (error) {
      toast.error('Failed to complete production');
    }
  };

  const handleUpdateProgress = async () => {
    try {
      await updateProgress(item.id, {
        progress_percentage: progressValue,
        current_stage: currentStage,
        notes: `Progress updated to ${progressValue}% - ${currentStage}`
      });
      toast.success('Progress updated successfully');
      setShowProgressDialog(false);
      onUpdate?.();
    } catch (error) {
      toast.error('Failed to update progress');
    }
  };

  const handleCreateIssue = async () => {
    try {
      await createProductionIssue({
        production_item_id: item.id,
        ...issueData
      });
      toast.success('Production issue created successfully');
      setShowIssueDialog(false);
      setIssueData({
        title: '',
        description: '',
        issue_type: 'quality_defect',
        severity: 'medium'
      });
      onUpdate?.();
    } catch (error) {
      toast.error('Failed to create production issue');
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return 'bg-green-500';
    if (progress >= 70) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const isOverdue = item.scheduled_completion_date && new Date(item.scheduled_completion_date) < new Date() && item.status !== 'completed';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{item.product_name}</CardTitle>
            <CardDescription>
              Order: {item.order.order_code} | Customer: {item.order.customer_name}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={statusColors[item.status]}>
              {item.status.replace('_', ' ')}
            </Badge>
            {isOverdue && (
              <Badge variant="destructive">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Overdue
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Production Progress</h4>
            <span className="text-sm text-muted-foreground">{item.progress_percentage}%</span>
          </div>
          <Progress 
            value={item.progress_percentage} 
            className="h-3"
          />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Current Stage: {item.current_stage || 'Not specified'}</span>
            <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Update Progress
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Production Progress</DialogTitle>
                  <DialogDescription>
                    Update the current progress and stage for this production item.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="progress">Progress (%)</Label>
                    <Input
                      id="progress"
                      type="number"
                      min="0"
                      max="100"
                      value={progressValue}
                      onChange={(e) => setProgressValue(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stage">Current Stage</Label>
                    <Input
                      id="stage"
                      value={currentStage}
                      onChange={(e) => setCurrentStage(e.target.value)}
                      placeholder="e.g. Material cutting, Assembly, etc."
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowProgressDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateProgress} disabled={loading}>
                      Update Progress
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {item.status === 'scheduled' && (
            <Button onClick={handleStartProduction} disabled={loading}>
              <Play className="w-4 h-4 mr-2" />
              Start Production
            </Button>
          )}
          {item.status === 'in_progress' && (
            <Button onClick={handleCompleteProduction} disabled={loading}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Production
            </Button>
          )}
          <Dialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Report Issue
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Report Production Issue</DialogTitle>
                <DialogDescription>
                  Report an issue encountered during production.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="issue-title">Issue Title</Label>
                  <Input
                    id="issue-title"
                    value={issueData.title}
                    onChange={(e) => setIssueData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Brief description of the issue"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issue-type">Issue Type</Label>
                  <Select 
                    value={issueData.issue_type} 
                    onValueChange={(value: any) => setIssueData(prev => ({ ...prev, issue_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quality_defect">Quality Defect</SelectItem>
                      <SelectItem value="material_shortage">Material Shortage</SelectItem>
                      <SelectItem value="equipment_failure">Equipment Failure</SelectItem>
                      <SelectItem value="delay">Production Delay</SelectItem>
                      <SelectItem value="safety_incident">Safety Incident</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issue-severity">Severity</Label>
                  <Select 
                    value={issueData.severity} 
                    onValueChange={(value: any) => setIssueData(prev => ({ ...prev, severity: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issue-description">Description</Label>
                  <Textarea
                    id="issue-description"
                    value={issueData.description}
                    onChange={(e) => setIssueData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detailed description of the issue and its impact"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowIssueDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateIssue} disabled={loading || !issueData.title || !issueData.description}>
                    Report Issue
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Item Details */}
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="checkpoints">Checkpoints</TabsTrigger>
            <TabsTrigger value="issues">Issues</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Product SKU:</strong> {item.product_sku}
              </div>
              <div>
                <strong>Quantity:</strong> {item.quantity} {item.unit_of_measure}
              </div>
              <div>
                <strong>Priority:</strong> 
                <Badge className="ml-2" variant={item.priority === 'urgent' ? 'destructive' : 'secondary'}>
                  {item.priority}
                </Badge>
              </div>
              <div>
                <strong>QC Status:</strong> 
                <Badge className="ml-2" variant="outline">
                  {item.qc_status.replace('_', ' ')}
                </Badge>
              </div>
              {item.batch_number && (
                <div>
                  <strong>Batch Number:</strong> {item.batch_number}
                </div>
              )}
              {item.lot_number && (
                <div>
                  <strong>Lot Number:</strong> {item.lot_number}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Scheduled Start:</strong> 
                <div className="text-muted-foreground">
                  {item.scheduled_start_date ? new Date(item.scheduled_start_date).toLocaleString() : 'Not scheduled'}
                </div>
              </div>
              <div>
                <strong>Scheduled Completion:</strong>
                <div className="text-muted-foreground">
                  {item.scheduled_completion_date ? new Date(item.scheduled_completion_date).toLocaleString() : 'Not scheduled'}
                </div>
              </div>
              <div>
                <strong>Actual Start:</strong>
                <div className="text-muted-foreground">
                  {item.actual_start_date ? new Date(item.actual_start_date).toLocaleString() : 'Not started'}
                </div>
              </div>
              <div>
                <strong>Actual Completion:</strong>
                <div className="text-muted-foreground">
                  {item.actual_completion_date ? new Date(item.actual_completion_date).toLocaleString() : 'Not completed'}
                </div>
              </div>
              <div>
                <strong>Estimated Duration:</strong>
                <div className="text-muted-foreground">
                  {item.estimated_duration_hours} hours
                </div>
              </div>
              <div>
                <strong>Actual Duration:</strong>
                <div className="text-muted-foreground">
                  {item.actual_duration_hours ? `${item.actual_duration_hours} hours` : 'In progress'}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="checkpoints" className="space-y-4">
            <div className="text-center py-4">
              <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mt-2">
                Checkpoints feature coming soon
              </p>
            </div>
          </TabsContent>

          <TabsContent value="issues" className="space-y-4">
            <div className="space-y-2">
              {item.issues?.length > 0 ? (
                item.issues.map((issue) => (
                  <Alert key={issue.id}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex justify-between">
                        <span>{issue.title}</span>
                        <Badge variant={issue.severity === 'critical' ? 'destructive' : 'secondary'}>
                          {issue.severity}
                        </Badge>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))
              ) : (
                <div className="text-center py-4">
                  <CheckCircle className="mx-auto h-8 w-8 text-green-500" />
                  <p className="text-sm text-muted-foreground mt-2">
                    No issues reported
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}