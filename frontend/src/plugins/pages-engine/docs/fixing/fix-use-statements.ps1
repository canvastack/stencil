Get-ChildItem -Path "src\Http" -Recurse -Filter *.php | ForEach-Object {
    $filePath = $_.FullName
    $content = Get-Content $filePath -Raw
    
    if ($content -match 'use PagesEngine\\') {
        Write-Host "Updating use statements: $filePath"
        $newContent = $content -replace 'use PagesEngine\\', 'use Plugins\PagesEngine\'
        Set-Content -Path $filePath -Value $newContent -NoNewline
    }
}

Write-Host "`nUse statement update completed!"
