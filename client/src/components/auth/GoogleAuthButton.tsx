import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import { useThemeStore } from "@/store/theme-store";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            ux_mode?: "popup" | "redirect";
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with";
              shape?: "rectangular" | "pill" | "circle" | "square";
              width?: number;
              logo_alignment?: "left" | "center";
            }
          ) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

interface GoogleAuthButtonProps {
  onCredential: (credential: string) => Promise<void> | void;
  disabled?: boolean;
  text?: "signin_with" | "signup_with" | "continue_with";
}

let googleScriptPromise: Promise<void> | null = null;
let initializedClientId: string | null = null;
let credentialHandler: ((credential: string) => void) | null = null;

const loadGoogleScript = () => {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (googleScriptPromise) {
    return googleScriptPromise;
  }

  googleScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-identity="true"]');

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Unable to load Google Sign-In.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Google Sign-In."));
    document.head.appendChild(script);
  });

  return googleScriptPromise;
};

export function GoogleAuthButton({ onCredential, disabled = false, text = "continue_with" }: GoogleAuthButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const theme = useThemeStore((state) => state.theme);
  const [scriptError, setScriptError] = useState("");
  const clientId = useMemo(() => import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || "", []);

  useEffect(() => {
    credentialHandler = (credential) => {
      void onCredential(credential);
    };
  }, [onCredential]);

  useEffect(() => {
    const container = containerRef.current;

    if (!clientId || !container || disabled) {
      return;
    }

    let cancelled = false;

    const renderGoogleButton = async () => {
      try {
        await loadGoogleScript();

        if (cancelled || !window.google?.accounts?.id || !container) {
          return;
        }

        if (initializedClientId !== clientId) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (response) => {
              if (response.credential) {
                credentialHandler?.(response.credential);
              }
            },
            ux_mode: "popup"
          });
          initializedClientId = clientId;
        }

        container.innerHTML = "";
        window.google.accounts.id.renderButton(container, {
          type: "standard",
          theme: theme === "dark" ? "filled_black" : "outline",
          size: "large",
          text,
          shape: "pill",
          width: Math.max(container.offsetWidth, 320),
          logo_alignment: "left"
        });
        setScriptError("");
      } catch (error) {
        if (!cancelled) {
          setScriptError(error instanceof Error ? error.message : "Unable to load Google Sign-In.");
        }
      }
    };

    void renderGoogleButton();

    return () => {
      cancelled = true;
    };
  }, [clientId, disabled, text, theme]);

  if (!clientId) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">
        Add <code>VITE_GOOGLE_CLIENT_ID</code> to enable Google sign-in.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div ref={containerRef} className="flex min-h-11 justify-center" />
      {scriptError ? (
        <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
          <AlertCircle className="h-4 w-4" />
          <span>{scriptError}</span>
        </div>
      ) : null}
    </div>
  );
}
