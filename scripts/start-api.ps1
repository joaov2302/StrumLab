param([string]$DatabaseUrl, [int]$Port = 8080, [switch]$Isolated)
if ($Isolated) {
    if ($DatabaseUrl) { throw 'Nao combine Isolated com DatabaseUrl.' }
    . "$PSScriptRoot/load-qa-env.ps1"
    $ErrorActionPreference = 'Stop'
    if (!$PSBoundParameters.ContainsKey('Port')) { $Port = 8081 }
} else {
    . "$PSScriptRoot/load-env.ps1"
}
$env:DEBUG = 'false'
if ($DatabaseUrl) { $env:DATABASE_URL = $DatabaseUrl }
$env:SERVER_PORT = [string]$Port
Push-Location (Join-Path $projectRoot 'apps/api')
try {
    $env:MAVEN_USER_HOME = Join-Path $projectRoot '.cache/maven-user'
    & ./mvnw.cmd -B -ntp "-Dmaven.repo.local=$projectRoot/.cache/m2" spring-boot:run
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao iniciar API.' }
} finally { Pop-Location }
