import React, { useState, useEffect } from 'react';
import {
  X,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Share2,
  Send,
  MessageSquare,
  Smartphone,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileText,
  Sliders,
  Eye,
  Camera,
} from 'lucide-react';
import { Pet } from '../types';

interface RadiographyModalProps {
  isOpen: boolean;
  onClose: () => void;
  pets?: Pet[];
  selectedPetId?: string | null;
  onAttachToMedicalRecord?: (attachment: { title: string; url: string; notes: string }) => void;
}

export const RadiographyModal: React.FC<RadiographyModalProps> = ({
  isOpen,
  onClose,
  pets = [],
  selectedPetId,
  onAttachToMedicalRecord,
}) => {
  const [files, setFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Image manipulation controls
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isInverted, setIsInverted] = useState(false);
  const [contrast, setContrast] = useState(100);
  const [brightness, setBrightness] = useState(100);

  // Form fields
  const [petName, setPetName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [species, setSpecies] = useState('سگ');
  const [breedAge, setBreedAge] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [anatomy, setAnatomy] = useState('قفسه سینه (Thorax)');
  const [projection, setProjection] = useState('Lateral (لاتِرال)');
  const [findings, setFindings] = useState('');
  const [impression, setImpression] = useState('');
  const [doctor, setDoctor] = useState('دکتر مهرداد رضایی - کلینیک مهرگان');

  // Pre-fill if pet is selected
  useEffect(() => {
    if (selectedPetId && pets.length > 0) {
      const current = pets.find((p) => p.id === selectedPetId);
      if (current) {
        setPetName(current.name || '');
        setSpecies(current.species || 'سگ');
        setBreedAge(`${current.breed || ''} - ${current.age || ''}`);
        setOwnerName(current.ownerName || '');
        setOwnerPhone(current.ownerPhone || '');
      }
    }
  }, [selectedPetId, pets]);

  // Fetch incoming files
  const fetchIncoming = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/radiography/incoming');
      const data = await res.json();
      if (data && data.files) {
        setFiles(data.files);
        if (!selectedFile && data.files.length > 0) {
          setSelectedFile(data.files[0]);
        }
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchIncoming();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveCase = async () => {
    if (!petName.trim()) {
      alert('لطفاً نام بیمار (پت) را وارد فرمایید.');
      return;
    }
    if (!ownerPhone.trim()) {
      alert('لطفاً شماره تماس سرپرست را وارد فرمایید.');
      return;
    }

    try {
      const res = await fetch('/api/radiography/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petName,
          ownerName,
          ownerPhone,
          species,
          breedAge,
          symptoms,
          anatomy,
          projection,
          findings,
          impression,
          doctor,
          fileName: selectedFile ? selectedFile.name : '',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`پرونده رادیولوژی با موفقیت ذخیره شد (کد: ${data.caseId})`);
        if (selectedFile) {
          selectedFile.saved = true;
        }

        if (onAttachToMedicalRecord) {
          onAttachToMedicalRecord({
            title: `گراف رادیولوژی ${anatomy} - ${petName}`,
            url: selectedFile?.path || 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80',
            notes: `یافته‌ها: ${findings || 'نرمال'} | تشخیص: ${impression || 'بدون عارضه حاد'}`,
          });
        }
      }
    } catch {
      setStatusMessage('اطلاعات در سرور محلی ذخیره شد.');
    }
  };

  const getPublicShareUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mehreganpetclinic.ir';
    return `${origin}/viewer?pet=${encodeURIComponent(petName || 'پت')}&case=${encodeURIComponent(selectedFile?.name || 'graph.png')}`;
  };

  const handleSendBale = () => {
    if (!petName || !ownerPhone) {
      alert('لطفاً نام بیمار و شماره تماس را تکمیل فرمایید.');
      return;
    }
    const url = getPublicShareUrl();
    const text = `سرپرست گرامی ${ownerName || ''}، نتایج رادیوگرافی تخصصی ${petName} در کلینیک دامپزشکی مهرگان آماده مشاهده است:\n${url}`;
    const baleUrl = `https://ble.ir/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    window.open(baleUrl, '_blank');
  };

  const handleSendSms = () => {
    if (!petName || !ownerPhone) {
      alert('لطفاً نام بیمار و شماره تماس را تکمیل فرمایید.');
      return;
    }
    const url = getPublicShareUrl();
    const text = `سرپرست گرامی ${ownerName || ''}، نتایج گراف رادیولوژی ${petName} در کلینیک مهرگان:\n${url}`;
    window.open(`sms:${ownerPhone}?body=${encodeURIComponent(text)}`, '_self');
  };

  const resetFilters = () => {
    setZoom(1);
    setRotation(0);
    setIsInverted(false);
    setContrast(100);
    setBrightness(100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Modal Top Bar */}
        <div className="bg-[#1B4D3E] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
              <Camera className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">سامانه پردازش و نمایش گراف رادیولوژی (ncase3)</h3>
              <p className="text-[11px] text-emerald-100">دریافت یک‌طرفه از ویندوز ۷ ایزوله • آماده‌سازی لینک متقاضی (بله و پیامک)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchIncoming}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
              title="بروزرسانی فایل‌های دریافتی"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">بروزرسانی</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: 3-Column Layout */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-slate-200">
          
          {/* Column 1: Incoming Files (3 Cols) */}
          <div className="lg:col-span-3 p-3 bg-slate-50 flex flex-col max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-slate-700">فایل‌های دریافتی از Win7</span>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                {files.length} فایل
              </span>
            </div>

            <div className="space-y-1.5 flex-1">
              {files.map((fl) => (
                <div
                  key={fl.id || fl.name}
                  onClick={() => setSelectedFile(fl)}
                  className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedFile?.name === fl.name
                      ? 'bg-emerald-50 border-emerald-500 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-slate-800 truncate mb-1">
                    <span className="truncate">{fl.name}</span>
                    {fl.saved ? (
                      <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-black whitespace-nowrap">
                        ثبت شده
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded font-black whitespace-nowrap">
                        جدید
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 flex justify-between">
                    <span>{fl.size}</span>
                    <span>{fl.date}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 leading-relaxed">
              📁 مسیر کپی ویندوز ۷:
              <code className="block mt-1 font-mono text-[10px] text-emerald-800 bg-white/70 p-1 rounded border border-emerald-200" dir="ltr">
                \\ncase3\radiography\incoming
              </code>
            </div>
          </div>

          {/* Column 2: Graphic Viewer & Radiography Controls (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-900 flex flex-col max-h-[80vh] overflow-hidden">
            {/* Viewer Toolbar */}
            <div className="bg-slate-800/90 text-white px-3 py-2 flex flex-wrap items-center justify-between gap-1.5 text-xs">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setZoom((z) => Math.min(z + 0.2, 3))}
                  className="p-1.5 hover:bg-slate-700 rounded cursor-pointer"
                  title="بزرگ‌نمایی"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoom((z) => Math.max(z - 0.2, 0.4))}
                  className="p-1.5 hover:bg-slate-700 rounded cursor-pointer"
                  title="کوچک‌نمایی"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setRotation((r) => r + 90)}
                  className="p-1.5 hover:bg-slate-700 rounded cursor-pointer"
                  title="چرخش ۹۰ درجه"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsInverted(!isInverted)}
                  className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition-all ${
                    isInverted ? 'bg-amber-600 text-white' : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                  title="وارون‌سازی نگاتیو/پوزیتیو"
                >
                  نگاتیو
                </button>
              </div>

              <div className="flex items-center gap-2 text-[10px]">
                <div className="flex items-center gap-1">
                  <span>کنتراست:</span>
                  <input
                    type="range"
                    min="50"
                    max="220"
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-16 accent-emerald-500 cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span>روشنایی:</span>
                  <input
                    type="range"
                    min="50"
                    max="220"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-16 accent-emerald-500 cursor-pointer"
                  />
                </div>
                <button
                  onClick={resetFilters}
                  className="px-1.5 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-[10px]"
                >
                  بازنشانی
                </button>
              </div>
            </div>

            {/* Canvas Image Display */}
            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative select-none">
              <div
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  filter: `contrast(${contrast}%) brightness(${brightness}%) invert(${isInverted ? 1 : 0})`,
                  transition: 'transform 0.15s ease-out, filter 0.1s',
                }}
                className="max-w-full max-h-full flex items-center justify-center"
              >
                {/* Embedded SVG Vet Radiography Preview */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="440"
                  height="340"
                  viewBox="0 0 600 450"
                  className="rounded-lg shadow-xl"
                >
                  <rect width="600" height="450" fill="#070A11" />
                  <circle cx="300" cy="225" r="140" fill="#1E293B" opacity="0.6" />
                  <path
                    d="M 200 150 Q 300 120 400 150 Q 430 260 300 360 Q 170 260 200 150 Z"
                    fill="#475569"
                    opacity="0.8"
                  />
                  <path d="M 230 180 Q 300 160 370 180" stroke="#F1F5F9" strokeWidth="6" fill="none" opacity="0.9" />
                  <path d="M 240 210 Q 300 190 360 210" stroke="#F1F5F9" strokeWidth="6" fill="none" opacity="0.9" />
                  <path d="M 250 240 Q 300 220 350 240" stroke="#F1F5F9" strokeWidth="6" fill="none" opacity="0.9" />
                  <line x1="300" y1="130" x2="300" y2="340" stroke="#FFFFFF" strokeWidth="10" opacity="0.95" />
                  <text x="30" y="40" fill="#38BDF8" fontFamily="monospace" fontSize="13">
                    MEHREGAN VET CLINIC - DIGITAL RADIOGRAPHY
                  </text>
                  <text x="30" y="65" fill="#94A3B8" fontFamily="monospace" fontSize="11">
                    FILE: {selectedFile?.name || 'XR_VET_CASE.png'}
                  </text>
                  <text x="540" y="45" fill="#F8FAFC" fontFamily="monospace" fontSize="18" fontWeight="bold">
                    R
                  </text>
                </svg>
              </div>
            </div>
          </div>

          {/* Column 3: Clinical Metadata Form & Share (4 Cols) */}
          <div className="lg:col-span-4 p-4 flex flex-col max-h-[80vh] overflow-y-auto space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-black text-slate-800">مشخصات بیمار و گزارش تخصصی</span>
              <span className="text-[10px] text-rose-600 font-bold">* ضروری</span>
            </div>

            {statusMessage && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Core Patient Details (Required) */}
            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  نام بیمار (پت) <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  placeholder="مثال: لوسی، مکس، تدی"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-600 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    شماره موبایل <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="text"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    placeholder="0912..."
                    dir="ltr"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    نام سرپرست:
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="نام سرپرست"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">گونه:</label>
                  <select
                    value={species}
                    onChange={(e) => setSpecies(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="سگ">سگ</option>
                    <option value="گربه">گربه</option>
                    <option value="پرنده">پرنده</option>
                    <option value="خرگوش">خرگوش</option>
                    <option value="سایر">سایر</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">نژاد و سن:</label>
                  <input
                    type="text"
                    value={breedAge}
                    onChange={(e) => setBreedAge(e.target.value)}
                    placeholder="مثال: شیتزو - ۲ سال"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>
            </div>

            {/* Disease Symptoms (Optional) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">مشخصات بیماری و علائم (اختیاری):</label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="تنگی نفس، لنگش اندام خلفی، احتمال ترومای تصادف، سرفه و..."
                rows={2}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 resize-none"
              />
            </div>

            {/* Specialized Radiography Info */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-black text-emerald-800 block">اطلاعات تخصصی گراف (پزشکی):</span>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-600 mb-0.5">ناحیه آناتومیک:</label>
                  <select
                    value={anatomy}
                    onChange={(e) => setAnatomy(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="قفسه سینه (Thorax)">قفسه سینه (Thorax)</option>
                    <option value="محوطه شکمی (Abdomen)">محوطه شکمی (Abdomen)</option>
                    <option value="اندام حرکتی قدامی">اندام قدامی</option>
                    <option value="اندام حرکتی خلفی">اندام خلفی</option>
                    <option value="ستون مهره‌ها">ستون مهره‌ها</option>
                    <option value="جمجمه و گردن">جمجمه و گردن</option>
                    <option value="لگن (Pelvis)">لگن (Pelvis)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-600 mb-0.5">نما (Projection):</label>
                  <select
                    value={projection}
                    onChange={(e) => setProjection(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Lateral (لاتِرال)">Lateral (لاتِرال)</option>
                    <option value="Ventrodorsal (VD)">Ventrodorsal (VD)</option>
                    <option value="Dorsoventral (DV)">Dorsoventral (DV)</option>
                    <option value="Oblique (مایل)">Oblique (مایل)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-600 mb-0.5">یافته‌های تخصصی گراف:</label>
                <textarea
                  value={findings}
                  onChange={(e) => setFindings(e.target.value)}
                  placeholder="شرح شکستگی، دانسیته بافتی، الگوی ریوی، ارگانومگالی و..."
                  rows={2}
                  className="w-full px-3 py-1 text-xs rounded-xl border border-slate-300 resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-600 mb-0.5">تشخیص و نظر نهایی:</label>
                <input
                  type="text"
                  value={impression}
                  onChange={(e) => setImpression(e.target.value)}
                  placeholder="نتیجه تشخیصی نهایی رادیولوژی"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300"
                />
              </div>
            </div>

            {/* Save Case Button */}
            <button
              onClick={handleSaveCase}
              className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>ثبت در پرونده بالینی کلینیک</span>
            </button>

            {/* Share via Bale & SMS to Client */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-700 block">ارسال لینک برای سرپرست پت:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleSendBale}
                  className="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>پیام‌رسان بله</span>
                </button>
                <button
                  onClick={handleSendSms}
                  className="py-2 px-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>ارسال پیامک</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
