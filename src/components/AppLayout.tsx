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
} from 'lucide-react';
import logo from '@/assets/logo.png';

const nav = [
  { to: '/', label: 'Ù„ÙˆØ­Ø© Ø§Ù„Ø¥Ø­ØµØ§Ø¦ÙŠØ§Øª', icon: BarChart3, end: true },
  { to: '/members', label: 'Ø§Ù„Ù…Ù†Ø®Ø±Ø·ÙŠÙ†', icon: Users },
  { to: '/associations', label: 'Ø§Ù„Ø¬Ù…Ø¹ÙŠØ§Øª', icon: Building2 },
  { to: '/payments', label: 'Ø³Ø¬Ù„ Ø§Ù„Ù…Ø¯ÙÙˆØ¹Ø§Øª', icon: Receipt },
  { to: '/stats', label: 'Ø§Ù„Ø¥Ø­ØµØ§Ø¦ÙŠØ§Øª ÙˆØ§Ù„ØªÙ‚Ø§Ø±ÙŠØ±', icon: PieChart },
  { to: '/cards', label: 'Ø¨Ø·Ø§Ù‚Ø§Øª Ø§Ù„Ø¥Ù†Ø®Ø±Ø§Ø·', icon: IdCard },
  { to: '/tariffs', label: 'Ø§Ù„ØªØ³Ø¹ÙŠØ±Ø©', icon: Tag },
  { to: '/schedule', label: 'Ø¨Ø±Ù†Ø§Ù…Ø¬ Ø§Ù„ÙˆØ­Ø¯Ø©', icon: Calendar },
  { to: '/settings', label: 'Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª', icon: Settings },
];

export default function AppLayout() {
  const location = useLocation();
  const current = nav.find((item) => item.to === location.pathname);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="floating-orb absolute right-[-7rem] top-[-6rem] h-64 w-64 rounded-full bg-cyan-300/30" />
        <div className="floating-orb absolute left-[8%] top-[24%] h-40 w-40 rounded-full bg-amber-200/35 [animation-delay:1.2s]" />
        <div className="floating-orb absolute bottom-[-5rem] right-[18%] h-52 w-52 rounded-full bg-sky-300/20 [animation-delay:2.4s]" />
      </div>

      <div className="relative flex min-h-screen w-full flex-col lg:flex-row">
        <aside className="no-print mesh-panel hero-gradient text-sidebar-foreground lg:sticky lg:top-0 lg:h-screen lg:w-80 lg:shrink-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(0_0%_100%_/_0.18),transparent_42%)]" />

          <div className="relative flex h-full flex-col">
            <div className="border-b border-white/10 px-5 py-5 sm:px-6">
              <div className="flex items-center gap-4">
                <img
                  src={logo}
                  alt="Ø´Ø¹Ø§Ø± Ø§Ù„Ù…Ø³Ø¨Ø­"
                  className="h-16 w-16 rounded-[1.5rem] bg-white/12 p-2 shadow-lg ring-1 ring-white/20"
                />
                <div>
                  <h1 className="font-display text-xl leading-tight text-white">Ø§Ù„Ù…Ø³Ø¨Ø­ Ø§Ù„Ø£ÙˆÙ„Ù…Ø¨ÙŠ</h1>
                  <p className="mt-1 text-xs text-white/70">08 Ù…Ø§ÙŠ 1945 - Ø³Ø·ÙŠÙ</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-right">
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-[11px] text-white/65">Ø§Ù„ÙˆØ¶Ø¹</p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-bold text-white">
                    <Sparkles className="h-4 w-4 text-cyan-200" />
                    ØªØ´ØºÙŠÙ„ Ø°ÙƒÙŠ
                  </p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-[11px] text-white/65">Ø§Ù„Ù…ÙˆØ³Ù…</p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-bold text-white">
                    <ShieldCheck className="h-4 w-4 text-amber-200" />
                    2025 / 2026
                  </p>
                </div>
              </div>
            </div>

            <nav className="flex gap-2 overflow-x-auto px-4 py-4 lg:flex-1 lg:flex-col lg:overflow-visible lg:px-4">
              {nav.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `group flex min-w-max items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all lg:min-w-0 ${
                      isActive
                        ? 'bg-white text-primary shadow-glow'
                        : 'text-white/78 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 transition group-hover:bg-white/15">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="whitespace-nowrap">{label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="border-t border-white/10 px-5 py-4 text-center text-xs text-white/62 sm:px-6">
              <Waves className="ml-1 inline-block h-4 w-4 animate-wave" />
              Ø§Ù„Ù…ÙˆØ³Ù… Ø§Ù„Ø±ÙŠØ§Ø¶ÙŠ 2025 / 2026
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-auto">
          <header className="no-print sticky top-0 z-10 px-4 py-4 sm:px-6 lg:px-8">
            <div className="section-shell flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1 text-[11px] font-bold text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  ÙˆØ§Ø¬Ù‡Ø© Ø¥Ø¯Ø§Ø±ÙŠØ© Ù…Ø­Ø¯Ù‘Ø«Ø©
                </p>
                <h2 className="font-display text-2xl text-primary sm:text-3xl">
                  {current?.label ?? 'Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…'}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ø¯ÙŠÙˆØ§Ù† Ø§Ù„Ù…Ø±ÙƒØ¨ Ø§Ù„Ù…ØªØ¹Ø¯Ø¯ Ø§Ù„Ø±ÙŠØ§Ø¶Ø§Øª Ù„ÙˆÙ„Ø§ÙŠØ© Ø³Ø·ÙŠÙ
                </p>
              </div>

              <div className="surface-outline rounded-[1.5rem] px-4 py-3 text-left text-xs text-muted-foreground">
                <p className="font-semibold text-primary">ÙˆØ²Ø§Ø±Ø© Ø§Ù„Ø±ÙŠØ§Ø¶Ø©</p>
                <p className="mt-1">Ø§Ù„Ø¬Ù…Ù‡ÙˆØ±ÙŠØ© Ø§Ù„Ø¬Ø²Ø§Ø¦Ø±ÙŠØ© Ø§Ù„Ø¯ÙŠÙ…Ù‚Ø±Ø§Ø·ÙŠØ© Ø§Ù„Ø´Ø¹Ø¨ÙŠØ©</p>
              </div>
            </div>
          </header>

          <div className="px-4 pb-6 sm:px-6 lg:px-8 lg:pb-8">
            <div className="rise-in">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
