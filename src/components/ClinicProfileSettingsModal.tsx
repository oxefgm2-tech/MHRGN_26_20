import React, { useState, useEffect } from 'react';
import {
  Building2,
  Phone,
  MapPin,
  Clock,
  UserCheck,
  Stethoscope,
  Image as ImageIcon,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  FileSpreadsheet,
  MessageSquare,
  Bot,
  Send,
  Key,
  RefreshCw,
  CreditCard,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  ClinicProfileConfig,
  ClinicDoctorBio,
  ClinicStaffBio,
  WorkingHoursConfig,
  DEFAULT_WORKING_HOURS_CONFIG,
  summarizeWorkingHours,
  DayKey,
  TimeWindow,
} from '../types';

export interface ClinicProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: ClinicProfileConfig;
  onSaveProfile?: (updatedProfile: ClinicProfileConfig) => void;
  // Aliases for compatibility with App.tsx
  clinicProfile?: ClinicProfileConfig;
  onUpdateProfile?: (updatedProfile: ClinicProfileConfig) => void;
  currentRole?: import('../types').UserRole;
}

const getSafeProfile = (p?: Partial<ClinicProfileConfig> | null): ClinicProfileConfig => ({
  clinicName: p?.clinicName || 'کلینیک اختصاصی حیوانات خانگی مهرگان',
  tagline: p?.tagline || 'مرکز تخصصی جراحی، ارتوپدی، داخلی، پت‌شاپ MDI، دندانپزشکی و گرومینگ مدرن پت',
  phoneNumbers: Array.isArray(p?.phoneNumbers) && p.phoneNumbers.length > 0 ? p.phoneNumbers : ['۰۳۱۳۶۲۹۲۲۷۸', '۰۹۳۰۲۱۸۲۰۰۴۴'],
  emergencyPhone: p?.emergencyPhone || '۰۹۳۰۲۱۸۲۰۰۴۴ (اورژانس شبانه‌روزی ۲۴ ساعته)',
  address: p?.address || 'اصفهان، خیابان توحید میانی، حدفاصل مهرداد و شریعتی، کوچه مشکلانی ۲۲',
  postalCode: p?.postalCode || '۸۱۷۳۸-۹۴۱۱۱',
  coordinates: p?.coordinates || { lat: 32.6331396, lng: 51.6532624 },
  googleMapsUrl: p?.googleMapsUrl || 'https://maps.app.goo.gl/NjzpmkgHTuJJ9E2c9',
  googleMapsEmbedUrl: p?.googleMapsEmbedUrl || 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3359.9881284467824!2d51.65326238758149!3d32.63313960597376!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3fbc36724753f397%3A0x821845b3fb367811!2sMehregan%20vet%20clinic!5e0!3m2!1sen!2s!4v1790071831905!5m2!1sen!2s',
  neshanUrl: p?.neshanUrl || 'https://neshan.org/maps/@32.6331396,51.6532624,17z',
  baladUrl: p?.baladUrl || 'https://balad.ir/location?latitude=32.6331396&longitude=51.6532624',
  wazeUrl: p?.wazeUrl || 'https://waze.com/ul?ll=32.6331396,51.6532624&navigate=yes',
  workingHoursConfig: p?.workingHoursConfig || DEFAULT_WORKING_HOURS_CONFIG,
  workingHours: p?.workingHours || {
    weekdays: 'شنبه تا چهارشنبه: ۰۹:۰۰ الی ۰۲:۰۰ بامداد',
    thursdays: 'پنج‌شنبه‌ها: ۰۹:۰۰ الی ۲۱:۳۰',
    fridays: 'جمعه‌ها: ۱۰:۰۰ الی ۱۴:۰۰ و ۱۷:۰۰ الی ۰۲:۰۰',
  },
  aboutUsText: p?.aboutUsText || 'کلینیک اختصاصی حیوانات خانگی مهرگان با بهره‌گیری از جراحان برجسته و امکانات فوق پیشرفته تشخیصی.',
  logoUrl: p?.logoUrl || '',
  bannerPhotoUrl: p?.bannerPhotoUrl || '',
  doctors: Array.isArray(p?.doctors) ? p.doctors : [],
  staff: Array.isArray(p?.staff) ? p.staff : [],
  lastUpdatedBy: p?.lastUpdatedBy || 'مدیر کلینیک',
  lastUpdatedAt: p?.lastUpdatedAt || 'امروز',
  licenseNumber: p?.licenseNumber || '',
  autoExportParsianPreInvoice: Boolean(p?.autoExportParsianPreInvoice),
});

export const ClinicProfileSettingsModal: React.FC<ClinicProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  clinicProfile,
  onUpdateProfile,
  currentRole,
}) => {
  const canManageSettings = !currentRole || currentRole === 'admin' || currentRole === 'it_developer';
  const activeProfile = profile || clinicProfile;
  const [formData, setFormData] = useState<ClinicProfileConfig>(() => getSafeProfile(activeProfile));
  const [activeSubTab, setActiveSubTab] = useState<'general' | 'doctors' | 'staff' | 'map' | 'sms_bale'>('general');
  const [showSavedToast, setShowSavedToast] = useState(false);

  // SMS (IPPanel Edge) & Bale Bot State
  const [smsStatus, setSmsStatus] = useState<{
    isActive: boolean;
    maskedKey: string;
    senderNumber: string;
    adminMobile: string;
    credit: number;
    currency: string;
    creditStatus: string;
  } | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [senderInput, setSenderInput] = useState('');
  const [adminMobileInput, setAdminMobileInput] = useState('');
  const [isSavingSmsConfig, setIsSavingSmsConfig] = useState(false);
  const [isCheckingCredit, setIsCheckingCredit] = useState(false);
  const [testPhone, setTestPhone] = useState('09133115509');
  const [testMessage, setTestMessage] = useState('تست ارتباط پنل پیامکی کلینیک دامپزشکی مهرگان');
  const [isSendingTestSms, setIsSendingTestSms] = useState(false);
  const [testSmsFeedback, setTestSmsFeedback] = useState<{ success?: boolean; text?: string } | null>(null);

  const currentWorkingConfig = formData.workingHoursConfig || DEFAULT_WORKING_HOURS_CONFIG;

  const updateWorkingConfig = (newConfig: WorkingHoursConfig) => {
    const summary = summarizeWorkingHours(newConfig);
    setFormData((prev) => ({
      ...prev,
      workingHoursConfig: newConfig,
      workingHours: {
        weekdays: summary,
        thursdays: summary,
        fridays: summary,
      },
    }));
  };

  const fetchSmsStatus = async () => {
    setIsCheckingCredit(true);
    try {
      const res = await fetch('/api/sms/status');
      const json = await res.json();
      if (json.success && json.data) {
        setSmsStatus(json.data);
        setSenderInput(json.data.senderNumber || '+983000505');
        setAdminMobileInput(json.data.adminMobile || '+989133115509');
      }
    } catch (e) {
      console.error('Failed to fetch SMS status:', e);
    } finally {
      setIsCheckingCredit(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeSubTab === 'sms_bale') {
      fetchSmsStatus();
    }
  }, [isOpen, activeSubTab]);

  const handleSaveSmsConfig = async () => {
    setIsSavingSmsConfig(true);
    try {
      const res = await fetch('/api/sms/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKeyInput.trim() || undefined,
          senderNumber: senderInput.trim() || undefined,
          adminMobile: adminMobileInput.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setApiKeyInput('');
        fetchSmsStatus();
        alert('تنظیمات پیامک IPPanel با موفقیت ذخیره شد.');
      } else {
        alert(json.error || 'خطا در ذخیره تنظیمات پیامک.');
      }
    } catch (e: any) {
      alert(e?.message || 'خطا در برقراری ارتباط با سرور.');
    } finally {
      setIsSavingSmsConfig(false);
    }
  };

  const handleSendTestSms = async () => {
    if (!testPhone) {
      alert('شماره موبایل تست الزامی است.');
      return;
    }
    setIsSendingTestSms(true);
    setTestSmsFeedback(null);
    try {
      const res = await fetch('/api/sms/send-quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: [testPhone],
          message: testMessage,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setTestSmsFeedback({ success: true, text: 'پیامک تست با موفقیت ارسال شد و در صف مخابرات قرار گرفت.' });
        fetchSmsStatus();
      } else {
        setTestSmsFeedback({ success: false, text: json.error || 'خطا در ارسال پیامک تست.' });
      }
    } catch (e: any) {
      setTestSmsFeedback({ success: false, text: e?.message || 'خطا در برقراری ارتباط.' });
    } finally {
      setIsSendingTestSms(false);
    }
  };

  useEffect(() => {
    if (activeProfile) {
      setFormData(getSafeProfile(activeProfile));
    }
  }, [activeProfile, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const updated = {
      ...formData,
      lastUpdatedAt: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    };
    if (onSaveProfile) onSaveProfile(updated);
    if (onUpdateProfile) onUpdateProfile(updated);
    setShowSavedToast(true);
    setTimeout(() => {
      setShowSavedToast(false);
      onClose();
    }, 1200);
  };

  const handleAddPhone = () => {
    setFormData({
      ...formData,
      phoneNumbers: [...(formData.phoneNumbers || []), '۰۲۱-'],
    });
  };

  const handleRemovePhone = (index: number) => {
    setFormData({
      ...formData,
      phoneNumbers: (formData.phoneNumbers || []).filter((_, i) => i !== index),
    });
  };

  const handleUpdatePhone = (index: number, val: string) => {
    const updated = [...(formData.phoneNumbers || [])];
    updated[index] = val;
    setFormData({ ...formData, phoneNumbers: updated });
  };

  const handleAddDoctor = () => {
    const newDoc: ClinicDoctorBio = {
      id: `doc-${Date.now()}`,
      name: 'پزشک جدید',
      title: 'متخصص دامپزشکی',
      medicalCode: 'نظام: ----',
      specialties: ['داخلی', 'جراحی'],
      photoUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&auto=format&fit=crop&q=80',
      bioText: 'توضیح سوابق تحصیلی و تجارب بالینی...',
      isActive: true,
    };
    setFormData({ ...formData, doctors: [...(formData.doctors || []), newDoc] });
  };

  const handleRemoveDoctor = (id: string) => {
    setFormData({
      ...formData,
      doctors: (formData.doctors || []).filter((d) => d.id !== id),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-[#FAFBF7] w-full max-w-4xl rounded-2xl shadow-2xl border border-[#E6E9DF] overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#2D3A27] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4A6741] flex items-center justify-center text-white shadow-inner">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#F7F8F3]">پیکربندی و اطلاعات رسمی کلینیک مهرگان</h2>
              <p className="text-xs text-[#A3B899]">
                تنظیم نام، آدرس، تلفن‌ها، نقشه جغرافیایی، کادر پزشکی و پرسنل توسط کارشناس آی‌تی
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#D0DDD0] hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subtab Navigation */}
        <div className="flex border-b border-[#E6E9DF] bg-white px-5 gap-2 pt-2">
          <button
            onClick={() => setActiveSubTab('general')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeSubTab === 'general'
                ? 'border-[#4A6741] text-[#2D3A27]'
                : 'border-transparent text-[#738A6E] hover:text-[#2D3A27]'
            }`}
          >
            <Building2 className="w-4 h-4" />
            اطلاعات پایه و ساعات کاری
          </button>
          <button
            onClick={() => setActiveSubTab('map')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeSubTab === 'map'
                ? 'border-[#4A6741] text-[#2D3A27]'
                : 'border-transparent text-[#738A6E] hover:text-[#2D3A27]'
            }`}
          >
            <MapPin className="w-4 h-4" />
            آدرس و موقعیت نقشه
          </button>
          <button
            onClick={() => setActiveSubTab('doctors')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeSubTab === 'doctors'
                ? 'border-[#4A6741] text-[#2D3A27]'
                : 'border-transparent text-[#738A6E] hover:text-[#2D3A27]'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            پزشکان و جراحان ({(formData.doctors || []).length})
          </button>
          <button
            onClick={() => setActiveSubTab('staff')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeSubTab === 'staff'
                ? 'border-[#4A6741] text-[#2D3A27]'
                : 'border-transparent text-[#738A6E] hover:text-[#2D3A27]'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            پرسنل و گرومرها ({(formData.staff || []).length})
          </button>
          <button
            onClick={() => setActiveSubTab('sms_bale')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeSubTab === 'sms_bale'
                ? 'border-[#4A6741] text-[#2D3A27]'
                : 'border-transparent text-[#738A6E] hover:text-[#2D3A27]'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-700" />
            سامانه پیامک (IPPanel) و بازوی بله
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* GENERAL SUBTAB */}
          {activeSubTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#4B5E43] mb-1.5">نام رسمی کلینیک</label>
                  <input
                    type="text"
                    value={formData.clinicName}
                    onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                    className="w-full bg-white border border-[#D5DDD0] rounded-xl px-3 py-2 text-sm text-[#2D3A27] font-bold focus:border-[#4A6741] focus:ring-1 focus:ring-[#4A6741] outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#4B5E43] mb-1.5">شعار و عنوان تخصصی</label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    className="w-full bg-white border border-[#D5DDD0] rounded-xl px-3 py-2 text-sm text-[#2D3A27] focus:border-[#4A6741] outline-hidden"
                  />
                </div>
              </div>

              {/* Phone Numbers */}
              <div className="bg-white p-4 rounded-xl border border-[#E6E9DF] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#4B5E43] flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-[#4A6741]" />
                    خطوط تلفن ثابت و همراه پذیرش
                  </label>
                  <button
                    type="button"
                    onClick={handleAddPhone}
                    className="text-xs text-[#4A6741] hover:text-[#384E31] font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> افزودن شماره
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {formData.phoneNumbers.map((phone, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => handleUpdatePhone(idx, e.target.value)}
                        className="flex-1 bg-[#F7F8F3] border border-[#D5DDD0] rounded-lg px-2.5 py-1.5 text-xs text-[#2D3A27] font-mono outline-hidden"
                      />
                      {formData.phoneNumbers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePhone(idx)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-bold text-red-700 mb-1 mt-2">
                    تلفن اضطراری و اورژانس ۲۴ ساعته
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                    className="w-full bg-red-50/50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-900 font-bold outline-hidden"
                  />
                </div>
              </div>

              {/* Working Hours Visual Manager */}
              <div className="bg-white p-5 rounded-2xl border-2 border-[#D5DDD0] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E6E9DF]">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#4A6741]" />
                    <div>
                      <h4 className="text-sm font-black text-[#2D3A27]">تنظیمات و زمان‌بندی ساعات کاری کلینیک</h4>
                      <p className="text-[11px] text-[#738A6E]">مدیریت شیفت‌های کادر درمان، پذیرش و پت‌شاپ با امکان تعریف بازه‌های شبانه‌روزی</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer bg-[#F7F8F3] px-3 py-1.5 rounded-xl border border-[#D5DDD0] hover:bg-slate-100">
                      <input
                        type="checkbox"
                        checked={currentWorkingConfig.enabled}
                        onChange={(e) =>
                          updateWorkingConfig({
                            ...currentWorkingConfig,
                            enabled: e.target.checked,
                          })
                        }
                        className="rounded text-[#4A6741] focus:ring-[#4A6741] w-4 h-4"
                      />
                      <span className="text-xs font-bold text-[#2D3A27]">
                        {currentWorkingConfig.enabled ? '🟢 ساعات کاری فعال' : '🔴 کلینیک تعطیل'}
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => updateWorkingConfig(DEFAULT_WORKING_HOURS_CONFIG)}
                      className="px-2.5 py-1.5 text-xs text-[#4A6741] hover:text-[#384E31] bg-[#EBF0E7] hover:bg-[#D5DDD0] rounded-xl font-bold transition-all flex items-center gap-1"
                      title="بازگرداندن به پیش‌فرض واقعی کلینیک مهرگان"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      پیش‌فرض واقعی
                    </button>
                  </div>
                </div>

                {/* Two Section Cards: Medical & Petshop */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Card 1: Medical Section */}
                  <div className="bg-[#FAFBF8] p-4 rounded-xl border border-[#D5DDD0] space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#E6E9DF]">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="w-4 h-4 text-[#4A6741]" />
                        <span className="text-xs font-black text-[#2D3A27]">بخش کادر درمانی، جراحی و ویزیت</span>
                      </div>
                      <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentWorkingConfig.sections.medical.enabled}
                          onChange={(e) =>
                            updateWorkingConfig({
                              ...currentWorkingConfig,
                              sections: {
                                ...currentWorkingConfig.sections,
                                medical: {
                                  ...currentWorkingConfig.sections.medical,
                                  enabled: e.target.checked,
                                },
                              },
                            })
                          }
                          className="rounded text-[#4A6741]"
                        />
                        <span className="text-[11px] font-bold text-[#4B5E43]">
                          {currentWorkingConfig.sections.medical.enabled ? 'فعال' : 'غیرفعال'}
                        </span>
                      </label>
                    </div>

                    <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                      {(['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as DayKey[]).map((dayKey) => {
                        const daySchedule = currentWorkingConfig.sections.medical.days[dayKey];
                        const dayName = {
                          saturday: 'شنبه',
                          sunday: 'یک‌شنبه',
                          monday: 'دوشنبه',
                          tuesday: 'سه‌شنبه',
                          wednesday: 'چهارشنبه',
                          thursday: 'پنج‌شنبه',
                          friday: 'جمعه',
                        }[dayKey];

                        return (
                          <div key={dayKey} className="bg-white p-2.5 rounded-lg border border-[#E6E9DF] space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={daySchedule.enabled}
                                  onChange={(e) => {
                                    const nextDays = { ...currentWorkingConfig.sections.medical.days };
                                    nextDays[dayKey] = { ...daySchedule, enabled: e.target.checked };
                                    updateWorkingConfig({
                                      ...currentWorkingConfig,
                                      sections: {
                                        ...currentWorkingConfig.sections,
                                        medical: {
                                          ...currentWorkingConfig.sections.medical,
                                          days: nextDays,
                                        },
                                      },
                                    });
                                  }}
                                  className="rounded text-[#4A6741]"
                                />
                                <span className="text-xs font-bold text-[#2D3A27]">{dayName}</span>
                              </label>

                              <button
                                type="button"
                                onClick={() => {
                                  const nextDays = { ...currentWorkingConfig.sections.medical.days };
                                  nextDays[dayKey] = {
                                    ...daySchedule,
                                    windows: [...daySchedule.windows, { open: '17:00', close: '22:00' }],
                                  };
                                  updateWorkingConfig({
                                    ...currentWorkingConfig,
                                    sections: {
                                      ...currentWorkingConfig.sections,
                                      medical: {
                                        ...currentWorkingConfig.sections.medical,
                                        days: nextDays,
                                      },
                                    },
                                  });
                                }}
                                className="text-[10px] text-[#4A6741] hover:text-[#384E31] bg-[#F7F8F3] hover:bg-[#EBF0E7] px-2 py-0.5 rounded font-bold flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                افزودن بازه
                              </button>
                            </div>

                            {daySchedule.windows.map((win, idx) => (
                              <div key={idx} className="flex items-center gap-2 pt-1">
                                <input
                                  type="time"
                                  value={win.open}
                                  onChange={(e) => {
                                    const nextDays = { ...currentWorkingConfig.sections.medical.days };
                                    const nextWindows = [...daySchedule.windows];
                                    nextWindows[idx] = { ...win, open: e.target.value };
                                    nextDays[dayKey] = { ...daySchedule, windows: nextWindows };
                                    updateWorkingConfig({
                                      ...currentWorkingConfig,
                                      sections: {
                                        ...currentWorkingConfig.sections,
                                        medical: { ...currentWorkingConfig.sections.medical, days: nextDays },
                                      },
                                    });
                                  }}
                                  className="bg-[#F7F8F3] border border-[#D5DDD0] rounded px-2 py-1 text-xs text-[#2D3A27]"
                                />
                                <span className="text-xs text-[#738A6E]">الی</span>
                                <input
                                  type="time"
                                  value={win.close}
                                  onChange={(e) => {
                                    const nextDays = { ...currentWorkingConfig.sections.medical.days };
                                    const nextWindows = [...daySchedule.windows];
                                    nextWindows[idx] = { ...win, close: e.target.value };
                                    nextDays[dayKey] = { ...daySchedule, windows: nextWindows };
                                    updateWorkingConfig({
                                      ...currentWorkingConfig,
                                      sections: {
                                        ...currentWorkingConfig.sections,
                                        medical: { ...currentWorkingConfig.sections.medical, days: nextDays },
                                      },
                                    });
                                  }}
                                  className="bg-[#F7F8F3] border border-[#D5DDD0] rounded px-2 py-1 text-xs text-[#2D3A27]"
                                />
                                {daySchedule.windows.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextDays = { ...currentWorkingConfig.sections.medical.days };
                                      const nextWindows = daySchedule.windows.filter((_, i) => i !== idx);
                                      nextDays[dayKey] = { ...daySchedule, windows: nextWindows };
                                      updateWorkingConfig({
                                        ...currentWorkingConfig,
                                        sections: {
                                          ...currentWorkingConfig.sections,
                                          medical: { ...currentWorkingConfig.sections.medical, days: nextDays },
                                        },
                                      });
                                    }}
                                    className="text-red-500 hover:text-red-700 p-1"
                                    title="حذف بازه"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                            <p className="text-[10px] text-[#738A6E] pt-0.5">
                              اگر ساعت پایان کوچک‌تر از شروع باشد، یعنی شبانه تا بامداد روز بعد
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Card 2: Petshop Section */}
                  <div className="bg-[#FAFBF8] p-4 rounded-xl border border-[#D5DDD0] space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#E6E9DF]">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#4A6741]" />
                        <span className="text-xs font-black text-[#2D3A27]">بخش پت‌شاپ و ملزومات</span>
                      </div>
                      <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentWorkingConfig.sections.petshop.enabled}
                          onChange={(e) =>
                            updateWorkingConfig({
                              ...currentWorkingConfig,
                              sections: {
                                ...currentWorkingConfig.sections,
                                petshop: {
                                  ...currentWorkingConfig.sections.petshop,
                                  enabled: e.target.checked,
                                },
                              },
                            })
                          }
                          className="rounded text-[#4A6741]"
                        />
                        <span className="text-[11px] font-bold text-[#4B5E43]">
                          {currentWorkingConfig.sections.petshop.enabled ? 'فعال' : 'غیرفعال'}
                        </span>
                      </label>
                    </div>

                    <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                      {(['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as DayKey[]).map((dayKey) => {
                        const daySchedule = currentWorkingConfig.sections.petshop.days[dayKey];
                        const dayName = {
                          saturday: 'شنبه',
                          sunday: 'یک‌شنبه',
                          monday: 'دوشنبه',
                          tuesday: 'سه‌شنبه',
                          wednesday: 'چهارشنبه',
                          thursday: 'پنج‌شنبه',
                          friday: 'جمعه',
                        }[dayKey];

                        return (
                          <div key={dayKey} className="bg-white p-2.5 rounded-lg border border-[#E6E9DF] space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={daySchedule.enabled}
                                  onChange={(e) => {
                                    const nextDays = { ...currentWorkingConfig.sections.petshop.days };
                                    nextDays[dayKey] = { ...daySchedule, enabled: e.target.checked };
                                    updateWorkingConfig({
                                      ...currentWorkingConfig,
                                      sections: {
                                        ...currentWorkingConfig.sections,
                                        petshop: {
                                          ...currentWorkingConfig.sections.petshop,
                                          days: nextDays,
                                        },
                                      },
                                    });
                                  }}
                                  className="rounded text-[#4A6741]"
                                />
                                <span className="text-xs font-bold text-[#2D3A27]">{dayName}</span>
                              </label>

                              <button
                                type="button"
                                onClick={() => {
                                  const nextDays = { ...currentWorkingConfig.sections.petshop.days };
                                  nextDays[dayKey] = {
                                    ...daySchedule,
                                    windows: [...daySchedule.windows, { open: '17:00', close: '21:30' }],
                                  };
                                  updateWorkingConfig({
                                    ...currentWorkingConfig,
                                    sections: {
                                      ...currentWorkingConfig.sections,
                                      petshop: {
                                        ...currentWorkingConfig.sections.petshop,
                                        days: nextDays,
                                      },
                                    },
                                  });
                                }}
                                className="text-[10px] text-[#4A6741] hover:text-[#384E31] bg-[#F7F8F3] hover:bg-[#EBF0E7] px-2 py-0.5 rounded font-bold flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                افزودن بازه
                              </button>
                            </div>

                            {daySchedule.windows.map((win, idx) => (
                              <div key={idx} className="flex items-center gap-2 pt-1">
                                <input
                                  type="time"
                                  value={win.open}
                                  onChange={(e) => {
                                    const nextDays = { ...currentWorkingConfig.sections.petshop.days };
                                    const nextWindows = [...daySchedule.windows];
                                    nextWindows[idx] = { ...win, open: e.target.value };
                                    nextDays[dayKey] = { ...daySchedule, windows: nextWindows };
                                    updateWorkingConfig({
                                      ...currentWorkingConfig,
                                      sections: {
                                        ...currentWorkingConfig.sections,
                                        petshop: { ...currentWorkingConfig.sections.petshop, days: nextDays },
                                      },
                                    });
                                  }}
                                  className="bg-[#F7F8F3] border border-[#D5DDD0] rounded px-2 py-1 text-xs text-[#2D3A27]"
                                />
                                <span className="text-xs text-[#738A6E]">الی</span>
                                <input
                                  type="time"
                                  value={win.close}
                                  onChange={(e) => {
                                    const nextDays = { ...currentWorkingConfig.sections.petshop.days };
                                    const nextWindows = [...daySchedule.windows];
                                    nextWindows[idx] = { ...win, close: e.target.value };
                                    nextDays[dayKey] = { ...daySchedule, windows: nextWindows };
                                    updateWorkingConfig({
                                      ...currentWorkingConfig,
                                      sections: {
                                        ...currentWorkingConfig.sections,
                                        petshop: { ...currentWorkingConfig.sections.petshop, days: nextDays },
                                      },
                                    });
                                  }}
                                  className="bg-[#F7F8F3] border border-[#D5DDD0] rounded px-2 py-1 text-xs text-[#2D3A27]"
                                />
                                {daySchedule.windows.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextDays = { ...currentWorkingConfig.sections.petshop.days };
                                      const nextWindows = daySchedule.windows.filter((_, i) => i !== idx);
                                      nextDays[dayKey] = { ...daySchedule, windows: nextWindows };
                                      updateWorkingConfig({
                                        ...currentWorkingConfig,
                                        sections: {
                                          ...currentWorkingConfig.sections,
                                          petshop: { ...currentWorkingConfig.sections.petshop, days: nextDays },
                                        },
                                      });
                                    }}
                                    className="text-red-500 hover:text-red-700 p-1"
                                    title="حذف بازه"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                            <p className="text-[10px] text-[#738A6E] pt-0.5">
                              اگر ساعت پایان کوچک‌تر از شروع باشد، یعنی شبانه تا بامداد روز بعد
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="bg-[#F8FAF6] p-3 rounded-xl border border-[#D5DDD0] flex items-center justify-between text-xs">
                  <span className="text-[#4B5E43] font-bold">خلاصه خروجی هماهنگ‌شده با وب‌سایت و ربات بله:</span>
                  <span className="text-[#2D3A27] font-medium text-left dir-rtl">
                    {summarizeWorkingHours(currentWorkingConfig)}
                  </span>
                </div>
              </div>

              {/* Parsian Accounting Integration Option */}
              <div className="bg-[#F8FAF6] p-4 rounded-2xl border-2 border-[#D5DDD0] hover:border-[#4A6741] transition-all space-y-3">
                <div className="flex items-start gap-3">
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      id="autoExportParsianPreInvoice"
                      checked={Boolean(formData.autoExportParsianPreInvoice)}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          autoExportParsianPreInvoice: e.target.checked,
                        })
                      }
                      className="w-5 h-5 rounded-md text-[#4A6741] focus:ring-[#4A6741] border-gray-300 cursor-pointer accent-[#4A6741]"
                    />
                  </div>
                  <div className="flex-1">
                    <label
                      htmlFor="autoExportParsianPreInvoice"
                      className="text-sm font-black text-[#2D3A27] cursor-pointer block hover:text-[#4A6741] transition-colors"
                    >
                      ثبت پیش فاکتور برای پارسیان به صورت اتوماتیک
                    </label>
                    <p className="text-xs text-[#5C7457] mt-1 leading-relaxed">
                      با فعال بودن این گزینه، در لحظه تسویه هر فاکتور در بخش صندوق کلینیک، کلیه اقلام، مبالغ، تخفیفات، اطلاعات سرپرست حیوان و مشخصات بیمار بلافاصله به صورت یک ردیف در دیتابیس و فایل استاندارد ساختاریافته (JSON و تب‌بندی شده UTF-8 با BOM) خروجی گرفته می‌شود تا نرم‌افزار واسط محلی بتواند آن را به صورت خودکار وارد نرم‌افزار حسابداری کلینیک (پارسیان) نماید.
                    </p>

                    {formData.autoExportParsianPreInvoice && (
                      <div className="mt-3 p-3 bg-white rounded-xl border border-[#D5DDD0] text-[11px] text-[#4B5E43] space-y-1.5">
                        <div className="font-bold text-[#2D3A27] flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          پشتیبانی خودکار از حالت‌های سه‌گانه استقرار:
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-[#5C7457] pr-1">
                          <li><strong className="text-[#2D3A27]">حالت لوکال (LAN Windows):</strong> ذخیره آنی در مسیر <code className="bg-gray-100 px-1 py-0.5 rounded font-mono text-gray-800" dir="ltr">data/parsian_exports/</code> بدون نیاز به اینترنت.</li>
                          <li><strong className="text-[#2D3A27]">حالت وی‌پی‌اس (VPS Ubuntu):</strong> نگهداری در دیتابیس کلینیک و در دسترس از طریق API امن <code className="bg-gray-100 px-1 py-0.5 rounded font-mono text-gray-800" dir="ltr">/api/integrations/parsian/invoices</code>.</li>
                          <li><strong className="text-[#2D3A27]">حالت ابری گوگل:</strong> تبادل همگام و همزمان داده‌های فاکتور با زیرساخت حسابداری مهرگان.</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* About text */}
              <div>
                <label className="block text-xs font-bold text-[#4B5E43] mb-1.5">معرفی و بیوگرافی کلینیک</label>
                <textarea
                  rows={3}
                  value={formData.aboutUsText}
                  onChange={(e) => setFormData({ ...formData, aboutUsText: e.target.value })}
                  className="w-full bg-white border border-[#D5DDD0] rounded-xl p-3 text-xs text-[#2D3A27] leading-relaxed outline-hidden"
                />
              </div>
            </div>
          )}

          {/* MAP & ADDRESS SUBTAB */}
          {activeSubTab === 'map' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#4B5E43] mb-1.5">نشانی پستی دقیق کلینیک</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-white border border-[#D5DDD0] rounded-xl px-3 py-2 text-xs text-[#2D3A27] font-medium outline-hidden"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#4B5E43] mb-1">کد پستی ده رقمی</label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full bg-white border border-[#D5DDD0] rounded-xl px-3 py-2 text-xs font-mono text-[#2D3A27] outline-hidden"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-[#738A6E] mb-1">عرض جغرافیایی (Lat)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={formData.coordinates.lat}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          coordinates: { ...formData.coordinates, lat: parseFloat(e.target.value) || 0 },
                        })
                      }
                      className="w-full bg-white border border-[#D5DDD0] rounded-xl px-2 py-2 text-xs font-mono text-[#2D3A27] outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#738A6E] mb-1">طول جغرافیایی (Lng)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={formData.coordinates.lng}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          coordinates: { ...formData.coordinates, lng: parseFloat(e.target.value) || 0 },
                        })
                      }
                      className="w-full bg-white border border-[#D5DDD0] rounded-xl px-2 py-2 text-xs font-mono text-[#2D3A27] outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Map Preview Box & Navigation Links */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#2D3A27] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    نمای زنده نقشه رسمی کلینیک مهرگان (گوگل مپ تاییدشده)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`${formData.coordinates.lat.toFixed(7)}, ${formData.coordinates.lng.toFixed(7)}`);
                        alert('مختصات دقیق (Lat, Lng) در حافظه کپی شد.');
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-[#EAEFE6] text-[#2D3A27] hover:bg-[#D5DDD0] font-mono font-bold transition-all"
                      title="کپی مختصات جهت اسنپ، تپسی و مسیریاب‌ها"
                    >
                      {formData.coordinates.lat.toFixed(5)}, {formData.coordinates.lng.toFixed(5)} 📋
                    </button>
                  </div>
                </div>

                {/* Google Maps Embed */}
                <div className="w-full h-64 bg-[#E9EFE6] rounded-2xl border border-[#D5DDD0] overflow-hidden shadow-xs relative">
                  <iframe
                    src={formData.googleMapsEmbedUrl || 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3359.9881284467824!2d51.65326238758149!3d32.63313960597376!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3fbc36724753f397%3A0x821845b3fb367811!2sMehregan%20vet%20clinic!5e0!3m2!1sen!2s!4v1790071831905!5m2!1sen!2s'}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    title="نقشه رسمی کلینیک دامپزشکی مهرگان"
                    className="w-full h-full"
                  />
                </div>

                {/* Navigation Links Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <a
                    href={formData.googleMapsUrl || 'https://maps.app.goo.gl/NjzpmkgHTuJJ9E2c9'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-white border border-[#D5DDD0] hover:border-emerald-500 hover:bg-emerald-50/40 text-center transition-all group"
                  >
                    <div className="text-xs font-bold text-[#2D3A27] group-hover:text-emerald-800">Google Maps</div>
                    <div className="text-[10px] text-[#738A6E]">مشاهده و ثبت نظر</div>
                  </a>
                  <a
                    href={formData.neshanUrl || `https://neshan.org/maps/@${formData.coordinates.lat},${formData.coordinates.lng},17z`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-white border border-[#D5DDD0] hover:border-blue-500 hover:bg-blue-50/40 text-center transition-all group"
                  >
                    <div className="text-xs font-bold text-[#2D3A27] group-hover:text-blue-800">مسیریاب نشان</div>
                    <div className="text-[10px] text-[#738A6E]">ناوبری سخنگو</div>
                  </a>
                  <a
                    href={formData.baladUrl || `https://balad.ir/location?latitude=${formData.coordinates.lat}&longitude=${formData.coordinates.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-white border border-[#D5DDD0] hover:border-emerald-500 hover:bg-emerald-50/40 text-center transition-all group"
                  >
                    <div className="text-xs font-bold text-[#2D3A27] group-hover:text-emerald-800">مسیریاب بلد</div>
                    <div className="text-[10px] text-[#738A6E]">ترافیک زنده</div>
                  </a>
                  <a
                    href={formData.wazeUrl || `https://waze.com/ul?ll=${formData.coordinates.lat},${formData.coordinates.lng}&navigate=yes`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-white border border-[#D5DDD0] hover:border-cyan-500 hover:bg-cyan-50/40 text-center transition-all group"
                  >
                    <div className="text-xs font-bold text-[#2D3A27] group-hover:text-cyan-800">مسیریاب ویز (Waze)</div>
                    <div className="text-[10px] text-[#738A6E]">مسیر هوشمند</div>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* DOCTORS SUBTAB */}
          {activeSubTab === 'doctors' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#5C7457]">
                  مشخصات کادر پزشکی و جراحان کلینیک جهت نمایش به مراجعین و درج در سربرگ نسخه‌ها
                </p>
                <button
                  type="button"
                  onClick={handleAddDoctor}
                  className="bg-[#4A6741] text-white hover:bg-[#384E31] text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> افزودن پزشک
                </button>
              </div>

              <div className="space-y-3">
                {(formData.doctors || []).map((doc, idx) => (
                  <div
                    key={doc.id}
                    className="bg-white p-4 rounded-xl border border-[#E6E9DF] flex flex-col md:flex-row gap-4 items-start"
                  >
                    <img
                      src={doc.photoUrl}
                      alt={doc.name}
                      className="w-16 h-16 rounded-xl object-cover border border-[#D5DDD0] shadow-xs shrink-0"
                    />
                    <div className="flex-1 space-y-2 w-full">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={doc.name}
                          onChange={(e) => {
                            const updated = [...(formData.doctors || [])];
                            updated[idx].name = e.target.value;
                            setFormData({ ...formData, doctors: updated });
                          }}
                          placeholder="نام پزشک"
                          className="bg-[#F7F8F3] border border-[#D5DDD0] rounded-lg px-2.5 py-1 text-xs font-bold text-[#2D3A27]"
                        />
                        <input
                          type="text"
                          value={doc.medicalCode}
                          onChange={(e) => {
                            const updated = [...(formData.doctors || [])];
                            updated[idx].medicalCode = e.target.value;
                            setFormData({ ...formData, doctors: updated });
                          }}
                          placeholder="کد نظام دامپزشکی"
                          className="bg-[#F7F8F3] border border-[#D5DDD0] rounded-lg px-2.5 py-1 text-xs text-[#2D3A27]"
                        />
                      </div>
                      <input
                        type="text"
                        value={doc.title}
                        onChange={(e) => {
                          const updated = [...(formData.doctors || [])];
                          updated[idx].title = e.target.value;
                          setFormData({ ...formData, doctors: updated });
                        }}
                        placeholder="عنوان تخصص"
                        className="w-full bg-[#F7F8F3] border border-[#D5DDD0] rounded-lg px-2.5 py-1 text-xs text-[#4A6741] font-medium"
                      />
                      <textarea
                        rows={2}
                        value={doc.bioText}
                        onChange={(e) => {
                          const updated = [...(formData.doctors || [])];
                          updated[idx].bioText = e.target.value;
                          setFormData({ ...formData, doctors: updated });
                        }}
                        placeholder="بیوگرافی و سوابق جراحی..."
                        className="w-full bg-[#F7F8F3] border border-[#D5DDD0] rounded-lg p-2 text-[11px] text-[#5C7457]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDoctor(doc.id)}
                      className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STAFF SUBTAB */}
          {activeSubTab === 'staff' && (
            <div className="space-y-4">
              <p className="text-xs text-[#5C7457]">پرسنل ارشد، گرومرها، تکنسین‌ها و کادر خدمات کلینیک مهرگان</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(formData.staff || []).map((st) => (
                  <div key={st.id} className="bg-white p-3.5 rounded-xl border border-[#E6E9DF] space-y-2">
                    <div className="flex items-center gap-3">
                      <img
                        src={st.photoUrl}
                        alt={st.name}
                        className="w-12 h-12 rounded-lg object-cover border border-[#D5DDD0]"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-[#2D3A27]">{st.name}</h4>
                        <span className="text-[10px] text-[#4A6741] font-semibold">{st.roleTitle}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#5C7457] line-clamp-2">{st.shortBio}</p>
                    <div className="text-[10px] bg-[#F7F8F3] text-[#738A6E] px-2 py-1 rounded-md">
                      شیفت: {st.workingDays}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SMS & BALE BOT SUBTAB */}
          {activeSubTab === 'sms_bale' && (
            <div className="space-y-6">
              {/* Top Banner: IPPanel SMS Status & Balance */}
              <div className="p-4 bg-gradient-to-r from-[#F0F5ED] to-white border border-[#D5DDD0] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold text-[#2D3A27]">سامانه پیامکی IPPanel Edge (MPAYAM)</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        الگوهای پترن خدماتی فعال
                      </span>
                    </div>
                    <p className="text-xs text-[#5C7457] mt-0.5">
                      ارسال بدون بلک‌لیست مخابرات برای تایید نوبت، بیعانه، اعزام تاکسی پت و ترخیص
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-[#E6E9DF] shadow-xs">
                  <div>
                    <div className="text-[10px] text-[#738A6E] font-medium">موجودی کیف پول پیامک:</div>
                    <div className="text-sm font-extrabold text-emerald-800">
                      {smsStatus ? `${Number(smsStatus.credit).toLocaleString('fa-IR')} ${smsStatus.currency}` : 'در حال استعلام...'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={fetchSmsStatus}
                    disabled={isCheckingCredit}
                    className="p-2 text-[#5C7457] hover:text-[#2D3A27] hover:bg-[#F7F8F3] rounded-lg transition-all cursor-pointer"
                    title="بروزرسانی استعلام موجودی"
                  >
                    <RefreshCw className={`w-4 h-4 ${isCheckingCredit ? 'animate-spin text-emerald-600' : ''}`} />
                  </button>
                </div>
              </div>

              {/* SMS Config Form */}
              <div className="bg-white p-4 rounded-2xl border border-[#E6E9DF] space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-[#2D3A27]">
                  <Key className="w-4 h-4 text-[#4A6741]" />
                  <span>پیکربندی متغیرهای اختصاصی درگاه (IPPanel API Credentials)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-[#4B5E43] font-bold mb-1">
                      کلید API (MPAYAM_DEADMAN_KEY_VALUE)
                    </label>
                    <input
                      type="password"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder={smsStatus?.maskedKey ? `کلید ثبت شده: ${smsStatus.maskedKey}` : 'کلید وب‌سرویس ۳۲ رقمی IPPanel...'}
                      className="w-full bg-[#F7F8F3] border border-[#D5DDD0] rounded-xl px-3 py-2 text-xs text-[#2D3A27] outline-hidden focus:border-[#4A6741]"
                    />
                    <span className="text-[10px] text-[#738A6E] mt-1 block">جهت تغییر کلید جدید وارد کنید</span>
                  </div>

                  <div>
                    <label className="block text-[#4B5E43] font-bold mb-1">
                      شماره خط فرستنده (Sender Line)
                    </label>
                    <input
                      type="text"
                      value={senderInput}
                      onChange={(e) => setSenderInput(e.target.value)}
                      placeholder="+983000505"
                      className="w-full bg-[#F7F8F3] border border-[#D5DDD0] rounded-xl px-3 py-2 text-xs text-[#2D3A27] font-mono text-left outline-hidden focus:border-[#4A6741]"
                    />
                    <span className="text-[10px] text-[#738A6E] mt-1 block">خط خدماتی یا ۳۰۰۰ اختصاصی کلینیک</span>
                  </div>

                  <div>
                    <label className="block text-[#4B5E43] font-bold mb-1">
                      موبایل مدیر کلینیک (MPAYAM_MOBILE)
                    </label>
                    <input
                      type="text"
                      value={adminMobileInput}
                      onChange={(e) => setAdminMobileInput(e.target.value)}
                      placeholder="+989133115509"
                      className="w-full bg-[#F7F8F3] border border-[#D5DDD0] rounded-xl px-3 py-2 text-xs text-[#2D3A27] font-mono text-left outline-hidden focus:border-[#4A6741]"
                    />
                    <span className="text-[10px] text-[#738A6E] mt-1 block">دریافت هشدارهای اورژانس و نوبت‌ها</span>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleSaveSmsConfig}
                    disabled={isSavingSmsConfig}
                    className="px-4 py-2 rounded-xl bg-[#4A6741] hover:bg-[#384E31] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    {isSavingSmsConfig ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>ذخیره تنظیمات درگاه پیامک</span>
                  </button>
                </div>
              </div>

              {/* SMS Quick Test Block */}
              <div className="bg-[#F7F8F3] p-4 rounded-2xl border border-[#E6E9DF] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#2D3A27]">
                    <Send className="w-4 h-4 text-emerald-700" />
                    <span>تست زنده ارسال پیامک به خطوط موبایل</span>
                  </div>
                  {testSmsFeedback && (
                    <span className={`text-xs font-bold ${testSmsFeedback.success ? 'text-emerald-700' : 'text-red-600'}`}>
                      {testSmsFeedback.text}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <input
                      type="text"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      placeholder="09133115509"
                      className="w-full bg-white border border-[#D5DDD0] rounded-xl px-3 py-2 text-xs text-[#2D3A27] font-mono text-left outline-hidden focus:border-[#4A6741]"
                    />
                  </div>
                  <div className="sm:col-span-2 flex gap-2">
                    <input
                      type="text"
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      placeholder="متن پیامک تست..."
                      className="w-full bg-white border border-[#D5DDD0] rounded-xl px-3 py-2 text-xs text-[#2D3A27] outline-hidden focus:border-[#4A6741]"
                    />
                    <button
                      type="button"
                      onClick={handleSendTestSms}
                      disabled={isSendingTestSms}
                      className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      {isSendingTestSms ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>ارسال تست</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bale Bot Integration Block */}
              <div className="p-4 bg-white rounded-2xl border border-[#E6E9DF] space-y-4">
                <div className="flex items-center justify-between border-b border-[#E6E9DF] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-[#2D3A27]">بازوی هوشمند بله کلینیک مهرگان (Bale Bot)</h4>
                      <p className="text-[11px] text-[#5C7457]">
                        متصل به موتور Balethon و هوش مصنوعی دیپ‌سیک (DeepSeek AI)
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    همگام‌سازی زنده با دیتابیس
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-[#F7F8F3] rounded-xl border border-[#E6E9DF] space-y-1">
                    <div className="font-bold text-[#2D3A27]">اندپوینت‌های وب‌سرویس زنده بازو:</div>
                    <div className="space-y-1 text-[11px] text-[#5C7457] font-mono">
                      <div>GET /api/bale/config/clinic-info</div>
                      <div>GET /api/bale/config/working-hours</div>
                      <div>GET /api/bale/config/services</div>
                      <div>GET /api/bale/config/menu</div>
                      <div>POST /api/bale/webhook/appointment</div>
                    </div>
                  </div>

                  <div className="p-3 bg-[#F7F8F3] rounded-xl border border-[#E6E9DF] space-y-1">
                    <div className="font-bold text-[#2D3A27]">ویژگی‌های یکپارچه‌شده:</div>
                    <ul className="list-disc list-inside text-[11px] text-[#5C7457] space-y-1">
                      <li>ثبت نوبت توسط مراجع در بله ⬅️ ورود مستقیم به صف پذیرش کلینیک</li>
                      <li>ارسال آنی پیامک تایید کد رهگیری با درگاه IPPanel</li>
                      <li>به‌روزرسانی خودکار ساعات کاری و لیست تعرفه‌ها از دیتابیس مرکزی</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-[#E6E9DF] flex items-center justify-between">
          <div className="text-[11px] text-[#738A6E] flex items-center gap-2">
            <span>آخرین ویرایش توسط: <span className="font-bold text-[#2D3A27]">{formData.lastUpdatedBy}</span></span>
            {!canManageSettings && (
              <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
                فقط‌خواندنی: تغییر ساعات و تنظیمات نیازمند مجوز settings.manage است
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#5C7457] hover:bg-[#F7F8F3] transition-colors"
            >
              انصراف
            </button>
            <button
              onClick={handleSave}
              disabled={!canManageSettings}
              className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all ${
                canManageSettings
                  ? 'bg-[#4A6741] text-white hover:bg-[#384E31] active:scale-95 cursor-pointer'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              ذخیره و اعمال تغییرات
            </button>
          </div>
        </div>

        {/* Toast confirmation */}
        {showSavedToast && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-[#2D3A27] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            مشخصات کلینیک مهرگان با موفقیت بروزرسانی شد
          </div>
        )}
      </div>
    </div>
  );
};
