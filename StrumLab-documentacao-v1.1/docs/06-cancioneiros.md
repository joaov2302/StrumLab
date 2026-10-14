# 06 — Cancioneiros, prévia e PDF

## Objetivo

Construir cancioneiros personalizados a partir de cifras já salvas e revisadas, sem depender de análise automática. Layout otimizado para **imprimir, ensaiar, cantar e consultar**.

## Funcionalidades da Fase 3

- Criar/renomear/arquivar cancioneiro com título, subtítulo e informações opcionais do organizador.
- Selecionar músicas da biblioteca, reordenar por drag-and-drop **e também por teclado/botões acessíveis**, remover, duplicar entrada se necessário com intenção explícita.
- Fixar em `SongbookItem` a revisão da música usada; alertar quando houver revisão mais recente e oferecer atualização seletiva.
- Configurar capa (texto e imagem autorizada), índice por ordem e, futuramente, categorias opcionais.
- Layout A4 retrato inicial; margens, fonte, tamanho, espaçamento, título de música, números de página. Uma ou duas colunas quando a largura e conteúdo permitirem.
- Prévia página por página e exportação em PDF; evitar começar por editor WYSIWYG de páginas arbitrárias.
- Na Fase 4, mostrar batida vinculada opcionalmente, com setas/BPM/compasso/legenda, **sem áudio embutido no PDF**.

## Referência editorial (não fonte de conteúdo)

O PDF do usuário `Cancioneiro Jumas Brasil - Cifras.pdf` possui 164 páginas A4 paisagem; as páginas 3 e 4 foram inspecionadas visualmente. Ele demonstra aspectos de um cancioneiro: **capa, índice separado por categoria (ex.: Entrada e Final), letras cifradas e diagramação compacta em colunas**. Usar como inspiração para usabilidade/paginação; **não** copiar textos, marcas, artes ou acordes para distribuição sem avaliação de direitos.

## Regras de layout

1. Priorizar legibilidade de cifras sobre redução agressiva de páginas.
2. Evitar quebra entre título de seção e sua primeira linha; evitar quebrar no meio de linhas com acordes.
3. Se uma música excede a página, quebrar entre linhas/seções e repetir informação mínima quando necessário.
4. Preservar alinhamento semântico dos acordes no renderizador; fonte proporcional não pode deslocar o acorde para a palavra errada.
5. Não cortar símbolos de acordes, setas, caracteres acentuados, `#`, `b`, `°` ou slash chords.
6. ÍNDICE reflete número de página real após paginação final (não calcular antes da paginação sem reconciliação).
7. Se layout em duas colunas prejudicar uma cifra, oferecer 1 coluna ou uma quebra inteligente.
8. PDF deve indicar edição da cifra e configurações usadas na exportação para reprodutibilidade interna; não necessariamente imprimir dados técnicos no documento público.

## Exportação determinística

`SongbookExport.manifest_json` registra título, itens ordenados, revisões fixas, configurações e versão do renderizador. Reexportar com manifesto igual deve manter o mesmo conteúdo lógico, ressalvadas diferenças técnicas inevitáveis do arquivo. Nunca incluir itens `needs_input` ou pendentes sem tratamento explícito do usuário.

## Motor PDF: decisão a validar via spike

Comparar ao menos duas alternativas técnicas — por exemplo, renderização HTML/CSS print com Chromium vs biblioteca de PDF dedicada — com os mesmos casos de teste: A4, sumário com páginas corretas, setas Unicode, acordes complexos, 1/2 colunas, cabeçalhos, fontes/licenças e exportação de 30 músicas de teste. Registrar decisão em `12-decisoes.md`; não presumir ChordPro CLI como solução final.

## Critérios de aceite

- Adicionar uma música em dois cancioneiros sem duplicar a música original.
- Alterar ordem e atualizar tela sem perder posições.
- Atualizar cifra depois de preparar livro não modifica sua revisão fixada sem consentimento.
- PDF tem capa (se habilitada), índice com números corretos, títulos e cifras na ordem definida.
- Texto/acordes não truncados e sem sobreposição; teste com música curta, longa, múltiplas seções e caracteres especiais.
- Prévia corresponde ao conteúdo do PDF exportado; versão de conteúdo rastreável.
- Falha do renderizador retorna erro e permite tentar novamente sem criar duplicação incoerente.

## Próximas melhorias

Favoritos, templates editáveis, índices por categoria, rodapés personalizados, geração em lote e formatos adicionais. Não antecipar importação automática de PDF para a Fase 3; seria um fluxo de parser + revisão específico.

## Complemento v1.1
A4 retrato é a proposta de produto, diferente da referência paisagem. Não ativar categorias/paisagem sem validar extensão. O manifesto também deve preservar a batida e personalizações usadas por item na Fase 4; ver docs/15-contratos-ux-dados.md.
