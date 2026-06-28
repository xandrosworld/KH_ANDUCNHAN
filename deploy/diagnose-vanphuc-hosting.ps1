param(
    [string]$Domain = 'sodovanphuc.vn',
    [string]$ExpectedIp = '',
    [switch]$RequireReady
)

$ErrorActionPreference = 'Stop'

try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls13
} catch {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
}

$Domain = $Domain.Trim().TrimEnd('/')
$BaseUrl = "https://$Domain"
$HttpUrl = "http://$Domain"
$results = New-Object System.Collections.Generic.List[object]
$remediationHints = @{
    'DNS A record' = "Point the root A record for $Domain to the Mat Bao hosting IP, then wait for DNS propagation and run this diagnostic again. If you already know the hosting IP, pass -ExpectedIp to lock the check."
    'www DNS target' = "Set www.$Domain as a CNAME to $Domain or as an A record to the same Mat Bao hosting IP. Remove any old third-party CNAME/A record before acceptance."
    'TCP 80 reachable' = "Confirm the hosting package is active, the domain is attached to the right document root, and HTTP/port 80 is not blocked by hosting or firewall settings."
    'TCP 443 reachable' = "Enable HTTPS/SSL on the hosting package and confirm port 443 is open for $Domain."
    'HTTPS certificate and root response' = "Enable or reissue SSL for both $Domain and www.$Domain in Mat Bao, then retry after propagation. The root URL must return HTTP 200 over strict HTTPS."
    'Core security headers' = "Make sure public_html/.htaccess is uploaded and honored by Apache/LiteSpeed. If headers are still missing, enable AllowOverride/Headers support or add the same headers in the hosting control panel."
    'HTTP canonical redirect' = "Make sure public_html/.htaccess is uploaded, RewriteEngine is honored, and HTTP requests redirect to $BaseUrl. Clear any hosting cache after changing rewrite rules."
    'www canonical redirect' = "Fix www DNS first, then make sure public_html/.htaccess redirects www.$Domain to $BaseUrl."
    'SVP app shell' = "Upload/extract the latest sodovanphuc-full-public_html.zip into the domain document root so public_html/index.html and assets serve the built app."
    'robots and sitemap' = "Verify robots.txt and sitemap.xml from the release zip are present in public_html and use $BaseUrl."
    'SVP health JSON' = "Upload backend files, generate backend/config/config.php, import backend/sql/sodovanphuc_import_all.sql, verify database credentials/PHP extensions, and make backend/uploads writable."
    'AI proxy JSON' = "Make sure backend/api/index.php is uploaded, backend/config/config.php exists, and AI_GEMINI_KEY is either blank for safe fallback or set to a valid Gemini key. The AI proxy must never return HTML/PHP errors."
    'Protected backend internals' = "Make sure backend/.htaccess and backend/uploads/.htaccess are uploaded and .htaccess rules are honored so config, SQL, lib, and upload internals cannot be read publicly."
}

function Add-Result {
    param(
        [string]$Check,
        [string]$Status,
        [string]$Details
    )
    $results.Add([pscustomobject]@{
        Check = $Check
        Status = $Status
        Details = $Details
    }) | Out-Null
}

function Get-RemediationHint {
    param([string]$Check)

    if ($remediationHints.ContainsKey($Check)) {
        return $remediationHints[$Check]
    }

    return ''
}

function Write-RemediationHints {
    $problemResults = @($results | Where-Object { $_.Status -in @('FAIL', 'WARN') })
    if ($problemResults.Count -eq 0) {
        return
    }

    Write-Host ''
    Write-Host 'Remediation hints:'
    foreach ($result in $problemResults) {
        $hint = Get-RemediationHint $result.Check
        if (-not $hint) {
            continue
        }

        Write-Host "- $($result.Check): $hint"
        Write-Host "  Observed: $($result.Details)"
    }
}

function Invoke-Diagnostic {
    param(
        [string]$Check,
        [scriptblock]$Script
    )
    try {
        & $Script
    } catch {
        Add-Result $Check 'FAIL' $_.Exception.Message
    }
}

function Get-RawHttpResponse {
    param(
        [string]$Url,
        [string]$Method = 'GET'
    )

    $request = [Net.HttpWebRequest]::Create($Url)
    $request.Method = $Method
    $request.AllowAutoRedirect = $false
    $request.Timeout = 25000
    $request.UserAgent = 'SoDoVanPhuc-Diagnose/1.0'

    try {
        $response = $request.GetResponse()
    } catch [Net.WebException] {
        if ($_.Exception.Response) {
            $response = $_.Exception.Response
        } else {
            throw
        }
    }

    try {
        return [pscustomobject]@{
            StatusCode = [int]$response.StatusCode
            Location = $response.Headers['Location']
            ContentType = $response.ContentType
        }
    } finally {
        if ($response) {
            $response.Close()
        }
    }
}

function Invoke-StrictGet {
    param([string]$Url)
    return Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 25 -MaximumRedirection 5
}

function Invoke-JsonPost {
    param(
        [string]$Url,
        [object]$Body
    )

    $jsonBody = $Body | ConvertTo-Json -Depth 20
    try {
        $response = Invoke-WebRequest `
            -Uri $Url `
            -Method 'POST' `
            -Body $jsonBody `
            -ContentType 'application/json; charset=utf-8' `
            -UseBasicParsing `
            -TimeoutSec 35 `
            -MaximumRedirection 5

        return [pscustomobject]@{
            StatusCode = [int]$response.StatusCode
            Content = [string]$response.Content
        }
    } catch [Net.WebException] {
        if (-not $_.Exception.Response) {
            throw
        }

        $response = $_.Exception.Response
        $bodyText = ''
        $stream = $response.GetResponseStream()
        if ($stream) {
            $reader = New-Object System.IO.StreamReader($stream)
            try {
                $bodyText = $reader.ReadToEnd()
            } finally {
                $reader.Dispose()
            }
        }

        return [pscustomobject]@{
            StatusCode = [int]$response.StatusCode
            Content = $bodyText
        }
    }
}

function Test-TcpPort {
    param(
        [string]$HostName,
        [int]$Port
    )

    $client = New-Object Net.Sockets.TcpClient
    try {
        $async = $client.BeginConnect($HostName, $Port, $null, $null)
        if (-not $async.AsyncWaitHandle.WaitOne(5000, $false)) {
            throw "TCP $Port timed out"
        }
        $client.EndConnect($async)
    } finally {
        $client.Close()
    }
}

function Get-DnsARecords {
    param([string]$Name)

    $records = Resolve-DnsName -Name $Name -Type A -ErrorAction Stop
    $ips = @()

    foreach ($record in $records) {
        if ($record.PSObject.Properties.Name -contains 'IPAddress' -and $record.IPAddress) {
            $ips += [string]$record.IPAddress
        } elseif ($record.PSObject.Properties.Name -contains 'IP4Address' -and $record.IP4Address) {
            $ips += [string]$record.IP4Address
        }
    }

    return @($ips | Sort-Object -Unique)
}

function Get-DnsCnameRecords {
    param([string]$Name)

    $records = Resolve-DnsName -Name $Name -Type CNAME -ErrorAction SilentlyContinue
    $names = @()

    foreach ($record in $records) {
        if ($record.PSObject.Properties.Name -contains 'NameHost' -and $record.NameHost) {
            $names += [string]$record.NameHost
        }
    }

    return @($names | Sort-Object -Unique)
}

Invoke-Diagnostic 'DNS A record' {
    $records = Get-DnsARecords $Domain

    if (-not $records -or $records.Count -eq 0) {
        throw "No A record found for $Domain"
    }

    if ($ExpectedIp -and ($records -notcontains $ExpectedIp)) {
        throw "A record is $($records -join ', '), expected $ExpectedIp"
    }

    Add-Result 'DNS A record' 'PASS' "$Domain -> $($records -join ', ')"
}

Invoke-Diagnostic 'www DNS target' {
    $wwwDomain = "www.$Domain"
    $rootRecords = Get-DnsARecords $Domain
    try {
        $wwwRecords = Get-DnsARecords $wwwDomain
    } catch {
        $wwwRecords = @()
    }
    $cnameRecords = Get-DnsCnameRecords $wwwDomain
    $cnameText = if ($cnameRecords.Count -gt 0) { " CNAME=$($cnameRecords -join ', ')." } else { '' }

    if (-not $wwwRecords -or $wwwRecords.Count -eq 0) {
        Add-Result 'www DNS target' 'WARN' "$wwwDomain has no A record yet.$cnameText"
        return
    }

    if ($ExpectedIp -and ($wwwRecords -notcontains $ExpectedIp)) {
        throw "$wwwDomain resolves to $($wwwRecords -join ', '), expected $ExpectedIp.$cnameText"
    }

    $sharedTarget = @($wwwRecords | Where-Object { $rootRecords -contains $_ })
    if ($rootRecords.Count -gt 0 -and $sharedTarget.Count -eq 0) {
        throw "$wwwDomain resolves to $($wwwRecords -join ', '), while $Domain resolves to $($rootRecords -join ', ').$cnameText Point www to the same hosting or remove the old CNAME before handoff."
    }

    Add-Result 'www DNS target' 'PASS' "$wwwDomain -> $($wwwRecords -join ', ').$cnameText"
}

Invoke-Diagnostic 'TCP 80 reachable' {
    Test-TcpPort -HostName $Domain -Port 80
    Add-Result 'TCP 80 reachable' 'PASS' "${Domain}:80 accepts connections"
}

Invoke-Diagnostic 'TCP 443 reachable' {
    Test-TcpPort -HostName $Domain -Port 443
    Add-Result 'TCP 443 reachable' 'PASS' "${Domain}:443 accepts connections"
}

Invoke-Diagnostic 'HTTPS certificate and root response' {
    $response = Invoke-StrictGet "$BaseUrl/"
    if ([int]$response.StatusCode -ne 200) {
        throw "HTTPS root returned HTTP $($response.StatusCode)"
    }
    Add-Result 'HTTPS certificate and root response' 'PASS' "Strict HTTPS returned HTTP $($response.StatusCode)"
}

Invoke-Diagnostic 'Core security headers' {
    $response = Invoke-StrictGet "$BaseUrl/"
    $requiredHeaders = @{
        'X-Content-Type-Options' = 'nosniff'
        'X-Frame-Options' = 'SAMEORIGIN'
        'Referrer-Policy' = 'strict-origin-when-cross-origin'
    }

    foreach ($name in $requiredHeaders.Keys) {
        $actual = [string]$response.Headers[$name]
        if ($actual -ne $requiredHeaders[$name]) {
            throw "Missing or invalid $name. Expected '$($requiredHeaders[$name])', got '$actual'."
        }
    }

    Add-Result 'Core security headers' 'PASS' 'nosniff, frame and referrer headers are present'
}

Invoke-Diagnostic 'HTTP canonical redirect' {
    $response = Get-RawHttpResponse "$HttpUrl/" 'GET'
    if ($response.StatusCode -notin @(301, 302, 308)) {
        throw "HTTP returned $($response.StatusCode), expected redirect to https://$Domain"
    }
    if (-not $response.Location -or -not $response.Location.StartsWith($BaseUrl)) {
        throw "HTTP redirect location is '$($response.Location)', expected $BaseUrl"
    }
    Add-Result 'HTTP canonical redirect' 'PASS' "HTTP redirects to $($response.Location)"
}

Invoke-Diagnostic 'www canonical redirect' {
    $wwwDomain = "www.$Domain"
    try {
        $wwwRecords = Get-DnsARecords $wwwDomain
    } catch {
        $wwwRecords = @()
    }

    if (-not $wwwRecords -or $wwwRecords.Count -eq 0) {
        Add-Result 'www canonical redirect' 'WARN' "$wwwDomain has no A record yet"
        return
    }

    $response = Get-RawHttpResponse "http://$wwwDomain/" 'GET'
    if ($response.StatusCode -notin @(301, 302, 308)) {
        throw "www HTTP returned $($response.StatusCode), expected redirect to $BaseUrl"
    }
    if (-not $response.Location -or -not $response.Location.StartsWith($BaseUrl)) {
        throw "www redirect location is '$($response.Location)', expected $BaseUrl"
    }
    Add-Result 'www canonical redirect' 'PASS' "$wwwDomain redirects to $($response.Location)"
}

Invoke-Diagnostic 'SVP app shell' {
    $response = Invoke-StrictGet "$BaseUrl/dashboard"
    if (-not $response.Content.Contains('So Do Van Phuc')) {
        throw '/dashboard did not render the So Do Van Phuc app shell'
    }
    Add-Result 'SVP app shell' 'PASS' '/dashboard renders the production app shell'
}

Invoke-Diagnostic 'robots and sitemap' {
    $robots = Invoke-StrictGet "$BaseUrl/robots.txt"
    if (-not $robots.Content.Contains("Sitemap: $BaseUrl/sitemap.xml")) {
        throw 'robots.txt does not point to the official sitemap'
    }

    $sitemap = Invoke-StrictGet "$BaseUrl/sitemap.xml"
    if (-not $sitemap.Content.Contains("$BaseUrl/dashboard") -or -not $sitemap.Content.Contains("$BaseUrl/nha")) {
        throw 'sitemap.xml does not contain core SVP routes'
    }

    Add-Result 'robots and sitemap' 'PASS' 'robots.txt and sitemap.xml use the official domain'
}

Invoke-Diagnostic 'SVP health JSON' {
    $response = Invoke-StrictGet "$BaseUrl/api/svp/health"
    try {
        $json = $response.Content | ConvertFrom-Json
    } catch {
        throw '/api/svp/health did not return valid JSON'
    }

    $data = if ($json.PSObject.Properties.Name -contains 'data') { $json.data } else { $json }
    if (($json.PSObject.Properties.Name -contains 'ok') -and -not $json.ok) {
        throw '/api/svp/health returned ok=false'
    }
    if ($data.service -ne 'so-do-van-phuc-api') {
        throw "Unexpected service '$($data.service)'"
    }
    if (-not ($data.PSObject.Properties.Name -contains 'runtime')) {
        throw 'Health payload is missing runtime diagnostics'
    }
    $missingExtensions = @($data.runtime.missingRequiredExtensions)
    if ($missingExtensions.Count -gt 0) {
        throw "Missing required PHP extensions: $($missingExtensions -join ', ')"
    }
    foreach ($extension in @('pdo', 'pdo_mysql', 'json', 'fileinfo', 'openssl')) {
        if (-not ($data.runtime.requiredExtensions.PSObject.Properties.Name -contains $extension) -or -not $data.runtime.requiredExtensions.$extension) {
            throw "PHP extension '$extension' is not loaded"
        }
    }
    if (-not ($data.runtime.PSObject.Properties.Name -contains 'fileUploadsEnabled') -or -not $data.runtime.fileUploadsEnabled) {
        throw 'PHP file_uploads is disabled'
    }
    if (-not ($data.PSObject.Properties.Name -contains 'storage')) {
        throw 'Health payload is missing storage diagnostics'
    }
    if (-not $data.storage.uploadsDirExists) {
        throw 'backend/uploads directory is missing'
    }
    if (-not $data.storage.uploadsHtaccessPresent) {
        throw 'backend/uploads/.htaccess is missing'
    }
    if (-not $data.storage.uploadsWritable) {
        throw 'backend/uploads is not writable by PHP'
    }
    if (-not $data.storage.tempWritable) {
        throw 'PHP temp directory is not writable'
    }
    if (-not $data.database.connected) {
        throw 'Database is not connected'
    }
    if (-not $data.database.schemaReady) {
        throw "Schema is not ready; missing tables: $($data.database.missingTables -join ', ')"
    }
    if (-not $data.database.seedReady) {
        throw "Seed data is not ready; missing groups: $($data.database.missingSeedGroups -join ', ')"
    }
    if ($data.status -ne 'ready') {
        throw "Health status is '$($data.status)', expected ready"
    }

    Add-Result 'SVP health JSON' 'PASS' "status=ready, configOptionCount=$($data.database.configOptionCount), storage writable, required PHP extensions and file uploads enabled"
}

Invoke-Diagnostic 'AI proxy JSON' {
    $checks = @(
        @{
            Path = '/api/ai/description'
            Field = 'description'
            Body = @{
                propertyType = 'townhouse'
                listingType = 'sale'
                price = 3000000000
                bedrooms = 3
                bathrooms = 2
                sqft = 90
                address = 'Diagnostic smoke'
                city = 'Ha Noi'
                state = 'VN'
            }
        },
        @{
            Path = '/api/ai/chat'
            Field = 'reply'
            Body = @{
                lang = 'vi'
                messages = @(
                    @{
                        sender = 'me'
                        text = 'Kiem tra diagnostic AI proxy'
                        timestamp = (Get-Date).ToString('o')
                    }
                )
            }
        }
    )

    $details = @()
    $rateLimited = $false
    foreach ($check in $checks) {
        $response = Invoke-JsonPost "$BaseUrl$($check.Path)" $check.Body
        if ($response.StatusCode -notin @(200, 503, 429)) {
            throw "$($check.Path) returned HTTP $($response.StatusCode), expected 200, 503 or 429"
        }

        try {
            $json = $response.Content | ConvertFrom-Json
        } catch {
            throw "$($check.Path) did not return valid JSON. Body: $($response.Content)"
        }

        if ($response.StatusCode -eq 200) {
            $data = if ($json.PSObject.Properties.Name -contains 'data') { $json.data } else { $json }
            $field = [string]$check.Field
            if (-not ($data.PSObject.Properties.Name -contains $field) -or -not $data.$field) {
                throw "$($check.Path) returned 200 but data.$field is missing"
            }
            $details += "$($check.Path)=configured"
            continue
        }

        if (-not ($json.PSObject.Properties.Name -contains 'ok') -or $json.ok) {
            throw "$($check.Path) returned HTTP $($response.StatusCode) without ok=false"
        }

        $errorText = [string]$json.error
        if ($response.StatusCode -eq 503) {
            if (-not $errorText.ToLowerInvariant().Contains('not configured')) {
                throw "$($check.Path) returned 503 but not the expected not configured message"
            }
            $details += "$($check.Path)=safe-not-configured"
            continue
        }

        if (-not $errorText.ToLowerInvariant().Contains('too many')) {
            throw "$($check.Path) returned 429 but not the expected rate-limit message"
        }
        $rateLimited = $true
        $details += "$($check.Path)=rate-limited-json"
    }

    if ($rateLimited) {
        Add-Result 'AI proxy JSON' 'WARN' ($details -join '; ')
    } else {
        Add-Result 'AI proxy JSON' 'PASS' ($details -join '; ')
    }
}

Invoke-Diagnostic 'Protected backend internals' {
    $bad = @()
    foreach ($path in @(
        '/backend/config/config.example.php',
        '/backend/sql/schema.sql',
        '/backend/sql/002_add_property_video_url.sql',
        '/backend/sql/003_add_property_social_links.sql',
        '/backend/sql/004_users_banners_blog.sql',
        '/backend/sql/005_chat_messages.sql',
        '/backend/sql/006_property_likes.sql',
        '/backend/sql/007_add_coordinates.sql',
        '/backend/sql/007_add_expiry_notified.sql',
        '/backend/sql/008_bank_transfers.sql',
        '/backend/sql/009_property_image_unique.sql',
        '/backend/sql/seed.sql',
        '/backend/sql/sodovanphuc_import_all.sql',
        '/backend/sql/sodovanphuc_schema.sql',
        '/backend/sql/sodovanphuc_seed.sql',
        '/backend/sql/sodovanphuc_verify.sql',
        '/backend/sql/database_verify.sql',
        '/backend/lib/Database.php',
        '/backend/.htaccess',
        '/backend/uploads/.htaccess'
    )) {
        $response = Get-RawHttpResponse "$BaseUrl$path" 'GET'
        if ($response.StatusCode -eq 200) {
            $bad += "$path returned 200"
        } elseif ($response.StatusCode -notin @(401, 403, 404, 405)) {
            $bad += "$path returned $($response.StatusCode)"
        }
    }

    if ($bad.Count -gt 0) {
        throw ($bad -join '; ')
    }

    Add-Result 'Protected backend internals' 'PASS' 'config/sql/lib/.htaccess are not publicly readable'
}

Write-Host ''
Write-Host "So Do Van Phuc hosting diagnostic for $BaseUrl"
Write-Host ''
$results | Format-Table -AutoSize

$failCount = ($results | Where-Object { $_.Status -eq 'FAIL' }).Count
$warnCount = ($results | Where-Object { $_.Status -eq 'WARN' }).Count

Write-Host ''
Write-Host "Summary: $failCount failed, $warnCount warning(s), $($results.Count) checks total."
Write-RemediationHints

if ($RequireReady -and $failCount -gt 0) {
    exit 1
}
