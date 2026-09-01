import { AssetStatus } from '../types';

export interface StatusStyle {
  bg: string;
  text: string;
  border: string;
  dot: string;
  lightBg: string;
  description: string;
}

export function getStatusStyle(status: AssetStatus | string): StatusStyle {
  switch (status) {
    case 'สถานะว่าง/พร้อมใช้':
      return {
        bg: 'bg-emerald-500',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
        lightBg: 'bg-emerald-50',
        description: 'ครุภัณฑ์ว่าง พร้อมจัดสรรหรือใช้งาน',
      };
    case 'ใช้งานอยู่':
      return {
        bg: 'bg-blue-500',
        text: 'text-blue-700',
        border: 'border-blue-200',
        dot: 'bg-blue-500',
        lightBg: 'bg-blue-50',
        description: 'มีผู้ถือครองหรือติดตั้งใช้งานประจำห้อง',
      };
    case 'ส่งซ่อมบำรุง':
      return {
        bg: 'bg-amber-500',
        text: 'text-amber-700',
        border: 'border-amber-200',
        dot: 'bg-amber-500',
        lightBg: 'bg-amber-50',
        description: 'อยู่ระหว่างส่งซ่อมบำรุงหรือรออะไหล่',
      };
    case 'จำหน่าย/ตัดยอด':
      return {
        bg: 'bg-rose-500',
        text: 'text-rose-700',
        border: 'border-rose-200',
        dot: 'bg-rose-500',
        lightBg: 'bg-rose-50',
        description: 'ชำรุดเสียหายหรือหมดอายุการใช้งาน ตัดจำหน่ายแล้ว',
      };
    case 'ติดบาร์โค๊ดและบันทึกลงในระบบทรัพย์สิน':
      return {
        bg: 'bg-orange-500',
        text: 'text-orange-700',
        border: 'border-orange-200',
        dot: 'bg-orange-500',
        lightBg: 'bg-orange-50',
        description: 'ติดรหัสบาร์โค้ด/QR Code และบันทึกเข้าระบบแล้ว',
      };
    case 'อยู่ระหว่างการบันทึกละระบบทรัพย์สิน':
    default:
      return {
        bg: 'bg-purple-500',
        text: 'text-purple-700',
        border: 'border-purple-200',
        dot: 'bg-purple-500',
        lightBg: 'bg-purple-50',
        description: 'ตรวจรับใหม่ กำลังรอตรวจสอบและลงทะเบียน',
      };
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('th-TH').format(value);
}
