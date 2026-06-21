import { useEffect, useMemo, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function PWAInstall({ compact = false }: { compact?: boolean }) {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const ios = useMemo(isIos, []);

  useEffect(() => {
    setInstalled(isStandalone());
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    await promptEvent.userChoice.catch(() => undefined);
    setPromptEvent(null);
  };

  if (installed) {
    return (
      <div className="rounded-xl border border-border bg-background p-4 text-[12.5px] text-muted-foreground">
        DocShift is already installed on this device.
      </div>
    );
  }

  if (ios) {
    return (
      <div className="rounded-xl border border-border bg-background p-4">
        <div className="text-[13px] font-medium text-foreground">Install on iPhone or iPad</div>
        <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
          Open DocShift in Safari, tap Share, then choose Add to Home Screen. iOS does not allow
          websites to open that install sheet automatically.
        </p>
      </div>
    );
  }

  return (
    <div
      className={
        compact ? "flex items-center gap-3" : "rounded-xl border border-border bg-background p-4"
      }
    >
      <div className={compact ? "min-w-0 flex-1" : ""}>
        <div className="text-[13px] font-medium text-foreground">Install the web app</div>
        <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
          Add DocShift to your launcher for a browser-powered app experience.
        </p>
      </div>
      <button
        type="button"
        onClick={install}
        disabled={!promptEvent}
        className="mt-3 inline-flex h-9 items-center justify-center rounded-lg bg-foreground px-3 text-[12.5px] font-medium text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
      >
        {promptEvent ? "Install" : "Use browser menu"}
      </button>
    </div>
  );
}
