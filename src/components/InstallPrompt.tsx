import { useEffect, useState } from "react";
import { Download, Share, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "inventaire-install-dismissed-at";
const DISMISS_DAYS = 7;

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOS() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
}

function recentlyDismissed() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = parseInt(raw, 10);
    if (Number.isNaN(ts)) return false;
    return Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [showIOS, setShowIOS] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone() || recentlyDismissed()) return;

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onBIP);

    // iOS doesn't fire beforeinstallprompt — show manual instructions
    if (isIOS()) {
      const t = setTimeout(() => setShowIOS(true), 1500);
      return () => {
        clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", onBIP);
      };
    }

    const onInstalled = () => {
      setShow(false);
      setShowIOS(false);
      setDeferred(null);
    };
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch {
      /* ignore */
    }
    setShow(false);
    setShowIOS(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") {
      setShow(false);
    }
    setDeferred(null);
  };

  if (!show && !showIOS) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:bottom-4 sm:left-auto sm:right-4 sm:max-w-sm sm:px-0">
      <div className="rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-start gap-3 p-4">
          <img
            src="/icon-192.png"
            alt=""
            className="h-12 w-12 shrink-0 rounded-xl"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              Installer Inventaire
            </p>
            {show ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Accès rapide depuis l'écran d'accueil, en plein écran.
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                Sur Safari, touchez{" "}
                <Share className="inline h-3.5 w-3.5 align-text-bottom" /> puis{" "}
                <span className="whitespace-nowrap font-medium text-foreground">
                  « Sur l'écran d'accueil »
                </span>{" "}
                <Plus className="inline h-3.5 w-3.5 align-text-bottom" />.
              </p>
            )}
            {show && (
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={install} className="gap-1.5">
                  <Download className="h-4 w-4" />
                  Installer
                </Button>
                <Button size="sm" variant="ghost" onClick={dismiss}>
                  Plus tard
                </Button>
              </div>
            )}
          </div>
          <button
            onClick={dismiss}
            aria-label="Fermer"
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
