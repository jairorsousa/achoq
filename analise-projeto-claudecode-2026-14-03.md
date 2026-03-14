# Análise do Projeto achoQ — 14/03/2026

**achoQ** é uma PWA de **mercado de apostas/previsões** para o público brasileiro, com moeda virtual (Q$).

---

## Stack Atual

- **Frontend:** Next.js 16.1.6 + React 19 + Tailwind v4 + Framer Motion 12 + Zustand 5
- **Backend/DB:** **Supabase** (PostgreSQL + Auth) — serviço ativo
- **Cloud Functions:** Firebase Functions v6 + Admin SDK v12 (legado, pode migrar para Edge Functions)
- **PWA:** @ducanh2912/next-pwa 10
- **Package manager:** npm

---

## Arquitetura

| Camada | Implementação |
|---|---|
| Auth | Phone OTP via Supabase Auth |
| Rotas | App Router com route groups: `(auth)` e `(main)` |
| Proteção de rotas | `src/proxy.ts` (Next.js 16 proxy) com cookies `achoq_session` e `achoq_role` |
| Estado | Zustand (authStore, userStore, eventsStore, toastStore) |
| DB | Supabase com RLS + mappers em `src/lib/supabase/mappers.ts` |
| Functions | Firebase CF para resolução parimutuel, rewards, ranking |
| Design System | Componentes em `src/components/ui/` com barrel export |

---

## Estrutura de Diretórios

### Rotas (App Router)

```
src/app/
├── layout.tsx                      # Root layout (Nunito font, PWA manifest)
├── page.tsx                        # Root (redireciona para /home)
├── globals.css                     # Tailwind @theme tokens + design system
├── proxy.ts                        # Next.js 16 proxy para proteção de rotas
├── (auth)/                         # Route group: auth (sem nav/header)
│   ├── layout.tsx
│   ├── login/page.tsx              # Input de telefone + Supabase Auth
│   ├── verify/page.tsx             # Verificação OTP (6 dígitos)
│   └── onboarding/page.tsx         # Username + seleção de avatar
├── (main)/                         # Route group: app (BottomNav + Header)
│   ├── layout.tsx
│   ├── home/page.tsx               # Feed de eventos + filtros + RewardedAdButton
│   ├── explorar/page.tsx           # Página explorar
│   ├── ranking/page.tsx            # Leaderboard (Podium + LeaderboardRow)
│   ├── lojinha/page.tsx            # Lojinha com PrizeCard
│   └── perfil/page.tsx             # Perfil do usuário
├── admin/                          # Admin (protegido por custom claim)
│   ├── layout.tsx
│   └── page.tsx                    # CRUD de eventos, resolução, listagem de users
├── event/[id]/page.tsx             # Detalhe do evento + aposta
├── grupos/                         # Grupos
│   ├── criar/page.tsx
│   ├── entrar/page.tsx
│   └── [groupId]/page.tsx
├── design-system/page.tsx          # Showcase de componentes
└── offline/page.tsx                # Tela offline (PWA)
```

### Componentes

```
src/components/
├── ui/                             # Design system (barrel export via index.ts)
│   ├── Button3D, Card, ProgressBar, XPBar, Modal, Toast/ToastContainer
│   ├── CoinBadge, StreakCounter, LevelBadge, Avatar, Skeleton
│   └── PWAInstallPrompt
├── layout/
│   ├── ClientProviders.tsx         # Dynamic import do AuthProvider (ssr: false)
│   ├── AuthProvider.tsx            # Monta useAuth hook
│   ├── BottomNav.tsx               # 5 tabs com Framer Motion layoutId
│   └── Header.tsx                  # Logo + CoinBadge + StreakCounter + LevelBadge
├── auth/
│   ├── PhoneInput.tsx, OTPInput.tsx, AvatarPicker.tsx
├── events/
│   ├── EventCard.tsx, CategoryFilter.tsx, BetAmountInput.tsx
├── admin/
│   └── AdminEventForm.tsx
├── shop/
│   └── PrizeCard.tsx
├── ads/
│   └── RewardedAdButton.tsx
└── ranking/
    ├── Podium.tsx, LeaderboardRow.tsx
```

### Libraries

```
src/lib/
├── types/index.ts                  # Tipos TS (User, Event, Bet, Transaction, etc.)
├── supabase/
│   ├── config.ts                   # Cliente Supabase com persistência
│   └── mappers.ts                  # Conversores Row → TS types
├── firebase/                       # (VAZIO — legado)
├── stores/
│   ├── authStore.ts, userStore.ts, eventsStore.ts, toastStore.ts
├── hooks/
│   ├── useAuth.ts, useUser.ts, useEvents.ts
└── utils/
    └── format.ts                   # formatCoins, timeRemaining, formatPhoneBR, etc.
```

### Cloud Functions

```
functions/src/
├── index.ts                        # Export central
├── users/
│   ├── onUserCreated.ts            # Trigger: cria doc + 1000 Q$ bônus
│   └── dailyLoginReward.ts         # 50 Q$/dia, bônus streak 7 dias
├── events/
│   ├── resolveEvent.ts             # Admin: resolução parimutuel com 5% rake
│   ├── onBetCreated.ts             # Trigger: atualiza stats do evento
│   └── recordSponsoredImpression.ts
├── shop/
│   └── redeemShopItem.ts
├── ads/
│   └── claimAdReward.ts            # 50 Q$, max 3x/dia
├── rankings/
│   ├── calculateRankings.ts        # Scheduled: top 100 semanal por XP
│   └── calculateSeasonRankings.ts
├── groups/
│   └── joinGroupByCode.ts
├── gold/
│   └── purchaseGoldPackage.ts
├── economy/
│   ├── captureEconomySnapshot.ts
│   └── monitorEconomyAlerts.ts
├── security/
│   └── detectSuspiciousAccounts.ts
└── auth/
    └── whatsappOtp.ts
```

---

## Status por Fase

| Fase | Status | Detalhes |
|---|---|---|
| 0 - Foundation + Design System | ✅ Completa | Componentes UI, layout, tokens, PWA config |
| 1 - MVP | ✅ Completa | Auth, feed, betting SIM/NÃO, admin, parimutuel, Q$ |
| 2 - Beta | 🟡 Parcial | XP/Levels ✅, Streaks ✅, Achievements ❌, Referral ❌, FCM ❌ |
| 3 - Lançamento | 🟡 Parcial | Lojinha ✅, Ads ✅, Ranking parcial, PWA configurado |
| 4 - Growth | ❌ Não iniciada | Sponsors, Seasons, Q$ Gold, Analytics avançado |

---

## Design System

**Tokens (definidos em `globals.css` via `@theme`):**

- Primary: Purple (#7C3AED)
- SIM: Green (#22C55E)
- NÃO: Red (#EF4444)
- Coin: Gold (#F59E0B)
- Border radius: 32px (buttons), 40px (cards)
- Font: Nunito (400, 600, 700, 800)

---

## Banco de Dados (Supabase)

**Tabelas principais:**

- `users` — id, username, display_name, coins, gold_coins, xp, level, streak, last_active_date
- `events` — id, title, description, category, status, sim_count, nao_count, total_bets, total_coins, featured, sponsored
- `event_options` — id, event_id, label, sim_pool, nao_pool, total_bets (multi-option)
- `bets` — id, user_id, event_id, option_id, choice, amount, status, payout
- `transactions` — id, user_id, type, amount, description, related_id
- `shop_items` — id, name, description, type, category, price, stock, available
- `redemptions` — id, user_id, item_id, status
- `rankings` — entries array
- `seasons` — id, name, slug, datas de início/fim

**RLS:** Users leem todos, atualizam apenas próprios campos (coins/xp bloqueados no client). Admin tem acesso total.

---

## Pontos de Atenção

### 1. Firebase vs Supabase — Desconexão
O projeto migrou para Supabase como DB/Auth, mas as Cloud Functions ainda usam Firebase Admin SDK + Firestore. O diretório `src/lib/firebase/` está **vazio**. As CFs (resolveEvent, onBetCreated, etc.) precisam ser reescritas para usar Supabase ou a decisão de manter Firebase CF precisa ser formalizada.

### 2. Cloud Functions desconectadas
As CFs usam `admin.firestore()` para ler/escrever dados. Se o DB agora é Supabase (PostgreSQL), essas funções não estão funcionando contra o banco correto. Opções:
- Reescrever CFs para usar Supabase SDK/REST
- Migrar para Supabase Edge Functions (Deno)
- Manter Firebase Firestore como backend paralelo (não recomendado)

### 3. Artefatos legados
`firestore.rules`, `.firebaserc`, `firebase.json` ainda existem. Se a migração para Supabase é definitiva, podem ser removidos ou movidos para uma pasta `/legacy`.

### 4. Multi-option incompleto
A migração `20260308_multi_option_events.sql` adiciona suporte a eventos com múltiplas opções (ex: "Quem ganha o BBB?"), mas a UI do `event/[id]/page.tsx` parece ainda focada em SIM/NÃO binário.

### 5. Sem testes
Não existe nenhum diretório de testes (`__tests__/`, `*.test.ts`, `*.spec.ts`). Para um app de apostas com dinheiro virtual e lógica parimutuel, testes são críticos.

### 6. Sem CI/CD
Não há configuração de pipeline (GitHub Actions, Vercel, etc.). Deploy é manual.

### 7. Segurança
- RLS no Supabase protege dados sensíveis (coins, xp não editáveis pelo client)
- Proxy protege rotas autenticadas
- CFs validam saldo/estoque antes de operações
- **Falta:** rate limiting, validação de input mais robusta no frontend

---

## Recomendações

1. **Resolver a questão Firebase vs Supabase** — Definir se as Cloud Functions serão migradas para Supabase Edge Functions ou se o Firebase será mantido como camada de backend serverless
2. **Adicionar testes** — Pelo menos para a lógica parimutuel (resolveEvent) e operações de coins
3. **Configurar CI/CD** — GitHub Actions para lint + type-check + deploy automático
4. **Completar multi-option** — UI do evento precisa suportar N opções além de SIM/NÃO
5. **Limpar artefatos legados** — Remover ou organizar arquivos Firebase não utilizados
6. **Implementar FCM** — Push notifications para resultados de apostas e lembretes
