# RepublicApp

Organização de moradia compartilhada — um painel simples para reunir tarefas, despesas registradas e responsabilidades de repúblicas, apartamentos compartilhados e famílias, no lugar de mensagens dispersas e planilhas.

Projeto acadêmico da disciplina de Engenharia de Software 3 (UNIVASF), conduzido com Scrum adaptado para equipes de 4 a 5 estudantes.

## Problema

Moradores dividem tarefas, compras e despesas usando mensagens dispersas e planilhas pouco práticas.

## Proposta de valor

Reunir tarefas, despesas registradas e responsabilidades em um painel simples.

## Requisitos funcionais iniciais

1. Criação de residência/grupo e convite por código.
2. Cadastro e atribuição de tarefas.
3. Calendário/recorrência simples de tarefas.
4. Registro de despesa e divisão entre moradores, sem integração bancária.
5. Resumo de saldos meramente informativo.
6. Lista de compras compartilhada.
7. Histórico e filtros.
8. Plano premium simulado para relatórios, automações ou grupos maiores.

## MVP sugerido

Criar grupo, atribuir tarefa, registrar despesa e mostrar resumo de divisão.

## Hipótese de monetização

Freemium com assinatura por grupo/residência.

## Gestão do projeto

O backlog (épicos, histórias de usuário e subtarefas técnicas) é gerenciado no Jira: [RepublicApp — board SCRUM](https://republica.atlassian.net/jira/software/projects/SCRUM/boards/1/backlog).

## Protótipo mobile (React Native / Expo)

Protótipo navegável do MVP com dados mockados (sem backend real) — ver [SCRUM-106](https://republica.atlassian.net/jira/software/projects/SCRUM/boards/1/backlog?selectedIssue=SCRUM-106).

Telas: Criar/Entrar em residência → Tarefas (com atribuição) → Despesas (registro + histórico) → Resumo de saldos.

### Como executar

```bash
npm install
npx expo start
```

Abra no emulador Android/iOS pelo terminal do Expo, ou escaneie o QR code com o app **Expo Go** no celular. Também é possível rodar no navegador com `npx expo start --web` (suporte web serve apenas para visualização rápida do protótipo).
