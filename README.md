# StrumLab

Da música ao seu cancioneiro. Aplicação local em Next.js/TypeScript, Java 21/Spring Boot
e PostgreSQL. **Fases 1–4 implementadas:** fundação, biblioteca/editor, rascunhos,
revisões imutáveis, transposição, capo, ChordPro básico, cancioneiros com prévia/PDF
e prática Pop/Folk com samples licenciados, metrônomo e vínculo à cifra/PDF.
Análise de áudio e integrações ficam nas fases correspondentes.

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
O banco fica em `127.0.0.1:5433`. Senha e token privado aleatórios ficam em `.env`,
ignorado pelo Git. `scripts/web.mjs` carrega a configuração no processo Next.js;
o token não é enviado ao navegador. Ao atualizar uma instalação da Fase 1,
rode `node scripts/init-env.mjs` novamente para adicionar o token sem alterar a senha.
Fontes licenciadas do PDF ficam em `assets/fonts`. O launcher prepara o worker local
de PDF.js automaticamente; a exportação PDFKit não requer Chromium em runtime.
Não exponha esse protótipo na rede ou publique bibliotecas sem autenticação.

## Verificar

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-api.ps1
npm.cmd exec --workspace apps/web -- playwright install chromium
```

`test-api.ps1` requer PostgreSQL iniciado: cria `strumlab_test` se necessário e
executa `verify` nesse banco separado, com integração, concorrência e migrations reais.
`TEST_DATABASE_URL` permite usar outro banco de testes explicitamente configurado.
No Windows, encerre a API antes de `verify` se estiver executando o JAR de `target/`;
o sistema bloqueia a substituição de arquivos abertos. O comando `start-api.ps1`
usa classes de desenvolvimento e evita esse bloqueio.
Para E2E com escrita sem misturar fixtures à sua biblioteca, inicie uma segunda API
em outro terminal após `test-api.ps1`:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-api.ps1 -DatabaseUrl jdbc:postgresql://127.0.0.1:5433/strumlab_test -Port 8081
```

Inicie o build de frontend de testes em outro terminal:

```powershell
$env:API_BASE_URL = 'http://127.0.0.1:8081'
node scripts/web.mjs start --port 3002
```

Execute os testes em outro terminal:

```powershell
$env:LIVE_API = '1'
$env:EXTERNAL_WEB = '1'
$env:E2E_BASE_URL = 'http://127.0.0.1:3002'
npm.cmd run test:e2e
```

`LIVE_API=1` habilita health real e as jornadas de cifras com escrita. Sem a variável,
esses testes são pulados e permanecem navegação e recuperação simulada. CI usa banco
efêmero e build de produção; não depende de uma biblioteca pessoal existente.

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
- [Prompt da Fase 2](StrumLab-documentacao-v1.1/prompts/02-fase-2-biblioteca-editor.md)
- [Contrato do editor e limites locais](docs/editor.md)
- [Prompt da Fase 3](StrumLab-documentacao-v1.1/prompts/03-fase-3-cancioneiros.md)
- [Contrato dos cancioneiros](docs/cancioneiros.md)
- [Comparação dos motores de PDF](docs/pdf-spike.md)
- [Prompt da Fase 4](StrumLab-documentacao-v1.1/prompts/04-fase-4-batidas.md)
- [Contrato da prática e licença dos samples](docs/batidas.md)
