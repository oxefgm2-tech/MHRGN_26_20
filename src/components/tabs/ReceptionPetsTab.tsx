import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Plus,
  PawPrint,
  User,
  Phone,
  Calendar,
  Syringe,
  FileText,
  Printer,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  ChevronRight,
  X,
  Sparkles,
  QrCode,
  Stethoscope,
  Scissors,
  Home,
  AlertTriangle,
  Receipt,
  ArrowRight,
  ShieldCheck,
  Activity,
  Filter,
} from 'lucide-react';
import { Pet, Owner, SpeciesType, GenderType, ClinicPresenceStatus } from '../../types';

interface ReceptionPetsTabProps {
  pets: Pet[];
  owners: Owner[];
  onAddPet: (newPet: Omit<Pet, 'id'>) => void;
  onUpdatePet: (pet: Pet) => void;
  onDeletePet?: (petId: string) => void;
  onCheckInPet: (petId: string, status: ClinicPresenceStatus, reason?: string) => void;
  onPrintPassport: (pet: Pet) => void;
  selectedPetForDrawer?: Pet | null;
  onNavigateToMedicalRecords?: (pet: Pet) => void;
  onNavigateToCashier?: (pet: Pet) => void;
}

export const ReceptionPetsTab: React.FC<ReceptionPetsTabProps> = ({
  pets,
  owners,
  onAddPet,
  onUpdatePet,
  onDeletePet,
  onCheckInPet,
  onPrintPassport,
  selectedPetForDrawer,
  onNavigateToMedicalRecords,
  onNavigateToCashier,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState<string>('all');
  const [presenceFilter, setPresenceFilter] = useState<'all' | 'present' | 'not_present'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activePetDrawer, setActivePetDrawer] = useState<Pet | null>(selectedPetForDrawer || null);

  // Admission Modal State
  const [admissionPet, setAdmissionPet] = useState<Pet | null>(null);
  const [admissionDestination, setAdmissionDestination] = useState<ClinicPresenceStatus>('waiting');
  const [admissionTriage, setAdmissionTriage] = useState<'routine' | 'urgent' | 'emergency'>('routine');
  const [admissionReason, setAdmissionReason] = useState('چکاپ و ویزیت دوره‌ای');
  const [customReasonNote, setCustomReasonNote] = useState('');

  // New Pet Form State
  const [formData, setFormData] = useState({
    name: '',
    species: 'سگ' as SpeciesType,
    breed: '',
    gender: 'نر' as GenderType,
    birthDate: '۱۴۰۲/۰۱/۰۱',
    ageText: '۱ سال',
    weightKg: 4.5,
    color: 'قهوه‌ای روشن',
    microchipNumber: `98514100${Math.floor(Math.random() * 8999999 + 1000000)}`,
    photoUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500&auto=format&fit=crop&q=80',
    ownerName: '',
    ownerPhone: '',
    allergies: '',
    notes: '',
  });

  const presentCount = useMemo(
    () => pets.filter((p) => p.statusInClinic && p.statusInClinic !== 'not_present').length,
    [pets]
  );

  const filteredPets = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return pets.filter((pet) => {
      const matchesSearch =
        !q ||
        pet.name.toLowerCase().includes(q) ||
        pet.breed.toLowerCase().includes(q) ||
        pet.ownerName.toLowerCase().includes(q) ||
        pet.ownerPhone.includes(q) ||
        pet.microchipNumber.includes(q);

      const matchesSpecies = speciesFilter === 'all' || pet.species === speciesFilter;

      const isPresent = Boolean(pet.statusInClinic && pet.statusInClinic !== 'not_present');
      const matchesPresence =
        presenceFilter === 'all' ||
        (presenceFilter === 'present' && isPresent) ||
        (presenceFilter === 'not_present' && !isPresent);

      return matchesSearch && matchesSpecies && matchesPresence;
    });
  }, [pets, searchTerm, speciesFilter, presenceFilter]);

  // Virtual Windowing state for high performance with 9181+ records
  const containerRef = useRef<HTMLDivElement>(null);
  const firstCardRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(650);
  const [columnsCount, setColumnsCount] = useState(3);
  const [rowHeight, setRowHeight] = useState(340);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateDimensions = () => {
      setContainerHeight(el.clientHeight || 650);
      const width = el.clientWidth;
      if (width < 768) {
        setColumnsCount(1);
      } else if (width < 1280) {
        setColumnsCount(2);
      } else {
        setColumnsCount(3);
      }
    };

    updateDimensions();

    const ro = new ResizeObserver(() => {
      updateDimensions();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (firstCardRef.current) {
      const measured = firstCardRef.current.offsetHeight;
      if (measured > 100) {
        setRowHeight(measured + 16);
      }
    }
  }, [columnsCount, filteredPets.length]);

  const totalRows = Math.ceil(filteredPets.length / columnsCount);
  const totalVirtualHeight = totalRows * rowHeight;
  const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - 2);
  const endRow = Math.min(totalRows, Math.ceil((scrollTop + containerHeight) / rowHeight) + 2);
  const startIndex = startRow * columnsCount;
  const endIndex = Math.min(filteredPets.length, endRow * columnsCount);
  const visiblePets = filteredPets.slice(startIndex, endIndex);
  const topPadding = startRow * rowHeight;

  const handleCreatePetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.ownerName || !formData.ownerPhone) return;

    onAddPet({
      name: formData.name,
      species: formData.species,
      breed: formData.breed || 'نژاد نامشخص',
      gender: formData.gender,
      birthDate: formData.birthDate,
      ageText: formData.ageText,
      weightKg: Number(formData.weightKg),
      color: formData.color,
      microchipNumber: formData.microchipNumber,
      photoUrl: formData.photoUrl,
      ownerId: `own-${Date.now()}`,
      ownerName: formData.ownerName,
      ownerPhone: formData.ownerPhone,
      allergies: formData.allergies ? formData.allergies.split(',').map((a) => a.trim()) : [],
      statusInClinic: 'waiting',
      checkInTime: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      lastVisitDate: 'امروز (تشکیل پرونده)',
      nextVaccineDate: '۱۴۰۳/۰۷/۰۱',
      nextParasiteDate: '۱۴۰۳/۰۶/۱۵',
      notes: formData.notes,
      isVaccinated: true,
    });

    setIsAddModalOpen(false);
  };

  const handleOpenAdmissionModal = (pet: Pet) => {
    setAdmissionPet(pet);
    setAdmissionDestination('waiting');
    setAdmissionTriage('routine');
    setAdmissionReason('چکاپ و ویزیت دوره‌ای');
    setCustomReasonNote('');
  };

  const handleConfirmAdmission = (goToExamRoom = false) => {
    if (!admissionPet) return;
    const finalReason = customReasonNote
      ? `${admissionReason} - ${customReasonNote} (${admissionTriage === 'emergency' ? '🔴 تریاژ اورژانس' : admissionTriage === 'urgent' ? '🟡 تریاژ نیمه‌فوری' : '🟢 عادی'})`
      : `${admissionReason} (${admissionTriage === 'emergency' ? '🔴 تریاژ اورژانس' : admissionTriage === 'urgent' ? '🟡 تریاژ نیمه‌فوری' : '🟢 عادی'})`;

    const dest = goToExamRoom ? 'in_exam' : admissionDestination;
    onCheckInPet(admissionPet.id, dest, finalReason);

    const updated = {
      ...admissionPet,
      statusInClinic: dest,
      checkInTime: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      notes: admissionPet.notes ? `${admissionPet.notes} | پذیرش امروز: ${finalReason}` : `پذیرش امروز: ${finalReason}`,
    };

    setAdmissionPet(null);

    if (goToExamRoom && onNavigateToMedicalRecords) {
      onNavigateToMedicalRecords(updated);
    }
  };

  return (
    <div id="tab-reception-pets" className="space-y-6 animate-fadeIn pb-12">
      {/* Search & Actions Header */}
      <div className="bg-white p-5 rounded-[28px] border border-[#E6E9DF] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#5C7457] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجوی سریع پرونده با نام حیوان، نام سرپرست، شماره موبایل یا شماره میکروچیپ..."
              className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-2xl pr-10 pl-4 py-2.5 text-xs text-[#2D3A27] placeholder-[#5C7457]/70 focus:outline-hidden focus:ring-2 focus:ring-[#4A6741] focus:bg-white transition-all font-medium"
            />
          </div>

          <span
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-[11px] font-bold whitespace-nowrap"
            title="داده‌ها مستقیماً بر روی دیسک سرور ثبت و پایدار می‌شوند"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{presentCount} بیمار حاضر در کلینیک</span>
          </span>
        </div>

        {/* Filters & New Pet Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Presence Filter */}
          <div className="bg-[#F7F8F3] p-1 rounded-2xl border border-[#E6E9DF] flex items-center gap-1 text-[11px] font-bold">
            <button
              onClick={() => setPresenceFilter('all')}
              className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                presenceFilter === 'all' ? 'bg-[#4A6741] text-white shadow-xs' : 'text-[#5C7457] hover:bg-white'
              }`}
            >
              همه ({pets.length})
            </button>
            <button
              onClick={() => setPresenceFilter('present')}
              className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                presenceFilter === 'present' ? 'bg-[#4A6741] text-white shadow-xs' : 'text-[#5C7457] hover:bg-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>حاضران ({presentCount})</span>
            </button>
            <button
              onClick={() => setPresenceFilter('not_present')}
              className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                presenceFilter === 'not_present' ? 'bg-[#4A6741] text-white shadow-xs' : 'text-[#5C7457] hover:bg-white'
              }`}
            >
              خارج کلینیک
            </button>
          </div>

          {/* Species Filter */}
          <select
            value={speciesFilter}
            onChange={(e) => setSpeciesFilter(e.target.value)}
            aria-label="فیلتر بر اساس گونه حیوان"
            className="bg-[#F7F8F3] border border-[#E6E9DF] text-[#2D3A27] text-xs font-bold rounded-2xl px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-[#4A6741] cursor-pointer"
          >
            <option value="all">تمام گونه‌ها</option>
            <option value="سگ">سگ‌ها</option>
            <option value="گربه">گربه‌ها</option>
            <option value="پرنده">پرندگان</option>
            <option value="خرگوش و جوندگان">خرگوش و جوندگان</option>
          </select>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#4A6741] hover:bg-[#3D5535] active:scale-95 text-white px-4 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>تشکیل پرونده جدید</span>
          </button>
        </div>
      </div>

      {/* Pet Cards Grid with Virtual Windowing */}
      <div
        ref={containerRef}
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
        style={{ maxHeight: '68vh' }}
        className="overflow-y-auto custom-scrollbar pr-1 relative"
      >
        {filteredPets.length === 0 ? (
          <div className="py-16 text-center bg-white border border-[#E6E9DF] rounded-3xl p-8 shadow-xs my-2">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 mx-auto mb-4 font-black text-2xl">
              🔍
            </div>
            <h4 className="font-extrabold text-[#2D3A27] text-base mb-1">پرونده‌ای یافت نشد</h4>
            <p className="text-xs text-[#5C7457] max-w-md mx-auto mb-4">
              هیچ بیماری با فیلترهای جستجوی انتخابی مطابقت ندارد. می‌توانید عبارت جستجو یا فیلتر گونه و وضعیت را تغییر دهید.
            </p>
            {(searchTerm || speciesFilter !== 'all' || presenceFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSpeciesFilter('all');
                  setPresenceFilter('all');
                }}
                className="bg-[#F7F8F3] hover:bg-[#E6E9DF] text-[#2D3A27] border border-[#E6E9DF] px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                پاکسازی فیلترها
              </button>
            )}
          </div>
        ) : (
          <div style={{ height: `${totalVirtualHeight}px`, position: 'relative' }}>
            <div
              style={{
                transform: `translateY(${topPadding}px)`,
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
              }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            >
              {visiblePets.map((pet, idx) => {
                const isPresent = pet.statusInClinic && pet.statusInClinic !== 'not_present';
                const isDemoPet = pet.isDemo || !pet.isVerified;

                return (
                  <div
                    key={pet.id}
                    ref={idx === 0 ? firstCardRef : undefined}
                    className={`rounded-[24px] border transition-all p-5 shadow-xs flex flex-col justify-between ${
                      isDemoPet
                        ? 'bg-stone-100/90 border-2 border-dashed border-stone-300 text-stone-600'
                        : isPresent
                        ? 'bg-white border-[#4A6741] ring-2 ring-[#4A6741]/20'
                        : 'bg-white border-[#E6E9DF]'
                    }`}
                  >
              <div>
                {/* Header: Photo, Name, Status */}
                <div className="flex items-start gap-3.5">
                  <img
                    src={pet.photoUrl}
                    alt={pet.name}
                    className={`w-16 h-16 rounded-2xl object-cover shrink-0 shadow-xs ${
                      isDemoPet
                        ? 'grayscale-[75%] border border-stone-300 opacity-80 bg-stone-200'
                        : 'border border-[#E6E9DF]'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <h3 className={`text-base font-black truncate ${isDemoPet ? 'text-stone-700' : 'text-[#2D3A27]'}`}>
                          {pet.name}
                        </h3>
                        {isDemoPet && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-stone-300 text-stone-700 border border-stone-400">
                            پرونده غیرواقعی (طوسی)
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isDemoPet
                            ? 'bg-stone-200 text-stone-700'
                            : pet.statusInClinic === 'waiting'
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : pet.statusInClinic === 'in_boarding'
                            ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                            : pet.statusInClinic === 'in_grooming'
                            ? 'bg-teal-100 text-teal-900 border border-teal-200'
                            : pet.statusInClinic === 'in_exam'
                            ? 'bg-[#4A6741] text-white'
                            : 'bg-[#F7F8F3] text-[#5C7457]'
                        }`}
                      >
                        {pet.statusInClinic === 'waiting' && '⏳ در سالن انتظار'}
                        {pet.statusInClinic === 'in_boarding' && '🏠 بستری در پانسیون'}
                        {pet.statusInClinic === 'in_grooming' && '✂️ در آرایشگاه'}
                        {pet.statusInClinic === 'in_exam' && '🩺 در اتاق معاینه'}
                        {(!pet.statusInClinic || pet.statusInClinic === 'not_present') && 'خارج از کلینیک'}
                      </span>
                    </div>

                    <p className="text-xs text-[#5C7457] mt-0.5 truncate">
                      {pet.species} • {pet.breed} • {pet.gender}
                    </p>

                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-[#5C7457] font-medium">
                      <span>سن: {pet.ageText}</span>
                      <span>•</span>
                      <span>وزن: {pet.weightKg} کیلو</span>
                      {pet.checkInTime && isPresent && (
                        <>
                          <span>•</span>
                          <span className="text-[#4A6741] font-bold">ورود: {pet.checkInTime}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Owner & Microchip Details */}
                <div className="mt-4 pt-3 border-t border-[#E6E9DF] space-y-1 text-xs">
                  <div className="flex items-center justify-between text-[#5C7457]">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#5C7457]" />
                      <span>سرپرست: {pet.ownerName}</span>
                    </span>
                    <span className="font-mono text-[#2D3A27] font-bold">{pet.ownerPhone}</span>
                  </div>

                  <div className="flex items-center justify-between text-[#5C7457] text-[11px]">
                    <span>شماره میکروچیپ:</span>
                    <span className="font-mono font-bold text-[#4A6741] tracking-wider">{pet.microchipNumber}</span>
                  </div>
                </div>

                {/* Allergies Notice */}
                {pet.allergies && pet.allergies.length > 0 && (
                  <div className="mt-2.5 p-2 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800 font-semibold">
                    ⚠️ آلرژی: {pet.allergies.join('، ')}
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-[#E6E9DF] space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActivePetDrawer(pet)}
                    className="flex-1 bg-[#F7F8F3] hover:bg-[#E6E9DF] border border-[#E6E9DF] text-[#2D3A27] text-xs font-bold py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>مشاهده پرونده کامل</span>
                  </button>

                  <button
                    onClick={() => onPrintPassport(pet)}
                    className="p-2 bg-[#F7F8F3] hover:bg-[#E6E9DF] text-[#2D3A27] rounded-xl border border-[#E6E9DF] transition-colors cursor-pointer"
                    title="چاپ شناسنامه و کارت بهداشت استاندارد"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  {onDeletePet && (
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            `آیا از حذف پرونده ${pet.name} (${pet.ownerName}) اطمینان دارید؟ این عملیات روی دیتابیس ثبت می‌شود.`
                          )
                        ) {
                          onDeletePet(pet.id);
                        }
                      }}
                      className="p-2 bg-[#F7F8F3] hover:bg-rose-50 text-[#5C7457] hover:text-rose-600 rounded-xl border border-[#E6E9DF] transition-colors cursor-pointer"
                      title="حذف پرونده بیمار"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Presence & Admission Action Bar */}
                <div className="flex items-center gap-2">
                  {!isPresent ? (
                    <>
                      <button
                        onClick={() => handleOpenAdmissionModal(pet)}
                        className="flex-1 bg-[#4A6741] hover:bg-[#3D5535] text-white text-xs font-bold py-2 px-3 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <PawPrint className="w-3.5 h-3.5" />
                        <span>پذیرش و ارجاع به نوبت</span>
                      </button>
                      <button
                        onClick={() => onCheckInPet(pet.id, 'waiting')}
                        className="bg-[#F7F8F3] hover:bg-[#E6E9DF] text-[#2D3A27] border border-[#E6E9DF] text-xs font-bold py-2 px-3 rounded-xl transition-all cursor-pointer whitespace-nowrap"
                        title="پذیرش سریع مستقیم در سالن انتظار"
                      >
                        پذیرش سریع
                      </button>
                    </>
                  ) : (
                    <>
                      {onNavigateToMedicalRecords && (
                        <button
                          onClick={() => {
                            if (pet.statusInClinic !== 'in_exam') {
                              onCheckInPet(pet.id, 'in_exam');
                            }
                            onNavigateToMedicalRecords(pet);
                          }}
                          className="flex-1 bg-[#4A6741] hover:bg-[#3D5535] text-white text-xs font-bold py-2 px-3 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                        >
                          <Stethoscope className="w-3.5 h-3.5" />
                          <span>شروع ویزیت و معاینه</span>
                        </button>
                      )}

                      {onNavigateToCashier && (
                        <button
                          onClick={() => onNavigateToCashier(pet)}
                          className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200 transition-colors cursor-pointer"
                          title="انتقال به صندوق جهت صدور فاکتور"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => onCheckInPet(pet.id, 'not_present')}
                        className="bg-[#E6E9DF] hover:bg-rose-100 hover:text-rose-800 text-[#2D3A27] text-xs font-bold py-2 px-3 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                      >
                        ترخیص
                      </button>
                    </>
                  )}
                </div>
              </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Daily Admission Modal */}
      {admissionPet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D3A27]/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white text-[#2D3A27] w-full max-w-lg rounded-[28px] shadow-2xl border border-[#E6E9DF] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-[#E6E9DF] flex items-center justify-between bg-[#F7F8F3]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#4A6741] text-white flex items-center justify-center">
                  <PawPrint className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#2D3A27]">
                    ثبت پذیرش روزانه: {admissionPet.name}
                  </h3>
                  <p className="text-xs text-[#5C7457]">
                    سرپرست: {admissionPet.ownerName} • {admissionPet.breed}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAdmissionPet(null)}
                className="p-1.5 text-[#5C7457] hover:text-[#2D3A27] rounded-lg hover:bg-[#E6E9DF] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Destination Desk */}
              <div>
                <label className="block font-bold text-[#2D3A27] mb-1.5">مقصد ارجاع در کلینیک *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdmissionDestination('waiting')}
                    className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                      admissionDestination === 'waiting'
                        ? 'border-[#4A6741] bg-emerald-50/70 font-bold text-[#2D3A27]'
                        : 'border-[#E6E9DF] bg-[#F7F8F3] text-[#5C7457]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs">
                      <span>⏳</span>
                      <span>سالن انتظار عمومی</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">قرارگیری در صف نوبت روزانه</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdmissionDestination('in_exam')}
                    className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                      admissionDestination === 'in_exam'
                        ? 'border-[#4A6741] bg-emerald-50/70 font-bold text-[#2D3A27]'
                        : 'border-[#E6E9DF] bg-[#F7F8F3] text-[#5C7457]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs">
                      <span>🩺</span>
                      <span>اتاق معاینه (دکتر بیاتی)</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">ورود مستقیم جهت ویزیت پزشک</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdmissionDestination('in_grooming')}
                    className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                      admissionDestination === 'in_grooming'
                        ? 'border-[#4A6741] bg-emerald-50/70 font-bold text-[#2D3A27]'
                        : 'border-[#E6E9DF] bg-[#F7F8F3] text-[#5C7457]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs">
                      <span>✂️</span>
                      <span>بخش آرایش و گرومینگ</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">شستشو، اصلاح و بهداشت</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdmissionDestination('in_boarding')}
                    className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                      admissionDestination === 'in_boarding'
                        ? 'border-[#4A6741] bg-emerald-50/70 font-bold text-[#2D3A27]'
                        : 'border-[#E6E9DF] bg-[#F7F8F3] text-[#5C7457]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs">
                      <span>🏠</span>
                      <span>بخش پانسیون و بستری</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">نگهداری شبانه‌روزی و مراقبت</p>
                  </button>
                </div>
              </div>

              {/* Triage Level */}
              <div>
                <label className="block font-bold text-[#2D3A27] mb-1.5">سطح فوریت و تریاژ *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdmissionTriage('routine')}
                    className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                      admissionTriage === 'routine'
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : 'bg-[#F7F8F3] text-gray-600 border-[#E6E9DF]'
                    }`}
                  >
                    🟢 عادی (روتین)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdmissionTriage('urgent')}
                    className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                      admissionTriage === 'urgent'
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-[#F7F8F3] text-gray-600 border-[#E6E9DF]'
                    }`}
                  >
                    🟡 نیمه‌فوری
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdmissionTriage('emergency')}
                    className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                      admissionTriage === 'emergency'
                        ? 'bg-rose-100 text-rose-900 border-rose-300'
                        : 'bg-[#F7F8F3] text-gray-600 border-[#E6E9DF]'
                    }`}
                  >
                    🔴 اورژانس حاد
                  </button>
                </div>
              </div>

              {/* Reason for Visit */}
              <div>
                <label className="block font-bold text-[#2D3A27] mb-1.5">علت مراجعه و تقاضای سرپرست *</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    'چکاپ و ویزیت دوره‌ای',
                    'واکسیناسیون و انگل‌تراپی',
                    'بی‌حالی، تب و کاهش اشتها',
                    'مشکلات گوارشی یا استفراغ',
                    'مشکلات پوستی، خارش یا گوش',
                    'پانسمان و تزریقات درمانی',
                    'جراحی و بیهوشی',
                    'کوتاهی، شستشو و گرومینگ',
                  ].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setAdmissionReason(r)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        admissionReason === r
                          ? 'bg-[#4A6741] text-white border-[#4A6741] font-bold'
                          : 'bg-[#F7F8F3] text-[#2D3A27] border-[#E6E9DF] hover:bg-[#E6E9DF]'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={customReasonNote}
                  onChange={(e) => setCustomReasonNote(e.target.value)}
                  placeholder="توضیحات تکمیلی سرپرست (اختیاری)..."
                  className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-xl px-3 py-2 text-[#2D3A27] text-xs focus:outline-hidden focus:ring-2 focus:ring-[#4A6741]"
                />
              </div>
            </div>

            <div className="p-4 border-t border-[#E6E9DF] bg-[#F7F8F3] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAdmissionPet(null)}
                className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 cursor-pointer"
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={() => handleConfirmAdmission(false)}
                className="px-4 py-2.5 rounded-xl bg-[#4A6741] hover:bg-[#3D5535] text-white font-bold cursor-pointer shadow-xs active:scale-95"
              >
                ثبت پذیرش و ورود به صف کلینیک
              </button>

              {onNavigateToMedicalRecords && (
                <button
                  type="button"
                  onClick={() => handleConfirmAdmission(true)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5"
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>پذیرش و ورود مستقیم به اتاق ویزیت</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Pet Intake Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D3A27]/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white text-[#2D3A27] w-full max-w-xl rounded-[28px] shadow-2xl border border-[#E6E9DF] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-[#E6E9DF] flex items-center justify-between bg-[#F7F8F3]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#4A6741] text-white flex items-center justify-center">
                  <PawPrint className="w-4 h-4" />
                </div>
                <h3 className="text-base font-extrabold text-[#2D3A27]">
                  تشکیل پرونده جدید بیمار و پذیرش
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-[#5C7457] hover:text-[#2D3A27] rounded-lg hover:bg-[#E6E9DF] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePetSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2D3A27] mb-1">نام حیوان خانگی *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: لوسی، میلو، هیرو"
                    className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-xl px-3 py-2 text-[#2D3A27] focus:outline-hidden focus:ring-2 focus:ring-[#4A6741] font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#2D3A27] mb-1">گونه حیوان *</label>
                  <select
                    value={formData.species}
                    onChange={(e) => setFormData({ ...formData, species: e.target.value as SpeciesType })}
                    className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-xl px-3 py-2 text-[#2D3A27] focus:outline-hidden focus:ring-2 focus:ring-[#4A6741] font-medium cursor-pointer"
                  >
                    <option value="سگ">سگ</option>
                    <option value="گربه">گربه</option>
                    <option value="پرنده">پرنده</option>
                    <option value="خرگوش و جوندگان">خرگوش و جوندگان</option>
                    <option value="سایر و اگزاتیک">سایر و اگزاتیک</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2D3A27] mb-1">نژاد *</label>
                  <input
                    type="text"
                    required
                    value={formData.breed}
                    onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                    placeholder="مثال: پامرانین، پرشین، شیتزو"
                    className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-xl px-3 py-2 text-[#2D3A27] focus:outline-hidden focus:ring-2 focus:ring-[#4A6741]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#2D3A27] mb-1">جنسیت</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as GenderType })}
                    className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-xl px-3 py-2 text-[#2D3A27] focus:outline-hidden focus:ring-2 focus:ring-[#4A6741] cursor-pointer"
                  >
                    <option value="نر">نر</option>
                    <option value="ماده">ماده</option>
                    <option value="نر عقیم‌شده">نر عقیم‌شده</option>
                    <option value="ماده عقیم‌شده">ماده عقیم‌شده</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#2D3A27] mb-1">وزن (کیلوگرم)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.weightKg}
                    onChange={(e) => setFormData({ ...formData, weightKg: Number(e.target.value) })}
                    className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-xl px-3 py-2 text-[#2D3A27] focus:outline-hidden focus:ring-2 focus:ring-[#4A6741] font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#2D3A27] mb-1">سن تقریبی</label>
                  <input
                    type="text"
                    value={formData.ageText}
                    onChange={(e) => setFormData({ ...formData, ageText: e.target.value })}
                    placeholder="مثلاً: ۲ سال"
                    className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-xl px-3 py-2 text-[#2D3A27] focus:outline-hidden focus:ring-2 focus:ring-[#4A6741]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#2D3A27] mb-1">رنگ و علائم</label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="مثال: کرم نسکافه‌ای"
                    className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-xl px-3 py-2 text-[#2D3A27] focus:outline-hidden focus:ring-2 focus:ring-[#4A6741]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#2D3A27] mb-1">شماره میکروچیپ (۱۵ رقمی)</label>
                <input
                  type="text"
                  value={formData.microchipNumber}
                  onChange={(e) => setFormData({ ...formData, microchipNumber: e.target.value })}
                  className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-xl px-3 py-2 text-[#2D3A27] focus:outline-hidden focus:ring-2 focus:ring-[#4A6741] font-mono font-bold"
                />
              </div>

              {/* Owner Info */}
              <div className="pt-3 border-t border-[#E6E9DF]">
                <h4 className="font-black text-[#2D3A27] mb-2">مشخصات سرپرست / همراه</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#2D3A27] mb-1">نام و نام خانوادگی سرپرست *</label>
                    <input
                      type="text"
                      required
                      value={formData.ownerName}
                      onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                      placeholder="مثال: آرش علیزاده"
                      className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-xl px-3 py-2 text-[#2D3A27] focus:outline-hidden focus:ring-2 focus:ring-[#4A6741] font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#2D3A27] mb-1">شماره تماس همراه *</label>
                    <input
                      type="tel"
                      required
                      value={formData.ownerPhone}
                      onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-xl px-3 py-2 text-[#2D3A27] focus:outline-hidden focus:ring-2 focus:ring-[#4A6741] font-mono text-left font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Clinical Notes & Allergies */}
              <div className="pt-3 border-t border-[#E6E9DF] space-y-3">
                <div>
                  <label className="block font-bold text-[#2D3A27] mb-1">حساسیت‌ها یا هشدارها (با کاما جدا کنید)</label>
                  <input
                    type="text"
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    placeholder="مثال: پنی‌سیلین، غذای دریایی"
                    className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-xl px-3 py-2 text-[#2D3A27] focus:outline-hidden focus:ring-2 focus:ring-[#4A6741]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#2D3A27] mb-1">یادداشت اولیه پذیرش</label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="توضیحات در مورد رفتار حیوان، سابقه واکسیناسیون یا دلیل اولیه مراجعه..."
                    className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-xl px-3 py-2 text-[#2D3A27] focus:outline-hidden focus:ring-2 focus:ring-[#4A6741]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#E6E9DF] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#4A6741] hover:bg-[#3D5535] text-white font-bold cursor-pointer shadow-xs active:scale-95"
                >
                  ثبت پرونده و پذیرش فوری
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pet Detailed Drawer */}
      {activePetDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
          <div className="absolute inset-0 bg-[#2D3A27]/60 backdrop-blur-xs" onClick={() => setActivePetDrawer(null)} />

          <div className="fixed inset-y-0 left-0 max-w-full flex">
            <div className="w-screen max-w-lg bg-white shadow-2xl flex flex-col border-r border-[#E6E9DF]">
              {/* Drawer Header */}
              <div className="p-5 border-b border-[#E6E9DF] flex items-center justify-between bg-[#F7F8F3]">
                <div className="flex items-center gap-3">
                  <img
                    src={activePetDrawer.photoUrl}
                    alt={activePetDrawer.name}
                    className="w-12 h-12 rounded-2xl object-cover border border-[#E6E9DF]"
                  />
                  <div>
                    <h3 className="text-base font-black text-[#2D3A27]">{activePetDrawer.name}</h3>
                    <p className="text-xs text-[#5C7457]">
                      {activePetDrawer.breed} • {activePetDrawer.gender}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActivePetDrawer(null)}
                  className="p-1.5 text-[#5C7457] hover:text-[#2D3A27] rounded-lg hover:bg-[#E6E9DF] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Switcher Bar */}
              <div className="p-4 bg-emerald-50/50 border-b border-emerald-100 space-y-1.5">
                <div className="text-[11px] font-bold text-emerald-950 flex items-center justify-between">
                  <span>وضعیت استقرار بیمار در کلینیک:</span>
                  <span className="font-mono text-emerald-700">
                    {activePetDrawer.statusInClinic && activePetDrawer.statusInClinic !== 'not_present'
                      ? `حاضر (${activePetDrawer.checkInTime || 'امروز'})`
                      : 'خارج از کلینیک'}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1 text-[10px] font-bold">
                  {[
                    { key: 'waiting', label: 'سالن انتظار', icon: '⏳' },
                    { key: 'in_exam', label: 'اتاق معاینه', icon: '🩺' },
                    { key: 'in_grooming', label: 'آرایشگاه', icon: '✂️' },
                    { key: 'in_boarding', label: 'پانسیون', icon: '🏠' },
                    { key: 'not_present', label: 'ترخیص', icon: '🚪' },
                  ].map((s) => (
                    <button
                      key={s.key}
                      onClick={() => {
                        onCheckInPet(activePetDrawer.id, s.key as ClinicPresenceStatus);
                        setActivePetDrawer({ ...activePetDrawer, statusInClinic: s.key as ClinicPresenceStatus });
                      }}
                      className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                        activePetDrawer.statusInClinic === s.key ||
                        (!activePetDrawer.statusInClinic && s.key === 'not_present')
                          ? 'bg-[#4A6741] text-white border-[#4A6741] shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div>{s.icon}</div>
                      <div className="truncate mt-0.5">{s.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Drawer Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                {/* Microchip & QR */}
                <div className="p-4 bg-[#F7F8F3] border border-[#E6E9DF] rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-[#2D3A27]">
                    <span>شماره میکروچیپ بین‌المللی:</span>
                    <QrCode className="w-4 h-4 text-[#4A6741]" />
                  </div>
                  <div className="font-mono text-sm font-black text-[#4A6741] tracking-wider">
                    {activePetDrawer.microchipNumber}
                  </div>
                </div>

                {/* Health & Vaccine Schedule */}
                <div className="space-y-2">
                  <h4 className="font-black text-[#2D3A27] text-xs">برنامه واکسیناسیون و انگل‌تراپی:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-[#F7F8F3] border border-[#E6E9DF] rounded-xl">
                      <span className="text-[#5C7457] text-[10px]">موعد واکسن بعدی:</span>
                      <div className="font-bold text-[#2D3A27] mt-0.5">{activePetDrawer.nextVaccineDate}</div>
                    </div>
                    <div className="p-3 bg-[#F7F8F3] border border-[#E6E9DF] rounded-xl">
                      <span className="text-[#5C7457] text-[10px]">انگل‌تراپی دوره‌ای:</span>
                      <div className="font-bold text-[#2D3A27] mt-0.5">{activePetDrawer.nextParasiteDate}</div>
                    </div>
                  </div>
                </div>

                {/* Owner Information */}
                <div className="p-4 bg-[#F7F8F3] border border-[#E6E9DF] rounded-2xl space-y-2">
                  <h4 className="font-black text-[#2D3A27]">اطلاعات سرپرست:</h4>
                  <div className="space-y-1 text-[#2D3A27]">
                    <div>
                      <strong>نام:</strong> {activePetDrawer.ownerName}
                    </div>
                    <div>
                      <strong>شماره تماس:</strong> <span className="font-mono">{activePetDrawer.ownerPhone}</span>
                    </div>
                    <div>
                      <strong>آخرین مراجعه:</strong> {activePetDrawer.lastVisitDate}
                    </div>
                  </div>
                </div>

                {/* Clinical Notes */}
                {activePetDrawer.notes && (
                  <div className="p-4 bg-[#F7F8F3] border border-[#E6E9DF] rounded-2xl space-y-1">
                    <h4 className="font-black text-[#2D3A27]">یادداشت‌های بالینی و پذیرش:</h4>
                    <p className="text-[#5C7457] leading-relaxed">{activePetDrawer.notes}</p>
                  </div>
                )}
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 bg-[#F7F8F3] border-t border-[#E6E9DF] flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  {onNavigateToMedicalRecords && (
                    <button
                      onClick={() => {
                        if (activePetDrawer.statusInClinic !== 'in_exam') {
                          onCheckInPet(activePetDrawer.id, 'in_exam');
                        }
                        const p = activePetDrawer;
                        setActivePetDrawer(null);
                        onNavigateToMedicalRecords(p);
                      }}
                      className="flex-1 bg-[#4A6741] hover:bg-[#3D5535] text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
                    >
                      <Stethoscope className="w-4 h-4" />
                      <span>انتقال به اتاق معاینه و ثبت ویزیت</span>
                    </button>
                  )}

                  {onNavigateToCashier && (
                    <button
                      onClick={() => {
                        const p = activePetDrawer;
                        setActivePetDrawer(null);
                        onNavigateToCashier(p);
                      }}
                      className="px-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                      title="ثبت یا تسویه فاکتور در صندوق"
                    >
                      <Receipt className="w-4 h-4" />
                      <span>صندوق</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => {
                    onPrintPassport(activePetDrawer);
                    setActivePetDrawer(null);
                  }}
                  className="w-full bg-white hover:bg-gray-100 text-gray-800 border border-[#E6E9DF] font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>چاپ شناسنامه و کارت بهداشت استاندارد</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
