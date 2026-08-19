import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-navy-950/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className="bg-white dark:bg-navy-900 border border-navy-100 dark:border-navy-700/50 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto z-10 flex flex-col animate-soft-zoom">
        <div className="p-6 pb-4 border-b border-navy-100 dark:border-navy-800 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-navy-900 dark:text-white">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-navy-400 hover:text-navy-600 dark:hover:text-navy-200 p-1.5 rounded-full hover:bg-navy-100 dark:hover:bg-navy-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
