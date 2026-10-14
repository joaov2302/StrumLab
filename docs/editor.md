# Biblioteca e editor — contrato implementado

Escopo: Fase 2 local, 14/10/2026. Fonte normativa: documentos 02, 04, 05 e 15 do
pacote v1.1. Acordes e letras são tokens no JSON; a marcação visual é entrada, não
a estrutura persistida. Funcionalidades de livros, impressão/PDF e áudio não fazem
parte desta fase.

## Uso

Em Músicas, criar cifra abre um rascunho com título inicial e uma seção vazia.
Preencha metadados e escreva `[G]texto [D/F#]mais texto`. Cada quebra cria uma linha;
linhas vazias e linhas só de acordes são preservadas. O botão Inserir acorde insere
no cursor da seção. Há nomes/tipos, duplicação e ordem por botões acessíveis.
Colchetes literais usam `\[` e `\]`; barra literal usa `\\`.

Rascunho automático tem debounce de 1,5 segundo. Apenas **Salvar revisão** publica
uma revisão imutável. Autosave não transforma rascunho em revisão. Erros suspendem
as tentativas até edição ou salvamento explícito; conteúdo permanece em memória.
Sair com alterações não salvas avisa; não há recuperação offline após encerramento
forçado do navegador. Desfazer/refazer local mantém até 100 estados.

## Revisões e concorrência

`song_draft` guarda JSON e `base_revision_id`; `song.draft_version` é o contador de
concorrência. Toda escrita trava a linha da música e exige a versão e revisão-base
atuais. Conflito retorna Problem Details com HTTP 409, preserva o rascunho da tela
e oferece comparar, descartar/recarregar explicitamente ou salvar como cópia.

Revisão contém título, artista, tom, capo, BPM/compasso, origem, declaração de direitos
e seções. Leitura `/musicas/:id?revision=:uuid` usa exatamente o snapshot solicitado;
revisão inexistente gera erro e não é substituída pela mais recente.
Restaurar uma revisão cria N+1, com origem `restored`. Trigger no PostgreSQL impede
UPDATE/DELETE em `song_revision`. Arquivar/reabrir conserva rascunho e histórico;
não há exclusão permanente de cifras nesta fase.

## Transposição

Executada pela API sobre o conteúdo em edição, sem publicar revisão automaticamente.
Raiz e baixo alternativo mudam pelo mesmo intervalo; IDs, ordem, texto e capo permanecem.
Semitons -12 a +12; grafia escolhida explicitamente como sustenidos ou bemóis.
Transposição zero preserva a cifra. O tom escrito acompanha a transposição; alterar
capo sozinho não altera símbolos. Leitura informa tom escrito e tom soando.

Gramática: raízes A–G, acidente simples #/b, qualidades maiores, m/min/maj, dim/aug,
sus2/sus4, +/o/°, extensões numéricas e combinações add/sus/maj/dim/aug/#/b numéricas;
baixo alternativo opcional A–G com acidente simples. Exemplos: G, Em7, Bb, F#m,
D/F#, G/B, C7sus4, Cm7b5. Parênteses, acidentes duplos e outros símbolos fora dessa
gramática geram validação explícita, sem converter ou descartar o original.

## ChordPro básico

Importação local de texto/arquivo e download `.cho`, em UTF-8. Suporte: title, artist,
key, tempo, time e capo; acordes entre colchetes e seções delimitadas por
`start_of_verse/chorus/bridge/intro/outro/other` e respectivos `end_of_*`.
Os delimitadores de intro/outro/other são parte do subset local, sem prometer
compatibilidade universal com outras implementações. Diretivas desconhecidas,
seções aninhadas, encerramentos incompatíveis e números inválidos bloqueiam importação
com mensagem. Texto original fica no formulário.

IDs são regenerados na importação; origem e direitos não são transportados pelo
ChordPro. O teste de round-trip cobre conteúdo musical/metadados suportados, não
essas informações internas. Não há scraping, busca de letras ou distribuição pública.

## Isolamento e segurança

API resolve o workspace local configurado; cliente não escolhe `owner_id`.
Consultas e mutações verificam propriedade, retornando 404 para outro workspace.
Token privado entre Next.js e Java protege endpoints de músicas. O proxy admite
somente Host de loopback; escrita exige Origin exatamente igual ao Host HTTP e
Content-Type application/json. Token ausente e origem externa são negados.
Esse mecanismo é proteção do protótipo local, não autenticação multiusuário.

## Limites técnicos locais

- Requisição ao proxy: 1 MiB. Conteúdo de ChordPro/texto: até 250 mil caracteres.
- Título/artista: 200 caracteres; referência: 1.000; nome de seção: 120.
- Até 100 seções, 2.000 linhas, 20.000 tokens; até 1.000 tokens por linha.
- BPM opcional entre 20 e 400; capo entre 0 e 12; compasso numerador 1–16,
  denominador 2/4/8/16. Biblioteca paginada em lotes de 50.

São limites técnicos do editor local, não limites de upload/retensão da Fase 5.
