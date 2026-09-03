import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      icon: Icon,
      type = 'text',
      className = '',
      containerClassName = '',
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordType = type === 'password';
    const effectiveType = isPasswordType ? (showPassword ? 'text' : 'password') : type;
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={`w-full flex flex-col gap-1.5 ${containerClassName}`}>
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {Icon && (
            <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center">
              <Icon className="w-4 h-4" />
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            type={effectiveType}
            className={`w-full bg-slate-50 dark:bg-dark-200/80 border text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm rounded-xl py-2.5 transition-all duration-200 focus:outline-none ${
              Icon ? 'pl-10' : 'pl-3.5'
            } ${isPasswordType ? 'pr-10' : 'pr-3.5'} ${
              error
                ? 'border-rose-500/50 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                : 'border-slate-200 dark:border-white/10 focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/20 focus:bg-white dark:focus:bg-dark-100'
            } ${className}`}
            {...props}
          />

          {isPasswordType && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>

        {error ? (
          <p className="text-xs text-rose-500 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
