import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { resolveImageUrl } from '@/utils/imageUtils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Upload, 
  Search, 
  FolderPlus, 
  MoreHorizontal, 
  Download, 
  Trash2, 
  Eye,
  Image as ImageIcon,
  File,
  Folder
} from 'lucide-react';
import { toast } from 'sonner';

interface MediaItem {
  id: string;
  name: string;
  type: 'image' | 'document';
  url: string;
  size: number;
  uploadedAt: string;
  folder: string;
}

const mockMedia: MediaItem[] = [
  {
    id: '1',
    name: 'award-plaque-1.jpg',
    type: 'image',
    url: 'images/products/award-plaque-1.jpg',
    size: 245000,
    uploadedAt: '2024-01-15',
    folder: 'products',
  },
  {
    id: '2',
    name: 'crystal-award-1.jpg',
    type: 'image',
    url: 'images/products/crystal-award-1.jpg',
    size: 312000,
    uploadedAt: '2024-01-14',
    folder: 'products',
  },
  {
    id: '3',
    name: 'glass-etching-1.jpg',
    type: 'image',
    url: 'images/products/glass-etching-1.jpg',
    size: 198000,
    uploadedAt: '2024-01-13',
    folder: 'products',
  },
];

export default function MediaLibrary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [folderFilter, setFolderFilter] = useState<string>('all');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [media, setMedia] = useState<MediaItem[]>(mockMedia);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredMedia = media.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    const matchesFolder = folderFilter === 'all' || item.folder === folderFilter;
    
    return matchesSearch && matchesType && matchesFolder;
  });

  const folders = Array.from(new Set(media.map(m => m.folder)));

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newMedia: MediaItem = {
          id: Date.now().toString() + Math.random(),
          name: file.name,
          type: file.type.startsWith('image/') ? 'image' : 'document',
          url: e.target?.result as string,
          size: file.size,
          uploadedAt: new Date().toISOString().split('T')[0],
          folder: folderFilter === 'all' ? 'uploads' : folderFilter,
        };
        setMedia(prev => [...prev, newMedia]);
      };
      reader.readAsDataURL(file);
    });
    
    toast.success('Files uploaded successfully!');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = (id: string) => {
    setMedia(prev => prev.filter(item => item.id !== id));
    toast.success('File deleted successfully');
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast.error('Please enter a folder name');
      return;
    }
    toast.success(`Folder "${newFolderName}" created successfully!`);
    setNewFolderName('');
    setShowNewFolderDialog(false);
  };

  const handleDownload = (item: MediaItem) => {
    const link = document.createElement('a');
    link.href = item.url;
    link.download = item.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download started');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Media Library</h1>
          <p className="text-muted-foreground">Manage your media files</p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleUpload}
            className="hidden"
          />
          <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FolderPlus className="mr-2 h-4 w-4" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
                <DialogDescription>Enter a name for the new folder</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input
                  placeholder="Folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateFolder}>
                    Create Folder
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Files
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={folderFilter} onValueChange={setFolderFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Folder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Folders</SelectItem>
              {folders.map((folder) => (
                <SelectItem key={folder} value={folder}>{folder}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredMedia.map((item) => (
          <Card
            key={item.id}
            className="group relative overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedMedia(item)}
          >
            <div className="aspect-square bg-muted flex items-center justify-center">
              {item.type === 'image' ? (
                <img
                  src={resolveImageUrl(item.url)}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <File className="h-16 w-16 text-muted-foreground" />
              )}
            </div>
            
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button size="icon" variant="secondary" onClick={(e) => {
                e.stopPropagation();
                setSelectedMedia(item);
              }}>
                <Eye className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button size="icon" variant="secondary">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(item);
                  }}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="p-2">
              <p className="text-sm font-medium truncate">{item.name}</p>
              <div className="flex items-center justify-between mt-1">
                <Badge variant="secondary" className="text-xs">
                  {item.folder}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(item.size)}
                </span>
              </div>
            </div>
          </Card>
        ))}

        <Card 
          className="aspect-square border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-12 w-12 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Upload Files</p>
        </Card>
      </div>

      <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedMedia?.name}</DialogTitle>
            <DialogDescription>
              Uploaded on {selectedMedia && new Date(selectedMedia.uploadedAt).toLocaleDateString('id-ID')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedMedia && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg flex items-center justify-center p-8">
                {selectedMedia.type === 'image' ? (
                  <img
                    src={resolveImageUrl(selectedMedia.url)}
                    alt={selectedMedia.name}
                    className="max-h-96 object-contain"
                  />
                ) : (
                  <File className="h-32 w-32 text-muted-foreground" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">File Name</p>
                  <p className="font-medium">{selectedMedia.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium">{selectedMedia.type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Size</p>
                  <p className="font-medium">{formatFileSize(selectedMedia.size)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Folder</p>
                  <p className="font-medium">{selectedMedia.folder}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">URL</p>
                  <p className="font-mono text-xs bg-muted p-2 rounded">{selectedMedia.url}</p>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => handleDownload(selectedMedia)}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button variant="destructive" onClick={() => {
                  handleDelete(selectedMedia.id);
                  setSelectedMedia(null);
                }}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
