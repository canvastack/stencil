import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import ThemeUploader from './ThemeUploader';

interface ThemeUploadModalProps {
  onUploadComplete?: () => void;
  trigger?: React.ReactNode;
}

export function ThemeUploadModal({ onUploadComplete, trigger }: ThemeUploadModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleUploadComplete = () => {
    onUploadComplete?.();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Upload Theme
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload New Theme</DialogTitle>
          <DialogDescription>
            Upload a theme package to add it to your collection
          </DialogDescription>
        </DialogHeader>
        <ThemeUploader onUploadComplete={handleUploadComplete} />
      </DialogContent>
    </Dialog>
  );
}

export default ThemeUploadModal;