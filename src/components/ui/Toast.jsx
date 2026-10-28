import React from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

export function ToastContainer() {
  const { toasts, removeToast } = useNotifications();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start space-x-3 p-4 rounded-xl shadow-lg border text-sm transition-all animate-in slide-in-from-bottom-2 ${
              isSuccess
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : isError
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            {isSuccess && <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
            {isError && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />}
            {!isSuccess && !isError && <Info className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />}

            <div className="flex-1 font-medium text-xs leading-relaxed">{toast.message}</div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 rounded p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

