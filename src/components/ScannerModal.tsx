import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { AlertCircle, Camera, Check, QrCode, Upload, X } from 'lucide-react';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
  title?: string;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'สแกน QR Code / บาร์โค้ดทรัพย์สิน',
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'modal-qr-reader';

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(containerId);
      }

      const qrCode = html5QrCodeRef.current;
      const cameras = await Html5Qrcode.getCameras();

      if (!cameras || cameras.length === 0) {
        throw new Error('ไม่พบกล้องในอุปกรณ์นี้');
      }

      const cameraId = cameras[cameras.length - 1].id;

      await qrCode.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          stopCamera();
          onScanSuccess(decodedText);
        },
        () => {}
      );
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera error:', err);
      setCameraError(err.message || 'ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตสิทธิ์การใช้กล้อง');
      setCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && cameraActive) {
      try {
        await html5QrCodeRef.current.stop();
        setCameraActive(false);
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode('temp-upload-scanner');
      const result = await html5QrCode.scanFile(file, true);
      stopCamera();
      onScanSuccess(result);
    } catch (err: any) {
      alert('ไม่พบคิวอาร์โค้ดหรือบาร์โค้ดในรูปภาพที่เลือก');
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Delay camera init slightly to let DOM mount container
      const timer = setTimeout(() => {
        startCamera();
      }, 300);
      return () => {
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      stopCamera();
      onScanSuccess(manualCode.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-neutral-900 text-white">
          <div className="flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-orange-400" />
            <h3 className="font-bold text-sm sm:text-base">{title}</h3>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scanner Body */}
        <div className="p-5 space-y-4">
          <div className="relative rounded-xl overflow-hidden bg-black aspect-square flex items-center justify-center border-2 border-neutral-800">
            <div id={containerId} className="w-full h-full" />
            <div id="temp-upload-scanner" className="hidden" />

            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-white bg-neutral-900/90 space-y-2">
                <Camera className="w-8 h-8 text-neutral-400 animate-pulse" />
                <p className="text-xs text-neutral-300">
                  {cameraError || 'กำลังเปิดกล้องถ่ายภาพ...'}
                </p>
                {cameraError && (
                  <button
                    onClick={startCamera}
                    className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    ลองเปิดกล้องใหม่อีกครั้ง
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Upload Image Option */}
          <div className="flex items-center justify-between gap-2">
            <label className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors border border-neutral-200">
              <Upload className="w-3.5 h-3.5" />
              <span>สแกนจากรูปภาพในเครื่อง</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Manual Input Fallback */}
          <form onSubmit={handleManualSubmit} className="space-y-1.5 pt-2 border-t border-neutral-200">
            <label className="block text-[11px] font-semibold text-neutral-600">
              หรือพิมพ์รหัสทรัพย์สิน / เลขที่เอกสาร:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="เช่น EQ-KBU-2025-001 หรือ LN-2025..."
                className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-orange-500 font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                ยืนยัน
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
