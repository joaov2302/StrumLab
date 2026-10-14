# 16 — Motion e preflight de design

Aplicação do MotionDesign à documentação e galeria. As orientações de landing page são adaptadas à finalidade funcional: editor, livro e treino não recebem scroll pinning ou conteúdo que se move enquanto o músico lê. Nenhuma dependência GSAP foi instalada/contratada.

## Preflight registrado antes dos mockups

Seleção determinística em Python (seed fixa 163 para tornar a escolha reproduzível): Editorial Split; Geist; Horizontal Accordions / Feedback-Testimonial Carousel / Infinite Marquee; Image Scale & Fade Scroll / Card Stacking. São referências para uma eventual página de apresentação, não requisitos do MVP musical.

`<design_plan>`
- Navegação → atenção pelo título editorial → interesse pelo último repertório → desejo pela prévia do livro/prática → ação “Criar cifra”. Adaptação de AIDA à tela de Início, sem funil comercial.
- Título ocupa largura disponível, máximo lógico 960 px no desktop; tamanho ajustado no móvel, sem badges decorativos sobre título.
- Grid editorial de dois painéis: 2 células ocupadas de 2; lista abaixo ocupa toda a linha. `grid-auto-flow: dense`; sem células vazias planejadas.
- Rótulos descrevem tarefas; botões têm texto branco sobre verde ou escuro sobre fundo claro. Contraste medido em relatório.
`</design_plan>`

## Composição proposta para implementação

- Shell: transição curta de opacity ao navegar, com foco no título; respeitar redução de movimento.
- Painel lateral/editor: 180 ms opacity e translateY de 4 px; nunca animar posição do acorde independentemente do texto.
- Reordenação: 160 ms transform com anúncio textual do novo índice; ordem lógica DOM atualizada.
- Prática: destaque do slot diretamente do AudioContext + requestAnimationFrame; GSAP nunca controla andamento.
- Capa/prévia: scale/fade discreto e opcional ao abrir, sem interferir em zoom ou paginação.
- Em eventual apresentação: GSAP ScrollTrigger pode fazer scale/fade de capas e card stacking em desktop; `gsap.matchMedia()` remove scroll motion no móvel/reduced motion; cleanup via context/revert. Marquee/carrossel só após existir conteúdo real, com pausa e controles acessíveis.

## Limite desta entrega

Mockups implementam somente feedback CSS, navegação local e controles visuais. Não contêm GSAP, player musical ou análise. As opções editoriais/marketing sorteadas foram documentadas para futuro, sem forçar estruturas promocionais no workspace. Performance, reduced motion e sincronização sonora precisam de validação na aplicação real.
