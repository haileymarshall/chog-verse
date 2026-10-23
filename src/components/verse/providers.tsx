"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "@/lib/verse/wallet";
import { Dossier } from "./Dossier";

type Toast = { id: number; title: string; body?: string; tone?: "gold" | "green" | "red" | "purple" };

const DossierCtx = createContext<(id: number) => void>(() => {});
const ToastCtx = createContext<(t: Omit<Toast, "id">) => void>(() => {});

export const useDossier = () => useContext(DossierCtx);
export const useToast = () => useContext(ToastCtx);

const TONE: Record<NonNullable<Toast["tone"]>, string> = {
  gold: "var(--gold)",
  green: "var(--green)",
  red: "var(--red)",
  purple: "var(--monad)",
};

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 5_000, retry: 1, refetchOnWindowFocus: true } } }));
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <GameUi>{children}</GameUi>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

function GameUi({ children }: { children: ReactNode }) {
  const [dossier, setDossier] = useState<number | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-2), { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 3800);
  }, []);

  const openDossier = useMemo(() => (id: number) => setDossier(id), []);

  return (
    <DossierCtx.Provider value={openDossier}>
      <ToastCtx.Provider value={toast}>
        {children}
        <AnimatePresence>{dossier != null && <Dossier key={dossier} id={dossier} onClose={() => setDossier(null)} />}</AnimatePresence>
        <div className="pointer-events-none fixed inset-x-0 top-20 z-[70] flex flex-col items-center gap-2 px-4">
          <AnimatePresence>
            {toasts.map((t) => (
              <motion.div
                key={t.id}
                layout
                initial={{ y: -30, opacity: 0, scale: 0.8, rotate: -4 }}
                animate={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
                exit={{ y: -20, opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 380, damping: 22 }}
                className="card pointer-events-auto flex max-w-sm items-center gap-3 px-4 py-2.5"
                style={{ borderRadius: 18, boxShadow: `5px 5px 0 0 var(--ink)` }}
              >
                <span className="h-9 w-2.5 shrink-0 rounded-full border-2 border-ink" style={{ background: TONE[t.tone ?? "gold"] }} />
                <div>
                  <div className="font-display text-lg leading-tight">{t.title}</div>
                  {t.body && <div className="text-sm font-semibold text-ink/70">{t.body}</div>}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ToastCtx.Provider>
    </DossierCtx.Provider>
  );
}
