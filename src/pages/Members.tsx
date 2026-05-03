import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getMemberPrice, CATEGORY_LABEL, DURATION_LABEL, logPayment, type Member, type Category, type Duration } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Search, Printer, Pencil, RefreshCw, FileSpreadsheet, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { subscriptionStatus, STATUS_CLASS, STATUS_LABEL, toCSV, downloadFile, type SubStatus } from '@/lib/status';

const empty: Omit<Member, 'id' | 'createdAt'> = {
  cardNumber: '', firstName: '', lastName: '', birthDate: '',
  category: 'men', startDate: new Date().toISOString().slice(0,10), endDate: '',
  duration: '1m', sessionFrom: '', sessionTo: '', receiptNumber: '', amount: 2000, photo: '', sessionId: undefined,
};

function addMonths(date: string, m: number) {
  const d = new Date(date); d.setMonth(d.getMonth() + m); return d.toISOString().slice(0,10);
}

export default function Members() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | SubStatus>('all');
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(empty);

  const list = useLiveQuery(
    () => db.members.orderBy('createdAt').reverse().toArray(),
    []
  ) ?? [];

  const sessions = useLiveQuery(() => db.sessions.toArray(), []) ?? [];

  const filtered = list.filter(m => {
    const matchSearch = [m.firstName, m.lastName, m.cardNumber].join(' ').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || subscriptionStatus(m.endDate) === statusFilter;
    return matchSearch && matchStatus;
  });

  const renew = async (m: Member) => {
    const months = m.duration === 'season' ? 9 : Number(m.duration.replace('m','')) || 1;
    const expired = subscriptionStatus(m.endDate) === 'expired';
    const newStart = expired ? new Date().toISOString().slice(0,10) : m.endDate;
    const newEnd = addMonths(newStart, months);
    const price = await getMemberPrice(m.category, m.duration);
    await db.members.update(m.id!, { startDate: newStart, endDate: newEnd, amount: price });
    await logPayment({
      subjectType: 'member', subjectId: m.id!, cardNumber: m.cardNumber,
      fullName: `${m.firstName} ${m.lastName}`, amount: price,
      receiptNumber: m.receiptNumber || '', kind: 'renewal',
      periodStart: newStart, periodEnd: newEnd,
    });
    toast.success(`تم تجديد الإشتراك حتى ${newEnd}`);
  };

  const exportCSV = () => {
    const rows = filtered.map(m => ({
      'رقم البطاقة': m.cardNumber,
      'الإسم': m.firstName,
      'اللقب': m.lastName,
      'تاريخ الميلاد': m.birthDate,
      'الفئة': CATEGORY_LABEL[m.category],
      'المدة': DURATION_LABEL[m.duration],
      'البداية': m.startDate,
      'النهاية': m.endDate,
      'المبلغ': m.amount,
      'رقم الوصل': m.receiptNumber,
      'الحالة': STATUS_LABEL[subscriptionStatus(m.endDate)],
    }));
    downloadFile(`members-${Date.now()}.csv`, toCSV(rows));
    toast.success('تم تصدير الملف');
  };

  const update = async (k: keyof typeof form, v: any) => {
    const next: any = { ...form, [k]: v };
    if (k === 'duration' || k === 'category' || k === 'startDate') {
      const cat = next.category as Category;
      const dur = next.duration as Duration;
      next.amount = await getMemberPrice(cat, dur);
      const months = dur === 'season' ? 9 : Number(dur.replace('m','')) || 1;
      next.endDate = addMonths(next.startDate, months);
    }
    setForm(next);
  };

  const openNew = () => { setEditId(null); setForm(empty); setOpen(true); };
  const openEdit = (m: Member) => { setEditId(m.id!); const { id, createdAt, ...rest } = m; setForm(rest as any); setOpen(true); };

  const save = async () => {
    if (!form.cardNumber || !form.firstName || !form.lastName) {
      toast.error('يرجى ملء الحقول الأساسية');
      return;
    }
    if (editId) {
      await db.members.update(editId, form);
      toast.success('تم تحديث المنخرط');
    } else {
      const newId = await db.members.add({ ...form, createdAt: Date.now() });
      await logPayment({
        subjectType: 'member', subjectId: newId, cardNumber: form.cardNumber,
        fullName: `${form.firstName} ${form.lastName}`, amount: form.amount,
        receiptNumber: form.receiptNumber || '', kind: 'subscription',
        periodStart: form.startDate, periodEnd: form.endDate,
      });
      toast.success('تمت إضافة المنخرط بنجاح');
    }
    setForm(empty); setEditId(null); setOpen(false);
  };

  const remove = async (id?: number) => {
    if (!id) return;
    if (confirm('هل تريد حذف هذا المنخرط؟')) {
      await db.members.delete(id);
      toast.success('تم الحذف');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-3 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="بحث بالإسم أو رقم البطاقة..." className="pr-10"
                   value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              <SelectItem value="active">ساري</SelectItem>
              <SelectItem value="expiring">يقترب الإنتهاء</SelectItem>
              <SelectItem value="expired">منتهي</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
        <Button variant="outline" onClick={exportCSV}>
          <FileSpreadsheet className="h-4 w-4 ml-2" /> تصدير Excel
        </Button>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditId(null); setForm(empty); } }}>
          <DialogTrigger asChild>
            <Button size="lg" className="hero-gradient text-white shadow-elegant" onClick={openNew}>
              <Plus className="h-4 w-4 ml-2" /> إضافة منخرط
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl text-primary">{editId ? 'تعديل منخرط' : 'منخرط جديد'}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>رقم البطاقة</Label>
                <Input value={form.cardNumber} onChange={e => update('cardNumber', e.target.value)} />
              </div>
              <div>
                <Label>الفئة</Label>
                <Select value={form.category} onValueChange={v => update('category', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABEL).map(([k,v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>الإسم</Label>
                <Input value={form.firstName} onChange={e => update('firstName', e.target.value)} />
              </div>
              <div>
                <Label>اللقب</Label>
                <Input value={form.lastName} onChange={e => update('lastName', e.target.value)} />
              </div>
              <div>
                <Label>تاريخ الإزدياد</Label>
                <Input type="date" value={form.birthDate} onChange={e => update('birthDate', e.target.value)} />
              </div>
              <div>
                <Label>مدة الإنخراط</Label>
                <Select value={form.duration} onValueChange={v => update('duration', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(DURATION_LABEL).map(([k,v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>تاريخ بداية الإنخراط</Label>
                <Input type="date" value={form.startDate} onChange={e => update('startDate', e.target.value)} />
              </div>
              <div>
                <Label>تاريخ نهاية الإنخراط</Label>
                <Input type="date" value={form.endDate} readOnly />
              </div>
              <div>
                <Label>توقيت الحصة - من</Label>
                <Input type="time" value={form.sessionFrom} onChange={e => update('sessionFrom', e.target.value)} />
              </div>
              <div>
                <Label>توقيت الحصة - إلى</Label>
                <Input type="time" value={form.sessionTo} onChange={e => update('sessionTo', e.target.value)} />
              </div>
              <div>
                <Label>رقم الوصل</Label>
                <Input value={form.receiptNumber} onChange={e => update('receiptNumber', e.target.value)} />
              </div>
              <div>
                <Label>مبلغ التسديد (دج)</Label>
                <Input type="number" value={form.amount} onChange={e => update('amount', Number(e.target.value))} />
              </div>
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
              <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-primary/5 text-sm">
            <tr>
              <th className="p-4 font-display text-primary">رقم البطاقة</th>
              <th className="p-4 font-display text-primary">الإسم واللقب</th>
              <th className="p-4 font-display text-primary">الفئة</th>
              <th className="p-4 font-display text-primary">المدة</th>
              <th className="p-4 font-display text-primary">المبلغ</th>
              <th className="p-4 font-display text-primary">من - إلى</th>
              <th className="p-4 font-display text-primary">الحالة</th>
              <th className="p-4 font-display text-primary">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => {
              const st = subscriptionStatus(m.endDate);
              return (
              <tr key={m.id} className="border-t border-border/40 hover:bg-muted/30 transition">
                <td className="p-4 font-mono text-secondary">{m.cardNumber}</td>
                <td className="p-4 font-medium">{m.firstName} {m.lastName}</td>
                <td className="p-4">
                  <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs">
                    {CATEGORY_LABEL[m.category]}
                  </span>
                </td>
                <td className="p-4">{DURATION_LABEL[m.duration]}</td>
                <td className="p-4 font-bold text-primary">{m.amount} دج</td>
                <td className="p-4 text-sm text-muted-foreground">{m.startDate} → {m.endDate}</td>
                <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs ${STATUS_CLASS[st]}`}>{STATUS_LABEL[st]}</span></td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <Button size="icon" variant="outline" title="الملف الشخصي" onClick={() => navigate(`/profile/member/${m.id}`)}>
                      <Eye className="h-4 w-4 text-primary" />
                    </Button>
                    <Button size="icon" variant="outline" title="تجديد" onClick={() => renew(m)}>
                      <RefreshCw className="h-4 w-4 text-secondary" />
                    </Button>
                    <Button size="icon" variant="outline" onClick={() => openEdit(m)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline" onClick={() => navigate(`/cards?id=${m.id}&type=member`)}>
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline" onClick={() => remove(m.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="p-12 text-center text-muted-foreground">لا توجد منخرطين</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
