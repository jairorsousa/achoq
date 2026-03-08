"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase/config";
import { mapEventRow } from "@/lib/supabase/mappers";
import { useEventsStore } from "@/lib/stores/eventsStore";

export function useEvents() {
  const { setEvents, setIsLoading } = useEventsStore();

  useEffect(() => {
    let mounted = true;

    const loadEvents = async () => {
      if (!mounted) return;
      setIsLoading(true);

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (!mounted) return;

      if (error) {
        setEvents([]);
      } else {
        setEvents(
          (data ?? []).map((row) =>
            mapEventRow(row as Parameters<typeof mapEventRow>[0])
          )
        );
      }
      setIsLoading(false);
    };

    void loadEvents();

    const channel = supabase
      .channel("events_open_feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        () => {
          void loadEvents();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, [setEvents, setIsLoading]);
}
