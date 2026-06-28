$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$appRoot = Split-Path -Parent $scriptDir

$targets = @()
$targets += Get-ChildItem -LiteralPath (Join-Path $appRoot 'deploy') -Filter '*.ps1' -File
$targets += Get-ChildItem -LiteralPath (Join-Path $appRoot 'scripts') -Filter '*.ps1' -File

$count = 0
foreach ($file in $targets) {
    $tokens = $null
    $errors = $null
    [System.Management.Automation.Language.Parser]::ParseFile($file.FullName, [ref] $tokens, [ref] $errors) | Out-Null
    if ($errors -and $errors.Count -gt 0) {
        foreach ($errorItem in $errors) {
            Write-Host "PowerShell parse error in $($file.FullName):$($errorItem.Extent.StartLineNumber):$($errorItem.Extent.StartColumnNumber)"
            Write-Host $errorItem.Message
        }
        throw "PowerShell syntax parse failed for $($file.FullName)"
    }
    $count++
}

Write-Host "PowerShell syntax parse passed for $count files."
