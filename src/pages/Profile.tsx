import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getMemberPrice, getAssocPrice, logPayment, CATEGORY_LABEL, DURATION_LABEL, type Member, type Association, type Duration } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, RefreshCw, Printer, Receipt, Calendar, DollarSign, History } from 'lucide-react';
import { toast } from 'sonner';
import { subscriptionStatus, STATUS_CLASS, STATUS_LABEL } from '@/lib/status';

function addMonths(date: string, m: number) {
  const d = new Date(date); d.setMonth(d.getMonth() + m); return d.toISOString().slice(0,10);
}

export default function Profile() {
  const { type, id } = useParams<{ type: 'member' | 'association'; id: string }>();
  const navigate = useNavigate();
  const sid = Number(id);
  const isMember = type === 'member';

  const member = useLiveQuery(() => isMember ? db.members.get(sid) : null, [sid, isMember]);
  const assoc = useLiveQuery(() => !isMember ? db.associations.get(sid) : null, [sid, isMember]);
  const subject = (isMember ? member : assoc) as (Member | Association) | undefined | null;

  const payments = useLiveQuery(
    () => db.payments.where({ subjectType: type!, subjectId: sid }).reverse().sortBy('createdAt'),
    [type, sid]
  ) ?? [];

  const [renewOpen, setRenewOpen] = useState(false);
  const [duration, setDuration] = useState<Duration>('1m');
  const [amount, setAmount] = useState(0);
  const [receipt, setReceipt] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0,10));

  const openRenew = async () => {
    if (!subject) return;
    const today = new Date().toISOString().slice(0,10);
    if (isMember) {
      const m = subject as Member;
      const expired = subscriptionStatus(m.endDate) === 'expired';
      const start = expired ? today : m.endDate;
      setDuration(m.duration);
      setStartDate(start);
      setAmount(await getMemberPrice(m.category, m.duration));
      setReceipt('');
    } else {
      const a = subject as Association;
      const expired = a.endDate && new Date(a.endDate) < new Date();
      setStartDate(expired ? today : (a.endDate || today));
      setAmount(await getAssocPrice(a.type));
      setReceipt('');
    }
    setRenewOpen(true);
  };

  const onDurationChange = async (d: Duration) => {
    setDuration(d);
    if (isMember && subject) setAmount(await getMemberPrice((subject as Member).category, d));
  };

  const confirmRenew = async () => {
    if (!subject) return;
    let newEnd: string;
    if (isMember) {
      const months = duration === 'season' ? 9 : Number(duration.replace('m','')) || 1;
      newEnd = addMonths(startDate, months);
      await db.members.update(sid, { startDate, endDate: newEnd, duration, amount, receiptNumber: receipt || (subject as Member).receiptNumber });
    } else {
      const d = new Date(startDate); d.setFullYear(d.getFullYear() + 1);
      newEnd = d.toISOString().slice(0,10);
      await db.associations.update(sid, { startDate, endDate: newEnd, amount });
    }
    await logPayment({
      subjectType: type!, subjectId: sid,
      cardNumber: subject.cardNumber,
      fullName: isMember ? `${subject.firstName} ${subject.lastName}` : `${subject.firstName} ${subject.lastName} — ${(subject as Association).associationName}`,
      amount, receiptNumber: receipt, kind: 'renewal',
      periodStart: startDate, periodEnd: newEnd,
    });
    toast.success(`تم التجديد حتى ${newEnd}`);
    setRenewOpen(false);
  };

  const deletePayment = async (pid: number) => {
    if (!confirm('حذف هذا الدفع من السجل؟')) return;
    await db.payments.delete(pid);
    toast.success('تم الحذف');
  };

  if (!subject) {
    return <div className="glass-card p-12 text-center text-muted-foreground">جاري التحميل...</div>;
  }

  const status = subscriptionStatus(subject.endDate);
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)}><ArrowRight className="h-4 w-4 ml-2" /> رجوع</Button>

      {/* Identity card */}
      <div className="glass-card p-6 hero-gradient text-white relative overflow-hidden">
        <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs opacity-80 mb-1">{isMember ? 'منخرط حر' : 'منخرط جمعية'}</p>
            <h1 className="font-display text-3xl font-extrabold">{subject.firstName} {subject.lastName}</h1>
            <p className="text-sm opacity-90 mt-1 font-mono">بطاقة n° {subject.cardNumber}</p>
            {!isMember && <p className="text-sm opacity-90">{(subject as Association).associationName}</p>}
            {isMember && <p className="text-sm opacity-90">{CATEGORY_LABEL[(subject as Member).category]} • {DURATION_LABEL[(subject as Member).duration]}</p>}
          </div>
          <div className="text-left">
            <span className={`px-4 py-2 rounded-full font-bold ${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>
            <p className="text-xs mt-2 opacity-90">من {subject.startDate} إلى {subject.endDate || '—'}</p>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl water-gradient text-white flex items-center justify-center"><DollarSign className="h-6 w-6" /></div>
          <div><p className="text-xs text-muted-foreground">إجمالي المدفوع</p><p className="font-display text-2xl font-extrabold text-primary">{totalPaid.toLocaleString()} دج</p></div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl gold-gradient text-white flex items-center justify-center"><History className="h-6 w-6" /></div>
          <div><p className="text-xs text-muted-foreground">عدد عمليات الدفع</p><p className="font-display text-2xl font-extrabold text-primary">{payments.length}</p></div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl hero-gradient text-white flex items-center justify-center"><Calendar className="h-6 w-6" /></div>
          <div><p className="text-xs text-muted-foreground">آخر تجديد</p><p className="font-display text-lg font-bold text-primary">{payments[0] ? new Date(payments[0].createdAt).toLocaleDateString('fr-FR') : '—'}</p></div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <Button size="lg" className="hero-gradient text-white shadow-elegant" onClick={openRenew}>
          <RefreshCw className="h-4 w-4 ml-2" /> تجديد الإشتراك
        </Button>
        <Button size="lg" variant="outline" onClick={() => navigate(`/cards?id=${sid}&type=${type}`)}>
          <Printer className="h-4 w-4 ml-2" /> طباعة البطاقة / الوصل
        </Button>
      </div>

      {/* Payments history */}
      <div className="glass-card p-6">
        <h3 className="font-display text-xl text-primary mb-4 flex items-center gap-2">
          <Receipt className="h-5 w-5" /> سجل المدفوعات
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-primary/5 text-sm">
              <tr>
                <th className="p-3 font-display text-primary">التاريخ</th>
                <th className="p-3 font-display text-primary">النوع</th>
                <th className="p-3 font-display text-primary">الفترة</th>
                <th className="p-3 font-display text-primary">رقم الوصل</th>
                <th className="p-3 font-display text-primary">المبلغ</th>
                <th className="p-3 font-display text-primary">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id} className="border-t border-border/40 hover:bg-muted/30">
                  <td className="p-3 text-sm">{new Date(p.createdAt).toLocaleString('fr-FR')}</td>
                  <td className="p-3"><span className="px-2 py-1 rounded-full text-xs bg-secondary/10 text-secondary">{p.kind === 'renewal' ? 'تجديد' : p.kind === 'subscription' ? 'إشتراك' : 'تعديل'}</span></td>
                  <td className="p-3 text-sm text-muted-foreground">{p.periodStart} → {p.periodEnd}</td>
                  <td className="p-3 font-mono text-secondary">{p.receiptNumber || '—'}</td>
                  <td className="p-3 font-bold text-primary">{p.amount.toLocaleString()} دج</td>
                  <td className="p-3">
                    <Link to={`/cards?id=${sid}&type=${type}&pay=${p.id}`} className="text-primary hover:underline text-sm">طباعة الوصل</Link>
                    <button onClick={() => deletePayment(p.id!)} className="text-destructive text-sm mr-3 hover:underline">حذف</button>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr><td colSpan={6} className="p-12 text-center text-muted-foreground">لا توجد مدفوعات بعد</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Renew dialog */}
      <Dialog open={renewOpen} onOpenChange={setRenewOpen}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader><DialogTitle className="font-display text-primary">تجديد الإشتراك</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>تاريخ بداية الفترة الجديدة</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            {isMember && (
              <div>
                <Label>المدة</Label>
                <Select value={duration} onValueChange={(v: any) => onDurationChange(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(DURATION_LABEL).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>المبلغ المسدّد (دج)</Label>
              <Input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} />
            </div>
            <div>
              <Label>رقم الوصل</Label>
              <Input value={receipt} onChange={e => setReceipt(e.target.value)} placeholder="إختياري" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={confirmRenew} className="hero-gradient text-white flex-1">تأكيد التجديد</Button>
              <Button variant="outline" onClick={() => setRenewOpen(false)}>إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
