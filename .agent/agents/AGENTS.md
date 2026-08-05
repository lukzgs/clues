# Workspace Rules

## 1. Comunicacao e Idioma

- **Sem Emojis ou Icones nas Mensagens**: Nunca utilize emojis ou icones em respostas do assistente, relatorios ou snippets de console. Mantenha as mensagens totalmente limpas, diretas e tecnicas.
- **Idioma de Comunicacao**: A comunicacao com o usuario deve ser sempre em portugues. Nomes de variaveis, funcoes, tipos, componentes, comentarios no codigo e mensagens de commit devem ser escritos em ingles.

## 2. Controle de Git e Comandos Destrutivos

- **Commits Apenas Sob Autorizacao Explicita**: Nunca execute comandos `git commit` ou `git push` sem autorizacao ou pedido previo e explicito do usuario. Apresente a sugestao de commits e aguarde o pedido ou confirmacao do usuario antes de rodar os comandos.
- **Comandos Destrutivos Apenas Sob Autorizacao**: Acoes com potencial de perda de dados (remocao de arquivos/diretorios, `git reset`, `git rebase`, limpeza de banco de dados) exigem permissao previa e explicita do usuario.

## 3. Verificacao e Qualidade de Codigo

- **Verificacao Obrigatoria Pos-Edicao**: Nunca declare uma tarefa concluida sem compilar o codigo e executar a suite de testes ou linters para validar que o sistema continua funcionando.
- **Inspecao de Logs em Erros**: Diante de uma falha de compilacao ou teste, leia o log de erro completo antes de propor qualquer alteracao no codigo. Nunca tente corrigir erros sem antes compreender a causa raiz.
- **Proibicao de Solucoes Superficiais**: E proibido mascarar erros com blocos `try/catch` vazios, suprimir alertas do linter com comentarios de desativacao, comentar testes que falharam ou retornar valores falsos para esconder excecoes.

## 4. Controle de Escopo e Autonomia

- **Contexto Antes de Codigo**: Ao receber uma tarefa, leia e compreenda os arquivos relevantes do projeto antes de propor qualquer alteracao. Nunca assuma a estrutura ou o conteudo de um arquivo sem inspeciona-lo.
- **Modificacoes Focadas ao Escopo**: As alteracoes de codigo devem se restringir estritamente aos arquivos e funcoes necessarios para cumprir o requisito da tarefa. Evite refatoracoes oportunistas em codigo nao relacionado.
- **Planejamento em Tarefas Complexas**: Para qualquer tarefa que envolva mais de 3 arquivos ou mudancas arquiteturais, apresente um plano de implementacao e aguarde aprovacao antes de iniciar as alteracoes.
- **Proibicao de Remocao Silenciosa de Funcionalidades**: Nunca remova funcionalidades, rotas, endpoints, componentes ou testes existentes a menos que isso faca parte explicita do requisito solicitado pelo usuario.
- **Preservacao de Contexto e Documentacao**: Mantenha todos os comentarios, docstrings e tipos existentes no codigo intactos, a menos que a alteracao torne o comentario obsoleto.

## 5. Integridade Arquitetural e Reutilizacao

- **Auditoria de Codigo Existente**: Antes de criar uma nova classe auxiliar, funcao utilitaria ou abstracao, busque no repositorio se ja existe um utilitario interno similar para reaproveitar.
- **Integridade de Contratos e Tipos**: Ao alterar a assinatura de uma funcao, metodo ou tipo exportado, localize e atualize todas as chamadas desse simbolo no projeto para evitar quebras em tempo de execucao.
- **Gerenciamento Conservador de Dependencias**: Nao adicione novas bibliotecas ou pacotes sem antes verificar se a solucao pode ser feita nativamente ou com as dependencias ja instaladas no projeto.

## 6. Seguranca de Software

- **Validacao de Entrada nas Fronteiras**: Toda entrada de dados do usuario ou de APIs externas deve ser validada e sanitizada na camada de entrada antes do processamento.
- **Queries Parametrizadas Obrigatorias**: Utilize obrigatoriamente queries parametrizadas para acesso a banco de dados (prevencao de SQL Injection) e validacao de caminhos absolutos para manipulacao de arquivos (prevencao de Path Traversal).
- **Proibicao de Segredos no Codigo**: Nunca insira chaves de API, senhas, tokens ou qualquer credencial diretamente no codigo-fonte. Utilize variaveis de ambiente em arquivos `.env`.

## 7. Protecao de Arquivos de Configuracao

- **Configuracoes Apenas Sob Autorizacao**: Nao modifique arquivos de configuracao do projeto (`tsconfig.json`, `package.json`, `eslint.config`, `vite.config`, `.env`, `docker-compose`, etc.) sem autorizacao previa e explicita do usuario.
