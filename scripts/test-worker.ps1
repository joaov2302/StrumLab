$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Push-Location $projectRoot
try {
    docker compose -f infra/compose.test.yaml run --build --rm --no-deps -e RUN_DB_TESTS=1 analysis-worker python -m unittest -v test_analysis
    if ($LASTEXITCODE -ne 0) { throw 'Validacao do worker falhou.' }
} finally { Pop-Location }
