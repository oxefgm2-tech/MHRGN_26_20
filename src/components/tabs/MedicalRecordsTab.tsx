import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Paperclip,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Stethoscope,
  Activity,
  Heart,
  Thermometer,
  Wind,
  Pill,
  Printer,
  ChevronDown,
  X,
  FileCheck,
  Share2,
  Trash2,
  Receipt,
  User,
  ArrowRight,
  Camera,
} from 'lucide-react';
import { VisitRecord, Pet, MedicalAttachment, PrescriptionItem, OmnichannelMessagePayload } from '../../types';
import { OmnichannelShareModal } from '../OmnichannelShareModal';
import { RadiographyModal } from '../RadiographyModal';

interface MedicalRecordsTabProps {
  visits: VisitRecord[];
  pets: Pet[];
  onAddVisit: (visit: Partial<VisitRecord>, cost?: number) => void;
  onUploadAttachment: (visitId: string, attachment: MedicalAttachment) => void;
  onDeleteVisit?: (visitId: string) => void;
  initialSelectedPetId?: string | null;
  onNavigateToCashier?: () => void;
  vaccinations?: any[];
  onRecordVaccine?: any;
}

export const MedicalRecordsTab: React.FC<MedicalRecordsTabProps> = ({
  visits,
  pets,
  onAddVisit,
  onUploadAttachment,
  onDeleteVisit,
  initialSelectedPetId,
  onNavigateToCashier,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDocStatus, setFilterDocStatus] = useState<string>('all');
  const [isNewVisitModalOpen, setIsNewVisitModalOpen] = useState(false);
  const [selectedVisitForAttach, setSelectedVisitForAttach] = useState<VisitRecord | null>(null);

  // New Visit Form State
  const [selectedPetId, setSelectedPetId] = useState<string>(
    initialSelectedPetId || pets[0]?.id || ''
  );
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [temp, setTemp] = useState(38.5);
  const [heartRate, setHeartRate] = useState(110);
  const [respRate, setRespRate] = useState(24);
  const [clinicalFindings, setClinicalFindings] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [serviceType, setServiceType] = useState<VisitRecord['serviceType']>('general_exam');
  const [specializedType, setSpecializedType] = useState<VisitRecord['specializedType']>('none');
  const [cost, setCost] = useState(450000);

  // New Attachment State
  const [attTitle, setAttTitle] = useState('تصویر رادیوگرافی بعد از عمل');
  const [attType, setAttType] = useState<MedicalAttachment['type']>('xray');
  const [attUrl, setAttUrl] = useState(
    'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80'
  );

  // Omnichannel Share Modal State
  const [shareModalPayload, setShareModalPayload] = useState<{
    isOpen: boolean;
    payload: OmnichannelMessagePayload;
  }>({
    isOpen: false,
    payload: {
      recipientName: '',
      recipientPhone: '',
      platform: 'bale',
      type: 'medical_report',
      title: '',
      formattedBodyText: '',
    },
  });

  // Radiography Modal State
  const [isRadiographyModalOpen, setIsRadiographyModalOpen] = useState(false);

  // Watch for initialSelectedPetId changes from parent navigation
  useEffect(() => {
    if (initialSelectedPetId) {
      setSelectedPetId(initialSelectedPetId);
      setIsNewVisitModalOpen(true);
      const targetPet = pets.find((p) => p.id === initialSelectedPetId);
      if (targetPet?.notes) {
        setChiefComplaint((prev) => (prev ? prev : targetPet.notes || ''));
      }
    }
  }, [initialSelectedPetId, pets]);

  const waitingPatients = pets.filter(
    (p) => p.statusInClinic === 'waiting' || p.statusInClinic === 'in_exam'
  );

  const handleOpenShareReport = (visit: VisitRecord) => {
    const rxText =
      visit.prescription && visit.prescription.length > 0
        ? visit.prescription
            .map(
              (rx, idx) =>
                `💊 ${idx + 1}. ${rx.drugName} (${rx.dosage}) - ${rx.frequency} به مدت ${rx.duration}\n   دستور مصرف: ${rx.instructions}`
            )
            .join('\n')
        : 'بدون تجویز دارویی جدید.';

    const attText =
      visit.attachments && visit.attachments.length > 0
        ? visit.attachments.map((att, idx) => `📎 ${idx + 1}. ${att.title} (${att.type}): ${att.url}`).join('\n')
        : 'پیوست تصویری ندارد.';

    setShareModalPayload({
      isOpen: true,
      payload: {
        recipientName: visit.ownerName || 'سرپرست گرامی',
        recipientPhone: '',
        platform: 'bale',
        type: 'medical_report',
        title: `گزارش ویزیت بالینی و نسخه: ${visit.petName}`,
        formattedBodyText: `🐾 **کلینیک دامپزشکی و تخصصی مهرگان** 🐾
📋 **گزارش ویزیت بالینی و نسخه درمانی**
👤 **سرپرست:** ${visit.ownerName}
🐶🐱 **نام پت:** ${visit.petName}
👨‍⚕️ **پزشک معالج:** ${visit.vetName}
📅 **تاریخ و ساعت:** ${visit.date} - ${visit.time}

🌡️ **علائم حیاتی:**
- دمای بدن: ${visit.vitalSigns.temperature} °C
- ضربان قلب: ${visit.vitalSigns.heartRate} bpm
- نرخ تنفس: ${visit.vitalSigns.respiratoryRate} /min
- وزن: ${visit.vitalSigns.weightKg} kg

🩺 **شرح حال و علت مراجعه:**
${visit.chiefComplaint}

🔬 **یافته‌های معاینه و تشخیص (Assessment):**
${visit.diagnosis} (${visit.clinicalFindings})

📝 **دستورات دارویی و نسخه (Plan):**
${rxText}

🖼️ **مستندات پاراکلینیک، سونوگرافی و رادیولوژی:**
${attText}

با آرزوی بهبودی کامل و سلامت برای پت دلبندتان 🌸
📞 پشتیبانی کلینیک: ۰۲۱-۸۸۸۸۸۸۸۸`,
      },
    });
  };

  const filteredVisits = visits.filter((v) => {
    const matchesSearch =
      v.petName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.chiefComplaint.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDoc = filterDocStatus === 'all' || v.documentationStatus === filterDocStatus;
    return matchesSearch && matchesDoc;
  });

  const handleCreateVisit = (e: React.FormEvent) => {
    e.preventDefault();
    const pet = pets.find((p) => p.id === selectedPetId) || pets[0];
    if (!pet) return;

    onAddVisit(
      {
        petId: pet.id,
        petName: pet.name,
        ownerId: pet.ownerId,
        ownerName: pet.ownerName,
        chiefComplaint,
        vitalSigns: {
          temperature: temp,
          heartRate,
          respiratoryRate: respRate,
          weightKg: pet.weightKg || 5,
        },
        clinicalFindings,
        diagnosis,
        serviceType,
        specializedType,
        procedures: [serviceType === 'surgery' ? 'عمل جراحی تخصصی' : 'معاینه و ویزیت بالینی'],
        documentationStatus: specializedType === 'surgery' ? 'pending_docs' : 'complete',
        documentReminderActive: specializedType === 'surgery',
        prescription: [
          {
            id: `rx-${Date.now()}`,
            drugName: 'آموکسی‌سیلین کلاوولانات',
            form: 'قرص',
            dosage: '۲۵۰mg',
            frequency: 'هر ۱۲ ساعت',
            duration: '۷ روز',
            instructions: 'همراه با وعده غذایی مصرف شود.',
          },
        ],
        attachments: [],
      },
      cost
    );

    setIsNewVisitModalOpen(false);
    setChiefComplaint('');
    setClinicalFindings('');
    setDiagnosis('');
  };

  const handleAddAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisitForAttach) return;

    onUploadAttachment(selectedVisitForAttach.id, {
      id: `att-${Date.now()}`,
      title: attTitle,
      type: attType,
      url: attUrl,
      uploadedAt: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      uploadedBy: 'دکتر امین بیاتی',
      notes: 'پیوست مستندات پرونده الکترونیک پزشکی',
    });

    setSelectedVisitForAttach(null);
  };

  const currentSelectedPet = pets.find((p) => p.id === selectedPetId);

  return (
    <div id="tab-medical-records" className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">سوابق بالینی الکترونیک (SOAP) و مستندات تخصصی</h2>
            <p className="text-xs text-slate-500">
              ثبت علائم حیاتی، نسخه‌های دارویی، پایش مستندات جراحی و الصاق رادیولوژی
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToCashier && (
            <button
              onClick={onNavigateToCashier}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
            >
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span>صندوق و تسویه</span>
            </button>
          )}

          <button
            onClick={() => setIsRadiographyModalOpen(true)}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3.5 py-2.5 rounded-2xl font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shadow-xs"
          >
            <Camera className="w-4 h-4 text-emerald-600" />
            <span>رادیولوژی و گراف (ncase3)</span>
          </button>

          <button
            onClick={() => setIsNewVisitModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-4 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت ویزیت بالینی جدید</span>
          </button>
        </div>
      </div>

      {/* Live Examination Queue Bar */}
      {waitingPatients.length > 0 && (
        <div className="bg-white border-2 border-emerald-500/30 rounded-3xl p-4 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-black text-slate-900">
                صف بیماران حاضر در انتظار ویزیت پزشک ({waitingPatients.length} بیمار):
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-bold">برای شروع سریع ویزیت، روی بیمار کلیک کنید</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {waitingPatients.map((pet) => (
              <div
                key={pet.id}
                className="p-3 bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={pet.photoUrl}
                    alt={pet.name}
                    className="w-10 h-10 rounded-xl object-cover border border-emerald-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="font-black text-xs text-slate-900 truncate flex items-center gap-1.5">
                      <span>{pet.name}</span>
                      <span className="text-[10px] font-normal text-slate-500">({pet.breed})</span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      سرپرست: {pet.ownerName} • {pet.checkInTime || 'امروز'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedPetId(pet.id);
                    if (pet.notes) setChiefComplaint(pet.notes);
                    setIsNewVisitModalOpen(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] py-1.5 px-3 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95 whitespace-nowrap flex items-center gap-1"
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>شروع ویزیت</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجو در نام بیمار، سرپرست، تشخیص پزشکی یا شرح حال..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-10 pl-4 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>
          <span
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-[11px] font-bold whitespace-nowrap"
            title="سوابق پزشکی مستقیماً با سرور همگام‌سازی می‌شوند"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>پایگاه داده متصل</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterDocStatus}
            onChange={(e) => setFilterDocStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-2xl px-3 py-2 cursor-pointer"
          >
            <option value="all">تمام وضعیت‌های مستندات</option>
            <option value="pending_docs">⚠️ در انتظار الصاق مستندات</option>
            <option value="uploaded">📎 دارای مستندات الصاقی</option>
            <option value="complete">✅ پرونده کامل و مختومه</option>
          </select>
        </div>
      </div>

      {/* Visits List */}
      <div className="space-y-4">
        {filteredVisits.length === 0 && (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-500 space-y-2">
            <FileText className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-xs font-bold">هیچ پرونده یا ویزیت بالینی مطابق جستجو یافت نشد.</p>
          </div>
        )}

        {filteredVisits.map((visit) => (
          <div
            key={visit.id}
            className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:border-emerald-500/40 transition-all space-y-4"
          >
            {/* Header: Pet info, Doctor, Date, Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  {visit.petName.slice(0, 2)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-slate-900">{visit.petName}</h3>
                    <span className="text-xs text-slate-500 font-bold">• سرپرست: {visit.ownerName}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    پزشک معالج: <span className="text-slate-700 font-bold">{visit.vetName}</span> • تاریخ:{' '}
                    <span className="font-mono">{visit.date}</span> (ساعت {visit.time})
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {visit.documentationStatus === 'pending_docs' && (
                  <span className="text-[11px] bg-rose-50 text-rose-800 border border-rose-200 px-3 py-1 rounded-full font-bold flex items-center gap-1.5 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>نیاز به پیوست عکس/آزمایش</span>
                  </span>
                )}
                {visit.documentationStatus === 'uploaded' && (
                  <span className="text-[11px] bg-teal-50 text-teal-800 border border-teal-200 px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-teal-600" />
                    <span>مستندات الصاق شد</span>
                  </span>
                )}
                {visit.documentationStatus === 'complete' && (
                  <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>پرونده کامل</span>
                  </span>
                )}
              </div>
            </div>

            {/* SOAP Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl space-y-1.5">
                <div className="font-bold text-slate-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>شرح حال و علت مراجعه (Subjective):</span>
                </div>
                <p className="text-slate-800 leading-relaxed font-medium">{visit.chiefComplaint}</p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl space-y-1.5">
                <div className="font-bold text-slate-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>یافته‌های بالینی و معاینه (Objective):</span>
                </div>
                <p className="text-slate-800 leading-relaxed font-medium">{visit.clinicalFindings}</p>
              </div>
            </div>

            {/* Vitals & Diagnosis */}
            <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 text-xs space-y-2">
              <div className="flex flex-wrap items-center gap-4 text-slate-700 font-medium">
                <span className="flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-rose-500" />
                  <span>دما: {visit.vitalSigns.temperature} °C</span>
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-rose-600" />
                  <span>ضربان: {visit.vitalSigns.heartRate} bpm</span>
                </span>
                <span className="flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-sky-500" />
                  <span>تنفس: {visit.vitalSigns.respiratoryRate} /min</span>
                </span>
                <span className="flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  <span>وزن: {visit.vitalSigns.weightKg} kg</span>
                </span>
              </div>

              <div className="pt-2 border-t border-emerald-100 flex items-center gap-2">
                <span className="font-black text-slate-900">تشخیص نهایی (Assessment):</span>
                <span className="text-emerald-900 font-bold bg-white px-2.5 py-1 rounded-xl border border-emerald-200">
                  {visit.diagnosis}
                </span>
              </div>

              {/* Prescription Items */}
              {visit.prescription && visit.prescription.length > 0 && (
                <div className="pt-2 border-t border-emerald-100 space-y-1.5">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-emerald-700" />
                    <span>اقلام دارویی تجویز شده (Plan):</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {visit.prescription.map((rx) => (
                      <div key={rx.id} className="bg-white p-2.5 rounded-xl border border-emerald-200 text-[11px]">
                        <div className="font-bold text-slate-900">
                          {rx.drugName} ({rx.dosage})
                        </div>
                        <div className="text-slate-600 mt-0.5">
                          {rx.frequency} • دوره: {rx.duration}
                        </div>
                        <div className="text-slate-500 text-[10px] mt-0.5">{rx.instructions}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Attachments Section & Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-500 font-bold">پیوست‌ها:</span>
                {visit.attachments.length === 0 ? (
                  <span className="text-slate-400">بدون پیوست</span>
                ) : (
                  visit.attachments.map((att) => (
                    <a
                      key={att.id}
                      href={att.url}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1 rounded-xl font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{att.title}</span>
                    </a>
                  ))
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenShareReport(visit)}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                  title="ارسال گزارش بالینی و نسخه به بله، تلگرام و واتساپ"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>ارسال گزارش و نسخه</span>
                </button>

                <button
                  onClick={() => setSelectedVisitForAttach(visit)}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>الصاق تصویر / آزمایش</span>
                </button>

                {onDeleteVisit && (
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          `آیا از حذف رکورد ویزیت بیمار «${visit.petName}» مربوط به تاریخ ${visit.date} اطمینان دارید؟`
                        )
                      ) {
                        onDeleteVisit(visit.id);
                      }
                    }}
                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl border border-rose-200 transition-colors cursor-pointer"
                    title="حذف ویزیت"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New Visit Modal */}
      {isNewVisitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white text-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-extrabold text-slate-900">ثبت پرونده و ویزیت بالینی جدید</h3>
              </div>
              <button
                onClick={() => setIsNewVisitModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVisit} className="p-6 space-y-4 overflow-y-auto text-xs">
              {/* Quick Select Waiting Patients */}
              {waitingPatients.length > 0 && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1.5">
                  <div className="text-[11px] font-bold text-emerald-950">
                    انتخاب سریع از بیماران حاضر در کلینیک:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {waitingPatients.map((wp) => (
                      <button
                        key={wp.id}
                        type="button"
                        onClick={() => {
                          setSelectedPetId(wp.id);
                          if (wp.notes) setChiefComplaint(wp.notes);
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-xl border transition-all cursor-pointer font-bold ${
                          selectedPetId === wp.id
                            ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                            : 'bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {wp.name} ({wp.breed})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">انتخاب بیمار *</label>
                <select
                  value={selectedPetId}
                  onChange={(e) => {
                    setSelectedPetId(e.target.value);
                    const p = pets.find((pt) => pt.id === e.target.value);
                    if (p?.notes) setChiefComplaint(p.notes);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold"
                >
                  {pets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.breed}) • سرپرست: {p.ownerName}{' '}
                      {p.statusInClinic && p.statusInClinic !== 'not_present' ? ' [حاضر در کلینیک]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {currentSelectedPet?.notes && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px]">
                  <strong>یادداشت پذیرش:</strong> {currentSelectedPet.notes}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">شرح حال و علت مراجعه (Subjective) *</label>
                <textarea
                  rows={2}
                  required
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  placeholder="علائم اولیه گزارش‌شده توسط سرپرست یا منشی پذیرش..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              {/* Vitals Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">دمای بدن (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={temp}
                    onChange={(e) => setTemp(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ضربان قلب (bpm)</label>
                  <input
                    type="number"
                    value={heartRate}
                    onChange={(e) => setHeartRate(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">تنفس (/min)</label>
                  <input
                    type="number"
                    value={respRate}
                    onChange={(e) => setRespRate(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">یافته‌های معاینه بالینی (Objective) *</label>
                <textarea
                  rows={2}
                  required
                  value={clinicalFindings}
                  onChange={(e) => setClinicalFindings(e.target.value)}
                  placeholder="نتایج سمع قلب و ریه، لمس محوطه شکمی، وضعیت غدد لنفاوی و مخاطات..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">تشخیص قطعی / تفریقی (Assessment) *</label>
                <input
                  type="text"
                  required
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="مثال: گاستروانتریت حاد، درماتیت آلرژیک، شکستگی رادیوس"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">نوع تخصص / جراحی</label>
                  <select
                    value={specializedType}
                    onChange={(e) => setSpecializedType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold"
                  >
                    <option value="none">معاینه عمومی (بدون نیاز به مستندات اجباری)</option>
                    <option value="surgery">جراحی (نیازمند الصاق عکس رادیولوژی / گزارش)</option>
                    <option value="radiology">رادیولوژی و تصویربرداری</option>
                    <option value="ultrasound">سونوگرافی</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">هزینه ویزیت و خدمات (تومان)</label>
                  <input
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewVisitModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer hover:bg-slate-200"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ثبت پرونده و صدور فاکتور در صندوق</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attachment Upload Modal */}
      {selectedVisitForAttach && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white text-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 text-xs">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-black text-slate-900">
                الصاق تصویر یا آزمایش به پرونده {selectedVisitForAttach.petName}
              </h3>
            </div>

            <form onSubmit={handleAddAttachment} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">عنوان سند یا آزمایش *</label>
                <input
                  type="text"
                  required
                  value={attTitle}
                  onChange={(e) => setAttTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">نوع فایل *</label>
                <select
                  value={attType}
                  onChange={(e) => setAttType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold"
                >
                  <option value="xray">عکس رادیولوژی دیجیتال (X-Ray)</option>
                  <option value="sonography">سونوگرافی</option>
                  <option value="lab_report">برگه آزمایش خون و سرولوژی</option>
                  <option value="surgery_photo">تصویر بعد از جراحی</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">آدرس فایل / تصویر</label>
                <input
                  type="text"
                  value={attUrl}
                  onChange={(e) => setAttUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedVisitForAttach(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  الصاق و تکمیل وضعیت مستندات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Omnichannel Share Modal for Medical Visit & Rx Reports */}
      <OmnichannelShareModal
        isOpen={shareModalPayload.isOpen}
        onClose={() => setShareModalPayload((prev) => ({ ...prev, isOpen: false }))}
        payload={shareModalPayload.payload}
      />

      {/* Radiography Manager & Viewer Modal */}
      <RadiographyModal
        isOpen={isRadiographyModalOpen}
        onClose={() => setIsRadiographyModalOpen(false)}
        pets={pets}
        selectedPetId={selectedPetId}
        onAttachToMedicalRecord={(att) => {
          if (selectedVisitForAttach) {
            onUploadAttachment(selectedVisitForAttach.id, {
              id: `att-${Date.now()}`,
              title: att.title,
              type: 'xray',
              url: att.url,
              uploadedAt: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
              uploadedBy: 'دکتر مهرداد رضایی',
              notes: att.notes,
            });
          }
        }}
      />
    </div>
  );
};
