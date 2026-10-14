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
