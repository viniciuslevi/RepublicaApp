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

## App mobile (React Native / Expo)

Telas: Criar/Entrar em residência → Tarefas (com atribuição) → Despesas (registro + histórico) → Resumo de saldos.

### Backend

Autenticação, residências (criar/entrar por código/remover morador) e tarefas (com recorrência) já conversam com a API real: [`../republica-backend`](../republica-backend), deployada em produção em `https://republica-backend-bo50.onrender.com` (Render + MongoDB Atlas — ver o README do backend). **Despesas e lista de compras continuam locais/mockadas** — o backend ainda não oferece esses endpoints (ver `docs/API.md` do backend).

Camada de integração: `src/config/env.js` (URL da API), `src/services/apiClient.js` (fetch + tokens + refresh automático), `src/services/authService.js`, `src/services/residenceService.js`, `src/services/taskApi.js`.

> O serviço do Render está no plano free — se ninguém usar por ~15 min ele "dorme"; a primeira requisição depois disso demora uns 30-50s pra acordar. Normal, só esperar.

### Como executar

```bash
npm install
npx expo start
```

Abra no emulador Android/iOS pelo terminal do Expo, ou escaneie o QR code com o app **Expo Go** no celular. Também é possível rodar no navegador com `npx expo start --web`. Por padrão já aponta para o backend em produção — não precisa rodar nada localmente.

**Para desenvolver contra um backend local** (`npm run dev` no `republica-backend`): copie `.env.example` para `.env` e descomente a linha certa pra sua plataforma:

| Ambiente | `EXPO_PUBLIC_API_URL` |
|---|---|
| Web / iOS Simulator | `http://localhost:3000` |
| Emulador Android | `http://10.0.2.2:3000` (alias do host dentro do emulador) |
| Dispositivo físico (mesma rede) | `http://<ip-da-máquina>:3000` |
