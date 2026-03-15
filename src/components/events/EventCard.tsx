"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase/config";
import { mapEventOptionRow } from "@/lib/supabase/mappers";
import Card from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";
import BetModal from "@/components/events/BetModal";
import type { Event, EventCategory, EventOption, BetChoice } from "@/lib/types";
import { timeRemaining, formatCompact, calcMultiplier } from "@/lib/utils/format";

const CATEGORY_META: Record<EventCategory, { icon: string; color: string }> = {
  esportes: { icon: "⚽", color: "bg-green-100 text-green-700" },
  entretenimento: { icon: "🎭", color: "bg-pink-100 text-pink-700" },
  politica: { icon: "🏛️", color: "bg-blue-100 text-blue-700" },
  tecnologia: { icon: "💻", color: "bg-indigo-100 text-indigo-700" },
  economia: { icon: "📈", color: "bg-yellow-100 text-yellow-700" },
  outros: { icon: "❓", color: "bg-gray-100 text-gray-700" },
};

const MAX_VISIBLE_OPTIONS = 3;

interface EventCardProps {
  event: Event;
  featured?: boolean;
}

export default function EventCard({ event, featured = false }: EventCardProps) {
  const router = useRouter();
  const meta = CATEGORY_META[event.category];
  const total = event.simCount + event.naoCount || 1;
  const simPercent = Math.round((event.simCount / total) * 100);
  const naoPercent = 100 - simPercent;
  const isOpen = event.status === "open";
  const isMultiple = event.eventType === "multiple";

  const [options, setOptions] = useState<EventOption[]>([]);
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [betChoice, setBetChoice] = useState<BetChoice>("sim");
  const [betOptionId, setBetOptionId] = useState<string | undefined>();

  // Load options for multi-option events
  useEffect(() => {
    if (!isMultiple) return;
    let mounted = true;

    const load = async () => {
      const { data } = await supabase
        .from("event_options")
        .select("*")
        .eq("event_id", event.id)
        .order("sort_order", { ascending: true });

      if (!mounted) return;
      setOptions(
        (data ?? []).map((r) =>
          mapEventOptionRow(r as Parameters<typeof mapEventOptionRow>[0])
        )
      );
    };

    void load();

    const channel = supabase
      .channel(`card_options_${event.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "event_options", filter: `event_id=eq.${event.id}` },
        () => { void load(); }
      )
      .subscribe();

    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, [event.id, isMultiple]);

  async function handleCardClick() {
    if (event.sponsored) {
      try {
        await supabase.rpc("record_sponsored_impression", { p_event_id: event.id });
      } catch { /* ignore */ }
    }
    router.push(`/event/${event.id}`);
  }

  function openBetModal(e: React.MouseEvent, choice: BetChoice, optionId?: string) {
    e.stopPropagation();
    setBetChoice(choice);
    setBetOptionId(optionId);
    setBetModalOpen(true);
  }

  const visibleOptions = options.slice(0, MAX_VISIBLE_OPTIONS);
  const hiddenCount = options.length - MAX_VISIBLE_OPTIONS;

  return (
    <>
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={handleCardClick}
        className="cursor-pointer"
      >
        <Card variant="default" className="space-y-3">
          {/* Featured image — flush to card edges */}
          {featured && event.imageURL && (
            <div className="-mx-5 -mt-5 mb-0 relative overflow-hidden rounded-t-3xl">
              <img
                src={event.imageURL}
                alt={event.title}
                className="w-full h-48 object-cover"
              />
            </div>
          )}

          <div className="space-y-3">
          {event.sponsored && (
            <div className="flex items-center justify-between rounded-xl border border-coin/30 bg-coin/10 px-3 py-1.5">
              <span className="text-[11px] font-extrabold text-coin-dark">
                PATROCINADO {event.sponsorName ? `· ${event.sponsorName}` : ""}
              </span>
              {event.seasonName && (
                <span className="text-[10px] font-bold text-primary">{event.seasonName}</span>
              )}
            </div>
          )}

          {/* Category + Timer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className={["text-xs font-bold px-2 py-1 rounded-full", meta.color].join(" ")}>
                {meta.icon} {event.category}
              </span>
            </div>
            <span className="text-xs font-semibold text-gray-400">
              ⏱ {timeRemaining(event.closesAt)}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-extrabold text-gray-900 text-base leading-tight line-clamp-2">
            {event.title}
          </h3>

          {/* ----- BINARY: progress bar + SIM/NÃO buttons ----- */}
          {!isMultiple && (
            <>
              <ProgressBar simPercent={simPercent} naoPercent={naoPercent} />

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>👥 {formatCompact(event.totalBets)} palpites</span>
                <span>🪙 {formatCompact(event.totalCoins)} Q$ em jogo</span>
                <span className="font-bold text-primary">
                  até {calcMultiplier(event.simCount, total)}
                </span>
              </div>

              {isOpen && (
                <div className="flex gap-2 pt-1">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => openBetModal(e, "sim")}
                    className="flex-1 py-3 rounded-2xl font-extrabold text-sm border-2 border-sim/30 bg-sim/10 text-sim active:bg-sim active:text-white transition-all"
                  >
                    👍 SIM
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => openBetModal(e, "nao")}
                    className="flex-1 py-3 rounded-2xl font-extrabold text-sm border-2 border-nao/30 bg-nao/10 text-nao active:bg-nao active:text-white transition-all"
                  >
                    👎 NAO
                  </motion.button>
                </div>
              )}
            </>
          )}

          {/* ----- MULTIPLE: option rows with SIM/NÃO pills ----- */}
          {isMultiple && (
            <>
              <div className="space-y-2">
                {visibleOptions.map((option) => {
                  const optTotal = option.simPool + option.naoPool || 1;
                  const simPct = Math.round((option.simPool / optTotal) * 100);
                  const naoPct = 100 - simPct;

                  return (
                    <div
                      key={option.id}
                      className="flex items-center gap-2 rounded-2xl bg-gray-50 border border-gray-100 px-3 py-2.5"
                    >
                      {/* Option label */}
                      <p className="flex-1 font-bold text-sm text-gray-900 leading-tight min-w-0 line-clamp-2">
                        {option.label}
                      </p>

                      {/* SIM / NÃO pills */}
                      {isOpen ? (
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button
                            onClick={(e) => openBetModal(e, "sim", option.id)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-sim/10 text-sim border border-sim/20 active:bg-sim active:text-white transition-all"
                          >
                            SIM {simPct}%
                          </button>
                          <button
                            onClick={(e) => openBetModal(e, "nao", option.id)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-nao/10 text-nao border border-nao/20 active:bg-nao active:text-white transition-all"
                          >
                            NAO {naoPct}%
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1.5 flex-shrink-0">
                          <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-sim/10 text-sim">
                            SIM {simPct}%
                          </span>
                          <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-nao/10 text-nao">
                            NAO {naoPct}%
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {hiddenCount > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardClick();
                    }}
                    className="w-full text-center text-xs font-bold text-primary py-1.5"
                  >
                    +{hiddenCount} alternativa{hiddenCount > 1 ? "s" : ""}
                  </button>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>👥 {formatCompact(event.totalBets)} palpites</span>
                <span>🪙 {formatCompact(event.totalCoins)} Q$ em jogo</span>
              </div>
            </>
          )}
          </div>
        </Card>
      </motion.div>

      {/* Bet Modal */}
      <BetModal
        event={event}
        initialChoice={betChoice}
        initialOptionId={betOptionId}
        preloadedOptions={isMultiple ? options : undefined}
        isOpen={betModalOpen}
        onClose={() => setBetModalOpen(false)}
      />
    </>
  );
}
