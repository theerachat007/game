import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Boxes,
  Building,
  Building2,
  Calendar,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  MapPin,
  PieChart as PieChartIcon,
  Printer,
  ShieldCheck,
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
import { ASSET_STATUSES, Asset, SystemSettingsState } from '../types';
import { formatCurrency, formatNumber, getStatusStyle } from '../utils/statusUtils';

interface ReportsViewProps {
  assets: Asset[];
  settings: SystemSettingsState;
  onExportExcel: (customList?: Asset[], customFileName?: string) => void;
}

type ReportType =
  | 'all'
  | 'status'
  | 'campus'
  | 'faculty'
  | 'department'
  | 'building';

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
  settings,
  onExportExcel,
}) => {
  const [selectedReport, setSelectedReport] = useState<ReportType>('all');
  const [filterCampus, setFilterCampus] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Filtered Assets for reports
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
  ];

  const getCurrentReportName = () => {
    return reportsNav.find((r) => r.id === selectedReport)?.title || 'รายงานทรัพย์สิน';
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
              สรุปข้อมูลทรัพย์สิน 6 มิติ พร้อมสถิติจำนวน มูลค่า และกราฟวิเคราะห์
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onExportExcel(filteredAssets, `${getCurrentReportName()}.xlsx`)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>ส่งออก Excel</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-bold border border-neutral-300 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์รายงาน</span>
          </button>
        </div>
      </div>

      {/* 6 Report Navigation Tabs */}
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

      {/* Filters Bar */}
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

      {/* Printable Report Header */}
      <div className="hidden print:block text-center pb-4 border-b border-black">
        <h1 className="text-xl font-bold">มหาวิทยาลัย • ระบบบริหารทรัพย์สิน</h1>
        <h2 className="text-base font-bold mt-1">{getCurrentReportName()}</h2>
        <p className="text-xs text-neutral-600">
          ข้อมูลรวม {totalAssetsCount} รายการ | มูลค่ารวม {formatCurrency(totalAssetsValue)}
        </p>
      </div>

      {/* Metric Cards Summary */}
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

      {/* REPORT CONTENT PER SELECTED TAB */}
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

      {/* Aggregate Reports (Status, Campus, Faculty, Department, Building) */}
      {selectedReport !== 'all' && (
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
