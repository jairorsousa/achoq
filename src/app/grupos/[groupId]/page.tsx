"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/config";
import { useAuthStore } from "@/lib/stores/authStore";
import LeaderboardRow from "@/components/ranking/LeaderboardRow";
import Podium from "@/components/ranking/Podium";
import Skeleton from "@/components/ui/Skeleton";
import type { Group, RankingEntry } from "@/lib/types";

type GroupRow = {
  id: string;
  name: string;
  invite_code: string;
  owner_id: string;
  created_at: string;
};

type GroupMemberRow = {
  user_id: string;
};

type UserRankRow = {
  id: string;
  username: string | null;
  photo_url: string | null;
  level: number | null;
  coins: number | null;
  xp: number | null;
};

export default function GroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();

  const [group, setGroup] = useState<Group | null>(null);
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadGroup = async () => {
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .select("id,name,invite_code,owner_id,created_at")
        .eq("id", groupId)
        .maybeSingle();

      if (!mounted) return;

      if (groupError || !groupData) {
        setLoading(false);
        router.replace("/ranking");
        return;
      }

      const { data: membersData, error: membersError } = await supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", groupId);

      if (!mounted) return;

      if (membersError) {
        setLoading(false);
        return;
      }

      const memberIds = (membersData ?? []).map((m) => (m as GroupMemberRow).user_id);

      setGroup({
        id: (groupData as GroupRow).id,
        name: (groupData as GroupRow).name,
        inviteCode: (groupData as GroupRow).invite_code,
        ownerId: (groupData as GroupRow).owner_id,
        members: memberIds,
        createdAt: (groupData as GroupRow).created_at,
      });

      if (memberIds.length === 0) {
        setEntries([]);
        setLoading(false);
        return;
      }

      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id,username,photo_url,level,coins,xp")
        .in("id", memberIds);

      if (!mounted) return;

      if (usersError) {
        setEntries([]);
        setLoading(false);
        return;
      }

      const ranked: RankingEntry[] = [...((usersData ?? []) as UserRankRow[])]
        .sort((a, b) => Number(b.xp ?? 0) - Number(a.xp ?? 0))
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

      setEntries(ranked);
      setLoading(false);
    };

    void loadGroup();

    const groupsChannel = supabase
      .channel(`group_${groupId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "groups", filter: `id=eq.${groupId}` },
        () => {
          void loadGroup();
        }
      )
      .subscribe();

    const membersChannel = supabase
      .channel(`group_members_${groupId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "group_members", filter: `group_id=eq.${groupId}` },
        () => {
          void loadGroup();
        }
      )
      .subscribe();

    const usersChannel = supabase
      .channel(`group_users_${groupId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "users" }, () => {
        void loadGroup();
      })
      .subscribe();

    return () => {
      mounted = false;
      void supabase.removeChannel(groupsChannel);
      void supabase.removeChannel(membersChannel);
      void supabase.removeChannel(usersChannel);
    };
  }, [groupId, router]);

  function copyCode() {
    if (!group) return;
    navigator.clipboard.writeText(group.inviteCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) {
    return (
      <div className="py-4 space-y-3">
        <Skeleton variant="card" height={80} />
        <Skeleton variant="card" height={200} />
      </div>
    );
  }

  if (!group) return null;

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
      <Link href="/ranking" className="text-primary font-bold text-sm flex items-center gap-1">
        Ranking
      </Link>

      <div className="bg-white rounded-3xl p-5 shadow-card space-y-3">
        <div className="flex items-center gap-3">
          <div className="text-4xl">grupo</div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-extrabold text-gray-900 truncate">{group.name}</h1>
            <p className="text-xs text-gray-400">{group.members.length} membros</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 rounded-2xl p-3">
          <div className="flex-1">
            <p className="text-xs text-gray-400">Codigo de convite</p>
            <p className="font-extrabold tracking-widest text-primary text-lg">{group.inviteCode}</p>
          </div>
          <button
            onClick={copyCode}
            aria-label="Copiar codigo de convite"
            className="px-4 py-2 bg-primary text-white rounded-2xl text-sm font-bold"
          >
            {copied ? "Copiado!" : "Copiar"}
          </button>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>Nenhum membro ainda.</p>
        </div>
      ) : (
        <>
          <Podium top3={top3} />
          <div className="space-y-2">
            {rest.map((entry) => (
              <LeaderboardRow key={entry.userId} entry={entry} isCurrentUser={entry.userId === user?.uid} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
