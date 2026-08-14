/**
 * Utility client-side helper to normalize THÀNH TÍCH (Performance) values
 * using either the Server-side Gemini AI endpoint or a smart local heuristic fallback.
 */

export interface AiNormalizeBatchResponse {
  success: boolean;
  count: number;
  results: string[];
}

/**
 * Heuristic fallback matching the exact rules:
 * 1. Nếu ô trống, thiếu dữ liệu, null, hoặc không có thông tin thời gian -> Trả về chữ: D
 * 2. Quy tắc "DƯỚI" (-1 phút) và "TRÊN" / "HƠN" (+1 phút):
 *    - Dưới 2h30 phút -> 02:29
 *    - Dưới 1 giờ -> 00:59
 *    - Dưới 10 phút -> 00:09
 *    - Trên 1 giờ -> 01:01
 *    - Trên 2h30 -> 02:31
 *    - Trên 45 phút -> 00:46
 * 3. Xác định giá trị Thời gian cơ sở (Phút và Giờ):
 *    - Mặc định các số biểu thị phút nếu không chỉ rõ giờ (VD: "10phút", "10 phút", "10'", "10 p", "10p", "10" -> "00:10")
 *    - Nếu dạng "10:00" -> "00:10" (10 phút 00 giây)
 *    - Nếu có chỉ rõ giờ (VD: "1h30p", "1 giờ 15 phút", "01:30:00") -> "01:30", "01:15", "01:30"
 * 4. Định dạng đầu ra: hh:mm hoặc D
 */
export function normalizePerformanceLocal(rawInput: any): string {
  if (rawInput === null || rawInput === undefined) return 'D';

  if (rawInput instanceof Date && !isNaN(rawInput.getTime())) {
    const h = rawInput.getHours();
    const m = rawInput.getMinutes();
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  let rawStr = String(rawInput).trim();
  if (!rawStr || rawStr === '' || rawStr.toUpperCase() === 'D' || rawStr === '-' || rawStr === 'null' || rawStr === 'undefined') {
    return 'D';
  }

  // Nhận diện tiền tố Dưới (<) hoặc Trên / Hơn (>)
  let minuteOffset = 0;
  const isUnder = /^(?:dưới|<|ít hơn|duoi)\s+/i.test(rawStr) || /^<\s*\d+/i.test(rawStr);
  const isOver = /^(?:trên|>|hơn|tren|hon)\s+/i.test(rawStr) || /^>\s*\d+/i.test(rawStr);

  if (isUnder) {
    minuteOffset = -1;
    rawStr = rawStr.replace(/^(?:dưới|<|ít hơn|duoi)\s*/i, '').trim();
  } else if (isOver) {
    minuteOffset = 1;
    rawStr = rawStr.replace(/^(?:trên|>|hơn|tren|hon)\s*/i, '').trim();
  }

  const formatWithOffset = (totalMins: number): string => {
    let adjusted = totalMins + minuteOffset;
    if (adjusted < 0) adjusted = 0;
    const hours = Math.floor(adjusted / 60) % 24;
    const mins = adjusted % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  // 1. Dạng AM / PM (ví dụ: "12:45 AM" -> "00:45", "1:15 PM" -> "13:15")
  const ampmMatch = rawStr.match(/^(\d{1,2}):(\d{1,2})(?::\d{1,2})?\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = parseInt(ampmMatch[2], 10);
    const period = ampmMatch[3].toUpperCase();
    if (period === 'AM' && hours === 12) hours = 0;
    else if (period === 'PM' && hours < 12) hours += 12;
    return formatWithOffset(hours * 60 + minutes);
  }

  // 2. Dạng 3 thành phần hh:mm:ss (ví dụ "01:30:00", "00:10:00", "02:15:30")
  const hmsMatch = rawStr.match(/^(\d{1,2}):(\d{1,2}):(\d{1,2})$/);
  if (hmsMatch) {
    const h = parseInt(hmsMatch[1], 10);
    const m = parseInt(hmsMatch[2], 10);
    if (h >= 0 && h < 24 && m >= 0 && m < 60) {
      return formatWithOffset(h * 60 + m);
    }
  }

  // 3. Dạng "10:00" trong thể thao chạy/bơi: "10:00" là 10 phút 00 giây -> 00:10
  const mmSsMatch = rawStr.match(/^(\d{1,2}):00$/);
  if (mmSsMatch) {
    const mins = parseInt(mmSsMatch[1], 10);
    if (mins >= 0 && mins < 60) {
      return formatWithOffset(mins);
    }
  }

  // 4. Dạng chữ chỉ rõ giờ và phút: "2h30 phút", "1h30p", "1 giờ 15 phút", "1 giờ", "1h 30m", "1 tiếng 30 phút"
  const hourMinMatch = rawStr.match(/(?:(\d+)\s*(?:h|giờ|tiếng|g))?\s*(?:(\d+)\s*(?:p|phút|m|'))?/i);
  if (hourMinMatch && (hourMinMatch[1] || hourMinMatch[2])) {
    const hours = hourMinMatch[1] ? parseInt(hourMinMatch[1], 10) : 0;
    const minutes = hourMinMatch[2] ? parseInt(hourMinMatch[2], 10) : 0;
    if (hours < 24 && minutes < 60) {
      return formatWithOffset(hours * 60 + minutes);
    }
  }

  // Dạng mm:ss khác (ví dụ "01:30" hoặc "1:45")
  const twoNumMatch = rawStr.match(/^(\d{1,2}):(\d{1,2})$/);
  if (twoNumMatch) {
    const num1 = parseInt(twoNumMatch[1], 10);
    const num2 = parseInt(twoNumMatch[2], 10);
    if (num1 >= 0 && num1 < 24 && num2 >= 0 && num2 < 60) {
      return formatWithOffset(num1 * 60 + num2);
    }
  }

  // 5. Dạng thuần số hoặc chỉ có phút: "10phút", "10 phút", "10'", "10 p", "10p", "10"
  const minOnlyMatch = rawStr.match(/^(\d+)(?:\s*(?:phút|p|'|m))?$/i);
  if (minOnlyMatch) {
    const totalMinutes = parseInt(minOnlyMatch[1], 10);
    if (!isNaN(totalMinutes)) {
      return formatWithOffset(totalMinutes);
    }
  }

  // 6. Số fraction Excel (ví dụ: 0.03125 = 45 phút)
  const numVal = Number(rawStr);
  if (!isNaN(numVal) && numVal > 0 && numVal < 1) {
    const totalMinutes = Math.round(numVal * 24 * 60);
    return formatWithOffset(totalMinutes);
  }

  return 'D';
}

/**
 * Gọi API Gemini AI từ Server để chuẩn hóa hàng loạt cột THÀNH TÍCH
 */
export async function normalizePerformancesWithAi(
  items: string[]
): Promise<string[]> {
  try {
    const response = await fetch('/api/ai/normalize-performance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items }),
    });

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    const data: AiNormalizeBatchResponse = await response.json();
    if (data && Array.isArray(data.results) && data.results.length === items.length) {
      return data.results;
    }
  } catch (error) {
    console.warn('AI API normalization failed or unreachable, falling back to local engine:', error);
  }

  // Fallback: Sử dụng công cụ chuẩn hóa cục bộ
  return items.map((it) => normalizePerformanceLocal(it));
}

/**
 * Gọi API Gemini AI để chuẩn hóa 1 giá trị thành tích đơn lẻ
 */
export async function normalizeSinglePerformanceWithAi(
  value: string
): Promise<string> {
  try {
    const response = await fetch('/api/ai/normalize-single', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value }),
    });

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    const data = await response.json();
    if (data && data.normalized) {
      return data.normalized;
    }
  } catch (error) {
    console.warn('AI single normalization failed, falling back to local engine:', error);
  }

  return normalizePerformanceLocal(value);
}
