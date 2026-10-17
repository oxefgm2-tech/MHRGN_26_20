import React from 'react';
import {
  LayoutDashboard,
  PawPrint,
  Stethoscope,
  CalendarCheck,
  Menu,
} from 'lucide-react';
import { TabId } from './Sidebar';

interface MobileBottomNavProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  onToggleMenu: () => void;
  isMenuOpen: boolean;
  waitingPetsCount: number;
  unreadAlertsCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onToggleMenu,
  isMenuOpen,
  waitingPetsCount,
  unreadAlertsCount,
}) => {
  const navItems = [
    {
      id: 'dashboard' as TabId,
      label: 'میز کار',
      icon: LayoutDashboard,
    },
    {
      id: 'reception_pets' as TabId,
      label: 'پذیرش',
      icon: PawPrint,
      badge: waitingPetsCount > 0 ? waitingPetsCount : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'medical_records' as TabId,
      label: 'پرونده‌ها',
      icon: Stethoscope,
    },
    {
      id: 'appointments' as TabId,
      label: 'نوبت‌ها',
      icon: CalendarCheck,
    },
  ];

  return (
    <nav
      id="mobile-bottom-navigation"
      className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E6E9DF] px-1.5 py-1 flex items-center justify-around lg:hidden shadow-[0_-4px_24px_rgba(45,58,39,0.08)] pb-[calc(env(safe-area-inset-bottom,0px)+4px)]"
      dir="rtl"
      aria-label="پیمایش موبایل"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id && !isMenuOpen;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectTab(item.id)}
            className={`relative flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-2xl transition-all cursor-pointer select-none active:scale-95 ${
              isActive
                ? 'text-[#4A6741] font-black'
                : 'text-[#5C7457] hover:text-[#2D3A27] font-medium'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              {item.badge !== undefined && (
                <span className={`absolute -top-1 -right-2 px-1 min-w-[16px] h-4 text-[9px] font-black rounded-full flex items-center justify-center ${item.badgeColor || 'bg-[#4A6741] text-white'}`}>
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[56px] leading-tight">
              {item.label}
            </span>
            {isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#4A6741] mt-0.5" />
            )}
          </button>
        );
      })}

      {/* Menu / Drawer Toggle */}
      <button
        type="button"
        onClick={onToggleMenu}
        className={`relative flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-2xl transition-all cursor-pointer select-none active:scale-95 ${
          isMenuOpen
            ? 'text-[#4A6741] font-black'
            : 'text-[#5C7457] hover:text-[#2D3A27] font-medium'
        }`}
      >
        <div className="relative">
          <Menu className={`w-5 h-5 transition-transform ${isMenuOpen ? 'scale-110' : ''}`} />
          {unreadAlertsCount > 0 && (
            <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight leading-tight">
          همه بخش‌ها
        </span>
        {isMenuOpen && (
          <span className="w-1.5 h-1.5 rounded-full bg-[#4A6741] mt-0.5" />
        )}
      </button>
    </nav>
  );
};
