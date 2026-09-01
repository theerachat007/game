import React from 'react';
import {
  ArrowLeftRight,
  BarChart3,
  Boxes,
  FileSpreadsheet,
  LayoutDashboard,
  Printer,
  QrCode,
  Settings,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { UserRole } from '../types';

export type NavTab =
  | 'dashboard'
  | 'assets'
  | 'borrow-return'
  | 'barcode-print'
  | 'scanner'
  | 'reports'
  | 'settings'
  | 'google-sheets';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  userRole: UserRole;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  userRole,
  isMobileOpen,
  onCloseMobile,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'แดชบอร์ดภาพรวม',
      icon: LayoutDashboard,
      roles: ['admin'] as UserRole[],
      badge: 'Dashboard',
    },
    {
      id: 'assets' as NavTab,
      label: 'ข้อมูลทรัพย์สิน',
      icon: Boxes,
      roles: ['admin', 'user'] as UserRole[],
      badge: 'เมนูที่ 2',
    },
    {
      id: 'borrow-return' as NavTab,
      label: 'ระบบยืม-คืนทรัพย์สิน',
      icon: ArrowLeftRight,
      roles: ['admin', 'user'] as UserRole[],
      badge: 'ยืม-คืน',
    },
    {
      id: 'barcode-print' as NavTab,
      label: 'พิมพ์บาร์โค้ดทรัพย์สิน',
      icon: Printer,
      roles: ['admin', 'user'] as UserRole[],
      badge: 'สติกเกอร์',
    },
    {
      id: 'scanner' as NavTab,
      label: 'สแกน QR Code ตรวจสอบและแก้ไขสถานะ',
      icon: QrCode,
      roles: ['admin', 'user'] as UserRole[],
      badge: 'สแกน/ตรวจนับ',
    },
    {
      id: 'reports' as NavTab,
      label: 'รายงานทรัพย์สิน',
      icon: BarChart3,
      roles: ['admin'] as UserRole[],
      badge: '6 รายงาน',
    },
    {
      id: 'settings' as NavTab,
      label: 'ตั้งค่าระบบ',
      icon: Settings,
      roles: ['admin'] as UserRole[],
      badge: 'เมนูที่ 1',
    },
    {
      id: 'google-sheets' as NavTab,
      label: 'เชื่อมต่อ Google Sheets',
      icon: FileSpreadsheet,
      roles: ['admin'] as UserRole[],
      badge: 'Cloud Sync',
    },
  ];

  const filteredNavItems = navItems.filter((item) => item.roles.includes(userRole));

  const content = (
    <div className="flex flex-col h-full bg-white border-r border-orange-100 p-4 select-none">
      {/* Role Pill Banner */}
      <div className="mb-4 p-3 rounded-xl bg-linear-to-r from-orange-50 to-amber-50 border border-orange-200">
        <div className="flex items-center space-x-2">
          {userRole === 'admin' ? (
            <ShieldCheck className="w-5 h-5 text-orange-600 shrink-0" />
          ) : (
            <UserCheck className="w-5 h-5 text-blue-600 shrink-0" />
          )}
          <div>
            <p className="text-xs font-bold text-neutral-800">
              {userRole === 'admin' ? 'สิทธิ์ผู้ดูแลระบบ (Admin)' : 'สิทธิ์ผู้ใช้งาน (User)'}
            </p>
            <p className="text-[11px] text-neutral-500">
              {userRole === 'admin'
                ? 'เข้าถึงได้ทุกเมนูการทำงาน'
                : 'ข้อมูลทรัพย์สิน, ยืม-คืน, สแกน QR ตรวจสอบ'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="space-y-1.5 flex-1">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-link-${item.id}`}
              onClick={() => {
                onSelectTab(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all text-left ${
                isActive
                  ? 'bg-orange-500 text-white shadow-xs shadow-orange-200 font-semibold'
                  : 'text-neutral-700 hover:bg-orange-50 hover:text-orange-600'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                <span>{item.label}</span>
              </div>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                  isActive ? 'bg-orange-600 text-orange-100' : 'bg-neutral-100 text-neutral-500'
                }`}
              >
                {item.badge}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="pt-4 border-t border-neutral-100 text-center">
        <p className="text-[11px] font-semibold text-neutral-600">
          ระบบบริหารทรัพย์สินมหาวิทยาลัย
        </p>
        <p className="text-[10px] text-neutral-400">เวอร์ชัน 2.5 • รองรับมือถือ & สแกนเนอร์</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-16 h-[calc(100vh-4rem)]">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-xl z-10">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
