import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-md',
  icon: Icon,
  className = '',
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Blurred Ambient Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 dark:bg-dark-400/80 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div
        className={`relative w-full ${maxWidth} bg-white dark:bg-dark-200/95 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10 animate-scale-in my-auto ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 sm:p-6 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-600 dark:text-brand-400 flex-shrink-0">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>
              {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
