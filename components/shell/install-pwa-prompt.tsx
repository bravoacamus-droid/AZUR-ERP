'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISSED_KEY = 'azur:pwa:install-dismissed';

export function InstallPwaPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = typeof window !== 'undefined' && window.localStorage.getItem(DISMISSED_KEY);
    if (dismissed) return;

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
      setDeferred(null);
    }
  }

  function dismiss() {
    try {
      window.localStorage.setItem(DISMISSED_KEY, Date.now().toString());
    } catch {}
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && deferred && (
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            'pointer-events-auto fixed inset-x-3 bottom-24 z-40 mx-auto max-w-md rounded-2xl border border-azur-coral/40 bg-white p-4 shadow-azur-lg backdrop-blur',
            'lg:bottom-6 lg:left-6 lg:right-auto lg:max-w-sm',
          )}
        >
          <button
            type="button"
            onClick={dismiss}
            aria-label="Cerrar"
            className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground hover:bg-azur-coral/15 hover:text-azur-red"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3 pr-6">
            <Logo variant="mark" className="h-10 w-auto shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-azur-ink">Instala AZUR en tu celular</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Acceso directo, funciona sin conexión, notificaciones push.
              </p>
              <button
                type="button"
                onClick={install}
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-azur-gradient px-4 py-1.5 text-xs font-semibold text-white shadow-azur-md transition-all hover:shadow-azur-lg"
              >
                <Download className="h-3.5 w-3.5" />
                Instalar app
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
