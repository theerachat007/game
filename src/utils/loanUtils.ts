import { BorrowRecord, UserAccount } from '../types';

/**
 * ตรวจสอบว่าผู้ใช้งานปัจจุบันคือผู้ให้ยืม (Lender / Approver) ของรายการนี้หรือไม่
 * เงื่อนไข: การคืน ถ้าไม่ใช่ user เดียวกับผู้ให้ยืม ไม่สามารถให้คืนได้
 */
export function isLoanIssuer(loan: BorrowRecord, currentUser?: UserAccount | null): boolean {
  if (!currentUser) return false;

  // 1. ตรวจสอบจาก ID ของ User
  if (loan.approvedById && currentUser.id) {
    if (loan.approvedById === currentUser.id) {
      return true;
    }
  }

  // 2. ตรวจสอบจาก Username
  if (loan.approvedByUsername && currentUser.username) {
    if (loan.approvedByUsername.trim().toLowerCase() === currentUser.username.trim().toLowerCase()) {
      return true;
    }
  }

  // 3. ตรวจสอบจาก approvedBy string format (เช่น "นายธีรเดช ทวีทรัพย์ (admin)" หรือ "น.ส.วิภาดา พัสดุศาสตร์ (user)")
  if (loan.approvedBy) {
    const rawApproved = loan.approvedBy.trim().toLowerCase();
    const currentFullname = currentUser.fullname.trim().toLowerCase();
    const currentUsername = currentUser.username.trim().toLowerCase();

    // ดึงเฉพาะชื่อหลักไม่รวมวงเล็บ
    const cleanApprovedName = rawApproved.replace(/\s*\([^)]*\)/g, '').trim();
    const cleanCurrentName = currentFullname.replace(/\s*\([^)]*\)/g, '').trim();

    if (rawApproved.includes(`(${currentUsername})`) || rawApproved.includes(currentUsername)) {
      return true;
    }

    if (cleanApprovedName && cleanCurrentName) {
      if (cleanApprovedName === cleanCurrentName || cleanApprovedName.includes(cleanCurrentName) || cleanCurrentName.includes(cleanApprovedName)) {
        return true;
      }
    }

    if (rawApproved === currentFullname || rawApproved.includes(currentFullname) || currentFullname.includes(rawApproved)) {
      return true;
    }
  }

  return false;
}
