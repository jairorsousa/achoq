"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase/config";
import { mapEventRow } from "@/lib/supabase/mappers";
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
import type { Event, BetChoice } from "@/lib/types";
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
  const { firebaseUser } = useAuthStore();
  const profile = useUserStore((s) => s.profile);
  const { toast } = useToast();

  useUser();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [choice, setChoice] = useState<BetChoice | null>(null);
  const [betAmount, setBetAmount] = useState(50);
  const [alreadyBet, setAlreadyBet] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [showBurst, setShowBurst] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadEvent = async () => {
      const { data, error } = await supabase.from("events").select("*").eq("id", id).maybeSingle();

      if (!mounted) return;
      if (error || !data) {
        setEvent(null);
        setLoading(false);
        return;
      }

      setEvent(mapEventRow(data as Parameters<typeof mapEventRow>[0]));
      setLoading(false);
    };

    void loadEvent();

    const eventChannel = supabase
      .channel(`event_${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events", filter: `id=eq.${id}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setEvent(null);
            return;
          }
          const row = payload.new as Parameters<typeof mapEventRow>[0] | undefined;
          if (row) {
            setEvent(mapEventRow(row));
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      void supabase.removeChannel(eventChannel);
    };
  }, [id]);

  useEffect(() => {
    if (!firebaseUser || !id) return;

    let mounted = true;

    const checkBet = async () => {
      const { data } = await supabase
        .from("bets")
        .select("id")
        .eq("user_id", firebaseUser.uid)
        .eq("event_id", id)
        .limit(1);

      if (!mounted) return;
      setAlreadyBet(Boolean(data && data.length > 0));
    };

    void checkBet();

    return () => {
      mounted = false;
    };
  }, [firebaseUser, id]);

  useEffect(() => {
    if (profile) {
      setBetAmount(Math.max(10, Math.min(profile.coins, 50)));
    }
  }, [profile]);

  async function handleConfirmBet() {
    if (!firebaseUser || !event || !choice || !profile) return;
    setPlacing(true);

    try {
      const { error } = await supabase.rpc("place_bet", {
        p_event_id: id,
        p_choice: choice,
        p_amount: betAmount,
      });

      if (error) {
        throw new Error(error.message);
      }

      setAlreadyBet(true);
      setConfirmOpen(false);
      setShowBurst(true);
      setTimeout(() => setShowBurst(false), 1000);
      toast(`Boa! Voce apostou ${formatCoins(betAmount)} Q$ em ${choice.toUpperCase()}`, "success");
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

  return (
    <>
      <ToastContainer />
      {showBurst && <CoinBurst />}

      <div className="py-4 space-y-4">
        <button className="text-primary font-bold text-sm flex items-center gap-1" onClick={() => router.back()}>
          Voltar
        </button>

        <Card>
          <div className="space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{event.category}</p>
            <h1 className="text-xl font-extrabold text-gray-900 leading-tight">{event.title}</h1>
            {event.description && <p className="text-sm text-gray-500 leading-relaxed">{event.description}</p>}
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span>Tempo {timeRemaining(event.closesAt)}</span>
              <span>{formatCompact(event.totalBets)} palpites</span>
              <span>{formatCompact(event.totalCoins)} Q$</span>
            </div>
          </div>
        </Card>

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

        {isClosed ? (
          <Card>
            <div className="text-center py-4">
              <div className="text-4xl mb-2">fechado</div>
              <p className="font-bold text-gray-600">Apostas encerradas</p>
              {event.result && <p className="text-sm text-gray-400 mt-1">Resultado: {event.result.toUpperCase()}</p>}
            </div>
          </Card>
        ) : alreadyBet ? (
          <Card>
            <div className="text-center py-4">
              <p className="font-bold text-gray-700">Voce ja apostou neste evento.</p>
              <p className="text-sm text-gray-400 mt-1">Aguarde o resultado.</p>
            </div>
          </Card>
        ) : !profile ? (
          <Card>
            <p className="text-center text-gray-500 text-sm">Faca login para apostar.</p>
          </Card>
        ) : (
          <Card>
            <div className="space-y-4">
              <p className="font-bold text-gray-700">Fazer previsao</p>

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

              {!choice && <p className="text-center text-sm text-gray-400">Selecione SIM ou NAO para apostar</p>}
            </div>
          </Card>
        )}
      </div>

      <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirmar previsao">
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Evento</span>
              <span className="font-semibold text-gray-800 max-w-[60%] text-right line-clamp-1">{event.title}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Sua previsao</span>
              <span className={["font-extrabold", choice === "sim" ? "text-sim" : "text-nao"].join(" ")}>
                {choice?.toUpperCase()}
              </span>
            </div>
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
            <Button3D variant={choice === "sim" ? "sim" : "nao"} className="flex-1" loading={placing} onClick={handleConfirmBet}>
              Apostar
            </Button3D>
          </div>
        </div>
      </Modal>
    </>
  );
}
