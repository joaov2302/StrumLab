$ErrorActionPreference = 'Stop'
. "$PSScriptRoot/load-qa-env.ps1"
$env:DEBUG = $null
Push-Location $projectRoot
try {
    node scripts/web.mjs start --port 3002
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao iniciar web de QA.' }
} finally { Pop-Location }
