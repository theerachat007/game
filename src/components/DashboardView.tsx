import React from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  Building,
  CheckCircle2,
  Clock,
  Coins,
  FileCheck2,
  FileSpreadsheet,
  Layers,
  Plus,
  QrCode,
  TrendingUp,
  Wrench,
  XCircle,
} from 'lucide-react';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { ASSET_STATUSES, Asset, AssetHistoryRecord } from '../types';
import { formatCurrency, formatNumber, getStatusStyle } from '../utils/statusUtils';

interface DashboardViewProps {
  assets: Asset[];
  history: AssetHistoryRecord[];
  onNavigateTab: (tab: any) => void;
  onOpenAddAsset: () => void;
  onOpenScanner: () => void;
  onExportExcel: () => void;
}

const STATUS_CHART_COLORS: Record<string, string> = {
  'สถานะว่าง/พร้อมใช้': '#10b981', // Emerald
  'ใช้งานอยู่': '#3b82f6', // Blue
  'ส่งซ่อมบำรุง': '#f59e0b', // Amber
  'จำหน่าย/ตัดยอด': '#f43f5e', // Rose
  'ติดบาร์โค๊ดและบันทึกลงในระบบทรัพย์สิน': '#f97316', // Orange
  'อยู่ระหว่างการบันทึกละระบบทรัพย์สิน': '#a855f7', // Purple
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  assets,
  history,
  onNavigateTab,
  onOpenAddAsset,
  onOpenScanner,
  onExportExcel,
}) => {
  const totalAssets = assets.length;
  const totalQuantity = assets.reduce((sum, a) => sum + (Number(a.quantity) || 1), 0);
  const totalValue = assets.reduce(
    (sum, a) => sum + (Number(a.price) || 0) * (Number(a.quantity) || 1),
    0
  );

  // Status counts map
  const statusCounts = ASSET_STATUSES.reduce((acc, status) => {
    acc[status] = assets.filter((a) => a.status === status).length;
    return acc;
  }, {} as Record<string, number>);

  // Chart Data: Status Pie Chart
  const statusPieData = ASSET_STATUSES.map((status) => ({
    name: status,
    value: statusCounts[status] || 0,
    color: STATUS_CHART_COLORS[status] || '#f97316',
  })).filter((item) => item.value > 0);

  // Chart Data: Assets by Campus
  const campusMap: Record<string, { count: number; value: number }> = {};
  assets.forEach((a) => {
    const campus = a.campusName || 'ส่วนกลาง';
    if (!campusMap[campus]) campusMap[campus] = { count: 0, value: 0 };
    campusMap[campus].count += 1;
    campusMap[campus].value += (Number(a.price) || 0) * (Number(a.quantity) || 1);
  });

  const campusBarData = Object.keys(campusMap).map((k) => ({
    name: k.replace('วิทยาเขต', '').replace('มหานคร', '').trim(),
    fullName: k,
    count: campusMap[k].count,
    value: campusMap[k].value,
  }));

  // Chart Data: Assets by Type
  const typeMap: Record<string, number> = {};
  assets.forEach((a) => {
    const type = a.typeName || 'อื่นๆ';
    typeMap[type] = (typeMap[type] || 0) + 1;
  });

  const typeBarData = Object.keys(typeMap).map((k) => ({
    name: k.length > 15 ? k.substring(0, 15) + '...' : k,
    fullName: k,
    count: typeMap[k],
  }));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'สถานะว่าง/พร้อมใช้':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'ใช้งานอยู่':
        return <Layers className="w-5 h-5 text-blue-600" />;
      case 'ส่งซ่อมบำรุง':
        return <Wrench className="w-5 h-5 text-amber-600" />;
      case 'จำหน่าย/ตัดยอด':
        return <XCircle className="w-5 h-5 text-rose-600" />;
      case 'ติดบาร์โค๊ดและบันทึกลงในระบบทรัพย์สิน':
        return <FileCheck2 className="w-5 h-5 text-orange-600" />;
      case 'อยู่ระหว่างการบันทึกละระบบทรัพย์สิน':
      default:
        return <Clock className="w-5 h-5 text-purple-600" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-linear-to-r from-orange-600 via-orange-500 to-amber-500 p-6 sm:p-8 text-white shadow-lg shadow-orange-500/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-semibold mb-3">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>ภาพรวมการบริหารทรัพย์สินมหาวิทยาลัย</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Dashboard บริหารและติดตามทรัพย์สิน
          </h2>
          <p className="mt-1 text-orange-100 text-sm sm:text-base max-w-2xl font-normal">
            ระบบติดตามสถานะ ตรวจนับพัสดุ สแกนบาร์โค้ด QR Code และเชื่อมโยงฐานข้อมูลส่วนกลางแบบเรียลไทม์
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            id="btn-dash-add-asset"
            onClick={onOpenAddAsset}
            className="flex items-center space-x-2 px-4 py-2.5 bg-white text-orange-700 hover:bg-orange-50 rounded-xl text-sm font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มทรัพย์สิน</span>
          </button>
          <button
            id="btn-dash-scan-qr"
            onClick={onOpenScanner}
            className="flex items-center space-x-2 px-4 py-2.5 bg-orange-700/60 hover:bg-orange-700 text-white rounded-xl text-sm font-bold border border-white/30 backdrop-blur-xs transition-all cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>สแกน QR ตรวจสอบ</span>
          </button>
        </div>
      </div>

      {/* Top 3 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Total Assets */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-orange-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              จำนวนทรัพย์สินทั้งหมด
            </p>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 mt-1">
              {formatNumber(totalAssets)}
              <span className="text-sm font-normal text-neutral-500 ml-2">รายการ</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-1 font-medium">
              รวมจำนวนชิ้นทั้งสิ้น {formatNumber(totalQuantity)} หน่วย
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-200">
            <Boxes className="w-7 h-7" />
          </div>
        </div>

        {/* Total Value */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-orange-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              มูลค่าทรัพย์สินรวม
            </p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mt-1 text-orange-600">
              {formatCurrency(totalValue)}
            </h3>
            <p className="text-xs text-neutral-500 mt-1 font-medium">
              ตามราคาจัดซื้อตามงบประมาณ
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
            <Coins className="w-7 h-7" />
          </div>
        </div>

        {/* Campuses & Buildings */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-orange-100 shadow-xs flex items-center justify-between sm:col-span-2 lg:col-span-1">
          <div>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              สถานที่จัดเก็บและกระจาย
            </p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mt-1">
              {Object.keys(campusMap).length}
              <span className="text-sm font-normal text-neutral-500 ml-1.5">วิทยาเขต</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-1 font-medium">
              กระจายตามอาคารเรียนและห้องปฏิบัติการ
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
            <Building className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* 6 Predefined Status Breakdown Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-neutral-800 flex items-center gap-2">
            <Layers className="w-4 h-4 text-orange-600" />
            <span>จำนวนทรัพย์สินตามสถานะ (6 สถานะ)</span>
          </h3>
          <button
            onClick={() => onNavigateTab('reports')}
            className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
          >
            <span>ดูรายงานสถานะ</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {ASSET_STATUSES.map((status) => {
            const count = statusCounts[status] || 0;
            const style = getStatusStyle(status);
            const percentage = totalAssets > 0 ? Math.round((count / totalAssets) * 100) : 0;

            return (
              <div
                key={status}
                onClick={() => onNavigateTab('assets')}
                className="bg-white rounded-xl p-4 border border-neutral-200 hover:border-orange-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-1.5 rounded-lg ${style.lightBg}`}>{getStatusIcon(status)}</div>
                    <span className="text-xs font-bold text-neutral-400">{percentage}%</span>
                  </div>
                  <p className="text-xs font-medium text-neutral-600 line-clamp-2 min-h-[32px]">
                    {status}
                  </p>
                </div>
                <div className="mt-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-extrabold text-neutral-900">{count}</span>
                    <span className="text-[11px] text-neutral-400">รายการ</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-neutral-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${style.bg}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Pie Chart */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-orange-100 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-base font-bold text-neutral-800">
                สัดส่วนทรัพย์สินตาม 6 สถานะ
              </h4>
              <p className="text-xs text-neutral-500">Distribution by Asset Status</p>
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded-md bg-orange-50 text-orange-700">
              สถานะเรียลไทม์
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full flex items-center justify-center">
            {statusPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any, name: any) => [`${val} รายการ`, `${name}`]}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      border: '1px solid #fed7aa',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    formatter={(value) => <span className="text-xs text-neutral-700">{value}</span>}
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-neutral-400">ยังไม่มีข้อมูลทรัพย์สิน</p>
            )}
          </div>
        </div>

        {/* Campus Distribution Bar Chart */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-orange-100 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-base font-bold text-neutral-800">
                จำนวนทรัพย์สินแยกตามวิทยาเขต
              </h4>
              <p className="text-xs text-neutral-500">Assets Count by University Campus</p>
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded-md bg-blue-50 text-blue-700">
              ทุกวิทยาเขต
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            {campusBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={campusBarData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    formatter={(val: any) => [`${val} รายการ`, 'จำนวนทรัพย์สิน']}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
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
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-xs text-neutral-400">ยังไม่มีข้อมูลวิทยาเขต</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Assets Table & Recent Activity History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Assets List (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-orange-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-base font-bold text-neutral-800">
                ทรัพย์สินที่บันทึกล่าสุด
              </h4>
              <p className="text-xs text-neutral-500">รายการทรัพย์สินที่ได้รับการอัปเดตหรือเพิ่มเข้ามา</p>
            </div>
            <button
              onClick={() => onNavigateTab('assets')}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
            >
              <span>ดูทั้งหมด ({assets.length})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500">
                  <th className="py-2.5 px-3 font-semibold">รหัสทรัพย์สิน</th>
                  <th className="py-2.5 px-3 font-semibold">ชื่อทรัพย์สิน</th>
                  <th className="py-2.5 px-3 font-semibold">สถานที่/ห้อง</th>
                  <th className="py-2.5 px-3 font-semibold">ราคา</th>
                  <th className="py-2.5 px-3 font-semibold">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {assets.slice(0, 5).map((asset) => {
                  const style = getStatusStyle(asset.status);
                  return (
                    <tr key={asset.id} className="hover:bg-orange-50/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-orange-700">
                        {asset.assetCode}
                      </td>
                      <td className="py-3 px-3 font-medium text-neutral-900 max-w-[200px] truncate">
                        {asset.name}
                      </td>
                      <td className="py-3 px-3 text-neutral-600">
                        {asset.buildingName ? `${asset.buildingName.split(' ')[0]} / ${asset.room}` : asset.room}
                      </td>
                      <td className="py-3 px-3 font-semibold text-neutral-800">
                        {formatCurrency(asset.price)}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${style.lightBg} ${style.text} ${style.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot} mr-1.5`}></span>
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

        {/* Recent Audit & Inspection History (1 col) */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-orange-100 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-base font-bold text-neutral-800">ประวัติการดำเนินงาน</h4>
              <p className="text-xs text-neutral-500">Audit & Inspection Timeline</p>
            </div>
            <span className="text-xs text-neutral-400">{history.length} รายการ</span>
          </div>

          <div className="space-y-3.5 overflow-y-auto max-h-[320px] pr-1">
            {history.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-neutral-50/80 border border-neutral-200/80 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-800">{item.actionLabel || item.action}</span>
                  <span className="text-[10px] text-neutral-400">
                    {new Date(item.timestamp).toLocaleDateString('th-TH', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
                <p className="text-neutral-600 font-mono text-[11px] font-medium text-orange-600">
                  {item.assetCode} - <span className="text-neutral-700">{item.assetName}</span>
                </p>
                {item.note && <p className="text-neutral-500 text-[11px] italic">"{item.note}"</p>}
                <p className="text-[10px] text-neutral-400 flex items-center gap-1 pt-1">
                  <span>โดย: {item.performedBy}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
