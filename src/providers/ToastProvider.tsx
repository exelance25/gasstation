"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastVariant = "error" | "success" | "info" | "status";

export interface Toast {
  id: string;
  title: string;
  message: string;
  variant: ToastVariant;
  /** İşlem süresince otomatik kapanmayı devre dışı bırakır */
  persist?: boolean;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, "id">) => string;
  dismissToast: (id: string) => void;
  dismissAll: () => void;
  dismissByVariant: (variant: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const t = timersRef.current.get(id);
    if (t) clearTimeout(t);
    timersRef.current.delete(id);
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current.clear();
    setToasts([]);
  }, []);

  const dismissByVariant = useCallback((variant: ToastVariant) => {
    setToasts((prev) => {
      const removeIds = prev.filter((t) => t.variant === variant).map((t) => t.id);
      for (const id of removeIds) {
        const timer = timersRef.current.get(id);
        if (timer) clearTimeout(timer);
        timersRef.current.delete(id);
      }
      return prev.filter((t) => t.variant !== variant);
    });
  }, []);

  const showToast = useCallback(
    (toast: Omit<Toast, "id">): string => {
      const id = `toast-${++toastCounter}`;
      setToasts((prev) => {
        const next = [...prev, { ...toast, id }];
        if (toast.variant === "success" || toast.variant === "error") {
          return next.filter((t) => t.variant !== "status");
        }
        return next;
      });

      if (!toast.persist) {
        const timer = setTimeout(() => dismissToast(id), 6000);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [dismissToast],
  );

  const value = useMemo(
    () => ({ toasts, showToast, dismissToast, dismissAll, dismissByVariant }),
    [toasts, showToast, dismissToast, dismissAll, dismissByVariant],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed right-4 top-4 z-[300] flex w-full max-w-sm flex-col gap-3"
      role="region"
      aria-label="İşlem bildirimleri"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const styles: Record<ToastVariant, string> = {
    error:
      "border-neon-red/90 bg-neon-red/10 text-red-100 shadow-neon-red ring-1 ring-neon-red/40",
    success:
      "border-neon-accent-green/80 bg-neon-accent-green/10 text-green-100 shadow-[0_0_16px_rgba(16,185,129,0.35)] ring-1 ring-neon-accent-green/30",
    info: "border-neon-purple/70 bg-neon-purple/10 text-purple-100 shadow-neon-purple ring-1 ring-neon-purple/30",
    status:
      "border-neon-accent-purple/80 bg-charcoal/90 text-gray-100 shadow-[0_0_20px_rgba(168,85,247,0.35)] ring-1 ring-neon-accent-purple/40",
  };

  return (
    <div
      className={`rounded-xl border px-4 py-3 backdrop-blur-md ${styles[toast.variant]}`}
      role="alert"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {toast.variant === "status" && (
            <span className="mb-1 inline-block h-1.5 w-8 rounded-full bg-gradient-to-r from-neon-accent-purple to-neon-accent-green" />
          )}
          <p className="text-sm font-semibold leading-snug">{toast.title}</p>
          {toast.message ? (
            <p className="mt-1 break-all text-xs opacity-90">{toast.message}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="shrink-0 rounded border border-white/10 px-1.5 text-xs opacity-60 hover:opacity-100"
          aria-label="Kapat"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
