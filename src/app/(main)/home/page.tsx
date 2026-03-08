"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import EventCard from "@/components/events/EventCard";
import CategoryFilter from "@/components/events/CategoryFilter";
import RewardedAdButton from "@/components/ads/RewardedAdButton";
import Skeleton from "@/components/ui/Skeleton";
import { useEvents } from "@/lib/hooks/useEvents";
import { useUser } from "@/lib/hooks/useUser";
import { supabase } from "@/lib/supabase/config";
import { mapSeasonRow } from "@/lib/supabase/mappers";
import { useEventsStore } from "@/lib/stores/eventsStore";
import type { EventCategory, Season } from "@/lib/types";

function SkeletonFeed() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2 bg-white rounded-3xl p-5">
          <div className="flex justify-between">
            <Skeleton variant="text" width={80} height={24} className="rounded-full" />
            <Skeleton variant="text" width={60} height={20} />
          </div>
          <Skeleton variant="text" height={20} />
          <Skeleton variant="text" width="70%" height={20} />
          <Skeleton variant="text" height={16} className="rounded-full" />
          <div className="flex justify-between">
            <Skeleton variant="text" width={80} height={16} />
            <Skeleton variant="text" width={80} height={16} />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-6xl mb-4">🔍</div>
      <h3 className="text-lg font-extrabold text-gray-900">Nenhum evento aqui</h3>
      <p className="text-gray-400 text-sm mt-1">
        Novos eventos aparecem em breve. Volte mais tarde!
      </p>
    </div>
  );
}

export default function HomePage() {
  useEvents();
  useUser();
  const [activeSeason, setActiveSeason] = useState<Season | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadActiveSeason = async () => {
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

    void loadActiveSeason();

    const channel = supabase
      .channel("home_active_season")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "seasons" },
        () => {
          void loadActiveSeason();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  const { events, activeCategory, isLoading, setActiveCategory } = useEventsStore();

  const featured = events.filter((e) => e.featured);
  const regular = events.filter((e) => !e.featured);

  const filteredFeatured =
    activeCategory === "all"
      ? featured
      : featured.filter((e) => e.category === (activeCategory as EventCategory));
  const filteredRegular =
    activeCategory === "all"
      ? regular
      : regular.filter((e) => e.category === (activeCategory as EventCategory));

  const isEmpty = !isLoading && filteredFeatured.length === 0 && filteredRegular.length === 0;

  return (
    <div className="space-y-4 py-4">
      {activeSeason && (
        <div
          className="rounded-3xl p-4 text-white shadow-card"
          style={{ background: `linear-gradient(135deg, ${activeSeason.themeColor ?? "#7C3AED"} 0%, #111827 100%)` }}
        >
          <p className="text-[11px] font-extrabold tracking-wide">TEMPORADA ATIVA</p>
          <p className="text-xl font-extrabold mt-1">{activeSeason.name}</p>
          {activeSeason.bannerText && (
            <p className="text-sm opacity-90 mt-1">{activeSeason.bannerText}</p>
          )}
        </div>
      )}

      {/* Category filter */}
      <CategoryFilter
        active={activeCategory}
        onChange={setActiveCategory}
      />

      {/* Content */}
      {isLoading ? (
        <SkeletonFeed />
      ) : isEmpty ? (
        <EmptyState />
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {/* Featured */}
            {filteredFeatured.map((event) => (
              <EventCard key={event.id} event={event} featured />
            ))}
            {/* Regular */}
            {filteredRegular.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      <RewardedAdButton />
    </div>
  );
}
