<#
.SYNOPSIS
    Mehregan Clinic - Windows Local Legacy SQL Server Connector & Synchronizer
    Connects to dam2000 (Vaccinations & Pet Files) and Parsian1405 (Financial & Accounting) via OLE DB on ncase3.

.DESCRIPTION
    Runs on local Windows environment at the clinic.
    Uses OLE DB (SQLOLEDB.1) or ADO.NET to query legacy databases on host 'ncase3'.

    Connection Strings:
    - dam2000:    Provider=SQLOLEDB.1;Persist Security Info=False;User ID=sa;Initial Catalog=dam2000;Data Source=ncase3;
    - Parsian1405: Provider=SQLOLEDB.1;Persist Security Info=False;User ID=sa;Initial Catalog=Parsian1405;Data Source=ncase3;
#>

param (
    [string]$DamConnectionString = "Provider=SQLOLEDB.1;Persist Security Info=False;User ID=sa;Initial Catalog=dam2000;Data Source=ncase3;",
    [string]$ParsianConnectionString = "Provider=SQLOLEDB.1;Persist Security Info=False;User ID=sa;Initial Catalog=Parsian1405;Data Source=ncase3;",
    [string]$SaPassword = "",
    [string]$Action = "Test",  # Test | ExtractDam2000 | ExtractParsian | SyncAll
    [string]$ApiEndpoint = "http://localhost:3000/api/legacy-db/import"
)

# Output encoding for Persian UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "   Mehregan Veterinary Clinic - Legacy SQL Server Bridge" -ForegroundColor Green
Write-Host "   Target Host: ncase3 | Databases: dam2000 & Parsian1405" -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Cyan

# Append password if supplied
if ($SaPassword -ne "") {
    if (-not ($DamConnectionString -match "Password=")) {
        $DamConnectionString = $DamConnectionString.TrimEnd(';') + ";Password=$SaPassword;"
    }
    if (-not ($ParsianConnectionString -match "Password=")) {
        $ParsianConnectionString = $ParsianConnectionString.TrimEnd(';') + ";Password=$SaPassword;"
    }
}

function Test-OleDbConnection {
    param (
        [string]$ConnStr,
        [string]$DbLabel
    )

    Write-Host "`n[Testing OLE DB Connection] -> $DbLabel..." -ForegroundColor Cyan
    Write-Host "ConnectionString: $ConnStr" -ForegroundColor DarkGray

    $conn = $null
    try {
        # First attempt: OLE DB (SQLOLEDB.1)
        $conn = New-Object System.Data.OleDb.OleDbConnection($ConnStr)
        $conn.Open()
        Write-Host "✓ OLE DB connection successful to $DbLabel!" -ForegroundColor Green

        $cmd = $conn.CreateCommand()
        $cmd.CommandText = "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE'"
        $tableCount = $cmd.ExecuteScalar()
        Write-Host "  Found $tableCount user tables in database." -ForegroundColor Yellow

        $conn.Close()
        return @{ Success = $true; TableCount = $tableCount; Error = $null; Provider = "SQLOLEDB.1" }
    }
    catch {
        $oleError = $_.Exception.Message
        Write-Host "  OLE DB Warning: $oleError" -ForegroundColor Yellow
        Write-Host "  Falling back to System.Data.SqlClient (ADO.NET Direct)..." -ForegroundColor Gray

        # Fallback: Parse into SqlClient connection string
        try {
            # Extract Data Source, Initial Catalog, User ID
            $dataSource = "ncase3"
            $initialCatalog = "master"
            $userId = "sa"

            if ($ConnStr -match "Data Source=([^;]+)") { $dataSource = $matches[1] }
            if ($ConnStr -match "Initial Catalog=([^;]+)") { $initialCatalog = $matches[1] }
            if ($ConnStr -match "User ID=([^;]+)") { $userId = $matches[1] }

            $sqlClientStr = "Server=$dataSource;Database=$initialCatalog;User Id=$userId;"
            if ($SaPassword -ne "") {
                $sqlClientStr += "Password=$SaPassword;"
            } else {
                $sqlClientStr += "Integrated Security=False;"
            }

            $sqlConn = New-Object System.Data.SqlClient.SqlConnection($sqlClientStr)
            $sqlConn.Open()
            Write-Host "✓ SqlClient connection successful to $DbLabel!" -ForegroundColor Green

            $cmd = $sqlConn.CreateCommand()
            $cmd.CommandText = "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE'"
            $tableCount = $cmd.ExecuteScalar()
            Write-Host "  Found $tableCount user tables in database." -ForegroundColor Yellow

            $sqlConn.Close()
            return @{ Success = $true; TableCount = $tableCount; Error = $null; Provider = "SqlClient" }
        }
        catch {
            $sqlError = $_.Exception.Message
            Write-Host "✗ Connection failed to $DbLabel: $sqlError" -ForegroundColor Red
            return @{ Success = $false; TableCount = 0; Error = $sqlError; Provider = "Failed" }
        }
    }
    finally {
        if ($conn -and $conn.State -eq 'Open') { $conn.Close() }
    }
}

# Run diagnostics
$resDam = Test-OleDbConnection -ConnStr $DamConnectionString -DbLabel "dam2000 (واکسیناسیون و پرونده‌ها)"
$resParsian = Test-OleDbConnection -ConnStr $ParsianConnectionString -DbLabel "Parsian1405 (سیستم مالی و حسابداری پارسیان)"

$summaryResult = @{
    Timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    Host = "ncase3"
    Dam2000 = @{
        Role = "واکسیناسیون و پرونده‌ها"
        Catalog = "dam2000"
        Connected = $resDam.Success
        TableCount = $resDam.TableCount
        Error = $resDam.Error
    }
    Parsian1405 = @{
        Role = "سیستم مالی و فاکتورها"
        Catalog = "Parsian1405"
        Connected = $resParsian.Success
        TableCount = $resParsian.TableCount
        Error = $resParsian.Error
    }
}

$jsonOutput = $summaryResult | ConvertTo-Json -Depth 4
Write-Host "`n--- Diagnostic Result Summary ---" -ForegroundColor Green
Write-Host $jsonOutput

# If invoked by Clinic API or asked to sync
if ($Action -eq "SyncAll" -or $Action -eq "ExtractDam2000") {
    Write-Host "`nStarting Data Extraction Pipeline to Mehregan Clinic..." -ForegroundColor Cyan
    # Send result to local clinic API
    try {
        $response = Invoke-RestMethod -Uri $ApiEndpoint -Method Post -Body $jsonOutput -ContentType "application/json; charset=utf-8"
        Write-Host "✓ Bridge synchronization response from Clinic API: $($response.message)" -ForegroundColor Green
    }
    catch {
        Write-Host "Note: Clinic local server not reachable on $ApiEndpoint (Run npm run dev first)." -ForegroundColor Gray
    }
}

Write-Host "`nExecution completed." -ForegroundColor Green
