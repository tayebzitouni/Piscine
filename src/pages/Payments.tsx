import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileSpreadsheet, Search, DollarSign, Receipt, RefreshCw, Eye } from 'lucide-react';
import { toCSV, downloadFile } from '@/lib/status';

export default function Payments() {
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState<'all' | 'subscription' | 'renewal' | 'adjustment'>('all');
  const [subjectType, setSubjectType] = useState<'all' | 'member' | 'association'>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const all = useLiveQuery(() => db.payments.orderBy('createdAt').reverse().toArray(), []) ?? [];

  const filtered = all.filter(p => {
    if (kind !== 'all' && p.kind !== kind) return false;
    if (subjectType !== 'all' && p.subjectType !== subjectType) return false;
    if (search && !`${p.fullName} ${p.cardNumber} ${p.receiptNumber}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (from && p.createdAt < new Date(from).getTime()) return false;
    if (to && p.createdAt > new Date(to).getTime() + 86400000) return false;
    return true;
  });

  const total = filtered.reduce((s, p) => s + p.amount, 0);
  const totalSubs = filtered.filter(p => p.kind === 'subscription').reduce((s, p) => s + p.amount, 0);
  const totalRenewals = filtered.filter(p => p.kind === 'renewal').reduce((s, p) => s + p.amount, 0);

  const exportCSV = () => {
    const rows = filtered.map(p => ({
      'التاريخ': new Date(p.createdAt).toLocaleString('fr-FR'),
      'النوع': p.kind === 'renewal' ? 'تجديد' : p.kind === 'subscription' ? 'إشتراك' : 'تعديل',
      'صنف المنخرط': p.subjectType === 'member' ? 'حر' : 'جمعية',
      'الإسم': p.fullName,
      'رقم البطاقة': p.cardNumber,
      'رقم الوصل': p.receiptNumber,
      'من': p.periodStart, 'إلى': p.periodEnd,
      'المبلغ': p.amount,
    }));
    downloadFile(`payments-${Date.now()}.csv`, toCSV(rows));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl hero-gradient text-white flex items-center justify-center"><DollarSign className="h-6 w-6" /></div>
          <div><p className="text-xs text-muted-foreground">إجمالي المداخيل (المرشح)</p><p className="font-display text-2xl font-extrabold text-primary">{total.toLocaleString()} دج</p></div>
        </div>
        <div className="glass-card p-5 flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl water-gradient text-white flex items-center justify-center"><Receipt className="h-6 w-6" /></div>
          <div><p className="text-xs text-muted-foreground">إشتراكات جديدة</p><p className="font-display text-2xl font-extrabold text-primary">{totalSubs.toLocaleString()} دج</p></div>
        </div>
        <div className="glass-card p-5 flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl gold-gradient text-white flex items-center justify-center"><RefreshCw className="h-6 w-6" /></div>
          <div><p className="text-xs text-muted-foreground">تجديدات</p><p className="font-display text-2xl font-extrabold text-primary">{totalRenewals.toLocaleString()} دج</p></div>
        </div>
      </div>

      <div className="glass-card p-4 flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-60">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث: إسم، بطاقة، وصل..." className="pr-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={kind} onValueChange={(v: any) => setKind(v)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأنواع</SelectItem>
            <SelectItem value="subscription">إشتراك جديد</SelectItem>
            <SelectItem value="renewal">تجديد</SelectItem>
            <SelectItem value="adjustment">تعديل</SelectItem>
          </SelectContent>
        </Select>
        <Select value={subjectType} onValueChange={(v: any) => setSubjectType(v)}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الجميع</SelectItem>
            <SelectItem value="member">منخرط حر</SelectItem>
            <SelectItem value="association">جمعية</SelectItem>
          </SelectContent>
        </Select>
        <div>
          <p className="text-xs text-muted-foreground mb-1">من</p>
          <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">إلى</p>
          <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
        </div>
        <Button variant="outline" onClick={exportCSV}><FileSpreadsheet className="h-4 w-4 ml-2" /> Excel</Button>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-primary/5 text-sm">
            <tr>
              <th className="p-4 font-display text-primary">التاريخ</th>
              <th className="p-4 font-display text-primary">المنخرط</th>
              <th className="p-4 font-display text-primary">رقم البطاقة</th>
              <th className="p-4 font-display text-primary">النوع</th>
              <th className="p-4 font-display text-primary">الفترة</th>
              <th className="p-4 font-display text-primary">رقم الوصل</th>
              <th className="p-4 font-display text-primary">المبلغ</th>
              <th className="p-4 font-display text-primary"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="border-t border-border/40 hover:bg-muted/30">
                <td className="p-3 text-sm">{new Date(p.createdAt).toLocaleString('fr-FR')}</td>
                <td className="p-3 font-medium">{p.fullName}</td>
                <td className="p-3 font-mono text-secondary">{p.cardNumber}</td>
                <td className="p-3"><span className="px-2 py-1 rounded-full text-xs bg-secondary/10 text-secondary">{p.kind === 'renewal' ? 'تجديد' : p.kind === 'subscription' ? 'إشتراك' : 'تعديل'}</span></td>
                <td className="p-3 text-sm text-muted-foreground">{p.periodStart} → {p.periodEnd}</td>
                <td className="p-3 font-mono">{p.receiptNumber || '—'}</td>
                <td className="p-3 font-bold text-primary">{p.amount.toLocaleString()} دج</td>
                <td className="p-3">
                  <Link to={`/profile/${p.subjectType}/${p.subjectId}`} className="text-primary hover:underline inline-flex items-center gap-1 text-sm"><Eye className="h-4 w-4" /> الملف</Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="p-12 text-center text-muted-foreground">لا توجد مدفوعات</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
