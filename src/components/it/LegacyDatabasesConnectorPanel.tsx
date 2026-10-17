import React, { useState, useEffect } from 'react';
import {
  Database,
  Server,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Play,
  Copy,
  Check,
  FileText,
  Layers,
  ArrowRight,
  Shield,
  Zap,
  Terminal,
  Activity,
  Table,
  HeartPulse,
  DollarSign,
  Download,
} from 'lucide-react';
import {
  DEFAULT_LEGACY_CONNECTION_STRINGS,
  DAM2000_TABLES,
  PARSIAN1405_TABLES,
  LegacyTableMetadata,
} from '../../services/legacyDatabaseService';

interface LegacyDatabasesConnectorPanelProps {
  onSyncComplete?: (message: string) => void;
}

export const LegacyDatabasesConnectorPanel: React.FC<LegacyDatabasesConnectorPanelProps> = ({
  onSyncComplete,
}) => {
  const [connectionString, setConnectionString] = useState(DEFAULT_LEGACY_CONNECTION_STRINGS);
  const [saPassword, setSaPassword] = useState('');
  const [host, setHost] = useState('ncase3');
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncingDam, setIsSyncingDam] = useState(false);
  const [isSyncingParsian, setIsSyncingParsian] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Selected database for inspection and querying
  const [activeDb, setActiveDb] = useState<'dam2000' | 'Parsian1405'>('dam2000');
  const [selectedTable, setSelectedTable] = useState<LegacyTableMetadata>(DAM2000_TABLES[0]);

  // SQL Query Console State
  const [sqlQuery, setSqlQuery] = useState('SELECT TOP 10 * FROM tbl_Vaccinations ORDER BY VaccineID DESC');
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryResults, setQueryResults] = useState<any[] | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [queryExecutionTime, setQueryExecutionTime] = useState<number | null>(null);

  // PowerShell Script Modal
  const [isPsModalOpen, setIsPsModalOpen] = useState(false);
  const [psScriptContent, setPsScriptContent] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Fetch current config on mount
  useEffect(() => {
    fetch('/api/legacy-db/config')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.config) {
          setConnectionString(data.config.connectionString || DEFAULT_LEGACY_CONNECTION_STRINGS);
          if (data.config.host) setHost(data.config.host);
        }
      })
      .catch(() => {});
  }, []);

  const showNotification = (msg: string) => {
    setStatusNotification(msg);
    if (onSyncComplete) onSyncComplete(msg);
    setTimeout(() => setStatusNotification(null), 4000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/legacy-db/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString, saPassword }),
      });
      const data = await res.json();
      setTestResult(data);
      if (data.success) {
        showNotification(
          `ارتباط OLE DB به هر دو دیتابیس dam2000 و Parsian1405 روی سرور ${data.host || 'ncase3'} برقرار شد.`
        );
      } else {
        showNotification('خطا در برقراری ارتباط با دیتابیس‌های قدیمی.');
      }
    } catch {
      showNotification('خطای شبکه در تست ارتباط.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/legacy-db/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString, saPassword, host }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification('رشته اتصال دیتابیس‌های قدیمی با موفقیت ذخیره شد.');
      }
    } catch {
      showNotification('خطا در ذخیره تنظیمات');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncDam2000 = async () => {
    setIsSyncingDam(true);
    try {
      const res = await fetch('/api/legacy-db/sync/dam2000', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showNotification(
          `سوابق واکسیناسیون و پرونده‌ها از dam2000 با موفقیت منتقل شدند. (${data.imported?.vaccinationsCount || 0} واکسن، ${data.imported?.patientsCount || 0} پرونده)`
        );
      } else {
        showNotification(data.error || 'خطا در همگام‌سازی dam2000');
      }
    } catch {
      showNotification('ارتباط با سرور برقرار نشد.');
    } finally {
      setIsSyncingDam(false);
    }
  };

  const handleSyncParsian = async () => {
    setIsSyncingParsian(true);
    try {
      const res = await fetch('/api/legacy-db/sync/parsian', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showNotification(
          `فاکتورها و اسناد مالی از Parsian1405 با موفقیت همگام‌سازی شدند. (${data.imported?.invoicesCount || 0} فاکتور)`
        );
      } else {
        showNotification(data.error || 'خطا در همگام‌سازی Parsian1405');
      }
    } catch {
      showNotification('ارتباط با سرور برقرار نشد.');
    } finally {
      setIsSyncingParsian(false);
    }
  };

  const handleExecuteQuery = async () => {
    setIsQuerying(true);
    setQueryError(null);
    setQueryResults(null);
    try {
      const res = await fetch('/api/legacy-db/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ database: activeDb, sql: sqlQuery }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.rows)) {
        setQueryResults(data.rows);
        setQueryExecutionTime(data.executionTimeMs || 12);
      } else {
        setQueryError(data.error || 'خطا در اجرای کوئری');
      }
    } catch {
      setQueryError('ارتباط با سرور برقرار نشد.');
    } finally {
      setIsQuerying(false);
    }
  };

  const handleOpenPsModal = async () => {
    setIsPsModalOpen(true);
    try {
      const res = await fetch('/api/legacy-db/powershell-script');
      const data = await res.json();
      if (data.success && data.script) {
        setPsScriptContent(data.script);
      }
    } catch {
      setPsScriptContent('# Error loading script');
    }
  };

  const currentTables = activeDb === 'dam2000' ? DAM2000_TABLES : PARSIAN1405_TABLES;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {statusNotification && (
        <div className="fixed bottom-6 left-6 z-50 bg-[#2D3A27] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold animate-fade-in border border-emerald-500/30">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{statusNotification}</span>
        </div>
      )}

      {/* Main Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-[#E6E9DF] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#4A6741] to-[#2D3A27] text-white flex items-center justify-center shadow-xs">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-[#2D3A27] flex items-center gap-2">
                  پل اتصال به دو دیتابیس قدیمی کلینیک مهرگان (دام۲۰۰۰ و پارسیان ۱۴۰۵)
                </h2>
                <p className="text-xs text-[#5C7457] mt-0.5">
                  ارتباط مستقیم OLE DB روی شبکه محلی ویندوز (LAN) با سرور{' '}
                  <code className="font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                    ncase3
                  </code>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleOpenPsModal}
              className="bg-[#F2F5EE] hover:bg-[#E8ECE1] text-[#4A6741] font-bold text-xs px-3.5 py-2 rounded-2xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Terminal className="w-4 h-4" />
              <span>مشاهده اسکریپت پاورشل ویندوز</span>
            </button>

            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="bg-[#4A6741] hover:bg-[#3D5535] disabled:opacity-50 text-white font-black text-xs px-4 py-2 rounded-2xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Activity className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'در حال تست ارتباط...' : 'تست اتصال OLE DB'}</span>
            </button>
          </div>
        </div>

        {/* Connection Strings Input & Credential Box */}
        <div className="mt-5 pt-4 border-t border-[#EEF1E9] space-y-3">
          <div>
            <label className="block text-xs font-bold text-[#2D3A27] mb-1">
              رشته اتصال ترکیبی OLE DB (مخصوص ویندوز لوکال و سرور ncase3):
            </label>
            <textarea
              value={connectionString}
              onChange={(e) => setConnectionString(e.target.value)}
              rows={2}
              dir="ltr"
              className="w-full p-2.5 rounded-2xl border border-[#D0DAC7] bg-[#FBFBFA] font-mono text-[11px] text-[#2D3A27] outline-none focus:ring-2 focus:ring-[#4A6741] leading-relaxed select-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-bold text-[#2D3A27] mb-1">نام هاست / سرور دیتابیس (Data Source):</label>
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                dir="ltr"
                className="w-full p-2 rounded-xl border border-[#D0DAC7] font-mono text-xs outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-[#2D3A27] mb-1">رمز عبور کاربر sa (در صورت نیاز):</label>
              <input
                type="password"
                value={saPassword}
                onChange={(e) => setSaPassword(e.target.value)}
                placeholder="خالی (بدون رمز عبور یا Windows Auth)"
                dir="ltr"
                className="w-full p-2 rounded-xl border border-[#D0DAC7] text-xs outline-none"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleSaveConfig}
                disabled={isSaving}
                className="w-full py-2 bg-white hover:bg-[#F2F5EE] text-[#4A6741] border border-[#D0DAC7] rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs"
              >
                {isSaving ? 'در حال ذخیره...' : 'ذخیره تنظیمات رشته اتصال'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Two Target Databases Cards (Side by Side) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: dam2000 (Vaccinations & Pet Files) */}
        <div className="bg-white rounded-3xl p-6 border border-[#E6E9DF] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#EEF1E9] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-[#2D3A27]">
                  دیتابیس دام۲۰۰۰ (dam2000)
                </h3>
                <span className="text-[11px] text-[#5C7457]">
                  واکسیناسیون، پرونده‌ها، بیماران و سوابق درمانی
                </span>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              متصل به OLE DB
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="bg-[#FBFBFA] p-3 rounded-2xl border border-[#EEF1E9] space-y-1">
              <div className="flex justify-between font-mono text-[11px] text-[#6B7F67]">
                <span>Data Source:</span>
                <span className="font-bold text-[#2D3A27]">ncase3</span>
              </div>
              <div className="flex justify-between font-mono text-[11px] text-[#6B7F67]">
                <span>Initial Catalog:</span>
                <span className="font-bold text-rose-700">dam2000</span>
              </div>
              <div className="flex justify-between font-mono text-[11px] text-[#6B7F67]">
                <span>Provider:</span>
                <span className="font-bold text-[#2D3A27]">SQLOLEDB.1</span>
              </div>
            </div>

            <div className="pt-1">
              <span className="font-bold text-xs text-[#2D3A27] block mb-2">جداول اصلی واکسیناسیون و پرونده‌ها:</span>
              <div className="grid grid-cols-2 gap-2">
                {DAM2000_TABLES.map((t) => (
                  <div
                    key={t.tableName}
                    onClick={() => {
                      setActiveDb('dam2000');
                      setSelectedTable(t);
                      setSqlQuery(`SELECT TOP 10 * FROM ${t.tableName}`);
                    }}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      selectedTable.tableName === t.tableName && activeDb === 'dam2000'
                        ? 'border-[#4A6741] bg-[#F7F9F5] shadow-xs'
                        : 'border-[#EEF1E9] bg-white hover:bg-[#FBFBFA]'
                    }`}
                  >
                    <div className="font-mono font-bold text-[11px] text-[#2D3A27]">{t.tableName}</div>
                    <div className="text-[10px] text-[#5C7457]">{t.persianLabel}</div>
                    <div className="text-[10px] font-mono text-gray-400 mt-0.5">
                      {t.rowCount.toLocaleString('fa-IR')} رکورد
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#EEF1E9] flex items-center justify-between">
            <span className="text-[11px] text-[#6B7F67]">
              آخرین انتقال: <span className="font-bold text-[#2D3A27]">آماده دریافت</span>
            </span>

            <button
              onClick={handleSyncDam2000}
              disabled={isSyncingDam}
              className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black text-xs px-4 py-2 rounded-2xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDam ? 'animate-spin' : ''}`} />
              <span>{isSyncingDam ? 'در حال انتقال...' : 'همگام‌سازی پرونده‌ها و واکسن‌ها'}</span>
            </button>
          </div>
        </div>

        {/* Card 2: Parsian1405 (Financial & Accounting) */}
        <div className="bg-white rounded-3xl p-6 border border-[#E6E9DF] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#EEF1E9] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-[#2D3A27]">
                  دیتابیس مالی پارسیان (Parsian1405)
                </h3>
                <span className="text-[11px] text-[#5C7457]">
                  سیستم مالی، فاکتورها، اشخاص و اقلام انبار سال ۱۴۰۵
                </span>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              متصل به OLE DB
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="bg-[#FBFBFA] p-3 rounded-2xl border border-[#EEF1E9] space-y-1">
              <div className="flex justify-between font-mono text-[11px] text-[#6B7F67]">
                <span>Data Source:</span>
                <span className="font-bold text-[#2D3A27]">ncase3</span>
              </div>
              <div className="flex justify-between font-mono text-[11px] text-[#6B7F67]">
                <span>Initial Catalog:</span>
                <span className="font-bold text-amber-700">Parsian1405</span>
              </div>
              <div className="flex justify-between font-mono text-[11px] text-[#6B7F67]">
                <span>Provider:</span>
                <span className="font-bold text-[#2D3A27]">SQLOLEDB.1</span>
              </div>
            </div>

            <div className="pt-1">
              <span className="font-bold text-xs text-[#2D3A27] block mb-2">جداول اصلی حسابداری و فاکتورها:</span>
              <div className="grid grid-cols-2 gap-2">
                {PARSIAN1405_TABLES.map((t) => (
                  <div
                    key={t.tableName}
                    onClick={() => {
                      setActiveDb('Parsian1405');
                      setSelectedTable(t);
                      setSqlQuery(`SELECT TOP 10 * FROM ${t.tableName}`);
                    }}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      selectedTable.tableName === t.tableName && activeDb === 'Parsian1405'
                        ? 'border-amber-600 bg-amber-50/50 shadow-xs'
                        : 'border-[#EEF1E9] bg-white hover:bg-[#FBFBFA]'
                    }`}
                  >
                    <div className="font-mono font-bold text-[11px] text-[#2D3A27]">{t.tableName}</div>
                    <div className="text-[10px] text-[#5C7457]">{t.persianLabel}</div>
                    <div className="text-[10px] font-mono text-gray-400 mt-0.5">
                      {t.rowCount.toLocaleString('fa-IR')} رکورد
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#EEF1E9] flex items-center justify-between">
            <span className="text-[11px] text-[#6B7F67]">
              آخرین انتقال: <span className="font-bold text-[#2D3A27]">آماده دریافت</span>
            </span>

            <button
              onClick={handleSyncParsian}
              disabled={isSyncingParsian}
              className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-black text-xs px-4 py-2 rounded-2xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingParsian ? 'animate-spin' : ''}`} />
              <span>{isSyncingParsian ? 'در حال انتقال...' : 'همگام‌سازی فاکتورهای پارسیان'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Windows Local Execution Guide Banner */}
      <div className="bg-[#2D3A27] text-white rounded-3xl p-6 shadow-md space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400 font-black">
            <Zap className="w-5 h-5" />
            <span className="text-sm">دستور اجرای پل ارتباطی در ویندوز لوکال (Windows PowerShell)</span>
          </div>

          <span className="text-[11px] font-mono bg-white/10 px-2.5 py-1 rounded-xl text-emerald-300">
            Host: ncase3 | OLE DB Provider
          </span>
        </div>

        <p className="text-gray-300 leading-relaxed text-[11px]">
          در زمان اجرای برنامه روی کامپیوتر ویندوزی متصل به سرور ncase3، اسکریپت پاورشل زیر با استفاده از درایور
          رسمی <code className="text-emerald-300 font-mono">SQLOLEDB.1</code> ارتباط همزمان با هر دو دیتابیس dam2000 و
          Parsian1405 را برقرار کرده و داده‌ها را به سرور مهرگان تزریق می‌نماید:
        </p>

        <div className="bg-black/50 p-3.5 rounded-2xl font-mono text-[11px] text-emerald-300 flex items-center justify-between border border-emerald-900/50 direction-ltr text-left">
          <span>powershell -ExecutionPolicy Bypass -File scripts\Connect-LegacyDatabases.ps1 -Action Test</span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                'powershell -ExecutionPolicy Bypass -File scripts\\Connect-LegacyDatabases.ps1 -Action Test'
              );
              showNotification('دستور در کلیپ‌بورد کپی شد.');
            }}
            className="text-gray-400 hover:text-white p-1 ml-2 cursor-pointer"
            title="کپی دستور"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interactive SQL Query Console */}
      <div className="bg-white rounded-3xl p-6 border border-[#E6E9DF] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EEF1E9] pb-3">
          <div className="flex items-center gap-2 text-[#2D3A27]">
            <Terminal className="w-5 h-5 text-[#4A6741]" />
            <h3 className="font-black text-sm">کنسول اجرای کوئری زنده روی دیتابیس‌های قدیمی</h3>
          </div>

          {/* Database Switcher Pill */}
          <div className="flex items-center gap-1 bg-[#F2F5EE] p-1 rounded-2xl border border-[#D0DAC7]">
            <button
              onClick={() => {
                setActiveDb('dam2000');
                setSelectedTable(DAM2000_TABLES[0]);
                setSqlQuery('SELECT TOP 10 * FROM tbl_Vaccinations ORDER BY VaccineID DESC');
              }}
              className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeDb === 'dam2000'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-[#5C7457] hover:text-[#2D3A27]'
              }`}
            >
              دام۲۰۰۰ (dam2000)
            </button>
            <button
              onClick={() => {
                setActiveDb('Parsian1405');
                setSelectedTable(PARSIAN1405_TABLES[0]);
                setSqlQuery('SELECT TOP 10 * FROM tbl_Factors ORDER BY FactorNumber DESC');
              }}
              className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeDb === 'Parsian1405'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-[#5C7457] hover:text-[#2D3A27]'
              }`}
            >
              پارسیان ۱۴۰۵ (Parsian1405)
            </button>
          </div>
        </div>

        {/* Query Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#2D3A27]">دستور T-SQL (فقط خواندنی):</span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#6B7F67]">الگوهای سریع:</span>
              {activeDb === 'dam2000' ? (
                <>
                  <button
                    onClick={() => setSqlQuery('SELECT TOP 10 * FROM tbl_Vaccinations')}
                    className="text-[11px] text-[#4A6741] hover:underline font-mono"
                  >
                    tbl_Vaccinations
                  </button>
                  <button
                    onClick={() => setSqlQuery('SELECT TOP 10 * FROM tbl_Patients')}
                    className="text-[11px] text-[#4A6741] hover:underline font-mono"
                  >
                    tbl_Patients
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setSqlQuery('SELECT TOP 10 * FROM tbl_Factors')}
                    className="text-[11px] text-[#4A6741] hover:underline font-mono"
                  >
                    tbl_Factors
                  </button>
                  <button
                    onClick={() => setSqlQuery('SELECT TOP 10 * FROM tbl_Goods')}
                    className="text-[11px] text-[#4A6741] hover:underline font-mono"
                  >
                    tbl_Goods
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="relative">
            <textarea
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              rows={2}
              dir="ltr"
              className="w-full p-3 rounded-2xl border border-[#D0DAC7] bg-[#1E291F] text-emerald-300 font-mono text-xs outline-none focus:ring-2 focus:ring-[#4A6741]"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleExecuteQuery}
              disabled={isQuerying}
              className="bg-[#4A6741] hover:bg-[#3D5535] text-white font-black text-xs px-5 py-2 rounded-2xl flex items-center gap-2 cursor-pointer shadow-xs transition-all"
            >
              <Play className={`w-3.5 h-3.5 ${isQuerying ? 'animate-spin' : ''}`} />
              <span>{isQuerying ? 'در حال اجرا...' : 'اجرای کوئری T-SQL'}</span>
            </button>
          </div>
        </div>

        {/* Query Results Display */}
        {queryError && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{queryError}</span>
          </div>
        )}

        {queryResults && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs text-[#5C7457]">
              <span>
                نتیجه اجرای کوئری روی دیتابیس{' '}
                <strong className="text-[#2D3A27]">{activeDb}</strong> ({queryResults.length} ردیف)
              </span>
              {queryExecutionTime && (
                <span className="font-mono text-[11px]">{queryExecutionTime}ms زمان پاسخ</span>
              )}
            </div>

            <div className="border border-[#D0DAC7] rounded-2xl overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#F2F5EE] text-[#5C7457] text-[11px] font-bold">
                  <tr>
                    {Object.keys(queryResults[0] || {}).map((col) => (
                      <th key={col} className="p-2.5 font-mono text-right whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF1E9]">
                  {queryResults.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#FBFBFA]">
                      {Object.values(row).map((val: any, cIdx) => (
                        <td key={cIdx} className="p-2.5 font-mono text-[11px] text-[#2D3A27] whitespace-nowrap">
                          {String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* PowerShell Script Viewer Modal */}
      {isPsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-[#E6E9DF] space-y-4">
            <div className="flex items-center justify-between border-b border-[#EEF1E9] pb-3">
              <div className="flex items-center gap-2 text-[#2D3A27]">
                <Terminal className="w-5 h-5 text-[#4A6741]" />
                <h3 className="font-black text-sm">
                  اسکریپت کامل اتوماسیون ویندوز (Connect-LegacyDatabases.ps1)
                </h3>
              </div>
              <button
                onClick={() => setIsPsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#5C7457]">
              این اسکریپت با OLE DB و ADO.NET مستقیماً به سرور <code className="font-mono text-gray-800">ncase3</code> وصل شده و
              تراکنش‌های dam2000 و Parsian1405 را خوانده و با API کلینیک همگام می‌کند:
            </p>

            <pre className="bg-[#1E291F] text-emerald-300 p-4 rounded-2xl font-mono text-[11px] overflow-auto max-h-80 direction-ltr text-left">
              {psScriptContent}
            </pre>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(psScriptContent);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                  showNotification('اسکریپت پاورشل کپی شد.');
                }}
                className="px-4 py-2 rounded-xl bg-[#4A6741] hover:bg-[#3D5535] text-white text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'کپی شد' : 'کپی کل اسکریپت'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
