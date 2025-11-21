import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Folder, 
  File, 
  Image, 
  FileText, 
  Code, 
  Upload, 
  Download, 
  Trash2, 
  Edit, 
  Plus,
  Search,
  Grid,
  List,
  MoreVertical,
  Eye,
  Copy,
  Move,
  RefreshCw
} from 'lucide-react';
import { useTheme } from '@/core/engine/ThemeContext';

interface FileItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  size?: number;
  mimeType?: string;
  lastModified?: Date;
  thumbnail?: string;
  isEditable?: boolean;
}

interface FileManagerState {
  files: FileItem[];
  currentPath: string;
  selectedFiles: string[];
  viewMode: 'grid' | 'list';
  searchQuery: string;
  uploadProgress: number;
  isUploading: boolean;
}

const FILE_TYPE_ICONS = {
  'image/jpeg': Image,
  'image/png': Image,
  'image/gif': Image,
  'image/svg+xml': Image,
  'text/css': FileText,
  'text/javascript': Code,
  'application/javascript': Code,
  'text/typescript': Code,
  'application/json': FileText,
  'text/html': Code,
  'text/markdown': FileText,
  'text/plain': FileText,
  'folder': Folder,
  'default': File
};

export function ThemeFileManager() {
  const { currentTheme, currentThemeName } = useTheme();
  
  const [state, setState] = useState<FileManagerState>({
    files: [],
    currentPath: '/',
    selectedFiles: [],
    viewMode: 'grid',
    searchQuery: '',
    uploadProgress: 0,
    isUploading: false
  });

  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);

  // Initialize files from theme
  useEffect(() => {
    if (currentTheme) {
      const files: FileItem[] = [];
      
      // Add folders
      files.push({
        id: 'components',
        name: 'components',
        path: '/components',
        type: 'folder',
        lastModified: new Date()
      });

      files.push({
        id: 'assets',
        name: 'assets',
        path: '/assets',
        type: 'folder',
        lastModified: new Date()
      });

      files.push({
        id: 'styles',
        name: 'styles',
        path: '/styles',
        type: 'folder',
        lastModified: new Date()
      });

      // Add theme files
      files.push({
        id: 'theme-json',
        name: 'theme.json',
        path: '/theme.json',
        type: 'file',
        size: 1024,
        mimeType: 'application/json',
        lastModified: new Date(),
        isEditable: true
      });

      files.push({
        id: 'index-ts',
        name: 'index.ts',
        path: '/index.ts',
        type: 'file',
        size: 2048,
        mimeType: 'text/typescript',
        lastModified: new Date(),
        isEditable: true
      });

      files.push({
        id: 'readme',
        name: 'README.md',
        path: '/README.md',
        type: 'file',
        size: 1536,
        mimeType: 'text/markdown',
        lastModified: new Date(),
        isEditable: true
      });

      // Add component files
      Object.keys(currentTheme.components).forEach((componentName, index) => {
        files.push({
          id: `component-${componentName}`,
          name: `${componentName}.tsx`,
          path: `/components/${componentName}.tsx`,
          type: 'file',
          size: 1024 + Math.random() * 2048,
          mimeType: 'text/typescript',
          lastModified: new Date(),
          isEditable: true
        });
      });

      // Add asset files (mock data)
      const assetFiles = [
        { name: 'logo.png', type: 'image/png', size: 15360 },
        { name: 'hero-bg.jpg', type: 'image/jpeg', size: 204800 },
        { name: 'icon-sprite.svg', type: 'image/svg+xml', size: 8192 },
        { name: 'main.css', type: 'text/css', size: 4096 },
        { name: 'components.css', type: 'text/css', size: 2048 }
      ];

      assetFiles.forEach((asset, index) => {
        const folder = asset.type.startsWith('image/') ? 'assets' : 'styles';
        files.push({
          id: `asset-${index}`,
          name: asset.name,
          path: `/${folder}/${asset.name}`,
          type: 'file',
          size: asset.size,
          mimeType: asset.type,
          lastModified: new Date(),
          isEditable: asset.type.startsWith('text/'),
          thumbnail: asset.type.startsWith('image/') ? `/themes/${currentThemeName}/assets/${asset.name}` : undefined
        });
      });

      setState(prev => ({ ...prev, files }));
    }
  }, [currentTheme, currentThemeName]);

  const getFilteredFiles = () => {
    const filtered = state.files.filter(file => {
      // Filter by current path
      const pathMatch = state.currentPath === '/' 
        ? !file.path.includes('/', 1) || file.path === '/'
        : file.path.startsWith(state.currentPath);
      
      // Filter by search query
      const searchMatch = !state.searchQuery || 
        file.name.toLowerCase().includes(state.searchQuery.toLowerCase());
      
      return pathMatch && searchMatch;
    });

    return filtered.sort((a, b) => {
      // Folders first, then files
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  };

  const getFileIcon = (file: FileItem) => {
    const IconComponent = FILE_TYPE_ICONS[file.mimeType as keyof typeof FILE_TYPE_ICONS] || FILE_TYPE_ICONS.default;
    return IconComponent;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (fileId: string, isMultiple = false) => {
    setState(prev => {
      if (isMultiple) {
        const newSelected = prev.selectedFiles.includes(fileId)
          ? prev.selectedFiles.filter(id => id !== fileId)
          : [...prev.selectedFiles, fileId];
        return { ...prev, selectedFiles: newSelected };
      } else {
        return { ...prev, selectedFiles: [fileId] };
      }
    });
  };

  const handleFolderOpen = (folderPath: string) => {
    setState(prev => ({ ...prev, currentPath: folderPath, selectedFiles: [] }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setState(prev => ({ ...prev, isUploading: true, uploadProgress: 0 }));

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
          setState(prev => ({ ...prev, uploadProgress: progress }));
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        // Add file to the list
        const newFile: FileItem = {
          id: `uploaded-${Date.now()}-${i}`,
          name: file.name,
          path: `${state.currentPath}${file.name}`,
          type: 'file',
          size: file.size,
          mimeType: file.type,
          lastModified: new Date(),
          isEditable: file.type.startsWith('text/') || file.type === 'application/json',
          thumbnail: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
        };

        setState(prev => ({ 
          ...prev, 
          files: [...prev.files, newFile]
        }));
      }

      setState(prev => ({ ...prev, isUploading: false, uploadProgress: 0 }));
    } catch (error) {
      console.error('Upload failed:', error);
      setState(prev => ({ ...prev, isUploading: false, uploadProgress: 0 }));
    }
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;

    const newFolder: FileItem = {
      id: `folder-${Date.now()}`,
      name: newFolderName,
      path: `${state.currentPath}${newFolderName}`,
      type: 'folder',
      lastModified: new Date()
    };

    setState(prev => ({ 
      ...prev, 
      files: [...prev.files, newFolder]
    }));

    setNewFolderName('');
    setShowNewFolderDialog(false);
  };

  const handleDeleteSelected = () => {
    if (state.selectedFiles.length === 0) return;
    
    if (confirm(`Are you sure you want to delete ${state.selectedFiles.length} item(s)?`)) {
      setState(prev => ({
        ...prev,
        files: prev.files.filter(file => !prev.selectedFiles.includes(file.id)),
        selectedFiles: []
      }));
    }
  };

  const navigateUp = () => {
    const pathParts = state.currentPath.split('/').filter(Boolean);
    pathParts.pop();
    const newPath = '/' + pathParts.join('/');
    setState(prev => ({ ...prev, currentPath: newPath === '/' ? '/' : newPath, selectedFiles: [] }));
  };

  const filteredFiles = getFilteredFiles();

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Folder className="h-5 w-5" />
                File Manager
              </CardTitle>
              <CardDescription>
                Manage theme files and assets
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex items-center border rounded-md">
                <Button
                  variant={state.viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setState(prev => ({ ...prev, viewMode: 'grid' }))}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={state.viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setState(prev => ({ ...prev, viewMode: 'list' }))}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {/* Actions */}
              <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Folder
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Folder</DialogTitle>
                    <DialogDescription>
                      Enter a name for the new folder
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="folder-name">Folder Name</Label>
                      <Input
                        id="folder-name"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="Enter folder name"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                        Create
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Label htmlFor="file-upload" className="cursor-pointer">
                <Input
                  id="file-upload"
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </span>
                </Button>
              </Label>

              {state.selectedFiles.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleDeleteSelected}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete ({state.selectedFiles.length})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Navigation & Search */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={navigateUp}
                disabled={state.currentPath === '/'}
              >
                ← Back
              </Button>
              <span className="text-sm text-muted-foreground">
                {state.currentPath}
              </span>
            </div>
            
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search files..."
                  value={state.searchQuery}
                  onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Upload Progress */}
          {state.isUploading && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Uploading files...</span>
                <span>{state.uploadProgress}%</span>
              </div>
              <Progress value={state.uploadProgress} className="h-2" />
            </div>
          )}

          {/* File Grid/List */}
          {state.viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredFiles.map((file) => {
                const IconComponent = getFileIcon(file);
                const isSelected = state.selectedFiles.includes(file.id);
                
                return (
                  <div
                    key={file.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
                    }`}
                    onClick={() => file.type === 'folder' ? handleFolderOpen(file.path) : handleFileSelect(file.id)}
                    onDoubleClick={() => file.type === 'file' && handleFileSelect(file.id)}
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      {file.thumbnail ? (
                        <img
                          src={file.thumbnail}
                          alt={file.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <IconComponent className="h-12 w-12 text-muted-foreground" />
                      )}
                      
                      <div className="w-full">
                        <p className="text-sm font-medium truncate" title={file.name}>
                          {file.name}
                        </p>
                        {file.size && (
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredFiles.map((file) => {
                const IconComponent = getFileIcon(file);
                const isSelected = state.selectedFiles.includes(file.id);
                
                return (
                  <div
                    key={file.id}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all hover:bg-muted/50 ${
                      isSelected ? 'bg-primary/5 ring-1 ring-primary' : ''
                    }`}
                    onClick={() => file.type === 'folder' ? handleFolderOpen(file.path) : handleFileSelect(file.id)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleFileSelect(file.id, true);
                      }}
                      className="rounded"
                    />
                    
                    {file.thumbnail ? (
                      <img
                        src={file.thumbnail}
                        alt={file.name}
                        className="w-8 h-8 object-cover rounded"
                      />
                    ) : (
                      <IconComponent className="h-8 w-8 text-muted-foreground" />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {file.size && <span>{formatFileSize(file.size)}</span>}
                        {file.lastModified && (
                          <span>{file.lastModified.toLocaleDateString()}</span>
                        )}
                        {file.mimeType && (
                          <Badge variant="outline" className="text-xs">
                            {file.mimeType.split('/')[1]?.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {file.isEditable && (
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {filteredFiles.length === 0 && (
            <div className="text-center py-12">
              <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Files Found</h3>
              <p className="text-muted-foreground mb-4">
                {state.searchQuery 
                  ? `No files match "${state.searchQuery}"`
                  : 'This folder is empty'
                }
              </p>
              {!state.searchQuery && (
                <Label htmlFor="file-upload-empty" className="cursor-pointer">
                  <Input
                    id="file-upload-empty"
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button variant="outline" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Files
                    </span>
                  </Button>
                </Label>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ThemeFileManager;