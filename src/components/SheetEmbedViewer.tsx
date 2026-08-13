import React from 'react';
import { ExternalLink, FileSpreadsheet, Copy, Check, Info, ShieldAlert } from 'lucide-react';
import { EventItem } from '../types';

interface SheetEmbedViewerProps {
  event: EventItem | null;
  isMockMode: boolean;
}

export const SheetEmbedViewer: React.FC<SheetEmbedViewerProps> = ({ event, isMockMode }) => {
  const [copied, setCopied] = React.useState(false);

  if (!event) return null;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(event.spreadsheetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden space-y-0">
      {/* Header */}
      <div className="bg-slate-900 text-white p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-600 rounded-xl text-white">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>File Google Sheet hiện tại:</span>
              <span className="text-emerald-400 font-extrabold">{event.eventName}</span>
            </h3>
            <p className="text-[11px] text-slate-300 font-mono">
              Spreadsheet ID: {event.spreadsheetId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopyUrl}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Đã chép URL' : 'Sao chép URL Sheet'}</span>
          </button>

          <a
            href="https://drive.google.com/drive/folders/1Kjc3UYkNkYaHJQ6JrLZX15QPPWfZEaLZ"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <span>Mở Folder Drive (1Kjc3UY...)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <a
            href={event.spreadsheetUrl}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <span>Mở File Sheet này</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Body / Notice or Embedded Frame */}
      <div className="p-4 bg-slate-50 space-y-3">
        {isMockMode ? (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 text-xs flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Đang hiển thị dữ liệu ở Chế độ Giả lập (Mock Mode)</p>
              <p className="mt-0.5 text-amber-800">
                Ở chế độ giả lập, Spreadsheet ID được tạo ngẫu nhiên (<code className="font-mono bg-amber-100 px-1 rounded">{event.spreadsheetId}</code>) để thử nghiệm giao diện. Khi bạn kết nối <strong>URL Google Apps Script thật</strong>, file Google Sheet thực tế sẽ được tự động tạo và lưu trực tiếp trong <strong>Google Drive</strong> của bạn!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Google Sheet thật đã được tạo trên Google Drive của bạn!</p>
                <p className="text-emerald-800 text-[11px] mt-0.5">
                  Tên file chính xác: <strong>"{event.eventName}"</strong> | Bấm nút xanh bên trên để mở trực tiếp hoặc xem bản xem trước bên dưới.
                </p>
              </div>
            </div>

            {/* Embedded Iframe Sheet Preview */}
            <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-inner h-80 relative">
              <iframe
                title="Google Sheet Live View"
                src={`https://docs.google.com/spreadsheets/d/${event.spreadsheetId}/preview?widget=true&headers=false`}
                className="w-full h-full border-0"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
