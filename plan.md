# achoQ — Plano de Desenvolvimento Completo

**Versão:** 1.0 | **Criado em:** Março 2026

---

## Stack Técnica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14+ (App Router) — PWA |
| Estilização | Tailwind CSS + Framer Motion |
| Linguagem | TypeScript |
| Estado global | Zustand |
| Backend/BaaS | Firebase (Auth, Firestore, Cloud Functions, FCM, Hosting) |
| Deploy | Firebase Hosting |

---

## Visão Geral das Fases

| Fase | Nome | Duração | Objetivo |
|------|------|---------|---------|
| 0 | Fundação & Design System | Semana 1-2 | Setup do projeto e componentes base |
| 1 | MVP | Semana 3-6 | Auth + Feed + Previsão + Parimutuel + Q$ básico |
| 2 | Beta | Semana 7-10 | Gamificação + Social + Notificações Push |
| 3 | Lançamento | Semana 11-14 | Lojinha + Ads + Rankings completos |
| 4 | Crescimento | Semana 15-24 | Eventos patrocinados + Q$ Gold + Temporadas |

---

## FASE 0 — Fundação & Design System (Semana 1-2)

**Objetivo:** Ter o projeto configurado e o design system pronto antes de qualquer tela de negócio.

### Setup do Projeto

- [ ] Inicializar projeto Next.js 14+ com App Router e TypeScript
- [ ] Configurar Tailwind CSS com tema customizado (cores, fontes, border-radius)
- [ ] Instalar dependências: Framer Motion, Zustand, Firebase SDK, Nunito/Rubik (Google Fonts)
- [ ] Configurar PWA: `next-pwa`, `manifest.json`, service worker
- [ ] Configurar Firebase: inicializar projeto, Auth, Firestore, Functions, FCM, Hosting
- [ ] Criar estrutura de pastas conforme definido no PRD
- [ ] Configurar `firestore.rules` com regras de segurança base
- [ ] Setup de variáveis de ambiente (`.env.local`)

### Design System (Componentes UI base)

Todos os componentes devem seguir a identidade visual Duolingo-inspired:
- Cantos super arredondados (border-radius ≥ 16px)
- Sombras cartoon/3D nos botões (efeito pressável)
- Cores vibrantes: roxo/coral como primária, verde para SIM, vermelho para NÃO, dourado para Q$
- Fonte Nunito ou Rubik (bold e friendly)

#### Componentes a criar em `src/components/ui/`:

| Componente | Descrição |
|-----------|-----------|
| `Button3D` | Botão grande arredondado com sombra inferior 3D, efeito press ao clicar (Framer Motion) |
| `Card` | Card com cantos arredondados, sombra suave, variantes: default, featured, flat |
| `ProgressBar` | Barra animada, colorida, arredondada — mostra % SIM vs NÃO |
| `XPBar` | Barra de progresso de XP estilo Duolingo |
| `Modal` | Modal com fundo blur, animação de entrada/saída suave |
| `Toast` | Notificação amigável com ícone e cores vibrantes |
| `CoinBadge` | Exibição de saldo Q$ com ícone dourado animado |
| `StreakCounter` | Contador de streak com ícone de fogo |
| `LevelBadge` | Badge de nível com ícone e nome temático brasileiro |
| `Avatar` | Componente de avatar circular com borda colorida por nível |
| `Skeleton` | Skeleton screens para carregamento |
| `BottomNav` | Navegação inferior com 5 tabs e ícones ilustrados |
| `Header` | Header com saldo Q$, streak e nível visíveis |

#### Tokens de Design (tailwind.config.ts):

```typescript
// Cores principais
primary: '#7C3AED'       // Roxo vibrante
sim: '#22C55E'           // Verde SIM
nao: '#EF4444'           // Vermelho NÃO
coin: '#F59E0B'          // Dourado Q$
bg: '#F9FAFB'            // Background claro

// Border radius
'4xl': '2rem'            // 32px — botões grandes
'5xl': '2.5rem'          // 40px — cards principais

// Sombra 3D para botões
'btn-sim': '0 6px 0 #16A34A'
'btn-nao': '0 6px 0 #DC2626'
'btn-primary': '0 6px 0 #5B21B6'
```

---

## FASE 1 — MVP (Semana 3-6)

**Objetivo:** Produto funcional com fluxo completo: entrar → ver eventos → fazer previsão → ver saldo.

### 1.1 Autenticação (Semana 3)

**Rotas:** `/(auth)/login`, `/(auth)/verify`, `/(auth)/onboarding`

- [ ] Tela de Login: input de número de celular com máscara BR (+55)
- [ ] Integração Firebase Auth com Phone Number (OTP via SMS)
- [ ] Tela de verificação: 6 campos de dígito com auto-avanço
- [ ] Tela de Onboarding: escolha de username único + seleção de avatar (grid de avatares pré-definidos)
- [ ] Ao concluir cadastro: creditar 1.000 Q$ + criar documento no Firestore `/users/{uid}`
- [ ] Persistência de sessão (Firebase Auth state)
- [ ] Middleware Next.js para proteção de rotas autenticadas
- [ ] Hook `useAuth` para gerenciar estado do usuário

**Firestore:** Criar documento `users/{uid}` com todos os campos do modelo de dados.

### 1.2 Feed de Eventos — Home (Semana 4)

**Rota:** `/(main)/home`

- [ ] Listagem de eventos com status `open` do Firestore
- [ ] Filtros por categoria: Esporte ⚽ | Entretenimento 🎭 | Política 🏛️
- [ ] Eventos `featured: true` em destaque no topo (carrossel ou banner)
- [ ] `EventCard` com: ícone da categoria, título, prazo, participantes, barra SIM/NÃO, potencial de retorno
- [ ] Pull-to-refresh (Framer Motion + Firestore realtime)
- [ ] Skeleton screens durante carregamento
- [ ] Empty state com ilustração quando não há eventos
- [ ] Hook `useEvents` com listener em tempo real (`onSnapshot`)

### 1.3 Tela de Previsão — Detalhe do Evento (Semana 4-5)

**Rota:** `/event/[id]`

- [ ] Exibir descrição completa do evento
- [ ] Estatísticas em tempo real: total SIM, total NÃO, número de participantes
- [ ] Barra visual SIM vs NÃO animada e atualizada em tempo real
- [ ] Botões `achoQ SIM` (verde) e `achoQ NÃO` (vermelho) — grandes, estilo 3D, Framer Motion
- [ ] Slider de aposta com input numérico para definir Q$ a apostar
- [ ] Saldo atual visível; validação para não apostar mais do que o saldo
- [ ] Botão "Confirmar Previsão" — animação de moedas saindo ao confirmar
- [ ] Transação no Firestore: criar `/bets/{betId}`, atualizar saldo do usuário, atualizar totais do evento (transação atômica)
- [ ] Após confirmar: exibir modal de compartilhamento (fase beta) + toast "Boa! Previsão feita!"
- [ ] Verificar se usuário já apostou no evento (bloquear dupla aposta)

### 1.4 Sistema Parimutuel — Cloud Functions (Semana 5-6)

**Firebase Cloud Functions:** `functions/src/events/`

- [ ] Função `resolveEvent(eventId, result)`: chamada pelo admin ao definir resultado
  - Consultar todas as `/bets` do evento com status `pending`
  - Separar apostas ganhadoras e perdedoras
  - Calcular pote total → aplicar rake de 5% → pote líquido
  - Distribuir proporcionalmente entre apostas ganhadoras
  - Atualizar cada `/bets/{betId}` com `payout` e `status`
  - Atualizar saldo Q$ de cada usuário vencedor
  - Criar `/transactions` para cada distribuição
  - Disparar notificação push para todos os participantes
- [ ] Função `updateEventStats`: atualizada a cada nova aposta (ou via triggers Firestore)

### 1.5 Painel Admin Básico (Semana 6)

**Rota:** `/admin` (protegida por claim customizado Firebase)

- [ ] Autenticação admin (custom claim no Firebase Auth)
- [ ] Listagem de eventos com status
- [ ] Formulário para criar evento: título, descrição, categoria, data de encerramento, featured
- [ ] Botão para resolver evento: selecionar resultado SIM ou NÃO → chamar Cloud Function
- [ ] Listagem básica de usuários e saldos

### 1.6 Saldo de Moedas Q$ Básico

- [ ] Saldo exibido no Header (sempre visível)
- [ ] Store Zustand para saldo: `useCoinsStore`
- [ ] Listener em tempo real no Firestore para saldo
- [ ] Animação de moedas ao receber/gastar Q$ (Framer Motion)

---

## FASE 2 — Beta (Semana 7-10)

**Objetivo:** Adicionar gamificação, social e notificações para aumentar retenção.

### 2.1 Sistema de Gamificação (Semana 7-8)

- [ ] **XP e Níveis:**
  - Ganhar XP por: aposta feita (+10), acerto (+25), streak de 3 (+50), login diário (+15)
  - Progressão de nível baseada em XP acumulado
  - Animação de level-up (confetti + modal de celebração)
  - `LevelBadge` exibido no perfil e na barra superior

- [ ] **Streak Counter:**
  - Cloud Function (scheduled) ou trigger para verificar login diário
  - Creditar 50 Q$ no login diário + bônus de 500 Q$ a cada 7 dias
  - Streak counter exibido no Header com ícone de fogo 🔥
  - Animação pulse quando streak está ativo

- [ ] **Conquistas/Badges:**
  - Sistema de achievements no Firestore (`/achievements/{id}`)
  - Verificação de conquistas após cada ação relevante
  - Conquistas iniciais: "Primeira Previsão", "Primeiro Acerto", "Streak de 7 dias", "10 Acertos", "Mestre do BBB"
  - Modal de celebração ao desbloquear conquista

- [ ] **Streak de Acertos:**
  - Bônus multiplicador a cada 3, 5 e 10 acertos consecutivos

### 2.2 Tela de Perfil (Semana 8)

**Rota:** `/(main)/profile`

- [ ] Avatar, username, nível com barra de XP
- [ ] Estatísticas: total de previsões, taxa de acerto (%), Q$ ganhos, streak atual
- [ ] Grid de conquistas (desbloqueadas com cor, bloqueadas em cinza)
- [ ] Histórico de previsões com status (ganhou/perdeu) e valor
- [ ] Configurações: trocar username, avatar, notificações

### 2.3 Convite de Amigos & Referral (Semana 9)

- [ ] Gerar `referralCode` único no cadastro
- [ ] Tela de convite com link personalizado + botões de compartilhamento
- [ ] Deep link que ao ser aberto leva ao onboarding com referralCode pré-preenchido
- [ ] Cloud Function para creditar 200 Q$ para ambos quando referido completa cadastro
- [ ] Contador de amigos convidados no perfil

### 2.4 Compartilhamento Social (Semana 9)

- [ ] Geração de card visual após fazer previsão (canvas ou OG image dinâmica)
- [ ] Card com: evento, escolha (SIM/NÃO), username, branding achoQ, link de convite
- [ ] Botões de share: WhatsApp, Instagram Stories, Twitter/X (Web Share API)
- [ ] Creditar 25 Q$ ao compartilhar (com rate limiting: max 1x por evento)

### 2.5 Notificações Push — FCM (Semana 10)

- [ ] Setup Firebase Cloud Messaging no PWA (service worker)
- [ ] Solicitar permissão de notificações no onboarding
- [ ] Salvar FCM token no Firestore do usuário
- [ ] Notificações:
  - Evento resolvido: acertou ou errou com valor ganho
  - Streak em risco: "Sua streak de X dias está em risco!"
  - Amigo convidado se cadastrou
  - Novo evento trending
- [ ] Tela de histórico de notificações no app

### 2.6 Rankings (Semana 10)

**Rota:** `/(main)/ranking`

- [ ] Cloud Function scheduled (semanal) para calcular rankings
- [ ] **Ranking Geral:** top 100 jogadores por score (acertos + Q$ ganhos)
- [ ] **Ranking por Categoria:** separado para Esporte, Política, Entretenimento
- [ ] Design de leaderboard: pódio para top 3 (avatares grandes, medalhas ouro/prata/bronze)
- [ ] Lista scrollável para posições 4-100
- [ ] Posição do usuário logado sempre visível (sticky no rodapé)
- [ ] Reset semanal com histórico do período anterior

---

## FASE 3 — Lançamento (Semana 11-14)

**Objetivo:** Produto completo para lançamento público com monetização ativa.

### 3.1 Lojinha de Prêmios (Semana 11-12)

**Rota:** `/(main)/shop`

- [ ] Catálogo de prêmios organizado por categoria e preço em Q$
- [ ] Categorias: Vouchers digitais 🎫 | Itens in-app 🎨 | Prêmios físicos 📦
- [ ] `PrizeCard` com imagem, nome, preço em Q$, estoque
- [ ] Fluxo de resgate: selecionar → confirmar → debitar Q$ → registrar em `/redemptions`
- [ ] Modal de confirmação com preview do prêmio
- [ ] Histórico de resgates no perfil
- [ ] Avatares e badges exclusivos disponíveis na lojinha
- [ ] Admin: gerenciar catálogo de prêmios (adicionar, editar estoque, ativar/desativar)

### 3.2 Rewarded Ads (Semana 12)

- [ ] Integração com Google AdMob ou similar (via iframe/SDK web)
- [ ] Botão "Assistir vídeo e ganhar 50 Q$" no feed e no perfil
- [ ] Limite de 3 vídeos por dia por usuário
- [ ] Cloud Function para validar visualização e creditar moedas
- [ ] Banners discretos em áreas de baixo atrito (rodapé do feed)

### 3.3 Ranking entre Amigos (Semana 13)

- [ ] Grupos privados de competição
- [ ] Criar grupo → gerar link de convite → amigos entram pelo link
- [ ] Leaderboard do grupo com posições relativas
- [ ] Notificação quando amigo ultrapassa sua posição no grupo

### 3.4 Otimizações de Performance e PWA (Semana 13-14)

- [ ] Lazy loading de rotas e componentes pesados
- [ ] Otimização de imagens com `next/image`
- [ ] Skeleton screens em todas as telas
- [ ] Offline support básico via service worker (cache de eventos)
- [ ] Lighthouse score ≥ 90 (Performance, Accessibility, PWA)
- [ ] Tela de instalação do PWA ("Adicionar à tela inicial")
- [ ] Splash screen animada com mascote achoQ

### 3.5 Acessibilidade (Semana 14)

- [ ] Contraste WCAG AA em todos os textos
- [ ] Labels em todos os inputs e botões
- [ ] Navegação por teclado funcional
- [ ] aria-labels nos ícones sem texto
- [ ] Focus visible em todos os elementos interativos

---

## FASE 4 — Crescimento (Semana 15-24)

**Objetivo:** Escalar o produto com monetização avançada e features de retenção de longo prazo.

### 4.1 Eventos Patrocinados (Semana 15-17)

- [ ] Sistema de "Evento Patrocinado" no admin: marcar evento como patrocinado, inserir logo do patrocinador
- [ ] Card de evento patrocinado com branding especial
- [ ] Prêmios exclusivos do patrocinador na lojinha vinculados ao evento
- [ ] Métricas de visibilidade para o patrocinador (impressões, participações)

### 4.2 Temporadas Sazonais (Semana 17-19)

- [ ] Sistema de "Temporada": Copa do Mundo, BBB, Eleições, Carnaval
- [ ] Rankings especiais de temporada com reset ao final
- [ ] Badges e prêmios exclusivos de temporada
- [ ] Banner temático no home durante a temporada ativa

### 4.3 Q$ Gold — Moeda Premium (Semana 19-22)

- [ ] Implementar moeda premium Q$ Gold (comprável com dinheiro real)
- [ ] Integração com gateway de pagamento (Stripe ou Pagar.me para BR)
- [ ] Q$ Gold oferece: multiplicadores de prêmio na lojinha, acesso a eventos exclusivos
- [ ] Deixar claro na interface que é compra de moeda de jogo (compliance)
- [ ] Pacotes: R$5 (500 Gold), R$10 (1.200 Gold), R$25 (3.500 Gold)

### 4.4 Melhorias de Admin e Analytics (Semana 22-24)

- [ ] Dashboard de métricas: MAU, DAU, eventos populares, economia de moedas
- [ ] Gráficos de entrada/saída de Q$ para monitorar inflação
- [ ] Alertas automáticos para desequilíbrio na economia de moedas
- [ ] Sistema de sugestões de eventos por IA (análise de trending topics)
- [ ] Ferramentas anti-fraude: detecção de farm de convites, limites por IP/device

---

## Dependências entre Fases

```
Fase 0 (Setup + Design System)
    ↓
Fase 1 (MVP: Auth + Feed + Previsão + Parimutuel)
    ↓
Fase 2 (Beta: Gamificação + Social + Notificações)
    ↓
Fase 3 (Lançamento: Lojinha + Ads + Rankings completos)
    ↓
Fase 4 (Crescimento: Patrocinados + Temporadas + Q$ Gold)
```

---

## Modelo de Dados Firestore

### Coleções Principais

| Coleção | Descrição |
|---------|-----------|
| `/users/{uid}` | Perfil completo do usuário |
| `/events/{eventId}` | Eventos de previsão |
| `/bets/{betId}` | Apostas individuais |
| `/transactions/{txId}` | Histórico de movimentação de Q$ |
| `/shop_items/{itemId}` | Catálogo da lojinha |
| `/redemptions/{redId}` | Resgates na lojinha |
| `/rankings/{period}_{category}` | Rankings calculados |
| `/achievements/{id}` | Definição de conquistas |
| `/groups/{groupId}` | Grupos de ranking entre amigos |

### Regras de Segurança Firestore

- Usuário só lê/escreve seu próprio documento `/users/{uid}`
- Apostas só podem ser criadas pelo próprio usuário
- Saldo de moedas só pode ser alterado via Cloud Functions (regra de servidor)
- Eventos e lojinha são somente leitura para usuários comuns
- Admin tem acesso total via custom claim

---

## Cloud Functions Planejadas

| Função | Trigger | Descrição |
|--------|---------|-----------|
| `onUserCreated` | Auth: onCreate | Criar doc Firestore, creditar 1.000 Q$ inicial |
| `resolveEvent` | HTTP (admin) | Calcular Parimutuel e distribuir prêmios |
| `onBetCreated` | Firestore: onCreate | Atualizar totais do evento em tempo real |
| `dailyLoginReward` | HTTP (client) | Verificar e creditar login diário + streak |
| `onReferralCompleted` | Firestore: onUpdate | Creditar 200 Q$ para referrer e referido |
| `calculateRankings` | Scheduled (domingo 23h) | Calcular e salvar rankings semanais |
| `sendPushNotification` | Chamada interna | Enviar FCM para um ou múltiplos usuários |
| `redeemShopItem` | HTTP (client) | Validar saldo, debitar Q$, registrar resgate |

---

## Checklist de Lançamento

- [ ] Testes em iOS Safari (comportamento PWA)
- [ ] Testes em Android Chrome (comportamento PWA)
- [ ] Revisão de segurança das Firestore Rules
- [ ] Revisão jurídica: disclaimers de moeda fictícia visíveis
- [ ] Configurar Firebase Blaze (pay-as-you-go) para produção
- [ ] Configurar alertas de uso/custo no Firebase
- [ ] Configurar domínio customizado no Firebase Hosting
- [ ] Política de Privacidade e Termos de Uso
- [ ] LGPD: consentimento de uso de dados e número de telefone

---

*Plano gerado em Março 2026 | Revisão após conclusão de cada fase*
