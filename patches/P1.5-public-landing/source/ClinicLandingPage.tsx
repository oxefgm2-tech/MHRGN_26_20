import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Stethoscope,
  Lock,
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Sparkles,
  Building2,
  FileCode,
  UserCheck,
  UserPlus,
  Cpu,
  Layers,
  HelpCircle,
  Copy,
  ExternalLink,
  ChevronRight,
  Server,
  Activity,
  HeartPulse,
  ShoppingBag,
  Scissors,
  Check,
  Navigation,
  Car,
} from 'lucide-react';
import { ClinicRecord, ClinicProfileConfig } from '../types';
import { apiClient } from '../services/apiClient';
import { CLINIC_LOCATION } from '../constants/clinicLocation';

interface ClinicLandingPageProps {
  onLoginSuccess: (user: any, token: string) => void;
  onOpenInviteModal?: () => void;
  activeClinicProfile?: ClinicProfileConfig;
}

export const ClinicLandingPage: React.FC<ClinicLandingPageProps> = ({
  onLoginSuccess,
  activeClinicProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'roadmap' | 'onboarding' | 'multi_clinic'>('overview');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showInviteAcceptModal, setShowInviteAcceptModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Login form state
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Multi-clinic state
  const [clinics, setClinics] = useState<ClinicRecord[]>([]);
  const [activeClinic, setActiveClinic] = useState<ClinicRecord | null>(null);
  const [emptyTemplate, setEmptyTemplate] = useState<any>(null);
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  // Invite acceptance state
  const [inviteTokenInput, setInviteTokenInput] = useState('');
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
  const [copiedPendingToken, setCopiedPendingToken] = useState<string | null>(null);

  const loadPendingInvitations = async () => {
    try {
      const list = await apiClient.getPendingInvitations();
      if (list) setPendingInvitations(list);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [list, active, tpl, pending] = await Promise.all([
          apiClient.getClinics(),
          apiClient.getActiveClinic(),
          apiClient.getClinicTemplate(),
          apiClient.getPendingInvitations(),
        ]);
        if (!cancelled) {
          if (list) setClinics(list);
          if (active) setActiveClinic(active);
          if (tpl) setEmptyTemplate(tpl);
          if (pending) setPendingInvitations(pending);
        }
      } catch (err) {
        console.warn('Failed to load clinic metadata on landing page:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      const res = await apiClient.login(username, password);
      if (res && res.token && res.user) {
        onLoginSuccess(res.user, res.token);
      } else {
        setLoginError('اطلاعات ورود صحیح نمی‌باشد.');
      }
    } catch (err: any) {
      setLoginError(err?.message || 'خطا در برقراری ارتباط با سرور.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleCopyTemplate = () => {
    if (!emptyTemplate) return;
    navigator.clipboard.writeText(JSON.stringify(emptyTemplate, null, 2));
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  const handleActivateClinic = async (clinicId: string) => {
    try {
      const res = await apiClient.activateClinic(clinicId);
      if (res.success) {
        const updatedList = await apiClient.getClinics();
        setClinics(updatedList);
        const updatedActive = await apiClient.getActiveClinic();
        setActiveClinic(updatedActive);
      }
    } catch (err) {
      console.error('Failed to activate clinic:', err);
    }
  };

  const clinicName = activeClinic?.clinic_name || activeClinicProfile?.clinicName || 'کلینیک دامپزشکی حیوانات خانگی مهرگان';
  const managerName = activeClinic?.manager || 'دکتر امین بیاتی';
  const clinicAddress = activeClinic?.address || activeClinicProfile?.address || 'اصفهان، خیابان توحید میانی، حدفاصل مهرداد و شریعتی، کوچه مشکلانی ۲۲';
  const phoneNumbers = activeClinic?.phone_numbers?.map((p) => p.number) || activeClinicProfile?.phoneNumbers || ['03136292278', '093021820044'];

  const clinicServices = [
    { title: 'ویزیت و معاینات دوره‌ای', desc: 'پایش سلامت کامل حیوانات خانگی، بررسی دندان، گوش و وضعیت فیزیکی', icon: Stethoscope },
    { title: 'واکسیناسیون تخصصی', desc: 'تزریق واکسن‌های چندگانه و هاری با ثبت رسمی در سیستم سلامت', icon: HeartPulse },
    { title: 'انگل‌تراپی بالینی', desc: 'پروتکل‌های پیشرفته ضدانگل داخلی و خارجی با داروهای معتبر', icon: ShieldCheck },
    { title: 'جراحی تخصصی بافت نرم', desc: 'اتاق عمل استاندارد با بیهوشی ایزوفلوران و مانیتورینگ دقیق حیاتی', icon: Activity },
    { title: 'ارتوپدی و تثبیت شکستگی', desc: 'تثبیت داخلی و خارجی شکستگی‌های استخوانی و جراحی مفاصل', icon: Layers },
    { title: 'جراحی زیبایی و ترمیمی', desc: 'اعمال ترمیمی، بریدگی‌ها و مدیریت ضایعات پوستی و بافتی', icon: Sparkles },
    { title: 'سونوگرافی تشخیصی', desc: 'تصویربرداری اولتراسوند دقیق از محوطه بطنی و احشا', icon: Cpu },
    { title: 'کاشت میکروچیپ استاندارد', desc: 'کاشت تراشه هویت ۱۵ رقمی بین‌المللی با ثبت بارکد در سامانه', icon: CheckCircle2 },
    { title: 'صدور شناسنامه و سلامت', desc: 'صدور مدارک رسمی سلامت و شناسنامه بهداشتی پت', icon: FileCode },
    { title: 'گواهی خروج از کشور', desc: 'تکمیل مدارک ترخیص و سرولوژی هاری جهت سفرهای هوایی', icon: ExternalLink },
    { title: 'بستری و پانسیون VIP', desc: 'باکس‌های مجزا با تهویه اختصاصی و مراقبت ۲۴ ساعته پرستار', icon: Building2 },
    { title: 'آرایشگاه و شستشو', desc: 'گرومینگ تخصصی نژادی، شستشو با شامپوهای ضدحساسیت', icon: Scissors },
    { title: 'پت‌شاپ اختصاصی MDI', desc: 'تامین غذای درمانی، مکمل‌های تقویتی و لوازم نگهداری اورجینال', icon: ShoppingBag },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-[#FAFAF7] text-[#1E271C] font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Notification / Banner */}
      <div className="bg-[#21301E] text-[#E8EFE5] text-xs px-4 py-2.5 border-b border-[#2D3E29]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold">سامانه مدیریت اختصاصی کلینیک مهرگان اصفهان</span>
            <span className="text-[#8FA887] hidden md:inline">| منطقه جلفا — به مدیریت {managerName}</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-[#C4D5BF]">
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span dir="ltr">۰۳۱-۳۶۲۹۲۲۷۸</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>اورژانس شبانه‌روزی</span>
            </span>
            <button
              onClick={() => setShowLoginModal(true)}
              className="text-emerald-300 hover:text-white font-bold transition-colors underline decoration-emerald-500/40 underline-offset-4"
            >
              ورود کارشناس IT
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E6E8E0] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#283824] text-white flex items-center justify-center shadow-md shadow-emerald-900/10">
              <Stethoscope className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-[#1E271C]">{clinicName}</h1>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">اصفهان</span>
              </div>
              <p className="text-xs text-[#6A7865] font-medium">مرکز جامع جراحی، ارتوپدی، پاراکلینیک، آرایشگاه و پت‌شاپ</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowInviteAcceptModal(true)}
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#D9DED3] hover:border-emerald-600 hover:bg-emerald-50/50 text-[#2D3A27] text-xs font-bold transition-all"
            >
              <UserCheck className="w-4 h-4 text-emerald-700" />
              <span>پذیرش دعوت‌نامه و تکمیل نقش</span>
            </button>
            <button
              onClick={() => setShowLoginModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#283824] hover:bg-[#1C2819] text-white text-xs font-bold transition-all shadow-md shadow-emerald-900/15 cursor-pointer"
            >
              <Lock className="w-4 h-4 text-emerald-300" />
              <span>ورود کارشناس IT</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section with Pet Visuals & Identity */}
      <section className="relative overflow-hidden pt-12 pb-16 border-b border-[#EAECE4] bg-linear-to-b from-[#F5F6F0] to-[#FAFAF7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>کلینیک فعال و رسمی: {clinicName} (جلفا)</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#192217] leading-tight tracking-tight">
                پلتفرم یکپارچه درمان و سلامت حیوانات خانگی <span className="text-emerald-700">مهرگان</span>
              </h2>

              <p className="text-sm sm:text-base text-[#52614E] leading-relaxed max-w-2xl font-normal">
                پایگاه تخصصی جراحی بافت نرم، ارتوپدی و ارائه‌دهنده خدمات جامع بالینی حیوانات خانگی در اصفهان. مجهز به معماری استقرار سه‌حالته و سامانه اختصاصی مدیریت پرسنل به سرپرستی <strong className="text-[#192217] font-bold">{managerName}</strong>.
              </p>

              {/* Badges / Key Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-white border border-[#E3E7DE] shadow-2xs">
                  <div className="text-[11px] text-[#6A7865] font-medium">مدیر ارشد درمان</div>
                  <div className="text-xs sm:text-sm font-black text-[#1E271C] mt-0.5">{managerName}</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-[#E3E7DE] shadow-2xs">
                  <div className="text-[11px] text-[#6A7865] font-medium">موقعیت کلینیک</div>
                  <div className="text-xs sm:text-sm font-black text-[#1E271C] mt-0.5">اصفهان — منطقه جلفا</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-[#E3E7DE] shadow-2xs col-span-2 sm:col-span-1">
                  <div className="text-[11px] text-[#6A7865] font-medium">خدمات تخصصی</div>
                  <div className="text-xs sm:text-sm font-black text-emerald-700 mt-0.5">۱۳ خدمت بالینی فعال</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-6 py-3.5 rounded-2xl bg-[#283824] hover:bg-[#1E291B] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/15 transition-all"
                >
                  <span>ورود مستقیم کارشناس IT (ارژنک.پ)</span>
                  <ArrowLeft className="w-4 h-4 text-emerald-300" />
                </button>
                <button
                  onClick={() => setActiveTab('onboarding')}
                  className="px-5 py-3.5 rounded-2xl bg-white hover:bg-[#F2F4EC] border border-[#D7DDD0] text-[#2C3827] text-xs sm:text-sm font-bold transition-all"
                >
                  <span>جریان راه‌اندازی و دعوت کادر درمان</span>
                </button>
                <button
                  onClick={() => setShowTemplateModal(true)}
                  className="px-4 py-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <FileCode className="w-4 h-4 text-emerald-700" />
                  <span>قالب JSON کلینیک دیگر</span>
                </button>
              </div>
            </div>

            {/* Pet Visual Imagery Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden border border-[#DCE2D6] shadow-xl bg-white">
                <img
                  src="https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=900&auto=format&fit=crop&q=80"
                  alt="حیوانات خانگی تحت درمان مهرگان"
                  className="w-full h-80 object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 text-white">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-300">مهرگان پت کلینیک</span>
                  <h3 className="text-lg font-black mt-1">تعهد به سلامت و آرامش همراهان باوفا</h3>
                  <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                    با تجهیزات تشخیصی پیشرفته، بخش بستری ۲۴ ساعته و کادر متخصص زیر نظر {managerName}.
                  </p>
                </div>
              </div>

              {/* Floating Live Badge */}
              <div className="absolute -bottom-4 -right-4 bg-white border border-[#E3E8DC] rounded-2xl p-3 shadow-lg flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-medium">معماری چندکلینیکی</div>
                  <div className="text-xs font-black text-slate-800">رکورد فعال تأمین‌کننده سایت</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Tabs for In-depth Details */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-4">
        <div className="flex border-b border-[#E2E6DC] gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3.5 px-4 text-xs sm:text-sm font-bold whitespace-nowrap transition-all border-b-2 ${
              activeTab === 'overview'
                ? 'border-emerald-600 text-emerald-900'
                : 'border-transparent text-[#6A7865] hover:text-[#283824]'
            }`}
          >
            ۱. خدمات ۱۳‌گانه کلینیک مهرگان
          </button>
          <button
            onClick={() => setActiveTab('roadmap')}
            className={`pb-3.5 px-4 text-xs sm:text-sm font-bold whitespace-nowrap transition-all border-b-2 ${
              activeTab === 'roadmap'
                ? 'border-emerald-600 text-emerald-900'
                : 'border-transparent text-[#6A7865] hover:text-[#283824]'
            }`}
          >
            ۲. شرح قابلیت‌ها (پیاده‌شده / نقشه راه)
          </button>
          <button
            onClick={() => setActiveTab('onboarding')}
            className={`pb-3.5 px-4 text-xs sm:text-sm font-bold whitespace-nowrap transition-all border-b-2 ${
              activeTab === 'onboarding'
                ? 'border-emerald-600 text-emerald-900'
                : 'border-transparent text-[#6A7865] hover:text-[#283824]'
            }`}
          >
            ۳. جریان راه‌اندازی و دعوت نقش‌ها
          </button>
          <button
            onClick={() => setActiveTab('multi_clinic')}
            className={`pb-3.5 px-4 text-xs sm:text-sm font-bold whitespace-nowrap transition-all border-b-2 ${
              activeTab === 'multi_clinic'
                ? 'border-emerald-600 text-emerald-900'
                : 'border-transparent text-[#6A7865] hover:text-[#283824]'
            }`}
          >
            ۴. معماری چندکلینیکی و رکورد فعال
          </button>
        </div>
      </section>

      {/* Tab 1: Services List */}
      {activeTab === 'overview' && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fadeIn">
          <div className="mb-6">
            <h3 className="text-xl font-black text-[#1E271C]">خدمات رسمی کلینیک دامپزشکی مهرگان اصفهان</h3>
            <p className="text-xs text-[#5C6F56] mt-1">کلیه خدمات مطابق با استانداردهای نظام دامپزشکی و تحت نظارت مستقیم متخصصان ارائه می‌گردد.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {clinicServices.map((srv, index) => {
              const IconComp = srv.icon;
              return (
                <div
                  key={index}
                  className="p-5 rounded-2xl bg-white border border-[#E5E9DE] hover:border-emerald-400 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-[#1E271C] group-hover:text-emerald-900 transition-colors">{srv.title}</h4>
                      <p className="text-xs text-[#6A7A64] mt-1.5 leading-relaxed">{srv.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Map & Geospatial Location Section */}
          <div className="mt-8 bg-white rounded-3xl border border-[#E5E9DE] p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#EAEFE5]">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>موقعیت مکانی رسمی و تاییدشده روی نقشه (Google Maps Verified)</span>
                </div>
                <h3 className="text-lg font-black text-[#1E271C]">
                  {clinicName} — اصفهان (منطقه جلفا / توحید میانی)
                </h3>
                <p className="text-xs text-[#5C6F56] mt-1">
                  نقطه جغرافیایی دقیق برای مراجعین، خدمات ترانسفر، آمبولانس و تاکسی‌های اینترنتی (اسنپ / تپسی)
                </p>
              </div>

              {/* Coordinates Badge & Copy */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${CLINIC_LOCATION.coordinates.lat.toFixed(7)}, ${CLINIC_LOCATION.coordinates.lng.toFixed(7)}`);
                    alert('مختصات دقیق کلینیک در حافظه کپی شد: ' + CLINIC_LOCATION.taxiCoordinatesString);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#F0F4EC] hover:bg-[#E3EADc] text-[#243321] text-xs font-bold font-mono flex items-center gap-1.5 transition-all shadow-2xs"
                  title="کپی مختصات دقیق برای ثبت در اسنپ و تپسی"
                >
                  <Copy className="w-3.5 h-3.5 text-emerald-700" />
                  <span dir="ltr">{CLINIC_LOCATION.taxiCoordinatesString}</span>
                  <span className="text-[10px] text-[#6A7865] mr-1">کپی مختصات</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
              {/* Google Maps Embed Iframe */}
              <div className="lg:col-span-7 h-[360px] rounded-2xl overflow-hidden border border-[#DCE2D6] shadow-xs relative bg-[#E9EFE6]">
                <iframe
                  src={CLINIC_LOCATION.googleMapsEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  title="نقشه رسمی گوگل مپ کلینیک دامپزشکی مهرگان اصفهان"
                  className="w-full h-full"
                />
              </div>

              {/* Address Details & Navigation Routing */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-[#F8FAF6] border border-[#E3E8DC]">
                    <span className="text-[11px] font-bold text-emerald-800 block mb-1">نشانی دقیق کلینیک:</span>
                    <p className="text-xs font-bold text-[#1E271C] leading-relaxed">
                      {clinicAddress}
                    </p>
                    <div className="text-[11px] text-[#6A7A64] mt-2 flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>دسترسی آسان خودرویی و تاکسی از خیابان توحید میانی و خیابان شریعتی</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F8FAF6] border border-[#E3E8DC] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#6A7A64]">تلفن ثابت کلینیک:</span>
                      <span className="font-mono font-bold text-[#1E271C]" dir="ltr">031-36292278</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#6A7A64]">اورژانس و موبایل:</span>
                      <span className="font-mono font-bold text-emerald-700" dir="ltr">093021820044</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#6A7A64]">کد پستی ده رقمی:</span>
                      <span className="font-mono text-[#1E271C]" dir="ltr">۸۱۷۳۸-۹۴۱۱۱</span>
                    </div>
                  </div>
                </div>

                {/* Direct Navigation App Links */}
                <div>
                  <span className="text-[11px] font-bold text-[#4B5E43] block mb-2">
                    مسیریابی مستقیم در اپلیکیشن‌های نقشه:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={CLINIC_LOCATION.googleMapsShortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-white border border-[#D5DDD0] hover:border-emerald-600 hover:bg-emerald-50/50 text-right transition-all flex items-center justify-between group shadow-2xs"
                    >
                      <div>
                        <div className="text-xs font-bold text-[#1E271C] group-hover:text-emerald-900">گوگل مپ (Google Maps)</div>
                        <div className="text-[10px] text-[#738A6E]">مشاهده لوکیشن رسمی</div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-[#738A6E] group-hover:text-emerald-700" />
                    </a>

                    <a
                      href={CLINIC_LOCATION.neshanUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-white border border-[#D5DDD0] hover:border-blue-600 hover:bg-blue-50/50 text-right transition-all flex items-center justify-between group shadow-2xs"
                    >
                      <div>
                        <div className="text-xs font-bold text-[#1E271C] group-hover:text-blue-900">مسیریاب نشان</div>
                        <div className="text-[10px] text-[#738A6E]">هدایت صوتی راننده</div>
                      </div>
                      <Navigation className="w-3.5 h-3.5 text-[#738A6E] group-hover:text-blue-700" />
                    </a>

                    <a
                      href={CLINIC_LOCATION.baladUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-white border border-[#D5DDD0] hover:border-emerald-600 hover:bg-emerald-50/50 text-right transition-all flex items-center justify-between group shadow-2xs"
                    >
                      <div>
                        <div className="text-xs font-bold text-[#1E271C] group-hover:text-emerald-900">مسیریاب بلد</div>
                        <div className="text-[10px] text-[#738A6E]">ترافیک زنده شهری</div>
                      </div>
                      <Navigation className="w-3.5 h-3.5 text-[#738A6E] group-hover:text-emerald-700" />
                    </a>

                    <a
                      href={CLINIC_LOCATION.wazeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-white border border-[#D5DDD0] hover:border-cyan-600 hover:bg-cyan-50/50 text-right transition-all flex items-center justify-between group shadow-2xs"
                    >
                      <div>
                        <div className="text-xs font-bold text-[#1E271C] group-hover:text-cyan-900">مسیریاب ویز (Waze)</div>
                        <div className="text-[10px] text-[#738A6E]">کوتاه‌ترین مسیر ممکن</div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-[#738A6E] group-hover:text-cyan-700" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Tab 2: Capabilities (Implemented vs Roadmap) */}
      {activeTab === 'roadmap' && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Category A: Implemented */}
            <div className="bg-white rounded-3xl border-2 border-emerald-600/30 p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">بخش اول</span>
                  <h3 className="text-lg font-black text-[#1E271C]">قابلیت‌های پیاده‌سازی‌شده و فعال (Production Ready)</h3>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  {
                    title: 'استقرار سه حالته واقعی (Local LAN / VPS Ubuntu / Google Cloud)',
                    desc: 'پشتیبانی از سرویس‌دهی روی ویندوز محلی کلینیک، سرور ابری VPS لینوکس، و سرویس‌های گوگل با سوئیچ آنلاین بدون قطعی.',
                  },
                  {
                    title: 'پایگاه داده واقعی دوگانه مقاوم (PostgreSQL + JSON Persistence)',
                    desc: 'ذخیره دائمی و اتمیک با کشینگ هوشمند و مکانیزم فال‌بک امن، پاکسازی داده‌های فرضی و جایگزینی داده رسمی مهرگان.',
                  },
                  {
                    title: 'معماری چندکلینیکی با جایگزینی رکورد فعال',
                    desc: 'جدول مستقل کلینیک‌ها؛ با فعال‌سازی هر کلینیک کلیه اطلاعات سایت، تلفن‌ها، خدمات و مدیر به صورت دینامیک جایگزین می‌شود.',
                  },
                  {
                    title: 'سامانه احراز هویت کنترل‌شده و دعوت‌نامه امن (RBAC)',
                    desc: 'ورود مجزای کارشناس IT؛ حذف پرسنل ساختگی؛ مکانیزم صدور دعوت‌نامه رسمی با توکن برای دکتر امین بیاتی و پرسنل.',
                  },
                  {
                    title: 'پرونده الکترونیک سلامت، ویزیت، نوبت‌دهی و واکسیناسیون',
                    desc: 'پذیرش بیماران، صدور کارت سلامت، یادآور واکسن و مدیریت جریان حضور در لابی کلینیک.',
                  },
                  {
                    title: 'حسابداری بالینی، پت‌شاپ اختصاصی و انبارداری',
                    desc: 'صدور فاکتور رسمی، اتصال بارکدخوان، تسویه‌حساب بیمه‌ای و مدیریت موجودی قفسه‌ها.',
                  },
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-[#F8FAF6] border border-[#E3E8DC]">
                    <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-emerald-950">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{item.title}</span>
                    </div>
                    <p className="text-xs text-[#5E7059] mt-1.5 mr-6 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Category B: Future Roadmap */}
            <div className="bg-white rounded-3xl border border-[#DFE3D8] p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">بخش دوم</span>
                  <h3 className="text-lg font-black text-[#1E271C]">نقشه راه و توسعه‌های آتی (Future Roadmap)</h3>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  {
                    title: 'هوش مصنوعی محلی Ollama به عنوان دستیار تریاژ بالینی',
                    desc: 'اجرای مدل‌های Llama/Mistral بر روی سخت‌افزار لوکال کلینیک (پورت ۱۱۴۳۴) جهت پردازش متن پرونده‌ها در زمان قطعی اینترنت.',
                  },
                  {
                    title: 'وب‌سوکت بلادرنگ سالن انتظار و مانیتورینگ اتاق عمل',
                    desc: 'نمایش زنده نوبت و تریاژ بیماران روی مانیتور سالن لابی و داشبورد دستیار جراح.',
                  },
                  {
                    title: 'اتصال پنل پیامک خدماتی کاوه‌نگار برای یادآور واکسن',
                    desc: 'ارسال خودکار پیامک یادآوری دوره واکسیناسیون و نوبت جراحی به شماره همراه سرپرست پت.',
                  },
                  {
                    title: 'ماژول اختصاصی تاکسی پت (اسنپ / تپسی)',
                    desc: 'ثبت و اعزام ترانسفر ویژه برای انتقال ایمن پت‌ها به کلینیک و بخش پانسیون.',
                  },
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/70">
                    <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-amber-950">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{item.title}</span>
                    </div>
                    <p className="text-xs text-[#6B5A42] mt-1.5 mr-6 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Tab 3: Onboarding Workflow Explanation */}
      {activeTab === 'onboarding' && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#E0E5DA] p-6 sm:p-10 shadow-xs">
            <div className="max-w-3xl mb-8">
              <h3 className="text-xl font-black text-[#1E271C]">جریان شروع و راه‌اندازی کلینیک (IT-First Onboarding)</h3>
              <p className="text-xs sm:text-sm text-[#5B6F57] mt-2 leading-relaxed">
                طبق پروتکل امنیتی، سیستم با پایگاه داده پاک و بدون هیچ پرسنل از پیش‌تعریف‌شده‌ای آغاز به‌کار می‌کند. کارشناس فناوری اطلاعات به عنوان نخستین کاربر وارد شده و مراحل دعوت رسمی را پیش می‌برد.
              </p>
            </div>

            {/* Workflow Steps Timeline */}
            <div className="space-y-6 relative before:absolute before:right-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-[#E0E5DA]">
              {/* Step 1 */}
              <div className="relative flex items-start gap-4 mr-2">
                <div className="w-9 h-9 rounded-full bg-[#283824] text-white flex items-center justify-center font-black text-xs shrink-0 z-10 shadow-sm">
                  ۱
                </div>
                <div className="bg-[#F8FAF6] p-5 rounded-2xl border border-[#E4E9DC] flex-1">
                  <h4 className="text-sm font-black text-[#1E271C]">ورود کارشناس فناوری اطلاعات (IT Developer)</h4>
                  <p className="text-xs text-[#5D6F59] mt-1.5 leading-relaxed">
                    کارشناس IT با نام کاربری اختصاصی (<code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold text-emerald-800" dir="ltr">admin</code> یا <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold text-emerald-800" dir="ltr">arjanak.p</code>) وارد سامانه می‌شود و صحت اتصال دیتابیس و سرویس‌ها را تایید می‌کند.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative flex items-start gap-4 mr-2">
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0 z-10 shadow-sm">
                  ۲
                </div>
                <div className="bg-[#F8FAF6] p-5 rounded-2xl border border-[#E4E9DC] flex-1">
                  <h4 className="text-sm font-black text-[#1E271C]">صدور دعوت‌نامه رسمی به مدیر ارشد (دکتر امین بیاتی)</h4>
                  <p className="text-xs text-[#5D6F59] mt-1.5 leading-relaxed">
                    کارشناس IT از طریق منوی مدیریت دعوت‌نامه، توکن امنیتی اختصاصی برای <strong className="font-bold text-[#1E271C]">دکتر امین بیاتی</strong> (به عنوان مدیر ارشد کلینیک و متخصص جراحی) صادر و لینک فعال‌سازی را ارسال می‌کند.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative flex items-start gap-4 mr-2">
                <div className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-xs shrink-0 z-10 shadow-sm">
                  ۳
                </div>
                <div className="bg-[#F8FAF6] p-5 rounded-2xl border border-[#E4E9DC] flex-1">
                  <h4 className="text-sm font-black text-[#1E271C]">پذیرش دعوت‌نامه و تأمین اطلاعات پایه بالینی</h4>
                  <p className="text-xs text-[#5D6F59] mt-1.5 leading-relaxed">
                    دکتر امین بیاتی لینک دعوت‌نامه را باز کرده، کلمه عبور خود را تنظیم نموده و شماره نظام دامپزشکی، مشخصات بیوگرافی و تخصص‌های جراحی را در سیستم نهایی می‌سازد.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative flex items-start gap-4 mr-2">
                <div className="w-9 h-9 rounded-full bg-emerald-800 text-white flex items-center justify-center font-black text-xs shrink-0 z-10 shadow-sm">
                  ۴
                </div>
                <div className="bg-[#F8FAF6] p-5 rounded-2xl border border-[#E4E9DC] flex-1">
                  <h4 className="text-sm font-black text-[#1E271C]">تکمیل نقش‌ها و دعوت کادر درمان توسط مدیر ارشد</h4>
                  <p className="text-xs text-[#5D6F59] mt-1.5 leading-relaxed">
                    پس از ورود مدیر ارشد، ایشان مطابق نیاز کلینیک نقش‌ها را تعریف کرده و برای دامپزشکان، پرسنل پذیرش، گرومر، مسئول پت‌شاپ و صندوقدار دعوت‌نامه صادر می‌نمایند.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[#E5E9DF] flex flex-wrap items-center justify-between gap-4">
              <span className="text-xs font-medium text-[#687863]">
                آماده شروع هستید؟ کارشناس IT می‌تواند بلافاصله لاگین کند.
              </span>
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-6 py-3 rounded-xl bg-[#283824] hover:bg-[#1E2A1B] text-white text-xs font-bold transition-colors"
              >
                ورود و آغاز فرآیند دعوت
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Tab 4: Multi-Clinic Architecture */}
      {activeTab === 'multi_clinic' && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#DFE3D8] p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-black text-[#1E271C]">مدیریت چندکلینیکی (Multi-Clinic Engine)</h3>
                <p className="text-xs text-[#5D7058] mt-1">
                  کلینیک انتخاب‌شده به عنوان «رکورد فعال»، کلیه اطلاعات هدر، فوتر، تماس‌ها و خدمات را تأمین و جایگزین می‌کند.
                </p>
              </div>
              <button
                onClick={() => setShowTemplateModal(true)}
                className="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-1.5 self-start transition-all"
              >
                <FileCode className="w-4 h-4 text-emerald-700" />
                <span>مشاهده قالب JSON کلینیک جدید</span>
              </button>
            </div>

            {/* Clinics List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clinics.map((c) => (
                <div
                  key={c.id}
                  className={`p-5 rounded-2xl border-2 transition-all relative ${
                    c.is_active
                      ? 'bg-emerald-50/40 border-emerald-600 ring-2 ring-emerald-500/20'
                      : 'bg-[#FBFBFA] border-[#E3E7DD] hover:border-slate-300'
                  }`}
                >
                  {c.is_active && (
                    <span className="absolute top-4 left-4 bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">
                      کلینیک فعال سیستم
                    </span>
                  )}
                  <h4 className="text-sm font-black text-[#1E271C]">{c.clinic_name}</h4>
                  <p className="text-xs text-emerald-800 font-bold mt-1">مدیر: {c.manager}</p>
                  <p className="text-xs text-[#6A7864] mt-2 flex items-start gap-1.5 leading-relaxed">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                    <span>{c.address}</span>
                  </p>
                  <div className="mt-4 pt-3 border-t border-[#E5E9DE] flex items-center justify-between">
                    <span className="text-[11px] text-[#6A7A64] font-medium">{c.services?.length || 0} خدمت تعریف‌شده</span>
                    {!c.is_active ? (
                      <button
                        onClick={() => handleActivateClinic(c.id)}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all"
                      >
                        انتخاب به عنوان کلینیک فعال
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>در حال سرویس‌دهی</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="mt-16 bg-[#1F2B1C] text-[#D3E0CE] border-t border-[#2A3B26] pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-[#2C3D27]">
            <div>
              <div className="flex items-center gap-2.5 text-white font-black text-base">
                <Stethoscope className="w-5 h-5 text-emerald-400" />
                <span>{clinicName}</span>
              </div>
              <p className="text-xs text-[#9BB195] mt-3 leading-relaxed">
                مرکز فوق‌تخصصی جراحی و مراقبت‌های بالینی حیوانات خانگی در اصفهان. تحت نظارت مستقیم {managerName}.
              </p>
              <div className="mt-4 text-xs text-emerald-300">
                اینستاگرام: <span dir="ltr" className="font-mono font-bold">@mehreganpetclinicesfahan</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider mb-3">اطلاعات تماس و نشانی</h4>
              <p className="text-xs text-[#B5C8AF] flex items-start gap-2 leading-relaxed">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{clinicAddress}</span>
              </p>
              <div className="mt-3 space-y-1 text-xs text-[#B5C8AF]" dir="ltr">
                {phoneNumbers.slice(0, 3).map((ph, idx) => (
                  <div key={idx} className="font-mono">{ph}</div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider mb-3">دسترسی‌های سریع</h4>
              <ul className="space-y-2 text-xs text-[#B5C8AF]">
                <li>
                  <button onClick={() => setShowLoginModal(true)} className="hover:text-emerald-300 transition-colors">
                    ورود کارشناس فناوری اطلاعات (IT)
                  </button>
                </li>
                <li>
                  <button onClick={() => setShowInviteAcceptModal(true)} className="hover:text-emerald-300 transition-colors">
                    پذیرش دعوت‌نامه و فعال‌سازی کادر درمان
                  </button>
                </li>
                <li>
                  <button onClick={() => setShowTemplateModal(true)} className="hover:text-emerald-300 transition-colors">
                    قالب استاندارد JSON برای ثبت کلینیک جدید
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#80997A]">
            <span>کلیه حقوق مادی و معنوی محفوظ و متعلق به {clinicName} می‌باشد.</span>
            <span className="mt-2 sm:mt-0 font-mono">Mehregan Clinic Architecture v2.5</span>
          </div>
        </div>
      </footer>

      {/* MODAL 1: IT Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-[#E1E5DC] shadow-2xl relative">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-6 left-6 text-slate-400 hover:text-slate-700 transition-colors"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-[#283824] text-white flex items-center justify-center">
                <Lock className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#1E271C]">ورود به سامانه مدیریت کلینیک</h3>
                <p className="text-xs text-[#5D6F59]">ویژه کارشناس IT جهت راه‌اندازی و مانیتورینگ</p>
              </div>
            </div>

            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl mb-4 font-bold">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2A3825] mb-1.5">
                  نام کاربری، ایمیل یا شماره تماس
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5DDD0] text-sm text-left focus:outline-hidden focus:border-emerald-600"
                  dir="ltr"
                  placeholder="admin or arjanak.p"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2A3825] mb-1.5">
                  کلمه عبور
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5DDD0] text-sm text-left focus:outline-hidden focus:border-emerald-600"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-[11px] text-emerald-900 leading-relaxed space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <strong>ورود مدیر کلینیک:</strong> دکتر امین بیاتی (<code className="font-mono font-bold" dir="ltr">dr.bayati</code>)
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUsername('dr.bayati');
                    }}
                    className="px-2.5 py-1 bg-[#4A6741] hover:bg-[#3D5535] text-white rounded-lg text-[10px] font-bold shrink-0 transition-colors cursor-pointer"
                  >
                    انتخاب مدیر کلینیک
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-emerald-200/60">
                  <div>
                    <strong>ورود کارشناس IT:</strong> (<code className="font-mono font-bold" dir="ltr">admin</code>)
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUsername('admin');
                    }}
                    className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold shrink-0 transition-colors cursor-pointer"
                  >
                    انتخاب کارشناس IT
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 rounded-xl bg-[#283824] hover:bg-[#1E2A1B] text-white font-bold text-xs sm:text-sm shadow-md transition-all disabled:opacity-50"
              >
                {isLoggingIn ? 'در حال ورود به سامانه...' : 'ورود به پنل کلینیک'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Invite Acceptance / Token Modal */}
      {showInviteAcceptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-[#E1E5DC] shadow-2xl relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setShowInviteAcceptModal(false)}
              className="absolute top-6 left-6 text-slate-400 hover:text-slate-700 transition-colors"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#1E271C]">پذیرش دعوت‌نامه کادر درمان و همکاران</h3>
                <p className="text-xs text-[#5D6F59]">فعال‌سازی حساب رسمی و تعیین کلمه عبور اختصاصی</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {pendingInvitations.length > 0 && (
                <div className="space-y-2.5">
                  <div className="text-xs font-black text-[#1E271C] flex items-center justify-between">
                    <span>دعوت‌نامه‌های رسمی فعال (یک کلیک جهت فعال‌سازی):</span>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                      {pendingInvitations.length} دعوت‌نامه در انتظار
                    </span>
                  </div>
                  <div className="space-y-2">
                    {pendingInvitations.map((inv) => {
                      const isBayati = inv.name?.includes('بیاتی') || inv.role === 'admin';
                      return (
                        <div
                          key={inv.token}
                          className={`p-3 rounded-2xl border flex items-center justify-between gap-2.5 transition-all ${
                            isBayati
                              ? 'bg-emerald-50/90 border-emerald-300 shadow-xs'
                              : 'bg-stone-50/80 border-stone-200'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-[#1E271C] truncate">{inv.name}</span>
                              {isBayati && (
                                <span className="px-1.5 py-0.5 rounded-full bg-emerald-700 text-white text-[9px] font-bold shrink-0">
                                  مدیر ارشد کلینیک
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-[#5C6E57] mt-0.5 truncate">
                              {inv.role === 'admin'
                                ? 'مدیر ارشد و جراح کلینیک'
                                : inv.role === 'veterinarian'
                                ? 'دامپزشک و جراح'
                                : inv.role === 'receptionist'
                                ? 'مسئول پذیرش و نوبت‌دهی'
                                : inv.role === 'groomer'
                                ? 'متخصص آرایش و گرومینگ'
                                : inv.role}
                              {inv.phoneMasked ? ` • ${inv.phoneMasked}` : ''}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                const link = `${window.location.origin}?invite=${encodeURIComponent(inv.token)}`;
                                navigator.clipboard.writeText(link);
                                setCopiedPendingToken(inv.token);
                                setTimeout(() => setCopiedPendingToken(null), 2000);
                              }}
                              className="p-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-600 transition-colors"
                              title="کپی لینک مستقیم دعوت"
                            >
                              {copiedPendingToken === inv.token ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                window.location.search = `?invite=${encodeURIComponent(inv.token)}`;
                              }}
                              className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold transition-colors shadow-xs"
                            >
                              فعال‌سازی
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-[#E1E5DC]">
                <p className="text-xs text-[#5C6E57] leading-relaxed mb-2">
                  یا توکن دعوت‌نامه دریافتی را مستقیماً در کادر زیر وارد فرمایید:
                </p>

                <div className="space-y-2.5">
                  <input
                    type="text"
                    value={inviteTokenInput}
                    onChange={(e) => setInviteTokenInput(e.target.value)}
                    placeholder="توکن دعوت‌نامه را اینجا وارد کنید..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5DDD0] text-xs focus:outline-hidden focus:border-emerald-600"
                    dir="ltr"
                  />

                  <button
                    onClick={() => {
                      if (inviteTokenInput.trim()) {
                        window.location.search = `?invite=${encodeURIComponent(inviteTokenInput.trim())}`;
                      }
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#2D3A27] hover:bg-[#1E271C] text-white font-bold text-xs transition-colors"
                  >
                    تأیید و ورود به فرم ثبت‌نام کادر درمان
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: JSON Template for Other Clinic */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 border border-[#E1E5DC] shadow-2xl relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setShowTemplateModal(false)}
              className="absolute top-6 left-6 text-slate-400 hover:text-slate-700 transition-colors"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#1E271C]">قالب خام JSON جهت ثبت کلینیک دیگر</h3>
                <p className="text-xs text-[#5D6F59]">فرمت استاندارد چندکلینیکی مهرگان</p>
              </div>
            </div>

            <p className="text-xs text-[#5C6E57] mb-3 leading-relaxed">
              برای افزودن هر کلینیک تازه به سامانه، کافی است این فایل JSON را کپی و فیلدهای آن را با مشخصات مرکز جدید تکمیل فرمایید:
            </p>

            <div className="flex-1 overflow-auto bg-[#1E241D] text-emerald-300 p-4 rounded-2xl font-mono text-xs border border-white/10" dir="ltr">
              <pre>{JSON.stringify(emptyTemplate, null, 2)}</pre>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E5E9DE] flex items-center justify-between">
              <button
                onClick={handleCopyTemplate}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors"
              >
                {copiedTemplate ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedTemplate ? 'کپی شد!' : 'کپی قالب JSON'}</span>
              </button>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
