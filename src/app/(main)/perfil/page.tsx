"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/config";
import { mapBetRow, mapTransactionRow } from "@/lib/supabase/mappers";
import { useAuthStore } from "@/lib/stores/authStore";
import { useUserStore } from "@/lib/stores/userStore";
import Avatar from "@/components/ui/Avatar";
import XPBar from "@/components/ui/XPBar";
import LevelBadge from "@/components/ui/LevelBadge";
import Card from "@/components/ui/Card";
import Button3D from "@/components/ui/Button3D";
import Skeleton from "@/components/ui/Skeleton";
import RewardedAdButton from "@/components/ads/RewardedAdButton";
import type { Bet, Transaction } from "@/lib/types";
import { formatCoins } from "@/lib/utils/format";

const XP_PER_LEVEL = [0, 0, 500, 1500, 3500, 7500];

function xpForNextLevel(level: number, currentXP: number): { current: number; max: number } {
  const base = XP_PER_LEVEL[Math.min(level, 5)] ?? 0;
  const next = XP_PER_LEVEL[Math.min(level + 1, 5)] ?? currentXP;
  return { current: currentXP - base, max: next - base };
}

export default function PerfilPage() {
  const router = useRouter();
  const { firebaseUser } = useAuthStore();
  const profile = useUserStore((s) => s.profile);

  const [bets, setBets] = useState<Bet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingBets, setLoadingBets] = useState(false);
  const [tab, setTab] = useState<"apostas" | "transacoes">("apostas");

  useEffect(() => {
    if (!firebaseUser) return;

    let mounted = true;

    const loadHistory = async () => {
      if (!mounted) return;
      setLoadingBets(true);

      const [betsRes, txRes] = await Promise.all([
        supabase
          .from("bets")
          .select("*")
          .eq("user_id", firebaseUser.uid)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("transactions")
          .select("*")
          .eq("user_id", firebaseUser.uid)
          .order("created_at", { ascending: false })
          .limit(30),
      ]);

      if (!mounted) return;

      if (!betsRes.error) {
        setBets((betsRes.data ?? []).map((row) => mapBetRow(row as Parameters<typeof mapBetRow>[0])));
      } else {
        setBets([]);
      }

      if (!txRes.error) {
        setTransactions(
          (txRes.data ?? []).map((row) =>
            mapTransactionRow(row as Parameters<typeof mapTransactionRow>[0])
          )
        );
      } else {
        setTransactions([]);
      }

      setLoadingBets(false);
    };

    void loadHistory();

    const betsChannel = supabase
      .channel(`perfil_bets_${firebaseUser.uid}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bets",
          filter: `user_id=eq.${firebaseUser.uid}`,
        },
        () => {
          void loadHistory();
        }
      )
      .subscribe();

    const txChannel = supabase
      .channel(`perfil_tx_${firebaseUser.uid}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `user_id=eq.${firebaseUser.uid}`,
        },
        () => {
          void loadHistory();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      void supabase.removeChannel(betsChannel);
      void supabase.removeChannel(txChannel);
    };
  }, [firebaseUser]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (!profile) {
    return (
      <div className="py-4 space-y-4">
        <Skeleton variant="card" height={140} />
        <Skeleton variant="card" height={80} />
      </div>
    );
  }

  const totalBets = bets.length;
  const wonBets = bets.filter((b) => b.status === "won").length;
  const winRate = totalBets > 0 ? Math.round((wonBets / totalBets) * 100) : 0;
  const { current: xpCurrent, max: xpMax } = xpForNextLevel(profile.level, profile.xp);
  const isAdmin =
    firebaseUser?.permissionLevel === "admin" || Boolean(firebaseUser?.isAdmin);

  const betStatusColor: Record<string, string> = {
    won: "text-sim font-bold",
    lost: "text-nao font-bold",
    pending: "text-gray-400 font-semibold",
    refunded: "text-blue-500 font-semibold",
  };
  const betStatusLabel: Record<string, string> = {
    won: "Ganhou",
    lost: "Perdeu",
    pending: "Aguardando",
    refunded: "Devolvido",
  };

  return (
    <div className="py-4 space-y-4">
      <Card>
        <div className="flex items-center gap-4">
          <Avatar
            username={profile.displayName || profile.username}
            level={profile.level}
            size="lg"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-extrabold text-gray-900 text-lg truncate">
                @{profile.username}
              </h1>
              <LevelBadge level={profile.level} showName size="sm" />
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{profile.email}</p>
            <p className="text-sm font-extrabold text-coin-dark mt-1">
              {formatCoins(profile.coins)} Q$
            </p>
          </div>
        </div>

        <div className="mt-4">
          <XPBar
            current={xpCurrent}
            max={xpMax}
            label={`Nivel ${profile.level} -> ${profile.level + 1}`}
          />
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Apostas", value: totalBets },
          { label: "Acertos", value: `${winRate}%` },
          { label: "Streak", value: `${profile.streak}` },
        ].map((stat) => (
          <Card key={stat.label} className="text-center py-3">
            <p className="font-extrabold text-gray-900 text-xl">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
          </Card>
        ))}
      </div>

      <RewardedAdButton />

      <div className="flex gap-2">
        {(["apostas", "transacoes"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              "flex-1 py-2.5 rounded-2xl font-bold text-sm capitalize transition-colors",
              tab === t
                ? "bg-primary text-white"
                : "bg-white text-gray-500 border border-gray-200",
            ].join(" ")}
          >
            {t === "apostas" ? "Apostas" : "Extrato"}
          </button>
        ))}
      </div>

      {tab === "apostas" ? (
        loadingBets ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant="card" height={64} />
            ))}
          </div>
        ) : bets.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>Nenhuma aposta ainda.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {bets.map((bet) => (
              <div
                key={bet.id}
                className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center justify-between gap-2"
              >
                <div className="flex-1 min-w-0">
                  <p className={["text-sm", betStatusColor[bet.status]].join(" ")}>
                    {betStatusLabel[bet.status] ?? bet.status} - {bet.choice.toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{bet.eventId}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-sm text-coin-dark">
                    {bet.status === "won"
                      ? `+${formatCoins(bet.payout ?? 0)}`
                      : `-${formatCoins(bet.amount)}`} Q$
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(bet.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-2">
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>Nenhuma transacao ainda.</p>
            </div>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center justify-between gap-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{tx.description}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(tx.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <p
                  className={[
                    "font-extrabold text-sm flex-shrink-0",
                    tx.amount >= 0 ? "text-sim" : "text-nao",
                  ].join(" ")}
                >
                  {tx.amount >= 0 ? "+" : ""}
                  {formatCoins(tx.amount)} Q$
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {isAdmin && (
        <Button3D
          variant="primary"
          size="md"
          className="w-full"
          onClick={() => router.push("/admin")}
        >
          Abrir painel admin
        </Button3D>
      )}

      <Button3D variant="ghost" size="md" className="w-full" onClick={handleSignOut}>
        Sair da conta
      </Button3D>
    </div>
  );
}
