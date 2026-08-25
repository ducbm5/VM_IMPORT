import React from 'react';
import { Database, FileSpreadsheet, RotateCcw } from 'lucide-react';

interface HeaderProps {
  gasUrl: string;
  isMockMode: boolean;
  onToggleMockMode: (mock: boolean) => void;
  onOpenSettings: () => void;
  onOpenCodeGuide: () => void;
  eventsCount: number;
  onOpenHistory: () => void;
  showHistoryButton?: boolean;
  onResetCache?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  eventsCount,
  onOpenHistory,
  showHistoryButton = false,
  onResetCache,
}) => {
  return (
    <header className="bg-[#2D2D2D] text-[#F8F6F0] border-b border-[#2D2D2D] sticky top-0 z-30 font-serif">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        {/* Main Title */}
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#F8F6F0] text-[#2D2D2D] border border-[#2D2D2D] flex items-center justify-center">
            <Database className="w-5 h-5 text-[#2D2D2D]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#F8F6F0] tracking-tight">
                VM Validate Form
              </h1>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#F8F6F0] text-[#2D2D2D] border border-[#2D2D2D] px-2 py-0.5">
                GAS v2.0
              </span>
            </div>
            <p className="text-xs font-serif text-[#E5E2D9] mt-0.5 hidden sm:block">
              Tự động tạo Google Sheet giải đấu & Ghi nhận Form đăng ký trực tiếp
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 font-mono flex-wrap">
          {onResetCache && (
            <button
              onClick={onResetCache}
              title="Xóa toàn bộ Cache & khôi phục cấu hình sạch"
              className="px-2.5 py-2 bg-[#2D2D2D] hover:bg-[#E5E2D9] hover:text-[#2D2D2D] text-[#E5E2D9] font-bold border border-stone-600 hover:border-[#2D2D2D] flex items-center gap-1.5 cursor-pointer transition-colors text-[11px] tracking-wider uppercase"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>XÓA CACHE</span>
            </button>
          )}

          {/* Chỉ hiển thị nút danh sách khi hoàn thành Bước 2 */}
          {showHistoryButton && (
            <button
              onClick={onOpenHistory}
              className="px-3.5 py-2 bg-[#E5E2D9] hover:bg-[#F8F6F0] text-[#2D2D2D] font-bold border border-[#2D2D2D] flex items-center gap-2 cursor-pointer transition-colors text-xs tracking-wider uppercase shadow-xs animate-in fade-in duration-300"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#2D2D2D]" />
              <span>DANH SÁCH SHEET ĐÃ TẠO ({eventsCount})</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};



