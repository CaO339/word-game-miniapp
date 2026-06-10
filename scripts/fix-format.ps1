$baseDir = Split-Path -Parent $PSScriptRoot
$jsonPath = Join-Path $baseDir "data\4-CET6-顺序.json"
$jsPath = Join-Path $baseDir "data\cet6.js"

Write-Host "Reading: $jsonPath"
$json = Get-Content -LiteralPath $jsonPath -Raw | ConvertFrom-Json
$words = @()

for ($i = 0; $i -lt $json.Count; $i++) {
    $item = $json[$i]
    $t = ""
    $p = ""
    if ($item.translations -and $item.translations.Count -gt 0) {
        $t = $item.translations[0].translation
        $p = $item.translations[0].type
    }
    
    $c = ""
    if ($item.phrases) {
        $c = ($item.phrases | ForEach-Object { $_.phrase }) -join "; "
    }
    
    $words += [PSCustomObject]@{
        word = $item.word
        id = $i + 20001
        english = $item.word
        meaning = $t
        partOfSpeech = $p
        collocation = $c
        chinese = $t
    }
}

$jsonStr = $words | ConvertTo-Json -Compress
$jsContent = "module.exports = $jsonStr;"
[System.IO.File]::WriteAllText($jsPath, $jsContent, [System.Text.Encoding]::UTF8)

Write-Host "CET6: $($words.Count) words written to $jsPath"
