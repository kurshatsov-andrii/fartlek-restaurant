import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { ArrowLeft, KeyRound, LogIn, UserPlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth, roleToZone, AppRole } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { ThemeToggle } from '@/components/ThemeToggle';

const emailSchema = z.string().trim().email().max(255);
const pwdSchema = z.string().min(6).max(72);
const pinSchema = z.string().regex(/^[0-9]{4,8}$/);
const nameSchema = z.string().trim().min(1).max(100);

const Auth = () => {
  const { lang } = useI18n();
  const ua = lang === 'ua';
  const { user, roles, loading, signIn, signUp, pinLogin } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect');

  const [busy, setBusy] = useState(false);
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPwd, setSignInPwd] = useState('');
  const [suEmail, setSuEmail] = useState('');
  const [suPwd, setSuPwd] = useState('');
  const [suName, setSuName] = useState('');
  const [suRole, setSuRole] = useState<AppRole>('waiter');
  const [pinEmail, setPinEmail] = useState('');
  const [pin, setPin] = useState('');

  useEffect(() => {
    if (!loading && user) {
      navigate(redirect || roleToZone(roles), { replace: true });
    }
  }, [user, roles, loading, redirect, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const ve = emailSchema.safeParse(signInEmail);
    const vp = pwdSchema.safeParse(signInPwd);
    if (!ve.success || !vp.success) return toast.error(ua ? 'Перевірте email та пароль' : 'Check email and password');
    setBusy(true);
    const { error } = await signIn(ve.data, vp.data);
    setBusy(false);
    if (error) toast.error(error);
    else toast.success(ua ? 'Вхід успішний' : 'Signed in');
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const ve = emailSchema.safeParse(suEmail);
    const vp = pwdSchema.safeParse(suPwd);
    const vn = nameSchema.safeParse(suName);
    if (!ve.success || !vp.success || !vn.success) return toast.error(ua ? 'Заповніть усі поля коректно' : 'Fill all fields correctly');
    setBusy(true);
    const { error } = await signUp(ve.data, vp.data, vn.data, suRole);
    setBusy(false);
    if (error) toast.error(error);
    else toast.success(ua ? 'Акаунт створено. Увійдіть.' : 'Account created. Sign in.');
  };

  const handlePin = async (e: React.FormEvent) => {
    e.preventDefault();
    const ve = emailSchema.safeParse(pinEmail);
    const vpin = pinSchema.safeParse(pin);
    if (!ve.success || !vpin.success) return toast.error(ua ? 'Email + 4-8 цифр PIN' : 'Email + 4-8 digit PIN');
    setBusy(true);
    const { error } = await pinLogin(ve.data, vpin.data);
    setBusy(false);
    if (error) toast.error(error);
    else toast.success(ua ? 'PIN прийнято' : 'PIN accepted');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container flex items-center justify-between py-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/"><ArrowLeft className="h-4 w-4 mr-1" />{ua ? 'На головну' : 'Home'}</Link>
          </Button>
          <ThemeToggle variant="ghost" size="sm" />
        </div>
      </header>

      <main className="container max-w-md py-10 md:py-16">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 rounded-xl bg-gradient-warm items-center justify-center font-display font-bold text-xl text-accent-foreground shadow-glow mb-4">H</div>
          <h1 className="font-display text-3xl font-bold">{ua ? 'Вхід для персоналу' : 'Staff sign in'}</h1>
          <p className="text-sm text-muted-foreground mt-2">{ua ? 'Клієнти можуть переглядати меню без входу.' : 'Customers browse menu without login.'}</p>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="signin"><LogIn className="h-4 w-4 mr-1" />{ua ? 'Вхід' : 'Sign in'}</TabsTrigger>
            <TabsTrigger value="pin"><KeyRound className="h-4 w-4 mr-1" />PIN</TabsTrigger>
            <TabsTrigger value="signup"><UserPlus className="h-4 w-4 mr-1" />{ua ? 'Реєстрація' : 'Sign up'}</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="si-email">Email</Label>
                <Input id="si-email" type="email" autoComplete="email" value={signInEmail} onChange={(e) => setSignInEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="si-pwd">{ua ? 'Пароль' : 'Password'}</Label>
                <Input id="si-pwd" type="password" autoComplete="current-password" value={signInPwd} onChange={(e) => setSignInPwd(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : (ua ? 'Увійти' : 'Sign in')}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="pin">
            <form onSubmit={handlePin} className="space-y-4 mt-6">
              <p className="text-xs text-muted-foreground">{ua ? 'Швидкий вхід на робочому планшеті. PIN треба попередньо встановити в Адмінці.' : 'Quick sign in on shared tablet. Set your PIN in Admin first.'}</p>
              <div className="space-y-2">
                <Label htmlFor="pin-email">Email</Label>
                <Input id="pin-email" type="email" value={pinEmail} onChange={(e) => setPinEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pin">PIN (4-8 {ua ? 'цифр' : 'digits'})</Label>
                <Input id="pin" type="password" inputMode="numeric" maxLength={8} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} required />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : (ua ? 'Увійти за PIN' : 'PIN sign in')}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="su-name">{ua ? "Ім'я" : 'Full name'}</Label>
                <Input id="su-name" value={suName} onChange={(e) => setSuName(e.target.value)} maxLength={100} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="su-email">Email</Label>
                <Input id="su-email" type="email" autoComplete="email" value={suEmail} onChange={(e) => setSuEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="su-pwd">{ua ? 'Пароль (мін. 6)' : 'Password (min 6)'}</Label>
                <Input id="su-pwd" type="password" autoComplete="new-password" value={suPwd} onChange={(e) => setSuPwd(e.target.value)} minLength={6} required />
              </div>
              <div className="space-y-2">
                <Label>{ua ? 'Роль' : 'Role'}</Label>
                <Select value={suRole} onValueChange={(v) => setSuRole(v as AppRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="waiter">{ua ? 'Офіціант' : 'Waiter'}</SelectItem>
                    <SelectItem value="kitchen">{ua ? 'Кухня' : 'Kitchen'}</SelectItem>
                    <SelectItem value="cashier">{ua ? 'Касир' : 'Cashier'}</SelectItem>
                    <SelectItem value="manager">{ua ? 'Менеджер' : 'Manager'}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{ua ? 'Ролі owner / super_admin призначає власник.' : 'Owner / super_admin assigned by owner only.'}</p>
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : (ua ? 'Створити акаунт' : 'Create account')}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Auth;
