import React from 'react';
import { X, FileSpreadsheet } from 'lucide-react';
import { EventHistory } from './EventHistory';
import { EventItem } from '../types';

interface EventHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: EventItem[];
  selectedEventId: string | null;
  onSelectEvent: (event: EventItem) => void;
  onClearHistory: () => void;
}

export const EventHistoryModal: React.FC<EventHistoryModalProps> = ({
  isOpen,
  onClose,
  events,
  selectedEventId,
  onSelectEvent,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#2D2D2D]/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn font-mono">
      <div className="bg-[#F8F6F0] border border-[#2D2D2D] max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col relative">
        {/* Modal Header */}
        <div className="bg-[#2D2D2D] text-[#F8F6F0] p-4 flex items-center justify-between border-b border-[#2D2D2D]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#F8F6F0] text-[#2D2D2D] border border-[#2D2D2D]">
              <FileSpreadsheet className="w-5 h-5 text-[#2D2D2D]" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-[#F8F6F0]">
                DANH SÁCH GOOGLE SHEET ĐÃ TẠO ({events.length})
              </h2>
              <p className="text-xs text-[#E5E2D9]">
                Chọn một Sheet để tiếp tục import dữ liệu ở Bước 2
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#F8F6F0] hover:bg-[#F8F6F0] hover:text-[#2D2D2D] border border-[#F8F6F0] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <EventHistory
            events={events}
            selectedEventId={selectedEventId}
            onSelectEvent={(ev) => {
              onSelectEvent(ev);
              onClose();
            }}
            onClearHistory={onClearHistory}
          />
        </div>
      </div>
    </div>
  );
};
