import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  Send,
  Loader2,
  CheckCircle2,
  Trash2,
  Sparkles,
  Table,
  Info,
  Folder,
  ExternalLink,
  ArrowLeft,
  AlertTriangle,
  XCircle,
  Edit3,
  X,
  FileJson,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  Shirt,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { StatusBanner } from './StatusBanner';
import { EventItem, ExcelRowItem, ParticipantRecord, BatchRegistrationResult } from '../types';
import { validateParticipant, ValidationOutput } from '../utils/validator';

interface RegisterFormProps {
  selectedEvent: EventItem | null;
  eventsList: EventItem[];
  onSelectEvent: (event: EventItem) => void;
  onSubmitBatch: (data: {
    participants: ParticipantRecord[];
    spreadsheetId: string;
    requester?: string;
  }) => Promise<BatchRegistrationResult | null>;
  isMockMode: boolean;
  onGoToStep1?: () => void;
}

// 19 cột tiêu chuẩn chính xác theo yêu cầu
export const EXPECTED_COLUMNS = [
  'STT',
  'HỌ TÊN',
  'EMAIL',
  'TÊN TRÊN BIB',
  'CỰ LY',
  'GIỚI TÍNH',
  'NĂM SINH',
  'SĐT',
  'CCCD',
  'QUỐC TỊCH',
  'TỈNH THÀNH',
  'LOẠI ÁO',
  'CỠ ÁO',
  'CỠ ÁO FINISHER',
  'SỐ TIỀN',
  'THÀNH TÍCH',
  'NGƯỜI LIÊN HỆ KHẨN CẤP',
  'SĐT LIÊN HỆ KHẨN CẤP',
  'GHI CHÚ',
];

// Mapping từ khóa linh hoạt cho các cột
const FIELD_MAPPINGS: Array<{ key: keyof ParticipantRecord; title: string; aliases: string[] }> = [
  { key: 'stt', title: 'STT', aliases: ['stt', 'so tt', 'số tt', 'so thu tu', 'số thứ tự', 'no', 'no.', 'index'] },
  { key: 'hoTen', title: 'HỌ TÊN', aliases: ['ho ten', 'họ tên', 'ho va ten', 'họ và tên', 'full name', 'fullname', 'tên'] },
  { key: 'email', title: 'EMAIL', aliases: ['email', 'thu dien tu', 'thư điện tử', 'e-mail'] },
  { key: 'tenTrenBib', title: 'TÊN TRÊN BIB', aliases: ['ten tren bib', 'tên trên bib', 'bib name', 'ten bib', 'bib'] },
  { key: 'cuLy', title: 'CỰ LY', aliases: ['cu ly', 'cự ly', 'distance', 'khoang cach'] },
  { key: 'gioiTinh', title: 'GIỚI TÍNH', aliases: ['gioi tinh', 'giới tính', 'gender', 'sex'] },
  { key: 'namSinh', title: 'NĂM SINH', aliases: ['nam sinh', 'năm sinh', 'birth year', 'yob', 'dob', 'ngay sinh'] },
  { key: 'sdt', title: 'SĐT', aliases: ['sdt', 'sđt', 'so dien thoai', 'số điện thoại', 'phone', 'tel', 'mobile', 'dienthoai', 'điện thoại', 'so phone', 'số phone', 'sdt nguoi dang ky', 'sđt người đăng ký', 'sdt dang ky', 'sđt đăng ký'] },
  { key: 'cccd', title: 'CCCD', aliases: ['cccd', 'cmnd', 'cmnd/cccd', 'so cccd', 'số cccd', 'passport', 'id number'] },
  { key: 'quocTich', title: 'QUỐC TỊCH', aliases: ['quoc tich', 'quốc tịch', 'nationality', 'nation'] },
  { key: 'tinhThanh', title: 'TỈNH THÀNH', aliases: ['tinh thanh', 'tỉnh thành', 'tinh/thanh', 'tỉnh/thành phố', 'city', 'province'] },
  { key: 'loaiAo', title: 'LOẠI ÁO', aliases: ['loai ao', 'loại áo', 'kieu ao', 'kiểu áo', 'shirt type', 'shirt style', 'style', 'type', 'loai_ao'] },
  { key: 'coAo', title: 'CỠ ÁO', aliases: ['co ao', 'cỡ áo', 'size ao', 'shirt size', 'size'] },
  { key: 'coAoFinisher', title: 'CỠ ÁO FINISHER', aliases: ['co ao finisher', 'cỡ áo finisher', 'finisher size'] },
  { key: 'soTien', title: 'SỐ TIỀN', aliases: ['so tien', 'số tiền', 'amount', 'fee', 'gia ve', 'lệ phí'] },
  { key: 'thanhTich', title: 'THÀNH TÍCH', aliases: ['thanh tich', 'thành tích', 'result', 'time', 'pb', 'pacing'] },
  { key: 'nguoiLienHeKhanCap', title: 'NGƯỜI LIÊN HỆ KHẨN CẤP', aliases: ['nguoi lien he khan cap', 'người liên hệ khẩn cấp', 'emergency contact', 'người thân'] },
  { key: 'sdtLienHeKhanCap', title: 'SĐT LIÊN HỆ KHẨN CẤP', aliases: ['sdt lien he khan cap', 'sđt liên hệ khẩn cấp', 'sdt khan cap', 'sđt khẩn cấp', 'so dien thoai khan cap', 'số điện thoại khẩn cấp', 'sdt nguoi than', 'sđt người thân', 'emergency phone', 'emergency contact phone'] },
  { key: 'ghiChu', title: 'GHI CHÚ', aliases: ['ghi chu', 'ghi chú', 'note', 'notes', 'remark'] },
];

// Dữ liệu mẫu chuẩn dùng thử nghiệm (ĐÃ VALIDATE HỢP LỆ)
const SAMPLE_RUNNERS: ParticipantRecord[] = [
  {
    stt: '1',
    hoTen: 'Nguyễn Văn Nam',
    email: 'nam.nguyen@gmail.com',
    tenTrenBib: 'NAM RUNNER',
    cuLy: '21km',
    gioiTinh: 'Nam',
    namSinh: '15/05/1992',
    sdt: '0901234567',
    cccd: '001092001234',
    quocTich: 'Việt Nam',
    tinhThanh: 'Hà Nội',
    coAo: 'L',
    loaiAo: 'TSHIRT',
    coAoFinisher: 'L',
    soTien: '750000',
    thanhTich: '01:45',
    nguoiLienHeKhanCap: 'Nguyễn Thị Hoa',
    sdtLienHeKhanCap: '0912345678',
    ghiChu: 'Đã hoàn tất thanh toán',
  },
  {
    stt: '2',
    hoTen: 'Lê Thị Thu Hà',
    email: 'thuha.le@yahoo.com',
    tenTrenBib: 'THU HA',
    cuLy: '42km',
    gioiTinh: 'Nữ',
    namSinh: '20/10/1995',
    sdt: '0987654321',
    cccd: '038195005678',
    quocTich: 'Việt Nam',
    tinhThanh: 'Đà Nẵng',
    coAo: 'M',
    loaiAo: 'SINGLET',
    coAoFinisher: 'M',
    soTien: '1100000',
    thanhTich: '03:50',
    nguoiLienHeKhanCap: 'Lê Văn Tuấn',
    sdtLienHeKhanCap: '0978112233',
    ghiChu: 'Nhận BIB tại quầy EXPO',
  },
  {
    stt: '3',
    hoTen: 'Phạm Minh Đức',
    email: 'duc.pham@outlook.com',
    tenTrenBib: 'DUC PHAM',
    cuLy: '10km',
    gioiTinh: 'Nam',
    namSinh: '08/03/1988',
    sdt: '0933445566',
    cccd: '079088009988',
    quocTich: '', // Thử nghiệm tự động điền "Việt Nam"
    tinhThanh: 'TP. Hồ Chí Minh',
    coAo: 'XL',
    loaiAo: 'TSHIRT',
    coAoFinisher: 'XL',
    soTien: '450000',
    thanhTich: '00:52',
    nguoiLienHeKhanCap: 'Phạm Hồng Nhung',
    sdtLienHeKhanCap: '0944556677',
    ghiChu: 'Gửi áo qua chuyển phát nhanh',
  },
];

export const RegisterForm: React.FC<RegisterFormProps> = ({
  selectedEvent,
  onSubmitBatch,
  isMockMode,
  onGoToStep1,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [spreadsheetId, setSpreadsheetId] = useState('');

  const [parsedRows, setParsedRows] = useState<ExcelRowItem[]>([]);
  const [, setFileName] = useState<string>('');
  const [, setMatchedColumnCount] = useState<number>(0);

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [statusDetails, setStatusDetails] = useState('');
  const [lastBatchResult, setLastBatchResult] = useState<BatchRegistrationResult | null>(null);

  // State cho Modal xem JSON Output & Modal Chỉnh Sửa Dòng
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [editingRow, setEditingRow] = useState<ExcelRowItem | null>(null);
  const [editFormData, setEditFormData] = useState<ParticipantRecord | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);

  // Hiển thị danh sách 30 Quy tắc Validation ở cuối Bước 2
  const [showValidationRulesList, setShowValidationRulesList] = useState(false);

  // State lưu trữ lỗi validate tiêu đề cột (nếu file không đúng 19 cột tiêu chuẩn)
  const [headerValidationErrors, setHeaderValidationErrors] = useState<string[]>([]);

  // Cấu hình cự ly áp dụng Áo Finisher (mặc định 21km & 42km)
  const [finisherDistances, setFinisherDistances] = useState<string[]>(['21km', '42km']);

  const toggleFinisherDistance = (dist: string) => {
    const updated = finisherDistances.includes(dist)
      ? finisherDistances.filter((d) => d !== dist)
      : [...finisherDistances, dist];
    setFinisherDistances(updated);

    if (parsedRows.length > 0) {
      const revalidated = parsedRows.map((row) => {
        const valResult = validateParticipant(row, { finisherDistances: updated });
        const finalData = valResult.data || row;
        return {
          ...row,
          ...finalData,
          validationOutput: valResult,
        };
      });
      setParsedRows(revalidated);

      const invalidCount = revalidated.filter((r) => r.validationOutput?.status === 'ERROR').length;
      if (invalidCount > 0) {
        setStatus('error');
        setStatusMessage(`Đã cập nhật quy tắc Cự ly Áo Finisher! Phát hiện ${invalidCount}/${revalidated.length} dòng KHÔNG HỢP LỆ.`);
        setStatusDetails(`Vui lòng kiểm tra lại báo cáo bên dưới.`);
      } else {
        setStatus('success');
        setStatusMessage(`Tất cả ${revalidated.length} dòng đều HỢP LỆ (100% SUCCESS)!`);
        setStatusDetails(`Sẵn sàng gửi dữ liệu vào Google Sheet.`);
      }
    }
  };

  // Sync spreadsheetId when selectedEvent changes
  useEffect(() => {
    if (selectedEvent) {
      setSpreadsheetId(selectedEvent.spreadsheetId);
    }
  }, [selectedEvent]);

  // Chuẩn hóa chuỗi để so sánh tiêu đề cột
  const normalizeHeader = (str: any): string => {
    if (str === null || str === undefined) return '';
    return String(str)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
  };

  // Đọc và phân tích File Excel theo đúng 19 cột tiêu chuẩn & VALIDATE DỮ LIỆU
  const processExcelFile = (file: File) => {
    setFileName(file.name);
    setHeaderValidationErrors([]);
    setParsedRows([]);
    setStatus('loading');
    setStatusMessage(`Đang kiểm tra cấu trúc 19 cột tiêu chuẩn và validate dữ liệu từ tệp "${file.name}"...`);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (rawJson.length < 2) {
          setStatus('error');
          setStatusMessage('File Excel rỗng hoặc không có dữ liệu hàng người tham gia.');
          setStatusDetails('Tệp phải chứa 1 hàng tiêu đề đúng 19 cột và tối thiểu 1 hàng dữ liệu.');
          return;
        }

        let headerRowIndex = 0;
        let headerRow: any[] = rawJson[0] || [];

        // Kiểm tra nếu hàng 0 quá ít cột dữ liệu (thường là hàng tiêu đề/title sự kiện), chuyển sang thử hàng 1
        const row0Clean = headerRow.map((c) => (c !== null && c !== undefined ? String(c).trim() : ''));
        const row0NonEmptyCount = row0Clean.filter(Boolean).length;

        if (row0NonEmptyCount < 3 && rawJson.length > 1) {
          const row1 = rawJson[1] || [];
          const row1Clean = row1.map((c) => (c !== null && c !== undefined ? String(c).trim() : ''));
          const row1NonEmptyCount = row1Clean.filter(Boolean).length;
          if (row1NonEmptyCount > row0NonEmptyCount) {
            headerRowIndex = 1;
            headerRow = row1;
          }
        }

        const cleanedHeaders = headerRow.map((c) => (c !== null && c !== undefined ? String(c).trim() : ''));

        // XPRT: Xác định vị trí cột cuối cùng có dữ liệu tiêu đề để tính tổng số cột thực tế
        let lastNonEmptyIdx = -1;
        for (let i = cleanedHeaders.length - 1; i >= 0; i--) {
          if (cleanedHeaders[i] !== '') {
            lastNonEmptyIdx = i;
            break;
          }
        }
        const actualColumnCount = lastNonEmptyIdx + 1;

        // =========================================================================
        // BƯỚC 1: VALIDATE BẮT BUỘC ĐÚNG 19 CỘT THEO THỨ TỰ (TRƯỚC KHI VALIDATE DÒNG)
        // =========================================================================
        const columnErrors: string[] = [];

        // 1.1 Kiểm tra số lượng cột (Phải chính xác 19 cột)
        if (actualColumnCount < 19) {
          columnErrors.push(
            `File Excel bị THIẾU CỘT: Hiện có ${actualColumnCount}/19 cột tiêu chuẩn (thiếu ${19 - actualColumnCount} cột).`
          );
        } else if (actualColumnCount > 19) {
          columnErrors.push(
            `File Excel bị THỪA CỘT: Hiện có ${actualColumnCount} cột (thừa ${actualColumnCount - 19} cột nội dung khác không nằm trong 19 cột tiêu chuẩn).`
          );
        }

        // 1.2 Kiểm tra tên tiêu đề và vị trí từng cột từ 1 đến 19
        for (let i = 0; i < 19; i++) {
          const expectedTitle = EXPECTED_COLUMNS[i];
          const actualHeader = cleanedHeaders[i] || '';
          const mapping = FIELD_MAPPINGS[i];

          if (!actualHeader) {
            columnErrors.push(`Cột vị trí ${i + 1} [Kỳ vọng: '${expectedTitle}'] bị BỎ TRỐNG tiêu đề.`);
          } else {
            const normActual = normalizeHeader(actualHeader);
            const isMatch = mapping.aliases.some((alias) => normalizeHeader(alias) === normActual);

            if (!isMatch) {
              columnErrors.push(
                `Cột vị trí ${i + 1} sai tiêu đề hoặc sai thứ tự: Kỳ vọng '${expectedTitle}', thực tế trong file là '${actualHeader}'.`
              );
            }
          }
        }

        // NẾU CÓ LỖI CẤU TRÚC CỘT: DỪNG NGAY VÀ KHÔNG VALIDATE DỮ LIỆU CÁC DÒNG!
        if (columnErrors.length > 0) {
          setStatus('error');
          setStatusMessage(
            `LỖI CẤU TRÚC CỘT FILE EXCEL: File không đúng 19 cột tiêu chuẩn hoặc sai thứ tự! (${columnErrors.length} lỗi tiêu đề)`
          );
          setStatusDetails(
            `Vui lòng điều chỉnh lại cấu trúc tiêu đề cột theo đúng 19 cột tiêu chuẩn từ 1 đến 19 trước khi tiếp tục.`
          );
          setHeaderValidationErrors(columnErrors);
          setParsedRows([]);
          setMatchedColumnCount(0);
          return; // STOP EXECUTION!
        }

        // =========================================================================
        // BƯỚC 2: VALIDATE DỮ LIỆU TỪNG DÒNG (CHỈ CHẠY KHI CỘT ĐÃ ĐẠT CHUẨN 100%)
        // =========================================================================
        setHeaderValidationErrors([]);
        setMatchedColumnCount(19);

        const extractedRows: ExcelRowItem[] = [];

        for (let i = headerRowIndex + 1; i < rawJson.length; i++) {
          const row = rawJson[i];
          if (!row || row.length === 0) continue;

          const hasAnyData = row.some((val: any) => val !== undefined && val !== null && String(val).trim() !== '');
          if (!hasAnyData) continue;

          const getVal = (colIdx: number): string => {
            if (row[colIdx] !== undefined && row[colIdx] !== null) {
              let val = String(row[colIdx]).trim();
              val = val.replace(/\.0$/, '');
              return val;
            }
            return '';
          };

          const pItem: ParticipantRecord = {
            stt: getVal(0),
            hoTen: getVal(1),
            email: getVal(2),
            tenTrenBib: getVal(3),
            cuLy: getVal(4),
            gioiTinh: getVal(5),
            namSinh: getVal(6),
            sdt: getVal(7),
            cccd: getVal(8),
            quocTich: getVal(9),
            tinhThanh: getVal(10),
            loaiAo: getVal(11),
            coAo: getVal(12),
            coAoFinisher: getVal(13),
            soTien: getVal(14),
            thanhTich: getVal(15),
            nguoiLienHeKhanCap: getVal(16),
            sdtLienHeKhanCap: getVal(17),
            ghiChu: getVal(18),
          };

          if (pItem.hoTen || pItem.sdt || pItem.email || pItem.cuLy) {
            // Chạy Validation cho từng dòng
            const valResult = validateParticipant(pItem, { finisherDistances });
            const finalData = valResult.data || pItem;

            extractedRows.push({
              ...finalData,
              id: `${i}-${Date.now()}`,
              status: 'pending',
              validationOutput: valResult,
            });
          }
        }

        if (extractedRows.length === 0) {
          setStatus('error');
          setStatusMessage('Không tìm thấy dòng dữ liệu hợp lệ nào trong File Excel.');
          return;
        }

        setParsedRows(extractedRows);

        const invalidCount = extractedRows.filter((r) => r.validationOutput?.status === 'ERROR').length;

        if (invalidCount > 0) {
          setStatus('error');
          setStatusMessage(`Đã đọc ${extractedRows.length} dòng. Phát hiện ${invalidCount} dòng dữ liệu KHÔNG HỢP LỆ!`);
          setStatusDetails(`Vui lòng kiểm tra báo cáo lỗi chi tiết ở bên dưới và chỉnh sửa trực tiếp trước khi ghi nhận dữ liệu.`);
        } else {
          setStatus('success');
          setStatusMessage(`Cấu trúc 19 cột đạt chuẩn 100% & Kiểm tra ${extractedRows.length} dòng dữ liệu HỢP LỆ (100% SUCCESS)!`);
          setStatusDetails(`Tệp: ${file.name} | Số lượng: ${extractedRows.length} vận động viên.`);
        }
      } catch (err: any) {
        setStatus('error');
        setStatusMessage('Lỗi đọc File Excel. Vui lòng kiểm tra định dạng tệp (.xlsx, .xls, .csv).');
        setStatusDetails(err.message || '');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      processExcelFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processExcelFile(e.dataTransfer.files[0]);
    }
  };

  // Tạo và Tải File Excel Mẫu với ĐÚNG 19 CỘT TIÊU CHUẨN
  const handleDownloadSampleExcel = () => {
    const headerRow = EXPECTED_COLUMNS;

    const sampleRows = SAMPLE_RUNNERS.map((runner, idx) => [
      runner.stt || String(idx + 1),
      runner.hoTen,
      runner.email,
      runner.tenTrenBib,
      runner.cuLy,
      runner.gioiTinh,
      runner.namSinh,
      runner.sdt,
      runner.cccd,
      runner.quocTich,
      runner.tinhThanh,
      runner.loaiAo,
      runner.coAo,
      runner.coAoFinisher,
      runner.soTien,
      runner.thanhTich,
      runner.nguoiLienHeKhanCap,
      runner.sdtLienHeKhanCap,
      runner.ghiChu,
    ]);

    const sheetData = [headerRow, ...sampleRows];
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    const colsWidth = EXPECTED_COLUMNS.map(() => ({ wch: 18 }));
    worksheet['!cols'] = colsWidth;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Danh sách ${EXPECTED_COLUMNS.length} cột`);
    XLSX.writeFile(workbook, `Form_Import_Mau_${EXPECTED_COLUMNS.length}_Cot_Su_Kien.xlsx`);
  };

  // Tải dữ liệu thử nghiệm (ĐÃ RUN VALIDATION)
  const handleLoadSampleData = () => {
    setHeaderValidationErrors([]);
    const sampleItems: ExcelRowItem[] = SAMPLE_RUNNERS.map((runner, idx) => {
      const valResult = validateParticipant(runner, { finisherDistances });
      return {
        ...(valResult.data || runner),
        id: `sample-${idx}`,
        status: 'pending',
        validationOutput: valResult,
      };
    });

    setParsedRows(sampleItems);
    setFileName(`Dữ liệu chạy mẫu (3 vận động viên - ${EXPECTED_COLUMNS.length} cột)`);
    setMatchedColumnCount(EXPECTED_COLUMNS.length);
    setStatus('success');
    setStatusMessage('Đã tải 3 vận động viên mẫu. Tất cả đều kiểm tra HỢP LỆ (100% SUCCESS)!');
    setStatusDetails('Bấm "GỬI DỮ LIỆU EXCEL VÀO GOOGLE SHEET" để hoàn tất.');
  };

  // Xóa 1 dòng từ danh sách
  const handleDeleteRow = (id: string) => {
    setParsedRows((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      const invalidCount = updated.filter((r) => r.validationOutput?.status === 'ERROR').length;
      if (updated.length > 0 && invalidCount === 0) {
        setStatus('success');
        setStatusMessage(`Đã cập nhật danh sách! ${updated.length} dòng dữ liệu còn lại đều HỢP LỆ.`);
      }
      return updated;
    });
  };

  // Mở modal chỉnh sửa dòng
  const handleStartEditRow = (row: ExcelRowItem) => {
    setEditingRow(row);
    setEditFormData({ ...row });
  };

  // Lưu thông tin chỉnh sửa dòng & re-validate
  const handleSaveEditedRow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRow || !editFormData) return;

    const valResult = validateParticipant(editFormData, { finisherDistances });
    const updatedData = valResult.data || editFormData;

    setParsedRows((prev) =>
      prev.map((r) => {
        if (r.id === editingRow.id) {
          return {
            ...updatedData,
            id: r.id,
            status: 'pending',
            validationOutput: valResult,
          };
        }
        return r;
      })
    );

    setEditingRow(null);
    setEditFormData(null);

    // Cập nhật lại status chung
    setTimeout(() => {
      setParsedRows((currentRows) => {
        const invalidCount = currentRows.filter((r) => r.validationOutput?.status === 'ERROR').length;
        if (invalidCount === 0) {
          setStatus('success');
          setStatusMessage(`Tất cả ${currentRows.length} dòng dữ liệu hiện tại đều HỢP LỆ (100% SUCCESS)!`);
        } else {
          setStatus('error');
          setStatusMessage(`Còn ${invalidCount} dòng dữ liệu chưa hợp lệ. Vui lòng tiếp tục sửa lỗi.`);
        }
        return currentRows;
      });
    }, 100);
  };

  // Gửi batch 19 cột sang Google Apps Script
  const handleSubmitBatch = async () => {
    if (parsedRows.length === 0) {
      setStatus('error');
      setStatusMessage('Chưa có dữ liệu Excel nào. Vui lòng tải file Excel lên.');
      return;
    }

    // Kiểm tra xem có dòng nào bị lỗi validation không
    const invalidRows = parsedRows.filter((r) => r.validationOutput?.status === 'ERROR');
    if (invalidRows.length > 0) {
      setStatus('error');
      setStatusMessage(`Không thể gửi dữ liệu! Phát hiện ${invalidRows.length} dòng dữ liệu bị lỗi Validation.`);
      setStatusDetails(`Vui lòng chỉnh sửa các dòng bị lỗi màu đỏ hoặc bấm nút XÓA DÒNG trước khi ghi nhận.`);
      return;
    }

    const targetSpreadsheetId = selectedEvent?.spreadsheetId || spreadsheetId;

    if (!targetSpreadsheetId || !targetSpreadsheetId.trim()) {
      setStatus('error');
      setStatusMessage('Chưa chọn File Google Sheet nào! Vui lòng thực hiện Bước 1 để tạo file trước khi import.');
      return;
    }

    setStatus('loading');
    setStatusMessage('Đang import dữ liệu...');
    setStatusDetails('');

    try {
      const payloadParticipants: ParticipantRecord[] = parsedRows.map((r, idx) => ({
        stt: r.stt || String(idx + 1),
        hoTen: r.hoTen,
        email: r.email,
        tenTrenBib: r.tenTrenBib,
        cuLy: r.cuLy,
        gioiTinh: r.gioiTinh,
        namSinh: r.namSinh,
        sdt: r.sdt,
        cccd: r.cccd,
        quocTich: r.quocTich,
        tinhThanh: r.tinhThanh,
        loaiAo: r.loaiAo,
        coAo: r.coAo,
        coAoFinisher: r.coAoFinisher,
        soTien: r.soTien,
        thanhTich: r.thanhTich,
        nguoiLienHeKhanCap: r.nguoiLienHeKhanCap,
        sdtLienHeKhanCap: r.sdtLienHeKhanCap,
        ghiChu: r.ghiChu,
      }));

      const result = await onSubmitBatch({
        participants: payloadParticipants,
        spreadsheetId: targetSpreadsheetId.trim(),
        requester: selectedEvent?.requester || '',
      });

      if (result) {
        setStatus('success');
        setStatusMessage(`Import thành công ${result.successCount} dòng vào Google Sheet!`);
        setStatusDetails(`Cập nhật lúc: ${result.timestamp} | Spreadsheet ID: ${targetSpreadsheetId.trim()}`);
        setLastBatchResult(result);
        setParsedRows((prev) => prev.map((r) => ({ ...r, status: 'success' })));
      }
    } catch (err: any) {
      setStatus('error');
      setStatusMessage(err.message || 'Lỗi khi gửi dữ liệu Excel sang Google Apps Script.');
      setStatusDetails(err.stack || '');
    }
  };

  // Tính toán số dòng hợp lệ & bị lỗi
  const invalidRowsCount = parsedRows.filter((r) => r.validationOutput?.status === 'ERROR').length;
  const validRowsCount = parsedRows.length - invalidRowsCount;

  // Cấu hình mảng JSON kết quả Validation theo đúng Output Format của prompt
  const fullValidationJsonOutput = parsedRows.map((row) => {
    if (row.validationOutput?.status === 'SUCCESS') {
      return {
        status: 'SUCCESS',
        data: {
          stt: row.stt,
          hoTen: row.hoTen,
          email: row.email,
          tenTrenBib: row.tenTrenBib,
          cuLy: row.cuLy,
          gioiTinh: row.gioiTinh,
          namSinh: row.namSinh,
          sdt: row.sdt,
          cccd: row.cccd,
          quocTich: row.quocTich,
          tinhThanh: row.tinhThanh,
          loaiAo: row.loaiAo,
          coAo: row.coAo,
          coAoFinisher: row.coAoFinisher,
          soTien: row.soTien,
          thanhTich: row.thanhTich,
          nguoiLienHeKhanCap: row.nguoiLienHeKhanCap,
          sdtLienHeKhanCap: row.sdtLienHeKhanCap,
          ghiChu: row.ghiChu,
        },
      };
    } else {
      return {
        status: 'ERROR',
        errors: row.validationOutput?.errors || [
          { field: 'DỮ LIỆU', message: 'Dữ liệu không đáp ứng quy tắc validation.' },
        ],
      };
    }
  });

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(fullValidationJsonOutput, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="bg-[#F8F6F0] border border-[#2D2D2D]">
      {/* Form Header */}
      <div className="bg-[#2D2D2D] text-[#F8F6F0] p-5 border-b border-[#2D2D2D]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="bg-[#F8F6F0] text-[#2D2D2D] font-mono font-bold px-2.5 py-1 text-xs border border-[#2D2D2D]">
              02
            </span>
            <div>
              <h2 className="text-base font-serif font-bold text-[#F8F6F0]">
                BƯỚC 2: IMPORT & VALIDATE FILE EXCEL (19 CỘT TIÊU CHUẨN)
              </h2>
              <p className="text-[11px] font-mono text-[#E5E2D9]">
                Kiểm tra 15 quy tắc Validation dữ liệu trước khi ghi nhận
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono">
            {onGoToStep1 && (
              <button
                type="button"
                onClick={onGoToStep1}
                className="px-3 py-1.5 bg-[#F8F6F0] hover:bg-[#E5E2D9] text-[#2D2D2D] font-bold text-[11px] border border-[#2D2D2D] transition-colors flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#2D2D2D]" />
                <span>QUAY LẠI BƯỚC 1</span>
              </button>
            )}
            {isMockMode && (
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#E5E2D9] text-[#2D2D2D] border border-[#2D2D2D] px-2 py-0.5">
                MOCK MODE
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* List of Required 19 Fields Badge Grid */}
        <div className="p-4 bg-[#2D2D2D] text-[#F8F6F0] border border-[#2D2D2D] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#F8F6F0] flex items-center gap-2">
              <Info className="w-4 h-4 text-[#E5E2D9]" />
              19 CỘT TIÊU CHUẨN & 30 QUY TẮC VALIDATION DỮ LIỆU:
            </span>
            <span className="text-[10px] font-mono font-bold bg-[#F8F6F0] text-[#2D2D2D] border border-[#2D2D2D] px-2.5 py-0.5">
              19 / 19 CỘT
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1 font-mono">
            {EXPECTED_COLUMNS.map((colName, idx) => (
              <span
                key={idx}
                className="text-[10px] font-bold px-2 py-0.5 bg-[#F8F6F0] text-[#2D2D2D] border border-[#2D2D2D]"
              >
                {colName}
              </span>
            ))}
          </div>
        </div>

        {/* Cấu hình cự ly áp dụng Áo Finisher */}
        <div className="p-4 bg-[#E5E2D9] border border-[#2D2D2D] space-y-2.5 font-mono">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-[#2D2D2D] uppercase tracking-wider flex items-center gap-2">
              <Shirt className="w-4 h-4 text-[#2D2D2D]" />
              CẤU HÌNH CỰ LY ÁP DỤNG ÁO FINISHER (BẮT BUỘC NHẬP SIZE ÁO FINISHER):
            </span>
            <span className="text-[10px] text-stone-700 italic">
              * Chỉ các cự ly được chọn bên dưới mới bắt lỗi thiếu Size Áo Finisher
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            {['5km', '10km', '21km', '42km'].map((dist) => {
              const isChecked = finisherDistances.includes(dist);
              return (
                <label
                  key={dist}
                  className={`flex items-center gap-2 px-3 py-1.5 border text-xs font-bold cursor-pointer transition-colors ${
                    isChecked
                      ? 'bg-[#2D2D2D] text-[#F8F6F0] border-[#2D2D2D]'
                      : 'bg-[#F8F6F0] text-[#2D2D2D] border-[#2D2D2D] hover:bg-white'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleFinisherDistance(dist)}
                    className="accent-[#2D2D2D] w-4 h-4 cursor-pointer"
                  />
                  <span>CỰ LY {dist}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Excel Drag & Drop Upload Zone */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border border-dashed border-[#2D2D2D] bg-[#F8F6F0] hover:bg-[#E5E2D9] p-6 text-center transition-colors cursor-pointer group"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="p-3 bg-[#E5E2D9] border border-[#2D2D2D] group-hover:bg-[#2D2D2D] group-hover:text-[#F8F6F0] transition-colors">
              <Upload className="w-5 h-5 text-[#2D2D2D] group-hover:text-[#F8F6F0]" />
            </div>
            <div>
              <p className="text-xs font-mono font-bold text-[#2D2D2D]">
                Kéo thả File Excel (19 cột) vào đây hoặc <span className="underline">bấm để chọn file</span>
              </p>
              <p className="text-[11px] font-mono text-stone-600 mt-1">
                Tự động kiểm tra và báo cáo lỗi theo 30 quy tắc validation đầu vào
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons: Download Sample Excel / Quick Test Sample */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono pt-1">
          <button
            type="button"
            onClick={handleDownloadSampleExcel}
            className="px-3.5 py-2 bg-[#E5E2D9] hover:bg-[#2D2D2D] hover:text-[#F8F6F0] text-[#2D2D2D] font-bold border border-[#2D2D2D] transition-colors flex items-center gap-2 cursor-pointer text-[11px] uppercase tracking-wider"
          >
            <Download className="w-3.5 h-3.5" />
            <span>TẢI FILE EXCEL MẪU 19 CỘT (.XLSX)</span>
          </button>

          <button
            type="button"
            onClick={handleLoadSampleData}
            className="px-3.5 py-2 bg-[#F8F6F0] hover:bg-[#2D2D2D] hover:text-[#F8F6F0] text-[#2D2D2D] font-bold border border-[#2D2D2D] transition-colors flex items-center gap-2 cursor-pointer text-[11px] uppercase tracking-wider"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>THỬ DỮ LIỆU MẪU (ĐÃ VALIDATE)</span>
          </button>
        </div>

        {/* LỖI CẤU TRÚC CỘT FILE EXCEL (CẤM NHẬP NẾU SAI 19 CỘT TIÊU CHUẨN) */}
        {headerValidationErrors.length > 0 && (
          <div className="p-4 bg-rose-50 border-2 border-rose-600 font-mono space-y-3">
            <div className="flex items-center gap-2 font-bold text-rose-900 text-xs uppercase">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
              <span>LỖI VALIDATE CẤU TRÚC CỘT (FILE EXCEL KHÔNG ĐÚNG 19 CỘT THEO THỨ TỰ)</span>
            </div>
            <p className="text-xs text-rose-800 font-sans">
              Hệ thống bắt buộc file Excel phải chứa <strong>đúng 19 cột tiêu chuẩn theo đúng thứ tự</strong> (không được thiếu hay thừa các cột khác). Vui lòng điều chỉnh lại tiêu đề file theo báo cáo chi tiết dưới đây:
            </p>
            <div className="bg-white p-3 border border-rose-300 space-y-1.5 max-h-60 overflow-y-auto">
              {headerValidationErrors.map((err, idx) => (
                <div key={idx} className="flex items-start gap-2 text-[11px] text-rose-900">
                  <span className="font-bold text-rose-600 font-mono shrink-0">•</span>
                  <span>{err}</span>
                </div>
              ))}
            </div>
            <div className="pt-1 flex items-center justify-between text-[11px] text-rose-800 font-sans">
              <span>💡 Bạn có thể bấm <strong>"TẢI FILE EXCEL MẪU 19 CỘT (.XLSX)"</strong> ở trên để tải form mẫu chuẩn.</span>
            </div>
          </div>
        )}

        {/* VALIDATION REPORT BANNER & ACTIONS */}
        {parsedRows.length > 0 && (
          <div className="space-y-4 pt-2">
            {/* Status Summary Card */}
            <div
              className={`p-4 border border-[#2D2D2D] font-mono space-y-3 ${
                invalidRowsCount > 0 ? 'bg-rose-50' : 'bg-emerald-50'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-bold text-xs">
                  {invalidRowsCount > 0 ? (
                    <ShieldAlert className="w-5 h-5 text-rose-600" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 text-emerald-700" />
                  )}
                  <span className={`uppercase font-serif ${invalidRowsCount > 0 ? 'text-rose-900' : 'text-emerald-900'}`}>
                    {invalidRowsCount > 0
                      ? `KẾT QUẢ KIỂM TRA: PHÁT HIỆN ${invalidRowsCount}/${parsedRows.length} DÒNG KHÔNG HỢP LỆ`
                      : `KẾT QUẢ KIỂM TRA: TẤT CẢ ${validRowsCount}/${parsedRows.length} DÒNG ĐỀU HỢP LỆ (100% SUCCESS)`}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowJsonModal(true)}
                  className="px-3 py-1.5 bg-[#2D2D2D] hover:bg-[#F8F6F0] hover:text-[#2D2D2D] text-[#F8F6F0] text-[11px] font-bold border border-[#2D2D2D] transition-colors flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
                >
                  <FileJson className="w-3.5 h-3.5" />
                  <span>XEM CẤU TRÚC JSON VALIDATION (OUTPUT)</span>
                </button>
              </div>

              {invalidRowsCount > 0 && (
                <div className="text-xs text-rose-800 space-y-2 bg-white/80 p-3 border border-rose-200">
                  <p className="font-bold">
                    ⚠️ Bạn phải sửa các lỗi dữ liệu bên dưới hoặc XÓA dòng lỗi mới có thể ghi dữ liệu vào Google Sheet:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-[11px]">
                    {parsedRows.map((row, idx) => {
                      if (row.validationOutput?.status === 'ERROR') {
                        return (
                          <li key={row.id} className="text-rose-900 font-bold">
                            Dòng {idx + 1} [{row.hoTen || 'Chưa nhập tên'}]:{' '}
                            {row.validationOutput.errors?.map((e) => `[${e.field}] ${e.message}`).join(' | ')}
                          </li>
                        );
                      }
                      return null;
                    })}
                  </ul>
                </div>
              )}
            </div>

            {/* Table Header Controls */}
            <div className="flex items-center justify-between font-mono">
              <div className="flex items-center gap-2">
                <Table className="w-4 h-4 text-[#2D2D2D]" />
                <h3 className="text-xs font-bold text-[#2D2D2D] uppercase tracking-wider font-serif">
                  DANH SÁCH BẢNG ({parsedRows.length} DÒNG | {validRowsCount} HỢP LỆ - {invalidRowsCount} LỖI)
                </h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  setParsedRows([]);
                  setFileName('');
                }}
                className="text-xs text-stone-600 hover:text-[#2D2D2D] flex items-center gap-1 cursor-pointer font-bold uppercase tracking-wider"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>XÓA BẢNG</span>
              </button>
            </div>

            {/* Table Container */}
            <div className="border border-[#2D2D2D] overflow-x-auto max-h-80 bg-[#F8F6F0]">
              <table className="w-full text-[11px] text-left text-[#2D2D2D] whitespace-nowrap min-w-[1600px] font-mono border-collapse">
                <thead className="bg-[#2D2D2D] text-[#F8F6F0] font-bold uppercase tracking-wider sticky top-0 z-10">
                  <tr className="border-b border-[#2D2D2D]">
                    <th className="px-3 py-2.5 w-10 text-center sticky left-0 bg-[#2D2D2D] z-20 border-r border-[#E0DDD5]/20">#</th>
                    <th className="px-3 py-2.5 sticky left-10 bg-[#2D2D2D] z-20 border-r border-[#E0DDD5]/20">TRẠNG THÁI VALIDATION</th>
                    <th className="px-3 py-2.5 border-r border-[#E0DDD5]/20">STT</th>
                    <th className="px-3 py-2.5 border-r border-[#E0DDD5]/20">HỌ TÊN</th>
                    <th className="px-3 py-2.5 border-r border-[#E0DDD5]/20">EMAIL</th>
                    <th className="px-3 py-2.5 border-r border-[#E0DDD5]/20">TÊN TRÊN BIB</th>
                    <th className="px-3 py-2.5 border-r border-[#E0DDD5]/20">CỰ LY</th>
                    <th className="px-3 py-2.5 border-r border-[#E0DDD5]/20">GIỚI TÍNH</th>
                    <th className="px-3 py-2.5 border-r border-[#E0DDD5]/20">NĂM SINH (DOB)</th>
                    <th className="px-3 py-2.5 border-r border-[#E0DDD5]/20">SĐT</th>
                    <th className="px-3 py-2.5 border-r border-[#E0DDD5]/20">CCCD/PASSPORT</th>
                    <th className="px-3 py-2.5 border-r border-[#E0DDD5]/20">QUỐC TỊCH</th>
                    <th className="px-3 py-2.5 border-r border-[#E0DDD5]/20">TỈNH THÀNH</th>
                    <th className="px-3 py-2.5 border-r border-[#E0DDD5]/20">LOẠI ÁO</th>
                    <th className="px-3 py-2.5 border-r border-[#E0DDD5]/20">CỠ ÁO</th>
                    <th className="px-3 py-2.5 border-r border-[#E0DDD5]/20">CỠ ÁO FINISHER</th>
                    <th className="px-3 py-2.5 border-r border-[#E0DDD5]/20">SỐ TIỀN</th>
                    <th className="px-3 py-2.5 border-r border-[#E0DDD5]/20">THÀNH TÍCH</th>
                    <th className="px-3 py-2.5 border-r border-[#E0DDD5]/20">NGƯỜI LH KHẨN CẤP</th>
                    <th className="px-3 py-2.5 border-r border-[#E0DDD5]/20">SĐT LH KHẨN CẤP</th>
                    <th className="px-3 py-2.5 border-r border-[#E0DDD5]/20">GHI CHÚ</th>
                    <th className="px-3 py-2.5 text-center sticky right-0 bg-[#2D2D2D] z-20">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E0DDD5]">
                  {parsedRows.map((row, idx) => {
                    const isError = row.validationOutput?.status === 'ERROR';
                    const errors = row.validationOutput?.errors || [];

                    return (
                      <tr
                        key={row.id}
                        className={`transition-colors ${
                          isError ? 'bg-rose-100/70 hover:bg-rose-200/80' : 'hover:bg-[#E5E2D9]'
                        }`}
                      >
                        <td className="px-3 py-2 text-center text-stone-600 sticky left-0 bg-inherit border-r border-[#E0DDD5]">
                          {idx + 1}
                        </td>

                        {/* TRẠNG THÁI VALIDATION */}
                        <td className="px-3 py-2 sticky left-10 bg-inherit z-10 border-r border-[#E0DDD5]">
                          {isError ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-200 px-2 py-0.5 border border-rose-400">
                                <XCircle className="w-3 h-3 text-rose-700 flex-shrink-0" />
                                LỖI ({errors.length})
                              </span>
                              <span className="text-[9px] text-rose-700 font-sans line-clamp-1 max-w-[180px]" title={errors.map(e => e.message).join('\n')}>
                                {errors[0]?.message}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                              SUCCESS
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-2 border-r border-[#E0DDD5] text-stone-600">{row.stt || '-'}</td>
                        <td className="px-3 py-2 font-bold text-[#2D2D2D] font-serif border-r border-[#E0DDD5]">
                          {row.hoTen || <span className="text-rose-600 italic">Thiếu</span>}
                        </td>
                        <td className="px-3 py-2 border-r border-[#E0DDD5]">{row.email || <span className="text-rose-600 italic">Thiếu</span>}</td>
                        <td className="px-3 py-2 font-bold text-[#2D2D2D] border-r border-[#E0DDD5]">{row.tenTrenBib || <span className="text-rose-600 italic">Thiếu</span>}</td>
                        <td className="px-3 py-2 font-bold border-r border-[#E0DDD5]">{row.cuLy || <span className="text-rose-600 italic">Thiếu</span>}</td>
                        <td className="px-3 py-2 border-r border-[#E0DDD5]">{row.gioiTinh || <span className="text-rose-600 italic">Thiếu</span>}</td>
                        <td className="px-3 py-2 border-r border-[#E0DDD5]">{row.namSinh || <span className="text-rose-600 italic">Thiếu</span>}</td>
                        <td className="px-3 py-2 border-r border-[#E0DDD5]">{row.sdt || <span className="text-rose-600 italic">Thiếu</span>}</td>
                        <td className="px-3 py-2 border-r border-[#E0DDD5]">{row.cccd || <span className="text-rose-600 italic">Thiếu</span>}</td>
                        <td className="px-3 py-2 border-r border-[#E0DDD5]">
                          {row.quocTich ? (
                            <span>{row.quocTich}</span>
                          ) : (
                            <span className="text-stone-500 italic">Việt Nam (Mặc định)</span>
                          )}
                        </td>
                        <td className="px-3 py-2 border-r border-[#E0DDD5]">{row.tinhThanh || '-'}</td>
                        <td className="px-3 py-2 font-bold border-r border-[#E0DDD5]">
                          {row.loaiAo ? (
                            <span className={row.loaiAo === 'SINGLET' ? 'text-amber-700 bg-amber-100 px-1.5 py-0.5 border border-amber-300' : 'text-blue-800 bg-blue-100 px-1.5 py-0.5 border border-blue-300'}>
                              {row.loaiAo}
                            </span>
                          ) : (
                            <span className="text-rose-600 italic">Thiếu</span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-bold border-r border-[#E0DDD5]">{row.coAo || <span className="text-rose-600 italic">Thiếu</span>}</td>
                        <td className="px-3 py-2 font-bold border-r border-[#E0DDD5]">{row.coAoFinisher || <span className="text-rose-600 italic">Thiếu</span>}</td>
                        <td className="px-3 py-2 font-bold border-r border-[#E0DDD5]">{row.soTien || '-'}</td>
                        <td className="px-3 py-2 border-r border-[#E0DDD5]">{row.thanhTich || '-'}</td>
                        <td className="px-3 py-2 border-r border-[#E0DDD5]">{row.nguoiLienHeKhanCap || <span className="text-rose-600 italic">Thiếu</span>}</td>
                        <td className="px-3 py-2 border-r border-[#E0DDD5]">{row.sdtLienHeKhanCap || <span className="text-rose-600 italic">Thiếu</span>}</td>
                        <td className="px-3 py-2 text-stone-600 italic border-r border-[#E0DDD5]">{row.ghiChu || '-'}</td>

                        {/* THAO TÁC */}
                        <td className="px-3 py-2 text-center sticky right-0 bg-inherit">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStartEditRow(row)}
                              title="Sửa dòng này"
                              className="p-1 bg-[#2D2D2D] text-[#F8F6F0] hover:bg-stone-700 transition-colors border border-[#2D2D2D]"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(row.id)}
                              title="Xóa dòng này"
                              className="p-1 bg-rose-700 text-[#F8F6F0] hover:bg-rose-900 transition-colors border border-rose-900"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Status Banner */}
        <StatusBanner
          status={status}
          message={statusMessage}
          details={statusDetails}
          onClose={() => setStatus('idle')}
        />

        {/* Submit Excel Data Button */}
        <button
          type="button"
          onClick={handleSubmitBatch}
          disabled={status === 'loading' || parsedRows.length === 0 || invalidRowsCount > 0}
          className="w-full py-3.5 px-4 bg-[#2D2D2D] hover:bg-[#E5E2D9] hover:text-[#2D2D2D] disabled:bg-stone-300 disabled:text-stone-500 text-[#F8F6F0] font-mono font-bold text-xs uppercase tracking-widest border border-[#2D2D2D] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#F8F6F0]" />
              <span>ĐANG GỬI DỮ LIỆU...</span>
            </>
          ) : invalidRowsCount > 0 ? (
            <>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>KHÔNG THỂ GỬI: CÓ {invalidRowsCount} DÒNG KHÔNG HỢP LỆ (SỬA HOẶC XÓA ĐỂ GỬI)</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4 text-[#F8F6F0]" />
              <span>GỬI DỮ LIỆU EXCEL VÀO GOOGLE SHEET ({validRowsCount} DÒNG HỢP LỆ)</span>
            </>
          )}
        </button>

        {/* Last Batch Result Toast */}
        {lastBatchResult && status === 'success' && (
          <div className="p-5 bg-[#F8F6F0] border border-[#2D2D2D] space-y-3 font-mono">
            <div className="flex items-center gap-2 text-[#2D2D2D] font-bold text-xs uppercase font-serif">
              <CheckCircle2 className="w-4 h-4 text-[#2D2D2D] flex-shrink-0" />
              <span>GHI 19 CỘT DỮ LIỆU VÀO GOOGLE SHEET THÀNH CÔNG!</span>
            </div>
            <div className="text-xs text-[#2D2D2D] bg-[#E5E2D9] p-4 border border-[#2D2D2D] space-y-1.5">
              <div>
                <span className="text-stone-600">Số dòng đã ghi: </span>
                <strong className="text-[#2D2D2D] font-bold">{lastBatchResult.successCount} vận động viên</strong>
              </div>
              <div>
                <span className="text-stone-600">Thời gian ghi: </span>
                <span className="font-bold">{lastBatchResult.timestamp}</span>
              </div>
            </div>

            {/* 2 Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1 font-mono">
              <a
                href="https://drive.google.com/drive/folders/1Kjc3UYkNkYaHJQ6JrLZX15QPPWfZEaLZ"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-[#2D2D2D] hover:bg-[#E5E2D9] hover:text-[#2D2D2D] text-[#F8F6F0] text-xs font-bold flex items-center gap-2 border border-[#2D2D2D] transition-colors uppercase tracking-wider"
              >
                <Folder className="w-4 h-4" />
                <span>1/ VÀO FOLDER DRIVE</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <a
                href={selectedEvent?.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${lastBatchResult.spreadsheetId}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-[#E5E2D9] hover:bg-[#2D2D2D] hover:text-[#F8F6F0] text-[#2D2D2D] text-xs font-bold flex items-center gap-2 border border-[#2D2D2D] transition-colors uppercase tracking-wider"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>2/ MỞ FILE SHEET</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* Danh sách 30 Quy tắc Validation ở cuối Bước 2 */}
        <div className="pt-3 border-t border-stone-300/60 font-mono">
          <button
            type="button"
            onClick={() => setShowValidationRulesList(!showValidationRulesList)}
            className="w-full py-2.5 px-3 bg-[#E5E2D9]/70 hover:bg-[#E5E2D9] text-[#2D2D2D] text-xs font-bold border border-[#2D2D2D]/40 transition-colors flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-stone-700" />
              <span>DANH SÁCH 30 QUY TẮC VALIDATION & CHUẨN HÓA DỮ LIỆU (19 CỘT)</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-stone-600">
              <span>{showValidationRulesList ? 'Thu gọn' : 'Xem chi tiết'}</span>
              {showValidationRulesList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {showValidationRulesList && (
            <div className="p-4 bg-stone-100/80 border border-stone-300 text-stone-600 text-[11px] leading-relaxed space-y-3.5 mt-2 font-sans">
              <p className="text-stone-500 italic font-mono text-[10.5px]">
                * Hệ thống tự động kiểm tra và chuẩn hóa dữ liệu đầu vào khi bạn tải file Excel lên. Dưới đây là chi tiết 30 quy tắc validation được áp dụng cho 19 cột tiêu chuẩn:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Nhóm 1 */}
                <div className="p-3 bg-white/80 border border-stone-200/80 space-y-1.5">
                  <h5 className="font-bold text-[#2D2D2D] uppercase text-[11px] border-b border-stone-200 pb-1 font-mono">
                    👤 1. THÔNG TIN CÁ NHÂN (HỌ TÊN, EMAIL, BIB)
                  </h5>
                  <ul className="list-disc pl-4 space-y-1 text-stone-600">
                    <li><strong>1. HỌ TÊN:</strong> Bắt buộc nhập.</li>
                    <li><strong>2. HỌ TÊN cấu trúc:</strong> Tối thiểu 2 từ (Họ + Tên).</li>
                    <li><strong>3. HỌ TÊN ký tự:</strong> Chỉ chứa chữ cái và khoảng trắng.</li>
                    <li><strong>4. EMAIL:</strong> Bắt buộc nhập.</li>
                    <li><strong>5. EMAIL cấu trúc:</strong> Phải đúng định dạng chuẩn (user@domain.com).</li>
                    <li><strong>6. TÊN TRÊN BIB:</strong> Bắt buộc nhập.</li>
                    <li><strong>7. TÊN TRÊN BIB độ dài:</strong> Tối đa 20 ký tự.</li>
                    <li><strong>8. TÊN TRÊN BIB ký tự:</strong> Chỉ cho phép chữ cái, số và khoảng trắng.</li>
                  </ul>
                </div>

                {/* Nhóm 2 */}
                <div className="p-3 bg-white/80 border border-stone-200/80 space-y-1.5">
                  <h5 className="font-bold text-[#2D2D2D] uppercase text-[11px] border-b border-stone-200 pb-1 font-mono">
                    🏃 2. CỰ LY, GIỚI TÍNH & ĐỘ TUỔI
                  </h5>
                  <ul className="list-disc pl-4 space-y-1 text-stone-600">
                    <li><strong>9. CỰ LY:</strong> Bắt buộc nhập (5km, 10km, 21km, 42km).</li>
                    <li><strong>10. GIỚI TÍNH:</strong> Bắt buộc nhập (Nam / Nữ).</li>
                    <li><strong>11. NĂM SINH / NGÀY SINH:</strong> Bắt buộc nhập.</li>
                    <li><strong>12. QUY CHUẨN NĂM SINH:</strong> Tự chuẩn hóa dd/mm/yyyy từ chuỗi, năm sinh, số Excel.</li>
                    <li><strong>13. TUỔI CỰ LY 42KM:</strong> Bắt buộc từ 18 tuổi trở lên.</li>
                    <li><strong>14. TUỔI CỰ LY 21KM:</strong> Bắt buộc từ 16 tuổi trở lên.</li>
                    <li><strong>15. TUỔI CỰ LY 10KM & 5KM:</strong> 10km từ 12 tuổi; 5km từ 4 tuổi.</li>
                  </ul>
                </div>

                {/* Nhóm 3 */}
                <div className="p-3 bg-white/80 border border-stone-200/80 space-y-1.5">
                  <h5 className="font-bold text-[#2D2D2D] uppercase text-[11px] border-b border-stone-200 pb-1 font-mono">
                    🪪 3. ĐỊNH DANH & SĐT CÁ NHÂN
                  </h5>
                  <ul className="list-disc pl-4 space-y-1 text-stone-600">
                    <li><strong>16. SĐT cá nhân:</strong> Bắt buộc nhập.</li>
                    <li><strong>17. CHUẨN HÓA SĐT:</strong> Xóa khoảng trắng/dấu/đuôi .0 Excel; tự thêm số 0 nếu 9 số (10-11 số).</li>
                    <li><strong>18. CCCD / CMND / PASSPORT:</strong> Bắt buộc nhập.</li>
                    <li><strong>19. CCCD định dạng:</strong> Phải đủ 9-12 chữ số hoặc mã Hộ chiếu hợp lệ.</li>
                    <li><strong>20. QUỐC TỊCH:</strong> Tự động gán "Việt Nam" nếu bỏ trống.</li>
                    <li><strong>21. TỈNH THÀNH:</strong> Cho phép bỏ trống hoặc nhập tự do.</li>
                  </ul>
                </div>

                {/* Nhóm 4 */}
                <div className="p-3 bg-white/80 border border-stone-200/80 space-y-1.5">
                  <h5 className="font-bold text-[#2D2D2D] uppercase text-[11px] border-b border-stone-200 pb-1 font-mono">
                    👕 4. ÁO EVENT & ÁO FINISHER
                  </h5>
                  <ul className="list-disc pl-4 space-y-1 text-stone-600">
                    <li><strong>22. CỠ ÁO EVENT:</strong> Bắt buộc nhập (2XS, XS, S, M, L, XL, 2XL).</li>
                    <li><strong>23. LOẠI ÁO:</strong> Tự gán "TSHIRT" nếu trống. Chỉ nhận TSHIRT hoặc SINGLET.</li>
                    <li><strong>24. CỠ ÁO FINISHER:</strong> Bắt buộc nhập nếu chạy cự ly áp dụng Áo Finisher (21km/42km).</li>
                  </ul>
                </div>

                {/* Nhóm 5 */}
                <div className="p-3 bg-white/80 border border-stone-200/80 space-y-1.5 col-span-1 md:col-span-2">
                  <h5 className="font-bold text-[#2D2D2D] uppercase text-[11px] border-b border-stone-200 pb-1 font-mono">
                    🚨 5. SỐ TIỀN, THÀNH TÍCH & NGƯỜI LIÊN HỆ KHẨN CẤP
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <ul className="list-disc pl-4 space-y-1 text-stone-600">
                      <li><strong>25. SỐ TIỀN:</strong> Tự do / Số nguyên dương.</li>
                      <li><strong>26. THÀNH TÍCH (PR/PB):</strong> Tự quy chuẩn về dạng hh:mm (24h) từ 12:45 AM, 1h45m, v.v.</li>
                      <li><strong>27. NGƯỜI LH KHẨN CẤP:</strong> Bắt buộc nhập.</li>
                    </ul>
                    <ul className="list-disc pl-4 space-y-1 text-stone-600">
                      <li><strong>28. KHÔNG TRÙNG TÊN:</strong> Tên Người khẩn cấp không trùng với Tên VĐV.</li>
                      <li><strong>29. SĐT LH KHẨN CẤP:</strong> Bắt buộc nhập (10-11 số).</li>
                      <li><strong>30. KHÔNG TRÙNG SĐT:</strong> SĐT Khẩn cấp không trùng với SĐT cá nhân của VĐV.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL XEM CẤU TRÚC JSON VALIDATION (OUTPUT) */}
      {showJsonModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#F8F6F0] border border-[#2D2D2D] max-w-3xl w-full max-h-[85vh] flex flex-col font-mono">
            <div className="bg-[#2D2D2D] text-[#F8F6F0] p-4 flex items-center justify-between border-b border-[#2D2D2D]">
              <div className="flex items-center gap-2 font-serif font-bold text-sm">
                <FileJson className="w-4 h-4 text-[#F8F6F0]" />
                <span>CẤU TRÚC JSON VALIDATION OUTPUT</span>
              </div>
              <button
                onClick={() => setShowJsonModal(false)}
                className="p-1 text-[#F8F6F0] hover:text-[#E5E2D9] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-stone-700">
                  Định dạng JSON trả về cho từng dòng theo đúng quy tắc (SUCCESS / ERROR):
                </p>

                <button
                  onClick={handleCopyJson}
                  className="px-3 py-1 bg-[#2D2D2D] hover:bg-stone-700 text-[#F8F6F0] text-xs font-bold flex items-center gap-1.5 border border-[#2D2D2D]"
                >
                  {copiedJson ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedJson ? 'ĐÃ COPY' : 'COPY JSON'}</span>
                </button>
              </div>

              <pre className="p-4 bg-[#2D2D2D] text-emerald-400 text-xs overflow-x-auto rounded border border-[#2D2D2D] leading-relaxed">
                {JSON.stringify(fullValidationJsonOutput, null, 2)}
              </pre>
            </div>

            <div className="p-3 bg-[#E5E2D9] border-t border-[#2D2D2D] text-right">
              <button
                onClick={() => setShowJsonModal(false)}
                className="px-4 py-2 bg-[#2D2D2D] text-[#F8F6F0] text-xs font-bold uppercase border border-[#2D2D2D]"
              >
                ĐÓNG
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHỈNH SỬA DÒNG NGUYÊN BẢN */}
      {editingRow && editFormData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#F8F6F0] border border-[#2D2D2D] max-w-2xl w-full max-h-[90vh] flex flex-col font-mono">
            <div className="bg-[#2D2D2D] text-[#F8F6F0] p-4 flex items-center justify-between border-b border-[#2D2D2D]">
              <div className="flex items-center gap-2 font-serif font-bold text-sm">
                <Edit3 className="w-4 h-4 text-[#F8F6F0]" />
                <span>CHỈNH SỬA THÔNG TIN VẬN ĐỘNG VIÊN (19 CỘT)</span>
              </div>
              <button
                onClick={() => {
                  setEditingRow(null);
                  setEditFormData(null);
                }}
                className="p-1 text-[#F8F6F0] hover:text-[#E5E2D9] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedRow} className="p-4 flex-1 overflow-y-auto space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. STT */}
                <div>
                  <label className="font-bold block mb-1">1. STT</label>
                  <input
                    type="text"
                    value={editFormData.stt || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, stt: e.target.value })}
                    className="w-full p-2 bg-white border border-[#2D2D2D]"
                    placeholder="Ví dụ: 1"
                  />
                </div>

                {/* 2. HỌ TÊN */}
                <div>
                  <label className="font-bold block mb-1">2. HỌ TÊN *</label>
                  <input
                    type="text"
                    value={editFormData.hoTen}
                    onChange={(e) => setEditFormData({ ...editFormData, hoTen: e.target.value })}
                    className="w-full p-2 bg-white border border-[#2D2D2D]"
                    placeholder="Ví dụ: Nguyễn Văn A"
                    required
                  />
                </div>

                {/* 3. EMAIL */}
                <div>
                  <label className="font-bold block mb-1">3. EMAIL *</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full p-2 bg-white border border-[#2D2D2D]"
                    placeholder="example@gmail.com"
                    required
                  />
                </div>

                {/* 4. TÊN TRÊN BIB */}
                <div>
                  <label className="font-bold block mb-1">4. TÊN TRÊN BIB *</label>
                  <input
                    type="text"
                    value={editFormData.tenTrenBib}
                    onChange={(e) => setEditFormData({ ...editFormData, tenTrenBib: e.target.value })}
                    className="w-full p-2 bg-white border border-[#2D2D2D]"
                    placeholder="Tối đa 20 ký tự"
                    required
                  />
                </div>

                {/* 5. CỰ LY */}
                <div>
                  <label className="font-bold block mb-1">5. CỰ LY * (5km, 10km, 21km, 42km)</label>
                  <select
                    value={editFormData.cuLy}
                    onChange={(e) => setEditFormData({ ...editFormData, cuLy: e.target.value })}
                    className="w-full p-2 bg-white border border-[#2D2D2D]"
                  >
                    <option value="5km">5km</option>
                    <option value="10km">10km</option>
                    <option value="21km">21km</option>
                    <option value="42km">42km</option>
                  </select>
                </div>

                {/* 6. GIỚI TÍNH */}
                <div>
                  <label className="font-bold block mb-1">6. GIỚI TÍNH *</label>
                  <select
                    value={editFormData.gioiTinh}
                    onChange={(e) => setEditFormData({ ...editFormData, gioiTinh: e.target.value })}
                    className="w-full p-2 bg-white border border-[#2D2D2D]"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>

                {/* 7. NĂM SINH */}
                <div>
                  <label className="font-bold block mb-1">7. NĂM SINH (dd/mm/yyyy) *</label>
                  <input
                    type="text"
                    value={editFormData.namSinh}
                    onChange={(e) => setEditFormData({ ...editFormData, namSinh: e.target.value })}
                    className="w-full p-2 bg-white border border-[#2D2D2D]"
                    placeholder="15/05/1995"
                    required
                  />
                </div>

                {/* 8. SĐT */}
                <div>
                  <label className="font-bold block mb-1">8. SĐT *</label>
                  <input
                    type="text"
                    value={editFormData.sdt}
                    onChange={(e) => setEditFormData({ ...editFormData, sdt: e.target.value })}
                    className="w-full p-2 bg-white border border-[#2D2D2D]"
                    placeholder="0901234567"
                    required
                  />
                </div>

                {/* 9. CCCD */}
                <div>
                  <label className="font-bold block mb-1">9. CCCD / PASSPORT *</label>
                  <input
                    type="text"
                    value={editFormData.cccd}
                    onChange={(e) => setEditFormData({ ...editFormData, cccd: e.target.value })}
                    className="w-full p-2 bg-white border border-[#2D2D2D]"
                    placeholder="9-12 chữ số"
                    required
                  />
                </div>

                {/* 10. QUỐC TỊCH */}
                <div>
                  <label className="font-bold block mb-1">10. QUỐC TỊCH</label>
                  <input
                    type="text"
                    value={editFormData.quocTich}
                    onChange={(e) => setEditFormData({ ...editFormData, quocTich: e.target.value })}
                    className="w-full p-2 bg-white border border-[#2D2D2D]"
                    placeholder="Việt Nam"
                  />
                </div>

                {/* 11. TỈNH THÀNH */}
                <div>
                  <label className="font-bold block mb-1">11. TỈNH THÀNH</label>
                  <input
                    type="text"
                    value={editFormData.tinhThanh}
                    onChange={(e) => setEditFormData({ ...editFormData, tinhThanh: e.target.value })}
                    className="w-full p-2 bg-white border border-[#2D2D2D]"
                    placeholder="Hà Nội"
                  />
                </div>

                {/* 12. LOẠI ÁO */}
                <div>
                  <label className="font-bold block mb-1">12. LOẠI ÁO (TSHIRT / SINGLET)</label>
                  <select
                    value={editFormData.loaiAo || 'TSHIRT'}
                    onChange={(e) => setEditFormData({ ...editFormData, loaiAo: e.target.value })}
                    className="w-full p-2 bg-white border border-[#2D2D2D]"
                  >
                    <option value="TSHIRT">TSHIRT (Áo phông - Mặc định)</option>
                    <option value="SINGLET">SINGLET (Áo ba lỗ)</option>
                  </select>
                </div>

                {/* 13. CỠ ÁO */}
                <div>
                  <label className="font-bold block mb-1">13. CỠ ÁO *</label>
                  <select
                    value={editFormData.coAo}
                    onChange={(e) => setEditFormData({ ...editFormData, coAo: e.target.value })}
                    className="w-full p-2 bg-white border border-[#2D2D2D]"
                  >
                    <option value="2XS">2XS</option>
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="2XL">2XL</option>
                  </select>
                </div>

                {/* 14. CỠ ÁO FINISHER */}
                <div>
                  <label className="font-bold block mb-1">14. CỠ ÁO FINISHER *</label>
                  <select
                    value={editFormData.coAoFinisher}
                    onChange={(e) => setEditFormData({ ...editFormData, coAoFinisher: e.target.value })}
                    className="w-full p-2 bg-white border border-[#2D2D2D]"
                  >
                    <option value="2XS">2XS</option>
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="2XL">2XL</option>
                  </select>
                </div>

                {/* 15. SỐ TIỀN */}
                <div>
                  <label className="font-bold block mb-1">15. SỐ TIỀN</label>
                  <input
                    type="text"
                    value={editFormData.soTien}
                    onChange={(e) => setEditFormData({ ...editFormData, soTien: e.target.value })}
                    className="w-full p-2 bg-white border border-[#2D2D2D]"
                    placeholder="500000"
                  />
                </div>

                {/* 16. THÀNH TÍCH */}
                <div>
                  <label className="font-bold block mb-1">16. THÀNH TÍCH (hh:mm)</label>
                  <input
                    type="text"
                    value={editFormData.thanhTich}
                    onChange={(e) => setEditFormData({ ...editFormData, thanhTich: e.target.value })}
                    className="w-full p-2 bg-white border border-[#2D2D2D]"
                    placeholder="01:45"
                  />
                </div>

                {/* 17. NGƯỜI LIÊN HỆ KHẨN CẤP */}
                <div>
                  <label className="font-bold block mb-1">17. NGƯỜI LH KHẨN CẤP *</label>
                  <input
                    type="text"
                    value={editFormData.nguoiLienHeKhanCap}
                    onChange={(e) => setEditFormData({ ...editFormData, nguoiLienHeKhanCap: e.target.value })}
                    className="w-full p-2 bg-white border border-[#2D2D2D]"
                    placeholder="Họ tên đầy đủ"
                    required
                  />
                </div>

                {/* 18. SĐT LIÊN HỆ KHẨN CẤP */}
                <div>
                  <label className="font-bold block mb-1">18. SĐT LH KHẨN CẤP *</label>
                  <input
                    type="text"
                    value={editFormData.sdtLienHeKhanCap}
                    onChange={(e) => setEditFormData({ ...editFormData, sdtLienHeKhanCap: e.target.value })}
                    className="w-full p-2 bg-white border border-[#2D2D2D]"
                    placeholder="SĐT người thân"
                    required
                  />
                </div>
              </div>

              {/* 19. GHI CHÚ */}
              <div>
                <label className="font-bold block mb-1">19. GHI CHÚ</label>
                <input
                  type="text"
                  value={editFormData.ghiChu}
                  onChange={(e) => setEditFormData({ ...editFormData, ghiChu: e.target.value })}
                  className="w-full p-2 bg-white border border-[#2D2D2D]"
                  placeholder="Ghi chú thêm"
                />
              </div>

              <div className="p-3 bg-[#E5E2D9] border-t border-[#2D2D2D] flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditingRow(null);
                    setEditFormData(null);
                  }}
                  className="px-4 py-2 bg-stone-300 hover:bg-stone-400 text-[#2D2D2D] font-bold border border-[#2D2D2D]"
                >
                  HỦY
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2D2D2D] hover:bg-stone-700 text-[#F8F6F0] font-bold border border-[#2D2D2D]"
                >
                  LƯU & KIỂM TRA LẠI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
