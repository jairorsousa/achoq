# Analise de Implementacao - projeto achoQ

Data da analise: 2026-03-05
Fonte principal: `plan.md` + codigo atual em `src/` e `functions/`

## Resumo executivo

- Fase 0: implementada em grande parte (base do app, design system, PWA, Firebase e estrutura principal).
- Fase 1: implementada em boa parte no frontend e backend, com fluxo funcional de auth, feed, aposta e admin.
- Existem pendencias de escopo da Fase 1 e 2 riscos criticos de consistencia de dados que precisam ser corrigidos antes de avancar.

## Fase 0 - status

### Implementado

- Projeto Next.js com TypeScript ativo.
- Tailwind ativo (modelo v4 via `globals.css` com `@theme`).
- Dependencias principais instaladas: Firebase, Framer Motion, Zustand, next-pwa.
- PWA configurado (`next.config.ts`, `public/manifest.json`, icones).
- Estrutura de pastas alinhada ao plano (app, components, lib, functions).
- Firebase config centralizada em `src/lib/firebase/config.ts` via variaveis de ambiente.
- `firestore.rules` presente e detalhado.
- Design system com componentes base criados em `src/components/ui/`.

### Parcial

- Setup de Analytics nao esta integrado no app web (nao ha uso de `getAnalytics` no codigo atual).

## Fase 1 - status por item

### 1.1 Autenticacao

Implementado:
- Rotas `login`, `verify`, `onboarding`.
- Fluxo OTP com Firebase Phone Auth + Recaptcha.
- Componente OTP de 6 digitos.
- Onboarding com username + avatar.
- Persistencia de sessao com listener `onAuthStateChanged` e cookie de sessao para middleware.
- Hook `useAuth` e stores de auth.

Observacoes:
- Criacao de usuario e bonus de 1000 Q$ esta no cliente (onboarding) e tambem na Cloud Function `onUserCreated`.

### 1.2 Feed Home

Implementado:
- Lista de eventos abertos com listener em tempo real (`useEvents` + `onSnapshot`).
- Filtros por categoria na UI.
- Destaque para eventos `featured`.
- `EventCard` com estatisticas e progresso SIM/NAO.
- Skeleton e empty state.

### 1.3 Tela de previsao

Implementado:
- Rota `event/[id]` com descricao e estatisticas em tempo real.
- Botoes SIM/NAO + input/slider de aposta.
- Validacao basica de saldo minimo.
- Confirmacao em modal e toast.
- Bloqueio de aposta duplicada por consulta em `bets`.
- Transacao de aposta com `runTransaction` no Firestore.

Parcial:
- Modal de compartilhamento pos-aposta esta ausente (plano cita para fase beta, mas item aparece no fluxo).

### 1.4 Parimutuel / Cloud Functions

Implementado:
- `resolveEvent` criada e exportada.
- `onBetCreated` criada e exportada.

Parcial:
- Envio de push para participantes nao aparece na `resolveEvent`.

### 1.5 Admin basico

Implementado:
- Rota `/admin` com listagem de eventos.
- Formulario para criar evento.
- Acao para resolver evento via callable function.

Parcial:
- Nao existe listagem de usuarios e saldos no painel.
- Protecao admin no middleware e basica (cookie de sessao), sem validacao real de custom claim no edge.

### 1.6 Saldo Q$ basico

Implementado:
- Saldo visivel no header.
- Listener em tempo real de usuario (`useUser`) atualizando store.

Parcial:
- Plano cita `useCoinsStore`, mas implementacao usa `userStore` para coins.

## Riscos criticos identificados

1. Duplicacao de contagem de evento em aposta
- Em `src/app/event/[id]/page.tsx`, a aposta atualiza `simCount/naoCount/totalBets/totalCoins` dentro da transacao.
- Em `functions/src/events/onBetCreated.ts`, os mesmos campos sao incrementados novamente ao criar a bet.
- Impacto: numeros inflados no evento (double count).

2. Possivel duplicacao de bonus inicial (1000 Q$)
- Onboarding cria user com `coins: 1000` e transacao de boas-vindas no cliente.
- `onUserCreated` tambem seta `coins: 1000` e cria bonus.
- Impacto: comportamento inconsistente, risco de credito duplicado ou overwrite indevido.

3. Fallback de resolucao no admin ignora payout
- Em `src/app/admin/page.tsx`, se callable falhar, faz `updateDoc` direto em `events` para resolver.
- Isso muda status do evento sem executar distribuicao parimutuel.
- Impacto: apostas podem ficar sem liquidacao correta.

## Itens claramente nao implementados (proximas fases)

- Perfil completo (pagina atual e placeholder).
- Ranking funcional (pagina atual e placeholder).
- Lojinha funcional (pagina atual e placeholder).
- Referral/social share/push FCM end-to-end.

## Recomendacao pratica antes da Fase 2

1. Corrigir os 3 riscos criticos acima.
2. Fechar pendencias da Fase 1 (usuarios no admin e regra clara de source-of-truth para saldo e stats).
3. Rodar validacao de regras/firestore e testes de fluxo completo (apostar -> resolver -> payout -> saldo).

Com esse ajuste, o projeto fica mais seguro para evoluir para gamificacao/ranking sem carregar debito tecnico no core economico.

## Revalidacao apos correcoes (2026-03-06)

Status dos 3 riscos criticos apontados anteriormente:

1. Duplicacao de contagem de evento em aposta
- Status: CORRIGIDO.
- Evidencia: `src/app/event/[id]/page.tsx` nao atualiza mais `simCount/naoCount/totalBets/totalCoins`; apenas cria `bet` e debita saldo.
- Evidencia: `functions/src/events/onBetCreated.ts` segue como fonte unica para atualizar estatisticas do evento.

2. Fallback de resolucao no admin ignora payout
- Status: CORRIGIDO.
- Evidencia: `src/app/admin/page.tsx` removeu fallback com `updateDoc` direto em `events`; agora exibe erro quando callable falha.

3. Possivel duplicacao de bonus inicial (1000 Q$)
- Status: PENDENTE.
- Evidencia: `src/app/(auth)/onboarding/page.tsx` ainda cria usuario com `coins: 1000` e transacao de boas-vindas.
- Evidencia: `functions/src/users/onUserCreated.ts` tambem seta `coins: 1000` e cria transacao de boas-vindas.
- Risco: inconsistencias no saldo inicial e duplicacao de registro/credito de bonus.

Recomendacao objetiva:
- Definir uma unica fonte de verdade para bonus inicial.
- Opcao A (recomendada): backend (Cloud Function) como unica responsavel por saldo inicial e transacao; onboarding cria apenas dados de perfil (username/avatar).
- Opcao B: remover bonus da Cloud Function e manter 100% no cliente (menos seguro).

## Atualizacao apos correcao aplicada (2026-03-06)

- Risco 3 (bonus inicial duplicado) foi corrigido.
- `src/app/(auth)/onboarding/page.tsx` nao cria mais transacao de boas-vindas e nao seta `coins/xp/level/streak`.
- Bonus inicial permanece centralizado no backend em `functions/src/users/onUserCreated.ts`.
