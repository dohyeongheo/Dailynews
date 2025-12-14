"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import Toast, { Toast as ToastType } from "./Toast";

interface ToastContextType {
  showToast: (message: string, type?: ToastType["type"], duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

export default function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastType[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType["type"] = "info", duration?: number) => {
    const id = Math.random().toString(36).substring(7);
    const newToast: ToastType = {
      id,
      message,
      type,
      duration,
    };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const showSuccess = useCallback((message: string, duration?: number) => showToast(message, "success", duration), [showToast]);

  const showError = useCallback((message: string, duration?: number) => showToast(message, "error", duration), [showToast]);

  const showInfo = useCallback((message: string, duration?: number) => showToast(message, "info", duration), [showToast]);

  const showWarning = useCallback((message: string, duration?: number) => showToast(message, "warning", duration), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showInfo, showWarning }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col items-end">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
