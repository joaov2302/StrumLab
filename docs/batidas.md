# Batidas — contrato local da Fase 4

## Catálogo e prática

`/batidas` lista somente Pop / Folk básico v1, com pesquisa e filtros de estilo,
dificuldade, compasso e BPM padrão. Os eventos vêm do exemplo normativo, persistido
pela migration V4. Versões do catálogo não admitem UPDATE/DELETE. A demonstração
usa um acorde por vez; não acompanha automaticamente a progressão da cifra.

90 BPM: oito movimentos em 2,666667 s, seis ataques nos slots 0/2/3/5/6/7 e quatro
cliques nos slots 0/2/4/6. Slots 1 e 4 mantêm o movimento sem atacar. O primeiro
tempo é acentuado. BPM aceito: inteiro de 45 a 160. A edição de BPM durante a
prática fica pendente até o próximo compasso. O valor confirmado em “Aplicar à
música” é o valor escolhido, identificado no botão, inclusive se estiver pendente.

O motor usa AudioContext.currentTime, horizonte de 80 ms e wake-up de 20 ms.
O timeout acorda o scheduler; os timestamps sonoros são agendados no relógio de
áudio. A grade usa requestAnimationFrame/getOutputTimestamp, com fallback de
compensação pela latência reportada. Ganhos do violão e metrônomo são independentes.

Pausa cancela fontes, incluindo caudas, e conserva a posição fracionária do slot.
Retomar conserva a fase: não repete o ataque já iniciado, e agenda o próximo slot
num novo marco com 40 ms de antecedência. Reiniciar para no slot 0. Sem loop, tocar
após concluir começa novo compasso. Troca de acorde cancela/reagenda ataques futuros.
Um único timeout fica ativo; desmontagem fecha contexto, cancela fetches/nós/frames.
Aba oculta pausa; atraso do scheduler acima de 150 ms pausa em vez de emitir uma
rajada de eventos atrasados. Redução de movimento conserva posição/contorno e não
anuncia cada subdivisão por aria-live.

## Samples e licença

Fonte primária: [FreePats — Spanish classical guitar](https://freepats.zenvoid.org/Guitar/acoustic-guitar.html),
gravado por Roberto (roberto@zenvoid.org) em 2008, versão 2019-06-18, CC0-1.0.
Repositório fixado em `6f4eb1b092acc88f5448cea1a0001bd07b971af8`.
Licença original, README, mapa SFZ, URLs, data de obtenção e SHA-256 ficam em
`apps/web/public/audio/guitar`. CC0 não exige atribuição; a interface exibe a origem.

Os oito WAVs G/C/D/Em down/up são **montagens de notas gravadas**, com 12 ms entre
cordas e ordem invertida para cima. Não são gravações de acordes completos. Não há
pitch shifting: foram usadas 14 alturas gravadas. WAV mono PCM16, 44,1 kHz, dois
segundos, normalização de pico 0,65 e fade final de 100 ms. Aproximadamente 1,35 MiB
em arquivos e 2,7 MiB em buffers decodificados. Scripts reproduzíveis:

```powershell
node scripts/prepare-guitar.mjs # requer rede e Chromium; não roda no startup
node scripts/check-guitar.mjs   # assets locais, hashes e renderização offline
```

Carregamento lazy após gesto, cache HTTP local, timeout de 10 s, limite de 500 kB
por arquivo. Falha mostra recuperação e oferece fallback **provisório só com
metrônomo**, sem simular violão por oscilador. O clique é sintetizado em buffer;
o instrumento é sempre reproduzido de gravações licenciadas.

## Música, livro e histórico

GET/PUT `/api/v1/songs/{id}/strumming`: vínculo ativo separado das revisões da cifra,
com versão otimista própria e lock da música. Ausente: versão 0/snapshot null.
PUT informa ID/versão do padrão, BPM, notas e showInPdf; patternId null remove o
vínculo e incrementa a versão. Ownership, token privado, Host/Origin e estado
arquivado continuam protegidos. Conflito retorna 409 e requer recarregar explicitamente.

Ao adicionar item, o livro captura o vínculo atual inteiro. Itens anteriores à V4
continuam sem batida até captura explícita. “Capturar batida atual no item” altera
somente aquele snapshot, inclusive remoção; trocar cifra/revisão ou salvar nota
não troca a batida. O checkbox de impressão muda somente showInPdf daquele item.

O manifesto inclui padrão/versão/eventos/compasso/BPM/notas/exibição. PDFKit A4 v2
imprime grade, legenda e acento, sem áudio, volume, posição ou acorde de demo.
Campos opcionais preservam manifestos antigos; PDFs concluídos do renderer v1
continuam servidos pelos mesmos bytes/hash, sem regeneração silenciosa. Mudanças
do vínculo ativo não invalidam livros/PDFs; mudanças explícitas do livro incrementam
sua versão e exigem nova prévia. Novos itens duplicados são novas inclusões e
capturam o vínculo atual, conforme o mesmo contrato de adicionar.

## Limites de validação

QA automatizado em Chromium headless/Windows usa AudioContext real e saída emulada,
buffers decodificados e timestamps do dispositivo. Não equivale a uma audição
humana em caixas/fones/Bluetooth. Não foi validado Safari/Firefox, precisão sob
carga arbitrária, áudio em background ou acompanhamento harmônico automático.
O timbre tem uma camada de dinâmica/voicing por acorde e não é sampler profissional.
CI preparado; execução remota e publicação não realizadas.
