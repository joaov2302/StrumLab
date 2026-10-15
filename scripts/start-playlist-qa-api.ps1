$ErrorActionPreference = 'Stop'
. "$PSScriptRoot/load-qa-env.ps1"
$env:DEBUG = 'false'
$env:MAVEN_USER_HOME = Join-Path $projectRoot '.cache/maven-user'
$qaClasspathFile = Join-Path $projectRoot '.cache/phase6/test-classpath.txt'
New-Item -ItemType Directory -Force (Split-Path $qaClasspathFile) | Out-Null
Push-Location $projectRoot
try {
    & ./apps/api/mvnw.cmd -B -ntp -f apps/api/pom.xml "-Dmaven.repo.local=$projectRoot/.cache/m2" test-compile dependency:build-classpath "-Dmdep.outputFile=$qaClasspathFile" -DincludeScope=test
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao preparar API de QA.' }
    $qaDependencies = (Get-Content -Raw -LiteralPath $qaClasspathFile).Trim()
    $qaClasspath = "$projectRoot/apps/api/target/test-classes;$projectRoot/apps/api/target/classes;$qaDependencies"
    java -cp $qaClasspath br.com.strumlab.playlists.SpotifyE2EServer --server.port=8081
    if ($LASTEXITCODE -ne 0) { throw 'API de QA encerrada com erro.' }
} finally { Pop-Location }
