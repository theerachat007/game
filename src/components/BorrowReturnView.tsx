import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Boxes,
  Building2,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  History,
  Info,
  Layers,
  Lock,
  MapPin,
  Phone,
  Plus,
  Printer,
  QrCode,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  User,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import {
  Asset,
  AssetHistoryRecord,
  AssetStatus,
  BorrowerType,
  BorrowRecord,
  LoanStatus,
  SystemSettingsState,
  UserAccount,
} from '../types';
import { exportLoansToExcel } from '../services/storageService';
import { isLoanIssuer } from '../utils/loanUtils';
import { BorrowReturnSlipModal } from './BorrowReturnSlipModal';
import { ScannerModal } from './ScannerModal';

interface BorrowReturnViewProps {
  assets: Asset[];
  loans: BorrowRecord[];
  settings: SystemSettingsState;
  currentUser: UserAccount;
  onAddLoan: (loan: Omit<BorrowRecord, 'id' | 'transactionNo' | 'createdAt' | 'updatedAt'>) => void;
  onReturnLoan: (
    loanId: string,
    returnData: {
      actualReturnDate: string;
      conditionOnReturn: string;
      notes?: string;
      receivedBy: string;
      receivedById?: string;
      receivedByUsername?: string;
      nextAssetStatus?: AssetStatus;
    }
  ) => void;
  onDeleteLoan?: (loanId: string) => void;
  onNavigateToAsset?: (assetId: string) => void;
}

export const BorrowReturnView: React.FC<BorrowReturnViewProps> = ({
  assets,
  loans,
  settings,
  currentUser,
  onAddLoan,
  onReturnLoan,
  onDeleteLoan,
  onNavigateToAsset,
}) => {
  // Navigation / View Tabs inside Borrow-Return
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'overdue' | 'returned'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [onlyMyIssuedFilter, setOnlyMyIssuedFilter] = useState(false);

  // Modals state
  const [isNewLoanOpen, setIsNewLoanOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedLoanForReturn, setSelectedLoanForReturn] = useState<BorrowRecord | null>(null);
  const [selectedLoanForSlip, setSelectedLoanForSlip] = useState<BorrowRecord | null>(null);
  const [selectedLoanForDetail, setSelectedLoanForDetail] = useState<BorrowRecord | null>(null);
  const [blockedReturnLoan, setBlockedReturnLoan] = useState<BorrowRecord | null>(null);

  // Scanner Modal for Quick Scan
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerTargetMode, setScannerTargetMode] = useState<'new-loan' | 'quick-return' | null>(null);

  // New Loan Form State
  const todayStr = new Date().toISOString().slice(0, 10);
  const defaultReturnStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [formAssetId, setFormAssetId] = useState('');
  const [formBorrowerType, setFormBorrowerType] = useState<BorrowerType>('student');
  const [formBorrowerName, setFormBorrowerName] = useState('');
  const [formBorrowerIdCode, setFormBorrowerIdCode] = useState('');
  const [formBorrowerPhone, setFormBorrowerPhone] = useState('');
  const [formBorrowerEmail, setFormBorrowerEmail] = useState('');
  const [formBorrowerFaculty, setFormBorrowerFaculty] = useState(settings.faculties[0]?.name || 'คณะนิเทศศาสตร์');
  const [formBorrowerDept, setFormBorrowerDept] = useState(settings.departments[0]?.name || '');
  const [formBorrowDate, setFormBorrowDate] = useState(todayStr);
  const [formExpectedReturnDate, setFormExpectedReturnDate] = useState(defaultReturnStr);
  const [formPurpose, setFormPurpose] = useState('ใช้ในการเรียนการสอนและปฏิบัติการ');
  const [formLocationOfUse, setFormLocationOfUse] = useState('ห้องปฏิบัติการ / สตูดิโอ');
  const [formConditionOnBorrow, setFormConditionOnBorrow] = useState('สมบูรณ์ 100% พร้อมอุปกรณ์ต่อพ่วงครบ');
  const [formNotes, setFormNotes] = useState('');
  const [formAssetSearch, setFormAssetSearch] = useState('');

  // Return Processing Form State
  const [returnDate, setReturnDate] = useState(todayStr);
  const [returnCondition, setReturnCondition] = useState('สมบูรณ์ 100% ครบถ้วนพร้อมใช้งาน');
  const [returnActionType, setReturnActionType] = useState<'available' | 'maintenance'>('available');
  const [returnNotes, setReturnNotes] = useState('');

  // Calculate Overdue Status dynamically
  const enrichedLoans = useMemo(() => {
    return loans.map((l) => {
      let isOverdue = false;
      let overdueDays = 0;
      if (l.status !== 'returned' && l.expectedReturnDate) {
        const expDate = new Date(l.expectedReturnDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        expDate.setHours(0, 0, 0, 0);
        if (today > expDate) {
          isOverdue = true;
          overdueDays = Math.ceil((today.getTime() - expDate.getTime()) / (1000 * 60 * 60 * 24));
        }
      }
      return {
        ...l,
        isOverdue,
        overdueDays,
        computedStatus: l.status === 'returned' ? 'returned' : isOverdue ? 'overdue' : 'active',
      };
    });
  }, [loans]);

  // Statistics
  const stats = useMemo(() => {
    const total = enrichedLoans.length;
    const active = enrichedLoans.filter((l) => l.status === 'active' && !l.isOverdue).length;
    const overdue = enrichedLoans.filter((l) => l.isOverdue || l.status === 'overdue').length;
    const returned = enrichedLoans.filter((l) => l.status === 'returned').length;
    const availableAssets = assets.filter((a) => a.status === 'สถานะว่าง/พร้อมใช้').length;
    const myIssuedActive = enrichedLoans.filter((l) => l.status !== 'returned' && isLoanIssuer(l, currentUser)).length;

    return { total, active, overdue, returned, availableAssets, myIssuedActive };
  }, [enrichedLoans, assets, currentUser]);

  // Filtered Loans
  const filteredLoans = useMemo(() => {
    return enrichedLoans.filter((item) => {
      // My Issued Filter
      if (onlyMyIssuedFilter && !isLoanIssuer(item, currentUser)) return false;

      // Tab filter
      if (activeTab === 'active' && (item.status === 'returned' || item.isOverdue)) return false;
      if (activeTab === 'overdue' && !item.isOverdue && item.status !== 'overdue') return false;
      if (activeTab === 'returned' && item.status !== 'returned') return false;

      // Faculty filter
      if (facultyFilter !== 'ALL' && item.borrowerFaculty !== facultyFilter) return false;

      // Borrower Type filter
      if (typeFilter !== 'ALL' && item.borrowerType !== typeFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = item.assetCode.toLowerCase().includes(q);
        const matchName = item.assetName.toLowerCase().includes(q);
        const matchBorrower = item.borrowerName.toLowerCase().includes(q);
        const matchId = (item.borrowerIdCode || '').toLowerCase().includes(q);
        const matchPhone = (item.borrowerPhone || '').toLowerCase().includes(q);
        const matchTx = item.transactionNo.toLowerCase().includes(q);
        const matchPurpose = (item.purpose || '').toLowerCase().includes(q);
        const matchApprover = (item.approvedBy || '').toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchBorrower && !matchId && !matchPhone && !matchTx && !matchPurpose && !matchApprover) {
          return false;
        }
      }

      return true;
    });
  }, [enrichedLoans, activeTab, facultyFilter, typeFilter, searchQuery, onlyMyIssuedFilter, currentUser]);

  // Available Assets for New Loan Selection
  const availableAssetsList = useMemo(() => {
    return assets.filter((a) => {
      if (formAssetSearch.trim()) {
        const q = formAssetSearch.toLowerCase().trim();
        return (
          a.assetCode.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q) ||
          a.typeName.toLowerCase().includes(q) ||
          a.facultyName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [assets, formAssetSearch]);

  const selectedAssetForForm = useMemo(() => {
    return assets.find((a) => a.id === formAssetId);
  }, [assets, formAssetId]);

  // Handle Submit New Loan
  const handleSubmitNewLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAssetId || !selectedAssetForForm) {
      alert('กรุณาเลือกทรัพย์สินที่ต้องการยืม');
      return;
    }
    if (!formBorrowerName.trim()) {
      alert('กรุณากรอกชื่อผู้ขอยืม');
      return;
    }
    if (!formBorrowerPhone.trim()) {
      alert('กรุณากรอกเบอร์โทรศัพท์ติดต่อ');
      return;
    }

    onAddLoan({
      assetId: selectedAssetForForm.id,
      assetCode: selectedAssetForForm.assetCode,
      assetName: selectedAssetForForm.name,
      assetTypeName: selectedAssetForForm.typeName,
      borrowerType: formBorrowerType,
      borrowerName: formBorrowerName.trim(),
      borrowerIdCode: formBorrowerIdCode.trim(),
      borrowerPhone: formBorrowerPhone.trim(),
      borrowerEmail: formBorrowerEmail.trim(),
      borrowerFaculty: formBorrowerFaculty,
      borrowerDepartment: formBorrowerDept,
      borrowDate: formBorrowDate,
      expectedReturnDate: formExpectedReturnDate,
      purpose: formPurpose.trim(),
      locationOfUse: formLocationOfUse.trim(),
      conditionOnBorrow: formConditionOnBorrow.trim(),
      status: 'active',
      notes: formNotes.trim(),
      approvedBy: `${currentUser.fullname} (${currentUser.role})`,
      approvedById: currentUser.id,
      approvedByUsername: currentUser.username,
    });

    // Reset Form
    setFormAssetId('');
    setFormBorrowerName('');
    setFormBorrowerIdCode('');
    setFormBorrowerPhone('');
    setFormBorrowerEmail('');
    setFormNotes('');
    setIsNewLoanOpen(false);
  };

  // Open Return Processing Modal (with strict loan issuer verification)
  const handleOpenReturnModal = (loan: BorrowRecord) => {
    if (!isLoanIssuer(loan, currentUser)) {
      setBlockedReturnLoan(loan);
      return;
    }
    setSelectedLoanForReturn(loan);
    setReturnDate(todayStr);
    setReturnCondition('สมบูรณ์ 100% ครบถ้วนพร้อมใช้งาน');
    setReturnActionType('available');
    setReturnNotes('');
    setIsReturnModalOpen(true);
  };

  // Confirm Return
  const handleConfirmReturn = () => {
    if (!selectedLoanForReturn) return;

    // Strict validation: must be the same user who approved/issued the loan
    if (!isLoanIssuer(selectedLoanForReturn, currentUser)) {
      setBlockedReturnLoan(selectedLoanForReturn);
      setIsReturnModalOpen(false);
      return;
    }

    const nextStatus: AssetStatus =
      returnActionType === 'maintenance'
        ? 'ส่งซ่อมบำรุง'
        : 'สถานะว่าง/พร้อมใช้';

    onReturnLoan(selectedLoanForReturn.id, {
      actualReturnDate: returnDate,
      conditionOnReturn: returnCondition,
      notes: returnNotes.trim(),
      receivedBy: `${currentUser.fullname} (${currentUser.role})`,
      receivedById: currentUser.id,
      receivedByUsername: currentUser.username,
      nextAssetStatus: nextStatus,
    });

    setIsReturnModalOpen(false);
    setSelectedLoanForReturn(null);
  };

  // Handle Scan Detection
  const handleScanResult = (code: string) => {
    setIsScannerOpen(false);

    if (scannerTargetMode === 'new-loan') {
      const match = assets.find(
        (a) => a.assetCode.toLowerCase() === code.toLowerCase() || a.id === code
      );
      if (match) {
        setFormAssetId(match.id);
        setIsNewLoanOpen(true);
      } else {
        alert(`ไม่พบรหัสทรัพย์สิน: ${code} ในระบบ`);
      }
    } else if (scannerTargetMode === 'quick-return') {
      // Find active loan matching this asset code or transaction #
      const matchLoan = enrichedLoans.find(
        (l) =>
          l.status !== 'returned' &&
          (l.assetCode.toLowerCase() === code.toLowerCase() ||
            l.transactionNo.toLowerCase() === code.toLowerCase())
      );
      if (matchLoan) {
        if (!isLoanIssuer(matchLoan, currentUser)) {
          setBlockedReturnLoan(matchLoan);
        } else {
          handleOpenReturnModal(matchLoan);
        }
      } else {
        alert(`ไม่พบรายการที่กำลังยืมสำหรับรหัส: ${code}`);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-linear-to-tr from-orange-600 to-amber-500 rounded-xl text-white shadow-sm shadow-orange-200">
              <ArrowLeftRight className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
                <span>ระบบยืม-คืน ทรัพย์สินและครุภัณฑ์</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 font-semibold border border-orange-200">
                  Loan & Return Module
                </span>
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                บันทึกการเบิกยืม ตรวจรับคืน ติดตามสถานะเกินกำหนด และพิมพ์ใบยืม-คืนตามมาตรฐานมหาวิทยาลัย
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setScannerTargetMode('quick-return');
              setIsScannerOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs sm:text-sm font-bold border border-emerald-200 transition-colors cursor-pointer"
            title="สแกน QR Code หรือบาร์โค้ดเพื่อรับคืนด่วน"
          >
            <RotateCcw className="w-4 h-4 text-emerald-600" />
            <span>สแกนรับคืนด่วน</span>
          </button>

          <button
            onClick={() => {
              setFormAssetId('');
              setIsNewLoanOpen(true);
            }}
            className="flex items-center space-x-2 px-4 py-2.5 bg-linear-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-orange-300 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ทำรายการยืมใหม่</span>
          </button>

          {currentUser.role === 'admin' ? (
            <button
              onClick={() => exportLoansToExcel(loans)}
              className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 rounded-xl text-xs sm:text-sm font-semibold border border-neutral-200 transition-colors cursor-pointer"
              title="ส่งออกรายงานการยืม-คืนเป็นไฟล์ Excel (สิทธิ์เฉพาะ Admin)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">ส่งออก Excel</span>
            </button>
          ) : (
            <div
              className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-neutral-100/80 text-neutral-400 rounded-xl text-xs sm:text-sm font-medium border border-neutral-200 cursor-not-allowed opacity-75 select-none"
              title="สิทธิ์ User ทั่วไปไม่สามารถส่งออกไฟล์ Excel ได้ (สงวนสิทธิ์เฉพาะผู้ดูแลระบบ Admin)"
            >
              <Lock className="w-3.5 h-3.5 text-neutral-400" />
              <span className="hidden sm:inline">ส่งออก Excel (เฉพาะ Admin)</span>
            </div>
          )}
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Active Loans */}
        <div
          onClick={() => setActiveTab('active')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'active'
              ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20'
              : 'bg-white border-neutral-200 hover:border-amber-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              กำลังถูกยืม
            </span>
            <div className="p-2 bg-amber-100 rounded-xl text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
              {stats.active}
            </span>
            <span className="text-xs text-amber-600 font-medium">รายการที่ยังไม่คืน</span>
          </div>
        </div>

        {/* Overdue Loans */}
        <div
          onClick={() => setActiveTab('overdue')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'overdue'
              ? 'bg-red-500/10 border-red-500 ring-2 ring-red-500/20'
              : 'bg-white border-neutral-200 hover:border-red-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-700 uppercase tracking-wider flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-red-600 animate-pulse" />
              <span>เกินกำหนดคืน</span>
            </span>
            <div className="p-2 bg-red-100 rounded-xl text-red-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-red-600">
              {stats.overdue}
            </span>
            <span className="text-xs text-red-600 font-medium">ต้องเร่งติดตาม</span>
          </div>
        </div>

        {/* Returned */}
        <div
          onClick={() => setActiveTab('returned')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'returned'
              ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20'
              : 'bg-white border-neutral-200 hover:border-emerald-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              คืนเรียบร้อยแล้ว
            </span>
            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
              {stats.returned}
            </span>
            <span className="text-xs text-emerald-600 font-medium">ประวัติการคืน</span>
          </div>
        </div>

        {/* Ready to Borrow Assets */}
        <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider">
              ครุภัณฑ์พร้อมให้ยืม
            </span>
            <div className="p-2 bg-neutral-100 rounded-xl text-neutral-700">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
              {stats.availableAssets}
            </span>
            <span className="text-xs text-neutral-500 font-medium">สถานะว่างในคลัง</span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        {/* Navigation Tabs + Search & Filters */}
        <div className="p-4 border-b border-neutral-200 space-y-3">
          {/* Status Tabs & My Issued Loans Filter */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center p-1 bg-neutral-100 rounded-xl gap-1">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-white text-orange-700 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                ทั้งหมด ({stats.total})
              </button>
              <button
                onClick={() => setActiveTab('active')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'active'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                กำลังยืม ({stats.active})
              </button>
              <button
                onClick={() => setActiveTab('overdue')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'overdue'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                เกินกำหนด ({stats.overdue})
              </button>
              <button
                onClick={() => setActiveTab('returned')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'returned'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                คืนแล้ว ({stats.returned})
              </button>
            </div>

            {/* Quick Toggle: เฉพาะรายการที่ฉันให้ยืม & Quick Scanner shortcut */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOnlyMyIssuedFilter(!onlyMyIssuedFilter)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  onlyMyIssuedFilter
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200'
                }`}
                title="กรองเฉพาะรายการที่ฉันเป็นผู้ให้ยืม (มีสิทธิ์รับคืน)"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>เฉพาะที่ฉันให้ยืม ({stats.myIssuedActive})</span>
              </button>

              <button
                onClick={() => {
                  setScannerTargetMode('new-loan');
                  setIsScannerOpen(true);
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5 text-orange-600" />
                <span>สแกนบาร์โค้ดทำรายการ</span>
              </button>
            </div>
          </div>

          {/* Security policy badge note */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-[11px] text-amber-900">
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                <span className="font-bold">นโยบายความปลอดภัย:</span> การตรวจรับคืนสงวนสิทธิ์เฉพาะผู้ใช้ที่เป็นผู้ให้ยืมเดิมเท่านั้น (หรือแอดมิน)
              </span>
            </div>
            <span className="text-[10px] text-amber-700 font-medium hidden md:inline">
              ผู้ใช้งานปัจจุบัน: <strong className="text-amber-950">{currentUser.fullname}</strong>
            </span>
          </div>

          {/* Search bar & Filter Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
            {/* Search Input */}
            <div className="sm:col-span-6 relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อผู้ยืม, รหัสนักศึกษา, รหัสทรัพย์สิน, เลขที่เอกสาร, ผู้ให้ยืม..."
                className="w-full pl-9 pr-8 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Faculty Filter */}
            <div className="sm:col-span-3">
              <select
                value={facultyFilter}
                onChange={(e) => setFacultyFilter(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              >
                <option value="ALL">สังกัด/คณะ: ทั้งหมด</option>
                {settings.faculties.map((f) => (
                  <option key={f.id} value={f.name}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Borrower Type Filter */}
            <div className="sm:col-span-3">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              >
                <option value="ALL">ประเภทผู้ยืม: ทั้งหมด</option>
                <option value="student">นักศึกษา</option>
                <option value="lecturer">อาจารย์</option>
                <option value="staff">เจ้าหน้าที่</option>
                <option value="external">บุคคลภายนอก</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loan Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                <th className="py-3 px-4">เลขที่ / ทรัพย์สิน</th>
                <th className="py-3 px-4">ผู้ยืม / สังกัด</th>
                <th className="py-3 px-4">ผู้ให้ยืม (ผู้อนุมัติ)</th>
                <th className="py-3 px-4">วันที่ยืม - กำหนดคืน</th>
                <th className="py-3 px-4">สถานะ</th>
                <th className="py-3 px-4">วัตถุประสงค์</th>
                <th className="py-3 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-xs">
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-500">
                    <ArrowLeftRight className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                    <p className="font-semibold text-neutral-700">ไม่พบรายการยืม-คืนตามเงื่อนไข</p>
                    <p className="text-neutral-400 text-[11px] mt-0.5">
                      ลองปรับเปลี่ยนคำค้นหา หรือกดปุ่ม "ทำรายการยืมใหม่" เพื่อเริ่มบันทึก
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLoans.map((item) => {
                  const isReturned = item.status === 'returned';
                  const isOverdue = item.isOverdue || item.status === 'overdue';
                  const canReturn = isLoanIssuer(item, currentUser);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-orange-50/40 transition-colors group"
                    >
                      {/* Asset & Doc Number */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-neutral-100 text-neutral-700 rounded-md border border-neutral-200">
                            {item.transactionNo}
                          </span>
                          <p className="font-mono font-extrabold text-neutral-900 text-xs flex items-center gap-1.5 mt-1">
                            <span>{item.assetCode}</span>
                          </p>
                          <p className="font-semibold text-neutral-800 line-clamp-1 max-w-xs text-xs">
                            {item.assetName}
                          </p>
                        </div>
                      </td>

                      {/* Borrower Info */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-neutral-900">{item.borrowerName}</span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                                item.borrowerType === 'student'
                                  ? 'bg-blue-100 text-blue-700'
                                  : item.borrowerType === 'lecturer'
                                  ? 'bg-purple-100 text-purple-700'
                                  : item.borrowerType === 'staff'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-neutral-100 text-neutral-700'
                              }`}
                            >
                              {item.borrowerType === 'student'
                                ? 'นศ.'
                                : item.borrowerType === 'lecturer'
                                ? 'อาจารย์'
                                : item.borrowerType === 'staff'
                                ? 'เจ้าหน้าที่'
                                : 'บุคคลภายนอก'}
                            </span>
                          </div>
                          {item.borrowerIdCode && (
                            <p className="text-[11px] font-mono text-neutral-500">
                              รหัส: {item.borrowerIdCode}
                            </p>
                          )}
                          <p className="text-[11px] text-neutral-600 truncate max-w-[180px]">
                            {item.borrowerFaculty}
                          </p>
                          <p className="text-[10px] text-neutral-500 flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5" />
                            <span>{item.borrowerPhone}</span>
                          </p>
                        </div>
                      </td>

                      {/* Lender / Issuer Column */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs text-neutral-800 font-medium">
                            <User className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <span className="truncate max-w-[140px]" title={item.approvedBy}>
                              {item.approvedBy || '-'}
                            </span>
                          </div>
                          {!isReturned && (
                            canReturn ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <Check className="w-2.5 h-2.5" />
                                <span>ฉันเป็นผู้ให้ยืม</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-medium px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200">
                                <Lock className="w-2.5 h-2.5 text-amber-600" />
                                <span>ล็อคสิทธิ์รับคืน</span>
                              </span>
                            )
                          )}
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5 font-mono text-[11px]">
                          <p className="text-neutral-600">
                            ยืม: <span className="font-semibold text-neutral-900">{item.borrowDate}</span>
                          </p>
                          <p className={isOverdue ? 'text-red-600 font-bold' : 'text-neutral-700'}>
                            คืน: <span>{item.expectedReturnDate}</span>
                          </p>
                          {isReturned && (
                            <p className="text-emerald-700 font-semibold text-[10px]">
                              คืนจริง: {item.actualReturnDate}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {isReturned ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>คืนแล้ว</span>
                            </span>
                            {item.receivedBy && (
                              <p className="text-[10px] text-neutral-500 truncate max-w-[130px]" title={`รับคืนโดย: ${item.receivedBy}`}>
                                รับโดย: {item.receivedBy.split(' ')[0]}
                              </p>
                            )}
                          </div>
                        ) : isOverdue ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200 animate-pulse">
                              <AlertCircle className="w-3 h-3" />
                              <span>เกินกำหนดคืน</span>
                            </span>
                            {item.overdueDays > 0 && (
                              <p className="text-[10px] font-bold text-red-600">
                                เกิน {item.overdueDays} วัน
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            <span>กำลังยืม</span>
                          </span>
                        )}
                      </td>

                      {/* Purpose */}
                      <td className="py-3 px-4 max-w-xs">
                        <p className="text-neutral-700 line-clamp-2 text-xs">
                          {item.purpose || '-'}
                        </p>
                        <p className="text-[10px] text-neutral-400 truncate mt-0.5">
                          สถานที่: {item.locationOfUse || '-'}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Return Button with strict permission check */}
                          {!isReturned && (
                            canReturn ? (
                              <button
                                onClick={() => handleOpenReturnModal(item)}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center space-x-1 transition-colors cursor-pointer shadow-2xs"
                                title="บันทึกรับคืนทรัพย์สิน (ท่านคือผู้ให้ยืม)"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>รับคืน</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => setBlockedReturnLoan(item)}
                                className="px-2.5 py-1.5 bg-neutral-100 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-800 border border-neutral-200 text-neutral-500 rounded-lg font-medium text-[11px] flex items-center space-x-1 transition-colors cursor-pointer"
                                title={`ไม่สามารถรับคืนได้: เฉพาะผู้ให้ยืม (${item.approvedBy}) เท่านั้น`}
                              >
                                <Lock className="w-3 h-3 text-amber-600" />
                                <span>รับคืน</span>
                              </button>
                            )
                          )}

                          {/* Print Slip */}
                          <button
                            onClick={() => setSelectedLoanForSlip(item)}
                            className="p-1.5 bg-neutral-100 hover:bg-orange-100 text-neutral-700 hover:text-orange-700 rounded-lg transition-colors cursor-pointer"
                            title="พิมพ์ใบยืม-คืน / สัญญาการยืม"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* View Detail */}
                          <button
                            onClick={() => setSelectedLoanForDetail(item)}
                            className="p-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg transition-colors cursor-pointer"
                            title="ดูรายละเอียดครบถ้วน"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete (Admin only) */}
                          {currentUser.role === 'admin' && onDeleteLoan && (
                            <button
                              onClick={() => {
                                if (confirm(`ต้องการลบประวัติการยืมเลขที่ ${item.transactionNo} หรือไม่?`)) {
                                  onDeleteLoan(item.id);
                                }
                              }}
                              className="p-1.5 bg-neutral-100 hover:bg-red-100 text-neutral-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                              title="ลบประวัติรายการนี้"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Info */}
        <div className="p-3.5 bg-neutral-50 border-t border-neutral-200 flex flex-wrap items-center justify-between text-[11px] text-neutral-500">
          <span>แสดง {filteredLoans.length} รายการจากทั้งหมด {loans.length} รายการ</span>
          <span>ระบบยืม-คืน ทรัพย์สินและครุภัณฑ์ มหาวิทยาลัยเกษมบัณฑิต</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ทำรายการยืมใหม่ (New Borrow Modal) */}
      {/* ========================================================================= */}
      {isNewLoanOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-linear-to-r from-orange-600 to-amber-600 text-white shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">บันทึกการยืมทรัพย์สิน / ครุภัณฑ์</h3>
                  <p className="text-xs text-orange-100">
                    กรอกข้อมูลผู้ยืมและกำหนดวันส่งคืนเพื่อออกเอกสารใบยืม
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewLoanOpen(false)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmitNewLoan} className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
              {/* Step 1: Select Asset */}
              <div className="p-4 bg-orange-50/60 rounded-xl border border-orange-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-orange-950 flex items-center gap-1.5">
                    <Boxes className="w-4 h-4 text-orange-600" />
                    <span>1. เลือกทรัพย์สินที่ต้องการยืม *</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setScannerTargetMode('new-loan');
                      setIsScannerOpen(true);
                    }}
                    className="flex items-center space-x-1 text-xs font-bold text-orange-700 bg-white px-2.5 py-1 rounded-lg border border-orange-300 shadow-2xs hover:bg-orange-100 transition-colors cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>สแกนบาร์โค้ดเลือกเครื่อง</span>
                  </button>
                </div>

                {/* Dropdown / Search */}
                <div>
                  <select
                    value={formAssetId}
                    onChange={(e) => setFormAssetId(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 bg-white border border-neutral-300 rounded-xl font-medium text-neutral-900 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  >
                    <option value="">-- กรุณาเลือกรายการทรัพย์สินที่พร้อมใช้งาน --</option>
                    {availableAssetsList.map((a) => (
                      <option key={a.id} value={a.id}>
                        [{a.assetCode}] {a.name} ({a.status}) - {a.facultyName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Asset Snapshot */}
                {selectedAssetForForm && (
                  <div className="p-3 bg-white rounded-xl border border-orange-200 text-xs space-y-1">
                    <p className="font-bold text-neutral-900">
                      {selectedAssetForForm.name}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-neutral-600 text-[11px]">
                      <p>รหัส: <span className="font-mono font-bold text-orange-700">{selectedAssetForForm.assetCode}</span></p>
                      <p>ประเภท: {selectedAssetForForm.typeName}</p>
                      <p>สถานที่ปัจจุบัน: {selectedAssetForForm.buildingName} ({selectedAssetForForm.room})</p>
                      <p>สังกัด: {selectedAssetForForm.facultyName}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Borrower Information */}
              <div className="space-y-3">
                <h4 className="font-bold text-neutral-800 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-orange-600" />
                  <span>2. ข้อมูลผู้ขอยืม (Borrower Details)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-neutral-600 text-xs font-semibold mb-1">
                      ประเภทผู้ยืม *
                    </label>
                    <select
                      value={formBorrowerType}
                      onChange={(e) => setFormBorrowerType(e.target.value as BorrowerType)}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl"
                    >
                      <option value="student">นักศึกษา</option>
                      <option value="lecturer">อาจารย์ / นักวิจัย</option>
                      <option value="staff">เจ้าหน้าที่ / บุคลากร</option>
                      <option value="external">บุคคลภายนอก</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-neutral-600 text-xs font-semibold mb-1">
                      ชื่อ - นามสกุล ผู้ยืม *
                    </label>
                    <input
                      type="text"
                      required
                      value={formBorrowerName}
                      onChange={(e) => setFormBorrowerName(e.target.value)}
                      placeholder="เช่น นายสมชาย ใจดี หรือ ดร.ประสิทธิ์"
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-neutral-600 text-xs font-semibold mb-1">
                      รหัสนักศึกษา / บุคลากร
                    </label>
                    <input
                      type="text"
                      value={formBorrowerIdCode}
                      onChange={(e) => setFormBorrowerIdCode(e.target.value)}
                      placeholder="เช่น 6408234101"
                      className="w-full px-3 py-2 font-mono bg-neutral-50 border border-neutral-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-600 text-xs font-semibold mb-1">
                      เบอร์โทรศัพท์ติดต่อ *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formBorrowerPhone}
                      onChange={(e) => setFormBorrowerPhone(e.target.value)}
                      placeholder="เช่น 081-234-5678"
                      className="w-full px-3 py-2 font-mono bg-neutral-50 border border-neutral-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-600 text-xs font-semibold mb-1">
                      อีเมล
                    </label>
                    <input
                      type="email"
                      value={formBorrowerEmail}
                      onChange={(e) => setFormBorrowerEmail(e.target.value)}
                      placeholder="user@kbu.ac.th"
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-600 text-xs font-semibold mb-1">
                      สังกัด / คณะ *
                    </label>
                    <select
                      value={formBorrowerFaculty}
                      onChange={(e) => setFormBorrowerFaculty(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl"
                    >
                      {settings.faculties.map((f) => (
                        <option key={f.id} value={f.name}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-neutral-600 text-xs font-semibold mb-1">
                      สาขาวิชา / หน่วยงาน
                    </label>
                    <input
                      type="text"
                      value={formBorrowerDept}
                      onChange={(e) => setFormBorrowerDept(e.target.value)}
                      placeholder="เช่น สาขาวิชาภาพยนตร์และสื่อดิจิทัล"
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3: Dates & Purpose */}
              <div className="space-y-3 pt-2 border-t border-neutral-200">
                <h4 className="font-bold text-neutral-800 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-orange-600" />
                  <span>3. กำหนดเวลาและสถานที่ใช้งาน</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-600 text-xs font-semibold mb-1">
                      วันที่เริ่มยืม *
                    </label>
                    <input
                      type="date"
                      required
                      value={formBorrowDate}
                      onChange={(e) => setFormBorrowDate(e.target.value)}
                      className="w-full px-3 py-2 font-mono bg-neutral-50 border border-neutral-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-600 text-xs font-semibold mb-1">
                      กำหนดส่งคืนภายในวันที่ *
                    </label>
                    <input
                      type="date"
                      required
                      value={formExpectedReturnDate}
                      onChange={(e) => setFormExpectedReturnDate(e.target.value)}
                      className="w-full px-3 py-2 font-mono bg-neutral-50 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-orange-500 font-bold text-orange-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-600 text-xs font-semibold mb-1">
                      วัตถุประสงค์การยืม *
                    </label>
                    <input
                      type="text"
                      required
                      value={formPurpose}
                      onChange={(e) => setFormPurpose(e.target.value)}
                      placeholder="เช่น ใช้จัดงานสัมมนานิเทศศาสตร์, ทำวิจัย"
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-600 text-xs font-semibold mb-1">
                      สถานที่นำไปใช้งาน *
                    </label>
                    <input
                      type="text"
                      required
                      value={formLocationOfUse}
                      onChange={(e) => setFormLocationOfUse(e.target.value)}
                      placeholder="เช่น ห้องสตูดิโอ 301 อาคาร 3"
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-600 text-xs font-semibold mb-1">
                    สภาพอุปกรณ์ตอนส่งมอบ
                  </label>
                  <input
                    type="text"
                    value={formConditionOnBorrow}
                    onChange={(e) => setFormConditionOnBorrow(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsNewLoanOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 hover:bg-neutral-100 font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-linear-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold shadow-sm shadow-orange-300 cursor-pointer"
                >
                  บันทึกการยืมทรัพย์สิน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: บันทึกรับคืนทรัพย์สิน (Return Processing Modal) */}
      {/* ========================================================================= */}
      {isReturnModalOpen && selectedLoanForReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden my-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-linear-to-r from-emerald-600 to-teal-600 text-white">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">บันทึกรับคืนทรัพย์สิน / ครุภัณฑ์</h3>
                  <p className="text-xs text-emerald-100 font-mono">
                    {selectedLoanForReturn.transactionNo}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsReturnModalOpen(false)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 text-xs sm:text-sm">
              {/* Security check verification banner */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold">ผ่านการตรวจสอบสิทธิ์ผู้ให้ยืม</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    ผู้ให้ยืมเดิม: <strong className="text-emerald-950">{selectedLoanForReturn.approvedBy}</strong> (ตรงกับผู้ใช้งานปัจจุบัน: {currentUser.fullname})
                  </p>
                </div>
              </div>

              {/* Asset & Borrower Info Card */}
              <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 bg-orange-100 text-orange-800 rounded-sm">
                      {selectedLoanForReturn.assetCode}
                    </span>
                    <h4 className="font-bold text-neutral-900 text-sm mt-1">
                      {selectedLoanForReturn.assetName}
                    </h4>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-neutral-600 pt-1 border-t border-neutral-200">
                  <p>ผู้ยืม: <span className="font-bold text-neutral-900">{selectedLoanForReturn.borrowerName}</span></p>
                  <p>สังกัด: {selectedLoanForReturn.borrowerFaculty}</p>
                  <p>วันที่ยืม: {selectedLoanForReturn.borrowDate}</p>
                  <p>กำหนดคืน: <span className="font-bold text-red-600">{selectedLoanForReturn.expectedReturnDate}</span></p>
                </div>
              </div>

              {/* Return Form Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-neutral-700 font-semibold text-xs mb-1">
                    วันที่รับคืนจริง *
                  </label>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full px-3 py-2 font-mono bg-neutral-50 border border-neutral-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold text-xs mb-1">
                    ผลการตรวจสอบสภาพทรัพย์สิน *
                  </label>
                  <input
                    type="text"
                    value={returnCondition}
                    onChange={(e) => setReturnCondition(e.target.value)}
                    placeholder="เช่น สมบูรณ์ 100% ครบถ้วนพร้อมใช้งาน หรือมีรอยขีดข่วน"
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold text-xs mb-1">
                    สถานะทรัพย์สินหลังรับคืน *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setReturnActionType('available')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        returnActionType === 'available'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                          : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                      }`}
                    >
                      <p className="font-bold text-xs">สถานะว่าง / พร้อมใช้</p>
                      <p className="text-[10px] text-neutral-500 mt-0.5">นำกลับเข้าคลังพร้อมให้ผู้อื่นยืมต่อ</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReturnActionType('maintenance')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        returnActionType === 'maintenance'
                          ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20'
                          : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                      }`}
                    >
                      <p className="font-bold text-xs text-amber-800">ส่งซ่อมบำรุง</p>
                      <p className="text-[10px] text-neutral-500 mt-0.5">ชำรุดเสียหาย ต้องส่งซ่อมก่อนใช้งาน</p>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold text-xs mb-1">
                    บันทึกเพิ่มเติม / หมายเหตุ
                  </label>
                  <input
                    type="text"
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                    placeholder="บันทึกข้อความเพิ่มเติม (ถ้ามี)"
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-300 text-neutral-700 hover:bg-neutral-100 font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReturn}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm shadow-emerald-200 cursor-pointer flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>ยืนยันการรับคืนทรัพย์สิน</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ดูรายละเอียดรายการยืม-คืน (Detail Modal) */}
      {/* ========================================================================= */}
      {selectedLoanForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden my-auto">
            <div className="flex items-center justify-between px-6 py-4 bg-neutral-900 text-white">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-orange-400" />
                <h3 className="font-bold text-base">รายละเอียดบันทึกการยืม-คืน</h3>
              </div>
              <button
                onClick={() => setSelectedLoanForDetail(null)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3.5 bg-orange-50 rounded-xl border border-orange-200 flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-orange-700 font-semibold">เลขที่เอกสาร</p>
                  <p className="text-base font-mono font-extrabold text-neutral-950">
                    {selectedLoanForDetail.transactionNo}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedLoanForSlip(selectedLoanForDetail);
                    setSelectedLoanForDetail(null);
                  }}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-white text-orange-800 border border-orange-300 rounded-lg font-bold shadow-2xs hover:bg-orange-100 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>พิมพ์เอกสาร</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <p className="font-bold text-neutral-800 mb-1.5">ข้อมูลทรัพย์สิน</p>
                  <p className="font-mono text-orange-700 font-bold">{selectedLoanForDetail.assetCode}</p>
                  <p className="font-semibold text-neutral-900 mt-0.5">{selectedLoanForDetail.assetName}</p>
                  <p className="text-neutral-500 text-[11px] mt-1">ประเภท: {selectedLoanForDetail.assetTypeName || '-'}</p>
                </div>

                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <p className="font-bold text-neutral-800 mb-1.5">ข้อมูลผู้ยืม</p>
                  <p className="font-bold text-neutral-900">{selectedLoanForDetail.borrowerName}</p>
                  <p className="text-neutral-600">รหัส: {selectedLoanForDetail.borrowerIdCode || '-'}</p>
                  <p className="text-neutral-600">โทร: {selectedLoanForDetail.borrowerPhone}</p>
                  <p className="text-neutral-600 truncate">สังกัด: {selectedLoanForDetail.borrowerFaculty}</p>
                </div>
              </div>

              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1.5">
                <p className="font-bold text-neutral-800">รายละเอียดการใช้งาน</p>
                <p><span className="text-neutral-500">วัตถุประสงค์:</span> {selectedLoanForDetail.purpose}</p>
                <p><span className="text-neutral-500">สถานที่ใช้งาน:</span> {selectedLoanForDetail.locationOfUse}</p>
                <p><span className="text-neutral-500">สภาพตอนส่งมอบ:</span> {selectedLoanForDetail.conditionOnBorrow}</p>
                {selectedLoanForDetail.conditionOnReturn && (
                  <p><span className="text-neutral-500">สภาพตอนรับคืน:</span> {selectedLoanForDetail.conditionOnReturn}</p>
                )}
                <p><span className="text-neutral-500">ผู้อนุมัติ:</span> {selectedLoanForDetail.approvedBy}</p>
                {selectedLoanForDetail.receivedBy && (
                  <p><span className="text-neutral-500">ผู้รับคืน:</span> {selectedLoanForDetail.receivedBy}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ใบยืม-คืน สำหรับสั่งพิมพ์ (Print Slip Modal) */}
      {/* ========================================================================= */}
      {selectedLoanForSlip && (
        <BorrowReturnSlipModal
          loan={selectedLoanForSlip}
          asset={assets.find((a) => a.id === selectedLoanForSlip.assetId)}
          settings={settings}
          onClose={() => setSelectedLoanForSlip(null)}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: กล้องสแกน QR / Barcode */}
      {/* ========================================================================= */}
      {isScannerOpen && (
        <ScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={handleScanResult}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: แจ้งเตือนล็อคสิทธิ์การรับคืน (Blocked Return Security Modal) */}
      {/* ========================================================================= */}
      {blockedReturnLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-linear-to-r from-amber-600 to-orange-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">ไม่สามารถดำเนินการรับคืนได้</h3>
                  <p className="text-xs text-amber-100">สงวนสิทธิ์เฉพาะผู้ให้ยืมเดิมเท่านั้น</p>
                </div>
              </div>
              <button
                onClick={() => setBlockedReturnLoan(null)}
                className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs sm:text-sm">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <div className="flex items-start gap-2.5 text-amber-900">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-xs leading-relaxed">
                      ตามระเบียบระบบยืม-คืน ทรัพย์สินและครุภัณฑ์:
                    </p>
                    <p className="font-bold text-amber-950 text-xs sm:text-sm mt-0.5">
                      "การคืน ถ้าไม่ใช่ User เดียวกับผู้ให้ยืม ไม่สามารถให้คืนได้"
                    </p>
                  </div>
                </div>
              </div>

              {/* Comparison card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-1">
                  <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                    ผู้ให้ยืมเดิม (ผู้มีสิทธิ์รับคืน)
                  </p>
                  <p className="font-bold text-neutral-900 text-xs sm:text-sm flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">{blockedReturnLoan.approvedBy || '-'}</span>
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 mt-1">
                    <Check className="w-2.5 h-2.5" />
                    <span>มีสิทธิ์ตรวจรับคืน</span>
                  </span>
                </div>

                <div className="p-3.5 bg-red-50/60 rounded-xl border border-red-200 space-y-1">
                  <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider">
                    ผู้ใช้งานปัจจุบัน
                  </p>
                  <p className="font-bold text-neutral-900 text-xs sm:text-sm flex items-center gap-1.5">
                    <User className="w-4 h-4 text-red-500 shrink-0" />
                    <span className="truncate">{currentUser.fullname} ({currentUser.role})</span>
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded border border-red-300 mt-1">
                    <Lock className="w-2.5 h-2.5" />
                    <span>ไม่มีสิทธิ์ตรวจรับคืน</span>
                  </span>
                </div>
              </div>

              {/* Asset details summary */}
              <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 text-xs space-y-1 text-neutral-600">
                <p><span className="font-semibold text-neutral-800">เลขที่เอกสาร:</span> {blockedReturnLoan.transactionNo}</p>
                <p><span className="font-semibold text-neutral-800">รหัสทรัพย์สิน:</span> <strong className="font-mono text-orange-700">{blockedReturnLoan.assetCode}</strong> - {blockedReturnLoan.assetName}</p>
                <p><span className="font-semibold text-neutral-800">ผู้ยืม:</span> {blockedReturnLoan.borrowerName} ({blockedReturnLoan.borrowerFaculty})</p>
                <p><span className="font-semibold text-neutral-800">กำหนดส่งคืน:</span> {blockedReturnLoan.expectedReturnDate}</p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setBlockedReturnLoan(null)}
                  className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-bold cursor-pointer text-xs sm:text-sm transition-colors"
                >
                  เข้าใจแล้ว / ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
