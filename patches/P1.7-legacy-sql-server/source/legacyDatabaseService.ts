/**
 * Legacy Database Service
 * Manages connections and data synchronization with legacy clinic databases:
 * 1. dam2000: Pet files, owners, vaccination history, and medical records
 * 2. Parsian1405: Parsian financial accounting, invoices, person ledgers, and goods inventory
 * Host: ncase3 (Windows Local LAN)
 */

export interface LegacyDbConnectionConfig {
  fullConnectionString: string;
  host: string;
  userId: string;
  password?: string;
  dam2000: {
    catalog: string;
    provider: string;
    role: string;
    status: 'connected' | 'disconnected' | 'testing' | 'unconfigured';
    tableCount: number;
    lastSync?: string;
    errorMessage?: string;
  };
  parsian1405: {
    catalog: string;
    provider: string;
    role: string;
    status: 'connected' | 'disconnected' | 'testing' | 'unconfigured';
    tableCount: number;
    lastSync?: string;
    errorMessage?: string;
  };
}

export interface LegacyTableMetadata {
  tableName: string;
  persianLabel: string;
  description: string;
  database: 'dam2000' | 'Parsian1405';
  targetEntity: 'pets' | 'owners' | 'vaccinations' | 'visits' | 'invoices' | 'products' | 'accounting';
  rowCount: number;
  columns: Array<{
    name: string;
    dataType: string;
    isPrimaryKey: boolean;
    sampleValue: string;
  }>;
}

export const DEFAULT_LEGACY_CONNECTION_STRINGS =
  'Provider=SQLOLEDB.1;Persist Security Info=False;User ID=sa;Initial Catalog=dam2000;Data Source=ncase3;|Provider=SQLOLEDB.1;Persist Security Info=False;User ID=sa;Initial Catalog=Parsian1405;Data Source=ncase3;';

export function parseCompoundConnectionStrings(compoundStr: string): {
  damStr: string;
  parsianStr: string;
  host: string;
  userId: string;
} {
  const parts = compoundStr.split('|').map((s) => s.trim()).filter(Boolean);
  const damStr =
    parts.find((p) => p.includes('dam2000')) ||
    'Provider=SQLOLEDB.1;Persist Security Info=False;User ID=sa;Initial Catalog=dam2000;Data Source=ncase3;';
  const parsianStr =
    parts.find((p) => p.includes('Parsian1405')) ||
    'Provider=SQLOLEDB.1;Persist Security Info=False;User ID=sa;Initial Catalog=Parsian1405;Data Source=ncase3;';

  let host = 'ncase3';
  let userId = 'sa';

  const hostMatch = damStr.match(/Data Source=([^;]+)/i) || parsianStr.match(/Data Source=([^;]+)/i);
  if (hostMatch) host = hostMatch[1];

  const userMatch = damStr.match(/User ID=([^;]+)/i) || parsianStr.match(/User ID=([^;]+)/i);
  if (userMatch) userId = userMatch[1];

  return { damStr, parsianStr, host, userId };
}

export const DAM2000_TABLES: LegacyTableMetadata[] = [
  {
    tableName: 'tbl_Patients',
    persianLabel: 'پرونده بیماران و حیوانات',
    description: 'مشخصات کامل پت‌های ثبت‌شده در نرم‌افزار قدیمی دام۲۰۰۰ (نام، گونه، نژاد، میکروچیپ)',
    database: 'dam2000',
    targetEntity: 'pets',
    rowCount: 2450,
    columns: [
      { name: 'PatientID', dataType: 'int', isPrimaryKey: true, sampleValue: '1042' },
      { name: 'OwnerID_FK', dataType: 'int', isPrimaryKey: false, sampleValue: '815' },
      { name: 'PetName', dataType: 'nvarchar(50)', isPrimaryKey: false, sampleValue: 'لئو' },
      { name: 'AnimalType', dataType: 'nvarchar(30)', isPrimaryKey: false, sampleValue: 'سگ' },
      { name: 'Breed', dataType: 'nvarchar(50)', isPrimaryKey: false, sampleValue: 'شیتزو تریر' },
      { name: 'BirthDate', dataType: 'varchar(20)', isPrimaryKey: false, sampleValue: '1400/06/15' },
      { name: 'Sex', dataType: 'nvarchar(15)', isPrimaryKey: false, sampleValue: 'نر' },
      { name: 'MicrochipNumber', dataType: 'varchar(50)', isPrimaryKey: false, sampleValue: '900182000412354' },
    ],
  },
  {
    tableName: 'tbl_Owners',
    persianLabel: 'صاحبان و مراجعین',
    description: 'اطلاعات هویتی و شماره‌های تماس مشتریان کلینیک در دام۲۰۰۰',
    database: 'dam2000',
    targetEntity: 'owners',
    rowCount: 1890,
    columns: [
      { name: 'OwnerID', dataType: 'int', isPrimaryKey: true, sampleValue: '815' },
      { name: 'FullName', dataType: 'nvarchar(100)', isPrimaryKey: false, sampleValue: 'حمیدرضا صالحی' },
      { name: 'MobileNumber', dataType: 'varchar(15)', isPrimaryKey: false, sampleValue: '09133115509' },
      { name: 'NationalCode', dataType: 'varchar(10)', isPrimaryKey: false, sampleValue: '1289456721' },
      { name: 'Address', dataType: 'nvarchar(255)', isPrimaryKey: false, sampleValue: 'اصفهان، خ توحید میانی' },
      { name: 'RegistrationDate', dataType: 'varchar(10)', isPrimaryKey: false, sampleValue: '1399/04/20' },
    ],
  },
  {
    tableName: 'tbl_Vaccinations',
    persianLabel: 'تاریخچه واکسیناسیون و هاری',
    description: 'سوابق کامل تزریقات واکسن‌های چندگانه، هاری، برونشیت و تاریخ‌های یادآور',
    database: 'dam2000',
    targetEntity: 'vaccinations',
    rowCount: 4120,
    columns: [
      { name: 'VaccineID', dataType: 'int', isPrimaryKey: true, sampleValue: '5201' },
      { name: 'PatientID_FK', dataType: 'int', isPrimaryKey: false, sampleValue: '1042' },
      { name: 'VaccineName', dataType: 'nvarchar(100)', isPrimaryKey: false, sampleValue: 'واکسن هفت‌گانه سگ (Nobivac DHPPi)' },
      { name: 'InjectionDate', dataType: 'varchar(10)', isPrimaryKey: false, sampleValue: '1402/10/12' },
      { name: 'NextDueDate', dataType: 'varchar(10)', isPrimaryKey: false, sampleValue: '1403/10/12' },
      { name: 'Veterinarian', dataType: 'nvarchar(100)', isPrimaryKey: false, sampleValue: 'دکتر امین بیاتی' },
      { name: 'BatchNumber', dataType: 'varchar(50)', isPrimaryKey: false, sampleValue: 'A512B01' },
    ],
  },
  {
    tableName: 'tbl_Visits',
    persianLabel: 'سوابق معاینات و پرونده‌های درمانی',
    description: 'تاریخچه مراجعات، علائم بالینی، تشخیص بیماری‌ها و نسخ دارویی',
    database: 'dam2000',
    targetEntity: 'visits',
    rowCount: 5630,
    columns: [
      { name: 'VisitID', dataType: 'bigint', isPrimaryKey: true, sampleValue: '9840' },
      { name: 'PatientID_FK', dataType: 'int', isPrimaryKey: false, sampleValue: '1042' },
      { name: 'VisitDate', dataType: 'varchar(10)', isPrimaryKey: false, sampleValue: '1402/11/04' },
      { name: 'ChiefComplaint', dataType: 'nvarchar(max)', isPrimaryKey: false, sampleValue: 'بی‌اشتهایی و استفراغ دوره‌ای' },
      { name: 'Diagnosis', dataType: 'nvarchar(max)', isPrimaryKey: false, sampleValue: 'گاستریت حاد ناشی از تغییر جیره غذایی' },
      { name: 'Treatment', dataType: 'nvarchar(max)', isPrimaryKey: false, sampleValue: 'سرم رینگر + آمپول متوکلوپرامید + قرص فاموتیدین' },
      { name: 'Fee', dataType: 'decimal(18,0)', isPrimaryKey: false, sampleValue: '480000' },
    ],
  },
];

export const PARSIAN1405_TABLES: LegacyTableMetadata[] = [
  {
    tableName: 'tbl_Factors',
    persianLabel: 'فاکتورهای فروش و خدمات پارسیان',
    description: 'کلیه فاکتورهای صادره سال مالی ۱۴۰۵، مبالغ، تخفیفات و وضعیت تسویه',
    database: 'Parsian1405',
    targetEntity: 'invoices',
    rowCount: 3240,
    columns: [
      { name: 'FactorNumber', dataType: 'int', isPrimaryKey: true, sampleValue: '1405102' },
      { name: 'FactorDate', dataType: 'varchar(10)', isPrimaryKey: false, sampleValue: '1405/04/18' },
      { name: 'PersonID_FK', dataType: 'int', isPrimaryKey: false, sampleValue: '702' },
      { name: 'TotalAmountRials', dataType: 'bigint', isPrimaryKey: false, sampleValue: '18500000' },
      { name: 'DiscountRials', dataType: 'bigint', isPrimaryKey: false, sampleValue: '500000' },
      { name: 'NetPayableRials', dataType: 'bigint', isPrimaryKey: false, sampleValue: '18000000' },
      { name: 'PaymentStatus', dataType: 'smallint', isPrimaryKey: false, sampleValue: '1' },
      { name: 'Description', dataType: 'nvarchar(255)', isPrimaryKey: false, sampleValue: 'ویزیت تخصصی + جراحی عقیم‌سازی' },
    ],
  },
  {
    tableName: 'tbl_Persons',
    persianLabel: 'اشخاص و مشتریان حسابداری',
    description: 'حساب‌های تفصیلی اشخاص، بدهکاران و بستانکاران در سیستم پارسیان ۱۴۰۵',
    database: 'Parsian1405',
    targetEntity: 'accounting',
    rowCount: 1420,
    columns: [
      { name: 'PersonCode', dataType: 'int', isPrimaryKey: true, sampleValue: '702' },
      { name: 'PersonTitle', dataType: 'nvarchar(100)', isPrimaryKey: false, sampleValue: 'خانم دکتر صادقی' },
      { name: 'PhoneNumber', dataType: 'varchar(20)', isPrimaryKey: false, sampleValue: '09132223344' },
      { name: 'AccountBalanceRials', dataType: 'bigint', isPrimaryKey: false, sampleValue: '-1500000' },
      { name: 'BalanceType', dataType: 'nvarchar(10)', isPrimaryKey: false, sampleValue: 'بدهکار' },
    ],
  },
  {
    tableName: 'tbl_Goods',
    persianLabel: 'کالاها و خدمات پت‌شاپ و داروخانه',
    description: 'کد کالا، بارکد، قیمت‌های خرید و فروش و موجودی فیزیکی انبار',
    database: 'Parsian1405',
    targetEntity: 'products',
    rowCount: 980,
    columns: [
      { name: 'GoodCode', dataType: 'int', isPrimaryKey: true, sampleValue: '3104' },
      { name: 'Barcode', dataType: 'varchar(50)', isPrimaryKey: false, sampleValue: '6260123456789' },
      { name: 'GoodName', dataType: 'nvarchar(150)', isPrimaryKey: false, sampleValue: 'غذای خشک رویال کنین رژیمی یورینری ۲ کیلویی' },
      { name: 'PurchasePriceRials', dataType: 'bigint', isPrimaryKey: false, sampleValue: '14500000' },
      { name: 'SalePriceRials', dataType: 'bigint', isPrimaryKey: false, sampleValue: '18500000' },
      { name: 'StockQuantity', dataType: 'int', isPrimaryKey: false, sampleValue: '28' },
    ],
  },
  {
    tableName: 'tbl_Sanad',
    persianLabel: 'اسناد دوبل مالی و دفتر روزنامه',
    description: 'سندهای حسابداری کلینیک، دریافت کارتخوان‌ها و پرداخت‌ها در پارسیان ۱۴۰۵',
    database: 'Parsian1405',
    targetEntity: 'accounting',
    rowCount: 4890,
    columns: [
      { name: 'SanadNumber', dataType: 'int', isPrimaryKey: true, sampleValue: '8401' },
      { name: 'SanadDate', dataType: 'varchar(10)', isPrimaryKey: false, sampleValue: '1405/04/18' },
      { name: 'BedAmount', dataType: 'bigint', isPrimaryKey: false, sampleValue: '18000000' },
      { name: 'BesAmount', dataType: 'bigint', isPrimaryKey: false, sampleValue: '18000000' },
      { name: 'Description', dataType: 'nvarchar(255)', isPrimaryKey: false, sampleValue: 'واریز پوز پاسارگاد بابت فاکتور ۱۴۰۵۱۰۲' },
    ],
  },
];
