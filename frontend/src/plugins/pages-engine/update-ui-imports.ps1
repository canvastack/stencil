# Update UI component imports from @/components/ui/* to @canvastencil/ui-components

$files = @(
    "frontend\pages\admin\cms\ContentTypeList.tsx",
    "frontend\pages\admin\cms\CommentModeration.tsx",
    "frontend\pages\admin\cms\CategoryManagement.tsx",
    "frontend\components\cms\ContentEditor.tsx",
    "frontend\components\cms\CommentSection.tsx",
    "frontend\components\cms\CategoryTree.tsx",
    "frontend\components\cms\CategoryFormDialog.tsx",
    "frontend\pages\admin\cms\ContentForm.tsx",
    "frontend\pages\admin\cms\ContentTypeForm.tsx"
)

$replacements = @{
    "from '@/components/ui/button'" = "from '@canvastencil/ui-components'"
    "from '@/components/ui/input'" = "from '@canvastencil/ui-components'"
    "from '@/components/ui/card'" = "from '@canvastencil/ui-components'"
    "from '@/components/ui/badge'" = "from '@canvastencil/ui-components'"
    "from '@/components/ui/dropdown-menu'" = "from '@canvastencil/ui-components'"
    "from '@/components/ui/table'" = "from '@canvastencil/ui-components'"
    "from '@/components/ui/skeleton'" = "from '@canvastencil/ui-components'"
    "from '@/components/ui/dialog'" = "from '@canvastencil/ui-components'"
    "from '@/components/ui/label'" = "from '@canvastencil/ui-components'"
    "from '@/components/ui/textarea'" = "from '@canvastencil/ui-components'"
    "from '@/components/ui/select'" = "from '@canvastencil/ui-components'"
    "from '@/components/ui/alert'" = "from '@canvastencil/ui-components'"
    "from '@/components/ui/separator'" = "from '@canvastencil/ui-components'"
    "from '@/components/ui/tabs'" = "from '@canvastencil/ui-components'"
}

foreach ($file in $files) {
    Write-Host "Processing: $file"
    
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -Encoding UTF8
        
        foreach ($find in $replacements.Keys) {
            $replace = $replacements[$find]
            $content = $content -replace [regex]::Escape($find), $replace
        }
        
        Set-Content $file -Value $content -Encoding UTF8 -NoNewline
        Write-Host "  ✓ Updated" -ForegroundColor Green
    } else {
        Write-Host "  ✗ File not found" -ForegroundColor Red
    }
}

Write-Host "`nDone! All UI component imports updated to use @canvastencil/ui-components" -ForegroundColor Cyan
