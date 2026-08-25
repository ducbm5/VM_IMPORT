import { GasApiResponse } from '../types';

/**
 * Gọi Google Apps Script Web App API:
 * 1. Ưu tiên gọi qua backend proxy `/api/gas-proxy` để tránh 100% các lỗi xung đột đa tài khoản Google (Multi-Account Google Login), lỗi Cookie CORS và Cache của trình duyệt.
 * 2. Fallback gọi trực tiếp từ client nhưng bắt buộc `credentials: 'omit'` (không gửi cookie tài khoản) và `cache: 'no-store'` (không bị dính cache).
 */
export async function callGasWebScript(
  gasUrl: string,
  payload: Record<string, any>
): Promise<GasApiResponse> {
  if (!gasUrl || !gasUrl.trim()) {
    throw new Error('Chưa cấu hình Google Apps Script Web App URL. Vui lòng nhập URL hoặc bật chế độ Giả lập (Mock Mode).');
  }

  const cleanUrl = gasUrl.trim();

  // Ưu tiên 1: Chuyển tiếp qua Backend Proxy (Server-side Node.js không có cookie trình duyệt, không bị redirect multi-login)
  try {
    const proxyResponse = await fetch('/api/gas-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gasUrl: cleanUrl,
        payload: payload,
      }),
    });

    if (proxyResponse.ok) {
      const data: GasApiResponse = await proxyResponse.json();
      return data;
    }
  } catch (proxyError) {
    console.warn('Server-side GAS proxy unavailable, falling back to direct client fetch:', proxyError);
  }

  // Ưu tiên 2: Gọi trực tiếp từ Client với credentials: 'omit' & cache: 'no-store'
  try {
    const response = await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      credentials: 'omit', // Bắt buộc 'omit' để trình duyệt không gửi cookie Google session, tránh bị Google redirect sang AccountChooser
      cache: 'no-store',   // Bắt buộc 'no-store' để không bị dính cache trình duyệt giữa các máy/phiên làm việc
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Lỗi kết nối HTTP ${response.status}: ${response.statusText}`);
    }

    const data: GasApiResponse = await response.json();
    return data;
  } catch (error: any) {
    if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
      throw new Error(
        'Không thể kết nối đến Google Apps Script. Vui lòng kiểm tra lại URL triển khai và đảm bảo đã chọn "Ai có quyền truy cập: Bất kỳ ai" (Anyone).'
      );
    }
    throw error;
  }
}

/**
 * Hàm xác thực mật khẩu từ Google Sheet thông qua Google Apps Script
 */
export async function verifyPasswordApi(
  gasUrl: string,
  password: string,
  passwordSpreadsheetId: string,
  isMockMode: boolean
): Promise<GasApiResponse> {
  const payload = {
    action: 'VERIFY_PASSWORD',
    password: password,
    passwordSpreadsheetId: passwordSpreadsheetId,
    passSheetId: passwordSpreadsheetId,
  };

  if (isMockMode || !gasUrl || !gasUrl.trim()) {
    return mockGasCall(payload);
  }

  return callGasWebScript(gasUrl, payload);
}

/**
 * Hàm Giả lập (Mock API) để kiểm tra giao diện khi chưa cấu hình GAS Web App
 */
export async function mockGasCall(
  payload: Record<string, any>
): Promise<GasApiResponse> {
  // Giả lập độ trễ mạng 600ms
  await new Promise((resolve) => setTimeout(resolve, 600));

  const action = payload.action;

  if (action === 'VERIFY_PASSWORD') {
    const pass = (payload.password || '').toString().trim();
    const passSheetId = (payload.passwordSpreadsheetId || '').toString().trim();

    if (!pass) {
      return {
        success: false,
        verified: false,
        message: '[MOCK ENGINE] Vui lòng nhập mật khẩu để kiểm tra!',
      };
    }

    return {
      success: true,
      verified: true,
      message: passSheetId
        ? `[MOCK ENGINE] Đã xác thực thành công mật khẩu từ Google Sheet (ID: ${passSheetId.substring(0, 8)}...)!`
        : '[MOCK ENGINE] Xác thực thành công ở chế độ Giả lập!',
    };
  }

  if (action === 'CREATE_EVENT') {
    const requester = payload.requester || payload.nguoiYeuCau || 'Giải Chạy Tiêu Chuẩn 2026';
    const eventName = requester; // Lấy chính xác Tên file làm tên Event
    
    const randomId = '1' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 10);
    const mockUrl = `https://docs.google.com/spreadsheets/d/${randomId}/edit#gid=0`;

    return {
      success: true,
      message: '[MOCK ENGINE] Đã tạo File Google Sheet giả lập thành công!',
      spreadsheetId: randomId,
      spreadsheetUrl: mockUrl,
      eventName: eventName,
      requester: requester,
    };
  }

  if (action === 'SUBMIT_FORM') {
    const spreadsheetId = payload.spreadsheetId;
    if (!spreadsheetId) {
      return {
        success: false,
        message: '[MOCK ENGINE] Lỗi: Thiếu Spreadsheet ID!',
      };
    }

    const participants = payload.participants || [];
    const insertedCount = participants.length > 0 ? participants.length : 1;

    return {
      success: true,
      message: `[MOCK ENGINE] Đã import ${insertedCount} dòng dữ liệu (18 cột) từ File Excel vào Google Sheet (ID: ${spreadsheetId.substring(0, 8)}...) thành công!`,
      spreadsheetId: spreadsheetId,
      insertedCount: insertedCount,
      timestamp: new Date().toLocaleString('vi-VN'),
    };
  }

  return {
    success: false,
    message: 'Action không hợp lệ',
  };
}
