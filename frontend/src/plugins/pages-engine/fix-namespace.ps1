Get-ChildItem -Recurse -Filter *.php | ForEach-Object {
    $filePath = $_.FullName
    $content = Get-Content $filePath -Raw
    
    if ($content -match 'namespace PagesEngine\\') {
        Write-Host "Updating: $filePath"
        $newContent = $content -replace 'namespace PagesEngine\\', 'namespace Plugins\PagesEngine\'
        Set-Content -Path $filePath -Value $newContent -NoNewline
    }
}

Write-Host "`nNamespace update completed!"
