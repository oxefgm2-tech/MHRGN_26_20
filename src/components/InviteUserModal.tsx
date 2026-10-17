import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  Phone,
  Mail,
  UserCheck,
  Copy,
  Check,
  ListFilter,
  Clock,
  CheckCircle,
  Shield,
  Stethoscope,
  Sparkles,
  BookOpen,
  ArrowRight,
  Share2,
  CheckCircle2,
  Lock,
  Smartphone,
  ChevronLeft,
} from 'lucide-react';
import { apiClient } from '../services/apiClient';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'مدیر ارشد کلینیک (دکتر بیاتی)',
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

interface RoleCatalogItem {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  description: string;
  responsibilities: string[];
  keyPrivileges: string[];
  suggestedDesk: string;
}

const CLINIC_ROLES_CATALOG: RoleCatalogItem[] = [
  {
    id: 'admin',
    title: 'مدیر ارشد کلینیک و درمان',
    subtitle: 'جناب آقای دکتر امین بیاتی',
    badge: 'دسترسی کلان',
    description: 'راهبری جامع کلینیک، نظارت بالینی و درمانی، تحلیل گزارش‌های مالی و اسناد حسابداری، مدیریت کادر پرسنلی و تعیین ماتریس دسترسی.',
    responsibilities: [
      'نظارت بر تمامی پذیرش‌ها و پرونده‌های درمانی روزانه',
      'مدیریت پیکربندی، پروفایل و ساعات کاری کلینیک مهرگان',
      'مدیریت اسناد مالی، تسویه‌ها و پیش‌فاکتورهای پارسیان',
      'صدور و باطل‌سازی دعوت‌نامه‌های رسمی کادر درمان',
    ],
    keyPrivileges: ['دسترسی تام به کلیه بخش‌ها', 'تنظیمات کلینیک', 'حذف فاکتور و اسناد', 'تغییر نقش کاربران'],
    suggestedDesk: 'داشبورد مدیریتی، بایگانی جامع، مدیریت مالی',
  },
  {
    id: 'veterinarian',
    title: 'دامپزشک و جراح',
    subtitle: 'کادر تخصصی تشخیص، درمان و جراحی',
    badge: 'بالینی و درمانی',
    description: 'تشکیل و ثبت پرونده‌های پزشکی، ویزیت‌ها، ثبت پروتکل‌های واکسیناسیون، معاینات دوره‌ای، نسخه‌نویسی و ثبت نوبت‌های بیهوشی و جراحی.',
    responsibilities: [
      'معاینه بالینی بیمار و ثبت علائم حیاتی در پرونده الکترونیک',
      'ثبت نسخه‌های دارویی و اقلام مصرفی اتاق درمان',
      'ثبت سوابق و یادداشت‌های جراحی و ریکاوری حیوان',
      'بررسی سوابق آزمایشگاهی و تاریخچه درمانی پت',
    ],
    keyPrivileges: ['ثبت ویزیت و درمان', 'نسخه‌نویسی الکترونیک', 'اتاق عمل و جراحی', 'دسترسی به پرونده کامل'],
    suggestedDesk: 'میز کار دامپزشک، اتاق عمل، سوابق واکسیناسیون',
  },
  {
    id: 'receptionist',
    title: 'پذیرش و منشی',
    subtitle: 'خط مقدم نوبت‌دهی و پذیرش مراجعین',
    badge: 'پذیرش و ارباب‌رجوع',
    description: 'پذیرش مراجعین، ثبت پرونده اولیه بیمار و مشخصات سرپرست، تشکیل صف انتظار و تریاژ روزانه، تنظیم نوبت در تقویم بالینی.',
    responsibilities: [
      'ثبت پذیرش‌های جدید و تشکیل سریع پرونده مراجعین',
      'مدیریت صف انتظار روزانه و فراخوانی بیمار به اتاق پزشک',
      'تنظیم و تغییر نوبت‌های تقویم و ارسال پیامک یادآوری',
      'پاسخگویی به مراجعین و استعلام وضعیت نوبت‌ها',
    ],
    keyPrivileges: ['ثبت پذیرش و پرونده جدید', 'تقویم و نوبت‌دهی', 'مدیریت صف تریاژ', 'ارسال پیام به مراجعین'],
    suggestedDesk: 'میز پذیرش، صف انتظار تریاژ، تقویم کلینیک',
  },
  {
    id: 'cashier',
    title: 'مسئول حسابداری و صندوق',
    subtitle: 'صورتحساب، تسویه و صدور پیش‌فاکتور پارسیان',
    badge: 'امور مالی و صندوق',
    description: 'مدیریت صورتحساب‌های بیماران و پت‌شاپ، اعمال تخفیفات مجاز، تسویه از طریق پوز بانکی یا کارت‌به‌کارت، صدور پیش‌فاکتور پارسیان و چاپ فیش.',
    responsibilities: [
      'بررسی و تسویه فاکتورهای صادرشده توسط بخش‌های مختلف کلینیک',
      'ثبت تراکنش‌های POS و تسویه‌های نقدی و اعتباری',
      'چاپ فیش حرارتی و ارسال نسخه دیجیتال فاکتور در بله/تلگرام',
      'خروجی خودکار یا دستی پیش‌فاکتور برای نرم‌افزار حسابداری پارسیان',
    ],
    keyPrivileges: ['تسویه فاکتور با پوز', 'خروجی پیش‌فاکتور پارسیان', 'چاپ فیش حرارتی و A4', 'مشاهده گردش صندوق'],
    suggestedDesk: 'میز صندوق و مالی، فاکتورها، ماژول پارسیان',
  },
  {
    id: 'groomer',
    title: 'آرایشگر و گرومر',
    subtitle: 'خدمات پیرایش، شستشو و بهداشت پت',
    badge: 'خدمات بهداشتی پت',
    description: 'مدیریت صف آرایشگاه و گرومینگ، ثبت استایل‌های اصلاح‌شده، آپلود نمونه‌کارهای قبل و بعد در پورتفولیو، ثبت تعرفه خدمات.',
    responsibilities: [
      'مشاهده نوبت‌های آرایشگاه و آماده‌سازی فضای اصلاح',
      'ثبت استایل، نوع شستشو، ضدعفونی و خدمات ارائه‌شده',
      'ثبت فاکتور خدمات گرومینگ و ارسال به صندوق کلینیک',
      'آپلود عکس‌های قبل و بعد در آلبوم پورتفولیوی پت',
    ],
    keyPrivileges: ['صف نوبت‌های آرایشگاه', 'ثبت خدمات و تعرفه', 'مدیریت آلبوم گرومینگ', 'ثبت فاکتور خدمات'],
    suggestedDesk: 'میز گرومینگ و آرایشگاه، پورتفولیو',
  },
  {
    id: 'petshop_sales',
    title: 'فروشنده پت‌شاپ',
    subtitle: 'فروش حضوری ملزومات، خوراک و اسباب‌بازی',
    badge: 'فروشگاه پت‌شاپ',
    description: 'ثبت سریع فروش کالاها از طریق بارکد، بررسی موجودی قفسه‌ها، اعمال تخفیف‌های ویژه مشتریان وفادار و ارجاع فاکتور به صندوق.',
    responsibilities: [
      'اسکن بارکد کالاها و افزودن سریع به سبد خرید مشتری',
      'بررسی آنی قیمت و موجودی انبار پت‌شاپ مهرگان',
      'ثبت تخفیف‌های ویژه سرپرستان و ثبت شماره تماس مشتری',
      'صدور فاکتور فروش پت‌شاپ و اتصال به صندوق کلینیک',
    ],
    keyPrivileges: ['صدور فاکتور فروش پت‌شاپ', 'مشاهده کاتالوگ محصولات', 'جستجوی بارکد کالا', 'اعمال تخفیف وفاداری'],
    suggestedDesk: 'میز فروش پت‌شاپ، کاتالوگ محصولات',
  },
  {
    id: 'petshop_purchasing',
    title: 'مامور خرید و انباردار',
    subtitle: 'تامین کالا، انبارداری و سفارش‌گذاری',
    badge: 'تامین و انبار',
    description: 'مدیریت لیست تامین‌کنندگان، ثبت فاکتورهای ورودی خرید، ثبت موجودی کالا در انبار و مانیتورینگ هشدارهای کمبود موجودی و تاریخ انقضا.',
    responsibilities: [
      'ثبت فاکتورهای خرید عمده از شرکت‌های پخش و واردکنندگان',
      'ثبت رسید کالا در انبار و به‌روزرسانی موجودی سیستمی',
      'کنترل کالاهای زیر نقطه سفارش و تاریخ‌انقضای دارو و غذا',
      'ثبت اطلاعات تماس و سوابق مالی تامین‌کنندگان کلینیک',
    ],
    keyPrivileges: ['ثبت فاکتور خرید ورودی', 'مدیریت موجودی انبار', 'لیست تامین‌کنندگان', 'گزارش نقطه سفارش'],
    suggestedDesk: 'انبارداری، تامین‌کنندگان، اسناد خرید',
  },
  {
    id: 'it_developer',
    title: 'کارشناس فناوری اطلاعات (IT)',
    subtitle: 'توسعه، زیرساخت سرور و امنیت شبکه',
    badge: 'زیرساخت فنی',
    description: 'نظارت بر پایداری سرور و پایگاه داده پستگرس، پشتیبان‌گیری‌های دوره‌ای، مدیریت وب‌سرویس‌ها، اتصال پارسیان و همگام‌سازی داده‌ها.',
    responsibilities: [
      'پایش سلامت سرور و اندپوینت‌های API و وضعیت پورت ۳۰۰۰',
      'پشتیبان‌گیری منظم اتمیک از پایگاه‌داده و اعتبارسنجی ریستور',
      'مدیریت پیکربندی حالت‌های سه‌گانه (لوکال، وی‌پی‌اس، ابری گوگل)',
      'تست و نگهداری پل خروجی پیش‌فاکتور پارسیان و شبکه داخلی',
    ],
    keyPrivileges: ['مدیریت سرور و دیتابیس', 'پشتیبان‌گیری و بازیابی', 'بررسی لاگ‌های امنیتی', 'تنظیمات شبکه و API'],
    suggestedDesk: 'داشبورد فنی، کنسول سرور، تنظیمات پشتیبان‌گیری',
  },
];

export const InviteUserModal: React.FC<InviteUserModalProps> = ({ isOpen, onClose, onCreated }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'roles' | 'list'>('create');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('veterinarian');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [invitationsList, setInvitationsList] = useState<any[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);

  const selectedRoleDetail = CLINIC_ROLES_CATALOG.find((r) => r.id === role) || CLINIC_ROLES_CATALOG[1];

  const fetchExistingInvitations = async () => {
    setIsLoadingList(true);
    try {
      const list = await apiClient.getInvitations();
      setInvitationsList(list || []);
    } catch {
      // ignore
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchExistingInvitations();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await apiClient.inviteUser({
        name,
        phone,
        email: email.trim() || undefined,
        role,
      });
      const token = res.token || res.invitation?.token || res.data?.token;
      if (token) {
        const link = `${window.location.origin}?invite=${encodeURIComponent(token)}`;
        setInviteLink(link);
      } else {
        setInviteLink(`${window.location.origin}?invited=true`);
      }
      fetchExistingInvitations();
      if (onCreated) onCreated();
    } catch (err: any) {
      setError(err?.message || 'خطا در صدور دعوت‌نامه کاربر');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, tokenKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(tokenKey);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const getInvitationMessageText = (link: string) => {
    const roleTitle = ROLE_LABELS[role] || role;
    return `همکار گرامی جناب آقای/سرکار خانم ${name || 'عزیز'}،
با سلام؛
دعوت‌نامه رسمی شما برای پیوستن به سامانه جامع مدیریت و درمان کلینیک دامپزشکی مهرگان صادر شد.

نقش سازمانی: ${roleTitle}
جهت تعیین رمز عبور امن و آغاز فعالیت در میز کار اختصاصی خود، لطفاً روی پیوند زیر کلیک فرمایید:
${link}

با آرزوی سلامت و موفقیت
مدیریت کلینیک دامپزشکی مهرگان`;
  };

  const handleCopyInvitationMessage = (link: string) => {
    const msg = getInvitationMessageText(link);
    navigator.clipboard.writeText(msg);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn" dir="rtl">
      <div className="bg-white rounded-[28px] max-w-2xl w-full p-6 shadow-2xl border border-[#E6E9DF] relative max-h-[92vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute left-5 top-5 p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          type="button"
          title="بستن"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#4A6741]/10 text-[#4A6741] flex items-center justify-center shadow-xs">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[#2D3A27]">سامانه صدور دعوت‌نامه و فعال‌سازی کادر درمان</h2>
            <p className="text-xs text-[#5C7457]">جریان کار شروع (Onboarding)، معرفی نقش‌ها و دعوت همکاران کلینیک مهرگان</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-1 bg-[#F4F6F0] rounded-2xl mb-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'create'
                ? 'bg-white text-[#2D3A27] shadow-xs'
                : 'text-[#5C7457] hover:text-[#2D3A27]'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>صدور دعوت‌نامه جدید</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('roles')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'roles'
                ? 'bg-white text-[#2D3A27] shadow-xs'
                : 'text-[#5C7457] hover:text-[#2D3A27]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>معرفی نقش‌ها و مسئولیت‌ها</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('list');
              fetchExistingInvitations();
            }}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'list'
                ? 'bg-white text-[#2D3A27] shadow-xs'
                : 'text-[#5C7457] hover:text-[#2D3A27]'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>دعوت‌نامه‌ها</span>
            <span className="px-1.5 py-0.5 rounded-full bg-[#4A6741]/15 text-[#4A6741] text-[10px]">
              {invitationsList.length}
            </span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
            {error}
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto pr-1">
          {/* TAB 1: CREATE INVITATION */}
          {activeTab === 'create' && (
            inviteLink ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs leading-relaxed space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-800 text-sm">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    دعوت‌نامه رسمی برای {name || 'همکار'} با موفقیت ایجاد شد!
                  </div>
                  <p>
                    این لینک یک‌بارمصرف امن تولید گردید. می‌توانید لینک اختصاصی را به تنهایی کپی کنید یا متن آماده پیام دعوت را جهت ارسال در پیام‌رسان‌ها (بله، ایتا، تلگرام یا پیامک) بردارید.
                  </p>
                </div>

                {/* Direct Link Box */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">پیوند مستقیم فعال‌سازی حساب:</label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      readOnly
                      value={inviteLink}
                      dir="ltr"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs font-mono select-all text-left text-gray-800"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(inviteLink, 'new')}
                      className="absolute left-2 p-1.5 text-gray-500 hover:text-[#4A6741] transition-colors cursor-pointer"
                      title="کپی لینک"
                    >
                      {copiedToken === 'new' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Formatted SMS/Messenger Box */}
                <div className="bg-[#F8FAF6] p-4 rounded-2xl border border-[#D5DDD0] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#2D3A27] flex items-center gap-1.5">
                      <Share2 className="w-4 h-4 text-[#4A6741]" />
                      متن آماده ارسال برای پیام‌رسان‌ها و پیامک (بله / ایتا / SMS)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyInvitationMessage(inviteLink)}
                      className="px-3 py-1.5 rounded-xl bg-[#4A6741] hover:bg-[#3D5535] text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                    >
                      {copiedMessage ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>پیام کپی شد!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>کپی کامل متن پیام</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3 bg-white rounded-xl border border-gray-200 text-[11px] text-gray-700 font-sans leading-relaxed whitespace-pre-wrap select-all">
                    {getInvitationMessageText(inviteLink)}
                  </pre>
                </div>

                {/* Bottom Actions */}
                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setInviteLink(null);
                      setName('');
                      setPhone('');
                      setEmail('');
                    }}
                    className="px-4 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                  >
                    صدور دعوت‌نامه دیگر
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2.5 text-xs font-bold text-white bg-[#4A6741] hover:bg-[#3d5535] rounded-xl transition-colors shadow-xs cursor-pointer"
                  >
                    اتمام و بستن
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                {/* Quick preset for Dr. Amin Bayati */}
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      دعوت ویژه مدیر ارشد کلینیک
                    </div>
                    <div className="text-[11px] text-emerald-800">تکمیل خودکار برای جناب آقای دکتر امین بیاتی</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setName('دکتر امین بیاتی');
                      setPhone('09133115509');
                      setEmail('dr.bayati@mehreganpetclinic.ir');
                      setRole('admin');
                    }}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    تکمیل فرم برای دکتر بیاتی
                  </button>
                </div>

                {/* 3-Step Onboarding Workflow Banner */}
                <div className="bg-[#F8FAF6] p-3.5 rounded-2xl border border-[#D5DDD0] space-y-2">
                  <div className="text-xs font-black text-[#2D3A27] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#4A6741]" />
                    جریان کار شروع و فعال‌سازی همکار جدید (Onboarding Workflow)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                    <div className="p-2.5 bg-white rounded-xl border border-[#E6E9DF]">
                      <span className="font-bold text-[#4A6741] block mb-0.5">۱. صدور دعوت‌نامه</span>
                      <span className="text-[#5C7457]">تولید لینک یک‌بارمصرف امن توسط مدیر یا IT کلینیک</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-[#E6E9DF]">
                      <span className="font-bold text-[#4A6741] block mb-0.5">۲. تنظیم رمز عبور</span>
                      <span className="text-[#5C7457]">همکار لینک را باز کرده و گذرواژه اختصاصی خود را ثبت می‌کند</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-[#E6E9DF]">
                      <span className="font-bold text-[#4A6741] block mb-0.5">۳. شروع فوری کار</span>
                      <span className="text-[#5C7457]">ورود مستقیم به میز کار متناسب با نقش بدون نیاز به کانفیگ</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">نام و نام خانوادگی همکار</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="مثلاً دکتر امین بیاتی"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-hidden focus:border-[#4A6741] focus:ring-1 focus:ring-[#4A6741] text-xs font-bold"
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
                        placeholder="0913..."
                        dir="ltr"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-hidden focus:border-[#4A6741] focus:ring-1 focus:ring-[#4A6741] font-mono text-left text-xs"
                        required
                      />
                      <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">آدرس ایمیل (اختیاری)</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@mehreganpetclinic.ir"
                        dir="ltr"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-hidden focus:border-[#4A6741] focus:ring-1 focus:ring-[#4A6741] text-left text-xs font-mono"
                      />
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">نقش سازمانی در کلینیک مهرگان</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-hidden focus:border-[#4A6741] focus:ring-1 focus:ring-[#4A6741] bg-white text-xs font-bold"
                    >
                      <option value="admin">مدیر ارشد کلینیک و درمان (دکتر بیاتی)</option>
                      <option value="veterinarian">دامپزشک و جراح</option>
                      <option value="receptionist">پذیرش و منشی</option>
                      <option value="cashier">مسئول حسابداری و صندوق</option>
                      <option value="groomer">آرایشگر و گرومر</option>
                      <option value="petshop_sales">فروشنده پت‌شاپ</option>
                      <option value="petshop_purchasing">مامور خرید و انباردار</option>
                      <option value="it_developer">کارشناس فناوری اطلاعات (IT)</option>
                    </select>
                  </div>
                </div>

                {/* Dynamic Role Summary Box */}
                {selectedRoleDetail && (
                  <div className="p-3.5 rounded-2xl bg-[#F7F8F3] border border-[#D5DDD0] text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-[#2D3A27] flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-[#4A6741]" />
                        معرفی نقش انتخابی: {selectedRoleDetail.title} ({selectedRoleDetail.subtitle})
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#4A6741]/15 text-[#4A6741] font-bold">
                        {selectedRoleDetail.badge}
                      </span>
                    </div>
                    <p className="text-[#5C7457] leading-relaxed text-[11px]">
                      {selectedRoleDetail.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedRoleDetail.keyPrivileges.map((p, idx) => (
                        <span key={idx} className="bg-white px-2 py-0.5 rounded-lg border border-[#E6E9DF] text-[10px] text-[#4B5E43] font-medium">
                          ✓ {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 text-xs font-bold text-white bg-[#4A6741] hover:bg-[#3d5535] rounded-xl transition-colors disabled:opacity-50 shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{isSubmitting ? 'در حال صدور...' : 'ایجاد لینک دعوت رسمی'}</span>
                  </button>
                </div>
              </form>
            )
          )}

          {/* TAB 2: ROLES CATALOG (معرفی جامع نقش‌ها) */}
          {activeTab === 'roles' && (
            <div className="space-y-3.5">
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs text-emerald-900 leading-relaxed">
                <strong>راهنمای نقش‌های سازمانی کلینیک مهرگان:</strong> هر همکار با ورود به سامانه، مستقیماً به محیط کاربری اختصاصی نقش خود وارد شده و ابزارهای مرتبط با مسئولیت‌های خود را بدون شلوغی مشاهده می‌نماید.
              </div>

              <div className="grid grid-cols-1 gap-3">
                {CLINIC_ROLES_CATALOG.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-4 rounded-2xl bg-white border border-[#E6E9DF] hover:border-[#4A6741] transition-all space-y-2.5 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-[#2D3A27]">{cat.title}</h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#4A6741]/15 text-[#4A6741] font-bold">
                            {cat.badge}
                          </span>
                        </div>
                        <div className="text-xs text-[#5C7457] mt-0.5">{cat.subtitle}</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setRole(cat.id);
                          setActiveTab('create');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <span>انتخاب برای دعوت</span>
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs text-[#4B5E43] leading-relaxed">
                      {cat.description}
                    </p>

                    <div className="pt-1 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="font-bold text-[#2D3A27] block mb-1">مسئولیت‌های کلیدی:</span>
                        <ul className="space-y-0.5 text-[#5C7457] pr-1">
                          {cat.responsibilities.slice(0, 3).map((r, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="text-[#4A6741] font-bold">•</span>
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <span className="font-bold text-[#2D3A27] block mb-1">اختیارات و مجوزها:</span>
                        <div className="flex flex-wrap gap-1">
                          {cat.keyPrivileges.map((p, idx) => (
                            <span key={idx} className="bg-[#F7F8F3] px-2 py-0.5 rounded-lg border border-[#E6E9DF] text-[10px] text-[#4B5E43]">
                              ✓ {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: EXISTING INVITATIONS LIST */}
          {activeTab === 'list' && (
            <div className="space-y-3">
              {isLoadingList ? (
                <div className="text-center py-8 text-xs text-gray-500">در حال دریافت لیست دعوت‌نامه‌ها...</div>
              ) : invitationsList.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-500 bg-stone-50 rounded-2xl">
                  هنوز دعوت‌نامه‌ای صادر نشده است.
                </div>
              ) : (
                invitationsList.map((item) => {
                  const isUsed = !!item.usedAt;
                  const link = `${window.location.origin}?invite=${encodeURIComponent(item.token)}`;
                  const isAminBayati = item.name?.includes('بیاتی') || item.role === 'admin';
                  return (
                    <div
                      key={item.token}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isAminBayati
                          ? 'bg-emerald-50/60 border-emerald-300'
                          : 'bg-white border-[#E6E9DF]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-xs text-[#2D3A27]">{item.name}</span>
                            {isAminBayati && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-700 text-white text-[10px] font-bold">
                                مدیر ارشد
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#5C7457] mt-0.5">
                            {ROLE_LABELS[item.role] || item.role} • {item.phone || 'بدون شماره'}
                          </div>
                        </div>

                        <div>
                          {isUsed ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-[10px] font-bold">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              فعال‌شده و پیوسته به کلینیک
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              در انتظار تکمیل ثبت‌نام
                            </span>
                          )}
                        </div>
                      </div>

                      {!isUsed && (
                        <div className="mt-2.5 pt-2.5 border-t border-black/5 flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={link}
                            dir="ltr"
                            className="flex-1 px-2.5 py-1.5 bg-white rounded-lg border border-gray-200 text-[11px] font-mono select-all text-left text-gray-600"
                          />
                          <button
                            type="button"
                            onClick={() => copyToClipboard(link, item.token)}
                            className="px-3 py-1.5 rounded-lg bg-[#4A6741] hover:bg-[#3D5535] text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            {copiedToken === item.token ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-300" />
                                <span>کپی شد</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>کپی لینک</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
