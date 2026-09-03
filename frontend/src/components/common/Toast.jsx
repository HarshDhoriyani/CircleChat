import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 4);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border shadow-xl backdrop-blur-lg animate-slide-up text-sm font-medium transition-all ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200'
                : toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/30 text-rose-200'
                : 'bg-dark-200/90 border-white/15 text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-brand-400 flex-shrink-0" />}
              <span className="leading-snug">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-3 text-slate-400 hover:text-slate-200 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      addToast: () => {},
      removeToast: () => {},
    };
  }
  return context;
};

export default ToastProvider;
