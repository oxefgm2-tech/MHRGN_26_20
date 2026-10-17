import React from 'react';
import {
  Mic,
  Camera,
  Bell,
  Wifi,
  Cloud,
  CheckCircle2,
  UserCheck,
  Shield,
  Clock,
  Sparkles,
  Car,
  Settings,
  ShieldCheck,
  Keyboard,
  Smartphone,
  LogOut,
  UserPlus,
  Menu,
} from 'lucide-react';
import { User, UserRole } from '../types';

interface NavbarProps {
  currentUser: User;
  onRoleChange: (role: UserRole) => void;
  onOpenVoiceSecretary: () => void;
  onOpenVisitorCamera: () => void;
  onToggleNotifications: () => void;
  unreadNotifsCount: number;
  clinicPresenceCount: number;
  onOpenSyncModal?: () => void;
  onOpenSnappTaxi?: () => void;
  onOpenClinicProfile?: () => void;
  onOpenAccessMatrix?: () => void;
  onOpenShortcuts?: () => void;
  onOpenMobileConnect?: () => void;
  onLogout?: () => void;
  onOpenUserProfile?: () => void;
  onOpenInviteUser?: () => void;
  recordCount?: number;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

const ROLE_TITLE_MAP: Record<string, string> = {
  admin: 'مدیر کلینیک',
  senior_veterinarian: 'دامپزشک ارشد و جراح',
  veterinarian: 'دامپزشک درمانگاه',
  receptionist: 'مسئول پذیرش و نوبت',
  groomer: 'استایلیست و گرومر',
  cashier: 'مسئول حسابداری و صندوق',
  petshop_sales: 'مشاور فروش پت‌شاپ',
  petshop_purchasing: 'مسئول خرید و انبار',
  it_developer: 'کارشناس ارشد IT',
  owner: 'سرپرست بیمار',
};

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onRoleChange,
  onOpenVoiceSecretary,
  onOpenVisitorCamera,
  onToggleNotifications,
  unreadNotifsCount,
  clinicPresenceCount,
  onOpenSyncModal,
  onOpenSnappTaxi,
  onOpenClinicProfile,
  onOpenAccessMatrix,
  onOpenShortcuts,
  onOpenMobileConnect,
  onLogout,
  onOpenUserProfile,
  onOpenInviteUser,
  recordCount,
  onToggleMobileMenu,
  isMobileMenuOpen,
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const [currentDateTime, setCurrentDateTime] = React.useState('');
  const [lanStatus, setLanStatus] = React.useState<{ ip: string; isReal: boolean; label: string }>({
    ip: '192.168.1.50',
    isReal: true,
    label: 'LAN فعال (192.168.1.50)',
  });

  React.useEffect(() => {
    fetch('/api/system/network-status')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const ip = data.realLanIp || data.configuredIp || '192.168.1.50';
          setLanStatus({
            ip,
            isReal: Boolean(data.isRealLocalLan),
            label: `LAN فعال (${ip})`,
          });
        }
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      setCurrentDateTime(`${dateStr} - ساعت ${timeStr}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const rolesList: { role: UserRole; title: string }[] = [
    { role: 'admin', title: 'مدیر کلینیک' },
    { role: 'it_developer', title: 'کارشناس آی‌تی و توسعه (ارژنک.پ)' },
    { role: 'veterinarian', title: 'دامپزشک' },
    { role: 'receptionist', title: 'پذیرش' },
    { role: 'groomer', title: 'آرایشگر' },
    { role: 'cashier', title: 'صندوقدار' },
    { role: 'petshop_purchasing', title: 'مسئول خرید پت‌شاپ' },
    { role: 'petshop_sales', title: 'مسئول فروش پت‌شاپ' },
    { role: 'owner', title: 'صاحب پت' },
  ];

  return (
    <header id="app-navbar" className="bg-white border-b border-[#E6E9DF] sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-3">
          
          {/* Left / Start: Mobile Menu Toggle & Branding */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile Hamburger Menu Toggle */}
            {onToggleMobileMenu && (
              <button
                type="button"
                id="btn-navbar-mobile-toggle"
                onClick={onToggleMobileMenu}
                className="lg:hidden p-2 -mr-1 rounded-xl text-[#2D3A27] hover:bg-[#F7F8F3] active:bg-[#E9EFE6] transition-colors cursor-pointer shrink-0"
                title="منوی اصلی سامانه"
                aria-label="باز کردن منو"
              >
                <Menu className="w-5 h-5 text-[#2D3A27]" />
              </button>
            )}

            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#4A6741] flex items-center justify-center text-white shadow-xs shrink-0">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className="font-black text-[#2D3A27] text-sm sm:text-base leading-none truncate">
                    <span className="sm:hidden">کلینیک مهرگان</span>
                    <span className="hidden sm:inline">کلینیک اختصاصی حیوانات خانگی مهرگان</span>
                  </h1>
                  <span className="hidden md:inline-block text-[10px] font-bold bg-[#E9EFE6] text-[#4A6741] px-2 py-0.5 rounded-full border border-[#D5DDD0] shrink-0">
                    نسخه جامع
                  </span>
                </div>
                <p className="text-[11px] text-[#5C7457] mt-0.5 hidden lg:block truncate">
                  اتاق عمل • استایلینگ • پت‌شاپ چندتب • اسنپ پت‌تاکسی • سرور محلی LAN
                </p>
              </div>
            </div>

            {/* Patients in clinic indicator (Tablet/Desktop) */}
            <div className="hidden xl:flex items-center gap-1.5 bg-[#F7F8F3] text-[#2D3A27] border border-[#E6E9DF] px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0">
              <span className="w-2 h-2 rounded-full bg-[#4A6741] animate-pulse"></span>
              <span>{clinicPresenceCount} بیمار حاضر در کلینیک</span>
            </div>
          </div>

          {/* Center: Quick Action Triggers (Hidden on Mobile & Small Tablet) */}
          <div className="hidden md:flex items-center gap-1.5 shrink-0">
            <button
              id="btn-voice-secretary-trigger"
              onClick={onOpenVoiceSecretary}
              className="group relative flex items-center gap-2 bg-[#4A6741] hover:bg-[#3D5535] text-white px-3.5 py-2 rounded-2xl font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
              title="منشی صوتی کلینیک (کلید میانبر: Alt+F2)"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>منشی صوتی</span>
            </button>

            {onOpenSnappTaxi && (
              <button
                id="btn-snapp-taxi-trigger"
                onClick={onOpenSnappTaxi}
                className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300 px-3 py-2 rounded-2xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                title="درخواست اعزام اسنپ پت‌تاکسی با راننده آموزش‌دیده"
              >
                <Car className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden lg:inline">اسنپ پت‌تاکسی</span>
              </button>
            )}

            {onOpenClinicProfile && (
              <button
                id="btn-clinic-profile-trigger"
                onClick={onOpenClinicProfile}
                className="flex items-center gap-1 bg-[#F7F8F3] hover:bg-[#E6E9DF] text-[#2D3A27] border border-[#E6E9DF] p-2 rounded-2xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                title="پیکربندی هویت کلینیک، پزشکان و پرسنل"
              >
                <Settings className="w-4 h-4 text-[#5C7457]" />
              </button>
            )}

            {onOpenAccessMatrix && (
              <button
                id="btn-rbac-matrix-trigger"
                onClick={onOpenAccessMatrix}
                className="flex items-center gap-1 bg-[#F7F8F3] hover:bg-[#E6E9DF] text-[#2D3A27] border border-[#E6E9DF] p-2 rounded-2xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                title="ماتریس دسترسی امنیتی RBAC و تفویض موقت"
              >
                <ShieldCheck className="w-4 h-4 text-[#5C7457]" />
              </button>
            )}

            {onOpenMobileConnect && (
              <button
                id="btn-mobile-connect-trigger"
                onClick={onOpenMobileConnect}
                className="flex items-center gap-1.5 bg-[#E9EFE6] hover:bg-[#D5DDD0] text-[#2D3A27] border border-[#D5DDD0] px-3 py-2 rounded-2xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                title="اتصال نسخه موبایل، تبلت و کلاینت ویندوز (PWA)"
              >
                <Smartphone className="w-3.5 h-3.5 text-[#4A6741]" />
                <span className="hidden xl:inline">اتصال موبایل</span>
              </button>
            )}

            {onOpenShortcuts && (
              <button
                id="btn-shortcuts-trigger"
                onClick={onOpenShortcuts}
                className="flex items-center gap-1 bg-[#F7F8F3] hover:bg-[#E6E9DF] text-[#2D3A27] border border-[#E6E9DF] p-2 rounded-2xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                title="کلیدهای میانبر سامانه"
              >
                <Keyboard className="w-4 h-4 text-[#5C7457]" />
              </button>
            )}
          </div>

          {/* Right: Network status, Role Switcher, Notifications, Time */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* LAN & Cloud status badges */}
            <div className="hidden xl:flex items-center gap-2 text-xs text-[#5C7457] bg-[#F7F8F3] px-2.5 py-1.5 rounded-xl border border-[#E6E9DF]">
              <button
                onClick={onOpenMobileConnect}
                className="flex items-center gap-1.5 text-[#4A6741] font-semibold hover:text-[#2D3A27] transition-colors cursor-pointer"
                title={`آدرس دسترسی در شبکه محلی: http://${lanStatus.ip}:3000`}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4A6741] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4A6741]"></span>
                </span>
                <Wifi className="w-3.5 h-3.5" />
                <span>{lanStatus.label}</span>
              </button>
              <span className="text-[#E6E9DF]">|</span>
              <button
                onClick={onOpenSyncModal}
                className="flex items-center gap-1 text-[#5C7457] hover:text-[#2D3A27] font-semibold cursor-pointer"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>همگام</span>
              </button>
            </div>

            {/* Notifications button */}
            <button
              id="btn-notifications-toggle"
              onClick={onToggleNotifications}
              className="relative p-2 text-[#5C7457] hover:text-[#2D3A27] hover:bg-[#F7F8F3] rounded-xl transition-colors cursor-pointer"
              title="اعلان‌ها و یادآوری‌ها"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#4A6741] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {/* Invite Colleague Button (Admin / IT Developer) */}
            {onOpenInviteUser && (
              <button
                id="btn-navbar-invite-user"
                type="button"
                onClick={onOpenInviteUser}
                className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                title="صدور دعوت‌نامه و جریان شروع کار کادر درمان"
              >
                <UserPlus className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden lg:inline">دعوت همکار</span>
              </button>
            )}

            {/* User Profile Badge */}
            <div
              id="user-profile-badge"
              onClick={onOpenUserProfile}
              className="flex items-center gap-1.5 sm:gap-2 bg-[#F7F8F3] hover:bg-[#E6E9DF] px-2 sm:px-3 py-1 sm:py-1.5 rounded-2xl border border-[#E6E9DF] cursor-pointer transition-colors"
              title="پروفایل کاربری"
            >
              <div className="w-7 h-7 sm:w-6 sm:h-6 rounded-full bg-[#4A6741] text-white flex items-center justify-center text-xs font-bold shadow-xs shrink-0">
                {currentUser.name ? currentUser.name.slice(0, 1) : 'م'}
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-bold text-[#2D3A27] leading-none truncate max-w-[120px]">{currentUser.name || 'مدیر کلینیک'}</span>
                <span className="text-[10px] text-[#5C7457] leading-tight mt-0.5 truncate max-w-[120px]">
                  {ROLE_TITLE_MAP[currentUser.role] || currentUser.role}
                </span>
              </div>
            </div>

            {/* Logout / Sign-out Button */}
            {onLogout && (
              <button
                id="btn-navbar-logout"
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                title="خروج از سامانه کلینیک مهرگان"
              >
                <LogOut className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="hidden md:inline">خروج</span>
              </button>
            )}

          </div>

        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn" dir="rtl">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-rose-100 relative text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <LogOut className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-[#2D3A27] mb-1.5">خروج از حساب کاربری</h3>
            <p className="text-xs text-[#5C7457] leading-relaxed mb-5">
              آیا مایلید از حساب کاربری <span className="font-bold text-[#2D3A27]">{currentUser.name || currentUser.username}</span> خارج شوید؟
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                انصراف و ادامه کار
              </button>
              <button
                type="button"
                id="btn-confirm-logout"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout?.();
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                بله، خروج از سیستم
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
