# Instruções de trabalho para agentes — StrumLab

Você está no projeto **StrumLab**. Antes de modificar qualquer arquivo, leia `README.md`, `docs/10-roadmap.md`, `docs/12-decisoes.md` e os documentos específicos da fase solicitada. **Inspecione o repositório real**: esta documentação pode anteceder o código.

## Regras obrigatórias

1. Não assuma que qualquer fase foi implementada. Examine arquivos, dependências, comandos e resultados reais.
2. Implemente **somente** a fase explicitamente solicitada, preservando módulos existentes. Não crie análise musical/integração Spotify/YouTube durante a fundação.
3. Não substitua uma decisão marcada **Proposta / validar** por um fato sem registrar confirmação do responsável em `docs/12-decisoes.md`. Se houver decisão bloqueante, apresente opções e pergunte antes de assumir.
4. Nunca invente disponibilidade de APIs, licenças, fontes de letras, acesso a serviços, credenciais ou validação de deploy.
5. Não introduza scraping de letras, downloads não autorizados de streaming, redistribuição automática de obras ou amostras sem licença verificada.
6. Preserve a distinção entre cifra revisada e sugestão automática; reprocessamento **nunca** sobrescreve alterações humanas.
7. Preservar integridade musical: acordes em tokens semânticos, não como espaçamento visual frágil; transposição musical testada; timeline de áudio independente da representação da letra.
8. Manter isolamento entre bibliotecas pessoais/usuários. No protótipo local, usuário fixo somente com restrições de uso claramente documentadas, nunca publicado como autenticação segura.
9. Não usar áudio gerado por osciladores simples como produto final da biblioteca de batidas. Preferir amostras reais de violão licenciadas; fallback deve ser identificado.
10. Preferir soluções incrementais simples, migrações versionadas, testes reproduzíveis e dependências compatíveis. Não criar recursos pagos/deploy de produção sem autorização.

## Fluxo por tarefa

- **Antes:** descreva objetivo, arquivos prováveis, dependências, riscos e critérios de aceite; indique dúvidas realmente bloqueantes.
- **Durante:** implemente com tipagem, tratamento de erro, acessibilidade e testes adequados; atualize contratos, migrations e documentação necessários.
- **Depois:** rode verificações realmente disponíveis; informe comandos, resultados, arquivos modificados, limitações e próxima fase. Não declare teste/deploy realizado sem evidência.

## Fonte de verdade

`docs/01-17`, `DESIGN.md` e ADRs/decisões registradas > `prompts/` (instruções operacionais) > `docs/historico/fonte-v0.2.md` (registro histórico). Mudanças de escopo exigem registro explícito.
