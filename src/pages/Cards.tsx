import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Member, type Association, CATEGORY_LABEL, DURATION_LABEL } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Printer, IdCard, Receipt } from 'lucide-react';
import logo from '@/assets/logo.png';

export default function Cards() {
  const [params] = useSearchParams();
  const idStr = params.get('id');
  const type = (params.get('type') ?? 'member') as 'member' | 'association';
  const id = idStr ? Number(idStr) : undefined;

  const member = useLiveQuery(async () => id && type==='member' ? db.members.get(id) : null, [id, type]);
  const association = useLiveQuery(async () => id && type==='association' ? db.associations.get(id) : null, [id, type]);

  const allMembers = useLiveQuery(() => db.members.toArray(), []) ?? [];
  const allAssoc = useLiveQuery(() => db.associations.toArray(), []) ?? [];

  const [selected, setSelected] = useState<{type:'member'|'association'; data: Member | Association} | null>(null);
  const [view, setView] = useState<'card' | 'receipt'>('card');

  useEffect(() => {
    if (member) setSelected({ type: 'member', data: member });
    else if (association) setSelected({ type: 'association', data: association });
  }, [member, association]);

  const data = selected?.data;
  const isAssoc = selected?.type === 'association';
  const memberData = !isAssoc ? (data as Member | undefined) : undefined;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-4 no-print">
        <div className="glass-card p-4">
          <h3 className="font-display text-lg text-primary mb-3">المنخرطين</h3>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {allMembers.map(m => (
              <button key={m.id} onClick={()=>setSelected({type:'member', data:m})}
                      className={`w-full text-right p-3 rounded-lg transition ${selected?.data === m ? 'hero-gradient text-white' : 'hover:bg-muted'}`}>
                <p className="font-medium">{m.firstName} {m.lastName}</p>
                <p className="text-xs opacity-80">{m.cardNumber}</p>
              </button>
            ))}
          </div>
        </div>
        <div className="glass-card p-4">
          <h3 className="font-display text-lg text-primary mb-3">الجمعيات</h3>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {allAssoc.map(a => (
              <button key={a.id} onClick={()=>setSelected({type:'association', data:a})}
                      className={`w-full text-right p-3 rounded-lg transition ${selected?.data === a ? 'hero-gradient text-white' : 'hover:bg-muted'}`}>
                <p className="font-medium">{a.firstName} {a.lastName}</p>
                <p className="text-xs opacity-80">{a.associationName}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-4">
        {data ? (
          <>
            <div className="no-print flex justify-between items-center gap-2">
              <div className="inline-flex rounded-xl border border-border overflow-hidden">
                <button onClick={() => setView('card')} className={`px-4 py-2 text-sm flex items-center gap-2 ${view==='card' ? 'hero-gradient text-white' : 'bg-card hover:bg-muted'}`}>
                  <IdCard className="h-4 w-4" /> بطاقة الإنخراط
                </button>
                <button onClick={() => setView('receipt')} className={`px-4 py-2 text-sm flex items-center gap-2 ${view==='receipt' ? 'hero-gradient text-white' : 'bg-card hover:bg-muted'}`}>
                  <Receipt className="h-4 w-4" /> وصل التسديد
                </button>
              </div>
              <Button className="hero-gradient text-white" onClick={() => window.print()}>
                <Printer className="h-4 w-4 ml-2" /> طباعة
              </Button>
            </div>
            {view === 'card' ? (
            <div className="print-area flex items-center justify-center">
              <div className="w-[420px] h-[260px] rounded-2xl overflow-hidden shadow-elegant relative bg-white border-4 border-primary">
                <div className="hero-gradient h-20 px-4 flex items-center gap-3">
                  <img src={logo} alt="logo" className="h-14 w-14 rounded-full bg-white/20 p-1" />
                  <div className="text-white text-right flex-1">
                    <p className="text-[10px] opacity-90">ديوان المركب المتعدد الرياضات لولاية سطيف</p>
                    <p className="font-display font-bold text-sm">المسبح الأولمبي 08 ماي 1945</p>
                    <p className="text-[10px] opacity-90 font-bold">بطاقة الإنخراط</p>
                  </div>
                </div>
                <div className="p-4 flex gap-4">
                  <div className="h-24 w-20 bg-muted border-2 border-dashed border-border rounded flex items-center justify-center text-[10px] text-muted-foreground">
                    صورة
                  </div>
                  <div className="flex-1 space-y-1 text-right">
                    <p className="text-xs"><span className="text-muted-foreground">الإسم: </span><span className="font-bold">{data.firstName}</span></p>
                    <p className="text-xs"><span className="text-muted-foreground">اللقب: </span><span className="font-bold">{data.lastName}</span></p>
                    <p className="text-xs"><span className="text-muted-foreground">تاريخ الميلاد: </span><span>{data.birthDate}</span></p>
                    <p className="text-xs"><span className="text-muted-foreground">N°: </span><span className="font-mono text-secondary font-bold">{data.cardNumber}</span></p>
                    {isAssoc && <p className="text-xs"><span className="text-muted-foreground">الجمعية: </span><span className="font-bold">{(data as Association).associationName}</span></p>}
                    {!isAssoc && <p className="text-xs"><span className="text-muted-foreground">الفئة: </span><span className="font-bold">{CATEGORY_LABEL[(data as Member).category]}</span></p>}
                  </div>
                </div>
                <div className="absolute bottom-0 inset-x-0 bg-primary/5 px-3 py-1 text-[8px] text-center text-muted-foreground">
                  هذه البطاقة شخصية وعلى صاحبها إحترام النظام الداخلي للوحدة
                </div>
              </div>
            </div>
            ) : (
            <div className="print-area flex items-center justify-center">
              <div className="w-[600px] bg-white border-2 border-primary rounded-2xl shadow-elegant overflow-hidden">
                <div className="hero-gradient p-5 flex items-center gap-4">
                  <img src={logo} alt="logo" className="h-16 w-16 rounded-full bg-white/20 p-1" />
                  <div className="text-white flex-1 text-right">
                    <p className="text-xs opacity-90">الجمهورية الجزائرية الديمقراطية الشعبية — وزارة الرياضة</p>
                    <p className="font-display font-bold text-lg">المسبح الأولمبي 08 ماي 1945 — سطيف</p>
                    <p className="text-xs opacity-90">ديوان المركب المتعدد الرياضات</p>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between border-b-2 border-dashed border-border pb-3">
                    <h2 className="font-display text-2xl text-primary">وصل تسديد إشتراك</h2>
                    <div className="text-left">
                      <p className="text-xs text-muted-foreground">رقم الوصل</p>
                      <p className="font-mono font-bold text-secondary">{memberData?.receiptNumber || '—'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">الإسم واللقب: </span><span className="font-bold">{data.firstName} {data.lastName}</span></div>
                    <div><span className="text-muted-foreground">رقم البطاقة: </span><span className="font-mono font-bold">{data.cardNumber}</span></div>
                    <div><span className="text-muted-foreground">تاريخ الميلاد: </span><span>{data.birthDate || '—'}</span></div>
                    {!isAssoc && <div><span className="text-muted-foreground">الفئة: </span><span className="font-bold">{CATEGORY_LABEL[(data as Member).category]}</span></div>}
                    {isAssoc && <div><span className="text-muted-foreground">الجمعية: </span><span className="font-bold">{(data as Association).associationName}</span></div>}
                    {!isAssoc && <div><span className="text-muted-foreground">المدة: </span><span className="font-bold">{DURATION_LABEL[(data as Member).duration]}</span></div>}
                    <div><span className="text-muted-foreground">من: </span><span>{data.startDate}</span></div>
                    <div><span className="text-muted-foreground">إلى: </span><span>{data.endDate}</span></div>
                  </div>
                  <div className="bg-primary/5 rounded-xl p-4 flex items-center justify-between">
                    <span className="font-display text-primary">المبلغ المسدّد</span>
                    <span className="font-display text-3xl font-extrabold text-primary">{(data as any).amount?.toLocaleString()} دج</span>
                  </div>
                  <div className="grid grid-cols-2 gap-6 pt-6 text-xs text-center">
                    <div><div className="border-t-2 border-dashed border-border pt-2">توقيع المنخرط</div></div>
                    <div><div className="border-t-2 border-dashed border-border pt-2">ختم وتوقيع المسؤول</div></div>
                  </div>
                  <p className="text-[10px] text-center text-muted-foreground pt-2">
                    حُرّر بتاريخ {new Date().toLocaleDateString('fr-FR')} — هذا الوصل يُحتفظ به كإثبات للتسديد
                  </p>
                </div>
              </div>
            </div>
            )}
          </>
        ) : (
          <div className="glass-card p-12 text-center text-muted-foreground">
            اختر منخرطاً من القائمة لعرض بطاقته
          </div>
        )}
      </div>
    </div>
  );
}
