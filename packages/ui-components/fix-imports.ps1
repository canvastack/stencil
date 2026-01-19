$files = @("alert.tsx", "badge.tsx", "card.tsx", "dialog.tsx", "dropdown-menu.tsx", "input.tsx", "label.tsx", "select.tsx", "separator.tsx", "table.tsx", "tabs.tsx", "textarea.tsx")

foreach ($file in $files) {
    $path = "d:\worksites\canvastack\projects\canvastencil\packages\ui-components\src\$file"
    $content = Get-Content $path -Raw
    $content = $content -replace '@/lib/utils', './utils'
    Set-Content $path -Value $content -NoNewline
    Write-Host "Fixed $file"
}
