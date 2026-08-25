import React, { useState } from 'react';
import { PlusCircle, Loader2, CheckCircle2, FileText, ArrowRight } from 'lucide-react';
import { StatusBanner } from './StatusBanner';
import { EventItem } from '../types';

interface CreateEventFormProps {
  onSubmit: (data: { requester: string; folderId?: string }) => Promise<EventItem | null>;
  isMockMode: boolean;
  folderId: string;
  onSelectForRegistration: (eventItem: EventItem) => void;
  onGoToStep2?: () => void;
  selectedEvent?: EventItem | null;
}

export const CreateEventForm: React.FC<CreateEventFormProps> = ({
  onSubmit,
  isMockMode,
  folderId,
  onSelectForRegistration,
  onGoToStep2,
  selectedEvent,
}) => {
  const [requester, setRequester] = useState('');

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [statusDetails, setStatusDetails] = useState('');
  const [createdEvent, setCreatedEvent] = useState<EventItem | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!requester.trim()) {
      setStatus('error');
      setStatusMessage('Vui lòng nhập Người yêu cầu / Tên File.');
      return;
    }

    setStatus('loading');
    setStatusMessage('');
    setStatusDetails('');
    setCreatedEvent(null);

    try {
      const result = await onSubmit({
        requester: requester.trim(),
        folderId: folderId.trim(),
      });

      if (result) {
        setStatus('success');
        setStatusMessage('Khởi tạo yêu cầu thành công! Vui lòng chuyển sang Bước 2 để import danh sách vận động viên.');
        setStatusDetails(`Yêu cầu: "${result.eventName}" đã được khởi tạo sẵn sàng.`);
        setCreatedEvent(result);
        onSelectForRegistration(result);
      }
    } catch (err: any) {
      setStatus('error');
      setStatusMessage(err.message || 'Lỗi không xác định khi tạo giải đấu.');
      setStatusDetails(err.stack || '');
    }
  };

  return (
    <div className="bg-[#F8F6F0] border border-[#2D2D2D] w-full">
      {/* Form Header */}
      <div className="bg-[#2D2D2D] text-[#F8F6F0] p-5 border-b border-[#2D2D2D]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="bg-[#F8F6F0] text-[#2D2D2D] font-mono font-bold px-2.5 py-1 text-xs border border-[#2D2D2D]">
              01
            </span>
            <div>
              <h2 className="text-base font-serif font-bold text-[#F8F6F0]">
                TÊN GIẢI - TÊN NGƯỜI YÊU CẦU
              </h2>
              <p className="text-[11px] font-mono text-[#E5E2D9]">
                Khởi tạo file yêu cầu
              </p>
            </div>
          </div>
          {isMockMode && (
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#E5E2D9] text-[#2D2D2D] border border-[#2D2D2D] px-2 py-0.5">
              MOCK MODE
            </span>
          )}
        </div>
      </div>

      <div className="p-6 space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Người yêu cầu */}
          <div>
            <label className="block text-xs font-mono font-bold text-[#2D2D2D] uppercase tracking-wider mb-2">
              TÊN GIẢI - TÊN NGƯỜI YÊU CẦU * <span className="text-stone-600 font-normal text-[11px]">(THÔNG TIN ĐỊNH DANH YÊU CẦU)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#2D2D2D]">
                <FileText className="w-4 h-4 text-[#2D2D2D]" />
              </div>
              <input
                type="text"
                value={requester}
                onChange={(e) => setRequester(e.target.value)}
                placeholder="Ví dụ: VnExpress Marathon 2026 - Nguyễn Văn A"
                required
                className="w-full pl-9 pr-3 py-2.5 bg-[#F8F6F0] border border-[#2D2D2D] text-xs font-mono text-[#2D2D2D] placeholder-stone-400 focus:outline-none focus:bg-[#E5E2D9] transition-colors"
              />
            </div>
          </div>

          {/* Status Message */}
          <StatusBanner
            status={status}
            message={statusMessage}
            details={statusDetails}
            onClose={() => setStatus('idle')}
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full py-3.5 px-4 bg-[#2D2D2D] hover:bg-[#E5E2D9] hover:text-[#2D2D2D] disabled:bg-stone-300 text-[#F8F6F0] font-mono font-bold text-xs uppercase tracking-widest border border-[#2D2D2D] transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#F8F6F0]" />
                <span>Đang kết nối & Khởi tạo yêu cầu...</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4 text-[#F8F6F0]" />
                <span>KHỞI TẠO YÊU CẦU (HOÀN THÀNH BƯỚC 1)</span>
              </>
            )}
          </button>
        </form>

        {/* Success Output Section - Không hiển thị link file sheet theo yêu cầu */}
        {createdEvent && (
          <div className="p-5 bg-[#F8F6F0] border border-[#2D2D2D] space-y-4">
            <div className="flex items-center gap-2 text-[#2D2D2D] font-mono font-bold text-xs uppercase font-serif">
              <CheckCircle2 className="w-4 h-4 text-[#2D2D2D]" />
              <span>ĐÃ HOÀN TẤT BƯỚC 1: KHỞI TẠO THÔNG TIN YÊU CẦU THÀNH CÔNG!</span>
            </div>

            <div className="space-y-1 text-xs text-[#2D2D2D] font-mono bg-[#E5E2D9] p-4 border border-[#2D2D2D]">
              <div>
                <span className="text-stone-600">Yêu cầu đã khởi tạo: </span>
                <strong className="text-[#2D2D2D] font-serif font-bold">{createdEvent.eventName}</strong>
              </div>
              <p className="text-[11px] text-stone-600 pt-1">
                ✓ Đã hoàn thành Bước 1. Vui lòng bấm tiếp tục để chuyển sang Bước 2 tải lên file Excel (18 cột).
              </p>
            </div>

            {/* Next Step Button */}
            {onGoToStep2 && (
              <div className="flex justify-end pt-1 font-mono">
                <button
                  type="button"
                  onClick={onGoToStep2}
                  className="w-full sm:w-auto px-6 py-3 bg-[#2D2D2D] hover:bg-[#E5E2D9] hover:text-[#2D2D2D] text-[#F8F6F0] text-xs font-bold flex items-center justify-center gap-2 border border-[#2D2D2D] transition-colors cursor-pointer uppercase tracking-widest shadow-xs"
                >
                  <span>TIẾP TỤC SANG BƯỚC 2 (IMPORT EXCEL)</span>
                  <ArrowRight className="w-4 h-4 text-[#F8F6F0]" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};


