import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Image as ImageIcon,
  MapPin,
  QrCode,
  RefreshCw,
  Search,
  Tag,
  Wrench,
  X,
} from 'lucide-react';
import {
  ASSET_STATUSES,
  Asset,
  AssetHistoryRecord,
  AssetStatus,
  SystemSettingsState,
  UserAccount,
} from '../types';
import { formatCurrency, getStatusStyle } from '../utils/statusUtils';

interface ScannerViewProps {
  assets: Asset[];
  settings: SystemSettingsState;
  currentUser: UserAccount;
  onUpdateAssetStatus: (assetId: string, newStatus: AssetStatus, note?: string) => void;
  onAddHistoryLog: (record: Omit<AssetHistoryRecord, 'id' | 'timestamp'>) => void;
  onSaveAsset: (asset: Partial<Asset>) => void;
  onNavigateToAsset?: (assetId: string) => void;
}

export const ScannerView: React.FC<ScannerViewProps> = ({
  assets,
  settings,
  currentUser,
  onUpdateAssetStatus,
  onAddHistoryLog,
  onSaveAsset,
  onNavigateToAsset,
}) => {
  const [scanResultCode, setScanResultCode] = useState<string | null>(null);
  const [matchedAsset, setMatchedAsset] = useState<Asset | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanningImage, setIsScanningImage] = useState(false);

  // Quick Action in Scanned Modal
  const [selectedStatus, setSelectedStatus] = useState<AssetStatus>('ใช้งานอยู่');
  const [newRoom, setNewRoom] = useState('');
  const [inspectionNote, setInspectionNote] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-reader-container';

  // Start Camera Scanner
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerContainerId);
      }

      const qrCode = html5QrCodeRef.current;
      const cameras = await Html5Qrcode.getCameras();

      if (!cameras || cameras.length === 0) {
        throw new Error('ไม่พบกล้องในอุปกรณ์นี้');
      }

      const cameraId = cameras[cameras.length - 1].id; // Prefer back camera on mobile

      await qrCode.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleCodeDetected(decodedText);
        },
        (errorMessage) => {
          // ignore continuous frame parse errors
        }
      );
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera start error:', err);
      setCameraError(
        err.message || 'ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตสิทธิ์การเข้าถึงกล้องในเบราว์เซอร์'
      );
      setCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && cameraActive) {
      try {
        await html5QrCodeRef.current.stop();
        setCameraActive(false);
      } catch (err) {
        console.error('Failed to stop camera:', err);
      }
    }
  };

  useEffect(() => {
    // Attempt auto-start camera on mount
    startCamera();

    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // Handle scanned result
  const handleCodeDetected = (rawCode: string) => {
    let cleanCode = rawCode.trim();

    // Check if JSON format
    try {
      const parsed = JSON.parse(cleanCode);
      if (parsed.assetCode) cleanCode = parsed.assetCode;
    } catch (e) {
      // not JSON, keep cleanCode
    }

    setScanResultCode(cleanCode);

    // Find in assets list
    const found = assets.find(
      (a) =>
        a.assetCode.toLowerCase() === cleanCode.toLowerCase() ||
        a.id.toLowerCase() === cleanCode.toLowerCase()
    );

    if (found) {
      setMatchedAsset(found);
      setSelectedStatus(found.status);
      setNewRoom(found.room);
      setInspectionNote('');
      stopCamera();
    } else {
      setMatchedAsset(null);
    }
  };

  // Scan from Uploaded Image
  const handleImageScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningImage(true);
    setCameraError(null);

    try {
      const qrScanner = new Html5Qrcode('qr-image-temp');
      const decodedText = await qrScanner.scanFile(file, true);
      handleCodeDetected(decodedText);
      qrScanner.clear();
    } catch (err: any) {
      setCameraError('ไม่พบ QR Code หรือ บาร์โค้ด ในรูปภาพที่อัปโหลด');
    } finally {
      setIsScanningImage(false);
    }
  };

  // Handle Manual Code Search
  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleCodeDetected(manualCode.trim());
  };

  // Submit quick status / room change & record audit log
  const handleQuickUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedAsset) return;

    const isStatusChanged = selectedStatus !== matchedAsset.status;
    const isRoomChanged = newRoom.trim() !== '' && newRoom.trim() !== matchedAsset.room;

    // Update asset details
    const updatedAsset: Asset = {
      ...matchedAsset,
      status: selectedStatus,
      room: newRoom.trim() || matchedAsset.room,
      updatedAt: new Date().toISOString(),
    };

    onSaveAsset(updatedAsset);

    // Record inspection log
    onAddHistoryLog({
      assetId: matchedAsset.id,
      assetCode: matchedAsset.assetCode,
      assetName: matchedAsset.name,
      action: isStatusChanged ? 'UPDATE_STATUS' : 'INSPECTION',
      actionLabel: isStatusChanged ? `สแกน QR อัปเดตสถานะเป็น [${selectedStatus}]` : 'สแกน QR ตรวจนับพัสดุ',
      previousStatus: matchedAsset.status,
      newStatus: selectedStatus,
      previousLocation: matchedAsset.room,
      newLocation: newRoom.trim() || matchedAsset.room,
      note: inspectionNote || (isStatusChanged ? `อัปเดตสถานะผ่านการสแกน QR Code` : `สแกนตรวจสอบพัสดุ ณ สถานที่จริง`),
      performedBy: `${currentUser.fullname} (${currentUser.role})`,
    });

    setSuccessToast(`บันทึกข้อมูลและอัปเดตสถานะ "${matchedAsset.name}" เรียบร้อยแล้ว`);
    setMatchedAsset(null);
    setScanResultCode(null);
    setManualCode('');

    setTimeout(() => {
      setSuccessToast(null);
      startCamera();
    }, 2000);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Hidden container for temp image scanning */}
      <div id="qr-image-temp" className="hidden"></div>

      {/* Success Toast */}
      {successToast && (
        <div className="fixed top-20 right-4 left-4 sm:left-auto sm:right-6 sm:w-96 z-50 p-4 rounded-2xl bg-emerald-600 text-white shadow-xl flex items-center space-x-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-6 h-6 shrink-0" />
          <div className="text-xs font-semibold">{successToast}</div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-orange-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-orange-500 text-white shadow-xs shadow-orange-300">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-900">
              สแกน QR Code ตรวจสอบและแก้ไขสถานะ
            </h2>
            <p className="text-xs text-neutral-500">
              ส่องกล้องไปที่สติกเกอร์ QR Code บนตัวเครื่อง เพื่อตรวจสอบข้อมูลและเปลี่ยนสถานะทันที
            </p>
          </div>
        </div>
      </div>

      {/* Main Scanner Card */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        {/* Camera Container */}
        <div className="p-4 sm:p-6 bg-neutral-900 text-white relative flex flex-col items-center justify-center min-h-[340px]">
          {/* Scanner Viewport */}
          <div
            id={scannerContainerId}
            className={`w-full max-w-[300px] overflow-hidden rounded-2xl border-2 border-orange-500 shadow-lg ${
              cameraActive ? 'block' : 'hidden'
            }`}
          />

          {!cameraActive && (
            <div className="text-center p-6 space-y-3">
              <Camera className="w-12 h-12 mx-auto text-neutral-500" />
              <p className="text-sm font-semibold text-neutral-300">
                {cameraError || 'กล้องยังไม่ได้เปิดใช้งาน'}
              </p>
              <button
                onClick={startCamera}
                className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md cursor-pointer transition-colors"
              >
                เปิดใช้งานกล้อง
              </button>
            </div>
          )}

          {/* Camera Controls Floating */}
          {cameraActive && (
            <div className="mt-4 flex items-center space-x-3">
              <button
                onClick={stopCamera}
                className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-xs cursor-pointer"
              >
                พักการทำงานกล้อง
              </button>
              <button
                onClick={startCamera}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>รีเฟรชกล้อง</span>
              </button>
            </div>
          )}
        </div>

        {/* Fallback 1: Upload QR Image / Fallback 2: Manual Code Input */}
        <div className="p-5 sm:p-6 bg-neutral-50 border-t border-neutral-200 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Upload Image Option */}
          <div className="p-4 bg-white rounded-xl border border-neutral-200 space-y-2">
            <p className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-orange-600" />
              <span>หรือเลือกสแกนจากรูปภาพในเครื่อง</span>
            </p>
            <label className="flex items-center justify-center gap-2 w-full py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 rounded-xl cursor-pointer text-xs font-bold transition-colors">
              <Camera className="w-4 h-4" />
              <span>{isScanningImage ? 'กำลังอ่านรูปภาพ...' : 'อัปโหลดรูปภาพที่มี QR Code'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageScan}
                className="hidden"
                disabled={isScanningImage}
              />
            </label>
          </div>

          {/* Manual Asset Code Lookup */}
          <div className="p-4 bg-white rounded-xl border border-neutral-200 space-y-2">
            <p className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
              <Search className="w-4 h-4 text-orange-600" />
              <span>หรือค้นหาด้วยรหัสทรัพย์สินโดยตรง</span>
            </p>
            <form onSubmit={handleManualSearch} className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="เช่น EQ-67-00101"
                className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                ค้นหา
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Quick Inspection & Status Change Modal (Shown after scanning) */}
      {matchedAsset && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-2xl shadow-2xl border border-orange-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-linear-to-r from-orange-600 to-amber-500 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-white" />
                <div>
                  <h3 className="text-base font-bold">ผลการสแกนทรัพย์สิน</h3>
                  <p className="text-xs text-orange-100 font-mono">{matchedAsset.assetCode}</p>
                </div>
              </div>
              <button
                onClick={() => setMatchedAsset(null)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleQuickUpdate} className="p-6 space-y-4 text-xs">
              {/* Asset Summary Card */}
              <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-200 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-orange-700 uppercase">
                      {matchedAsset.typeName}
                    </span>
                    <h4 className="text-sm font-bold text-neutral-900">{matchedAsset.name}</h4>
                  </div>
                  <span className="text-xs font-extrabold text-neutral-900">
                    {formatCurrency(matchedAsset.price)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-orange-100 text-neutral-600">
                  <p>
                    <span className="font-semibold text-neutral-700">คณะ:</span>{' '}
                    {matchedAsset.facultyName}
                  </p>
                  <p>
                    <span className="font-semibold text-neutral-700">วิทยาเขต:</span>{' '}
                    {matchedAsset.campusName?.split(' ')[0]}
                  </p>
                </div>
              </div>

              {/* Status Update Dropdown (The 6 predefined statuses) */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  แก้ไข/ระบุสถานะทรัพย์สินทันที <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as AssetStatus)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-orange-300 text-sm font-bold text-orange-800 bg-orange-50/40 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                >
                  {ASSET_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-neutral-500 mt-1">
                  สถานะเดิม: <strong className="text-neutral-700">{matchedAsset.status}</strong>
                </p>
              </div>

              {/* Room Location Update */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  ชื่อห้อง / จุดที่ติดตั้งปัจจุบัน
                </label>
                <input
                  type="text"
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value)}
                  placeholder="เช่น ห้อง Lab 304 AI Studio"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>

              {/* Inspection Note */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  บันทึกผลการตรวจสอบ / หมายเหตุ
                </label>
                <textarea
                  rows={3}
                  value={inspectionNote}
                  onChange={(e) => setInspectionNote(e.target.value)}
                  placeholder="เช่น สภาพเครื่องสมบูรณ์ 100%, พบรอยถลอกเล็กน้อย, อุปกรณ์พร้อมใช้งาน..."
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-neutral-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setMatchedAsset(null)}
                  className="px-4 py-2 rounded-xl border border-neutral-300 text-neutral-700 font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-md cursor-pointer transition-colors"
                >
                  บันทึกผลการตรวจและอัปเดต
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scanned code not found warning modal */}
      {scanResultCode && !matchedAsset && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-xs">
                ไม่พบข้อมูลทรัพย์สินสำหรับรหัส: <span className="font-mono">{scanResultCode}</span>
              </p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                รหัสนี้อาจยังไม่ได้บันทึกเข้าระบบ หรือเป็นบาร์โค้ดประเภทอื่น
              </p>
            </div>
          </div>
          <button
            onClick={() => setScanResultCode(null)}
            className="text-xs font-bold text-amber-800 hover:underline cursor-pointer"
          >
            ปิด
          </button>
        </div>
      )}
    </div>
  );
};
