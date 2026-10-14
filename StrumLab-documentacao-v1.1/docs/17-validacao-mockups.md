# 17 — Validação da entrega visual

Data: 13/10/2026. Escopo: pacote documental v1.1, galeria HTML e imagens de design.

## Verificações executadas

- JavaScript extraído da galeria analisado por `vm.Script` do Node.js; as 14 funções de tela foram executadas para gerar os respectivos templates, sem erro.
- Estrutura dos 14 templates verificada por HTMLParser: IDs únicos por tela, campos textuais/seletores com labels e destinos de navegação internos existentes. Checkboxes possuem labels envolvendo os controles.
- Links relativos dos documentos Markdown e imagens conferidos: nenhum destino ausente.
- `examples/pop-folk-basic.json` preservado: 8 eventos, 6 ataques e 2 movimentos silenciosos; slots 1 e 4 silenciosos.
- Inspeção visual das 14 imagens desktop em folha de contato, visão geral e das três imagens móveis. Ajustados truncamento de campo longo e espaçamento/painéis móveis.
- Contraste calculado pela luminância relativa sRGB conforme tabela abaixo. Não equivale a auditoria WCAG completa.

## Contraste de tokens

| Par | Cores | Razão |
|---|---|---:|
| Texto / fundo | #202A24 / #F5F3EC | 13.34:1 |
| Secundário / fundo | #566157 / #F5F3EC | 5.83:1 |
| Branco / verde | #FFFFFF / #244F3C | 9.30:1 |
| Acorde / branco | #A34F2C / #FFFFFF | 5.66:1 |
| Verde / seleção suave | #244F3C / #E8EDE4 | 7.82:1 |
| Secundário / branco | #566157 / #FFFFFF | 6.48:1 |
| Borda / branco | #858A7D / #FFFFFF | 3.54:1 |

Texto normal: alvo 4,5:1. Contornos de controles: alvo 3:1. Estados não dependem somente de cor.

## Natureza das imagens e limites reais

As 17 imagens são **mockups compostos** com desenho programático, seguindo os tokens e layouts do HTML; não são screenshots de aplicação implementada nem capturas do navegador. Elas podem omitir controles secundários presentes na galeria, em favor da hierarquia visual. O HTML é uma referência adicional independente.

A execução da galeria em navegador não foi concluída neste ambiente: Playwright estava disponível, mas o binário Chromium não estava instalado e seu download não produziu um arquivo válido. Portanto, não foi validado em runtime o clique/navegação, o layout CSS em 360/390/1440 px, foco real, teclado, leitor de tela nem compatibilidade entre navegadores. Media queries e foco/reduced motion foram especificados; precisam de verificação no navegador durante a implementação.

Nenhum backend, login, player, processamento de áudio, persistência, exportação do produto ou deploy foi executado. Não existe acurácia musical medida ou sincronização sonora validada nesta entrega. A validação de aplicação segue os gates de docs/11-testes.md por fase.

## Checklist para a primeira implementação

1. Aprovar stack e identidade para Fase 1; reaproveitar decisões já autorizadas.
2. Validar shell em 360/390/1440 px, fluxo de foco e controles de 44 px.
3. Fase 2: round-trip, Unicode, transposição e concorrência reais.
4. Fase 3: renderer, índice/paginação e paridade prévia/PDF reais.
5. Fase 4: samples licenciados, AudioContext e sincronização no dispositivo real.
