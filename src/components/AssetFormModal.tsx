import React, { useState, useEffect } from 'react';
import { Camera, Image as ImageIcon, Save, X } from 'lucide-react';
import { ASSET_STATUSES, Asset, AssetStatus, SystemSettingsState } from '../types';

interface AssetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (assetData: Partial<Asset>) => void;
  initialAsset?: Asset | null;
  settings: SystemSettingsState;
}

export const AssetFormModal: React.FC<AssetFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialAsset,
  settings,
}) => {
  const [formData, setFormData] = useState<Partial<Asset>>({
    assetCode: '',
    name: '',
    typeId: '',
    typeName: '',
    campusId: '',
    campusName: '',
    facultyId: '',
    facultyName: '',
    departmentId: '',
    departmentName: '',
    buildingId: '',
    buildingName: '',
    room: '',
    quantity: 1,
    purchaseDate: new Date().toISOString().slice(0, 10),
    price: 0,
    imageUrl: '',
    note: '',
    status: 'สถานะว่าง/พร้อมใช้',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialAsset) {
      setFormData(initialAsset);
    } else {
      // Auto-generate asset code prefix based on current Buddhist year (e.g., EQ-68-XXXXX)
      const currentYearShort = (new Date().getFullYear() + 543).toString().slice(-2);
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const defaultCode = `EQ-${currentYearShort}-${randomNum}`;

      const defaultType = settings.assetTypes[0];
      const defaultCampus = settings.campuses[0];
      const defaultFaculty = settings.faculties[0];
      const defaultDept = settings.departments[0];
      const defaultBld = settings.buildings[0];

      setFormData({
        assetCode: defaultCode,
        name: '',
        typeId: defaultType?.id || '',
        typeName: defaultType?.name || '',
        campusId: defaultCampus?.id || '',
        campusName: defaultCampus?.name || '',
        facultyId: defaultFaculty?.id || '',
        facultyName: defaultFaculty?.name || '',
        departmentId: defaultDept?.id || '',
        departmentName: defaultDept?.name || '',
        buildingId: defaultBld?.id || '',
        buildingName: defaultBld?.name || '',
        room: '',
        quantity: 1,
        purchaseDate: new Date().toISOString().slice(0, 10),
        price: 0,
        imageUrl: '',
        note: '',
        status: 'สถานะว่าง/พร้อมใช้',
      });
    }
    setErrors({});
  }, [initialAsset, isOpen, settings]);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setFormData((prev) => ({
          ...prev,
          imageUrl: uploadEvent.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTypeChange = (typeId: string) => {
    const found = settings.assetTypes.find((t) => t.id === typeId);
    setFormData((prev) => ({
      ...prev,
      typeId,
      typeName: found ? found.name : '',
    }));
  };

  const handleCampusChange = (campusId: string) => {
    const found = settings.campuses.find((c) => c.id === campusId);
    setFormData((prev) => ({
      ...prev,
      campusId,
      campusName: found ? found.name : '',
    }));
  };

  const handleFacultyChange = (facultyId: string) => {
    const found = settings.faculties.find((f) => f.id === facultyId);
    setFormData((prev) => ({
      ...prev,
      facultyId,
      facultyName: found ? found.name : '',
    }));
  };

  const handleDepartmentChange = (departmentId: string) => {
    const found = settings.departments.find((d) => d.id === departmentId);
    setFormData((prev) => ({
      ...prev,
      departmentId,
      departmentName: found ? found.name : '',
    }));
  };

  const handleBuildingChange = (buildingId: string) => {
    const found = settings.buildings.find((b) => b.id === buildingId);
    setFormData((prev) => ({
      ...prev,
      buildingId,
      buildingName: found ? found.name : '',
    }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.assetCode?.trim()) errs.assetCode = 'กรุณากรอกรหัสทรัพย์สิน';
    if (!formData.name?.trim()) errs.name = 'กรุณากรอกชื่อทรัพย์สิน';
    if (!formData.room?.trim()) errs.room = 'กรุณากรอกชื่อห้อง/สถานที่ติดตั้ง';
    if (formData.price === undefined || formData.price < 0) errs.price = 'ราคาต้องไม่น้อยกว่า 0';
    if (!formData.quantity || formData.quantity <= 0) errs.quantity = 'จำนวนต้องมากกว่า 0';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl border border-orange-100 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-linear-to-r from-orange-600 to-amber-500 text-white flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">
              {initialAsset ? 'แก้ไขข้อมูลทรัพย์สิน' : 'บันทึกข้อมูลทรัพย์สินใหม่'}
            </h3>
            <p className="text-xs text-orange-100">
              กรอกรายละเอียดข้อมูลพัสดุและครุภัณฑ์มหาวิทยาลัยให้ครบถ้วน
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1 text-sm">
          {/* Section 1: ข้อมูลหลักทรัพย์สิน */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-orange-700 mb-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-600"></span>
              ข้อมูลพื้นฐานทรัพย์สิน
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Asset Code */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  รหัสทรัพย์สิน <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.assetCode || ''}
                  onChange={(e) => setFormData({ ...formData, assetCode: e.target.value })}
                  placeholder="เช่น EQ-68-00101"
                  className={`w-full px-3 py-2 rounded-xl border ${
                    errors.assetCode ? 'border-red-400 bg-red-50' : 'border-neutral-300'
                  } text-sm focus:ring-2 focus:ring-orange-500 focus:outline-hidden font-mono`}
                />
                {errors.assetCode && <p className="text-[11px] text-red-500 mt-1">{errors.assetCode}</p>}
              </div>

              {/* Asset Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  ชื่อทรัพย์สิน / รายการครุภัณฑ์ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="เช่น เครื่องคอมพิวเตอร์ All-in-One Core i7"
                  className={`w-full px-3 py-2 rounded-xl border ${
                    errors.name ? 'border-red-400 bg-red-50' : 'border-neutral-300'
                  } text-sm focus:ring-2 focus:ring-orange-500 focus:outline-hidden`}
                />
                {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>}
              </div>

              {/* Equipment Type */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  ประเภทอุปกรณ์ <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.typeId || ''}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-hidden bg-white"
                >
                  {settings.assetTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status (6 Predefined) */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  สถานะทรัพย์สิน <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.status || 'สถานะว่าง/พร้อมใช้'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as AssetStatus })}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-hidden bg-white font-medium text-orange-700"
                >
                  {ASSET_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  จำนวน (ชิ้น/ชุด) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity ?? 1}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 2: สังกัดและสถานที่ตั้ง */}
          <div className="pt-3 border-t border-neutral-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-orange-700 mb-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-600"></span>
              สังกัดและสถานที่ติดตั้ง
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Campus */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  วิทยาเขต <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.campusId || ''}
                  onChange={(e) => handleCampusChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-hidden bg-white"
                >
                  {settings.campuses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Faculty */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  สังกัด/คณะ <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.facultyId || ''}
                  onChange={(e) => handleFacultyChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-hidden bg-white"
                >
                  {settings.faculties.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  สาขา/หน่วยงาน <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.departmentId || ''}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-hidden bg-white"
                >
                  {settings.departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Building */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  อาคาร <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.buildingId || ''}
                  onChange={(e) => handleBuildingChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-hidden bg-white"
                >
                  {settings.buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Room */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  ชื่อห้อง / จุดที่ติดตั้ง <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.room || ''}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  placeholder="เช่น ห้อง Lab 304 AI Studio หรือ ห้องประชุม 201"
                  className={`w-full px-3 py-2 rounded-xl border ${
                    errors.room ? 'border-red-400 bg-red-50' : 'border-neutral-300'
                  } text-sm focus:ring-2 focus:ring-orange-500 focus:outline-hidden`}
                />
                {errors.room && <p className="text-[11px] text-red-500 mt-1">{errors.room}</p>}
              </div>
            </div>
          </div>

          {/* Section 3: ข้อมูลราคาและการจัดซื้อ */}
          <div className="pt-3 border-t border-neutral-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-orange-700 mb-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-600"></span>
              ข้อมูลราคาและการจัดซื้อ
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Purchase Date */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  วันที่ซื้อ / ตรวจรับ
                </label>
                <input
                  type="date"
                  value={formData.purchaseDate || ''}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-hidden bg-white"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  ราคาต่อหน่วย (บาท)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.price ?? 0}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 4: รูปภาพและหมายเหตุ */}
          <div className="pt-3 border-t border-neutral-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-orange-700 mb-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-600"></span>
              รูปภาพและหมายเหตุเพิ่มเติม
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Image Input (URL or Upload) */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  รูปภาพทรัพย์สิน (URL หรืออัปโหลดไฟล์)
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={formData.imageUrl || ''}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="ใส่ URL รูปภาพ (https://...)"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                  <div className="flex items-center gap-2">
                    <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border border-neutral-300 rounded-xl cursor-pointer text-xs font-semibold">
                      <Camera className="w-4 h-4 text-orange-600" />
                      <span>อัปโหลดรูปภาพจากเครื่อง</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {formData.imageUrl && (
                  <div className="mt-2 relative w-24 h-24 rounded-xl overflow-hidden border border-neutral-200">
                    <img
                      src={formData.imageUrl}
                      alt="พรีวิว"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, imageUrl: '' })}
                      className="absolute top-1 right-1 p-0.5 bg-black/60 text-white rounded-full hover:bg-black"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  หมายเหตุ / รายละเอียดประกัน / ข้อมูลจำเพาะ
                </label>
                <textarea
                  rows={3}
                  value={formData.note || ''}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="เช่น หมายเลข Serial Number, รหัสสัญญาจัดซื้อ, ข้อมูลประกัน"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="pt-4 border-t border-neutral-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 hover:bg-neutral-50 font-semibold text-xs cursor-pointer transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-5 py-2.5 bg-linear-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกข้อมูลทรัพย์สิน</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
