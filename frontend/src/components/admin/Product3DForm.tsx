import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Upload, Eye, X } from 'lucide-react';
import { APP_CONFIG } from '@/lib/constants';
import { toast } from 'sonner';

interface ImageData {
  file: File;
  preview: string;
  caption: string;
}

interface FormSet {
  id: string;
  title: string;
  images: ImageData[];
}

interface Product3DFormProps {
  onSubmit?: (data: FormSet[]) => void;
  onPreview?: (data: FormSet[]) => void;
}

export const Product3DForm = ({ onSubmit, onPreview }: Product3DFormProps) => {
  const [formSets, setFormSets] = useState<FormSet[]>([
    {
      id: '1',
      title: '',
      images: []
    }
  ]);

  const addFormSet = () => {
    const newId = Date.now().toString();
    setFormSets(prev => [...prev, {
      id: newId,
      title: '',
      images: []
    }]);
  };

  const removeFormSet = (id: string) => {
    if (formSets.length > 1) {
      setFormSets(prev => prev.filter(set => set.id !== id));
    }
  };

  const updateFormSet = (id: string, field: 'title', value: string) => {
    setFormSets(prev => prev.map(set =>
      set.id === id ? { ...set, [field]: value } : set
    ));
  };

  const handleImageUpload = (setId: string, files: FileList | null) => {
    if (!files) return;

    const set = formSets.find(s => s.id === setId);
    if (!set) return;

    const remainingSlots = APP_CONFIG.MAX_IMAGES_PER_SET - set.images.length;
    const filesToAdd = Array.from(files).slice(0, remainingSlots);

    if (filesToAdd.length === 0) {
      toast.error(`Maximum ${APP_CONFIG.MAX_IMAGES_PER_SET} images per set`);
      return;
    }

    const newImages: ImageData[] = filesToAdd.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      caption: ''
    }));

    setFormSets(prev => prev.map(set =>
      set.id === setId
        ? { ...set, images: [...set.images, ...newImages] }
        : set
    ));
  };

  const removeImage = (setId: string, imageIndex: number) => {
    setFormSets(prev => prev.map(set => {
      if (set.id === setId) {
        const updatedImages = set.images.filter((_, index) => index !== imageIndex);
        // Clean up object URLs
        set.images[imageIndex]?.preview && URL.revokeObjectURL(set.images[imageIndex].preview);
        return { ...set, images: updatedImages };
      }
      return set;
    }));
  };

  const updateImageCaption = (setId: string, imageIndex: number, caption: string) => {
    setFormSets(prev => prev.map(set =>
      set.id === setId
        ? {
            ...set,
            images: set.images.map((img, index) =>
              index === imageIndex ? { ...img, caption } : img
            )
          }
        : set
    ));
  };

  const validateForm = (): boolean => {
    for (const set of formSets) {
      if (!set.title.trim()) {
        toast.error('All titles are required');
        return false;
      }
      if (set.images.length === 0) {
        toast.error('Each set must have at least one image');
        return false;
      }
      for (const image of set.images) {
        if (image.file.size > APP_CONFIG.MAX_FILE_SIZE) {
          toast.error(`File size must be less than ${APP_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`);
          return false;
        }
        if (!APP_CONFIG.ALLOWED_IMAGE_TYPES.includes(image.file.type as any)) {
          toast.error('Only JPEG, PNG, and WebP files are allowed');
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    onSubmit?.(formSets);
  };

  const handlePreview = () => {
    if (!validateForm()) return;
    onPreview?.(formSets);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">3D Product Viewer Configuration</h2>
          <p className="text-muted-foreground">
            Configure multiple image sets for 3D product visualization
          </p>
        </div>
        <Button onClick={addFormSet} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Set
        </Button>
      </div>

      <div className="space-y-6">
        {formSets.map((set, setIndex) => (
          <Card key={set.id} className="relative">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Set {setIndex + 1}</CardTitle>
              {formSets.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFormSet(set.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title Input */}
              <div className="space-y-2">
                <Label htmlFor={`title-${set.id}`}>Title *</Label>
                <Input
                  id={`title-${set.id}`}
                  placeholder="Enter set title (e.g., Front View, Side View)"
                  value={set.title}
                  onChange={(e) => updateFormSet(set.id, 'title', e.target.value)}
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>3D Images ({set.images.length}/{APP_CONFIG.MAX_IMAGES_PER_SET})</Label>
                  <div className="relative">
                    <input
                      type="file"
                      multiple
                      accept={APP_CONFIG.ALLOWED_IMAGE_TYPES.join(',')}
                      onChange={(e) => handleImageUpload(set.id, e.target.files)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={set.images.length >= APP_CONFIG.MAX_IMAGES_PER_SET}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={set.images.length >= APP_CONFIG.MAX_IMAGES_PER_SET}
                      className="gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Images
                    </Button>
                  </div>
                </div>

                {/* Image Grid */}
                {set.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {set.images.map((image, imageIndex) => (
                      <div key={imageIndex} className="space-y-2">
                        <div className="relative group">
                          <img
                            src={image.preview}
                            alt={`Preview ${imageIndex + 1}`}
                            className="w-full h-24 object-cover rounded-lg border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(set.id, imageIndex)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        <Textarea
                          placeholder="Image caption (optional)"
                          value={image.caption}
                          onChange={(e) => updateImageCaption(set.id, imageIndex, e.target.value)}
                          className="text-xs min-h-[60px] resize-none"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-6 border-t">
        <Button onClick={handlePreview} variant="outline" className="gap-2">
          <Eye className="w-4 h-4" />
          Preview 3D View
        </Button>
        <Button onClick={handleSubmit} className="gap-2">
          <Upload className="w-4 h-4" />
          Save Configuration
        </Button>
      </div>
    </div>
  );
};