$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $projectRoot '.env'
if (!(Test-Path -LiteralPath $envFile)) { throw 'Execute node scripts/init-env.mjs primeiro.' }
foreach ($line in Get-Content -LiteralPath $envFile -Encoding UTF8) {
    if ($line -match '^([A-Z][A-Z0-9_]*)=(.*)$') {
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
    }
}
