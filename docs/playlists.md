# Playlists Spotify — Fase 6

Integração local de metadados pela Web API oficial. Spotify foi escolhido pelo
usuário em 15/10/2026. Não há download de áudio, importação de letras, reprodução
Spotify, inferência de acordes pelos metadados ou envio de conteúdo Spotify ao
analisador. Áudio autorizado continua no fluxo separado da Fase 5.

## Conectar sua conta

Cadastre um aplicativo **Web API** no [Developer Dashboard](https://developer.spotify.com/dashboard).
O modo de desenvolvimento exige Premium para o dono do aplicativo e permite até
cinco usuários autorizados; outras contas precisam entrar na allowlist do aplicativo.
Confira os [requisitos atuais](https://developer.spotify.com/documentation/web-api/concepts/quota-modes).

Registre exatamente este callback para o frontend pessoal na porta 3000:

```text
http://127.0.0.1:3000/api/playlists/connection/callback
```

No `.env` local, ignorado pelo Git:

```dotenv
SPOTIFY_CLIENT_ID=client_id_do_seu_aplicativo
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/api/playlists/connection/callback
```

Não é necessário Client Secret: o fluxo usa [Authorization Code com PKCE](https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow).
O Client ID fornecido pelo usuário já foi configurado no ambiente pessoal desta
sessão; não está nos arquivos versionados. Reinicie a API depois de configurar.
Inicie API/web conforme README, abra `http://127.0.0.1:3000/importacoes`, use
**Conectar Spotify** e autorize a leitura na página oficial. Nunca forneça a senha
ao StrumLab. O callback usa IP explícito, conforme as [regras do Spotify](https://developer.spotify.com/documentation/web-api/concepts/redirect_uri).

A sessão é individual do protótipo local; não é login público ou autenticação
multiusuário do StrumLab. A conexão real depende da autorização da sua conta e dos
limites do aplicativo Spotify. Essa autorização não foi executada automaticamente.

## Importar e preparar

Cole `https://open.spotify.com/playlist/ID`; parâmetros de compartilhamento são
aceitos. Encurtadores, URLs de outros hosts e outras categorias são rejeitados.
O endpoint atual permite ler faixas somente de playlists das quais a conta é dona
ou colaboradora. Outras podem retornar 403, mesmo sendo públicas.
[Referência oficial](https://developer.spotify.com/documentation/web-api/reference/get-playlists-items).

O envio cria um job persistido e retorna imediatamente. Um worker Java agendado
lê metadados em segundo plano. Páginas de até 50 itens, ordem e duplicatas mantidas;
máximo local de 200 itens e 20 importações por biblioteca. O mesmo ID de playlist
reabre a importação existente. O snapshot é conferido antes/depois da leitura;
mudança durante a paginação exige nova tentativa, sem misturar posições.
Não são seguidos URLs `next` fornecidos pelo provedor: os offsets são construídos
para endpoints oficiais fixos. Respostas têm limite de tamanho/tempo.

Cada faixa tem seleção e estado próprios: `needs_input`, `pending`, `ready`,
`failed`, `skipped` ou `cancelled`. Item local, removido, episódio ou resposta vazia
fica indisponível sem cancelar os demais. Nenhuma música vazia é criada pela importação.

Para cada item, escolha uma revisão salva com conteúdo e direitos declarados:

- **Vincular e preparar:** reutiliza a revisão escolhida, sem modificá-la.
- **Copiar revisão e preparar:** cria uma cifra manual independente e salva a
  primeira revisão; preserva a original. Só copia conteúdo da sua biblioteca.
- **Pular/Cancelar faixa:** retira o item da seleção. Retry limitado a três
  tentativas por preparação; selecionar uma revisão novamente inicia uma nova
  preparação explícita. Sem conteúdo, retry volta a `needs_input`.
- Para criar conteúdo novo, abra a biblioteca em outra aba, salve uma revisão
  própria/autorizada e vincule-a. O link contextual de análise aceita um arquivo
  próprio para a música vinculada, sem acessar áudio Spotify.

Mudanças usam versão otimista. Conflitos retornam 409 e exigem recarregar; não há
mesclagem silenciosa. O botão de recarga preserva as escolhas de título/confirmacões
da tela. Revisões humanas e resultados de análise continuam separados.

## Cancioneiro e exportação parcial

**Criar cancioneiro** inclui somente itens selecionados e preparados, na ordem
original, com a revisão explicitamente escolhida. Pendências selecionadas exigem
confirmar sua omissão; uma mesma cifra em múltiplas posições exige permitir
repetições ou pular os itens duplicados. IDs de seleção repetidos são inválidos.

Título do livro é definido manualmente. PDF usa títulos, letras e acordes das
revisões próprias/autorizadas, sem copiar a lista de metadados Spotify para o PDF.
A criação é transacional e idempotente por chave + payload: repetir após perda
da resposta retorna o mesmo livro; reutilizar a chave com outra seleção retorna
409. A prévia/download seguem o renderer e os snapshots já validados na Fase 3.

## Autorização, retenção e falhas

- PKCE S256 e state aleatórios, com validade de dez minutos, uso único e vínculo
  a cookie HttpOnly/SameSite=Lax no navegador que iniciou a conexão.
- Tokens de acesso/refresh e verifier ficam somente na memória Java. O navegador
  não recebe tokens nem o token privado Next → Java. Callback remove código/state
  da URL por redirecionamento e envia no-store/no-referrer.
- Refresh automático e uma repetição após 401; falha de autorização pede reconectar.
  403/404/quota/timeouts têm estados consultáveis. 429 respeita Retry-After, sem
  loop de requisições. Retry de importação é explícito e limitado a três tentativas.
- Leases de 180 s protegem a leitura de metadados. Cancelamento/exclusão invalida
  o lease; respostas tardias não publicam. Jobs de faixa usam transações curtas,
  com SKIP LOCKED, e falhas não afetam os demais itens.
- Ao reiniciar a API, reconecte. Um hash vinculado ao workspace identifica se é a
  mesma conta: reconexão preserva importações dessa conta; mudança de conta remove
  metadados anteriores. O ID bruto e os tokens não são gravados no banco.
- **Excluir importação** remove seus metadados. **Desconectar e excluir importações**
  limpa tokens, estados OAuth, vínculo da conta e importações desse workspace.
  Cifras manuais/cópias e cancioneiros já preparados permanecem.
- Como limite técnico local, importações sem atividade expiram após 30 dias;
  reimporte quando necessário. Isso não apaga backups anteriores, cuja retenção
  é externa à aplicação.
- Metadados na UI têm links para Spotify e atribuição com logo oficial sem
  alteração; origem/hash em `apps/web/public/spotify/README.md`. Não são armazenadas
  capas. [Política](https://developer.spotify.com/policy) e
  [branding](https://developer.spotify.com/documentation/design) consultados na implementação.

## Testes reproduzíveis sem conta real

O simulador existe somente em `src/test/java`, fora do JAR de produção. Não há
variável de runtime que redirecione credenciais para outro host. O launcher de
testes recusa banco cujo nome não seja `strumlab_test`.

Ambiente: projeto/volume `strumlab-qa`, PostgreSQL 5434, API 8081, web 3002 e
Spotify sintético 8130. Não use o simulador para autorizar contas reais.
Pare serviços de QA existentes antes de repetir as integrações Java/Python.

```powershell
docker compose -f infra/compose.test.yaml stop analysis-worker
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-api.ps1 -Isolated
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-worker.ps1
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
docker compose -f infra/compose.test.yaml up -d --build analysis-worker
```

Em terminais separados:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-playlist-qa-api.ps1
```

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-qa-web.ps1
```

Depois:

```powershell
$env:LIVE_API = '1'
$env:LIVE_ANALYSIS = '1'
$env:LIVE_PLAYLISTS = '1'
$env:EXTERNAL_WEB = '1'
$env:E2E_BASE_URL = 'http://127.0.0.1:3002'
npm.cmd run test:e2e
```

Sem LIVE_PLAYLISTS, os dois cenários de playlists são pulados; isso não comprova
o gate da fase. O CI usa o mesmo servidor sintético junto do PostgreSQL/worker
reais. Execução remota e integração com uma conta Spotify real são verificações
distintas, ainda pendentes. Ao terminar, Ctrl+C na API/web e
`docker compose -f infra/compose.test.yaml stop`; volumes são preservados.

## Complemento do fluxo — 15/10/2026

`needs_input` significa metadados importados e falta de fonte, não falha de OAuth.
A captura do usuário mostra uma importação real de metadados; isso não valida
download de áudio nem análise real. O QA automatizado continua usando provedor
sintético e fontes de áudio de teste autorizadas.

1. Na faixa, escolha **Criar cifra para analisar**. Isso cria explicitamente um
   rascunho independente `Nova cifra`, sem copiar metadados para conteúdo musical.
2. Abra **Enviar ou gravar áudio e gerar sugestões**. Envie MP3/WAV autorizado ou
   grave seu instrumento. A gravação é convertida localmente em WAV mono PCM16;
   até dois minutos, com prévia/descarte e confirmação separada antes do upload.
3. Revise BPM, tom e eventos de acordes na análise e aplique somente sua seleção.
4. No editor, informe título e base de direitos, depois **Salvar revisão**.
5. Volte à faixa e escolha **Preparar com revisão aprovada**. A revisão fica
   fixada; alterações posteriores da cifra não são aplicadas ao item sozinhas.

Repetir uma faixa sem fonte agora retorna conflito explicativo; o botão não é
exibido em `needs_input`. Não há geração de letra, alinhamento à letra ou
reconhecimento exato de batida. Para prática, a biblioteca permite escolher uma
batida manualmente. O teste novo percorre importação → rascunho → upload → worker
→ aprovação de acordes → declaração manual → faixa preparada. São três cenários
Spotify, além dos testes de gravação/offline; habilitar LIVE_PLAYLISTS no QA.
