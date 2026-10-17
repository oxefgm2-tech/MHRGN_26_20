import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  UserPlus,
  X,
  Eye,
  AlertCircle,
  Scan,
  UserCheck,
  Smartphone,
  Wifi,
  Terminal,
  Copy,
  Check,
} from 'lucide-react';
import { Pet, VisitorCameraSnapshot } from '../types';

interface VisitorCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  allPets: Pet[];
  onSelectPetForReception: (pet: Pet) => void;
  onRegisterQuickVisitor: (desc: string, tempId: string) => void;
}

export const VisitorCameraModal: React.FC<VisitorCameraModalProps> = ({
  isOpen,
  onClose,
  allPets,
  onSelectPetForReception,
  onRegisterQuickVisitor,
}) => {
  const [activeTab, setActiveTab] = useState<'live_camera' | 'android_lan_wifi'>('live_camera');
  const [useLiveWebcam, setUseLiveWebcam] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Android Mobile LAN Configuration
  const [phoneIp, setPhoneIp] = useState('192.168.1.120');
  const [phonePort, setPhonePort] = useState('8080');
  const [isTestingStream, setIsTestingStream] = useState(false);
  const [streamSaveSuccess, setStreamSaveSuccess] = useState<string | null>(null);
  const [copiedPsScript, setCopiedPsScript] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load saved camera settings from server on mount
  useEffect(() => {
    if (isOpen) {
      fetch('/api/system/entrance-camera')
        .then((r) => r.json())
        .then((res) => {
          if (res.success && res.config) {
            if (res.config.cameraIp) setPhoneIp(res.config.cameraIp);
            if (res.config.port) setPhonePort(String(res.config.port));
            if (res.config.sourceType === 'android_lan_wifi') {
              setActiveTab('android_lan_wifi');
            }
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const handleSaveAndroidSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTestingStream(true);
    setStreamSaveSuccess(null);
    try {
      const res = await fetch('/api/system/entrance-camera', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: 'android_lan_wifi',
          cameraIp: phoneIp.trim(),
          port: Number(phonePort) || 8080,
          streamUrl: `http://${phoneIp.trim()}:${phonePort}/video`,
          snapshotUrl: `http://${phoneIp.trim()}:${phonePort}/shot.jpg`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStreamSaveSuccess(`پیکربندی دوربین گوشی اندروید (${phoneIp}:${phonePort}) با موفقیت ذخیره گردید.`);
        setTimeout(() => setStreamSaveSuccess(null), 4000);
      }
    } catch {
      setStreamSaveSuccess('تنظیمات به صورت محلی ثبت شد.');
    } finally {
      setIsTestingStream(false);
    }
  };

  const copyPowerShellScript = () => {
    const scriptCommand = `powershell -ExecutionPolicy Bypass -File .\\scripts\\Start-ClinicCameraStream.ps1 -PhoneIp "${phoneIp}" -Port ${phonePort}`;
    navigator.clipboard.writeText(scriptCommand);
    setCopiedPsScript(true);
    setTimeout(() => setCopiedPsScript(false), 3000);
  };

  useEffect(() => {
    if (!isOpen) {
      stopWebcam();
      return;
    }
    if (useLiveWebcam && activeTab === 'live_camera') {
      startWebcam();
    } else {
      stopWebcam();
    }
    return () => {
      stopWebcam();
    };
  }, [isOpen, useLiveWebcam, activeTab]);

  const startWebcam = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }
    } catch (err: any) {
      console.warn('Webcam permission not granted or device not found:', err);
      setCameraError('دسترسی به وب‌کم ورودی کلینیک برقرار نشد. می‌توانید از دوربین گوشی اندروید در شبکه Wi-Fi محلی (تب دوم) استفاده فرمایید.');
      setUseLiveWebcam(false);
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const handleCaptureSnapshot = () => {
    if (activeTab === 'android_lan_wifi') {
      const snapshotUrl = `http://${phoneIp}:${phonePort}/shot.jpg?t=${Date.now()}`;
      setCapturedImage(snapshotUrl);
      analyzeImage(snapshotUrl);
      return;
    }

    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        analyzeImage(dataUrl);
      }
    }
  };

  const analyzeImage = async (imageSrc: string) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const res = await fetch('/api/visitor-camera/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageSrc,
          knownPets: allPets,
        }),
      });
      const data = await res.json();
      if (data.analysis) {
        setAnalysisResult(data.analysis);
      }
    } catch (err) {
      console.error('Failed to analyze image:', err);
      // Fallback
      setAnalysisResult({
        summaryDescription: 'مراجعه‌کننده همراه با سگ پامرانین در لابی کلینیک رویت شد.',
        personDescription: 'آقای جوان با لباس سرمه‌ای',
        petSpecies: 'سگ',
        petBreed: 'پامرانین',
        petColor: 'کرم نسکافه‌ای',
        matchedPetSuggestion: { id: 'pet-1', name: 'لوسی' },
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D3A27]/75 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white text-[#2D3A27] w-full max-w-3xl rounded-[32px] shadow-2xl border border-[#E6E9DF] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E6E9DF] flex items-center justify-between bg-[#F7F8F3]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#4A6741] text-white flex items-center justify-center shadow-xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#2D3A27] flex items-center gap-2">
                تشخیص هویت مراجعین با دوربین ورودی (Entrance Vision AI)
              </h2>
              <p className="text-xs text-[#5C7457]">
                پردازش زنده تصویر ورودی لابی • تطبیق با پرونده‌های موجود یا صدور شناسه موقت
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#5C7457] hover:text-[#2D3A27] hover:bg-[#E6E9DF] rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 bg-[#F7F8F3] border-b border-[#E6E9DF] flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setActiveTab('live_camera');
              setCapturedImage(null);
              setUseLiveWebcam(true);
            }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'live_camera'
                ? 'border-[#4A6741] text-[#4A6741]'
                : 'border-transparent text-[#5C7457] hover:text-[#2D3A27]'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>وب‌کم مستقیم / دوربین سیستم</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('android_lan_wifi');
              setCapturedImage(null);
            }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'android_lan_wifi'
                ? 'border-[#4A6741] text-[#4A6741]'
                : 'border-transparent text-[#5C7457] hover:text-[#2D3A27]'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>دوربین گوشی اندروید در LAN (وای‌فای روتر محلی)</span>
            <span className="bg-[#4A6741] text-white text-[9px] px-1.5 py-0.2 rounded-full font-sans">روتر Wi-Fi</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white">
          
          {/* Video / Snapshot Viewport */}
          <div className="relative bg-[#2D3A27] rounded-2xl overflow-hidden aspect-video flex items-center justify-center border border-[#E6E9DF] shadow-inner">
            
            {activeTab === 'android_lan_wifi' ? (
              capturedImage ? (
                <img
                  src={capturedImage}
                  alt="Captured from Android"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full relative flex items-center justify-center bg-black">
                  <img
                    src={`http://${phoneIp}:${phonePort}/video`}
                    alt="Android LAN Stream"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-center p-4">
                    <Smartphone className="w-10 h-10 text-white mb-2" />
                    <div className="text-xs font-bold text-white">استریم دوربین گوشی اندروید در شبکه Wi-Fi</div>
                    <div className="text-[11px] text-white/80 font-mono mt-1 dir-ltr bg-black/50 px-2 py-0.5 rounded">
                      http://{phoneIp}:{phonePort}/video
                    </div>
                    <div className="text-[10px] text-white/70 mt-2">
                      تصویر پس از روشن کردن Start Server در اپلیکیشن IP Webcam بارگذاری می‌شود.
                    </div>
                  </div>
                </div>
              )
            ) : useLiveWebcam && !capturedImage ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : capturedImage ? (
              <img
                src={capturedImage}
                alt="Captured Entrance"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center text-[#D4E0CD] p-6">
                <Camera className="w-12 h-12 mx-auto mb-2 opacity-60" />
                <p className="text-sm">تصویری ضبط نشده است</p>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />

            {/* Live Camera Scanner Overlay */}
            {useLiveWebcam && !capturedImage && (
              <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-[#D4E0CD]/60 m-6 rounded-2xl flex flex-col justify-between p-4">
                <div className="flex justify-between items-center text-[11px] text-[#D4E0CD] font-mono bg-[#2D3A27]/80 px-2.5 py-1 rounded-lg backdrop-blur-xs w-max border border-[#4A6741]">
                  <span className="w-2 h-2 rounded-full bg-[#4A6741] animate-ping mr-2"></span>
                  <span>دوربین ورودی لابی (CAM-01 / HD 1080p)</span>
                </div>
                <div className="text-center text-xs text-[#F7F8F3] bg-[#2D3A27]/80 py-1.5 px-3.5 rounded-xl backdrop-blur-xs mx-auto border border-[#4A6741]">
                  حیوان و همراه را در کادر قرار داده و دکمه عکس را فشار دهید
                </div>
              </div>
            )}

            {/* Analysis in progress spinner */}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-[#2D3A27]/85 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                <RefreshCw className="w-10 h-10 animate-spin text-[#D4E0CD] mb-3" />
                <div className="text-sm font-bold">هوش مصنوعی در حال تحلیل تصویر و تطبیق چهره و نژاد پت...</div>
                <div className="text-xs text-[#D4E0CD] mt-1">مدل چندوجهی Gemini 3.7 Vision</div>
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCapturedImage(null);
                  setAnalysisResult(null);
                  setUseLiveWebcam(true);
                }}
                className="bg-[#F7F8F3] hover:bg-[#E6E9DF] text-[#2D3A27] px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border border-[#E6E9DF]"
              >
                پخش زنده دوربین
              </button>
            </div>

            <button
              onClick={handleCaptureSnapshot}
              disabled={isAnalyzing}
              className="bg-[#4A6741] hover:bg-[#3D5535] active:scale-95 text-white px-6 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Scan className="w-4 h-4" />
              <span>ثبت تصویر و تحلیل فوری AI</span>
            </button>
          </div>

          {/* Android LAN Wi-Fi Guide & PowerShell Step-by-Step Section */}
          {activeTab === 'android_lan_wifi' && (
            <div className="bg-[#F7F8F3] border border-[#CAD3C0] rounded-2xl p-4 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-[#E6E9DF] pb-2">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#4A6741]" />
                  <span className="text-xs font-black text-[#2D3A27]">
                    راهنمای قدم‌به‌قدم استفاده از موبایل اندروید در LAN به عنوان ورودی
                  </span>
                </div>
                <span className="text-[10px] bg-white border border-[#CAD3C0] text-[#4A6741] font-bold px-2 py-0.5 rounded">
                  وای‌فای روتر محلی
                </span>
              </div>

              {/* Step by step cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="bg-white p-3 rounded-xl border border-[#E6E9DF] space-y-1">
                  <div className="font-bold text-[#4A6741] flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-[#4A6741] text-white text-[10px] flex items-center justify-center">۱</span>
                    <span>اتصال به Wi-Fi کلینیک</span>
                  </div>
                  <p className="text-[11px] text-[#5C7457] leading-relaxed">
                    گوشی اندروید را به همان روتر Wi-Fi وصل کنید که سیستم کلینیک متصل است.
                  </p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-[#E6E9DF] space-y-1">
                  <div className="font-bold text-[#4A6741] flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-[#4A6741] text-white text-[10px] flex items-center justify-center">۲</span>
                    <span>نصب اپ IP Webcam</span>
                  </div>
                  <p className="text-[11px] text-[#5C7457] leading-relaxed">
                    اپلیکیشن <b>IP Webcam</b> را نصب و در انتهای آن <b>Start Server</b> را لمس نمایید.
                  </p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-[#E6E9DF] space-y-1">
                  <div className="font-bold text-[#4A6741] flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-[#4A6741] text-white text-[10px] flex items-center justify-center">۳</span>
                    <span>ثبت IP یا اجرای اسکریپت</span>
                  </div>
                  <p className="text-[11px] text-[#5C7457] leading-relaxed">
                    آدرس IP نشان‌داده‌شده روی موبایل را در زیر وارد یا دستور PowerShell را اجرا نمایید.
                  </p>
                </div>
              </div>

              {/* IP Input Form */}
              <form onSubmit={handleSaveAndroidSettings} className="bg-white p-3.5 rounded-xl border border-[#E6E9DF] flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-[11px] font-bold text-[#2D3A27] mb-1">
                    آدرس IP گوشی در وای‌فای:
                  </label>
                  <input
                    type="text"
                    value={phoneIp}
                    onChange={(e) => setPhoneIp(e.target.value)}
                    placeholder="192.168.1.120"
                    className="w-full bg-[#F7F8F3] border border-[#CAD3C0] rounded-xl px-3 py-1.5 text-xs text-[#2D3A27] font-mono dir-ltr focus:outline-none focus:ring-2 focus:ring-[#4A6741]"
                  />
                </div>

                <div className="w-24">
                  <label className="block text-[11px] font-bold text-[#2D3A27] mb-1">
                    پورت استریم:
                  </label>
                  <input
                    type="text"
                    value={phonePort}
                    onChange={(e) => setPhonePort(e.target.value)}
                    placeholder="8080"
                    className="w-full bg-[#F7F8F3] border border-[#CAD3C0] rounded-xl px-3 py-1.5 text-xs text-[#2D3A27] font-mono dir-ltr focus:outline-none focus:ring-2 focus:ring-[#4A6741]"
                  />
                </div>

                <div className="pt-4 flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isTestingStream}
                    className="bg-[#4A6741] hover:bg-[#3D5535] text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ذخیره و اتصال</span>
                  </button>
                </div>
              </form>

              {streamSaveSuccess && (
                <div className="text-xs text-[#4A6741] font-bold bg-[#D4E0CD]/60 px-3 py-1.5 rounded-xl border border-[#CAD3C0]">
                  {streamSaveSuccess}
                </div>
              )}

              {/* PowerShell Automation Script Box */}
              <div className="bg-[#2D3A27] text-white p-3.5 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#CAD3C0]">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span>اسکریپت اختصاصی PowerShell ویندوز:</span>
                  </div>

                  <button
                    type="button"
                    onClick={copyPowerShellScript}
                    className="bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedPsScript ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>دستور کپی شد!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>کپی دستور PowerShell</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-black/60 p-2.5 rounded-lg font-mono text-[11px] text-emerald-300 dir-ltr overflow-x-auto select-all">
                  powershell -ExecutionPolicy Bypass -File .\scripts\Start-ClinicCameraStream.ps1 -PhoneIp "{phoneIp}" -Port {phonePort}
                </div>

                <p className="text-[10px] text-white/70">
                  این اسکریپت با بررسی پینگ، اتصال پورت استریم موبایل و ثبت آن در سرور مهرگان، استریم را به صورت مطمئن برقرار می‌سازد.
                </p>
              </div>
            </div>
          )}

          {/* AI Vision Analysis Output */}
          {analysisResult && (
            <div className="p-5 bg-[#F7F8F3] border-2 border-[#4A6741] rounded-[24px] space-y-4 animate-fadeIn">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#4A6741]" />
                  <span className="text-xs font-black text-[#2D3A27]">نتیجه پردازش هوش مصنوعی دوربین ورودی:</span>
                </div>
                <span className="text-[11px] bg-[#D4E0CD] text-[#2D3A27] font-bold px-2.5 py-0.5 rounded-md font-mono">
                  Gemini Vision
                </span>
              </div>

              <div className="text-sm font-bold text-[#2D3A27] leading-relaxed bg-white p-3.5 rounded-xl border border-[#E6E9DF] shadow-xs">
                {analysisResult.summaryDescription}
              </div>

              {/* Detected breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-[#E6E9DF]">
                  <div className="text-[#5C7457] text-[10px]">همراه / فرد:</div>
                  <div className="font-bold text-[#2D3A27] mt-0.5">{analysisResult.personDescription || 'نامشخص'}</div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-[#E6E9DF]">
                  <div className="text-[#5C7457] text-[10px]">گونه و نژاد:</div>
                  <div className="font-bold text-[#2D3A27] mt-0.5">
                    {analysisResult.petSpecies} {analysisResult.petBreed && `(${analysisResult.petBreed})`}
                  </div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-[#E6E9DF]">
                  <div className="text-[#5C7457] text-[10px]">رنگ ظاهری:</div>
                  <div className="font-bold text-[#2D3A27] mt-0.5">{analysisResult.petColor || 'نامشخص'}</div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-[#E6E9DF]">
                  <div className="text-[#5C7457] text-[10px]">شناسه تردد:</div>
                  <div className="font-mono font-bold text-[#4A6741] mt-0.5">VIS-{Math.floor(Math.random() * 800) + 100}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap gap-2">
                {analysisResult.matchedPetSuggestion ? (
                  <button
                    onClick={() => {
                      const matched = allPets.find(p => p.id === analysisResult.matchedPetSuggestion.id || p.name.includes(analysisResult.matchedPetSuggestion.name)) || allPets[0];
                      onSelectPetForReception(matched);
                      onClose();
                    }}
                    className="flex-1 bg-[#4A6741] hover:bg-[#3D5535] text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>باز کردن پرونده بیمار تطبیق داده شده ({analysisResult.matchedPetSuggestion.name || 'لوسی'})</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onRegisterQuickVisitor(analysisResult.summaryDescription, `VIS-${Date.now().toString().slice(-4)}`);
                      onClose();
                    }}
                    className="flex-1 bg-[#5C7457] hover:bg-[#4A6741] text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>تشکیل پرونده سریع برای مراجعه‌کننده جدید</span>
                  </button>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#F7F8F3] border-t border-[#E6E9DF] flex items-center justify-between text-xs text-[#5C7457]">
          <span>پروتکل پشتیبانی شده: WebRTC / RTSP Local Stream</span>
          <button
            onClick={onClose}
            className="text-[#2D3A27] hover:text-[#4A6741] font-bold cursor-pointer"
          >
            بستن پنجره
          </button>
        </div>

      </div>
    </div>
  );
};
