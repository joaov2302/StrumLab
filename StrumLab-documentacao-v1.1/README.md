# StrumLab

> Da música ao seu cancioneiro.

**Versão da documentação:** 1.1 · **Data-base:** 13/10/2026 · **Situação:** planejamento aprovado como proposta de implementação; nenhum módulo deste pacote pressupõe código existente.

O **StrumLab** é uma plataforma web responsiva, concebida como PWA, para **criar, editar e organizar cifras**, praticar **batidas de violão** com áudio e metrônomo e **montar cancioneiros personalizados**. Em fases posteriores, oferecerá **análise automática de áudio** e **importação de metadados de playlists** por meios autorizados.

## Por onde começar

1. Leia [`docs/01-visao-produto.md`](docs/01-visao-produto.md), [`docs/10-roadmap.md`](docs/10-roadmap.md), [`docs/12-decisoes.md`](docs/12-decisoes.md).
2. Verifique as decisões com status **Proposta / validar**. A indicação de tecnologia não equivale a autorização para contratar serviços ou criar infraestrutura remota.
3. Abra um repositório vazio e copie este pacote (ou coloque-o dentro de um repositório já existente, preservando o conteúdo existente).
4. Abra [`prompts/01-fase-1-fundacao.md`](prompts/01-fase-1-fundacao.md) no Codex. O agente deve primeiro inspecionar o repositório e confirmar os pontos bloqueantes.
5. Execute somente a fase autorizada; atualize documentação e decisões ao concluir cada entrega.

## Estrutura

```text
StrumLab-documentacao-v1.1/
├── README.md                      # Guia e índice
├── AGENTS.md                      # Regras para Codex/agentes
├── docs/
│   ├── 01-visao-produto.md
│   ├── 02-requisitos.md
│   ├── 03-arquitetura.md
│   ├── 04-modelo-de-dados.md
│   ├── 05-editor-cifras.md
│   ├── 06-cancioneiros.md
│   ├── 07-biblioteca-batidas.md
│   ├── 08-analise-audio.md
│   ├── 09-integracoes.md
│   ├── 10-roadmap.md
│   ├── 11-testes.md
│   ├── 12-decisoes.md
│   └── historico/fonte-v0.2.md
├── examples/
│   └── pop-folk-basic.json
└── prompts/
    ├── 00-como-usar.md
    ├── 01-fase-1-fundacao.md
    ├── 02-fase-2-biblioteca-editor.md
    ├── 03-fase-3-cancioneiros.md
    ├── 04-fase-4-batidas.md
    ├── 05-fase-5-analise-audio.md
    └── 06-fase-6-playlists.md
```

## Sequência oficial proposta

| Fase | Escopo | Entrega verificável |
|---|---|---|
| 1 | Fundação técnica | Frontend, API, PostgreSQL, health check, CI e navegação funcional |
| 2 | Biblioteca e editor | Cifras editáveis, revisões, transposição e capo |
| 3 | Cancioneiros | Organização, capa, índice, prévia e PDF |
| 4 | Biblioteca de Batidas | Pop/Folk e outros modelos, amostras reais de violão, metrônomo, animação e aplicação à cifra |
| **Marco MVP** | **Uso musical sem IA** | **Criar cifra → salvar → montar cancioneiro → praticar batida → exportar PDF** |
| 5 | Análise automática | Upload, jobs e sugestões de BPM, tom e acordes revisáveis |
| 6 | Playlists | Metadados autorizados, pendências de áudio, importação por item |

O arquivo `docs/historico/fonte-v0.2.md` preserva a versão anterior para comparação; ela **não substitui** esta especificação. A principal mudança deliberada foi deslocar a análise automática de áudio para depois do MVP útil sem IA.

## Convenções

- **Confirmado pelo usuário:** nome **StrumLab**, biblioteca de batidas com **som de violão mais realista**, foco em cifras e cancioneiros, desenvolvimento por fases com Codex.
- **Proposta técnica a validar:** Next.js/TypeScript, Java 21/Spring Boot, PostgreSQL, armazenamento de objetos e worker Python em fase posterior.
- **Não decidido:** provedor de hospedagem, login público, licenças de amostras, limites definitivos de uploads e motor definitivo de PDF.
- **Direitos autorais:** usar somente conteúdo com permissão ou disponibilizado pelo titular em contexto autorizado. Metadados não dão direito a baixar áudio nem redistribuir letra.
- **Documentação vs. implementação:** arquivos Markdown e JSON de exemplo não são uma aplicação operacional.

## Referência visual

O PDF disponibilizado pelo usuário, `Cancioneiro Jumas Brasil - Cifras.pdf`, é referência **de estrutura editorial** (capa, índice por categorias, cifras em colunas e paginação), não fonte de conteúdo a replicar nem autorização para distribuir obras de terceiros.

## Revisão visual v1.1

Leia [relatório de revisão](docs/13-revisao-contexto.md), [DESIGN.md](DESIGN.md), [telas e funcionalidades](docs/14-telas-funcionalidades.md), [contratos complementares](docs/15-contratos-ux-dados.md), [motion](docs/16-motion.md) e [validação](docs/17-validacao-mockups.md). Abra [galeria de mockups](mockups/index.html) localmente. Imagens em `mockups/screens/` mostram desktop e celular.

Direção visual e contratos adicionais são **propostas**. A galeria tem dados fictícios e navegação demonstrativa, sem persistência, áudio, login, integração ou exportação musical. A sequência de fases foi preservada. O histórico v0.2 foi mantido intacto.
