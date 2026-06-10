@echo off
chcp 65001 >nul
cd /d "%~dp0.."

:: 使用 PowerShell 转换 CET6
powershell -ExecutionPolicy Bypass -Command "
$json = Get-Content 'data\4-CET6-顺序.json' -Raw -Encoding UTF8 | ConvertFrom-Json;
$words = @();
for ($i = 0; $i -lt $json.Count; $i++) {
    $item = $json[$i];
    $t = if ($item.translations -and $item.translations.Count -gt 0) { $item.translations[0].translation } else { '' };
    $p = if ($item.translations -and $item.translations.Count -gt 0) { $item.translations[0].type } else { '' };
    $c = if ($item.phrases) { ($item.phrases | ForEach-Object { $_.phrase }) -join '; ' } else { '' };
    $words += @{ word=$item.word; id=($i+20001); english=$item.word; meaning=$t; partOfSpeech=$p; collocation=$c; chinese=$t };
}
$jsonStr = ($words | ConvertTo-Json -Compress);
$jsContent = 'module.exports = ' + $jsonStr + ';';
[System.IO.File]::WriteAllText('data\cet6.js', $jsContent, [System.Text.Encoding]::UTF8);
Write-Host ('CET6: ' + $words.Count + ' words');
"

echo CET6 conversion done
pause
