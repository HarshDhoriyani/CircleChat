import React, { useEffect } from 'react';
import { X, Download } from 'lucide-react';

export const ImageLightbox = ({ src, alt = 'Image preview', isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !src) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-400/90 backdrop-blur-md animate-fade-in">
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          download
          className="p-2 rounded-xl bg-dark-200/80 text-slate-300 hover:text-white hover:bg-dark-100 border border-white/10 transition-colors"
          title="Download image"
        >
          <Download className="w-5 h-5" />
        </a>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl bg-dark-200/80 text-slate-300 hover:text-white hover:bg-dark-100 border border-white/10 transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="relative max-w-5xl max-h-[85vh] overflow-hidden rounded-2xl border border-white/10 shadow-2xl animate-scale-in">
        <img src={src} alt={alt} className="w-full h-full object-contain max-h-[85vh]" />
      </div>
    </div>
  );
};

export default ImageLightbox;
