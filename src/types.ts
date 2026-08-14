export interface EventItem {
  id: string;
  requester: string;
  eventName: string;
  spreadsheetId: string;
  spreadsheetUrl: string;
  createdAt: string;
}

export interface FieldError {
  field: string;
  message: string;
}

export interface ValidationOutput {
  status: 'SUCCESS' | 'ERROR';
  data?: ParticipantRecord;
  errors?: FieldError[];
}

export interface ParticipantRecord {
  stt: string;
  hoTen: string;
  email: string;
  tenTrenBib: string;
  cuLy: string;
  gioiTinh: string;
  namSinh: string;
  sdt: string;
  cccd: string;
  quocTich: string;
  tinhThanh: string;
  coAo: string;
  loaiAo: string;
  coAoFinisher: string;
  thanhTich: string;
  nguoiLienHeKhanCap: string;
  sdtLienHeKhanCap: string;
  ghiChu: string;
}

export interface ExcelRowItem extends ParticipantRecord {
  id: string;
  status?: 'pending' | 'success' | 'error';
  errorMessage?: string;
  validationOutput?: ValidationOutput;
}

export interface BatchRegistrationResult {
  total: number;
  successCount: number;
  errorCount: number;
  spreadsheetId: string;
  timestamp: string;
}

export interface GasApiResponse {
  success: boolean;
  verified?: boolean;
  message?: string;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  eventName?: string;
  requester?: string;
  insertedCount?: number;
  timestamp?: string;
  [key: string]: any;
}

export interface ApiLog {
  id: string;
  timestamp: string;
  action: 'CREATE_EVENT' | 'SUBMIT_FORM' | 'VERIFY_PASSWORD';
  payload: any;
  response: any;
  status: 'success' | 'error' | 'pending';
  mode: 'real' | 'mock';
}
