# Análise assistida de áudio — Fase 5

Protótipo privado local. A análise propõe BPM, tonalidade e uma timeline de tríades;
não extrai letra, tablatura, dedilhado ou a batida exata de uma gravação.
Abra **Análise de áudio**, selecione uma música e envie um arquivo autorizado.

## Executar

Com PostgreSQL, API e web já iniciados conforme o README, prepare e inicie o worker:

```powershell
docker compose --env-file .env -f infra/compose.yaml --profile analysis up -d --build analysis-worker
```

O build requer rede para obter as dependências. Em execução o worker usa somente
a rede interna do PostgreSQL, sem publicar portas. A fila persiste mesmo ao fechar
o navegador. Para pausar o consumidor sem apagar arquivos ou jobs:

```powershell
docker compose --env-file .env -f infra/compose.yaml --profile analysis stop analysis-worker
```

## Contrato e limites locais

- MP3/WAV: extensão, MIME e assinatura coerentes; decodificação real por FFmpeg.
  Até 20 MiB, 2–600 segundos, 8–192 kHz, um stream de áudio mono/estéreo.
- Declaração de direitos: gravação própria, permissão ou domínio público/licença
  compatível. Não há busca de gravações, download de streaming ou fontes de letras.
- Até 100 MiB por biblioteca e dez áudios ativos por música. Mesmo SHA-256 na mesma
  música reutiliza asset/job; arquivo excluído não pode ser reenviado com mesmo hash.
- Bytes em `audio_asset` no PostgreSQL, associados ao dono e a UUID opaco. Não são
  gravados em `public`, não há URL pública e a reprodução exige as guardas locais.
  Respostas de áudio usam `private, no-store`; o token Java não vai ao navegador.
- Retenção até **Excluir áudio**: remove bytes, libera quota e cancela jobs ativos.
  Resultados e revisões já salvos permanecem. Backups do banco têm retenção própria;
  a exclusão na aplicação não apaga cópias externas ou backups anteriores.
- `ProcessingJob`: `pending`, `processing`, `completed`, `failed`, `needs_input`
  ou `cancelled`. Claim transacional com `SKIP LOCKED`, lease de 240 s, processo
  filho limitado a 180 s e três tentativas por job. Falha permanece consultável.
- **Tentar análise novamente** reutiliza o job falho sem zerar tentativas.
  **Reprocessar explicitamente** cria outra geração; máximo cinco por asset.
  Não há retentativa automática de falha terminal; lease abandonado pode ser retomado.
- Container sem privilégios, usuário 10001, filesystem somente leitura, temporários
  limitados a 256 MiB, 2 GiB de memória, duas CPUs e 64 PIDs. SHA-256 é conferido
  antes da decodificação. Logs registram duração/desfecho, sem áudio ou nome original.

## Revisão humana

Resultados são imutáveis e separados da cifra. BPM, tom e acordes têm seleção
independente e podem ser corrigidos antes da aprovação. Sem estimativa, os campos
ficam ausentes; confiança probabilística e compasso são `null` nesta versão.
Eventos `N` indicam acorde desconhecido e precisam ser removidos/corrigidos para aplicar.

**Comparar com rascunho atual** captura a versão esperada. **Aplicar seleção** cria
uma revisão `analysis_accepted` com proteção contra conflito e chave idempotente.
Somente campos selecionados mudam. Acordes temporais são adicionados como seção
separada com timestamps; não substituem tokens da letra. Capo, texto e histórico
permanecem. Conflito preserva as correções da tela e exige atualizar a comparação.
Reprocessar ou excluir áudio não altera revisões humanas nem PDFs históricos.

## Algoritmo e qualidade medida

Baseline experimental `chroma-baseline-v1`: librosa 0.11, separação harmônica,
chroma CQT, perfis tonais, templates de tríades e janelas de meio segundo.
Tempo pode representar metade/dobro do pulso. Não é um modelo final validado para
gravações arbitrárias; harmonia complexa, rubato, afinações e sobreposição reduzem precisão.

O spike compara STFT/CQT sobre cinco fixtures anotadas: montagens de notas reais
FreePats CC0 a 90/120/160 BPM e sinais próprios em C/Am. CQT acertou o tom nas cinco;
STFT em duas (uma ausência, dois tons diferentes). Acurácia de acorde amostrada a
cada 0,5 s: CQT 90,9–100%; STFT 80–97%. Erro de BPM: 0,27–2,38% em ambos.
Esses números descrevem apenas esse conjunto pequeno, não acurácia geral ou confiança.
Tempos dependem do aquecimento das bibliotecas e não são comparação controlada de custo.
Script reproduzível em `workers/music-analysis/spike.py`; fontes/licenças em
`workers/music-analysis/THIRD_PARTY.md`. Nenhum peso de modelo externo é baixado.

## QA completamente separado da biblioteca pessoal

O projeto `strumlab-qa` usa volume próprio, PostgreSQL em **5434**, API em **8081**
e web em **3002**. As credenciais fixas são descartáveis e exclusivas de loopback.
Não use esse ambiente para dados pessoais. Os scripts com `-Isolated` não leem `.env`.
Execute na raiz; pare o worker de QA antes de repetir os testes Java/Python.

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

Em um segundo terminal:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-api.ps1 -Isolated
```

Em um terceiro terminal:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-qa-web.ps1
```

Em outro terminal:

```powershell
$env:LIVE_API = '1'
$env:LIVE_ANALYSIS = '1'
$env:EXTERNAL_WEB = '1'
$env:E2E_BASE_URL = 'http://127.0.0.1:3002'
npm.cmd run test:e2e
```

`LIVE_ANALYSIS=1` habilita as duas jornadas reais de análise. Sem isso elas são
puladas; não declarar aceite da fase com skips. CI foi configurado com worker e banco
efêmero, mas sua execução remota ainda não foi verificada.
Encerre API/web com Ctrl+C e pare somente o projeto de QA:

```powershell
docker compose -f infra/compose.test.yaml stop
```

Volumes permanecem; não é necessário apagar banco nem volume pessoal.
