import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Building,
  Calendar,
  Clock,
  Edit,
  History,
  MapPin,
  PlusCircle,
  Printer,
  ShieldCheck,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import {
  ASSET_STATUSES,
  Asset,
  AssetHistoryRecord,
  AssetStatus,
  UserAccount,
} from '../types';
import { formatCurrency, getStatusStyle } from '../utils/statusUtils';

interface AssetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset | null;
  history: AssetHistoryRecord[];
  currentUser: UserAccount;
  onEditAsset: (asset: Asset) => void;
  onDeleteAsset: (assetId: string) => void;
  onAddHistoryLog: (
    record: Omit<AssetHistoryRecord, 'id' | 'timestamp'>
  ) => void;
  onUpdateAssetStatus: (assetId: string, newStatus: AssetStatus, note?: string) => void;
  onPrintTag: (asset: Asset) => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  isOpen,
  onClose,
  asset,
  history,
  currentUser,
  onEditAsset,
  onDeleteAsset,
  onAddHistoryLog,
  onUpdateAssetStatus,
  onPrintTag,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'add-log'>('details');
  const [newStatus, setNewStatus] = useState<AssetStatus>(
    asset?.status || 'สถานะว่าง/พร้อมใช้'
  );
  const [actionLabel, setActionLabel] = useState('ตรวจนับพัสดุประจำงวด');
  const [logNote, setLogNote] = useState('');
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !asset) return null;

  const style = getStatusStyle(asset.status);
  const assetHistory = history.filter((h) => h.assetId === asset.id || h.assetCode === asset.assetCode);

  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logNote.trim() && actionLabel.trim() === '') return;

    setIsSubmittingLog(true);

    // If status changed, update the asset status too
    if (newStatus !== asset.status) {
      onUpdateAssetStatus(asset.id, newStatus, logNote);
    } else {
      onAddHistoryLog({
        assetId: asset.id,
        assetCode: asset.assetCode,
        assetName: asset.name,
        action: 'INSPECTION',
        actionLabel: actionLabel || 'บันทึกการตรวจนับ',
        previousStatus: asset.status,
        newStatus: newStatus,
        note: logNote,
        performedBy: `${currentUser.fullname} (${currentUser.role})`,
      });
    }

    setLogNote('');
    setIsSubmittingLog(false);
    setActiveTab('history');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-linear-to-r from-orange-600 to-amber-500 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-black/20 text-orange-100">
                  {asset.assetCode}
                </span>
                <span className="text-xs bg-white text-orange-800 font-semibold px-2 py-0.5 rounded-full">
                  {asset.typeName}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold line-clamp-1 mt-0.5">
                {asset.name}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs inside Modal */}
        <div className="flex items-center border-b border-neutral-200 bg-neutral-50 px-6 pt-2">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'details'
                ? 'border-orange-500 text-orange-600 bg-white rounded-t-lg'
                : 'border-transparent text-neutral-600 hover:text-orange-600'
            }`}
          >
            รายละเอียดทรัพย์สิน
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-orange-500 text-orange-600 bg-white rounded-t-lg'
                : 'border-transparent text-neutral-600 hover:text-orange-600'
            }`}
          >
            <History className="w-4 h-4" />
            <span>ประวัติการเปลี่ยนแปลง ({assetHistory.length})</span>
          </button>
          <button
            onClick={() => {
              setNewStatus(asset.status);
              setActiveTab('add-log');
            }}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'add-log'
                ? 'border-orange-500 text-orange-600 bg-white rounded-t-lg'
                : 'border-transparent text-neutral-600 hover:text-orange-600'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>บันทึกประวัติ/ตรวจนับ</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="overflow-y-auto p-6 flex-1 text-sm space-y-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Top Banner with Image, Status & QR */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-neutral-50 p-4.5 rounded-2xl border border-neutral-200">
                {/* Asset Photo */}
                <div className="md:col-span-1">
                  <div className="w-full h-48 rounded-xl overflow-hidden bg-neutral-200 border border-neutral-300 flex items-center justify-center relative">
                    {asset.imageUrl ? (
                      <img
                        src={asset.imageUrl}
                        alt={asset.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-4 text-neutral-400">
                        <Tag className="w-10 h-10 mx-auto mb-1 text-neutral-400" />
                        <span className="text-xs">ไม่มีรูปภาพทรัพย์สิน</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status & Highlights */}
                <div className="md:col-span-2 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${style.lightBg} ${style.text} ${style.border}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${style.dot} mr-2`}></span>
                        {asset.status}
                      </span>

                      <span className="text-lg font-black text-orange-600">
                        {formatCurrency(asset.price)}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-500 font-normal">{style.description}</p>
                  </div>

                  {/* QR Code and Quick Print Box */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-neutral-200 gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-1 bg-white border border-neutral-200 rounded-lg">
                        <QRCodeSVG value={asset.assetCode} size={54} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-neutral-800">QR Code ประจำทรัพย์สิน</p>
                        <p className="text-[11px] text-neutral-500">สแกนตรวจสอบได้ทันทีผ่านกล้อง</p>
                      </div>
                    </div>

                    <button
                      onClick={() => onPrintTag(asset)}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>พิมพ์ป้าย QR</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Complete Property Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-3.5 rounded-xl bg-white border border-neutral-200 space-y-1">
                  <p className="text-xs text-neutral-500 font-semibold flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-neutral-400" />
                    <span>วิทยาเขต</span>
                  </p>
                  <p className="text-sm font-bold text-neutral-800">{asset.campusName || '-'}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-neutral-200 space-y-1">
                  <p className="text-xs text-neutral-500 font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
                    <span>สังกัด/คณะ</span>
                  </p>
                  <p className="text-sm font-bold text-neutral-800">{asset.facultyName || '-'}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-neutral-200 space-y-1">
                  <p className="text-xs text-neutral-500 font-semibold">สาขา/หน่วยงาน</p>
                  <p className="text-sm font-bold text-neutral-800">{asset.departmentName || '-'}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-neutral-200 space-y-1">
                  <p className="text-xs text-neutral-500 font-semibold">อาคารที่ติดตั้ง</p>
                  <p className="text-sm font-bold text-neutral-800">{asset.buildingName || '-'}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-neutral-200 space-y-1">
                  <p className="text-xs text-neutral-500 font-semibold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                    <span>ชื่อห้อง / จุดที่ตั้ง</span>
                  </p>
                  <p className="text-sm font-bold text-neutral-800 text-orange-700">{asset.room || '-'}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-neutral-200 space-y-1">
                  <p className="text-xs text-neutral-500 font-semibold">จำนวน</p>
                  <p className="text-sm font-bold text-neutral-800">{asset.quantity} หน่วย</p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-neutral-200 space-y-1">
                  <p className="text-xs text-neutral-500 font-semibold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                    <span>วันที่ซื้อ / จัดหา</span>
                  </p>
                  <p className="text-sm font-bold text-neutral-800">{asset.purchaseDate || '-'}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-neutral-200 space-y-1 sm:col-span-2">
                  <p className="text-xs text-neutral-500 font-semibold">หมายเหตุ / ข้อมูลจำเพาะ</p>
                  <p className="text-sm text-neutral-700">{asset.note || 'ไม่มีข้อมูลเพิ่มเติม'}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-neutral-800">
                  ประวัติการตรวจนับและเปลี่ยนแปลงสถานะ
                </h4>
                <button
                  onClick={() => setActiveTab('add-log')}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>บันทึกประวัติใหม่</span>
                </button>
              </div>

              {assetHistory.length === 0 ? (
                <div className="text-center py-10 bg-neutral-50 rounded-2xl border border-neutral-200">
                  <History className="w-8 h-8 mx-auto text-neutral-300 mb-2" />
                  <p className="text-xs text-neutral-500">ยังไม่มีบันทึกประวัติสำหรับทรัพย์สินนี้</p>
                </div>
              ) : (
                <div className="relative border-l-2 border-orange-200 ml-4 space-y-6 py-2">
                  {assetHistory.map((item) => (
                    <div key={item.id} className="relative pl-6">
                      <span className="absolute -left-2 top-1.5 w-4 h-4 rounded-full bg-orange-500 ring-4 ring-orange-100" />
                      <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-neutral-900">
                            {item.actionLabel || item.action}
                          </span>
                          <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(item.timestamp).toLocaleString('th-TH')}
                          </span>
                        </div>

                        {item.newStatus && (
                          <div className="text-xs text-neutral-600 flex items-center gap-2">
                            <span>สถานะ:</span>
                            {item.previousStatus && (
                              <>
                                <span className="text-neutral-400 line-through">
                                  {item.previousStatus}
                                </span>
                                <span>→</span>
                              </>
                            )}
                            <span className="font-bold text-orange-700">{item.newStatus}</span>
                          </div>
                        )}

                        {item.note && (
                          <p className="text-xs text-neutral-700 bg-white p-2.5 rounded-lg border border-neutral-200">
                            "{item.note}"
                          </p>
                        )}

                        <p className="text-[10px] text-neutral-400 pt-1">
                          ผู้บันทึก: {item.performedBy}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'add-log' && (
            <form onSubmit={handleSaveLog} className="space-y-4 max-w-xl mx-auto">
              <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200 text-xs text-orange-800">
                <p className="font-bold">บันทึกการตรวจนับ / เปลี่ยนแปลงสถานะทรัพย์สิน</p>
                <p className="text-[11px] text-orange-700 mt-0.5">
                  ระบบจะบันทึกประวัติการตรวจสอบพร้อมชื่อผู้ใช้งานและวันเวลาแบบอัตโนมัติ
                </p>
              </div>

              {/* Action Type */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  ประเภทรายการ
                </label>
                <select
                  value={actionLabel}
                  onChange={(e) => setActionLabel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-hidden bg-white"
                >
                  <option value="ตรวจนับพัสดุประจำปี/ประจำงวด">ตรวจนับพัสดุประจำปี/ประจำงวด</option>
                  <option value="เปลี่ยนสถานะการใช้งาน">เปลี่ยนสถานะการใช้งาน</option>
                  <option value="ส่งซ่อมบำรุง/แจ้งซ่อม">ส่งซ่อมบำรุง/แจ้งซ่อม</option>
                  <option value="ซ่อมบำรุงเสร็จสิ้น พร้อมใช้งาน">ซ่อมบำรุงเสร็จสิ้น พร้อมใช้งาน</option>
                  <option value="ย้ายสถานที่ติดตั้ง/เปลี่ยนห้อง">ย้ายสถานที่ติดตั้ง/เปลี่ยนห้อง</option>
                  <option value="ติดบาร์โค้ดลงทะเบียน">ติดบาร์โค้ดลงทะเบียน</option>
                  <option value="เสนอตัดจำหน่ายครุภัณฑ์">เสนอตัดจำหน่ายครุภัณฑ์</option>
                </select>
              </div>

              {/* Status Change */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  ปรับปรุงสถานะทรัพย์สิน (ปัจจุบัน: {asset.status})
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as AssetStatus)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-hidden bg-white font-bold text-orange-700"
                >
                  {ASSET_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Inspection Note */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  รายละเอียดการตรวจสอบ / หมายเหตุ <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={logNote}
                  onChange={(e) => setLogNote(e.target.value)}
                  placeholder="ระบุสภาพของอุปกรณ์, ผลการตรวจนับ, หรือรายละเอียดการซ่อมแซม..."
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('details')}
                  className="px-4 py-2 rounded-xl border border-neutral-300 text-neutral-700 text-xs font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLog}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  บันทึกประวัติทันที
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer Controls */}
        {showDeleteConfirm ? (
          <div className="px-6 py-4 bg-red-50 border-t border-red-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-xs text-red-800 font-medium">
              <Trash2 className="w-4 h-4 text-red-600 shrink-0" />
              <span>ยืนยันที่จะลบทรัพย์สิน <strong>{asset.assetCode}</strong> ({asset.name}) หรือไม่?</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-bold transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  onDeleteAsset(asset.id);
                  setShowDeleteConfirm(false);
                  onClose();
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ยืนยันการลบ</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onPrintTag(asset)}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-xs font-bold transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-orange-600" />
                <span>พิมพ์ป้าย QR/บาร์โค้ด</span>
              </button>

              {currentUser.role === 'admin' && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white border border-red-200 hover:bg-red-50 text-red-600 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>ลบรายการ</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {currentUser.role === 'admin' && (
                <button
                  onClick={() => {
                    onEditAsset(asset);
                    onClose();
                  }}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Edit className="w-4 h-4" />
                  <span>แก้ไขข้อมูล</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-xs font-bold cursor-pointer"
              >
                ปิด
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
