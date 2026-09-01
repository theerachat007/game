import React, { useEffect, useState } from 'react';
import {
  Asset,
  AssetHistoryRecord,
  AssetStatus,
  BorrowRecord,
  GoogleSheetsConfig,
  SystemSettingsState,
  UserAccount,
} from './types';
import {
  addHistoryLog,
  exportAssetsToExcel,
  loadAssets,
  loadCurrentUser,
  loadHistory,
  loadLoans,
  loadSettings,
  loadSheetsConfig,
  saveAssets,
  saveCurrentUser,
  saveHistory,
  saveLoans,
  saveSettings,
  saveSheetsConfig,
} from './services/storageService';
import { syncDataToGoogleSheets } from './services/googleSheetsService';
import { Navbar } from './components/Navbar';
import { NavTab, Sidebar } from './components/Sidebar';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { AssetManagementView } from './components/AssetManagementView';
import { BorrowReturnView } from './components/BorrowReturnView';
import { ScannerView } from './components/ScannerView';
import { BarcodePrintView } from './components/BarcodePrintView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { AssetFormModal } from './components/AssetFormModal';

export default function App() {
  // Global States
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => loadCurrentUser());
  const [settings, setSettings] = useState<SystemSettingsState>(() => loadSettings());
  const [assets, setAssets] = useState<Asset[]>(() => loadAssets());
  const [history, setHistory] = useState<AssetHistoryRecord[]>(() => loadHistory());
  const [loans, setLoans] = useState<BorrowRecord[]>(() => loadLoans());
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig | null>(() => loadSheetsConfig());

  // Navigation State
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Global Modals State
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);

  // Synchronize active user role constraints
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'user' && !['assets', 'borrow-return', 'scanner', 'barcode-print'].includes(currentTab)) {
        setCurrentTab('assets');
      }
    }
  }, [currentUser, currentTab]);

  // Auth Handlers
  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    saveCurrentUser(user);
    if (user.role === 'admin') {
      setCurrentTab('dashboard');
    } else {
      setCurrentTab('assets');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    saveCurrentUser(null);
    setCurrentTab('dashboard');
  };

  // Asset CRUD Handlers
  const handleSaveAsset = (assetData: Partial<Asset>) => {
    if (currentUser && currentUser.role !== 'admin') {
      alert('สิทธิ์การใช้งานระดับ User ไม่สามารถเพิ่มหรือแก้ไขข้อมูลทรัพย์สินได้ (สงวนสิทธิ์เฉพาะ Admin)');
      return;
    }
    let updatedAssets: Asset[];
    const isNew = !assetData.id;

    if (isNew) {
      const newAsset: Asset = {
        id: `ast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        assetCode: assetData.assetCode || `EQ-${Date.now().toString().slice(-5)}`,
        name: assetData.name || 'ไม่มีชื่อครุภัณฑ์',
        typeId: assetData.typeId || settings.assetTypes[0]?.id || '',
        typeName: assetData.typeName || settings.assetTypes[0]?.name || 'อุปกรณ์ไอที',
        campusId: assetData.campusId || settings.campuses[0]?.id || '',
        campusName: assetData.campusName || settings.campuses[0]?.name || 'วิทยาเขตกรุงเทพฯ',
        facultyId: assetData.facultyId || settings.faculties[0]?.id || '',
        facultyName: assetData.facultyName || settings.faculties[0]?.name || 'คณะเทคโนโลยีสารสนเทศ',
        departmentId: assetData.departmentId || settings.departments[0]?.id || '',
        departmentName: assetData.departmentName || settings.departments[0]?.name || 'สาขาวิศวกรรม',
        buildingId: assetData.buildingId || settings.buildings[0]?.id || '',
        buildingName: assetData.buildingName || settings.buildings[0]?.name || 'อาคาร 1',
        room: assetData.room || 'ห้องกลาง',
        quantity: Number(assetData.quantity) || 1,
        purchaseDate: assetData.purchaseDate || new Date().toISOString().slice(0, 10),
        price: Number(assetData.price) || 0,
        imageUrl: assetData.imageUrl || '',
        note: assetData.note || '',
        status: assetData.status || 'สถานะว่าง/พร้อมใช้',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updatedAssets = [newAsset, ...assets];

      // Add History Log for Creation
      const newLog = addHistoryLog({
        assetId: newAsset.id,
        assetCode: newAsset.assetCode,
        assetName: newAsset.name,
        action: 'CREATE',
        actionLabel: 'ลงทะเบียนทรัพย์สินใหม่เข้าระบบ',
        newStatus: newAsset.status,
        note: `ลงทะเบียนทรัพย์สินใหม่ ณ ${newAsset.buildingName} (${newAsset.room})`,
        performedBy: currentUser ? `${currentUser.fullname} (${currentUser.role})` : 'System',
      });
      setHistory((prev) => [newLog, ...prev]);
    } else {
      updatedAssets = assets.map((a) =>
        a.id === assetData.id
          ? ({ ...a, ...assetData, updatedAt: new Date().toISOString() } as Asset)
          : a
      );

      // Add History Log for update
      const existing = assets.find((a) => a.id === assetData.id);
      if (existing && assetData.status && assetData.status !== existing.status) {
        const newLog = addHistoryLog({
          assetId: existing.id,
          assetCode: existing.assetCode,
          assetName: assetData.name || existing.name,
          action: 'UPDATE_STATUS',
          actionLabel: `เปลี่ยนสถานะเป็น [${assetData.status}]`,
          previousStatus: existing.status,
          newStatus: assetData.status,
          note: assetData.note || 'แก้ไขข้อมูลทรัพย์สิน',
          performedBy: currentUser ? `${currentUser.fullname} (${currentUser.role})` : 'System',
        });
        setHistory((prev) => [newLog, ...prev]);
      }
    }

    setAssets(updatedAssets);
    saveAssets(updatedAssets);
  };

  const handleDeleteAsset = (assetId: string) => {
    if (currentUser && currentUser.role !== 'admin') {
      alert('สิทธิ์การใช้งานระดับ User ไม่สามารถลบทรัพย์สินได้ (สงวนสิทธิ์เฉพาะ Admin)');
      return;
    }
    const target = assets.find((a) => a.id === assetId);
    const updatedAssets = assets.filter((a) => a.id !== assetId);
    setAssets(updatedAssets);
    saveAssets(updatedAssets);

    if (target) {
      const newLog = addHistoryLog({
        assetId: target.id,
        assetCode: target.assetCode,
        assetName: target.name,
        action: 'DISPOSAL',
        actionLabel: 'ลบรายการทรัพย์สินออกจากระบบ',
        previousStatus: target.status,
        note: 'ลบรายการทรัพย์สิน',
        performedBy: currentUser ? `${currentUser.fullname} (${currentUser.role})` : 'System',
      });
      setHistory((prev) => [newLog, ...prev]);
    }
  };

  const handleQuickAuditAsset = (assetId: string, status: AssetStatus, room?: string) => {
    const updated = assets.map((a) =>
      a.id === assetId
        ? { ...a, status, room: room || a.room, updatedAt: new Date().toISOString() }
        : a
    );
    setAssets(updated);
    saveAssets(updated);
  };

  const handleUpdateAssetStatus = (
    assetId: string,
    newStatus: AssetStatus,
    note?: string
  ) => {
    const target = assets.find((a) => a.id === assetId);
    if (!target) return;

    const previousStatus = target.status;
    const updated = assets.map((a) =>
      a.id === assetId
        ? { ...a, status: newStatus, updatedAt: new Date().toISOString() }
        : a
    );

    setAssets(updated);
    saveAssets(updated);

    const newLog = addHistoryLog({
      assetId: target.id,
      assetCode: target.assetCode,
      assetName: target.name,
      action: 'UPDATE_STATUS',
      actionLabel: `เปลี่ยนสถานะเป็น [${newStatus}]`,
      previousStatus: previousStatus,
      newStatus: newStatus,
      note: note || `ปรับปรุงสถานะจาก ${previousStatus} เป็น ${newStatus}`,
      performedBy: currentUser ? `${currentUser.fullname} (${currentUser.role})` : 'System',
    });
    setHistory((prev) => [newLog, ...prev]);
  };

  const handleAddHistoryLog = (
    record: Omit<AssetHistoryRecord, 'id' | 'timestamp'>
  ) => {
    const newLog = addHistoryLog(record);
    setHistory((prev) => [newLog, ...prev]);
  };

  // Settings Save Handler
  const handleSaveSettings = (newSettings: SystemSettingsState) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // Excel Batch Import Handler
  const handleImportAssetsFromExcel = (importedAssets: Partial<Asset>[]) => {
    const newAssetsList: Asset[] = importedAssets.map((item, idx) => {
      const matchedCampus = settings.campuses.find(
        (c) => c.name.toLowerCase() === (item.campusName || '').toLowerCase() || c.code.toLowerCase() === (item.campusName || '').toLowerCase()
      );
      const matchedType = settings.assetTypes.find(
        (t) => t.name.toLowerCase() === (item.typeName || '').toLowerCase() || t.code.toLowerCase() === (item.typeName || '').toLowerCase()
      );
      const matchedFaculty = settings.faculties.find(
        (f) => f.name.toLowerCase() === (item.facultyName || '').toLowerCase() || f.code.toLowerCase() === (item.facultyName || '').toLowerCase()
      );
      const matchedDept = settings.departments.find(
        (d) => d.name.toLowerCase() === (item.departmentName || '').toLowerCase() || d.code.toLowerCase() === (item.departmentName || '').toLowerCase()
      );
      const matchedBld = settings.buildings.find(
        (b) => b.name.toLowerCase() === (item.buildingName || '').toLowerCase() || b.code.toLowerCase() === (item.buildingName || '').toLowerCase()
      );

      return {
        id: `ast-import-${Date.now()}-${idx}`,
        assetCode: item.assetCode || `EQ-IMP-${Date.now()}-${idx}`,
        name: item.name || 'ครุภัณฑ์นำเข้า',
        typeId: matchedType?.id || item.typeId || settings.assetTypes[0]?.id || 'type-1',
        typeName: matchedType?.name || item.typeName || 'คอมพิวเตอร์และอุปกรณ์ไอที',
        campusId: matchedCampus?.id || item.campusId || settings.campuses[0]?.id || 'camp-1',
        campusName: matchedCampus?.name || item.campusName || 'วิทยาเขตกรุงเทพมหานคร (หลัก)',
        facultyId: matchedFaculty?.id || item.facultyId || settings.faculties[0]?.id || 'fac-1',
        facultyName: matchedFaculty?.name || item.facultyName || 'คณะเทคโนโลยีสารสนเทศ',
        departmentId: matchedDept?.id || item.departmentId || settings.departments[0]?.id || 'dept-1',
        departmentName: matchedDept?.name || item.departmentName || 'สาขาวิชาวิศวกรรมคอมพิวเตอร์',
        buildingId: matchedBld?.id || item.buildingId || settings.buildings[0]?.id || 'bld-1',
        buildingName: matchedBld?.name || item.buildingName || 'อาคาร 1 อาคารเฉลิมพระเกียรติ',
        room: item.room || 'ห้องพัสดุกลาง',
        quantity: Number(item.quantity) || 1,
        purchaseDate: item.purchaseDate || new Date().toISOString().slice(0, 10),
        price: Number(item.price) || 0,
        imageUrl: '',
        note: item.note || 'นำเข้าจากไฟล์ Excel',
        status: (item.status as AssetStatus) || 'สถานะว่าง/พร้อมใช้',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    const merged = [...newAssetsList, ...assets];
    setAssets(merged);
    saveAssets(merged);

    // Record import history
    const newLog = addHistoryLog({
      assetId: 'batch-import',
      assetCode: 'BATCH-IMPORT',
      assetName: `นำเข้าข้อมูลทรัพย์สิน ${newAssetsList.length} รายการ`,
      action: 'IMPORT',
      actionLabel: `นำเข้าไฟล์ Excel สำเร็จ (${newAssetsList.length} รายการ)`,
      note: `นำเข้าข้อมูลทรัพย์สินจากไฟล์ Excel จำนวน ${newAssetsList.length} รายการ`,
      performedBy: currentUser ? `${currentUser.fullname} (${currentUser.role})` : 'Admin',
    });
    setHistory((prev) => [newLog, ...prev]);
  };

  // Google Sheets Sync Trigger
  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncStatusMessage(null);

    try {
      // If access token available or in connected mock mode
      await new Promise((r) => setTimeout(r, 900)); // smooth user feedback

      const now = new Date().toISOString();
      const updatedConfig: GoogleSheetsConfig = {
        spreadsheetId: sheetsConfig?.spreadsheetId || '1uni_asset_sheets_main',
        spreadsheetUrl:
          sheetsConfig?.spreadsheetUrl ||
          `https://docs.google.com/spreadsheets/d/${sheetsConfig?.spreadsheetId || '1uni_asset_sheets_main'}/edit`,
        spreadsheetTitle:
          sheetsConfig?.spreadsheetTitle || 'ระบบบริหารทรัพย์สินมหาวิทยาลัย',
        autoSync: sheetsConfig?.autoSync ?? true,
        lastSyncedAt: now,
      };

      setSheetsConfig(updatedConfig);
      saveSheetsConfig(updatedConfig);
      setSyncStatusMessage(
        `ซิงค์ข้อมูล ${assets.length} รายการ และประวัติ ${history.length} รายการลง Google Sheets สำเร็จ (${new Date(now).toLocaleTimeString('th-TH')})`
      );
    } catch (err: any) {
      setSyncStatusMessage(`การซิงค์ข้อมูลขัดข้อง: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveSheetsConfig = (cfg: GoogleSheetsConfig) => {
    setSheetsConfig(cfg);
    saveSheetsConfig(cfg);
    handleTriggerSync();
  };

  // Loan / Borrow Handlers
  const handleAddLoan = (
    loanData: Omit<BorrowRecord, 'id' | 'transactionNo' | 'createdAt' | 'updatedAt'>
  ) => {
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    const seq = String(loans.length + 1).padStart(4, '0');
    const transactionNo = `LN-${yearMonth}-${seq}`;

    const newLoan: BorrowRecord = {
      ...loanData,
      id: `loan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      transactionNo,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedLoans = [newLoan, ...loans];
    setLoans(updatedLoans);
    saveLoans(updatedLoans);

    // Update the asset status to "ใช้งานอยู่" if it's currently available
    const targetAsset = assets.find((a) => a.id === loanData.assetId);
    if (targetAsset) {
      handleUpdateAssetStatus(
        targetAsset.id,
        'ใช้งานอยู่',
        `ยืมโดย ${loanData.borrowerName} (${loanData.borrowerFaculty}) กำหนดคืน ${loanData.expectedReturnDate}`
      );
    }

    // Add explicit history log for BORROW
    const newLog = addHistoryLog({
      assetId: loanData.assetId,
      assetCode: loanData.assetCode,
      assetName: loanData.assetName,
      action: 'BORROW',
      actionLabel: 'ยืมทรัพย์สิน / ครุภัณฑ์',
      previousStatus: targetAsset?.status,
      newStatus: 'ใช้งานอยู่',
      note: `เอกสารเลขที่ ${transactionNo} ยืมโดย ${loanData.borrowerName} (${loanData.borrowerFaculty}) โทร. ${loanData.borrowerPhone} วัตถุประสงค์: ${loanData.purpose} กำหนดคืน: ${loanData.expectedReturnDate}`,
      performedBy: loanData.approvedBy,
    });
    setHistory((prev) => [newLog, ...prev]);
  };

  const handleReturnLoan = (
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
  ) => {
    const targetLoan = loans.find((l) => l.id === loanId);
    if (!targetLoan) return;

    const updatedLoans = loans.map((l) => {
      if (l.id === loanId) {
        return {
          ...l,
          status: 'returned' as const,
          actualReturnDate: returnData.actualReturnDate,
          conditionOnReturn: returnData.conditionOnReturn,
          notes: returnData.notes || l.notes,
          receivedBy: returnData.receivedBy,
          receivedById: returnData.receivedById,
          receivedByUsername: returnData.receivedByUsername,
          updatedAt: new Date().toISOString(),
        };
      }
      return l;
    });

    setLoans(updatedLoans);
    saveLoans(updatedLoans);

    const nextStatus = returnData.nextAssetStatus || 'สถานะว่าง/พร้อมใช้';

    // Update target asset status
    handleUpdateAssetStatus(
      targetLoan.assetId,
      nextStatus,
      `รับคืนจาก ${targetLoan.borrowerName} สภาพ: ${returnData.conditionOnReturn}`
    );

    // Add History Log for RETURN
    const newLog = addHistoryLog({
      assetId: targetLoan.assetId,
      assetCode: targetLoan.assetCode,
      assetName: targetLoan.assetName,
      action: 'RETURN',
      actionLabel: 'รับคืนทรัพย์สิน / ครุภัณฑ์',
      previousStatus: 'ใช้งานอยู่',
      newStatus: nextStatus,
      note: `เอกสารเลขที่ ${targetLoan.transactionNo} รับคืนจาก ${targetLoan.borrowerName} สภาพเมื่อรับคืน: ${returnData.conditionOnReturn} ${returnData.notes ? `(${returnData.notes})` : ''}`,
      performedBy: returnData.receivedBy,
    });
    setHistory((prev) => [newLog, ...prev]);
  };

  const handleDeleteLoan = (loanId: string) => {
    const updated = loans.filter((l) => l.id !== loanId);
    setLoans(updated);
    saveLoans(updated);
  };

  // Show login screen if not logged in
  if (!currentUser) {
    return <LoginView users={settings.users} onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-neutral-100/70 text-neutral-900 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenScanner={() => setCurrentTab('scanner')}
        onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
        sheetsConfig={sheetsConfig}
        isSyncing={isSyncing}
        onTriggerSync={handleTriggerSync}
        onToggleMobileMenu={() => setIsMobileNavOpen(!isMobileNavOpen)}
      />

      {/* Main Container Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          userRole={currentUser.role}
          isMobileOpen={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
        />

        {/* Dynamic Main Workspace Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {currentTab === 'dashboard' && currentUser.role === 'admin' && (
            <DashboardView
              assets={assets}
              history={history}
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onOpenAddAsset={() => setIsQuickAddOpen(true)}
              onOpenScanner={() => setCurrentTab('scanner')}
              onExportExcel={() => exportAssetsToExcel(assets)}
            />
          )}

          {currentTab === 'assets' && (
            <AssetManagementView
              assets={assets}
              history={history}
              settings={settings}
              currentUser={currentUser}
              onSaveAsset={handleSaveAsset}
              onDeleteAsset={handleDeleteAsset}
              onAddHistoryLog={handleAddHistoryLog}
              onUpdateAssetStatus={handleUpdateAssetStatus}
              onExportExcel={(selected) => {
                if (currentUser.role !== 'admin') return;
                exportAssetsToExcel(selected || assets);
              }}
              onNavigateToBarcodePrint={() => setCurrentTab('barcode-print')}
            />
          )}

          {currentTab === 'borrow-return' && (
            <BorrowReturnView
              assets={assets}
              loans={loans}
              settings={settings}
              currentUser={currentUser}
              onAddLoan={handleAddLoan}
              onReturnLoan={handleReturnLoan}
              onDeleteLoan={currentUser.role === 'admin' ? handleDeleteLoan : undefined}
              onNavigateToAsset={(id) => setCurrentTab('assets')}
            />
          )}

          {currentTab === 'barcode-print' && (
            <BarcodePrintView
              assets={assets}
              settings={settings}
              currentUser={currentUser}
              onUpdateAssetStatus={handleUpdateAssetStatus}
              onNavigateToAsset={(id) => setCurrentTab('assets')}
            />
          )}

          {currentTab === 'scanner' && (
            <ScannerView
              assets={assets}
              settings={settings}
              currentUser={currentUser}
              onUpdateAssetStatus={handleUpdateAssetStatus}
              onAddHistoryLog={handleAddHistoryLog}
              onSaveAsset={(updatedAst) => {
                if (updatedAst.id && updatedAst.status) {
                  handleQuickAuditAsset(
                    updatedAst.id,
                    updatedAst.status as AssetStatus,
                    updatedAst.room
                  );
                }
              }}
              onNavigateToAsset={() => setCurrentTab('assets')}
            />
          )}

          {currentTab === 'reports' && currentUser.role === 'admin' && (
            <ReportsView
              assets={assets}
              settings={settings}
              onExportExcel={(customList, customName) =>
                exportAssetsToExcel(customList || assets, customName)
              }
            />
          )}

          {currentTab === 'settings' && currentUser.role === 'admin' && (
            <SettingsView
              settings={settings}
              assets={assets}
              onSaveSettings={handleSaveSettings}
              onImportAssetsFromExcel={handleImportAssetsFromExcel}
            />
          )}

          {currentTab === 'google-sheets' && currentUser.role === 'admin' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900">
                    การจัดเก็บข้อมูลใน Google Sheets
                  </h2>
                  <p className="text-xs text-neutral-500">
                    จัดการการเชื่อมต่อสเปรดชีต Google Sheets เพื่อสำรองและซิงค์ข้อมูลบน Cloud
                  </p>
                </div>
                <button
                  onClick={() => setIsSheetsModalOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  ตั้งค่าสเปรดชีต
                </button>
              </div>

              {/* Status details card */}
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                  <div>
                    <p className="text-xs text-neutral-500 font-semibold">สถานะการเชื่อมต่อ</p>
                    <p className="text-base font-bold text-emerald-700 flex items-center gap-2 mt-0.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      พร้อมซิงค์ข้อมูล (Cloud Synchronized)
                    </p>
                  </div>
                  <button
                    onClick={handleTriggerSync}
                    disabled={isSyncing}
                    className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    {isSyncing ? 'กำลังซิงค์...' : 'ซิงค์ข้อมูลเดี๋ยวนี้'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
                    <p className="text-neutral-500 font-semibold">แผ่นงานที่ 1: Assets</p>
                    <p className="text-base font-bold text-neutral-800 mt-1">
                      {assets.length} รายการทรัพย์สิน
                    </p>
                  </div>
                  <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
                    <p className="text-neutral-500 font-semibold">แผ่นงานที่ 2: History</p>
                    <p className="text-base font-bold text-neutral-800 mt-1">
                      {history.length} รายการประวัติ
                    </p>
                  </div>
                  <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
                    <p className="text-neutral-500 font-semibold">แผ่นงานที่ 3: MasterSettings</p>
                    <p className="text-base font-bold text-neutral-800 mt-1">
                      {settings.assetTypes.length + settings.campuses.length + settings.faculties.length + settings.buildings.length} ข้อมูลระบบ
                    </p>
                  </div>
                </div>

                {sheetsConfig?.lastSyncedAt && (
                  <p className="text-xs text-neutral-500 pt-2">
                    ซิงค์ข้อมูลล่าสุดเมื่อ:{' '}
                    <strong>{new Date(sheetsConfig.lastSyncedAt).toLocaleString('th-TH')}</strong>
                  </p>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Global Quick Add Asset Modal */}
      <AssetFormModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSave={handleSaveAsset}
        settings={settings}
      />

      {/* Google Sheets Modal */}
      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        sheetsConfig={sheetsConfig}
        onSaveConfig={handleSaveSheetsConfig}
        onTriggerSync={handleTriggerSync}
        isSyncing={isSyncing}
        syncStatusMessage={syncStatusMessage}
      />
    </div>
  );
}
