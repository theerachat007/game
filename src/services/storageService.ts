import * as XLSX from 'xlsx';
import {
  INITIAL_ASSETS,
  INITIAL_HISTORY,
  INITIAL_LOANS,
  INITIAL_SETTINGS,
} from '../data/initialData';
import {
  Asset,
  AssetHistoryRecord,
  AssetStatus,
  BorrowRecord,
  GoogleSheetsConfig,
  MasterItem,
  SystemSettingsState,
  UserAccount,
} from '../types';

const STORAGE_KEYS = {
  ASSETS: 'uni_assets_data_v1',
  HISTORY: 'uni_asset_history_v1',
  SETTINGS: 'uni_system_settings_v1',
  CURRENT_USER: 'uni_current_user_v1',
  SHEETS_CONFIG: 'uni_sheets_config_v1',
  LOANS: 'uni_loans_data_v1',
};

// Storage Helpers
export function loadSettings(): SystemSettingsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading settings:', e);
  }
  return INITIAL_SETTINGS;
}

export function saveSettings(settings: SystemSettingsState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings:', e);
  }
}

export function loadAssets(): Asset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ASSETS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading assets:', e);
  }
  return INITIAL_ASSETS;
}

export function saveAssets(assets: Asset[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets));
  } catch (e) {
    console.error('Error saving assets:', e);
  }
}

export function loadHistory(): AssetHistoryRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading history:', e);
  }
  return INITIAL_HISTORY;
}

export function saveHistory(history: AssetHistoryRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  } catch (e) {
    console.error('Error saving history:', e);
  }
}

export function loadLoans(): BorrowRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOANS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading loans:', e);
  }
  return INITIAL_LOANS;
}

export function saveLoans(loans: BorrowRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(loans));
  } catch (e) {
    console.error('Error saving loans:', e);
  }
}

export function loadCurrentUser(): UserAccount | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading current user:', e);
  }
  return null;
}

export function saveCurrentUser(user: UserAccount | null): void {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  } catch (e) {
    console.error('Error saving current user:', e);
  }
}

export function loadSheetsConfig(): GoogleSheetsConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SHEETS_CONFIG);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading sheets config:', e);
  }
  return null;
}

export function saveSheetsConfig(config: GoogleSheetsConfig | null): void {
  try {
    if (config) {
      localStorage.setItem(STORAGE_KEYS.SHEETS_CONFIG, JSON.stringify(config));
    } else {
      localStorage.removeItem(STORAGE_KEYS.SHEETS_CONFIG);
    }
  } catch (e) {
    console.error('Error saving sheets config:', e);
  }
}

// History logging helper
export function addHistoryLog(
  record: Omit<AssetHistoryRecord, 'id' | 'timestamp'>
): AssetHistoryRecord {
  const current = loadHistory();
  const newLog: AssetHistoryRecord = {
    ...record,
    id: 'hist-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    timestamp: new Date().toISOString(),
  };
  const updated = [newLog, ...current];
  saveHistory(updated);
  return newLog;
}

// Excel Export Functions
export function exportAssetsToExcel(assets: Asset[], fileName = 'รายการทรัพย์สินมหาวิทยาลัย.xlsx') {
  const data = assets.map((a, idx) => ({
    ลำดับ: idx + 1,
    รหัสทรัพย์สิน: a.assetCode,
    ชื่อทรัพย์สิน: a.name,
    ประเภทอุปกรณ์: a.typeName,
    วิทยาเขต: a.campusName,
    'สังกัด/คณะ': a.facultyName,
    'สาขา/หน่วยงาน': a.departmentName,
    อาคาร: a.buildingName,
    ชื่อห้อง: a.room,
    จำนวน: a.quantity,
    วันที่ซื้อ: a.purchaseDate,
    'ราคา (บาท)': a.price,
    สถานะ: a.status,
    หมายเหตุ: a.note || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'ทรัพย์สิน');
  XLSX.writeFile(workbook, fileName);
}

export function exportHistoryToExcel(history: AssetHistoryRecord[], fileName = 'ประวัติการเปลี่ยนแปลงทรัพย์สิน.xlsx') {
  const data = history.map((h, idx) => ({
    ลำดับ: idx + 1,
    รหัสทรัพย์สิน: h.assetCode,
    ชื่อทรัพย์สิน: h.assetName,
    วันเวลา: new Date(h.timestamp).toLocaleString('th-TH'),
    รายการ: h.actionLabel || h.action,
    สถานะเดิม: h.previousStatus || '-',
    สถานะใหม่: h.newStatus || '-',
    หมายเหตุ: h.note || '',
    ผู้ดำเนินการ: h.performedBy,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'ประวัติทรัพย์สิน');
  XLSX.writeFile(workbook, fileName);
}

export function exportLoansToExcel(loans: BorrowRecord[], fileName = 'รายงานการยืม-คืนทรัพย์สิน.xlsx') {
  const data = loans.map((l, idx) => ({
    ลำดับ: idx + 1,
    เลขที่เอกสาร: l.transactionNo,
    รหัสทรัพย์สิน: l.assetCode,
    ชื่อทรัพย์สิน: l.assetName,
    ประเภททรัพย์สิน: l.assetTypeName || '-',
    ชื่อผู้ยืม: l.borrowerName,
    รหัสประจำตัว: l.borrowerIdCode,
    ประเภทผู้ยืม:
      l.borrowerType === 'lecturer'
        ? 'อาจารย์'
        : l.borrowerType === 'student'
        ? 'นักศึกษา'
        : l.borrowerType === 'staff'
        ? 'เจ้าหน้าที่'
        : 'บุคคลภายนอก',
    'สังกัด/คณะ': l.borrowerFaculty,
    'สาขา/หน่วยงาน': l.borrowerDepartment || '-',
    เบอร์โทรศัพท์: l.borrowerPhone,
    อีเมล: l.borrowerEmail || '-',
    วันที่ยืม: l.borrowDate,
    กำหนดคืน: l.expectedReturnDate,
    วันที่คืนจริง: l.actualReturnDate || '-',
    สถานะการยืม:
      l.status === 'active'
        ? 'กำลังยืม'
        : l.status === 'overdue'
        ? 'เกินกำหนดคืน'
        : 'คืนเรียบร้อยแล้ว',
    วัตถุประสงค์การยืม: l.purpose,
    สถานที่นำไปใช้งาน: l.locationOfUse,
    สภาพตอนยืม: l.conditionOnBorrow,
    สภาพตอนคืน: l.conditionOnReturn || '-',
    ผู้อนุมัติ: l.approvedBy,
    ผู้รับคืน: l.receivedBy || '-',
    หมายเหตุ: l.notes || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'รายการยืม-คืน');
  XLSX.writeFile(workbook, fileName);
}

// Generate Excel Template for Import
export function generateSampleExcelTemplate() {
  const templateData = [
    {
      รหัสทรัพย์สิน: 'EQ-68-90001',
      ชื่อทรัพย์สิน: 'เครื่องคอมพิวเตอร์ Desktop Core i5',
      ประเภทอุปกรณ์: 'คอมพิวเตอร์และอุปกรณ์ไอที',
      วิทยาเขต: 'วิทยาเขตกรุงเทพมหานคร (หลัก)',
      'สังกัด/คณะ': 'คณะเทคโนโลยีสารสนเทศ',
      'สาขา/หน่วยงาน': 'สาขาวิชาวิศวกรรมคอมพิวเตอร์',
      อาคาร: 'อาคาร 3 อาคารนวัตกรรมดิจิทัล',
      ชื่อห้อง: 'ห้องปฏิบัติการ 301',
      จำนวน: 1,
      วันที่ซื้อ: '2025-01-15',
      ราคา: 25000,
      สถานะ: 'สถานะว่าง/พร้อมใช้',
      หมายเหตุ: 'ตัวอย่างนำเข้าข้อมูล',
    },
    {
      รหัสทรัพย์สิน: 'EQ-68-90002',
      ชื่อทรัพย์สิน: 'โปรเจคเตอร์ Full HD 4000 Lumens',
      ประเภทอุปกรณ์: 'อุปกรณ์โสตทัศนูปกรณ์และมัลติมีเดีย',
      วิทยาเขต: 'วิทยาเขตสุวรรณภูมิ',
      'สังกัด/คณะ': 'คณะวิศวกรรมศาสตร์',
      'สาขา/หน่วยงาน': 'สาขาวิชาวิศวกรรมคอมพิวเตอร์',
      อาคาร: 'อาคาร 2 อาคารปฏิบัติการวิศวกรรม',
      ชื่อห้อง: 'ห้องบรรยาย 205',
      จำนวน: 1,
      วันที่ซื้อ: '2025-02-01',
      ราคา: 32000,
      สถานะ: 'ใช้งานอยู่',
      หมายเหตุ: 'ติดตั้งพร้อมใช้งาน',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template_นำเข้าข้อมูลทรัพย์สิน');
  XLSX.writeFile(workbook, 'Template_นำเข้าข้อมูลทรัพย์สิน.xlsx');
}

// Parse Excel file for Import
export async function parseExcelFile(file: File): Promise<Partial<Asset>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

        const parsedAssets: Partial<Asset>[] = jsonData.map((row) => {
          const code = row['รหัสทรัพย์สิน'] || row['assetCode'] || row['รหัส'] || '';
          const name = row['ชื่อทรัพย์สิน'] || row['name'] || row['รายการ'] || 'ไม่มีชื่อ';
          const typeName = row['ประเภทอุปกรณ์'] || row['typeName'] || row['ประเภท'] || 'คอมพิวเตอร์และอุปกรณ์ไอที';
          const campusName = row['วิทยาเขต'] || row['campusName'] || 'วิทยาเขตกรุงเทพมหานคร (หลัก)';
          const facultyName = row['สังกัด/คณะ'] || row['คณะ'] || row['facultyName'] || 'คณะเทคโนโลยีสารสนเทศ';
          const departmentName = row['สาขา/หน่วยงาน'] || row['สาขา'] || row['departmentName'] || 'สาขาวิชาวิศวกรรมคอมพิวเตอร์';
          const buildingName = row['อาคาร'] || row['buildingName'] || 'อาคาร 1 อาคารเฉลิมพระเกียรติ';
          const room = row['ชื่อห้อง'] || row['ห้อง'] || row['room'] || 'ห้องกลาง';
          const quantity = Number(row['จำนวน'] || row['quantity'] || 1);
          const purchaseDate = row['วันที่ซื้อ'] || row['purchaseDate'] || new Date().toISOString().slice(0, 10);
          const price = Number(row['ราคา (บาท)'] || row['ราคา'] || row['price'] || 0);
          const status = (row['สถานะ'] || row['status'] || 'สถานะว่าง/พร้อมใช้') as AssetStatus;
          const note = row['หมายเหตุ'] || row['note'] || 'นำเข้าจากไฟล์ Excel';

          return {
            assetCode: String(code).trim(),
            name: String(name).trim(),
            typeName: String(typeName).trim(),
            campusName: String(campusName).trim(),
            facultyName: String(facultyName).trim(),
            departmentName: String(departmentName).trim(),
            buildingName: String(buildingName).trim(),
            room: String(room).trim(),
            quantity: isNaN(quantity) ? 1 : quantity,
            purchaseDate: String(purchaseDate).slice(0, 10),
            price: isNaN(price) ? 0 : price,
            status: status,
            note: String(note),
          };
        });

        resolve(parsedAssets);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}
