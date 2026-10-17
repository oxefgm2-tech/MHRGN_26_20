import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Users,
  Mic,
  MicOff,
  Send,
  PhoneCall,
  PhoneOff,
  AlertOctagon,
  UserPlus,
  Plus,
  Radio,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Clock,
  Sparkles,
  Flame,
  CheckCheck,
  Search,
  Hash,
  Stethoscope,
  Scissors,
  Receipt,
  ShoppingBag,
  ShieldAlert,
  X,
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { realtimeChat, OnlineUser } from '../services/realtimeChatService';
import { ChatRoom, ChatMessage, LiveCallSession } from '../types';

interface InternalMessengerTabProps {
  currentUser: { username: string; name: string; role: string };
  isManager: boolean;
  initialRoomId?: string;
}

const roomIcons: Record<string, any> = {
  general: MessageSquare,
  surgery: Stethoscope,
  reception: Users,
  emergency: ShieldAlert,
  petshop: ShoppingBag,
};

export const InternalMessengerTab: React.FC<InternalMessengerTabProps> = ({
  currentUser,
  isManager,
  initialRoomId,
}) => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string>(initialRoomId || 'room-general');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [staffList, setStaffList] = useState<Array<{ username: string; name: string; role: string }>>([]);
  const [inputText, setInputText] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  // Playing audio state
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Modals
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [newRoomMembers, setNewRoomMembers] = useState<string[]>([]);

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteTargets, setInviteTargets] = useState<string[]>([]);

  const [isForceSummonOpen, setIsForceSummonOpen] = useState(false);
  const [summonReason, setSummonReason] = useState('جلسه اضطراری و هماهنگی فوری پرسنل شیفت');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const activeRoom = rooms.find((r) => r.id === activeRoomId) || rooms[0];

  const fetchRooms = async () => {
    try {
      const data = await apiClient.getChatRooms();
      setRooms(data);
      if (!activeRoomId && data.length > 0) {
        setActiveRoomId(data[0].id);
      }
    } catch (e) {
      console.warn('Failed to load rooms:', e);
    }
  };

  const fetchStaff = async () => {
    const list = await apiClient.getStaff();
    setStaffList(list);
  };

  const fetchMessages = async (roomId: string) => {
    if (!roomId) return;
    setLoadingMessages(true);
    try {
      const msgs = await apiClient.getChatMessages(roomId);
      setMessages(msgs);
    } catch (e) {
      console.warn('Failed to load messages:', e);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchStaff();

    // Listen to presence
    const unsubPresence = realtimeChat.onPresence((users) => {
      setOnlineUsers(users);
    });

    // Listen to incoming messages
    const unsubMsg = realtimeChat.onMessage(({ roomId, message }) => {
      if (roomId === activeRoomId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }
      // Update room last message
      setRooms((prev) =>
        prev.map((r) =>
          r.id === roomId
            ? {
                ...r,
                lastMessage: {
                  text: message.type === 'voice' ? '🎤 پیام صوتی' : (message.type === 'summon' ? '🚨 احضار اضطراری' : message.content),
                  senderName: message.senderName,
                  createdAt: message.createdAt,
                  type: message.type,
                },
              }
            : r
        )
      );
    });

    // Listen to call updates
    const unsubCall = realtimeChat.onCallUpdate(({ roomId, activeCall }) => {
      setRooms((prev) =>
        prev.map((r) => (r.id === roomId ? { ...r, activeCall } : r))
      );
    });

    return () => {
      unsubPresence();
      unsubMsg();
      unsubCall();
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
    };
  }, [activeRoomId]);

  useEffect(() => {
    if (activeRoomId) {
      fetchMessages(activeRoomId);
    }
  }, [activeRoomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert('خطا در دسترسی به میکروفون. لطفاً دسترسی به میکروفون مرورگر را مجاز نمایید.');
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
    clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setRecordingSeconds(0);
    audioChunksRef.current = [];
  };

  const sendVoiceRecording = async () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        try {
          const res = await apiClient.sendChatMessage(activeRoomId, {
            type: 'voice',
            content: `پیام صوتی (${recordingSeconds} ثانیه)`,
            audioData: base64Audio,
            audioDurationSec: recordingSeconds,
            isUrgent,
          });
          if (res.success && res.data) {
            setMessages((prev) => [...prev, res.data!]);
          }
        } catch (e) {
          console.warn('Failed to send voice message:', e);
        }
      };
      reader.readAsDataURL(audioBlob);
    };

    mediaRecorderRef.current.stop();
    clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  // Send text message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeRoomId) return;

    const content = inputText.trim();
    setInputText('');
    try {
      const res = await apiClient.sendChatMessage(activeRoomId, {
        type: 'text',
        content,
        isUrgent,
      });
      if (res.success && res.data) {
        setMessages((prev) => [...prev, res.data!]);
        setIsUrgent(false);
      }
    } catch (e) {
      console.warn('Failed to send message:', e);
    }
  };

  // Play audio memo
  const togglePlayAudio = (messageId: string, audioData: string) => {
    if (playingMessageId === messageId) {
      audioPlayerRef.current?.pause();
      setPlayingMessageId(null);
      return;
    }

    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio();
      audioPlayerRef.current.onended = () => setPlayingMessageId(null);
    }

    audioPlayerRef.current.src = audioData;
    audioPlayerRef.current.play();
    setPlayingMessageId(messageId);
  };

  // Join Live Room
  const handleJoinLive = async () => {
    if (!activeRoomId) return;
    try {
      const res = await apiClient.joinLiveRoom(activeRoomId);
      if (res.success && res.activeCall) {
        setRooms((prev) =>
          prev.map((r) => (r.id === activeRoomId ? { ...r, activeCall: res.activeCall } : r))
        );
      }
    } catch (e) {
      console.warn('Failed to join live room:', e);
    }
  };

  const handleLeaveLive = async () => {
    if (!activeRoomId) return;
    try {
      const res = await apiClient.leaveLiveRoom(activeRoomId);
      if (res.success) {
        fetchRooms();
      }
    } catch (e) {
      console.warn('Failed to leave live room:', e);
    }
  };

  const handleToggleMute = async () => {
    if (!activeRoomId) return;
    try {
      const res = await apiClient.toggleMuteLiveRoom(activeRoomId);
      if (res.success && res.activeCall) {
        setRooms((prev) =>
          prev.map((r) => (r.id === activeRoomId ? { ...r, activeCall: res.activeCall } : r))
        );
      }
    } catch (e) {
      console.warn('Failed to toggle mute:', e);
    }
  };

  // Admin Force Attendance
  const handleExecuteForceSummon = async () => {
    if (!activeRoomId || !summonReason.trim()) return;
    try {
      const res = await apiClient.forceChatAttendance(activeRoomId, summonReason.trim());
      if (res.success) {
        setIsForceSummonOpen(false);
        fetchMessages(activeRoomId);
        fetchRooms();
      }
    } catch (e) {
      console.warn('Failed to execute force summon:', e);
    }
  };

  // Create Room
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    try {
      const res = await apiClient.createChatRoom({
        name: newRoomName.trim(),
        description: newRoomDesc.trim(),
        members: newRoomMembers.length > 0 ? newRoomMembers : ['all'],
      });
      if (res.success && res.data) {
        setRooms((prev) => [...prev, res.data!]);
        setActiveRoomId(res.data.id);
        setIsCreateRoomOpen(false);
        setNewRoomName('');
        setNewRoomDesc('');
        setNewRoomMembers([]);
      }
    } catch (e) {
      console.warn('Failed to create room:', e);
    }
  };

  // Invite to room
  const handleInviteMembers = async () => {
    if (!activeRoomId || inviteTargets.length === 0) return;
    try {
      const res = await apiClient.inviteToRoom(activeRoomId, inviteTargets);
      if (res.success) {
        setIsInviteOpen(false);
        setInviteTargets([]);
        fetchRooms();
      }
    } catch (e) {
      console.warn('Failed to invite members:', e);
    }
  };

  const isUserInCall = activeRoom?.activeCall?.isActive &&
    activeRoom.activeCall.attendees.some((a) => a.username === currentUser.username);
  const myCallStatus = activeRoom?.activeCall?.attendees.find((a) => a.username === currentUser.username);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-140px)] min-h-[640px]" dir="rtl">
      {/* Sidebar: Rooms & Online Staff */}
      <div className="lg:col-span-4 bg-white rounded-3xl border border-[#E6E9DF] shadow-xs flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-800">پیام‌رسان و کانال‌های داخلی</h2>
              <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                {onlineUsers.length} پرسنل آنلاین
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsCreateRoomOpen(true)}
            className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
            title="ایجاد اتاق گفتگوی جدید"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Rooms List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          <div className="text-[10px] font-bold text-gray-400 px-2 py-1 uppercase tracking-wider">
            اتاق‌ها و کانال‌های کلینیک
          </div>

          {rooms.map((room) => {
            const isActive = room.id === activeRoomId;
            const Icon = roomIcons[room.iconType || 'general'] || MessageSquare;
            const hasCall = room.activeCall?.isActive;

            return (
              <div
                key={room.id}
                onClick={() => setActiveRoomId(room.id)}
                className={`p-3 rounded-2xl transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-emerald-50/70 border-emerald-200 shadow-xs'
                    : 'border-transparent hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl shrink-0 ${
                      hasCall
                        ? 'bg-emerald-500 text-white ring-2 ring-emerald-300 animate-pulse'
                        : isActive
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-black text-gray-800">{room.name}</h4>
                        {hasCall && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center gap-0.5">
                            <Radio className="w-2.5 h-2.5" /> زنده
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                        {room.lastMessage ? (
                          <span>
                            <strong className="text-gray-700">{room.lastMessage.senderName}: </strong>
                            {room.lastMessage.text}
                          </span>
                        ) : (
                          room.description || 'گفتگوی گروهی'
                        )}
                      </p>
                    </div>
                  </div>

                  {room.activeCall?.isActive && (
                    <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded-full">
                      {room.activeCall.attendees.length} نفر
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Active online staff section */}
          <div className="pt-4 border-t border-gray-100">
            <div className="text-[10px] font-bold text-gray-400 px-2 py-1 uppercase tracking-wider mb-1">
              پرسنل حاضر در شیفت
            </div>
            <div className="space-y-1">
              {staffList.map((s) => {
                const isOnline = onlineUsers.some((u) => u.username === s.username);
                return (
                  <div
                    key={s.username}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-gray-200 to-gray-100 border border-gray-300 flex items-center justify-center font-bold text-gray-700 text-[10px]">
                          {s.name.substring(0, 1)}
                        </div>
                        <span
                          className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white ${
                            isOnline ? 'bg-emerald-500 ring-1 ring-emerald-300' : 'bg-gray-300'
                          }`}
                        />
                      </div>
                      <div>
                        <span className="font-bold text-gray-800 block text-[11px]">{s.name}</span>
                        <span className="text-[10px] text-gray-400">{s.role}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] ${isOnline ? 'text-emerald-600 font-bold' : 'text-gray-400'}`}>
                      {isOnline ? 'آنلاین' : 'آفلاین'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Conversation & Live Audio Screen */}
      <div className="lg:col-span-8 bg-white rounded-3xl border border-[#E6E9DF] shadow-xs flex flex-col overflow-hidden">
        {/* Room Header */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-[#FDFEFA]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-gray-900">{activeRoom?.name}</h3>
                <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {activeRoom?.members?.includes('all') ? 'همه پرسنل' : `${activeRoom?.members?.length || 0} عضو`}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{activeRoom?.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsInviteOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold transition-all cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
              <span>دعوت پرسنل</span>
            </button>

            {isManager && (
              <button
                onClick={() => setIsForceSummonOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer animate-pulse"
                title="فورس حضور پرسنل توسط مدیریت ارشد"
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>🚨 احضار اجباری (فورس)</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Audio Call Banner */}
        <div className={`p-3.5 border-b transition-colors ${
          activeRoom?.activeCall?.isActive
            ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white'
            : 'bg-gray-50 text-gray-600'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl shrink-0 ${
                activeRoom?.activeCall?.isActive ? 'bg-white/20' : 'bg-gray-200 text-gray-600'
              }`}>
                <Radio className={`w-4 h-4 ${activeRoom?.activeCall?.isActive ? 'animate-pulse text-emerald-200' : ''}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black">
                    {activeRoom?.activeCall?.isActive
                      ? `مکالمه صوتی زنده گروهی در جریان است: ${activeRoom.activeCall.topic}`
                      : 'مکالمه زنده فعالی در این اتاق وجود ندارد'}
                  </span>
                  {activeRoom?.activeCall?.forced && (
                    <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">
                      فورس حضور مدیریت
                    </span>
                  )}
                </div>

                {activeRoom?.activeCall?.isActive && (
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="text-[11px] text-emerald-100">حاضرین در گفتگو:</span>
                    {activeRoom.activeCall.attendees.map((att) => (
                      <span
                        key={att.username}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-white/20 text-white font-medium flex items-center gap-1"
                      >
                        {att.isMuted ? <MicOff className="w-2.5 h-2.5 text-rose-300" /> : <Mic className="w-2.5 h-2.5 text-emerald-300" />}
                        {att.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isUserInCall ? (
                <>
                  <button
                    onClick={handleToggleMute}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      myCallStatus?.isMuted ? 'bg-rose-500 hover:bg-rose-600 text-white' : 'bg-white/20 hover:bg-white/30 text-white'
                    }`}
                  >
                    {myCallStatus?.isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    <span>{myCallStatus?.isMuted ? 'میکروفون بسته' : 'میکروفون باز'}</span>
                  </button>
                  <button
                    onClick={handleLeaveLive}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    <PhoneOff className="w-3.5 h-3.5" />
                    <span>ترک مکالمه</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={handleJoinLive}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md ${
                    activeRoom?.activeCall?.isActive
                      ? 'bg-white text-emerald-800 hover:bg-emerald-50'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>{activeRoom?.activeCall?.isActive ? 'پیوستن به مکالمه صوتی' : 'آغاز مکالمه آنلاین گروهی'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F9FAF7]/50">
          {loadingMessages ? (
            <div className="text-center py-10 text-xs text-gray-400">در حال دریافت پیام‌ها...</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs space-y-1">
              <MessageSquare className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="font-bold">پیامی در این اتاق ثبت نشده است</p>
              <p className="text-[11px]">اولین پیام متنی یا صوتی را برای همکاران ارسال فرمایید.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderUsername === currentUser.username;
              const isSummon = msg.type === 'summon';
              const isVoice = msg.type === 'voice';

              if (isSummon) {
                return (
                  <div
                    key={msg.id}
                    className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 to-orange-50 border-2 border-rose-300 shadow-md text-right space-y-2"
                  >
                    <div className="flex items-center justify-between text-rose-800 font-bold text-xs">
                      <span className="flex items-center gap-1.5 text-rose-700 font-black">
                        <AlertOctagon className="w-4 h-4 animate-bounce" />
                        احضار فوری و اضطراری مدیران
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(msg.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs font-black text-gray-900 leading-relaxed">{msg.content}</p>
                    <div className="text-[11px] text-rose-700 font-medium">
                      صادرکننده دستور: <strong>{msg.senderName}</strong> ({msg.senderRole})
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3.5 shadow-xs space-y-1.5 ${
                      isMe
                        ? 'bg-emerald-600 text-white rounded-br-xs'
                        : 'bg-white border border-[#E6E9DF] text-gray-800 rounded-bl-xs'
                    } ${msg.isUrgent ? 'ring-2 ring-rose-400 border-rose-400' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-3 text-[10px] pb-1 border-b border-black/5">
                      <span className={`font-bold ${isMe ? 'text-emerald-100' : 'text-emerald-700'}`}>
                        {msg.senderName} <span className="opacity-70 font-normal">({msg.senderRole})</span>
                      </span>
                      <span className={`text-[9px] ${isMe ? 'text-emerald-200' : 'text-gray-400'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Content */}
                    {isVoice ? (
                      <div className="flex items-center gap-3 pt-1">
                        <button
                          onClick={() => msg.audioData && togglePlayAudio(msg.id, msg.audioData)}
                          className={`p-2.5 rounded-full transition-transform active:scale-95 ${
                            isMe ? 'bg-white text-emerald-800' : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {playingMessageId === msg.id ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4 fill-current" />
                          )}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span>پیام صوتی</span>
                            <span>{msg.audioDurationSec ? `${msg.audioDurationSec}s` : 'صوت'}</span>
                          </div>
                          {/* Audio wave bars */}
                          <div className="flex items-center gap-0.5 mt-1 h-3">
                            {[4, 8, 12, 6, 14, 10, 5, 12, 8, 4, 10, 14, 6].map((h, idx) => (
                              <span
                                key={idx}
                                className={`w-1 rounded-full ${
                                  isMe ? 'bg-white/70' : 'bg-emerald-500'
                                } ${playingMessageId === msg.id ? 'animate-pulse' : ''}`}
                                style={{ height: `${h}px` }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    )}

                    {msg.isUrgent && (
                      <div className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md inline-block">
                        ⚠️ پیام با اولویت بالا
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3.5 border-t border-gray-100 bg-white">
          {isRecording ? (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-rose-50 border border-rose-200">
              <div className="flex items-center gap-2 text-rose-700">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping inline-block" />
                <span className="text-xs font-black">
                  در حال ضبط صدا... {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cancelRecording}
                  className="px-3 py-1.5 rounded-xl text-xs text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={sendVoiceRecording}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ارسال صدا</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="space-y-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={startRecording}
                  className="p-2.5 rounded-2xl bg-gray-100 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 transition-colors cursor-pointer"
                  title="ضبط و ارسال پیام صوتی"
                >
                  <Mic className="w-5 h-5" />
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="پیام خود را بنویسید (Enter برای ارسال)..."
                  className="flex-1 text-xs px-4 py-3 rounded-2xl border border-gray-200 focus:outline-hidden focus:border-emerald-600 bg-gray-50/50"
                />

                <label className="flex items-center gap-1 text-[11px] text-gray-500 cursor-pointer shrink-0 select-none">
                  <input
                    type="checkbox"
                    checked={isUrgent}
                    onChange={(e) => setIsUrgent(e.target.checked)}
                    className="accent-rose-600 rounded-sm"
                  />
                  <span>فوری</span>
                </label>

                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-40 cursor-pointer shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Force Attendance Modal */}
      {isForceSummonOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border-2 border-rose-500" dir="rtl">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertOctagon className="w-6 h-6 animate-pulse" />
                <h3 className="text-base font-black">احضار اجباری پرسنل (فورس حضور)</h3>
              </div>
              <button onClick={() => setIsForceSummonOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold">
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              با تایید این دستور، برای تمام اعضای این اتاق یک اخطار فوری و تمام‌صفحه به همراه زنگ هشدار ارسال می‌شود تا بلافاصله به اتاق لایو بپیوندند.
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">علت و عنوان احضار فوری:</label>
              <textarea
                rows={3}
                value={summonReason}
                onChange={(e) => setSummonReason(e.target.value)}
                placeholder="مثال: جلسه فوری هماهنگی تحویل شیفت یا بیمار اورژانسی اتاق عمل..."
                className="w-full text-xs p-3 rounded-xl border border-rose-300 focus:outline-hidden focus:border-rose-600"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsForceSummonOpen(false)}
                className="px-4 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleExecuteForceSummon}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
              >
                صدور و ابلاغ فوری دستور فورس
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4" dir="rtl">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-gray-800">دعوت همکاران به {activeRoom?.name}</h3>
              </div>
              <button onClick={() => setIsInviteOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold">
                ✕
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 p-1">
              {staffList.map((s) => {
                const isSelected = inviteTargets.includes(s.username);
                return (
                  <label
                    key={s.username}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-colors ${
                      isSelected ? 'bg-emerald-50 border-emerald-300' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setInviteTargets((prev) => [...prev, s.username]);
                          } else {
                            setInviteTargets((prev) => prev.filter((u) => u !== s.username));
                          }
                        }}
                        className="accent-emerald-600"
                      />
                      <span className="text-xs font-bold text-gray-800">{s.name}</span>
                    </div>
                    <span className="text-[10px] text-gray-400">{s.role}</span>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsInviteOpen(false)}
                className="px-4 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleInviteMembers}
                disabled={inviteTargets.length === 0}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl disabled:opacity-50 cursor-pointer shadow-md"
              >
                ارسال دعوت‌نامه ({inviteTargets.length} نفر)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Room Modal */}
      {isCreateRoomOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4" dir="rtl">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-gray-800">ایجاد اتاق گفتگوی جدید</h3>
              </div>
              <button onClick={() => setIsCreateRoomOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">نام اتاق</label>
                <input
                  type="text"
                  required
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="مثال: تیم رادیولوژی و سونوگرافی"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">توضیحات اتاق</label>
                <input
                  type="text"
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                  placeholder="مثال: هماهنگی تصاویر تشخیصی و پرونده‌های ارجاعی"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreateRoomOpen(false)}
                  className="px-4 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={!newRoomName.trim()}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl disabled:opacity-50 cursor-pointer shadow-md"
                >
                  ایجاد اتاق
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
