import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';

const sizeMap = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
  '2xl': 'w-20 h-20 text-xl',
};

const statusDotSizeMap = {
  xs: 'w-2 h-2 ring-1',
  sm: 'w-2.5 h-2.5 ring-2',
  md: 'w-3 h-3 ring-2',
  lg: 'w-3.5 h-3.5 ring-2',
  xl: 'w-4 h-4 ring-2',
  '2xl': 'w-5 h-5 ring-2',
};

export const Avatar = ({
  src,
  name = 'User',
  size = 'md',
  isOnline = null,
  status = null, // 'online' | 'offline' | 'away' | 'busy'
  isGroup = false,
  className = '',
  showStatus = true,
  onClick,
}) => {
  const [imgError, setImgError] = useState(false);

  // Reset imgError whenever the avatar image source changes
  useEffect(() => {
    setImgError(false);
  }, [src]);

  const getInitials = (n) => {
    if (!n) return 'U';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  // Determine effective presence status:
  // - When isOnline is explicitly provided as a boolean:
  //   - If false: user is disconnected, presence is always 'offline'
  //   - If true: user is connected; honor custom 'away' or 'busy' if set, otherwise 'online'
  // - When isOnline is not provided (e.g. self profile card or settings preview):
  //   - Fall back to provided status or 'offline'
  let effectiveStatus = 'offline';
  if (typeof isOnline === 'boolean') {
    if (!isOnline) {
      effectiveStatus = 'offline';
    } else {
      effectiveStatus = (status === 'away' || status === 'busy') ? status : 'online';
    }
  } else if (status) {
    effectiveStatus = status;
  }

  const getStatusColor = () => {
    switch (effectiveStatus) {
      case 'online':
        return 'bg-emerald-500';
      case 'away':
        return 'bg-amber-500';
      case 'busy':
        return 'bg-rose-500';
      case 'offline':
      default:
        return 'bg-slate-500';
    }
  };

  // Generate deterministic gradient background for initials
  const getGradientBackground = (str = '') => {
    const gradients = [
      'from-violet-600 to-indigo-600',
      'from-cyan-600 to-blue-600',
      'from-fuchsia-600 to-pink-600',
      'from-emerald-600 to-teal-600',
      'from-amber-600 to-orange-600',
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return gradients[Math.abs(hash) % gradients.length];
  };

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex flex-shrink-0 select-none ${onClick ? 'cursor-pointer hover:opacity-90' : ''} ${className}`}
    >
      <div
        className={`${sizeMap[size] || sizeMap.md} rounded-full overflow-hidden flex items-center justify-center font-semibold text-white shadow-sm ring-1 ring-white/10 ${
          src && !imgError
            ? 'bg-dark-100'
            : isGroup
            ? 'bg-gradient-to-tr from-brand-600 to-cyan-600'
            : `bg-gradient-to-tr ${getGradientBackground(name)}`
        }`}
      >
        {src && !imgError ? (
          <img
            src={src}
            alt={name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : isGroup ? (
          <Users className="w-1/2 h-1/2 text-white/90" />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>

      {showStatus && !isGroup && (
        <span
          className={`absolute bottom-0 right-0 rounded-full ring-dark-300 ${statusDotSizeMap[size] || statusDotSizeMap.md} ${getStatusColor()} ${
            effectiveStatus === 'online' ? 'badge-pulse' : ''
          }`}
          title={effectiveStatus}
        />
      )}
    </div>
  );
};

export default Avatar;
