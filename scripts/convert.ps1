param(
    [string]$inputFile,
    [string]$outputFile,
    [int]$startId
)

$jsonContent = Get-Content $inputFile -Raw
$words = $jsonContent | ConvertFrom-Json

$converted = @()
for ($i = 0; $i -lt $words.Count; $i++) {
    $item = $words[$i]
    $translation = ""
    $partOfSpeech = ""
    if ($item.translations -and $item.translations.Count -gt 0) {
        $translation = $item.translations[0].translation
        $partOfSpeech = $item.translations[0].type
    }
    
    $collocation = ""
    if ($item.PSObject.Properties.Name -contains "phrases") {
        $collocation = ($item.phrases | ForEach-Object { $_.phrase }) -join "; "
    }
    
    $obj = [PSCustomObject]@{
        word = $item.word
        id = $startId + $i + 1
        english = $item.word
        meaning = $translation
        partOfSpeech = $partOfSpeech
        collocation = $collocation
        chinese = $translation
    }
    $converted += $obj
}

$jsContent = "const words = " + ($converted | ConvertTo-Json -Compress) + ";`nmodule.exports = words;"
[System.IO.File]::WriteAllText($outputFile, $jsContent, [System.Text.Encoding]::UTF8)

Write-Host "OK: $($converted.Count)"
