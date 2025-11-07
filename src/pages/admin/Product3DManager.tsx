import { useState } from 'react';
import { Product3DForm } from '@/components/admin/Product3DForm';
import Product3DViewer from '@/components/Product3DViewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Settings, Save } from 'lucide-react';
import { toast } from 'sonner';

interface FormSet {
  id: string;
  title: string;
  images: Array<{
    file: File;
    preview: string;
    caption: string;
  }>;
}

export default function Product3DManager() {
  const [formData, setFormData] = useState<FormSet[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');

  const handleFormSubmit = (data: FormSet[]) => {
    setFormData(data);
    toast.success('3D configuration saved successfully!');
  };

  const handlePreview = (data: FormSet[]) => {
    setFormData(data);
    if (data.length > 0 && data[0].images.length > 0) {
      setSelectedImage(data[0].images[0].preview);
      setPreviewOpen(true);
    }
  };

  const handleImageSelect = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  return (
    <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Settings className="w-8 h-8 text-primary" />
              3D Product Manager
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure and manage 3D product visualizations
            </p>
          </div>
        </div>

        <Tabs defaultValue="configure" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="configure">Configure 3D Sets</TabsTrigger>
            <TabsTrigger value="preview">3D Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="configure" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>3D Configuration Form</CardTitle>
              </CardHeader>
              <CardContent>
                <Product3DForm
                  onSubmit={handleFormSubmit}
                  onPreview={handlePreview}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 3D Viewer */}
              <Card>
                <CardHeader>
                  <CardTitle>3D Product Viewer</CardTitle>
                </CardHeader>
                <CardContent>
                  <Product3DViewer imageUrl={selectedImage} />
                </CardContent>
              </Card>

              {/* Image Gallery */}
              <Card>
                <CardHeader>
                  <CardTitle>Image Gallery</CardTitle>
                </CardHeader>
                <CardContent>
                  {formData.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No images configured yet. Please configure 3D sets first.
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {formData.map((set, setIndex) => (
                        <div key={set.id} className="space-y-3">
                          <h3 className="font-semibold text-lg">{set.title}</h3>
                          <div className="grid grid-cols-2 gap-3">
                            {set.images.map((image, imageIndex) => (
                              <div
                                key={imageIndex}
                                className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                                  selectedImage === image.preview
                                    ? 'border-primary shadow-lg'
                                    : 'border-muted hover:border-primary/50'
                                }`}
                                onClick={() => handleImageSelect(image.preview)}
                              >
                                <img
                                  src={image.preview}
                                  alt={`${set.title} - ${image.caption || `Image ${imageIndex + 1}`}`}
                                  className="w-full h-24 object-cover"
                                />
                                {image.caption && (
                                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1">
                                    {image.caption}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>3D Product Preview</DialogTitle>
            </DialogHeader>
            <div className="aspect-video">
              <Product3DViewer imageUrl={selectedImage} />
            </div>
          </DialogContent>
        </Dialog>
    </div>
  );
}