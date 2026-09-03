import React from 'react';

const variantMap = {
  brand: 'bg-brand-500/20 text-brand-300 border border-brand-500/30',
  cyan: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
  success: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  danger: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
  warning: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  neutral: 'bg-white/10 text-slate-300 border border-white/10',
  unread: 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-bold shadow-sm',
};

export const Badge = ({
  children,
  count,
  variant = 'brand',
  size = 'sm',
  className = '',
}) => {
  if (count !== undefined) {
    if (count <= 0) return null;
    const displayCount = count > 99 ? '99+' : count;
    return (
      <span
        className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full ${variantMap.unread} ${className}`}
      >
        {displayCount}
      </span>
    );
  }

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px]',
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs font-medium',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${variantMap[variant] || variantMap.brand} ${sizeClasses[size] || sizeClasses.sm} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
