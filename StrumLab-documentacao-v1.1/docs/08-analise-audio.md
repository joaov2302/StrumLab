# 08 — Análise automática de áudio (Fase 5)

## Objetivo
A partir de MP3/WAV fornecido legitimamente pelo usuário, propor BPM, tonalidade e eventos de acordes com timestamps, **sempre editáveis**. Resultado não é transcrição perfeita e não cria letra confiável automaticamente.

## Pipeline
1. Upload validado: extensão, MIME real, duração, tamanho, autorização de uso e limite por usuário.
2. Gravar asset privado com chave opaca; criar `ProcessingJob` idempotente (`pending`).
3. Worker assíncrono obtém asset, verifica integridade, usa FFmpeg para normalização, extrai features com bibliotecas Python apropriadas.
4. Estimar BPM e tonalidade com confiança calibrada quando possível; estimar sequência de acordes por janelas e tempos.
5. Persistir `AnalysisResult` versionado e separado de `SongRevision`; job `completed`, `failed` ou `needs_input`.
6. Mostrar comparação ao usuário e permitir aplicar resultados seletivamente; nunca sobrescrever revisão manual sem consentimento.

## Limitações e comunicação
- Harmonia com instrumentos sobrepostos, afinações alternativas, modulações, rubato e acordes complexos reduz precisão.
- `BPM`, `key`, `meter`, `chords` são campos separados com confiança opcional; ausência de estimativa não vira valor fictício.
- Não prometer dedilhados, solos, tablaturas nem letra extraída de áudio no MVP.
- Sugestão de batida deve ser rotulada como aproximação e não como ritmo fiel.

## Implementação
Python com FFmpeg e bibliotecas avaliadas (librosa/Essentia conforme licenças, instalação e qualidade). Não escolher algoritmo definitivo antes de spike com conjunto de áudio permitido e anotado. Definir benchmarks de custo, tempo, precisão e taxa de erro.

## Segurança e operação
- Validar bytes, impor timeout, tamanho, duração, quotas e concorrência; processar em ambiente isolado.
- Não expor URLs públicas de áudio privado; usar acesso temporário e política de exclusão/retenção.
- Retry limitado e idempotente; job de uma música não bloqueia outro.
- Métricas de duração e erros sem registrar áudio ou dados sensíveis em logs.

## Aceite
- Upload inválido rejeitado com erro útil; job não bloqueia API.
- Resultados são exibidos como sugestões e podem ser rejeitados/corrigidos.
- Nova análise preserva revisão aprovada; reprocessamento não duplica jobs sem intenção.
- Falhas deixam status consultável e opção de tentar novamente.
