param(
    [string]$ReleasePath = '',
    [string]$PreuploadReport = ''
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$scriptParent = Split-Path -Parent $scriptDir
$runningFromReleaseTools = Test-Path -LiteralPath (Join-Path $scriptParent 'CHECKSUMS-SHA256.txt')
$appRoot = if ($runningFromReleaseTools) {
    Split-Path -Parent (Split-Path -Parent $scriptParent)
} else {
    Split-Path -Parent $scriptDir
}

function Write-Check {
    param([string]$Message)
    Write-Host "[OK] $Message"
}

function Assert-Path {
    param(
        [string]$Path,
        [string]$Message
    )
    if (-not (Test-Path -LiteralPath $Path)) {
        throw $Message
    }
    Write-Check $Message
}

function Assert-Contains {
    param(
        [string]$Text,
        [string]$Needle,
        [string]$Message
    )
    if (-not $Text.Contains($Needle)) {
        throw $Message
    }
    Write-Check $Message
}

function Resolve-DefaultReleasePath {
    if ($runningFromReleaseTools) {
        return $scriptParent
    }

    $releaseRoot = Join-Path $appRoot 'release'
    if (-not (Test-Path -LiteralPath $releaseRoot)) {
        throw "Release root does not exist: $releaseRoot"
    }

    $latest = Get-ChildItem -LiteralPath $releaseRoot -Directory |
        Where-Object { $_.Name -like 'sodovanphuc-*' } |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1

    if (-not $latest) {
        throw 'No sodovanphuc release folder found.'
    }

    return $latest.FullName
}

function Resolve-ToolPath {
    param(
        [string]$ToolName,
        [string]$ReleaseRoot
    )

    $sameFolder = Join-Path $scriptDir $ToolName
    if (Test-Path -LiteralPath $sameFolder) {
        return $sameFolder
    }

    $releaseTool = Join-Path $ReleaseRoot "tools\$ToolName"
    if (Test-Path -LiteralPath $releaseTool) {
        return $releaseTool
    }

    $sourceTool = Join-Path $appRoot "deploy\$ToolName"
    if (Test-Path -LiteralPath $sourceTool) {
        return $sourceTool
    }

    throw "Could not locate $ToolName."
}

function Get-ZipEntries {
    param([string]$ZipPath)
    return @(tar -tf $ZipPath)
}

if (-not $ReleasePath) {
    $ReleasePath = Resolve-DefaultReleasePath
}

$release = (Resolve-Path -LiteralPath $ReleasePath).Path
$releaseName = Split-Path -Leaf $release
$releaseRoot = Split-Path -Parent $release
$fullZip = Join-Path $release 'sodovanphuc-full-public_html.zip'
$checksumPath = Join-Path $release 'CHECKSUMS-SHA256.txt'
$uploadPointer = Join-Path $release 'UPLOAD_THIS_PACKAGE.txt'
$postUploadChecklist = Join-Path $release 'POST_UPLOAD_CHECKLIST.md'
$verifyPackage = Resolve-ToolPath 'verify-release-package.ps1' $release

Assert-Path $fullZip 'full public_html upload zip exists'
Assert-Path $checksumPath 'checksum file exists'
Assert-Path $uploadPointer 'upload pointer exists'
Assert-Path $postUploadChecklist 'post-upload checklist exists'
Assert-Path (Join-Path $release 'tools\prepare-real-upload.ps1') 'release contains real upload preparation wrapper'
Assert-Path (Join-Path $release 'tools\cleanup-real-upload-artifacts.ps1') 'release contains real upload artifact cleanup tool'
Assert-Path (Join-Path $release 'tools\domain-cutover-report-vanphuc.ps1') 'release contains domain cutover report tool'
Assert-Path (Join-Path $release 'tools\wait-vanphuc-hosting-ready.ps1') 'release contains hosting readiness watcher'
Assert-Path (Join-Path $release 'tools\complete-vanphuc-hosting-handoff.ps1') 'release contains post-upload handoff autopilot'
Assert-Path (Join-Path $release 'tools\acceptance-report-vanphuc-hosting.ps1') 'release contains final acceptance report gate'

& $verifyPackage -ReleasePath $release
Write-Check 'standalone release package verification passed'

$hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $fullZip).Hash.ToLowerInvariant()
$checksumText = Get-Content -LiteralPath $checksumPath -Raw
Assert-Contains $checksumText $hash 'checksum file contains current full upload zip hash'

$forbiddenReleaseItems = @(
    'sodovanphuc-configured-public_html.zip',
    'sodovanphuc-configured-public_html.sha256.txt',
    'configured-public_html',
    'REAL_UPLOAD_READY.md'
)

foreach ($item in $forbiddenReleaseItems) {
    $path = Join-Path $release $item
    if (Test-Path -LiteralPath $path) {
        throw "Release contains local/secret artifact that must be regenerated only with real credentials: $path"
    }
}
Write-Check 'release root has no configured zip, configured workdir or real upload manifest'

$configFiles = Get-ChildItem -LiteralPath $release -Recurse -Force -Filter config.php -ErrorAction SilentlyContinue
if ($configFiles) {
    $configFiles | Select-Object -ExpandProperty FullName | ForEach-Object { Write-Host $_ }
    throw 'Base release contains config.php; secrets must not be in the base package.'
}
Write-Check 'base release contains no config.php secrets'

$zipEntries = Get-ZipEntries $fullZip
foreach ($required in @(
    'public_html/index.html',
    'public_html/.htaccess',
    'public_html/backend/api/index.php',
    'public_html/backend/config/config.example.php',
    'public_html/backend/sql/schema.sql',
    'public_html/backend/sql/002_add_property_video_url.sql',
    'public_html/backend/sql/003_add_property_social_links.sql',
    'public_html/backend/sql/004_users_banners_blog.sql',
    'public_html/backend/sql/005_chat_messages.sql',
    'public_html/backend/sql/006_property_likes.sql',
    'public_html/backend/sql/007_add_coordinates.sql',
    'public_html/backend/sql/007_add_expiry_notified.sql',
    'public_html/backend/sql/008_bank_transfers.sql',
    'public_html/backend/sql/009_property_image_unique.sql',
    'public_html/backend/sql/seed.sql',
    'public_html/backend/sql/sodovanphuc_import_all.sql',
    'public_html/backend/sql/sodovanphuc_schema.sql',
    'public_html/backend/sql/sodovanphuc_seed.sql',
    'public_html/backend/sql/sodovanphuc_verify.sql',
    'public_html/backend/sql/database_verify.sql'
)) {
    if (-not ($zipEntries -contains $required)) {
        throw "Full upload zip is missing required item: $required"
    }
}
Write-Check 'full upload zip contains required public_html payload'

foreach ($forbidden in @(
    'public_html/.env',
    'public_html/.env.local',
    'public_html/.git/',
    'public_html/.github/',
    'public_html/node_modules/',
    'public_html/src/',
    'public_html/package.json',
    'public_html/package-lock.json',
    'public_html/pnpm-lock.yaml',
    'public_html/yarn.lock',
    'public_html/tsconfig.json',
    'public_html/vite.config.ts',
    'public_html/backend/config/config.php',
    'public_html/backend/.env',
    'public_html/backend/api/debug_test.php',
    'public_html/backend/composer.json',
    'public_html/backend/composer.lock',
    'public_html/backend/uploads/music/',
    'public_html/music/',
    'public_html/tools/',
    'public_html/POST_UPLOAD_CHECKLIST.md',
    'public_html/UPLOAD_THIS_PACKAGE.txt',
    'public_html/REAL_UPLOAD_READY.md'
)) {
    if ($zipEntries -contains $forbidden -or ($zipEntries | Where-Object { $_.StartsWith($forbidden) })) {
        throw "Full upload zip contains forbidden item: $forbidden"
    }
}
foreach ($forbiddenSuffix in @('.map', '.ts', '.tsx')) {
    $badEntries = @($zipEntries | Where-Object {
        $_.StartsWith('public_html/') -and $_.EndsWith($forbiddenSuffix, [System.StringComparison]::OrdinalIgnoreCase)
    })
    if ($badEntries.Count -gt 0) {
        $badEntries | Select-Object -First 20 | ForEach-Object { Write-Host $_ }
        throw "Full upload zip contains forbidden development/source artifact suffix: $forbiddenSuffix"
    }
}
Write-Check 'full upload zip excludes secrets, tools, local manifests and development artifacts'

$pointerText = Get-Content -LiteralPath $uploadPointer -Raw
Assert-Contains $pointerText 'sodovanphuc-full-public_html.zip' 'upload pointer names base upload zip'
Assert-Contains $pointerText 'prepare-real-upload.ps1' 'upload pointer names preferred real upload wrapper'
Assert-Contains $pointerText 'cleanup-real-upload-artifacts.ps1' 'upload pointer names real upload artifact cleanup tool'
Assert-Contains $pointerText 'domain-cutover-report-vanphuc.ps1' 'upload pointer names domain cutover report tool'
Assert-Contains $pointerText 'wait-vanphuc-hosting-ready.ps1' 'upload pointer names hosting readiness watcher'
Assert-Contains $pointerText 'complete-vanphuc-hosting-handoff.ps1' 'upload pointer names post-upload handoff autopilot'
Assert-Contains $pointerText 'acceptance-report-vanphuc-hosting.ps1 -IncludeWriteWorkflow' 'upload pointer names final acceptance report gate'
Assert-Contains $pointerText 'Final status: PASS' 'upload pointer blocks handoff until acceptance passes'

$checklistText = Get-Content -LiteralPath $postUploadChecklist -Raw
Assert-Contains $checklistText 'tools/prepare-real-upload.ps1' 'post-upload checklist names preferred real upload wrapper'
Assert-Contains $checklistText 'tools/cleanup-real-upload-artifacts.ps1' 'post-upload checklist names real upload artifact cleanup tool'
Assert-Contains $checklistText 'tools/domain-cutover-report-vanphuc.ps1' 'post-upload checklist names domain cutover report tool'
Assert-Contains $checklistText 'DOMAIN_CUTOVER_REPORT.md' 'post-upload checklist names domain cutover report'
Assert-Contains $checklistText 'tools/wait-vanphuc-hosting-ready.ps1' 'post-upload checklist names hosting readiness watcher'
Assert-Contains $checklistText 'HOSTING_WAIT_REPORT.md' 'post-upload checklist names hosting wait report'
Assert-Contains $checklistText 'tools/complete-vanphuc-hosting-handoff.ps1' 'post-upload checklist names post-upload handoff autopilot'
Assert-Contains $checklistText 'HOSTING_HANDOFF_COMPLETE.md' 'post-upload checklist names handoff autopilot report'
Assert-Contains $checklistText 'REAL_UPLOAD_READY.md' 'post-upload checklist names real upload manifest'
Assert-Contains $checklistText 'acceptance-report-vanphuc-hosting.ps1 -IncludeWriteWorkflow' 'post-upload checklist names final acceptance command'

$docFiles = @(
    (Join-Path $appRoot 'README.md'),
    (Join-Path $appRoot 'HANDOFF_WEB.md'),
    (Join-Path $appRoot 'deploy\HUONG_DAN_SU_DUNG.md'),
    (Join-Path (Split-Path -Parent $appRoot) 'DEPLOY_CHECKLIST_MATBAO_SO_DO_VAN_PHUC.md'),
    (Join-Path (Split-Path -Parent $appRoot) 'MASTER_PLAN_NOI_BO_TRIEN_KHAI_SO_DO_VAN_PHUC.md')
)

foreach ($doc in $docFiles) {
    Assert-Path $doc "doc exists: $doc"
    $content = Get-Content -LiteralPath $doc -Raw
    $releaseRefs = @([regex]::Matches($content, 'sodovanphuc-\d{8}-\d{6}') | ForEach-Object { $_.Value } | Sort-Object -Unique)
    foreach ($ref in $releaseRefs) {
        if ($ref -ne $releaseName) {
            throw "Doc $doc still references stale release $ref; expected $releaseName."
        }
    }
    if ($releaseRefs.Count -gt 0) {
        Write-Check "doc release refs point to ${releaseName}: $doc"
    }
    Assert-Contains $content 'prepare-real-upload.ps1' "doc mentions real upload wrapper: $doc"
    Assert-Contains $content 'cleanup-real-upload-artifacts.ps1' "doc mentions real upload artifact cleanup tool: $doc"
    Assert-Contains $content 'domain-cutover-report-vanphuc.ps1' "doc mentions domain cutover report: $doc"
    Assert-Contains $content 'wait-vanphuc-hosting-ready.ps1' "doc mentions hosting readiness watcher: $doc"
    Assert-Contains $content 'complete-vanphuc-hosting-handoff.ps1' "doc mentions post-upload handoff autopilot: $doc"
    Assert-Contains $content 'final-prehosting-audit.ps1' "doc mentions final pre-hosting audit: $doc"
}

$masterPlan = Join-Path (Split-Path -Parent $appRoot) 'MASTER_PLAN_NOI_BO_TRIEN_KHAI_SO_DO_VAN_PHUC.md'
$masterText = Get-Content -LiteralPath $masterPlan -Raw
Assert-Contains $masterText $hash 'master plan contains current full upload zip hash'
Assert-Contains $masterText 'contract verify: pass' 'master plan records passing contract verification'
Assert-Contains $masterText 'PowerShell syntax parse: pass' 'master plan records passing PowerShell syntax parse'

if (-not $PreuploadReport) {
    $shortStamp = if ($releaseName -match '(\d{6})$') { $Matches[1] } else { '' }
    $candidate = if ($shortStamp) {
        Join-Path $appRoot "qa\preupload\release-$shortStamp-tool-check\PREUPLOAD_REPORT.md"
    } else {
        ''
    }
    if ($candidate -and (Test-Path -LiteralPath $candidate)) {
        $PreuploadReport = $candidate
    }

    if (-not $PreuploadReport) {
        $reportRoot = Join-Path $appRoot 'qa\preupload'
        if (Test-Path -LiteralPath $reportRoot) {
            $matchingReport = Get-ChildItem -LiteralPath $reportRoot -Recurse -Force -Filter PREUPLOAD_REPORT.md |
                Sort-Object LastWriteTime -Descending |
                Where-Object {
                    $text = Get-Content -LiteralPath $_.FullName -Raw
                    $text.Contains($release) -and $text.Contains($fullZip)
                } |
                Select-Object -First 1
            if ($matchingReport) {
                $PreuploadReport = $matchingReport.FullName
            }
        }
    }
}

if ($PreuploadReport) {
    $reportPath = (Resolve-Path -LiteralPath $PreuploadReport).Path
    $reportText = Get-Content -LiteralPath $reportPath -Raw
    Assert-Contains $reportText '- Final status: PASS' 'pre-upload report final status is PASS'
    Assert-Contains $reportText $release 'pre-upload report points to current release root'
    Assert-Contains $reportText $fullZip 'pre-upload report points to current upload zip'
    Assert-Contains $reportText '| Live domain diagnostic snapshot | EXPECTED_FAIL |' 'pre-upload report records expected live-domain pre-upload failure'
} else {
    throw 'Pre-upload report for the current release was not found. Run tools/preupload-report-sodovanphuc.ps1 first.'
}

$releaseDirs = @(Get-ChildItem -LiteralPath $releaseRoot -Directory | Where-Object { $_.Name -like 'sodovanphuc-*' })
if ($releaseDirs.Count -ne 1) {
    throw "Expected exactly one release directory after final packaging, found $($releaseDirs.Count)."
}
Write-Check 'only the current release directory remains'

Write-Host ''
Write-Host 'Final pre-hosting audit passed.'
Write-Host "Release: $release"
Write-Host "Upload zip: $fullZip"
Write-Host "SHA256: $hash"
