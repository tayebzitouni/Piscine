import { FormEvent, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Lock, User, Waves } from 'lucide-react';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';

export default function Login() {
  const { isAuthenticated, login } = useAuth();
  const location = useLocation();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');

  if (isAuthenticated) {
    return <Navigate to={(location.state as { from?: string } | null)?.from ?? '/'} replace />;
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (login(username, password)) return;
    toast.error('اسم المستخدم أو كلمة المرور غير صحيحة');
  };

  return (
    <main dir="rtl" className="grid min-h-screen place-items-center bg-[linear-gradient(135deg,hsl(191_70%_94%),hsl(210_40%_98%)_48%,hsl(43_80%_94%))] px-4 py-8">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-white/70 bg-white/80 p-6 text-right shadow-elegant backdrop-blur">
        <div className="mb-7 flex items-center gap-4">
          <img src={logo} alt="شعار المسبح" className="h-16 w-16 rounded-2xl bg-primary/10 p-2" />
          <div>
            <div className="mb-1 inline-flex items-center gap-2 text-xs font-bold text-secondary">
              <Waves className="h-4 w-4" />
              المسبح الأولمبي
            </div>
            <h1 className="font-display text-2xl text-primary">تسجيل الدخول</h1>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">اسم المستخدم</Label>
            <div className="relative">
              <User className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="pr-10 text-right"
                autoComplete="username"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="pr-10 text-right"
                autoComplete="current-password"
                autoFocus
              />
            </div>
          </div>

          <Button type="submit" className="hero-gradient w-full text-white">
            دخول
          </Button>
        </div>

        <p className="mt-5 rounded-xl bg-primary/5 px-3 py-2 text-center text-xs text-muted-foreground">
          الحساب الافتراضي: admin / admin123
        </p>
      </form>
    </main>
  );
}
