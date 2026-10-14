# 09 — Playlists, links, fontes e direitos (Fase 6)

## Princípio central
**Playlist não é áudio.** Uma URL pode fornecer somente metadados; acesso ao arquivo sonoro depende de permissão e integração legítima. Não fazer download de streaming protegido, scraping indiscriminado de letras ou redistribuição não autorizada.

## Fluxo
1. Usuário cola URL de playlist de provedor suportado.
2. Backend valida URL e chama API oficial autorizada, respeitando autenticação, quotas, termos e permissões.
3. Importa metadados (`title`, `artist`, `external_id`, posição) e lista seleção; informa itens não disponíveis.
4. Para cada item selecionado, verifica se há fonte de áudio autorizada; caso contrário `needs_input` e opção de upload próprio ou cifra manual.
5. Jobs por faixa isolados com retry limitado, progresso e cancelamento.
6. Usuário revisa cifras, associa ao cancioneiro e exporta apenas itens preparados ou selecionados explicitamente.

## Fontes de letras e cifras
Exigir registro de fonte, licença/termos e escopo permitido (uso pessoal, exibição, exportação, compartilhamento). Evitar importar letras de terceiros sem autorização. Fornecer editor para conteúdo criado ou autorizado pelo usuário.

## Casos de erro
URL inválida, playlist privada, token expirado, API rate-limited, item removido, faixa duplicada, sem áudio, falha de job. Não transformar erros em músicas vazias silenciosamente.

## Aceite
- Importação preserva ordem e permite seleção parcial.
- Falha isolada não cancela playlist inteira.
- Sem áudio, o sistema não afirma ter analisado a música.
- Cancelamento e reprocessamento não geram duplicações.
- Compartilhamento/exportação respeitam política de licenças configurada.
