param(
    [string]$BaseUrl = 'https://sodovanphuc.vn',
    [switch]$AllowDegradedHealth,
    [switch]$IncludeWriteWorkflow
)

$ErrorActionPreference = 'Stop'

try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls13
} catch {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
}

$BaseUrl = $BaseUrl.TrimEnd('/')

function Write-Check {
    param([string]$Message)
    Write-Host "[OK] $Message"
}

function Invoke-CheckedGet {
    param(
        [string]$Path,
        [int[]]$AllowedStatus = @(200)
    )

    $uri = if ($Path.StartsWith('http')) { $Path } else { "$BaseUrl$Path" }
    try {
        $response = Invoke-WebRequest -Uri $uri -UseBasicParsing -TimeoutSec 25 -MaximumRedirection 5
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        throw "GET $uri failed with HTTP $status"
    }

    if ($AllowedStatus -notcontains [int]$response.StatusCode) {
        throw "GET $uri returned HTTP $($response.StatusCode)"
    }

    return $response
}

function Get-HttpStatus {
    param([string]$Path)

    $uri = if ($Path.StartsWith('http')) { $Path } else { "$BaseUrl$Path" }
    try {
        $response = Invoke-WebRequest -Uri $uri -UseBasicParsing -TimeoutSec 25 -MaximumRedirection 0
        return [int]$response.StatusCode
    } catch {
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
            return [int]$_.Exception.Response.StatusCode
        }
        throw "GET $uri failed before receiving an HTTP status: $($_.Exception.Message)"
    }
}

function Get-RawHttpResponse {
    param([string]$Url)

    $request = [Net.HttpWebRequest]::Create($Url)
    $request.Method = 'GET'
    $request.AllowAutoRedirect = $false
    $request.Timeout = 25000
    $request.UserAgent = 'SoDoVanPhuc-Smoke/1.0'

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
        }
    } finally {
        if ($response) {
            $response.Close()
        }
    }
}

function Assert-CanonicalRedirect {
    param([string]$Url)

    $response = Get-RawHttpResponse -Url $Url
    if ($response.StatusCode -notin @(301, 302, 308)) {
        throw "$Url returned HTTP $($response.StatusCode), expected redirect to $BaseUrl"
    }
    if (-not $response.Location -or -not $response.Location.StartsWith($BaseUrl)) {
        throw "$Url redirects to '$($response.Location)', expected $BaseUrl"
    }
    Write-Check "$Url redirects to $($response.Location)"
}

function Assert-ProtectedUrl {
    param([string]$Path)

    $status = Get-HttpStatus -Path $Path
    if ($status -eq 200) {
        throw "$Path is publicly readable. Backend .htaccess or server protection is not working."
    }
    if ($status -notin @(401, 403, 404, 405)) {
        throw "$Path returned HTTP $status. Expected a protected/not-public response."
    }
    Write-Check "$Path is protected with HTTP $status"
}

function Assert-Contains {
    param(
        [string]$Content,
        [string]$Needle,
        [string]$Message
    )
    if (-not $Content.Contains($Needle)) {
        throw $Message
    }
    Write-Check $Message
}

function Assert-NoLegacyText {
    param(
        [string]$Content,
        [string]$Where
    )
    $legacyPattern = @(
        'Global' + 'Forumz',
        'global' + 'forumz',
        'tenmien' + 'cuakhach',
        'api\.tenmien' + 'cuakhach',
        'your' + '-domain',
        'api\.domain\.com'
    ) -join '|'

    if ($Content -match $legacyPattern) {
        throw "$Where contains legacy domain/placeholder text."
    }
    Write-Check "$Where has no legacy domain/placeholder text"
}

function Invoke-CheckedJson {
    param([string]$Path)

    $response = Invoke-CheckedGet -Path $Path
    try {
        $json = $response.Content | ConvertFrom-Json
    } catch {
        throw "$Path did not return valid JSON."
    }

    if (($json.PSObject.Properties.Name -contains 'ok') -and -not $json.ok) {
        $errorMessage = if ($json.PSObject.Properties.Name -contains 'error') { $json.error } else { 'ok=false' }
        throw "$Path returned ok=false: $errorMessage"
    }

    if ($json.PSObject.Properties.Name -contains 'data') {
        return $json.data
    }

    return $json
}

function Invoke-CheckedJsonRequest {
    param(
        [string]$Method,
        [string]$Path,
        [object]$Body = $null,
        [hashtable]$Headers = @{},
        [int[]]$AllowedStatus = @(200, 201)
    )

    $uri = if ($Path.StartsWith('http')) { $Path } else { "$BaseUrl$Path" }
    $jsonBody = $null
    if ($null -ne $Body) {
        $jsonBody = $Body | ConvertTo-Json -Depth 20
    }

    try {
        if ($null -ne $jsonBody) {
            $request = @{
                Uri = $uri
                Method = $Method
                Body = $jsonBody
                ContentType = 'application/json; charset=utf-8'
                UseBasicParsing = $true
                TimeoutSec = 25
            }
        } else {
            $request = @{
                Uri = $uri
                Method = $Method
                UseBasicParsing = $true
                TimeoutSec = 25
            }
        }
        if ($Headers -and $Headers.Count -gt 0) {
            $request.Headers = $Headers
        }
        $response = Invoke-WebRequest @request
    } catch {
        $status = if ($_.Exception.Response -and $_.Exception.Response.StatusCode) { $_.Exception.Response.StatusCode.value__ } else { 'no-status' }
        throw "$Method $uri failed with HTTP $status. $($_.Exception.Message)"
    }

    if ($AllowedStatus -notcontains [int]$response.StatusCode) {
        throw "$Method $uri returned HTTP $($response.StatusCode)"
    }

    try {
        $json = $response.Content | ConvertFrom-Json
    } catch {
        throw "$Method $uri did not return valid JSON. Body: $($response.Content)"
    }

    if (($json.PSObject.Properties.Name -contains 'ok') -and -not $json.ok) {
        $errorMessage = if ($json.PSObject.Properties.Name -contains 'error') { $json.error } else { 'ok=false' }
        throw "$Method $uri returned ok=false: $errorMessage"
    }

    if ($json.PSObject.Properties.Name -contains 'data') {
        return $json.data
    }

    return $json
}

function Invoke-AiProxySanity {
    param(
        [string]$Path,
        [object]$Body,
        [string]$SuccessField,
        [string]$Message
    )

    $uri = "$BaseUrl$Path"
    $jsonBody = $Body | ConvertTo-Json -Depth 20
    try {
        $response = Invoke-WebRequest `
            -Uri $uri `
            -Method 'POST' `
            -Body $jsonBody `
            -ContentType 'application/json; charset=utf-8' `
            -UseBasicParsing `
            -TimeoutSec 35
    } catch {
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
            $webResponse = $_.Exception.Response
            $bodyText = ''
            $stream = $webResponse.GetResponseStream()
            if ($stream) {
                $reader = New-Object System.IO.StreamReader($stream)
                try {
                    $bodyText = $reader.ReadToEnd()
                } finally {
                    $reader.Dispose()
                }
            }
            $response = [pscustomobject]@{
                StatusCode = [int]$webResponse.StatusCode
                Content = $bodyText
            }
        } else {
            throw "$Message failed before receiving an HTTP status: $($_.Exception.Message)"
        }
    }

    if ([int]$response.StatusCode -notin @(200, 503, 429)) {
        throw "$Message returned HTTP $($response.StatusCode), expected 200, 503 or 429."
    }

    try {
        $json = $response.Content | ConvertFrom-Json
    } catch {
        throw "$Message did not return valid JSON. Body: $($response.Content)"
    }

    if ([int]$response.StatusCode -eq 200) {
        $data = if ($json.PSObject.Properties.Name -contains 'data') { $json.data } else { $json }
        if (-not ($data.PSObject.Properties.Name -contains $SuccessField) -or -not $data.$SuccessField) {
            throw "$Message returned 200 but did not include data.$SuccessField."
        }
        Write-Check "$Message returned configured AI JSON"
        return
    }

    if (-not ($json.PSObject.Properties.Name -contains 'ok') -or $json.ok) {
        throw "$Message returned HTTP $($response.StatusCode) without ok=false."
    }
    $errorText = [string]$json.error
    if ([int]$response.StatusCode -eq 503 -and -not $errorText.ToLowerInvariant().Contains('not configured')) {
        throw "$Message returned 503 but not the expected not configured message."
    }
    if ([int]$response.StatusCode -eq 429 -and -not $errorText.ToLowerInvariant().Contains('too many')) {
        throw "$Message returned 429 but not the expected rate-limit message."
    }

    Write-Check "$Message returned safe JSON fallback with HTTP $($response.StatusCode)"
}

function Invoke-AdminAuthSmoke {
    param(
        [string]$Username,
        [string]$Password
    )

    if (-not $Password) {
        Write-Host '[SKIP] admin auth smoke skipped; set SVP_LIVE_ADMIN_PASSWORD to enable it.'
        return $null
    }

    $loginUri = "$BaseUrl/api/auth/login"
    $loginBody = @{
        username = $Username
        password = $Password
    } | ConvertTo-Json -Depth 5

    try {
        $loginResponse = Invoke-WebRequest `
            -Uri $loginUri `
            -Method 'POST' `
            -Body $loginBody `
            -ContentType 'application/json; charset=utf-8' `
            -UseBasicParsing `
            -TimeoutSec 25
    } catch {
        $status = if ($_.Exception.Response -and $_.Exception.Response.StatusCode) { $_.Exception.Response.StatusCode.value__ } else { 'no-status' }
        throw "Admin login smoke failed with HTTP $status. Check ADMIN_USERNAME/ADMIN_PASSWORD_HASH/JWT_SECRET in backend/config/config.php."
    }

    try {
        $loginJson = $loginResponse.Content | ConvertFrom-Json
    } catch {
        throw 'Admin login smoke did not return valid JSON.'
    }

    if (-not $loginJson.ok -or -not $loginJson.data -or -not $loginJson.data.token) {
        throw 'Admin login smoke did not return ok=true with a JWT token.'
    }

    if (-not $loginJson.data.expiresIn -or [int]$loginJson.data.expiresIn -le 0) {
        throw 'Admin login smoke returned an invalid expiresIn value.'
    }

    $token = [string]$loginJson.data.token
    if ($token.Split('.').Count -ne 3) {
        throw 'Admin login smoke returned a token that does not look like a JWT.'
    }

    try {
        $meResponse = Invoke-WebRequest `
            -Uri "$BaseUrl/api/auth/me" `
            -Method 'GET' `
            -Headers @{ Authorization = "Bearer $token"; Accept = 'application/json' } `
            -UseBasicParsing `
            -TimeoutSec 25
    } catch {
        $status = if ($_.Exception.Response -and $_.Exception.Response.StatusCode) { $_.Exception.Response.StatusCode.value__ } else { 'no-status' }
        throw "Admin JWT /api/auth/me smoke failed with HTTP $status. Check JWT_SECRET and Authorization handling."
    }

    try {
        $meJson = $meResponse.Content | ConvertFrom-Json
    } catch {
        throw 'Admin JWT /api/auth/me smoke did not return valid JSON.'
    }

    if (-not $meJson.ok -or -not $meJson.data) {
        throw 'Admin JWT /api/auth/me smoke did not return ok=true with data.'
    }

    if (($meJson.data.PSObject.Properties.Name -contains 'role') -and $meJson.data.role -ne 'admin') {
        throw "Admin JWT /api/auth/me returned role '$($meJson.data.role)', expected admin."
    }

    Write-Check 'admin API login and JWT /api/auth/me passed'
    return $token
}

function Invoke-SmokeMultipartUpload {
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
        $client.Timeout = [TimeSpan]::FromSeconds(30)
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
        $form.Add($fileContent, 'images', 'svp-live-upload-smoke.png')

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

function Assert-SmokeJsonResponse {
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

    if (($json.PSObject.Properties.Name -contains 'ok') -and -not $json.ok) {
        $errorMessage = if ($json.PSObject.Properties.Name -contains 'error') { $json.error } else { 'ok=false' }
        throw "$Message returned ok=false: $errorMessage"
    }

    Write-Check $Message
    if ($json.PSObject.Properties.Name -contains 'data') {
        return $json.data
    }
    return $json
}

function Invoke-LiveUploadWorkflowSmoke {
    param([string]$Token)

    if (-not $Token) {
        Write-Host '[SKIP] live upload smoke skipped; set SVP_LIVE_ADMIN_PASSWORD and run with -IncludeWriteWorkflow to enable it.'
        return
    }

    $tempPng = Join-Path ([System.IO.Path]::GetTempPath()) ("svp-live-upload-smoke-" + [guid]::NewGuid().ToString('N') + '.png')
    $uploadedUrl = $null

    try {
        [System.IO.File]::WriteAllBytes(
            $tempPng,
            [Convert]::FromBase64String('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=')
        )

        $upload = Invoke-SmokeMultipartUpload -Url "$BaseUrl/api/uploads" -FilePath $tempPng -Token $Token
        $uploadData = Assert-SmokeJsonResponse -Response $upload -ExpectedStatus 201 -Message 'live upload smoke multipart image upload returns JSON'
        $uploadedUrls = @($uploadData.urls)
        if ($uploadData.count -ne 1 -or $uploadedUrls.Count -ne 1) {
            throw "Live upload smoke returned count=$($uploadData.count), urls=$($uploadedUrls.Count)."
        }

        $uploadedUrl = [string]$uploadedUrls[0]
        if ($uploadedUrl -notmatch '^https://sodovanphuc\.vn/backend/uploads/\d{4}/\d{2}/[^/]+\.png$') {
            throw "Live upload smoke returned unexpected upload URL: $uploadedUrl"
        }

        $uploadedResponse = Invoke-CheckedGet -Path $uploadedUrl
        $uploadedContentType = [string]$uploadedResponse.Headers['Content-Type']
        if ($uploadedContentType -notmatch 'image/png') {
            throw "Live uploaded image returned unexpected Content-Type: $uploadedContentType"
        }
        Write-Check 'live upload smoke serves uploaded PNG from backend/uploads'
    } finally {
        Remove-Item -LiteralPath $tempPng -Force -ErrorAction SilentlyContinue

        if ($uploadedUrl) {
            try {
                $deleteData = Invoke-CheckedJsonRequest `
                    -Method 'DELETE' `
                    -Path "/api/uploads?url=$([uri]::EscapeDataString($uploadedUrl))" `
                    -Headers @{ Authorization = "Bearer $Token"; Accept = 'application/json' }
                if (-not $deleteData.deleted) {
                    throw 'delete endpoint returned deleted=false.'
                }
                Write-Check 'live upload smoke deleted uploaded PNG through admin endpoint'

                $deletedStatus = Get-HttpStatus -Path $uploadedUrl
                if ($deletedStatus -eq 200) {
                    throw 'Uploaded PNG remained publicly readable after cleanup.'
                }
                Write-Check "live upload smoke verified uploaded PNG cleanup with HTTP $deletedStatus"
            } catch {
                throw "Live upload smoke cleanup failed for $uploadedUrl. $($_.Exception.Message)"
            }
        }
    }
}

function Assert-JsonArray {
    param(
        [object]$Data,
        [string]$Property,
        [string]$Message
    )

    if (-not ($Data.PSObject.Properties.Name -contains $Property)) {
        throw "${Message}: missing JSON property '$Property'"
    }

    $value = $Data.$Property
    if ($null -eq $value) {
        throw "${Message}: JSON property '$Property' is null"
    }

    Write-Check $Message
}

function Assert-SecurityHeaders {
    param(
        [object]$Headers,
        [string]$Where
    )

    $requiredHeaders = @{
        'X-Content-Type-Options' = 'nosniff'
        'X-Frame-Options' = 'SAMEORIGIN'
        'Referrer-Policy' = 'strict-origin-when-cross-origin'
    }

    foreach ($name in $requiredHeaders.Keys) {
        $actual = [string]$Headers[$name]
        if ($actual -ne $requiredHeaders[$name]) {
            throw "$Where missing or has invalid $name header. Expected '$($requiredHeaders[$name])', got '$actual'."
        }
    }

    Write-Check "$Where has core security headers"
}

function Assert-ItemExists {
    param(
        [object]$Data,
        [string]$Property,
        [string]$Message
    )

    if (-not ($Data.PSObject.Properties.Name -contains $Property) -or $null -eq $Data.$Property) {
        throw $Message
    }

    Write-Check $Message
    return $Data.$Property
}

function Assert-CollectionContainsId {
    param(
        [object]$CollectionData,
        [string]$Id,
        [string]$Message
    )

    $items = @($CollectionData.items)
    if (-not ($items | Where-Object { $_.id -eq $Id })) {
        throw $Message
    }
    Write-Check $Message
}

function Assert-BaseCollectionContainsId {
    param(
        [object]$CollectionData,
        [string]$Property,
        [string]$Id,
        [string]$Message
    )

    if (-not ($CollectionData.PSObject.Properties.Name -contains $Property)) {
        throw "${Message}: missing JSON collection '$Property'"
    }

    $items = @($CollectionData.$Property)
    if (-not ($items | Where-Object { $_.id -eq $Id })) {
        throw "${Message}: id '$Id' was not found"
    }

    Write-Check $Message
}

function Assert-BaseCollectionMissingId {
    param(
        [object]$CollectionData,
        [string]$Property,
        [string]$Id,
        [string]$Message
    )

    if (-not ($CollectionData.PSObject.Properties.Name -contains $Property)) {
        throw "${Message}: missing JSON collection '$Property'"
    }

    $items = @($CollectionData.$Property)
    if ($items | Where-Object { $_.id -eq $Id }) {
        throw "${Message}: id '$Id' is still present"
    }

    Write-Check $Message
}

function Invoke-CleanupDelete {
    param(
        [string]$Path,
        [string]$Message,
        [hashtable]$Headers = @{}
    )

    if (-not $Path) {
        return $true
    }

    try {
        $data = Invoke-CheckedJsonRequest -Method 'DELETE' -Path $Path -Headers $Headers
        if ($null -ne $data -and $data.PSObject.Properties.Name -contains 'deleted') {
            if (-not $data.deleted) {
                Write-Host "[WARN] $Message returned deleted=false"
                return $false
            }
            Write-Check "$Message (deleted=$($data.deleted))"
        } else {
            Write-Check $Message
        }
        return $true
    } catch {
        Write-Host "[WARN] $Message failed: $($_.Exception.Message)"
        return $false
    }
}

function Invoke-BaseAdminDeleteSmoke {
    param([string]$Token)

    if (-not $Token) {
        Write-Host '[SKIP] base admin delete smoke skipped; set SVP_LIVE_ADMIN_PASSWORD and run with -IncludeWriteWorkflow to enable it.'
        return
    }

    $marker = 'BASE-SMOKE-' + (Get-Date -Format 'yyyyMMddHHmmss')
    $authHeaders = @{ Authorization = "Bearer $Token"; Accept = 'application/json' }
    $inquiryId = $null
    $reportId = $null
    $scheduleId = $null
    $cleanupFailures = @()

    try {
        $inquiry = Invoke-CheckedJsonRequest -Method 'POST' -Path '/api/inquiries' -Body @{
            name = "$marker inquiry"
            email = "smoke-$marker@sodovanphuc.vn"
            phone = '0900000000'
            message = "$marker delete smoke"
            property_id = $marker
        }
        $inquiryId = [string]$inquiry.id
        if (-not $inquiryId) {
            throw 'Base inquiry smoke did not return an id.'
        }
        Write-Check 'base admin smoke created inquiry'

        $report = Invoke-CheckedJsonRequest -Method 'POST' -Path '/api/reports' -Body @{
            property_id = $marker
            property_address = "$marker address"
            reason = 'other'
            description = "$marker delete smoke"
            contact_email = "smoke-$marker@sodovanphuc.vn"
        }
        $reportId = [string]$report.id
        if (-not $reportId) {
            throw 'Base report smoke did not return an id.'
        }
        Write-Check 'base admin smoke created report'

        $schedule = Invoke-CheckedJsonRequest -Method 'POST' -Path '/api/schedules' -Body @{
            property_id = $marker
            property_address = "$marker address"
            name = "$marker schedule"
            phone = '0900000000'
            email = "smoke-$marker@sodovanphuc.vn"
            date = (Get-Date).AddDays(1).ToString('yyyy-MM-dd')
            time = '09:00'
            message = "$marker delete smoke"
        }
        $scheduleId = [string]$schedule.id
        if (-not $scheduleId) {
            throw 'Base schedule smoke did not return an id.'
        }
        Write-Check 'base admin smoke created schedule'

        $inquiryList = Invoke-CheckedJsonRequest -Method 'GET' -Path '/api/inquiries?limit=200' -Headers $authHeaders
        Assert-BaseCollectionContainsId $inquiryList 'inquiries' $inquiryId 'base admin smoke listed created inquiry'

        $reportList = Invoke-CheckedJsonRequest -Method 'GET' -Path '/api/reports?limit=200' -Headers $authHeaders
        Assert-BaseCollectionContainsId $reportList 'reports' $reportId 'base admin smoke listed created report'

        $scheduleList = Invoke-CheckedJsonRequest -Method 'GET' -Path '/api/schedules?limit=200' -Headers $authHeaders
        Assert-BaseCollectionContainsId $scheduleList 'schedules' $scheduleId 'base admin smoke listed created schedule'

        $deleteInquiry = Invoke-CheckedJsonRequest -Method 'DELETE' -Path "/api/inquiries/$([uri]::EscapeDataString($inquiryId))" -Headers $authHeaders
        if (-not $deleteInquiry.deleted) {
            throw 'Inquiry delete did not return deleted=true.'
        }
        $deletedInquiryId = $inquiryId
        $inquiryId = $null
        Write-Check 'base admin smoke deleted inquiry'

        $deleteReport = Invoke-CheckedJsonRequest -Method 'DELETE' -Path "/api/reports/$([uri]::EscapeDataString($reportId))" -Headers $authHeaders
        if (-not $deleteReport.deleted) {
            throw 'Report delete did not return deleted=true.'
        }
        $deletedReportId = $reportId
        $reportId = $null
        Write-Check 'base admin smoke deleted report'

        $deleteSchedule = Invoke-CheckedJsonRequest -Method 'DELETE' -Path "/api/schedules/$([uri]::EscapeDataString($scheduleId))" -Headers $authHeaders
        if (-not $deleteSchedule.deleted) {
            throw 'Schedule delete did not return deleted=true.'
        }
        $deletedScheduleId = $scheduleId
        $scheduleId = $null
        Write-Check 'base admin smoke deleted schedule'

        $inquiryListAfterDelete = Invoke-CheckedJsonRequest -Method 'GET' -Path '/api/inquiries?limit=200' -Headers $authHeaders
        Assert-BaseCollectionMissingId $inquiryListAfterDelete 'inquiries' $deletedInquiryId 'base admin smoke verified inquiry deletion'

        $reportListAfterDelete = Invoke-CheckedJsonRequest -Method 'GET' -Path '/api/reports?limit=200' -Headers $authHeaders
        Assert-BaseCollectionMissingId $reportListAfterDelete 'reports' $deletedReportId 'base admin smoke verified report deletion'

        $scheduleListAfterDelete = Invoke-CheckedJsonRequest -Method 'GET' -Path '/api/schedules?limit=200' -Headers $authHeaders
        Assert-BaseCollectionMissingId $scheduleListAfterDelete 'schedules' $deletedScheduleId 'base admin smoke verified schedule deletion'

        Write-Host "Base admin delete smoke passed and cleaned up. Marker: $marker"
    } finally {
        if ($inquiryId) {
            if (-not (Invoke-CleanupDelete -Path "/api/inquiries/$([uri]::EscapeDataString($inquiryId))" -Message 'base admin smoke cleaned inquiry' -Headers $authHeaders)) {
                $cleanupFailures += 'inquiry'
            }
        }
        if ($reportId) {
            if (-not (Invoke-CleanupDelete -Path "/api/reports/$([uri]::EscapeDataString($reportId))" -Message 'base admin smoke cleaned report' -Headers $authHeaders)) {
                $cleanupFailures += 'report'
            }
        }
        if ($scheduleId) {
            if (-not (Invoke-CleanupDelete -Path "/api/schedules/$([uri]::EscapeDataString($scheduleId))" -Message 'base admin smoke cleaned schedule' -Headers $authHeaders)) {
                $cleanupFailures += 'schedule'
            }
        }
    }

    if ($cleanupFailures.Count -gt 0) {
        throw "Base admin delete smoke cleanup failed for: $($cleanupFailures -join ', ')"
    }
}

function Invoke-WriteWorkflowSmoke {
    param([string]$Token)

    $marker = 'AUTO-SMOKE-' + (Get-Date -Format 'yyyyMMddHHmmss')
    Write-Host ''
    Write-Host "Running write workflow smoke with marker $marker"

    $propertyId = $null
    $customerId = $null
    $needId = $null
    $scheduleId = $null
    $referralId = $null
    $mediaId = $null
    $uploadedMediaId = $null
    $uploadedMediaUrl = $null
    $tempSvpPng = $null
    $workflowPassed = $false
    $cleanupFailures = @()

    try {
        $propertyData = Invoke-CheckedJsonRequest -Method 'POST' -Path '/api/svp/properties' -Body @{
            title = "$marker - nha test tu dong"
            description = 'Ban ghi tu dong do smoke test tao de xac minh luong dang nha, timeline, version, media va audit.'
            ownerName = 'Smoke Test'
            ownerPhone = '0900000000'
            bookSerial = $marker
            price = 5000000000
            priceUnit = 'VND'
            areaM2 = 80
            district = 'Thu Duc'
            ward = 'Van Phuc'
            address = "$marker address"
            hiddenAddress = 'Dia chi an tu smoke test'
            companyUnitId = 'cu_tuan123_mien_nam'
            statusId = 'st_new'
            signingScore = 1
            visibilityIds = @('vl_lop4', 'vl_vinh_danh')
            tagIds = @('tag_o_to', 'tag_thang_may', 'tag_mo_spa')
            extra = @{ smokeTest = $true; marker = $marker }
        }
        $property = Assert-ItemExists $propertyData 'item' 'write smoke created property'
        $propertyId = [string]$property.id
        if (-not $propertyId) {
            throw 'Created property did not include an id.'
        }

        $detailData = Invoke-CheckedJsonRequest -Method 'GET' -Path "/api/svp/properties/$propertyId"
        $detail = Assert-ItemExists $detailData 'item' 'write smoke can read created property detail'
        if ($detail.title -notlike "$marker*") {
            throw 'Created property detail did not preserve marker title.'
        }

        $updatedData = Invoke-CheckedJsonRequest -Method 'PUT' -Path "/api/svp/properties/$propertyId" -Body @{
            statusId = 'st_active'
            price = 5100000000
            description = 'Smoke test da cap nhat trang thai/gia de kiem version va timeline.'
        }
        $updated = Assert-ItemExists $updatedData 'item' 'write smoke updated property'
        if ($updated.statusId -ne 'st_active') {
            throw "Updated property status is '$($updated.statusId)', expected st_active."
        }

        $mediaData = Invoke-CheckedJsonRequest -Method 'POST' -Path "/api/svp/properties/$propertyId/media" -Body @{
            propertyId = $propertyId
            mediaType = 'image'
            url = 'https://sodovanphuc.vn/og-image.jpg'
            caption = "$marker media"
            sortOrder = 1
        }
        $media = Assert-ItemExists $mediaData 'item' 'write smoke created property media'
        $mediaId = [string]$media.id

        if ($Token) {
            $tempSvpPng = Join-Path ([System.IO.Path]::GetTempPath()) ("svp-property-media-upload-" + [guid]::NewGuid().ToString('N') + '.png')
            [System.IO.File]::WriteAllBytes(
                $tempSvpPng,
                [Convert]::FromBase64String('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=')
            )
            $svpMediaUpload = Invoke-SmokeMultipartUpload `
                -Url "$BaseUrl/api/svp/properties/$propertyId/media-upload" `
                -FilePath $tempSvpPng `
                -Token $Token `
                -FormFields @{ caption = "$marker anh duyet"; category = 'approval_document' }
            $svpMediaUploadData = Assert-SmokeJsonResponse -Response $svpMediaUpload -ExpectedStatus 201 -Message 'write smoke uploaded SVP property image through media-upload route'
            $uploadedItems = @($svpMediaUploadData.items)
            if ($uploadedItems.Count -ne 1) {
                throw "SVP property media upload returned $($uploadedItems.Count) items, expected 1."
            }
            $uploadedMediaId = [string]$uploadedItems[0].id
            $uploadedMediaUrl = [string]$uploadedItems[0].url
            if ($uploadedMediaUrl -notmatch '^https://sodovanphuc\.vn/backend/uploads/\d{4}/\d{2}/[^/]+\.png$') {
                throw "SVP property media upload returned unexpected URL: $uploadedMediaUrl"
            }
            Write-Check 'write smoke verified SVP property image upload URL'
        } else {
            Write-Host '[SKIP] SVP property media-upload route smoke skipped; set SVP_LIVE_ADMIN_PASSWORD to enable upload cleanup.'
        }

        $timelineData = Invoke-CheckedJsonRequest -Method 'GET' -Path "/api/svp/properties/$propertyId/timeline"
        if (@($timelineData.items).Count -lt 3) {
            throw 'Property timeline has fewer than 3 events after create/update/media.'
        }
        Write-Check 'write smoke verified property timeline events'

        $versionData = Invoke-CheckedJsonRequest -Method 'GET' -Path "/api/svp/properties/$propertyId/versions"
        if (@($versionData.items).Count -lt 2) {
            throw 'Property versions have fewer than 2 snapshots after create/update.'
        }
        Write-Check 'write smoke verified property versions'

        $mediaListData = Invoke-CheckedJsonRequest -Method 'GET' -Path "/api/svp/properties/$propertyId/media"
        Assert-CollectionContainsId $mediaListData $mediaId 'write smoke verified media list'
        if ($uploadedMediaId) {
            Assert-CollectionContainsId $mediaListData $uploadedMediaId 'write smoke verified uploaded SVP property media list'
        }

        $customerData = Invoke-CheckedJsonRequest -Method 'POST' -Path '/api/svp/customers' -Body @{
            fullName = "$marker khach test"
            phone = '0911111111'
            email = 'smoke-test@sodovanphuc.vn'
            source = 'smoke-test'
            statusId = 'cs_new'
            note = $marker
        }
        $customer = Assert-ItemExists $customerData 'item' 'write smoke created customer'
        $customerId = [string]$customer.id

        $needData = Invoke-CheckedJsonRequest -Method 'POST' -Path '/api/svp/customer-needs' -Body @{
            customerId = $customerId
            districtIds = @('Thu Duc')
            budgetMin = 4000000000
            budgetMax = 6000000000
            areaMin = 60
            areaMax = 100
            tagIds = @('tag_o_to', 'tag_mo_spa')
            description = "$marker nhu cau mua"
            statusId = 'cs_viewing'
        }
        $need = Assert-ItemExists $needData 'item' 'write smoke created customer need'
        $needId = [string]$need.id

        $scheduleData = Invoke-CheckedJsonRequest -Method 'POST' -Path '/api/svp/viewing-schedules' -Body @{
            customerId = $customerId
            propertyId = $propertyId
            scheduledAt = (Get-Date).AddDays(1).ToString('yyyy-MM-dd HH:mm:ss')
            status = 'confirmed'
            note = "$marker lich xem"
        }
        $schedule = Assert-ItemExists $scheduleData 'item' 'write smoke created viewing schedule'
        $scheduleId = [string]$schedule.id

        $referralData = Invoke-CheckedJsonRequest -Method 'POST' -Path '/api/svp/referrals' -Body @{
            referrerUserId = 'smoke-test'
            referredUserId = $customerId
            referralCode = $marker
            referralType = 'buyer'
            status = 'new'
        }
        $referral = Assert-ItemExists $referralData 'item' 'write smoke created referral'
        $referralId = [string]$referral.id

        $needsByCustomer = Invoke-CheckedJsonRequest -Method 'GET' -Path "/api/svp/customer-needs?customerId=$customerId"
        Assert-CollectionContainsId $needsByCustomer $needId 'write smoke verified customer need query'

        $schedules = Invoke-CheckedJsonRequest -Method 'GET' -Path '/api/svp/viewing-schedules'
        Assert-CollectionContainsId $schedules $scheduleId 'write smoke verified viewing schedule list'

        $referrals = Invoke-CheckedJsonRequest -Method 'GET' -Path '/api/svp/referrals'
        Assert-CollectionContainsId $referrals $referralId 'write smoke verified referral list'

        foreach ($entityId in @($propertyId, $mediaId, $uploadedMediaId, $customerId, $needId, $scheduleId, $referralId)) {
            if (-not $entityId) {
                continue
            }
            $audit = Invoke-CheckedJsonRequest -Method 'GET' -Path "/api/svp/audit-logs?entityId=$([uri]::EscapeDataString($entityId))&limit=20"
            $auditItems = @($audit.items)
            if (-not ($auditItems | Where-Object { $_.entityId -eq $entityId })) {
                throw "Audit log does not contain entity id $entityId from write smoke."
            }
        }
        Write-Check 'write smoke verified filtered audit log for created entities'

        $deleteData = Invoke-CheckedJsonRequest -Method 'DELETE' -Path "/api/svp/properties/$propertyId"
        if (-not $deleteData.deleted) {
            throw 'Property delete did not return deleted=true.'
        }
        Write-Check 'write smoke soft-deleted temporary property'

        $detailStatus = Get-HttpStatus -Path "/api/svp/properties/$propertyId"
        if ($detailStatus -ne 404) {
            throw "Deleted smoke property detail returned HTTP $detailStatus, expected 404."
        }
        Write-Check 'write smoke verified deleted property is hidden from detail route'
        $propertyId = $null
        $workflowPassed = $true
    } finally {
        if ($tempSvpPng) {
            Remove-Item -LiteralPath $tempSvpPng -Force -ErrorAction SilentlyContinue
        }

        if ($uploadedMediaUrl -and $Token) {
            try {
                $deleteUpload = Invoke-CheckedJsonRequest `
                    -Method 'DELETE' `
                    -Path "/api/uploads?url=$([uri]::EscapeDataString($uploadedMediaUrl))" `
                    -Headers @{ Authorization = "Bearer $Token"; Accept = 'application/json' }
                if (-not $deleteUpload.deleted) {
                    throw 'delete endpoint returned deleted=false.'
                }
                Write-Check 'write smoke cleaned uploaded SVP property PNG'
            } catch {
                $cleanupFailures += 'svp-property-upload'
                Write-Host "[WARN] Failed to clean uploaded SVP property PNG: $($_.Exception.Message)"
            }
        }

        if ($referralId) {
            if (-not (Invoke-CleanupDelete -Path "/api/svp/referrals/$([uri]::EscapeDataString($referralId))" -Message 'write smoke cleaned referral')) {
                $cleanupFailures += 'referral'
            }
        }
        if ($scheduleId) {
            if (-not (Invoke-CleanupDelete -Path "/api/svp/viewing-schedules/$([uri]::EscapeDataString($scheduleId))" -Message 'write smoke cleaned viewing schedule')) {
                $cleanupFailures += 'viewing schedule'
            }
        }
        if ($needId) {
            if (-not (Invoke-CleanupDelete -Path "/api/svp/customer-needs/$([uri]::EscapeDataString($needId))" -Message 'write smoke cleaned customer need')) {
                $cleanupFailures += 'customer need'
            }
        }
        if ($customerId) {
            if (-not (Invoke-CleanupDelete -Path "/api/svp/customers/$([uri]::EscapeDataString($customerId))" -Message 'write smoke cleaned customer')) {
                $cleanupFailures += 'customer'
            }
        }
        if ($propertyId) {
            if (-not (Invoke-CleanupDelete -Path "/api/svp/properties/$([uri]::EscapeDataString($propertyId))" -Message 'write smoke cleaned property')) {
                $cleanupFailures += 'property'
            }
        }
    }

    if ($workflowPassed -and $cleanupFailures.Count -gt 0) {
        throw "Write workflow smoke passed but cleanup failed for: $($cleanupFailures -join ', ')"
    }

    if ($workflowPassed) {
        Write-Host "Write workflow smoke passed and cleaned up. Marker: $marker"
    }
}

if ($BaseUrl -eq 'https://sodovanphuc.vn') {
    Assert-CanonicalRedirect -Url 'http://sodovanphuc.vn/'

    $wwwRecords = Resolve-DnsName -Name 'www.sodovanphuc.vn' -Type A -ErrorAction SilentlyContinue |
        Where-Object { $_.IPAddress }
    if ($wwwRecords) {
        Assert-CanonicalRedirect -Url 'http://www.sodovanphuc.vn/'
    }
}

$htmlRoutes = @(
    '/',
    '/register',
    '/forgot-password',
    '/chu-nha',
    '/khach-mua',
    '/chuyen-gia',
    '/chuyen-vien',
    '/ctv',
    '/gioi-thieu',
    '/quan-tri',
    '/profile',
    '/notifications'
)

foreach ($route in $htmlRoutes) {
    $response = Invoke-CheckedGet -Path $route
    if ($route -eq '/') {
        Assert-SecurityHeaders $response.Headers 'HTML root'
    }
    Assert-Contains $response.Content 'lang="vi"' "HTML route $route declares Vietnamese locale"
    Assert-Contains $response.Content 'sodovanphuc.vn' "HTML route $route renders official domain shell"
    Assert-NoLegacyText $response.Content "HTML route $route"
}

$robots = Invoke-CheckedGet -Path '/robots.txt'
Assert-Contains $robots.Content 'Sitemap: https://sodovanphuc.vn/sitemap.xml' 'robots.txt points to official sitemap'
Assert-NoLegacyText $robots.Content 'robots.txt'

$sitemap = Invoke-CheckedGet -Path '/sitemap.xml'
Assert-Contains $sitemap.Content 'https://sodovanphuc.vn/' 'sitemap contains home URL'
Assert-Contains $sitemap.Content 'https://sodovanphuc.vn/register' 'sitemap contains register URL'
Assert-Contains $sitemap.Content 'https://sodovanphuc.vn/chu-nha' 'sitemap contains owner dashboard URL'
Assert-Contains $sitemap.Content 'https://sodovanphuc.vn/chuyen-gia' 'sitemap contains expert dashboard URL'
Assert-NoLegacyText $sitemap.Content 'sitemap.xml'

foreach ($protectedPath in @(
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
    Assert-ProtectedUrl -Path $protectedPath
}

$health = Invoke-CheckedGet -Path '/api/svp/health'
try {
    $healthJson = $health.Content | ConvertFrom-Json
} catch {
    throw '/api/svp/health did not return valid JSON.'
}

Assert-Contains $health.Content 'so-do-van-phuc-api' 'healthcheck returns SVP service name'

if ($healthJson.PSObject.Properties.Name -contains 'data') {
    $healthData = $healthJson.data
} else {
    $healthData = $healthJson
}

if (($healthJson.PSObject.Properties.Name -contains 'ok') -and -not $healthJson.ok) {
    throw '/api/svp/health returned ok=false.'
}

if (-not $healthData.database.connected) {
    throw 'healthcheck says database is not connected.'
}

if (-not ($healthData.PSObject.Properties.Name -contains 'runtime')) {
    throw 'healthcheck is missing runtime diagnostics.'
}

$missingExtensions = @($healthData.runtime.missingRequiredExtensions)
if ($missingExtensions.Count -gt 0) {
    throw "healthcheck missing required PHP extensions: $($missingExtensions -join ', ')"
}

foreach ($extension in @('pdo', 'pdo_mysql', 'json', 'fileinfo', 'openssl')) {
    if (-not ($healthData.runtime.requiredExtensions.PSObject.Properties.Name -contains $extension) -or -not $healthData.runtime.requiredExtensions.$extension) {
        throw "healthcheck says PHP extension '$extension' is not loaded."
    }
}
if (-not ($healthData.runtime.PSObject.Properties.Name -contains 'fileUploadsEnabled') -or -not $healthData.runtime.fileUploadsEnabled) {
    throw 'healthcheck says PHP file_uploads is disabled.'
}
Write-Check 'healthcheck required PHP extensions are loaded'

if (-not ($healthData.PSObject.Properties.Name -contains 'storage')) {
    throw 'healthcheck is missing storage diagnostics.'
}

if (-not $healthData.storage.uploadsDirExists) {
    throw 'healthcheck says backend/uploads directory is missing.'
}
if (-not $healthData.storage.uploadsHtaccessPresent) {
    throw 'healthcheck says backend/uploads/.htaccess is missing.'
}
if (-not $healthData.storage.uploadsWritable) {
    throw 'healthcheck says backend/uploads is not writable by PHP.'
}
if (-not $healthData.storage.tempWritable) {
    throw 'healthcheck says PHP temp directory is not writable.'
}
Write-Check 'healthcheck upload storage and PHP temp directory are writable'

if ($healthData.database.missingTables -and $healthData.database.missingTables.Count -gt 0) {
    throw "healthcheck missing tables: $($healthData.database.missingTables -join ', ')"
}

if ($healthData.database.missingSeedGroups -and $healthData.database.missingSeedGroups.Count -gt 0) {
    throw "healthcheck missing seed groups: $($healthData.database.missingSeedGroups -join ', ')"
}

if (-not $healthData.database.seedReady -and -not $AllowDegradedHealth) {
    throw 'healthcheck says seed data is not ready.'
}

if ($healthData.status -ne 'ready' -and -not $AllowDegradedHealth) {
    throw "healthcheck status is '$($healthData.status)', expected 'ready'."
}

Write-Check "healthcheck status is $($healthData.status)"

Invoke-AiProxySanity `
    -Path '/api/ai/description' `
    -SuccessField 'description' `
    -Message 'AI description proxy sanity smoke' `
    -Body @{
        propertyType = 'townhouse'
        listingType = 'sale'
        price = 3000000000
        bedrooms = 3
        bathrooms = 2
        sqft = 90
        address = 'Live smoke'
        city = 'Ha Noi'
        state = 'VN'
    }

Invoke-AiProxySanity `
    -Path '/api/ai/chat' `
    -SuccessField 'reply' `
    -Message 'AI chat proxy sanity smoke' `
    -Body @{
        lang = 'vi'
        messages = @(
            @{
                sender = 'me'
                text = 'Kiem tra live AI chat proxy'
                timestamp = (Get-Date).ToString('o')
            }
        )
    }

$liveAdminUsername = [Environment]::GetEnvironmentVariable('SVP_LIVE_ADMIN_USERNAME')
if (-not $liveAdminUsername) {
    $liveAdminUsername = 'admin'
}
$liveAdminPassword = [Environment]::GetEnvironmentVariable('SVP_LIVE_ADMIN_PASSWORD')
$liveAdminToken = Invoke-AdminAuthSmoke -Username $liveAdminUsername -Password $liveAdminPassword

$configData = Invoke-CheckedJson -Path '/api/svp/config'
Assert-JsonArray $configData 'groups' '/api/svp/config returns groups'
if ($configData.groups.Count -lt 7) {
    throw "/api/svp/config returned only $($configData.groups.Count) groups, expected at least 7."
}

$optionCount = 0
foreach ($group in $configData.groups) {
    if ($group.PSObject.Properties.Name -contains 'options' -and $group.options) {
        $optionCount += $group.options.Count
    }
}
if ($optionCount -lt 50) {
    throw "/api/svp/config returned only $optionCount options, expected at least 50."
}
Write-Check "/api/svp/config has $($configData.groups.Count) groups and $optionCount options"

$collectionChecks = @(
    @{ Path = '/api/svp/properties'; Property = 'items' },
    @{ Path = '/api/svp/customers'; Property = 'items' },
    @{ Path = '/api/svp/customer-needs'; Property = 'items' },
    @{ Path = '/api/svp/viewing-schedules'; Property = 'items' },
    @{ Path = '/api/svp/referrals'; Property = 'items' },
    @{ Path = '/api/svp/audit-logs'; Property = 'items' }
)

foreach ($check in $collectionChecks) {
    $data = Invoke-CheckedJson -Path $check.Path
    Assert-JsonArray $data $check.Property "$($check.Path) returns $($check.Property)"
}

if ($IncludeWriteWorkflow) {
    Invoke-LiveUploadWorkflowSmoke -Token $liveAdminToken
    Invoke-BaseAdminDeleteSmoke -Token $liveAdminToken
    Invoke-WriteWorkflowSmoke -Token $liveAdminToken
}

Write-Host ''
Write-Host "Hosting smoke test passed for $BaseUrl"
