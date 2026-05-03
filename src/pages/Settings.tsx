import { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Download, Upload, Trash2, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  const exportData = async () => {
    const data = {
      members: await db.members.toArray(),
      associations: await db.associations.toArray(),
      sessions: await db.sessions.toArray(),
      tariffs: await db.tariffs.toArray(),
      payments: await db.payments.toArray(),
      exportedAt: new Date().toISOString(),
      version: 3,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `pool-backup-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
    toast.success('تم تصدير النسخة الإحتياطية الكاملة');
  };

  const importData = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await db.transaction('rw', [db.members, db.associations, db.sessions, db.tariffs, db.payments], async () => {
        if (data.members) for (const m of data.members) { delete m.id; await db.members.add(m); }
        if (data.associations) for (const a of data.associations) { delete a.id; await db.associations.add(a); }
        if (data.sessions) for (const s of data.sessions) { delete s.id; await db.sessions.add(s); }
        if (data.tariffs) for (const t of data.tariffs) {
          delete t.id;
          const exists = await db.tariffs.where('[scope+key]').equals([t.scope, t.key]).first();
          if (exists) await db.tariffs.update(exists.id!, { amount: t.amount, label: t.label });
          else await db.tariffs.add(t);
        }
        if (data.payments) for (const p of data.payments) { delete p.id; await db.payments.add(p); }
      });
      toast.success('تم الإستيراد بنجاح');
    } catch { toast.error('ملف غير صحيح'); }
  };

  const clearAll = async () => {
    if (confirm('هل أنت متأكد من حذف جميع البيانات؟ هذا لا يمكن التراجع عنه.')) {
      await db.members.clear(); await db.associations.clear();
      toast.success('تم حذف جميع المنخرطين والجمعيات');
    }
  };

  const clearAllTotal = async () => {
    if (confirm('حذف كل شيء بما في ذلك الحصص والتسعيرة؟')) {
      await db.members.clear(); await db.associations.clear();
      await db.sessions.clear(); await db.tariffs.clear();
      toast.success('تم تصفير قاعدة البيانات');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="glass-card p-6">
        <h3 className="font-display text-xl text-primary mb-2">معلومات الوحدة</h3>
        <p className="text-sm text-muted-foreground mb-4">ديوان المركب المتعدد الرياضات لولاية سطيف</p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-4 rounded-xl bg-muted/30"><p className="text-muted-foreground">إسم الوحدة</p><p className="font-bold mt-1">المسبح الأولمبي 08 ماي 1945</p></div>
          <div className="p-4 rounded-xl bg-muted/30"><p className="text-muted-foreground">الموسم</p><p className="font-bold mt-1">2025 / 2026</p></div>
          <div className="p-4 rounded-xl bg-muted/30"><p className="text-muted-foreground">الولاية</p><p className="font-bold mt-1">سطيف</p></div>
          <div className="p-4 rounded-xl bg-muted/30"><p className="text-muted-foreground">الوزارة الوصية</p><p className="font-bold mt-1">وزارة الرياضة</p></div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="font-display text-xl text-primary mb-4">المظهر</h3>
        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
          <div className="flex items-center gap-3">
            {dark ? <Moon className="h-5 w-5 text-secondary" /> : <Sun className="h-5 w-5 text-amber-500" />}
            <div>
              <p className="font-bold">الوضع الليلي</p>
              <p className="text-xs text-muted-foreground">تبديل بين الوضع الفاتح والداكن</p>
            </div>
          </div>
          <Switch checked={dark} onCheckedChange={setDark} />
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="font-display text-xl text-primary mb-4">إدارة البيانات</h3>
        <div className="flex flex-wrap gap-3">
          <Button onClick={exportData} className="hero-gradient text-white">
            <Download className="h-4 w-4 ml-2" /> تصدير نسخة إحتياطية كاملة
          </Button>
          <label>
            <input type="file" accept=".json" hidden onChange={e => e.target.files?.[0] && importData(e.target.files[0])} />
            <Button variant="outline" asChild><span className="cursor-pointer"><Upload className="h-4 w-4 ml-2" /> إستيراد</span></Button>
          </label>
          <Button variant="outline" onClick={clearAll}>
            <Trash2 className="h-4 w-4 ml-2 text-destructive" /> حذف المنخرطين فقط
          </Button>
          <Button variant="destructive" onClick={clearAllTotal}>
            <Trash2 className="h-4 w-4 ml-2" /> تصفير كل قاعدة البيانات
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          النسخة الكاملة تشمل: المنخرطين، الجمعيات، الحصص، والتسعيرة. البيانات محفوظة محلياً (IndexedDB).
        </p>
      </div>
    </div>
  );
}
