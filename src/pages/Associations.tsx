import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getAssocPrice, ASSOCIATION_TARIFFS, logPayment, type Association } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Printer, Pencil, RefreshCw, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const TYPE_LABEL = { club: 'نادي', company: 'شركة / نادي محترف', security: 'الأسلاك الأمنية', disabled: 'المعاقين' };
const LEVEL_LABEL = { level0: 'مستوى 0', school: 'مستوى مدارس', competitive: 'مستوى تنافسي' };

const empty: Omit<Association, 'id' | 'createdAt'> = {
  cardNumber: '', associationName: '', type: 'club', level: 'level0',
  firstName: '', lastName: '', birthDate: '',
  startDate: new Date().toISOString().slice(0,10), endDate: '',
  amount: ASSOCIATION_TARIFFS.club, photo: '', sessionId: undefined,
};

export default function Associations() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(empty);
  const list = useLiveQuery(() => db.associations.orderBy('createdAt').reverse().toArray(), []) ?? [];
  const sessions = useLiveQuery(() => db.sessions.toArray(), []) ?? [];

  const update = async (k: keyof typeof form, v: any) => {
    const next: any = { ...form, [k]: v };
    if (k === 'type') next.amount = await getAssocPrice(v);
    setForm(next);
  };

  const openNew = () => { setEditId(null); setForm(empty); setOpen(true); };
  const openEdit = (a: Association) => { setEditId(a.id!); const { id, createdAt, ...rest } = a; setForm(rest as any); setOpen(true); };

  const save = async () => {
    if (!form.cardNumber || !form.associationName) { toast.error('يرجى ملء الحقول'); return; }
    if (editId) { await db.associations.update(editId, form); toast.success('تم التحديث'); }
    else {
      const newId = await db.associations.add({ ...form, createdAt: Date.now() });
      await logPayment({
        subjectType: 'association', subjectId: newId, cardNumber: form.cardNumber,
        fullName: `${form.firstName} ${form.lastName} — ${form.associationName}`,
        amount: form.amount, receiptNumber: '', kind: 'subscription',
        periodStart: form.startDate, periodEnd: form.endDate,
      });
      toast.success('تمت الإضافة بنجاح');
    }
    setForm(empty); setEditId(null); setOpen(false);
  };

  const renew = async (a: Association) => {
    const today = new Date(); today.setHours(0,0,0,0);
    const expired = a.endDate && new Date(a.endDate) < today;
    const start = new Date(expired ? today : a.endDate);
    const end = new Date(start); end.setFullYear(end.getFullYear() + 1);
    const newStart = start.toISOString().slice(0,10);
    const newEnd = end.toISOString().slice(0,10);
    const price = await getAssocPrice(a.type);
    await db.associations.update(a.id!, { startDate: newStart, endDate: newEnd, amount: price });
    await logPayment({
      subjectType: 'association', subjectId: a.id!, cardNumber: a.cardNumber,
      fullName: `${a.firstName} ${a.lastName} — ${a.associationName}`,
      amount: price, receiptNumber: '', kind: 'renewal',
      periodStart: newStart, periodEnd: newEnd,
    });
    toast.success(`تم التجديد حتى ${newEnd}`);
  };

  const remove = async (id?: number) => {
    if (id && confirm('حذف؟')) { await db.associations.delete(id); toast.success('تم الحذف'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditId(null); setForm(empty); } }}>
          <DialogTrigger asChild>
            <Button size="lg" className="hero-gradient text-white shadow-elegant" onClick={openNew}>
              <Plus className="h-4 w-4 ml-2" /> إضافة جمعية / منخرط جمعية
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl text-primary">{editId ? 'تعديل منخرط جمعية' : 'منخرط جمعية'}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>رقم البطاقة</Label><Input value={form.cardNumber} onChange={e=>update('cardNumber',e.target.value)} /></div>
              <div><Label>إسم الجمعية</Label><Input value={form.associationName} onChange={e=>update('associationName',e.target.value)} /></div>
              <div>
                <Label>النوع</Label>
                <Select value={form.type} onValueChange={v=>update('type',v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(TYPE_LABEL).map(([k,v])=>(<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>المستوى</Label>
                <Select value={form.level} onValueChange={v=>update('level',v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(LEVEL_LABEL).map(([k,v])=>(<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div><Label>الإسم</Label><Input value={form.firstName} onChange={e=>update('firstName',e.target.value)} /></div>
              <div><Label>اللقب</Label><Input value={form.lastName} onChange={e=>update('lastName',e.target.value)} /></div>
              <div><Label>تاريخ الإزدياد</Label><Input type="date" value={form.birthDate} onChange={e=>update('birthDate',e.target.value)} /></div>
              <div><Label>مبلغ الإشتراك (دج)</Label><Input type="number" value={form.amount} onChange={e=>update('amount',Number(e.target.value))} /></div>
              <div><Label>تاريخ البداية</Label><Input type="date" value={form.startDate} onChange={e=>update('startDate',e.target.value)} /></div>
              <div><Label>تاريخ النهاية</Label><Input type="date" value={form.endDate} onChange={e=>update('endDate',e.target.value)} /></div>
              <div className="col-span-2">
                <Label>الحصة المرتبطة (اختياري)</Label>
                <Select value={form.sessionId ? String(form.sessionId) : 'none'} onValueChange={v => update('sessionId', v === 'none' ? undefined : Number(v))}>
                  <SelectTrigger><SelectValue placeholder="لا حصة" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— بدون حصة —</SelectItem>
                    {sessions.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.day} • {s.slot} • {s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={save} className="hero-gradient text-white flex-1">حفظ</Button>
              <Button variant="outline" onClick={()=>setOpen(false)}>إلغاء</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-primary/5">
            <tr>
              <th className="p-4 font-display text-primary">رقم البطاقة</th>
              <th className="p-4 font-display text-primary">الجمعية</th>
              <th className="p-4 font-display text-primary">النوع</th>
              <th className="p-4 font-display text-primary">المنخرط</th>
              <th className="p-4 font-display text-primary">المبلغ</th>
              <th className="p-4 font-display text-primary">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {list.map(a => (
              <tr key={a.id} className="border-t border-border/40 hover:bg-muted/30">
                <td className="p-4 font-mono text-secondary">{a.cardNumber}</td>
                <td className="p-4 font-bold">{a.associationName}</td>
                <td className="p-4"><span className="px-3 py-1 rounded-full bg-accent/20 text-accent-foreground text-xs">{TYPE_LABEL[a.type]}</span></td>
                <td className="p-4">{a.firstName} {a.lastName}</td>
                <td className="p-4 font-bold text-primary">{a.amount.toLocaleString()} دج</td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <Button size="icon" variant="outline" title="الملف" onClick={()=>navigate(`/profile/association/${a.id}`)}><Eye className="h-4 w-4 text-primary" /></Button>
                    <Button size="icon" variant="outline" title="تجديد" onClick={()=>renew(a)}><RefreshCw className="h-4 w-4 text-secondary" /></Button>
                    <Button size="icon" variant="outline" onClick={()=>openEdit(a)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="outline" onClick={()=>navigate(`/cards?id=${a.id}&type=association`)}><Printer className="h-4 w-4" /></Button>
                    <Button size="icon" variant="outline" onClick={()=>remove(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={6} className="p-12 text-center text-muted-foreground">لا توجد جمعيات</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
