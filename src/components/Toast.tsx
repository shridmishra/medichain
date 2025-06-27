import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-emerald-500/90 border-emerald-400';
      case 'error':
        return 'bg-red-500/90 border-red-400';
      case 'info':
        return 'bg-cyan-500/90 border-cyan-400';
      default:
        return 'bg-slate-700/90 border-slate-600';
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 min-w-[300px] max-w-md p-4 rounded-lg shadow-lg backdrop-blur-sm border ${getTypeStyles()} text-white`}>
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium">{message}</p>
        <button
          onClick={onClose}
          className="ml-4 p-1 hover:bg-white/10 rounded-full transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
} 