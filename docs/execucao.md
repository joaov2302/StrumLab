# Estado real da implementação

Data: 15/10/2026. Estado atual: **Fases 1–5 validadas localmente; Fase 6
implementada e validada em QA com Spotify sintético**. OAuth com conta real pendente.
Stack e protótipo local de usuário único confirmados; continuação para biblioteca/editor
autorizada pelo usuário após a entrega da fundação. Registros abaixo preservam o
histórico; a seção Fase 6 apresenta o gate atual.

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
| Launchers de QA | API/web iniciadas pelos scripts; health pelo proxy, ambiente e rótulo final conferidos |

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

## 14/10/2026 — Fase 4 — Biblioteca de batidas

Autorização explícita: “avance para a fase 4”. Entregue somente esse escopo,
preservando Fases 1–3 e a biblioteca pessoal. Catálogo Pop/Folk do exemplo normativo,
pesquisa/filtros, prática com grade/ganhos/loop/transporte/BPM/G-C-D-Em, vínculo por
música e snapshot seletivo de batida no cancioneiro/PDF. Migration Flyway V4, catálogo
imutável e vínculos com ownership/versão/lock. Renderer PDFKit A4 v2; históricos
concluídos continuam nos mesmos bytes. Contrato em [batidas.md](batidas.md).

### Licença e áudio real

FreePats Spanish classical guitar, Roberto, CC0-1.0, verificado no site e repositório
originais. Oito WAVs foram montados de 14 notas gravadas, sem pitch shifting, com
baixo/cima por ordem de cordas. A interface explicita a derivação; não afirma que
são gravações de batidas completas. Licença, README, SFZ, commit, URLs, data e hashes
preservados em public/audio/guitar. Rede só na preparação dos assets; app usa arquivos
locais. Falha permite tentar novamente ou praticar só com metrônomo provisório.

### Validações executadas

| Verificação | Resultado |
|---|---|
| `scripts/test-api.ps1` | 16 testes unitários + 11 de integração aprovados em PostgreSQL real separado |
| `npm.cmd test` | 35 testes Vitest aprovados; transporte/clock e PDF com batida 1/2 colunas |
| `npm.cmd run test:e2e` | 14 testes Playwright aprovados no build de produção, sem skips |
| Lint / typecheck / build | Aprovados |
| `node scripts/check-guitar.mjs` | 8 hashes/arquivos distintos, buffers decodificados, 8 cenários G/C/D/Em a 90/160 BPM, sem clipping |
| Aceite 90 BPM | 8 posições, inclusive silenciosas; 6 fontes de violão e 4 cliques no AudioContext real |
| Sincronização visual | Última execução: offsets absolutos de 13,66–14,93 ms em 7 transições; tolerância do teste 100 ms |
| Transporte/fallback | Pausa/retomada/BPM pendente/reinício/loop, fechamento do contexto, erro/retry e metrônomo provisório aprovados |
| Persistência | Aplicar/reabrir, snapshot 90→120 BPM seletivo, exportação histórica com bytes preservados; concorrência com um único vencedor |
| PDF | 3 páginas em 1 coluna + 6 em 2 colunas, notas longas/16 pt; Unicode, índice, bounds e SHA verificados |
| Inspeção visual | Poppler PNGs de PDFs e screenshots de catálogo/prática em 360/390/1440 px; sem overflow/erros JavaScript |
| Segurança | Catálogo Java sem token retorna 403; Origin externo no vínculo retorna 403; guardas anteriores preservadas |
| Auditoria npm produção | Zero vulnerabilidades |

Total: **76 testes automatizados** (27 Java, 35 Vitest, 14 Playwright), além da QA
de assets/PDF. As três primeiras jornadas de áudio usam catálogo simulado com eventos
normativos e WAVs reais; a jornada de vínculo/livro usa API e PostgreSQL reais.
Fixtures de escrita somente em strumlab_test / 8081 / 3002; nenhum volume apagado.
Evidências intermediárias em `.cache/phase4`, ignoradas pelo Git.
Serviços temporários encerrados após QA; API/frontend principais atualizados em
8080/3000. Health/API/PostgreSQL, catálogo real e consultas à biblioteca conferidos
na instalação pessoal. Essa instalação não recebeu fixtures desta validação.

Ambiente medido: Windows, Chromium headless do Playwright, AudioContext com saída
emulada; não é audição humana em fones/caixas nem certificação de latência Bluetooth.
Offline mix nos ganhos padrão teve pico máximo 0,571 (abaixo de 1,0) nos cenários
testados. Testes de relógio simulam mudanças rápidas, cancelamento, pausa fracionária,
stall e reativação do loop na janela de lookahead.

Correções durante QA: fixture de outro dono passou a criar workspace válido antes
de mudar ownership; seletor de alerta foi limitado ao painel (o Next tem outro alert);
espera de slot transitório passou a usar rAF para não perder a colcheia entre polls.
Conversão de texto pela pipeline PowerShell foi corrigida, com releitura UTF-8,
asserts de legenda/setas e inspeção Poppler. Esses problemas foram resolvidos antes
da validação final; nenhuma falha de teste foi tratada como aprovação.

### Limites e próximo gate

Marco MVP manual Fases 1–4 disponível localmente. Autenticação pública, hospedagem,
Safari/Firefox, audição humana/dispositivos físicos, PDF/UA e auditoria integral de
leitor de tela não validados. Não há análise de áudio, playlist, gravação ou mudança
automática de acordes. CI atualizado mas não executado remotamente; sem push/deploy.
Próxima fase: **Fase 5 — análise assistida de áudio autorizado**, mediante solicitação.

## 15/10/2026 — Fase 5 — análise assistida de áudio

Continuação solicitada pelo usuário conforme a documentação. Código da Fase 5 já
existia no checkout, mas não tinha gate final nem registro operacional. A entrega
foi retomada nesse escopo; playlists/Fase 6 não foram iniciadas.

### Implementação conferida

- Migration V5: áudio privado, jobs, resultados imutáveis e aceite idempotente.
  Upload validado, quotas, deduplicação SHA-256, ownership e exclusão dos bytes
  sem perda de resultados/revisões anteriores.
- Worker Python 3.12/FFmpeg/librosa, fila persistida, SKIP LOCKED, leases,
  recuperação de interrupção, timeout e limite de tentativas. Container restrito,
  sem rede externa, com limites de memória/CPU/PIDs e temporários.
- Sugestões experimentais de BPM/tom/tríades; confiança e compasso ausentes (`null`).
  Timeline independente da letra; nenhuma extração de texto ou tablatura.
- Correção/seleção de sugestões e comparação com rascunho. Aprovação explícita
  cria `analysis_accepted`; conflito preserva correções locais. Reprocessar/excluir
  não modifica cifra, capo, revisões aceitas ou PDF histórico.

### Conclusão desta retomada

A falha E2E anterior esperava `attempts=2` em cinco segundos. Na repetição isolada,
o retry passou com a implementação existente; na suíte completa, sua jornada levou
dez segundos. A espera agora observa tentativa 2 e status final failed, com timeout
compatível com a fila. Reprocessamento exige nova geração/ID e conclusão, evitando
aceitar completed do job anterior. Não foi necessário mudar a lógica de retry.

Acrescentados testes de integridade antes do decoder e do ciclo de três tentativas
de asset inválido, seguido de atendimento de outro job. CI passou a construir,
testar e iniciar o worker e habilitar LIVE_ANALYSIS, com diagnóstico/limpeza.
Indicação lateral atualizada para Fase 5.

Novo `infra/compose.test.yaml`: projeto/volume exclusivos `strumlab-qa`, PostgreSQL
5434, API 8081 e web 3002. Scripts `test-api.ps1 -Isolated`, `start-api.ps1 -Isolated`
e `load-qa-env.ps1` não leem `.env` pessoal; `test-worker.ps1` usa esse banco exclusivo.
Nenhum dado de teste foi gravado no banco pessoal, nenhum volume pessoal foi apagado
e a instalação principal não foi migrada ou atualizada nesta retomada.

### Validações executadas

| Verificação | Resultado local |
|---|---|
| `test-api.ps1 -Isolated` | Maven verify: 16 unitários + 16 integrações aprovados, PostgreSQL separado |
| Migrations V1–V5 | Aplicadas em banco QA inicialmente vazio; reexecução validou schema |
| `test-worker.ps1` | Sete testes aprovados sem skips: MP3/WAV, silêncio, timestamps, leases, SKIP LOCKED, integridade e três tentativas |
| `npm.cmd test` | 35 testes Vitest aprovados |
| Playwright com LIVE_API/LIVE_ANALYSIS | 16 cenários aprovados sem skips sobre build de produção; suíte em 16,8 s |
| Jornada de análise real | Upload → worker → correção → conflito/recuperação → revisão 3 → reprocessamento → exclusão |
| Preservação/segurança | Texto/capo/tom não selecionado preservados, resultado separado, áudio no-store, Origin/cross-site negados |
| Lint / tipos / build | Aprovados |
| Auditoria npm de produção | Zero vulnerabilidades |
| Spike STFT/CQT | Reexecutado sem rede em cinco fixtures autorizadas |
| UI | Capturas desktop/celular inspecionadas; 360/390/1440 px sem overflow ou erros JavaScript |

Total: **90 testes automatizados** (32 Java, 35 Vitest, sete Python e 16 Playwright).
As duas jornadas de análise usam API/PostgreSQL/worker reais; permanecem cenários
simulados de recuperação de health e transporte de batidas das fases anteriores.
Evidências em `.cache/phase5/` e relatórios ignorados pelo Git.

No spike, CQT teve tom esperado em 5/5 e tríades com acurácia de 90,9–100%; STFT,
tom em 2/5 e tríades de 80–97%. BPM teve erro de 0,27–2,38%. CQT medido em
0,342–0,608 s após aquecimento; primeira análise STFT 10,638 s. Não é benchmark de
generalização ou comparação controlada de desempenho. Num worker novo, a primeira
jornada real levou 38,5 s, com primeiro processamento registrado em 27,94 s;
os tempos do spike não são SLA de upload/processamento.

Ocorrências resolvidas: Docker Desktop precisou ser iniciado; primeiro teste Python
antecedeu migrations e falhou por tabela ausente. Primeiro Java no ambiente novo
não tinha token; repetido com ambiente QA completo. JAR aberto bloqueou repackage
no Windows; API temporária encerrada e verify repetido com sucesso. Essas falhas
não foram contadas como aceite.

### Limites e próximo gate

Contrato, retenção, licenças e comandos: [analise-audio.md](analise-audio.md).
Baseline só reconhece tríades maiores/menores, sem confiança calibrada ou compasso;
não promete transcrição perfeita. Áudio fica até exclusão explícita; backups
anteriores seguem sua retenção externa. Sem storage remoto contratado.
Protótipo local sem autenticação pública. Chromium validado; Firefox, Safari,
leitor de tela e dispositivos físicos não certificados.

CI atualizado, não executado remotamente. Sem commit, push ou deploy.
Serviços temporários de QA encerrados ao final; volume de QA preservado.
Próximo gate: **Fase 6 — metadados autorizados de playlists**, mediante nova
solicitação e revisão de provedores/credenciais/termos. Não iniciada.

## 15/10/2026 — Fase 6 — playlists Spotify

Usuário autorizou a próxima fase, escolheu Spotify e cadastrou o aplicativo.
Client ID configurado apenas no `.env` ignorado pelo Git. Trabalho interrompido
para explicar o cadastro e retomado após pedido explícito de conclusão.
Não houve autorização da conta Spotify pelo agente nem acesso à playlist pessoal.

### Entrega

- V6: importação, itens/jobs isolados e seleção idempotente de exportação. V7:
  hash da conta vinculado ao workspace. Tokens/verifier somente em memória.
- API oficial `/playlists/{id}/items`, OAuth Authorization Code/PKCE, scopes de
  leitura, state de uso único vinculado a cookie HttpOnly, refresh após expiração
  e guardas locais de token/Host/Origin/cross-site. Callback limpa a URL sensível.
- Importação assíncrona, limite de 200 itens/20 playlists, ordem e duplicatas,
  conferência do snapshot, URLs oficiais fixas e limites de resposta/timeout.
  403/404/429 têm estado consultável; Retry-After impede repetição antecipada.
- Preparação por faixa sem criar conteúdo fictício: vincular revisão autorizada,
  copiar explicitamente para cifra independente, pular, cancelar ou repetir.
  Falha de uma faixa não impede preparar as demais. Conflitos retornam 409.
- Livro parcial com seleção de revisões fixadas em ordem; confirmação para omitir
  pendências e para repetir música. Transação e chave/payload idempotentes impedem
  duplicação após perda de resposta. Prévia/download usam o PDF persistido existente.
- Metadados Spotify permanecem separados de letra/acordes/áudio e do conteúdo PDF.
  Links e logo oficial atribuem a origem na UI, sem capas armazenadas.
- Trocar conta remove metadados anteriores; reconectar mesma conta preserva-os.
  Desconectar apaga tokens, vínculo e importações, preservando cifras/livros manuais.
  Limite técnico de retenção: 30 dias sem atividade; backups têm política própria.
- Nova navegação/telas de playlists, layout responsivo, estados de recuperação,
  busca paginada de cifras e confirmação de exclusão/desconexão.

### Evidências

| Verificação | Resultado local |
|---|---|
| Maven verify / `test-api.ps1 -Isolated` | 47 testes aprovados: 22 unitários + 25 integrações |
| Migrations | V6/V7 aplicadas no PostgreSQL de QA em 5434; validação de V1–V7 na reexecução |
| Novos casos Java | URL/SSRF, PKCE/binding/state repetido, refresh, paginação, null/duplicatas, 403/404/429, snapshot/limite, ownership, conflito, retry, cópia, conta e publicação após cancelamento |
| Vitest | 35 testes aprovados |
| Worker Python | Sete testes aprovados, sem skips, contra PostgreSQL de QA |
| Playwright | 18 cenários aprovados, sem skips, em 41,7 s, build de produção |
| Jornada de playlists | OAuth sintético → importar quatro itens em duas páginas → vincular duas posições → confirmar parcial/duplicata → livro/PDF → desconectar |
| Segurança E2E | Callback inválido/cross-site negados; payload de conexão sem tokens; revisão original preservada após exportação/desconexão |
| Lint / typecheck / build | Aprovados |
| Auditoria npm de produção | Zero vulnerabilidades |
| UI | 320/360/390/768/1024/1440 px sem overflow/erros JavaScript; capturas desktop/celular inspecionadas e skip link por teclado |

Total: **107 testes automatizados** (47 Java, 35 Vitest, sete Python, 18 Playwright).
Os dois cenários Spotify usam somente respostas sintéticas de um servidor HTTP
local, com API/PostgreSQL reais. Testes de áudio e regressão das fases anteriores
também passaram. O simulador não entra no JAR de produção e o launcher exige
`strumlab_test`. CI foi atualizado para esse mesmo fluxo, não executado remotamente.

Durante QA, a comparação JSON de uma chave de exportação tratava números Java
long e JSON integer como diferentes: corrigida por desserialização tipada do
payload. A caixa de seleção também revertia antes da resposta de gravação:
feedback imediato com rollback e suspensão de polling durante escrita resolveram
a jornada. Um seletor E2E encontrava o alert do roteador Next além do alerta do
produto; limitado ao main. Schedulers são desativados nos forks Maven de testes,
evitando disputa com fixtures; testes de worker invocam os jobs explicitamente.
Falhas intermediárias não foram contadas como aprovação.

Evidências locais ignoradas pelo Git em `.cache/phase6/`, além dos relatórios Maven
e Playwright. Banco/volume pessoal não receberam fixtures, migrations ou limpeza
nesta fase. Serviços temporários foram usados em 5434/8081/3002/8130.
API/simulador/frontend e containers de QA encerrados ao final, volume preservado.

### Limites e encerramento

Implementação concluída e validada no ambiente controlado. **Conexão e importação
com conta Spotify real continuam pendentes da autorização do usuário** e das
permissões/quota do aplicativo. Isso não foi tratado como teste real aprovado.
Uso atual depende de ser dono/colaborador da playlist; modo de desenvolvimento
tem requisitos do Spotify, documentados com fontes em [playlists.md](playlists.md).

Sem commit, push, deploy ou publicação de biblioteca. Sem validação remota do CI,
Firefox/Safari/leitor de tela integral. O protótipo continua restrito ao loopback;
não é autenticação pública. Nenhuma implementação da Fase 7 foi iniciada.
