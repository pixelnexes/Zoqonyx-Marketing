"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  toast: (options: { type?: ToastType; title: string; message?: string; duration?: number }) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({
      type = "info",
      title,
      message,
      duration = 4000,
    }: {
      type?: ToastType;
      title: string;
      message?: string;
      duration?: number;
    }) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
      setToasts((prev) => [...prev, { id, type, title, message }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((title: string, message?: string) => {
    toast({ type: "success", title, message });
  }, [toast]);

  const error = useCallback((title: string, message?: string) => {
    toast({ type: "error", title, message });
  }, [toast]);

  const info = useCallback((title: string, message?: string) => {
    toast({ type: "info", title, message });
  }, [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-4 rounded-xl border shadow-lg transition-all duration-300 transform translate-y-0 flex items-start gap-3 ${
              t.type === "success"
                ? "bg-white border-emerald-200 text-slate-900 ring-1 ring-emerald-500/20"
                : t.type === "error"
                ? "bg-white border-red-200 text-slate-900 ring-1 ring-red-500/20"
                : "bg-white border-sky-200 text-slate-900 ring-1 ring-sky-500/20"
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {t.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : t.type === "error" ? (
                <AlertCircle className="w-5 h-5 text-red-600" />
              ) : (
                <Info className="w-5 h-5 text-sky-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-slate-900">{t.title}</h4>
              {t.message && <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{t.message}</p>}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-700 transition shrink-0 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Graceful fallback if invoked outside ToastProvider
    return {
      toast: ({ title, message }: any) => console.log(`[Toast] ${title}: ${message}`),
      success: (title: string, message?: string) => console.log(`[Success] ${title}: ${message}`),
      error: (title: string, message?: string) => console.log(`[Error] ${title}: ${message}`),
      info: (title: string, message?: string) => console.log(`[Info] ${title}: ${message}`),
    };
  }
  return context;
}
