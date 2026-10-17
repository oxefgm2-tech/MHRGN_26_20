import React, { useState, useEffect } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOff,
  Mic,
  Volume2,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Clock,
  Calendar,
  AlertTriangle,
  Send,
  Sparkles,
  ShoppingBag,
  MapPin,
  HelpCircle,
  Settings,
  Cpu,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  Check,
  X,
  FileText,
  Radio,
  Sliders,
  ChevronDown,
  ChevronUp,
  Share2,
  Zap,
  Copy,
  Plus,
  Trash2,
  Truck,
  Bot,
  CheckSquare,
  Square,
  Layers,
  ListFilter,
  Download,
  Folder,
} from 'lucide-react';
import {
  DialUpModemDevice,
  TelephonyCallRecord,
  TelephonyIvrConfig,
  TelephonyQueueType,
  Pet,
  Appointment,
  StructuredOrderItem,
  StructuredOrderData,
} from '../../types';
import {
  INITIAL_MODEMS,
  INITIAL_IVR_CONFIG,
  INITIAL_TELEPHONY_CALLS,
  MODEM_AT_COMMANDS,
} from '../../services/telephonyModemService';
import {
  generateBaleClinicInfo,
  generateBaleWorkingHours,
  generateBaleMenuConfig,
} from '../../services/baleBotSyncService';

interface TelephonySecretaryTabProps {
  pets: Pet[];
  onAddAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt'>) => void;
  onOpenVoiceModal?: () => void;
}

// Web Audio synthesizer for phone tones (DTMF, beep, ring)
function playTelephoneAudioTone(type: 'beep' | 'ring' | 'dtmf') {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (type === 'beep') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'dtmf') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.frequency.value = 697;
      osc2.frequency.value = 1336;
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.25);
      osc2.stop(ctx.currentTime + 0.25);
    } else if (type === 'ring') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(425, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    }
  } catch {
    // Ignore audio errors if blocked by browser policy
  }
}

export const TelephonySecretaryTab: React.FC<TelephonySecretaryTabProps> = ({
  pets,
  onAddAppointment,
  onOpenVoiceModal,
}) => {
  const [activeQueue, setActiveQueue] = useState<TelephonyQueueType | 'all' | 'settings' | 'bale_bot' | 'batch_review'>('surgery_appointment');
  const [modems, setModems] = useState<DialUpModemDevice[]>(INITIAL_MODEMS);
  const [ivrConfig, setIvrConfig] = useState<TelephonyIvrConfig>(INITIAL_IVR_CONFIG);
  const [calls, setCalls] = useState<TelephonyCallRecord[]>(INITIAL_TELEPHONY_CALLS);
  const [isLoading, setIsLoading] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Audio Playback simulation
  const [playingCallId, setPlayingCallId] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);

  // Live call simulator modal state
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simPhone, setSimPhone] = useState('09133115509');
  const [simKey, setSimKey] = useState<'1' | '2' | '3'>('2');
  const [simAudioText, setSimAudioText] = useState(
    'سلام، برای عمل عقیم‌سازی سگم تماس گرفتم. لطفاً برای نوبت جراحی با دکتر بیاتی وقت مشخص فرمایید.'
  );
  const [isSimulating, setIsSimulating] = useState(false);

  // Expandable notes state
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  // Pet Shop Order Modal & Structured State
  const [isPetShopModalOpen, setIsPetShopModalOpen] = useState(false);
  const [activePetShopCall, setActivePetShopCall] = useState<TelephonyCallRecord | null>(null);
  const [isAiStructuring, setIsAiStructuring] = useState(false);
  const [orderItems, setOrderItems] = useState<StructuredOrderItem[]>([]);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'courier_snapp' | 'in_person' | 'unspecified'>('courier_snapp');
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // End-of-Day Batch Review State
  const [selectedCallIds, setSelectedCallIds] = useState<string[]>([]);
  const [isBatchReviewing, setIsBatchReviewing] = useState(false);

  // Bale Bot Modal / Config Viewer State
  const [baleConfigModal, setBaleConfigModal] = useState<{ open: boolean; title: string; json: string }>({
    open: false,
    title: '',
    json: '',
  });
  const [baleSimName, setBaleSimName] = useState('سرپرست لئو (بله)');
  const [baleSimPhone, setBaleSimPhone] = useState('09132224455');
  const [baleSimMsg, setBaleSimMsg] = useState('درخواست رزرو نوبت واکسیناسیون و صدور شناسنامه بین‌المللی');
  const [isSendingBaleWebhook, setIsSendingBaleWebhook] = useState(false);

  // Fetch live calls and modems from API on mount
  const fetchTelephonyData = async () => {
    setIsLoading(true);
    try {
      const [callsRes, modemsRes, configRes] = await Promise.all([
        fetch('/api/telephony/calls').then((r) => r.json()).catch(() => null),
        fetch('/api/telephony/modems').then((r) => r.json()).catch(() => null),
        fetch('/api/telephony/config').then((r) => r.json()).catch(() => null),
      ]);

      if (callsRes?.success && Array.isArray(callsRes.calls)) {
        setCalls(callsRes.calls);
      }
      if (modemsRes?.success && Array.isArray(modemsRes.modems)) {
        setModems(modemsRes.modems);
      }
      if (configRes?.success && configRes.config) {
        setIvrConfig(configRes.config);
      }
    } catch {
      // Keep initial
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTelephonyData();
  }, []);

  // Audio Playback Timer
  useEffect(() => {
    let interval: any;
    if (playingCallId) {
      playTelephoneAudioTone('beep');
      interval = setInterval(() => {
        setPlaybackProgress((prev) => {
          if (prev >= 100) {
            setPlayingCallId(null);
            return 0;
          }
          return prev + 5;
        });
      }, 300);
    } else {
      setPlaybackProgress(0);
    }
    return () => clearInterval(interval);
  }, [playingCallId]);

  const audioElemRef = React.useRef<HTMLAudioElement | null>(null);

  const handleTogglePlayAudio = (callId: string, audioUrl?: string) => {
    if (playingCallId === callId) {
      if (audioElemRef.current) {
        audioElemRef.current.pause();
      }
      setPlayingCallId(null);
    } else {
      if (audioElemRef.current) {
        audioElemRef.current.pause();
      }
      setPlayingCallId(callId);
      setPlaybackProgress(0);

      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audioElemRef.current = audio;
        audio.ontimeupdate = () => {
          if (audio.duration) {
            setPlaybackProgress((audio.currentTime / audio.duration) * 100);
          }
        };
        audio.onended = () => {
          setPlayingCallId(null);
          setPlaybackProgress(0);
        };
        audio.play().catch(() => {
          playTelephoneAudioTone('beep');
        });
      } else {
        playTelephoneAudioTone('beep');
      }
    }
  };

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Convert call voicemail to clinic appointment
  const handleConvertToAppointment = async (call: TelephonyCallRecord) => {
    try {
      const res = await fetch(`/api/telephony/calls/${call.id}/convert-to-appointment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petName: 'پت تماس صوتی',
          appointmentDate: 'فردا',
          appointmentTime: '۱۸:۰۰ - ۱۸:۳۰',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`نوبت با موفقیت در صف پذیرش کلینیک ثبت شد. (${data.appointment.queueCode})`);
        onAddAppointment({
          petId: 'pet-telephony-temp',
          petName: 'پت منشی صوتی گویا',
          petBreed: 'نامشخص',
          ownerId: 'owner-telephony-temp',
          ownerName: call.callerName || call.callerId,
          ownerPhone: call.callerId,
          date: 'فردا',
          timeSlot: '۱۸:۰۰ - ۱۸:۳۰',
          serviceType: call.queueType === 'surgery_appointment' ? 'جراحی و معاینه تخصصی' : 'معاینه عمومی',
          vetId: 'u-1',
          vetName: 'دکتر امین بیاتی',
          status: 'scheduled',
          appointmentType: 'future_appointment',
          requiresDeposit: false,
          depositAmount: 0,
          depositStatus: 'none',
          reminder24hSent: false,
          notes: `ثبت تلفنی با منشی صوتی مودم - شماره: ${call.callerId}\nمتن صوت: ${call.extractedTranscript || ''}`,
        });

        setCalls((prev) =>
          prev.map((c) =>
            c.id === call.id ? { ...c, status: 'converted_to_appointment', convertedEntityId: data.appointment.id } : c
          )
        );
      }
    } catch {
      showNotification('خطا در تبدیل نوبت به سامانه پذیرش');
    }
  };

  // Open Pet Shop Order Modal & Parse Transcript
  const handleOpenPetShopOrderModal = async (call: TelephonyCallRecord) => {
    setActivePetShopCall(call);
    setIsPetShopModalOpen(true);
    setRecipientName(call.callerName || `مشتری تلفنی ${call.callerId}`);
    setRecipientPhone(call.callerId);
    setDeliveryMethod('courier_snapp');

    if (call.structuredOrderData && call.structuredOrderData.items?.length > 0) {
      setOrderItems(call.structuredOrderData.items);
      setShippingAddress(call.structuredOrderData.shippingAddress || 'اصفهان (تماس تلفنی جهت اخذ لوکیشن)');
      return;
    }

    // Call AI / NLP structuring endpoint
    setIsAiStructuring(true);
    try {
      const res = await fetch('/api/telephony/ai-structure-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: call.extractedTranscript || '',
          callerPhone: call.callerId,
          callerName: call.callerName,
        }),
      });
      const data = await res.json();
      if (data.success && data.structuredData) {
        setOrderItems(data.structuredData.items || []);
        setShippingAddress(data.structuredData.shippingAddress || 'اصفهان، خیابان توحید یا اطراف کلینیک');
        if (data.structuredData.recipientName) setRecipientName(data.structuredData.recipientName);
        if (data.structuredData.deliveryMethod) setDeliveryMethod(data.structuredData.deliveryMethod);
      } else {
        setOrderItems([
          { name: 'اقلام سفارش داده شده در پیام صوتی', quantity: 1, unitPrice: 350000 },
        ]);
        setShippingAddress('اصفهان (هماهنگی با پیک)');
      }
    } catch {
      setOrderItems([
        { name: 'اقلام سفارش داده شده در پیام صوتی', quantity: 1, unitPrice: 350000 },
      ]);
      setShippingAddress('اصفهان (هماهنگی با پیک)');
    } finally {
      setIsAiStructuring(false);
    }
  };

  // Convert Pet Shop Order to Invoice & Staff Task
  const handleSavePetShopOrder = async () => {
    if (!activePetShopCall) return;
    setIsSavingOrder(true);
    try {
      const estimatedTotal = orderItems.reduce(
        (sum, it) => sum + (Number(it.unitPrice) || 0) * (Number(it.quantity) || 1),
        0
      );
      const res = await fetch(`/api/telephony/calls/${activePetShopCall.id}/convert-to-petshop-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: orderItems,
          recipientName,
          recipientPhone,
          shippingAddress,
          deliveryMethod,
          estimatedTotal,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification(data.message || 'سفارش پت‌شاپ با موفقیت در سیستم مالی و کارتابل پرسنل ثبت شد.');
        setCalls((prev) =>
          prev.map((c) =>
            c.id === activePetShopCall.id
              ? {
                  ...c,
                  status: 'converted_to_order',
                  convertedEntityId: data.invoice?.id,
                  structuredOrderData: {
                    items: orderItems,
                    shippingAddress,
                    recipientName,
                    recipientPhone,
                    estimatedTotal,
                    deliveryMethod,
                  },
                }
              : c
          )
        );
        setIsPetShopModalOpen(false);
      } else {
        showNotification(data.error || 'خطا در ثبت سفارش');
      }
    } catch {
      showNotification('ارتباط با سرور برقرار نشد.');
    } finally {
      setIsSavingOrder(false);
    }
  };

  // Batch Review
  const handleToggleSelectCall = (callId: string) => {
    setSelectedCallIds((prev) =>
      prev.includes(callId) ? prev.filter((id) => id !== callId) : [...prev, callId]
    );
  };

  const handleSelectAllPending = () => {
    const pendingIds = calls.filter((c) => c.status === 'pending_review').map((c) => c.id);
    if (selectedCallIds.length === pendingIds.length) {
      setSelectedCallIds([]);
    } else {
      setSelectedCallIds(pendingIds);
    }
  };

  const handleBatchReview = async () => {
    if (selectedCallIds.length === 0) return;
    setIsBatchReviewing(true);
    try {
      const res = await fetch('/api/telephony/calls/batch-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callIds: selectedCallIds,
          reviewerName: 'دکتر امین بیاتی (مدیر کلینیک)',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification(data.message || `${selectedCallIds.length} تماس با موفقیت تایید و بررسی شدند.`);
        setCalls((prev) =>
          prev.map((c) =>
            selectedCallIds.includes(c.id) ? { ...c, status: 'reviewed' } : c
          )
        );
        setSelectedCallIds([]);
      }
    } catch {
      showNotification('خطا در بررسی دسته‌جمعی تماس‌ها');
    } finally {
      setIsBatchReviewing(false);
    }
  };

  // Save staff notes
  const handleSaveNotes = async (callId: string) => {
    try {
      await fetch(`/api/telephony/calls/${callId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffNotes: noteText }),
      });
      setCalls((prev) => prev.map((c) => (c.id === callId ? { ...c, staffNotes: noteText } : c)));
      setEditingNotesId(null);
      showNotification('یادداشت منشی با موفقیت ذخیره شد.');
    } catch {
      showNotification('خطا در ذخیره یادداشت');
    }
  };

  // Run simulator
  const handleRunSimulator = async () => {
    setIsSimulating(true);
    playTelephoneAudioTone('dtmf');
    try {
      const res = await fetch('/api/telephony/simulate-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callerPhone: simPhone,
          keySelected: simKey,
          messageAudioText: simAudioText,
        }),
      });
      const data = await res.json();
      if (data.success && data.call) {
        setCalls((prev) => [data.call, ...prev]);
        showNotification('تماس صوتی ورودی با موفقیت شبیه‌سازی و در صف مربوطه قرار گرفت.');
        setIsSimulatorOpen(false);
      }
    } catch {
      showNotification('خطا در شبیه‌سازی تماس');
    } finally {
      setIsSimulating(false);
    }
  };

  // Send SMS follow-up with Bale Bot Link
  const handleSendBaleSms = async (phone: string) => {
    try {
      const res = await fetch('/api/sms/send-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: [phone],
          message: `کلینیک تخصصی دامپزشکی مهرگان اصفهان\nلینک نوبت‌دهی آنلاین در بازوی بله:\nhttps://ble.ir/mehreganpetclinic_bot\nمسیریابی نشان:\nhttps://neshan.org/maps/@32.6331396,51.6532624,17z\nتلفن اورژانس: 093021820044`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`پیامک حاوی لینک بله و موقعیت نشان به ${phone} ارسال شد.`);
      } else {
        showNotification('خطا در ارسال پیامک');
      }
    } catch {
      showNotification('ارتباط با وب‌سرویس پیامک برقرار نشد.');
    }
  };

  // Simulate incoming Bale Bot Webhook
  const handleSimulateBaleWebhook = async () => {
    if (!baleSimMsg) return;
    setIsSendingBaleWebhook(true);
    try {
      const res = await fetch('/api/bale/webhook/appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baleUserId: 12345678,
          baleUsername: 'leo_owner',
          baleName: baleSimName,
          ownerName: baleSimName,
          ownerPhone: baleSimPhone,
          messageText: baleSimMsg,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`درخواست از بازوی بله دریافت شد و با کد نوبت ${data.queueCode} در پذیرش ثبت گردید.`);
        fetchTelephonyData();
      } else {
        showNotification(data.error || 'خطا در ثبت وب‌هوک بله');
      }
    } catch {
      showNotification('ارتباط با وب‌هوک بله برقرار نشد.');
    } finally {
      setIsSendingBaleWebhook(false);
    }
  };

  // Filtered calls
  const filteredCalls = calls.filter((c) => {
    if (activeQueue === 'all') return true;
    if (activeQueue === 'batch_review') return c.status === 'pending_review';
    return c.queueType === activeQueue;
  });

  const pendingSurgeryCount = calls.filter(
    (c) => c.queueType === 'surgery_appointment' && c.status === 'pending_review'
  ).length;
  const pendingPetshopCount = calls.filter(
    (c) => c.queueType === 'petshop_order' && c.status === 'pending_review'
  ).length;
  const addressCount = calls.filter((c) => c.queueType === 'address_inquiry').length;
  const totalPendingReview = calls.filter((c) => c.status === 'pending_review').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 left-6 z-50 bg-[#2D3A27] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold animate-fade-in border border-emerald-500/30">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header & Status Card */}
      <div className="bg-white rounded-3xl p-6 border border-[#E6E9DF] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#F2F5EE] flex items-center justify-center text-[#4A6741]">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-black text-[#2D3A27]">منشی تلفنی گویا و مودم دیال‌آپ (IVR)</h1>
                <p className="text-xs text-[#5C7457] mt-0.5">
                  مدیریت هوشمند خطوط زوج‌مسی مخابرات، ضبط پیام‌های صوتی نوبت و سفارشات پت‌شاپ، همگام با بازوی بله
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                playTelephoneAudioTone('ring');
                setIsSimulatorOpen(true);
              }}
              className="bg-[#F2F5EE] hover:bg-[#E8ECE1] text-[#4A6741] font-black text-xs px-4 py-2.5 rounded-2xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <PhoneIncoming className="w-4 h-4" />
              <span>تست شبیه‌ساز تماس خط تلفن</span>
            </button>

            {onOpenVoiceModal && (
              <button
                onClick={onOpenVoiceModal}
                className="bg-white hover:bg-[#F2F5EE] text-[#2D3A27] border border-[#D0DAC7] font-black text-xs px-4 py-2.5 rounded-2xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <Mic className="w-4 h-4 text-[#4A6741]" />
                <span>دستیار صوتی داخل کلینیک</span>
              </button>
            )}

            <button
              onClick={fetchTelephonyData}
              disabled={isLoading}
              className="p-2.5 rounded-2xl bg-white border border-[#D0DAC7] text-[#5C7457] hover:text-[#2D3A27] transition-all cursor-pointer"
              title="تازه‌سازی لیست تماس‌ها"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Hardware Status & Highlights Bar */}
        <div className="mt-6 pt-5 border-t border-[#EEF1E9] grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#FBFBFA] p-3 rounded-2xl border border-[#EEF1E9]">
            <div className="flex items-center justify-between text-xs text-[#6B7F67] mb-1">
              <span>وضعیت سخت‌افزار مودم:</span>
              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                فعال و آنلاین
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-[#2D3A27]">{ivrConfig.selectedModemPort} (V.92 Voice)</span>
          </div>

          <div className="bg-[#FBFBFA] p-3 rounded-2xl border border-[#EEF1E9]">
            <div className="flex items-center justify-between text-xs text-[#6B7F67] mb-1">
              <span>صف نوبت‌های جراحی صوتی:</span>
              <Calendar className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <span className="text-xs font-bold text-[#2D3A27]">{pendingSurgeryCount} پیام صوتی در انتظار بررسی</span>
          </div>

          <div className="bg-[#FBFBFA] p-3 rounded-2xl border border-[#EEF1E9]">
            <div className="flex items-center justify-between text-xs text-[#6B7F67] mb-1">
              <span>سفارشات صوتی پت‌شاپ MDI:</span>
              <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <span className="text-xs font-bold text-[#2D3A27]">{pendingPetshopCount} سفارش آماده صدور فاکتور</span>
          </div>

          <div className="bg-[#FBFBFA] p-3 rounded-2xl border border-[#EEF1E9]">
            <div className="flex items-center justify-between text-xs text-[#6B7F67] mb-1">
              <span>بازوی پیام‌رسان بله:</span>
              <Bot className="w-3.5 h-3.5 text-teal-600" />
            </div>
            <span className="text-xs font-bold text-teal-800">
              متصل به @mehreganpetclinic_bot
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs for Voicemail Queues */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E6E9DF] pb-3">
        <button
          onClick={() => setActiveQueue('surgery_appointment')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeQueue === 'surgery_appointment'
              ? 'bg-[#4A6741] text-white shadow-md'
              : 'bg-white text-[#5C7457] hover:bg-[#F2F5EE] border border-[#E6E9DF]'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>صف صوتی نوبت‌های جراحی و ویزیت</span>
          {pendingSurgeryCount > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce">
              {pendingSurgeryCount} بررسی‌نشده
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveQueue('petshop_order')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeQueue === 'petshop_order'
              ? 'bg-[#4A6741] text-white shadow-md'
              : 'bg-white text-[#5C7457] hover:bg-[#F2F5EE] border border-[#E6E9DF]'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>صف صوتی سفارشات پت‌شاپ MDI</span>
          {pendingPetshopCount > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
              {pendingPetshopCount} سفارش
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveQueue('address_inquiry')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeQueue === 'address_inquiry'
              ? 'bg-[#4A6741] text-white shadow-md'
              : 'bg-white text-[#5C7457] hover:bg-[#F2F5EE] border border-[#E6E9DF]'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>استعلام‌های آدرس و لوکیشن ({addressCount})</span>
        </button>

        <button
          onClick={() => setActiveQueue('batch_review')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeQueue === 'batch_review'
              ? 'bg-purple-800 text-white shadow-md'
              : 'bg-purple-50 text-purple-900 hover:bg-purple-100 border border-purple-200'
          }`}
        >
          <CheckSquare className="w-4 h-4 text-purple-400" />
          <span>کارتابل بررسی پایان روز ({totalPendingReview})</span>
        </button>

        <button
          onClick={() => setActiveQueue('bale_bot')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeQueue === 'bale_bot'
              ? 'bg-teal-700 text-white shadow-md'
              : 'bg-white text-teal-800 hover:bg-teal-50 border border-teal-200'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>مدیریت بازوی پیام‌رسان بله</span>
        </button>

        <button
          onClick={() => setActiveQueue('all')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeQueue === 'all'
              ? 'bg-[#4A6741] text-white shadow-md'
              : 'bg-white text-[#5C7457] hover:bg-[#F2F5EE] border border-[#E6E9DF]'
          }`}
        >
          <Phone className="w-4 h-4" />
          <span>همه تماس‌ها ({calls.length})</span>
        </button>

        <button
          onClick={() => setActiveQueue('settings')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer mr-auto ${
            activeQueue === 'settings'
              ? 'bg-[#2D3A27] text-white shadow-md'
              : 'bg-white text-[#5C7457] hover:bg-[#F2F5EE] border border-[#E6E9DF]'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>تنظیمات IVR و مودم</span>
        </button>
      </div>

      {/* Main Content Area */}
      {activeQueue === 'bale_bot' ? (
        /* Bale Bot Integration & Webhook Simulator Tab */
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-[#E6E9DF] shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EEF1E9] pb-4">
              <div>
                <h2 className="text-base font-black text-[#2D3A27] flex items-center gap-2">
                  <Bot className="w-5 h-5 text-teal-600" />
                  اتصال یکپارچه بازوی پیام‌رسان بله (Bale Bot Integration)
                </h2>
                <p className="text-xs text-[#5C7457] mt-1">
                  پیکربندی رسمی بات بله جهت ارائه نشانی، ساعات کاری، لیست تعرفه‌ها و ثبت خودکار درخواست نوبت در سیستم پذیرش
                </p>
              </div>

              <a
                href="https://ble.ir/mehreganpetclinic_bot"
                target="_blank"
                rel="noreferrer"
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all shadow-xs shrink-0"
              >
                <span>مشاهده بازوی بله در پیام‌رسان</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* 4 Bale JSON Config Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <div className="bg-[#FBFBFA] p-4 rounded-2xl border border-[#EEF1E9] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#2D3A27]">اطلاعات و نشانی کلینیک</span>
                  <MapPin className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-[11px] text-[#6B7F67]">آدرس، تلفن‌ها، مختصات جغرافیایی و لینک‌های نشان و بلد</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      const res = await fetch('/api/bale/config/clinic-info');
                      const json = await res.text();
                      setBaleConfigModal({ open: true, title: 'clinic_info.json (مشخصات و لوکیشن)', json });
                    }}
                    className="w-full py-1.5 rounded-xl bg-white border border-[#D0DAC7] text-xs font-bold text-[#4A6741] hover:bg-[#F2F5EE] transition-all flex items-center justify-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>مشاهده JSON</span>
                  </button>
                </div>
              </div>

              <div className="bg-[#FBFBFA] p-4 rounded-2xl border border-[#EEF1E9] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#2D3A27]">ساعات کاری و شیفت‌ها</span>
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-[11px] text-[#6B7F67]">جدول شیفت‌های شنبه تا جمعه و اعلام وضعیت باز/بسته</p>
                <button
                  onClick={async () => {
                    const res = await fetch('/api/bale/config/working-hours');
                    const json = await res.text();
                    setBaleConfigModal({ open: true, title: 'working_hours.json (ساعات کاری)', json });
                  }}
                  className="w-full py-1.5 rounded-xl bg-white border border-[#D0DAC7] text-xs font-bold text-[#4A6741] hover:bg-[#F2F5EE] transition-all flex items-center justify-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>مشاهده JSON</span>
                </button>
              </div>

              <div className="bg-[#FBFBFA] p-4 rounded-2xl border border-[#EEF1E9] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#2D3A27]">منوی تعاملی و کلیدها</span>
                  <Sliders className="w-4 h-4 text-teal-600" />
                </div>
                <p className="text-[11px] text-[#6B7F67]">دکمه‌های شیشه‌ای کیبورد بله برای نوبت‌دهی و خدمات</p>
                <button
                  onClick={async () => {
                    const res = await fetch('/api/bale/config/menu');
                    const json = await res.text();
                    setBaleConfigModal({ open: true, title: 'menu.json (منوی کلیدها)', json });
                  }}
                  className="w-full py-1.5 rounded-xl bg-white border border-[#D0DAC7] text-xs font-bold text-[#4A6741] hover:bg-[#F2F5EE] transition-all flex items-center justify-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>مشاهده JSON</span>
                </button>
              </div>

              <div className="bg-[#FBFBFA] p-4 rounded-2xl border border-[#EEF1E9] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#2D3A27]">لیست خدمات و تعرفه‌ها</span>
                  <ShoppingBag className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-[11px] text-[#6B7F67]">تعرفه‌های ویزیت، واکسیناسیون، جراحی و آزمایشگاه</p>
                <button
                  onClick={async () => {
                    const res = await fetch('/api/bale/config/services');
                    const json = await res.text();
                    setBaleConfigModal({ open: true, title: 'services.json (خدمات و تعرفه‌ها)', json });
                  }}
                  className="w-full py-1.5 rounded-xl bg-white border border-[#D0DAC7] text-xs font-bold text-[#4A6741] hover:bg-[#F2F5EE] transition-all flex items-center justify-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>مشاهده JSON</span>
                </button>
              </div>
            </div>

            {/* Bale Webhook Simulator */}
            <div className="mt-8 bg-gradient-to-r from-teal-50 to-[#F2F5EE] p-5 rounded-3xl border border-teal-200">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-teal-700" />
                <h3 className="font-black text-sm text-[#2D3A27]">
                  تست بلادرنگ وب‌هوک بازوی بله (Bale Webhook Simulator)
                </h3>
              </div>
              <p className="text-xs text-[#5C7457] leading-relaxed mb-4">
                برای آزمودن ثبت خودکار نوبت از پیام‌رسان بله به سامانه پذیرش، اطلاعات پیام مشتری را در فرم زیر شبیه‌سازی کنید:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 text-xs">
                <div>
                  <label className="block font-bold text-[#2D3A27] mb-1">نام یا آیدی کاربر بله:</label>
                  <input
                    type="text"
                    value={baleSimName}
                    onChange={(e) => setBaleSimName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D0DAC7] bg-white text-xs outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#2D3A27] mb-1">شماره تماس مخاطب:</label>
                  <input
                    type="text"
                    value={baleSimPhone}
                    onChange={(e) => setBaleSimPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D0DAC7] bg-white font-mono text-xs outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block font-bold text-[#2D3A27] mb-1">متن پیام ارسالی کاربر در بله:</label>
                  <input
                    type="text"
                    value={baleSimMsg}
                    onChange={(e) => setBaleSimMsg(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D0DAC7] bg-white text-xs outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSimulateBaleWebhook}
                  disabled={isSendingBaleWebhook}
                  className="bg-teal-700 hover:bg-teal-800 text-white font-black text-xs px-5 py-2.5 rounded-2xl flex items-center gap-2 cursor-pointer shadow-xs transition-all"
                >
                  <Send className={`w-4 h-4 ${isSendingBaleWebhook ? 'animate-spin' : ''}`} />
                  <span>{isSendingBaleWebhook ? 'در حال ارسال به وب‌هوک...' : 'ارسال به وب‌هوک پذیرش بله'}</span>
                </button>
              </div>
            </div>

            {/* Bale Bot Execution & Architecture Info */}
            <div className="mt-6 bg-[#FBFBFA] p-5 rounded-3xl border border-[#EEF1E9] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#2D3A27] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  وضعیت استقرار و اجرای بازوی پیام‌رسان بله
                </span>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                  پیاده‌سازی کامل هندلرها و وب‌هوک
                </span>
              </div>
              <p className="text-xs text-[#5C7457] leading-relaxed">
                تمام ماژول‌های بازوی بله در مسیر <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#E6E9DF]">bale_bot/</code> شامل ثبت نوبت متصل به دیتابیس کلینیک، استعلام ساعات کاری، تعرفه خدمات و نقشه مسیریابی پیاده‌سازی شده و آماده راه‌اندازی با توکن بله است.
              </p>
              <div className="bg-[#2D3A27] text-white p-3 rounded-2xl font-mono text-[11px] flex items-center justify-between">
                <span>python bale_bot/main.py</span>
                <span className="text-emerald-400 font-sans text-[10px]">دستور اجرای لوکال یا سرور</span>
              </div>
            </div>
          </div>
        </div>
      ) : activeQueue !== 'settings' ? (
        /* Call Queue List */
        <div className="space-y-4">
          {/* Batch Review Action Bar if selected */}
          {activeQueue === 'batch_review' && (
            <div className="bg-purple-900 text-white p-4 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md animate-fade-in">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSelectAllPending}
                  className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer"
                >
                  {selectedCallIds.length === totalPendingReview ? 'عدم انتخاب همه' : 'انتخاب همه پیام‌های بررسی‌نشده'}
                </button>
                <span className="text-xs text-purple-200">
                  {selectedCallIds.length} تماس از {totalPendingReview} پیام معلق انتخاب شده است.
                </span>
              </div>

              <button
                onClick={handleBatchReview}
                disabled={selectedCallIds.length === 0 || isBatchReviewing}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-black text-xs px-5 py-2 rounded-2xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isBatchReviewing
                    ? 'در حال تایید...'
                    : `تایید پایان روز (${selectedCallIds.length} تماس)`}
                </span>
              </button>
            </div>
          )}

          {filteredCalls.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#E6E9DF]">
              <div className="w-16 h-16 rounded-full bg-[#F2F5EE] flex items-center justify-center text-[#5C7457] mx-auto mb-3">
                <CheckCircle2 className="w-8 h-8 text-[#4A6741]" />
              </div>
              <h3 className="text-base font-bold text-[#2D3A27]">هیچ پیامی در این صف یافت نشد</h3>
              <p className="text-xs text-[#6B7F67] mt-1">تمام تماس‌های این بخش بررسی یا به نوبت تبدیل شده‌اند.</p>
            </div>
          ) : (
            filteredCalls.map((call) => {
              const isPlaying = playingCallId === call.id;
              const isExpanded = expandedCallId === call.id;
              const isSelected = selectedCallIds.includes(call.id);

              return (
                <div
                  key={call.id}
                  className={`bg-white rounded-3xl p-5 border transition-all ${
                    call.status === 'pending_review'
                      ? 'border-amber-300 shadow-xs'
                      : 'border-[#E6E9DF]'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Caller Info */}
                    <div className="flex items-start gap-3">
                      {activeQueue === 'batch_review' && (
                        <button
                          onClick={() => handleToggleSelectCall(call.id)}
                          className="mt-2 text-purple-700 cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-purple-700" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-300" />
                          )}
                        </button>
                      )}

                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                          call.queueType === 'surgery_appointment'
                            ? 'bg-rose-100 text-rose-700'
                            : call.queueType === 'petshop_order'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-teal-100 text-teal-700'
                        }`}
                      >
                        {call.queueType === 'surgery_appointment' ? (
                          <Calendar className="w-5 h-5" />
                        ) : call.queueType === 'petshop_order' ? (
                          <ShoppingBag className="w-5 h-5" />
                        ) : (
                          <MapPin className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-sm text-[#2D3A27]">
                            {call.callerName || 'تماس‌گیرنده ناشناس'}
                          </span>
                          <span className="font-mono text-xs text-[#5C7457] bg-[#F2F5EE] px-2 py-0.5 rounded-full">
                            {call.callerId}
                          </span>
                          <span className="text-[11px] text-[#6B7F67] flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3" />
                            {call.dateTime}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span
                            className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                              call.queueType === 'surgery_appointment'
                                ? 'bg-rose-100 text-rose-900 border border-rose-200'
                                : call.queueType === 'petshop_order'
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : 'bg-teal-100 text-teal-900 border border-teal-200'
                            }`}
                          >
                            کلید {call.keySelected}:{' '}
                            {call.queueType === 'surgery_appointment'
                              ? 'رزرو صوتی نوبت جراحی/معاینه'
                              : call.queueType === 'petshop_order'
                              ? 'سفارش صوتی پت‌شاپ MDI'
                              : 'استعلام آدرس و لوکیشن'}
                          </span>

                          {call.status === 'pending_review' && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                              در انتظار بررسی انتهای روز
                            </span>
                          )}
                          {call.status === 'converted_to_appointment' && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              تبدیل به نوبت شد ({call.convertedEntityId || 'پذیرش'})
                            </span>
                          )}
                          {call.status === 'converted_to_order' && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              سفارش پت‌شاپ صادر شد
                            </span>
                          )}
                          {call.status === 'reviewed' && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                              بررسی شده
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Audio Player & Action Buttons */}
                    <div className="flex items-center gap-2 flex-wrap lg:justify-end">
                      {/* Audio Player */}
                      {call.hasAudio && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="flex items-center bg-[#F2F5EE] p-1.5 rounded-2xl border border-[#DCE2D4] shrink-0">
                            <button
                              onClick={() => handleTogglePlayAudio(call.id, call.audioRecordingUrl)}
                              className="w-8 h-8 rounded-xl bg-[#4A6741] text-white flex items-center justify-center hover:bg-[#3D5535] transition-all cursor-pointer"
                              title={isPlaying ? 'توقف پخش' : 'پخش صدای ضبط شده'}
                            >
                              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                            </button>

                            <div className="px-2">
                              <div className="flex items-center justify-between text-[10px] text-[#5C7457] font-mono mb-1">
                                <span>{isPlaying ? 'در حال پخش...' : 'پیام صوتی'}</span>
                                <span>{call.audioDurationSec || 30}s</span>
                              </div>
                              <div className="w-28 h-1.5 bg-[#DCE2D4] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#4A6741] transition-all"
                                  style={{ width: `${isPlaying ? playbackProgress : 0}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {call.audioRecordingUrl && (
                            <a
                              href={call.audioRecordingUrl}
                              download={`recording_${call.callerId}.wav`}
                              target="_blank"
                              rel="noreferrer"
                              className="w-8 h-8 rounded-xl bg-white border border-[#DCE2D4] text-[#5C7457] hover:text-[#2D3A27] hover:bg-[#F2F5EE] flex items-center justify-center transition-all cursor-pointer"
                              title="دانلود فایل صوتی WAV"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      )}

                      {/* Convert to Appointment Button */}
                      {call.queueType === 'surgery_appointment' && call.status !== 'converted_to_appointment' && (
                        <button
                          onClick={() => handleConvertToAppointment(call)}
                          className="bg-[#4A6741] hover:bg-[#3D5535] text-white font-black text-xs px-3.5 py-2 rounded-2xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
                        >
                          <Check className="w-4 h-4" />
                          <span>تبدیل به نوبت در پذیرش</span>
                        </button>
                      )}

                      {/* Convert to Pet Shop Order Button */}
                      {call.queueType === 'petshop_order' && call.status !== 'converted_to_order' && (
                        <button
                          onClick={() => handleOpenPetShopOrderModal(call)}
                          className="bg-amber-600 hover:bg-amber-700 text-white font-black text-xs px-3.5 py-2 rounded-2xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          <span>صدور فاکتور سفارش پت‌شاپ</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleSendBaleSms(call.callerId)}
                        className="bg-white hover:bg-[#F2F5EE] text-[#4A6741] border border-[#D0DAC7] font-bold text-xs px-3 py-2 rounded-2xl cursor-pointer flex items-center gap-1.5 transition-all shadow-xs"
                        title="ارسال پیامک لینک بازوی بله و موقعیت نشان"
                      >
                        <Share2 className="w-3.5 h-3.5 text-teal-600" />
                        <span>ارسال بله/نشان</span>
                      </button>

                      <button
                        onClick={() => setExpandedCallId(isExpanded ? null : call.id)}
                        className="text-[#6B7F67] hover:text-[#2D3A27] p-2 rounded-xl hover:bg-[#F2F5EE] transition-all cursor-pointer"
                        title="مشاهده جزییات و یادداشت"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Transcript Display */}
                  {call.extractedTranscript && (
                    <div className="mt-3 bg-[#FBFBFA] p-3 rounded-2xl border border-[#EEF1E9] text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 text-[#4A6741] font-bold">
                          <Mic className="w-3.5 h-3.5 text-[#4A6741]" />
                          <span>متن استخراج شده از صوت تماس‌گیرنده (Speech-to-Text):</span>
                        </div>
                        {call.queueType === 'petshop_order' && (
                          <button
                            onClick={() => handleOpenPetShopOrderModal(call)}
                            className="text-[11px] text-amber-700 hover:underline font-bold flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3 text-amber-600" />
                            <span>استخراج ساختار یافته اقلام</span>
                          </button>
                        )}
                      </div>
                      <p className="text-[#3F4F39] leading-relaxed pr-5">{call.extractedTranscript}</p>
                    </div>
                  )}

                  {/* Expanded Section: Staff Notes & Actions */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-[#EEF1E9] space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#2D3A27] flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-[#4A6741]" />
                          یادداشت منشی / پیگیری پرسنل:
                        </span>
                        {editingNotesId !== call.id && (
                          <button
                            onClick={() => {
                              setEditingNotesId(call.id);
                              setNoteText(call.staffNotes || '');
                            }}
                            className="text-[#4A6741] hover:underline font-bold text-[11px]"
                          >
                            ویرایش یادداشت
                          </button>
                        )}
                      </div>

                      {editingNotesId === call.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="توضیحات و اقدامات انجام شده جهت پیگیری تماس را یادداشت کنید..."
                            className="w-full p-2.5 rounded-xl border border-[#D0DAC7] bg-white text-xs outline-none focus:ring-2 focus:ring-[#4A6741]"
                            rows={2}
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingNotesId(null)}
                              className="px-3 py-1 rounded-xl bg-gray-100 text-gray-700 text-xs"
                            >
                              انصراف
                            </button>
                            <button
                              onClick={() => handleSaveNotes(call.id)}
                              className="px-3 py-1 rounded-xl bg-[#4A6741] text-white text-xs font-bold"
                            >
                              ذخیره یادداشت
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[#5C7457] bg-[#F7F9F5] p-2.5 rounded-xl border border-[#E8ECE1]">
                          {call.staffNotes || 'یادداشتی برای این تماس ثبت نشده است.'}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Settings Tab: IVR, Modem Hardware, and Windows Daemon */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: IVR Flow & Text Config */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-[#E6E9DF] shadow-xs space-y-5">
              <h2 className="text-base font-black text-[#2D3A27] flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#4A6741]" />
                پیکربندی سناریوی منوی صوتی (Interactive Voice Response - IVR)
              </h2>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-[#2D3A27] mb-1">
                    متن پیام صوتی خوش‌آمدگویی و منوی کلیدها (پخش خودکار پس از برداشتن گوشی):
                  </label>
                  <textarea
                    value={ivrConfig.greetingMessageText}
                    onChange={(e) => setIvrConfig({ ...ivrConfig, greetingMessageText: e.target.value })}
                    rows={3}
                    className="w-full p-3 rounded-2xl border border-[#D0DAC7] bg-[#FBFBFA] outline-none focus:ring-2 focus:ring-[#4A6741] text-xs leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#2D3A27] mb-1">
                    متن پیام صوتی آدرس رسمی کلینیک (کلید ۱):
                  </label>
                  <textarea
                    value={ivrConfig.addressMessageText}
                    onChange={(e) => setIvrConfig({ ...ivrConfig, addressMessageText: e.target.value })}
                    rows={2}
                    className="w-full p-3 rounded-2xl border border-[#D0DAC7] bg-[#FBFBFA] outline-none focus:ring-2 focus:ring-[#4A6741] text-xs leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-[#2D3A27] mb-1">تعداد زنگ تا پاسخگویی خودکار:</label>
                    <select
                      value={ivrConfig.ringsBeforeAnswer}
                      onChange={(e) => setIvrConfig({ ...ivrConfig, ringsBeforeAnswer: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-2xl border border-[#D0DAC7] bg-white text-xs outline-none"
                    >
                      <option value={1}>۱ زنگ (پاسخ بسیار سریع)</option>
                      <option value={2}>۲ زنگ (استاندارد)</option>
                      <option value={3}>۳ زنگ</option>
                      <option value={4}>۴ زنگ (فرصت پاسخ پرسنل)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#2D3A27] mb-1">حداکثر مدت زمان ضبط صدای کاربر:</label>
                    <select
                      value={ivrConfig.maxRecordingDurationSec}
                      onChange={(e) => setIvrConfig({ ...ivrConfig, maxRecordingDurationSec: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-2xl border border-[#D0DAC7] bg-white text-xs outline-none"
                    >
                      <option value={30}>۳۰ ثانیه (پیام کوتاه)</option>
                      <option value={60}>۶۰ ثانیه (استاندارد)</option>
                      <option value={120}>۲ دقیقه (توضیحات طولانی)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ivrConfig.autoSendSmsForAddress}
                      onChange={(e) => setIvrConfig({ ...ivrConfig, autoSendSmsForAddress: e.target.checked })}
                      className="rounded text-[#4A6741] focus:ring-[#4A6741]"
                    />
                    <span className="font-bold text-[#2D3A27]">
                      ارسال پیامک خودکار لینک موقعیت نشان پس از فشردن کلید ۱ یا ثبت پیام
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ivrConfig.autoSendSmsWithBaleLink}
                      onChange={(e) => setIvrConfig({ ...ivrConfig, autoSendSmsWithBaleLink: e.target.checked })}
                      className="rounded text-[#4A6741] focus:ring-[#4A6741]"
                    />
                    <span className="font-bold text-[#2D3A27]">
                      درج لینک بازوی پیام‌رسان بله (ble.ir/mehreganpetclinic_bot) در تمام پیامک‌های ارسالی
                    </span>
                  </label>
                </div>

                {/* Storage Strategy & Paths */}
                <div className="pt-3 border-t border-[#EEF1E9] space-y-3">
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-[#4A6741]" />
                    <span className="font-bold text-xs text-[#2D3A27]">
                      محل ذخیره‌سازی فایل‌های صوتی مکالمات ضبط‌شده (مودم ۵۶k)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#5C7457] mb-1">
                        استراتژی ذخیره‌سازی:
                      </label>
                      <select
                        value={ivrConfig.storageTarget || 'both'}
                        onChange={(e) => setIvrConfig({ ...ivrConfig, storageTarget: e.target.value as any })}
                        className="w-full p-2.5 rounded-2xl border border-[#D0DAC7] bg-white text-xs outline-none font-bold"
                      >
                        <option value="both">ذخیره همزمان محلی روی ncase3 + آپلود به سرور VPS (پیشنهادی)</option>
                        <option value="local">فقط ذخیره در پوشه محلی ویندوز (ncase3)</option>
                        <option value="vps">فقط آپلود مستقیم به سرور ابری کلینیک (VPS)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#5C7457] mb-1">
                        مسیر پوشه محلی ویندوز (روی سیستم ncase3):
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={ivrConfig.localRecordingPath || 'C:\\MehreganTelephony\\Recordings'}
                        onChange={(e) => setIvrConfig({ ...ivrConfig, localRecordingPath: e.target.value })}
                        placeholder="C:\MehreganTelephony\Recordings"
                        className="w-full p-2.5 rounded-2xl border border-[#D0DAC7] bg-white text-xs font-mono outline-none"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-[#6B7F67] leading-relaxed">
                    💡 اسکریپت دیمن مودم (<code className="font-mono bg-gray-100 px-1 py-0.5 rounded">scripts/modem_ivr_daemon.py</code> یا <code className="font-mono bg-gray-100 px-1 py-0.5 rounded">start-modem-daemon.bat</code>) پس از پاسخگویی و ضبط با مودم ۵۶ کیلوبیت، فایل صوتی را در فرمت استاندارد WAV در این مسیر محلی ذخیره نموده و در صورت انتخاب گزینه سرور یا هردو، آن را بلافاصله با سرور کلینیک همگام می‌کند.
                  </p>
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    onClick={async () => {
                      await fetch('/api/telephony/config', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(ivrConfig),
                      });
                      showNotification('تنظیمات منوی صوتی IVR ذخیره شد.');
                    }}
                    className="bg-[#4A6741] hover:bg-[#3D5535] text-white font-black text-xs px-5 py-2.5 rounded-2xl shadow-xs cursor-pointer"
                  >
                    ذخیره تنظیمات منوی گویا
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Col: Modem Hardware Status & Windows Script */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-[#E6E9DF] shadow-xs space-y-4">
              <h2 className="text-base font-black text-[#2D3A27] flex items-center gap-2">
                <Cpu className="w-5 h-5 text-[#4A6741]" />
                سخت‌افزار مودم‌های متصل (Dial-Up Modems)
              </h2>

              <div className="space-y-3">
                {modems.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-2xl border text-xs transition-all ${
                      m.port === ivrConfig.selectedModemPort
                        ? 'border-[#4A6741] bg-[#F7F9F5]'
                        : 'border-[#EEF1E9] bg-[#FBFBFA]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono font-bold text-[#2D3A27]">{m.port}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        {m.status === 'idle' ? 'آماده پاسخ' : m.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#5C7457] font-bold">{m.modelName}</div>
                    <div className="text-[10px] text-[#6B7F67] mt-1 font-mono">
                      {m.chipset} | Baud: {m.baudRate}
                    </div>

                    <div className="mt-2.5 flex items-center justify-between border-t border-[#E8ECE1] pt-2">
                      <span className="text-[10px] text-[#6B7F67]">پشتیبانی صدا (Voice): بله</span>
                      {m.port !== ivrConfig.selectedModemPort ? (
                        <button
                          onClick={() => setIvrConfig({ ...ivrConfig, selectedModemPort: m.port })}
                          className="text-[11px] text-[#4A6741] hover:underline font-bold"
                        >
                          انتخاب این پورت
                        </button>
                      ) : (
                        <span className="text-[10px] text-emerald-700 font-bold">پورت فعال فعلی</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Run in Windows Box */}
            <div className="bg-[#2D3A27] text-white rounded-3xl p-6 shadow-md space-y-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-black">
                <Zap className="w-4 h-4" />
                <span>راه‌اندازی سرویس مودم در ویندوز کلینیک</span>
              </div>
              <p className="text-gray-300 leading-relaxed text-[11px]">
                روی کامپیوتر متصل به خط تلفن زوج‌مسی (PSTN RJ-11)، اسکریپت سرویس مودم را با پاورشل اجرا کنید تا تماس‌ها
                را دریافت و با سرور کلینیک همگام کند:
              </p>
              <div className="bg-black/40 p-3 rounded-xl font-mono text-[11px] text-emerald-300 select-all direction-ltr text-left">
                powershell -ExecutionPolicy Bypass -File scripts\Start-ModemVoiceService.ps1
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pet Shop Structured Order Conversion Modal */}
      {isPetShopModalOpen && activePetShopCall && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-[#E6E9DF] space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-[#EEF1E9] pb-3">
              <div className="flex items-center gap-2 text-[#2D3A27]">
                <ShoppingBag className="w-5 h-5 text-amber-600" />
                <h3 className="font-black text-sm">
                  استخراج هوشمند و صدور سفارش پت‌شاپ MDI ({activePetShopCall.callerId})
                </h3>
              </div>
              <button
                onClick={() => setIsPetShopModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Original Audio Transcript */}
            <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-amber-900 font-bold">
                <span className="flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-amber-700" />
                  صوت پیاده‌شده مشتری:
                </span>
                <span className="font-mono text-[11px] text-amber-800">{activePetShopCall.dateTime}</span>
              </div>
              <p className="text-amber-950 leading-relaxed pr-5">
                "{activePetShopCall.extractedTranscript || 'صوتی پیاده نشده است.'}"
              </p>
            </div>

            {/* Recipient and Shipping Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-[#2D3A27] mb-1">نام مشتری / گیرنده:</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#D0DAC7] bg-white text-xs outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2D3A27] mb-1">شماره تماس هماهنگی و راننده اسنپ:</label>
                <input
                  type="text"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#D0DAC7] bg-white font-mono text-xs outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-[#2D3A27] mb-1">نشانی تحویل در اصفهان:</label>
                <input
                  type="text"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="مثال: اصفهان، خیابان توحید میانی، کوچه ۲۲، پلاک ..."
                  className="w-full p-2.5 rounded-xl border border-[#D0DAC7] bg-white text-xs outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2D3A27] mb-1">روش ارسال:</label>
                <select
                  value={deliveryMethod}
                  onChange={(e) => setDeliveryMethod(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-[#D0DAC7] bg-white text-xs outline-none"
                >
                  <option value="courier_snapp">ارسال فوری با پیک موتوری (اسنپ باکس)</option>
                  <option value="in_person">تحویل حضوری در کلینیک مهرگان</option>
                  <option value="unspecified">نیاز به هماهنگی تلفنی</option>
                </select>
              </div>
            </div>

            {/* Structured Items Table */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#2D3A27] flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-amber-600" />
                  اقلام ساختاریافته سفارش (تعداد و قیمت فی):
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setOrderItems((prev) => [
                      ...prev,
                      { name: 'قلم جدید', quantity: 1, unitPrice: 150000 },
                    ])
                  }
                  className="text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 text-[11px]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  افزودن قلم جدید
                </button>
              </div>

              <div className="border border-[#D0DAC7] rounded-2xl overflow-hidden">
                <table className="w-full text-right">
                  <thead className="bg-[#F2F5EE] text-[#5C7457] text-[11px] font-bold">
                    <tr>
                      <th className="p-2.5">ردیف</th>
                      <th className="p-2.5">شرح کالا</th>
                      <th className="p-2.5 w-20">تعداد</th>
                      <th className="p-2.5 w-32">قیمت فی (تومان)</th>
                      <th className="p-2.5 w-32">جمع کل</th>
                      <th className="p-2.5 w-12 text-center">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF1E9]">
                    {orderItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[#FBFBFA]">
                        <td className="p-2.5 font-mono text-[11px] text-gray-500">{idx + 1}</td>
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setOrderItems((prev) =>
                                prev.map((it, i) => (i === idx ? { ...it, name: val } : it))
                              );
                            }}
                            className="w-full p-1.5 rounded-lg border border-[#D0DAC7] text-xs outline-none"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10) || 1;
                              setOrderItems((prev) =>
                                prev.map((it, i) => (i === idx ? { ...it, quantity: val } : it))
                              );
                            }}
                            className="w-full p-1.5 rounded-lg border border-[#D0DAC7] text-xs font-mono outline-none text-center"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            step="10000"
                            value={item.unitPrice || 0}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10) || 0;
                              setOrderItems((prev) =>
                                prev.map((it, i) => (i === idx ? { ...it, unitPrice: val } : it))
                              );
                            }}
                            className="w-full p-1.5 rounded-lg border border-[#D0DAC7] text-xs font-mono outline-none"
                          />
                        </td>
                        <td className="p-2.5 font-mono text-xs font-bold text-[#2D3A27]">
                          {((item.unitPrice || 0) * (item.quantity || 1)).toLocaleString('fa-IR')}
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            onClick={() =>
                              setOrderItems((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="text-rose-500 hover:text-rose-700 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Calculation */}
              <div className="flex justify-between items-center bg-[#F7F9F5] p-3 rounded-2xl border border-[#E8ECE1] font-bold text-xs">
                <span>مبلغ قابل پرداخت فاکتور:</span>
                <span className="text-amber-800 text-sm font-mono font-black">
                  {orderItems
                    .reduce((sum, it) => sum + (it.unitPrice || 0) * (it.quantity || 1), 0)
                    .toLocaleString('fa-IR')}{' '}
                  تومان
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-[#EEF1E9]">
              <button
                type="button"
                onClick={() => setIsPetShopModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold"
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={handleSavePetShopOrder}
                disabled={isSavingOrder || orderItems.length === 0}
                className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-black text-xs px-5 py-2.5 rounded-2xl flex items-center gap-2 cursor-pointer shadow-xs transition-all"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>
                  {isSavingOrder
                    ? 'در حال صدور...'
                    : 'صدور قطعی فاکتور و ارجاع به انبار پت‌شاپ'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bale Config JSON Modal */}
      {baleConfigModal.open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-[#E6E9DF] space-y-4">
            <div className="flex items-center justify-between border-b border-[#EEF1E9] pb-3">
              <div className="flex items-center gap-2 text-[#2D3A27]">
                <Bot className="w-5 h-5 text-teal-600" />
                <h3 className="font-black text-sm">{baleConfigModal.title}</h3>
              </div>
              <button
                onClick={() => setBaleConfigModal({ open: false, title: '', json: '' })}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#5C7457]">
              این داده‌ها به صورت خودکار توسط سرور کلینیک تولید شده و برای تنظیمات BotFather یا سرور بات بله قابل استفاده است:
            </p>

            <pre className="bg-[#1E291F] text-emerald-300 p-4 rounded-2xl font-mono text-[11px] overflow-auto max-h-80 direction-ltr text-left">
              {baleConfigModal.json}
            </pre>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(baleConfigModal.json);
                  showNotification('ساختار JSON در حافظه کپی شد.');
                }}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>کپی در کلیپ‌بورد</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Phone Call Simulator Modal */}
      {isSimulatorOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E6E9DF] space-y-4">
            <div className="flex items-center justify-between border-b border-[#EEF1E9] pb-3">
              <div className="flex items-center gap-2 text-[#2D3A27]">
                <PhoneIncoming className="w-5 h-5 text-[#4A6741]" />
                <h3 className="font-black text-sm">شبیه‌ساز تماس خط تلفن و فرامین DTMF</h3>
              </div>
              <button
                onClick={() => setIsSimulatorOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#6B7F67]">
              این ابزار تماس ورودی به شماره کلینیک را بدون نیاز به خط واقعی شبیه‌سازی می‌کند تا پردازش منوی صوتی و پیامک
              را بیازمایید:
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#2D3A27] mb-1">شماره تماس‌گیرنده (Caller ID):</label>
                <input
                  type="text"
                  value={simPhone}
                  onChange={(e) => setSimPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#D0DAC7] font-mono text-xs outline-none focus:ring-2 focus:ring-[#4A6741]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2D3A27] mb-1">کلید فشرده شده در منوی صوتی (DTMF):</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSimKey('1');
                      setSimAudioText('درخواست لوکیشن و آدرس کلینیک مهرگان از منشی تلفنی.');
                    }}
                    className={`p-2.5 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                      simKey === '1'
                        ? 'bg-[#4A6741] text-white border-[#4A6741]'
                        : 'bg-[#FBFBFA] border-[#D0DAC7] text-[#2D3A27]'
                    }`}
                  >
                    کلید ۱: آدرس و لوکیشن
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSimKey('2');
                      setSimAudioText(
                        'سلام، علوی هستم برای عقیم‌سازی سگ ماده پامرانین وقت جراحی می‌خواستم لطفاً با من تماس بگیرید.'
                      );
                    }}
                    className={`p-2.5 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                      simKey === '2'
                        ? 'bg-[#4A6741] text-white border-[#4A6741]'
                        : 'bg-[#FBFBFA] border-[#D0DAC7] text-[#2D3A27]'
                    }`}
                  >
                    کلید ۲: نوبت جراحی/معاینه
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSimKey('3');
                      setSimAudioText('سلام، سفارش دو بسته غذای خشک گربه پرشین و تشویقی با پیک اسنپ داشتم.');
                    }}
                    className={`p-2.5 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                      simKey === '3'
                        ? 'bg-[#4A6741] text-white border-[#4A6741]'
                        : 'bg-[#FBFBFA] border-[#D0DAC7] text-[#2D3A27]'
                    }`}
                  >
                    کلید ۳: سفارش پت‌شاپ
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#2D3A27] mb-1">متن صدای ضبط شده تماس‌گیرنده (Voice Message):</label>
                <textarea
                  value={simAudioText}
                  onChange={(e) => setSimAudioText(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-[#D0DAC7] text-xs outline-none focus:ring-2 focus:ring-[#4A6741]"
                />
              </div>

              <div className="bg-teal-50 p-3 rounded-xl border border-teal-200 text-[11px] text-teal-900">
                با ثبت تماس، در صورت فشردن کلید ۱ یا ۲، پیامک حاوی لینک نشان و لینک بازوی بله به شماره {simPhone} ارسال
                خواهد شد.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsSimulatorOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold cursor-pointer"
              >
                انصراف
              </button>
              <button
                onClick={handleRunSimulator}
                disabled={isSimulating}
                className="px-5 py-2 rounded-xl bg-[#4A6741] hover:bg-[#3D5535] text-white text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <PhoneCall className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
                <span>{isSimulating ? 'در حال ثبت...' : 'شبیه‌سازی زنگ و ثبت در صف'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
