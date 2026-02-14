import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  AlertCircle, 
  Save,
  Send,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { QCPhotoUpload } from './QCPhotoUpload';

interface Photo {
  id: string;
  file: File;
  url: string;
  caption?: string;
  uploaded?: boolean;
  uploadedUrl?: string;
}

interface ChecklistItem {
  id: string;
  name: string;
  description: string;
  status: 'pass' | 'fail' | 'needs_rework' | null;
  notes: string;
  photos: Photo[];
  minPhotos: number;
  maxPhotos: number;
  measurements?: Record<string, string>;
}

interface ChecklistCategory {
  id: string;
  name: string;
  items: ChecklistItem[];
}

interface QCInspectionFormProps {
  orderId: string;
  orderNumber: string;
  productName: string;
  onSubmit: (data: any) => Promise<void>;
  onSaveDraft: (data: any) => Promise<void>;
}

export function QCInspectionForm({
  orderId,
  orderNumber,
  productName,
  onSubmit,
  onSaveDraft
}: QCInspectionFormProps) {
  const [categories, setCategories] = useState<ChecklistCategory[]>([
    {
      id: 'physical_specifications',
      name: 'Physical Specifications',
      items: [
        {
          id: 'dimensions_accuracy',
          name: 'Dimensions Accuracy',
          description: 'Measure length, width, height. Compare against order specifications. Tolerance: ±2mm for standard, ±1mm for premium',
          status: null,
          notes: '',
          photos: [],
          minPhotos: 2,
          maxPhotos: 4,
          measurements: { length: '', width: '', height: '' }
        },
        {
          id: 'material_verification',
          name: 'Material Verification',
          description: 'Confirm material matches order. Check material quality grade. Verify thickness matches specification',
          status: null,
          notes: '',
          photos: [],
          minPhotos: 1,
          maxPhotos: 2
        },
        {
          id: 'weight_check',
          name: 'Weight Check',
          description: 'Weigh product. Compare against expected weight range',
          status: null,
          notes: '',
          photos: [],
          minPhotos: 0,
          maxPhotos: 1,
          measurements: { weight_grams: '' }
        }
      ]
    },
    {
      id: 'etching_quality',
      name: 'Etching Quality',
      items: [
        {
          id: 'etching_depth',
          name: 'Etching Depth',
          description: 'Measure etching depth. Verify consistency across design. Check against specification',
          status: null,
          notes: '',
          photos: [],
          minPhotos: 2,
          maxPhotos: 3,
          measurements: { depth_mm: '' }
        },
        {
          id: 'design_accuracy',
          name: 'Design Accuracy',
          description: 'Compare etched design against approved artwork. Check for missing elements. Verify text spelling and accuracy',
          status: null,
          notes: '',
          photos: [],
          minPhotos: 3,
          maxPhotos: 5
        },
        {
          id: 'line_quality',
          name: 'Line Quality',
          description: 'Check line sharpness and clarity. Verify no bleeding or smudging. Check corner and edge definition',
          status: null,
          notes: '',
          photos: [],
          minPhotos: 2,
          maxPhotos: 3
        }
      ]
    },
    {
      id: 'finishing_quality',
      name: 'Finishing Quality',
      items: [
        {
          id: 'surface_finish',
          name: 'Surface Finish',
          description: 'Check for scratches, dents, or marks. Verify polish quality. Check for oxidation or discoloration',
          status: null,
          notes: '',
          photos: [],
          minPhotos: 3,
          maxPhotos: 4
        },
        {
          id: 'edge_quality',
          name: 'Edge Quality',
          description: 'Check edge smoothness. Verify no sharp edges (safety). Check for burrs or rough spots',
          status: null,
          notes: '',
          photos: [],
          minPhotos: 2,
          maxPhotos: 3
        },
        {
          id: 'color_consistency',
          name: 'Color Consistency',
          description: 'Verify color matches specification. Check for color uniformity. Compare against color sample',
          status: null,
          notes: '',
          photos: [],
          minPhotos: 2,
          maxPhotos: 3
        }
      ]
    },
    {
      id: 'functional_checks',
      name: 'Functional Checks',
      items: [
        {
          id: 'mounting_installation',
          name: 'Mounting/Installation',
          description: 'Check mounting holes. Verify hardware included. Test mounting mechanism',
          status: null,
          notes: '',
          photos: [],
          minPhotos: 1,
          maxPhotos: 2
        },
        {
          id: 'readability',
          name: 'Readability',
          description: 'Verify text is clearly readable. Check contrast and visibility. Test from normal viewing distance',
          status: null,
          notes: '',
          photos: [],
          minPhotos: 1,
          maxPhotos: 2
        },
        {
          id: 'durability_test',
          name: 'Durability Test',
          description: 'Light scratch test (non-destructive). Check adhesion of coatings. Verify structural integrity',
          status: null,
          notes: '',
          photos: [],
          minPhotos: 0,
          maxPhotos: 1
        }
      ]
    },
    {
      id: 'packaging_presentation',
      name: 'Packaging & Presentation',
      items: [
        {
          id: 'protective_packaging',
          name: 'Protective Packaging',
          description: 'Check protective film/covering. Verify bubble wrap or padding. Check box/container quality',
          status: null,
          notes: '',
          photos: [],
          minPhotos: 1,
          maxPhotos: 2
        },
        {
          id: 'labeling',
          name: 'Labeling',
          description: 'Verify product label present. Check order number on package. Verify customer name/address label',
          status: null,
          notes: '',
          photos: [],
          minPhotos: 0,
          maxPhotos: 1
        },
        {
          id: 'documentation',
          name: 'Documentation',
          description: 'Include care instructions. Include warranty card. Include installation guide',
          status: null,
          notes: '',
          photos: [],
          minPhotos: 0,
          maxPhotos: 1
        }
      ]
    }
  ]);

  const [overallRating, setOverallRating] = useState<string>('');
  const [finalDecision, setFinalDecision] = useState<string>('');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [inspectorName, setInspectorName] = useState('');
  const [inspectionDuration, setInspectionDuration] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStatusChange = (categoryId: string, itemId: string, status: 'pass' | 'fail' | 'needs_rework') => {
    setCategories(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          items: cat.items.map(item => 
            item.id === itemId ? { ...item, status } : item
          )
        };
      }
      return cat;
    }));
  };

  const handleNotesChange = (categoryId: string, itemId: string, notes: string) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          items: cat.items.map(item => 
            item.id === itemId ? { ...item, notes } : item
          )
        };
      }
      return cat;
    }));
  };

  const handlePhotosChange = (categoryId: string, itemId: string, photos: Photo[]) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          items: cat.items.map(item => 
            item.id === itemId ? { ...item, photos } : item
          )
        };
      }
      return cat;
    }));
  };

  const calculateScore = () => {
    let totalItems = 0;
    let passedItems = 0;

    categories.forEach(cat => {
      cat.items.forEach(item => {
        if (item.status) {
          totalItems++;
          if (item.status === 'pass') {
            passedItems++;
          }
        }
      });
    });

    return totalItems > 0 ? Math.round((passedItems / totalItems) * 100) : 0;
  };

  const checkCriticalItems = () => {
    const criticalItemIds = [
      'dimensions_accuracy',
      'material_verification',
      'design_accuracy',
      'surface_finish'
    ];

    return categories.every(cat => 
      cat.items.every(item => 
        !criticalItemIds.includes(item.id) || item.status === 'pass'
      )
    );
  };

  const handleSubmitInspection = async () => {
    // Validation
    if (!overallRating) {
      toast.error('Please select an overall rating');
      return;
    }

    if (!finalDecision) {
      toast.error('Please select a final decision');
      return;
    }

    if (!inspectorName) {
      toast.error('Please enter inspector name');
      return;
    }

    // Validate minimum photo requirements
    const photoValidation = categories.every(cat => 
      cat.items.every(item => item.photos.length >= item.minPhotos)
    );

    if (!photoValidation) {
      toast.error('Some checklist items do not meet minimum photo requirements');
      return;
    }

    const score = calculateScore();
    const criticalPassed = checkCriticalItems();

    const inspectionData = {
      order_id: orderId,
      checklist_results: categories.reduce((acc, cat) => {
        acc[cat.id] = cat.items.reduce((itemAcc, item) => {
          itemAcc[item.id] = {
            status: item.status,
            notes: item.notes,
            photos: item.photos.map(p => ({
              url: p.url,
              caption: p.caption,
              uploaded_url: p.uploadedUrl
            })),
            photo_count: item.photos.length,
            measurements: item.measurements
          };
          return itemAcc;
        }, {} as Record<string, any>);
        return acc;
      }, {} as Record<string, any>),
      overall_rating: overallRating,
      total_score: score,
      critical_items_passed: criticalPassed,
      decision: finalDecision,
      decision_notes: decisionNotes,
      inspector_name: inspectorName,
      inspection_duration_minutes: parseInt(inspectionDuration) || 0,
      inspection_date: new Date().toISOString()
    };

    setIsSubmitting(true);
    try {
      await onSubmit(inspectionData);
      toast.success('QC inspection submitted successfully');
    } catch (error) {
      toast.error('Failed to submit inspection');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraftClick = async () => {
    const draftData = {
      order_id: orderId,
      checklist_results: categories,
      overall_rating: overallRating,
      final_decision: finalDecision,
      decision_notes: decisionNotes,
      inspector_name: inspectorName,
      inspection_duration: inspectionDuration
    };

    try {
      await onSaveDraft(draftData);
      toast.success('Draft saved successfully');
    } catch (error) {
      toast.error('Failed to save draft');
      console.error(error);
    }
  };

  const score = calculateScore();
  const criticalPassed = checkCriticalItems();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>Quality Control Inspection</CardTitle>
          <CardDescription>
            Order #{orderNumber} - {productName}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Checklist Categories */}
      <Accordion type="multiple" className="space-y-4">
        {categories.map((category, catIndex) => (
          <AccordionItem key={category.id} value={category.id} className="border rounded-lg">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center justify-between w-full pr-4">
                <span className="font-semibold">{catIndex + 1}. {category.name}</span>
                <Badge variant="outline">
                  {category.items.filter(i => i.status === 'pass').length}/{category.items.length} Passed
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-6">
                {category.items.map((item) => (
                  <Card key={item.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{item.name}</CardTitle>
                      <CardDescription className="text-sm">{item.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Status Selection */}
                      <div>
                        <Label>Status</Label>
                        <RadioGroup
                          value={item.status || ''}
                          onValueChange={(value) => handleStatusChange(category.id, item.id, value as any)}
                          className="flex gap-4 mt-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="pass" id={`${item.id}-pass`} />
                            <Label htmlFor={`${item.id}-pass`} className="cursor-pointer">
                              <CheckCircle2 className="w-4 h-4 inline mr-1 text-green-600" />
                              Pass
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="fail" id={`${item.id}-fail`} />
                            <Label htmlFor={`${item.id}-fail`} className="cursor-pointer">
                              <X className="w-4 h-4 inline mr-1 text-red-600" />
                              Fail
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="needs_rework" id={`${item.id}-rework`} />
                            <Label htmlFor={`${item.id}-rework`} className="cursor-pointer">
                              <AlertCircle className="w-4 h-4 inline mr-1 text-orange-600" />
                              Needs Rework
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      {/* Measurements (if applicable) */}
                      {item.measurements && (
                        <div className="grid grid-cols-3 gap-4">
                          {Object.keys(item.measurements).map(key => (
                            <div key={key}>
                              <Label className="text-xs capitalize">{key.replace('_', ' ')}</Label>
                              <Input
                                type="text"
                                placeholder={`Enter ${key}`}
                                value={item.measurements![key]}
                                onChange={(e) => {
                                  setCategories(prev => prev.map(cat => {
                                    if (cat.id === category.id) {
                                      return {
                                        ...cat,
                                        items: cat.items.map(i => 
                                          i.id === item.id 
                                            ? { ...i, measurements: { ...i.measurements, [key]: e.target.value } }
                                            : i
                                        )
                                      };
                                    }
                                    return cat;
                                  }));
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Notes */}
                      <div>
                        <Label>Notes</Label>
                        <Textarea
                          placeholder="Add inspection notes..."
                          value={item.notes}
                          onChange={(e) => handleNotesChange(category.id, item.id, e.target.value)}
                          rows={3}
                        />
                      </div>

                      {/* Photo Upload */}
                      <QCPhotoUpload
                        photos={item.photos}
                        onPhotosChange={(photos) => handlePhotosChange(category.id, item.id, photos)}
                        minPhotos={item.minPhotos}
                        maxPhotos={item.maxPhotos}
                        itemName={item.name}
                        disabled={isSubmitting}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Final Approval Section */}
      <Card>
        <CardHeader>
          <CardTitle>6. Final Approval</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score Display */}
          <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">Total Score:</span>
              <span className="text-2xl font-bold">{score}%</span>
            </div>
            <Progress value={score} className="h-3" />
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm">Critical Items:</span>
              {criticalPassed ? (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  All Passed
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Failed
                </Badge>
              )}
            </div>
          </div>

          {/* Overall Rating */}
          <div>
            <Label>Overall Rating</Label>
            <Select value={overallRating} onValueChange={setOverallRating}>
              <SelectTrigger>
                <SelectValue placeholder="Select rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excellent">Excellent</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="acceptable">Acceptable</SelectItem>
                <SelectItem value="poor">Poor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Final Decision */}
          <div>
            <Label>Final Decision</Label>
            <RadioGroup value={finalDecision} onValueChange={setFinalDecision} className="mt-2 space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="approved" id="approved" />
                <Label htmlFor="approved" className="cursor-pointer">
                  ✅ APPROVED - Ready for shipping
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="approved_with_notes" id="approved_with_notes" />
                <Label htmlFor="approved_with_notes" className="cursor-pointer">
                  ⚠️ APPROVED WITH NOTES - Minor issues documented
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="rejected" id="rejected" />
                <Label htmlFor="rejected" className="cursor-pointer">
                  ❌ REJECTED - Return to vendor for rework
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="needs_rework" id="needs_rework" />
                <Label htmlFor="needs_rework" className="cursor-pointer">
                  🔄 NEEDS REWORK - Specific fixes required
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Decision Notes */}
          <div>
            <Label>Decision Notes</Label>
            <Textarea
              placeholder="Add any additional notes about the final decision..."
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
              rows={4}
            />
          </div>

          {/* Inspector Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Inspector Name</Label>
              <Input
                type="text"
                placeholder="Enter inspector name"
                value={inspectorName}
                onChange={(e) => setInspectorName(e.target.value)}
              />
            </div>
            <div>
              <Label>Inspection Duration (minutes)</Label>
              <Input
                type="number"
                placeholder="Enter duration"
                value={inspectionDuration}
                onChange={(e) => setInspectionDuration(e.target.value)}
              />
            </div>
          </div>

          {/* Warning for Critical Items */}
          {!criticalPassed && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Critical items have not passed. The inspection cannot be approved until all critical items pass.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveDraftClick}
              disabled={isSubmitting}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <Button
              type="button"
              onClick={handleSubmitInspection}
              disabled={isSubmitting || !criticalPassed}
              className="flex-1"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Submitting...' : 'Submit Inspection'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
