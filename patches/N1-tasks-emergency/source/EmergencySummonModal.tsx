import React, { useState, useEffect } from 'react';
import { AlertOctagon, PhoneCall, Check, X } from 'lucide-react';
import { realtimeChat, SummonEvent } from '../services/realtimeChatService';

interface EmergencySummonModalProps {
  currentUser: { username: string; name: string; role: string };
  onJoinRoom: (roomId: string) => void;
}

export const EmergencySummonModal: React.FC<EmergencySummonModalProps> = ({
  currentUser,
  onJoinRoom,
}) => {
  const [activeSummon, setActiveSummon] = useState<SummonEvent | null>(null);

  const playChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // Audio autoplay policy might block
    }
  };

  useEffect(() => {
    const unsub = realtimeChat.onSummon((summon) => {
      // Check if target is 'all' or includes current user
      const isTarget = summon.targetUsernames.includes('all') ||
        summon.targetUsernames.includes(currentUser.username);

      if (isTarget && summon.isForced) {
        setActiveSummon(summon);
        playChime();
      }
    });

    return () => unsub();
  }, [currentUser.username]);

  if (!activeSummon) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" dir="rtl">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-4 border-rose-500 space-y-5 text-right relative overflow-hidden">
        {/* Glowing top line */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 animate-pulse" />

        <div className="flex items-center gap-3 text-rose-700">
          <div className="p-3 rounded-2xl bg-rose-100 text-rose-600 animate-bounce">
            <AlertOctagon className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-500">
              🚨 اخطار فوری و احضار اضطراری پرسنل
            </span>
            <h2 className="text-xl font-black text-gray-900">دستور فورس حضور در اتاق گفتگو</h2>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-2">
          <div className="text-xs text-gray-700">
            <span className="font-bold text-gray-900">مقام صادرکننده:</span> {activeSummon.callerName}
          </div>
          <div className="text-xs text-gray-700">
            <span className="font-bold text-gray-900">اتاق گفتگوی زنده:</span> {activeSummon.roomName}
          </div>
          <div className="text-xs text-rose-900 pt-1">
            <span className="font-bold">علت احضار فوری:</span>
            <p className="mt-1 font-black text-sm bg-white/70 p-2.5 rounded-xl border border-rose-200/50">
              «{activeSummon.reason}»
            </p>
          </div>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed">
          حضور شما توسط مدیریت ارشد کلینیک در این جلسه لایو الزامی ثبت گردیده است. لطفاً بلافاصله وارد اتاق شوید.
        </p>

        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            onClick={() => setActiveSummon(null)}
            className="px-4 py-2.5 text-xs text-gray-500 hover:text-gray-700 rounded-xl transition-colors cursor-pointer"
          >
            بستن اعلان
          </button>

          <button
            onClick={() => {
              const rId = activeSummon.roomId;
              setActiveSummon(null);
              onJoinRoom(rId);
            }}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm shadow-xl hover:shadow-rose-600/30 transition-all cursor-pointer"
          >
            <PhoneCall className="w-4 h-4" />
            <span>پیوستن آنی به اتاق لایو</span>
          </button>
        </div>
      </div>
    </div>
  );
};
