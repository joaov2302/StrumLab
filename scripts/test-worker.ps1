. "$PSScriptRoot/load-env.ps1"
Push-Location $projectRoot
try {
    docker compose --env-file .env -f infra/compose.yaml --profile analysis run --rm --no-deps -e POSTGRES_DB=strumlab_test -e RUN_DB_TESTS=1 analysis-worker python -m unittest -v test_analysis
    if ($LASTEXITCODE -ne 0) { throw 'Validacao do worker falhou.' }
} finally { Pop-Location }
