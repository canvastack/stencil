import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Camera, 
  X, 
  ZoomIn,
  Upload,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Photo {
  id: string;
  file: File;
  url: string;
  caption?: string;
  uploaded?: boolean;
  uploadedUrl?: string;
}

interface QCPhotoUploadProps {
  photos: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
  minPhotos?: number;
  maxPhotos?: number;
  itemName: string;
  disabled?: boolean;
}

export function QCPhotoUpload({
  photos,
  onPhotosChange,
  minPhotos = 0,
  maxPhotos = 10,
  itemName,
  disabled = false
}: QCPhotoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MIN_WIDTH = 1280;
  const MIN_HEIGHT = 720;
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const validatePhoto = useCallback(async (file: File): Promise<{ valid: boolean; error?: string }> => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: 'File must be an image' };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: 'File size must be less than 5MB' };
    }

    // Check image dimensions
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        if (img.width < MIN_WIDTH || img.height < MIN_HEIGHT) {
          resolve({ 
            valid: false, 
            error: `Image resolution must be at least ${MIN_WIDTH}x${MIN_HEIGHT}px. Current: ${img.width}x${img.height}px` 
          });
        } else {
          resolve({ valid: true });
        }
      };
      img.onerror = () => {
        resolve({ valid: false, error: 'Invalid image file' });
      };
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || disabled) return;

    const newFiles = Array.from(files);
    
    // Check max photos limit
    if (photos.length + newFiles.length > maxPhotos) {
      toast.error(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    const validatedPhotos: Photo[] = [];

    for (const file of newFiles) {
      const validation = await validatePhoto(file);
      
      if (!validation.valid) {
        toast.error(`${file.name}: ${validation.error}`);
        continue;
      }

      const photo: Photo = {
        id: `${Date.now()}-${Math.random()}`,
        file,
        url: URL.createObjectURL(file),
        caption: '',
        uploaded: false
      };

      validatedPhotos.push(photo);
    }

    if (validatedPhotos.length > 0) {
      onPhotosChange([...photos, ...validatedPhotos]);
      toast.success(`${validatedPhotos.length} photo(s) added`);
    }
  }, [photos, onPhotosChange, maxPhotos, validatePhoto, disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (!disabled) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect, disabled]);

  const handleRemovePhoto = useCallback((photoId: string) => {
    const photo = photos.find(p => p.id === photoId);
    if (photo) {
      URL.revokeObjectURL(photo.url);
    }
    onPhotosChange(photos.filter(p => p.id !== photoId));
    toast.success('Photo removed');
  }, [photos, onPhotosChange]);

  const handleCaptionChange = useCallback((photoId: string, caption: string) => {
    onPhotosChange(photos.map(p => 
      p.id === photoId ? { ...p, caption } : p
    ));
  }, [photos, onPhotosChange]);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const photoCount = photos.length;
  const meetsMinimum = photoCount >= minPhotos;
  const canAddMore = photoCount < maxPhotos;

  return (
    <div className="space-y-3">
      {/* Photo Requirements */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          Photos {minPhotos > 0 && `(Minimum ${minPhotos} required)`}
        </Label>
        <div className="flex items-center gap-2">
          <Badge variant={meetsMinimum ? "default" : "secondary"}>
            {photoCount}/{maxPhotos}
          </Badge>
          {meetsMinimum ? (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-orange-600" />
          )}
        </div>
      </div>

      {/* Upload Area */}
      {canAddMore && (
        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center transition-colors
            ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 dark:border-gray-700'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary'}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={!disabled ? handleBrowseClick : undefined}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
            disabled={disabled}
          />
          
          <div className="flex flex-col items-center gap-2">
            {isDragging ? (
              <Upload className="w-8 h-8 text-primary animate-bounce" />
            ) : (
              <Camera className="w-8 h-8 text-gray-400" />
            )}
            <div>
              <p className="text-sm font-medium">
                {isDragging ? 'Drop photos here' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Min resolution: {MIN_WIDTH}x{MIN_HEIGHT}px • Max size: 5MB • JPEG/PNG
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Photo Requirements Alert */}
      {minPhotos > 0 && !meetsMinimum && (
        <Alert variant="default" className="border-orange-200 bg-orange-50 dark:bg-orange-950/30">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-900 dark:text-orange-100">
            Please upload at least {minPhotos} photo(s) for {itemName}
          </AlertDescription>
        </Alert>
      )}

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {photos.map((photo, index) => (
            <div key={photo.id} className="relative group">
              {/* Photo Preview */}
              <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                <img
                  src={photo.url}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setSelectedPhoto(photo)}
                    disabled={disabled}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleRemovePhoto(photo.id)}
                    disabled={disabled}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Photo Number Badge */}
                <Badge className="absolute top-2 left-2 bg-black/70 text-white">
                  {index + 1}
                </Badge>
              </div>

              {/* Caption Input */}
              <Input
                type="text"
                placeholder="Add caption (optional)"
                value={photo.caption || ''}
                onChange={(e) => handleCaptionChange(photo.id, e.target.value)}
                className="mt-2 text-xs"
                disabled={disabled}
              />
            </div>
          ))}
        </div>
      )}

      {/* Photo Zoom Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Photo Preview</DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <div className="space-y-4">
              <img
                src={selectedPhoto.url}
                alt="Full size preview"
                className="w-full h-auto rounded-lg"
              />
              {selectedPhoto.caption && (
                <p className="text-sm text-muted-foreground">
                  Caption: {selectedPhoto.caption}
                </p>
              )}
              <div className="text-xs text-muted-foreground">
                <p>File: {selectedPhoto.file.name}</p>
                <p>Size: {(selectedPhoto.file.size / 1024 / 1024).toFixed(2)} MB</p>
                <p>Type: {selectedPhoto.file.type}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
