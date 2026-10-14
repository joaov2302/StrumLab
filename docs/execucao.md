# Estado real da implementação

Data: 14/10/2026. Estado atual: **Fases 1 e 2 validadas localmente**.
Stack e protótipo local de usuário único confirmados; continuação para biblioteca/editor
autorizada pelo usuário após a entrega da fundação. Registros abaixo preservam o
histórico; a seção Fase 2 apresenta o gate atual.

## Análise inicial

O repositório tinha README, licença e pacote documental com galeria de mockups;
nenhuma aplicação, dependência, migration ou teste de produto existia.
Foram lidos README/AGENTS, visão, requisitos, arquitetura, modelo de dados,
roadmap, decisões, testes, DESIGN, telas, contratos complementares e validação visual.
Fonte normativa preservada em `StrumLab-documentacao-v1.1/`; prompts operacionais
seguem essa especificação. A Fase 1 precede biblioteca/editor, livros e áudio.

## Entrega da Fase 1

- `apps/web`: Next.js 16.4.0, React 19.3.0 e TypeScript; shell Papel & Cordas,
  navegação Início/Músicas/Cancioneiros/Batidas/Preferências, foco, skip link,
  layout móvel e redução de movimento conforme sistema.
- Rotas de fases posteriores exibem somente estados de preparação, sem catálogo,
  estatísticas simuladas, criação, áudio, exportação ou ações falsas.
- `apps/api`: Java 21, Spring Boot 4.1.1, JDBC/Flyway e Spring Security;
  somente GET `/api/v1/health` permitido; demais endpoints negados.
  Login público indisponível e sem usuário/senha padrão gerados pelo framework.
- Health consulta a tabela migrada; falha de banco/workspace retorna 503 sem
  detalhes internos. Frontend usa proxy same-origin com timeout e contrato validado.
- `infra/compose.yaml`: PostgreSQL 17.6, healthcheck e volume local persistente.
- Migration V1 cria apenas workspace sintético local. Nenhuma entidade musical
  ou módulo de fase futura foi criado.
- `packages/contracts/openapi.yaml`: contrato versionado e tipos TypeScript gerados.
- Maven Wrapper, lockfile npm, `.env.example`, inicialização com senha aleatória,
  scripts PowerShell, README operacional e workflow GitHub Actions.

## Evidências e critérios

| Verificação | Resultado local |
|---|---|
| Docker Compose up com wait | PostgreSQL saudável em 127.0.0.1:5433 |
| Maven Wrapper verify | Build da API, 3 testes unitários e 2 testes de integração aprovados |
| Flyway V1 | Aplicada em banco inicialmente vazio; reexecução valida schema sem duplicar migration |
| Segurança HTTP | GET de músicas e actuator negados com 403 |
| ESLint | Aprovado |
| TypeScript | Aprovado |
| Vitest | 8 testes aprovados: contrato, formato inválido, resposta 503 e banco indisponível |
| Next.js build | Build otimizado e rotas geradas |
| Build em execução | Smoke test com next start: navegação, health real e ausência de erros JavaScript no navegador |
| Playwright | 5 cenários aprovados, incluindo jornada com API e PostgreSQL reais |
| Responsividade/teclado | Rotas em 360/390/1440 px, sem overflow horizontal; skip link e foco verificados |
| Inspeção visual | Capturas reais desktop e celular inspecionadas; evidências locais em `.cache/` |
| Auditoria de produção npm | Zero vulnerabilidades com `npm audit --omit=dev` |
| Git | `.env`, caches, logs e artefatos de build ignorados; diff sem erros de whitespace |

Comandos reproduzíveis estão no README. Os testes de navegador de recuperação usam
respostas simuladas; somente o cenário `LIVE_API=1` testa os serviços reais.
Integração Java usa PostgreSQL real, não SQLite/H2. CI usa banco efêmero isolado.

## Ocorrências resolvidas no ambiente

- `npm.ps1` bloqueado pela política local: usado `npm.cmd`.
- Cache global npm restrito ao agente: usado `--cache .cache/npm` nas instalações.
- Docker Desktop instalado, mas inicialmente sem engine ativo: iniciado e validado.
- O gerador Spring retornou versão com sufixo `.RELEASE`; corrigida para a versão
  publicada no Maven Central (`4.1.1`).
- O compilador Java encontrou AccessDenied ao resolver JARs no sandbox Windows;
  compilação/testes executados com permissão ampliada, sem alterar a implementação.
- A primeira integração não carregou `.env` por política PowerShell; corrigida com
  scripts executados via `-ExecutionPolicy Bypass` apenas no processo.
- JAR em execução bloqueou repackage no Windows; encerrado antes da repetição.
- Limpeza automática do servidor E2E ficou aguardando no Windows; servidor
  temporário encerrado e adicionada opção `EXTERNAL_WEB=1` para frontend separado.
- A variável de ambiente herdada `DEBUG=release` ativava o modo de teste interno
  do Next.js e gerava recarregamentos contínuos no dev. Removida apenas do processo
  web; configuração E2E limpa DEBUG e README documenta o comando. Repetição final
  dos cinco cenários passou em 5,7 segundos, sem esperas de limpeza. CI foi configurado
  para executar E2E sobre `next start` após o build.

## Limitações e próximo gate ao encerrar a Fase 1

Fase 1 validada localmente. Workflow CI criado, mas não executado no GitHub nesta
sessão. Nenhum commit, push, deploy, serviço remoto ou contratação realizado.
QA em Chromium; Firefox/Safari, leitor de tela e auditoria WCAG integral não realizados.
PWA/offline e controles personalizados de leitura ainda não implementados.
Protótipo vinculado ao loopback; workspace fixo **não é autenticação** e não autoriza
hospedagem pública, contas ou armazenamento multiusuário.

Auditoria completa npm registrou cinco alertas altos derivados de `braces` na
cadeia `micromatch/fast-glob/eslint-config-next`, usada no desenvolvimento.
O registry não oferecia versão corrigida de braces; não foi aplicado downgrade
incompatível sugerido por `audit fix --force`. Auditoria de produção passou.
Reavaliar a cadeia de lint quando houver correção compatível.

Próximo trabalho: prompt `02-fase-2-biblioteca-editor.md`, após autorização da fase
e revisão das decisões pertinentes (ChordPro, revisões e modelo de ownership).
Não iniciar análise musical, samples, PDF ou playlists durante esse gate.

## Entrega da Fase 2 — biblioteca e editor

Autorização: pedido do usuário para continuar a implementação após indicar a Fase 2
como próximo passo. Sem alterações de stack, autenticação pública ou serviços remotos.

- Migration `V2__songs_and_revisions.sql`: Song, rascunho e revisões; constraints de
  vínculo à mesma música e trigger impedindo alterar/apagar revisões.
- API `songs`: criação, busca/paginação/filtros, edição de rascunho, publicação de
  revisão, restauração como nova revisão, arquivo/reabertura e transposição.
- Conteúdo canônico com seções, linhas e tokens de texto/acorde. Metadados, origem e
  declaração de direitos fazem parte do snapshot; nenhum conteúdo de terceiros obtido.
- Concorrência com lock da música e versão otimista do rascunho/revisão-base;
  respostas 409 estruturadas, sem sobrescrita silenciosa.
- Editor com entrada `[G]texto`, inserção de acorde no cursor, nomes/tipos, duplicação,
  ordem por botões, desfazer/refazer, capo independente, transposição e leitura.
- Autosave de rascunho controlado, estado de erro, comparação de conflito,
  recarga explícita ou cópia. Proteção contra perda durante operações assíncronas
  e aviso ao sair com alterações não salvas.
- Histórico e leitura de revisão específica; restauração cria N+1.
- Importação/download ChordPro básico, validação de diretivas desconhecidas;
  texto original preservado no formulário em caso de erro.
- Token privado Next.js → Java, Origin/Host de loopback e allowlist de endpoints;
  cliente não envia owner_id. Esse mecanismo não é autenticação de usuário.
- Inicialização de ambiente preserva senha existente e adiciona token; launcher web
  lê `.env` sem expor valores ao navegador. API parametrizável por porta/banco.
- Testes usam `strumlab_test`. Preparação automática cria o banco somente se ausente;
  banco pessoal `strumlab` não recebe fixtures de testes de biblioteca/editor.

### Validações da Fase 2

| Verificação | Resultado |
|---|---|
| Maven Wrapper verify | 16 testes unitários + 5 de integração aprovados; build da API |
| PostgreSQL separado | V1/V2 aplicadas; reexecução sem duplicação |
| Concorrência real | Duas publicações simultâneas: uma 200, outra 409; uma única revisão |
| Isolamento | Outro workspace retorna 404; consulta por título não revela seu conteúdo |
| Imutabilidade | UPDATE direto de revisão impedido pelo banco; histórico conserva snapshot |
| Música | Raiz/baixo, extensões, acidentes, 25 intervalos de round-trip e símbolos inválidos |
| Vitest | 20 testes aprovados: health, tokens, Unicode, âncoras/IDs e ChordPro |
| Playwright em build de produção | 8 cenários aprovados, sem skips; fluxo completo e conflito entre abas |
| Editor e leitor | Capturas 360/390/1440 px; sem overflow ou erros JavaScript |
| Inspeção visual | Editor desktop/celular e leitor celular inspecionados |
| Lint/typecheck/build | Aprovados |
| Auditoria npm de produção | Zero vulnerabilidades |

Total: **49 testes automatizados** (21 Java, 20 Vitest, 8 Playwright).
O teste de recuperação de health usa respostas simuladas; as jornadas de cifras
usam API Java e PostgreSQL reais, em serviços temporários 8081/3002. Serviços pessoais
permanecem 8080/3000. Evidências locais ficam em `.cache/`, ignorado pelo Git.

Ocorrências corrigidas durante QA: o Next normaliza a URL interna para localhost,
por isso o proxy compara Origin com Host HTTP validado, não com `nextUrl.origin`.
O teste Playwright passou a localizar textarea/select por papel e nome acessível;
`getByLabel` exato incluía valores/opções de controles envolvidos pelo label.
Também foi corrigida a inicialização da sessão ao navegar para a cópia de outra cifra,
e Músicas agora permanece selecionada nas rotas de editor/leitura.

### Limitações atuais e próximo gate

CI atualizado, não executado remotamente. Nenhum commit, push ou deploy nesta sessão.
Protótipo local; publicação multiusuário ainda exige identidade/autorização reais.
ChordPro limitado ao subset documentado; acordes fora da gramática são rejeitados.
Rascunho com erro permanece na memória; não há recuperação após fechamento forçado
ou armazenamento offline. O detalhe da música carrega o histórico completo;
paginação de revisões não foi implementada. QA em Chromium, sem auditoria WCAG
integral/leitor de tela/Firefox/Safari. Alertas de dependências de lint da Fase 1
continuam registrados; nenhuma vulnerabilidade de produção foi reportada.

Contrato e limites: [editor.md](editor.md). Próximo gate: **Fase 3 — Cancioneiros**,
com revisão do prompt 03 e spike do renderer de PDF antes de fixar tecnologia.
Livros, PDF, batidas e análise não foram antecipados nesta entrega.
