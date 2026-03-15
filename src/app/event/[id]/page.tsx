"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase/config";
import { mapEventOptionRow, mapEventRow } from "@/lib/supabase/mappers";
import { useAuthStore } from "@/lib/stores/authStore";
import { useUserStore } from "@/lib/stores/userStore";
import { useToast } from "@/lib/stores/toastStore";
import { useUser } from "@/lib/hooks/useUser";
import ToastContainer from "@/components/ui/Toast";
import Button3D from "@/components/ui/Button3D";
import ProgressBar from "@/components/ui/ProgressBar";
import Modal from "@/components/ui/Modal";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import BetAmountInput from "@/components/events/BetAmountInput";
import type { Event, BetChoice, EventOption } from "@/lib/types";
import { timeRemaining, formatCompact, formatCoins, calcMultiplier } from "@/lib/utils/format";

function CoinBurst() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl"
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: (Math.cos((i * Math.PI * 2) / 8) * 120) as number,
            y: (Math.sin((i * Math.PI * 2) / 8) * 120) as number,
            opacity: 0,
            scale: 0.5,
          }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          coin
        </motion.div>
      ))}
    </div>
  );
}

export default function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();
  const profile = useUserStore((s) => s.profile);
  const { toast } = useToast();

  useUser();

  const [event, setEvent] = useState<Event | null>(null);
  const [options, setOptions] = useState<EventOption[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [userBetOptionIds, setUserBetOptionIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [choice, setChoice] = useState<BetChoice | null>(null);
  const [betAmount, setBetAmount] = useState(50);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [showBurst, setShowBurst] = useState(false);

  const isBinary = event?.eventType === "binary" || options.length === 1;

  useEffect(() => {
    let mounted = true;

    const loadEventAndOptions = async () => {
      setLoading(true);
      const [{ data: eventData, error: eventError }, { data: optionsData, error: optionsError }] =
        await Promise.all([
          supabase.from("events").select("*").eq("id", id).maybeSingle(),
          supabase.from("event_options").select("*").eq("event_id", id).order("sort_order", { ascending: true }),
        ]);

      if (!mounted) return;
      if (eventError || !eventData) {
        setEvent(null);
        setOptions([]);
        setLoading(false);
        return;
      }

      setEvent(mapEventRow(eventData as Parameters<typeof mapEventRow>[0]));
      if (optionsError) {
        setOptions([]);
      } else {
        const mappedOptions = (optionsData ?? []).map((row) =>
          mapEventOptionRow(row as Parameters<typeof mapEventOptionRow>[0])
        );
        setOptions(mappedOptions);
        setSelectedOptionId((prev) => {
          if (prev && mappedOptions.some((option) => option.id === prev)) return prev;
          return mappedOptions.find((option) => option.active)?.id ?? mappedOptions[0]?.id ?? null;
        });
      }
      setLoading(false);
    };

    void loadEventAndOptions();

    const eventChannel = supabase
      .channel(`event_${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "events", filter: `id=eq.${id}` }, () => {
        void loadEventAndOptions();
      })
      .subscribe();

    const optionsChannel = supabase
      .channel(`event_options_${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "event_options", filter: `event_id=eq.${id}` },
        () => {
          void loadEventAndOptions();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      void supabase.removeChannel(eventChannel);
      void supabase.removeChannel(optionsChannel);
    };
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;

    let mounted = true;

    const checkBet = async () => {
      const { data } = await supabase
        .from("bets")
        .select("option_id")
        .eq("user_id", user.uid)
        .eq("event_id", id)
        .limit(100);

      if (!mounted) return;
      setUserBetOptionIds((data ?? []).map((row) => String(row.option_id)));
    };

    void checkBet();

    return () => {
      mounted = false;
    };
  }, [user, id]);

  useEffect(() => {
    if (profile) {
      setBetAmount(Math.max(10, Math.min(profile.coins, 50)));
    }
  }, [profile]);

  async function handleConfirmBet() {
    const selectedOption = options.find((option) => option.id === selectedOptionId);
    if (!user || !event || !choice || !profile || !selectedOption) return;
    setPlacing(true);

    try {
      const { error } = await supabase.rpc("place_bet", {
        p_event_id: id,
        p_option_id: selectedOption.id,
        p_choice: choice,
        p_amount: betAmount,
      });

      if (error) {
        throw new Error(error.message);
      }

      setUserBetOptionIds((prev) =>
        prev.includes(selectedOption.id) ? prev : [...prev, selectedOption.id]
      );
      setConfirmOpen(false);
      setShowBurst(true);
      setTimeout(() => setShowBurst(false), 1000);

      if (isBinary) {
        toast(
          `Boa! Voce apostou ${formatCoins(betAmount)} Q$ em ${choice.toUpperCase()}`,
          "success"
        );
      } else {
        toast(
          `Boa! Voce apostou ${formatCoins(betAmount)} Q$ em ${selectedOption.label}`,
          "success"
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Tente novamente.";
      toast(msg, "error");
    } finally {
      setPlacing(false);
    }
  }

  if (loading) {
    return (
      <div className="py-4 space-y-4">
        <Skeleton variant="card" height={200} />
        <Skeleton variant="card" height={120} />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <div className="text-5xl mb-4">:-(</div>
        <p className="font-bold text-gray-700">Evento nao encontrado.</p>
        <button className="mt-4 text-primary font-bold" onClick={() => router.back()}>
          Voltar
        </button>
      </div>
    );
  }

  const total = event.simCount + event.naoCount || 1;
  const simPercent = Math.round((event.simCount / total) * 100);
  const naoPercent = 100 - simPercent;
  const isClosed = event.status !== "open";
  const coins = profile?.coins ?? 0;
  const selectedOption = options.find((option) => option.id === selectedOptionId) ?? null;
  const winnerOption = event.winnerOptionId
    ? options.find((option) => option.id === event.winnerOptionId) ?? null
    : null;
  const hasOptions = options.length > 0;
  const alreadyBetOnSelected = Boolean(
    selectedOption && userBetOptionIds.includes(selectedOption.id)
  );

  return (
    <>
      <ToastContainer />
      {showBurst && <CoinBurst />}

      <div className="py-4 space-y-4">
        <button className="text-primary font-bold text-sm flex items-center gap-1" onClick={() => router.back()}>
          Voltar
        </button>

        {/* Cabecalho do evento */}
        <Card>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{event.category}</p>
              {isBinary && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  SIM ou NAO
                </span>
              )}
            </div>
            <h1 className="text-xl font-extrabold text-gray-900 leading-tight">{event.title}</h1>
            {event.description && <p className="text-sm text-gray-500 leading-relaxed">{event.description}</p>}
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span>Tempo {timeRemaining(event.closesAt)}</span>
              <span>{formatCompact(event.totalBets)} palpites</span>
              <span>{formatCompact(event.totalCoins)} Q$</span>
            </div>
          </div>
        </Card>

        {/* Placar ao vivo */}
        <Card>
          <p className="text-sm font-bold text-gray-500 mb-3">Placar ao vivo</p>
          <ProgressBar simPercent={simPercent} naoPercent={naoPercent} />
          <div className="flex justify-between mt-3 text-xs">
            <div className="text-center">
              <p className="font-extrabold text-sim text-lg">{simPercent}%</p>
              <p className="text-gray-400">acham que SIM</p>
              <p className="font-bold text-coin-dark">ate {calcMultiplier(event.naoCount + 1, total)}</p>
            </div>
            <div className="text-center">
              <p className="font-extrabold text-nao text-lg">{naoPercent}%</p>
              <p className="text-gray-400">acham que NAO</p>
              <p className="font-bold text-coin-dark">ate {calcMultiplier(event.simCount + 1, total)}</p>
            </div>
          </div>
        </Card>

        {/* Alternativas - apenas para multipla escolha */}
        {!isBinary && (
          <Card>
            <div className="space-y-3">
              <p className="text-sm font-bold text-gray-700">Alternativas</p>
              {(() => {
                const totalPool = options.reduce((sum, o) => sum + o.simPool, 0) || 1;
                return (
                  <div className="space-y-2">
                    {options.map((option) => {
                      const pct = Math.round((option.simPool / totalPool) * 100);
                      const isSelected = selectedOptionId === option.id;
                      const isWinner = event.winnerOptionId === option.id;

                      return (
                        <button
                          key={option.id}
                          type="button"
                          disabled={!option.active || isClosed}
                          onClick={() => {
                            setSelectedOptionId(option.id);
                            setChoice("sim");
                          }}
                          className={[
                            "w-full text-left rounded-2xl border-2 px-3 py-3 transition-colors",
                            isSelected ? "border-primary bg-primary/5" : "border-gray-200 bg-white",
                            !option.active || isClosed ? "opacity-80" : "",
                          ].join(" ")}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-bold text-sm text-gray-900">{option.label}</p>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {isWinner && (
                                <span className="text-[11px] font-extrabold rounded-full bg-sim/15 text-sim px-2 py-1">
                                  VENCEDOR
                                </span>
                              )}
                              <span className="text-xs font-bold text-primary">{pct}%</span>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
                            <span>{formatCompact(option.totalBets)} apostas</span>
                            <span>{formatCompact(option.simPool)} Q$ apostados</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
              {!hasOptions && (
                <p className="text-sm text-gray-400">Este evento ainda nao possui alternativas cadastradas.</p>
              )}
            </div>
          </Card>
        )}

        {/* Area de aposta */}
        {!hasOptions ? (
          <Card>
            <p className="text-center text-gray-500 text-sm">Aguardando alternativas deste evento.</p>
          </Card>
        ) : isClosed ? (
          <Card>
            <div className="text-center py-4">
              <div className="text-4xl mb-2">fechado</div>
              <p className="font-bold text-gray-600">Apostas encerradas</p>
              {isBinary && event.winnerChoice ? (
                <p className="text-sm text-gray-500 mt-1">
                  Resultado: <span className={["font-bold", event.winnerChoice === "sim" ? "text-sim" : "text-nao"].join(" ")}>{event.winnerChoice.toUpperCase()}</span>
                </p>
              ) : winnerOption ? (
                <p className="text-sm text-gray-500 mt-1">
                  Vencedor: <span className="font-bold text-gray-700">{winnerOption.label}</span>
                </p>
              ) : null}
            </div>
          </Card>
        ) : !profile ? (
          <Card>
            <p className="text-center text-gray-500 text-sm">Faca login para apostar.</p>
          </Card>
        ) : isBinary && alreadyBetOnSelected ? (
          <Card>
            <div className="text-center py-4">
              <p className="font-bold text-gray-700">Voce ja fez sua previsao neste evento.</p>
            </div>
          </Card>
        ) : !isBinary && selectedOption && alreadyBetOnSelected ? (
          <Card>
            <div className="text-center py-4">
              <p className="font-bold text-gray-700">Voce ja apostou nesta alternativa.</p>
              <p className="text-sm text-gray-400 mt-1">Escolha outra alternativa para apostar novamente.</p>
            </div>
          </Card>
        ) : isBinary ? (
          /* ----- BINARY: SIM / NAO ----- */
          <Card>
            <div className="space-y-4">
              <p className="font-bold text-gray-700">Qual sua previsao?</p>

              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setChoice("sim")}
                  className={[
                    "flex-1 py-4 rounded-3xl font-extrabold text-lg border-2 transition-all",
                    choice === "sim"
                      ? "bg-sim text-white border-sim shadow-btn-sim translate-y-[6px] shadow-none"
                      : "bg-sim/10 text-sim border-sim/30 shadow-btn-sim",
                  ].join(" ")}
                >
                  achoQ SIM
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setChoice("nao")}
                  className={[
                    "flex-1 py-4 rounded-3xl font-extrabold text-lg border-2 transition-all",
                    choice === "nao"
                      ? "bg-nao text-white border-nao shadow-btn-nao translate-y-[6px] shadow-none"
                      : "bg-nao/10 text-nao border-nao/30 shadow-btn-nao",
                  ].join(" ")}
                >
                  achoQ NAO
                </motion.button>
              </div>

              <AnimatePresence>
                {choice && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <BetAmountInput value={betAmount} max={coins} onChange={setBetAmount} />
                    <Button3D
                      variant={choice === "sim" ? "sim" : "nao"}
                      size="lg"
                      className="w-full mt-4"
                      disabled={coins < 10}
                      onClick={() => setConfirmOpen(true)}
                    >
                      Confirmar previsao
                    </Button3D>
                    {coins < 10 && (
                      <p className="text-center text-xs text-nao font-bold mt-2">Saldo insuficiente (minimo 10 Q$)</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {!choice && (
                <p className="text-center text-sm text-gray-400">
                  Selecione SIM ou NAO para apostar
                </p>
              )}
            </div>
          </Card>
        ) : (
          /* ----- MULTIPLE: selecionar alternativa e apostar ----- */
          <Card>
            <div className="space-y-4">
              <p className="font-bold text-gray-700">Fazer previsao</p>

              {selectedOption ? (
                <>
                  <div className="rounded-2xl bg-primary/5 border-2 border-primary px-4 py-3">
                    <p className="text-xs text-gray-500">Alternativa selecionada</p>
                    <p className="font-bold text-gray-900 text-sm">{selectedOption.label}</p>
                  </div>

                  <BetAmountInput value={betAmount} max={coins} onChange={setBetAmount} />
                  <Button3D
                    variant="primary"
                    size="lg"
                    className="w-full mt-4"
                    disabled={coins < 10}
                    onClick={() => {
                      setChoice("sim");
                      setConfirmOpen(true);
                    }}
                  >
                    Confirmar previsao
                  </Button3D>
                  {coins < 10 && (
                    <p className="text-center text-xs text-nao font-bold mt-2">Saldo insuficiente (minimo 10 Q$)</p>
                  )}
                </>
              ) : (
                <p className="text-center text-sm text-gray-400">
                  Selecione uma alternativa acima para apostar
                </p>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Modal de confirmacao */}
      <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirmar previsao">
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Evento</span>
              <span className="font-semibold text-gray-800 max-w-[60%] text-right line-clamp-1">{event.title}</span>
            </div>
            {isBinary ? (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Sua previsao</span>
                <span className={["font-extrabold", choice === "sim" ? "text-sim" : "text-nao"].join(" ")}>
                  {choice?.toUpperCase()}
                </span>
              </div>
            ) : selectedOption ? (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Alternativa</span>
                <span className="font-semibold text-primary max-w-[60%] text-right line-clamp-1">
                  {selectedOption.label}
                </span>
              </div>
            ) : null}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Valor apostado</span>
              <span className="font-bold text-coin-dark">{formatCoins(betAmount)} Q$</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Saldo restante</span>
              <span className="font-semibold text-gray-700">{formatCoins(coins - betAmount)} Q$</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button3D variant="ghost" className="flex-1" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button3D>
            <Button3D
              variant={choice === "sim" ? "sim" : "nao"}
              className="flex-1"
              loading={placing}
              disabled={!selectedOption || !choice}
              onClick={handleConfirmBet}
            >
              Apostar
            </Button3D>
          </div>
        </div>
      </Modal>
    </>
  );
}
