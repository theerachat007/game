import React, { useRef } from 'react';
import {
  ArrowLeftRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  MapPin,
  Phone,
  Printer,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Asset, BorrowRecord, SystemSettingsState } from '../types';

interface BorrowReturnSlipModalProps {
  loan: BorrowRecord;
  asset?: Asset;
  settings?: SystemSettingsState;
  onClose: () => void;
}

export const BorrowReturnSlipModal: React.FC<BorrowReturnSlipModalProps> = ({
  loan,
  asset,
  onClose,
}) => {
  const isReturned = loan.status === 'returned';

  const handlePrint = () => {
    window.print();
  };

  const borrowerTypeTh =
    loan.borrowerType === 'lecturer'
      ? 'อาจารย์ / นักวิจัย'
      : loan.borrowerType === 'student'
      ? 'นักศึกษา'
      : loan.borrowerType === 'staff'
      ? 'เจ้าหน้าที่ / บุคลากร'
      : 'บุคคลภายนอก';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
      {/* Modal Card */}
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden my-auto print:shadow-none print:border-none print:m-0 print:w-full print:max-w-none">
        {/* Top Control Bar (Hidden on Print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-linear-to-r from-orange-600 to-amber-600 text-white print:hidden">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {isReturned ? 'ใบสำคัญการรับคืนทรัพย์สิน' : 'แบบฟอร์ม / ใบยืมทรัพย์สินมหาวิทยาลัย'}
              </h3>
              <p className="text-xs text-orange-100 font-mono">
                เลขที่เอกสาร: {loan.transactionNo}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-4 py-2 bg-white text-orange-700 hover:bg-orange-50 font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์เอกสาร (Print / PDF)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              aria-label="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas */}
        <div className="p-6 sm:p-10 bg-white text-neutral-900 font-sans space-y-6 print:p-0 print:space-y-4">
          {/* Official Header */}
          <div className="border-b-2 border-orange-500 pb-5 print:border-black flex justify-between items-start">
            <div className="flex items-start space-x-4">
              {/* Emblem */}
              <div className="w-16 h-16 shrink-0 bg-neutral-100 rounded-xl flex items-center justify-center border border-neutral-300 print:border-black">
                <svg
                  viewBox="0 0 100 100"
                  className="w-12 h-12 text-neutral-900 fill-current"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M50 4 L53 14 L60 8 L58 19 L66 16 L61 24 L70 24 L63 30 L50 22 L37 30 L30 24 L39 24 L34 16 L42 19 L40 8 L47 14 Z" />
                  <circle cx="50" cy="45" r="16" fill="none" stroke="currentColor" strokeWidth="3" />
                  <path d="M50 33 L55 42 L45 42 Z" />
                  <path d="M42 45 Q50 49 58 45 Q50 56 42 45 Z" />
                  <path d="M46 51 L54 51 L50 57 Z" />
                  <path d="M34 38 Q22 34 16 46 Q24 49 34 44 Z" />
                  <path d="M33 46 Q18 45 14 56 Q23 57 34 50 Z" />
                  <path d="M35 52 Q22 56 18 66 Q28 64 36 57 Z" />
                  <path d="M66 38 Q78 34 84 46 Q76 49 66 44 Z" />
                  <path d="M67 46 Q82 45 86 56 Q77 57 66 50 Z" />
                  <path d="M65 52 Q78 56 82 66 Q72 64 64 57 Z" />
                  <path d="M30 68 Q50 63 70 68 Q65 77 50 78 Q35 77 30 68 Z" />
                  <path d="M22 75 Q36 71 50 75 Q64 71 78 75 Q82 85 70 85 Q50 82 30 85 Q18 85 22 75 Z" />
                  <circle cx="50" cy="45" r="3" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-950">
                  มหาวิทยาลัยเกษมบัณฑิต (KASEM BUNDIT UNIVERSITY)
                </h1>
                <p className="text-xs text-neutral-600 print:text-black">
                  ฝ่ายบริหารพัสดุ ทรัพย์สิน และอาคารสถานที่
                </p>
                <h2 className="text-base font-extrabold text-orange-700 print:text-black mt-1">
                  {isReturned
                    ? 'เอกสารหลักฐานการรับคืนทรัพย์สิน / ครุภัณฑ์'
                    : 'แบบฟอร์มการขออนุมัติยืมใช้ทรัพย์สิน / ครุภัณฑ์มหาวิทยาลัย'}
                </h2>
              </div>
            </div>

            {/* Doc Number & QR Code */}
            <div className="text-right flex flex-col items-end">
              <div className="p-1 border border-neutral-300 rounded-lg print:border-black bg-white mb-1">
                <QRCodeSVG value={loan.transactionNo} size={56} level="M" />
              </div>
              <p className="text-[11px] font-bold font-mono text-neutral-800 print:text-black">
                {loan.transactionNo}
              </p>
              <p className="text-[10px] text-neutral-500 print:text-black">
                วันที่ทำรายการ: {loan.borrowDate}
              </p>
            </div>
          </div>

          {/* Section 1: ข้อมูลผู้ขอยืม (Borrower Details) */}
          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 print:bg-white print:border-black">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 print:text-black mb-3 flex items-center gap-1.5">
              <User className="w-4 h-4 text-orange-600 print:text-black" />
              <span>1. ข้อมูลผู้ขอยืม (Borrower Information)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-xs">
              <div>
                <span className="font-semibold text-neutral-600 print:text-black">ชื่อ-นามสกุล: </span>
                <span className="font-bold text-neutral-900 print:text-black">{loan.borrowerName}</span>
              </div>
              <div>
                <span className="font-semibold text-neutral-600 print:text-black">ประเภทผู้ยืม: </span>
                <span className="font-medium text-neutral-900 print:text-black">{borrowerTypeTh}</span>
              </div>
              <div>
                <span className="font-semibold text-neutral-600 print:text-black">รหัสประจำตัว: </span>
                <span className="font-mono font-bold text-neutral-900 print:text-black">
                  {loan.borrowerIdCode || '-'}
                </span>
              </div>
              <div>
                <span className="font-semibold text-neutral-600 print:text-black">เบอร์โทรศัพท์: </span>
                <span className="font-mono text-neutral-900 print:text-black">{loan.borrowerPhone}</span>
              </div>
              <div>
                <span className="font-semibold text-neutral-600 print:text-black">สังกัด / คณะ: </span>
                <span className="text-neutral-900 print:text-black">{loan.borrowerFaculty}</span>
              </div>
              <div>
                <span className="font-semibold text-neutral-600 print:text-black">สาขาวิชา / แผนก: </span>
                <span className="text-neutral-900 print:text-black">
                  {loan.borrowerDepartment || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: รายละเอียดทรัพย์สินที่ขอยืม (Asset Details) */}
          <div className="border border-neutral-200 rounded-xl overflow-hidden print:border-black">
            <div className="bg-orange-50 px-4 py-2 border-b border-neutral-200 print:bg-neutral-100 print:border-black">
              <h3 className="text-xs font-bold uppercase tracking-wider text-orange-950 print:text-black flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-orange-600 print:text-black" />
                <span>2. รายละเอียดทรัพย์สินที่ยืม (Asset Details)</span>
              </h3>
            </div>
            <div className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <p className="text-neutral-500 font-semibold print:text-black">รหัสทรัพย์สิน (Asset Code)</p>
                  <p className="font-mono font-extrabold text-sm text-orange-800 print:text-black">
                    {loan.assetCode}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-neutral-500 font-semibold print:text-black">ชื่อรายการทรัพย์สิน</p>
                  <p className="font-bold text-neutral-900 print:text-black">{loan.assetName}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-200 print:border-black">
                <div>
                  <p className="text-neutral-500 font-semibold print:text-black">วัตถุประสงค์ในการยืม</p>
                  <p className="text-neutral-800 print:text-black font-medium">{loan.purpose}</p>
                </div>
                <div>
                  <p className="text-neutral-500 font-semibold print:text-black">สถานที่นำไปใช้งาน</p>
                  <p className="text-neutral-800 print:text-black font-medium">{loan.locationOfUse}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-200 print:border-black">
                <div>
                  <p className="text-neutral-500 font-semibold print:text-black">สภาพอุปกรณ์ก่อนยืม</p>
                  <p className="text-neutral-800 print:text-black">{loan.conditionOnBorrow}</p>
                </div>
                {isReturned && (
                  <div>
                    <p className="text-neutral-500 font-semibold print:text-black">สภาพอุปกรณ์ตอนรับคืน</p>
                    <p className="text-neutral-900 font-bold print:text-black">
                      {loan.conditionOnReturn || 'สมบูรณ์ครบถ้วน 100%'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: กำหนดเวลาและเงื่อนไข (Dates & Terms) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 print:bg-white print:border-black space-y-1.5">
              <p className="font-bold text-neutral-800 print:text-black flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-orange-600 print:text-black" />
                <span>กำหนดการยืม - ส่งคืน</span>
              </p>
              <p>
                <span className="text-neutral-500 print:text-black">วันที่เริ่มยืม: </span>
                <span className="font-bold font-mono text-neutral-900 print:text-black">
                  {loan.borrowDate}
                </span>
              </p>
              <p>
                <span className="text-neutral-500 print:text-black">กำหนดส่งคืนภายใน: </span>
                <span className="font-bold font-mono text-red-600 print:text-black">
                  {loan.expectedReturnDate}
                </span>
              </p>
              {isReturned && (
                <p>
                  <span className="text-neutral-500 print:text-black">วันที่ส่งคืนจริง: </span>
                  <span className="font-bold font-mono text-emerald-600 print:text-black">
                    {loan.actualReturnDate}
                  </span>
                </p>
              )}
            </div>

            <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 print:bg-white print:border-black text-[11px] text-neutral-600 print:text-black space-y-1">
              <p className="font-bold text-neutral-800 print:text-black">ข้อตกลงและเงื่อนไขการยืม:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>ผู้ยืมต้องดูแลรักษาทรัพย์สินให้อยู่ในสภาพเรียบร้อยตลอดระยะเวลาที่ยืม</li>
                <li>หากเกิดการชำรุด สูญหาย ผู้ยืมยินยอมชดใช้ตามระเบียบมหาวิทยาลัย</li>
                <li>ส่งคืนตามกำหนดเวลาที่ระบุ ณ ฝ่ายบริหารพัสดุและทรัพย์สิน</li>
              </ul>
            </div>
          </div>

          {/* Section 4: ลายมือชื่อ (Signatures) */}
          <div className="pt-6 border-t border-neutral-300 print:border-black grid grid-cols-2 gap-8 text-center text-xs">
            {/* Borrower Signature */}
            <div className="space-y-8">
              <p className="font-semibold text-neutral-700 print:text-black">
                ลงชื่อ ............................................................
              </p>
              <div>
                <p className="font-bold text-neutral-900 print:text-black">({loan.borrowerName})</p>
                <p className="text-[11px] text-neutral-500 print:text-black">ผู้ขอยืมทรัพย์สิน</p>
                <p className="text-[10px] text-neutral-400 print:text-black">วันที่ ......./......./..........</p>
              </div>
            </div>

            {/* Approver / Staff Signature */}
            <div className="space-y-8">
              <p className="font-semibold text-neutral-700 print:text-black">
                ลงชื่อ ............................................................
              </p>
              <div>
                <p className="font-bold text-neutral-900 print:text-black">
                  ({isReturned ? loan.receivedBy || loan.approvedBy : loan.approvedBy})
                </p>
                <p className="text-[11px] text-neutral-500 print:text-black">
                  {isReturned ? 'เจ้าหน้าที่ผู้รับคืนและตรวจสอบสภาพ' : 'เจ้าหน้าที่ผู้ส่งมอบ / ผู้อนุมัติ'}
                </p>
                <p className="text-[10px] text-neutral-400 print:text-black">วันที่ ......./......./..........</p>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-2 text-[10px] text-neutral-400 print:text-neutral-600 font-mono">
            ระบบบริหารจัดการทรัพย์สินและครุภัณฑ์มหาวิทยาลัยเกษมบัณฑิต • พิมพ์เมื่อ {new Date().toLocaleString('th-TH')}
          </div>
        </div>
      </div>
    </div>
  );
};
