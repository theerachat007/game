import React, { useState, useMemo } from 'react';
import {
  Boxes,
  CheckSquare,
  ChevronDown,
  Download,
  Eye,
  Filter,
  Grid,
  Layers,
  List,
  Lock,
  Plus,
  Printer,
  QrCode,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Square,
  Tag,
} from 'lucide-react';
import {
  ASSET_STATUSES,
  Asset,
  AssetHistoryRecord,
  AssetStatus,
  SystemSettingsState,
  UserAccount,
} from '../types';
import { formatCurrency, formatNumber, getStatusStyle } from '../utils/statusUtils';
import { AssetDetailModal } from './AssetDetailModal';
import { AssetFormModal } from './AssetFormModal';
import { PrintTagModal } from './PrintTagModal';

interface AssetManagementViewProps {
  assets: Asset[];
  history: AssetHistoryRecord[];
  settings: SystemSettingsState;
  currentUser: UserAccount;
  onSaveAsset: (assetData: Partial<Asset>) => void;
  onDeleteAsset: (assetId: string) => void;
  onAddHistoryLog: (record: Omit<AssetHistoryRecord, 'id' | 'timestamp'>) => void;
  onUpdateAssetStatus: (assetId: string, newStatus: AssetStatus, note?: string) => void;
  onExportExcel: (selectedAssets?: Asset[]) => void;
  onNavigateToBarcodePrint?: () => void;
}

export const AssetManagementView: React.FC<AssetManagementViewProps> = ({
  assets,
  history,
  settings,
  currentUser,
  onSaveAsset,
  onDeleteAsset,
  onAddHistoryLog,
  onUpdateAssetStatus,
  onExportExcel,
  onNavigateToBarcodePrint,
}) => {
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCampus, setSelectedCampus] = useState<string>('ALL');
  const [selectedFaculty, setSelectedFaculty] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null);
  const [printAssets, setPrintAssets] = useState<Asset[]>([]);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Batch selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        asset.assetCode.toLowerCase().includes(q) ||
        asset.name.toLowerCase().includes(q) ||
        asset.room.toLowerCase().includes(q) ||
        asset.buildingName.toLowerCase().includes(q) ||
        asset.departmentName.toLowerCase().includes(q);

      const matchStatus = selectedStatus === 'ALL' || asset.status === selectedStatus;
      const matchCampus = selectedCampus === 'ALL' || asset.campusName === selectedCampus;
      const matchFaculty = selectedFaculty === 'ALL' || asset.facultyName === selectedFaculty;
      const matchType = selectedType === 'ALL' || asset.typeName === selectedType;

      return matchSearch && matchStatus && matchCampus && matchFaculty && matchType;
    });
  }, [assets, searchQuery, selectedStatus, selectedCampus, selectedFaculty, selectedType]);

  const handleSelectAll = () => {
    if (selectedIds.size === filteredAssets.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAssets.map((a) => a.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBatchPrint = () => {
    const selected = assets.filter((a) => selectedIds.has(a.id));
    if (selected.length > 0) {
      setPrintAssets(selected);
      setIsPrintModalOpen(true);
    }
  };

  const handleBatchStatusChange = (status: AssetStatus) => {
    if (selectedIds.size === 0) return;
    if (
      confirm(
        `คุณต้องการเปลี่ยนสถานะของ ${selectedIds.size} รายการเป็น "${status}" หรือไม่?`
      )
    ) {
      selectedIds.forEach((id) => {
        onUpdateAssetStatus(id, status, `เปลี่ยนสถานะเป็นกลุ่ม (${selectedIds.size} รายการ)`);
      });
      setSelectedIds(new Set());
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('ALL');
    setSelectedCampus('ALL');
    setSelectedFaculty('ALL');
    setSelectedType('ALL');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-orange-100 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-orange-100 text-orange-600">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900">
                ข้อมูลทรัพย์สิน (Asset Management)
              </h2>
              <p className="text-xs text-neutral-500">
                ค้นหา จัดการ พิมพ์ป้ายบาร์โค้ด QR Code และบันทึกประวัติการตรวจสอบ
              </p>
            </div>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {currentUser.role === 'admin' ? (
            <button
              id="btn-add-asset-top"
              onClick={() => {
                setEditingAsset(null);
                setIsFormModalOpen(true);
              }}
              className="flex items-center space-x-2 px-4 py-2.5 bg-linear-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มทรัพย์สินใหม่</span>
            </button>
          ) : (
            <div
              className="flex items-center space-x-2 px-3.5 py-2.5 bg-neutral-100/80 text-neutral-400 rounded-xl text-xs sm:text-sm font-medium border border-neutral-200 cursor-not-allowed opacity-75 select-none"
              title="สิทธิ์ User ไม่สามารถเพิ่มทรัพย์สินใหม่ได้ (สงวนสิทธิ์เฉพาะผู้ดูแลระบบ Admin)"
            >
              <Lock className="w-3.5 h-3.5 text-neutral-400" />
              <span className="hidden sm:inline">เพิ่มทรัพย์สิน (เฉพาะ Admin)</span>
            </div>
          )}

          {onNavigateToBarcodePrint && (
            <button
              onClick={onNavigateToBarcodePrint}
              className="flex items-center space-x-1.5 px-3 py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl text-xs sm:text-sm font-semibold border border-orange-200 transition-colors cursor-pointer"
              title="พิมพ์บาร์โค้ดและสติกเกอร์ทรัพย์สิน"
            >
              <Printer className="w-4 h-4 text-orange-600" />
              <span className="hidden sm:inline">พิมพ์บาร์โค้ด</span>
            </button>
          )}

          {currentUser.role === 'admin' ? (
            <button
              onClick={() => onExportExcel(filteredAssets)}
              className="flex items-center space-x-1.5 px-3 py-2.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 rounded-xl text-xs sm:text-sm font-semibold border border-neutral-200 transition-colors cursor-pointer"
              title="ส่งออกรายการที่กรองเป็นไฟล์ Excel (สิทธิ์เฉพาะ Admin)"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">ส่งออก Excel</span>
            </button>
          ) : (
            <div
              className="flex items-center space-x-1.5 px-3 py-2.5 bg-neutral-100/80 text-neutral-400 rounded-xl text-xs sm:text-sm font-medium border border-neutral-200 cursor-not-allowed opacity-75 select-none"
              title="สิทธิ์ User ทั่วไปไม่สามารถส่งออกไฟล์ Excel ได้ (สงวนสิทธิ์เฉพาะผู้ดูแลระบบ Admin)"
            >
              <Lock className="w-3.5 h-3.5 text-neutral-400" />
              <span className="hidden sm:inline">ส่งออก Excel (เฉพาะ Admin)</span>
            </div>
          )}

          {/* View mode toggle */}
          <div className="flex items-center bg-neutral-100 p-1 rounded-xl border border-neutral-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-orange-600 shadow-2xs' : 'text-neutral-500'
              }`}
              title="มุมมองแบบการ์ด"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-orange-600 shadow-2xs' : 'text-neutral-500'
              }`}
              title="มุมมองแบบตาราง"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-4.5 rounded-2xl border border-orange-100 shadow-xs space-y-3.5">
        {/* Main Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
            <Search className="w-5 h-5 text-orange-500" />
          </div>
          <input
            id="input-search-asset"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาจาก รหัสทรัพย์สิน, ชื่อครุภัณฑ์, ชื่อห้อง, อาคาร หรือสาขาวิชา..."
            className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:bg-white transition-all font-medium placeholder-neutral-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-neutral-400 hover:text-neutral-600"
            >
              ล้างคำค้น
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-semibold text-neutral-800 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
            >
              <option value="ALL">สถานะทั้งหมด (ทุกสถานะ)</option>
              {ASSET_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Campus Filter */}
          <div>
            <select
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-semibold text-neutral-800 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
            >
              <option value="ALL">วิทยาเขตทั้งหมด</option>
              {settings.campuses.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Faculty Filter */}
          <div>
            <select
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-semibold text-neutral-800 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
            >
              <option value="ALL">สังกัด/คณะทั้งหมด</option>
              {settings.faculties.map((f) => (
                <option key={f.id} value={f.name}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-semibold text-neutral-800 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
            >
              <option value="ALL">ประเภทอุปกรณ์ทั้งหมด</option>
              {settings.assetTypes.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>

            {(selectedStatus !== 'ALL' ||
              selectedCampus !== 'ALL' ||
              selectedFaculty !== 'ALL' ||
              selectedType !== 'ALL' ||
              searchQuery) && (
              <button
                onClick={handleResetFilters}
                className="p-2 rounded-xl border border-neutral-300 text-neutral-600 hover:bg-neutral-100 text-xs shrink-0"
                title="ล้างตัวกรองทั้งหมด"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 6 Status Quick Filter Chips */}
        <div className="pt-2 flex flex-wrap items-center gap-1.5 border-t border-neutral-100">
          <span className="text-[11px] font-bold text-neutral-400 mr-1">สถานะ:</span>
          <button
            onClick={() => setSelectedStatus('ALL')}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
              selectedStatus === 'ALL'
                ? 'bg-neutral-800 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            ทั้งหมด ({assets.length})
          </button>
          {ASSET_STATUSES.map((st) => {
            const isSel = selectedStatus === st;
            const count = assets.filter((a) => a.status === st).length;
            const stStyle = getStatusStyle(st);
            return (
              <button
                key={st}
                onClick={() => setSelectedStatus(isSel ? 'ALL' : st)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                  isSel
                    ? `${stStyle.bg} text-white border-transparent shadow-2xs`
                    : `${stStyle.lightBg} ${stStyle.text} ${stStyle.border} hover:opacity-80`
                }`}
              >
                {st} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Batch Operations Bar (when items are selected) */}
      {selectedIds.size > 0 && (
        <div className="bg-orange-50 border border-orange-300 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center space-x-2 text-xs font-bold text-orange-900">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-600 animate-pulse"></span>
            <span>เลือกอยู่ {selectedIds.size} รายการ</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleBatchPrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white text-orange-700 border border-orange-300 rounded-xl text-xs font-bold hover:bg-orange-100 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์ป้าย QR ({selectedIds.size})</span>
            </button>

            {/* Batch Status Change Menu */}
            <div className="relative group">
              <button className="flex items-center space-x-1.5 px-3 py-1.5 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition-colors cursor-pointer">
                <span>เปลี่ยนสถานะเป็น...</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <div className="hidden group-hover:block absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-neutral-200 py-1.5 w-64 z-20">
                {ASSET_STATUSES.map((st) => (
                  <button
                    key={st}
                    onClick={() => handleBatchStatusChange(st)}
                    className="w-full px-3.5 py-1.5 text-left text-xs font-medium text-neutral-700 hover:bg-orange-50 hover:text-orange-700 flex items-center justify-between"
                  >
                    <span>{st}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-2.5 py-1.5 text-xs text-neutral-500 hover:text-neutral-700 font-semibold cursor-pointer"
            >
              ยกเลิกการเลือก
            </button>
          </div>
        </div>
      )}

      {/* Assets Count & Summary Bar */}
      <div className="flex items-center justify-between text-xs text-neutral-500 px-1">
        <span>
          พบทรัพย์สินทั้งหมด <strong className="text-neutral-800">{filteredAssets.length}</strong> รายการ
        </span>
        <button
          onClick={handleSelectAll}
          className="text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1.5 cursor-pointer"
        >
          {selectedIds.size === filteredAssets.length && filteredAssets.length > 0 ? (
            <CheckSquare className="w-4 h-4" />
          ) : (
            <Square className="w-4 h-4" />
          )}
          <span>{selectedIds.size === filteredAssets.length && filteredAssets.length > 0 ? 'ยกเลิกเลือกทั้งหมด' : 'เลือกทั้งหมดในหน้านี้'}</span>
        </button>
      </div>

      {/* Content: Grid Mode vs Table Mode */}
      {filteredAssets.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-neutral-300">
          <Boxes className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
          <h4 className="text-base font-bold text-neutral-700">ไม่พบข้อมูลทรัพย์สิน</h4>
          <p className="text-xs text-neutral-400 mt-1">
            ลองปรับเปลี่ยนคำค้นหา หรือคลิกล้างตัวกรองเพื่อดูรายการทั้งหมด
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-4 px-4 py-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-200 text-xs font-bold hover:bg-orange-100 cursor-pointer"
          >
            ล้างคำค้นและตัวกรอง
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredAssets.map((asset) => {
            const isSelected = selectedIds.has(asset.id);
            const style = getStatusStyle(asset.status);

            return (
              <div
                key={asset.id}
                className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                  isSelected ? 'border-orange-500 ring-2 ring-orange-200' : 'border-neutral-200 hover:border-orange-300'
                }`}
              >
                <div>
                  {/* Card Top: Image + Checkbox + Code */}
                  <div className="relative h-40 bg-neutral-100 overflow-hidden border-b border-neutral-100">
                    {asset.imageUrl ? (
                      <img
                        src={asset.imageUrl}
                        alt={asset.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-neutral-300 bg-neutral-50">
                        <Boxes className="w-10 h-10" />
                        <span className="text-[10px] mt-1">ไม่มีรูปภาพ</span>
                      </div>
                    )}

                    {/* Selection Checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleSelectOne(asset.id)}
                      className="absolute top-2.5 left-2.5 p-1 rounded-lg bg-white/90 backdrop-blur-xs text-neutral-700 shadow-xs hover:bg-white cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-orange-600" />
                      ) : (
                        <Square className="w-4 h-4 text-neutral-400" />
                      )}
                    </button>

                    {/* Asset Code Pill */}
                    <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-xs text-white font-mono text-[11px] font-bold">
                      {asset.assetCode}
                    </span>
                  </div>

                  {/* Card Info */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-bold text-orange-700 uppercase tracking-tight truncate">
                        {asset.typeName}
                      </span>
                      <span className="text-xs font-extrabold text-neutral-900">
                        {formatCurrency(asset.price)}
                      </span>
                    </div>

                    <h4
                      onClick={() => setDetailAsset(asset)}
                      className="text-sm font-bold text-neutral-900 line-clamp-2 hover:text-orange-600 cursor-pointer"
                    >
                      {asset.name}
                    </h4>

                    {/* Location Tag */}
                    <div className="space-y-1 text-[11px] text-neutral-600 bg-neutral-50 p-2.5 rounded-xl border border-neutral-100">
                      <p className="truncate">
                        <span className="font-semibold text-neutral-700">คณะ:</span> {asset.facultyName}
                      </p>
                      <p className="truncate font-medium text-orange-800">
                        <span className="font-semibold text-neutral-700">สถานที่:</span> {asset.buildingName ? `${asset.buildingName.split(' ')[0]} / ${asset.room}` : asset.room}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className="pt-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border w-full justify-center ${style.lightBg} ${style.text} ${style.border}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot} mr-1.5`}></span>
                        <span className="truncate">{asset.status}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-3 bg-neutral-50/80 border-t border-neutral-100 flex items-center justify-between gap-1.5">
                  <button
                    onClick={() => setDetailAsset(asset)}
                    className="flex-1 flex items-center justify-center space-x-1 py-1.5 bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-orange-600" />
                    <span>ประวัติ/ดู</span>
                  </button>

                  <button
                    onClick={() => {
                      setPrintAssets([asset]);
                      setIsPrintModalOpen(true);
                    }}
                    className="p-1.5 bg-white border border-neutral-200 hover:bg-orange-50 text-neutral-600 hover:text-orange-600 rounded-lg transition-colors cursor-pointer"
                    title="พิมพ์ป้าย QR"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>

                  {currentUser.role === 'admin' && (
                    <button
                      onClick={() => {
                        setEditingAsset(asset);
                        setIsFormModalOpen(true);
                      }}
                      className="p-1.5 bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-600 rounded-lg transition-colors cursor-pointer"
                      title="แก้ไขข้อมูล (เฉพาะ Admin)"
                    >
                      <Tag className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-bold">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">
                    <button onClick={handleSelectAll} className="cursor-pointer">
                      {selectedIds.size === filteredAssets.length && filteredAssets.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-orange-600" />
                      ) : (
                        <Square className="w-4 h-4 text-neutral-400" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-3">รหัสทรัพย์สิน</th>
                  <th className="py-3 px-3">ชื่อครุภัณฑ์</th>
                  <th className="py-3 px-3">ประเภทอุปกรณ์</th>
                  <th className="py-3 px-3">วิทยาเขต/สังกัด</th>
                  <th className="py-3 px-3">อาคาร/ห้อง</th>
                  <th className="py-3 px-3">จำนวน</th>
                  <th className="py-3 px-3">ราคา</th>
                  <th className="py-3 px-3">สถานะ</th>
                  <th className="py-3 px-3 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredAssets.map((asset) => {
                  const isSelected = selectedIds.has(asset.id);
                  const style = getStatusStyle(asset.status);

                  return (
                    <tr
                      key={asset.id}
                      className={`hover:bg-orange-50/50 transition-colors ${
                        isSelected ? 'bg-orange-50/70' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => toggleSelectOne(asset.id)}
                          className="cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-orange-600" />
                          ) : (
                            <Square className="w-4 h-4 text-neutral-400" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-orange-700">
                        {asset.assetCode}
                      </td>
                      <td className="py-3 px-3 font-semibold text-neutral-900 max-w-[200px]">
                        <p className="truncate">{asset.name}</p>
                      </td>
                      <td className="py-3 px-3 text-neutral-600">{asset.typeName}</td>
                      <td className="py-3 px-3 text-neutral-600">
                        <p className="font-medium text-neutral-800">{asset.campusName?.split(' ')[0]}</p>
                        <p className="text-[10px] text-neutral-400">{asset.facultyName}</p>
                      </td>
                      <td className="py-3 px-3 text-neutral-700">
                        <p className="font-medium text-orange-700">{asset.room}</p>
                        <p className="text-[10px] text-neutral-400">{asset.buildingName}</p>
                      </td>
                      <td className="py-3 px-3 text-neutral-700">{asset.quantity}</td>
                      <td className="py-3 px-3 font-bold text-neutral-800">
                        {formatCurrency(asset.price)}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${style.lightBg} ${style.text} ${style.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot} mr-1.5`}></span>
                          {asset.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => setDetailAsset(asset)}
                            className="p-1.5 rounded-lg bg-neutral-50 hover:bg-neutral-200 text-neutral-600"
                            title="ดูรายละเอียดและประวัติ"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setPrintAssets([asset]);
                              setIsPrintModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-neutral-50 hover:bg-orange-100 text-neutral-600 hover:text-orange-600"
                            title="พิมพ์ป้าย QR"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                          {currentUser.role === 'admin' && (
                            <button
                              onClick={() => {
                                setEditingAsset(asset);
                                setIsFormModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-neutral-50 hover:bg-neutral-200 text-neutral-600"
                              title="แก้ไข (เฉพาะ Admin)"
                            >
                              <Tag className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub Modals */}
      <AssetFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={onSaveAsset}
        initialAsset={editingAsset}
        settings={settings}
      />

      <AssetDetailModal
        isOpen={!!detailAsset}
        onClose={() => setDetailAsset(null)}
        asset={detailAsset}
        history={history}
        currentUser={currentUser}
        onEditAsset={(ast) => {
          if (currentUser.role !== 'admin') return;
          setDetailAsset(null);
          setEditingAsset(ast);
          setIsFormModalOpen(true);
        }}
        onDeleteAsset={onDeleteAsset}
        onAddHistoryLog={onAddHistoryLog}
        onUpdateAssetStatus={onUpdateAssetStatus}
        onPrintTag={(ast) => {
          setPrintAssets([ast]);
          setIsPrintModalOpen(true);
        }}
      />

      <PrintTagModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        assets={printAssets}
      />
    </div>
  );
};
