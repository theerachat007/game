export type UserRole = 'admin' | 'user';

export const ASSET_STATUSES = [
  'สถานะว่าง/พร้อมใช้',
  'ใช้งานอยู่',
  'ส่งซ่อมบำรุง',
  'จำหน่าย/ตัดยอด',
  'ติดบาร์โค๊ดและบันทึกลงในระบบทรัพย์สิน',
  'อยู่ระหว่างการบันทึกละระบบทรัพย์สิน',
] as const;

export type AssetStatus = typeof ASSET_STATUSES[number];

export interface MasterItem {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export interface UserAccount {
  id: string;
  fullname: string;
  position: string;
  email: string;
  phone: string;
  username: string;
  password: string;
  role: UserRole;
  createdAt: string;
}

export type BorrowerType = 'student' | 'lecturer' | 'staff' | 'external';
export type LoanStatus = 'active' | 'returned' | 'overdue';

export interface BorrowRecord {
  id: string;
  transactionNo: string; // เช่น LN-202502-0001
  assetId: string;
  assetCode: string;
  assetName: string;
  assetTypeName?: string;
  borrowerType: BorrowerType;
  borrowerName: string;
  borrowerIdCode: string; // รหัสนักศึกษา / รหัสบุคลากร
  borrowerPhone: string;
  borrowerEmail?: string;
  borrowerFaculty: string;
  borrowerDepartment?: string;
  borrowDate: string; // YYYY-MM-DD
  expectedReturnDate: string; // YYYY-MM-DD
  actualReturnDate?: string; // YYYY-MM-DD
  purpose: string; // วัตถุประสงค์การยืม
  locationOfUse: string; // สถานที่นำไปใช้งาน
  conditionOnBorrow: string; // สภาพตอนยืม
  conditionOnReturn?: string; // สภาพตอนคืน
  status: LoanStatus;
  notes?: string;
  approvedBy: string; // ผู้ให้ยืม/ผู้อนุมัติ
  approvedById?: string; // รหัสบัญชีผู้ใช้ที่เป็นผู้ให้ยืม
  approvedByUsername?: string; // Username ผู้ให้ยืม
  receivedBy?: string; // ผู้รับคืน
  receivedById?: string; // รหัสบัญชีผู้ใช้ที่เป็นผู้รับคืน
  receivedByUsername?: string; // Username ผู้รับคืน
  createdAt: string;
  updatedAt: string;
}

export interface AssetHistoryRecord {
  id: string;
  assetId: string;
  assetCode: string;
  assetName: string;
  timestamp: string;
  action: 'CREATE' | 'UPDATE_STATUS' | 'UPDATE_DETAILS' | 'INSPECTION' | 'MAINTENANCE' | 'DISPOSAL' | 'IMPORT' | 'BORROW' | 'RETURN';
  actionLabel: string;
  previousStatus?: AssetStatus;
  newStatus?: AssetStatus;
  previousLocation?: string;
  newLocation?: string;
  note: string;
  performedBy: string;
}

export interface Asset {
  id: string;
  assetCode: string; // รหัสทรัพย์สิน
  name: string; // ชื่อทรัพย์สิน
  typeId: string;
  typeName: string; // ประเภทอุปกรณ์
  campusId: string;
  campusName: string; // ชื่อวิทยาเขต
  facultyId: string;
  facultyName: string; // ชื่อสังกัด/คณะ
  departmentId: string;
  departmentName: string; // ชื่อสาขา/หน่วยงาน
  buildingId: string;
  buildingName: string; // อาคาร
  room: string; // ชื่อห้อง
  quantity: number; // จำนวน
  purchaseDate: string; // วันที่ซื้อ (YYYY-MM-DD)
  price: number; // ราคา (บาท)
  imageUrl: string; // รูปภาพ
  note: string; // หมายเหตุ
  status: AssetStatus; // สถานะ 6 สถานะ
  createdAt: string;
  updatedAt: string;
}

export interface SystemSettingsState {
  assetTypes: MasterItem[];
  campuses: MasterItem[];
  faculties: MasterItem[];
  departments: MasterItem[];
  buildings: MasterItem[];
  users: UserAccount[];
}

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  spreadsheetUrl: string;
  spreadsheetTitle: string;
  lastSyncedAt?: string;
  autoSync: boolean;
  accessToken?: string;
  userEmail?: string;
}
