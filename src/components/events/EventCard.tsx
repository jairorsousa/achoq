"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase/config";
import Card from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";
import BetModal from "@/components/events/BetModal";
import type { Event, EventCategory, BetChoice } from "@/lib/types";
import { timeRemaining, formatCompact, calcMultiplier } from "@/lib/utils/format";

const CATEGORY_META: Record<EventCategory, { icon: string; color: string }> = {
  esportes: { icon: "⚽", color: "bg-green-100 text-green-700" },
  entretenimento: { icon: "🎭", color: "bg-pink-100 text-pink-700" },
  politica: { icon: "🏛️", color: "bg-blue-100 text-blue-700" },
  tecnologia: { icon: "💻", color: "bg-indigo-100 text-indigo-700" },
  economia: { icon: "📈", color: "bg-yellow-100 text-yellow-700" },
  outros: { icon: "❓", color: "bg-gray-100 text-gray-700" },
};

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

  const [betModalOpen, setBetModalOpen] = useState(false);
  const [betChoice, setBetChoice] = useState<BetChoice>("sim");

  async function handleOpen() {
    if (event.sponsored) {
      try {
        await supabase.rpc("record_sponsored_impression", {
          p_event_id: event.id,
        });
      } catch {
        // ignore metric errors
      }
    }
    router.push(`/event/${event.id}`);
  }

  function handleBetClick(e: React.MouseEvent, choice: BetChoice) {
    e.stopPropagation();
    setBetChoice(choice);
    setBetModalOpen(true);
  }

  return (
    <>
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={handleOpen}
        className="cursor-pointer"
      >
        <Card variant={featured ? "featured" : "default"} className="space-y-3">
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
              {event.eventType === "multiple" && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                  Multipla
                </span>
              )}
            </div>
            <span className="text-xs font-semibold text-gray-400">
              ⏱ {timeRemaining(event.closesAt)}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-extrabold text-gray-900 text-base leading-tight line-clamp-2">
            {event.title}
          </h3>

          {/* Progress */}
          <ProgressBar simPercent={simPercent} naoPercent={naoPercent} />

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              👥 {formatCompact(event.totalBets)} palpites
            </span>
            <span>
              🪙 {formatCompact(event.totalCoins)} Q$ em jogo
            </span>
            <span className="font-bold text-primary">
              até {calcMultiplier(event.simCount, total)}
            </span>
          </div>

          {/* SIM / NÃO buttons */}
          {isOpen && (
            <div className="flex gap-2 pt-1">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={(e) => handleBetClick(e, "sim")}
                className="flex-1 py-3 rounded-2xl font-extrabold text-sm border-2 border-sim/30 bg-sim/10 text-sim active:bg-sim active:text-white transition-all"
              >
                👍 SIM
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={(e) => handleBetClick(e, "nao")}
                className="flex-1 py-3 rounded-2xl font-extrabold text-sm border-2 border-nao/30 bg-nao/10 text-nao active:bg-nao active:text-white transition-all"
              >
                👎 NAO
              </motion.button>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Bet Modal */}
      <BetModal
        event={event}
        initialChoice={betChoice}
        isOpen={betModalOpen}
        onClose={() => setBetModalOpen(false)}
      />
    </>
  );
}
