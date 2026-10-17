import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserCheck,
  Send,
  Trash2,
  Calendar,
  Building2,
  Flame,
  ArrowRight,
  RefreshCw,
  MessageSquare,
  FileText,
  BadgeAlert,
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { realtimeChat } from '../services/realtimeChatService';
import { ClinicTask, TaskPriority, TaskStatus, TaskDepartment } from '../types';

interface StaffTasksDelegationTabProps {
  currentUser: { username: string; name: string; role: string };
  isManager: boolean;
}

const departmentLabels: Record<TaskDepartment, { label: string; color: string }> = {
  clinical: { label: 'بخش درمان و ویزیت', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  surgery: { label: 'جراحی و اتاق عمل', color: 'bg-rose-50 text-rose-800 border-rose-200' },
  reception: { label: 'پذیرش و نوبت‌دهی', color: 'bg-blue-50 text-blue-800 border-blue-200' },
  cashier: { label: 'صندوق و حسابداری', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  grooming: { label: 'آرایشگاه و شستشو', color: 'bg-purple-50 text-purple-800 border-purple-200' },
  petshop: { label: 'پت‌شاپ و انبار', color: 'bg-teal-50 text-teal-800 border-teal-200' },
  it_support: { label: 'فناوری اطلاعات و سخت‌افزار', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  general: { label: 'عمومی و نظافت کلینیک', color: 'bg-slate-50 text-slate-800 border-slate-200' },
};

const priorityConfig: Record<TaskPriority, { label: string; badgeClass: string; icon: any }> = {
  urgent: { label: 'بحرانی و اورژانسی', badgeClass: 'bg-red-500 text-white animate-pulse', icon: Flame },
  high: { label: 'اولویت بالا', badgeClass: 'bg-rose-100 text-rose-800 border border-rose-300', icon: AlertTriangle },
  medium: { label: 'اولویت متوسط', badgeClass: 'bg-amber-100 text-amber-800 border border-amber-300', icon: Clock },
  low: { label: 'عادی', badgeClass: 'bg-gray-100 text-gray-700 border border-gray-300', icon: CheckCircle2 },
};

const statusLabels: Record<TaskStatus, { label: string; badge: string }> = {
  open: { label: 'در انتظار اقدام', badge: 'bg-blue-100 text-blue-800' },
  in_progress: { label: 'در حال انجام', badge: 'bg-amber-100 text-amber-800' },
  completed: { label: 'انجام و تایید شد', badge: 'bg-emerald-100 text-emerald-800' },
};

export const StaffTasksDelegationTab: React.FC<StaffTasksDelegationTabProps> = ({
  currentUser,
  isManager,
}) => {
  const [tasks, setTasks] = useState<ClinicTask[]>([]);
  const [staffList, setStaffList] = useState<Array<{ username: string; name: string; role: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State for new task
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [assigneeUsername, setAssigneeUsername] = useState('');
  const [department, setDepartment] = useState<TaskDepartment>('clinical');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Note for progress
  const [actionNote, setActionNote] = useState<Record<string, string>>({});
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const fetchStaff = async () => {
    const list = await apiClient.getStaff();
    setStaffList(list);
    if (list.length > 0 && !assigneeUsername) {
      setAssigneeUsername(list[0].username);
    }
  };

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getTasks();
      setTasks(data);
    } catch (e) {
      console.warn('Failed to load clinic tasks:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
    loadTasks();

    const unsubscribe = realtimeChat.onTaskEvent((event) => {
      if (event.type === 'task:created' && event.task) {
        setTasks((prev) => [event.task!, ...prev.filter((t) => t.id !== event.task!.id)]);
      } else if (event.type === 'task:updated' && event.task) {
        setTasks((prev) => prev.map((t) => (t.id === event.task!.id ? event.task! : t)));
      } else if (event.type === 'task:deleted' && event.taskId) {
        setTasks((prev) => prev.filter((t) => t.id !== event.taskId));
      }
    });

    return () => unsubscribe();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !assigneeUsername) return;

    setSubmitting(true);
    try {
      const selectedStaff = staffList.find((s) => s.username === assigneeUsername);
      const res = await apiClient.createTask({
        title: title.trim(),
        details: details.trim(),
        department,
        assigneeUsername,
        assigneeName: selectedStaff?.name || assigneeUsername,
        assigneeRole: selectedStaff?.role || 'staff',
        priority,
        dueDate: dueDate.trim() || undefined,
      });

      if (res.success && res.data) {
        setTasks((prev) => [res.data!, ...prev]);
        setIsModalOpen(false);
        setTitle('');
        setDetails('');
        setDueDate('');
      }
    } catch (err) {
      console.warn('Create task error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (taskId: string, nextStatus: TaskStatus) => {
    const note = actionNote[taskId]?.trim() || '';
    try {
      const res = await apiClient.updateTask(taskId, {
        status: nextStatus,
        note: note ? note : `تغییر وضعیت به "${statusLabels[nextStatus].label}"`,
      });
      if (res.success && res.data) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? res.data! : t)));
        setActionNote((prev) => ({ ...prev, [taskId]: '' }));
      }
    } catch (err) {
      console.warn('Update task status error:', err);
    }
  };

  const handleAddNote = async (taskId: string) => {
    const note = actionNote[taskId]?.trim();
    if (!note) return;
    try {
      const res = await apiClient.updateTask(taskId, { note });
      if (res.success && res.data) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? res.data! : t)));
        setActionNote((prev) => ({ ...prev, [taskId]: '' }));
      }
    } catch (err) {
      console.warn('Add note error:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('آیا از حذف این تیکت اطمینان دارید؟')) return;
    try {
      const res = await apiClient.deleteTask(taskId);
      if (res.success) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
      }
    } catch (err) {
      console.warn('Delete task error:', err);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (deptFilter !== 'all' && t.department !== deptFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (assigneeFilter !== 'all' && t.assigneeUsername !== assigneeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchAssignee = t.assigneeName.toLowerCase().includes(q);
      const matchDetails = (t.details || '').toLowerCase().includes(q);
      if (!matchTitle && !matchAssignee && !matchDetails) return false;
    }
    return true;
  });

  const myTasksCount = tasks.filter((t) => t.assigneeUsername === currentUser.username && t.status !== 'completed').length;
  const urgentCount = tasks.filter((t) => t.priority === 'urgent' && t.status !== 'completed').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#2D3A27] via-[#3A4D34] to-[#4A6741] text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute left-6 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none hidden md:block">
          <ClipboardList className="w-48 h-48" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-bold text-emerald-300 mb-2">
              <BadgeAlert className="w-4 h-4" />
              <span>سامانه ارجاع و پیگیری وظایف پرسنل مهرگان</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">کارتابل تیکت‌ها و واگذاری مسئولیت پرسنل</h1>
            <p className="text-sm text-emerald-100 mt-1">
              مدیریت شفاف ماموریت‌ها، پیگیری پیشرفت شیفت‌های کاری و ثبت گزارش اقدامات پرسنلی
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isManager && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm shadow-lg hover:shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                <span>ثبت تیکت و ماموریت جدید</span>
              </button>
            )}
            <button
              onClick={loadTasks}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>تازه‌سازی</span>
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10 text-xs">
          <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-xs">
            <span className="text-emerald-200 block text-[11px] mb-1">وظایف در نوبت من</span>
            <span className="text-xl font-black">{myTasksCount} مورد</span>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-xs">
            <span className="text-rose-200 block text-[11px] mb-1">تیکت‌های فوری و اورژانسی</span>
            <span className="text-xl font-black text-rose-300">{urgentCount} مورد</span>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-xs">
            <span className="text-amber-200 block text-[11px] mb-1">در دست اقدام و پیگیری</span>
            <span className="text-xl font-black text-amber-300">{inProgressCount} مورد</span>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-xs">
            <span className="text-emerald-200 block text-[11px] mb-1">تکمیل شده</span>
            <span className="text-xl font-black text-emerald-300">{completedCount} مورد</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#E6E9DF] shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در عنوان، شرح ماموریت یا نام پرسنل..."
            className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-[#4A6741]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-hidden font-medium"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="open">در انتظار اقدام</option>
            <option value="in_progress">در حال انجام</option>
            <option value="completed">انجام شده</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-hidden font-medium"
          >
            <option value="all">همه اولویت‌ها</option>
            <option value="urgent">فوری و اورژانسی</option>
            <option value="high">بالا</option>
            <option value="medium">متوسط</option>
            <option value="low">عادی</option>
          </select>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="text-xs px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-hidden font-medium"
          >
            <option value="all">همه بخش‌های کلینیک</option>
            <option value="clinical">درمان و ویزیت</option>
            <option value="surgery">جراحی و اتاق عمل</option>
            <option value="reception">پذیرش و نوبت‌دهی</option>
            <option value="cashier">صندوق و حسابداری</option>
            <option value="grooming">آرایشگاه و شستشو</option>
            <option value="petshop">پت‌شاپ و انبار</option>
            <option value="it_support">فناوری اطلاعات</option>
            <option value="general">عمومی</option>
          </select>

          {isManager && (
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="text-xs px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-hidden font-medium"
            >
              <option value="all">همه پرسنل</option>
              {staffList.map((s) => (
                <option key={s.username} value={s.username}>
                  {s.name} ({s.role})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {loading && tasks.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">در حال بارگذاری تیکت‌ها...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200 p-8">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-gray-700">هیچ وظیفه‌ای با این مشخصات یافت نشد</h3>
            <p className="text-xs text-gray-400 mt-1">تیکت جدیدی ایجاد کنید یا فیلترهای بالا را ریست نمایید.</p>
          </div>
        ) : (
          filteredTasks.map((t) => {
            const isAssignedToMe = t.assigneeUsername === currentUser.username;
            const isUrgent = t.priority === 'urgent';
            const deptInfo = departmentLabels[t.department || 'general'];
            const prio = priorityConfig[t.priority || 'medium'];
            const PrioIcon = prio.icon;

            return (
              <div
                key={t.id}
                className={`bg-white rounded-2xl border transition-all shadow-xs p-5 ${
                  isUrgent
                    ? 'border-rose-400 ring-2 ring-rose-200/50'
                    : isAssignedToMe
                    ? 'border-emerald-300'
                    : 'border-[#E6E9DF]'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Top info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${deptInfo.color}`}>
                        {deptInfo.label}
                      </span>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${prio.badgeClass}`}>
                        <PrioIcon className="w-3 h-3" />
                        {prio.label}
                      </span>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${statusLabels[t.status].badge}`}>
                        {statusLabels[t.status].label}
                      </span>
                      {isAssignedToMe && (
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-600 text-white">
                          وظیفه من
                        </span>
                      )}
                      {t.dueDate && (
                        <span className="text-[11px] text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          موعد: {t.dueDate}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-black text-gray-800 leading-snug">{t.title}</h3>

                    {t.details && (
                      <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                        {t.details}
                      </p>
                    )}

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-400 pt-1">
                      <span className="flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        مسئول: <strong className="text-gray-700">{t.assigneeName}</strong>
                      </span>
                      <span>ارجاع‌دهنده: {t.createdByName}</span>
                      <span>تاریخ ثبت: {new Date(t.createdAt).toLocaleDateString('fa-IR')}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
                      <button
                        onClick={() => handleStatusChange(t.id, 'open')}
                        className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all ${
                          t.status === 'open' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        در انتظار
                      </button>
                      <button
                        onClick={() => handleStatusChange(t.id, 'in_progress')}
                        className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all ${
                          t.status === 'in_progress' ? 'bg-amber-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        در حال انجام
                      </button>
                      <button
                        onClick={() => handleStatusChange(t.id, 'completed')}
                        className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all ${
                          t.status === 'completed' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        تکمیل شد ✓
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedTaskId(selectedTaskId === t.id ? null : t.id)}
                        className="text-xs text-gray-600 hover:text-emerald-700 flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>گزارش اقدامات ({t.updates?.length || 0})</span>
                      </button>

                      {isManager && (
                        <button
                          onClick={() => handleDeleteTask(t.id)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="حذف تیکت"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress updates & report timeline */}
                {selectedTaskId === t.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                    <h4 className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <span>تاریخچه پیگیری و یادداشت‌های پیشرفت کار:</span>
                    </h4>

                    {t.updates && t.updates.length > 0 ? (
                      <div className="space-y-2">
                        {t.updates.map((u, i) => (
                          <div key={i} className="text-xs bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex items-start justify-between">
                            <div>
                              <span className="font-bold text-gray-800">{u.byName}: </span>
                              <span className="text-gray-600">{u.note || statusLabels[u.status]?.label}</span>
                            </div>
                            <span className="text-[10px] text-gray-400 shrink-0 mr-2">
                              {new Date(u.at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">هنوز گزارشی ثبت نشده است.</p>
                    )}

                    {/* Add note input */}
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        value={actionNote[t.id] || ''}
                        onChange={(e) => setActionNote({ ...actionNote, [t.id]: e.target.value })}
                        placeholder="ثبت توضیح یا گزارش اقدام انجام‌شده..."
                        className="flex-1 text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-hidden focus:border-emerald-600"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddNote(t.id)}
                      />
                      <button
                        onClick={() => handleAddNote(t.id)}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        ارسال گزارش
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* New Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4" dir="rtl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-gray-800">ثبت تیکت و واگذاری مسئولیت جدید</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  عنوان مشخص ماموریت یا وظیفه <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: کنترل علائم حیاتی و سرم‌تراپی سگ جراحی‌شده اتاق ۲"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  انتخاب پرسنل مسئول <span className="text-rose-500">*</span>
                </label>
                <select
                  value={assigneeUsername}
                  onChange={(e) => setAssigneeUsername(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-hidden"
                >
                  {staffList.map((s) => (
                    <option key={s.username} value={s.username}>
                      {s.name} — ({s.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">بخش کلینیک</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as any)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-hidden"
                  >
                    <option value="clinical">درمان و ویزیت</option>
                    <option value="surgery">جراحی و اتاق عمل</option>
                    <option value="reception">پذیرش و نوبت‌دهی</option>
                    <option value="cashier">صندوق و حسابداری</option>
                    <option value="grooming">آرایشگاه و شستشو</option>
                    <option value="petshop">پت‌شاپ و انبار</option>
                    <option value="it_support">فناوری اطلاعات (IT)</option>
                    <option value="general">عمومی</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">درجه اولویت</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-hidden"
                  >
                    <option value="low">عادی</option>
                    <option value="medium">متوسط</option>
                    <option value="high">اولویت بالا</option>
                    <option value="urgent">بحرانی و اورژانسی</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">مهلت انجام / موعد</label>
                <input
                  type="text"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  placeholder="مثال: تا ساعت ۱۴:۰۰ امروز، یا پایان شیفت عصر"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">دستورالعمل تفصیلی و توضیحات</label>
                <textarea
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="دستورات درمانی، نکات مهم مراقبت، دوز داروها یا پروتکل خاص..."
                  className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={submitting || !title.trim()}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {submitting ? 'در حال ثبت...' : 'ثبت و ارجاع تیکت'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
