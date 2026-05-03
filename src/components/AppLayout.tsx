import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Users,
  Building2,
  Tag,
  Calendar,
  Settings,
  IdCard,
  Waves,
  Receipt,
  PieChart,
  Sparkles,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import logo from '@/assets/logo.png';
import { useAuth } from '@/lib/auth';

const nav = [
  { to: '/', label: 'لوحة الإحصائيات', icon: BarChart3, end: true },
  { to: '/members', label: 'المنخرطين', icon: Users },
  { to: '/associations', label: 'الجمعيات', icon: Building2 },
  { to: '/payments', label: 'سجل المدفوعات', icon: Receipt },
  { to: '/stats', label: 'الإحصائيات والتقارير', icon: PieChart },
  { to: '/cards', label: 'بطاقات الإنخراط', icon: IdCard },
  { to: '/tariffs', label: 'التسعيرة', icon: Tag },
  { to: '/schedule', label: 'برنامج الوحدة', icon: Calendar },
  { to: '/settings', label: 'الإعدادات', icon: Settings },
];

export default function AppLayout() {
  const location = useLocation();
  const { logout } = useAuth();
  const current = nav.find((item) => item.to === location.pathname);

  return (
    <div className="relative h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="floating-orb absolute right-[-7rem] top-[-6rem] h-64 w-64 rounded-full bg-cyan-300/30" />
        <div className="floating-orb absolute left-[8%] top-[24%] h-40 w-40 rounded-full bg-amber-200/35 [animation-delay:1.2s]" />
        <div className="floating-orb absolute bottom-[-5rem] right-[18%] h-52 w-52 rounded-full bg-sky-300/20 [animation-delay:2.4s]" />
      </div>

      <div className="relative flex h-full w-full flex-col lg:flex-row">
        <aside className="no-print hero-gradient text-sidebar-foreground lg:h-full lg:w-80 lg:shrink-0 lg:overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(0_0%_100%_/_0.18),transparent_42%)]" />

          <div className="relative flex min-h-full flex-col">
            <div className="hidden shrink-0 border-b border-white/10 px-5 py-4 sm:px-6 lg:block">
              <div className="flex items-center gap-4">
                <img
                  src={logo}
                  alt="شعار المسبح"
                  className="h-16 w-16 rounded-[1.5rem] bg-white/12 p-2 shadow-lg ring-1 ring-white/20"
                />
                <div>
                  <h1 className="font-display text-xl leading-tight text-white">المسبح الأولمبي</h1>
                  <p className="mt-1 text-xs text-white/70">08 ماي 1945 - سطيف</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-right">
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-[11px] text-white/65">الوضع</p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-bold text-white">
                    <Sparkles className="h-4 w-4 text-cyan-200" />
                    تشغيل ذكي
                  </p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-[11px] text-white/65">الموسم</p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-bold text-white">
                    <ShieldCheck className="h-4 w-4 text-amber-200" />
                    2025 / 2026
                  </p>
                </div>
              </div>
            </div>

            <nav className="flex gap-2 overflow-x-auto px-3 py-2 lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden lg:px-4 lg:py-3">
              {nav.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `group flex min-w-max items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all lg:min-w-0 lg:gap-3 lg:rounded-2xl lg:px-4 lg:py-3 ${
                      isActive
                        ? 'bg-white text-primary shadow-glow'
                        : 'text-white/78 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 transition group-hover:bg-white/15 lg:h-10 lg:w-10 lg:rounded-xl">
                    <Icon className="h-4 w-4 lg:h-5 lg:w-5" />
                  </span>
                  <span className="whitespace-nowrap">{label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="hidden shrink-0 border-t border-white/10 px-5 py-3 text-center text-xs text-white/62 sm:px-6 lg:block">
              <button
                type="button"
                onClick={logout}
                className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/15"
              >
                <LogOut className="h-4 w-4" />
                تسجيل الخروج
              </button>
              <Waves className="ml-1 inline-block h-4 w-4 animate-wave" />
              الموسم الرياضي 2025 / 2026
            </div>
          </div>
        </aside>

        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
          <header className="no-print sticky top-0 z-10 px-3 py-3 sm:px-6 lg:px-8 lg:py-4">
            <div className="section-shell flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1 text-[11px] font-bold text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  واجهة إدارية محدّثة
                </p>
                <h2 className="font-display text-2xl text-primary sm:text-3xl">
                  {current?.label ?? 'لوحة التحكم'}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  ديوان المركب المتعدد الرياضات لولاية سطيف
                </p>
              </div>

              <div className="surface-outline rounded-[1.5rem] px-4 py-3 text-left text-xs text-muted-foreground">
                <p className="font-semibold text-primary">وزارة الرياضة</p>
                <p className="mt-1">الجمهورية الجزائرية الديمقراطية الشعبية</p>
              </div>
            </div>
          </header>

          <div className="px-3 pb-6 sm:px-6 lg:px-8 lg:pb-8">
            <div className="rise-in">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
