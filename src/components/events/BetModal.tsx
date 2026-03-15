"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase/config";
import { mapEventOptionRow } from "@/lib/supabase/mappers";
import { useAuthStore } from "@/lib/stores/authStore";
import { useUserStore } from "@/lib/stores/userStore";
import { useToast } from "@/lib/stores/toastStore";
import type { Event, BetChoice, EventOption } from "@/lib/types";
import { formatCoins } from "@/lib/utils/format";

interface BetModalProps {
  event: Event;
  initialChoice: BetChoice;
  initialOptionId?: string;
  preloadedOptions?: EventOption[];
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_AMOUNTS = [50, 100, 500] as const;

export default function BetModal({ event, initialChoice, initialOptionId, preloadedOptions, isOpen, onClose }: BetModalProps) {
  const { user } = useAuthStore();
  const profile = useUserStore((s) => s.profile);
  const { toast } = useToast();

  const [choice, setChoice] = useState<BetChoice>(initialChoice);
  const [options, setOptions] = useState<EventOption[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState(50);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [placing, setPlacing] = useState(false);

  const isBinary = event.eventType === "binary";
  const coins = profile?.coins ?? 0;
  const selectedOption = options.find((o) => o.id === selectedOptionId) ?? null;

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setChoice(initialChoice);
      setBetAmount(Math.max(10, Math.min(coins, 50)));
      setSelectedOptionId(initialOptionId ?? null);
    }
  }, [isOpen, initialChoice, initialOptionId, coins]);

  // Load options (or use preloaded)
  useEffect(() => {
    if (!isOpen) return;

    if (preloadedOptions && preloadedOptions.length > 0) {
      setOptions(preloadedOptions);
      if (preloadedOptions.length <= 1) {
        setSelectedOptionId(preloadedOptions[0]?.id ?? null);
      }
      setLoadingOptions(false);
      return;
    }

    let mounted = true;

    const load = async () => {
      setLoadingOptions(true);
      const { data } = await supabase
        .from("event_options")
        .select("*")
        .eq("event_id", event.id)
        .order("sort_order", { ascending: true });

      if (!mounted) return;
      const mapped = (data ?? []).map((r) =>
        mapEventOptionRow(r as Parameters<typeof mapEventOptionRow>[0])
      );
      setOptions(mapped);

      if (mapped.length <= 1) {
        setSelectedOptionId(mapped[0]?.id ?? null);
      }
      setLoadingOptions(false);
    };

    void load();
    return () => { mounted = false; };
  }, [isOpen, event.id, preloadedOptions]);

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Odds and payout
  const odds = (() => {
    if (!selectedOption) return 1.95;
    const pool = choice === "sim" ? selectedOption.simPool : selectedOption.naoPool;
    const total = selectedOption.simPool + selectedOption.naoPool;
    if (pool === 0 || total === 0) return 1.95;
    return (total * 0.95) / pool;
  })();
  const potentialPayout = Math.floor(betAmount * odds);

  const clampAmount = useCallback(
    (v: number) => Math.max(10, Math.min(v, coins)),
    [coins]
  );

  async function handleConfirm() {
    if (!user || !selectedOption || placing) return;
    setPlacing(true);

    try {
      const { error } = await supabase.rpc("place_bet", {
        p_event_id: event.id,
        p_option_id: selectedOption.id,
        p_choice: choice,
        p_amount: betAmount,
      });

      if (error) throw new Error(error.message);

      const choiceLabel = choice.toUpperCase();
      if (isBinary) {
        toast(`Boa! Voce apostou ${formatCoins(betAmount)} Q$ em ${choiceLabel}`, "success");
      } else {
        toast(`Boa! Voce apostou ${formatCoins(betAmount)} Q$ em ${selectedOption.label} (${choiceLabel})`, "success");
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Tente novamente.";
      toast(msg, "error");
    } finally {
      setPlacing(false);
    }
  }

  const canConfirm = !placing && coins >= 10 && betAmount >= 10 && selectedOption !== null;
  const needsOptionSelect = !isBinary && options.length > 1 && !selectedOptionId;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Bottom sheet */}
          <motion.div
            className="relative bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Grab handle */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            <div className="p-5 space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-gray-900">Fazer Aposta</h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Event title */}
              <p className="text-sm text-gray-500 font-semibold leading-tight line-clamp-2 -mt-2">
                {event.title}
              </p>

              {loadingOptions ? (
                <div className="py-10 text-center text-gray-400 text-sm animate-pulse">
                  Carregando...
                </div>
              ) : !user || !profile ? (
                <div className="py-10 text-center">
                  <p className="font-bold text-gray-700">Faca login para apostar</p>
                </div>
              ) : (
                <>
                  {/* Option selector — only for multi-option when no option was pre-selected */}
                  {!isBinary && options.length > 1 && !initialOptionId && (
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-gray-500">Escolha a alternativa</p>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {options.filter((o) => o.active).map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setSelectedOptionId(option.id)}
                            className={[
                              "w-full text-left rounded-2xl border-2 px-3 py-2.5 text-sm font-bold transition-all",
                              selectedOptionId === option.id
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-gray-200 bg-white text-gray-700",
                            ].join(" ")}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Show selected option label for multi-option */}
                  {!isBinary && selectedOption && initialOptionId && (
                    <div className="rounded-2xl border-2 border-primary bg-primary/5 px-3 py-2.5 text-sm font-bold text-primary">
                      {selectedOption.label}
                    </div>
                  )}

                  {/* Choice card */}
                  <div className="flex items-center justify-between rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={[
                          "w-10 h-10 rounded-full flex items-center justify-center text-white text-lg",
                          choice === "sim" ? "bg-sim" : "bg-nao",
                        ].join(" ")}
                      >
                        {choice === "sim" ? "✓" : "✗"}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          Sua escolha
                        </p>
                        <p className="font-extrabold text-gray-900 text-[15px]">
                          {choice === "sim" ? "achoQ SIM" : "achoQ NAO"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Odds
                      </p>
                      <p className="font-extrabold text-primary text-xl">
                        {odds.toFixed(2)}x
                      </p>
                    </div>
                  </div>

                  {/* Amount section */}
                  {!needsOptionSelect && (
                    <>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-bold text-gray-700">Quanto quer apostar?</p>
                          <p className="text-sm text-gray-400 flex items-center gap-1">
                            🪙 Saldo:{" "}
                            <span className="font-bold text-coin-dark">
                              Q$ {formatCoins(coins)}
                            </span>
                          </p>
                        </div>

                        {/* Amount input */}
                        <div className="flex items-center gap-2 border-2 border-gray-200 rounded-2xl px-4 py-3 focus-within:border-primary transition-colors bg-white">
                          <span className="text-lg font-extrabold text-gray-400">Q$</span>
                          <input
                            type="number"
                            inputMode="numeric"
                            value={betAmount}
                            min={10}
                            max={coins}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              if (!isNaN(v)) setBetAmount(Math.max(0, Math.min(v, coins)));
                            }}
                            onBlur={() => setBetAmount(clampAmount(betAmount))}
                            className="flex-1 text-2xl font-extrabold text-gray-900 outline-none bg-transparent tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="text-2xl">🪙</span>
                        </div>

                        {/* Quick amount buttons */}
                        <div className="flex gap-2 mt-3">
                          {QUICK_AMOUNTS.map((amt) => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => setBetAmount(clampAmount(amt))}
                              className={[
                                "flex-1 py-2.5 rounded-2xl text-sm font-bold border-2 transition-all",
                                betAmount === amt
                                  ? "bg-primary/10 text-primary border-primary"
                                  : "bg-white text-gray-500 border-gray-200 active:border-primary/50",
                              ].join(" ")}
                            >
                              +{amt}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => setBetAmount(clampAmount(coins))}
                            className={[
                              "flex-1 py-2.5 rounded-2xl text-sm font-bold border-2 transition-all",
                              betAmount === coins
                                ? "bg-primary/10 text-primary border-primary"
                                : "bg-white text-gray-500 border-gray-200 active:border-primary/50",
                            ].join(" ")}
                          >
                            TUDO
                          </button>
                        </div>
                      </div>

                      {/* Payout preview */}
                      <div className="flex items-center gap-3 rounded-2xl bg-primary/5 border border-primary/10 px-4 py-3">
                        <span className="text-2xl">📈</span>
                        <div>
                          <p className="text-sm text-gray-500">Se voce acertar, ganha:</p>
                          <p className="text-lg font-extrabold text-primary">
                            Q$ {formatCoins(potentialPayout)}
                          </p>
                        </div>
                      </div>

                      {/* Confirm button */}
                      <button
                        type="button"
                        disabled={!canConfirm}
                        onClick={handleConfirm}
                        className={[
                          "w-full py-4 rounded-3xl font-extrabold text-lg text-white transition-all flex items-center justify-center gap-2",
                          canConfirm
                            ? "bg-gradient-to-r from-primary to-purple-500 shadow-lg active:scale-[0.97]"
                            : "bg-gray-300 cursor-not-allowed",
                        ].join(" ")}
                      >
                        {placing ? "Confirmando..." : "Confirmar Aposta"}
                        {!placing && <span>🪙</span>}
                      </button>

                      {coins < 10 && (
                        <p className="text-center text-xs text-nao font-bold">
                          Saldo insuficiente (minimo 10 Q$)
                        </p>
                      )}

                      <p className="text-center text-[11px] text-gray-400">
                        Ao confirmar, voce concorda com os termos da comunidade.
                      </p>
                    </>
                  )}

                  {/* Prompt to select option first */}
                  {needsOptionSelect && (
                    <p className="text-center text-sm text-gray-400 py-4">
                      Selecione uma alternativa acima para continuar.
                    </p>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
