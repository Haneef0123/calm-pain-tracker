'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

const DEFAULT_ACTION_OVERLAY_DURATION_MS = 1800;
const ACTION_OVERLAY_STORAGE_KEY = 'painmap-action-overlay';

interface ActionOverlayOptions {
  title: string;
  subtitle?: string;
  accent: string;
  durationMs?: number;
}

interface ActiveActionOverlay {
  title: string;
  subtitle: string;
  accent: string;
}

interface StoredActionOverlay extends ActiveActionOverlay {
  expiresAt: number;
}

interface ActionOverlayContextValue {
  showOverlay: (options: ActionOverlayOptions) => void;
  clearOverlay: () => void;
  isVisible: boolean;
}

const ActionOverlayContext = createContext<ActionOverlayContextValue | null>(null);

export function ActionOverlayProvider({ children }: { children: ReactNode }) {
  const [overlay, setOverlay] = useState<ActiveActionOverlay | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  const clearOverlay = () => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    window.sessionStorage.removeItem(ACTION_OVERLAY_STORAGE_KEY);
    setOverlay(null);
  };

  const scheduleOverlayHide = (expiresAt: number) => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
    }

    const remainingMs = Math.max(0, expiresAt - Date.now());
    if (remainingMs === 0) {
      clearOverlay();
      return;
    }

    hideTimerRef.current = window.setTimeout(() => {
      hideTimerRef.current = null;
      clearOverlay();
    }, remainingMs);
  };

  const showOverlay = (options: ActionOverlayOptions) => {
    const nextOverlay: StoredActionOverlay = {
      title: options.title,
      subtitle: options.subtitle ?? '',
      accent: options.accent,
      expiresAt: Date.now() + (options.durationMs ?? DEFAULT_ACTION_OVERLAY_DURATION_MS),
    };

    window.sessionStorage.setItem(
      ACTION_OVERLAY_STORAGE_KEY,
      JSON.stringify(nextOverlay),
    );
    setOverlay(nextOverlay);
    scheduleOverlayHide(nextOverlay.expiresAt);
  };

  useEffect(() => {
    const rawOverlay = window.sessionStorage.getItem(ACTION_OVERLAY_STORAGE_KEY);
    if (!rawOverlay) {
      return;
    }

    try {
      const storedOverlay = JSON.parse(rawOverlay) as StoredActionOverlay;
      if (
        !storedOverlay.title ||
        !storedOverlay.accent ||
        storedOverlay.expiresAt <= Date.now()
      ) {
        clearOverlay();
        return;
      }

      setOverlay(storedOverlay);
      scheduleOverlayHide(storedOverlay.expiresAt);
    } catch {
      clearOverlay();
    }

    return () => {
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  return (
    <ActionOverlayContext.Provider
      value={{
        showOverlay,
        clearOverlay,
        isVisible: overlay !== null,
      }}
    >
      {children}
      {overlay && (
        <div className="fixed inset-y-0 left-1/2 z-50 flex w-full max-w-[430px] -translate-x-1/2 items-center justify-center bg-[rgba(255,255,255,0.93)] backdrop-blur-[4px]">
          <div
            aria-live="polite"
            role="status"
            className="animate-fade-up flex flex-col items-center gap-[6px] px-6 text-center"
          >
            <div
              className="mb-[10px] flex h-[72px] w-[72px] animate-scale-in items-center justify-center rounded-full"
              style={{ backgroundColor: overlay.accent }}
            >
              <svg
                width="34"
                height="34"
                viewBox="0 0 34 34"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M8 18l6 6 12-13"
                  stroke="#ffffff"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-[19px] font-semibold text-[#1c211d]">
              {overlay.title}
            </span>
            {overlay.subtitle ? (
              <span className="text-[13px] text-[#777777]">{overlay.subtitle}</span>
            ) : null}
          </div>
        </div>
      )}
    </ActionOverlayContext.Provider>
  );
}

export function useActionOverlay() {
  const context = useContext(ActionOverlayContext);

  if (!context) {
    throw new Error('useActionOverlay must be used within an ActionOverlayProvider');
  }

  return context;
}
