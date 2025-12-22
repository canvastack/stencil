import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProductComparison } from '@/contexts/ProductComparisonContext';
import type { Product } from '@/types/product';
import type { ComparisonNote } from '@/types/comparison';

interface ComparisonNotesPanelProps {
  products: Product[];
}

export const ComparisonNotesPanel: React.FC<ComparisonNotesPanelProps> = ({ products }) => {
  const { notes, addNote, removeNote } = useProductComparison();
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [noteContent, setNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleAddNote = () => {
    if (!selectedProductId || !noteContent.trim()) return;
    
    addNote(selectedProductId, noteContent);
    setNoteContent('');
    setSelectedProductId('');
  };

  const handleEditNote = (note: ComparisonNote) => {
    setEditingNoteId(note.id);
    setEditContent(note.content);
  };

  const handleSaveEdit = (noteId: string) => {
    removeNote(noteId);
    const note = notes.find(n => n.id === noteId);
    if (note && editContent.trim()) {
      addNote(note.productId, editContent);
    }
    setEditingNoteId(null);
    setEditContent('');
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditContent('');
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.name || 'Unknown Product';
  };

  const groupedNotes = products.map(product => ({
    product,
    notes: notes.filter(n => n.productId === product.id),
  }));

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Comparison Notes</h3>
          <Badge variant="secondary">{notes.length} notes</Badge>
        </div>

        <div className="space-y-3 border rounded-lg p-4 bg-secondary/20">
          <label className="text-sm font-medium">Add Note</label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background"
          >
            <option value="">Select a product...</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
          
          <Textarea
            placeholder="Add your notes about this product..."
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            rows={3}
            className="resize-none"
          />
          
          <Button
            onClick={handleAddNote}
            disabled={!selectedProductId || !noteContent.trim()}
            className="w-full gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Note
          </Button>
        </div>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {groupedNotes.map(({ product, notes: productNotes }) => (
              productNotes.length > 0 && (
                <div key={product.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-medium">
                      {product.name}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {productNotes.length} {productNotes.length === 1 ? 'note' : 'notes'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 pl-2">
                    {productNotes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                      >
                        {editingNoteId === note.id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              rows={3}
                              className="resize-none"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSaveEdit(note.id)}
                                className="gap-1"
                              >
                                <Save className="h-3 w-3" />
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                                className="gap-1"
                              >
                                <X className="h-3 w-3" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm flex-1">{note.content}</p>
                              <div className="flex gap-1 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleEditNote(note)}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => removeNote(note.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(note.createdAt).toLocaleDateString()} at {new Date(note.createdAt).toLocaleTimeString()}
                            </p>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}

            {notes.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No notes yet</p>
                <p className="text-xs mt-1">Add notes to remember key details about products</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
};
