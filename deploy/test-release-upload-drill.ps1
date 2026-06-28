param(
    [string]$ReleasePath = '',
    [string]$ZipPath = '',
    [string]$PhpPath = '',
    [string]$AdminUsernameForUploadDrill = 'admin',
    [string]$AdminPasswordForUploadDrill = '',
    [switch]$ExpectConfigInZip,
    [switch]$RequirePhp,
    [switch]$KeepWorkDir
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $scriptDir

function Write-Check {
    param([string]$Message)
    Write-Host "[OK] $Message"
}

function Write-Skip {
    param([string]$Message)
    Write-Host "[SKIP] $Message"
}

function Resolve-DefaultReleasePath {
    $scriptParent = Split-Path -Parent $scriptDir
    if (Test-Path -LiteralPath (Join-Path $scriptParent 'CHECKSUMS-SHA256.txt')) {
        return $scriptParent
    }

    $releaseRoot = Join-Path $root 'release'
    if (Test-Path -LiteralPath $releaseRoot) {
        $latest = Get-ChildItem -LiteralPath $releaseRoot -Directory |
            Where-Object { $_.Name -like 'sodovanphuc-*' } |
            Sort-Object LastWriteTime -Descending |
            Select-Object -First 1
        if ($latest) {
            return $latest.FullName
        }
    }

    throw 'Could not infer release path. Run this from release/tools or pass -ReleasePath.'
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

    $sourceTool = Join-Path $root "deploy\$ToolName"
    if (Test-Path -LiteralPath $sourceTool) {
        return $sourceTool
    }

    throw "Could not locate $ToolName."
}

function Resolve-Php {
    if ($PhpPath) {
        if (-not (Test-Path -LiteralPath $PhpPath)) {
            throw "PHP executable does not exist: $PhpPath"
        }
        return (Resolve-Path -LiteralPath $PhpPath).Path
    }

    $php = Get-Command php -ErrorAction SilentlyContinue
    if ($php) {
        return $php.Source
    }

    $localCandidates = @(
        (Join-Path $root '.runtime\php\php.exe'),
        (Join-Path $root 'tools\php\php.exe')
    )

    $rootParent = Split-Path -Parent $root
    if ((Split-Path -Leaf $rootParent) -eq 'release') {
        $appRoot = Split-Path -Parent $rootParent
        $localCandidates += (Join-Path $appRoot '.runtime\php\php.exe')
    }

    foreach ($candidate in $localCandidates) {
        if (Test-Path -LiteralPath $candidate) {
            return (Resolve-Path -LiteralPath $candidate).Path
        }
    }

    return $null
}

function New-FreePort {
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
    try {
        $listener.Start()
        return ([System.Net.IPEndPoint]$listener.LocalEndpoint).Port
    } finally {
        $listener.Stop()
    }
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

function Assert-NoPath {
    param(
        [string]$Path,
        [string]$Message
    )

    if (Test-Path -LiteralPath $Path) {
        throw $Message
    }
    Write-Check $Message
}

function Invoke-DrillRequest {
    param(
        [string]$Method,
        [string]$Url,
        [string]$Body = $null,
        [string]$ContentType = $null,
        [hashtable]$Headers = @{}
    )

    try {
        $request = @{
            Uri = $Url
            Method = $Method
            UseBasicParsing = $true
            TimeoutSec = 8
        }
        if ($PSBoundParameters.ContainsKey('Body')) {
            $request.Body = $Body
        }
        if ($PSBoundParameters.ContainsKey('ContentType') -and $ContentType) {
            $request.ContentType = $ContentType
        }
        if ($PSBoundParameters.ContainsKey('Headers') -and $Headers -and $Headers.Count -gt 0) {
            $request.Headers = $Headers
        }

        $response = Invoke-WebRequest @request
        return @{
            StatusCode = [int]$response.StatusCode
            Body = [string]$response.Content
            Headers = $response.Headers
        }
    } catch {
        $webResponse = $_.Exception.Response
        if (-not $webResponse) {
            throw
        }

        $body = ''
        $stream = $webResponse.GetResponseStream()
        if ($stream) {
            $reader = New-Object System.IO.StreamReader($stream)
            try {
                $body = $reader.ReadToEnd()
            } finally {
                $reader.Dispose()
            }
        }

        return @{
            StatusCode = [int]$webResponse.StatusCode
            Body = $body
            Headers = $webResponse.Headers
        }
    }
}

function Invoke-DrillMultipartUpload {
    param(
        [string]$Url,
        [string]$FilePath,
        [string]$Token,
        [hashtable]$FormFields = @{}
    )

    Add-Type -AssemblyName System.Net.Http

    $client = $null
    $form = $null
    $stream = $null

    try {
        $client = [System.Net.Http.HttpClient]::new()
        $client.Timeout = [TimeSpan]::FromSeconds(15)
        if ($Token) {
            $client.DefaultRequestHeaders.Authorization = [System.Net.Http.Headers.AuthenticationHeaderValue]::new('Bearer', $Token)
        }

        $form = [System.Net.Http.MultipartFormDataContent]::new()
        foreach ($key in $FormFields.Keys) {
            $form.Add([System.Net.Http.StringContent]::new([string]$FormFields[$key]), [string]$key)
        }
        $stream = [System.IO.File]::OpenRead($FilePath)
        $fileContent = [System.Net.Http.StreamContent]::new($stream)
        $fileContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse('image/png')
        $form.Add($fileContent, 'images', 'svp-upload-drill.png')

        $response = $client.PostAsync($Url, $form).GetAwaiter().GetResult()
        $body = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
        return @{
            StatusCode = [int]$response.StatusCode
            Body = [string]$body
            Headers = $response.Headers
        }
    } finally {
        if ($form) {
            $form.Dispose()
        } elseif ($stream) {
            $stream.Dispose()
        }
        if ($client) {
            $client.Dispose()
        }
    }
}

function Assert-TextResponse {
    param(
        [hashtable]$Response,
        [int]$ExpectedStatus,
        [string]$Needle,
        [string]$Message
    )

    if ($Response.StatusCode -ne $ExpectedStatus) {
        throw "$Message returned HTTP $($Response.StatusCode), expected $ExpectedStatus. Body: $($Response.Body)"
    }
    if (-not $Response.Body.Contains($Needle)) {
        throw "$Message did not contain expected text: $Needle"
    }
    Write-Check $Message
}

function Assert-JsonResponse {
    param(
        [hashtable]$Response,
        [int]$ExpectedStatus,
        [string]$Message
    )

    if ($Response.StatusCode -ne $ExpectedStatus) {
        throw "$Message returned HTTP $($Response.StatusCode), expected $ExpectedStatus. Body: $($Response.Body)"
    }

    try {
        $json = $Response.Body | ConvertFrom-Json
    } catch {
        throw "$Message did not return valid JSON. Body: $($Response.Body)"
    }

    Write-Check $Message
    return $json
}

if (-not $ReleasePath) {
    $ReleasePath = Resolve-DefaultReleasePath
}

$release = (Resolve-Path -LiteralPath $ReleasePath).Path
$uploadZip = if ($ZipPath) {
    (Resolve-Path -LiteralPath $ZipPath).Path
} else {
    Join-Path $release 'sodovanphuc-full-public_html.zip'
}
$configGenerator = Resolve-ToolPath 'new-hosting-config.ps1' $release
$configVerifier = Resolve-ToolPath 'verify-hosting-config.ps1' $release
$phpExe = Resolve-Php

Assert-Path $uploadZip 'upload zip exists'

$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("svp-upload-drill-" + [guid]::NewGuid().ToString('N'))
$tempPublic = Join-Path $tempRoot 'public_html'
$runtimeConfig = Join-Path $tempPublic 'backend\config\config.php'
$routerPath = Join-Path $tempPublic '.svp-upload-drill-router.php'
$stdoutPath = Join-Path $tempRoot 'php-stdout.log'
$stderrPath = Join-Path $tempRoot 'php-stderr.log'
$process = $null
$uploadDrillAdminPassword = $AdminPasswordForUploadDrill
if (-not $uploadDrillAdminPassword) {
    $uploadDrillAdminPassword = [Environment]::GetEnvironmentVariable('SVP_UPLOAD_DRILL_ADMIN_PASSWORD')
}
if (-not $uploadDrillAdminPassword -and -not $ExpectConfigInZip) {
    $uploadDrillAdminPassword = 'UploadDrill!234'
}

try {
    New-Item -ItemType Directory -Force -Path $tempRoot | Out-Null
    Expand-Archive -LiteralPath $uploadZip -DestinationPath $tempRoot -Force
    Assert-Path $tempPublic 'exact upload zip extracted to public_html'

    foreach ($required in @(
        'index.html',
        '.htaccess',
        'robots.txt',
        'sitemap.xml',
        'backend\.htaccess',
        'backend\api\index.php',
        'backend\config\config.example.php',
        'backend\sql\schema.sql',
        'backend\sql\002_add_property_video_url.sql',
        'backend\sql\003_add_property_social_links.sql',
        'backend\sql\004_users_banners_blog.sql',
        'backend\sql\005_chat_messages.sql',
        'backend\sql\006_property_likes.sql',
        'backend\sql\007_add_coordinates.sql',
        'backend\sql\007_add_expiry_notified.sql',
        'backend\sql\008_bank_transfers.sql',
        'backend\sql\009_property_image_unique.sql',
        'backend\sql\seed.sql',
        'backend\sql\sodovanphuc_import_all.sql',
        'backend\sql\sodovanphuc_schema.sql',
        'backend\sql\sodovanphuc_seed.sql',
        'backend\sql\sodovanphuc_verify.sql',
        'backend\sql\database_verify.sql',
        'backend\uploads\.htaccess'
    )) {
        Assert-Path (Join-Path $tempPublic $required) "extracted upload contains $required"
    }

    if ($ExpectConfigInZip) {
        Assert-Path $runtimeConfig 'extracted configured upload contains backend\config\config.php'
        & $configVerifier -ConfigPath $runtimeConfig
        Write-Check 'extracted configured config.php verified'
    } else {
        Assert-NoPath $runtimeConfig 'extracted base upload excludes backend\config\config.php'
    }

    foreach ($forbidden in @(
        '.env',
        '.env.local',
        '.git',
        '.github',
        'node_modules',
        'src',
        'package.json',
        'package-lock.json',
        'pnpm-lock.yaml',
        'yarn.lock',
        'tsconfig.json',
        'vite.config.ts',
        'backend\.env',
        'backend\api\debug_test.php',
        'backend\composer.json',
        'backend\composer.lock',
        'backend\uploads\music',
        'music',
        'tools',
        'POST_UPLOAD_CHECKLIST.md',
        'UPLOAD_THIS_PACKAGE.txt',
        'REAL_UPLOAD_READY.md'
    )) {
        Assert-NoPath (Join-Path $tempPublic $forbidden) "extracted upload excludes $forbidden"
    }

    $badDevArtifacts = @(Get-ChildItem -LiteralPath $tempPublic -Recurse -Force -File -ErrorAction SilentlyContinue | Where-Object {
        $_.Name.EndsWith('.map', [System.StringComparison]::OrdinalIgnoreCase) -or
        $_.Name.EndsWith('.ts', [System.StringComparison]::OrdinalIgnoreCase) -or
        $_.Name.EndsWith('.tsx', [System.StringComparison]::OrdinalIgnoreCase)
    })
    if ($badDevArtifacts.Count -gt 0) {
        $badDevArtifacts | Select-Object -First 20 -ExpandProperty FullName | ForEach-Object { Write-Host $_ }
        throw 'Extracted upload contains development/source artifacts.'
    }
    Write-Check 'extracted upload excludes source maps and TypeScript source artifacts'

    if (-not $ExpectConfigInZip) {
        & $configGenerator `
            -DbHost '127.0.0.1' `
            -DbName 'svp_upload_drill' `
            -DbUser 'svp_upload_drill' `
            -DbPass 'svp_upload_drill' `
            -AdminPassword 'UploadDrill!234' `
            -OutputPath $runtimeConfig `
            -Force
        Assert-Path $runtimeConfig 'temporary extracted backend/config/config.php generated'
        & $configVerifier -ConfigPath $runtimeConfig
        Write-Check 'temporary extracted config.php verified'
    }

    if (-not $phpExe) {
        $message = 'PHP CLI was not found; upload drill skipped HTTP runtime requests after extraction/config checks.'
        if ($RequirePhp) {
            throw $message
        }
        Write-Skip "$message Install PHP or pass -PhpPath to run the HTTP drill locally."
        return
    }

    @'
<?php
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
if (strpos($path, '/api/') === 0) {
    require __DIR__ . '/backend/api/index.php';
    return true;
}

$file = realpath(__DIR__ . $path);
$root = realpath(__DIR__);
if ($path !== '/' && $file !== false && strpos($file, $root) === 0 && is_file($file)) {
    return false;
}

if (strpos($path, '/backend/uploads/') === 0) {
    http_response_code(404);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => 'Uploaded file not found']);
    return true;
}

$index = __DIR__ . '/index.html';
if (is_file($index)) {
    header('Content-Type: text/html; charset=utf-8');
    readfile($index);
    return true;
}

http_response_code(404);
header('Content-Type: application/json; charset=utf-8');
echo json_encode(['ok' => false, 'error' => 'Upload drill route not found']);
return true;
'@ | Set-Content -LiteralPath $routerPath -Encoding ASCII

    $port = New-FreePort
    $listen = "127.0.0.1:$port"
    $arguments = '-S {0} -t "{1}" "{2}"' -f $listen, $tempPublic, $routerPath
    $process = Start-Process -FilePath $phpExe -ArgumentList $arguments -PassThru -WindowStyle Hidden -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath

    $baseUrl = "http://127.0.0.1:$port"
    $homeResponse = $null
    for ($i = 0; $i -lt 20; $i++) {
        Start-Sleep -Milliseconds 250
        if ($process.HasExited) {
            $stderr = if (Test-Path -LiteralPath $stderrPath) { Get-Content -LiteralPath $stderrPath -Raw } else { '' }
            throw "PHP upload drill server exited early. $stderr"
        }

        try {
            $homeResponse = Invoke-DrillRequest -Method 'GET' -Url "$baseUrl/"
            if ($homeResponse.StatusCode -eq 200) {
                break
            }
        } catch {
            if ($i -eq 19) {
                throw
            }
        }
    }

    if (-not $homeResponse) {
        throw 'Upload drill home request did not complete.'
    }

    Assert-TextResponse -Response $homeResponse -ExpectedStatus 200 -Needle 'So Do Van Phuc' -Message 'upload drill serves frontend index'
    Assert-TextResponse -Response $homeResponse -ExpectedStatus 200 -Needle 'https://sodovanphuc.vn/' -Message 'upload drill frontend index contains production canonical domain'
    Assert-TextResponse -Response $homeResponse -ExpectedStatus 200 -Needle 'https://sodovanphuc.vn/og-image.jpg' -Message 'upload drill frontend index contains production OG image URL'

    $dashboard = Invoke-DrillRequest -Method 'GET' -Url "$baseUrl/dashboard"
    Assert-TextResponse -Response $dashboard -ExpectedStatus 200 -Needle '<div id="root">' -Message 'upload drill serves SPA fallback routes'

    $assetMatch = [regex]::Match($homeResponse.Body, 'src="([^"]+\.js)"')
    if (-not $assetMatch.Success) {
        throw 'Upload drill could not find bundled JavaScript asset in index.html.'
    }
    $asset = Invoke-DrillRequest -Method 'GET' -Url ($baseUrl + $assetMatch.Groups[1].Value)
    if ($asset.StatusCode -ne 200 -or [string]::IsNullOrWhiteSpace($asset.Body)) {
        throw "Upload drill bundled JavaScript asset failed. HTTP $($asset.StatusCode)"
    }
    Write-Check 'upload drill serves bundled JavaScript asset'

    $robots = Invoke-DrillRequest -Method 'GET' -Url "$baseUrl/robots.txt"
    Assert-TextResponse -Response $robots -ExpectedStatus 200 -Needle 'sodovanphuc.vn' -Message 'upload drill serves robots.txt'

    $sitemap = Invoke-DrillRequest -Method 'GET' -Url "$baseUrl/sitemap.xml"
    Assert-TextResponse -Response $sitemap -ExpectedStatus 200 -Needle 'https://sodovanphuc.vn' -Message 'upload drill serves sitemap.xml'

    $health = Invoke-DrillRequest -Method 'GET' -Url "$baseUrl/api/svp/health"
    $healthJson = Assert-JsonResponse -Response $health -ExpectedStatus 200 -Message 'upload drill /api/svp/health returns JSON'
    if (-not $healthJson.ok) {
        throw 'Upload drill health response ok flag is false.'
    }
    if ($healthJson.data.service -ne 'so-do-van-phuc-api') {
        throw "Unexpected upload drill health service: $($healthJson.data.service)"
    }
    if (@('running', 'degraded', 'database_connected', 'seed_incomplete', 'ready') -notcontains $healthJson.data.status) {
        throw "Unexpected upload drill health status: $($healthJson.data.status)"
    }
    Write-Check 'upload drill health payload has expected service/status contract'

    if (-not ($healthJson.data.PSObject.Properties.Name -contains 'runtime')) {
        throw 'Upload drill health payload is missing runtime diagnostics.'
    }
    $missingExtensions = @($healthJson.data.runtime.missingRequiredExtensions)
    if ($missingExtensions.Count -gt 0) {
        throw "Upload drill PHP runtime is missing required extensions: $($missingExtensions -join ', ')"
    }
    foreach ($extension in @('pdo', 'pdo_mysql', 'json', 'fileinfo', 'openssl')) {
        if (-not ($healthJson.data.runtime.requiredExtensions.PSObject.Properties.Name -contains $extension) -or -not $healthJson.data.runtime.requiredExtensions.$extension) {
            throw "Upload drill health says extension '$extension' is not loaded."
        }
    }
    if (-not ($healthJson.data.runtime.PSObject.Properties.Name -contains 'fileUploadsEnabled') -or -not $healthJson.data.runtime.fileUploadsEnabled) {
        throw 'Upload drill health says PHP file_uploads is disabled.'
    }
    Write-Check 'upload drill required PHP extensions are loaded'

    if (-not ($healthJson.data.PSObject.Properties.Name -contains 'storage')) {
        throw 'Upload drill health payload is missing storage diagnostics.'
    }
    if (-not $healthJson.data.storage.uploadsDirExists) {
        throw 'Upload drill health says backend/uploads directory is missing.'
    }
    if (-not $healthJson.data.storage.uploadsHtaccessPresent) {
        throw 'Upload drill health says backend/uploads/.htaccess is missing.'
    }
    if (-not $healthJson.data.storage.uploadsWritable) {
        throw 'Upload drill health says backend/uploads is not writable.'
    }
    if (-not $healthJson.data.storage.tempWritable) {
        throw 'Upload drill health says PHP temp directory is not writable.'
    }
    Write-Check 'upload drill upload storage and temp directory are writable'

    $databaseConnected = $false
    if (($healthJson.data.PSObject.Properties.Name -contains 'database') -and
        ($healthJson.data.database.PSObject.Properties.Name -contains 'connected')) {
        $databaseConnected = [bool]$healthJson.data.database.connected
    }

    if ($databaseConnected) {
        $svpMarker = 'UPLOAD-DRILL-' + (Get-Date -Format 'yyyyMMddHHmmss')
        $svpCreateBody = @{
            title = "$svpMarker - nha upload route"
            description = 'Upload drill tao ban ghi tam de test SVP media-upload route.'
            ownerName = 'Upload Drill'
            ownerPhone = '0900000000'
            bookSerial = $svpMarker
            price = 5000000000
            priceUnit = 'VND'
            areaM2 = 80
            district = 'Thu Duc'
            ward = 'Van Phuc'
            address = "$svpMarker address"
            hiddenAddress = 'Dia chi an upload drill'
            companyUnitId = 'cu_tuan123_mien_nam'
            statusId = 'st_new'
            signingScore = 1
            visibilityIds = @('vl_lop4')
            tagIds = @('tag_o_to', 'tag_mo_spa')
            extra = @{ uploadDrill = $true; marker = $svpMarker }
        } | ConvertTo-Json -Depth 8
        $svpCreate = Invoke-DrillRequest -Method 'POST' -Url "$baseUrl/api/svp/properties" -Body $svpCreateBody -ContentType 'application/json; charset=utf-8'
        $svpCreateJson = Assert-JsonResponse -Response $svpCreate -ExpectedStatus 201 -Message 'upload drill creates SVP property before media-upload route test'
        $svpPropertyId = [string]$svpCreateJson.data.item.id
        if (-not $svpPropertyId) {
            throw 'Upload drill SVP property create did not return an id.'
        }

        $svpPngPath = Join-Path $tempRoot 'svp-property-media-upload-drill.png'
        [System.IO.File]::WriteAllBytes(
            $svpPngPath,
            [Convert]::FromBase64String('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=')
        )
        $svpMediaUpload = Invoke-DrillMultipartUpload `
            -Url "$baseUrl/api/svp/properties/$svpPropertyId/media-upload" `
            -FilePath $svpPngPath `
            -FormFields @{ caption = "$svpMarker anh duyet"; category = 'approval_document' }
        $svpMediaUploadJson = Assert-JsonResponse -Response $svpMediaUpload -ExpectedStatus 201 -Message 'upload drill SVP media-upload route accepts multipart PNG'
        $svpUploadedItems = @($svpMediaUploadJson.data.items)
        if ($svpUploadedItems.Count -ne 1) {
            throw "Upload drill SVP media-upload returned $($svpUploadedItems.Count) items, expected 1."
        }
        $svpUploadedMediaId = [string]$svpUploadedItems[0].id
        $svpUploadedUrl = [string]$svpUploadedItems[0].url
        if ($svpUploadedUrl -notmatch '^https://sodovanphuc\.vn/backend/uploads/\d{4}/\d{2}/[^/]+\.png$') {
            throw "Upload drill SVP media-upload returned unexpected URL: $svpUploadedUrl"
        }

        $svpMediaList = Invoke-DrillRequest -Method 'GET' -Url "$baseUrl/api/svp/properties/$svpPropertyId/media"
        $svpMediaListJson = Assert-JsonResponse -Response $svpMediaList -ExpectedStatus 200 -Message 'upload drill reads SVP property media list after upload'
        $svpMediaIds = @($svpMediaListJson.data.items | ForEach-Object { [string]$_.id })
        if ($svpMediaIds -notcontains $svpUploadedMediaId) {
            throw 'Upload drill media list did not contain the uploaded SVP media id.'
        }
        Write-Check 'upload drill verifies SVP property media-upload route end to end'

        $svpDelete = Invoke-DrillRequest -Method 'DELETE' -Url "$baseUrl/api/svp/properties/$svpPropertyId"
        $svpDeleteJson = Assert-JsonResponse -Response $svpDelete -ExpectedStatus 200 -Message 'upload drill soft-deletes temporary SVP upload property'
        if (-not $svpDeleteJson.data.deleted) {
            throw 'Upload drill temporary SVP property delete did not return deleted=true.'
        }
    } else {
        Write-Skip 'upload drill SVP media-upload route skipped because temporary database is not connected; live hosting write workflow covers it after DB import.'
    }

    if ($uploadDrillAdminPassword) {
        $loginBody = @{
            username = $AdminUsernameForUploadDrill
            password = $uploadDrillAdminPassword
        } | ConvertTo-Json -Depth 5
        $login = Invoke-DrillRequest `
            -Method 'POST' `
            -Url "$baseUrl/api/auth/login" `
            -Body $loginBody `
            -ContentType 'application/json; charset=utf-8'
        $loginJson = Assert-JsonResponse -Response $login -ExpectedStatus 200 -Message 'upload drill admin login returns JWT'
        if (-not $loginJson.data.token -or ([string]$loginJson.data.token).Split('.').Count -ne 3) {
            throw 'Upload drill admin login did not return a valid JWT.'
        }

        $pngPath = Join-Path $tempRoot 'svp-upload-drill.png'
        [System.IO.File]::WriteAllBytes(
            $pngPath,
            [Convert]::FromBase64String('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=')
        )

        $upload = Invoke-DrillMultipartUpload -Url "$baseUrl/api/uploads" -FilePath $pngPath -Token ([string]$loginJson.data.token)
        $uploadJson = Assert-JsonResponse -Response $upload -ExpectedStatus 201 -Message 'upload drill multipart image upload returns JSON'
        $uploadedUrls = @($uploadJson.data.urls)
        if ($uploadJson.data.count -ne 1 -or $uploadedUrls.Count -ne 1) {
            throw "Upload drill multipart image upload returned count=$($uploadJson.data.count), urls=$($uploadedUrls.Count)."
        }

        $uploadedUrl = [string]$uploadedUrls[0]
        if ($uploadedUrl -notmatch '^https://sodovanphuc\.vn/backend/uploads/\d{4}/\d{2}/[^/]+\.png$') {
            throw "Upload drill returned an unexpected upload URL: $uploadedUrl"
        }
        $uploadedUri = [Uri]$uploadedUrl
        $uploadedResponse = Invoke-DrillRequest -Method 'GET' -Url ($baseUrl + $uploadedUri.AbsolutePath)
        if ($uploadedResponse.StatusCode -ne 200) {
            throw "Upload drill could not read uploaded image URL. HTTP $($uploadedResponse.StatusCode)"
        }
        $uploadedContentType = [string]$uploadedResponse.Headers['Content-Type']
        if ($uploadedContentType -notmatch 'image/png') {
            throw "Upload drill uploaded image returned unexpected Content-Type: $uploadedContentType"
        }
        Write-Check 'upload drill uploads a real PNG through multipart and serves it from backend/uploads'

        $deleteUrl = "$baseUrl/api/uploads?url=$([uri]::EscapeDataString($uploadedUrl))"
        $deleteResponse = Invoke-DrillRequest `
            -Method 'DELETE' `
            -Url $deleteUrl `
            -Headers @{ Authorization = "Bearer $($loginJson.data.token)"; Accept = 'application/json' }
        $deleteJson = Assert-JsonResponse -Response $deleteResponse -ExpectedStatus 200 -Message 'upload drill deletes uploaded PNG through admin endpoint'
        if (-not $deleteJson.data.deleted) {
            throw 'Upload drill delete endpoint did not return deleted=true.'
        }
        $deletedResponse = Invoke-DrillRequest -Method 'GET' -Url ($baseUrl + $uploadedUri.AbsolutePath)
        if ($deletedResponse.StatusCode -eq 200) {
            throw 'Upload drill uploaded PNG was still readable after delete.'
        }
        Write-Check 'upload drill verifies uploaded PNG cleanup'
    } else {
        Write-Skip 'upload drill multipart upload skipped; pass -AdminPasswordForUploadDrill or set SVP_UPLOAD_DRILL_ADMIN_PASSWORD to test configured admin uploads.'
    }

    $preflight = Invoke-DrillRequest -Method 'OPTIONS' -Url "$baseUrl/api/svp/health"
    if ($preflight.StatusCode -ne 204) {
        throw "Upload drill OPTIONS returned HTTP $($preflight.StatusCode), expected 204."
    }
    Write-Check 'upload drill OPTIONS preflight returns 204'

    $missing = Invoke-DrillRequest -Method 'GET' -Url "$baseUrl/api/svp/not-a-real-route"
    $missingJson = Assert-JsonResponse -Response $missing -ExpectedStatus 404 -Message 'upload drill missing API route returns JSON 404'
    if ($missingJson.ok) {
        throw 'Upload drill missing route unexpectedly returned ok=true.'
    }
} finally {
    if ($process -and -not $process.HasExited) {
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
    if (-not $KeepWorkDir) {
        Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
    } else {
        Write-Host "Kept upload drill work directory: $tempRoot"
    }
}

Write-Host ''
Write-Host 'Exact release upload drill passed.'
