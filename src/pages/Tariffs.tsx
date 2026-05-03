import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, DEFAULT_TARIFFS, DEFAULT_ASSOC_TARIFFS, CATEGORY_LABEL, DURATION_LABEL, ASSOC_LABEL, type Category, type Duration } from '@/lib/db';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export default function Tariffs() {
  const tariffs = useLiveQuery(() => db.tariffs.toArray(), []) ?? [];
  const [draft, setDraft] = useState<Record<string, number>>({});

  useEffect(() => {
    const d: Record<string, number> = {};
    tariffs.forEach(t => { d[`${t.scope}:${t.key}`] = t.amount; });
    setDraft(d);
  }, [tariffs.length]);

  const getMember = (cat: Category, dur: Duration) =>
    draft[`member:${cat}_${dur}`] ?? DEFAULT_TARIFFS[cat][dur];

  const getAssoc = (k: keyof typeof DEFAULT_ASSOC_TARIFFS) =>
    draft[`association:${k}`] ?? DEFAULT_ASSOC_TARIFFS[k];

  const setVal = (id: string, v: number) => setDraft(p => ({ ...p, [id]: v }));

  const upsert = async (scope: 'member' | 'association', key: string, label: string, amount: number) => {
    const existing = await db.tariffs.where('[scope+key]').equals([scope, key]).first();
    if (existing) await db.tariffs.update(existing.id!, { amount, label });
    else await db.tariffs.add({ scope, key, label, amount });
  };

  const saveAll = async () => {
    for (const cat of ['men','women','children'] as Category[]) {
      for (const dur of ['1m','2m','3m','6m','season'] as Duration[]) {
        await upsert('member', `${cat}_${dur}`, `${CATEGORY_LABEL[cat]} - ${DURATION_LABEL[dur]}`, getMember(cat, dur));
      }
    }
    for (const k of Object.keys(DEFAULT_ASSOC_TARIFFS) as (keyof typeof DEFAULT_ASSOC_TARIFFS)[]) {
      await upsert('association', k, ASSOC_LABEL[k], getAssoc(k));
    }
    toast.success('تم حفظ التسعيرة');
  };

  const resetDefaults = async () => {
    if (!confirm('استعادة التسعيرة الافتراضية؟')) return;
    await db.tariffs.clear();
    for (const cat of ['men','women','children'] as Category[])
      for (const dur of ['1m','2m','3m','6m','season'] as Duration[])
        await upsert('member', `${cat}_${dur}`, `${CATEGORY_LABEL[cat]} - ${DURATION_LABEL[dur]}`, DEFAULT_TARIFFS[cat][dur]);
    for (const k of Object.keys(DEFAULT_ASSOC_TARIFFS) as (keyof typeof DEFAULT_ASSOC_TARIFFS)[])
      await upsert('association', k, ASSOC_LABEL[k], DEFAULT_ASSOC_TARIFFS[k]);
    toast.success('تم إستعادة الإفتراضي');
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">يمكنك تعديل مبلغ كل تسعيرة. يتم تطبيق الأسعار الجديدة عند تسجيل منخرط جديد.</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetDefaults}><RotateCcw className="h-4 w-4 ml-2" /> الإفتراضي</Button>
          <Button onClick={saveAll} className="hero-gradient text-white"><Save className="h-4 w-4 ml-2" /> حفظ التعديلات</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {(['men','women','children'] as const).map(cat => (
          <div key={cat} className="glass-card p-6 relative overflow-hidden">
            <div className="absolute -top-10 -left-10 h-32 w-32 rounded-full water-gradient opacity-15" />
            <h3 className="font-display text-2xl text-primary mb-1 relative">{CATEGORY_LABEL[cat]}</h3>
            <p className="text-xs text-muted-foreground mb-4">المنخرطين الأحرار</p>
            <ul className="space-y-3 relative">
              {(['1m','2m','3m','6m','season'] as const).map(d => (
                <li key={d} className="flex items-center justify-between gap-3 border-b border-dashed border-border pb-2">
                  <span className="text-sm flex-1">{DURATION_LABEL[d]}</span>
                  <Input type="number" className="w-32 text-left font-display font-bold text-primary"
                    value={getMember(cat, d)}
                    onChange={e => setVal(`member:${cat}_${d}`, Number(e.target.value))} />
                  <span className="text-xs text-muted-foreground">دج</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="glass-card p-6">
        <h3 className="font-display text-2xl text-primary mb-4">الجمعيات والشركات</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Object.keys(DEFAULT_ASSOC_TARIFFS) as (keyof typeof DEFAULT_ASSOC_TARIFFS)[]).map(k => (
            <div key={k} className="p-5 rounded-xl bg-muted/40 border border-border">
              <p className="text-sm text-muted-foreground mb-2">{ASSOC_LABEL[k]}</p>
              <div className="flex items-center gap-3">
                <Input type="number" className="text-2xl font-display font-extrabold text-primary h-14"
                  value={getAssoc(k)}
                  onChange={e => setVal(`association:${k}`, Number(e.target.value))} />
                <span className="text-sm text-muted-foreground">دج</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">للموسم / للرواق الواحد</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
