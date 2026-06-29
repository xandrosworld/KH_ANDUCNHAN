# Sổ Đỏ Vạn Phúc - Legacy Code Scanner
# Run: powershell -File scripts/scan-legacy.ps1
# This script scans user-facing source files for forbidden keywords

$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not $root) { $root = "c:\Users\Admin\Desktop\KHACHHANG\BDS_anduc\app" }
$srcPath = Join-Path $root "src"

# Only scan files that are imported by the new App.tsx routing
# These are user-facing files
$scanPaths = @(
    (Join-Path $srcPath "pages\HomePage.tsx"),
    (Join-Path $srcPath "pages\RegisterPage.tsx"),
    (Join-Path $srcPath "pages\ForgotPasswordPage.tsx"),
    (Join-Path $srcPath "pages\ResetPasswordPage.tsx"),
    (Join-Path $srcPath "pages\PendingApprovalPage.tsx"),
    (Join-Path $srcPath "pages\SelectRolePage.tsx"),
    (Join-Path $srcPath "pages\ProfilePage.tsx"),
    (Join-Path $srcPath "pages\PropertyDetailPage.tsx"),
    (Join-Path $srcPath "components\Header.tsx"),
    (Join-Path $srcPath "components\BottomNav.tsx"),
    (Join-Path $srcPath "components\Sidebar.tsx"),
    (Join-Path $srcPath "components\AppLayout.tsx"),
    (Join-Path $srcPath "components\ProtectedRoute.tsx"),
    (Join-Path $srcPath "contexts\AuthContext.tsx"),
    (Join-Path $srcPath "services\authApi.ts"),
    (Join-Path $srcPath "App.tsx"),
    (Join-Path $srcPath "main.tsx"),
    (Join-Path $srcPath "index.css")
)

# Also scan all role-specific pages
$roleDirs = @("owner", "buyer", "expert", "specialist", "collab", "referrer", "admin")
foreach ($dir in $roleDirs) {
    $dirPath = Join-Path $srcPath "pages\$dir"
    if (Test-Path $dirPath) {
        Get-ChildItem -Path $dirPath -Filter "*.tsx" -File | ForEach-Object {
            $scanPaths += $_.FullName
        }
    }
}

$forbidden = @(
    'globalforumz', 'GlobalForumz', 'GreenFields',
    'gfz', 'gf_user', 'gf_mock', 'gf_token',
    'Zillow', 'zillow',
    'California', 'United States', 'Hoa Ky',
    'PayPal', 'paypal', 'mortgage',
    'Admin Panel', 'Audit Log', 'Module', 'Roadmap',
    'you@example.com', 'email@example.com',
    'demo mode', 'demo note', 'demoMode', 'demoNote',
    'mock data', 'sample data', 'fallback data',
    'So Do Van Phuc'  # should be "Sổ Đỏ Vạn Phúc" with diacritics
)

# Allowed exceptions (internal code references)
$exceptions = @(
    'svp_token',       # localStorage key - OK
    'svp_active_role', # localStorage key - OK
    'OLD_TOKEN_KEYS',  # migration helper - OK
    'gf_token.*OLD_TOKEN_KEYS' # migration reference - OK
)

$totalIssues = 0
$issueFiles = @()

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  So Do Van Phuc - Legacy Code Scanner" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

foreach ($filePath in $scanPaths) {
    if (-not (Test-Path $filePath)) { continue }
    
    $content = Get-Content $filePath -Raw -ErrorAction SilentlyContinue
    if (-not $content) { continue }
    
    $fileIssues = @()
    $lineNum = 0
    $lines = Get-Content $filePath
    
    foreach ($line in $lines) {
        $lineNum++
        foreach ($keyword in $forbidden) {
            if ($line -match [regex]::Escape($keyword)) {
                # Check exceptions
                $isException = $false
                foreach ($exc in $exceptions) {
                    if ($line -match $exc) { $isException = $true; break }
                }
                if (-not $isException) {
                    $fileIssues += @{
                        Line = $lineNum
                        Keyword = $keyword
                        Content = $line.Trim().Substring(0, [Math]::Min(80, $line.Trim().Length))
                    }
                }
            }
        }
    }
    
    if ($fileIssues.Count -gt 0) {
        $relativePath = $filePath.Replace($root, "").TrimStart("\")
        Write-Host "FAIL: $relativePath" -ForegroundColor Red
        foreach ($issue in $fileIssues) {
            Write-Host "  Line $($issue.Line): [$($issue.Keyword)] $($issue.Content)" -ForegroundColor Yellow
        }
        $totalIssues += $fileIssues.Count
        $issueFiles += $relativePath
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
if ($totalIssues -eq 0) {
    Write-Host "  PASS - No legacy keywords found!" -ForegroundColor Green
} else {
    Write-Host "  FAIL - $totalIssues issues in $($issueFiles.Count) files" -ForegroundColor Red
    Write-Host "  Files with issues:" -ForegroundColor Yellow
    foreach ($f in $issueFiles) {
        Write-Host "    - $f" -ForegroundColor Yellow
    }
}
Write-Host "========================================`n" -ForegroundColor Cyan

exit $totalIssues
