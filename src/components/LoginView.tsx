import React, { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogIn,
  Shield,
  Sparkles,
  User as UserIcon,
} from 'lucide-react';
import { UserAccount } from '../types';

interface LoginViewProps {
  users: UserAccount[];
  onLoginSuccess: (user: UserAccount) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ users, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    if (!username.trim() || !password.trim()) {
      setErrorMessage('กรุณากรอก Username และ Password ให้ครบถ้วน');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const foundUser = users.find(
        (u) =>
          u.username.toLowerCase() === username.trim().toLowerCase() &&
          u.password === password.trim()
      );

      if (foundUser) {
        onLoginSuccess(foundUser);
      } else {
        setErrorMessage('ชื่อผู้ใช้งาน (Username) หรือรหัสผ่าน (Password) ไม่ถูกต้อง');
      }
      setIsLoading(false);
    }, 400);
  };

  const handleQuickLogin = (role: 'admin' | 'user') => {
    if (role === 'admin') {
      setUsername('admin');
      setPassword('1417');
    } else {
      const userAccount = users.find((u) => u.role === 'user') || users[1];
      setUsername(userAccount ? userAccount.username : 'user');
      setPassword(userAccount ? userAccount.password : 'user123');
    }
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-orange-50 via-amber-50/40 to-neutral-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* University Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-tr from-orange-600 to-amber-500 text-white shadow-lg shadow-orange-500/20 mb-4">
            <Building2 className="w-9 h-9" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
            ระบบบริหารทรัพย์สินมหาวิทยาลัย
          </h1>
          <p className="mt-2 text-sm text-neutral-600 font-medium">
            University Asset Management & Tracking System
          </p>
        </div>

        {/* Login Form Card */}
        <div className="mt-8 bg-white py-8 px-6 sm:px-10 rounded-2xl shadow-xl shadow-orange-950/5 border border-orange-100">
          <div className="mb-6 pb-4 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <KeyRound className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-bold text-neutral-800">เข้าสู่ระบบการทำงาน</h2>
            </div>
            <span className="text-xs bg-orange-100 text-orange-800 font-semibold px-2.5 py-1 rounded-full">
              เข้าใช้งาน
            </span>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-medium flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username */}
            <div>
              <label
                htmlFor="input-username"
                className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1"
              >
                ชื่อผู้ใช้งาน (Username)
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                  <UserIcon className="w-5 h-5" />
                </div>
                <input
                  id="input-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="เช่น admin หรือ user"
                  className="block w-full pl-11 pr-4 py-2.5 bg-neutral-50/50 border border-neutral-300 rounded-xl text-neutral-900 placeholder-neutral-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:bg-white transition-all"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="input-password"
                className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1"
              >
                รหัสผ่าน (Password)
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="input-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านของคุณ"
                  className="block w-full pl-11 pr-11 py-2.5 bg-neutral-50/50 border border-neutral-300 rounded-xl text-neutral-900 placeholder-neutral-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-600"
                  aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                id="btn-submit-login"
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center space-x-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-linear-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all cursor-pointer disabled:opacity-70"
              >
                {isLoading ? (
                  <span>กำลังตรวจสอบ...</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>เข้าสู่ระบบ</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Default Login helper */}
          <div className="mt-6 pt-5 border-t border-neutral-200">
            <p className="text-xs font-semibold text-neutral-600 mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span>เข้าสู่ระบบแบบรวดเร็ว (ตามที่กำหนด):</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-quick-admin"
                onClick={() => handleQuickLogin('admin')}
                className="flex items-center justify-between p-2.5 rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 text-left transition-colors group cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-lg bg-orange-600 text-white flex items-center justify-center">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-800">Admin</p>
                    <p className="text-[10px] text-neutral-500">1417 (ทุกเมนู)</p>
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button
                type="button"
                id="btn-quick-user"
                onClick={() => handleQuickLogin('user')}
                className="flex items-center justify-between p-2.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-left transition-colors group cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-800">User</p>
                    <p className="text-[10px] text-neutral-500">ทรัพย์สิน/สแกน</p>
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </div>
        </div>

        {/* Security & System Note */}
        <p className="mt-6 text-center text-xs text-neutral-500">
          ระบบเชื่อมโยงฐานข้อมูลพัสดุและรองรับการเก็บข้อมูลใน Google Sheets
        </p>
      </div>
    </div>
  );
};
