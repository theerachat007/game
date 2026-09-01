import React, { useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Sparkles,
  Table,
  UploadCloud,
  X,
} from 'lucide-react';
import { GoogleSheetsConfig } from '../types';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheetsConfig: GoogleSheetsConfig | null;
  onSaveConfig: (config: GoogleSheetsConfig) => void;
  onTriggerSync: () => void;
  isSyncing: boolean;
  syncStatusMessage?: string | null;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  sheetsConfig,
  onSaveConfig,
  onTriggerSync,
  isSyncing,
  syncStatusMessage,
}) => {
  const [spreadsheetId, setSpreadsheetId] = useState(
    sheetsConfig?.spreadsheetId || ''
  );
  const [spreadsheetTitle, setSpreadsheetTitle] = useState(
    sheetsConfig?.spreadsheetTitle || 'ระบบบริหารทรัพย์สินมหาวิทยาลัย (Asset Management)'
  );
  const [autoSync, setAutoSync] = useState(sheetsConfig?.autoSync ?? true);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = spreadsheetId.trim();
    const url = cleanId
      ? `https://docs.google.com/spreadsheets/d/${cleanId}/edit`
      : '';

    onSaveConfig({
      spreadsheetId: cleanId,
      spreadsheetUrl: url,
      spreadsheetTitle: spreadsheetTitle.trim(),
      autoSync: autoSync,
      lastSyncedAt: sheetsConfig?.lastSyncedAt,
    });
    onClose();
  };

  const handleCreateMockSheetId = () => {
    // Generate a new clean Spreadsheet representation ID
    const sampleId = '1uni_asset_' + Math.random().toString(36).substring(2, 12) + '_sheet';
    setSpreadsheetId(sampleId);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-orange-100 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4.5 bg-linear-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-white/20 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">เชื่อมต่อและจัดเก็บข้อมูลใน Google Sheets</h3>
              <p className="text-xs text-emerald-100">
                ซิงค์ข้อมูลทรัพย์สิน ประวัติการตรวจนับ และการตั้งค่าลง Google Drive
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">
          {/* Status Alert */}
          {syncStatusMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-medium flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{syncStatusMessage}</span>
            </div>
          )}

          {/* Feature Highlights */}
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2 text-emerald-950">
            <p className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>โครงสร้างตาราง 3 แผ่นงาน (Sheets) ในสเปรดชีต:</span>
            </p>
            <ul className="list-disc list-inside space-y-1 text-emerald-800 text-[11px] pl-1">
              <li>
                <strong>แผ่นที่ 1: Assets</strong> - ข้อมูลทรัพย์สินทั้งหมด 15 คอลัมน์
              </li>
              <li>
                <strong>แผ่นที่ 2: AssetHistory</strong> - ประวัติการเปลี่ยนแปลงและตรวจนับ
              </li>
              <li>
                <strong>แผ่นที่ 3: MasterSettings</strong> - ข้อมูลประเภท, วิทยาเขต, คณะ, อาคาร
              </li>
            </ul>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                ชื่อสเปรดชีต (Spreadsheet Title)
              </label>
              <input
                type="text"
                value={spreadsheetTitle}
                onChange={(e) => setSpreadsheetTitle(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-neutral-700">
                  Spreadsheet ID หรือ ลิงก์ Google Sheet
                </label>
                <button
                  type="button"
                  onClick={handleCreateMockSheetId}
                  className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>สร้าง ID ใหม่อัตโนมัติ</span>
                </button>
              </div>
              <input
                type="text"
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
                placeholder="เช่น 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                className="w-full px-3 py-2 border border-neutral-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <p className="text-[10px] text-neutral-400 mt-1">
                ระบุ Spreadsheet ID จาก URL ของ Google Sheets ที่คุณต้องการเชื่อมโยง
              </p>
            </div>

            {/* Auto Sync Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200">
              <div>
                <p className="text-xs font-bold text-neutral-800">ซิงค์อัตโนมัติ (Auto-Sync)</p>
                <p className="text-[10px] text-neutral-500">
                  อัปเดตข้อมูลลง Google Sheets อัตโนมัติเมื่อมีการเพิ่มหรือแก้ไขข้อมูล
                </p>
              </div>
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500"
              />
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-2">
              <div>
                {sheetsConfig?.spreadsheetId && (
                  <button
                    type="button"
                    onClick={onTriggerSync}
                    disabled={isSyncing}
                    className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-xl font-bold transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'กำลังซิงค์...' : 'ซิงค์ข้อมูลเดี๋ยวนี้'}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-neutral-300 rounded-xl text-neutral-700 font-semibold"
                >
                  ปิด
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  บันทึกการตั้งค่า Sheets
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
