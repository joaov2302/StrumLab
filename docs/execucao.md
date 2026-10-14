# Estado real da implementação

Data: 14/10/2026. Estado atual: **Fases 1–3 validadas localmente**.
Stack e protótipo local de usuário único confirmados; continuação para biblioteca/editor
autorizada pelo usuário após a entrega da fundação. Registros abaixo preservam o
histórico; a seção Fase 3 apresenta o gate atual.

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

## Entrega da Fase 3 — cancioneiros, prévia e PDF

Autorização: usuário pediu continuidade após a Fase 2 e indicação do gate 3.
Foram lidos prompt 03, regras, roadmap/decisões, modelos, cancioneiros, testes e
contratos visuais. Aplicada a skill PDF para comparação, renderização e inspeção.
Nenhum conteúdo do PDF editorial de referência foi copiado.

- Spike documentado antes de selecionar o motor: PDFKit versus Chromium sobre
  trinta músicas autorais/sintéticas, A4, 1/2 colunas, índice real e Unicode.
- Migration V3: Songbook, SongbookItem e SongbookExport; revisão pertencente à
  música por FK composta; posição única adiável; manifesto e PDFs completos protegidos
  por trigger contra alteração/exclusão.
- Biblioteca de livros com criação, busca/paginação, renomear, arquivar/reabrir.
- Montagem com revisão selecionada/fixada, reordenação drag/botões, duplicação
  explícita, remoção e notas. Atualização de revisão exige ação seletiva por item.
- Capa opcional com título/subtítulo/organizador e imagem local autorizada declarada;
  PNG/JPEG validado por formato real, dimensões e decodificação.
- Layout A4 retrato, Noto Sans/Serif, margem/fonte/espaçamento e 1/2 colunas.
  Fontes oficiais com commits, hashes e licenças OFL-1.1 versionados; glyphs de
  símbolos/emoji com fallback monocromático e erro explícito se ausentes.
- PDFKit renderiza no servidor Next.js, com paginação explícita e índice reconciliado.
  Manifesto, hash, arquivo/índice/páginas e SHA-256 ficam no PostgreSQL privado.
- Prévia PDF.js dos mesmos bytes do download, com páginas, zoom, índice navegável,
  texto extraído e identificação da exportação. Edição do livro invalida a prévia atual;
  PDFs anteriores permanecem rotulados como históricos.
- Lease e chave única do manifesto permitem repetição segura após falha sem
  exportações duplicadas. O navegador não recebe lease e não acessa endpoint result.
- Listagem de históricos busca só metadados, evitando ler blobs PDF de todos os livros.

### Validações da Fase 3

| Verificação | Resultado |
|---|---|
| Maven Wrapper verify | 16 unitários + 8 integrações aprovados, PostgreSQL separado |
| Migration V3 | Aplicada/validada no banco de testes e principal; dados anteriores preservados |
| Itens | Uma música em dois livros; ordem persiste; revisão continua fixada; atualização seletiva |
| Integridade | Reordenação rejeita itens repetidos e versão antiga; FK de música/revisão correta |
| Ownership | Livro e revisão de outro workspace negados; livro vazio não exporta |
| Snapshot/export | Manifesto/bytes completos imutáveis; lease/retry/idempotência; histórico não muda |
| Vitest | 25 testes aprovados, incluindo plano A4/índice/limites, determinismo lógico e glyphs |
| Playwright | 10 cenários aprovados no build de produção, sem skips; fluxo PDF e falha/retry |
| Bytes PDF | Download e arquivo persistido com mesmo SHA-256; prévia usa esse arquivo |
| Spike | Quatro PDFs, trinta músicas, 40/37 páginas no protótipo 1/2 colunas; índice e Unicode verificados |
| PDF final de QA | Quatro páginas, capa com PNG próprio, música longa em 2 colunas, acentos/setas/emoji |
| Render/inspeção | pypdf/PyMuPDF e Poppler pdfinfo/pdftoppm; PNGs de capa e páginas musicais inspecionadas |
| UI | Montagem/prévia em 360/390/1440 px, sem overflow ou erros JavaScript |
| Lint/typecheck/build | Aprovados; worker de terceiros gerado excluído do lint |
| Auditoria npm produção | Zero vulnerabilidades |

Total: **59 testes automatizados** (24 Java, 25 Vitest, 10 Playwright). Cenário de
recuperação do health usa simulação; jornadas de livros usam API e PostgreSQL reais.
Fixtures de biblioteca/cancioneiro/PDF usadas somente em strumlab_test, com API/Next
temporários em 8081/3002. Serviços temporários encerrados; principais 8080/3000 ativados.
Evidências intermediárias permanecem em `.cache/`, fora do Git.

Ocorrências de ambiente: Python/pip teve conexão interrompida; wheels oficiais foram
baixados via Node e instalados na pasta de QA do workspace. Poppler portátil foi
instalado nessa mesma área para renderização, sem instalação global. Um check de
índice foi ajustado para normalizar quebras de título; era comparação textual de
texto extraído, sem erro de paginação. Tipo de OpenTypeFeatures corrigido conforme
namespace das definições PDFKit. Lint passou a ignorar apenas worker minificado copiado
da dependência, mantendo as verificações nos arquivos autorais.

### Limitações e próximo gate

CI atualizado mas não executado remotamente; nenhum commit/push, contratação ou deploy.
Aplicação local, sem identidade pública. Não há PDF/UA/tagging nem auditoria integral
de leitor de tela, Firefox/Safari ou impressão física. Categorias e paisagem não foram
ativadas; PDF começa cada item numa página própria. Preview não tem miniaturas/editor
WYSIWYG. Limites locais e detalhes em [cancioneiros.md](cancioneiros.md), escolha do motor
em [pdf-spike.md](pdf-spike.md). Alertas dev de lint da Fase 1 permanecem registrados.

Próximo gate: **Fase 4 — biblioteca de batidas**, com samples reais de violão e suas
fontes/licenças verificadas, além de metrônomo/player/sincronização. Nenhum áudio,
sample de terceiros, análise musical ou integração foi implementado nesta fase.
