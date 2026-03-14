"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/config";
import { mapEventOptionRow, mapEventRow, mapSeasonRow } from "@/lib/supabase/mappers";
import AdminEventForm from "@/components/admin/AdminEventForm";
import Card from "@/components/ui/Card";
import Button3D from "@/components/ui/Button3D";
import Modal from "@/components/ui/Modal";
import Avatar from "@/components/ui/Avatar";
import type { EconomySnapshot, Event, EventOption, Season, User } from "@/lib/types";
import { timeRemaining, formatCompact, formatCoins } from "@/lib/utils/format";

type Tab = "events" | "create" | "users" | "seasons" | "metrics";
type EventFilter = "all" | Event["status"];

interface EconomyAlert {
  id: string;
  level: "info" | "warning" | "critical";
  title: string;
  message: string;
  createdAt?: string;
}

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

type EconomySnapshotRow = {
  date: string;
  users_count: number;
  total_coins: number;
  total_gold_coins: number;
  total_open_bets_coins: number;
  generated_at: string;
};

type EconomyAlertRow = {
  id: string;
  level: EconomyAlert["level"];
  title: string;
  message: string;
  created_at: string;
};

function mapUserRow(row: UserRow): User {
  return {
    uid: row.id,
    username: row.username ?? "",
    displayName: row.display_name ?? row.username ?? "",
    photoURL: row.photo_url ?? undefined,
    email: "",
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

function mapSnapshotRow(row: EconomySnapshotRow): EconomySnapshot {
  return {
    id: row.date,
    date: row.date,
    usersCount: Number(row.users_count ?? 0),
    totalCoins: Number(row.total_coins ?? 0),
    totalGoldCoins: Number(row.total_gold_coins ?? 0),
    totalOpenBetsCoins: Number(row.total_open_bets_coins ?? 0),
    generatedAt: row.generated_at,
  };
}

function mapAlertRow(row: EconomyAlertRow): EconomyAlert {
  return {
    id: row.id,
    level: row.level,
    title: row.title,
    message: row.message,
    createdAt: row.created_at,
  };
}

export default function AdminPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [snapshots, setSnapshots] = useState<EconomySnapshot[]>([]);
  const [alerts, setAlerts] = useState<EconomyAlert[]>([]);

  const [resolveModal, setResolveModal] = useState<{
    event: Event;
    options: EventOption[];
    winnerOptionId: string | null;
    winnerChoice: "sim" | "nao";
  } | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState("");
  const [tab, setTab] = useState<Tab>("events");
  const [eventSearch, setEventSearch] = useState("");
  const [eventFilter, setEventFilter] = useState<EventFilter>("all");
  const [eventAction, setEventAction] = useState<{ eventId: string; action: string } | null>(null);
  const [seasonActionId, setSeasonActionId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [seasonForm, setSeasonForm] = useState({
    name: "",
    slug: "",
    startsAt: "",
    endsAt: "",
    themeColor: "#7C3AED",
    bannerText: "",
    active: false,
  });
  const [seasonLoading, setSeasonLoading] = useState(false);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => {
      setNotice(null);
    }, 3500);

    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    let mounted = true;

    const loadEvents = async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false });

      if (!mounted) return;
      if (error) {
        setEvents([]);
        return;
      }

      setEvents((data ?? []).map((row) => mapEventRow(row as Parameters<typeof mapEventRow>[0])));
    };

    void loadEvents();

    const channel = supabase
      .channel("admin_events")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => {
        void loadEvents();
      })
      .subscribe();

    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadUsers = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id,username,display_name,photo_url,coins,gold_coins,xp,level,streak,last_active_date,created_at")
        .order("coins", { ascending: false });

      if (!mounted) return;
      if (error) {
        setUsers([]);
        return;
      }

      setUsers((data ?? []).map((row) => mapUserRow(row as UserRow)));
    };

    void loadUsers();

    const channel = supabase
      .channel("admin_users")
      .on("postgres_changes", { event: "*", schema: "public", table: "users" }, () => {
        void loadUsers();
      })
      .subscribe();

    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadSeasons = async () => {
      const { data, error } = await supabase
        .from("seasons")
        .select("*")
        .order("starts_at", { ascending: false });

      if (!mounted) return;
      if (error) {
        setSeasons([]);
        return;
      }

      setSeasons((data ?? []).map((row) => mapSeasonRow(row as Parameters<typeof mapSeasonRow>[0])));
    };

    void loadSeasons();

    const channel = supabase
      .channel("admin_seasons")
      .on("postgres_changes", { event: "*", schema: "public", table: "seasons" }, () => {
        void loadSeasons();
      })
      .subscribe();

    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadSnapshots = async () => {
      const { data, error } = await supabase
        .from("economy_snapshots")
        .select("*")
        .order("generated_at", { ascending: false })
        .limit(14);

      if (!mounted) return;
      if (error) {
        setSnapshots([]);
        return;
      }

      setSnapshots((data ?? []).map((row) => mapSnapshotRow(row as EconomySnapshotRow)));
    };

    void loadSnapshots();

    const channel = supabase
      .channel("admin_snapshots")
      .on("postgres_changes", { event: "*", schema: "public", table: "economy_snapshots" }, () => {
        void loadSnapshots();
      })
      .subscribe();

    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadAlerts = async () => {
      const { data, error } = await supabase
        .from("economy_alerts")
        .select("id,level,title,message,created_at")
        .order("created_at", { ascending: false })
        .limit(20);

      if (!mounted) return;
      if (error) {
        setAlerts([]);
        return;
      }

      setAlerts((data ?? []).map((row) => mapAlertRow(row as EconomyAlertRow)));
    };

    void loadAlerts();

    const channel = supabase
      .channel("admin_alerts")
      .on("postgres_changes", { event: "*", schema: "public", table: "economy_alerts" }, () => {
        void loadAlerts();
      })
      .subscribe();

    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  async function openResolveModal(event: Event) {
    setResolveError("");
    try {
      const { data, error } = await supabase
        .from("event_options")
        .select("*")
        .eq("event_id", event.id)
        .order("sort_order", { ascending: true });

      if (error) throw new Error(error.message);

      const options = (data ?? []).map((row) =>
        mapEventOptionRow(row as Parameters<typeof mapEventOptionRow>[0])
      );

      if (options.length === 0) {
        throw new Error("Evento sem alternativas cadastradas.");
      }

      const isBinary = event.eventType === "binary" || options.length === 1;

      setResolveModal({
        event,
        options,
        winnerOptionId: isBinary ? (options[0]?.id ?? null) : (options[0]?.id ?? null),
        winnerChoice: "sim",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao carregar alternativas.";
      setNotice({ type: "error", message: msg });
    }
  }

  async function handleResolve() {
    if (!resolveModal?.event || !resolveModal.winnerOptionId) return;
    setResolveError("");
    setResolving(true);
    try {
      const { error } = await supabase.rpc("resolve_event", {
        p_event_id: resolveModal.event.id,
        p_winner_option_id: resolveModal.winnerOptionId,
        p_winner_choice: resolveModal.winnerChoice,
      });
      if (error) {
        throw new Error(error.message);
      }
      setResolveModal(null);
      setNotice({ type: "success", message: "Evento resolvido com sucesso." });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido.";
      setResolveError(`Falha ao resolver evento: ${msg}`);
    } finally {
      setResolving(false);
    }
  }

  async function handleCreateSeason(e: React.FormEvent) {
    e.preventDefault();
    if (!seasonForm.name.trim() || !seasonForm.slug.trim() || !seasonForm.startsAt || !seasonForm.endsAt) {
      return;
    }

    setSeasonLoading(true);
    try {
      const { error } = await supabase.from("seasons").insert({
        name: seasonForm.name.trim(),
        slug: seasonForm.slug.trim().toLowerCase(),
        starts_at: new Date(seasonForm.startsAt).toISOString(),
        ends_at: new Date(seasonForm.endsAt).toISOString(),
        theme_color: seasonForm.themeColor,
        banner_text: seasonForm.bannerText.trim() || null,
        active: seasonForm.active,
      });

      if (error) {
        throw new Error(error.message);
      }

      setSeasonForm({
        name: "",
        slug: "",
        startsAt: "",
        endsAt: "",
        themeColor: "#7C3AED",
        bannerText: "",
        active: false,
      });
      setNotice({ type: "success", message: "Temporada criada com sucesso." });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao criar temporada.";
      setNotice({ type: "error", message: msg });
    } finally {
      setSeasonLoading(false);
    }
  }

  const statusColors: Record<string, string> = {
    open: "bg-sim/10 text-sim",
    closed: "bg-gray-100 text-gray-500",
    resolved: "bg-blue-100 text-blue-600",
    cancelled: "bg-nao/10 text-nao",
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: "events", label: `Eventos (${events.length})` },
    { id: "create", label: "Criar evento" },
    { id: "users", label: `Usuarios (${users.length})` },
    { id: "seasons", label: `Temporadas (${seasons.length})` },
    { id: "metrics", label: "Metricas" },
  ];

  const economySummary = useMemo(() => {
    const latest = snapshots[0];
    const prev = snapshots[1];
    if (!latest) return null;
    const coinsDelta = prev ? latest.totalCoins - prev.totalCoins : 0;
    return { latest, coinsDelta };
  }, [snapshots]);

  const sponsorSummary = useMemo(() => {
    const sponsored = events.filter((e) => e.sponsored);
    const totalImpressions = sponsored.reduce((sum, e) => sum + Number(e.sponsorImpressions ?? 0), 0);
    const totalParticipations = sponsored.reduce((sum, e) => sum + Number(e.sponsorParticipations ?? 0), 0);
    return { sponsoredCount: sponsored.length, totalImpressions, totalParticipations };
  }, [events]);

  const overview = useMemo(() => {
    const openEvents = events.filter((event) => event.status === "open").length;
    const resolvedEvents = events.filter((event) => event.status === "resolved").length;
    const totalCoinsInEvents = events.reduce((sum, event) => sum + Number(event.totalCoins ?? 0), 0);
    const activeUsers7d = users.filter((user) => {
      if (!user.lastActiveDate) return false;
      const diffMs = Date.now() - new Date(user.lastActiveDate).getTime();
      return diffMs <= 7 * 24 * 60 * 60 * 1000;
    }).length;

    return {
      totalUsers: users.length,
      openEvents,
      resolvedEvents,
      totalCoinsInEvents,
      activeUsers7d,
      alertsCount: alerts.length,
    };
  }, [alerts.length, events, users]);

  const filteredEvents = useMemo(() => {
    const normalizedSearch = eventSearch.trim().toLowerCase();
    return events.filter((event) => {
      if (eventFilter !== "all" && event.status !== eventFilter) return false;
      if (!normalizedSearch) return true;
      return (
        event.title.toLowerCase().includes(normalizedSearch) ||
        event.category.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [eventFilter, eventSearch, events]);

  const isEventActionLoading = (eventId: string, action: string) =>
    eventAction?.eventId === eventId && eventAction.action === action;

  async function runEventUpdate(
    event: Event,
    action: string,
    values: Record<string, unknown>,
    successMessage: string
  ) {
    setEventAction({ eventId: event.id, action });
    try {
      const { error } = await supabase.from("events").update(values).eq("id", event.id);
      if (error) throw new Error(error.message);
      setNotice({ type: "success", message: successMessage });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao atualizar evento.";
      setNotice({ type: "error", message: msg });
    } finally {
      setEventAction(null);
    }
  }

  async function handleToggleSeasonActive(season: Season) {
    setSeasonActionId(season.id);
    try {
      const { error } = await supabase
        .from("seasons")
        .update({ active: !season.active })
        .eq("id", season.id);

      if (error) throw new Error(error.message);
      setNotice({
        type: "success",
        message: `Temporada ${!season.active ? "ativada" : "desativada"}.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao atualizar temporada.";
      setNotice({ type: "error", message: msg });
    } finally {
      setSeasonActionId(null);
    }
  }

  return (
    <div className="space-y-6">
      {notice && (
        <div
          className={[
            "rounded-2xl p-3 text-sm font-bold",
            notice.type === "success" ? "bg-sim/10 text-sim" : "bg-nao/10 text-nao",
          ].join(" ")}
        >
          {notice.message}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="p-3">
          <p className="text-xs text-gray-500">Usuarios</p>
          <p className="text-xl font-extrabold text-gray-900">{formatCompact(overview.totalUsers)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Ativos 7d: {formatCompact(overview.activeUsers7d)}</p>
        </Card>

        <Card className="p-3">
          <p className="text-xs text-gray-500">Eventos abertos</p>
          <p className="text-xl font-extrabold text-sim">{formatCompact(overview.openEvents)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Resolvidos: {formatCompact(overview.resolvedEvents)}</p>
        </Card>

        <Card className="p-3 col-span-2 md:col-span-1">
          <p className="text-xs text-gray-500">Volume total Q$</p>
          <p className="text-xl font-extrabold text-coin-dark">{formatCoins(overview.totalCoinsInEvents)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Alertas: {formatCompact(overview.alertsCount)}</p>
        </Card>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={[
              "flex-shrink-0 px-4 py-3 rounded-2xl font-bold text-sm transition-colors",
              tab === t.id ? "bg-primary text-white" : "bg-white text-gray-500 border border-gray-200",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "create" && <AdminEventForm onCreated={() => setTab("events")} />}

      {tab === "events" && (
        <div className="space-y-3">
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input
                type="text"
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                placeholder="Buscar por titulo ou categoria"
                className="md:col-span-2 border-2 border-gray-200 rounded-2xl px-4 py-3 font-semibold outline-none focus:border-primary"
              />
              <select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value as EventFilter)}
                className="border-2 border-gray-200 rounded-2xl px-4 py-3 font-semibold outline-none focus:border-primary bg-white"
              >
                <option value="all">Todos</option>
                <option value="open">Abertos</option>
                <option value="closed">Fechados</option>
                <option value="resolved">Resolvidos</option>
                <option value="cancelled">Cancelados</option>
              </select>
            </div>
            <p className="text-xs text-gray-400 mt-2">Mostrando {filteredEvents.length} evento(s)</p>
          </Card>

          {filteredEvents.length === 0 && (
            <Card>
              <p className="text-center text-gray-400 py-8">Nenhum evento encontrado para os filtros atuais.</p>
            </Card>
          )}
          {filteredEvents.map((event) => (
            <Card key={event.id}>
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-gray-900 text-sm leading-tight flex-1">
                    {event.featured && <span className="text-coin">* </span>}
                    {event.sponsored && <span className="text-coin">[Patrocinado] </span>}
                    {event.title}
                  </h3>
                  <span
                    className={[
                      "text-xs font-bold px-2 py-1 rounded-full flex-shrink-0",
                      statusColors[event.status] ?? "bg-gray-100 text-gray-500",
                    ].join(" ")}
                  >
                    {event.status}
                  </span>
                </div>

                <div className="text-xs text-gray-500 flex gap-4 flex-wrap">
                  <span>{event.category}</span>
                  {event.seasonId && <span>Temporada: {event.seasonId}</span>}
                  <span>Tempo: {timeRemaining(event.closesAt)}</span>
                  <span>Palpites: {formatCompact(event.totalBets)}</span>
                  <span>Q$: {formatCompact(event.totalCoins)}</span>
                  {event.sponsored && <span>Impressoes: {formatCompact(event.sponsorImpressions ?? 0)}</span>}
                </div>

                {event.status === "open" && (
                  <div className="grid grid-cols-1 gap-2">
                    <Button3D
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        void openResolveModal(event);
                      }}
                    >
                      Resolver evento
                    </Button3D>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {event.status === "open" && (
                    <Button3D
                      variant="ghost"
                      size="sm"
                      loading={isEventActionLoading(event.id, "close")}
                      onClick={() => {
                        void runEventUpdate(event, "close", { status: "closed" }, "Evento fechado para novas apostas.");
                      }}
                    >
                      Fechar apostas
                    </Button3D>
                  )}

                  {(event.status === "closed" || event.status === "cancelled") && (
                    <Button3D
                      variant="ghost"
                      size="sm"
                      loading={isEventActionLoading(event.id, "reopen")}
                      onClick={() => {
                        void runEventUpdate(
                          event,
                          "reopen",
                          { status: "open", winner_option_id: null, resolved_at: null },
                          "Evento reaberto com sucesso."
                        );
                      }}
                    >
                      Reabrir
                    </Button3D>
                  )}

                  {event.status !== "resolved" && event.status !== "cancelled" && (
                    <Button3D
                      variant="nao"
                      size="sm"
                      loading={isEventActionLoading(event.id, "cancel")}
                      onClick={() => {
                        void runEventUpdate(
                          event,
                          "cancel",
                          { status: "cancelled", winner_option_id: null, resolved_at: new Date().toISOString() },
                          "Evento cancelado."
                        );
                      }}
                    >
                      Cancelar
                    </Button3D>
                  )}

                  <Button3D
                    variant="coin"
                    size="sm"
                    loading={isEventActionLoading(event.id, "feature")}
                    onClick={() => {
                      void runEventUpdate(
                        event,
                        "feature",
                        { featured: !event.featured },
                        event.featured ? "Evento removido dos destaques." : "Evento destacado."
                      );
                    }}
                  >
                    {event.featured ? "Remover destaque" : "Destacar"}
                  </Button3D>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === "users" && (
        <div className="space-y-3">
          {users.map((user, idx) => (
            <Card key={user.uid}>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-400 w-6 text-right flex-shrink-0">{idx + 1}</span>
                <Avatar username={user.displayName || user.username || "?"} level={user.level} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">@{user.username || "-"}</p>
                  <p className="text-xs text-gray-400">Nivel {user.level} - Streak {user.streak}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-extrabold text-coin-dark text-sm">Q$ {formatCoins(user.coins)}</p>
                  <p className="text-xs text-yellow-600">Gold {formatCoins(user.goldCoins ?? 0)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === "seasons" && (
        <div className="space-y-4">
          <Card>
            <h3 className="font-extrabold text-gray-900 mb-3">Criar temporada</h3>
            <form onSubmit={handleCreateSeason} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={seasonForm.name}
                  onChange={(e) => setSeasonForm((s) => ({ ...s, name: e.target.value }))}
                  placeholder="Nome"
                  className="border-2 border-gray-200 rounded-2xl px-4 py-3 font-semibold outline-none focus:border-primary"
                />
                <input
                  value={seasonForm.slug}
                  onChange={(e) => setSeasonForm((s) => ({ ...s, slug: e.target.value }))}
                  placeholder="slug"
                  className="border-2 border-gray-200 rounded-2xl px-4 py-3 font-semibold outline-none focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="datetime-local"
                  value={seasonForm.startsAt}
                  onChange={(e) => setSeasonForm((s) => ({ ...s, startsAt: e.target.value }))}
                  className="border-2 border-gray-200 rounded-2xl px-4 py-3 font-semibold outline-none focus:border-primary"
                />
                <input
                  type="datetime-local"
                  value={seasonForm.endsAt}
                  onChange={(e) => setSeasonForm((s) => ({ ...s, endsAt: e.target.value }))}
                  className="border-2 border-gray-200 rounded-2xl px-4 py-3 font-semibold outline-none focus:border-primary"
                />
              </div>
              <input
                type="text"
                value={seasonForm.bannerText}
                onChange={(e) => setSeasonForm((s) => ({ ...s, bannerText: e.target.value }))}
                placeholder="Texto do banner"
                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 font-semibold outline-none focus:border-primary"
              />
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={seasonForm.themeColor}
                  onChange={(e) => setSeasonForm((s) => ({ ...s, themeColor: e.target.value }))}
                  className="h-10 w-14 rounded border border-gray-200"
                />
                <label className="flex items-center gap-2 text-sm font-bold text-gray-600">
                  <input
                    type="checkbox"
                    checked={seasonForm.active}
                    onChange={(e) => setSeasonForm((s) => ({ ...s, active: e.target.checked }))}
                  />
                  Ativa
                </label>
              </div>
              <Button3D variant="primary" size="md" className="w-full" loading={seasonLoading}>
                Salvar temporada
              </Button3D>
            </form>
          </Card>

          <div className="space-y-2">
            {seasons.map((s) => (
              <Card key={s.id}>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-extrabold text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.slug} - {s.active ? "Ativa" : "Inativa"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold" style={{ color: s.themeColor ?? "#7C3AED" }}>
                      {s.themeColor ?? "#7C3AED"}
                    </span>
                    <Button3D
                      variant="ghost"
                      size="sm"
                      loading={seasonActionId === s.id}
                      onClick={() => {
                        void handleToggleSeasonActive(s);
                      }}
                    >
                      {s.active ? "Desativar" : "Ativar"}
                    </Button3D>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === "metrics" && (
        <div className="space-y-3">
          <Card>
            <h3 className="font-extrabold text-gray-900 mb-2">Resumo da economia</h3>
            {economySummary ? (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-gray-50 p-3">
                  <p className="text-gray-500">Usuarios</p>
                  <p className="font-extrabold text-gray-900">{economySummary.latest.usersCount}</p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-3">
                  <p className="text-gray-500">Q$ circulando</p>
                  <p className="font-extrabold text-coin-dark">{formatCoins(economySummary.latest.totalCoins)}</p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-3">
                  <p className="text-gray-500">Q$ Gold</p>
                  <p className="font-extrabold text-yellow-600">{formatCoins(economySummary.latest.totalGoldCoins)}</p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-3">
                  <p className="text-gray-500">Delta diario Q$</p>
                  <p className={["font-extrabold", economySummary.coinsDelta >= 0 ? "text-nao" : "text-sim"].join(" ")}>
                    {economySummary.coinsDelta >= 0 ? "+" : ""}
                    {formatCoins(economySummary.coinsDelta)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Sem snapshots ainda.</p>
            )}
          </Card>

          <Card>
            <h3 className="font-extrabold text-gray-900 mb-2">Patrocinados</h3>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-2xl bg-gray-50 p-3">
                <p className="text-gray-500">Eventos</p>
                <p className="font-extrabold text-gray-900">{sponsorSummary.sponsoredCount}</p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-3">
                <p className="text-gray-500">Impressoes</p>
                <p className="font-extrabold text-gray-900">{formatCompact(sponsorSummary.totalImpressions)}</p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-3">
                <p className="text-gray-500">Participacoes</p>
                <p className="font-extrabold text-gray-900">{formatCompact(sponsorSummary.totalParticipations)}</p>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="font-extrabold text-gray-900 mb-2">Alertas automaticos</h3>
            {alerts.length === 0 ? (
              <p className="text-sm text-gray-400">Sem alertas recentes.</p>
            ) : (
              <div className="space-y-2">
                {alerts.map((a) => (
                  <div key={a.id} className="rounded-2xl border border-gray-200 p-3">
                    <p className="text-sm font-extrabold text-gray-900">[{a.level.toUpperCase()}] {a.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{a.message}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      <Modal
        isOpen={Boolean(resolveModal)}
        onClose={() => {
          setResolveModal(null);
          setResolveError("");
        }}
        title="Resolver evento"
      >
        {resolveModal && (() => {
          const isBinary = resolveModal.event.eventType === "binary" || resolveModal.options.length === 1;

          return (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                {isBinary
                  ? <>Qual foi o resultado de: <strong>{resolveModal.event.title}</strong></>
                  : <>Definir alternativa vencedora de: <strong>{resolveModal.event.title}</strong></>
                }
              </p>

              {isBinary ? (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setResolveModal((prev) => (prev ? { ...prev, winnerChoice: "sim" } : prev))}
                    className={[
                      "flex-1 py-4 rounded-2xl font-extrabold text-lg border-2 transition-all",
                      resolveModal.winnerChoice === "sim"
                        ? "bg-sim text-white border-sim"
                        : "bg-sim/10 text-sim border-sim/30",
                    ].join(" ")}
                  >
                    SIM
                  </button>
                  <button
                    type="button"
                    onClick={() => setResolveModal((prev) => (prev ? { ...prev, winnerChoice: "nao" } : prev))}
                    className={[
                      "flex-1 py-4 rounded-2xl font-extrabold text-lg border-2 transition-all",
                      resolveModal.winnerChoice === "nao"
                        ? "bg-nao text-white border-nao"
                        : "bg-nao/10 text-nao border-nao/30",
                    ].join(" ")}
                  >
                    NAO
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {resolveModal.options.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setResolveModal((prev) => (prev ? { ...prev, winnerOptionId: option.id } : prev))}
                      className={[
                        "w-full text-left rounded-2xl border px-3 py-2 text-sm font-semibold transition-colors",
                        resolveModal.winnerOptionId === option.id
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-gray-200 bg-white text-gray-700",
                      ].join(" ")}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}

              {resolveError && (
                <div className="bg-nao/10 rounded-2xl p-3">
                  <p className="text-nao text-sm font-semibold">{resolveError}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button3D variant="ghost" className="flex-1" onClick={() => setResolveModal(null)}>
                  Cancelar
                </Button3D>
                <Button3D
                  variant="primary"
                  className="flex-1"
                  loading={resolving}
                  disabled={!resolveModal.winnerOptionId}
                  onClick={handleResolve}
                >
                  Confirmar
                </Button3D>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
