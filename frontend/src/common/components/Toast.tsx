import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastVariant = "success" | "error" | "info" | "warning";

export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
  position: ToastPosition;
  visible: boolean;
}

interface ToastOptions {
  message: string;
  variant?: ToastVariant;
  position?: ToastPosition;
  duration?: number;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FADE_DURATION = 300;

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Styles ───────────────────────────────────────────────────────────────────

const variantStyles: Record<ToastVariant, string> = {
  success: "border-tools-green/40 text-tools-green-light bg-tools-graphite",
  error: "border-tools-red/40 text-tools-red-light bg-tools-graphite",
  info: "border-tools-blue/40 text-tools-blue bg-tools-graphite",
  warning: "border-tools-gold/40 text-tools-gold bg-tools-graphite",
};

const variantAccent: Record<ToastVariant, string> = {
  success: "bg-tools-green",
  error: "bg-tools-red",
  info: "bg-tools-blue",
  warning: "bg-tools-gold",
};

const variantIcons: Record<ToastVariant, string> = {
  success: "✓",
  error: "✕",
  info: "i",
  warning: "!",
};

const positionContainerStyles: Record<ToastPosition, string> = {
  "top-left": "top-5 left-5 items-start",
  "top-center": "top-5 left-1/2 -translate-x-1/2 items-center",
  "top-right": "top-5 right-5 items-end",
  "bottom-left": "bottom-5 left-5 items-start",
  "bottom-center": "bottom-5 left-1/2 -translate-x-1/2 items-center",
  "bottom-right": "bottom-5 right-5 items-end",
};

// Slide direction based on which side the toast appears from
const positionSlide: Record<ToastPosition, string> = {
  "top-left": "-translate-x-3",
  "top-center": "-translate-y-3",
  "top-right": "translate-x-3",
  "bottom-left": "-translate-x-3",
  "bottom-center": "translate-y-3",
  "bottom-right": "translate-x-3",
};

// ─── Single Toast ─────────────────────────────────────────────────────────────

function Toast({
  message,
  variant,
  position,
  visible,
  onClose,
}: {
  message: string;
  variant: ToastVariant;
  position: ToastPosition;
  visible: boolean;
  onClose: () => void;
}) {
  const hiddenTransform = positionSlide[position];

  return (
    <div
      style={{ transitionDuration: `${FADE_DURATION}ms` }}
      className={`
        flex items-stretch rounded-xl border shadow-2xl min-w-80 max-w-105 transition-all ease-out
        ${variantStyles[variant]} ${visible ? "opacity-100 translate-x-0 translate-y-0" : `opacity-0 ${hiddenTransform}`}
      `}
    >
      {/* Colored left accent bar */}
      <div
        className={`w-1 rounded-l-xl shrink-0 ${variantAccent[variant]} opacity-80`}
      />

      <div className="flex items-center gap-4 px-5 py-4 w-full">
        {/* Icon */}
        <span className="shrink-0 w-7 h-7 flex items-center justify-center text-sm font-bold rounded-full border-2 border-current opacity-80">
          {variantIcons[variant]}
        </span>

        {/* Message */}
        <span className="flex-1 font-mono text-sm tracking-wide leading-snug">
          {message}
        </span>

        {/* Close */}
        <button
          onClick={onClose}
          className="shrink-0 opacity-35 hover:opacity-75 transition-opacity text-current text-xl leading-none ml-1"
        >
          ×
        </button>
      </div>
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    // Fade out first, then remove
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, visible: false } : t)),
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, FADE_DURATION);
  }, []);

  const toast = useCallback(
    ({
      message,
      variant = "info",
      position = "bottom-right",
      duration = 4000,
    }: ToastOptions) => {
      const id = nextId.current++;
      // Insert as invisible, flip visible on next frame to trigger transition
      setToasts((prev) => [
        ...prev,
        { id, message, variant, position, visible: false },
      ]);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setToasts((prev) =>
            prev.map((t) => (t.id === id ? { ...t, visible: true } : t)),
          );
        });
      });
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
    },
    [dismiss],
  );

  // Group toasts by position
  const byPosition = toasts.reduce<Record<string, ToastItem[]>>((acc, t) => {
    (acc[t.position] ??= []).push(t);
    return acc;
  }, {});

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {(Object.entries(byPosition) as [ToastPosition, ToastItem[]][]).map(
        ([position, items]) => (
          <div
            key={position}
            className={`fixed z-[200] flex flex-col gap-3 pointer-events-none ${positionContainerStyles[position]}`}
          >
            {items.map((t) => (
              <div key={t.id} className="pointer-events-auto">
                <Toast
                  message={t.message}
                  variant={t.variant}
                  position={t.position}
                  visible={t.visible}
                  onClose={() => dismiss(t.id)}
                />
              </div>
            ))}
          </div>
        ),
      )}
    </ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
