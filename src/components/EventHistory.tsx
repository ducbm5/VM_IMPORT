import React from 'react';
import { ExternalLink, FileSpreadsheet, Check, Trash2, Calendar } from 'lucide-react';
import { EventItem } from '../types';

interface EventHistoryProps {
  events: EventItem[];
  selectedEventId: string | null;
  onSelectEvent: (event: EventItem) => void;
  onClearHistory: () => void;
}

export const EventHistory: React.FC<EventHistoryProps> = ({
  events,
  selectedEventId,
  onSelectEvent,
  onClearHistory,
}) => {
  if (events.length === 0) {
    return (
      <div className="bg-[#F8F6F0] border border-[#2D2D2D] p-6 text-center font-mono">
        <FileSpreadsheet className="w-8 h-8 text-[#2D2D2D] mx-auto mb-2" />
        <p className="text-xs font-bold text-[#2D2D2D] uppercase tracking-wider font-serif">CHƯA CÓ GOOGLE SHEET NÀO ĐƯỢC TẠO</p>
        <p className="text-[11px] text-stone-600 mt-1">
          Điền thông tin ở "BƯỚC 1: NGƯỜI YÊU CẦU" ở trên để tạo file đầu tiên.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#F8F6F0] border border-[#2D2D2D]">
      <div className="p-4 bg-[#2D2D2D] text-[#F8F6F0] border-b border-[#2D2D2D] flex items-center justify-between font-mono">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-[#F8F6F0]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8F6F0] font-serif">
            DANH SÁCH SHEET ĐÃ TẠO ({events.length})
          </h3>
        </div>

        <button
          onClick={onClearHistory}
          className="text-[11px] text-[#E5E2D9] hover:text-[#F8F6F0] transition-colors flex items-center gap-1 font-bold cursor-pointer uppercase tracking-wider"
          title="Xóa lịch sử hiển thị cục bộ"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>XÓA LỊCH SỬ</span>
        </button>
      </div>

      <div className="divide-y divide-[#E0DDD5]">
        {events.map((ev) => {
          const isSelected = selectedEventId === ev.id;

          return (
            <div
              key={ev.id}
              className={`p-5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isSelected ? 'bg-[#E5E2D9]' : 'hover:bg-[#E5E2D9]/40'
              }`}
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-serif font-bold text-base text-[#2D2D2D] truncate">
                    {ev.eventName}
                  </span>
                  {isSelected && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-[#2D2D2D] text-[#F8F6F0] px-2 py-0.5 border border-[#2D2D2D]">
                      <Check className="w-3 h-3 text-[#F8F6F0]" />
                      ĐANG CHỌN CHO BƯỚC 2
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-stone-600 flex flex-wrap items-center gap-3 font-mono">
                  <span>NGƯỜI YÊU CẦU: <strong className="text-[#2D2D2D]">{ev.requester}</strong></span>
                  <span className="text-stone-300">•</span>
                  <span className="flex items-center gap-1 text-[#2D2D2D]">
                    <Calendar className="w-3 h-3 text-[#2D2D2D]" />
                    {ev.createdAt}
                  </span>
                </div>

                <div className="text-[11px] text-stone-500 font-mono truncate">
                  ID: <span className="bg-[#F8F6F0] text-[#2D2D2D] border border-[#2D2D2D] px-1.5 py-0.5 font-bold">{ev.spreadsheetId}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0 pt-2 sm:pt-0 font-mono">
                <button
                  onClick={() => onSelectEvent(ev)}
                  disabled={isSelected}
                  className={`px-3.5 py-2 text-xs font-bold border border-[#2D2D2D] transition-colors cursor-pointer uppercase tracking-wider ${
                    isSelected
                      ? 'bg-[#2D2D2D] text-[#F8F6F0] cursor-default'
                      : 'bg-[#F8F6F0] hover:bg-[#2D2D2D] hover:text-[#F8F6F0] text-[#2D2D2D]'
                  }`}
                >
                  {isSelected ? 'ĐANG CHỌN' : 'CHỌN IMPORT'}
                </button>

                <a
                  href={ev.spreadsheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 text-xs font-bold bg-[#2D2D2D] hover:bg-[#E5E2D9] hover:text-[#2D2D2D] text-[#F8F6F0] inline-flex items-center gap-1.5 border border-[#2D2D2D] transition-colors uppercase tracking-wider"
                  title="Mở Google Sheet trên tab mới"
                >
                  <span>MỞ SHEET</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


