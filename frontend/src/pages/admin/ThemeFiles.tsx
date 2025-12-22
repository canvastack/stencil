import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import ThemeFileManager from '@/components/admin/ThemeFileManager';

export default function ThemeFiles() {
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    navigate('/admin/themes');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBackToDashboard}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Themes
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Theme Files</h1>
          <p className="text-muted-foreground">
            Manage theme files and assets
          </p>
        </div>
      </div>

      {/* File Manager */}
      <ThemeFileManager />
    </div>
  );
}