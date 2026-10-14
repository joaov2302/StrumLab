. "$PSScriptRoot/load-env.ps1"
Push-Location $projectRoot
try {
    $exists = & docker compose --env-file .env -f infra/compose.yaml exec -T postgres psql -U $env:POSTGRES_USER -d $env:POSTGRES_DB -tAc "SELECT 1 FROM pg_database WHERE datname='strumlab_test'"
    if ($LASTEXITCODE -ne 0) { throw 'Inicie o PostgreSQL local antes de preparar os testes.' }
    if (([string]$exists).Trim() -ne '1') {
        & docker compose --env-file .env -f infra/compose.yaml exec -T postgres createdb -U $env:POSTGRES_USER strumlab_test
        if ($LASTEXITCODE -ne 0) { throw 'Falha ao criar banco de testes separado.' }
    }
} finally { Pop-Location }
