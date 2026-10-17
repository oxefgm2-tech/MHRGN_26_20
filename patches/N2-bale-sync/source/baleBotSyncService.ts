import { CLINIC_LOCATION } from '../constants/clinicLocation';
import { WorkingHoursConfig, DEFAULT_WORKING_HOURS_CONFIG } from '../types';

export interface BaleAppointmentPayload {
  baleUserId: number | string;
  baleUsername?: string;
  baleName?: string;
  messageText: string;
  petName?: string;
  species?: string;
  ownerName?: string;
  ownerPhone?: string;
}

/**
 * Generate clinic_info.json structure for Bale Bot
 */
export function generateBaleClinicInfo(clinicProfile?: any) {
  return {
    name: clinicProfile?.clinicName || CLINIC_LOCATION.nameFa,
    address: clinicProfile?.address || CLINIC_LOCATION.address,
    phone: clinicProfile?.phone || CLINIC_LOCATION.phone,
    emergency_phone: clinicProfile?.emergencyPhone || CLINIC_LOCATION.emergencyPhone,
    description: clinicProfile?.description || 'مرکز تخصصی جراحی و خدمات تشخیصی حیوانات خانگی در اصفهان تحت نظارت دکتر امین بیاتی.',
    services_summary: [
      'جراحی‌های تخصصی بافت نرم و ارتوپدی',
      'بخش مراقبت‌های ویژه (ICU) و بستری اختصاصی',
      'آزمایشگاه تشخیصی هماتولوژی و بیوشیمی',
      'دندانپزشکی، جرم‌گیری اولتراسونیک و رادیوگرافی',
      'واکسیناسیون، انگل‌زدایی و صدور شناسنامه بین‌المللی',
      'پت‌شاپ، گرومینگ و آرایشگاه حیوانات خانگی',
    ],
    map_link: CLINIC_LOCATION.googleMapsShortUrl,
    neshan_link: CLINIC_LOCATION.neshanUrl,
    balad_link: CLINIC_LOCATION.baladUrl,
    coordinates: {
      latitude: CLINIC_LOCATION.coordinates.lat,
      longitude: CLINIC_LOCATION.coordinates.lng,
    },
  };
}

/**
 * Generate working_hours.json structure for Bale Bot based on WorkingHoursConfig
 */
export function generateBaleWorkingHours(workingConfig?: WorkingHoursConfig) {
  const cfg = workingConfig || DEFAULT_WORKING_HOURS_CONFIG;
  const med = cfg.sections.medical;
  const ps = cfg.sections.petshop;

  const schedule: Record<string, any> = {};
  const dayKeys: Array<keyof typeof med.days> = [
    'saturday',
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
  ];

  for (const day of dayKeys) {
    const medDay = med.days[day];
    const psDay = ps.days[day];
    schedule[day] = {
      medical: {
        enabled: med.enabled && medDay.enabled,
        windows: medDay.windows,
      },
      petshop: {
        enabled: ps.enabled && psDay.enabled,
        windows: psDay.windows,
      },
    };
  }

  return {
    enabled: cfg.enabled,
    timezone: cfg.timezone,
    schedule,
    sections: {
      medical: med,
      petshop: ps,
    },
    open_message: cfg.enabled
      ? '🟢 بخش درمانی و پت‌شاپ کلینیک مهرگان فعال و آماده خدمت‌رسانی است.'
      : '🔴 کلینیک در حال حاضر تعطیل است. در شرایط اورژانسی با شماره کشیک تماس حاصل فرمایید.',
    closed_message: '🔴 کلینیک در حال حاضر تعطیل است. در شرایط اورژانسی با شماره ۰۹۳۰۲۱۸۲۰۰۴۴ تماس حاصل فرمایید.',
    emergency_note: 'بخش مراقبت‌های ویژه (ICU) و اورژانس شبانه‌روزی با هماهنگی تلفنی فعال است.',
  };
}

/**
 * Generate menu.json structure for Bale Bot
 */
export function generateBaleMenuConfig(clinicName: string = CLINIC_NAME_DEFAULT) {
  return {
    welcome_message: `سلام به بازوی هوشمند {clinic_name} خوش آمدید 🐾\nجهت دریافت خدمات یا راهنمایی، یکی از گزینه‌های زیر را انتخاب کنید:`,
    main_menu: {
      buttons: [
        { text: '📅 نوبت‌دهی آنلاین', callback_data: 'appointment' },
        { text: '🏥 اطلاعات و نشانی کلینیک', callback_data: 'clinic_info' },
        { text: '📦 لیست خدمات و تعرفه‌ها', callback_data: 'services' },
        { text: '⏰ ساعات کاری کلینیک', callback_data: 'working_hours' },
        { text: '🤖 مشاوره هوشمند (AI)', callback_data: 'consultation' },
        { text: '👨‍⚕️ تماس با اپراتور کلینیک', callback_data: 'operator' },
        { text: '🚨 راهنمای فوری اورژانس', callback_data: 'emergency' },
      ],
    },
    back_button: {
      text: '🔙 بازگشت به منوی اصلی',
      callback_data: 'back_to_menu',
    },
  };
}

const CLINIC_NAME_DEFAULT = 'کلینیک دامپزشکی مهرگان';
