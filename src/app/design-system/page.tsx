"use client";

import { useState } from "react";
import Button3D from "@/components/ui/Button3D";
import Card from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";
import XPBar from "@/components/ui/XPBar";
import Modal from "@/components/ui/Modal";
import ToastContainer from "@/components/ui/Toast";
import CoinBadge from "@/components/ui/CoinBadge";
import StreakCounter from "@/components/ui/StreakCounter";
import LevelBadge from "@/components/ui/LevelBadge";
import Avatar from "@/components/ui/Avatar";
import Skeleton from "@/components/ui/Skeleton";
import BottomNav from "@/components/layout/BottomNav";
import Header from "@/components/layout/Header";
import { useToast } from "@/lib/stores/toastStore";
import { UserLevel } from "@/lib/types";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-extrabold text-primary mb-4 border-b-2 border-primary/20 pb-2">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export default function DesignSystemPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { toast } = useToast();

  return (
    <>
      <Header title="Design System" coins={1250} streak={7} level={3} />
      <ToastContainer />
      <main className="pt-14 pb-24 max-w-lg mx-auto px-4 py-6">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-8 mt-4">
          🎨 achoQ — Design System
        </h1>

        {/* BUTTONS */}
        <Section title="Buttons">
          <div className="flex flex-wrap gap-3">
            <Button3D variant="primary">Primary</Button3D>
            <Button3D variant="sim">SIM ✅</Button3D>
            <Button3D variant="nao">NÃO ❌</Button3D>
            <Button3D variant="coin">🪙 Apostar</Button3D>
            <Button3D variant="ghost">Ghost</Button3D>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button3D variant="primary" size="sm">Small</Button3D>
            <Button3D variant="primary" size="md">Medium</Button3D>
            <Button3D variant="primary" size="lg">Large</Button3D>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button3D variant="primary" loading>Loading</Button3D>
            <Button3D variant="sim" disabled>Disabled</Button3D>
          </div>
        </Section>

        {/* CARDS */}
        <Section title="Cards">
          <Card variant="default">
            <p className="font-semibold text-gray-800">Default Card</p>
            <p className="text-sm text-gray-500">
              bg-white + shadow-card + rounded-3xl
            </p>
          </Card>
          <Card variant="featured">
            <p className="font-semibold text-gray-800">Featured Card</p>
            <p className="text-sm text-gray-500">
              Borda gradiente primary → sim
            </p>
          </Card>
          <Card variant="flat">
            <p className="font-semibold text-gray-800">Flat Card</p>
            <p className="text-sm text-gray-500">bg-white/60 + backdrop-blur</p>
          </Card>
        </Section>

        {/* BARS */}
        <Section title="Progress & XP Bars">
          <Card>
            <p className="text-sm font-bold text-gray-600 mb-3">
              ProgressBar — SIM vs NÃO
            </p>
            <ProgressBar simPercent={65} naoPercent={35} />
          </Card>
          <Card>
            <p className="text-sm font-bold text-gray-600 mb-3">XPBar</p>
            <XPBar current={750} max={1000} label="XP" />
            <div className="mt-3">
              <XPBar current={250} max={1000} label="Progresso" color="#22C55E" />
            </div>
          </Card>
        </Section>

        {/* GAMIFICATION */}
        <Section title="Gamification">
          <Card>
            <p className="text-sm font-bold text-gray-600 mb-3">CoinBadge</p>
            <div className="flex flex-wrap gap-3">
              <CoinBadge amount={100} size="sm" />
              <CoinBadge amount={1500} size="md" />
              <CoinBadge amount={99999} size="lg" />
              <CoinBadge amount={500} size="md" animated />
            </div>
          </Card>
          <Card>
            <p className="text-sm font-bold text-gray-600 mb-3">
              StreakCounter
            </p>
            <div className="flex flex-wrap gap-3">
              <StreakCounter streak={0} size="sm" />
              <StreakCounter streak={3} size="sm" />
              <StreakCounter streak={7} size="md" />
              <StreakCounter streak={30} size="md" />
            </div>
          </Card>
          <Card>
            <p className="text-sm font-bold text-gray-600 mb-3">LevelBadge</p>
            <div className="flex flex-wrap gap-3">
              {([1, 2, 3, 4, 5] as UserLevel[]).map((lvl) => (
                <LevelBadge key={lvl} level={lvl} showName size="md" />
              ))}
            </div>
            <div className="flex flex-wrap gap-3 mt-3">
              {([1, 2, 3, 4, 5] as UserLevel[]).map((lvl) => (
                <LevelBadge key={lvl} level={lvl} size="sm" />
              ))}
            </div>
          </Card>
          <Card>
            <p className="text-sm font-bold text-gray-600 mb-3">Avatar</p>
            <div className="flex flex-wrap gap-4 items-end">
              <Avatar username="João" size="sm" />
              <Avatar username="Maria" size="md" level={2} />
              <Avatar username="Carlos" size="lg" level={4} />
              <Avatar username="Teste" size="xl" level={5} />
            </div>
          </Card>
        </Section>

        {/* FEEDBACK */}
        <Section title="Feedback">
          <Card>
            <p className="text-sm font-bold text-gray-600 mb-3">
              Toast notifications
            </p>
            <div className="flex flex-wrap gap-2">
              <Button3D
                variant="sim"
                size="sm"
                onClick={() => toast("Aposta feita com sucesso!", "success")}
              >
                Success
              </Button3D>
              <Button3D
                variant="nao"
                size="sm"
                onClick={() => toast("Saldo insuficiente!", "error")}
              >
                Error
              </Button3D>
              <Button3D
                variant="primary"
                size="sm"
                onClick={() => toast("Evento encerrado em breve.", "info")}
              >
                Info
              </Button3D>
              <Button3D
                variant="coin"
                size="sm"
                onClick={() => toast("Atenção: verifique seus dados.", "warning")}
              >
                Warning
              </Button3D>
            </div>
          </Card>
          <Card>
            <p className="text-sm font-bold text-gray-600 mb-3">Modal</p>
            <Button3D variant="primary" onClick={() => setModalOpen(true)}>
              Abrir Modal
            </Button3D>
            <Modal
              isOpen={modalOpen}
              onClose={() => setModalOpen(false)}
              title="Confirmar aposta"
            >
              <div className="space-y-4">
                <p className="text-gray-700">
                  Você quer apostar <strong>100 moedas</strong> em{" "}
                  <strong>SIM</strong> para este evento?
                </p>
                <div className="flex gap-3">
                  <Button3D
                    variant="ghost"
                    className="flex-1"
                    onClick={() => setModalOpen(false)}
                  >
                    Cancelar
                  </Button3D>
                  <Button3D
                    variant="sim"
                    className="flex-1"
                    onClick={() => {
                      setModalOpen(false);
                      toast("Aposta confirmada! 🎉", "success");
                    }}
                  >
                    Confirmar SIM
                  </Button3D>
                </div>
              </div>
            </Modal>
          </Card>
        </Section>

        {/* SKELETONS */}
        <Section title="Skeleton Loaders">
          <Card>
            <div className="space-y-3">
              <div className="flex gap-3 items-center">
                <Skeleton variant="circle" />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" />
                </div>
              </div>
              <Skeleton variant="card" />
              <div className="flex gap-2">
                <Skeleton variant="button" />
                <Skeleton variant="button" />
              </div>
            </div>
          </Card>
        </Section>

        {/* NAVIGATION */}
        <Section title="Navigation">
          <Card>
            <p className="text-sm text-gray-500">
              BottomNav e Header estão fixos no topo e rodapé desta página.
              Veja os componentes fixos acima e abaixo.
            </p>
          </Card>
        </Section>
      </main>
      <BottomNav />
    </>
  );
}
