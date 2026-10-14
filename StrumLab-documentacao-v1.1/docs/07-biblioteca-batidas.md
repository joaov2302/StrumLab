# 07 — Biblioteca de batidas

## Objetivo e prioridade
Fase 4 do roadmap revisado. Um catálogo didático de padrões de violão com setas, áudio **baseado em amostras licenciadas de violão real**, metrônomo e animação sincronizada. Começar por **Pop / Folk básico**. Não confundir demonstração de ritmo com detecção automática de batidas em músicas.

## UX
- Menu `Modelos de batida`; filtros por gênero, dificuldade, compasso e BPM; pesquisa; cartões com prévia.
- Tela do padrão: grade `1 & 2 & 3 & 4 &`, setas, movimento silencioso, abafamento (quando houver), acentos e legenda.
- Play/pausa, reiniciar, loop, BPM de 45–160 no protótipo, metrônomo com volume independente, volume do violão, seleção G/C/D/Em.
- Destacar todos os oito movimentos, **inclusive os silenciosos**; preservar indicador de posição durante a pausa e voltar ao início ao reiniciar.
- `Aplicar à música` cria vínculo editável sem alterar o catálogo global; exportação em PDF usa símbolos, compasso, BPM e legenda, não áudio.

## Padrão inicial
Arquivo executável de exemplo: `examples/pop-folk-basic.json`.

- Compasso 4/4, BPM padrão 90, 8 subdivisões (colcheias).
- Movimentos: `↓ · ↓ ↑ · ↑ ↓ ↑`, correspondendo a `1 & 2 & 3 & 4 &`.
- O movimento em slots 1 e 4 ocorre sem atacar as cordas. `·` **não** significa parar a mão.
- Acentuar o slot 0 e metrônomo no começo de cada tempo (slots pares).
- Duração da colcheia em 90 BPM: `60 / 90 / 2 = 0,333333 s`; compasso: `4 * 60 / 90 = 2,666667 s`.

## Modelo de eventos
`slot`, `direction` (`down`/`up`), `play`, `accent`, `mute` (opcional), `velocity` (0–1). Um `StrummingPattern` possui versão imutável e um `SongStrummingPattern` guarda personalizações.

## Motor de áudio
1. Obter samples próprios ou de biblioteca com licença compatível, registrar autor, URL de origem, licença, data e requisitos de atribuição. Não distribuir áudio de origem incerta.
2. Web Audio API: decodificar samples em `AudioBuffer`, usar `AudioBufferSourceNode` por ataque; samples down/up e, quando viável, diferentes acordes/voicings. Não tratar um único sample pitch-shifted como realismo garantido.
3. Usar `AudioContext.currentTime` como relógio mestre, agendar eventos à frente com look-ahead. `setTimeout` pode acordar o scheduler, **não** ser a fonte da marcação sonora.
4. Agendar também os cliques do metrônomo (acento no tempo 1) com ganho separado.
5. UI anima baseada no tempo de áudio agendado e `requestAnimationFrame`, com compensação da latência perceptível quando apropriado.
6. Cancelar fontes futuras na pausa/reset/mudança de BPM; evitar múltiplos schedulers e vazamento de nós. Mudança de BPM é aplicada no próximo limite seguro de subdivisão/compasso, com regra explícita.
7. Respeitar autoplay: iniciar contexto após clique. Se sample falhar, mostrar erro e fallback provisório identificado; não prometer som realista usando oscilador triangular.
8. Samples grandes devem ter cache, lazy loading e limites de memória. Não transmitir samples sem autorização.

## Critérios de aceite
- 90 BPM: 8 movimentos por compasso, 4 cliques, 6 ataques audíveis.
- Setas e metrônomo mantêm sincronização ao mudar BPM, pausar, retomar, reiniciar e repetir.
- Trocar G/C/D/Em altera o som do próximo ataque sem alterar ritmo.
- Falta de sample não quebra tela; UI informa fallback.
- Testar precisão com clock simulado e navegador real; registrar tolerância observada e dispositivos usados.
- Aplicação à música persiste e exportação mostra legenda correta.

## Não fazer na primeira entrega
Detecção automática de padrão de áudio, reconhecimento de técnicas avançadas, sampler profissional, gravação multifaixa ou áudio embutido no PDF.
