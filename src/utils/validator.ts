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

// Regex hỗ trợ chữ cái tiếng Việt có dấu và khoảng trắng
const VIETNAMESE_NAME_REGEX =
  /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s]+$/;

// Regex Tên trên BIB: Chữ cái (kể cả tiếng Việt), số, khoảng trắng. Tối đa 20 ký tự
const BIB_NAME_REGEX =
  /^[a-zA-Z0-9ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s]+$/;

// Email regex chuẩn
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Chuẩn hóa SĐT (xóa khoảng trắng, dấu gạch ngang, dấu chấm, đuôi .0 của Excel và tự thêm 0 nếu có 9 số)
const cleanPhone = (phone: any): string => {
  if (phone === null || phone === undefined) return '';
  let str = String(phone).trim().replace(/\.0$/, '');
  let cleaned = str.replace(/[\s\-\.\(\)]/g, '').trim();
  if (/^\d{9}$/.test(cleaned)) {
    cleaned = '0' + cleaned;
  }
  return cleaned;
};

// Kiểm tra SĐT Việt Nam hợp lệ (10-11 chữ số, bắt đầu bằng 0 hoặc +84 / 84)
const isValidPhone = (phone: string): boolean => {
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
 * Tự động quy chuẩn các định dạng thời gian từ Excel / JS Date sang dạng hh:mm (24h)
 * - "12:45:00 AM" -> "00:45"
 * - "12:45 AM" -> "00:45"
 * - "01:45:00" -> "01:45"
 * - "00:45" / "1:45" -> "00:45" / "01:45"
 * - Excel fraction (0.03125 -> "00:45")
 * - "1h45m" / "1h45" -> "01:45"
 */
export function parseAndFormatTime(rawInput: any): string {
  if (rawInput === null || rawInput === undefined) return '';

  if (rawInput instanceof Date && !isNaN(rawInput.getTime())) {
    const h = rawInput.getHours();
    const m = rawInput.getMinutes();
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  const rawStr = String(rawInput).trim();
  if (!rawStr) return '';

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

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  // 2. Chuỗi dạng hh:mm:ss hoặc hh:mm (ví dụ "00:45:00", "01:45:20", "00:45", "1:45")
  const timeMatch = rawStr.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
  }

  // 3. Số fraction Excel (ví dụ: 0.03125 = 45 phút, 0.072916666 = 1h45m)
  const numVal = Number(rawStr);
  if (!isNaN(numVal) && numVal > 0 && numVal < 1) {
    const totalMinutes = Math.round(numVal * 24 * 60);
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  // 4. Chuỗi dạng 1h45m, 1h45, 45m
  const hmMatch = rawStr.match(/^(?:(\d+)\s*h)?\s*(?:(\d+)\s*m?)?$/i);
  if (hmMatch && (hmMatch[1] || hmMatch[2])) {
    const hours = hmMatch[1] ? parseInt(hmMatch[1], 10) : 0;
    const minutes = hmMatch[2] ? parseInt(hmMatch[2], 10) : 0;
    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
  }

  return rawStr;
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
  const rawHoTen = (rawRecord.hoTen || '').trim();
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
    if (!VIETNAMESE_NAME_REGEX.test(rawHoTen)) {
      errors.push({
        field: 'HỌ TÊN',
        message: 'Họ tên chỉ chứa chữ cái và khoảng trắng (không chứa số hoặc ký tự đặc biệt).',
      });
    }
  }
  normalized.hoTen = rawHoTen;

  // 2. EMAIL
  const rawEmail = (rawRecord.email || '').trim();
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
  const rawBib = (rawRecord.tenTrenBib || '').trim();
  if (!rawBib) {
    errors.push({ field: 'TÊN TRÊN BIB', message: 'Tên trên BIB là bắt buộc nhập.' });
  } else {
    if (rawBib.length > 20) {
      errors.push({
        field: 'TÊN TRÊN BIB',
        message: `Tên trên BIB không vượt quá 20 ký tự (hiện tại ${rawBib.length} ký tự).`,
      });
    }
    if (!BIB_NAME_REGEX.test(rawBib)) {
      errors.push({
        field: 'TÊN TRÊN BIB',
        message: 'Tên trên BIB chỉ gồm chữ cái, số và khoảng trắng (không chứa ký tự đặc biệt).',
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

  // 8. CCCD / CMND / HỘ CHIẾU
  const rawCccd = (rawRecord.cccd || '').trim();
  if (!rawCccd) {
    errors.push({ field: 'CCCD / CMND / HỘ CHIẾU', message: 'CCCD/CMND/Hộ chiếu là bắt buộc nhập.' });
  } else {
    const cleanedCccd = rawCccd.replace(/\s+/g, '');
    const isNineToTwelveDigits = /^\d{9,12}$/.test(cleanedCccd);
    const isValidPassport = /^[a-zA-Z0-9]{6,12}$/.test(cleanedCccd);

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

  if (!rawCoAoFinisher) {
    if (isFinisherShirtRequired) {
      errors.push({
        field: 'CỠ ÁO FINISHER',
        message: `Cỡ áo Finisher là bắt buộc nhập đối với cự ly ${matchedCuLy}.`,
      });
    }
  } else if (!ALLOWED_SIZES.includes(rawCoAoFinisher)) {
    errors.push({
      field: 'CỠ ÁO FINISHER',
      message: `Cỡ áo Finisher không hợp lệ (${rawCoAoFinisher}). Chỉ chấp nhận 1 trong các size: ${ALLOWED_SIZES.join(', ')}.`,
    });
  }
  normalized.coAoFinisher = rawCoAoFinisher;

  // 12. SỐ TIỀN (Bỏ trống hoặc dạng số)
  const rawSoTien = (rawRecord.soTien || '').trim();
  if (rawSoTien) {
    const numericStr = rawSoTien.replace(/[^0-9]/g, '');
    if (!numericStr) {
      errors.push({
        field: 'SỐ TIỀN',
        message: 'Số tiền phải là dạng số (ví dụ: 500000).',
      });
    }
  }
  normalized.soTien = rawSoTien;

  // 13. THÀNH TÍCH (PR/PB) (Bỏ trống hoặc dạng hh:mm)
  const rawThanhTich = (rawRecord.thanhTich || '').trim();
  let formattedThanhTich = rawThanhTich;
  if (rawThanhTich) {
    formattedThanhTich = parseAndFormatTime(rawThanhTich);
    // Kiểm tra sau khi định dạng xem có đúng chuẩn hh:mm không
    const isTimeFormat = /^(\d{1,2}:)\d{2}$/.test(formattedThanhTich);
    if (!isTimeFormat) {
      errors.push({
        field: 'THÀNH TÍCH (PR/PB)',
        message: 'Thành tích phải đúng định dạng thời gian (ví dụ: 00:45, 01:45).',
      });
    }
  }
  normalized.thanhTich = formattedThanhTich;

  // 14. NGƯỜI LIÊN HỆ KHẨN CẤP
  const rawNguoiKhanCap = (rawRecord.nguoiLienHeKhanCap || '').trim();
  if (!rawNguoiKhanCap) {
    errors.push({
      field: 'NGƯỜI LIÊN HỆ KHẨN CẤP',
      message: 'Họ tên người liên hệ khẩn cấp là bắt buộc nhập.',
    });
  } else {
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
