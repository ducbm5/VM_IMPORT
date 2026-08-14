export const GAS_CODE_GS = `/**
 * GOOGLE APPS SCRIPT - CODE.GS
 * Hệ thống tự động tạo Google Sheet theo Tên File & Import 18 Cột Dữ Liệu Sự Kiện / Giải Chạy
 * 
 * HƯỚNG DẪN TRIỂN KHAI:
 * 1. Truy cập https://script.google.com/ và tạo Dự án mới (New Project).
 * 2. Dán toàn bộ đoạn mã này vào tệp Code.gs.
 * 3. Nhấn "Triển khai" (Deploy) -> "Thực thi dưới dạng ứng dụng web" (New deployment -> Web app).
 * 4. Cấu hình triển khai:
 *    - Mô tả: Event Auto Connector (18 Fields)
 *    - Thực thi dưới danh nghĩa: "Tôi" (Me - account Google của bạn)
 *    - Ai có quyền truy cập: "Bất kỳ ai" (Anyone - để Web gọi API không bị chặn)
 * 5. Nhấn "Triển khai" (Deploy), cấp quyền truy cập khi được hỏi.
 * 6. Sao chép "URL ứng dụng Web" (Web App URL) và dán vào ô cấu hình trên Giao diện Web.
 */

// Hàm xử lý HTTP POST Request từ Fetch API
function doPost(e) {
  try {
    var data = {};
    
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    var action = data.action;
    var result = {};

    if (action === "CREATE_EVENT") {
      result = handleCreateEvent(data);
    } else if (action === "SUBMIT_FORM") {
      result = handleSubmitForm(data);
    } else if (action === "VERIFY_PASSWORD") {
      result = handleVerifyPassword(data);
    } else {
      result = { 
        success: false, 
        message: "Hành động (action) không hợp lệ: " + action 
      };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "Lỗi Server Google Apps Script: " + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Hàm xử lý HTTP GET (dành cho kiểm tra trực tiếp)
function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : null;
  
  if (!action) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "ACTIVE",
      message: "Google Apps Script Web App đang hoạt động tốt!",
      usage: "Gửi request POST tới URL này với payload { action: 'CREATE_EVENT' | 'SUBMIT_FORM', ... }"
    })).setMimeType(ContentService.MimeType.JSON);
  }

  return doPost(e);
}

/**
 * 1. ACTION: CREATE_EVENT
 * Tạo File Google Sheet mới và di chuyển vào Thư mục Google Drive chỉ định.
 */
function handleCreateEvent(data) {
  var fileName = data.requester || data.nguoiYeuCau || "Giải đấu mới";
  var folderId = data.folderId || "1Kjc3UYkNkYaHJQ6JrLZX15QPPWfZEaLZ";

  var spreadsheet = SpreadsheetApp.create(fileName);
  var spreadsheetId = spreadsheet.getId();
  var spreadsheetUrl = spreadsheet.getUrl();
  
  var isMovedToFolder = false;
  var folderErrorMsg = "";

  // Di chuyển File vừa tạo vào Thư mục Google Drive mục tiêu
  if (folderId) {
    try {
      var folder = DriveApp.getFolderById(folderId);
      var file = DriveApp.getFileById(spreadsheetId);
      
      // Cách 1: moveTo (Dành cho Google Drive cá nhân & V8 Runtime)
      if (typeof file.moveTo === "function") {
        file.moveTo(folder);
        isMovedToFolder = true;
      } else {
        folder.addFile(file);
        DriveApp.getRootFolder().removeFile(file);
        isMovedToFolder = true;
      }
    } catch (e1) {
      // Cách 2: Fallback addFile / removeFile (Dành cho một số loại tài khoản Drive)
      try {
        var folder2 = DriveApp.getFolderById(folderId);
        var file2 = DriveApp.getFileById(spreadsheetId);
        folder2.addFile(file2);
        DriveApp.getRootFolder().removeFile(file2);
        isMovedToFolder = true;
      } catch (e2) {
        folderErrorMsg = "Đã tạo File ở 'Drive của tôi', nhưng chưa vào Folder do lỗi: " + e2.toString();
        Logger.log(folderErrorMsg);
      }
    }
  }

  // 18 cột tiêu chuẩn chính xác theo yêu cầu
  var sheet = spreadsheet.getActiveSheet();
  sheet.setName("Danh sách đăng ký");

  var headers = [
    "Timestamp",
    "STT",
    "HỌ TÊN",
    "EMAIL",
    "TÊN TRÊN BIB",
    "CỰ LY",
    "GIỚI TÍNH",
    "NĂM SINH",
    "SĐT",
    "CCCD",
    "QUỐC TỊCH",
    "TỈNH THÀNH",
    "LOẠI ÁO",
    "CỠ ÁO",
    "CỠ ÁO FINISHER",
    "THÀNH TÍCH",
    "NGƯỜI LIÊN HỆ KHẨN CẤP",
    "SĐT LIÊN HỆ KHẨN CẤP",
    "GHI CHÚ"
  ];
  
  sheet.appendRow(headers);

  // Định dạng hàng tiêu đề
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground("#0f172a");
  headerRange.setFontColor("#ffffff");
  headerRange.setFontWeight("bold");
  headerRange.setHorizontalAlignment("center");
  sheet.setFrozenRows(1);

  for (var i = 1; i <= headers.length; i++) {
    sheet.setColumnWidth(i, 160);
  }

  var msg = isMovedToFolder
    ? "Đã tạo File '" + fileName + "' thành công trong Folder Drive!"
    : "Đã tạo File thành công ở Drive của tôi (" + folderErrorMsg + ")";

  return {
    success: true,
    message: msg,
    spreadsheetId: spreadsheetId,
    spreadsheetUrl: spreadsheetUrl,
    eventName: fileName,
    requester: fileName,
    folderId: folderId,
    folderUrl: "https://drive.google.com/drive/folders/" + folderId,
    isMovedToFolder: isMovedToFolder,
    folderErrorMsg: folderErrorMsg
  };
}

/**
 * HÀM TEST THỬ NGHIỆM TRỰC TIẾP TRÊN SCRIPT EDITOR
 * Chạy hàm này trên Google Apps Script để CẤP QUYỀN DRIVERAPP lần đầu tiên!
 */
function testCreateEvent() {
  var testResult = handleCreateEvent({
    requester: "File_Test_Folder_1Kjc3UYkNkYaHJQ6JrLZX15QPPWfZEaLZ",
    folderId: "1Kjc3UYkNkYaHJQ6JrLZX15QPPWfZEaLZ"
  });
  Logger.log(JSON.stringify(testResult));
}

/**
 * 2. ACTION: SUBMIT_FORM
 * Ghi danh sách 18 cột dữ liệu từ File Excel Import vào Google Sheet
 */
function handleSubmitForm(data) {
  var spreadsheetId = data.spreadsheetId;
  
  if (!spreadsheetId) {
    return { 
      success: false, 
      message: "Lỗi: Không tìm thấy Spreadsheet ID!" 
    };
  }

  var timestamp = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

  try {
    var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    var sheet = spreadsheet.getActiveSheet();

    var participantsList = data.participants || [];

    if (!Array.isArray(participantsList) || participantsList.length === 0) {
      return {
        success: false,
        message: "Lỗi: Dữ liệu danh sách rỗng!"
      };
    }

    // Mảng 2 chiều để append vào Sheet trong 1 thao tác duy nhất
    var rowsToAdd = [];
    for (var i = 0; i < participantsList.length; i++) {
      var p = participantsList[i];

      rowsToAdd.push([
        timestamp,
        p.stt || p["STT"] || p["Số TT"] || p["so tt"] || (i + 1),
        p.hoTen || p["HỌ TÊN"] || p["Họ tên"] || "",
        p.email || p["EMAIL"] || p["Email"] || "",
        p.tenTrenBib || p["TÊN TRÊN BIB"] || p["Tên trên BIB"] || "",
        p.cuLy || p["CỰ LY"] || p["Cự ly"] || "",
        p.gioiTinh || p["GIỚI TÍNH"] || p["Giới tính"] || "",
        p.namSinh || p["NĂM SINH"] || p["Năm sinh"] || "",
        p.sdt || p["SĐT"] || p["Sđt"] || p["Số điện thoại"] || "",
        p.cccd || p["CCCD"] || p["CMND/CCCD"] || "",
        p.quocTich || p["QUỐC TỊCH"] || p["Quốc tịch"] || "",
        p.tinhThanh || p["TỈNH THÀNH"] || p["Tỉnh thành"] || "",
        p.loaiAo || p["LOẠI ÁO"] || p["Loại áo"] || p["Loai ao"] || "",
        p.coAo || p["CỠ ÁO"] || p["Cỡ áo"] || "",
        p.coAoFinisher || p["CỠ ÁO FINISHER"] || p["Cỡ áo Finisher"] || "",
        p.thanhTich || p["THÀNH TÍCH"] || p["Thành tích"] || "",
        p.nguoiLienHeKhanCap || p["NGƯỜI LIÊN HỆ KHẨN CẤP"] || p["Người liên hệ khẩn cấp"] || "",
        p.sdtLienHeKhanCap || p["SĐT LIÊN HỆ KHẨN CẤP"] || p["SĐT liên hệ khẩn cấp"] || "",
        p.ghiChu || p["GHI CHÚ"] || p["Ghi chú"] || ""
      ]);
    }

    // Ghi hàng loạt vào Sheet
    var lastRow = sheet.getLastRow();
    var range = sheet.getRange(lastRow + 1, 1, rowsToAdd.length, 19);
    range.setValues(rowsToAdd);

    return {
      success: true,
      message: "Đã import thành công " + rowsToAdd.length + " hàng dữ liệu (18 cột) vào Google Sheet!",
      spreadsheetId: spreadsheetId,
      insertedCount: rowsToAdd.length,
      timestamp: timestamp
    };

  } catch (err) {
    return {
      success: false,
      message: "Không thể ghi dữ liệu vào Sheet (ID: " + spreadsheetId + "). Chi tiết lỗi: " + err.toString()
    };
  }
}

/**
 * 3. ACTION: VERIFY_PASSWORD
 * Kiểm tra mật khẩu truy cập bằng cách đọc từ File Google Sheet đặt mật khẩu (Ô A1)
 */
function handleVerifyPassword(data) {
  var passwordInput = (data.password || "").toString().trim();
  var passSpreadsheetId = (data.passwordSpreadsheetId || data.passSheetId || "").toString().trim();

  if (!passwordInput) {
    return {
      success: false,
      verified: false,
      message: "Vui lòng nhập mật khẩu!"
    };
  }

  // Trường hợp 1: Nếu người dùng cấu hình ID File Google Sheet chứa mật khẩu
  if (passSpreadsheetId) {
    try {
      var spreadsheet = SpreadsheetApp.openById(passSpreadsheetId);
      var sheet = spreadsheet.getSheetByName("PASS") || spreadsheet.getSheetByName("Password") || spreadsheet.getActiveSheet();
      var cellValue = sheet.getRange(1, 1).getValue(); // Đọc giá trị ô A1
      var expectedPassword = (cellValue !== null && cellValue !== undefined) ? cellValue.toString().trim() : "";

      if (!expectedPassword) {
        return {
          success: false,
          verified: false,
          message: "Lỗi: Ô A1 trong File Google Sheet Mật Khẩu (ID: " + passSpreadsheetId + ") đang để trống!"
        };
      }

      if (passwordInput === expectedPassword) {
        return {
          success: true,
          verified: true,
          message: "Xác thực thành công! Mật khẩu trùng khớp với dữ liệu từ Google Sheet."
        };
      } else {
        return {
          success: true,
          verified: false,
          message: "Mật khẩu không chính xác so với dữ liệu trong Google Sheet!"
        };
      }
    } catch (err) {
      return {
        success: false,
        verified: false,
        message: "Không thể mở File Google Sheet chứa mật khẩu (ID: " + passSpreadsheetId + "). Vui lòng kiểm tra lại ID File và quyền truy cập! Lỗi: " + err.toString()
      };
    }
  }

  // Trường hợp 2: Kiểm tra từ Script Properties nếu không nhập passSpreadsheetId
  try {
    var scriptPass = PropertiesService.getScriptProperties().getProperty("APP_PASSWORD");
    if (scriptPass && scriptPass.trim()) {
      if (passwordInput === scriptPass.trim()) {
        return {
          success: true,
          verified: true,
          message: "Xác thực thành công qua Script Properties!"
        };
      } else {
        return {
          success: true,
          verified: false,
          message: "Mật khẩu không chính xác!"
        };
      }
    }
  } catch (e) {}

  return {
    success: false,
    verified: false,
    message: "Chưa cấu hình ID File Google Sheet chứa mật khẩu! Vui lòng tạo File Google Sheet, đặt mật khẩu tại ô A1 và dán Spreadsheet ID vào cấu hình."
  };
}
`;

export const SETUP_STEPS = [
  {
    step: 1,
    title: "Mở Google Apps Script",
    desc: "Truy cập https://script.google.com và nhấn nút 'Dự án mới' (New project)."
  },
  {
    step: 2,
    title: "Dán Mã Nguồn Code.gs",
    desc: "Xóa mã cũ trong tệp Code.gs và dán toàn bộ đoạn mã Google Apps Script ở ô bên cạnh vào."
  },
  {
    step: 3,
    title: "Triển Khai Web App",
    desc: "Nhấn nút 'Triển khai' (Deploy) -> 'Thực thi dưới dạng ứng dụng web' (Web app). Đặt 'Tôi' (Me) & 'Bất kỳ ai' (Anyone)."
  },
  {
    step: 4,
    title: "Cấu Hình Vùng Nhận Mã",
    desc: "Sao chép Web App URL và dán vào ô 'URL Google Apps Script Web App' trong bảng điều khiển ứng dụng này."
  }
];
