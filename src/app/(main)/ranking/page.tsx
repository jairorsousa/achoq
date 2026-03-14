"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/config";
import { mapRankingEntries, mapSeasonRow } from "@/lib/supabase/mappers";
import { useAuthStore } from "@/lib/stores/authStore";
import Podium from "@/components/ranking/Podium";
import LeaderboardRow from "@/components/ranking/LeaderboardRow";
import Skeleton from "@/components/ui/Skeleton";
import Button3D from "@/components/ui/Button3D";
import type { RankingEntry, Season } from "@/lib/types";

type Tab = "geral" | "temporada" | "grupos";

type UserRankRow = {
  id: string;
  username: string | null;
  photo_url: string | null;
  level: number | null;
  xp: number | null;
  coins: number | null;
};

function buildLiveRanking(users: UserRankRow[]): RankingEntry[] {
  return [...users]
    .sort((a, b) => Number(b.xp ?? 0) - Number(a.xp ?? 0))
    .slice(0, 100)
    .map((u, idx) => ({
      rank: idx + 1,
      userId: u.id,
      username: u.username ?? "",
      photoURL: u.photo_url ?? undefined,
      level: (Number(u.level ?? 1) as RankingEntry["level"]) || 1,
      xp: Number(u.xp ?? 0),
      coins: Number(u.coins ?? 0),
      winRate: 0,
      totalBets: 0,
    }));
}

export default function RankingPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>("geral");
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [seasonEntries, setSeasonEntries] = useState<RankingEntry[]>([]);
  const [activeSeason, setActiveSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState(true);

  const period = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-W${getWeekNumber(now)}`;
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadSeason = async () => {
      const { data, error } = await supabase
        .from("seasons")
        .select("*")
        .eq("active", true)
        .order("starts_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!mounted) return;
      if (error || !data) {
        setActiveSeason(null);
        return;
      }
      setActiveSeason(mapSeasonRow(data as Parameters<typeof mapSeasonRow>[0]));
    };

    void loadSeason();

    const channel = supabase
      .channel("ranking_active_season")
      .on("postgres_changes", { event: "*", schema: "public", table: "seasons" }, () => {
        void loadSeason();
      })
      .subscribe();

    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadGlobalRanking = async () => {
      if (!mounted) return;
      setLoading(true);

      const { data: rankData, error: rankError } = await supabase
        .from("rankings")
        .select("entries")
        .eq("period", period)
        .eq("category", "geral")
        .maybeSingle();

      if (!mounted) return;

      if (!rankError && rankData) {
        setEntries(mapRankingEntries(rankData as Parameters<typeof mapRankingEntries>[0]));
        setLoading(false);
        return;
      }

      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id,username,photo_url,level,xp,coins")
        .order("xp", { ascending: false })
        .limit(100);

      if (!mounted) return;
      if (usersError) {
        setEntries([]);
      } else {
        setEntries(buildLiveRanking((usersData ?? []) as UserRankRow[]));
      }
      setLoading(false);
    };

    void loadGlobalRanking();

    const rankingChannel = supabase
      .channel("ranking_global")
      .on("postgres_changes", { event: "*", schema: "public", table: "rankings" }, () => {
        void loadGlobalRanking();
      })
      .subscribe();

    const usersChannel = supabase
      .channel("ranking_users")
      .on("postgres_changes", { event: "*", schema: "public", table: "users" }, () => {
        void loadGlobalRanking();
      })
      .subscribe();

    return () => {
      mounted = false;
      void supabase.removeChannel(rankingChannel);
      void supabase.removeChannel(usersChannel);
    };
  }, [period]);

  useEffect(() => {
    let mounted = true;

    const loadSeasonRanking = async () => {
      if (!activeSeason) {
        setSeasonEntries([]);
        return;
      }

      const key = activeSeason.slug || activeSeason.id;
      const category = `season_${key}`;

      const { data, error } = await supabase
        .from("rankings")
        .select("entries")
        .eq("period", period)
        .eq("category", category)
        .maybeSingle();

      if (!mounted) return;

      if (!error && data) {
        setSeasonEntries(mapRankingEntries(data as Parameters<typeof mapRankingEntries>[0]));
      } else {
        setSeasonEntries(entries);
      }
    };

    void loadSeasonRanking();

    return () => {
      mounted = false;
    };
  }, [activeSeason, entries, period]);

  const currentEntries = tab === "temporada" ? seasonEntries : entries;
  const top3 = currentEntries.slice(0, 3);
  const rest = currentEntries.slice(3);
  const myRank = currentEntries.find((e) => e.userId === user?.uid);

  return (
    <div className="py-4 space-y-4">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold text-gray-900">Ranking</h1>
        <p className="text-xs text-gray-400 mt-1">Atualizado semanalmente</p>
      </div>

      <div className="flex gap-2">
        {(["geral", "temporada", "grupos"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              "flex-1 py-2.5 rounded-2xl font-bold text-sm transition-colors capitalize",
              tab === t ? "bg-primary text-white" : "bg-white text-gray-500 border border-gray-200",
            ].join(" ")}
          >
            {t}
          </button>
        ))}
      </div>

      {tab !== "grupos" ? (
        loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} variant="card" height={56} />
            ))}
          </div>
        ) : (
          <>
            {tab === "temporada" && activeSeason && (
              <div className="rounded-2xl p-3 text-white" style={{ backgroundColor: activeSeason.themeColor ?? "#7C3AED" }}>
                <p className="text-xs font-bold">Temporada ativa</p>
                <p className="text-lg font-extrabold">{activeSeason.name}</p>
              </div>
            )}
            <Podium top3={top3} />
            <div className="space-y-2">
              {rest.map((entry) => (
                <LeaderboardRow key={entry.userId} entry={entry} isCurrentUser={entry.userId === user?.uid} />
              ))}
            </div>
            {myRank && (
              <div className="sticky bottom-4 bg-white/90 backdrop-blur rounded-2xl shadow-card p-1">
                <LeaderboardRow entry={myRank} isCurrentUser />
              </div>
            )}
          </>
        )
      ) : (
        <div className="space-y-4">
          <div className="bg-primary/5 rounded-3xl p-5 text-center space-y-3">
            <p className="font-extrabold text-gray-900">Compita com amigos</p>
            <p className="text-sm text-gray-500">Crie um grupo privado e dispute o ranking com quem voce conhece.</p>
            <div className="flex gap-2">
              <Link href="/grupos/criar" className="flex-1">
                <Button3D variant="primary" size="md" className="w-full">Criar grupo</Button3D>
              </Link>
            </div>
          </div>

          <p className="text-center text-sm text-gray-400">
            Tem um codigo de convite? <Link href="/grupos/entrar" className="text-primary font-bold">Entrar em grupo</Link>
          </p>
        </div>
      )}
    </div>
  );
}

function getWeekNumber(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return String(weekNo).padStart(2, "0");
}
