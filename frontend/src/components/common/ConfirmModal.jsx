import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, X, AlertCircle } from 'lucide-react';
import { Button } from './Button';

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'Are you sure you want to perform this action? This cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger',
  icon: CustomIcon,
  loading = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      } else if (e.key === 'Enter' && isOpen && !loading) {
        e.preventDefault();
        onConfirm?.();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, onConfirm, loading]);

  if (!isOpen) return null;

  const DefaultIcon =
    confirmVariant === 'danger'
      ? Trash2
      : confirmVariant === 'warning'
      ? AlertTriangle
      : AlertCircle;
  const Icon = CustomIcon || DefaultIcon;

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 select-none animate-fade-in">
      {/* Blurred Ambient Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md transition-opacity"
        onClick={loading ? undefined : onClose}
      />

      {/* Modal Card */}
      <div
        className="relative w-full max-w-md bg-white dark:bg-dark-200/95 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden z-10 animate-scale-in p-6 transition-all"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          type="button"
          disabled={loading}
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50 cursor-pointer"
          title="Close dialog (Esc)"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon & Details */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform ${
              confirmVariant === 'danger'
                ? 'bg-rose-500/10 border border-rose-500/20 text-rose-500 shadow-rose-500/10'
                : confirmVariant === 'warning'
                ? 'bg-amber-500/10 border border-amber-500/20 text-amber-500 shadow-amber-500/10'
                : 'bg-brand-500/10 border border-brand-500/20 text-brand-500 shadow-brand-500/10'
            }`}
          >
            <Icon className="w-6 h-6" />
          </div>

          <div className="flex-1 pr-6 sm:pr-0">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-white/5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>

          <Button
            type="button"
            variant={confirmVariant}
            size="sm"
            loading={loading}
            icon={Icon}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};

export default ConfirmModal;
