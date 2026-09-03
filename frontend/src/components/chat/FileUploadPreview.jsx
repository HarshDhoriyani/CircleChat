import React from 'react';
import { X, FileText, Loader2 } from 'lucide-react';
import { formatFileSize, isImageFile } from '../../utils/fileUtils';

export const FileUploadPreview = ({ files = [], onRemoveFile, uploading = false }) => {
  if (files.length === 0) return null;

  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 bg-dark-200/90 border-t border-white/5 overflow-x-auto">
      {files.map((fileItem, idx) => {
        const isImg = isImageFile(fileItem.type, fileItem.name);
        return (
          <div
            key={idx}
            className="relative group flex items-center gap-2.5 p-2 rounded-xl bg-dark-100 border border-white/10 flex-shrink-0 max-w-xs transition-all shadow-sm"
          >
            {isImg && fileItem.previewUrl ? (
              <img
                src={fileItem.previewUrl}
                alt={fileItem.name}
                className="w-10 h-10 object-cover rounded-lg flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
                <FileText className="w-5 h-5" />
              </div>
            )}

            <div className="min-w-0 flex-1 pr-4">
              <p className="text-xs font-semibold text-slate-200 truncate">{fileItem.name}</p>
              <p className="text-[10px] text-slate-400">{formatFileSize(fileItem.size)}</p>
            </div>

            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin text-brand-400 absolute right-2 top-2" />
            ) : (
              <button
                type="button"
                onClick={() => onRemoveFile(idx)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-dark-300 border border-white/20 text-slate-400 hover:text-white hover:bg-rose-600 flex items-center justify-center transition-colors shadow"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FileUploadPreview;
