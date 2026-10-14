# StrumLab — Papel & Cordas

Status: **proposta visual v1.1**. Inspirada na organização de workspace e hierarquia editorial da análise estática Notion do Awesome DESIGN.md; não copia marca, textos ou paleta do Notion. Themely apresenta os mesmos tokens de mockups/theme.json. UI UX Designer orienta telas, estados e acessibilidade; MotionDesign orienta motion sem prejudicar a tarefa musical.

## Princípio visual

Uma bancada musical: papel quente para leitura, verde profundo para ações, cobre para acordes e acentos. Poucas superfícies, informação organizada em listas e painéis. Nenhum catálogo público fictício. Conteúdo musical demonstrativo é autoral/fictício.

| Token | Valor | Uso |
|---|---|---|
| background | #F5F3EC | Fundo da aplicação |
| surface | #FFFFFF | Editor e painéis |
| surfaceMuted | #EEECE3 | Áreas secundárias |
| foreground | #202A24 | Texto principal |
| foregroundMuted | #566157 | Texto secundário |
| primary / onPrimary | #244F3C / #FFFFFF | Ação principal e seleção |
| secondary / onSecondary | #E8EDE4 / #244F3C | Seleção suave |
| accent | #A34F2C | Acordes e avisos de revisão |
| border | #858A7D | Contornos de controles |

Contrastes numéricos e pares avaliados em docs/17-validacao-mockups.md. Verde/cobre não são as únicas pistas: seleção, erro e revisão sempre possuem texto/símbolo.

## Tipografia e geometria

- Interface: Geist como opção de implementação após validar pacote/licença; mockup usa Segoe UI/Arial sem baixar fontes. Corpo 16 px, secundário 14 px.
- Títulos editoriais: Georgia com serif fallback; 32–48 px no desktop e 28–36 px no celular. A dupla serif/interface é uma adaptação musical, não uma decisão aprovada.
- Acordes e contagem: Consolas/Courier New; tokens ancorados ao texto, nunca espaços como estrutura persistida.
- Escala de espaço: 4, 8, 16, 24, 32, 48 px. Raio 8 em controles, 12 em painéis, 20 em blocos editoriais.
- Shell desktop: sidebar 208 px, conteúdo com padding 32 px, grid de 12 colunas lógico. Em menos de 760 px, seletor de telas da galeria, navegação compacta e colunas empilhadas; 4 colunas lógicas no móvel.
- Controles: alvo de pelo menos 44 × 44 px. Foco com outline de 3 px e offset; campos rotulados.

## Componentes

| Componente | Variantes / estados |
|---|---|
| Botão | Primário, secundário, perigo; hover, focus, disabled, loading |
| Lista de músicas | Título, tom, BPM, status, abrir; sem depender de tabela larga no móvel |
| Cifra | Tokens de acorde sobre trecho; sem dividir acorde da palavra |
| Revisão | Número/data, origem, abrir/restaurar como nova revisão |
| Livro | Capa, título, revisão fixada por item, ações de ordem |
| Grade rítmica | Oito movimentos, posição atual com contorno + texto |
| Alerta | Estado + ação de recuperação, sem apagar rascunho |
| Prévia | Página A4 proporcional, miniaturas e controles com rótulos |

## Motion e responsabilidades

Microinterações: 120–180 ms para feedback; 180–240 ms para painéis, somente opacity/transform. `prefers-reduced-motion` remove movimentos decorativos, preserva estado atual do ritmo. A contagem visual usa relógio de áudio na aplicação futura, não GSAP como relógio musical.

GSAP é proposta para transições opcionais; não dependência aprovada da stack. Nada de pinning/scroll forçado no editor, na cifra ou na prática. Em eventual página de apresentação, a proposta MotionDesign pode usar scale/fade e empilhamento; detalhes e preflight em docs/16-motion.md. A galeria local usa CSS leve, não implementa runtime GSAP nem som.

## Escrita e estados

Preferir “Criar cifra”, “Salvar revisão”, “Ver prévia”, “Aplicar à música”. “Salvo” só após confirmação de persistência; “Alterações no rascunho” antes dela. Áudio indisponível: “Não foi possível carregar o violão. Tentar novamente”. Vazio: explicar e oferecer ação. Futuro não aparece como botão ativo no MVP.
