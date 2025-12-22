import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useLanguage, Translation } from "@/contexts/LanguageContext";
import { Plus, Pencil, Trash2, Globe } from "lucide-react";
import { toast } from "sonner";

const LanguageSettings = () => {
  const { translations, addTranslation, updateTranslation, deleteTranslation } = useLanguage();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTranslation, setEditingTranslation] = useState<Translation | null>(null);
  const [formData, setFormData] = useState({
    key: "",
    id_text: "",
    en_text: "",
    category: "",
  });

  const handleAdd = () => {
    if (!formData.key || !formData.id_text || !formData.en_text) {
      toast.error("Mohon lengkapi semua field yang wajib");
      return;
    }

    const newTranslation: Translation = {
      id: Date.now().toString(),
      key: formData.key,
      id_text: formData.id_text,
      en_text: formData.en_text,
      category: formData.category,
    };

    addTranslation(newTranslation);
    toast.success("Terjemahan berhasil ditambahkan");
    setFormData({ key: "", id_text: "", en_text: "", category: "" });
    setIsAddDialogOpen(false);
  };

  const handleEdit = () => {
    if (!editingTranslation || !formData.key || !formData.id_text || !formData.en_text) {
      toast.error("Mohon lengkapi semua field yang wajib");
      return;
    }

    const updatedTranslation: Translation = {
      ...editingTranslation,
      key: formData.key,
      id_text: formData.id_text,
      en_text: formData.en_text,
      category: formData.category,
    };

    updateTranslation(updatedTranslation);
    toast.success("Terjemahan berhasil diperbarui");
    setEditingTranslation(null);
    setFormData({ key: "", id_text: "", en_text: "", category: "" });
  };

  const handleDelete = (id: string) => {
    if (confirm("Yakin ingin menghapus terjemahan ini?")) {
      deleteTranslation(id);
      toast.success("Terjemahan berhasil dihapus");
    }
  };

  const openEditDialog = (translation: Translation) => {
    setEditingTranslation(translation);
    setFormData({
      key: translation.key,
      id_text: translation.id_text,
      en_text: translation.en_text,
      category: translation.category || "",
    });
  };

  const groupedTranslations = translations.reduce((acc, t) => {
    const category = t.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(t);
    return acc;
  }, {} as Record<string, Translation[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pengaturan Bahasa</h1>
          <p className="text-muted-foreground mt-2">
            Kelola terjemahan untuk Bahasa Indonesia dan Bahasa Inggris
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Terjemahan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Terjemahan Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="key">Key (Kode Unik) *</Label>
                <Input
                  id="key"
                  value={formData.key}
                  onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                  placeholder="contoh: nav.home, product.title"
                />
              </div>

              <div>
                <Label htmlFor="category">Kategori</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="navigation, common, product, dll"
                />
              </div>

              <div>
                <Label htmlFor="id_text">Teks Bahasa Indonesia *</Label>
                <Input
                  id="id_text"
                  value={formData.id_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, id_text: e.target.value }))}
                  placeholder="Teks dalam Bahasa Indonesia"
                />
              </div>

              <div>
                <Label htmlFor="en_text">Teks Bahasa Inggris *</Label>
                <Input
                  id="en_text"
                  value={formData.en_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, en_text: e.target.value }))}
                  placeholder="Text in English"
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">
                  Batal
                </Button>
                <Button onClick={handleAdd} className="flex-1">
                  Tambah
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingTranslation} onOpenChange={() => setEditingTranslation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Terjemahan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-key">Key (Kode Unik) *</Label>
              <Input
                id="edit-key"
                value={formData.key}
                onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                placeholder="contoh: nav.home, product.title"
              />
            </div>

            <div>
              <Label htmlFor="edit-category">Kategori</Label>
              <Input
                id="edit-category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="navigation, common, product, dll"
              />
            </div>

            <div>
              <Label htmlFor="edit-id">Teks Bahasa Indonesia *</Label>
              <Input
                id="edit-id"
                value={formData.id_text}
                onChange={(e) => setFormData(prev => ({ ...prev, id_text: e.target.value }))}
                placeholder="Teks dalam Bahasa Indonesia"
              />
            </div>

            <div>
              <Label htmlFor="edit-en">Teks Bahasa Inggris *</Label>
              <Input
                id="edit-en"
                value={formData.en_text}
                onChange={(e) => setFormData(prev => ({ ...prev, en_text: e.target.value }))}
                placeholder="Text in English"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditingTranslation(null)} className="flex-1">
                Batal
              </Button>
              <Button onClick={handleEdit} className="flex-1">
                Simpan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Translations Table */}
      <div className="space-y-6">
        {Object.entries(groupedTranslations).map(([category, items]) => (
          <Card key={category} className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-bold text-foreground capitalize">{category}</h3>
              <Badge variant="secondary">{items.length} terjemahan</Badge>
            </div>
            
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Bahasa Indonesia</TableHead>
                    <TableHead>English</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((translation) => (
                    <TableRow key={translation.id}>
                      <TableCell className="font-mono text-sm">{translation.key}</TableCell>
                      <TableCell>{translation.id_text}</TableCell>
                      <TableCell>{translation.en_text}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(translation)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(translation.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default LanguageSettings;
