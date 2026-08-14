import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CreateEventForm } from './components/CreateEventForm';
import { RegisterForm } from './components/RegisterForm';
import { EventHistoryModal } from './components/EventHistoryModal';
import { GasGuideModal } from './components/GasGuideModal';
import { callGasWebScript, mockGasCall } from './utils/gasApi';
import { EventItem, BatchRegistrationResult, ApiLog, ParticipantRecord } from './types';
import { CheckCircle, Lock, ArrowRight, FileSpreadsheet } from 'lucide-react';

const STORAGE_KEYS = {
  GAS_URL: 'gas_event_connector_url',
  MOCK_MODE: 'gas_event_connector_mock',
  EVENTS: 'gas_event_connector_events',
  FOLDER_ID: 'gas_event_connector_folder_id',
  PASS_SHEET_ID: 'gas_event_connector_pass_sheet_id',
};

export default function App() {
  const [gasUrl, setGasUrl] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.GAS_URL) || (import.meta.env.VITE_GAS_WEB_APP_URL as string) || '';
  });

  const [folderId, setFolderId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.FOLDER_ID) || (import.meta.env.VITE_GOOGLE_FOLDER_ID as string) || '1Kjc3UYkNkYaHJQ6JrLZX15QPPWfZEaLZ';
  });

  const [passSheetId, setPassSheetId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.PASS_SHEET_ID) || '';
  });

  const [isMockMode, setIsMockMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MOCK_MODE);
    if (saved !== null) return saved === 'true';
    const effectiveGasUrl = localStorage.getItem(STORAGE_KEYS.GAS_URL) || (import.meta.env.VITE_GAS_WEB_APP_URL as string) || '';
    return !effectiveGasUrl;
  });

  const [events, setEvents] = useState<EventItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EVENTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(() => {
    return events.length > 0 ? events[0] : null;
  });

  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Active step screen state: 1 or 2
  const [activeStep, setActiveStep] = useState<1 | 2>(1);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GAS_URL, gasUrl);
  }, [gasUrl]);

  // Auto-open Admin/Guide modal if URL path is /admin or hash is #admin
  useEffect(() => {
    const handleRoute = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/admin' || path.endsWith('/admin') || hash === '#admin' || hash === '#/admin') {
        setIsGuideOpen(true);
      }
    };

    handleRoute();
    window.addEventListener('popstate', handleRoute);
    window.addEventListener('hashchange', handleRoute);

    return () => {
      window.removeEventListener('popstate', handleRoute);
      window.removeEventListener('hashchange', handleRoute);
    };
  }, []);

  const handleOpenAdmin = () => {
    if (window.location.pathname !== '/admin') {
      window.history.pushState({}, '', '/admin');
    }
    setIsGuideOpen(true);
  };

  const handleCloseAdmin = () => {
    setIsGuideOpen(false);
    if (window.location.pathname === '/admin' || window.location.pathname.endsWith('/admin')) {
      window.history.pushState({}, '', '/');
    } else if (window.location.hash === '#admin' || window.location.hash === '#/admin') {
      window.location.hash = '';
    }
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FOLDER_ID, folderId);
  }, [folderId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PASS_SHEET_ID, passSheetId);
  }, [passSheetId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MOCK_MODE, String(isMockMode));
  }, [isMockMode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  }, [events]);

  const addLog = (logItem: Omit<ApiLog, 'id' | 'timestamp'>) => {
    const newLog: ApiLog = {
      ...logItem,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      timestamp: new Date().toLocaleTimeString('vi-VN'),
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  // Action 1: CREATE_EVENT (Tên File = Người yêu cầu, Lưu vào Folder ID chỉ định)
  const handleCreateEvent = async (data: { requester: string; folderId?: string }): Promise<EventItem | null> => {
    const payload = {
      action: 'CREATE_EVENT',
      requester: data.requester,
      nguoiYeuCau: data.requester,
      folderId: data.folderId || '1Kjc3UYkNkYaHJQ6JrLZX15QPPWfZEaLZ',
    };

    let response;
    const mode = isMockMode ? 'mock' : 'real';

    try {
      if (isMockMode) {
        response = await mockGasCall(payload);
      } else {
        response = await callGasWebScript(gasUrl, payload);
      }

      if (!response.success) {
        addLog({
          action: 'CREATE_EVENT',
          payload,
          response,
          status: 'error',
          mode,
        });
        throw new Error(response.message || 'Lỗi từ Google Apps Script khi tạo File Sheet.');
      }

      const eventName = response.eventName || data.requester;
      const newEvent: EventItem = {
        id: Date.now().toString(),
        eventName: eventName,
        requester: data.requester,
        spreadsheetId: response.spreadsheetId || '',
        spreadsheetUrl: response.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${response.spreadsheetId}`,
        createdAt: new Date().toLocaleString('vi-VN'),
      };

      setEvents((prev) => [newEvent, ...prev]);
      setSelectedEvent(newEvent);

      addLog({
        action: 'CREATE_EVENT',
        payload,
        response,
        status: 'success',
        mode,
      });

      // Automatically advance to Step 2 upon creation success
      setActiveStep(2);

      return newEvent;
    } catch (err: any) {
      addLog({
        action: 'CREATE_EVENT',
        payload,
        response: { error: err.message },
        status: 'error',
        mode,
      });
      throw err;
    }
  };

  // Action 2: SUBMIT_FORM (Batch import 18 cột từ File Excel)
  const handleSubmitBatch = async (data: {
    participants: ParticipantRecord[];
    spreadsheetId: string;
    requester?: string;
  }): Promise<BatchRegistrationResult | null> => {
    const payload = {
      action: 'SUBMIT_FORM',
      spreadsheetId: data.spreadsheetId,
      participants: data.participants,
      requester: data.requester || '',
      nguoiYeuCau: data.requester || '',
    };

    let response;
    const mode = isMockMode ? 'mock' : 'real';

    try {
      if (isMockMode) {
        response = await mockGasCall(payload);
      } else {
        response = await callGasWebScript(gasUrl, payload);
      }

      if (!response.success) {
        addLog({
          action: 'SUBMIT_FORM',
          payload,
          response,
          status: 'error',
          mode,
        });
        throw new Error(response.message || 'Lỗi khi gửi dữ liệu Excel.');
      }

      const count = response.insertedCount || data.participants.length;

      const result: BatchRegistrationResult = {
        total: data.participants.length,
        successCount: count,
        errorCount: 0,
        spreadsheetId: data.spreadsheetId,
        timestamp: response.timestamp || new Date().toLocaleString('vi-VN'),
      };

      addLog({
        action: 'SUBMIT_FORM',
        payload,
        response,
        status: 'success',
        mode,
      });

      return result;
    } catch (err: any) {
      addLog({
        action: 'SUBMIT_FORM',
        payload,
        response: { error: err.message },
        status: 'error',
        mode,
      });
      throw err;
    }
  };

  const isStep2Unlocked = selectedEvent !== null || events.length > 0;

  return (
    <div className="min-h-screen bg-[#F8F6F0] text-[#2D2D2D] flex flex-col font-sans antialiased">
      {/* Header */}
      <Header
        gasUrl={gasUrl}
        isMockMode={isMockMode}
        onToggleMockMode={(mock) => setIsMockMode(mock)}
        onOpenSettings={handleOpenAdmin}
        onOpenCodeGuide={handleOpenAdmin}
        eventsCount={events.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Step Progress Navigation Bar */}
        <div className="bg-[#2D2D2D] text-[#F8F6F0] border border-[#2D2D2D] font-mono">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#E0DDD5]/20">
            {/* Step 1 Button */}
            <button
              type="button"
              onClick={() => setActiveStep(1)}
              className={`p-4 text-left transition-colors flex items-center justify-between cursor-pointer ${
                activeStep === 1 ? 'bg-[#F8F6F0] text-[#2D2D2D]' : 'bg-[#2D2D2D] text-[#F8F6F0] hover:bg-[#1A1A1A]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`px-2.5 py-1 text-xs font-bold border ${
                    activeStep === 1
                      ? 'bg-[#2D2D2D] text-[#F8F6F0] border-[#2D2D2D]'
                      : 'bg-[#F8F6F0] text-[#2D2D2D] border-[#F8F6F0]'
                  }`}
                >
                  01
                </span>
                <div>
                  <div className="text-xs font-serif font-bold uppercase tracking-wider">
                    BƯỚC 1: TẠO FILE GOOGLE SHEET MỚI
                  </div>
                  <div className="text-[10px] opacity-80 mt-0.5">
                    Nhập Tên Giải - Tên Người Yêu Cầu để sinh Sheet ID
                  </div>
                </div>
              </div>

              {selectedEvent && (
                <CheckCircle className={`w-4 h-4 ${activeStep === 1 ? 'text-[#2D2D2D]' : 'text-[#F8F6F0]'}`} />
              )}
            </button>

            {/* Step 2 Button */}
            <button
              type="button"
              onClick={() => {
                if (isStep2Unlocked) {
                  setActiveStep(2);
                }
              }}
              disabled={!isStep2Unlocked}
              className={`p-4 text-left transition-colors flex items-center justify-between ${
                activeStep === 2
                  ? 'bg-[#F8F6F0] text-[#2D2D2D]'
                  : isStep2Unlocked
                  ? 'bg-[#2D2D2D] text-[#F8F6F0] hover:bg-[#1A1A1A] cursor-pointer'
                  : 'bg-[#1A1A1A] text-stone-500 cursor-not-allowed opacity-70'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`px-2.5 py-1 text-xs font-bold border ${
                    activeStep === 2
                      ? 'bg-[#2D2D2D] text-[#F8F6F0] border-[#2D2D2D]'
                      : isStep2Unlocked
                      ? 'bg-[#F8F6F0] text-[#2D2D2D] border-[#F8F6F0]'
                      : 'bg-stone-700 text-stone-400 border-stone-600'
                  }`}
                >
                  02
                </span>
                <div>
                  <div className="text-xs font-serif font-bold uppercase tracking-wider flex items-center gap-2">
                    <span>BƯỚC 2: IMPORT FILE EXCEL (18 CỘT)</span>
                    {!isStep2Unlocked && <Lock className="w-3.5 h-3.5 text-stone-500" />}
                  </div>
                  <div className="text-[10px] opacity-80 mt-0.5">
                    {isStep2Unlocked
                      ? `Đang chọn: ${selectedEvent?.eventName || '1 Sheet'}`
                      : '🔒 Cần hoàn thành Bước 1 trước'}
                  </div>
                </div>
              </div>

              {isStep2Unlocked ? (
                <ArrowRight className={`w-4 h-4 ${activeStep === 2 ? 'text-[#2D2D2D]' : 'text-[#F8F6F0]'}`} />
              ) : (
                <Lock className="w-4 h-4 text-stone-500" />
              )}
            </button>
          </div>
        </div>

        {/* Screen 1: Step 1 Only */}
        {activeStep === 1 && (
          <div className="space-y-6">
            <CreateEventForm
              onSubmit={handleCreateEvent}
              isMockMode={isMockMode}
              folderId={folderId}
              onSelectForRegistration={(eventItem) => setSelectedEvent(eventItem)}
              onGoToStep2={() => setActiveStep(2)}
              selectedEvent={selectedEvent}
            />
          </div>
        )}

        {/* Screen 2: Step 2 Only */}
        {activeStep === 2 && (
          <div className="space-y-6">
            <RegisterForm
              selectedEvent={selectedEvent}
              eventsList={events}
              onSelectEvent={(ev) => setSelectedEvent(ev)}
              onSubmitBatch={handleSubmitBatch}
              isMockMode={isMockMode}
              onGoToStep1={() => setActiveStep(1)}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#E5E2D9] border-t border-[#2D2D2D] py-3 text-center text-xs text-[#2D2D2D] font-mono mt-auto">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-center">
          <span>VM Validate Form v2.0</span>
        </div>
      </footer>

      {/* History Modal */}
      <EventHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        events={events}
        selectedEventId={selectedEvent?.id || null}
        onSelectEvent={(ev) => {
          setSelectedEvent(ev);
          setActiveStep(2);
        }}
        onClearHistory={() => {
          setEvents([]);
          setSelectedEvent(null);
        }}
      />

      {/* Modal Guide & Settings */}
      <GasGuideModal
        isOpen={isGuideOpen}
        onClose={handleCloseAdmin}
        gasUrl={gasUrl}
        onSaveGasUrl={(url) => {
          setGasUrl(url);
          if (url) setIsMockMode(false);
        }}
        folderId={folderId}
        onSaveFolderId={(id) => setFolderId(id)}
        passSheetId={passSheetId}
        onSavePassSheetId={(id) => setPassSheetId(id)}
        isMockMode={isMockMode}
      />
    </div>
  );
}

