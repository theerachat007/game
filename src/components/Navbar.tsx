import React from 'react';
import {
  Building2,
  FileSpreadsheet,
  LogOut,
  Menu,
  QrCode,
  RefreshCw,
  Shield,
  User as UserIcon,
} from 'lucide-react';
import { GoogleSheetsConfig, UserAccount } from '../types';

interface NavbarProps {
  currentUser: UserAccount;
  onLogout: () => void;
  onOpenScanner: () => void;
  onOpenSheetsModal: () => void;
  sheetsConfig: GoogleSheetsConfig | null;
  isSyncing: boolean;
  onTriggerSync: () => void;
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  onOpenScanner,
  onOpenSheetsModal,
  sheetsConfig,
  isSyncing,
  onTriggerSync,
  onToggleMobileMenu,
}) => {
  return (
    <header className="bg-white border-b border-orange-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Brand */}
          <div className="flex items-center space-x-3">
            {onToggleMobileMenu && (
              <button
                id="btn-mobile-menu-toggle"
                onClick={onToggleMobileMenu}
                className="lg:hidden p-2 rounded-lg text-neutral-600 hover:text-orange-600 hover:bg-orange-50 focus:outline-hidden"
                aria-label="เปิดเมนู"
              >
                <Menu className="w-6 h-6" />
              </button>
            )}
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-sm shadow-orange-200">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-neutral-900 leading-tight tracking-tight flex items-center gap-1.5">
                  <span>ระบบบริหารทรัพย์สิน</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 hidden sm:inline-block">
                    มหาวิทยาลัย
                  </span>
                </h1>
                <p className="text-xs text-neutral-500 hidden sm:block">
                  University Asset Management System
                </p>
              </div>
            </div>
          </div>

          {/* Right Action buttons & User profile */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick Scan QR button */}
            <button
              id="btn-nav-scan-qr"
              onClick={onOpenScanner}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 transition-colors"
            >
              <QrCode className="w-4 h-4 text-orange-600" />
              <span className="hidden xs:inline">สแกน QR ตรวจสอบ</span>
            </button>

            {/* Google Sheets Sync status button (Admin only) */}
            {currentUser.role === 'admin' && (
              <button
                id="btn-nav-google-sheets"
                onClick={sheetsConfig?.spreadsheetId ? onTriggerSync : onOpenSheetsModal}
                disabled={isSyncing}
                title={
                  sheetsConfig?.spreadsheetId
                    ? `ซิงค์กับ Google Sheet ล่าสุด: ${
                        sheetsConfig.lastSyncedAt
                          ? new Date(sheetsConfig.lastSyncedAt).toLocaleTimeString('th-TH')
                          : 'ยังไม่เคยซิงค์'
                      }`
                    : 'เชื่อมต่อ Google Sheets'
                }
                className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg border transition-all ${
                  sheetsConfig?.spreadsheetId
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                <FileSpreadsheet
                  className={`w-4 h-4 ${
                    sheetsConfig?.spreadsheetId ? 'text-emerald-600' : 'text-neutral-500'
                  }`}
                />
                <span className="hidden md:inline">
                  {sheetsConfig?.spreadsheetId ? 'Google Sheets' : 'เชื่อมต่อ Sheets'}
                </span>
                {isSyncing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                ) : sheetsConfig?.spreadsheetId ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200"></span>
                ) : null}
              </button>
            )}

            {/* User Profile Badge */}
            <div className="flex items-center space-x-2 pl-2 sm:border-l sm:border-neutral-200">
              <div className="flex items-center space-x-2 bg-neutral-50 py-1.5 px-2.5 rounded-lg border border-neutral-200">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    currentUser.role === 'admin' ? 'bg-orange-600' : 'bg-blue-600'
                  }`}
                >
                  {currentUser.role === 'admin' ? (
                    <Shield className="w-3.5 h-3.5" />
                  ) : (
                    <UserIcon className="w-3.5 h-3.5" />
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-neutral-800 leading-none">
                    {currentUser.fullname.split(' ')[0]}
                  </p>
                  <span
                    className={`text-[10px] font-medium leading-none ${
                      currentUser.role === 'admin' ? 'text-orange-600' : 'text-blue-600'
                    }`}
                  >
                    {currentUser.role === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : 'ผู้ใช้งาน (User)'}
                  </span>
                </div>
              </div>

              {/* Logout button */}
              <button
                id="btn-logout"
                onClick={onLogout}
                title="ออกจากระบบ"
                className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                aria-label="ออกจากระบบ"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
