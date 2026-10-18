import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Lock,
  User,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Phone,
  Clock,
  Sparkles,
  AlertCircle,
  ExternalLink,
  Pause,
  Play,
  Heart,
  Calendar,
  Compass,
} from 'lucide-react';
import { apiClient } from '../services/apiClient';

interface SlideItem {
  id: string;
  name: string;
  title: string;
  subtitle: string;
  tag: string;
  image1920: string;
  image960: string;
  alt: string;
}

const SLIDES: SlideItem[] = [
  {
    id: 'dogs',
    name: 'سگ‌های وفادار',
    title: 'مراقبت بالینی پیشرفته با مهر و آرامش',
    subtitle: 'همراه شما در حفظ سلامت، شادابی و نشاط همراهان باوفایتان در محیطی تخصصی و گرم',
    tag: 'تخصصی داخلی و جراحی',
    image1920: '/media/landing/dog-play-01-1920.webp',
    image960: '/media/landing/dog-play-01-960.webp',
    alt: 'سگ‌های خانگی شاد در حال بازی و دویدن در فضای سبز',
  },
  {
    id: 'cat',
    name: 'گربه‌سانان خانگی',
    title: 'محیطی آرام، امن و اختصاصی برای گربه‌ها',
    subtitle: 'معاینات تشخیصی دقیق، دندان‌پزشکی، انگل‌تراپی و واکسیناسیون بدون استرس محیطی',
    tag: 'کلینیک آرام و بدون استرس',
    image1920: '/media/landing/cat-warm-02-1920.webp',
    image960: '/media/landing/cat-warm-02-960.webp',
    alt: 'گربه خانگی زیبا و آرام در فضای امن و گرم کلینیک',
  },
  {
    id: 'birds',
    name: 'پرندگان زینتی و اگزوتیک',
    title: 'بخش تخصصی پرندگان و طوطی‌سانان',
    subtitle: 'پایش سلامت، تعیین جنسیت، تغذیه اصولی و درمان اختصاصی طوطی برزیلی، عروس هلندی و مینا',
    tag: 'طب پرندگان زینتی',
    image1920: '/media/landing/birds-exotic-03-1920.webp',
    image960: '/media/landing/birds-exotic-03-960.webp',
    alt: 'طوطی برزیلی و عروس هلندی زیبا و شاداب روی شاخه طبیعی',
  },
  {
    id: 'rabbit',
    name: 'خرگوش و جوندگان',
    title: 'طب پیشگیرانه و دندان‌پزشکی پستانداران کوچک',
    subtitle: 'بررسی تخصصی رشد دندان‌ها، رژیم فیبر، جراحی و مراقبت‌های دوره‌ای خرگوش و خوکچه هندی',
    tag: 'سلامت پستانداران کوچک',
    image1920: '/media/landing/rabbit-playful-04-1920.webp',
    image960: '/media/landing/rabbit-playful-04-960.webp',
    alt: 'خرگوش خانگی پرانرژی و دوست‌داشتنی در چمنزار شبدر',
  },
  {
    id: 'turtle',
    name: 'لاک‌پشت و خزندگان',
    title: 'مراقبت‌های زیستی و درمانی خزندگان خانگی',
    subtitle: 'تنظیم دمایی و نوری، پایش پوسته، بررسی کلسیم و سلامت استخوانی لاک‌پشت‌های خانگی',
    tag: 'طب حیوانات خاص و خزندگان',
    image1920: '/media/landing/turtle-friendly-05-1920.webp',
    image960: '/media/landing/turtle-friendly-05-960.webp',
    alt: 'لاک‌پشت خانگی سالم در حال حرکت آرام روی سنگ‌های آفتاب‌گیر',
  },
  {
    id: 'squirrel',
    name: 'سنجاب و حیوانات خاص',
    title: 'تشخیص دقیق بالینی و رادیولوژی دیجیتال',
    subtitle: 'تجهیزات مدرن تصویربرداری تشخیصی و راهنمایی تخصصی نگهداری سالم حیوانات خانگی',
    tag: 'رادیولوژی و تصویربرداری دیجیتال',
    image1920: '/media/landing/squirrel-curious-06-1920.webp',
    image960: '/media/landing/squirrel-curious-06-960.webp',
    alt: 'سنجاب خانگی باهوش و کنجکاو در نور گرم طبیعی',
  },
];

interface PublicLandingPageProps {
  onLoginSuccess: (user: any, token: string) => void;
}

export const PublicLandingPage: React.FC<PublicLandingPageProps> = ({ onLoginSuccess }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Login form state
  const [username, setUsername] = useState('dr.bayati');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCardExpanded, setIsCardExpanded] = useState(true);

  // Temporary password change state
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePassError, setChangePassError] = useState<string | null>(null);
  const [isChangingPass, setIsChangingPass] = useState(false);

  const totalSlides = SLIDES.length;

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Slideshow auto-advance with tab visibility & prefers-reduced-motion checks
  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionQuery.matches || isPaused) return;

    let timer: NodeJS.Timeout;

    const startTimer = () => {
      timer = setInterval(() => {
        if (document.visibilityState === 'visible') {
          nextSlide();
        }
      }, 6000);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        clearInterval(timer);
      } else {
        startTimer();
      }
    };

    startTimer();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPaused, nextSlide]);

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 45) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    setTouchStartX(null);
  };

  // Login handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setLoginError('لطفاً نام کاربری و رمز عبور را وارد فرمایید.');
      return;
    }
    setLoginError(null);
    setIsSubmitting(true);

    try {
      const res = await apiClient.login(username.trim(), password);
      if (res.mustChangePassword) {
        setMustChangePassword(true);
        setTempToken(res.token);
        setIsSubmitting(false);
        return;
      }
      onLoginSuccess(res.user, res.token);
    } catch (err: any) {
      setLoginError(err.message || 'نام کاربری یا رمز عبور اشتباه است.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Change password handler
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setChangePassError('رمز عبور جدید باید حداقل ۸ نویسه باشد.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangePassError('تکرار رمز عبور با رمز جدید همخوانی ندارد.');
      return;
    }

    setChangePassError(null);
    setIsChangingPass(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tempToken}`,
        },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در ثبت رمز عبور جدید');
      }

      const loginRes = await apiClient.login(username.trim(), newPassword);
      onLoginSuccess(loginRes.user, loginRes.token);
    } catch (err: any) {
      setChangePassError(err.message || 'خطا در تغییر رمز عبور.');
    } finally {
      setIsChangingPass(false);
    }
  };

  const activeSlide = SLIDES[currentSlide];

  return (
    <main
      className="relative w-full h-screen min-h-[640px] overflow-hidden bg-slate-950 text-white font-sans select-none"
      dir="rtl"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="صفحه اصلی کلینیک اختصاصی حیوانات خانگی مهرگان"
    >
      {/* Background Slideshow Layer */}
      <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        {SLIDES.map((slide, index) => {
          const isActive = index === currentSlide;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 pointer-events-auto z-10' : 'opacity-0 pointer-events-none z-0'
              }`}
            >
              <picture>
                <source
                  media="(min-width: 1024px)"
                  srcSet={slide.image1920}
                  type="image/webp"
                />
                <source
                  media="(max-width: 1023px)"
                  srcSet={slide.image960}
                  type="image/webp"
                />
                <img
                  src={slide.image1920}
                  alt={slide.alt}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center transform scale-105 transition-transform duration-10000 ease-out"
                />
              </picture>
            </div>
          );
        })}

        {/* Cinematic Dual Dark Overlays for Extreme Legibility & Warm Depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/40 z-20 pointer-events-none" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-slate-950/50 to-slate-950/80 z-20 pointer-events-none" />
      </div>

      {/* Top Header Bar: Clean Branding & Quick Links */}
      <header className="relative z-30 w-full px-6 py-5 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 p-0.5 shadow-lg shadow-emerald-950/50 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Heart className="w-5 h-5 text-emerald-400 fill-emerald-400" />
            </div>
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-black tracking-tight text-white drop-shadow-md">
              کلینیک اختصاصی حیوانات خانگی مهرگان
            </h1>
            <p className="text-xs text-emerald-300/90 font-medium">
              مرکز تشخیصی، درمانی و جراحی تخصصی حیوانات خانگی اصفهان
            </p>
          </div>
        </div>

        {/* Header Badges & Guardian Portal Link */}
        <div className="flex items-center gap-3">
          <a
            href="/guardian-portal"
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-emerald-500/20 border border-white/20 text-xs font-bold text-white transition-all backdrop-blur-md shadow-sm"
            title="ورود به پورتال اختصاصی سرپرستان و مشاهده تصاویر رادیوگرافی"
          >
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>پورتال اختصاصی سرپرستان</span>
          </a>
          <button
            onClick={() => setIsPaused((prev) => !prev)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white/80 hover:text-white transition-all backdrop-blur-md"
            title={isPaused ? 'ادامه اسلایدشو' : 'توقف موقت اسلایدشو'}
            aria-label={isPaused ? 'پخش خودکار اسلایدها' : 'توقف خودکار اسلایدها'}
          >
            {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Center Left Visual Content: Bold Typography & Clinic Details */}
      <section
        className="relative z-30 max-w-2xl px-6 md:px-12 pt-8 md:pt-14 pb-24 md:pb-32 flex flex-col justify-end min-h-[calc(100vh-180px)] pointer-events-none"
        aria-live="polite"
      >
        <div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold backdrop-blur-md mb-4 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>{activeSlide.tag}</span>
        </div>

        <h2 className="text-3xl md:text-5xl font-black text-white leading-tight md:leading-[1.25] tracking-tight drop-shadow-lg mb-4">
          {activeSlide.title}
        </h2>

        <p className="text-base md:text-lg text-slate-200/90 leading-relaxed font-normal drop-shadow-md mb-6 max-w-xl">
          {activeSlide.subtitle}
        </p>

        {/* Address and Contact Block */}
        <div className="pointer-events-auto bg-slate-900/70 border border-white/15 backdrop-blur-md rounded-2xl p-4 md:p-5 max-w-xl shadow-xl flex flex-col gap-2.5">
          <div className="flex items-start gap-2.5 text-xs md:text-sm text-slate-200">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>اصفهان، خیابان توحید میانی، حدفاصل مهرداد و شریعتی، کوچه ۲۲ (مشکلانی)</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-slate-300 pt-1 border-t border-white/10">
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-semibold text-white dir-ltr">۰۳۱-۳۶۲۹۲۲۷۸</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>پشتیبانی:</span>
              <span className="font-semibold text-white dir-ltr">۰۹۳۰۲۱۸۲۰۰۴۴</span>
            </div>
            <a
              href="https://neshan.org/maps/@32.6331396,51.6532624,17z"
              target="_blank"
              rel="noopener noreferrer"
              className="mr-auto inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-bold transition-colors"
            >
              <span>مسیریابی نشان</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Slideshow Progress Indicators & Controls */}
        <div className="pointer-events-auto mt-6 flex items-center gap-3">
          <button
            onClick={prevSlide}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all backdrop-blur-md active:scale-95"
            aria-label="اسلاید قبلی"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2" role="tablist">
            {SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                role="tab"
                aria-selected={idx === currentSlide}
                aria-label={`اسلاید ${idx + 1}: ${slide.name}`}
                onClick={() => setCurrentSlide(idx)}
                className={`transition-all duration-300 rounded-full h-2 ${
                  idx === currentSlide
                    ? 'w-8 bg-emerald-400 shadow-sm shadow-emerald-400/50'
                    : 'w-2 bg-white/30 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
          <button
            onClick={nextSlide}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all backdrop-blur-md active:scale-95"
            aria-label="اسلاید بعدی"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs text-slate-400 font-mono mr-2">
            ۰{currentSlide + 1} / ۰{totalSlides}
          </span>
        </div>
      </section>

      {/* Physical Right & Bottom Docked Login Control (Creative Glassmorphism Card) */}
      <aside
        style={{ left: '1.75rem', bottom: '1.75rem' }}
        className="fixed z-40 w-[380px] max-w-[calc(100vw-2rem)] md:max-w-[400px] right-auto top-auto"
        aria-label="بخش ورود پرسنل و کادر درمان"
      >
        <div className="bg-slate-950/85 hover:bg-slate-950/92 border border-emerald-500/30 backdrop-blur-2xl rounded-3xl p-5 md:p-6 shadow-2xl shadow-slate-950/80 transition-all duration-300">
          <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">ورود کادر کلینیک و پزشکان</h3>
                <p className="text-[11px] text-slate-400">سامانه یکپارچه پرونده و درمان</p>
              </div>
            </div>

            <button
              onClick={() => setIsCardExpanded((prev) => !prev)}
              className="text-xs font-bold text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
              aria-expanded={isCardExpanded}
            >
              {isCardExpanded ? 'جمع‌کردن' : 'بازکردن'}
            </button>
          </div>

          {isCardExpanded && (
            <>
              {loginError && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-3.5" noValidate>
                <div>
                  <label
                    htmlFor="clinic-username"
                    className="block text-xs font-bold text-slate-300 mb-1.5"
                  >
                    نام کاربری یا کدملی
                  </label>
                  <div className="relative">
                    <input
                      id="clinic-username"
                      type="text"
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="مثال: dr.bayati"
                      required
                      className="w-full h-11 pl-3 pr-10 rounded-xl bg-slate-900/80 border border-white/20 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all font-mono dir-ltr text-right"
                    />
                    <User className="absolute left-3 top-3 w-5 h-5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="clinic-password"
                    className="block text-xs font-bold text-slate-300 mb-1.5"
                  >
                    کلمه عبور
                  </label>
                  <div className="relative">
                    <input
                      id="clinic-password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full h-11 pl-3 pr-10 rounded-xl bg-slate-900/80 border border-white/20 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all font-mono dir-ltr text-right"
                    />
                    <KeyRound className="absolute left-3 top-3 w-5 h-5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Submit Button (At least 48px height per accessibility requirements) */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>در حال احراز هویت...</span>
                    </>
                  ) : (
                    <>
                      <span>ورود به سامانه کلینیک</span>
                      <ArrowRight className="w-4 h-4 rotate-180" />
                    </>
                  )}
                </button>
              </form>

              {/* Quick Role Fillers for Easy Testing */}
              <div className="mt-3.5 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
                <span>حساب‌های آزمون:</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setUsername('dr.bayati');
                      setPassword('mpc-bootstrap-2026-secure-token-x7k9m2');
                    }}
                    className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 text-emerald-300 font-mono transition-colors"
                    title="مدیر کلینیک"
                  >
                    dr.bayati
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUsername('admin');
                      setPassword('mpc-bootstrap-2026-secure-token-x7k9m2');
                    }}
                    className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 text-teal-300 font-mono transition-colors"
                    title="کارشناس IT"
                  >
                    admin
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUsername('doctor.mehregan');
                      setPassword('mpc-bootstrap-2026-secure-token-x7k9m2');
                    }}
                    className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 text-slate-300 font-mono transition-colors"
                    title="پزشک کشیک"
                  >
                    doctor
                  </button>
                </div>
              </div>

              {/* Guardian Portal Direct Link in Footer */}
              <div className="mt-2 text-center">
                <a
                  href="/guardian-portal"
                  className="text-[11px] text-emerald-400/90 hover:text-emerald-300 font-semibold underline underline-offset-4"
                >
                  سرپرست بیمار هستید؟ مشاهده آنلاین گرافی و پرونده
                </a>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Force Password Change Modal */}
      {mustChangePassword && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black">الزام تغییر رمز عبور موقت</h3>
                <p className="text-xs text-slate-400">لطفاً برای ادامه رمز جدید خود را تعیین فرمایید.</p>
              </div>
            </div>

            {changePassError && (
              <div
                role="alert"
                aria-live="assertive"
                className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{changePassError}</span>
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">رمز عبور جدید</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="حداقل ۸ نویسه"
                  required
                  className="w-full h-11 px-3 rounded-xl bg-slate-950 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">تکرار رمز عبور جدید</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="تکرار رمز عبور جدید"
                  required
                  className="w-full h-11 px-3 rounded-xl bg-slate-950 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMustChangePassword(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/20 text-slate-300 hover:text-white text-xs font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isChangingPass}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-900/50 flex items-center gap-2"
                >
                  {isChangingPass ? 'در حال ثبت...' : 'ثبت رمز و ورود'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

