# Cancioneiros — contrato da Fase 3

14/10/2026. Aplicação local; documentos normativos 04, 06 e 15 do pacote v1.1.
Nenhum conteúdo do cancioneiro de referência foi copiado. Música, revisões e livros
são independentes; arquivos permanecem no PostgreSQL local, não em Git/public.

## Montagem

Criar/renomear/arquivar/reabrir livro; título, subtítulo e organizador. A seleção
da biblioteca admite somente músicas com revisão publicada. É possível escolher
uma revisão anterior. Cada item conserva song_id, revisão exata e posição.

Ordem por arrastar ou por botões Subir/Descer, persistida atomicamente com constraint
de posições adiável. Duplicar cria outro item da mesma revisão por ação explícita,
sem duplicar a música original. A nova entrada inicia sem notas. Remover item não
arquiva música nem apaga revisão. Nota por item tem salvamento explícito.

Revisão mais recente gera aviso. Atualizar somente este item exige ação do usuário;
outros itens/livros continuam fixados nas revisões anteriores. Músicas arquivadas
já referenciadas permanecem exportáveis. Para adicionar ou duplicar música arquivada,
reabra na biblioteca. Livro arquivado preserva seus PDFs, mas não permite novas alterações.

## Capa e layout

A4 retrato, capa opcional, índice em ordem, Noto Serif/Sans, 1 ou 2 colunas,
fonte 9–16 pt, margem 10–25 mm e espaçamento 1–1,6. Cifras largas podem exigir uma
coluna. Nova música começa em página própria; coluna seguinte e páginas adicionais
repetem o título mínimo. Seções não deixam o título separado da primeira linha normal;
linhas muito longas podem continuar em linhas visuais, preservando texto e acordes.
O índice é reconciliado após a paginação completa; capa conta como página física 1.

Imagem local PNG/JPEG, até 2 MiB e 3000 × 3000 pixels. Autoria própria ou permissão
declarada exigidas; formato real, dimensões e decodificação validados na API.
Sem SVG/URL externa, download de imagem ou upload público. A imagem é incorporada
ao snapshot do livro e ao PDF; alterar depois não muda exportação histórica.

## Exportação, prévia e histórico

POST de exportação captura manifesto com itens/revisões/conteúdo, ordem, notas,
capa, layout e versão do renderer. Hash SHA-256 e unique(book,manifest_hash) evitam
duplicar exportação de uma mesma versão. Lease privado de 90 segundos evita duas
renderizações simultâneas; erro pode ser repetido na mesma linha de exportação.
Não existe worker musical nem fila de análise nesta fase.

PDFKit renderiza no servidor Next.js e envia o resultado pelo canal privado à API.
Bytes, SHA-256, número de páginas e índice ficam em songbook_export. Trigger impede
alterar/apagar exportações completas e o manifesto de qualquer exportação.
Histórico é listado por metadados, sem carregar todos os blobs PDF na memória.

PDF.js exibe **os mesmos bytes persistidos do download**. Há navegação de páginas,
zoom, índice navegável e texto extraído da página como alternativa à tela canvas.
Salvar capa/layout, ordem, item ou nota aumenta a versão e invalida a prévia atual.
PDF histórico continua disponível por seleção explícita, com rótulo próprio.
Mudança posterior na cifra, sem atualizar o item, não invalida o PDF fixado do livro.

O backend privado devolve lease/manifesto somente ao proxy de renderização; esses
dados de coordenação não vão ao navegador. O endpoint interno result não é exposto
na allowlist do proxy. Ownership, versão do livro, token e Origin/Host de loopback
seguem o mesmo isolamento do editor. Não substituem autenticação multiusuário.

## Limites e verificação

Limites técnicos locais: 200 itens por livro; 750 mil caracteres de JSON musical
somados por exportação; até 500 páginas/16 MiB por PDF; requisição de configuração
ao proxy até 4 MiB; notas até 1000 caracteres. Histórico mostra as últimas 50
exportações, sem apagar as anteriores. Fontes e licenças têm commits/hashes no repositório.
Glyph sem fonte disponível retorna erro explícito; não há substituição silenciosa.

[Spike comparativo](pdf-spike.md): trinta músicas fictícias nos dois motores, 1/2
colunas, Unicode, índice e caixas de texto conferidos. QA do PDF persistido final
com capa de imagem: pypdf/PyMuPDF e Poppler, PNGs inspecionadas. Browser QA em
360/390/1440 px, sem overflow/erros JS, incluindo comparação do hash do download.

PDF não é PDF/UA/tagged. Não foi validado em leitor de tela ou impressão física.
Preview não tem editor de páginas arbitrárias nem miniaturas. Imagem de baixa
resolução pode perder nitidez; o exportador preserva a imagem fornecida.
Paisagem, categorias, batidas impressas e áudio ficam para validação/fases futuras.
Não houve CI remoto, commit, push, contratação ou deploy nesta fase.
