import React, { useState } from 'react';
import {
  Car,
  MapPin,
  Phone,
  User,
  ShieldAlert,
  CheckCircle2,
  X,
  Sparkles,
  Info,
  Clock,
  Send,
  Navigation,
  Check,
  AlertTriangle,
  Copy,
  ExternalLink,
  Map,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SnappPetTaxiRequest, Pet, Owner, ClinicProfileConfig } from '../types';
import { CLINIC_LOCATION } from '../constants/clinicLocation';

interface SnappPetTaxiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestDispatched?: (req: SnappPetTaxiRequest) => void;
  pets: Pet[];
  owners: Owner[];
  clinicProfile?: ClinicProfileConfig;
}

export const SnappPetTaxiModal: React.FC<SnappPetTaxiModalProps> = ({
  isOpen,
  onClose,
  onRequestDispatched,
  pets,
  owners,
  clinicProfile,
}) => {
  const [selectedPetId, setSelectedPetId] = useState<string>(pets[0]?.id || '');
  const selectedPet = pets.find((p) => p.id === selectedPetId);
  const selectedOwner = owners.find((o) => o.id === selectedPet?.ownerId);

  const [pickupAddress, setPickupAddress] = useState(
    selectedOwner?.address || 'اصفهان، مرداویج، میدان برج، خیابان آزادی، پلاک ۱۲'
  );
  const [destinationAddress, setDestinationAddress] = useState(
    clinicProfile?.address
      ? `${clinicProfile.address}، ${clinicProfile.clinicName || CLINIC_LOCATION.nameFa}`
      : CLINIC_LOCATION.fullAddressWithClinic
  );
  const [isForAnotherPerson, setIsForAnotherPerson] = useState(true);
  const [passengerMobile, setPassengerMobile] = useState(selectedOwner?.phone || '۰۹۱۲۱۱۱۲۲۳۳');
  const [hasPetCarrierBox, setHasPetCarrierBox] = useState(true);
  const [accompanyingHuman, setAccompanyingHuman] = useState(true);
  const [snappRideType, setSnappRideType] = useState<'snapp_eco' | 'snapp_plus' | 'snapp_van'>('snapp_plus');
  const [showMapEmbed, setShowMapEmbed] = useState(true);
  const [copiedLocation, setCopiedLocation] = useState(false);

  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchedTrip, setDispatchedTrip] = useState<SnappPetTaxiRequest | null>(null);

  if (!isOpen) return null;

  // Auto-generate instructions for Snapp driver
  const generateDriverNote = () => {
    let note = `همراه مسافر یک پت (${selectedPet?.species || 'حیوان خانگی'} نژاد ${selectedPet?.breed || ''})`;
    if (hasPetCarrierBox) {
      note += ' درون باکس حمل استاندارد و تمیز قرار دارد.';
    } else {
      note += ' با قلاده و پتوی بهداشتی بوده و مسئولیت نظافت کامل با صاحب پت است.';
    }
    if (!accompanyingHuman) {
      note += ' (پت بدون همراه انسان اعزام می‌شود و تحویل گیرنده در مقصد پرسنل پذیرش کلینیک مهرگان خواهند بود).';
    }
    note += `\n📍 مقصد نهایی: ${destinationAddress}`;
    note += `\n📌 مختصات دقیق GPS: ${CLINIC_LOCATION.taxiCoordinatesString}`;
    note += `\n🚗 راهنمای دسترسی: اصفهان، خیابان توحید میانی، حدفاصل مهرداد و شریعتی، کوچه مشکلانی ۲۲ (کلینیک دامپزشکی مهرگان)`;
    return note;
  };

  const handleCopyLocationForTaxi = () => {
    const textToCopy = `مقصد تاکسی: ${destinationAddress}\nمختصات جغرافیایی: ${CLINIC_LOCATION.taxiCoordinatesString}\nلینک نقشه گوگل: ${CLINIC_LOCATION.googleMapsShortUrl}\nلینک مسیریاب نشان: ${CLINIC_LOCATION.neshanUrl}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedLocation(true);
    setTimeout(() => setCopiedLocation(false), 2500);
  };

  const handleDispatch = () => {
    setIsDispatching(true);
    setTimeout(() => {
      const newTrip: SnappPetTaxiRequest = {
        id: `snapp-${Date.now()}`,
        petId: selectedPetId,
        petName: selectedPet?.name || 'پت',
        ownerName: selectedOwner?.name || 'صاحب پت',
        ownerPhone: passengerMobile,
        pickupAddress,
        pickupCoordinates: { lat: 32.6105, lng: 51.6680 },
        destinationAddress,
        destinationCoordinates: {
          lat: CLINIC_LOCATION.coordinates.lat,
          lng: CLINIC_LOCATION.coordinates.lng,
        },
        googleMapsUrl: CLINIC_LOCATION.googleMapsShortUrl,
        neshanUrl: CLINIC_LOCATION.neshanUrl,
        baladUrl: CLINIC_LOCATION.baladUrl,
        wazeUrl: CLINIC_LOCATION.wazeUrl,
        isForAnotherPerson,
        passengerMobileGivenToSnapp: passengerMobile,
        hasPetCarrierBox,
        accompanyingHuman,
        driverSpecialInstructionText: generateDriverNote(),
        snappRideType,
        estimatedCostToman: snappRideType === 'snapp_van' ? 95000 : snappRideType === 'snapp_plus' ? 68000 : 52000,
        tripStatus: 'driver_assigned',
        driverName: 'آقای مجید فراهانی',
        driverVehiclePlate: 'ایران ۶۷ - ۸۷۲ ج ۳۳ (پژو پارس سفید)',
        driverPhone: '۰۹۱۹۵۵۵۸۸۲۲',
        driverEtaMinutes: 4,
        createdAt: 'امروز، ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      };
      setDispatchedTrip(newTrip);
      setIsDispatching(false);
      onRequestDispatched?.(newTrip);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-[#FAFBF7] w-full max-w-2xl rounded-2xl shadow-2xl border border-[#E6E9DF] overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#1F6E43] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2D8E58] flex items-center justify-center text-white shadow-inner">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">اعزام اسنپ پت‌تاکسی (Snapp Pet Taxi)</h2>
              <p className="text-xs text-emerald-100">
                سرویس اعزام هوشمند تاکسی اینترنتی جهت ترانسفر ایمن پت و همراه به کلینیک مهرگان
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-emerald-200 hover:text-white p-2 rounded-lg hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {!dispatchedTrip ? (
            <>
              {/* Pet & Owner Select */}
              <div className="bg-white p-4 rounded-xl border border-[#E6E9DF] space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#4B5E43] mb-1">انتخاب بیمار / پت</label>
                    <select
                      value={selectedPetId}
                      onChange={(e) => {
                        setSelectedPetId(e.target.value);
                        const pet = pets.find((p) => p.id === e.target.value);
                        const o = owners.find((ow) => ow.id === pet?.ownerId);
                        if (o) setPassengerMobile(o.phone);
                      }}
                      className="w-full bg-[#F7F8F3] border border-[#D5DDD0] rounded-xl px-3 py-2 text-xs font-bold text-[#2D3A27] outline-hidden"
                    >
                      {pets.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.species} - {p.breed})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#4B5E43] mb-1">موبایل مسافر (جهت پیامک اسنپ)</label>
                    <input
                      type="text"
                      value={passengerMobile}
                      onChange={(e) => setPassengerMobile(e.target.value)}
                      className="w-full bg-[#F7F8F3] border border-[#D5DDD0] rounded-xl px-3 py-2 text-xs font-mono text-[#2D3A27] outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Addresses */}
              <div className="bg-white p-4 rounded-xl border border-[#E6E9DF] space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#4B5E43] mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    مبدأ سوار شدن پت / همراه
                  </label>
                  <input
                    type="text"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    className="w-full bg-[#F7F8F3] border border-[#D5DDD0] rounded-xl px-3 py-2 text-xs text-[#2D3A27] outline-hidden"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#4B5E43] flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-red-600" />
                      مقصد (کلینیک دامپزشکی مهرگان اصفهان)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleCopyLocationForTaxi}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1 font-bold"
                        title="کپی متن کامل نشانی و مختصات برای راننده اسنپ / تپسی"
                      >
                        <Copy className="w-3 h-3 text-emerald-600" />
                        <span>{copiedLocation ? 'کپی شد!' : 'کپی لوکیشن برای تاکسی'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowMapEmbed(!showMapEmbed)}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-[#F0F4EC] text-[#2D3A27] hover:bg-[#E3EADc] flex items-center gap-1 font-bold"
                      >
                        <Map className="w-3 h-3 text-emerald-700" />
                        <span>{showMapEmbed ? 'بستن نقشه' : 'نمایش نقشه'}</span>
                        {showMapEmbed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={destinationAddress}
                    onChange={(e) => setDestinationAddress(e.target.value)}
                    className="w-full bg-[#F7F8F3] border border-[#D5DDD0] rounded-xl px-3 py-2 text-xs text-[#2D3A27] font-medium outline-hidden"
                  />

                  {/* Destination Info & Quick Navigation Links */}
                  <div className="mt-2 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] bg-emerald-50/60 p-2 rounded-xl border border-emerald-200/80">
                      <span className="text-emerald-900 font-bold flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        نقطه ثبت‌شده در گوگل: Mehregan vet clinic ({CLINIC_LOCATION.coordinates.lat.toFixed(5)}, {CLINIC_LOCATION.coordinates.lng.toFixed(5)})
                      </span>
                      <a
                        href={CLINIC_LOCATION.googleMapsShortUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-700 hover:underline font-bold flex items-center gap-1"
                      >
                        مشاهده در گوگل مپ <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {/* Collapsible Verified Google Maps Embed */}
                    {showMapEmbed && (
                      <div className="w-full h-48 rounded-xl overflow-hidden border border-[#D5DDD0] shadow-2xs relative bg-[#E9EFE6]">
                        <iframe
                          src={CLINIC_LOCATION.googleMapsEmbedUrl}
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="strict-origin-when-cross-origin"
                          title="نقشه رسمی کلینیک دامپزشکی مهرگان"
                          className="w-full h-full"
                        />
                      </div>
                    )}

                    {/* Routing Apps Shortcut Buttons */}
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      <a
                        href={CLINIC_LOCATION.googleMapsShortUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1.5 rounded-lg bg-white border border-[#D5DDD0] hover:border-emerald-500 hover:bg-emerald-50/50 text-center transition-all"
                      >
                        <div className="text-[11px] font-bold text-[#2D3A27]">Google Maps</div>
                        <div className="text-[9px] text-[#738A6E]">نقشه رسمی</div>
                      </a>
                      <a
                        href={CLINIC_LOCATION.neshanUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1.5 rounded-lg bg-white border border-[#D5DDD0] hover:border-blue-500 hover:bg-blue-50/50 text-center transition-all"
                      >
                        <div className="text-[11px] font-bold text-[#2D3A27]">مسیریاب نشان</div>
                        <div className="text-[9px] text-[#738A6E]">سخنگو</div>
                      </a>
                      <a
                        href={CLINIC_LOCATION.baladUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1.5 rounded-lg bg-white border border-[#D5DDD0] hover:border-emerald-500 hover:bg-emerald-50/50 text-center transition-all"
                      >
                        <div className="text-[11px] font-bold text-[#2D3A27]">مسیریاب بلد</div>
                        <div className="text-[9px] text-[#738A6E]">ترافیک زنده</div>
                      </a>
                      <a
                        href={CLINIC_LOCATION.wazeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1.5 rounded-lg bg-white border border-[#D5DDD0] hover:border-cyan-500 hover:bg-cyan-50/50 text-center transition-all"
                      >
                        <div className="text-[11px] font-bold text-[#2D3A27]">ویز (Waze)</div>
                        <div className="text-[9px] text-[#738A6E]">مسیر سریع</div>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pet Transport Options */}
              <div className="bg-white p-4 rounded-xl border border-[#E6E9DF] space-y-3">
                <h4 className="text-xs font-bold text-[#2D3A27] flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-[#1F6E43]" />
                  شرایط بهداشتی و پروتکل حمل پت
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <label className="flex items-center gap-2 p-3 bg-[#F7F8F3] rounded-xl border border-[#D5DDD0] cursor-pointer hover:bg-emerald-50/50">
                    <input
                      type="checkbox"
                      checked={hasPetCarrierBox}
                      onChange={(e) => setHasPetCarrierBox(e.target.checked)}
                      className="rounded-sm text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <div>
                      <span className="text-xs font-bold text-[#2D3A27] block">پت درون باکس حمل استاندارد است</span>
                      <span className="text-[10px] text-[#738A6E]">تایید پذیرش توسط راننده با احتمال ۱۰۰٪</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-[#F7F8F3] rounded-xl border border-[#D5DDD0] cursor-pointer hover:bg-emerald-50/50">
                    <input
                      type="checkbox"
                      checked={accompanyingHuman}
                      onChange={(e) => setAccompanyingHuman(e.target.checked)}
                      className="rounded-sm text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <div>
                      <span className="text-xs font-bold text-[#2D3A27] block">همراه انسان با پت در خودرو حضور دارد</span>
                      <span className="text-[10px] text-[#738A6E]">یا اعزام پت به تنهایی به مسئولیت کلینیک</span>
                    </div>
                  </label>
                </div>

                {/* Snapp Service Type */}
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSnappRideType('snapp_eco')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      snappRideType === 'snapp_eco'
                        ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900 font-bold'
                        : 'border-[#D5DDD0] bg-white text-[#5C7457]'
                    }`}
                  >
                    <div className="text-xs">اسنپ اقتصادی</div>
                    <div className="text-[11px] font-mono text-emerald-700 mt-1">۵۲,۰۰۰ تومان</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSnappRideType('snapp_plus')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      snappRideType === 'snapp_plus'
                        ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900 font-bold shadow-xs ring-1 ring-emerald-500'
                        : 'border-[#D5DDD0] bg-white text-[#5C7457]'
                    }`}
                  >
                    <div className="text-xs flex items-center justify-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      اسنپ پلاس (پیشنهادی)
                    </div>
                    <div className="text-[11px] font-mono text-emerald-700 mt-1">۶۸,۰۰۰ تومان</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSnappRideType('snapp_van')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      snappRideType === 'snapp_van'
                        ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900 font-bold'
                        : 'border-[#D5DDD0] bg-white text-[#5C7457]'
                    }`}
                  >
                    <div className="text-xs">اسنپ ون (سگ بزرگ)</div>
                    <div className="text-[11px] font-mono text-emerald-700 mt-1">۹۵,۰۰۰ تومان</div>
                  </button>
                </div>

                {/* Auto Generated Driver Note */}
                <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-950">
                    <Info className="w-3.5 h-3.5 text-amber-700" />
                    پیام خودکار درج‌شده برای راننده اسنپ (Driver Special Note):
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-800">{generateDriverNote()}</p>
                </div>
              </div>
            </>
          ) : (
            /* Live Trip Active Display */
            <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-lg space-y-5 text-center">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <Car className="w-7 h-7" />
              </div>

              <div>
                <span className="inline-block bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full mb-2">
                  راننده اسنپ در راه است (ETA: {dispatchedTrip.driverEtaMinutes} دقیقه)
                </span>
                <h3 className="text-base font-bold text-[#2D3A27]">{dispatchedTrip.driverName}</h3>
                <p className="text-xs text-[#5C7457] font-mono mt-1">{dispatchedTrip.driverVehiclePlate}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-right bg-[#F7F8F3] p-4 rounded-xl border border-[#D5DDD0] text-xs">
                <div>
                  <span className="text-[#738A6E] block text-[11px]">تماس با راننده:</span>
                  <span className="font-mono font-bold text-[#2D3A27]">{dispatchedTrip.driverPhone}</span>
                </div>
                <div>
                  <span className="text-[#738A6E] block text-[11px]">کرایه سفر:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {dispatchedTrip.estimatedCostToman.toLocaleString('fa-IR')} تومان
                  </span>
                </div>
                <div className="col-span-2 pt-2 border-t border-[#D5DDD0]">
                  <span className="text-[#738A6E] block text-[11px]">پیامک وضعیت:</span>
                  <span className="text-[#2D3A27]">
                    لینک ردیابی زنده سفر به شماره {dispatchedTrip.passengerMobileGivenToSnapp} ارسال شد.
                  </span>
                </div>

                {/* Driver Navigation Shortcuts */}
                <div className="col-span-2 pt-2 border-t border-[#D5DDD0] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[#4B5E43] font-bold text-[11px] flex items-center gap-1">
                      <Navigation className="w-3 h-3 text-emerald-600" />
                      هدایت راننده به مقصد کلینیک مهرگان (اصفهان):
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyLocationForTaxi}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-bold flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedLocation ? 'کپی شد!' : 'کپی لوکیشن'}
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    <a
                      href={dispatchedTrip.googleMapsUrl || CLINIC_LOCATION.googleMapsShortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1.5 rounded-lg bg-white border border-[#D5DDD0] hover:border-emerald-600 hover:bg-emerald-50/60 text-center transition-all text-[11px] font-bold text-[#2D3A27]"
                    >
                      گوگل مپ
                    </a>
                    <a
                      href={dispatchedTrip.neshanUrl || CLINIC_LOCATION.neshanUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1.5 rounded-lg bg-white border border-[#D5DDD0] hover:border-blue-600 hover:bg-blue-50/60 text-center transition-all text-[11px] font-bold text-[#2D3A27]"
                    >
                      مسیریاب نشان
                    </a>
                    <a
                      href={dispatchedTrip.baladUrl || CLINIC_LOCATION.baladUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1.5 rounded-lg bg-white border border-[#D5DDD0] hover:border-emerald-600 hover:bg-emerald-50/60 text-center transition-all text-[11px] font-bold text-[#2D3A27]"
                    >
                      مسیریاب بلد
                    </a>
                    <a
                      href={dispatchedTrip.wazeUrl || CLINIC_LOCATION.wazeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1.5 rounded-lg bg-white border border-[#D5DDD0] hover:border-cyan-600 hover:bg-cyan-50/60 text-center transition-all text-[11px] font-bold text-[#2D3A27]"
                    >
                      ویز (Waze)
                    </a>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setDispatchedTrip(null)}
                className="text-xs text-[#4A6741] hover:underline font-bold"
              >
                ثبت درخواست سفر جدید
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-[#E6E9DF] flex items-center justify-between">
          <div className="text-[11px] text-[#738A6E]">پروتکل رسمی اعزام تاکسی پت کلینیک مهرگان</div>
          {!dispatchedTrip ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#5C7457] hover:bg-[#F7F8F3]"
              >
                انصراف
              </button>
              <button
                onClick={handleDispatch}
                disabled={isDispatching}
                className="bg-[#1F6E43] text-white hover:bg-[#185534] px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all disabled:opacity-50"
              >
                {isDispatching ? (
                  <>در حال استعلام و اعزام اسنپ...</>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    تایید و اعزام راننده اسنپ
                  </>
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="bg-[#1F6E43] text-white hover:bg-[#185534] px-5 py-2 rounded-xl text-xs font-bold"
            >
              بستن پنجره
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
