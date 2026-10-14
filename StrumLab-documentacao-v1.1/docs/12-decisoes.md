# 12 — Registro de decisões (ADR simplificado)

**Importante:** escolhas abaixo são **recomendações de arquitetura** da revisão, não decisões previamente confirmadas pelo usuário. Validar antes de contratar recursos externos ou fechar integrações.

| ID | Decisão proposta | Estado | Motivo / condição |
|---|---|---|---|
| D-001 | Nome do produto: **StrumLab** | Confirmada pelo usuário | Substitui nomes anteriores e título genérico |
| D-002 | Next.js + React + TypeScript para web/PWA | Proposta | UI responsiva e manutenção |
| D-003 | Java 21 + Spring Boot para API | Proposta | Experiência com Java e regras de negócio |
| D-004 | PostgreSQL local via Docker Compose | Proposta | Modelo relacional e desenvolvimento reproduzível |
| D-005 | Python + FFmpeg para worker de análise, só na Fase 5 | Proposta | Bibliotecas de áudio especializadas |
| D-006 | Web Audio API + samples licenciados para batidas | Requisito funcional; implementação proposta | Timbre mais próximo de violão real |
| D-007 | ChordPro como intercâmbio, modelo estruturado como fonte | Proposta | Posicionamento de acordes e exportação |
| D-008 | Revisões imutáveis e resultado de IA separado | Proposta | Preservar correções manuais |
| D-009 | PDF: avaliar HTML/print Chromium vs biblioteca dedicada | Pendente spike | Índice, Unicode, paginação, colunas |
| D-010 | MVP inicial local com usuário de desenvolvimento; auth antes de contas públicas | Proposta | Reduzir escopo sem comprometer privacidade |
| D-011 | Storage privado S3-compatível quando necessário | Proposta | Separação de arquivos e metadados |
| D-012 | Fila persistida em banco inicialmente; avaliar broker conforme carga | Proposta | Evitar complexidade prematura |
| D-013 | Não baixar áudio protegido nem letras sem autorização | Restrição obrigatória | Termos, direitos e licenças |

## Pendências para validar antes da implementação
- Modo de autenticação no protótipo e estratégia futura.
- Limites de upload e política de retenção.
- Licenças e origem das amostras reais de violão.
- Estratégia final de renderização de PDF.
- Fonte autorizada de letras/cifras e condições de compartilhamento.
- Hosting, orçamento e volume previsto (não contratar sem autorização).

## Como registrar alterações
Adicionar data, contexto, alternativas, decisão, consequências, responsável e status; não apagar decisões anteriores, marcar como substituídas.

## Registro da revisão de 13/10/2026 — v1.1

Responsável pela proposta: revisão documental assistida; aprovação do responsável pelo projeto pendente.

| ID | Proposta | Estado | Alternativa / consequência |
|---|---|---|---|
| D-014 | Papel & Cordas; navegação Início/Músicas/Cancioneiros/Batidas | Proposta visual | Validar com usuário; não aprova tema nem stack |
| D-015 | Snapshot musical da revisão + batida por item de livro | Proposta de implementação | Evita leitura dinâmica do vínculo atual alterar prévia; amplia manifesto/migration na fase pertinente |
| D-016 | A4 retrato inicial; referência JUMAS é paisagem | Clarificação da proposta existente | Paisagem/categorias exigem validação de escopo |
| D-017 | Microinterações discretas; GSAP opcional, relógio musical via Web Audio | Proposta | CSS suficiente para mockups; GSAP não é dependência obrigatória |

As invariantes de revisão imutável, isolamento e sugestões separadas já constam das regras de negócio; o status proposto refere-se às tecnologias/estratégias usadas para cumpri-las. Nenhuma escolha pendente foi elevada a confirmada nesta entrega.

## Registro de implementação — 14/10/2026

Responsável: usuário do projeto, em confirmação explícita na sessão de implementação.
Contexto: repositório sem código; início da Fase 1 conforme a sequência v1.1.
Alternativas apresentadas: stack proposta com protótipo local, stack com login real,
ou alteração de tecnologias. Escolha do responsável: **seguir com a proposta local**.

| ID | Decisão | Estado nesta sessão | Consequência |
|---|---|---|---|
| D-002 | Next.js + React + TypeScript | Confirmada pelo usuário | Frontend em apps/web |
| D-003 | Java 21 + Spring Boot | Confirmada pelo usuário | API em apps/api |
| D-004 | PostgreSQL local via Docker Compose | Confirmada pelo usuário | Infraestrutura local; nenhuma contratação |
| D-010 | Protótipo local de usuário único, sem login público | Confirmada pelo usuário | Processos e banco vinculados ao loopback; identidade local não é autenticação |

Registros anteriores preservados como histórico. Escolhas de versões e ferramentas
de teste são detalhes técnicos da Fase 1. Papel & Cordas é referência provisória de
implementação; D-014 permanece proposta visual. Esta confirmação não aprova deploy,
worker, integrações, fontes de conteúdo, samples ou implementação das fases seguintes.

## Continuação da implementação — 14/10/2026 — Fase 2

Responsável pela autorização de escopo: usuário, ao pedir continuidade após a entrega
da Fase 1 e indicação da biblioteca/editor como próximo gate. Responsável pelas escolhas
incrementais de implementação: agente de engenharia, dentro do prompt 02 autorizado.

Não houve confirmação individual dos ADRs gerais D-007/D-008/D-015 nesta mensagem;
seu estado abrangente de proposta foi preservado. O subset ChordPro, os tokens,
a imutabilidade e os metadados históricos foram implementados conforme os requisitos
e invariantes do prompt 02/documentos 04/05/15. Não se afirma compatibilidade completa
com ChordPro, nem aprovação de snapshots de batida/livros ainda não implementados.

| ID | Escolha técnica aplicada ao protótipo | Contexto / alternativas / consequências |
|---|---|---|
| D-018 | Rascunho com contador de versão e lock por música; revisões append-only | Alternativa: versão só da revisão. Contador também detecta autosave concorrente; trigger impede UPDATE/DELETE das revisões |
| D-019 | Entrada textual de acordes por seção convertida em tokens | Alternativa: editor WYSIWYG. Mantém implementação incremental e âncoras sem espaços frágeis; leitura renderiza acordes sobre o texto |
| D-020 | Token privado entre proxy Next.js e Java; Origin/Host limitado ao loopback | Alternativa: API de escrita anônima local. Evita requisições de outros sites; não substitui autenticação multiusuário |
| D-021 | Banco strumlab_test separado e serviços temporários para QA | Alternativa: inserir fixtures no banco pessoal. Preserva biblioteca do usuário; nenhum volume existente é apagado |

Status D-018–D-021: **escolhas técnicas implementadas na fase local autorizada**;
reavaliar antes de publicação. Limites/gramática/subset no contrato `docs/editor.md`
do repositório. Não houve aprovação de hosting, PDF definitivo, licenças de samples,
integrações, compartilhamento ou fases futuras.

## Continuação — 14/10/2026 — Fase 3

Escopo autorizado pelo usuário: prosseguir após a indicação de cancioneiros/PDF
como próximo gate. Escolhas técnicas sob responsabilidade do agente, dentro do
prompt 03. Não houve contratação/deploy ou aprovação de recursos de fases posteriores.

- **D-009, conclusão do spike local:** PDFKit selecionado para o protótipo após
  comparação real com Chromium nas mesmas trinta músicas, A4/1–2 colunas, índice,
  Unicode e imagens renderizadas. Ambos passaram; PDFKit evitou browser em runtime
  e gerou arquivos menores. Escolha aplicada à fase autorizada; hosting permanece
  pendente. Registro original preservado como histórico e comparação em
  `docs/pdf-spike.md` do repositório.
- **D-022:** PDF.js lê os bytes persistidos do PDF, em vez de gerar uma segunda
  representação HTML para prévia. Consequência: prévia e download têm mesmo arquivo/hash.
- **D-023:** Exportação local com manifesto imutável, lease e PDF em BYTEA no
  PostgreSQL. Alternativa: blobs em storage externo. Evita contratar infraestrutura
  nesta fase; reavaliar quotas/storage antes de publicação.
- **D-024:** Noto Sans/Serif e fallbacks licenciados OFL-1.1, com commits/hashes.
  Alternativa: depender de fontes do sistema. Fontes incluídas para preservar glyphs
  e métricas; caractere sem cobertura gera validação, não descarte.

D-022–D-024: escolhas técnicas implementadas no protótipo da fase autorizada.
A4 retrato segue o prompt; categorias/paisagem e snapshots de batida de D-015 ainda
não foram implementados. Token local segue D-020; não aprova autenticação pública.
