param(
    [string]$PhpPath,
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

function Resolve-BackendSource {
    $fullBackend = Join-Path $root 'full\public_html\backend'
    if (Test-Path -LiteralPath (Join-Path $fullBackend 'api\index.php')) {
        return $fullBackend
    }

    $backend = Join-Path $root 'backend'
    if (Test-Path -LiteralPath (Join-Path $backend 'api\index.php')) {
        return $backend
    }

    throw "Could not locate backend/api/index.php under $root"
}

function Resolve-ConfigGenerator {
    $sameFolder = Join-Path $scriptDir 'new-hosting-config.ps1'
    if (Test-Path -LiteralPath $sameFolder) {
        return $sameFolder
    }

    $sourceDeploy = Join-Path $root 'deploy\new-hosting-config.ps1'
    if (Test-Path -LiteralPath $sourceDeploy) {
        return $sourceDeploy
    }

    throw 'Could not locate new-hosting-config.ps1.'
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

function Invoke-RuntimeRequest {
    param(
        [string]$Method,
        [string]$Url,
        [object]$Body = $null
    )

    try {
        $request = @{
            Uri = $Url
            Method = $Method
            UseBasicParsing = $true
            TimeoutSec = 8
        }
        if ($null -ne $Body) {
            $request.Body = $Body | ConvertTo-Json -Depth 20
            $request.ContentType = 'application/json; charset=utf-8'
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

$phpExe = Resolve-Php
if (-not $phpExe) {
    $message = 'PHP CLI was not found; PHP runtime smoke was not executed.'
    if ($RequirePhp) {
        throw $message
    }
    Write-Skip "$message Install PHP or pass -PhpPath to run this gate locally."
    exit 0
}

$backendSource = Resolve-BackendSource
$configGenerator = Resolve-ConfigGenerator
$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("svp-php-runtime-" + [guid]::NewGuid().ToString('N'))
$tempPublic = Join-Path $tempRoot 'public_html'
$tempBackend = Join-Path $tempPublic 'backend'
$routerPath = Join-Path $tempPublic 'runtime-router.php'
$stdoutPath = Join-Path $tempRoot 'php-stdout.log'
$stderrPath = Join-Path $tempRoot 'php-stderr.log'
$process = $null

try {
    New-Item -ItemType Directory -Force -Path $tempPublic | Out-Null
    Copy-Item -LiteralPath $backendSource -Destination $tempPublic -Recurse -Force
    $copiedBackend = Join-Path $tempPublic (Split-Path -Leaf $backendSource)
    if ($copiedBackend -ne $tempBackend) {
        if (Test-Path -LiteralPath $tempBackend) {
            Remove-Item -LiteralPath $tempBackend -Recurse -Force
        }
        Move-Item -LiteralPath $copiedBackend -Destination $tempBackend
    }
    Write-Check 'temporary backend copied for PHP runtime smoke'

    $runtimeConfig = Join-Path $tempBackend 'config\config.php'
    Remove-Item -LiteralPath $runtimeConfig -Force -ErrorAction SilentlyContinue
    & $configGenerator `
        -DbHost '127.0.0.1' `
        -DbName 'svp_runtime_dryrun' `
        -DbUser 'svp_runtime_dryrun' `
        -DbPass 'svp_runtime_dryrun' `
        -AdminPassword 'RuntimeDryRun!234' `
        -OutputPath $runtimeConfig `
        -Force
    Write-Check 'temporary runtime config generated'

    @'
<?php
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
if (strpos($path, '/api/') === 0) {
    require __DIR__ . '/backend/api/index.php';
    return true;
}

$file = __DIR__ . $path;
if ($path !== '/' && is_file($file)) {
    return false;
}

http_response_code(404);
header('Content-Type: application/json; charset=utf-8');
echo json_encode(['ok' => false, 'error' => 'Runtime smoke route not found']);
return true;
'@ | Set-Content -LiteralPath $routerPath -Encoding ASCII

    $port = New-FreePort
    $listen = "127.0.0.1:$port"
    $arguments = '-S {0} -t "{1}" "{2}"' -f $listen, $tempPublic, $routerPath
    $process = Start-Process -FilePath $phpExe -ArgumentList $arguments -PassThru -WindowStyle Hidden -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath

    $baseUrl = "http://127.0.0.1:$port"
    $health = $null
    for ($i = 0; $i -lt 20; $i++) {
        Start-Sleep -Milliseconds 250
        if ($process.HasExited) {
            $stderr = if (Test-Path -LiteralPath $stderrPath) { Get-Content -LiteralPath $stderrPath -Raw } else { '' }
            throw "PHP runtime server exited early. $stderr"
        }

        try {
            $health = Invoke-RuntimeRequest -Method 'GET' -Url "$baseUrl/api/svp/health"
            if ($health.StatusCode -eq 200) {
                break
            }
        } catch {
            if ($i -eq 19) {
                throw
            }
        }
    }

    if (-not $health) {
        throw 'PHP runtime health request did not complete.'
    }

    $healthJson = Assert-JsonResponse -Response $health -ExpectedStatus 200 -Message 'PHP runtime /api/svp/health returns JSON'
    if (-not $healthJson.ok) {
        throw 'Health response ok flag is false.'
    }
    if ($healthJson.data.service -ne 'so-do-van-phuc-api') {
        throw "Unexpected health service: $($healthJson.data.service)"
    }
    if (@('running', 'degraded', 'database_connected', 'seed_incomplete', 'ready') -notcontains $healthJson.data.status) {
        throw "Unexpected health status: $($healthJson.data.status)"
    }
    Write-Check 'PHP runtime health payload has expected service/status contract'

    if (-not ($healthJson.data.PSObject.Properties.Name -contains 'runtime')) {
        throw 'PHP runtime health payload is missing runtime diagnostics.'
    }
    $missingExtensions = @($healthJson.data.runtime.missingRequiredExtensions)
    if ($missingExtensions.Count -gt 0) {
        throw "PHP runtime is missing required extensions: $($missingExtensions -join ', ')"
    }
    foreach ($extension in @('pdo', 'pdo_mysql', 'json', 'fileinfo', 'openssl')) {
        if (-not ($healthJson.data.runtime.requiredExtensions.PSObject.Properties.Name -contains $extension) -or -not $healthJson.data.runtime.requiredExtensions.$extension) {
            throw "PHP runtime health says extension '$extension' is not loaded."
        }
    }
    if (-not ($healthJson.data.runtime.PSObject.Properties.Name -contains 'fileUploadsEnabled') -or -not $healthJson.data.runtime.fileUploadsEnabled) {
        throw 'PHP runtime health says PHP file_uploads is disabled.'
    }
    Write-Check 'PHP runtime required extensions are loaded'

    if (-not ($healthJson.data.PSObject.Properties.Name -contains 'storage')) {
        throw 'PHP runtime health payload is missing storage diagnostics.'
    }
    if (-not $healthJson.data.storage.uploadsDirExists) {
        throw 'PHP runtime health says backend/uploads directory is missing.'
    }
    if (-not $healthJson.data.storage.uploadsHtaccessPresent) {
        throw 'PHP runtime health says backend/uploads/.htaccess is missing.'
    }
    if (-not $healthJson.data.storage.uploadsWritable) {
        throw 'PHP runtime health says backend/uploads is not writable.'
    }
    if (-not $healthJson.data.storage.tempWritable) {
        throw 'PHP runtime health says PHP temp directory is not writable.'
    }
    Write-Check 'PHP runtime upload storage and temp directory are writable'

    $preflight = Invoke-RuntimeRequest -Method 'OPTIONS' -Url "$baseUrl/api/svp/health"
    if ($preflight.StatusCode -ne 204) {
        throw "PHP runtime OPTIONS returned HTTP $($preflight.StatusCode), expected 204."
    }
    Write-Check 'PHP runtime OPTIONS preflight returns 204'

    $aiDescription = Invoke-RuntimeRequest -Method 'POST' -Url "$baseUrl/api/ai/description" -Body @{
        propertyType = 'townhouse'
        listingType = 'sale'
        price = 3000000000
        bedrooms = 3
        bathrooms = 2
        sqft = 90
        address = 'Runtime smoke'
        city = 'Ha Noi'
        state = 'VN'
    }
    if ($aiDescription.StatusCode -eq 429) {
        $aiDescriptionJson = Assert-JsonResponse -Response $aiDescription -ExpectedStatus 429 -Message 'PHP runtime AI description proxy returns JSON rate-limit fallback'
        if ($aiDescriptionJson.ok -or -not ([string]$aiDescriptionJson.error).ToLowerInvariant().Contains('too many')) {
            throw 'AI description rate-limit fallback did not return the expected error.'
        }
    } else {
        $aiDescriptionJson = Assert-JsonResponse -Response $aiDescription -ExpectedStatus 503 -Message 'PHP runtime AI description proxy returns JSON fallback when AI key is blank'
        if ($aiDescriptionJson.ok -or -not ([string]$aiDescriptionJson.error).ToLowerInvariant().Contains('not configured')) {
            throw 'AI description blank-key fallback did not return the expected not configured error.'
        }
    }

    $aiChat = Invoke-RuntimeRequest -Method 'POST' -Url "$baseUrl/api/ai/chat" -Body @{
        lang = 'vi'
        messages = @(
            @{
                sender = 'me'
                text = 'Kiem tra runtime AI chat proxy'
                timestamp = (Get-Date).ToString('o')
            }
        )
    }
    if ($aiChat.StatusCode -eq 429) {
        $aiChatJson = Assert-JsonResponse -Response $aiChat -ExpectedStatus 429 -Message 'PHP runtime AI chat proxy returns JSON rate-limit fallback'
        if ($aiChatJson.ok -or -not ([string]$aiChatJson.error).ToLowerInvariant().Contains('too many')) {
            throw 'AI chat rate-limit fallback did not return the expected error.'
        }
    } else {
        $aiChatJson = Assert-JsonResponse -Response $aiChat -ExpectedStatus 503 -Message 'PHP runtime AI chat proxy returns JSON fallback when AI key is blank'
        if ($aiChatJson.ok -or -not ([string]$aiChatJson.error).ToLowerInvariant().Contains('not configured')) {
            throw 'AI chat blank-key fallback did not return the expected not configured error.'
        }
    }

    $missing = Invoke-RuntimeRequest -Method 'GET' -Url "$baseUrl/api/svp/not-a-real-route"
    $missingJson = Assert-JsonResponse -Response $missing -ExpectedStatus 404 -Message 'PHP runtime missing route returns JSON 404'
    if ($missingJson.ok) {
        throw 'Missing route unexpectedly returned ok=true.'
    }
} finally {
    if ($process -and -not $process.HasExited) {
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
    if (-not $KeepWorkDir) {
        Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
    } else {
        Write-Host "Kept runtime work directory: $tempRoot"
    }
}

Write-Host ''
Write-Host 'PHP runtime smoke passed.'
