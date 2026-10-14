. "$PSScriptRoot/load-env.ps1"
$env:DEBUG = 'false'
if (!$env:TEST_DATABASE_URL) { & "$PSScriptRoot/create-test-db.ps1" }
$env:DATABASE_URL = if ($env:TEST_DATABASE_URL) { $env:TEST_DATABASE_URL } else { 'jdbc:postgresql://127.0.0.1:5433/strumlab_test' }
Push-Location (Join-Path $projectRoot 'apps/api')
try {
    $env:MAVEN_USER_HOME = Join-Path $projectRoot '.cache/maven-user'
    & ./mvnw.cmd -B -ntp "-Dmaven.repo.local=$projectRoot/.cache/m2" verify
    if ($LASTEXITCODE -ne 0) { throw 'Validacao da API falhou.' }
} finally { Pop-Location }
