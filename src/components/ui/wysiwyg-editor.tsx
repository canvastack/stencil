import React, { useState, useRef, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ColorPicker } from '@/components/ui/color-picker';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { 
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, 
  AlignRight, AlignJustify, List, ListOrdered, Indent, Outdent,
  Undo, Redo, Link, Image, Table, Code, FileText, Eye,
  Maximize, HelpCircle, Type, Palette, Printer, Search,
  Scissors, Copy, Clipboard, Minus, Calendar,
  Superscript, Subscript, RemoveFormatting, Video, X, Minimize,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WysiwygEditorProps {
  value: string;
  onChange: (content: string) => void;
  label?: string;
  placeholder?: string;
  height?: number;
  required?: boolean;
}

export const WysiwygEditor: React.FC<WysiwygEditorProps> = ({
  value,
  onChange,
  label = "Editor",
  placeholder = "Masukkan teks di sini...",
  height = 400,
  required = false
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isSourceMode, setIsSourceMode] = useState(false);
  const [sourceCode, setSourceCode] = useState(value);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedFontSize, setSelectedFontSize] = useState('3');
  const [selectedHeading, setSelectedHeading] = useState('p');
  const [textColor, setTextColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [wordCount, setWordCount] = useState(0);
  const [history, setHistory] = useState<string[]>([value]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Image insert dialog
  const [imageDialog, setImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Link insert dialog
  const [linkDialog, setLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  // Table insert dialog
  const [tableDialog, setTableDialog] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  // Media insert dialog
  const [mediaDialog, setMediaDialog] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);

  // Find & Replace dialog
  const [findReplaceDialog, setFindReplaceDialog] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  // Find dialog
  const [findDialog, setFindDialog] = useState(false);

  // Preview dialog
  const [previewDialog, setPreviewDialog] = useState(false);

  // Help dialog
  const [helpDialog, setHelpDialog] = useState(false);

  // Color picker dialogs
  const [textColorDialog, setTextColorDialog] = useState(false);
  const [bgColorDialog, setBgColorDialog] = useState(false);

  // Initialize editor content only once
  useEffect(() => {
    if (editorRef.current && !isInitialized) {
      editorRef.current.innerHTML = value || '';
      setIsInitialized(true);
      updateWordCount();
    }
  }, []);

  const updateWordCount = () => {
    if (editorRef.current) {
      const text = editorRef.current.innerText || '';
      const words = text.trim().split(/\s+/).filter(word => word.length > 0);
      setWordCount(words.length);
    }
  };

  const saveToHistory = (content: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(content);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
      saveToHistory(content);
      updateWordCount();
    }
  };

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      if (editorRef.current) {
        editorRef.current.innerHTML = history[newIndex];
        onChange(history[newIndex]);
        updateWordCount();
      }
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      if (editorRef.current) {
        editorRef.current.innerHTML = history[newIndex];
        onChange(history[newIndex]);
        updateWordCount();
      }
    }
  };

  // File Menu Actions
  const handleNewDocument = () => {
    if (confirm('Buat dokumen baru? Semua perubahan yang belum disimpan akan hilang.')) {
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
        onChange('');
        saveToHistory('');
      }
    }
  };

  const handlePreview = () => {
    setPreviewDialog(true);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && editorRef.current) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              table { border-collapse: collapse; width: 100%; }
              td, th { border: 1px solid #000; padding: 8px; }
            </style>
          </head>
          <body>${editorRef.current.innerHTML}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Edit Menu Actions
  const handleCut = () => {
    document.execCommand('cut');
    handleInput();
  };

  const handleCopy = () => {
    document.execCommand('copy');
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      document.execCommand('insertHTML', false, text);
      handleInput();
    } catch (err) {
      // Fallback to regular paste
      document.execCommand('paste');
      handleInput();
    }
  };

  const handlePasteText = async () => {
    try {
      const text = await navigator.clipboard.readText();
      document.execCommand('insertText', false, text);
      handleInput();
    } catch (err) {
      const text = prompt('Paste teks di sini:');
      if (text) {
        document.execCommand('insertText', false, text);
        handleInput();
      }
    }
  };

  const handleSelectAll = () => {
    document.execCommand('selectAll');
  };
  
  const handleFind = () => {
    setFindDialog(true);
  };

  const handleFindReplace = () => {
    setFindReplaceDialog(true);
  };

  const doFind = () => {
    if (editorRef.current && findText) {
      try {
        // Use browser's native find if available
        if ('find' in window) {
          (window as any).find(findText, false, false, true, false, true, false);
        } else {
          // Fallback: highlight the text
          const content = editorRef.current.innerHTML;
          const highlighted = content.split(findText).join(`<mark>${findText}</mark>`);
          editorRef.current.innerHTML = highlighted;
        }
      } catch (error) {
        console.error('Find error:', error);
      }
    }
  };

  const doFindReplace = () => {
    if (editorRef.current && findText) {
      const content = editorRef.current.innerHTML;
      const newContent = content.split(findText).join(replaceText);
      editorRef.current.innerHTML = newContent;
      onChange(newContent);
      saveToHistory(newContent);
      setFindReplaceDialog(false);
      setFindText('');
      setReplaceText('');
    }
  };

  // View Menu Actions
  const toggleSourceMode = () => {
    if (isSourceMode) {
      // Switch back to visual mode
      if (editorRef.current) {
        editorRef.current.innerHTML = sourceCode;
        onChange(sourceCode);
        saveToHistory(sourceCode);
      }
    } else {
      // Switch to source mode
      if (editorRef.current) {
        setSourceCode(editorRef.current.innerHTML);
      }
    }
    setIsSourceMode(!isSourceMode);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Insert Menu Actions
  const handleInsertImage = () => {
    setImageDialog(true);
  };

  const doInsertImage = () => {
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result && editorRef.current) {
          const selection = window.getSelection();
          const range = selection?.getRangeAt(0);
          
          const img = document.createElement('img');
          img.src = e.target.result as string;
          img.style.maxWidth = '100%';
          img.style.height = 'auto';
          img.alt = 'Uploaded image';
          
          if (range) {
            range.insertNode(img);
            range.collapse(false);
          } else {
            editorRef.current.appendChild(img);
          }
          handleInput();
        }
      };
      reader.readAsDataURL(imageFile);
    } else if (imageUrl && editorRef.current) {
      const selection = window.getSelection();
      const range = selection?.getRangeAt(0);
      
      const img = document.createElement('img');
      img.src = imageUrl;
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.alt = 'Image';
      
      if (range) {
        range.insertNode(img);
        range.collapse(false);
      } else {
        editorRef.current.appendChild(img);
      }
      handleInput();
    }
    setImageDialog(false);
    setImageUrl('');
    setImageFile(null);
  };

  const handleInsertLink = () => {
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      setLinkDialog(true);
    } else {
      alert('Pilih teks terlebih dahulu untuk membuat link');
    }
  };

  const doInsertLink = () => {
    if (linkUrl && editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const selectedText = range.toString();
        
        const link = document.createElement('a');
        link.href = linkUrl;
        link.textContent = selectedText;
        link.target = '_blank';
        
        range.deleteContents();
        range.insertNode(link);
        range.collapse(false);
        handleInput();
      }
    }
    setLinkDialog(false);
    setLinkUrl('');
  };

  const handleInsertTable = () => {
    setTableDialog(true);
  };

  const doInsertTable = () => {
    if (editorRef.current) {
      const table = document.createElement('table');
      table.style.borderCollapse = 'collapse';
      table.style.width = '100%';
      table.style.margin = '10px 0';
      table.setAttribute('border', '1');
      
      for (let i = 0; i < tableRows; i++) {
        const row = table.insertRow();
        for (let j = 0; j < tableCols; j++) {
          const cell = row.insertCell();
          cell.style.padding = '8px';
          cell.style.border = '1px solid #ccc';
          cell.style.minWidth = '100px';
          cell.contentEditable = 'true';
          cell.textContent = i === 0 ? `Header ${j + 1}` : 'Cell';
        }
      }
      
      const selection = window.getSelection();
      const range = selection?.getRangeAt(0);
      
      if (range) {
        range.insertNode(table);
        const br = document.createElement('br');
        range.collapse(false);
        range.insertNode(br);
      } else {
        editorRef.current.appendChild(table);
        editorRef.current.appendChild(document.createElement('br'));
      }
      handleInput();
    }
    setTableDialog(false);
  };

  const handleInsertMedia = () => {
    setMediaDialog(true);
  };

  const doInsertMedia = () => {
    if (mediaFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result && editorRef.current) {
          const video = document.createElement('video');
          video.controls = true;
          video.style.maxWidth = '100%';
          video.style.height = 'auto';
          
          const source = document.createElement('source');
          source.src = e.target.result as string;
          video.appendChild(source);
          
          const selection = window.getSelection();
          const range = selection?.getRangeAt(0);
          
          if (range) {
            range.insertNode(video);
            range.collapse(false);
          } else {
            editorRef.current.appendChild(video);
          }
          handleInput();
        }
      };
      reader.readAsDataURL(mediaFile);
    } else if (mediaUrl && editorRef.current) {
      const video = document.createElement('video');
      video.controls = true;
      video.style.maxWidth = '100%';
      video.style.height = 'auto';
      
      const source = document.createElement('source');
      source.src = mediaUrl;
      video.appendChild(source);
      
      const selection = window.getSelection();
      const range = selection?.getRangeAt(0);
      
      if (range) {
        range.insertNode(video);
        range.collapse(false);
      } else {
        editorRef.current.appendChild(video);
      }
      handleInput();
    }
    setMediaDialog(false);
    setMediaUrl('');
    setMediaFile(null);
  };

  const handleInsertHR = () => {
    execCommand('insertHorizontalRule');
  };

  const handleInsertDateTime = () => {
    const now = new Date().toLocaleString('id-ID');
    execCommand('insertText', now);
  };

  // Format Menu Actions
  const handleFormatHeading = (tag: string) => {
    execCommand('formatBlock', `<${tag}>`);
    setSelectedHeading(tag);
  };

  const handleFontSize = (size: string) => {
    execCommand('fontSize', size);
    setSelectedFontSize(size);
  };

  const applyTextColor = () => {
    if (editorRef.current) {
      editorRef.current.focus();
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        document.execCommand('styleWithCSS', false, 'true');
        document.execCommand('foreColor', false, textColor);
        handleInput();
      }
    }
    setTextColorDialog(false);
  };

  const applyBgColor = () => {
    if (editorRef.current) {
      editorRef.current.focus();
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        document.execCommand('styleWithCSS', false, 'true');
        document.execCommand('backColor', false, bgColor);
        handleInput();
      }
    }
    setBgColorDialog(false);
  };

  return (
    <div className={cn(
      "space-y-2",
      isFullscreen && "fixed inset-0 z-50 bg-background p-4 overflow-auto"
    )}>
      {label && !isFullscreen && (
        <Label className="text-sm font-medium text-foreground">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}

      <div className="border border-border rounded-md overflow-hidden bg-background">
        {/* Menu Bar with Dropdowns */}
        <div className="bg-muted/50 border-b border-border p-2">
          <div className="flex flex-wrap gap-1 items-center text-sm">
            {isFullscreen && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="mr-2"
              >
                <Minimize className="w-4 h-4 mr-1" />
                Close Fullscreen
              </Button>
            )}
            
            {/* File Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="sm">
                  File
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleNewDocument}>
                  <FileText className="w-4 h-4 mr-2" />
                  New Document
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePreview}>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Edit Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="sm">
                  Edit
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleUndo} disabled={historyIndex <= 0}>
                  <Undo className="w-4 h-4 mr-2" />
                  Undo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleRedo} disabled={historyIndex >= history.length - 1}>
                  <Redo className="w-4 h-4 mr-2" />
                  Redo
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleCut}>
                  <Scissors className="w-4 h-4 mr-2" />
                  Cut
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopy}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePaste}>
                  <Clipboard className="w-4 h-4 mr-2" />
                  Paste
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePasteText}>
                  <Clipboard className="w-4 h-4 mr-2" />
                  Paste as Text
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSelectAll}>
                  Select All
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleFind}>
                  <Search className="w-4 h-4 mr-2" />
                  Find
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleFindReplace}>
                  <Search className="w-4 h-4 mr-2" />
                  Find & Replace
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* View Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="sm">
                  View
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={toggleSourceMode}>
                  <Code className="w-4 h-4 mr-2" />
                  {isSourceMode ? 'Visual Mode' : 'Source Code'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePreview}>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleFullscreen}>
                  <Maximize className="w-4 h-4 mr-2" />
                  Fullscreen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Insert Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="sm">
                  Insert
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleInsertImage}>
                  <Image className="w-4 h-4 mr-2" />
                  Image
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleInsertLink}>
                  <Link className="w-4 h-4 mr-2" />
                  Link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleInsertMedia}>
                  <Video className="w-4 h-4 mr-2" />
                  Media
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleInsertTable}>
                  <Table className="w-4 h-4 mr-2" />
                  Table
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleInsertHR}>
                  <Minus className="w-4 h-4 mr-2" />
                  Horizontal Line
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleInsertDateTime}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Date/Time
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Format Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="sm">
                  Format
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => execCommand('bold')}>
                  <Bold className="w-4 h-4 mr-2" />
                  Bold
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => execCommand('italic')}>
                  <Italic className="w-4 h-4 mr-2" />
                  Italic
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => execCommand('underline')}>
                  <Underline className="w-4 h-4 mr-2" />
                  Underline
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => execCommand('strikeThrough')}>
                  <Strikethrough className="w-4 h-4 mr-2" />
                  Strikethrough
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => execCommand('superscript')}>
                  <Superscript className="w-4 h-4 mr-2" />
                  Superscript
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => execCommand('subscript')}>
                  <Subscript className="w-4 h-4 mr-2" />
                  Subscript
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setTextColorDialog(true)}>
                  <Type className="w-4 h-4 mr-2" />
                  Text Color
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setBgColorDialog(true)}>
                  <Palette className="w-4 h-4 mr-2" />
                  Background Color
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => execCommand('removeFormat')}>
                  <RemoveFormatting className="w-4 h-4 mr-2" />
                  Clear Formatting
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Tools Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="sm">
                  Tools
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={toggleSourceMode}>
                  <Code className="w-4 h-4 mr-2" />
                  Source Code
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span className="text-muted-foreground">Word Count: {wordCount}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Help Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="sm">
                  Help
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setHelpDialog(true)}>
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Help & Shortcuts
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-muted/30 border-b border-border p-2">
          <div className="flex gap-1 flex-wrap items-center">
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              onClick={handleUndo} 
              title="Undo"
              disabled={historyIndex <= 0}
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              onClick={handleRedo} 
              title="Redo"
              disabled={historyIndex >= history.length - 1}
            >
              <Redo className="w-4 h-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-6 mx-1" />

            <Select value={selectedHeading} onValueChange={handleFormatHeading}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="p">Paragraph</SelectItem>
                <SelectItem value="h1">Heading 1</SelectItem>
                <SelectItem value="h2">Heading 2</SelectItem>
                <SelectItem value="h3">Heading 3</SelectItem>
                <SelectItem value="h4">Heading 4</SelectItem>
                <SelectItem value="h5">Heading 5</SelectItem>
                <SelectItem value="h6">Heading 6</SelectItem>
              </SelectContent>
            </Select>

            <Separator orientation="vertical" className="h-6 mx-1" />

            <Button type="button" variant="ghost" size="icon" onClick={() => execCommand('bold')} title="Bold">
              <Bold className="w-4 h-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={() => execCommand('italic')} title="Italic">
              <Italic className="w-4 h-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={() => execCommand('underline')} title="Underline">
              <Underline className="w-4 h-4" />
            </Button>

            <Separator orientation="vertical" className="h-6 mx-1" />

            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              title="Text Color"
              onClick={() => setTextColorDialog(true)}
            >
              <Type className="w-4 h-4" />
            </Button>

            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              title="Background Color"
              onClick={() => setBgColorDialog(true)}
            >
              <Palette className="w-4 h-4" />
            </Button>

            <Separator orientation="vertical" className="h-6 mx-1" />

            <Button type="button" variant="ghost" size="icon" onClick={() => execCommand('justifyLeft')} title="Align Left">
              <AlignLeft className="w-4 h-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={() => execCommand('justifyCenter')} title="Align Center">
              <AlignCenter className="w-4 h-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={() => execCommand('justifyRight')} title="Align Right">
              <AlignRight className="w-4 h-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={() => execCommand('justifyFull')} title="Justify">
              <AlignJustify className="w-4 h-4" />
            </Button>

            <Separator orientation="vertical" className="h-6 mx-1" />

            <Button type="button" variant="ghost" size="icon" onClick={() => execCommand('insertUnorderedList')} title="Bullet List">
              <List className="w-4 h-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={() => execCommand('insertOrderedList')} title="Numbered List">
              <ListOrdered className="w-4 h-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={() => execCommand('outdent')} title="Decrease Indent">
              <Outdent className="w-4 h-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={() => execCommand('indent')} title="Increase Indent">
              <Indent className="w-4 h-4" />
            </Button>

            <Separator orientation="vertical" className="h-6 mx-1" />

            <Button type="button" variant="ghost" size="icon" onClick={() => execCommand('removeFormat')} title="Clear Formatting">
              <RemoveFormatting className="w-4 h-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={() => setHelpDialog(true)} title="Help">
              <HelpCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Editor Area */}
        {isSourceMode ? (
          <textarea
            value={sourceCode}
            onChange={(e) => setSourceCode(e.target.value)}
            className="w-full p-4 font-mono text-sm bg-background text-foreground border-0 focus:outline-none resize-none"
            style={{ height: `${height}px` }}
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onBlur={handleInput}
            className="w-full p-4 bg-background text-foreground border-0 focus:outline-none overflow-auto prose max-w-none"
            style={{ minHeight: `${height}px` }}
            suppressContentEditableWarning
          />
        )}

        {/* Status Bar */}
        <div className="bg-muted/30 border-t border-border p-2 flex justify-between items-center text-xs text-muted-foreground">
          <div>Words: {wordCount}</div>
          <div>Characters: {editorRef.current?.innerText?.length || 0}</div>
        </div>
      </div>

      {/* Text Color Dialog */}
      <Dialog open={textColorDialog} onOpenChange={setTextColorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pilih Warna Teks</DialogTitle>
          </DialogHeader>
          <ColorPicker
            value={textColor}
            onChange={setTextColor}
            label="Warna Teks"
          />
          <Button type="button" onClick={applyTextColor} className="w-full">
            Terapkan Warna
          </Button>
        </DialogContent>
      </Dialog>

      {/* Background Color Dialog */}
      <Dialog open={bgColorDialog} onOpenChange={setBgColorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pilih Warna Background</DialogTitle>
          </DialogHeader>
          <ColorPicker
            value={bgColor}
            onChange={setBgColor}
            label="Warna Background"
          />
          <Button type="button" onClick={applyBgColor} className="w-full">
            Terapkan Warna
          </Button>
        </DialogContent>
      </Dialog>

      {/* Image Insert Dialog */}
      <Dialog open={imageDialog} onOpenChange={setImageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>URL Gambar</Label>
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="text-center text-sm text-muted-foreground">atau</div>
            <div>
              <Label>Upload Gambar</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
            </div>
            <Button type="button" onClick={doInsertImage} className="w-full">
              Insert Image
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Link Insert Dialog */}
      <Dialog open={linkDialog} onOpenChange={setLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>URL</Label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <Button type="button" onClick={doInsertLink} className="w-full">
              Insert Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Table Insert Dialog */}
      <Dialog open={tableDialog} onOpenChange={setTableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Table</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Jumlah Baris</Label>
              <Input
                type="number"
                value={tableRows}
                onChange={(e) => setTableRows(parseInt(e.target.value) || 3)}
                min="1"
                max="20"
              />
            </div>
            <div>
              <Label>Jumlah Kolom</Label>
              <Input
                type="number"
                value={tableCols}
                onChange={(e) => setTableCols(parseInt(e.target.value) || 3)}
                min="1"
                max="20"
              />
            </div>
            <Button type="button" onClick={doInsertTable} className="w-full">
              Insert Table
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Media Insert Dialog */}
      <Dialog open={mediaDialog} onOpenChange={setMediaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Media</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>URL Media</Label>
              <Input
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://example.com/video.mp4"
              />
            </div>
            <div className="text-center text-sm text-muted-foreground">atau</div>
            <div>
              <Label>Upload Media</Label>
              <Input
                type="file"
                accept="video/*,audio/*"
                onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
              />
            </div>
            <Button type="button" onClick={doInsertMedia} className="w-full">
              Insert Media
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Find Dialog */}
      <Dialog open={findDialog} onOpenChange={setFindDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Find</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Find Text</Label>
              <Input
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                placeholder="Cari teks..."
              />
            </div>
            <Button type="button" onClick={doFind} className="w-full">
              Find Next
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Find & Replace Dialog */}
      <Dialog open={findReplaceDialog} onOpenChange={setFindReplaceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Find & Replace</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Find</Label>
              <Input
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                placeholder="Cari teks..."
              />
            </div>
            <div>
              <Label>Replace With</Label>
              <Input
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                placeholder="Ganti dengan..."
              />
            </div>
            <Button type="button" onClick={doFindReplace} className="w-full">
              Replace All
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialog} onOpenChange={setPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
          </DialogHeader>
          <div 
            className="prose max-w-none p-4 border border-border rounded-md bg-background"
            dangerouslySetInnerHTML={{ __html: editorRef.current?.innerHTML || '' }}
          />
        </DialogContent>
      </Dialog>

      {/* Help Dialog */}
      <Dialog open={helpDialog} onOpenChange={setHelpDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Help & Keyboard Shortcuts</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold mb-2">Formatting Shortcuts</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li><kbd>Ctrl + B</kbd> - Bold</li>
                <li><kbd>Ctrl + I</kbd> - Italic</li>
                <li><kbd>Ctrl + U</kbd> - Underline</li>
                <li><kbd>Ctrl + Z</kbd> - Undo</li>
                <li><kbd>Ctrl + Y</kbd> - Redo</li>
                <li><kbd>Ctrl + A</kbd> - Select All</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Features</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Rich text formatting with bold, italic, underline</li>
                <li>• Text alignment and list formatting</li>
                <li>• Insert images, links, tables, and media</li>
                <li>• Find and replace text</li>
                <li>• Source code view</li>
                <li>• Fullscreen editing mode</li>
                <li>• Word count tracking</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Tips</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Use the toolbar for quick access to common formatting options</li>
                <li>• Select text before creating links</li>
                <li>• Tables can be edited after insertion by clicking on cells</li>
                <li>• Switch to Source Code view to see and edit HTML directly</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {!isFullscreen && (
        <p className="text-xs text-muted-foreground">
          💡 Gunakan toolbar untuk memformat teks, menambahkan gambar, tabel, dan lainnya
        </p>
      )}
    </div>
  );
};
