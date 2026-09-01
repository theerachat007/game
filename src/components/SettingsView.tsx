import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Building,
  Building2,
  Check,
  CheckCircle,
  CheckCircle2,
  Copy,
  Download,
  Edit,
  FileSpreadsheet,
  FileText,
  FileUp,
  Filter,
  HelpCircle,
  Info,
  KeyRound,
  Layers,
  ListFilter,
  Plus,
  Save,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Trash2,
  Upload,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import {
  Asset,
  MasterItem,
  SystemSettingsState,
  UserAccount,
  UserRole,
} from '../types';
import {
  generateSampleExcelTemplate,
  parseExcelFile,
} from '../services/storageService';

interface SettingsViewProps {
  settings: SystemSettingsState;
  assets?: Asset[];
  onSaveSettings: (settings: SystemSettingsState) => void;
  onImportAssetsFromExcel: (importedAssets: Partial<Asset>[]) => void;
}

type SettingsTab =
  | 'types'
  | 'campuses'
  | 'faculties'
  | 'departments'
  | 'buildings'
  | 'users'
  | 'excel-import';

interface DeleteTarget {
  category: 'types' | 'campuses' | 'faculties' | 'departments' | 'buildings' | 'users';
  id: string;
  name: string;
  code?: string;
  role?: string;
  categoryLabel: string;
  usedInAssetsCount: number;
  sampleAssets: { assetCode: string; name: string }[];
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  assets = [],
  onSaveSettings,
  onImportAssetsFromExcel,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('types');

  // Master Item Edit/Add Modal State
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [editingMasterItem, setEditingMasterItem] = useState<MasterItem | null>(null);
  const [masterCode, setMasterCode] = useState('');
  const [masterName, setMasterName] = useState('');
  const [masterError, setMasterError] = useState('');

  // Delete Confirmation Modal State (Reliable in-app modal instead of browser confirm)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // User Account Edit/Add Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [userForm, setUserForm] = useState<Partial<UserAccount>>({
    fullname: '',
    position: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    role: 'user',
  });
  const [userError, setUserError] = useState('');

  // Excel Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [previewAssets, setPreviewAssets] = useState<Partial<Asset>[]>([]);
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  // Excel Reference Explorer & Filter State
  const [refTopic, setRefTopic] = useState<'campuses' | 'types' | 'faculties' | 'departments' | 'buildings' | 'statuses'>('campuses');
  const [refSearch, setRefSearch] = useState('');
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [previewSearch, setPreviewSearch] = useState('');
  const [previewCampusFilter, setPreviewCampusFilter] = useState('');
  const [previewTypeFilter, setPreviewTypeFilter] = useState('');
  const [previewStatusFilter, setPreviewStatusFilter] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleCopyRef = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(text);
    showToast(`คัดลอก "${text}" เรียบร้อย`);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  const tabs = [
    { id: 'types' as SettingsTab, label: 'ประเภทอุปกรณ์', icon: Layers, count: settings.assetTypes.length },
    { id: 'campuses' as SettingsTab, label: 'วิทยาเขต', icon: Building2, count: settings.campuses.length },
    { id: 'faculties' as SettingsTab, label: 'สังกัด/คณะ', icon: ShieldCheck, count: settings.faculties.length },
    { id: 'departments' as SettingsTab, label: 'สาขา/หน่วยงาน', icon: FileText, count: settings.departments.length },
    { id: 'buildings' as SettingsTab, label: 'อาคาร', icon: Building, count: settings.buildings.length },
    { id: 'users' as SettingsTab, label: 'บัญชีผู้ใช้งาน & สิทธิ์', icon: Users, count: settings.users.length },
    { id: 'excel-import' as SettingsTab, label: 'นำเข้าข้อมูลจาก Excel', icon: FileSpreadsheet, count: null },
  ];

  // Helper for Master Items (Types, Campuses, Faculties, Depts, Buildings)
  const getCurrentMasterList = (): MasterItem[] => {
    switch (activeTab) {
      case 'types':
        return settings.assetTypes;
      case 'campuses':
        return settings.campuses;
      case 'faculties':
        return settings.faculties;
      case 'departments':
        return settings.departments;
      case 'buildings':
        return settings.buildings;
      default:
        return [];
    }
  };

  const getTabTitles = () => {
    switch (activeTab) {
      case 'types':
        return { title: 'ตั้งค่าประเภทอุปกรณ์', codeLabel: 'รหัสประเภทอุปกรณ์', nameLabel: 'ชื่อประเภทอุปกรณ์' };
      case 'campuses':
        return { title: 'ตั้งค่าวิทยาเขต', codeLabel: 'รหัสวิทยาเขต', nameLabel: 'ชื่อวิทยาเขต' };
      case 'faculties':
        return { title: 'ตั้งค่าสังกัด/คณะ', codeLabel: 'รหัสสังกัด/คณะ', nameLabel: 'ชื่อสังกัด/คณะ' };
      case 'departments':
        return { title: 'ตั้งค่าสาขา/หน่วยงาน', codeLabel: 'รหัสสาขา/หน่วยงาน', nameLabel: 'ชื่อสาขา/หน่วยงาน' };
      case 'buildings':
        return { title: 'ตั้งค่าอาคาร', codeLabel: 'รหัสอาคาร', nameLabel: 'ชื่ออาคาร' };
      default:
        return { title: 'ตั้งค่า', codeLabel: 'รหัส', nameLabel: 'ชื่อ' };
    }
  };

  const handleOpenAddMaster = () => {
    setEditingMasterItem(null);
    setMasterCode('');
    setMasterName('');
    setMasterError('');
    setIsMasterModalOpen(true);
  };

  const handleOpenEditMaster = (item: MasterItem) => {
    setEditingMasterItem(item);
    setMasterCode(item.code);
    setMasterName(item.name);
    setMasterError('');
    setIsMasterModalOpen(true);
  };

  const handleSaveMasterItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterCode.trim() || !masterName.trim()) {
      setMasterError('กรุณากรอกรหัสและชื่อให้ครบถ้วน');
      return;
    }

    const currentList = getCurrentMasterList();
    let updatedList: MasterItem[];

    if (editingMasterItem) {
      updatedList = currentList.map((item) =>
        item.id === editingMasterItem.id
          ? { ...item, code: masterCode.trim(), name: masterName.trim() }
          : item
      );
    } else {
      const newItem: MasterItem = {
        id: `${activeTab}-${Date.now()}`,
        code: masterCode.trim(),
        name: masterName.trim(),
      };
      updatedList = [...currentList, newItem];
    }

    const newSettings: SystemSettingsState = { ...settings };
    if (activeTab === 'types') newSettings.assetTypes = updatedList;
    else if (activeTab === 'campuses') newSettings.campuses = updatedList;
    else if (activeTab === 'faculties') newSettings.faculties = updatedList;
    else if (activeTab === 'departments') newSettings.departments = updatedList;
    else if (activeTab === 'buildings') newSettings.buildings = updatedList;

    onSaveSettings(newSettings);
    setIsMasterModalOpen(false);
    showToast(editingMasterItem ? `แก้ไขข้อมูล "${masterName.trim()}" สำเร็จ` : `เพิ่มข้อมูล "${masterName.trim()}" สำเร็จ`);
  };

  // Safe Delete Handlers with Asset Dependency Analysis
  const handleInitiateDeleteMaster = (item: MasterItem) => {
    const tabNameMap: Record<string, string> = {
      types: 'ประเภทอุปกรณ์',
      campuses: 'วิทยาเขต',
      faculties: 'สังกัด/คณะ',
      departments: 'สาขา/หน่วยงาน',
      buildings: 'อาคาร',
    };

    // Find assets linked to this master item
    const relatedAssets = assets.filter((a) => {
      if (activeTab === 'types') {
        return a.typeId === item.id || a.typeName === item.name || a.typeCode === item.code;
      }
      if (activeTab === 'campuses') {
        return a.campusId === item.id || a.campusName === item.name || a.campusCode === item.code;
      }
      if (activeTab === 'faculties') {
        return a.facultyId === item.id || a.facultyName === item.name || a.facultyCode === item.code;
      }
      if (activeTab === 'departments') {
        return a.departmentId === item.id || a.departmentName === item.name;
      }
      if (activeTab === 'buildings') {
        return a.buildingId === item.id || a.buildingName === item.name || a.buildingCode === item.code;
      }
      return false;
    });

    setDeleteTarget({
      category: activeTab as any,
      id: item.id,
      name: item.name,
      code: item.code,
      categoryLabel: tabNameMap[activeTab] || 'การตั้งค่า',
      usedInAssetsCount: relatedAssets.length,
      sampleAssets: relatedAssets.slice(0, 3).map((a) => ({ assetCode: a.assetCode, name: a.name })),
    });
  };

  const handleInitiateDeleteUser = (u: UserAccount) => {
    if (settings.users.length <= 1) {
      showToast('ไม่สามารถลบบัญชีนี้ได้ เนื่องจากต้องมีผู้ดูแลระบบอย่างน้อย 1 บัญชี');
      return;
    }
    setDeleteTarget({
      category: 'users',
      id: u.id,
      name: u.fullname,
      code: u.username,
      role: u.role,
      categoryLabel: 'บัญชีผู้ใช้งาน',
      usedInAssetsCount: 0,
      sampleAssets: [],
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.category === 'users') {
      const updatedUsers = settings.users.filter((u) => u.id !== deleteTarget.id);
      onSaveSettings({
        ...settings,
        users: updatedUsers,
      });
      showToast(`ลบบัญชีผู้ใช้ "${deleteTarget.name}" สำเร็จแล้ว`);
    } else {
      const targetCategory = deleteTarget.category;
      let updatedList: MasterItem[] = [];

      if (targetCategory === 'types') {
        updatedList = settings.assetTypes.filter((item) => item.id !== deleteTarget.id);
      } else if (targetCategory === 'campuses') {
        updatedList = settings.campuses.filter((item) => item.id !== deleteTarget.id);
      } else if (targetCategory === 'faculties') {
        updatedList = settings.faculties.filter((item) => item.id !== deleteTarget.id);
      } else if (targetCategory === 'departments') {
        updatedList = settings.departments.filter((item) => item.id !== deleteTarget.id);
      } else if (targetCategory === 'buildings') {
        updatedList = settings.buildings.filter((item) => item.id !== deleteTarget.id);
      }

      const newSettings: SystemSettingsState = { ...settings };
      if (targetCategory === 'types') newSettings.assetTypes = updatedList;
      else if (targetCategory === 'campuses') newSettings.campuses = updatedList;
      else if (targetCategory === 'faculties') newSettings.faculties = updatedList;
      else if (targetCategory === 'departments') newSettings.departments = updatedList;
      else if (targetCategory === 'buildings') newSettings.buildings = updatedList;

      onSaveSettings(newSettings);
      showToast(`ลบข้อมูล "${deleteTarget.name}" สำเร็จแล้ว`);
    }

    setDeleteTarget(null);
  };

  // User Account Handlers
  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserForm({
      fullname: '',
      position: '',
      email: '',
      phone: '',
      username: '',
      password: '',
      role: 'user',
    });
    setUserError('');
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (u: UserAccount) => {
    setEditingUser(u);
    setUserForm(u);
    setUserError('');
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !userForm.fullname?.trim() ||
      !userForm.username?.trim() ||
      !userForm.password?.trim()
    ) {
      setUserError('กรุณากรอกชื่อ-นามสกุล, username และ password ให้ครบถ้วน');
      return;
    }

    let updatedUsers: UserAccount[];
    if (editingUser) {
      updatedUsers = settings.users.map((u) =>
        u.id === editingUser.id ? ({ ...u, ...userForm } as UserAccount) : u
      );
    } else {
      const newUser: UserAccount = {
        id: `user-${Date.now()}`,
        fullname: userForm.fullname.trim(),
        position: userForm.position?.trim() || '',
        email: userForm.email?.trim() || '',
        phone: userForm.phone?.trim() || '',
        username: userForm.username.trim(),
        password: userForm.password.trim(),
        role: userForm.role || 'user',
        createdAt: new Date().toISOString(),
      };
      updatedUsers = [...settings.users, newUser];
    }

    onSaveSettings({
      ...settings,
      users: updatedUsers,
    });
    setIsUserModalOpen(false);
    showToast(editingUser ? `แก้ไขบัญชีผู้ใช้ "${userForm.fullname}" สำเร็จ` : `เพิ่มบัญชีผู้ใช้ "${userForm.fullname}" สำเร็จ`);
  };

  // Excel File Input Handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setIsParsingExcel(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      const parsed = await parseExcelFile(file);
      if (parsed.length === 0) {
        setImportError('ไม่พบข้อมูลทรัพย์สินในไฟล์ Excel ที่เลือก หรือคอลัมน์ไม่ตรงตามรูปแบบ');
      } else {
        setPreviewAssets(parsed);
        showToast(`อ่านข้อมูลจาก Excel สำเร็จ พบ ${parsed.length} รายการพร้อมนำเข้า`);
      }
    } catch (err: any) {
      setImportError(`เกิดข้อผิดพลาดในการอ่านไฟล์ Excel: ${err.message || 'รูปแบบไฟล์ไม่ถูกต้อง'}`);
    } finally {
      setIsParsingExcel(false);
    }
  };

  const handleConfirmExcelImport = () => {
    if (previewAssets.length === 0) return;
    onImportAssetsFromExcel(previewAssets);
    setImportSuccess(`นำเข้าข้อมูลทรัพย์สินจำนวน ${previewAssets.length} รายการเข้าสู่ระบบเรียบร้อย`);
    showToast(`นำเข้าทรัพย์สิน ${previewAssets.length} รายการสำเร็จ`);
    setPreviewAssets([]);
    setImportFile(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Settings Header */}
      <div className="bg-white p-5 rounded-2xl border border-orange-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-orange-500 text-white shadow-xs shadow-orange-300">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-900">
              ตั้งค่าระบบ (System Configuration)
            </h2>
            <p className="text-xs text-neutral-500">
              จัดการข้อมูลหลัก: ประเภทอุปกรณ์ วิทยาเขต สังกัด/คณะ สาขา อาคาร ผู้ใช้งาน และนำเข้าไฟล์ Excel
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto space-x-2 pb-1 scrollbar-thin">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs shrink-0 transition-all cursor-pointer ${
                isActive
                  ? 'bg-orange-500 text-white shadow-xs shadow-orange-300'
                  : 'bg-white text-neutral-600 hover:bg-orange-50 hover:text-orange-600 border border-neutral-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-orange-600 text-white' : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: MASTER DATA ITEMS (Types, Campuses, Faculties, Departments, Buildings) */}
      {['types', 'campuses', 'faculties', 'departments', 'buildings'].includes(activeTab) && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 bg-neutral-50 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-neutral-800">
                {getTabTitles().title} ({getCurrentMasterList().length} รายการ)
              </h3>
              <p className="text-xs text-neutral-500">
                สามารถเพิ่ม แก้ไข และลบข้อมูลได้ตามต้องการ
              </p>
            </div>
            <button
              onClick={handleOpenAddMaster}
              className="flex items-center space-x-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มรายการใหม่</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-100 border-b border-neutral-200 text-neutral-600 font-bold">
                <tr>
                  <th className="py-3 px-4 w-16 text-center">ลำดับ</th>
                  <th className="py-3 px-4 w-48">{getTabTitles().codeLabel}</th>
                  <th className="py-3 px-4">{getTabTitles().nameLabel}</th>
                  <th className="py-3 px-4 text-right w-32">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {getCurrentMasterList().map((item, idx) => (
                  <tr key={item.id} className="hover:bg-orange-50/40 transition-colors">
                    <td className="py-3 px-4 text-center text-neutral-400 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-orange-700">
                      {item.code}
                    </td>
                    <td className="py-3 px-4 font-semibold text-neutral-800 text-sm">
                      {item.name}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleOpenEditMaster(item)}
                          className="p-1.5 rounded-lg bg-neutral-100 hover:bg-orange-100 text-neutral-700 hover:text-orange-700 transition-colors cursor-pointer"
                          title="แก้ไข"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleInitiateDeleteMaster(item)}
                          className="p-1.5 rounded-lg bg-neutral-100 hover:bg-red-100 text-neutral-700 hover:text-red-700 transition-colors cursor-pointer"
                          title="ลบข้อมูล"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: USER ACCOUNTS & PERMISSIONS */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 bg-neutral-50 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-neutral-800">
                ตั้งค่าบัญชีผู้ดูแลระบบและผู้ใช้งาน ({settings.users.length} บัญชี)
              </h3>
              <p className="text-xs text-neutral-500">
                กำหนดสิทธิ์ Admin (เข้าถึงได้ทุกเมนู) หรือ User (เข้าถึงเฉพาะข้อมูลทรัพย์สินและสแกน)
              </p>
            </div>
            <button
              onClick={handleOpenAddUser}
              className="flex items-center space-x-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มบัญชีผู้ใช้ใหม่</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-100 border-b border-neutral-200 text-neutral-600 font-bold">
                <tr>
                  <th className="py-3 px-4">ชื่อ-นามสกุล</th>
                  <th className="py-3 px-4">ตำแหน่ง</th>
                  <th className="py-3 px-4">อีเมล / เบอร์โทร</th>
                  <th className="py-3 px-4">Username / Password</th>
                  <th className="py-3 px-4">สิทธิ์การใช้งาน</th>
                  <th className="py-3 px-4 text-right w-32">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {settings.users.map((u) => (
                  <tr key={u.id} className="hover:bg-orange-50/40 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-neutral-900 text-sm">{u.fullname}</p>
                      <p className="text-[10px] text-neutral-400">ID: {u.id}</p>
                    </td>
                    <td className="py-3 px-4 text-neutral-700 font-medium">{u.position || '-'}</td>
                    <td className="py-3 px-4 text-neutral-600">
                      <p>{u.email || '-'}</p>
                      <p className="text-[11px] text-neutral-400">{u.phone || '-'}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-mono font-bold text-orange-700">user: {u.username}</p>
                      <p className="font-mono text-neutral-500 text-[11px]">pass: {u.password}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                          u.role === 'admin'
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {u.role === 'admin' ? (
                          <Shield className="w-3.5 h-3.5 text-orange-600" />
                        ) : (
                          <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                        )}
                        <span>{u.role === 'admin' ? 'Admin (ทุกเมนู)' : 'User (ทรัพย์สิน)'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleOpenEditUser(u)}
                          className="p-1.5 rounded-lg bg-neutral-100 hover:bg-orange-100 text-neutral-700 hover:text-orange-700 transition-colors cursor-pointer"
                          title="แก้ไข"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleInitiateDeleteUser(u)}
                          className="p-1.5 rounded-lg bg-neutral-100 hover:bg-red-100 text-neutral-700 hover:text-red-700 transition-colors cursor-pointer"
                          title="ลบ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: EXCEL DATA IMPORT */}
      {activeTab === 'excel-import' && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-neutral-800">
              นำเข้าข้อมูลทรัพย์สินจากไฟล์ Excel (.xlsx / .xls)
            </h3>
            <p className="text-xs text-neutral-500">
              ดาวน์โหลดเทมเพลตมาตรฐานที่มีระบบ AutoFilter และชีตอ้างอิงข้อมูลตั้งค่าระบบ แล้วอัปโหลดกลับเข้าสู่ระบบได้ทันที
            </p>
          </div>

          {/* Download Template Banner */}
          <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-white rounded-xl text-orange-600 shadow-xs border border-orange-200">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-orange-950">
                  ดาวน์โหลดไฟล์ Template นำเข้าทรัพย์สิน
                </p>
                <p className="text-[11px] text-orange-800">
                  ไฟล์ตัวอย่างมีโครงสร้างคอลัมน์ครบถ้วนตามมาตรฐานระบบมหาวิทยาลัย
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                generateSampleExcelTemplate();
                showToast('ดาวน์โหลด Template นำเข้าทรัพย์สินเรียบร้อย');
              }}
              className="flex items-center space-x-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>ดาวน์โหลด Template Excel</span>
            </button>
          </div>

          {/* Upload Dropzone */}
          <div className="border-2 border-dashed border-neutral-300 hover:border-orange-500 rounded-2xl p-8 text-center transition-colors bg-neutral-50/50">
            <Upload className="w-10 h-10 mx-auto text-orange-500 mb-2" />
            <h4 className="text-sm font-bold text-neutral-800">
              {importFile ? importFile.name : 'เลือกหรือลากไฟล์ Excel เพื่อนำเข้าข้อมูล'}
            </h4>
            <p className="text-xs text-neutral-500 mt-1">รองรับไฟล์รูปแบบ .xlsx และ .xls</p>

            <label className="mt-4 inline-flex items-center space-x-2 px-5 py-2.5 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 rounded-xl text-xs font-bold shadow-xs cursor-pointer">
              <FileUp className="w-4 h-4 text-orange-600" />
              <span>{importFile ? 'เปลี่ยนไฟล์' : 'เลือกไฟล์จากเครื่อง'}</span>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Messages */}
          {importError && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{importError}</span>
            </div>
          )}

          {importSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{importSuccess}</span>
            </div>
          )}

          {/* Parsed Preview Table */}
          {previewAssets.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-neutral-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-orange-700">
                    พรีวิวข้อมูลทรัพย์สินที่อ่านได้ ({previewAssets.length} รายการ)
                  </h4>
                  <p className="text-[11px] text-neutral-500">
                    ตรวจสอบ 7 ข้อมูลหลักที่เชื่อมโยงกับระบบตั้งค่าก่อนกดบันทึก
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setPreviewAssets([]);
                      setImportFile(null);
                    }}
                    className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleConfirmExcelImport}
                    className="flex items-center space-x-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>ยืนยันการนำเข้าข้อมูล {previewAssets.length} รายการ</span>
                  </button>
                </div>
              </div>

              {/* Preview Filters */}
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-wrap gap-2 items-center">
                <div className="relative flex-1 min-w-[140px]">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="ค้นหาในรายการพรีวิว..."
                    value={previewSearch}
                    onChange={(e) => setPreviewSearch(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs focus:outline-hidden focus:border-orange-500"
                  />
                </div>

                <select
                  value={previewCampusFilter}
                  onChange={(e) => setPreviewCampusFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-700"
                >
                  <option value="">-- วิทยาเขตทั้งหมด --</option>
                  {settings.campuses.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>

                <select
                  value={previewTypeFilter}
                  onChange={(e) => setPreviewTypeFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-700"
                >
                  <option value="">-- ประเภทอุปกรณ์ทั้งหมด --</option>
                  {settings.assetTypes.map((t) => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>

                <select
                  value={previewStatusFilter}
                  onChange={(e) => setPreviewStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-700"
                >
                  <option value="">-- สถานะทั้งหมด --</option>
                  <option value="สถานะว่าง/พร้อมใช้">สถานะว่าง/พร้อมใช้</option>
                  <option value="กำลังใช้งาน">กำลังใช้งาน</option>
                  <option value="ส่งซ่อม/บำรุงรักษา">ส่งซ่อม/บำรุงรักษา</option>
                  <option value="จำหน่าย/ตัดชำรุด">จำหน่าย/ตัดชำรุด</option>
                </select>
              </div>

              {/* Table */}
              <div className="overflow-x-auto border border-neutral-200 rounded-xl max-h-96 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-100 text-neutral-700 font-bold border-b border-neutral-200 sticky top-0 z-10">
                    <tr>
                      <th className="p-2.5">รหัสครุภัณฑ์</th>
                      <th className="p-2.5">ชื่อครุภัณฑ์</th>
                      <th className="p-2.5">วิทยาเขต</th>
                      <th className="p-2.5">ประเภทอุปกรณ์</th>
                      <th className="p-2.5">สังกัด/คณะ</th>
                      <th className="p-2.5">สาขา/หน่วยงาน</th>
                      <th className="p-2.5">อาคาร</th>
                      <th className="p-2.5">ชื่อห้อง</th>
                      <th className="p-2.5">ราคา (บาท)</th>
                      <th className="p-2.5">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {previewAssets
                      .filter((a) => {
                        const matchSearch =
                          !previewSearch ||
                          (a.assetCode || '').toLowerCase().includes(previewSearch.toLowerCase()) ||
                          (a.name || '').toLowerCase().includes(previewSearch.toLowerCase()) ||
                          (a.room || '').toLowerCase().includes(previewSearch.toLowerCase());
                        const matchCampus =
                          !previewCampusFilter || (a.campusName || '').includes(previewCampusFilter);
                        const matchType =
                          !previewTypeFilter || (a.typeName || '').includes(previewTypeFilter);
                        const matchStatus =
                          !previewStatusFilter || a.status === previewStatusFilter;
                        return matchSearch && matchCampus && matchType && matchStatus;
                      })
                      .map((a, i) => (
                        <tr key={i} className="hover:bg-orange-50/40">
                          <td className="p-2.5 font-mono font-bold text-orange-700 whitespace-nowrap">
                            {a.assetCode || '-'}
                          </td>
                          <td className="p-2.5 font-medium text-neutral-900 min-w-[140px]">
                            {a.name || '-'}
                          </td>
                          <td className="p-2.5 text-neutral-700 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-[11px]">
                              {a.campusName || '-'}
                            </span>
                          </td>
                          <td className="p-2.5 text-neutral-700 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px]">
                              {a.typeName || '-'}
                            </span>
                          </td>
                          <td className="p-2.5 text-neutral-700 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 text-[11px]">
                              {a.facultyName || '-'}
                            </span>
                          </td>
                          <td className="p-2.5 text-neutral-700 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200 text-[11px]">
                              {a.departmentName || '-'}
                            </span>
                          </td>
                          <td className="p-2.5 text-neutral-700 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[11px]">
                              {a.buildingName || '-'}
                            </span>
                          </td>
                          <td className="p-2.5 font-medium text-neutral-800 whitespace-nowrap">
                            {a.room || '-'}
                          </td>
                          <td className="p-2.5 font-bold text-neutral-800 whitespace-nowrap">
                            {Number(a.price || 0).toLocaleString()} ฿
                          </td>
                          <td className="p-2.5 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                                a.status === 'สถานะว่าง/พร้อมใช้'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : a.status === 'กำลังใช้งาน'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : a.status === 'ส่งซ่อม/บำรุงรักษา'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-red-50 text-red-700 border-red-200'
                              }`}
                            >
                              {a.status || 'สถานะว่าง/พร้อมใช้'}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MASTER ITEM ADD/EDIT MODAL */}
      {isMasterModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-orange-600 text-white flex items-center justify-between">
              <h4 className="text-sm font-bold">
                {editingMasterItem ? `แก้ไข${getTabTitles().title}` : `เพิ่ม${getTabTitles().title}`}
              </h4>
              <button
                onClick={() => setIsMasterModalOpen(false)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMasterItem} className="p-6 space-y-4 text-xs">
              {masterError && (
                <div className="p-2.5 rounded-lg bg-red-50 text-red-700 border border-red-200">
                  {masterError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  {getTabTitles().codeLabel} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={masterCode}
                  onChange={(e) => setMasterCode(e.target.value)}
                  placeholder="เช่น รหัสตัวย่อ หรือรหัสมาตรฐาน"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  {getTabTitles().nameLabel} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={masterName}
                  onChange={(e) => setMasterName(e.target.value)}
                  placeholder="เช่น ชื่อเต็มทางการ"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMasterModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 rounded-xl text-neutral-700 font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-xs"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USER ACCOUNT ADD/EDIT MODAL */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-orange-600 text-white flex items-center justify-between">
              <h4 className="text-sm font-bold">
                {editingUser ? 'แก้ไขข้อมูลผู้ใช้งาน' : 'เพิ่มบัญชีผู้ใช้งานใหม่'}
              </h4>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-3.5 text-xs">
              {userError && (
                <div className="p-2.5 rounded-lg bg-red-50 text-red-700 border border-red-200">
                  {userError}
                </div>
              )}

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  ชื่อ-นามสกุล <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={userForm.fullname || ''}
                  onChange={(e) => setUserForm({ ...userForm, fullname: e.target.value })}
                  placeholder="เช่น นายธีรเดช ทวีทรัพย์"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">ตำแหน่ง</label>
                  <input
                    type="text"
                    value={userForm.position || ''}
                    onChange={(e) => setUserForm({ ...userForm, position: e.target.value })}
                    placeholder="เช่น เจ้าหน้าที่บริหารงานพัสดุ"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    value={userForm.phone || ''}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    placeholder="เช่น 02-123-4567"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">อีเมล</label>
                <input
                  type="email"
                  value={userForm.email || ''}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="เช่น user@university.ac.th"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-100">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    ชื่อผู้ใช้งาน (Username) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={userForm.username || ''}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    placeholder="เช่น admin หรือ user"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl font-mono focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    รหัสผ่าน (Password) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={userForm.password || ''}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    placeholder="กำหนดรหัสผ่าน"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl font-mono focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  สิทธิ์การใช้งานระบบ (Permission) <span className="text-red-500">*</span>
                </label>
                <select
                  value={userForm.role || 'user'}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl font-bold text-orange-800 bg-orange-50/50 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                >
                  <option value="admin">admin (เข้าถึงได้ทุกเมนู - จัดการระบบ/พัสดุ/รายงาน/ตั้งค่า)</option>
                  <option value="user">user (เข้าถึงเฉพาะเมนูข้อมูลทรัพย์สินและสแกน)</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 rounded-xl text-neutral-700 font-semibold cursor-pointer hover:bg-neutral-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  บันทึกข้อมูลบัญชี
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IN-APP DELETE CONFIRMATION MODAL WITH DEPENDENCY CHECK */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-red-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-white/20 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">ยืนยันการลบข้อมูล</h3>
                  <p className="text-[11px] text-red-100">
                    หมวดหมู่: {deleteTarget.categoryLabel}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDeleteTarget(null)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Item Info Box */}
              <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      รายการที่จะลบ
                    </span>
                    <h4 className="text-base font-bold text-neutral-900 mt-0.5">
                      {deleteTarget.name}
                    </h4>
                  </div>
                  {deleteTarget.code && (
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-200">
                      {deleteTarget.code}
                    </span>
                  )}
                </div>
              </div>

              {/* Asset Dependency Analysis */}
              {deleteTarget.category !== 'users' && (
                <div>
                  {deleteTarget.usedInAssetsCount > 0 ? (
                    <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-2">
                      <div className="flex items-center space-x-2 text-xs font-bold text-amber-800">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                        <span>
                          มีทรัพย์สินในระบบที่กำลังใช้งานข้อมูลนี้อยู่ {deleteTarget.usedInAssetsCount} รายการ
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-700 leading-relaxed">
                        หากท่านลบรายการนี้ ข้อมูลทรัพย์สินเดิมจะไม่สูญหาย แต่จะไม่ปรากฏชื่อนี้ให้เลือกในการเพิ่ม/แก้ไขทรัพย์สินใหม่อีกต่อไป
                      </p>
                      {deleteTarget.sampleAssets.length > 0 && (
                        <div className="pt-1.5 border-t border-amber-200/60">
                          <p className="text-[10px] font-semibold text-amber-800 mb-1">
                            ตัวอย่างทรัพย์สินที่ผูกอยู่:
                          </p>
                          <div className="space-y-1">
                            {deleteTarget.sampleAssets.map((ast, i) => (
                              <div key={i} className="text-[11px] font-mono text-amber-900 bg-white/60 px-2 py-0.5 rounded border border-amber-200 truncate">
                                <span className="font-bold">{ast.assetCode}</span> - {ast.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 flex items-center space-x-2 text-xs">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>
                        ไม่พบรายการทรัพย์สินที่ผูกกับข้อมูลนี้ สามารถลบได้อย่างปลอดภัย
                      </span>
                    </div>
                  )}
                </div>
              )}

              {deleteTarget.category === 'users' && (
                <div className="p-3 bg-neutral-100 rounded-xl text-xs text-neutral-600">
                  <p>
                    คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีผู้ใช้ <strong>{deleteTarget.name}</strong> (Username: <code>{deleteTarget.code}</code>) ออกจากระบบอย่างถาวร?
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 border border-neutral-300 rounded-xl text-neutral-700 text-xs font-bold hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ยืนยันการลบ</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
