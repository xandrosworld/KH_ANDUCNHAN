param(
    [string]$Domain = 'sodovanphuc.vn',
    [string]$ExpectedIp = '',
    [string]$OutputDir = '',
    [switch]$RequireReady
)

$ErrorActionPreference = 'Stop'

try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls13
} catch {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
}

$Domain = $Domain.Trim().TrimEnd('/')
$wwwDomain = "www.$Domain"
$baseUrl = "https://$Domain"
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

function Find-AppRoot {
    param([string]$StartPath)

    $current = (Resolve-Path -LiteralPath $StartPath).Path
    while ($current) {
        if ((Test-Path -LiteralPath (Join-Path $current 'package.json')) -and (Test-Path -LiteralPath (Join-Path $current 'deploy'))) {
            return $current
        }

        $parent = Split-Path -Parent $current
        if (-not $parent -or $parent -eq $current) {
            break
        }
        $current = $parent
    }

    throw "Could not find app root from $StartPath."
}

function Resolve-LatestRelease {
    param([string]$AppRoot)

    $releaseRoot = Join-Path $AppRoot 'release'
    if (-not (Test-Path -LiteralPath $releaseRoot)) {
        return ''
    }

    $latest = Get-ChildItem -LiteralPath $releaseRoot -Directory |
        Where-Object { $_.Name -like 'sodovanphuc-*' } |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1

    if ($latest) {
        return $latest.FullName
    }

    return ''
}

function New-ReportOutputDir {
    param(
        [string]$RequestedOutputDir,
        [string]$AppRoot,
        [string]$ReleaseRoot
    )

    if ($RequestedOutputDir) {
        New-Item -ItemType Directory -Force -Path $RequestedOutputDir | Out-Null
        return (Resolve-Path -LiteralPath $RequestedOutputDir).Path
    }

    if ($ReleaseRoot) {
        $path = Join-Path $ReleaseRoot "domain-cutover-reports\$timestamp"
    } else {
        $path = Join-Path $AppRoot "qa\domain-cutover\$timestamp"
    }

    New-Item -ItemType Directory -Force -Path $path | Out-Null
    return (Resolve-Path -LiteralPath $path).Path
}

function ConvertTo-DisplayValue {
    param([object]$Value)

    if ($null -eq $Value) {
        return '-'
    }

    $items = @($Value)
    if ($items.Count -eq 0) {
        return '-'
    }

    $text = ($items | ForEach-Object { [string]$_ }) -join ', '
    if (-not $text) {
        return '-'
    }

    return $text
}

function Get-DnsRecords {
    param(
        [string]$Name,
        [string]$Type
    )

    try {
        return @(Resolve-DnsName -Name $Name -Type $Type -ErrorAction Stop)
    } catch {
        return @()
    }
}

function Get-ARecords {
    param([string]$Name)

    $records = Get-DnsRecords -Name $Name -Type A
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

function Get-CnameRecords {
    param([string]$Name)

    $records = Get-DnsRecords -Name $Name -Type CNAME
    $names = @()
    foreach ($record in $records) {
        if ($record.PSObject.Properties.Name -contains 'NameHost' -and $record.NameHost) {
            $names += ([string]$record.NameHost).TrimEnd('.')
        }
    }

    return @($names | Sort-Object -Unique)
}

function Get-NsRecords {
    param([string]$Name)

    $records = Get-DnsRecords -Name $Name -Type NS
    $names = @()
    foreach ($record in $records) {
        if ($record.PSObject.Properties.Name -contains 'NameHost' -and $record.NameHost) {
            $names += ([string]$record.NameHost).TrimEnd('.')
        }
    }

    return @($names | Sort-Object -Unique)
}

function Get-RawHttpResponse {
    param([string]$Url)

    try {
        $request = [Net.HttpWebRequest]::Create($Url)
        $request.Method = 'GET'
        $request.AllowAutoRedirect = $false
        $request.Timeout = 20000
        $request.UserAgent = 'SoDoVanPhuc-DomainCutover/1.0'
        $response = $request.GetResponse()
    } catch [Net.WebException] {
        if ($_.Exception.Response) {
            $response = $_.Exception.Response
        } else {
            return [pscustomobject]@{
                Ok = $false
                StatusCode = ''
                Location = ''
                Error = $_.Exception.Message
            }
        }
    }

    try {
        return [pscustomobject]@{
            Ok = $true
            StatusCode = [int]$response.StatusCode
            Location = [string]$response.Headers['Location']
            Error = ''
        }
    } finally {
        if ($response) {
            $response.Close()
        }
    }
}

function Test-StrictHttps {
    param([string]$Url)

    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 20 -MaximumRedirection 5
        return [pscustomobject]@{
            Ok = ([int]$response.StatusCode -eq 200)
            StatusCode = [int]$response.StatusCode
            Error = ''
        }
    } catch {
        return [pscustomobject]@{
            Ok = $false
            StatusCode = ''
            Error = $_.Exception.Message
        }
    }
}

function Add-Check {
    param(
        [System.Collections.Generic.List[object]]$Checks,
        [string]$Name,
        [string]$Status,
        [string]$Details
    )

    $Checks.Add([pscustomobject]@{
        Name = $Name
        Status = $Status
        Details = $Details
    }) | Out-Null
}

function ConvertTo-MarkdownCell {
    param([string]$Text)

    return ($Text -replace '\|', '\|' -replace "`r?`n", '<br>')
}

$appRoot = Find-AppRoot $scriptDir
$releaseRoot = Resolve-LatestRelease $appRoot
$reportDir = New-ReportOutputDir -RequestedOutputDir $OutputDir -AppRoot $appRoot -ReleaseRoot $releaseRoot
$reportPath = Join-Path $reportDir 'DOMAIN_CUTOVER_REPORT.md'

$rootA = @(Get-ARecords $Domain)
$wwwA = @(Get-ARecords $wwwDomain)
$wwwCname = @(Get-CnameRecords $wwwDomain)
$nsRecords = @(Get-NsRecords $Domain)
$effectiveExpectedIp = $ExpectedIp
if (-not $effectiveExpectedIp -and $rootA.Count -eq 1) {
    $effectiveExpectedIp = $rootA[0]
}

$httpRoot = Get-RawHttpResponse "http://$Domain/"
$httpWww = Get-RawHttpResponse "http://$wwwDomain/"
$httpsRoot = Test-StrictHttps "$baseUrl/"

$checks = New-Object System.Collections.Generic.List[object]

if ($rootA.Count -eq 0) {
    Add-Check $checks 'Root A record' 'FAIL' "$Domain has no A record."
} elseif ($ExpectedIp -and ($rootA -notcontains $ExpectedIp)) {
    Add-Check $checks 'Root A record' 'FAIL' "$Domain resolves to $(ConvertTo-DisplayValue $rootA), expected $ExpectedIp."
} else {
    Add-Check $checks 'Root A record' 'PASS' "$Domain resolves to $(ConvertTo-DisplayValue $rootA)."
}

if ($wwwA.Count -eq 0 -and $wwwCname.Count -eq 0) {
    Add-Check $checks 'www DNS record' 'WARN' "$wwwDomain has no A/CNAME record yet."
} elseif ($wwwCname.Count -gt 0 -and ($wwwCname -notcontains $Domain)) {
    Add-Check $checks 'www DNS record' 'FAIL' "$wwwDomain CNAME is $(ConvertTo-DisplayValue $wwwCname), expected $Domain or A $(ConvertTo-DisplayValue $effectiveExpectedIp)."
} elseif ($effectiveExpectedIp -and $wwwA.Count -gt 0 -and ($wwwA -notcontains $effectiveExpectedIp)) {
    Add-Check $checks 'www DNS record' 'FAIL' "$wwwDomain resolves to $(ConvertTo-DisplayValue $wwwA), expected $(ConvertTo-DisplayValue $effectiveExpectedIp)."
} elseif ($rootA.Count -gt 0 -and $wwwA.Count -gt 0 -and (@($wwwA | Where-Object { $rootA -contains $_ }).Count -eq 0)) {
    Add-Check $checks 'www DNS record' 'FAIL' "$wwwDomain resolves to $(ConvertTo-DisplayValue $wwwA), root resolves to $(ConvertTo-DisplayValue $rootA)."
} else {
    Add-Check $checks 'www DNS record' 'PASS' "$wwwDomain A=$(ConvertTo-DisplayValue $wwwA); CNAME=$(ConvertTo-DisplayValue $wwwCname)."
}

if ($httpsRoot.Ok) {
    Add-Check $checks 'HTTPS root' 'PASS' "$baseUrl/ returned HTTP $($httpsRoot.StatusCode)."
} else {
    Add-Check $checks 'HTTPS root' 'FAIL' "Strict HTTPS is not ready. $($httpsRoot.Error)"
}

if ($httpRoot.Ok -and $httpRoot.StatusCode -in @(301, 302, 308) -and $httpRoot.Location.StartsWith($baseUrl)) {
    Add-Check $checks 'HTTP canonical redirect' 'PASS' "http://$Domain/ redirects to $($httpRoot.Location)."
} elseif ($httpRoot.Ok) {
    Add-Check $checks 'HTTP canonical redirect' 'FAIL' "http://$Domain/ returned $($httpRoot.StatusCode), Location=$($httpRoot.Location)."
} else {
    Add-Check $checks 'HTTP canonical redirect' 'FAIL' $httpRoot.Error
}

if ($httpWww.Ok -and $httpWww.StatusCode -in @(301, 302, 308) -and $httpWww.Location.StartsWith($baseUrl)) {
    Add-Check $checks 'www canonical redirect' 'PASS' "http://$wwwDomain/ redirects to $($httpWww.Location)."
} elseif ($httpWww.Ok) {
    Add-Check $checks 'www canonical redirect' 'FAIL' "http://$wwwDomain/ returned $($httpWww.StatusCode), Location=$($httpWww.Location)."
} else {
    Add-Check $checks 'www canonical redirect' 'FAIL' $httpWww.Error
}

$failCount = @($checks | Where-Object { $_.Status -eq 'FAIL' }).Count
$warnCount = @($checks | Where-Object { $_.Status -eq 'WARN' }).Count
$finalStatus = if ($failCount -eq 0 -and $warnCount -eq 0) { 'PASS' } elseif ($RequireReady) { 'FAIL' } else { 'WAITING' }

$reportLines = New-Object System.Collections.Generic.List[string]
$reportLines.Add('# So Do Van Phuc Domain Cutover Report') | Out-Null
$reportLines.Add('') | Out-Null
$reportLines.Add("- Final status: $finalStatus") | Out-Null
$reportLines.Add("- Generated: $((Get-Date).ToString('s'))") | Out-Null
$reportLines.Add("- Domain: $baseUrl") | Out-Null
$reportLines.Add("- Release: $(if ($releaseRoot) { $releaseRoot } else { 'not found' })") | Out-Null
$reportLines.Add("- Expected hosting IP: $(if ($effectiveExpectedIp) { $effectiveExpectedIp } else { 'not locked yet' })") | Out-Null
$reportLines.Add("- Nameservers: $(ConvertTo-DisplayValue $nsRecords)") | Out-Null
$reportLines.Add('') | Out-Null
$reportLines.Add('| Check | Status | Details |') | Out-Null
$reportLines.Add('| --- | --- | --- |') | Out-Null
foreach ($check in $checks) {
    $reportLines.Add("| $(ConvertTo-MarkdownCell $check.Name) | $($check.Status) | $(ConvertTo-MarkdownCell $check.Details) |") | Out-Null
}
$reportLines.Add('') | Out-Null
$reportLines.Add('Exact Mat Bao cutover actions:') | Out-Null
$rootAction = "1. In DNS zone, keep root ``$Domain`` / ``@`` as an A record to the Mat Bao hosting IP"
if ($effectiveExpectedIp) {
    $rootAction += ": ``$effectiveExpectedIp``"
}
$rootAction += '.'
$reportLines.Add($rootAction) | Out-Null
$reportLines.Add("2. Set ``www.$Domain`` to CNAME ``$Domain`` or A record to the same IP. Remove any old CNAME/A record such as ``typhumoigioi.hoola.vn`` before acceptance.") | Out-Null
$reportLines.Add("3. In SSL, issue/enable HTTPS for both ``$Domain`` and ``www.$Domain``. Reissue after DNS is correct if needed.") | Out-Null
$reportLines.Add('4. Upload/extract the latest `sodovanphuc-full-public_html.zip` or the configured zip into the correct `public_html` document root.') | Out-Null
$reportLines.Add('5. Generate/upload `backend/config/config.php`, import `backend/sql/sodovanphuc_import_all.sql`, and confirm `backend/uploads` is writable.') | Out-Null
$reportLines.Add('6. Run the post-upload autopilot below; do not hand over until `HOSTING_HANDOFF_COMPLETE.md` and `ACCEPTANCE_REPORT.md` are PASS.') | Out-Null
$reportLines.Add('') | Out-Null
$reportLines.Add('Next verification command:') | Out-Null
$reportLines.Add('') | Out-Null
$reportLines.Add('```powershell') | Out-Null
if ($effectiveExpectedIp) {
    $reportLines.Add("powershell -ExecutionPolicy Bypass -File tools/domain-cutover-report-vanphuc.ps1 -ExpectedIp `"$effectiveExpectedIp`" -RequireReady") | Out-Null
} else {
    $reportLines.Add('powershell -ExecutionPolicy Bypass -File tools/domain-cutover-report-vanphuc.ps1 -RequireReady') | Out-Null
}
$reportLines.Add('powershell -ExecutionPolicy Bypass -File tools/complete-vanphuc-hosting-handoff.ps1 -IncludeWriteWorkflow') | Out-Null
$reportLines.Add('```') | Out-Null

Set-Content -LiteralPath $reportPath -Encoding UTF8 -Value $reportLines

Write-Host ''
Write-Host "Domain cutover report written:"
Write-Host $reportPath
Write-Host "Final status: $finalStatus"
Write-Host "Failures: $failCount; Warnings: $warnCount"

if ($RequireReady -and $finalStatus -ne 'PASS') {
    throw "Domain cutover is not ready. See report: $reportPath"
}
