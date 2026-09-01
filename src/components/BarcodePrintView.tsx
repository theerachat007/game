import React, { useState, useMemo, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import JsBarcode from 'jsbarcode';
import {
  Printer,
  SlidersHorizontal,
  Search,
  CheckSquare,
  Square,
  Sparkles,
  Building2,
  Tag,
  Copy,
  Download,
  RotateCcw,
  Layers,
  ArrowRight,
  Filter,
  CheckCircle2,
  FileCheck,
  Eye,
  Settings2,
  Upload,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  Info,
} from 'lucide-react';
import { Asset, AssetStatus, SystemSettingsState, UserAccount } from '../types';

interface BarcodePrintViewProps {
  assets: Asset[];
  settings: SystemSettingsState;
  currentUser: UserAccount;
  onUpdateAssetStatus?: (assetId: string, newStatus: AssetStatus, note?: string) => void;
  onNavigateToAsset?: (assetId: string) => void;
}

export type StickerLayoutType = 'standard' | 'barcode1d' | 'hybrid';
export type StickerThemeType = 'silver' | 'white' | 'gold';
export type StickerPaperPreset = 'a4-14' | 'a4-24' | 'a4-10' | 'thermal-roll';

// University Crest SVG matching official Thai university emblem seals
const UniversityEmblemSVG: React.FC<{ className?: string; customLogoUrl?: string }> = ({
  className = 'w-10 h-10',
  customLogoUrl,
}) => {
  if (customLogoUrl) {
    return (
      <img
        src={customLogoUrl}
        alt="University Emblem"
        className={`${className} object-contain`}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <svg
      viewBox="0 0 100 100"
      className={`${className} text-neutral-900 fill-current`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Crown / Top Finial */}
      <path d="M50 4 L53 14 L60 8 L58 19 L66 16 L61 24 L70 24 L63 30 L50 22 L37 30 L30 24 L39 24 L34 16 L42 19 L40 8 L47 14 Z" />
      {/* Center Garuda / Deity / Crest Shield */}
      <circle cx="50" cy="45" r="16" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M50 33 L55 42 L45 42 Z" />
      <path d="M42 45 Q50 49 58 45 Q50 56 42 45 Z" />
      <path d="M46 51 L54 51 L50 57 Z" />
      {/* Wing Left */}
      <path d="M34 38 Q22 34 16 46 Q24 49 34 44 Z" />
      <path d="M33 46 Q18 45 14 56 Q23 57 34 50 Z" />
      <path d="M35 52 Q22 56 18 66 Q28 64 36 57 Z" />
      {/* Wing Right */}
      <path d="M66 38 Q78 34 84 46 Q76 49 66 44 Z" />
      <path d="M67 46 Q82 45 86 56 Q77 57 66 50 Z" />
      <path d="M65 52 Q78 56 82 66 Q72 64 64 57 Z" />
      {/* Base Pedestal / Floral Scroll */}
      <path d="M30 68 Q50 63 70 68 Q65 77 50 78 Q35 77 30 68 Z" />
      <path d="M22 75 Q36 71 50 75 Q64 71 78 75 Q82 85 70 85 Q50 82 30 85 Q18 85 22 75 Z" />
      <path d="M35 84 Q50 88 65 84 Q60 92 50 93 Q40 92 35 84 Z" />
      <circle cx="50" cy="45" r="3" />
    </svg>
  );
};

// 1D Barcode SVG Component using JsBarcode
const Barcode1DSVG: React.FC<{ value: string; height?: number; displayValue?: boolean }> = ({
  value,
  height = 32,
  displayValue = false,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128',
          height: height,
          width: 1.4,
          displayValue: displayValue,
          fontSize: 10,
          margin: 0,
          background: 'transparent',
          lineColor: '#000000',
        });
      } catch (err) {
        console.error('Barcode render error:', err);
      }
    }
  }, [value, height, displayValue]);

  return <svg ref={svgRef} className="w-full max-w-[160px] h-auto" />;
};

export const BarcodePrintView: React.FC<BarcodePrintViewProps> = ({
  assets,
  settings,
  currentUser,
  onUpdateAssetStatus,
}) => {
  // --- Selection States ---
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(() => {
    // Default select first 12 items for quick preview
    return new Set(assets.slice(0, 12).map((a) => a.id));
  });
  const [copiesPerAsset, setCopiesPerAsset] = useState<number>(1);

  // --- Range Selection States ---
  const [rangeStartCode, setRangeStartCode] = useState<string>('');
  const [rangeEndCode, setRangeEndCode] = useState<string>('');

  // --- Filters ---
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFaculty, setFilterFaculty] = useState<string>('ALL');
  const [filterCampus, setFilterCampus] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // --- Sticker Styling Options ---
  const [layoutType, setLayoutType] = useState<StickerLayoutType>('standard');
  const [themeType, setThemeType] = useState<StickerThemeType>('silver');
  const [paperPreset, setPaperPreset] = useState<StickerPaperPreset>('a4-14');
  const [customLogoUrl, setCustomLogoUrl] = useState<string>('');
  const [showLocation, setShowLocation] = useState<boolean>(false);
  const [showDate, setShowDate] = useState<boolean>(false);
  const [showStatus, setShowStatus] = useState<boolean>(false);
  const [autoUpdateStatusOnPrint, setAutoUpdateStatusOnPrint] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // File upload for custom logo
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Sort assets naturally by assetCode for cleaner range selection
  const sortedAssets = useMemo(() => {
    return [...assets].sort((a, b) =>
      a.assetCode.localeCompare(b.assetCode, undefined, { numeric: true, sensitivity: 'base' })
    );
  }, [assets]);

  // Filtered Assets list
  const filteredAssets = useMemo(() => {
    return sortedAssets.filter((asset) => {
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        asset.assetCode.toLowerCase().includes(q) ||
        asset.name.toLowerCase().includes(q) ||
        asset.facultyName.toLowerCase().includes(q) ||
        asset.room.toLowerCase().includes(q);

      const matchFaculty = filterFaculty === 'ALL' || asset.facultyName === filterFaculty;
      const matchCampus = filterCampus === 'ALL' || asset.campusName === filterCampus;
      const matchType = filterType === 'ALL' || asset.typeName === filterType;
      const matchStatus = filterStatus === 'ALL' || asset.status === filterStatus;

      return matchSearch && matchFaculty && matchCampus && matchType && matchStatus;
    });
  }, [sortedAssets, searchQuery, filterFaculty, filterCampus, filterType, filterStatus]);

  // Selected Assets with copies expansion
  const printItemsList = useMemo(() => {
    const selectedList = sortedAssets.filter((a) => selectedAssetIds.has(a.id));
    const result: { asset: Asset; copyIndex: number }[] = [];
    selectedList.forEach((asset) => {
      for (let i = 0; i < copiesPerAsset; i++) {
        result.push({ asset, copyIndex: i + 1 });
      }
    });
    return result;
  }, [sortedAssets, selectedAssetIds, copiesPerAsset]);

  // Handle Range Selection (จากรหัส ... ถึงรหัส ...)
  const handleApplyRange = () => {
    if (!rangeStartCode && !rangeEndCode) return;

    const start = rangeStartCode.trim().toLowerCase();
    const end = rangeEndCode.trim().toLowerCase();

    const matchedIds = new Set<string>();

    let isWithin = !start; // If no start, start from beginning

    for (const asset of sortedAssets) {
      const code = asset.assetCode.toLowerCase();

      if (start && code === start) {
        isWithin = true;
      }

      if (isWithin) {
        matchedIds.add(asset.id);
      }

      if (end && code === end) {
        isWithin = false;
        break;
      }
    }

    // If exact match wasn't found, try string comparison range
    if (matchedIds.size === 0 && (start || end)) {
      sortedAssets.forEach((asset) => {
        const code = asset.assetCode.toLowerCase();
        const afterStart = !start || code >= start;
        const beforeEnd = !end || code <= end;
        if (afterStart && beforeEnd) {
          matchedIds.add(asset.id);
        }
      });
    }

    setSelectedAssetIds(matchedIds);
  };

  // Selection toggle helpers
  const handleToggleSelect = (id: string) => {
    setSelectedAssetIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    setSelectedAssetIds((prev) => {
      const next = new Set(prev);
      filteredAssets.forEach((a) => next.add(a.id));
      return next;
    });
  };

  const handleDeselectAll = () => {
    setSelectedAssetIds(new Set());
  };

  const handleSelectUnlabeled = () => {
    const unprintedIds = new Set<string>();
    sortedAssets.forEach((a) => {
      if (
        a.status !== 'ติดบาร์โค๊ดและบันทึกลงในระบบทรัพย์สิน' ||
        a.status === 'อยู่ระหว่างการบันทึกละระบบทรัพย์สิน'
      ) {
        unprintedIds.add(a.id);
      }
    });
    setSelectedAssetIds(unprintedIds);
  };

  // Handle Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCustomLogoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Print Handler
  const handleTriggerPrint = () => {
    if (printItemsList.length === 0) {
      alert('กรุณาเลือกรายการทรัพย์สินอย่างน้อย 1 รายการก่อนสั่งพิมพ์');
      return;
    }

    // Optionally auto-update status to 'ติดบาร์โค๊ดและบันทึกลงในระบบทรัพย์สิน'
    if (autoUpdateStatusOnPrint && onUpdateAssetStatus) {
      const selectedAssets = sortedAssets.filter((a) => selectedAssetIds.has(a.id));
      selectedAssets.forEach((asset) => {
        if (asset.status !== 'ติดบาร์โค๊ดและบันทึกลงในระบบทรัพย์สิน') {
          onUpdateAssetStatus(
            asset.id,
            'ติดบาร์โค๊ดและบันทึกลงในระบบทรัพย์สิน',
            'พิมพ์สติกเกอร์บาร์โค้ดทรัพย์สินและปรับปรุงสถานะอัตโนมัติ'
          );
        }
      });
    }

    // Trigger native browser print
    window.print();
  };

  // Dynamic Styles based on chosen Theme
  const getStickerThemeClasses = () => {
    switch (themeType) {
      case 'silver':
        return 'bg-gradient-to-br from-neutral-200 via-neutral-100 to-neutral-300 border-neutral-400 text-neutral-900 shadow-sm';
      case 'gold':
        return 'bg-gradient-to-br from-amber-100 via-amber-50 to-amber-200 border-amber-300 text-amber-950 shadow-sm';
      case 'white':
      default:
        return 'bg-white border-neutral-300 text-neutral-900 shadow-xs';
    }
  };

  // Grid layout classes based on Paper Preset
  const getGridColsClass = () => {
    switch (paperPreset) {
      case 'a4-24':
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 print:grid-cols-3';
      case 'a4-10':
        return 'grid-cols-1 sm:grid-cols-2 print:grid-cols-2';
      case 'thermal-roll':
        return 'grid-cols-1 print:grid-cols-1 max-w-sm mx-auto';
      case 'a4-14':
      default:
        return 'grid-cols-1 sm:grid-cols-2 print:grid-cols-2';
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* ---------------- Print Stylesheet Injection for Clean Crisp Printing ---------------- */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          header, aside, nav, .print\\:hidden, #btn-mobile-menu-toggle {
            display: none !important;
          }
          .print-container {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: none !important;
          }
          .sticker-item {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm 6mm 8mm 6mm;
          }
        }
      `}</style>

      {/* ---------------- Top Header Banner ---------------- */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-sm shadow-orange-200 shrink-0">
            <Printer className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-neutral-900">พิมพ์บาร์โค้ดทรัพย์สิน</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 font-semibold border border-orange-200">
                Asset Barcode & QR Tag Generator
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              สร้างป้ายสติกเกอร์ทรัพย์สินพร้อมตราสัญลักษณ์, สังกัด/คณะ, รหัสทรัพย์สิน และชื่อทรัพย์สิน
              ตามมาตรฐานของมหาวิทยาลัย
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            id="btn-print-barcode-tags"
            onClick={handleTriggerPrint}
            disabled={printItemsList.length === 0}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all cursor-pointer ${
              printItemsList.length > 0
                ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-200 ring-2 ring-orange-400/30'
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>สั่งพิมพ์สติกเกอร์ ({printItemsList.length} ดวง)</span>
          </button>
        </div>
      </div>

      {/* ---------------- Main Control Grid: Filters & Range Selection ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
        {/* Left Column (8 cols): Range Selector & Asset Selection List */}
        <div className="lg:col-span-8 space-y-5">
          {/* Card: กำหนดช่วงรหัสทรัพย์สิน (Range Selection Box) */}
          <div className="bg-white p-5 rounded-2xl border border-orange-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center space-x-2 text-neutral-900 font-bold text-sm">
                <SlidersHorizontal className="w-4 h-4 text-orange-600" />
                <span>กำหนดเลือกช่วงรหัสทรัพย์สินสำหรับพิมพ์บาร์โค้ด</span>
              </div>
              <span className="text-[11px] text-neutral-500 font-medium">
                เลือกช่วงจากรหัสเริ่มต้น ถึงรหัสสิ้นสุด
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              {/* Start Range Code */}
              <div className="sm:col-span-5 space-y-1">
                <label className="block text-xs font-semibold text-neutral-700">
                  จากรหัสทรัพย์สิน (เริ่มต้น)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="เช่น 02-6509-000087-4 หรือ EQ-67-00101"
                    value={rangeStartCode}
                    onChange={(e) => setRangeStartCode(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 text-xs font-mono rounded-xl border border-neutral-300 focus:outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    list="asset-codes-start"
                  />
                  <datalist id="asset-codes-start">
                    {sortedAssets.map((a) => (
                      <option key={`start-${a.id}`} value={a.assetCode}>
                        {a.assetCode} - {a.name.slice(0, 25)}
                      </option>
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Arrow Indicator */}
              <div className="sm:col-span-1 flex items-center justify-center pb-2 hidden sm:flex">
                <ArrowRight className="w-4 h-4 text-neutral-400" />
              </div>

              {/* End Range Code */}
              <div className="sm:col-span-4 space-y-1">
                <label className="block text-xs font-semibold text-neutral-700">
                  ถึงรหัสทรัพย์สิน (สิ้นสุด)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="เช่น 02-6509-000089-4 หรือ EQ-67-00104"
                    value={rangeEndCode}
                    onChange={(e) => setRangeEndCode(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 text-xs font-mono rounded-xl border border-neutral-300 focus:outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    list="asset-codes-end"
                  />
                  <datalist id="asset-codes-end">
                    {sortedAssets.map((a) => (
                      <option key={`end-${a.id}`} value={a.assetCode}>
                        {a.assetCode} - {a.name.slice(0, 25)}
                      </option>
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Apply Range Button */}
              <div className="sm:col-span-2">
                <button
                  type="button"
                  id="btn-apply-code-range"
                  onClick={handleApplyRange}
                  className="w-full py-2 px-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center justify-center space-x-1"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>เลือกช่วงนี้</span>
                </button>
              </div>
            </div>

            {/* Quick Range Presets */}
            <div className="flex items-center gap-2 flex-wrap pt-1 text-[11px] text-neutral-600">
              <span className="font-semibold text-neutral-500">เลือกด่วน:</span>
              <button
                type="button"
                onClick={() => {
                  if (sortedAssets.length > 0) {
                    setRangeStartCode(sortedAssets[0].assetCode);
                    setRangeEndCode(sortedAssets[Math.min(5, sortedAssets.length - 1)].assetCode);
                  }
                }}
                className="px-2 py-0.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-mono"
              >
                5 รายการแรก
              </button>
              <button
                type="button"
                onClick={() => {
                  if (sortedAssets.length > 0) {
                    setRangeStartCode(sortedAssets[0].assetCode);
                    setRangeEndCode(sortedAssets[Math.min(15, sortedAssets.length - 1)].assetCode);
                  }
                }}
                className="px-2 py-0.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-mono"
              >
                15 รายการแรก
              </button>
              <button
                type="button"
                onClick={handleSelectUnlabeled}
                className="px-2 py-0.5 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-800 font-semibold"
              >
                เฉพาะรายการที่ยังไม่ติดบาร์โค้ด
              </button>
            </div>
          </div>

          {/* Card: ตัวกรองและการเลือกรายการทรัพย์สิน (Asset Table Selection) */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
            {/* Filter Bar */}
            <div className="p-4 bg-neutral-50/80 border-b border-neutral-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อ, รหัส, สถานที่..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white border border-neutral-200 focus:outline-hidden focus:border-orange-500"
                  />
                </div>

                {/* Faculty Filter */}
                <select
                  value={filterFaculty}
                  onChange={(e) => setFilterFaculty(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white border border-neutral-200 focus:outline-hidden focus:border-orange-500 text-neutral-700"
                >
                  <option value="ALL">สังกัด/คณะ: ทั้งหมด</option>
                  {settings.faculties.map((f) => (
                    <option key={f.id} value={f.name}>
                      {f.name}
                    </option>
                  ))}
                </select>

                {/* Campus Filter */}
                <select
                  value={filterCampus}
                  onChange={(e) => setFilterCampus(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white border border-neutral-200 focus:outline-hidden focus:border-orange-500 text-neutral-700"
                >
                  <option value="ALL">วิทยาเขต: ทั้งหมด</option>
                  {settings.campuses.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white border border-neutral-200 focus:outline-hidden focus:border-orange-500 text-neutral-700"
                >
                  <option value="ALL">สถานะ: ทั้งหมด</option>
                  {settings.assetTypes.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selection Counter & Batch Toggle Buttons */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-neutral-200/60 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-neutral-700">
                    เลือกแล้ว{' '}
                    <strong className="text-orange-600 font-bold">
                      {selectedAssetIds.size}
                    </strong>{' '}
                    จาก {assets.length} รายการ
                  </span>
                  <span className="text-neutral-400">|</span>
                  <span className="text-neutral-500">
                    รวมทั้งสิ้น <strong>{printItemsList.length} ดวง</strong>
                  </span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 font-semibold text-[11px] transition-colors"
                  >
                    เลือกทั้งหมดในหน้านี้ ({filteredAssets.length})
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="px-2.5 py-1 rounded-lg bg-neutral-200/70 hover:bg-neutral-200 text-neutral-700 font-semibold text-[11px] transition-colors"
                  >
                    ล้างการเลือก
                  </button>
                </div>
              </div>
            </div>

            {/* Asset Table with Checkboxes */}
            <div className="max-h-[360px] overflow-y-auto divide-y divide-neutral-100">
              {filteredAssets.length === 0 ? (
                <div className="p-8 text-center text-neutral-400 text-xs">
                  ไม่พบรายการทรัพย์สินที่ตรงกับเงื่อนไขการค้นหา
                </div>
              ) : (
                filteredAssets.map((asset) => {
                  const isChecked = selectedAssetIds.has(asset.id);
                  return (
                    <div
                      key={asset.id}
                      onClick={() => handleToggleSelect(asset.id)}
                      className={`p-3 px-4 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                        isChecked ? 'bg-orange-50/50 hover:bg-orange-50' : 'hover:bg-neutral-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <button
                          type="button"
                          className="text-orange-600 shrink-0 focus:outline-hidden"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSelect(asset.id);
                          }}
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 fill-orange-500 text-white" />
                          ) : (
                            <Square className="w-4 h-4 text-neutral-300" />
                          )}
                        </button>

                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-neutral-900">
                              {asset.assetCode}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-sm bg-neutral-100 text-neutral-600 truncate max-w-[140px]">
                              {asset.facultyName}
                            </span>
                          </div>
                          <p className="text-neutral-700 font-medium truncate max-w-md mt-0.5">
                            {asset.name}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 pl-3">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            asset.status === 'ติดบาร์โค๊ดและบันทึกลงในระบบทรัพย์สิน'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-neutral-100 text-neutral-600'
                          }`}
                        >
                          {asset.status}
                        </span>
                        <p className="text-[10px] text-neutral-400 mt-0.5">
                          {asset.buildingName ? `${asset.buildingName} (${asset.room})` : asset.room}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Sticker Customizer & Printing Settings */}
        <div className="lg:col-span-4 space-y-5">
          {/* Card: การตั้งค่ารูปแบบป้ายสติกเกอร์ (Sticker Tag Style Customizer) */}
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 text-neutral-900 font-bold text-sm border-b border-neutral-100 pb-3">
              <Settings2 className="w-4 h-4 text-orange-600" />
              <span>ตั้งค่ารูปแบบป้ายสติกเกอร์</span>
            </div>

            {/* Layout Style Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-700">
                รูปแบบป้าย (Sticker Layout)
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setLayoutType('standard')}
                  className={`px-2 py-2 rounded-xl text-center text-xs font-semibold border transition-all ${
                    layoutType === 'standard'
                      ? 'bg-orange-50 border-orange-500 text-orange-800 font-bold shadow-xs'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  <p className="text-xs">มาตรฐาน</p>
                  <span className="text-[10px] text-neutral-400 block font-normal">
                    (ตามภาพตัวอย่าง)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setLayoutType('barcode1d')}
                  className={`px-2 py-2 rounded-xl text-center text-xs font-semibold border transition-all ${
                    layoutType === 'barcode1d'
                      ? 'bg-orange-50 border-orange-500 text-orange-800 font-bold shadow-xs'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  <p className="text-xs">บาร์โค้ด 1D</p>
                  <span className="text-[10px] text-neutral-400 block font-normal">(Code128)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLayoutType('hybrid')}
                  className={`px-2 py-2 rounded-xl text-center text-xs font-semibold border transition-all ${
                    layoutType === 'hybrid'
                      ? 'bg-orange-50 border-orange-500 text-orange-800 font-bold shadow-xs'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  <p className="text-xs">ผสมผสาน</p>
                  <span className="text-[10px] text-neutral-400 block font-normal">(QR + บาร์โค้ด)</span>
                </button>
              </div>
            </div>

            {/* Sticker Theme / Foil Background */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-700">
                สไตล์พื้นหลังสติกเกอร์
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setThemeType('silver')}
                  className={`px-2 py-2 rounded-xl text-xs font-semibold border flex items-center justify-center space-x-1.5 ${
                    themeType === 'silver'
                      ? 'bg-neutral-200 border-neutral-500 text-neutral-900 font-bold shadow-xs'
                      : 'bg-neutral-100 border-neutral-200 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-neutral-300 border border-neutral-500 inline-block"></span>
                  <span>สีเงินฟอยล์</span>
                </button>

                <button
                  type="button"
                  onClick={() => setThemeType('white')}
                  className={`px-2 py-2 rounded-xl text-xs font-semibold border flex items-center justify-center space-x-1.5 ${
                    themeType === 'white'
                      ? 'bg-white border-orange-500 text-orange-800 font-bold shadow-xs'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-white border border-neutral-300 inline-block"></span>
                  <span>ขาวสะอาด</span>
                </button>

                <button
                  type="button"
                  onClick={() => setThemeType('gold')}
                  className={`px-2 py-2 rounded-xl text-xs font-semibold border flex items-center justify-center space-x-1.5 ${
                    themeType === 'gold'
                      ? 'bg-amber-100 border-amber-500 text-amber-900 font-bold shadow-xs'
                      : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-amber-200 border border-amber-400 inline-block"></span>
                  <span>ทองอ่อน</span>
                </button>
              </div>
            </div>

            {/* Paper Preset */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-neutral-700">
                ขนาดกระดาษ / สติกเกอร์สำเร็จรูป
              </label>
              <select
                value={paperPreset}
                onChange={(e) => setPaperPreset(e.target.value as StickerPaperPreset)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-neutral-300 focus:outline-hidden focus:border-orange-500"
              >
                <option value="a4-14">กระดาษ A4: 2 × 7 ดวง (14 ดวง/แผ่น - 99 × 38 mm)</option>
                <option value="a4-24">กระดาษ A4: 3 × 8 ดวง (24 ดวง/แผ่น - 70 × 37 mm)</option>
                <option value="a4-10">กระดาษ A4: 2 × 5 ดวง (10 ดวง/แผ่น - 105 × 57 mm)</option>
                <option value="thermal-roll">เครื่องพิมพ์ความร้อนม้วน (Thermal Label 1 ดวง)</option>
              </select>
            </div>

            {/* Copies Per Asset */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-neutral-700">
                จำนวนสำเนาต่อ 1 รายการทรัพย์สิน
              </label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setCopiesPerAsset(n)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold border ${
                      copiesPerAsset === n
                        ? 'bg-orange-600 border-orange-600 text-white shadow-xs'
                        : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    {n} ดวง
                  </button>
                ))}
              </div>
            </div>

            {/* University Crest / Logo Upload */}
            <div className="space-y-1.5 pt-2 border-t border-neutral-100">
              <label className="block text-xs font-semibold text-neutral-700">
                ตราสัญลักษณ์มหาวิทยาลัย / หน่วยงาน
              </label>
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0 overflow-hidden">
                  <UniversityEmblemSVG className="w-8 h-8" customLogoUrl={customLogoUrl} />
                </div>
                <div className="flex-1 min-w-0">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="w-full py-1.5 px-2.5 rounded-lg border border-neutral-300 hover:bg-neutral-50 text-neutral-700 text-xs font-medium flex items-center justify-center space-x-1"
                  >
                    <Upload className="w-3.5 h-3.5 text-neutral-500" />
                    <span>{customLogoUrl ? 'เปลี่ยนรูปตราสัญลักษณ์' : 'อัปโหลดตราสัญลักษณ์'}</span>
                  </button>
                </div>
                {customLogoUrl && (
                  <button
                    type="button"
                    onClick={() => setCustomLogoUrl('')}
                    className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg text-xs"
                    title="ล้างรูปตรา"
                  >
                    ล้าง
                  </button>
                )}
              </div>
            </div>

            {/* Checkbox options */}
            <div className="space-y-2 pt-2 border-t border-neutral-100 text-xs">
              <label className="flex items-center space-x-2 text-neutral-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoUpdateStatusOnPrint}
                  onChange={(e) => setAutoUpdateStatusOnPrint(e.target.checked)}
                  className="rounded-sm text-orange-600 focus:ring-orange-500"
                />
                <span className="font-semibold text-neutral-800">
                  อัปเดตสถานะเป็น 'ติดบาร์โค๊ด...' อัตโนมัติเมื่อพิมพ์
                </span>
              </label>

              <label className="flex items-center space-x-2 text-neutral-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLocation}
                  onChange={(e) => setShowLocation(e.target.checked)}
                  className="rounded-sm text-orange-600 focus:ring-orange-500"
                />
                <span>แสดงข้อมูลห้อง / อาคารที่ตั้ง</span>
              </label>

              <label className="flex items-center space-x-2 text-neutral-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDate}
                  onChange={(e) => setShowDate(e.target.checked)}
                  className="rounded-sm text-orange-600 focus:ring-orange-500"
                />
                <span>แสดงวันที่จัดซื้อ</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- Print Preview Section & Printable Stickers Area ---------------- */}
      <div className="space-y-4">
        {/* Preview Control Header */}
        <div className="flex items-center justify-between px-1 print:hidden">
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-orange-600" />
            <h3 className="text-sm font-bold text-neutral-900">
              ตัวอย่างป้ายสติกเกอร์จริง (Live Print Preview)
            </h3>
            <span className="text-xs text-neutral-500">
              (แสดงผล {printItemsList.length} ดวง)
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setZoomLevel((prev) => Math.max(80, prev - 10))}
              className="p-1.5 text-neutral-600 hover:bg-neutral-100 rounded-lg"
              title="ย่อขนาดพรีวิว"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-neutral-500">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel((prev) => Math.min(130, prev + 10))}
              className="p-1.5 text-neutral-600 hover:bg-neutral-100 rounded-lg"
              title="ขยายขนาดพรีวิว"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* The Printable Container */}
        <div className="bg-neutral-100 p-4 sm:p-6 rounded-2xl border border-neutral-200 overflow-x-auto print:bg-transparent print:p-0 print:border-none">
          {printItemsList.length === 0 ? (
            <div className="bg-white p-12 rounded-xl text-center space-y-3">
              <Tag className="w-10 h-10 text-neutral-300 mx-auto" />
              <p className="text-sm font-bold text-neutral-700">
                ยังไม่ได้เลือกรายการทรัพย์สินสำหรับพิมพ์
              </p>
              <p className="text-xs text-neutral-400">
                กรุณาเลือกรายการทรัพย์สินด้านบน หรือใช้ตัวกรองช่วงรหัสเพื่อเริ่มสร้างป้ายบาร์โค้ด
              </p>
            </div>
          ) : (
            <div
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease',
              }}
              className="print:transform-none"
            >
              <div
                className={`grid gap-3.5 print:gap-3 ${getGridColsClass()} print-container`}
              >
                {printItemsList.map(({ asset, copyIndex }, idx) => {
                  return (
                    <div
                      key={`sticker-${asset.id}-${copyIndex}-${idx}`}
                      className={`sticker-item relative rounded-xl p-3 sm:p-3.5 border transition-all ${getStickerThemeClasses()} print:rounded-lg print:border-neutral-400`}
                      style={{
                        minHeight: '140px',
                      }}
                    >
                      {/* Exact Layout matching uploaded sample sticker image */}
                      <div className="flex gap-3 items-center h-full">
                        {/* Left Column: University Emblem (top) + QR Code (bottom) */}
                        <div className="flex flex-col items-center justify-between shrink-0 space-y-1.5">
                          {/* University Emblem Crest */}
                          <div className="w-11 h-11 flex items-center justify-center">
                            <UniversityEmblemSVG
                              className="w-10 h-10"
                              customLogoUrl={customLogoUrl}
                            />
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
                          <p className="text-xs sm:text-sm font-semibold text-neutral-900 tracking-tight leading-snug line-clamp-1">
                            {asset.facultyName || 'มหาวิทยาลัย'}
                          </p>

                          {/* Line 2: รหัสทรัพย์สิน (Bold, high-contrast, prominent) */}
                          <p className="text-sm sm:text-base font-extrabold font-mono text-neutral-950 tracking-normal leading-tight">
                            {asset.assetCode}
                          </p>

                          {/* Optional 1D Barcode if in Barcode1D or Hybrid mode */}
                          {(layoutType === 'barcode1d' || layoutType === 'hybrid') && (
                            <div className="py-0.5">
                              <Barcode1DSVG value={asset.assetCode} height={24} />
                            </div>
                          )}

                          {/* Line 3: ชื่อทรัพย์สิน (Asset Name) */}
                          <p className="text-xs text-neutral-800 font-medium leading-snug line-clamp-2">
                            {asset.name}
                          </p>

                          {/* Optional Location / Date Extra lines if toggled */}
                          {(showLocation || showDate || showStatus) && (
                            <div className="pt-1 mt-0.5 border-t border-neutral-300/80 text-[10px] text-neutral-600 flex items-center justify-between gap-1">
                              {showLocation && (
                                <span className="truncate">
                                  {asset.buildingName} {asset.room ? `(${asset.room})` : ''}
                                </span>
                              )}
                              {showDate && (
                                <span className="shrink-0">{asset.purchaseDate || ''}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
