# Windows Event Log Collector for NAZAR

This PowerShell script runs a lightweight HTTP server on your Windows endpoint that exposes Windows Event Viewer logs as a JSON API. NAZAR's endpoint monitoring connects to this API to collect security events.

## Quick Start

1. Open PowerShell **as Administrator** on the Windows machine you want to monitor
2. Copy the script below and save it as `NazarEventCollector.ps1`
3. Run: `powershell -ExecutionPolicy Bypass -File NazarEventCollector.ps1`
4. In NAZAR Admin → Endpoints, add the endpoint with:
   - **Log Source**: `Windows Event API`
   - **API URL**: `http://<this-machine-ip>:5000/events`

## PowerShell Script

```powershell
# NazarEventCollector.ps1 — Windows Event Log HTTP API for NAZAR
# Run as Administrator

param(
    [int]$Port = 5000,
    [int]$MaxEvents = 100,
    [int]$HoursBack = 24,
    [string]$ApiKey = ""  # Optional: set a key for auth
)

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://+:$Port/")
$listener.Start()

Write-Host "NAZAR Event Collector running on port $Port" -ForegroundColor Green
Write-Host "API endpoint: http://$(hostname):$Port/events" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow

function Get-SecurityEvents {
    param([int]$Hours, [int]$Max)
    
    $startTime = (Get-Date).AddHours(-$Hours)
    $events = @()
    
    # Collect from Security, System, and Application logs
    $logNames = @("Security", "System", "Application")
    
    foreach ($logName in $logNames) {
        try {
            $logEvents = Get-WinEvent -FilterHashtable @{
                LogName   = $logName
                StartTime = $startTime
            } -MaxEvents ([Math]::Floor($Max / 3)) -ErrorAction SilentlyContinue
            
            foreach ($evt in $logEvents) {
                $events += @{
                    EventID     = $evt.Id
                    Level       = $evt.Level
                    LevelName   = $evt.LevelDisplayName
                    Source      = $evt.ProviderName
                    LogName     = $logName
                    TimeCreated = $evt.TimeCreated.ToString("o")
                    Message     = if ($evt.Message.Length -gt 500) { $evt.Message.Substring(0, 500) + "..." } else { $evt.Message }
                    MachineName = $evt.MachineName
                    UserId      = if ($evt.UserId) { $evt.UserId.Value } else { $null }
                }
            }
        }
        catch {
            Write-Warning "Could not read $logName log: $_"
        }
    }
    
    # Also check Windows Defender logs
    try {
        $defenderEvents = Get-WinEvent -FilterHashtable @{
            LogName   = "Microsoft-Windows-Windows Defender/Operational"
            StartTime = $startTime
        } -MaxEvents 20 -ErrorAction SilentlyContinue
        
        foreach ($evt in $defenderEvents) {
            $events += @{
                EventID     = $evt.Id
                Level       = $evt.Level
                LevelName   = $evt.LevelDisplayName
                Source      = "Windows Defender"
                LogName     = "Defender"
                TimeCreated = $evt.TimeCreated.ToString("o")
                Message     = if ($evt.Message.Length -gt 500) { $evt.Message.Substring(0, 500) + "..." } else { $evt.Message }
                MachineName = $evt.MachineName
                UserId      = $null
            }
        }
    }
    catch {
        # Defender log may not exist
    }
    
    # Sort by time descending and limit
    $events = $events | Sort-Object { [DateTime]$_.TimeCreated } -Descending | Select-Object -First $Max
    
    return $events
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        # CORS headers
        $response.Headers.Add("Access-Control-Allow-Origin", "*")
        $response.Headers.Add("Access-Control-Allow-Headers", "Authorization, Content-Type")
        
        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 200
            $response.Close()
            continue
        }
        
        # Optional auth check
        if ($ApiKey -and $ApiKey -ne "") {
            $authHeader = $request.Headers["Authorization"]
            if ($authHeader -ne "Bearer $ApiKey") {
                $response.StatusCode = 401
                $errorBytes = [System.Text.Encoding]::UTF8.GetBytes('{"error":"Unauthorized"}')
                $response.ContentType = "application/json"
                $response.OutputStream.Write($errorBytes, 0, $errorBytes.Length)
                $response.Close()
                continue
            }
        }
        
        $path = $request.Url.AbsolutePath
        
        if ($path -eq "/events" -or $path -eq "/") {
            $events = Get-SecurityEvents -Hours $HoursBack -Max $MaxEvents
            $jsonBody = @{ events = $events; hostname = $env:COMPUTERNAME; collected_at = (Get-Date).ToString("o") } | ConvertTo-Json -Depth 5
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($jsonBody)
            $response.ContentType = "application/json"
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            
            Write-Host "$(Get-Date -Format 'HH:mm:ss') - Served $($events.Count) events to $($request.RemoteEndPoint)" -ForegroundColor Gray
        }
        elseif ($path -eq "/health") {
            $health = '{"status":"ok","hostname":"' + $env:COMPUTERNAME + '"}'
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($health)
            $response.ContentType = "application/json"
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        }
        else {
            $response.StatusCode = 404
            $buffer = [System.Text.Encoding]::UTF8.GetBytes('{"error":"Not found. Use /events or /health"}')
            $response.ContentType = "application/json"
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        }
        
        $response.Close()
    }
    catch {
        Write-Warning "Error: $_"
    }
}
```

## Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| `-Port` | 5000 | HTTP port to listen on |
| `-MaxEvents` | 100 | Maximum events to return per request |
| `-HoursBack` | 24 | How far back to look for events |
| `-ApiKey` | (none) | Optional Bearer token for authentication |

### Examples

```powershell
# Basic usage
.\NazarEventCollector.ps1

# Custom port with API key
.\NazarEventCollector.ps1 -Port 8080 -ApiKey "my-secret-key-123"

# Last 48 hours, max 200 events
.\NazarEventCollector.ps1 -HoursBack 48 -MaxEvents 200
```

## Windows Firewall

You may need to allow inbound connections on the port:

```powershell
New-NetFirewallRule -DisplayName "NAZAR Event Collector" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow
```

## Run as a Service (Optional)

To run automatically on startup, create a scheduled task:

```powershell
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File C:\NAZAR\NazarEventCollector.ps1"
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
Register-ScheduledTask -TaskName "NAZAR Event Collector" -Action $action -Trigger $trigger -Principal $principal -Description "NAZAR endpoint monitoring agent"
```

## Security Considerations

- Run as Administrator to access Security event logs
- Use the `-ApiKey` parameter in production to prevent unauthorized access
- Configure the API Key in NAZAR Admin → Endpoints → API Key field
- Only expose on your internal network — do NOT expose to the internet
- The script is read-only — it only reads event logs, never modifies them

## What Gets Collected

| Event Source | Event IDs | Description |
|---|---|---|
| Security | 4625 | Failed login attempts |
| Security | 4624 | Successful logins |
| Security | 4720, 4726 | User account created/deleted |
| Security | 4732, 4735 | Security group changes |
| Security | 4740 | Account lockouts |
| Security | 1102 | Audit log cleared |
| System | 7045 | New service installed |
| System | 20001 | USB device connected |
| Defender | 1116, 1117 | Malware detected/action taken |
| Application | Various | Application errors and warnings |
