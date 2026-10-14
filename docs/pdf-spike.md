# Spike de PDF — Fase 3

14/10/2026. Comparação executada antes de fechar o motor: PDFKit 0.20.2 versus
Chromium/Playwright. Trinta cifras inteiramente sintéticas: músicas curtas, uma com
100 linhas, outra com 40, duas seções, slash chords, extensões, acentos, setas,
grau e símbolo musical. Sem conteúdo da referência JUMAS.

| Caso | Páginas | PDFKit | Chromium |
|---|---:|---:|---:|
| A4, 1 coluna, Noto Serif | 40 | 1.096 ms / 100.478 bytes | 1.354 ms / 169.183 bytes |
| A4, 2 colunas, Noto Sans | 37 | 936 ms / 94.733 bytes | 1.249 ms / 216.589 bytes |

Tempos locais de uma execução, não benchmark generalizável. Chromium já estava
iniciado; seus tempos incluem HTML, fontes e geração. Ambos usam a mesma paginação
explícita e métricas de fonte do protótipo para comparar renderização em condições
equivalentes. Não foi comparado um mecanismo CSS de paginação automática com cálculo
próprio de índice; isso exigiria uma reconciliação adicional de páginas.

Verificação de todos os PDFs com pypdf/PyMuPDF: tamanhos A4, número de páginas,
títulos nas páginas apontadas pelo índice, sentinelas de fim de todas as cifras,
glyphs ↑/↓/°/🎶/#/b/slash e caixas de texto dentro da página. Páginas selecionadas
renderizadas como PNG; índice, capa e música longa em duas colunas inspecionados.
Prévia do produto usará PDF.js sobre os mesmos bytes persistidos do download.

**Escolha técnica para o protótipo autorizado: PDFKit.** Passou nos critérios,
produziu arquivos menores e dispensa Chromium em runtime. Alternativa Chromium
permanece documentada; não foi escolhido ChordPro CLI. A paginação explícita será
versionada junto ao motor e ao manifesto. Reavaliar a escolha antes de hosting.

Fontes Noto Sans, Serif, Sans Symbols 2, Sans Math e Emoji: arquivos oficiais
com commits e SHA-256 em `assets/fonts/provenance.json`, licenças OFL-1.1 incluídas.
Fontes de símbolos/emoji oferecem fallback monocromático. Caracteres sem glyph
disponível geram erro explícito, sem quadrado preto ou descarte silencioso.

Reprodução: `node scripts/spike-pdf.mjs`; depois `python scripts/check-pdf-spike.py`
com pypdf/PyMuPDF em `.cache/pdf-tools` (somente QA, não runtime do produto).
Artefatos intermediários em `.cache/pdf-spike`, ignorados pelo Git.

Referências técnicas: [fontes em PDFKit](https://pdfkit.org/docs/text.html),
[geração PDF em Playwright](https://playwright.dev/docs/api/class-page#page-pdf),
[repositório oficial das fontes](https://github.com/google/fonts).
