import React, { useState, useMemo } from 'react';
import { useThemeManager } from '@/core/engine/ThemeManagerProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const languageOptions = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'php', label: 'PHP' },
  { value: 'sql', label: 'SQL' },
];

export default function ThemeManagerPage() {
  const { installedThemes, activeTheme, installTheme, activateTheme, uninstallTheme, exportTheme, updateThemeFile } = useThemeManager();
  const [file, setFile] = useState<File | null>(null);
  const [selectedThemeName, setSelectedThemeName] = useState<string | null>(null);
  const [selectedFileKey, setSelectedFileKey] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [editorLang, setEditorLang] = useState('javascript');

  const themeMap = useMemo(() => {
    const m: Record<string, any> = {};
    (installedThemes || []).forEach((t: any) => (m[t.metadata?.name] = t));
    return m;
  }, [installedThemes]);

  const handleUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    try {
      await installTheme(file);
      alert('Theme uploaded');
      setFile(null);
    } catch (err: any) {
      console.error(err);
      alert('Failed to install theme: ' + (err?.message || err));
    }
  };

  const handleActivate = async (name: string) => {
    try {
      await activateTheme(name);
      alert('Theme activated');
    } catch (err: any) {
      console.error(err);
      alert('Failed to activate theme: ' + (err?.message || err));
    }
  };

  const handleUninstall = async (name: string) => {
    if (!confirm('Uninstall theme ' + name + '?')) return;
    try {
      await uninstallTheme(name);
      alert('Theme uninstalled');
    } catch (err: any) {
      console.error(err);
      alert('Failed to uninstall theme: ' + (err?.message || err));
    }
  };

  const handleExport = async (name: string) => {
    try {
      const blob = await exportTheme(name);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      alert('Failed to export theme: ' + (err?.message || err));
    }
  };

  const openFileInEditor = (themeName: string, key: string, content: string) => {
    setSelectedThemeName(themeName);
    setSelectedFileKey(key);
    setEditorContent(typeof content === 'string' ? content : JSON.stringify(content, null, 2));
  };

  const saveEditor = async () => {
    if (!selectedThemeName || !selectedFileKey) return alert('No file selected');
    try {
      // For simplicity we treat everything as component or asset (try components first)
      await updateThemeFile(selectedThemeName, 'components', selectedFileKey, editorContent);
      alert('Saved');
    } catch (err: any) {
      console.error(err);
      alert('Failed to save: ' + (err?.message || err));
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Theme Management</h1>

      <Card className="p-4 mb-6">
        <h2 className="font-semibold mb-2">Installed Themes</h2>
        <div className="flex gap-3 flex-wrap">
          {(installedThemes || []).map((t: any) => (
            <div key={t.metadata.name} className="p-3 border rounded-md bg-muted/50">
              <div className="font-medium">{t.metadata.name}</div>
              <div className="text-sm text-muted-foreground">v{t.metadata.version}</div>
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={() => handleActivate(t.metadata.name)} className="min-w-[90px]">Activate</Button>
                <Button size="sm" onClick={() => handleExport(t.metadata.name)} className="min-w-[90px]">Export</Button>
                <Button size="sm" variant="destructive" onClick={() => handleUninstall(t.metadata.name)} className="min-w-[90px]">Uninstall</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4 mb-6">
        <h2 className="font-semibold mb-2">Upload Theme Package (.zip)</h2>
        <div className="flex items-center gap-3">
          <Input type="file" accept=".zip" onChange={handleUploadChange} />
          <Button onClick={handleUpload} disabled={!file}>Upload</Button>
        </div>
      </Card>

      <Card className="p-4 mb-6">
        <h2 className="font-semibold mb-2">Edit Theme Files</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Theme</label>
            <Select onValueChange={(v) => { setSelectedThemeName(v || null); setSelectedFileKey(null); }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose theme" />
              </SelectTrigger>
              <SelectContent>
                {(installedThemes || []).map((t: any) => (
                  <SelectItem key={t.metadata.name} value={t.metadata.name}>{t.metadata.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Files</label>
              <div className="space-y-2 max-h-[300px] overflow-auto">
                {selectedThemeName && Object.entries(themeMap[selectedThemeName]?.components || {}).map(([k, v]: any) => (
                  <div key={k} className="flex items-center justify-between border px-2 py-1 rounded">
                    <div className="truncate">{k}.tsx</div>
                    <div className="flex gap-2">
                      <Button size="icon" onClick={() => openFileInEditor(selectedThemeName, k, v)}>Edit</Button>
                    </div>
                  </div>
                ))}
                {selectedThemeName && Object.entries(themeMap[selectedThemeName]?.assets?.images || {}).map(([k, v]: any) => (
                  <div key={k} className="flex items-center justify-between border px-2 py-1 rounded">
                    <div className="truncate">assets/images/{k}</div>
                    <div className="flex gap-2">
                      <Button size="icon" onClick={() => openFileInEditor(selectedThemeName, k, v)}>Edit</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-sm text-muted-foreground">Editing:</div>
                <div className="font-medium">{selectedThemeName} {selectedFileKey ? ` / ${selectedFileKey}` : ''}</div>
              </div>
              <div className="flex items-center gap-2">
                <Select onValueChange={(v) => setEditorLang(v || 'javascript')}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="Language" /></SelectTrigger>
                  <SelectContent>
                    {languageOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button onClick={saveEditor} disabled={!selectedThemeName || !selectedFileKey}>Save</Button>
              </div>
            </div>

            <div>
              {/* For simplicity we use a textarea editor fallback. If monaco-react or codemirror is available the UI can be enhanced to use it. */}
              <textarea
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                className="w-full h-[480px] p-3 font-mono bg-muted/10 border border-border rounded"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
