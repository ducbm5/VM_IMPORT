import { ParticipantRecord } from '../types';

export interface FieldError {
  field: string;
  message: string;
}

export interface ValidationOutput {
  status: 'SUCCESS' | 'ERROR';
  data?: ParticipantRecord;
  errors?: FieldError[];
}

const ALLOWED_SIZES = ['2XS', 'XS', 'S', 'M', 'L', 'XL', '2XL'];

const ALLOWED_DISTANCES = ['5km', '10km', '21km', '42km'];

// Hàm làm sạch chuỗi: loại bỏ toàn bộ ký tự ẩn, zero-width, BOM, non-breaking space và chuẩn hóa NFC
export const cleanText = (str: any): string => {
  if (str === null || str === undefined) return '';
  return String(str)
    .normalize('NFC')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u00A0\u1680\u2000-\u200F\u2028\u2029\u202F\u205F\u3000\uFEFF\u00AD]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

// Regex hỗ trợ chữ cái tiếng Việt có dấu, ký tự Unicode và khoảng trắng (hỗ trợ cả dấu gạch nối, dấu chấm, dấu nháy)
export const isValidVietnameseName = (name: string): boolean => {
  const clean = cleanText(name);
  if (!clean) return false;
  // Cho phép tất cả chữ cái (Unicode \p{L}), dấu thanh tổ hợp (\p{M}), khoảng trắng, dấu gạch nối, dấu chấm, dấu nháy đơn
  return /^[\p{L}\p{M}\s.'-]+$/u.test(clean);
};

// Regex Tên trên BIB: Chữ cái (kể cả tiếng Việt), số, khoảng trắng, dấu gạch ngang, gạch dưới, chấm, ngoặc đơn, xuyệt, &, 2 chấm
export const isValidBibName = (bib: string): boolean => {
  const clean = cleanText(bib);
  if (!clean) return false;
  return /^[\p{L}\p{M}0-9\s._'()\/&:-]+$/u.test(clean);
};

// Regex Người liên hệ khẩn cấp: Tên người hoặc quan hệ (cho phép chữ cái, số, ngoặc đơn, gạch ngang, cộng...)
export const isValidEmergencyContactName = (name: string): boolean => {
  const clean = cleanText(name);
  if (!clean) return false;
  return /^[\p{L}\p{M}0-9\s._'()\/&:,+-]+$/u.test(clean);
};

// Regex hỗ trợ chữ cái tiếng Việt có dấu đầy đủ (dùng dự phòng)
const VIETNAMESE_NAME_REGEX =
  /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼẾỀỂưăạảấầẩẫậắằẳẵặẹẻẽếềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s]+$/;

// Regex Tên trên BIB dự phòng
const BIB_NAME_REGEX =
  /^[a-zA-Z0-9ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼẾỀỂưăạảấầẩẫậắằẳẵặẹẻẽếềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s]+$/;

// Email regex chuẩn
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Làm sạch SĐT (xóa khoảng trắng, dấu gạch ngang, dấu chấm, đuôi .0 của Excel - giữ nguyên vẹn dữ liệu)
export const cleanPhone = (phone: any): string => {
  if (phone === null || phone === undefined) return '';
  const str = String(phone).trim().replace(/\.0$/, '');
  return str.replace(/[\s\-\.\(\)]/g, '').trim();
};

// Làm sạch CCCD / CMND / Hộ chiếu (xóa khoảng trắng, dấu gạch ngang, dấu chấm, đuôi .0 của Excel - giữ nguyên vẹn dữ liệu)
export const cleanCccd = (cccd: any): string => {
  if (cccd === null || cccd === undefined) return '';
  const str = String(cccd).trim().replace(/\.0$/, '');
  return str.replace(/[\s\-\.]/g, '').trim();
};

// Hàm kiểm tra nếu dữ liệu có số 0 ở đầu thì bổ sung thêm ký tự ' để Google Sheet lưu dạng Text và không mất số 0
export const ensureLeadingQuoteIfStartsWithZero = (val: any): string => {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  if (str.startsWith('0') && !str.startsWith("'")) {
    return `'${str}`;
  }
  return str;
};

// Kiểm tra SĐT Việt Nam hợp lệ (10-11 chữ số, bắt đầu bằng 0 hoặc +84 / 84)
export const isValidPhone = (phone: string): boolean => {
  const cleaned = cleanPhone(phone);
  if (/^0\d{9,10}$/.test(cleaned)) return true;
  if (/^(\+84|84)\d{9,10}$/.test(cleaned)) return true;
  return false;
};

// Chuẩn hóa chuỗi so sánh họ tên
const normalizeName = (str: string): string => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

/**
 * Tự động đọc và quy chuẩn Ngày tháng năm sinh linh hoạt:
 * - 8/6/1993, 08/06/1993, 8-6-1993, 8.6.1993, 8 / 6 / 1993
 * - ISO Date string: 1993-06-08T00:00:00.000Z
 * - Số sê-ri Excel: 34128
 * - Năm 2 chữ số: 8/6/93 -> 08/06/1993
 * - Năm duy nhất: 1993 -> 01/01/1993
 */
function parseAndFormatDob(rawInput: any): { day: number; month: number; year: number; formattedDob: string } | null {
  if (rawInput === null || rawInput === undefined) return null;

  // 0. Nếu đã là Date object của JS
  if (rawInput instanceof Date && !isNaN(rawInput.getTime())) {
    const day = rawInput.getDate();
    const month = rawInput.getMonth() + 1;
    const year = rawInput.getFullYear();
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
      const formattedDob = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
      return { day, month, year, formattedDob };
    }
  }

  const rawStr = String(rawInput).trim();
  if (!rawStr) return null;

  // 1. Kiểm tra nếu là năm 4 chữ số (ví dụ: "1993" hoặc 1993)
  if (/^\d{4}$/.test(rawStr)) {
    const y = parseInt(rawStr, 10);
    if (y >= 1900 && y <= 2100) {
      return { day: 1, month: 1, year: y, formattedDob: `01/01/${y}` };
    }
  }

  // 2. Kiểm tra nếu là số sê-ri ngày tháng Excel (ví dụ 34187, 34187.00, 34187.5)
  const numVal = Number(rawStr);
  if (!isNaN(numVal) && numVal >= 10000 && numVal <= 60000 && !rawStr.includes('/') && !rawStr.includes('-')) {
    const excelDays = Math.floor(numVal);
    const dateMs = Math.round((excelDays - 25569) * 86400 * 1000);
    const d = new Date(dateMs);
    if (!isNaN(d.getTime())) {
      const day = d.getUTCDate();
      const month = d.getUTCMonth() + 1;
      const year = d.getUTCFullYear();
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
        const formattedDob = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
        return { day, month, year, formattedDob };
      }
    }
  }

  // 3. Chuỗi định dạng ngày (ví dụ 8/6/1993, 08/06/1993, 8-6-1993, 8.6.1993, 1993-06-08)
  let cleanStr = rawStr.split('T')[0].trim();
  cleanStr = cleanStr.replace(/\s+\d{1,2}:\d{2}(:\d{2})?.*$/, '').trim();
  cleanStr = cleanStr.replace(/[\.\-]/g, '/');
  cleanStr = cleanStr.replace(/\s*\/\s*/g, '/');

  const dmyMatch = cleanStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const ymdMatch = cleanStr.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  const dmy2Match = cleanStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);

  let day = 0;
  let month = 0;
  let year = 0;

  if (dmyMatch) {
    day = parseInt(dmyMatch[1], 10);
    month = parseInt(dmyMatch[2], 10);
    year = parseInt(dmyMatch[3], 10);
  } else if (ymdMatch) {
    year = parseInt(ymdMatch[1], 10);
    month = parseInt(ymdMatch[2], 10);
    day = parseInt(ymdMatch[3], 10);
  } else if (dmy2Match) {
    day = parseInt(dmy2Match[1], 10);
    month = parseInt(dmy2Match[2], 10);
    const shortY = parseInt(dmy2Match[3], 10);
    year = shortY < 30 ? 2000 + shortY : 1900 + shortY;
  } else {
    // Thử đọc từ JS Date
    const jsDate = new Date(rawStr);
    if (!isNaN(jsDate.getTime())) {
      day = jsDate.getDate();
      month = jsDate.getMonth() + 1;
      year = jsDate.getFullYear();
    }
  }

  if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
    const formattedDob = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    return { day, month, year, formattedDob };
  }

  return null;
}

/**
 * Tự động quy chuẩn các định dạng thời gian từ Excel / Text sang dạng hh:mm (24h) hoặc 'D'
 * - Nếu ô trống, thiếu dữ liệu, null, hoặc không có thông tin thời gian -> Trả về chữ: D
 * - Quy tắc "DƯỚI" (-1 phút) và "TRÊN" / "HƠN" (+1 phút):
 *    + Dưới 2h30 phút -> 02:29
 *    + Dưới 1 giờ -> 00:59
 *    + Trên 1 giờ -> 01:01
 *    + Trên 2h30 -> 02:31
 * - Mặc định số biểu thị phút: "10phút", "10 phút", "10'", "10 p", "10p", "10" -> "00:10"
 * - Dạng "10:00" trong thể thao -> "00:10" (10 phút 00 giây)
 * - Có chỉ rõ giờ: "1h30p", "1 giờ 15 phút", "01:30:00" -> "01:30", "01:15", "01:30"
 * - Dạng hh:mm (01:45) -> "01:45"
 */
export function parseAndFormatTime(rawInput: any): string {
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

  // 1. Chuỗi có AM / PM (ví dụ: "12:45:00 AM", "12:45 AM", "1:15:30 PM")
  const ampmMatch = rawStr.match(/^(\d{1,2}):(\d{1,2})(?::\d{1,2})?\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = parseInt(ampmMatch[2], 10);
    const period = ampmMatch[3].toUpperCase();

    if (period === 'AM') {
      if (hours === 12) hours = 0;
    } else if (period === 'PM') {
      if (hours < 12) hours += 12;
    }

    return formatWithOffset(hours * 60 + minutes);
  }

  // 2. Chuỗi dạng hh:mm:ss (ví dụ "01:30:00", "00:10:00", "02:15:30")
  const hmsMatch = rawStr.match(/^(\d{1,2}):(\d{1,2}):(\d{1,2})$/);
  if (hmsMatch) {
    const hours = parseInt(hmsMatch[1], 10);
    const minutes = parseInt(hmsMatch[2], 10);
    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      return formatWithOffset(hours * 60 + minutes);
    }
  }

  // 3. Chuỗi dạng "10:00" trong bối cảnh thể thao ngắn/trung bình -> 10 phút 00 giây = 00:10
  const mmSsMatch = rawStr.match(/^(\d{1,2}):00$/);
  if (mmSsMatch) {
    const mins = parseInt(mmSsMatch[1], 10);
    if (mins >= 0 && mins < 60) {
      return formatWithOffset(mins);
    }
  }

  // 4. Chuỗi chỉ rõ giờ và phút: "2h30 phút", "1h30p", "1 giờ 15 phút", "1 giờ", "1h 30m"
  const hourMinMatch = rawStr.match(/(?:(\d+)\s*(?:h|giờ|tiếng|g))?\s*(?:(\d+)\s*(?:p|phút|m|'))?/i);
  if (hourMinMatch && (hourMinMatch[1] || hourMinMatch[2])) {
    const hours = hourMinMatch[1] ? parseInt(hourMinMatch[1], 10) : 0;
    const minutes = hourMinMatch[2] ? parseInt(hourMinMatch[2], 10) : 0;
    if (hours < 24 && minutes < 60) {
      return formatWithOffset(hours * 60 + minutes);
    }
  }

  // Chuỗi dạng "01:30" hoặc "1:45"
  const timeMatch = rawStr.match(/^(\d{1,2}):(\d{1,2})$/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      return formatWithOffset(hours * 60 + minutes);
    }
  }

  // 5. Chuỗi số biểu thị phút: "10phút", "10 phút", "10'", "10 p", "10p", "10"
  const minOnlyMatch = rawStr.match(/^(\d+)(?:\s*(?:phút|p|'|m))?$/i);
  if (minOnlyMatch) {
    const totalMinutes = parseInt(minOnlyMatch[1], 10);
    if (!isNaN(totalMinutes)) {
      return formatWithOffset(totalMinutes);
    }
  }

  // 6. Số fraction Excel (ví dụ: 0.03125 = 45 phút, 0.072916666 = 1h45m)
  const numVal = Number(rawStr);
  if (!isNaN(numVal) && numVal > 0 && numVal < 1) {
    const totalMinutes = Math.round(numVal * 24 * 60);
    return formatWithOffset(totalMinutes);
  }

  return 'D';
}

export interface ValidationOptions {
  finisherDistances?: string[]; // Danh sách các cự ly áp dụng áo Finisher (mặc định ['21km', '42km'])
}

/**
 * Hàm kiểm tra validation cho 1 bản ghi người đăng ký theo đúng các quy tắc
 */
export function validateParticipant(
  rawRecord: ParticipantRecord,
  options?: ValidationOptions
): ValidationOutput {
  const errors: FieldError[] = [];
  const normalized: ParticipantRecord = { ...rawRecord };
  const finisherDistances = options?.finisherDistances ?? ['21km', '42km'];

  // 0. STT (Không bắt buộc)
  normalized.stt = (rawRecord.stt || '').trim();

  // 1. HỌ TÊN
  const rawHoTen = cleanText(rawRecord.hoTen || '');
  if (!rawHoTen) {
    errors.push({ field: 'HỌ TÊN', message: 'Họ tên là bắt buộc nhập.' });
  } else {
    const wordCount = rawHoTen.split(/\s+/).filter(Boolean).length;
    if (wordCount < 2) {
      errors.push({
        field: 'HỌ TÊN',
        message: 'Họ tên phải có ít nhất 2 từ (Họ + Tên).',
      });
    }
    if (!isValidVietnameseName(rawHoTen) && !VIETNAMESE_NAME_REGEX.test(rawHoTen)) {
      errors.push({
        field: 'HỌ TÊN',
        message: 'Họ tên chỉ chứa chữ cái và khoảng trắng (không chứa số hoặc ký tự đặc biệt).',
      });
    }
  }
  normalized.hoTen = rawHoTen;

  // 2. EMAIL
  const rawEmail = cleanText(rawRecord.email || '');
  if (!rawEmail) {
    errors.push({ field: 'EMAIL', message: 'Email là bắt buộc nhập.' });
  } else if (!EMAIL_REGEX.test(rawEmail)) {
    errors.push({
      field: 'EMAIL',
      message: 'Email không đúng định dạng (ví dụ: example@gmail.com).',
    });
  }
  normalized.email = rawEmail;

  // 3. TÊN TRÊN BIB
  const rawBib = cleanText(rawRecord.tenTrenBib || '');
  if (!rawBib) {
    errors.push({ field: 'TÊN TRÊN BIB', message: 'Tên trên BIB là bắt buộc nhập.' });
  } else {
    if (rawBib.length > 20) {
      errors.push({
        field: 'TÊN TRÊN BIB',
        message: `Tên trên BIB không vượt quá 20 ký tự (hiện tại ${rawBib.length} ký tự).`,
      });
    }
    if (!isValidBibName(rawBib) && !BIB_NAME_REGEX.test(rawBib)) {
      errors.push({
        field: 'TÊN TRÊN BIB',
        message: 'Tên trên BIB chỉ gồm chữ cái, số, khoảng trắng và các ký tự cơ bản (không chứa ký tự đặc biệt).',
      });
    }
  }
  normalized.tenTrenBib = rawBib;

  // 4. CỰ LY
  const rawCuLy = (rawRecord.cuLy || '').trim();
  let matchedCuLy = '';
  if (!rawCuLy) {
    errors.push({ field: 'CỰ LY', message: 'Cự ly là bắt buộc nhập.' });
  } else {
    const lowerCuLy = rawCuLy.toLowerCase().replace(/\s+/g, '');
    if (lowerCuLy === '5km' || lowerCuLy === '5k' || lowerCuLy === '5' || lowerCuLy === '5.0') matchedCuLy = '5km';
    else if (lowerCuLy === '10km' || lowerCuLy === '10k' || lowerCuLy === '10' || lowerCuLy === '10.0') matchedCuLy = '10km';
    else if (lowerCuLy === '21km' || lowerCuLy === '21k' || lowerCuLy === 'hm' || lowerCuLy === '21' || lowerCuLy === '21.0') matchedCuLy = '21km';
    else if (lowerCuLy === '42km' || lowerCuLy === '42k' || lowerCuLy === 'fm' || lowerCuLy === '42' || lowerCuLy === '42.0') matchedCuLy = '42km';

    if (!matchedCuLy || !ALLOWED_DISTANCES.includes(matchedCuLy)) {
      errors.push({
        field: 'CỰ LY',
        message: 'Cự ly không hợp lệ. Chỉ chấp nhận 1 trong 4 cự ly: 5km, 10km, 21km, 42km.',
      });
    } else {
      normalized.cuLy = matchedCuLy;
    }
  }

  // 5. GIỚI TÍNH
  const rawGioiTinh = (rawRecord.gioiTinh || '').trim();
  let matchedGioiTinh = '';
  if (!rawGioiTinh) {
    errors.push({ field: 'GIỚI TÍNH', message: 'Giới tính là bắt buộc nhập.' });
  } else {
    const lowerGt = rawGioiTinh.toLowerCase();
    if (['nam', 'male', 'm'].includes(lowerGt)) matchedGioiTinh = 'Nam';
    else if (['nữ', 'nu', 'female', 'f'].includes(lowerGt)) matchedGioiTinh = 'Nữ';

    if (!matchedGioiTinh) {
      errors.push({
        field: 'GIỚI TÍNH',
        message: 'Giới tính không hợp lệ. Chỉ chấp nhận "Nam" hoặc "Nữ".',
      });
    } else {
      normalized.gioiTinh = matchedGioiTinh;
    }
  }

  // 6. NGÀY THÁNG NĂM SINH (Hoặc Năm Sinh)
  const rawDob = (rawRecord.namSinh || '').trim();
  let birthYear = 0;
  let formattedDob = rawDob;

  if (!rawDob) {
    errors.push({ field: 'NGÀY THÁNG NĂM SINH', message: 'Ngày tháng năm sinh là bắt buộc nhập.' });
  } else {
    const dobParsed = parseAndFormatDob(rawDob);
    if (dobParsed) {
      birthYear = dobParsed.year;
      formattedDob = dobParsed.formattedDob;
    } else {
      errors.push({
        field: 'NGÀY THÁNG NĂM SINH',
        message: 'Ngày tháng năm sinh không hợp lệ (ví dụ: 08/06/1993, 8/6/1993 hoặc năm sinh 1993).',
      });
    }

    // Kiểm tra điều kiện độ tuổi dựa trên cự ly
    if (birthYear > 0 && matchedCuLy) {
      const currentYear = new Date().getFullYear();
      const age = currentYear - birthYear;

      let minAge = 0;
      if (matchedCuLy === '42km') minAge = 18;
      else if (matchedCuLy === '21km') minAge = 16;
      else if (matchedCuLy === '10km') minAge = 12;
      else if (matchedCuLy === '5km') minAge = 4;

      if (age < minAge) {
        errors.push({
          field: 'NGÀY THÁNG NĂM SINH',
          message: `Cự ly ${matchedCuLy} yêu cầu từ đủ ${minAge} tuổi trở lên (năm sinh ${birthYear} = ${age} tuổi).`,
        });
      }
    }
  }
  normalized.namSinh = formattedDob;

  // 7. SĐT (Tự động thêm số 0 ở đầu nếu nhập 9 số do Excel xén mất)
  const rawSdt = cleanPhone(rawRecord.sdt || '');
  if (!rawSdt) {
    errors.push({ field: 'SĐT', message: 'Số điện thoại là bắt buộc nhập.' });
  } else if (!isValidPhone(rawSdt)) {
    errors.push({
      field: 'SĐT',
      message: 'SĐT phải có từ 10 - 11 chữ số, đúng định dạng Việt Nam (bắt đầu bằng số 0 hoặc +84).',
    });
  }
  normalized.sdt = rawSdt;

  // 8. CCCD / CMND / HỘ CHIẾU (Tự động bù số 0 ở đầu nếu bị Excel xén mất)
  const rawCccd = cleanCccd(rawRecord.cccd || '');
  if (!rawCccd) {
    errors.push({ field: 'CCCD / CMND / HỘ CHIẾU', message: 'CCCD/CMND/Hộ chiếu là bắt buộc nhập.' });
  } else {
    const isNineToTwelveDigits = /^\d{9,12}$/.test(rawCccd);
    const isValidPassport = /^[a-zA-Z0-9]{6,12}$/.test(rawCccd);

    if (!isNineToTwelveDigits && !isValidPassport) {
      errors.push({
        field: 'CCCD / CMND / HỘ CHIẾU',
        message: 'CCCD/CMND phải từ 9 đến 12 chữ số hoặc mã Hộ chiếu hợp lệ.',
      });
    }
  }
  normalized.cccd = rawCccd;

  // 9. QUỐC TỊCH (Cho phép bỏ trống -> Tự động gán "Việt Nam")
  let rawQuocTich = (rawRecord.quocTich || '').trim();
  if (!rawQuocTich) {
    rawQuocTich = 'Việt Nam';
  }
  normalized.quocTich = rawQuocTich;

  // 10. TỈNH THÀNH (Cho phép bỏ trống)
  normalized.tinhThanh = (rawRecord.tinhThanh || '').trim();

  // 11. CỠ ÁO & LOẠI ÁO & CỠ ÁO FINISHER
  const rawCoAo = (rawRecord.coAo || '').trim().toUpperCase();
  if (!rawCoAo) {
    errors.push({ field: 'CỠ ÁO', message: 'Cỡ áo là bắt buộc nhập.' });
  } else if (!ALLOWED_SIZES.includes(rawCoAo)) {
    errors.push({
      field: 'CỠ ÁO',
      message: `Cỡ áo không hợp lệ (${rawCoAo}). Chỉ chấp nhận 1 trong các size: ${ALLOWED_SIZES.join(', ')}.`,
    });
  }
  normalized.coAo = rawCoAo;

  // LOẠI ÁO (Mặc định TSHIRT nếu không nhập; chỉ chấp nhận TSHIRT hoặc SINGLET)
  const rawLoaiAo = (rawRecord.loaiAo || '').trim().toUpperCase();
  let finalLoaiAo = 'TSHIRT';
  if (rawLoaiAo) {
    const cleanType = rawLoaiAo.replace(/[\-\s_]/g, '');
    if (cleanType === 'TSHIRT' || cleanType === 'AOPHONG' || cleanType === 'TSHIRTS' || cleanType === 'T-SHIRT') {
      finalLoaiAo = 'TSHIRT';
    } else if (cleanType === 'SINGLET' || cleanType === 'BALO') {
      finalLoaiAo = 'SINGLET';
    } else {
      errors.push({
        field: 'LOẠI ÁO',
        message: `Loại áo không hợp lệ (${rawLoaiAo}). Chỉ chấp nhận 1 trong 2 loại: TSHIRT hoặc SINGLET.`,
      });
      finalLoaiAo = rawLoaiAo;
    }
  }
  normalized.loaiAo = finalLoaiAo;

  const isFinisherShirtRequired = matchedCuLy ? finisherDistances.includes(matchedCuLy) : false;
  const rawCoAoFinisher = (rawRecord.coAoFinisher || '').trim().toUpperCase();

  if (isFinisherShirtRequired) {
    // 1. Cự ly CÓ áp dụng áo Finisher -> BẮT BUỘC nhập và phải đúng size hợp lệ
    if (!rawCoAoFinisher) {
      errors.push({
        field: 'CỠ ÁO FINISHER',
        message: `Cỡ áo Finisher là bắt buộc nhập đối với cự ly ${matchedCuLy}.`,
      });
    } else if (!ALLOWED_SIZES.includes(rawCoAoFinisher)) {
      errors.push({
        field: 'CỠ ÁO FINISHER',
        message: `Cỡ áo Finisher không hợp lệ (${rawCoAoFinisher}). Chỉ chấp nhận 1 trong các size: ${ALLOWED_SIZES.join(', ')}.`,
      });
    }
  } else {
    // 2. Cự ly KHÔNG áp dụng áo Finisher -> KHÔNG ĐƯỢC có dữ liệu, nếu có data thì BÁO LỖI và không cho submit
    if (rawCoAoFinisher) {
      errors.push({
        field: 'CỠ ÁO FINISHER',
        message: `Cự ly ${matchedCuLy || 'này'} không áp dụng áo Finisher. Vui lòng để trống ô Cỡ áo Finisher (đang nhập: "${rawCoAoFinisher}").`,
      });
    }
  }
  normalized.coAoFinisher = rawCoAoFinisher;

  // 15. THÀNH TÍCH (PR/PB) (Quy chuẩn về hh:mm hoặc 'D')
  const rawThanhTich = (rawRecord.thanhTich || '').trim();
  const formattedThanhTich = parseAndFormatTime(rawThanhTich);
  const isTimeFormat = /^(\d{2}:\d{2}|D)$/i.test(formattedThanhTich);
  if (!isTimeFormat) {
    errors.push({
      field: 'THÀNH TÍCH (PR/PB)',
      message: 'Thành tích phải đúng định dạng thời gian hh:mm (ví dụ: 00:10, 01:30) hoặc chữ "D".',
    });
  }
  normalized.thanhTich = formattedThanhTich;

  // 14. NGƯỜI LIÊN HỆ KHẨN CẤP
  const rawNguoiKhanCap = cleanText(rawRecord.nguoiLienHeKhanCap || '');
  if (!rawNguoiKhanCap) {
    errors.push({
      field: 'NGƯỜI LIÊN HỆ KHẨN CẤP',
      message: 'Họ tên người liên hệ khẩn cấp là bắt buộc nhập.',
    });
  } else {
    if (!isValidEmergencyContactName(rawNguoiKhanCap)) {
      errors.push({
        field: 'NGƯỜI LIÊN HỆ KHẨN CẤP',
        message: 'Họ tên người liên hệ khẩn cấp chỉ gồm chữ cái, khoảng trắng và các ký tự quan hệ cơ bản.',
      });
    }
    if (rawHoTen && normalizeName(rawNguoiKhanCap) === normalizeName(rawHoTen)) {
      errors.push({
        field: 'NGƯỜI LIÊN HỆ KHẨN CẤP',
        message: 'Người liên hệ khẩn cấp không được trùng với HỌ TÊN người đăng ký.',
      });
    }
  }
  normalized.nguoiLienHeKhanCap = rawNguoiKhanCap;

  // 15. SĐT LIÊN HỆ KHẨN CẤP (Tự động thêm số 0 ở đầu nếu 9 số do Excel xén)
  const rawSdtKhanCap = cleanPhone(rawRecord.sdtLienHeKhanCap || '');
  if (!rawSdtKhanCap) {
    errors.push({
      field: 'SĐT LIÊN HỆ KHẨN CẤP',
      message: 'SĐT liên hệ khẩn cấp là bắt buộc nhập.',
    });
  } else {
    if (!isValidPhone(rawSdtKhanCap)) {
      errors.push({
        field: 'SĐT LIÊN HỆ KHẨN CẤP',
        message: 'SĐT liên hệ khẩn cấp không đúng định dạng SĐT Việt Nam.',
      });
    }
    if (rawSdt && cleanPhone(rawSdtKhanCap) === cleanPhone(rawSdt)) {
      errors.push({
        field: 'SĐT LIÊN HỆ KHẨN CẤP',
        message: 'SĐT liên hệ khẩn cấp không được trùng với SĐT của người đăng ký.',
      });
    }
  }
  normalized.sdtLienHeKhanCap = rawSdtKhanCap;

  // Ghi chú giữ nguyên
  normalized.ghiChu = (rawRecord.ghiChu || '').trim();

  if (errors.length > 0) {
    return {
      status: 'ERROR',
      data: normalized,
      errors,
    };
  }

  return {
    status: 'SUCCESS',
    data: normalized,
  };
}
