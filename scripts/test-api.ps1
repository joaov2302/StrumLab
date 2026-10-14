. "$PSScriptRoot/load-env.ps1"
$env:DEBUG = 'false'
Push-Location (Join-Path $projectRoot 'apps/api')
try {
    $env:MAVEN_USER_HOME = Join-Path $projectRoot '.cache/maven-user'
    & ./mvnw.cmd -B -ntp "-Dmaven.repo.local=$projectRoot/.cache/m2" verify
    if ($LASTEXITCODE -ne 0) { throw 'Validacao da API falhou.' }
} finally { Pop-Location }
