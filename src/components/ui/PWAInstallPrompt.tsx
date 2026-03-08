"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-20 left-4 right-4 max-w-lg mx-auto z-50"
        >
          <div className="bg-white rounded-3xl shadow-card p-4 flex items-center gap-3">
            <div className="text-3xl flex-shrink-0">📱</div>
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-gray-900 text-sm">Instale o achoQ!</p>
              <p className="text-xs text-gray-400">
                Adicione à tela inicial para acesso rápido.
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => setVisible(false)}
                aria-label="Fechar prompt de instalação"
                className="p-2 text-gray-400 text-lg"
              >
                ✕
              </button>
              <button
                onClick={handleInstall}
                className="px-4 py-2 bg-primary text-white rounded-2xl text-sm font-bold"
              >
                Instalar
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
