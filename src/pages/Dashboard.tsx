import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import {
  Users,
  DollarSign,
  AlertTriangle,
  Calendar,
  Waves,
  ArrowUpLeft,
  Building2,
  Sparkles,
} from 'lucide-react';
import { db, CATEGORY_LABEL } from '@/lib/db';
import { subscriptionStatus, STATUS_CLASS, STATUS_LABEL } from '@/lib/status';

function MetricCard({
  title,
  value,
  sub,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string | number;
  sub: string;
  icon: typeof Users;
  tone: string;
}) {
  return (
    <div className="glass-card mesh-panel relative overflow-hidden p-6">
      <div className={`absolute left-0 top-0 h-full w-1.5 ${tone}`} />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-3 font-display text-3xl font-black text-primary">{value}</p>
          <p className="mt-2 text-xs text-muted-foreground">{sub}</p>
        </div>
        <div className={`flex h-14 w-14 items-center justify-center rounded-[1.25rem] text-white shadow-glow ${tone}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function CategoryBand({
  label,
  value,
  percent,
  tone,
}: {
  label: string;
  value: number;
  percent: number;
  tone: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/60 bg-white/50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="font-display text-lg text-primary">{label}</p>
          <p className="text-xs text-muted-foreground">توزيع المشتركين</p>
        </div>
        <span className="rounded-full bg-primary/8 px-3 py-1 text-sm font-bold text-primary">{value}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{percent.toFixed(0)}% من إجمالي المنخرطين</p>
    </div>
  );
}

export default function Dashboard() {
  const members = useLiveQuery(() => db.members.toArray(), []) ?? [];
  const associations = useLiveQuery(() => db.associations.toArray(), []) ?? [];
  const sessions = useLiveQuery(() => db.sessions.toArray(), []) ?? [];

  const totalSubscribers = members.length + associations.length;
  const revenue = [...members, ...associations].reduce((sum, item) => sum + (item.amount || 0), 0);

  const activity = [
    ...members.map((member) => ({
      kind: 'member' as const,
      end: member.endDate,
      amount: member.amount,
      name: `${member.firstName} ${member.lastName}`,
      card: member.cardNumber,
    })),
    ...associations.map((association) => ({
      kind: 'association' as const,
      end: association.endDate,
      amount: association.amount,
      name: `${association.firstName} ${association.lastName}`,
      card: association.cardNumber,
    })),
  ];

  const expiringSoon = activity.filter((entry) => subscriptionStatus(entry.end) === 'expiring');
  const expired = activity.filter((entry) => subscriptionStatus(entry.end) === 'expired');

  const categoryStats = (['men', 'women', 'children'] as const).map((category, index) => {
    const value = members.filter((member) => member.category === category).length;
    const tone = index === 0 ? 'hero-gradient' : index === 1 ? 'water-gradient' : 'gold-gradient';

    return {
      category,
      value,
      tone,
      percent: members.length ? (value / members.length) * 100 : 0,
    };
  });

  const sessionCoverage = sessions.length
    ? Math.round(((members.filter((member) => member.sessionId).length + associations.filter((item) => item.sessionId).length) / Math.max(totalSubscribers, 1)) * 100)
    : 0;

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="section-shell mesh-panel relative overflow-hidden px-6 py-7 sm:px-8 sm:py-8">
        <div className="absolute left-0 top-0 h-full w-full bg-[radial-gradient(circle_at_top_left,hsl(191_86%_48%_/_0.18),transparent_30%),radial-gradient(circle_at_bottom_right,hsl(32_89%_58%_/_0.14),transparent_28%)]" />
        <div className="relative grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1 text-[11px] font-bold text-primary shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              إطلالة سريعة على الأداء
            </div>

            <div className="space-y-3">
              <h3 className="font-display text-3xl leading-tight text-primary sm:text-4xl">
                إدارة المسبح بواجهة أوضح وأنيق، مصممة للمتابعة اليومية.
              </h3>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                هذه اللوحة تجمع حركة الاشتراكات، المداخيل، التنبيهات، وتوزيع الفئات في مشهد واحد مريح للعين.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="surface-outline rounded-[1.5rem] p-4">
                <p className="text-xs text-muted-foreground">الحصص النشطة</p>
                <p className="mt-2 font-display text-2xl font-black text-primary">{sessions.length}</p>
              </div>
              <div className="surface-outline rounded-[1.5rem] p-4">
                <p className="text-xs text-muted-foreground">تغطية الحصص</p>
                <p className="mt-2 font-display text-2xl font-black text-primary">{sessionCoverage}%</p>
              </div>
              <div className="surface-outline rounded-[1.5rem] p-4">
                <p className="text-xs text-muted-foreground">حالات تحت المراقبة</p>
                <p className="mt-2 font-display text-2xl font-black text-primary">{expired.length + expiringSoon.length}</p>
              </div>
            </div>
          </div>

          <div className="glass-card relative overflow-hidden p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">خارطة النشاط</p>
                <h4 className="font-display text-2xl text-primary">نظرة لحظية</h4>
              </div>
              <div className="rounded-2xl bg-primary/8 p-3 text-primary">
                <ArrowUpLeft className="h-5 w-5" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[1.5rem] border border-primary/10 bg-primary/5 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-primary">الأعضاء الأحرار</span>
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/70">
                  <div className="hero-gradient h-full rounded-full" style={{ width: `${totalSubscribers ? (members.length / totalSubscribers) * 100 : 0}%` }} />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{members.length} منخرط</p>
              </div>

              <div className="rounded-[1.5rem] border border-secondary/10 bg-secondary/5 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-primary">الجمعيات والأندية</span>
                  <Building2 className="h-4 w-4 text-secondary" />
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/70">
                  <div className="water-gradient h-full rounded-full" style={{ width: `${totalSubscribers ? (associations.length / totalSubscribers) * 100 : 0}%` }} />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{associations.length} جهة مسجلة</p>
              </div>

              <div className="rounded-[1.5rem] border border-amber-200/80 bg-amber-50/70 p-4">
                <p className="text-sm font-medium text-primary">الدخل المسجل</p>
                <p className="mt-2 font-display text-3xl font-black text-primary">{revenue.toLocaleString()} دج</p>
                <p className="mt-2 text-xs text-muted-foreground">محصلة جميع الاشتراكات والتجديدات المخزنة.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="إجمالي المنخرطين"
          value={totalSubscribers}
          sub={`${members.length} حر • ${associations.length} جمعية`}
          icon={Users}
          tone="hero-gradient"
        />
        <MetricCard
          title="إجمالي المداخيل"
          value={`${revenue.toLocaleString()} دج`}
          sub="مجموع الاشتراكات المسجلة"
          icon={DollarSign}
          tone="gold-gradient"
        />
        <MetricCard
          title="إشتراكات قريبة الانتهاء"
          value={expiringSoon.length}
          sub="خلال 7 أيام"
          icon={AlertTriangle}
          tone="water-gradient"
        />
        <MetricCard
          title="إشتراكات منتهية"
          value={expired.length}
          sub="بحاجة إلى تجديد"
          icon={Calendar}
          tone="hero-gradient"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="glass-card p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">توزيع الفئات</p>
              <h3 className="font-display text-2xl text-primary">توازن المشتركين</h3>
            </div>
            <div className="rounded-2xl bg-primary/8 p-3 text-primary">
              <Users className="h-5 w-5" />
            </div>
          </div>

          <div className="space-y-4">
            {categoryStats.map(({ category, value, percent, tone }) => (
              <CategoryBand
                key={category}
                label={CATEGORY_LABEL[category]}
                value={value}
                percent={percent}
                tone={tone}
              />
            ))}
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">المتابعة المباشرة</p>
              <h3 className="font-display text-2xl text-primary">آخر المنخرطين</h3>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary">
              <Waves className="h-4 w-4" />
              {sessions.length} حصة مبرمجة
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="border-b border-border/70 text-sm text-muted-foreground">
                <tr>
                  <th className="py-3 font-medium">رقم البطاقة</th>
                  <th className="py-3 font-medium">الاسم واللقب</th>
                  <th className="py-3 font-medium">الفئة</th>
                  <th className="py-3 font-medium">المبلغ</th>
                  <th className="py-3 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {members.slice(-6).reverse().map((member) => {
                  const status = subscriptionStatus(member.endDate);

                  return (
                    <tr key={member.id} className="border-b border-border/40 transition hover:bg-white/45">
                      <td className="py-3 font-mono text-secondary">{member.cardNumber}</td>
                      <td className="py-3 font-medium">{member.firstName} {member.lastName}</td>
                      <td className="py-3">{CATEGORY_LABEL[member.category]}</td>
                      <td className="py-3 font-bold text-primary">{member.amount} دج</td>
                      <td className="py-3">
                        <span className={`rounded-full px-2 py-1 text-xs ${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>
                      </td>
                    </tr>
                  );
                })}

                {members.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-muted-foreground">
                      لا توجد بيانات بعد. ابدأ بإضافة منخرطين.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {(expiringSoon.length > 0 || expired.length > 0) && (
        <section className="glass-card p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">تنبيهات مرتبطة بالاشتراكات</p>
              <h3 className="font-display text-2xl text-primary">ملفات تحتاج إلى متابعة</h3>
            </div>
            <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {[...expired, ...expiringSoon].slice(0, 8).map((entry, index) => {
              const status = subscriptionStatus(entry.end);

              return (
                <Link
                  key={`${entry.card}-${index}`}
                  to={entry.kind === 'member' ? '/members' : '/associations'}
                  className="surface-outline flex items-center justify-between rounded-[1.5rem] px-4 py-4 transition hover:-translate-y-0.5 hover:bg-white/80"
                >
                  <div>
                    <p className="font-medium text-primary">{entry.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {entry.card} • ينتهي {entry.end || '—'}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs ${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
