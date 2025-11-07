import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import ThemeExporter from '@/components/admin/ThemeExporter';

export default function ThemeExport() {
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
          <h1 className="text-2xl font-bold">Export Theme</h1>
          <p className="text-muted-foreground">
            Create a downloadable package of your current theme
          </p>
        </div>
      </div>

      {/* Theme Exporter */}
      <ThemeExporter />
    </div>
  );
}