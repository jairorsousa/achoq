import type {
  Bet,
  Event,
  EventOption,
  RankingEntry,
  Season,
  Transaction,
  User,
} from "@/lib/types";

type UserRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  photo_url: string | null;
  coins: number | null;
  gold_coins: number | null;
  xp: number | null;
  level: number | null;
  streak: number | null;
  last_active_date: string | null;
  created_at: string | null;
};

type BetRow = {
  id: string;
  user_id: string;
  event_id: string;
  option_id: string;
  choice: "sim" | "nao";
  amount: number;
  status: "pending" | "won" | "lost" | "refunded";
  payout: number | null;
  created_at: string;
  resolved_at: string | null;
};

type TransactionRow = {
  id: string;
  user_id: string;
  type: Transaction["type"];
  amount: number;
  description: string;
  related_id: string | null;
  created_at: string;
};

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  category: Event["category"];
  image_url: string | null;
  status: Event["status"];
  sim_count: number | null;
  nao_count: number | null;
  total_bets: number | null;
  total_coins: number | null;
  sponsored: boolean | null;
  sponsor_name: string | null;
  sponsor_logo_url: string | null;
  sponsor_impressions: number | null;
  sponsor_participations: number | null;
  featured: boolean | null;
  season_id: string | null;
  winner_option_id: string | null;
  created_by: string;
  created_at: string;
  closes_at: string;
  resolved_at: string | null;
};

type EventOptionRow = {
  id: string;
  event_id: string;
  label: string;
  sort_order: number | null;
  sim_pool: number | null;
  nao_pool: number | null;
  total_bets: number | null;
  active: boolean | null;
};

type SeasonRow = {
  id: string;
  name: string;
  slug: string;
  theme_color: string | null;
  banner_text: string | null;
  starts_at: string;
  ends_at: string;
  active: boolean | null;
};

type RankingRow = {
  entries: RankingEntry[] | null;
};

export function mapUserRow(row: UserRow, email: string | null): User {
  return {
    uid: row.id,
    username: row.username ?? "",
    displayName: row.display_name ?? row.username ?? "",
    photoURL: row.photo_url ?? undefined,
    email: email ?? "",
    coins: Number(row.coins ?? 0),
    goldCoins: Number(row.gold_coins ?? 0),
    xp: Number(row.xp ?? 0),
    level: (Number(row.level ?? 1) as User["level"]) || 1,
    streak: Number(row.streak ?? 0),
    lastActiveDate: row.last_active_date ?? "",
    achievements: [],
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

export function mapBetRow(row: BetRow): Bet {
  return {
    id: row.id,
    userId: row.user_id,
    eventId: row.event_id,
    optionId: row.option_id,
    choice: row.choice,
    amount: Number(row.amount ?? 0),
    status: row.status,
    payout: row.payout ?? undefined,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at ?? undefined,
  };
}

export function mapTransactionRow(row: TransactionRow): Transaction {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    amount: Number(row.amount ?? 0),
    description: row.description,
    relatedId: row.related_id ?? undefined,
    createdAt: row.created_at,
  };
}

export function mapEventRow(row: EventRow): Event {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    category: row.category,
    imageURL: row.image_url ?? undefined,
    status: row.status,
    simCount: Number(row.sim_count ?? 0),
    naoCount: Number(row.nao_count ?? 0),
    totalBets: Number(row.total_bets ?? 0),
    totalCoins: Number(row.total_coins ?? 0),
    sponsored: Boolean(row.sponsored),
    sponsorName: row.sponsor_name ?? undefined,
    sponsorLogoURL: row.sponsor_logo_url ?? undefined,
    sponsorImpressions: Number(row.sponsor_impressions ?? 0),
    sponsorParticipations: Number(row.sponsor_participations ?? 0),
    seasonId: row.season_id ?? undefined,
    winnerOptionId: row.winner_option_id ?? undefined,
    createdBy: row.created_by,
    createdAt: row.created_at,
    closesAt: row.closes_at,
    resolvedAt: row.resolved_at ?? undefined,
    featured: Boolean(row.featured),
  } as Event & { featured?: boolean };
}

export function mapEventOptionRow(row: EventOptionRow): EventOption {
  return {
    id: row.id,
    eventId: row.event_id,
    label: row.label,
    sortOrder: Number(row.sort_order ?? 0),
    simPool: Number(row.sim_pool ?? 0),
    naoPool: Number(row.nao_pool ?? 0),
    totalBets: Number(row.total_bets ?? 0),
    active: Boolean(row.active ?? true),
  };
}

export function mapSeasonRow(row: SeasonRow): Season {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    themeColor: row.theme_color ?? undefined,
    bannerText: row.banner_text ?? undefined,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    active: Boolean(row.active),
  };
}

export function mapRankingEntries(row: RankingRow | null): RankingEntry[] {
  if (!row?.entries || !Array.isArray(row.entries)) return [];
  return row.entries;
}
