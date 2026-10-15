# Preferências, recuperação e uso offline

Preferências de tamanho de leitura, contraste e redução de movimento persistem
neste navegador. Redução de movimento do sistema continua respeitada.

O editor guarda alterações ainda não enviadas em localStorage por música,
incluindo texto com sintaxe incompleta. Ao reabrir, oferece recuperar ou descartar.
Se a biblioteca mudou, exige comparar/descartar ou criar cópia; a versão antiga
não é trocada silenciosamente pela nova, nem após fechar novamente. Salvamento
confirmado limpa a recuperação correspondente. Falta de quota é informada.

Na leitura, **Guardar cifra para uso offline** copia a cifra/revisões e prepara
as páginas de leitura/edição. Abra `/offline.html` por navegação completa para
listar e abrir cópias com serviços/rede indisponíveis. As cópias têm data e podem
estar antigas; atualizá-las exige novo salvamento explícito. Edição offline fica
na recuperação local; o app não afirma ter salvo no servidor. Ao reconectar,
recupere/revise e salve, respeitando o controle de versões.

Service worker não armazena endpoints API, credenciais, OAuth, Spotify ou áudio.
Cifra escolhida e rascunho recuperável ficam acessíveis a quem usar este perfil
do navegador. **Apagar cifras offline e recuperação local** limpa essas cópias e
cache do app, preservando preferências e biblioteca/PDFs no servidor. Limpar os
dados do navegador também elimina recuperações. Isso não substitui backup.

Manifesto e ícones permitem instalação pelo menu do navegador quando suportado.
Requer contexto seguro (HTTPS ou loopback); instalação/suporte varia conforme
navegador. QA local verificou rede desligada no Chromium, não Safari/iOS/Firefox.
PDFs, batidas e análises não foram disponibilizados offline nesta complementação.
