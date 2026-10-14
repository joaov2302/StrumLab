# 05 — Editor de cifras e transposição

## Objetivo

Permitir que uma pessoa crie, edite, organize e revise uma cifra **sem depender de reconhecimento automático de áudio**. O mesmo modelo semântico alimenta biblioteca, transposição, diagramas e PDFs.

## UI principal

- Cabeçalho: título, artista, tom original, BPM (opcional), compasso, capo e status de salvamento.
- Área de edição: seções identificadas (`intro`, `verse`, `chorus`, `bridge`, `outro`, `other`), linhas de texto, tokens de acorde inseríveis acima/antes do texto e linhas só de acordes.
- Barra de ferramentas: inserir acorde, duplicar/reordenar seção, transpor por semitons, resetar tom, desfazer/refazer, prévia de impressão.
- Histórico: revisões nomeadas por número/data/fonte e ação restaurar para nova revisão.
- Acesso contextual: **Aplicar batida** (quando Fase 4 estiver disponível); não mostrar função ativa falsa na Fase 2.

## Representação e comportamento

- Representar cifras como tokens `{type:'chord',symbol:'G'}` e `{type:'text',value:'...'}` em linhas ordenadas. Não persistir alinhamento baseado apenas em espaços de monoespaço.
- Renderizador pode posicionar acordes acima do início do token seguinte; tratar textos vazios e dois acordes consecutivos.
- Editor mantém cursor, acentos/Unicode, quebras e ordem das seções; dados validados ao salvar.
- Aceitar acordes maiores, menores, sétimas, sustenidos/bemóis, suspensos, aumentados/diminutos, baixos alternativos (slash chords) e extensões compatíveis com gramática implementada.
- Acordes não reconhecidos: exibir validação ou preservar como texto sinalizado; **não** converter silenciosamente.

## Transposição

- Transpor **raiz e baixo alternativo** pelo mesmo número de semitons. Preservar qualidade e extensões (`m7`, `sus4`, `add9`, etc.). Exemplo: `G/B` +2 semitons → `A/C#`.
- Preferências de grafia enarmônica (sustenidos/bemóis) devem ser estáveis conforme tom e preferência do usuário. Ex.: `A#` ou `Bb` conforme contexto; não há grafia universal única.
- Alterar campo de tom exibido conforme transposição; capo é campo distinto e não altera automaticamente a escrita de todos os acordes sem ação explícita.
- A cifra pode ser transposta várias vezes; evitar acumular erros de notação e oferecer retorno à revisão original.
- Histórico e undo devem permitir recuperar cada estado; não editar revisão passada in-place.

## Importação/exportação ChordPro

Formato textual opcional da Fase 2, com suporte inicialmente a diretivas básicas `title`, `artist`, `key`, `tempo` e acordes embutidos `[G]texto`. Parser deve rejeitar/informar diretivas que não suporte e preservar conteúdo sempre que possível. Evitar prometer round-trip perfeito em extensões ChordPro não implementadas.

```text
{title: Canção de exemplo}
{artist: Autor fictício}
{key: G}
[G]Hoje vou [D]cantar
```

## Autosave e conflito

Autosave de rascunho pode ser implementado após persistência básica; mostrar estado `Salvando / Salvo / Erro`. Controle de versão evita perda por duas abas. Salvamento final cria `SongRevision` nova; se houver conflito, não sobrescrever: oferecer ver diferenças/recarregar/cópia.

## Critérios de aceite

- Usuário cria cifra com pelo menos duas seções, edita acordes e salva/reabre sem perda de texto/posição.
- Texto com acento e linhas sem acordes permanece intacto.
- `G`, `Em7`, `Bb`, `F#m`, `D/F#` e `G/B` são reconhecidos/transpostos conforme testes musicais.
- `G/B` +2 → `A/C#` em convenção de sustenidos; trocar capotraste isoladamente não modifica símbolos da cifra.
- Reabrir revisão N mantém o conteúdo de N mesmo após criar N+1.
- Validação de edição simultânea retorna conflito e oferece recuperação; nunca apaga silenciosamente alterações.
- Conteúdo com fontes/direitos inadequados não recebe opção de distribuição pública automática.

## Fora do escopo deste módulo

Reconhecimento automático, tablaturas completas, áudio musical, transcrição de letras, compartilhamento público e edição colaborativa em tempo real.
