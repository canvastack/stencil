import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Download, 
  Printer,
  Calendar,
  User,
  Clock,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { format } from 'date-fns';

interface QCInspectionData {
  uuid: string;
  order_number: string;
  inspection_number: string;
  product_name: string;
  inspection_date: string;
  inspector_name: string;
  inspection_duration_minutes: number;
  overall_rating: string;
  total_score: number;
  critical_items_passed: boolean;
  decision: string;
  decision_notes: string;
  checklist_results: Record<string, any>;
  photos: string[];
  created_at: string;
}

interface QCInspectionViewProps {
  inspection: QCInspectionData;
  onDownloadPDF?: () => void;
  onPrint?: () => void;
}

const decisionConfig = {
  approved: {
    label: 'APPROVED',
    icon: CheckCircle2,
    color: 'bg-green-600',
    textColor: 'text-green-600'
  },
  approved_with_notes: {
    label: 'APPROVED WITH NOTES',
    icon: AlertCircle,
    color: 'bg-yellow-600',
    textColor: 'text-yellow-600'
  },
  rejected: {
    label: 'REJECTED',
    icon: XCircle,
    color: 'bg-red-600',
    textColor: 'text-red-600'
  },
  needs_rework: {
    label: 'NEEDS REWORK',
    icon: AlertCircle,
    color: 'bg-orange-600',
    textColor: 'text-orange-600'
  }
};

const statusConfig = {
  pass: {
    label: 'Pass',
    icon: CheckCircle2,
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
  },
  fail: {
    label: 'Fail',
    icon: XCircle,
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  },
  needs_rework: {
    label: 'Needs Rework',
    icon: AlertCircle,
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
  }
};

const categoryNames: Record<string, string> = {
  physical_specifications: 'Physical Specifications',
  etching_quality: 'Etching Quality',
  finishing_quality: 'Finishing Quality',
  functional_checks: 'Functional Checks',
  packaging_presentation: 'Packaging & Presentation'
};

const itemNames: Record<string, string> = {
  dimensions_accuracy: 'Dimensions Accuracy',
  material_verification: 'Material Verification',
  weight_check: 'Weight Check',
  etching_depth: 'Etching Depth',
  design_accuracy: 'Design Accuracy',
  line_quality: 'Line Quality',
  surface_finish: 'Surface Finish',
  edge_quality: 'Edge Quality',
  color_consistency: 'Color Consistency',
  mounting_installation: 'Mounting/Installation',
  readability: 'Readability',
  durability_test: 'Durability Test',
  protective_packaging: 'Protective Packaging',
  labeling: 'Labeling',
  documentation: 'Documentation'
};

export function QCInspectionView({ 
  inspection, 
  onDownloadPDF, 
  onPrint 
}: QCInspectionViewProps) {
  const decisionInfo = decisionConfig[inspection.decision as keyof typeof decisionConfig];
  const DecisionIcon = decisionInfo?.icon || CheckCircle2;

  const calculateCategoryScore = (categoryData: Record<string, any>) => {
    const items = Object.values(categoryData);
    const passedItems = items.filter((item: any) => item.status === 'pass').length;
    return items.length > 0 ? Math.round((passedItems / items.length) * 100) : 0;
  };

  const allPhotos = Object.values(inspection.checklist_results).flatMap((category: any) =>
    Object.values(category).flatMap((item: any) => item.photos || [])
  );

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className={`border-2 ${decisionInfo?.color.replace('bg-', 'border-')}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl flex items-center gap-2">
                <DecisionIcon className={`w-6 h-6 ${decisionInfo?.textColor}`} />
                QC Inspection Report
              </CardTitle>
              <CardDescription>
                Order #{inspection.order_number} - Inspection #{inspection.inspection_number}
              </CardDescription>
            </div>
            <Badge className={decisionInfo?.color}>
              {decisionInfo?.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Inspection Date</p>
                <p className="font-medium">
                  {format(new Date(inspection.inspection_date), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Inspector</p>
                <p className="font-medium">{inspection.inspector_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="font-medium">{inspection.inspection_duration_minutes} min</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Product</p>
                <p className="font-medium truncate">{inspection.product_name}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Result Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
        <CardHeader>
          <CardTitle>Overall Result</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Overall Score</p>
              <div className="flex items-center gap-2">
                <Progress value={inspection.total_score} className="h-3 flex-1" />
                <span className="text-2xl font-bold">{inspection.total_score}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Overall Rating</p>
              <Badge variant="outline" className="text-lg capitalize">
                {inspection.overall_rating}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Critical Items:</span>
            {inspection.critical_items_passed ? (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                All Passed
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="w-3 h-3 mr-1" />
                Failed
              </Badge>
            )}
          </div>

          {inspection.decision_notes && (
            <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border">
              <p className="text-sm font-medium mb-2">Decision Notes:</p>
              <p className="text-sm text-muted-foreground">{inspection.decision_notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs for Checklist, Photos, History */}
      <Tabs defaultValue="checklist" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="checklist">Checklist Results</TabsTrigger>
          <TabsTrigger value="photos">
            Photos ({allPhotos.length})
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Checklist Tab */}
        <TabsContent value="checklist" className="space-y-4">
          {Object.entries(inspection.checklist_results).map(([categoryId, categoryData]: [string, any]) => {
            const categoryScore = calculateCategoryScore(categoryData);
            
            return (
              <Card key={categoryId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {categoryNames[categoryId] || categoryId}
                    </CardTitle>
                    <Badge variant="outline">
                      {categoryScore}% Pass Rate
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(categoryData).map(([itemId, itemData]: [string, any]) => {
                    const statusInfo = statusConfig[itemData.status as keyof typeof statusConfig];
                    const StatusIcon = statusInfo?.icon || CheckCircle2;

                    return (
                      <div key={itemId} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{itemNames[itemId] || itemId}</h4>
                            {itemData.notes && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {itemData.notes}
                              </p>
                            )}
                          </div>
                          <Badge className={statusInfo?.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusInfo?.label}
                          </Badge>
                        </div>

                        {/* Measurements */}
                        {itemData.measurements && Object.keys(itemData.measurements).length > 0 && (
                          <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                            <p className="text-xs font-medium mb-2">Measurements:</p>
                            <div className="grid grid-cols-3 gap-2">
                              {Object.entries(itemData.measurements).map(([key, value]: [string, any]) => (
                                <div key={key}>
                                  <p className="text-xs text-muted-foreground capitalize">
                                    {key.replace('_', ' ')}
                                  </p>
                                  <p className="text-sm font-medium">{value}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Photos */}
                        {itemData.photos && itemData.photos.length > 0 && (
                          <div className="grid grid-cols-4 gap-2">
                            {itemData.photos.map((photo: string, index: number) => (
                              <img
                                key={index}
                                src={photo}
                                alt={`${itemNames[itemId]} - Photo ${index + 1}`}
                                className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => window.open(photo, '_blank')}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                All Inspection Photos ({allPhotos.length})
              </CardTitle>
              <CardDescription>
                Click on any photo to view full size
              </CardDescription>
            </CardHeader>
            <CardContent>
              {allPhotos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {allPhotos.map((photo: string, index: number) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo}
                        alt={`Inspection photo ${index + 1}`}
                        className="w-full h-32 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => window.open(photo, '_blank')}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No photos uploaded for this inspection
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Inspection History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-2" />
                  <div className="flex-1">
                    <p className="font-medium">Inspection Created</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(inspection.created_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-green-600 mt-2" />
                  <div className="flex-1">
                    <p className="font-medium">Inspection Completed</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(inspection.inspection_date), 'MMM dd, yyyy HH:mm')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      By {inspection.inspector_name}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Button variant="outline" onClick={onDownloadPDF}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" onClick={onPrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
