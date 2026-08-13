import React, { useState } from 'react';
import { Terminal, ChevronDown, ChevronUp, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { ApiLog } from '../types';

interface ApiLogsInspectorProps {
  logs: ApiLog[];
  onClearLogs: () => void;
}

export const ApiLogsInspector: React.FC<ApiLogsInspectorProps> = ({
  logs,
  onClearLogs,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ApiLog | null>(null);

  if (logs.length === 0) return null;

  return (
    <div className="bg-[#F8F6F0] border border-[#2D2D2D] text-[#2D2D2D] font-mono">
      {/* Drawer Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 bg-[#2D2D2D] text-[#F8F6F0] flex items-center justify-between cursor-pointer hover:bg-[#2D2D2D]/90 transition-colors select-none"
      >
        <div className="flex items-center gap-3">
          <Terminal className="w-4 h-4 text-[#F8F6F0]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#F8F6F0] font-serif">
            NHẬT KÝ API FETCH REQUEST / RESPONSE ({logs.length})
          </span>
          <span className="text-[10px] bg-[#F8F6F0] text-[#2D2D2D] border border-[#2D2D2D] px-2 py-0.5 font-mono font-bold">
            MỚI NHẤT: {logs[0]?.action}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClearLogs();
            }}
            className="text-[11px] text-[#E5E2D9] hover:text-[#F8F6F0] p-1 transition-colors uppercase font-bold"
            title="Xóa nhật ký"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-[#F8F6F0]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#F8F6F0]" />
          )}
        </div>
      </div>

      {/* Expanded Logs */}
      {isExpanded && (
        <div className="p-5 space-y-4 max-h-96 overflow-y-auto text-xs font-mono bg-[#F8F6F0]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Log Items List */}
            <div className="space-y-2 overflow-y-auto max-h-64 pr-1">
              {logs.map((log) => {
                const isSelected = selectedLog?.id === log.id;
                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`p-3 border text-[11px] cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#E5E2D9] border-[#2D2D2D] text-[#2D2D2D] font-bold'
                        : 'bg-[#F8F6F0] border-[#E0DDD5] text-stone-700 hover:bg-[#E5E2D9]/50 hover:border-[#2D2D2D]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {log.status === 'success' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#2D2D2D]" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-[#2D2D2D]" />
                        )}
                        <strong className="text-[#2D2D2D] font-serif">{log.action}</strong>
                      </div>
                      <span className="text-[10px] text-stone-500">{log.timestamp}</span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-stone-600 mt-1">
                      <span>CHẾ ĐỘ: {log.mode === 'real' ? 'API THẬT' : 'GIẢ LẬP'}</span>
                      <span className="truncate max-w-[150px]">{log.response?.message || 'Done'}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Log Detail Viewer */}
            <div className="bg-[#2D2D2D] text-[#F8F6F0] p-4 border border-[#2D2D2D] overflow-x-auto text-[11px]">
              {selectedLog ? (
                <div className="space-y-3">
                  <div>
                    <span className="text-[#E5E2D9] font-bold block mb-1 font-serif uppercase tracking-wider">REQ PAYLOAD:</span>
                    <pre className="text-[#F8F6F0] bg-[#1A1A1A] p-2.5 border border-[#E0DDD5]/20 overflow-x-auto">
                      {JSON.stringify(selectedLog.payload, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <span className="text-[#E5E2D9] font-bold block mb-1 font-serif uppercase tracking-wider">RES JSON:</span>
                    <pre className="text-[#F8F6F0] bg-[#1A1A1A] p-2.5 border border-[#E0DDD5]/20 overflow-x-auto">
                      {JSON.stringify(selectedLog.response, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-[#E5E2D9] italic py-8 text-center font-mono">
                  Nhấn vào một yêu cầu bên trái để xem chi tiết JSON Request / Response
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

