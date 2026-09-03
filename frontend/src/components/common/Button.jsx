import React from 'react';
import { Loader2 } from 'lucide-react';

const variantClasses = {
  primary:
    'bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white shadow-glow-sm hover:shadow-glow-md border border-brand-400/30 active:scale-[0.98]',
  secondary:
    'bg-white dark:bg-dark-200/90 hover:bg-slate-100 dark:hover:bg-dark-100 text-slate-800 dark:text-slate-100 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-white/15 shadow-sm active:scale-[0.98]',
  ghost:
    'bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white active:scale-[0.98]',
  danger:
    'bg-rose-50 dark:bg-rose-500/15 hover:bg-rose-100 dark:hover:bg-rose-500/25 text-rose-600 dark:text-rose-300 hover:text-rose-700 dark:hover:text-rose-200 border border-rose-200 dark:border-rose-500/20 active:scale-[0.98]',
  ai:
    'bg-gradient-to-r from-brand-600 via-indigo-600 to-cyan-500 hover:from-brand-500 hover:via-indigo-500 hover:to-cyan-400 text-white font-medium shadow-glow-cyan hover:shadow-glow-md border border-cyan-400/40 active:scale-[0.98]',
  outline:
    'bg-transparent border border-slate-300 dark:border-white/15 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 hover:border-slate-400 dark:hover:border-white/25 active:scale-[0.98]',
};

const sizeClasses = {
  xs: 'px-2.5 py-1 text-xs rounded-lg gap-1.5',
  sm: 'px-3.5 py-1.5 text-xs font-medium rounded-xl gap-2',
  md: 'px-4 py-2 text-sm font-medium rounded-xl gap-2',
  lg: 'px-5 py-2.5 text-base font-semibold rounded-2xl gap-2.5',
};

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconRight: IconRight,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) => {
  const isDisabled = disabled || loading;
  const EffectiveLeftIcon = iconPosition === 'right' ? null : Icon;
  const EffectiveRightIcon = IconRight || (iconPosition === 'right' ? Icon : null);

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center transition-all duration-150 select-none ${
        fullWidth ? 'w-full' : ''
      } ${variantClasses[variant] || variantClasses.primary} ${sizeClasses[size] || sizeClasses.md} ${
        isDisabled ? 'opacity-50 cursor-not-allowed transform-none' : 'cursor-pointer'
      } ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : EffectiveLeftIcon ? (
        <EffectiveLeftIcon className="w-4 h-4 flex-shrink-0" />
      ) : null}
      {children && <span>{children}</span>}
      {!loading && EffectiveRightIcon ? (
        <EffectiveRightIcon className="w-4 h-4 flex-shrink-0" />
      ) : null}
    </button>
  );
};

export default Button;
