# 13 — Revisão de contexto · v1.1

Data: 13/10/2026. Entrega autorizada: revisão de documentação, mockups e descrição funcional. Não é implementação das fases nem aprovação de stack, paleta ou infraestrutura. O pacote recebido contém 23 arquivos de planejamento; não contém código de aplicação, migrations ou evidência de módulos implementados.

## Contexto preservado

StrumLab apoia o violonista na criação de cifras, preparação de cancioneiros e prática de batidas. Nome confirmado; direção visual proposta. O MVP continua nas fases 1–4: criar → salvar → organizar → praticar → exportar. Análise assistida e playlists permanecem nas fases 5 e 6. A experiência de editor prioriza desktop; leitura e treino devem funcionar bem em celular.

A referência JUMAS foi inspecionada por metadados, texto extraído e renderização das páginas 3 e 4. Possui 164 páginas, tamanho A4 **paisagem**, índices por categorias, cifras em duas colunas, números de página e elementos editoriais recorrentes. Não foi feita auditoria visual de todas as páginas. A4 retrato continua como proposta inicial do produto, e não como reprodução fiel da referência. Paisagem e categorias são extensões a validar, sem avanço automático do escopo.

## Achados e tratamento

| Achado | Consequência | Tratamento nesta revisão |
|---|---|---|
| Faltavam telas e contratos de interação | Implementador teria de inventar a UX | Guia de 14 telas, estados, rotas e mockups desktop/móvel |
| A4 retrato descrito sem diferença da referência | Poderia parecer cópia da diagramação original | Diferença explícita em docs/06; retrato preservado |
| “Biblioteca” e “Músicas” duplicavam navegação no prompt 1 | Dois destinos para a mesma tarefa | Um destino Músicas; Início como retomada |
| SongSection no prompt 2 não era entidade definida | Duplicidade de modelo relacional/JSON | Seções permanecem no content_json; tabela separada não obrigatória |
| Batida ativa por Song podia mudar um livro preparado | Revisão fixada não bastaria para manter o PDF | Contrato proposto de snapshot de batida e configurações por item |
| Metadados musicais parcialmente em Song e no JSON | Tom/BPM/capo antigos poderiam variar ao reabrir | Especificar snapshot de revisão como fonte para renderização histórica |
| Revisão imutável com status de decisão “Proposta” | Regras normativas confundidas com escolha técnica | Invariantes já presentes mantidos; estratégia de persistência segue proposta |
| Prompts exigiam nova confirmação mesmo com decisão já autorizada | Interrupção desnecessária na execução | Confirmar apenas decisões bloqueantes ainda não resolvidas |
| PWA citada sem contrato offline | Usuário poderia esperar edição offline pronta | Nenhuma promessa de sincronização/offline completo no MVP |
| Áudio real ainda sem assets/licenças | Mockup poderia sugerir player validado | Mockups sem áudio; indicação explícita e contrato de fallback |

## Recomendações propostas

1. Exibir na navegação de produção apenas módulos disponíveis. Nesta galeria, Fases 5–6 aparecem para documentar a evolução, com rótulo de futuro.
2. Fixar conteúdo musical e batida usada no livro; atualizar explicitamente a seleção, nunca de modo silencioso.
3. Manter “revisão manual” separado de “resultado sugerido”; restaurar cria nova revisão.
4. Oferecer botões de subir/descer além de arrastar e controles de prática que cabem em 360 px.
5. Validar editor com cifras longas e renderer com fontes Unicode antes de ampliar templates.

## O que foi produzido e o que permanece pendente

Produzidos: DESIGN.md, guia funcional, contratos complementares, plano de motion, relatório de revisão, HTML local navegável e imagens de referência das telas. Texto musical fictício, sem reprodução de letras do PDF.

Pendentes: aprovação de direção visual, stack e identidade; definição de amostras licenciadas; spike de PDF; implementação e testes musicais/de persistência; validação de uso com violonistas. Os controles de mockup não equivalem a serviços operacionais.
