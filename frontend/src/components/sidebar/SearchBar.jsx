import React from 'react';
import { Search, X } from 'lucide-react';

export const SearchBar = ({ value, onChange, onClear, placeholder = 'Search conversations & teammates...' }) => {
  return (
    <div className="relative px-3.5 py-2">
      <div className="relative flex items-center">
        <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-slate-100 dark:bg-dark-100/90 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 text-xs rounded-xl pl-9 pr-8 py-2 focus:outline-none focus:border-brand-500/50 focus:bg-white dark:focus:bg-dark-100 transition-all"
        />
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
