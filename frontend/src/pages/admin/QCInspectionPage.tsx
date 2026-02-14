import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, ClipboardCheck } from 'lucide-react';
import { QCInspectionForm } from '@/components/admin/QCInspectionForm';
import { QCInspectionView } from '@/components/admin/QCInspectionView';
import { toast } from 'sonner';

// Mock order data - will be replaced with real API call
const mockOrder = {
  id: 'order-123',
  order_number: 'ORD-2026-00123',
  product_name: 'Custom Etched Stainless Steel Plate',
  customer_name: 'ABC Company',
  status: 'in_production'
};

// Mock inspection data - will be replaced with real API call
const mockInspection = {
  uuid: 'qc-2026-001',
  order_number: 'ORD-2026-00123',
  inspection_number: 'QC-2026-001',
  product_name: 'Custom Etched Stainless Steel Plate',
  inspection_date: '2026-02-14T10:30:00Z',
  inspector_name: 'John Doe',
  inspection_duration_minutes: 45,
  overall_rating: 'excellent',
  total_score: 95,
  critical_items_passed: true,
  decision: 'approved',
  decision_notes: 'All quality standards met. Product ready for shipping.',
  checklist_results: {
    physical_specifications: {
      dimensions_accuracy: {
        status: 'pass',
        notes: 'All dimensions within tolerance',
        photos: [],
        measurements: {
          length: '150mm',
          width: '100mm',
          height: '3mm'
        }
      },
      material_verification: {
        status: 'pass',
        notes: 'Stainless Steel 304 confirmed',
        photos: []
      },
      weight_check: {
        status: 'pass',
        notes: 'Weight within expected range',
        photos: [],
        measurements: {
          weight_grams: '250'
        }
      }
    },
    etching_quality: {
      etching_depth: {
        status: 'pass',
        notes: 'Consistent depth across design',
        photos: [],
        measurements: {
          depth_mm: '0.5'
        }
      },
      design_accuracy: {
        status: 'pass',
        notes: 'Perfect match to artwork',
        photos: []
      },
      line_quality: {
        status: 'pass',
        notes: 'Sharp, clean lines',
        photos: []
      }
    },
    finishing_quality: {
      surface_finish: {
        status: 'pass',
        notes: 'Mirror polish, no scratches',
        photos: []
      },
      edge_quality: {
        status: 'pass',
        notes: 'Smooth edges, no burrs',
        photos: []
      },
      color_consistency: {
        status: 'pass',
        notes: 'Uniform color throughout',
        photos: []
      }
    },
    functional_checks: {
      mounting_installation: {
        status: 'pass',
        notes: 'Mounting holes aligned',
        photos: []
      },
      readability: {
        status: 'pass',
        notes: 'Clear from 2 meters',
        photos: []
      },
      durability_test: {
        status: 'pass',
        notes: 'Coating adhesion good',
        photos: []
      }
    },
    packaging_presentation: {
      protective_packaging: {
        status: 'pass',
        notes: 'Well protected',
        photos: []
      },
      labeling: {
        status: 'pass',
        notes: 'All labels present',
        photos: []
      },
      documentation: {
        status: 'pass',
        notes: 'Care instructions included',
        photos: []
      }
    }
  },
  photos: [],
  created_at: '2026-02-14T10:00:00Z'
};

export default function QCInspectionPage() {
  const { orderId, inspectionId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'new' | 'view'>('new');
  const [order, setOrder] = useState(mockOrder);
  const [inspection, setInspection] = useState<typeof mockInspection | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If inspectionId is provided, load existing inspection
    if (inspectionId) {
      setActiveTab('view');
      setInspection(mockInspection);
    }
  }, [inspectionId]);

  const handleSubmitInspection = async (data: any) => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      console.log('Submitting inspection:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('QC inspection submitted successfully');
      
      // Navigate to order detail or inspection list
      navigate(`/admin/orders/${orderId}`);
    } catch (error) {
      console.error('Failed to submit inspection:', error);
      toast.error('Failed to submit inspection');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDraft = async (data: any) => {
    try {
      // TODO: Replace with actual API call
      console.log('Saving draft:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Draft saved successfully');
    } catch (error) {
      console.error('Failed to save draft:', error);
      toast.error('Failed to save draft');
      throw error;
    }
  };

  const handleDownloadPDF = () => {
    toast.info('PDF download feature coming soon');
    // TODO: Implement PDF generation and download
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ClipboardCheck className="w-8 h-8" />
              Quality Control Inspection
            </h1>
            <p className="text-muted-foreground">
              {order.order_number} - {order.product_name}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      {inspectionId ? (
        // View existing inspection
        inspection && (
          <QCInspectionView
            inspection={inspection}
            onDownloadPDF={handleDownloadPDF}
            onPrint={handlePrint}
          />
        )
      ) : (
        // Create new inspection
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'new' | 'view')}>
          <TabsList>
            <TabsTrigger value="new">New Inspection</TabsTrigger>
            <TabsTrigger value="view" disabled={!inspection}>
              View Inspection
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="mt-6">
            <QCInspectionForm
              orderId={order.id}
              orderNumber={order.order_number}
              productName={order.product_name}
              onSubmit={handleSubmitInspection}
              onSaveDraft={handleSaveDraft}
            />
          </TabsContent>

          <TabsContent value="view" className="mt-6">
            {inspection && (
              <QCInspectionView
                inspection={inspection}
                onDownloadPDF={handleDownloadPDF}
                onPrint={handlePrint}
              />
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
