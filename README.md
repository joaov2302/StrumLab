# StrumLab

Da música ao seu cancioneiro. Fundação local em Next.js/TypeScript, Java 21/Spring Boot
e PostgreSQL. O escopo atual é a **Fase 1**: navegação, API, migrations e health real.
Cifras, livros, áudio e integrações serão implementados nas fases correspondentes.

## Executar localmente

Requisitos: Node.js 24, Java 21 e Docker Desktop com engine Linux ativo.
O Maven Wrapper está versionado; não é preciso instalar Maven globalmente.
No PowerShell use `npm.cmd` para evitar a política de execução de `npm.ps1`.

```powershell
node scripts/init-env.mjs
npm.cmd ci
docker compose --env-file .env -f infra/compose.yaml up -d --wait
```

Em outro terminal, inicie a API:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-api.ps1
```

Depois inicie o frontend:

```powershell
$env:DEBUG = $null # evita flags de debug herdadas de outras ferramentas
npm.cmd run dev
```

Abra http://127.0.0.1:3000. A página inicial verifica API e PostgreSQL pelo proxy
`/api/health`. A API Java atende em http://127.0.0.1:8080/api/v1/health.
O banco fica em `127.0.0.1:5433`. A senha aleatória fica em `.env`, ignorado pelo Git.
Não exponha esse protótipo na rede ou publique bibliotecas sem autenticação.

## Verificar

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-api.ps1
npm.cmd exec --workspace apps/web -- playwright install chromium
$env:LIVE_API = '1'
$env:EXTERNAL_WEB = '1' # frontend ja iniciado em outro terminal
npm.cmd run test:e2e
```

`test-api.ps1` requer PostgreSQL iniciado: `verify` inclui integração e migrations reais.
No Windows, encerre a API antes de `verify` se estiver executando o JAR de `target/`;
o sistema bloqueia a substituição de arquivos abertos. O comando `start-api.ps1`
usa classes de desenvolvimento e evita esse bloqueio.
`LIVE_API=1` habilita a jornada navegador → Next.js → Java → PostgreSQL;
sem essa variável, somente esse teste é pulado. Os demais testes de navegador
verificam navegação, responsividade e recuperação de falha com respostas simuladas.

Contrato: [OpenAPI](packages/contracts/openapi.yaml). Gere os tipos ao alterar o contrato:

```powershell
npm.cmd exec --workspace apps/web -- openapi-typescript ../../packages/contracts/openapi.yaml -o src/lib/api.generated.ts
```

Pare o PostgreSQL com `docker compose --env-file .env -f infra/compose.yaml stop`;
os dados permanecem no volume. API e frontend encerram com Ctrl+C.

## Fontes e estado

- [Documentação normativa v1.1](StrumLab-documentacao-v1.1/README.md)
- [Decisões e confirmação da stack](StrumLab-documentacao-v1.1/docs/12-decisoes.md)
- [Estado real, evidências e limitações](docs/execucao.md)
- [Prompt da Fase 1](StrumLab-documentacao-v1.1/prompts/01-fase-1-fundacao.md)
