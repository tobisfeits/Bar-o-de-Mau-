$supabaseUrl = "https://ohrmdocmkmvsthdtjguh.supabase.co"
$supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ocm1kb2Nta212c3RoZHRqZ3VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNDkwNjMsImV4cCI6MjA4MTcyNTA2M30.6Uep5hSVM9nF4WH4-e8UOIY_WPnXsJszZ-m9eAl9oJQ"

$headers = @{
    "apikey"        = $supabaseKey
    "Authorization" = "Bearer $supabaseKey"
    "Content-Type"  = "application/json"
    "Prefer"        = "return=representation"
}

# 1. Fetch units
$unitsUrl = "$supabaseUrl/rest/v1/units?select=id,name"
$units = Invoke-RestMethod -Uri $unitsUrl -Headers $headers -Method Get

function Get-UnitId($name) {
    # Partial match
    $match = $units | Where-Object { $_.name -like "*$name*" }
    if ($match) { return $match[0].id }
    return $null
}

$epoch = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

$membersToAdd = @(
    @{ name = "MATEUS FERREIRA LOPES";            birth_date = "2011-06-14"; unit = "Barões" },
    @{ name = "PEDRO HENRIQUE APOLINÁRIO FEITOSA"; birth_date = "2009-11-29"; unit = "Barões" },
    @{ name = "NATASHA CASTRO RIOS MAIA";          birth_date = "2013-04-01"; unit = "Duquesas" }
)

$i = 0
foreach ($m in $membersToAdd) {
    $uid = Get-UnitId $m.unit
    if (-not $uid) {
        Write-Host "Unidade não encontrada para $($m.name): $($m.unit)"
        continue
    }

    $memberId = "m" + ($epoch + $i)
    $i++

    $body = @{
        id         = $memberId
        name       = $m.name
        unit_id    = $uid
        birth_date = $m.birth_date
        role       = "Desbravador"
        active     = $true
    } | ConvertTo-Json

    try {
        $res = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/members" -Headers $headers -Method Post -Body $body
        Write-Host "✅ Inserido: $($m.name) -> Unidade: $($m.unit) (ID: $memberId)"
    } catch {
        Write-Host "❌ Erro ao inserir $($m.name): $_"
        if ($_.Exception.Response) {
            $errStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errStream)
            Write-Host "Detalhes: " $reader.ReadToEnd()
        }
    }
}
