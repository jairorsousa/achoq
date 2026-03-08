"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/config";
import { useAuthStore } from "@/lib/stores/authStore";
import { useToast } from "@/lib/stores/toastStore";
import { motion, AnimatePresence } from "framer-motion";

const AD_REWARD = 50;
const DAILY_LIMIT = 3;

export default function RewardedAdButton() {
  const { firebaseUser } = useAuthStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [watching, setWatching] = useState(false);
  const [progress, setProgress] = useState(0);

  if (!firebaseUser) return null;

  async function handleWatchAd() {
    setWatching(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + 4;
      });
    }, 200);

    await new Promise((resolve) => setTimeout(resolve, 5200));
    clearInterval(interval);
    setProgress(100);
    setWatching(false);
    setLoading(true);

    try {
      const { error } = await supabase.rpc("claim_ad_reward");
      if (error) throw new Error(error.message);
      toast(`+${AD_REWARD} Q$ creditados!`, "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao creditar recompensa.";
      toast(msg, "error");
    } finally {
      setLoading(false);
      setProgress(0);
    }
  }

  return (
    <div className="bg-gradient-to-r from-primary/10 to-coin/10 rounded-3xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="text-3xl">video</div>
        <div className="flex-1">
          <p className="font-extrabold text-gray-900 text-sm">Ganhe {AD_REWARD} Q$ gratis</p>
          <p className="text-xs text-gray-500">Assista um video curto - Limite: {DAILY_LIMIT}x por dia</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {watching ? (
          <motion.div
            key="watching"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
            <p className="text-xs text-center text-gray-500">Aguarde... {Math.round(progress)}%</p>
          </motion.div>
        ) : (
          <motion.button
            key="btn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            disabled={loading}
            onClick={handleWatchAd}
            aria-label={`Assistir video e ganhar ${AD_REWARD} Q$`}
            className="w-full py-3 bg-primary text-white rounded-2xl font-bold text-sm shadow-btn-primary active:translate-y-[3px] active:shadow-none transition-all disabled:opacity-60"
          >
            {loading ? "Processando..." : `Assistir e ganhar ${AD_REWARD} Q$`}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
