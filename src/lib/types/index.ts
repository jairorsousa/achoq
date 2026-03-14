export type UserLevel = 1 | 2 | 3 | 4 | 5;

export interface User {
  uid: string;
  username: string;
  displayName: string;
  photoURL?: string;
  email: string;
  coins: number;
  goldCoins?: number;
  xp: number;
  level: UserLevel;
  streak: number;
  lastActiveDate: string; // ISO date string
  achievements: string[];
  createdAt: string;
}

export type EventCategory = "esportes" | "politica" | "entretenimento" | "tecnologia" | "economia" | "outros";
export type EventStatus = "open" | "closed" | "resolved" | "cancelled";

export interface EventOption {
  id: string;
  eventId: string;
  label: string;
  sortOrder: number;
  simPool: number;
  naoPool: number;
  totalBets: number;
  active: boolean;
}

export type EventType = "binary" | "multiple";

export interface Event {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  eventType: EventType;
  imageURL?: string;
  status: EventStatus;
  simCount: number;
  naoCount: number;
  totalBets: number;
  totalCoins: number;
  sponsored?: boolean;
  featured?: boolean;
  sponsorName?: string;
  sponsorLogoURL?: string;
  sponsorImpressions?: number;
  sponsorParticipations?: number;
  seasonId?: string;
  seasonName?: string;
  winnerOptionId?: string;
  winnerChoice?: BetChoice;
  options?: EventOption[];
  createdBy: string;
  createdAt: string;
  closesAt: string;
  resolvedAt?: string;
}

export type BetChoice = "sim" | "nao";
export type BetStatus = "pending" | "won" | "lost" | "refunded";

export interface Bet {
  id: string;
  userId: string;
  eventId: string;
  optionId: string;
  choice: BetChoice;
  amount: number;
  status: BetStatus;
  payout?: number;
  createdAt: string;
  resolvedAt?: string;
}

export type TransactionType =
  | "bet_placed"
  | "bet_won"
  | "bet_lost"
  | "bet_refunded"
  | "daily_bonus"
  | "achievement_reward"
  | "shop_purchase"
  | "streak_bonus"
  | "ad_reward"
  | "welcome_bonus"
  | "gold_purchase";

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number; // positive = credit, negative = debit
  description: string;
  relatedId?: string; // betId or eventId
  createdAt: string;
}

export type ShopItemType = "xp_boost" | "coin_pack" | "avatar_frame" | "streak_shield";
export type ShopCategory = "vouchers" | "in-app" | "fisicos";

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: ShopItemType;
  category: ShopCategory;
  emoji: string;
  price: number; // in coins
  stock?: number; // undefined = unlimited
  sponsoredEventId?: string;
  goldOnly?: boolean;
  goldPrice?: number;
  imageURL?: string;
  effect?: Record<string, number | string>;
  available: boolean;
}

export interface Redemption {
  id: string;
  userId: string;
  itemId: string;
  itemName: string;
  itemEmoji: string;
  price: number;
  status: "pending" | "fulfilled" | "cancelled";
  createdAt: string;
}

export interface RankingEntry {
  rank: number;
  userId: string;
  username: string;
  photoURL?: string;
  level: UserLevel;
  xp: number;
  coins: number;
  winRate: number; // 0–100
  totalBets: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  coinReward: number;
  condition: string; // human-readable condition
  unlockedAt?: string;
}

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  ownerId: string;
  members: string[]; // array of uids
  createdAt: string;
}

export interface GroupMember {
  uid: string;
  username: string;
  photoURL?: string;
  level: UserLevel;
  coins: number;
  xp: number;
  rank: number;
}

export interface Season {
  id: string;
  name: string;
  slug: string;
  themeColor?: string;
  bannerText?: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
}

export interface GoldPackage {
  id: "gold_500" | "gold_1200" | "gold_3500";
  label: string;
  priceBRL: number;
  goldAmount: number;
  bonusPercent?: number;
}

export interface EconomySnapshot {
  id: string;
  date: string;
  usersCount: number;
  totalCoins: number;
  totalGoldCoins: number;
  totalOpenBetsCoins: number;
  generatedAt: string;
}
