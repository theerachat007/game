import React, { useState, useMemo } from 'react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Boxes,
  Building,
  Building2,
  Calendar,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  History,
  Layers,
  MapPin,
  PieChart as PieChartIcon,
  Printer,
  RotateCcw,
  Search,
  ShieldCheck,
  Tag,
  User,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ASSET_STATUSES, Asset, AssetHistoryRecord, SystemSettingsState } from '../types';
import { formatCurrency, formatNumber, getStatusStyle } from '../utils/statusUtils';
import { exportHistoryToExcel } from '../services/storageService';

interface ReportsViewProps {
  assets: Asset[];
  history: AssetHistoryRecord[];
  settings: SystemSettingsState;
  onExportExcel: (customList?: Asset[], customFileName?: string) => void;
  onExportHistoryExcel?: (customHistory?: AssetHistoryRecord[], customFileName?: string) => void;
}

type ReportType =
  | 'all'
  | 'status'
  | 'campus'
  | 'faculty'
  | 'department'
  | 'building'
  | 'history';

const CHART_PALETTE = [
  '#f97316',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#a855f7',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
  '#6366f1',
  '#e11d48',
];

export const ReportsView: React.FC<ReportsViewProps> = ({
  assets,
  history,
  settings,
  onExportExcel,
  onExportHistoryExcel,
}) => {
  const [selectedReport, setSelectedReport] = useState<ReportType>('all');
  const [filterCampus, setFilterCampus] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // History Report Specific Filters
  const [historySearchText, setHistorySearchText] = useState<string>('');
  const [historySelectedAssetId, setHistorySelectedAssetId] = useState<string>('ALL');
  const [historyActionFilter, setHistoryActionFilter] = useState<string>('ALL');
  const [historyStartDate, setHistoryStartDate] = useState<string>('');
  const [historyEndDate, setHistoryEndDate] = useState<string>('');
  const [historyViewMode, setHistoryViewMode] = useState<'timeline' | 'grouped'>('timeline');
  const [expandedAssetIds, setExpandedAssetIds] = useState<Record<string, boolean>>({});

  // Filtered Assets for standard reports
  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      const matchCampus = filterCampus === 'ALL' || a.campusName === filterCampus;
      const matchStatus = filterStatus === 'ALL' || a.status === filterStatus;
      return matchCampus && matchStatus;
    });
  }, [assets, filterCampus, filterStatus]);

  const totalAssetsCount = filteredAssets.length;
  const totalAssetsValue = filteredAssets.reduce(
    (sum, a) => sum + (Number(a.price) || 0) * (Number(a.quantity) || 1),
    0
  );

  // Filtered History for History Report
  const filteredHistory = useMemo(() => {
    return history.filter((h) => {
      // 1. Asset selection filter
      if (historySelectedAssetId !== 'ALL' && h.assetId !== historySelectedAssetId) {
        return false;
      }
      // 2. Action filter
      if (historyActionFilter !== 'ALL' && h.action !== historyActionFilter) {
        return false;
      }
      // 3. Search query
      if (historySearchText.trim()) {
        const query = historySearchText.toLowerCase();
        const matchCode = (h.assetCode || '').toLowerCase().includes(query);
        const matchName = (h.assetName || '').toLowerCase().includes(query);
        const matchNote = (h.note || '').toLowerCase().includes(query);
        const matchUser = (h.performedBy || '').toLowerCase().includes(query);
        const matchAction = (h.actionLabel || '').toLowerCase().includes(query);
        if (!matchCode && !matchName && !matchNote && !matchUser && !matchAction) {
          return false;
        }
      }
      // 4. Date range filter
      if (historyStartDate) {
        const itemDate = h.timestamp.slice(0, 10);
        if (itemDate < historyStartDate) return false;
      }
      if (historyEndDate) {
        const itemDate = h.timestamp.slice(0, 10);
        if (itemDate > historyEndDate) return false;
      }
      return true;
    });
  }, [history, historySelectedAssetId, historyActionFilter, historySearchText, historyStartDate, historyEndDate]);

  // Grouped History by Asset
  const historyGroupedByAsset = useMemo(() => {
    const groups: Record<
      string,
      {
        assetId: string;
        assetCode: string;
        assetName: string;
        currentAsset?: Asset;
        logs: AssetHistoryRecord[];
        lastUpdated: string;
      }
    > = {};

    filteredHistory.forEach((log) => {
      const key = log.assetId || log.assetCode || 'unknown';
      if (!groups[key]) {
        const foundAsset = assets.find((a) => a.id === log.assetId || a.assetCode === log.assetCode);
        groups[key] = {
          assetId: log.assetId,
          assetCode: log.assetCode || foundAsset?.assetCode || '-',
          assetName: log.assetName || foundAsset?.name || 'ไม่ระบุชื่อ',
          currentAsset: foundAsset,
          logs: [],
          lastUpdated: log.timestamp,
        };
      }
      groups[key].logs.push(log);
      if (new Date(log.timestamp) > new Date(groups[key].lastUpdated)) {
        groups[key].lastUpdated = log.timestamp;
      }
    });

    // Sort logs inside each group by timestamp desc
    Object.values(groups).forEach((g) => {
      g.logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    });

    return Object.values(groups).sort(
      (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    );
  }, [filteredHistory, assets]);

  // Action distribution for History Chart
  const historyActionChartData = useMemo(() => {
    const map: Record<string, { count: number; name: string }> = {
      CREATE: { count: 0, name: 'ลงทะเบียนใหม่' },
      UPDATE_STATUS: { count: 0, name: 'เปลี่ยนสถานะ' },
      UPDATE_DETAILS: { count: 0, name: 'แก้ไขข้อมูล' },
      BORROW: { count: 0, name: 'ยืมทรัพย์สิน' },
      RETURN: { count: 0, name: 'รับคืนทรัพย์สิน' },
      INSPECTION: { count: 0, name: 'ตรวจนับ/สแกน' },
      MAINTENANCE: { count: 0, name: 'ส่งซ่อมบำรุง' },
      DISPOSAL: { count: 0, name: 'จำหน่าย/ลบ' },
      IMPORT: { count: 0, name: 'นำเข้า Excel' },
    };

    filteredHistory.forEach((h) => {
      const act = h.action || 'UPDATE_STATUS';
      if (map[act]) {
        map[act].count += 1;
      } else {
        map[act] = { count: 1, name: h.actionLabel || act };
      }
    });

    return Object.keys(map)
      .map((k) => ({
        key: k,
        name: map[k].name,
        count: map[k].count,
      }))
      .filter((item) => item.count > 0);
  }, [filteredHistory]);

  // Toggle asset accordion in grouped view
  const toggleAssetAccordion = (assetKey: string) => {
    setExpandedAssetIds((prev) => ({
      ...prev,
      [assetKey]: !prev[assetKey],
    }));
  };

  const expandAllAccordions = () => {
    const allExpanded: Record<string, boolean> = {};
    historyGroupedByAsset.forEach((g) => {
      allExpanded[g.assetId || g.assetCode] = true;
    });
    setExpandedAssetIds(allExpanded);
  };

  const collapseAllAccordions = () => {
    setExpandedAssetIds({});
  };

  // Helper for Action Badges
  const getActionBadgeStyle = (action: string) => {
    switch (action) {
      case 'CREATE':
        return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' };
      case 'UPDATE_STATUS':
        return { bg: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500' };
      case 'UPDATE_DETAILS':
        return { bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' };
      case 'BORROW':
        return { bg: 'bg-amber-50 text-amber-800 border-amber-300', dot: 'bg-amber-500' };
      case 'RETURN':
        return { bg: 'bg-teal-50 text-teal-700 border-teal-200', dot: 'bg-teal-500' };
      case 'INSPECTION':
        return { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' };
      case 'MAINTENANCE':
        return { bg: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' };
      case 'DISPOSAL':
        return { bg: 'bg-neutral-100 text-neutral-700 border-neutral-300', dot: 'bg-neutral-500' };
      case 'IMPORT':
        return { bg: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' };
      default:
        return { bg: 'bg-neutral-50 text-neutral-700 border-neutral-200', dot: 'bg-neutral-400' };
    }
  };

  // 1. Report Data: By Status (6 predefined statuses)
  const statusReportData = useMemo(() => {
    return ASSET_STATUSES.map((status) => {
      const matching = filteredAssets.filter((a) => a.status === status);
      const count = matching.length;
      const totalQty = matching.reduce((s, a) => s + (Number(a.quantity) || 1), 0);
      const totalVal = matching.reduce(
        (s, a) => s + (Number(a.price) || 0) * (Number(a.quantity) || 1),
        0
      );
      const percentage = totalAssetsCount > 0 ? (count / totalAssetsCount) * 100 : 0;
      return {
        key: status,
        name: status,
        count,
        totalQty,
        totalVal,
        percentage,
        items: matching,
      };
    });
  }, [filteredAssets, totalAssetsCount]);

  // 2. Report Data: By Campus
  const campusReportData = useMemo(() => {
    const map: Record<string, { count: number; totalQty: number; totalVal: number; items: Asset[] }> = {};
    settings.campuses.forEach((c) => {
      map[c.name] = { count: 0, totalQty: 0, totalVal: 0, items: [] };
    });

    filteredAssets.forEach((a) => {
      const key = a.campusName || 'ไม่ระบุวิทยาเขต';
      if (!map[key]) map[key] = { count: 0, totalQty: 0, totalVal: 0, items: [] };
      map[key].count += 1;
      map[key].totalQty += Number(a.quantity) || 1;
      map[key].totalVal += (Number(a.price) || 0) * (Number(a.quantity) || 1);
      map[key].items.push(a);
    });

    return Object.keys(map).map((key) => ({
      key,
      name: key,
      count: map[key].count,
      totalQty: map[key].totalQty,
      totalVal: map[key].totalVal,
      percentage: totalAssetsCount > 0 ? (map[key].count / totalAssetsCount) * 100 : 0,
      items: map[key].items,
    }));
  }, [filteredAssets, settings.campuses, totalAssetsCount]);

  // 3. Report Data: By Faculty
  const facultyReportData = useMemo(() => {
    const map: Record<string, { count: number; totalQty: number; totalVal: number; items: Asset[] }> = {};
    settings.faculties.forEach((f) => {
      map[f.name] = { count: 0, totalQty: 0, totalVal: 0, items: [] };
    });

    filteredAssets.forEach((a) => {
      const key = a.facultyName || 'ไม่ระบุคณะ';
      if (!map[key]) map[key] = { count: 0, totalQty: 0, totalVal: 0, items: [] };
      map[key].count += 1;
      map[key].totalQty += Number(a.quantity) || 1;
      map[key].totalVal += (Number(a.price) || 0) * (Number(a.quantity) || 1);
      map[key].items.push(a);
    });

    return Object.keys(map).map((key) => ({
      key,
      name: key,
      count: map[key].count,
      totalQty: map[key].totalQty,
      totalVal: map[key].totalVal,
      percentage: totalAssetsCount > 0 ? (map[key].count / totalAssetsCount) * 100 : 0,
      items: map[key].items,
    }));
  }, [filteredAssets, settings.faculties, totalAssetsCount]);

  // 4. Report Data: By Department
  const departmentReportData = useMemo(() => {
    const map: Record<string, { count: number; totalQty: number; totalVal: number; items: Asset[] }> = {};
    settings.departments.forEach((d) => {
      map[d.name] = { count: 0, totalQty: 0, totalVal: 0, items: [] };
    });

    filteredAssets.forEach((a) => {
      const key = a.departmentName || 'ไม่ระบุสาขา';
      if (!map[key]) map[key] = { count: 0, totalQty: 0, totalVal: 0, items: [] };
      map[key].count += 1;
      map[key].totalQty += Number(a.quantity) || 1;
      map[key].totalVal += (Number(a.price) || 0) * (Number(a.quantity) || 1);
      map[key].items.push(a);
    });

    return Object.keys(map).map((key) => ({
      key,
      name: key,
      count: map[key].count,
      totalQty: map[key].totalQty,
      totalVal: map[key].totalVal,
      percentage: totalAssetsCount > 0 ? (map[key].count / totalAssetsCount) * 100 : 0,
      items: map[key].items,
    }));
  }, [filteredAssets, settings.departments, totalAssetsCount]);

  // 5. Report Data: By Building
  const buildingReportData = useMemo(() => {
    const map: Record<string, { count: number; totalQty: number; totalVal: number; items: Asset[] }> = {};
    settings.buildings.forEach((b) => {
      map[b.name] = { count: 0, totalQty: 0, totalVal: 0, items: [] };
    });

    filteredAssets.forEach((a) => {
      const key = a.buildingName || 'ไม่ระบุอาคาร';
      if (!map[key]) map[key] = { count: 0, totalQty: 0, totalVal: 0, items: [] };
      map[key].count += 1;
      map[key].totalQty += Number(a.quantity) || 1;
      map[key].totalVal += (Number(a.price) || 0) * (Number(a.quantity) || 1);
      map[key].items.push(a);
    });

    return Object.keys(map).map((key) => ({
      key,
      name: key,
      count: map[key].count,
      totalQty: map[key].totalQty,
      totalVal: map[key].totalVal,
      percentage: totalAssetsCount > 0 ? (map[key].count / totalAssetsCount) * 100 : 0,
      items: map[key].items,
    }));
  }, [filteredAssets, settings.buildings, totalAssetsCount]);

  const reportsNav = [
    { id: 'all' as ReportType, title: '1. รายงานทรัพย์สินทั้งหมด', icon: Boxes },
    { id: 'status' as ReportType, title: '2. รายงานตามสถานะ', icon: Layers },
    { id: 'campus' as ReportType, title: '3. รายงานตามวิทยาเขต', icon: Building2 },
    { id: 'faculty' as ReportType, title: '4. รายงานตามสังกัด/คณะ', icon: ShieldCheck },
    { id: 'department' as ReportType, title: '5. รายงานตามสาขา/หน่วยงาน', icon: FileText },
    { id: 'building' as ReportType, title: '6. รายงานตามอาคาร', icon: Building },
    { id: 'history' as ReportType, title: '7. รายงานประวัติการเปลี่ยนแปลงทรัพย์สิน', icon: History },
  ];

  const getCurrentReportName = () => {
    return reportsNav.find((r) => r.id === selectedReport)?.title || 'รายงานทรัพย์สิน';
  };

  const handleExport = () => {
    if (selectedReport === 'history') {
      if (onExportHistoryExcel) {
        onExportHistoryExcel(filteredHistory, 'รายงานประวัติการเปลี่ยนแปลงทรัพย์สิน.xlsx');
      } else {
        exportHistoryToExcel(filteredHistory, 'รายงานประวัติการเปลี่ยนแปลงทรัพย์สิน.xlsx');
      }
    } else {
      onExportExcel(filteredAssets, `${getCurrentReportName()}.xlsx`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-orange-100 shadow-xs print:hidden">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-orange-500 text-white shadow-xs shadow-orange-300">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-900">
              ระบบรายงานและสถิติทรัพย์สิน (Asset Reports)
            </h2>
            <p className="text-xs text-neutral-500">
              สรุปข้อมูลทรัพย์สินและประวัติการเปลี่ยนแปลง พร้อมสถิติจำนวน มูลค่า และกราฟวิเคราะห์
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExport}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all"
            title="ส่งออกรายงานเป็นไฟล์ Excel"
          >
            <Download className="w-4 h-4" />
            <span>ส่งออก Excel</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-bold border border-neutral-300 cursor-pointer transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์รายงาน</span>
          </button>
        </div>
      </div>

      {/* 7 Report Navigation Tabs */}
      <div className="flex overflow-x-auto space-x-2 pb-1 print:hidden scrollbar-thin">
        {reportsNav.map((r) => {
          const Icon = r.icon;
          const isActive = selectedReport === r.id;
          return (
            <button
              key={r.id}
              onClick={() => setSelectedReport(r.id)}
              className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl font-bold text-xs shrink-0 transition-all cursor-pointer ${
                isActive
                  ? 'bg-orange-500 text-white shadow-xs shadow-orange-300'
                  : 'bg-white text-neutral-600 hover:bg-orange-50 hover:text-orange-600 border border-neutral-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{r.title}</span>
            </button>
          );
        })}
      </div>

      {/* Filters Bar for Standard Reports (1-6) */}
      {selectedReport !== 'history' && (
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-1.5 font-bold text-neutral-700">
              <Filter className="w-4 h-4 text-orange-600" />
              <span>ตัวกรอง:</span>
            </div>

            <select
              value={filterCampus}
              onChange={(e) => setFilterCampus(e.target.value)}
              className="px-3 py-1.5 bg-neutral-50 border border-neutral-300 rounded-lg font-medium text-neutral-800"
            >
              <option value="ALL">ทุกวิทยาเขต</option>
              {settings.campuses.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 bg-neutral-50 border border-neutral-300 rounded-lg font-medium text-neutral-800"
            >
              <option value="ALL">ทุกสถานะ</option>
              {ASSET_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div className="text-neutral-500">
            ข้อมูล ณ วันที่: {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      )}

      {/* Filters Bar for History Report (7) */}
      {selectedReport === 'history' && (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-3.5 print:hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="ค้นหาตามรหัสทรัพย์สิน, ชื่อทรัพย์สิน, ผู้ดำเนินการ, หรือหมายเหตุ..."
                value={historySearchText}
                onChange={(e) => setHistorySearchText(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
              {historySearchText && (
                <button
                  onClick={() => setHistorySearchText('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2">
              <div className="flex bg-neutral-100 p-1 rounded-xl border border-neutral-200 text-xs">
                <button
                  onClick={() => setHistoryViewMode('timeline')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    historyViewMode === 'timeline'
                      ? 'bg-white text-orange-600 shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  ไทม์ไลน์บันทึกทั้งหมด ({filteredHistory.length})
                </button>
                <button
                  onClick={() => setHistoryViewMode('grouped')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    historyViewMode === 'grouped'
                      ? 'bg-white text-orange-600 shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  จัดกลุ่มตามรายทรัพย์สิน ({historyGroupedByAsset.length})
                </button>
              </div>

              {historyViewMode === 'grouped' && (
                <div className="flex items-center space-x-1 text-xs">
                  <button
                    onClick={expandAllAccordions}
                    className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg font-medium cursor-pointer"
                  >
                    ขยายทั้งหมด
                  </button>
                  <button
                    onClick={collapseAllAccordions}
                    className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg font-medium cursor-pointer"
                  >
                    ย่อทั้งหมด
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sub Filters: Specific Asset, Action, Date Range */}
          <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-neutral-100 text-xs">
            <div className="flex items-center space-x-1.5 font-bold text-neutral-700">
              <Filter className="w-3.5 h-3.5 text-orange-600" />
              <span>ตัวกรองประวัติ:</span>
            </div>

            {/* Select Specific Asset */}
            <div className="flex items-center space-x-1">
              <span className="text-neutral-500">เลือกทรัพย์สิน:</span>
              <select
                value={historySelectedAssetId}
                onChange={(e) => setHistorySelectedAssetId(e.target.value)}
                className="max-w-[200px] sm:max-w-xs px-2.5 py-1.5 bg-neutral-50 border border-neutral-300 rounded-lg font-medium text-neutral-800 truncate"
              >
                <option value="ALL">ทรัพย์สินทั้งหมด ({assets.length} รายการ)</option>
                {assets.map((ast) => (
                  <option key={ast.id} value={ast.id}>
                    [{ast.assetCode}] {ast.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Select Action */}
            <div className="flex items-center space-x-1">
              <span className="text-neutral-500">ประเภทการเปลี่ยนแปลง:</span>
              <select
                value={historyActionFilter}
                onChange={(e) => setHistoryActionFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-neutral-50 border border-neutral-300 rounded-lg font-medium text-neutral-800"
              >
                <option value="ALL">ทุกประเภทการเปลี่ยนแปลง</option>
                <option value="CREATE">ลงทะเบียนใหม่ (CREATE)</option>
                <option value="UPDATE_STATUS">เปลี่ยนสถานะ (UPDATE_STATUS)</option>
                <option value="UPDATE_DETAILS">แก้ไขข้อมูล (UPDATE_DETAILS)</option>
                <option value="BORROW">ยืมทรัพย์สิน (BORROW)</option>
                <option value="RETURN">รับคืนทรัพย์สิน (RETURN)</option>
                <option value="INSPECTION">ตรวจนับ/สแกน (INSPECTION)</option>
                <option value="MAINTENANCE">ส่งซ่อมบำรุง (MAINTENANCE)</option>
                <option value="DISPOSAL">จำหน่าย/ลบ (DISPOSAL)</option>
                <option value="IMPORT">นำเข้า Excel (IMPORT)</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="flex items-center space-x-1.5">
              <span className="text-neutral-500">ช่วงวันที่:</span>
              <input
                type="date"
                value={historyStartDate}
                onChange={(e) => setHistoryStartDate(e.target.value)}
                className="px-2 py-1 bg-neutral-50 border border-neutral-300 rounded-lg font-medium text-neutral-800"
              />
              <span className="text-neutral-400">-</span>
              <input
                type="date"
                value={historyEndDate}
                onChange={(e) => setHistoryEndDate(e.target.value)}
                className="px-2 py-1 bg-neutral-50 border border-neutral-300 rounded-lg font-medium text-neutral-800"
              />
            </div>

            {(historySelectedAssetId !== 'ALL' ||
              historyActionFilter !== 'ALL' ||
              historyStartDate ||
              historyEndDate ||
              historySearchText) && (
              <button
                onClick={() => {
                  setHistorySelectedAssetId('ALL');
                  setHistoryActionFilter('ALL');
                  setHistoryStartDate('');
                  setHistoryEndDate('');
                  setHistorySearchText('');
                }}
                className="flex items-center space-x-1 px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-lg font-medium cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>ล้างตัวกรอง</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Printable Report Header */}
      <div className="hidden print:block text-center pb-4 border-b border-black">
        <h1 className="text-xl font-bold">มหาวิทยาลัย • ระบบบริหารทรัพย์สิน</h1>
        <h2 className="text-base font-bold mt-1">{getCurrentReportName()}</h2>
        <p className="text-xs text-neutral-600">
          {selectedReport === 'history'
            ? `ข้อมูลบันทึกประวัติรวม ${filteredHistory.length} รายการ (จากทรัพย์สิน ${historyGroupedByAsset.length} รายการ)`
            : `ข้อมูลรวม ${totalAssetsCount} รายการ | มูลค่ารวม ${formatCurrency(totalAssetsValue)}`}
        </p>
      </div>

      {/* Metric Cards Summary for Standard Reports (1-6) */}
      {selectedReport !== 'history' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-orange-100 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase">
                จำนวนทรัพย์สินในรายงานนี้
              </p>
              <h3 className="text-3xl font-extrabold text-neutral-900 mt-1">
                {formatNumber(totalAssetsCount)}
                <span className="text-xs font-normal text-neutral-500 ml-1.5">รายการ</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-200">
              <Boxes className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-orange-100 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase">
                มูลค่าทรัพย์สินรวมในรายงานนี้
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-orange-600 mt-1">
                {formatCurrency(totalAssetsValue)}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* Metric Cards Summary for History Report (7) */}
      {selectedReport === 'history' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-orange-100 shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-[11px] sm:text-xs font-bold text-neutral-500 uppercase">
                ประวัติการเปลี่ยนแปลง
              </p>
              <History className="w-4 h-4 text-orange-600" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mt-1">
              {formatNumber(filteredHistory.length)}
              <span className="text-xs font-normal text-neutral-500 ml-1">ครั้ง</span>
            </h3>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-blue-100 shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-[11px] sm:text-xs font-bold text-neutral-500 uppercase">
                ทรัพย์สินที่มีการบันทึก
              </p>
              <Boxes className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-blue-700 mt-1">
              {formatNumber(historyGroupedByAsset.length)}
              <span className="text-xs font-normal text-neutral-500 ml-1">รายการ</span>
            </h3>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-100 shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-[11px] sm:text-xs font-bold text-neutral-500 uppercase">
                การเปลี่ยนสถานะพัสดุ
              </p>
              <Layers className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1">
              {formatNumber(
                filteredHistory.filter((h) => h.action === 'UPDATE_STATUS' || h.action === 'CREATE').length
              )}
              <span className="text-xs font-normal text-neutral-500 ml-1">ครั้ง</span>
            </h3>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-100 shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-[11px] sm:text-xs font-bold text-neutral-500 uppercase">
                ยืม-คืน / ตรวจนับ
              </p>
              <Activity className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-1">
              {formatNumber(
                filteredHistory.filter(
                  (h) => h.action === 'BORROW' || h.action === 'RETURN' || h.action === 'INSPECTION'
                ).length
              )}
              <span className="text-xs font-normal text-neutral-500 ml-1">ครั้ง</span>
            </h3>
          </div>
        </div>
      )}

      {/* REPORT CONTENT: 1. All Assets Table */}
      {selectedReport === 'all' && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-800">
              รายละเอียดทรัพย์สินทั้งหมด ({filteredAssets.length} รายการ)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-100/80 border-b border-neutral-200 text-neutral-600 font-bold">
                <tr>
                  <th className="py-2.5 px-3">ลำดับ</th>
                  <th className="py-2.5 px-3">รหัสทรัพย์สิน</th>
                  <th className="py-2.5 px-3">ชื่อทรัพย์สิน</th>
                  <th className="py-2.5 px-3">ประเภท</th>
                  <th className="py-2.5 px-3">วิทยาเขต/คณะ</th>
                  <th className="py-2.5 px-3">อาคาร/ห้อง</th>
                  <th className="py-2.5 px-3 text-center">จำนวน</th>
                  <th className="py-2.5 px-3 text-right">ราคา</th>
                  <th className="py-2.5 px-3">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredAssets.map((asset, idx) => {
                  const stStyle = getStatusStyle(asset.status);
                  return (
                    <tr key={asset.id} className="hover:bg-orange-50/40">
                      <td className="py-2.5 px-3 text-neutral-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-orange-700">
                        {asset.assetCode}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-neutral-900">{asset.name}</td>
                      <td className="py-2.5 px-3 text-neutral-600">{asset.typeName}</td>
                      <td className="py-2.5 px-3 text-neutral-600">
                        {asset.campusName?.split(' ')[0]} / {asset.facultyName}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-700">
                        {asset.buildingName ? `${asset.buildingName.split(' ')[0]} - ${asset.room}` : asset.room}
                      </td>
                      <td className="py-2.5 px-3 text-center font-medium">{asset.quantity}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-neutral-800">
                        {formatCurrency(asset.price)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${stStyle.lightBg} ${stStyle.text} ${stStyle.border}`}
                        >
                          {asset.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT CONTENT: 7. History Report (ประวัติการเปลี่ยนแปลง) */}
      {selectedReport === 'history' && (
        <div className="space-y-6">
          {/* Action Types Distribution Chart */}
          {historyActionChartData.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs print:hidden">
              <h4 className="text-sm font-bold text-neutral-800 mb-4 flex items-center space-x-2">
                <Activity className="w-4 h-4 text-orange-600" />
                <span>แผนภูมิแสดงสัดส่วนประเภทการเปลี่ยนแปลงของทรัพย์สิน</span>
              </h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={historyActionChartData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: '#475569' }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fontSize: 10, fill: '#475569' }} allowDecimals={false} />
                    <Tooltip
                      formatter={(val: any) => [`${val} ครั้ง`, 'จำนวนบันทึก']}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        border: '1px solid #fed7aa',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="count" fill="#f97316" radius={[6, 6, 0, 0]} barSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* VIEW MODE 1: TIMELINE TABLE */}
          {historyViewMode === 'timeline' && (
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-neutral-800 flex items-center space-x-2">
                  <History className="w-4 h-4 text-orange-600" />
                  <span>บันทึกประวัติการเปลี่ยนแปลงตามลำดับเวลา ({filteredHistory.length} รายการ)</span>
                </h3>
                <span className="text-xs text-neutral-500">
                  เรียงลำดับจากล่าสุดไปเก่าสุด
                </span>
              </div>

              {filteredHistory.length === 0 ? (
                <div className="p-12 text-center text-neutral-500">
                  <History className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
                  <p className="font-semibold text-neutral-700">ไม่พบบันทึกประวัติการเปลี่ยนแปลง</p>
                  <p className="text-xs text-neutral-400 mt-1">ลองเปลี่ยนเงื่อนไขตัวกรองหรือคำค้นหา</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-100/80 border-b border-neutral-200 text-neutral-600 font-bold">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center">ลำดับ</th>
                        <th className="py-2.5 px-3 w-36">วัน-เวลา</th>
                        <th className="py-2.5 px-3">รหัสทรัพย์สิน</th>
                        <th className="py-2.5 px-3">ชื่อทรัพย์สิน</th>
                        <th className="py-2.5 px-3">รายการเปลี่ยนแปลง</th>
                        <th className="py-2.5 px-3">การเปลี่ยนสถานะ</th>
                        <th className="py-2.5 px-3">รายละเอียด / หมายเหตุ</th>
                        <th className="py-2.5 px-3">ผู้บันทึก/ดำเนินการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {filteredHistory.map((log, idx) => {
                        const badgeStyle = getActionBadgeStyle(log.action);
                        const prevStStyle = log.previousStatus ? getStatusStyle(log.previousStatus) : null;
                        const newStStyle = log.newStatus ? getStatusStyle(log.newStatus) : null;

                        return (
                          <tr key={log.id || idx} className="hover:bg-orange-50/40 transition-colors">
                            <td className="py-3 px-3 text-center text-neutral-400 font-mono">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-3 text-neutral-600 whitespace-nowrap">
                              <div className="font-semibold text-neutral-800">
                                {new Date(log.timestamp).toLocaleDateString('th-TH', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </div>
                              <div className="text-[11px] text-neutral-400">
                                {new Date(log.timestamp).toLocaleTimeString('th-TH', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })}{' '}
                                น.
                              </div>
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-orange-700 whitespace-nowrap">
                              {log.assetCode || '-'}
                            </td>
                            <td className="py-3 px-3 font-semibold text-neutral-900 max-w-[200px]">
                              <span className="line-clamp-2">{log.assetName || '-'}</span>
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${badgeStyle.bg}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${badgeStyle.dot}`}></span>
                                <span>{log.actionLabel || log.action}</span>
                              </span>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              {log.previousStatus && log.newStatus && log.previousStatus !== log.newStatus ? (
                                <div className="flex items-center space-x-1.5">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${prevStStyle?.lightBg} ${prevStStyle?.text} ${prevStStyle?.border}`}
                                  >
                                    {log.previousStatus}
                                  </span>
                                  <ArrowRight className="w-3 h-3 text-neutral-400 shrink-0" />
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${newStStyle?.lightBg} ${newStStyle?.text} ${newStStyle?.border}`}
                                  >
                                    {log.newStatus}
                                  </span>
                                </div>
                              ) : log.newStatus ? (
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${newStStyle?.lightBg} ${newStStyle?.text} ${newStStyle?.border}`}
                                >
                                  {log.newStatus}
                                </span>
                              ) : (
                                <span className="text-neutral-400">-</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-neutral-700 max-w-[260px]">
                              <p className="line-clamp-2 leading-relaxed">{log.note || '-'}</p>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <div className="flex items-center space-x-1.5 text-neutral-700 font-medium">
                                <User className="w-3.5 h-3.5 text-neutral-400" />
                                <span>{log.performedBy || 'System'}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* VIEW MODE 2: GROUPED BY ASSET */}
          {historyViewMode === 'grouped' && (
            <div className="space-y-4">
              {historyGroupedByAsset.length === 0 ? (
                <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center text-neutral-500">
                  <History className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
                  <p className="font-semibold text-neutral-700">ไม่พบบันทึกประวัติการเปลี่ยนแปลง</p>
                  <p className="text-xs text-neutral-400 mt-1">ลองเปลี่ยนเงื่อนไขตัวกรองหรือคำค้นหา</p>
                </div>
              ) : (
                historyGroupedByAsset.map((group) => {
                  const isExpanded = expandedAssetIds[group.assetId || group.assetCode] ?? true;
                  const curAsset = group.currentAsset;
                  const currentStStyle = curAsset ? getStatusStyle(curAsset.status) : null;

                  return (
                    <div
                      key={group.assetId || group.assetCode}
                      className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden transition-all"
                    >
                      {/* Asset Header Accordion */}
                      <div
                        onClick={() => toggleAssetAccordion(group.assetId || group.assetCode)}
                        className="p-4 bg-neutral-50 hover:bg-orange-50/50 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start sm:items-center space-x-3">
                          <div className="p-2 rounded-xl bg-orange-100 text-orange-700 font-mono font-bold text-xs shrink-0">
                            {group.assetCode}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="text-sm font-bold text-neutral-900">{group.assetName}</h4>
                              {curAsset && (
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${currentStStyle?.lightBg} ${currentStStyle?.text} ${currentStStyle?.border}`}
                                >
                                  สถานะปัจจุบัน: {curAsset.status}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-neutral-500 mt-0.5">
                              {curAsset?.campusName} • {curAsset?.facultyName} •{' '}
                              {curAsset?.buildingName ? `${curAsset.buildingName} (${curAsset.room})` : curAsset?.room || '-'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 text-xs">
                          <span className="px-2.5 py-1 bg-white border border-neutral-200 rounded-lg text-neutral-600 font-semibold shadow-2xs">
                            มีบันทึก {group.logs.length} ครั้ง
                          </span>
                          <span className="text-neutral-400 font-bold">
                            {isExpanded ? '▲ ย่อ' : '▼ ดูประวัติ'}
                          </span>
                        </div>
                      </div>

                      {/* Log timeline items for this asset */}
                      {isExpanded && (
                        <div className="p-4 sm:p-5">
                          <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200">
                            {group.logs.map((log, lIdx) => {
                              const badgeStyle = getActionBadgeStyle(log.action);
                              const prevStStyle = log.previousStatus ? getStatusStyle(log.previousStatus) : null;
                              const newStStyle = log.newStatus ? getStatusStyle(log.newStatus) : null;

                              return (
                                <div key={log.id || lIdx} className="relative group">
                                  {/* Timeline marker */}
                                  <div
                                    className={`absolute -left-6 sm:-left-8 top-1 w-3 sm:w-3.5 h-3 sm:h-3.5 rounded-full border-2 border-white ${badgeStyle.dot} shadow-xs`}
                                  />

                                  <div className="bg-neutral-50/80 hover:bg-neutral-50 p-3.5 rounded-xl border border-neutral-200/80 transition-colors">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
                                      <div className="flex items-center space-x-2">
                                        <span
                                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badgeStyle.bg}`}
                                        >
                                          <span>{log.actionLabel || log.action}</span>
                                        </span>

                                        {log.previousStatus && log.newStatus && log.previousStatus !== log.newStatus && (
                                          <div className="flex items-center space-x-1 text-xs">
                                            <span
                                              className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${prevStStyle?.lightBg} ${prevStStyle?.text} ${prevStStyle?.border}`}
                                            >
                                              {log.previousStatus}
                                            </span>
                                            <ArrowRight className="w-3 h-3 text-neutral-400" />
                                            <span
                                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${newStStyle?.lightBg} ${newStStyle?.text} ${newStStyle?.border}`}
                                            >
                                              {log.newStatus}
                                            </span>
                                          </div>
                                        )}
                                      </div>

                                      <div className="flex items-center space-x-2 text-[11px] text-neutral-500">
                                        <Clock className="w-3 h-3 text-neutral-400" />
                                        <span>
                                          {new Date(log.timestamp).toLocaleDateString('th-TH', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                          })}{' '}
                                          {new Date(log.timestamp).toLocaleTimeString('th-TH', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          })}{' '}
                                          น.
                                        </span>
                                      </div>
                                    </div>

                                    {log.note && (
                                      <p className="text-xs text-neutral-700 mt-1 leading-relaxed bg-white/70 p-2 rounded-lg border border-neutral-100">
                                        {log.note}
                                      </p>
                                    )}

                                    <div className="mt-2 text-[11px] text-neutral-500 flex items-center justify-between">
                                      <div className="flex items-center space-x-1">
                                        <User className="w-3 h-3 text-neutral-400" />
                                        <span>ผู้บันทึก: <strong>{log.performedBy || 'System'}</strong></span>
                                      </div>
                                      <span className="text-neutral-400 font-mono">#{group.logs.length - lIdx}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* Aggregate Reports (Status, Campus, Faculty, Department, Building) */}
      {selectedReport !== 'all' && selectedReport !== 'history' && (
        <div className="space-y-6">
          {/* Chart Section */}
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs print:hidden">
            <h4 className="text-sm font-bold text-neutral-800 mb-4">
              แผนภูมิแสดงการกระจายของ {getCurrentReportName()}
            </h4>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={
                    selectedReport === 'status'
                      ? statusReportData
                      : selectedReport === 'campus'
                      ? campusReportData
                      : selectedReport === 'faculty'
                      ? facultyReportData
                      : selectedReport === 'department'
                      ? departmentReportData
                      : buildingReportData
                  }
                  margin={{ top: 10, right: 10, left: 10, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#475569' }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#475569' }} allowDecimals={false} />
                  <Tooltip
                    formatter={(val: any, name: any) => [
                      name === 'count' ? `${val} รายการ` : formatCurrency(val),
                      name === 'count' ? 'จำนวนทรัพย์สิน' : 'มูลค่ารวม',
                    ]}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      border: '1px solid #fed7aa',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" fill="#f97316" radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Breakdown Data Table */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-800">
                ตารางสรุปข้อมูลตามหมวดหมู่
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-100/80 border-b border-neutral-200 text-neutral-600 font-bold">
                  <tr>
                    <th className="py-2.5 px-3">หมวดหมู่ / รายการ</th>
                    <th className="py-2.5 px-3 text-center">จำนวน (รายการ)</th>
                    <th className="py-2.5 px-3 text-center">จำนวนชิ้นรวม</th>
                    <th className="py-2.5 px-3 text-right">มูลค่ารวม (บาท)</th>
                    <th className="py-2.5 px-3 text-right">สัดส่วน (%)</th>
                    <th className="py-2.5 px-3">แผนภูมิสัดส่วน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {(selectedReport === 'status'
                    ? statusReportData
                    : selectedReport === 'campus'
                    ? campusReportData
                    : selectedReport === 'faculty'
                    ? facultyReportData
                    : selectedReport === 'department'
                    ? departmentReportData
                    : buildingReportData
                  ).map((row, idx) => (
                    <tr key={row.key} className="hover:bg-orange-50/40">
                      <td className="py-3 px-3 font-semibold text-neutral-900">{row.name}</td>
                      <td className="py-3 px-3 text-center font-bold text-neutral-800">
                        {formatNumber(row.count)}
                      </td>
                      <td className="py-3 px-3 text-center text-neutral-600">
                        {formatNumber(row.totalQty)}
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-orange-700">
                        {formatCurrency(row.totalVal)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-neutral-700">
                        {row.percentage.toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 w-40">
                        <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-orange-500 h-full rounded-full"
                            style={{ width: `${row.percentage}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
