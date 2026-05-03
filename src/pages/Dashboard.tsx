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
          <p className="text-xs text-muted-foreground">ØªÙˆØ²ÙŠØ¹ Ø§Ù„Ù…Ø´ØªØ±ÙƒÙŠÙ†</p>
        </div>
        <span className="rounded-full bg-primary/8 px-3 py-1 text-sm font-bold text-primary">{value}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{percent.toFixed(0)}% Ù…Ù† Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ù…Ù†Ø®Ø±Ø·ÙŠÙ†</p>
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
              Ø¥Ø·Ù„Ø§Ù„Ø© Ø³Ø±ÙŠØ¹Ø© Ø¹Ù„Ù‰ Ø§Ù„Ø£Ø¯Ø§Ø¡
            </div>

            <div className="space-y-3">
              <h3 className="font-display text-3xl leading-tight text-primary sm:text-4xl">
                Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ø³Ø¨Ø­ Ø¨ÙˆØ§Ø¬Ù‡Ø© Ø£ÙˆØ¶Ø­ ÙˆØ£Ù†ÙŠÙ‚ØŒ Ù…ØµÙ…Ù…Ø© Ù„Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„ÙŠÙˆÙ…ÙŠØ©.
              </h3>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                Ù‡Ø°Ù‡ Ø§Ù„Ù„ÙˆØ­Ø© ØªØ¬Ù…Ø¹ Ø­Ø±ÙƒØ© Ø§Ù„Ø§Ø´ØªØ±Ø§ÙƒØ§ØªØŒ Ø§Ù„Ù…Ø¯Ø§Ø®ÙŠÙ„ØŒ Ø§Ù„ØªÙ†Ø¨ÙŠÙ‡Ø§ØªØŒ ÙˆØªÙˆØ²ÙŠØ¹ Ø§Ù„ÙØ¦Ø§Øª ÙÙŠ Ù…Ø´Ù‡Ø¯ ÙˆØ§Ø­Ø¯ Ù…Ø±ÙŠØ­ Ù„Ù„Ø¹ÙŠÙ†.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="surface-outline rounded-[1.5rem] p-4">
                <p className="text-xs text-muted-foreground">Ø§Ù„Ø­ØµØµ Ø§Ù„Ù†Ø´Ø·Ø©</p>
                <p className="mt-2 font-display text-2xl font-black text-primary">{sessions.length}</p>
              </div>
              <div className="surface-outline rounded-[1.5rem] p-4">
                <p className="text-xs text-muted-foreground">ØªØºØ·ÙŠØ© Ø§Ù„Ø­ØµØµ</p>
                <p className="mt-2 font-display text-2xl font-black text-primary">{sessionCoverage}%</p>
              </div>
              <div className="surface-outline rounded-[1.5rem] p-4">
                <p className="text-xs text-muted-foreground">Ø­Ø§Ù„Ø§Øª ØªØ­Øª Ø§Ù„Ù…Ø±Ø§Ù‚Ø¨Ø©</p>
                <p className="mt-2 font-display text-2xl font-black text-primary">{expired.length + expiringSoon.length}</p>
              </div>
            </div>
          </div>

          <div className="glass-card relative overflow-hidden p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ø®Ø§Ø±Ø·Ø© Ø§Ù„Ù†Ø´Ø§Ø·</p>
                <h4 className="font-display text-2xl text-primary">Ù†Ø¸Ø±Ø© Ù„Ø­Ø¸ÙŠØ©</h4>
              </div>
              <div className="rounded-2xl bg-primary/8 p-3 text-primary">
                <ArrowUpLeft className="h-5 w-5" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[1.5rem] border border-primary/10 bg-primary/5 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-primary">Ø§Ù„Ø£Ø¹Ø¶Ø§Ø¡ Ø§Ù„Ø£Ø­Ø±Ø§Ø±</span>
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/70">
                  <div className="hero-gradient h-full rounded-full" style={{ width: `${totalSubscribers ? (members.length / totalSubscribers) * 100 : 0}%` }} />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{members.length} Ù…Ù†Ø®Ø±Ø·</p>
              </div>

              <div className="rounded-[1.5rem] border border-secondary/10 bg-secondary/5 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-primary">Ø§Ù„Ø¬Ù…Ø¹ÙŠØ§Øª ÙˆØ§Ù„Ø£Ù†Ø¯ÙŠØ©</span>
                  <Building2 className="h-4 w-4 text-secondary" />
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/70">
                  <div className="water-gradient h-full rounded-full" style={{ width: `${totalSubscribers ? (associations.length / totalSubscribers) * 100 : 0}%` }} />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{associations.length} Ø¬Ù‡Ø© Ù…Ø³Ø¬Ù„Ø©</p>
              </div>

              <div className="rounded-[1.5rem] border border-amber-200/80 bg-amber-50/70 p-4">
                <p className="text-sm font-medium text-primary">Ø§Ù„Ø¯Ø®Ù„ Ø§Ù„Ù…Ø³Ø¬Ù„</p>
                <p className="mt-2 font-display text-3xl font-black text-primary">{revenue.toLocaleString()} Ø¯Ø¬</p>
                <p className="mt-2 text-xs text-muted-foreground">Ù…Ø­ØµÙ„Ø© Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø§Ø´ØªØ±Ø§ÙƒØ§Øª ÙˆØ§Ù„ØªØ¬Ø¯ÙŠØ¯Ø§Øª Ø§Ù„Ù…Ø®Ø²Ù†Ø©.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ù…Ù†Ø®Ø±Ø·ÙŠÙ†"
          value={totalSubscribers}
          sub={`${members.length} Ø­Ø± â€¢ ${associations.length} Ø¬Ù…Ø¹ÙŠØ©`}
          icon={Users}
          tone="hero-gradient"
        />
        <MetricCard
          title="Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ù…Ø¯Ø§Ø®ÙŠÙ„"
          value={`${revenue.toLocaleString()} Ø¯Ø¬`}
          sub="Ù…Ø¬Ù…ÙˆØ¹ Ø§Ù„Ø§Ø´ØªØ±Ø§ÙƒØ§Øª Ø§Ù„Ù…Ø³Ø¬Ù„Ø©"
          icon={DollarSign}
          tone="gold-gradient"
        />
        <MetricCard
          title="Ø¥Ø´ØªØ±Ø§ÙƒØ§Øª Ù‚Ø±ÙŠØ¨Ø© Ø§Ù„Ø§Ù†ØªÙ‡Ø§Ø¡"
          value={expiringSoon.length}
          sub="Ø®Ù„Ø§Ù„ 7 Ø£ÙŠØ§Ù…"
          icon={AlertTriangle}
          tone="water-gradient"
        />
        <MetricCard
          title="Ø¥Ø´ØªØ±Ø§ÙƒØ§Øª Ù…Ù†ØªÙ‡ÙŠØ©"
          value={expired.length}
          sub="Ø¨Ø­Ø§Ø¬Ø© Ø¥Ù„Ù‰ ØªØ¬Ø¯ÙŠØ¯"
          icon={Calendar}
          tone="hero-gradient"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="glass-card p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">ØªÙˆØ²ÙŠØ¹ Ø§Ù„ÙØ¦Ø§Øª</p>
              <h3 className="font-display text-2xl text-primary">ØªÙˆØ§Ø²Ù† Ø§Ù„Ù…Ø´ØªØ±ÙƒÙŠÙ†</h3>
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
              <p className="text-sm text-muted-foreground">Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„Ù…Ø¨Ø§Ø´Ø±Ø©</p>
              <h3 className="font-display text-2xl text-primary">Ø¢Ø®Ø± Ø§Ù„Ù…Ù†Ø®Ø±Ø·ÙŠÙ†</h3>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary">
              <Waves className="h-4 w-4" />
              {sessions.length} Ø­ØµØ© Ù…Ø¨Ø±Ù…Ø¬Ø©
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="border-b border-border/70 text-sm text-muted-foreground">
                <tr>
                  <th className="py-3 font-medium">Ø±Ù‚Ù… Ø§Ù„Ø¨Ø·Ø§Ù‚Ø©</th>
                  <th className="py-3 font-medium">Ø§Ù„Ø§Ø³Ù… ÙˆØ§Ù„Ù„Ù‚Ø¨</th>
                  <th className="py-3 font-medium">Ø§Ù„ÙØ¦Ø©</th>
                  <th className="py-3 font-medium">Ø§Ù„Ù…Ø¨Ù„Øº</th>
                  <th className="py-3 font-medium">Ø§Ù„Ø­Ø§Ù„Ø©</th>
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
                      <td className="py-3 font-bold text-primary">{member.amount} Ø¯Ø¬</td>
                      <td className="py-3">
                        <span className={`rounded-full px-2 py-1 text-xs ${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>
                      </td>
                    </tr>
                  );
                })}

                {members.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-muted-foreground">
                      Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¨ÙŠØ§Ù†Ø§Øª Ø¨Ø¹Ø¯. Ø§Ø¨Ø¯Ø£ Ø¨Ø¥Ø¶Ø§ÙØ© Ù…Ù†Ø®Ø±Ø·ÙŠÙ†.
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
              <p className="text-sm text-muted-foreground">ØªÙ†Ø¨ÙŠÙ‡Ø§Øª Ù…Ø±ØªØ¨Ø·Ø© Ø¨Ø§Ù„Ø§Ø´ØªØ±Ø§ÙƒØ§Øª</p>
              <h3 className="font-display text-2xl text-primary">Ù…Ù„ÙØ§Øª ØªØ­ØªØ§Ø¬ Ø¥Ù„Ù‰ Ù…ØªØ§Ø¨Ø¹Ø©</h3>
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
                      {entry.card} â€¢ ÙŠÙ†ØªÙ‡ÙŠ {entry.end || 'â€”'}
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
