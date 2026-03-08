# Prompt para Claude Code — Planejamento e Desenvolvimento do achoQ

---

## CONTEXTO DO PROJETO

Você vai me ajudar a planejar e desenvolver o **achoQ**, um mercado de previsões (prediction market) gamificado voltado para o público brasileiro. É como um Polymarket, mas super simplificado, divertido e com moeda fictícia.

O conceito é simples: todo brasileiro "acha" alguma coisa — "Acho que o Brasil ganha a Copa", "Acho que o Lula ganha em 2026", "Acho que o participante X vence o BBB". O achoQ transforma essa paixão por palpites em um jogo social com recompensas.

---

## STACK TÉCNICA

- **Frontend:** Next.js 14+ (App Router) como PWA (Progressive Web App)
- **Backend/BaaS:** Firebase (Auth, Firestore, Cloud Functions, Cloud Messaging, Hosting)
- **Estilização:** Tailwind CSS
- **Linguagem:** TypeScript
- **Estado:** Zustand ou Context API
- **Deploy:** Firebase Hosting

---

## DESIGN — INSPIRAÇÃO DUOLINGO

O design deve ser fortemente inspirado no Duolingo. Seguir estes princípios:

### Identidade Visual
- **Paleta de cores:** Cores vibrantes e alegres. Cor primária forte (sugestão: um roxo vibrante ou vermelho-coral como cor principal do achoQ), com verde para "SIM", vermelho para "NÃO", e amarelo/dourado para moedas Q$
- **Cantos super arredondados** em todos os cards, botões e containers (border-radius generoso, mínimo 16px)
- **Sombras cartoon/3D** nos botões — aquele efeito de botão "pressável" com borda inferior mais escura (estilo Duolingo), dando sensação tátil
- **Tipografia bold e friendly** — usar fonte sem serifa arredondada (Nunito, Rubik ou similar)
- **Ícones e ilustrações** com estilo flat/cartoon, coloridos e divertidos
- **Mascote:** Criar um personagem/mascote para o achoQ (estilo a coruja do Duolingo) — pode ser um papagaio, uma onça ou outro animal brasileiro estilizado

### Componentes UI (estilo Duolingo)
- **Botões:** Grandes, arredondados, com sombra inferior 3D (4-6px mais escura que a cor do botão). Ao clicar, o botão "desce" removendo a sombra (efeito press)
- **Cards de evento:** Cards grandes e limpos com ícone da categoria, título do evento, barra de progresso mostrando % SIM vs NÃO, e botões de ação
- **Barra de progresso:** Colorida, arredondada, animada (estilo XP bar do Duolingo)
- **Notificações/toasts:** Amigáveis, com ícones divertidos e cores vibrantes
- **Modais:** Suaves, com animações de entrada, fundo com blur
- **Bottom navigation:** 4-5 tabs com ícones ilustrados (Home, Explorar, Ranking, Lojinha, Perfil)
- **Animações:** Micro-interações em tudo — confetti ao acertar, moedas caindo ao ganhar Q$, shake ao errar, pulse no streak counter
- **Empty states:** Ilustrações divertidas quando não há conteúdo
- **Gamification UI:** Streak counter no topo (como o fire do Duolingo), XP bar, level badge sempre visível

### Tom de Voz na Interface
- Linguagem informal e brasileira: "Bora!", "Mandou bem!", "Eita, errou!", "Tá on fire! 🔥"
- Celebrações exageradas nos acertos (como o Duolingo faz)
- Frases motivacionais nos momentos de perda: "Bora recuperar essas moedas!"

---

## FUNCIONALIDADES DETALHADAS

### 1. Autenticação
- Login via número de WhatsApp (Firebase Auth com phone number)
- Envio de código OTP via SMS/WhatsApp
- Após verificação: tela de criação de perfil (username único + escolha de avatar)
- Cada novo usuário recebe 1.000 Q$ ao completar cadastro

### 2. Feed de Eventos (Home)
- Lista de eventos abertos para previsão, organizados por categoria
- Filtros por categoria: ⚽ Esporte | 🎭 Entretenimento | 🏛️ Política
- Cada card de evento mostra: título, categoria, prazo, total de participantes, distribuição atual SIM/NÃO (barra visual), potencial de retorno
- Eventos com destaque/trending no topo
- Pull-to-refresh

### 3. Tela de Previsão (Detalhe do Evento)
- Descrição completa do evento
- Estatísticas: total apostado no SIM vs NÃO, número de participantes
- Seleção: botão "achoQ SIM" (verde) e "achoQ NÃO" (vermelho) — estilo Duolingo, grandes e com efeito 3D
- Slider ou input para definir quantidade de Q$ a apostar
- Saldo atual visível
- Botão de confirmar previsão
- Após confirmar: animação de moedas saindo + card de compartilhamento

### 4. Sistema Parimutuel (Lógica de Backend)
- Todas as apostas vão para um pote por evento
- Quando o evento é resolvido (manualmente pelo admin): o pote é distribuído proporcionalmente entre acertadores
- Rake de 5% retido pela plataforma
- Cloud Function para calcular e distribuir prêmios automaticamente
- Notificação push ao usuário quando o evento é resolvido

### 5. Economia de Moedas Q$
- Saldo exibido sempre no header (com ícone de moeda dourada animada)
- Fontes de moedas:
  - Cadastro: 1.000 Q$
  - Login diário: 50 Q$ (bônus progressivo: 7 dias = +500 Q$)
  - Convidar amigo: 200 Q$ (para ambos)
  - Compartilhar previsão: 25 Q$
  - Streak de acertos: bônus multiplicador
  - Rewarded ads: 50 Q$ por vídeo assistido
- Drenos: apostas perdidas, troca na lojinha, rake 5%

### 6. Gamificação
- **Níveis com nomes brasileiros:**
  - Nível 1: 🐣 Palpiteiro
  - Nível 2: 🤔 Entendido
  - Nível 3: 🏆 Craque
  - Nível 4: 🔮 Oráculo
  - Nível 5: 🧙 Mãe Diná
- **XP:** Ganho por apostas feitas, acertos, streaks, login diário
- **Barra de XP** visível no perfil (estilo Duolingo)
- **Streak counter:** Dias consecutivos de uso, exibido no topo com ícone de fogo
- **Conquistas/badges:** "Primeira previsão", "10 acertos", "Streak de 7 dias", "Mestre do BBB", etc.

### 7. Rankings
- **Ranking Geral:** Top jogadores da plataforma
- **Ranking por Categoria:** Separado para Esporte, Política e Entretenimento
- **Ranking entre Amigos:** Grupos privados de competição
- Rankings semanais com reset (para dar chance a novos jogadores)
- Design de leaderboard estilo pódio para top 3 (com avatares grandes e medalhas)

### 8. Lojinha de Prêmios
- Catálogo de prêmios organizados por preço em Q$
- Categorias: Vouchers digitais (iFood, Spotify, Netflix), Itens in-app (avatares, badges, molduras), Prêmios físicos
- Processo de resgate simples
- Histórico de resgates

### 9. Perfil do Usuário
- Avatar, username, nível atual com barra de XP
- Estatísticas: total de previsões, taxa de acerto, Q$ ganhos, streak atual
- Histórico de previsões (ganhas/perdidas)
- Conquistas desbloqueadas
- Configurações

### 10. Compartilhamento Social
- Ao fazer previsão: gerar card visual para compartilhar
- Card com: evento, escolha do usuário, branding achoQ, link de convite
- Botões de share para WhatsApp, Instagram Stories, Twitter/X
- Deep link que leva direto ao evento no achoQ

### 11. Notificações Push (Firebase Cloud Messaging)
- Novo evento trending
- Evento resolvido ("Você acertou! +340 Q$" ou "Não foi dessa vez...")
- Streak em risco ("Sua streak de 5 dias está em risco! Faça uma previsão hoje")
- Amigo convidado se cadastrou
- Novos prêmios na lojinha

### 12. Painel Admin (área restrita)
- Criar/editar/resolver eventos
- Definir resultado (SIM ou NÃO) para distribuir prêmios
- Visualizar métricas: usuários ativos, eventos populares, economia de moedas
- Gerenciar prêmios da lojinha

---

## ESTRUTURA DO PROJETO (SUGESTÃO)

```
achoq/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service Worker
│   └── icons/                 # App icons
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # Grupo de rotas de autenticação
│   │   │   ├── login/
│   │   │   ├── verify/
│   │   │   └── onboarding/
│   │   ├── (main)/            # Grupo de rotas principais (com bottom nav)
│   │   │   ├── home/
│   │   │   ├── explore/
│   │   │   ├── ranking/
│   │   │   ├── shop/
│   │   │   └── profile/
│   │   ├── event/[id]/        # Detalhe do evento
│   │   ├── admin/             # Painel admin
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                # Componentes base (Button3D, Card, ProgressBar, Modal, Toast)
│   │   ├── event/             # EventCard, EventDetail, BetSlider
│   │   ├── gamification/      # XPBar, StreakCounter, LevelBadge, AchievementCard
│   │   ├── ranking/           # Leaderboard, PodiumTop3
│   │   ├── shop/              # PrizeCard, RedeemModal
│   │   ├── social/            # ShareCard, InviteFriend
│   │   └── layout/            # BottomNav, Header, CoinBalance
│   ├── lib/
│   │   ├── firebase/          # Config, auth, firestore, functions, messaging
│   │   ├── hooks/             # Custom hooks (useAuth, useCoins, useEvents, useRanking)
│   │   ├── stores/            # Zustand stores
│   │   ├── utils/             # Helpers, formatters, constants
│   │   └── types/             # TypeScript types/interfaces
│   └── styles/
│       └── globals.css        # Tailwind + custom animations
├── functions/                 # Firebase Cloud Functions
│   ├── src/
│   │   ├── events/            # Resolver evento, calcular Parimutuel
│   │   ├── coins/             # Login diário, rewards, referral
│   │   ├── notifications/     # Push notifications
│   │   └── admin/             # Admin endpoints
│   └── package.json
├── firestore.rules
├── tailwind.config.ts
├── next.config.js
└── package.json
```

---

## MODELO DE DADOS (FIRESTORE)

### users
```typescript
interface User {
  uid: string;
  phone: string;
  username: string;
  avatarId: string;
  coins: number;              // Saldo Q$
  xp: number;
  level: number;              // 1-5
  streak: number;             // Dias consecutivos
  lastLoginDate: string;      // Para calcular streak
  totalBets: number;
  totalWins: number;
  achievements: string[];     // IDs de conquistas
  referralCode: string;
  referredBy: string | null;
  createdAt: Timestamp;
}
```

### events
```typescript
interface Event {
  id: string;
  title: string;
  description: string;
  category: 'esporte' | 'entretenimento' | 'politica';
  imageUrl?: string;
  status: 'open' | 'closed' | 'resolved';
  result?: 'sim' | 'nao';
  totalPoolSim: number;       // Total Q$ apostado no SIM
  totalPoolNao: number;       // Total Q$ apostado no NÃO
  totalParticipants: number;
  closingDate: Timestamp;     // Quando para de aceitar apostas
  resolvedAt?: Timestamp;
  createdAt: Timestamp;
  featured: boolean;          // Evento em destaque
}
```

### bets
```typescript
interface Bet {
  id: string;
  userId: string;
  eventId: string;
  choice: 'sim' | 'nao';
  amount: number;             // Q$ apostados
  payout?: number;            // Q$ recebidos (preenchido após resolução)
  status: 'pending' | 'won' | 'lost';
  createdAt: Timestamp;
}
```

### transactions
```typescript
interface Transaction {
  id: string;
  userId: string;
  type: 'bet' | 'win' | 'daily_login' | 'referral' | 'share' | 'ad_reward' | 'shop_redeem' | 'signup_bonus' | 'streak_bonus';
  amount: number;             // Positivo = ganho, Negativo = gasto
  description: string;
  relatedEventId?: string;
  createdAt: Timestamp;
}
```

### shop_items
```typescript
interface ShopItem {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: 'voucher' | 'in_app' | 'physical';
  priceCoins: number;
  stock: number;
  active: boolean;
}
```

### rankings (calculado periodicamente via Cloud Function)
```typescript
interface RankingEntry {
  userId: string;
  username: string;
  avatarId: string;
  level: number;
  score: number;              // Baseado em acertos + Q$ ganhos
  position: number;
  period: 'weekly' | 'monthly' | 'alltime';
  category?: 'esporte' | 'entretenimento' | 'politica' | 'geral';
}
```

---

## INSTRUÇÕES PARA O DESENVOLVIMENTO

1. **Comece pelo planejamento:** Antes de escrever código, crie um plano detalhado de implementação fase por fase, mapeando dependências entre funcionalidades.

2. **MVP primeiro:** A primeira fase deve conter apenas: autenticação, feed de eventos, tela de previsão, sistema Parimutuel básico e saldo de moedas. Tudo o resto vem depois.

3. **Design system primeiro:** Crie os componentes UI base (Button3D, Card, ProgressBar, etc.) no estilo Duolingo antes de montar as telas. Isso garante consistência visual.

4. **Mobile-first:** Todo o design deve ser pensado para mobile (PWA). Desktop é secundário.

5. **Performance:** Usar lazy loading, otimizar imagens, implementar skeleton screens durante carregamento.

6. **Acessibilidade:** Contraste adequado, labels em inputs, navegação por teclado.

7. **Animações:** Usar Framer Motion para animações de entrada, transições de página e micro-interações. As animações são parte fundamental da experiência (inspiração Duolingo).

---

Comece me apresentando um plano de desenvolvimento completo, dividido em fases com estimativas de tempo, e salve o planejamento no arquivo plan.md
