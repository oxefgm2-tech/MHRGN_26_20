import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  ClipboardList,
  UserCheck,
  Flame,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { ClinicTask, TaskPriority, TaskDepartment } from '../types';

interface SeniorManagerPanelProps {
  username: string;
  creatorName: string;
  isManager?: boolean;
  onOpenFullTasks?: () => void;
}

export const SeniorManagerPanel: React.FC<SeniorManagerPanelProps> = ({
  creatorName,
  isManager = false,
  onOpenFullTasks,
}) => {
  const [tasks, setTasks] = useState<ClinicTask[]>([]);
  const [staffList, setStaffList] = useState<Array<{ username: string; name: string; role: string }>>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [selectedDept, setSelectedDept] = useState<TaskDepartment>('clinical');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [tasksData, staffData] = await Promise.all([
          apiClient.getTasks(),
          apiClient.getStaff(),
        ]);
        if (active) {
          setTasks(tasksData);
          setStaffList(staffData);
          if (staffData.length > 0) {
            setSelectedAssignee(staffData[0].username);
          }
        }
      } catch (err) {
        console.warn('Could not fetch manager tasks:', err);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedAssignee) return;
    setIsLoading(true);
    try {
      const assigneeObj = staffList.find((s) => s.username === selectedAssignee);
      const res = await apiClient.createTask({
        title: newTaskTitle.trim(),
        assigneeUsername: selectedAssignee,
        assigneeName: assigneeObj?.name || selectedAssignee,
        assigneeRole: assigneeObj?.role || 'staff',
        department: selectedDept,
        priority,
      });

      if (res.success && res.data) {
        setTasks((prev) => [res.data!, ...prev]);
        setNewTaskTitle('');
      }
    } catch (err) {
      console.warn('Error creating task:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'completed' ? 'open' : 'completed';
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus as any } : t))
    );
    try {
      await apiClient.updateTask(taskId, {
        status: nextStatus as any,
        note: `وضعیت توسط ${creatorName} به "${nextStatus === 'completed' ? 'انجام شد' : 'در انتظار'}" تغییر یافت`,
      });
    } catch (err) {
      console.warn('Failed to update task status:', err);
    }
  };

  const urgentTasksCount = tasks.filter((t) => t.priority === 'urgent' && t.status !== 'completed').length;
  const openTasksCount = tasks.filter((t) => t.status === 'open').length;

  return (
    <div
      className="mb-6 rounded-3xl bg-gradient-to-br from-white via-[#FCFDF9] to-[#F5F8F0] border-2 border-[#DCE4D4] shadow-md p-6 relative overflow-hidden"
      dir="rtl"
    >
      {/* Decorative accent */}
      <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-emerald-600 via-[#4A6741] to-teal-500" />

      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-[#E6E9DF]">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-[#4A6741] to-emerald-600 text-white shadow-md">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-[#2D3A27]">
                {isManager ? 'پنل مدیران: تیکت‌گذاری و واگذاری مسئولیت به پرسنل' : 'کارتابل ماموریت‌ها و وظایف درمان'}
              </h2>
              {urgentTasksCount > 0 && (
                <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-rose-500 text-white animate-pulse flex items-center gap-1">
                  <Flame className="w-3 h-3" /> {urgentTasksCount} تیکت فوری
                </span>
              )}
            </div>
            <p className="text-xs text-[#5C7457] mt-0.5">
              ارجاع ماموریت به همکاران شیفت (پذیرش، جراح، گرومر، صندوق، پت‌شاپ، IT) همراه با پیگیری و گزارش کار
            </p>
          </div>
        </div>

        {onOpenFullTasks && (
          <button
            onClick={onOpenFullTasks}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#4A6741] hover:bg-[#3D5535] text-white rounded-2xl text-xs font-bold shadow-md transition-all cursor-pointer shrink-0"
          >
            <span>ورود به کارتابل جامع تیکت‌ها</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Task Delegation Form (For Managers) */}
      {isManager && (
        <form onSubmit={handleAddTask} className="mb-5 bg-white p-4 rounded-2xl border border-[#E6E9DF] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-[#4A6741]" />
              ثبت و واگذاری سریع وظیفه به پرسنل کلینیک:
            </span>
            <span className="text-[11px] text-gray-400">تیکت جدید با نوتیفیکیشن برای پرسنل ارسال می‌شود</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
            {/* Title */}
            <input
              type="text"
              required
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="عنوان شرح وظیفه (مثال: بررسی سونوگرافی سگ لابرادور اتاق ۳)..."
              className="md:col-span-5 text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#4A6741]"
            />

            {/* Assignee */}
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="md:col-span-3 text-xs px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-hidden font-medium"
            >
              {staffList.map((s) => (
                <option key={s.username} value={s.username}>
                  مسئول: {s.name} ({s.role})
                </option>
              ))}
            </select>

            {/* Department */}
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value as any)}
              className="md:col-span-2 text-xs px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-hidden font-medium"
            >
              <option value="clinical">درمان و ویزیت</option>
              <option value="surgery">جراحی و بیهوشی</option>
              <option value="reception">پذیرش و نوبت</option>
              <option value="cashier">صندوق و مالی</option>
              <option value="grooming">آرایشگاه</option>
              <option value="petshop">پت‌شاپ</option>
              <option value="it_support">فناوری اطلاعات</option>
              <option value="general">عمومی</option>
            </select>

            {/* Priority */}
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="md:col-span-2 text-xs px-2.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 font-bold"
            >
              <option value="low">عادی</option>
              <option value="medium">متوسط</option>
              <option value="high">مهم</option>
              <option value="urgent">اورژانسی / فوری</option>
            </select>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading || !newTaskTitle.trim()}
              className="flex items-center gap-1.5 px-5 py-2 bg-[#4A6741] hover:bg-[#3D5535] text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isLoading ? 'در حال ثبت...' : 'ثبت و واگذاری ماموریت'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tasks Mini-Feed */}
      {tasks.length === 0 ? (
        <div className="text-center py-6 bg-white/70 rounded-2xl border border-dashed border-gray-200 text-xs text-gray-500">
          تیکت فعالی در حال حاضر در کلینیک ثبت نشده است.
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
            <span>آخرین تیکت‌های در دست اقدام ({tasks.slice(0, 4).length} از {tasks.length} تیکت):</span>
            <span>کلیک روی تیکت = تغییر وضعیت به تکمیل‌شده</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {tasks.slice(0, 4).map((t) => {
              const isDone = t.status === 'completed';
              const isUrgent = t.priority === 'urgent';

              return (
                <div
                  key={t.id}
                  onClick={() => handleToggleStatus(t.id, t.status)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isDone
                      ? 'bg-gray-50 border-gray-200 text-gray-400 line-through opacity-70'
                      : isUrgent
                      ? 'bg-rose-50/80 border-rose-300 text-rose-900 shadow-xs'
                      : 'bg-white border-[#E6E9DF] text-gray-800 shadow-xs hover:border-[#4A6741]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="shrink-0">
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : isUrgent ? (
                        <AlertCircle className="w-5 h-5 text-rose-600 animate-pulse" />
                      ) : (
                        <Clock className="w-5 h-5 text-amber-500" />
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold truncate">{t.title}</div>
                      <div className="text-[10px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <UserCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate">مسئول: {t.assigneeName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1">
                    {isUrgent && (
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                        فوری
                      </span>
                    )}
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                      isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {isDone ? 'انجام شد' : 'در دست اقدام'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
