
$htmlFiles = Get-ChildItem "c:\Users\chihab benslimane\Desktop\New folder (2)\*.html"
$root = "c:\Users\chihab benslimane\Desktop\New folder (2)"

foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName
    $links = [regex]::Matches($content, 'href="([^"#]+)(#[^"]+)?"')
    $sources = [regex]::Matches($content, 'src="([^"]+)"')
    
    foreach ($match in $links) {
        $link = $match.Groups[1].Value
        if ($link -notmatch "^http" -and $link -notmatch "^mailto:" -and $link -ne "") {
            $targetPath = Join-Path $root $link
            if (-not (Test-Path $targetPath)) {
                Write-Host "Broken Link in $($file.Name): $link"
            }
        }
    }

    foreach ($match in $sources) {
        $src = $match.Groups[1].Value
        if ($src -notmatch "^http" -and $src -ne "") {
            $targetPath = Join-Path $root $src
            if (-not (Test-Path $targetPath)) {
                Write-Host "Missing Source in $($file.Name): $src"
            }
        }
    }
}
