import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, DAYS, SLOTS, type Session, type Member, type Association } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Users, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';

const COLORS = [
  { v: 'bg-secondary/20 text-secondary', label: 'أزرق' },
  { v: 'bg-pink-100 text-pink-700', label: 'وردي' },
  { v: 'bg-amber-100 text-amber-700', label: 'كهرماني' },
  { v: 'bg-primary/15 text-primary', label: 'كحلي' },
  { v: 'bg-blue-100 text-blue-700', label: 'سماوي' },
  { v: 'bg-purple-100 text-purple-700', label: 'بنفسجي' },
  { v: 'bg-accent/30 text-accent-foreground', label: 'ذهبي' },
  { v: 'bg-green-100 text-green-700', label: 'أخضر' },
];

export default function Schedule() {
  const sessions = useLiveQuery(() => db.sessions.toArray(), []) ?? [];
  const members = useLiveQuery(() => db.members.toArray(), []) ?? [];
  const associations = useLiveQuery(() => db.associations.toArray(), []) ?? [];

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<Partial<Session>>({});
  const [viewSession, setViewSession] = useState<Session | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [pickType, setPickType] = useState<'member' | 'association'>('member');
  const [pickId, setPickId] = useState<string>('');

  const grid: Record<string, Record<string, Session[]>> = {};
  DAYS.forEach(d => { grid[d] = {}; SLOTS.forEach(s => grid[d][s] = []); });
  sessions.forEach(s => { if (grid[s.day]?.[s.slot]) grid[s.day][s.slot].push(s); });

  const sessionMembers = (sid?: number) => members.filter(m => m.sessionId === sid);
  const sessionAssocs = (sid?: number) => associations.filter(a => a.sessionId === sid);
  const totalIn = (sid?: number) => sessionMembers(sid).length + sessionAssocs(sid).length;

  const openNew = (day: string, slot: string) => {
    setForm({ day, slot, label: '', color: COLORS[0].v });
    setEditOpen(true);
  };
  const openEdit = (s: Session) => { setForm(s); setEditOpen(true); };

  const saveSession = async () => {
    if (!form.label || !form.day || !form.slot) { toast.error('يرجى ملء البيانات'); return; }
    if (form.id) {
      await db.sessions.update(form.id, { label: form.label, color: form.color, day: form.day, slot: form.slot, capacity: form.capacity });
      toast.success('تم التعديل');
    } else {
      await db.sessions.add({ day: form.day!, slot: form.slot!, label: form.label!, color: form.color, capacity: form.capacity, createdAt: Date.now() });
      toast.success('تمت الإضافة');
    }
    setEditOpen(false);
  };

  const deleteSession = async (s: Session) => {
    if (!s.id) return;
    if (!confirm('حذف هذه الحصة؟ سيتم فك ربط المنخرطين.')) return;
    // Unlink members & associations
    const ms = members.filter(m => m.sessionId === s.id);
    const as = associations.filter(a => a.sessionId === s.id);
    await db.transaction('rw', db.sessions, db.members, db.associations, async () => {
      for (const m of ms) await db.members.update(m.id!, { sessionId: undefined });
      for (const a of as) await db.associations.update(a.id!, { sessionId: undefined });
      await db.sessions.delete(s.id!);
    });
    toast.success('تم الحذف');
  };

  const assign = async () => {
    if (!viewSession?.id || !pickId) return;
    const id = Number(pickId);
    if (pickType === 'member') await db.members.update(id, { sessionId: viewSession.id });
    else await db.associations.update(id, { sessionId: viewSession.id });
    toast.success('تم الإضافة للحصة');
    setPickId(''); setAssignOpen(false);
  };

  const unassign = async (type: 'member' | 'association', id: number) => {
    if (type === 'member') await db.members.update(id, { sessionId: undefined });
    else await db.associations.update(id, { sessionId: undefined });
    toast.success('تم فك الربط');
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h3 className="font-display text-2xl text-primary">برنامج وحدة المسبح</h3>
            <p className="text-sm text-muted-foreground">انقر على خانة فارغة لإضافة حصة، أو على حصة لعرض المنخرطين وإدارتها.</p>
          </div>
          <span className="px-4 py-2 rounded-xl gold-gradient text-primary font-bold">☀ موسم 2025/2026</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-center text-sm border-separate border-spacing-1">
            <thead>
              <tr>
                <th className="p-3 bg-primary text-primary-foreground rounded-lg font-display">اليوم</th>
                {SLOTS.map(s => (
                  <th key={s} className="p-3 bg-primary/10 text-primary rounded-lg font-mono text-xs whitespace-nowrap">{s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map(day => (
                <tr key={day}>
                  <td className="p-3 bg-secondary text-secondary-foreground rounded-lg font-display font-bold">{day}</td>
                  {SLOTS.map(slot => {
                    const cells = grid[day][slot];
                    if (cells.length === 0) {
                      return (
                        <td key={slot} className="p-1 rounded-lg bg-muted/20 hover:bg-muted/50 cursor-pointer transition group" onClick={() => openNew(day, slot)}>
                          <Plus className="h-4 w-4 mx-auto text-muted-foreground group-hover:text-primary" />
                        </td>
                      );
                    }
                    return (
                      <td key={slot} className="p-1">
                        <div className="space-y-1">
                          {cells.map(c => {
                            const cnt = totalIn(c.id);
                            const cap = c.capacity ?? 0;
                            const pct = cap > 0 ? Math.min(100, (cnt/cap)*100) : 0;
                            const full = cap > 0 && cnt >= cap;
                            return (
                            <button key={c.id}
                              className={`w-full p-2 rounded-lg text-xs font-medium ${c.color} hover:ring-2 hover:ring-primary transition relative`}
                              onClick={() => setViewSession(c)}>
                              {c.label}
                              <span className={`absolute -top-1 -right-1 ${full ? 'bg-destructive' : 'bg-primary'} text-primary-foreground rounded-full h-5 min-w-5 px-1 text-[10px] flex items-center justify-center`}>
                                {cnt}{cap ? `/${cap}` : ''}
                              </span>
                              {cap > 0 && (
                                <div className="mt-1 h-1 bg-black/10 rounded-full overflow-hidden">
                                  <div className={`h-full ${full ? 'bg-destructive' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
                                </div>
                              )}
                            </button>
                            );
                          })}
                          <button onClick={() => openNew(day, slot)} className="w-full p-1 rounded text-muted-foreground hover:text-primary hover:bg-muted/30">
                            <Plus className="h-3 w-3 mx-auto" />
                          </button>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit/create session dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader><DialogTitle className="font-display text-primary">{form.id ? 'تعديل الحصة' : 'حصة جديدة'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>اليوم</Label>
                <Select value={form.day} onValueChange={v => setForm({ ...form, day: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>التوقيت</Label>
                <Select value={form.slot} onValueChange={v => setForm({ ...form, slot: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SLOTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>تسمية الحصة</Label>
              <Input value={form.label ?? ''} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="رجال، نساء، نوادي..." />
            </div>
            <div>
              <Label>اللون</Label>
              <div className="grid grid-cols-4 gap-2 mt-1">
                {COLORS.map(c => (
                  <button key={c.v} onClick={() => setForm({ ...form, color: c.v })}
                    className={`p-2 rounded-lg text-xs ${c.v} ${form.color === c.v ? 'ring-2 ring-primary' : ''}`}>{c.label}</button>
                ))}
              </div>
            </div>
            <div>
              <Label>السعة القصوى (اختياري)</Label>
              <Input type="number" value={form.capacity ?? ''} onChange={e => setForm({ ...form, capacity: e.target.value ? Number(e.target.value) : undefined })} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={saveSession} className="hero-gradient text-white flex-1">حفظ</Button>
              {form.id && <Button variant="destructive" onClick={() => { deleteSession(form as Session); setEditOpen(false); }}><Trash2 className="h-4 w-4" /></Button>}
              <Button variant="outline" onClick={() => setEditOpen(false)}>إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View session subscribers */}
      <Dialog open={!!viewSession} onOpenChange={o => !o && setViewSession(null)}>
        <DialogContent dir="rtl" className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-primary flex items-center gap-2">
              <Users className="h-5 w-5" /> {viewSession?.label}
              <span className="text-sm font-normal text-muted-foreground">— {viewSession?.day} {viewSession?.slot}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 mb-4">
            <Button onClick={() => setAssignOpen(true)} className="hero-gradient text-white"><UserPlus className="h-4 w-4 ml-2" /> ربط منخرط</Button>
            <Button variant="outline" onClick={() => { openEdit(viewSession!); setViewSession(null); }}><Pencil className="h-4 w-4 ml-2" /> تعديل الحصة</Button>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-display text-primary mb-2">المنخرطين الأحرار ({sessionMembers(viewSession?.id).length})</h4>
              <div className="space-y-1">
                {sessionMembers(viewSession?.id).map(m => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="font-medium">{m.firstName} {m.lastName}</p>
                      <p className="text-xs text-muted-foreground font-mono">{m.cardNumber}</p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => unassign('member', m.id!)}><X className="h-4 w-4 text-destructive" /></Button>
                  </div>
                ))}
                {sessionMembers(viewSession?.id).length === 0 && <p className="text-sm text-muted-foreground p-3">لا يوجد</p>}
              </div>
            </div>
            <div>
              <h4 className="font-display text-primary mb-2">منخرطين عبر الجمعيات ({sessionAssocs(viewSession?.id).length})</h4>
              <div className="space-y-1">
                {sessionAssocs(viewSession?.id).map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="font-medium">{a.firstName} {a.lastName} <span className="text-xs text-muted-foreground">— {a.associationName}</span></p>
                      <p className="text-xs text-muted-foreground font-mono">{a.cardNumber}</p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => unassign('association', a.id!)}><X className="h-4 w-4 text-destructive" /></Button>
                  </div>
                ))}
                {sessionAssocs(viewSession?.id).length === 0 && <p className="text-sm text-muted-foreground p-3">لا يوجد</p>}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign member to session */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader><DialogTitle className="font-display text-primary">ربط منخرط بالحصة</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>النوع</Label>
              <Select value={pickType} onValueChange={(v: any) => { setPickType(v); setPickId(''); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">منخرط حر</SelectItem>
                  <SelectItem value="association">منخرط جمعية</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>المنخرط</Label>
              <Select value={pickId} onValueChange={setPickId}>
                <SelectTrigger><SelectValue placeholder="إختر..." /></SelectTrigger>
                <SelectContent>
                  {pickType === 'member'
                    ? members.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.firstName} {m.lastName} — {m.cardNumber}</SelectItem>)
                    : associations.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.firstName} {a.lastName} — {a.associationName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={assign} className="hero-gradient text-white flex-1">ربط</Button>
              <Button variant="outline" onClick={() => setAssignOpen(false)}>إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
