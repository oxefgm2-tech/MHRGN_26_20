import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, User, Phone, Mail, CheckCircle2, AlertCircle, Shield, ArrowLeft } from 'lucide-react';
import { apiClient } from '../services/apiClient';

interface InviteSetupPageProps {
  token: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'مدیر ارشد کلینیک و درمان (دکتر بیاتی)',
  senior_veterinarian: 'دامپزشک ارشد',
  veterinarian: 'دامپزشک و جراح',
  receptionist: 'پذیرش و منشی',
  cashier: 'مسئول حسابداری و صندوق',
  groomer: 'آرایشگر و گرومر',
  petshop_sales: 'فروشنده پت‌شاپ',
  petshop_purchasing: 'مامور خرید و انباردار',
  it_developer: 'کارشناس فناوری اطلاعات (IT)',
  owner: 'سرپرست پت',
};

export const InviteSetupPage: React.FC<InviteSetupPageProps> = ({ token }) => {
  const [invitation, setInvitation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiClient.getInvitation(token);
        if (!cancelled && data) {
          setInvitation(data);
          setName(data.name || '');
          setPhone(data.phone || '');
          setEmail(data.email || '');
          setUsername(data.email ? data.email.split('@')[0] : (data.phone ? `user_${data.phone.slice(-4)}` : ''));
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || 'لینک دعوت نامعتبر یا منقضی شده است.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('کلمه عبور و تکرار آن یکسان نیستند.');
      return;
    }
    if (password.length < 6) {
      setError('کلمه عبور باید حداقل ۶ کاراکتر باشد.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await apiClient.completeUserInvitation(token, {
        name,
        username,
        password,
        phone,
        email: email.trim() || undefined,
      });
      setIsCompleted(true);
      setTimeout(() => {
        window.location.href = window.location.pathname;
      }, 2000);
    } catch (err: any) {
      setError(err?.message || 'تکمیل حساب کاربری ناموفق بود.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div dir="rtl" className="min-h-screen bg-[#F7F8F3] flex items-center justify-center p-6 text-[#2D3A27]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#4A6741] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-[#5C7457]">در حال اعتبارسنجی لینک دعوت رسمی مهرگان...</p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div dir="rtl" className="min-h-screen bg-[#F7F8F3] flex items-center justify-center p-6 text-[#2D3A27]">
        <div className="w-full max-w-md bg-white border border-[#E6E9DF] rounded-3xl shadow-lg p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-[#2D3A27]">لینک دعوت نامعتبر یا منقضی شده است</h2>
          <p className="text-xs text-gray-600 leading-relaxed">{error}</p>
          <button
            onClick={() => { window.location.href = window.location.pathname; }}
            className="mt-4 px-5 py-2.5 text-xs font-bold text-white bg-[#4A6741] hover:bg-[#3D5535] rounded-xl cursor-pointer transition-all shadow-xs"
          >
            ورود به صفحه اصلی کلینیک
          </button>
        </div>
      </div>
    );
  }

  const roleName = invitation?.role ? (ROLE_LABELS[invitation.role] || invitation.role) : 'کادر درمان';

  return (
    <div dir="rtl" className="min-h-screen bg-[#F7F8F3] flex items-center justify-center p-4 sm:p-6 text-[#2D3A27]">
      <div className="w-full max-w-lg bg-white border border-[#E6E9DF] rounded-[32px] shadow-2xl p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#4A6741]/10 text-[#4A6741] flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-[#2D3A27]">فعال‌سازی حساب کاربری کلینیک مهرگان</h1>
            <p className="text-xs text-[#5C7457]">جریان کار شروع و تعیین رمز عبور امن کادر درمان</p>
          </div>
        </div>

        {/* Role Welcome Banner */}
        <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1">
          <div className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-700" />
            نقش اختصاص‌یافته به شما: <span className="text-emerald-800">{roleName}</span>
          </div>
          <p className="text-[11px] text-emerald-800 leading-relaxed">
            پس از تعیین رمز عبور، حساب شما فعال شده و مستقیماً به محیط کاربری و ابزارهای مرتبط با نقش خود دسترسی خواهید داشت.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
            {error}
          </div>
        )}

        {isCompleted ? (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <div className="font-black text-sm">حساب کاربری شما با موفقیت فعال شد!</div>
            <p className="text-xs text-emerald-800">
              در حال انتقال خودکار به صفحه ورود و آغاز فعالیت در کلینیک مهرگان...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">نام و نام خانوادگی</label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-gray-300 focus:outline-hidden focus:border-[#4A6741] text-xs font-bold"
                  required
                />
                <User className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">نام کاربری اختصاصی</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  dir="ltr"
                  placeholder="dr.rezaei"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-hidden focus:border-[#4A6741] font-mono text-left text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">شماره همراه</label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    dir="ltr"
                    className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-gray-300 focus:outline-hidden focus:border-[#4A6741] font-mono text-left text-xs font-bold"
                    required
                  />
                  <Phone className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">آدرس ایمیل (اختیاری)</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  dir="ltr"
                  placeholder="name@mehreganpetclinic.ir"
                  className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-gray-300 focus:outline-hidden focus:border-[#4A6741] text-left text-xs font-mono"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">کلمه عبور جدید (حداقل ۶ نویسه)</label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-gray-300 focus:outline-hidden focus:border-[#4A6741] text-xs font-mono"
                    required
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">تکرار کلمه عبور</label>
                <div className="relative">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-gray-300 focus:outline-hidden focus:border-[#4A6741] text-xs font-mono"
                    required
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-3 py-3 text-xs font-bold text-white bg-[#4A6741] hover:bg-[#3d5535] rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-xs active:scale-[0.99] flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'در حال ثبت نهایی اطلاعات...' : 'تکمیل حساب و ورود به کلینیک'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
