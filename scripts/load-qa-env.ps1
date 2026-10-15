# Disposable, loopback-only QA credentials. Never load the personal .env here.
$projectRoot = Split-Path -Parent $PSScriptRoot
$env:DATABASE_URL = 'jdbc:postgresql://127.0.0.1:5434/strumlab_test'
$env:POSTGRES_USER = 'strumlab_test'
$env:POSTGRES_PASSWORD = 'qa-disposable-local-only'
$env:LOCAL_API_TOKEN = 'qa-local-api-token-disposable-000001'
$env:API_BASE_URL = 'http://127.0.0.1:8081'
$env:SPOTIFY_CLIENT_ID = ''
$env:SPOTIFY_REDIRECT_URI = 'http://127.0.0.1:3002/api/playlists/connection/callback'
