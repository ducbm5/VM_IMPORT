import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Code,
  PlayCircle,
  Info,
  Folder,
  Lock,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { GAS_CODE_GS, SETUP_STEPS } from '../constants/gasScriptCode';

interface GasGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  gasUrl: string;
  onSaveGasUrl: (url: string) => void;
  folderId: string;
  onSaveFolderId: (id: string) => void;
  passSheetId?: string;
  onSavePassSheetId?: (id: string) => void;
  isMockMode?: boolean;
}

export const GasGuideModal: React.FC<GasGuideModalProps> = ({
  isOpen,
  onClose,
  gasUrl,
  onSaveGasUrl,
  folderId,
  onSaveFolderId,
}) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passError, setPassError] = useState('');

  const [copied, setCopied] = useState(false);
  const [inputUrl, setInputUrl] = useState(gasUrl);
  const [savedUrlSuccess, setSavedUrlSuccess] = useState(false);

  const [inputFolderId, setInputFolderId] = useState(folderId);
  const [savedFolderSuccess, setSavedFolderSuccess] = useState(false);

  useEffect(() => {
    setInputUrl(gasUrl);
  }, [gasUrl, isOpen]);

  useEffect(() => {
    setInputFolderId(folderId);
  }, [folderId, isOpen]);

  // Reset password state when closed
  useEffect(() => {
    if (!isOpen) {
      setPasswordInput('');
      setPassError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.trim() === '9155') {
      setIsUnlocked(true);
      setPassError('');
    } else {
      setPassError('Mật khẩu không chính xác!');
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GAS_CODE_GS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveGasUrl(inputUrl.trim());
    setSavedUrlSuccess(true);
    setTimeout(() => {
      setSavedUrlSuccess(false);
    }, 1500);
  };

  const handleSaveFolderId = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveFolderId(inputFolderId.trim());
    setSavedFolderSuccess(true);
    setTimeout(() => {
      setSavedFolderSuccess(false);
    }, 1500);
  };

  // 🔒 Password Protection Prompt for Admin (/admin)
  if (!isUnlocked) {
    return (
      <div className="fixed inset-0 z-50 bg-[#2D2D2D]/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
        <div className="bg-[#F8F6F0] border border-[#2D2D2D] max-w-md w-full p-6 space-y-5 font-mono relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 text-[#2D2D2D] hover:bg-[#2D2D2D] hover:text-[#F8F6F0] transition-colors cursor-pointer border border-[#2D2D2D]"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 border-b border-[#2D2D2D] pb-3">
            <div className="p-2.5 bg-[#2D2D2D] text-[#F8F6F0] border border-[#2D2D2D]">
              <Lock className="w-5 h-5 text-[#F8F6F0]" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#2D2D2D] uppercase tracking-tight">
                XÁC THỰC ADMIN (/admin)
              </h3>
              <p className="text-[11px] text-stone-600">
                Đăng nhập trang quản trị và cấu hình ứng dụng
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#2D2D2D] uppercase tracking-wider mb-1 flex items-center gap-1.5 font-serif">
                <KeyRound className="w-3.5 h-3.5 text-[#2D2D2D]" />
                <span>NHẬP MẬT KHẨU QUẢN TRỊ *</span>
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPassError('');
                }}
                placeholder="Nhập mật khẩu quản trị..."
                autoFocus
                required
                className="w-full px-3 py-2.5 bg-[#F8F6F0] border border-[#2D2D2D] text-sm font-mono text-[#2D2D2D] placeholder-stone-500 focus:outline-none focus:bg-[#E5E2D9]"
              />
            </div>

            {passError && (
              <div className="text-xs font-bold text-[#2D2D2D] bg-[#E5E2D9] p-2.5 border border-[#2D2D2D] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#2D2D2D] flex-shrink-0" />
                <span>{passError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-[#2D2D2D] hover:bg-[#E5E2D9] hover:text-[#2D2D2D] text-[#F8F6F0] font-mono font-bold text-xs uppercase tracking-widest border border-[#2D2D2D] transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>XÁC NHẬN VÀO CẤU HÌNH</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Unlocked View
  return (
    <div className="fixed inset-0 z-50 bg-[#2D2D2D]/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-[#F8F6F0] border border-[#2D2D2D] max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col font-mono">
        {/* Modal Header */}
        <div className="bg-[#2D2D2D] text-[#F8F6F0] p-4 flex items-center justify-between border-b border-[#2D2D2D]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#F8F6F0] text-[#2D2D2D] border border-[#2D2D2D]">
              <Code className="w-5 h-5 text-[#2D2D2D]" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-[#F8F6F0]">
                CẤU HÌNH HỆ THỐNG & MÃ APPS SCRIPT (ADMIN / CẤU HÌNH)
              </h2>
              <p className="text-xs text-[#E5E2D9]">
                Quản lý Folder Drive & Web App URL
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-[#2D2D2D] text-xs">
          
          {/* Section 1: Folder ID Setup */}
          <div className="p-4 bg-[#F8F6F0] border border-[#2D2D2D] space-y-2">
            <div className="flex items-center justify-between border-b border-[#2D2D2D] pb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#2D2D2D] flex items-center gap-1.5 font-serif">
                <Folder className="w-4 h-4 text-[#2D2D2D]" />
                <span>1. THƯ MỤC LƯU FILE TRÊN GOOGLE DRIVE (FOLDER ID)</span>
              </label>
              <a
                href={`https://drive.google.com/drive/folders/${inputFolderId.trim() || '1Kjc3UYkNkYaHJQ6JrLZX15QPPWfZEaLZ'}`}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-[#2D2D2D] font-bold hover:underline flex items-center gap-1 uppercase tracking-wider"
              >
                <span>Mở Folder Drive</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <form onSubmit={handleSaveFolderId} className="space-y-2 pt-1">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputFolderId}
                  onChange={(e) => setInputFolderId(e.target.value)}
                  placeholder="1Kjc3UYkNkYaHJQ6JrLZX15QPPWfZEaLZ"
                  className="flex-1 px-3 py-2 bg-[#F8F6F0] border border-[#2D2D2D] text-xs font-mono text-[#2D2D2D] focus:outline-none focus:bg-[#E5E2D9]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2D2D2D] hover:bg-[#E5E2D9] hover:text-[#2D2D2D] text-[#F8F6F0] font-bold text-xs uppercase tracking-wider border border-[#2D2D2D] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {savedFolderSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>ĐÃ LƯU!</span>
                    </>
                  ) : (
                    <span>LƯU FOLDER ID</span>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-stone-600">
                File mới khởi tạo sẽ được tự động chuyển vào thư mục Google Drive này.
              </p>
            </form>
          </div>

          {/* Section 2: Web App URL Input */}
          <div className="p-4 bg-[#F8F6F0] border border-[#2D2D2D] space-y-2">
            <div className="flex items-center justify-between border-b border-[#2D2D2D] pb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#2D2D2D] flex items-center gap-1.5 font-serif">
                <PlayCircle className="w-4 h-4 text-[#2D2D2D]" />
                <span>2. URL GOOGLE APPS SCRIPT WEB APP</span>
              </label>
              <a
                href="https://script.google.com"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-[#2D2D2D] font-bold hover:underline flex items-center gap-1 uppercase tracking-wider"
              >
                <span>Mở script.google.com</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <form onSubmit={handleSaveUrl} className="space-y-2 pt-1">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                  className="flex-1 px-3 py-2 bg-[#F8F6F0] border border-[#2D2D2D] text-xs font-mono text-[#2D2D2D] focus:outline-none focus:bg-[#E5E2D9]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2D2D2D] hover:bg-[#E5E2D9] hover:text-[#2D2D2D] text-[#F8F6F0] font-bold text-xs uppercase tracking-wider border border-[#2D2D2D] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {savedUrlSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>ĐÃ LƯU!</span>
                    </>
                  ) : (
                    <span>LƯU URL WEB APP</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Section 3: Deployment Guide */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-[#2D2D2D] uppercase tracking-wider flex items-center gap-2 font-serif">
              <Info className="w-4 h-4 text-[#2D2D2D]" />
              <span>HƯỚNG DẪN CẤU HÌNH TRONG GOOGLE APPS SCRIPT</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {SETUP_STEPS.map((s) => (
                <div key={s.step} className="p-3 bg-[#F8F6F0] border border-[#2D2D2D] flex items-start gap-2.5">
                  <span className="w-5 h-5 bg-[#2D2D2D] text-[#F8F6F0] text-xs font-bold flex items-center justify-center flex-shrink-0 font-mono">
                    {s.step}
                  </span>
                  <div>
                    <h4 className="font-bold text-[#2D2D2D] text-xs uppercase font-serif">{s.title}</h4>
                    <p className="text-[11px] text-stone-600 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Apps Script Code Viewer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#2D2D2D] uppercase tracking-wider flex items-center gap-2 font-serif">
                <Code className="w-4 h-4 text-[#2D2D2D]" />
                <span>MÃ SERVER-SIDE CODE.GS</span>
              </h3>

              <button
                onClick={handleCopyCode}
                className="px-3 py-1.5 bg-[#2D2D2D] hover:bg-[#E5E2D9] hover:text-[#2D2D2D] text-[#F8F6F0] text-xs font-bold flex items-center gap-1.5 transition-colors border border-[#2D2D2D] cursor-pointer uppercase tracking-wider"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#F8F6F0]" />
                    <span className="text-[#F8F6F0]">ĐÃ SAO CHÉP MÃ!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>SAO CHÉP MÃ CODE.GS</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative border border-[#2D2D2D] bg-[#2D2D2D] font-mono text-xs">
              <pre className="p-4 text-[#F8F6F0] overflow-x-auto max-h-80 leading-relaxed select-all">
                <code>{GAS_CODE_GS}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#2D2D2D] border-t border-[#2D2D2D] flex justify-between items-center font-mono">
          <button
            onClick={() => setIsUnlocked(false)}
            className="px-3.5 py-2 bg-[#E5E2D9] hover:bg-[#F8F6F0] text-[#2D2D2D] font-bold text-xs uppercase tracking-wider border border-[#2D2D2D] cursor-pointer flex items-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5 text-[#2D2D2D]" />
            <span>Khóa Admin</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#F8F6F0] hover:bg-[#E5E2D9] text-[#2D2D2D] font-bold text-xs uppercase tracking-wider border border-[#2D2D2D] transition-colors cursor-pointer"
          >
            ĐÓNG MÀN HÌNH CẤU HÌNH
          </button>
        </div>
      </div>
    </div>
  );
};
