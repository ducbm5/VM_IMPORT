import React from 'react';
import { AlertCircle, CheckCircle2, Loader2, Info } from 'lucide-react';

interface StatusBannerProps {
  status: 'idle' | 'loading' | 'success' | 'error';
  message: string;
  details?: string;
  onClose?: () => void;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({
  status,
  message,
  details,
  onClose,
}) => {
  if (status === 'idle' || !message) return null;

  const styles = {
    loading: {
      bg: 'bg-[#F8F6F0] border-[#2D2D2D] text-[#2D2D2D]',
      icon: <Loader2 className="w-4 h-4 text-[#2D2D2D] animate-spin flex-shrink-0" />,
      badge: 'bg-[#2D2D2D] text-[#F8F6F0]',
      label: 'PROCESSING...',
    },
    success: {
      bg: 'bg-[#E5E2D9] border-[#2D2D2D] text-[#2D2D2D]',
      icon: <CheckCircle2 className="w-4 h-4 text-[#2D2D2D] flex-shrink-0" />,
      badge: 'bg-[#2D2D2D] text-[#F8F6F0]',
      label: 'SUCCESS',
    },
    error: {
      bg: 'bg-[#E5E2D9] border-[#2D2D2D] text-[#2D2D2D]',
      icon: <AlertCircle className="w-4 h-4 text-[#2D2D2D] flex-shrink-0" />,
      badge: 'bg-[#2D2D2D] text-[#F8F6F0]',
      label: 'ERROR',
    },
    idle: {
      bg: 'bg-[#F8F6F0] border-[#2D2D2D] text-[#2D2D2D]',
      icon: <Info className="w-4 h-4 text-[#2D2D2D] flex-shrink-0" />,
      badge: 'bg-[#2D2D2D] text-[#F8F6F0]',
      label: 'INFO',
    },
  }[status];

  return (
    <div className={`p-4 bg-[#F8F6F0] border border-[#2D2D2D] text-xs font-mono my-3 ${styles.bg}`}>
      <div className="flex items-start gap-3">
        {styles.icon}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 tracking-wider border border-[#2D2D2D] ${styles.badge}`}>
              {styles.label}
            </span>
            <p className="font-bold font-serif text-[#2D2D2D]">{message}</p>
          </div>
          {details && (
            <p className="text-[11px] text-[#2D2D2D] font-mono break-all mt-1 bg-[#F8F6F0] p-2 border border-[#2D2D2D]">
              {details}
            </p>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[10px] font-bold text-[#2D2D2D] hover:bg-[#2D2D2D] hover:text-[#F8F6F0] px-2.5 py-1 border border-[#2D2D2D] transition-colors cursor-pointer uppercase tracking-wider"
          >
            DISMISS
          </button>
        )}
      </div>
    </div>
  );
};


