import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Building2, Printer, X } from 'lucide-react';
import { Asset } from '../types';

interface PrintTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
}

export const PrintTagModal: React.FC<PrintTagModalProps> = ({
  isOpen,
  onClose,
  assets,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || assets.length === 0) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden print:max-w-none print:max-h-none print:shadow-none print:border-none print:rounded-none">
        {/* Header - Hidden in Print */}
        <div className="px-6 py-4 bg-linear-to-r from-orange-600 to-amber-500 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <Printer className="w-5 h-5" />
            <div>
              <h3 className="text-base font-bold">พิมพ์ป้ายสติกเกอร์ทรัพย์สิน (QR Code Tag)</h3>
              <p className="text-xs text-orange-100">
                จำนวน {assets.length} รายการ (สำหรับติดบนตัวเครื่องและสแกนด้วยกล้องมือถือ)
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-4 py-2 bg-white text-orange-700 hover:bg-orange-50 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>สั่งพิมพ์สติกเกอร์</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div
          ref={printRef}
          className="p-6 overflow-y-auto space-y-6 print:p-4 print:space-y-4 print:overflow-visible"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3">
            {assets.map((asset) => {
              const qrValue = JSON.stringify({
                assetCode: asset.assetCode,
                id: asset.id,
                name: asset.name,
              });

              return (
                <div
                  key={asset.id}
                  className="border-2 border-orange-500 rounded-xl p-3.5 bg-white flex flex-col justify-between shadow-xs print:shadow-none print:border-black print:rounded-md break-inside-avoid"
                  style={{ minHeight: '160px' }}
                >
                  {/* Exact Sticker Tag Layout matching uploaded reference photo */}
                  <div className="flex gap-3 items-center">
                    {/* Left Column: University Emblem (top) + QR Code (bottom) */}
                    <div className="flex flex-col items-center justify-between shrink-0 space-y-1.5">
                      {/* University Emblem Crest */}
                      <div className="w-10 h-10 flex items-center justify-center">
                        <svg
                          viewBox="0 0 100 100"
                          className="w-9 h-9 text-neutral-900 fill-current"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M50 4 L53 14 L60 8 L58 19 L66 16 L61 24 L70 24 L63 30 L50 22 L37 30 L30 24 L39 24 L34 16 L42 19 L40 8 L47 14 Z" />
                          <circle cx="50" cy="45" r="16" fill="none" stroke="currentColor" strokeWidth="3" />
                          <path d="M50 33 L55 42 L45 42 Z" />
                          <path d="M42 45 Q50 49 58 45 Q50 56 42 45 Z" />
                          <path d="M46 51 L54 51 L50 57 Z" />
                          <path d="M34 38 Q22 34 16 46 Q24 49 34 44 Z" />
                          <path d="M33 46 Q18 45 14 56 Q23 57 34 50 Z" />
                          <path d="M35 52 Q22 56 18 66 Q28 64 36 57 Z" />
                          <path d="M66 38 Q78 34 84 46 Q76 49 66 44 Z" />
                          <path d="M67 46 Q82 45 86 56 Q77 57 66 50 Z" />
                          <path d="M65 52 Q78 56 82 66 Q72 64 64 57 Z" />
                          <path d="M30 68 Q50 63 70 68 Q65 77 50 78 Q35 77 30 68 Z" />
                          <path d="M22 75 Q36 71 50 75 Q64 71 78 75 Q82 85 70 85 Q50 82 30 85 Q18 85 22 75 Z" />
                          <circle cx="50" cy="45" r="3" />
                        </svg>
                      </div>

                      {/* QR Code */}
                      <div className="p-1 bg-white border border-neutral-300 rounded-md shadow-2xs">
                        <QRCodeSVG
                          value={asset.assetCode}
                          size={64}
                          level="M"
                          includeMargin={false}
                        />
                      </div>
                    </div>

                    {/* Right Column: Faculty (line 1) + Asset Code (line 2) + Asset Name (line 3) */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center text-left space-y-1">
                      {/* Line 1: สังกัด / คณะ */}
                      <p className="text-xs font-semibold text-neutral-900 tracking-tight leading-snug line-clamp-1">
                        {asset.facultyName || 'มหาวิทยาลัย'}
                      </p>

                      {/* Line 2: รหัสทรัพย์สิน (Bold prominent text) */}
                      <p className="text-sm sm:text-base font-extrabold font-mono text-neutral-950 tracking-normal leading-tight">
                        {asset.assetCode}
                      </p>

                      {/* Line 3: ชื่อทรัพย์สิน (Asset Name) */}
                      <p className="text-xs text-neutral-800 font-medium leading-snug line-clamp-2">
                        {asset.name}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Barcode Simulation */}
                  <div className="pt-1.5 border-t border-dashed border-neutral-200 print:border-black flex items-center justify-between text-[9px] text-neutral-500 print:text-black font-mono">
                    <span>STATUS: {asset.status}</span>
                    <span>TAG ID: #{asset.id.slice(-6)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Note */}
        <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-200 text-xs text-neutral-500 flex items-center justify-between print:hidden">
          <span>คำแนะนำ: ใช้กระดาษสติกเกอร์กันน้ำขนาดมาตรฐานเพื่อติดบนตัวเครื่อง</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-100 text-xs font-semibold"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
