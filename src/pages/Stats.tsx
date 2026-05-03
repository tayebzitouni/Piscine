import { useLiveQuery } from 'dexie-react-hooks';
import { db, CATEGORY_LABEL, ASSOC_LABEL } from '@/lib/db';
import { TrendingUp, Users, Building2, Wallet } from 'lucide-react';

function Bar({ label, value, max, color = 'water-gradient' }: any) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium">{label}</span>
        <span className="font-bold text-primary">{value.toLocaleString()}</span>
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function Stats() {
  const members = useLiveQuery(() => db.members.toArray(), []) ?? [];
  const associations = useLiveQuery(() => db.associations.toArray(), []) ?? [];
  const payments = useLiveQuery(() => db.payments.toArray(), []) ?? [];

  // Revenue by category (members)
  const byCategory = (['men','women','children'] as const).map(c => ({
    label: CATEGORY_LABEL[c],
    count: members.filter(m => m.category === c).length,
    revenue: members.filter(m => m.category === c).reduce((s, m) => s + m.amount, 0),
  }));
  const maxCatRev = Math.max(1, ...byCategory.map(c => c.revenue));

  // Revenue by association type
  const byAssocType = (Object.keys(ASSOC_LABEL) as (keyof typeof ASSOC_LABEL)[]).map(t => ({
    label: ASSOC_LABEL[t],
    count: associations.filter(a => a.type === t).length,
    revenue: associations.filter(a => a.type === t).reduce((s, a) => s + a.amount, 0),
  }));
  const maxAssocRev = Math.max(1, ...byAssocType.map(c => c.revenue));

  // Top clubs by revenue
  const clubMap = new Map<string, { count: number; revenue: number }>();
  associations.forEach(a => {
    const e = clubMap.get(a.associationName) ?? { count: 0, revenue: 0 };
    e.count += 1; e.revenue += a.amount;
    clubMap.set(a.associationName, e);
  });
  const topClubs = [...clubMap.entries()].sort((a,b) => b[1].revenue - a[1].revenue).slice(0, 8);
  const maxClubRev = Math.max(1, ...topClubs.map(c => c[1].revenue));

  // Monthly revenue (last 12 months)
  const months: { key: string; label: string; revenue: number; count: number }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    months.push({ key, label: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }), revenue: 0, count: 0 });
  }
  payments.forEach(p => {
    const d = new Date(p.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const m = months.find(x => x.key === key);
    if (m) { m.revenue += p.amount; m.count += 1; }
  });
  const maxMonthRev = Math.max(1, ...months.map(m => m.revenue));

  const totalRevenue = payments.reduce((s, p) => s + p.amount, 0);
  const memberRevenue = members.reduce((s, m) => s + m.amount, 0);
  const assocRevenue = associations.reduce((s, a) => s + a.amount, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-5"><div className="flex items-center gap-3"><Wallet className="h-8 w-8 text-primary" /><div><p className="text-xs text-muted-foreground">إجمالي المداخيل</p><p className="font-display text-xl font-extrabold text-primary">{totalRevenue.toLocaleString()} دج</p></div></div></div>
        <div className="glass-card p-5"><div className="flex items-center gap-3"><Users className="h-8 w-8 text-secondary" /><div><p className="text-xs text-muted-foreground">من المنخرطين الأحرار</p><p className="font-display text-xl font-extrabold text-primary">{memberRevenue.toLocaleString()} دج</p></div></div></div>
        <div className="glass-card p-5"><div className="flex items-center gap-3"><Building2 className="h-8 w-8 text-accent" /><div><p className="text-xs text-muted-foreground">من الجمعيات</p><p className="font-display text-xl font-extrabold text-primary">{assocRevenue.toLocaleString()} دج</p></div></div></div>
        <div className="glass-card p-5"><div className="flex items-center gap-3"><TrendingUp className="h-8 w-8 text-primary" /><div><p className="text-xs text-muted-foreground">عمليات الدفع</p><p className="font-display text-xl font-extrabold text-primary">{payments.length}</p></div></div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="font-display text-xl text-primary mb-4">المداخيل حسب فئة المنخرطين</h3>
          <div className="space-y-4">
            {byCategory.map(c => (
              <div key={c.label}>
                <Bar label={`${c.label} (${c.count} منخرط)`} value={c.revenue} max={maxCatRev} color="water-gradient" />
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-display text-xl text-primary mb-4">المداخيل حسب نوع الجمعية</h3>
          <div className="space-y-4">
            {byAssocType.map(c => (
              <div key={c.label}>
                <Bar label={`${c.label} (${c.count})`} value={c.revenue} max={maxAssocRev} color="gold-gradient" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="font-display text-xl text-primary mb-4">أفضل النوادي / الجمعيات حسب المداخيل</h3>
        {topClubs.length === 0 ? (
          <p className="text-center text-muted-foreground p-8">لا توجد جمعيات مسجّلة بعد</p>
        ) : (
          <div className="space-y-3">
            {topClubs.map(([name, v]) => (
              <Bar key={name} label={`${name} (${v.count} منخرط)`} value={v.revenue} max={maxClubRev} color="hero-gradient" />
            ))}
          </div>
        )}
      </div>

      <div className="glass-card p-6">
        <h3 className="font-display text-xl text-primary mb-4">المداخيل الشهرية (آخر 12 شهراً)</h3>
        <div className="flex items-end justify-between gap-1 h-48 border-b border-border pb-2">
          {months.map(m => (
            <div key={m.key} className="flex-1 flex flex-col items-center gap-1 group">
              <div className="text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition">{m.revenue.toLocaleString()}</div>
              <div className="w-full hero-gradient rounded-t-lg hover:opacity-80 transition" style={{ height: `${(m.revenue / maxMonthRev) * 100}%`, minHeight: m.revenue > 0 ? '4px' : '0' }} title={`${m.label}: ${m.revenue.toLocaleString()} دج (${m.count} عملية)`} />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
          {months.map(m => <div key={m.key} className="flex-1 text-center">{m.label}</div>)}
        </div>
      </div>
    </div>
  );
}
